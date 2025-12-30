import { injectable, inject } from 'tsyringe';
import { DatabaseConnection } from '../database/connection.js';
import mysql from 'mysql2/promise';
import { RelationshipService, TableRelationship } from './relationshipService.js';

export interface ExecutionResult {
  tablesCreated: string[];
  recordsProcessed: number;
  recordsMoved: number;
  errors: string[];
}

@injectable()
export class ExecutionService {
  constructor(@inject(DatabaseConnection) private db: DatabaseConnection) {}

  async createTables(tables: any[]): Promise<string[]> {
    const created: string[] = [];

    for (const table of tables) {
      if (!table.isNew) {
        continue;
      }

      const columns = table.columns.map((col: any) => {
        let sql = `${mysql.escapeId(col.name)} ${col.type}`;
        if (col.isPrimaryKey) {
          sql += ' PRIMARY KEY AUTO_INCREMENT';
        }
        if (!col.nullable && !col.isPrimaryKey) {
          sql += ' NOT NULL';
        }
        return sql;
      });

      const createSql = `
        CREATE TABLE IF NOT EXISTS ${mysql.escapeId(table.name)} (
          ${columns.join(',\n  ')}
        )
      `;

      await this.db.rawQuery(createSql);
      created.push(table.name);
    }

    return created;
  }

  async flattenRecords(
    baseTableName: string,
    mappings: any[],
    tables: any[],
    whereConditions: any[] = [],
    relationships: TableRelationship[] = [],
    batchSize: number = 100
  ): Promise<{ processed: number; moved: number }> {
    const toProcessTable = `${baseTableName}_toprocess`;
    const destTable = baseTableName;

    // Auto-detect relationships if not provided
    if (relationships.length === 0) {
      relationships = RelationshipService.autoDetectRelationships(tables);
      console.log('Auto-detected relationships:', relationships);
    }

    // Get insert order based on relationships
    const tableNames = tables.map(t => t.name);
    const insertOrder = RelationshipService.getInsertOrder(tableNames, relationships);
    console.log('Insert order:', insertOrder);

    // Build WHERE clause
    let whereClause = '';
    if (whereConditions.length > 0) {
      const clauses: string[] = [];
      for (const condition of whereConditions) {
        const jsonPath = `$.${condition.field}`;
        
        switch (condition.operator) {
          case '=':
            clauses.push(`JSON_UNQUOTE(JSON_EXTRACT(content, ${mysql.escape(jsonPath)})) = ${mysql.escape(condition.value)}`);
            break;
          case 'IS NOT NULL':
            clauses.push(`JSON_EXTRACT(content, ${mysql.escape(jsonPath)}) IS NOT NULL`);
            break;
        }
      }
      whereClause = clauses.length > 0 ? `WHERE ${clauses.join(' AND ')}` : '';
    }

    // Get records to process
    const selectQuery = `
      SELECT id, content 
      FROM ${mysql.escapeId(toProcessTable)}
      ${whereClause}
      LIMIT ${batchSize}
    `;

    console.log('Select query:', selectQuery);

    const records = await this.db.rawQuery<any>(selectQuery);
    console.log(`Retrieved ${records.length} records to process`);

    const successfulRecordIds: any[] = [];
    const errors: string[] = [];

    // Process each record
    for (const record of records) {
      const content = typeof record.content === 'string' 
        ? JSON.parse(record.content) 
        : record.content;

      let recordSuccess = true;
      const generatedIds = new Map<string, number>();

      // Insert in dependency order
      for (const tableName of insertOrder) {
        try {
          const tableMappings = mappings.filter(m => m.targetTable === tableName);
          if (tableMappings.length === 0) {
            console.log(`⚠ Skipping ${tableName} - no field mappings defined`);
            continue;
          }

          // Get table definition for type checking
          const tableDefinition = tables.find(t => t.name === tableName);
          const values: any = {};

          // Extract values from JSON
          for (const mapping of tableMappings) {
            let value = this.extractValue(content, mapping.sourcePath);
            
            // Find column definition
            const columnDef = tableDefinition?.columns.find((c: any) => c.name === mapping.targetColumn);
            
            // Convert timestamps if needed
            if (columnDef && this.isDateTimeType(columnDef.type)) {
              value = this.convertToDateTime(value);
            }
            
            values[mapping.targetColumn] = value;
          }

          // Add foreign keys from parent tables
          for (const rel of relationships.filter(r => r.childTable === tableName)) {
            const parentId = generatedIds.get(rel.parentTable);
            if (parentId !== undefined) {
              values[rel.foreignKeyColumn] = parentId;
              console.log(`Setting FK: ${tableName}.${rel.foreignKeyColumn} = ${parentId} (from ${rel.parentTable})`);
            } else {
              console.warn(`⚠ Missing parent ID for ${rel.parentTable} → ${tableName}`);
            }
          }

          // Build and execute INSERT query
          const columns = Object.keys(values);
          const escapedValues = Object.values(values).map(v => mysql.escape(v));
          
          const insertQuery = `
            INSERT INTO ${mysql.escapeId(tableName)} 
            (${columns.map(c => mysql.escapeId(c)).join(', ')})
            VALUES (${escapedValues.join(', ')})
          `;

          const result: any = await this.db.rawQuery<any>(insertQuery);

          // Store generated ID for child tables
          if (result && typeof result === 'object' && 'insertId' in result) {
            generatedIds.set(tableName, result.insertId);
            console.log(`✓ Inserted into ${tableName}, ID: ${result.insertId}`);
          }

        } catch (error: any) {
          const friendlyError = this.translateError(error, tableName, mappings);
          console.error(`✗ ${friendlyError}`);
          errors.push(`Record ${record.id}: ${friendlyError}`);
          recordSuccess = false;
          break;
        }
      }

      // Track successful records for reporting
      if (recordSuccess) {
        successfulRecordIds.push(record.id);
      }
    }

    const processed = successfulRecordIds.length;
    console.log(`\n✓ Successfully processed ${processed} out of ${records.length} records`);

    // Move ALL records (both successful and failed) to archive table
    let moved = 0;
    if (records.length > 0) {
      const allIds = records.map((r: any) => r.id);
      
      const copyQuery = `
        INSERT IGNORE INTO ${mysql.escapeId(destTable)} (id, content)
        SELECT id, content FROM ${mysql.escapeId(toProcessTable)}
        WHERE id IN (${allIds.map(id => mysql.escape(id)).join(',')})
      `;
      
      await this.db.rawQuery(copyQuery);

      const deleteQuery = `
        DELETE FROM ${mysql.escapeId(toProcessTable)}
        WHERE id IN (${allIds.map(id => mysql.escape(id)).join(',')})
      `;
      
      const deleteResult: any = await this.db.rawQuery<any>(deleteQuery);
      moved = (deleteResult && typeof deleteResult === 'object' && 'affectedRows' in deleteResult) ? deleteResult.affectedRows : 0;
      
      if (processed < records.length) {
        console.log(`✓ Moved ${moved} records to ${destTable} (${processed} processed successfully, ${records.length - processed} archived without processing)\n`);
      } else {
        console.log(`✓ Moved ${moved} records to ${destTable}\n`);
      }
    }

    // FINAL CLEANUP: Move any remaining records from _toprocess that didn't match the filter
    const remainingCountQuery = `SELECT COUNT(*) as count FROM ${mysql.escapeId(toProcessTable)}`;
    const remainingResult = await this.db.rawQuery<any>(remainingCountQuery);
    const remainingCount = remainingResult[0]?.count || 0;

    if (remainingCount > 0) {
      console.log(`\n📦 Archiving ${remainingCount} remaining records that didn't match filter...`);
      
      // Move all remaining records (no WHERE clause - everything left)
      const cleanupCopyQuery = `
        INSERT IGNORE INTO ${mysql.escapeId(destTable)} (id, content)
        SELECT id, content FROM ${mysql.escapeId(toProcessTable)}
      `;
      
      await this.db.rawQuery(cleanupCopyQuery);

      const cleanupDeleteQuery = `DELETE FROM ${mysql.escapeId(toProcessTable)}`;
      const cleanupResult: any = await this.db.rawQuery<any>(cleanupDeleteQuery);
      const archived = (cleanupResult && typeof cleanupResult === 'object' && 'affectedRows' in cleanupResult) ? cleanupResult.affectedRows : 0;
      
      console.log(`✓ Archived ${archived} records to ${destTable} (did not match filter criteria)\n`);
      moved += archived;
    }

    if (errors.length > 0) {
      console.error(`✗ Failed to process ${records.length - processed} records (archived to ${destTable} anyway)`);
    }

    return { processed, moved };
  }

  private translateError(error: any, tableName: string, mappings: any[]): string {
    const message = error.message || '';

    // Foreign key constraint failures
    if (message.includes('foreign key constraint fails')) {
      const fkMatch = message.match(/FOREIGN KEY \(`([^`]+)`\) REFERENCES `([^`]+)` \(`([^`]+)`\)/);
      if (fkMatch) {
        const [, childCol, parentTable, parentCol] = fkMatch;
        return `Data mapping incorrect: ${tableName}.${childCol} references ${parentTable}.${parentCol}, but parent record doesn't exist. Check your table relationships and ensure parent tables are populated first.`;
      }
      return `Data mapping incorrect: Foreign key constraint failed for ${tableName}. Check your table relationships.`;
    }

    // Missing required fields
    if (message.includes("doesn't have a default value")) {
      const fieldMatch = message.match(/Field '([^']+)'/);
      if (fieldMatch) {
        return `Data mapping incorrect: Required field '${fieldMatch[1]}' in ${tableName} is missing. Map a source field to this column or make it nullable.`;
      }
      return `Data mapping incorrect: Required field missing in ${tableName}`;
    }

    // Data type mismatches
    if (message.includes('Incorrect') && message.includes('value')) {
      const typeMatch = message.match(/Incorrect (\w+) value/);
      const colMatch = message.match(/for column '([^']+)'/);
      if (typeMatch && colMatch) {
        return `Data type mismatch: Column '${colMatch[1]}' in ${tableName} expects ${typeMatch[1]} but received incompatible data. Check your source data format.`;
      }
      return `Data type mismatch in ${tableName}. Check your field mappings and data formats.`;
    }

    // Duplicate entry
    if (message.includes('Duplicate entry')) {
      const dupMatch = message.match(/Duplicate entry '([^']+)'/);
      if (dupMatch) {
        return `Duplicate value: '${dupMatch[1]}' already exists in ${tableName}. This may indicate the same data is being processed twice.`;
      }
      return `Duplicate entry in ${tableName}`;
    }

    // Unknown column
    if (message.includes('Unknown column')) {
      const colMatch = message.match(/Unknown column '([^']+)'/);
      if (colMatch) {
        return `Configuration error: Column '${colMatch[1]}' doesn't exist in ${tableName}. The mapping may reference an old schema - try recreating the table.`;
      }
      return `Column mismatch in ${tableName}`;
    }

    // Default fallback
    return `Error inserting into ${tableName}: ${message}`;
  }

  private isDateTimeType(type: string): boolean {
    const lowerType = type.toLowerCase();
    return lowerType.includes('datetime') || 
           lowerType.includes('timestamp') || 
           lowerType === 'date';
  }

  private convertToDateTime(value: any): string | null {
    if (value === null || value === undefined) {
      return null;
    }

    // If already a string in datetime format, return as-is
    if (typeof value === 'string') {
      // Check if it's ISO format (e.g., "2025-12-02T14:26:18.893385Z")
      if (value.match(/^\d{4}-\d{2}-\d{2}[T ]\d{2}:\d{2}:\d{2}/)) {
        return value.replace('T', ' ').replace('Z', '').substring(0, 19);
      }
      return value;
    }

    // If it's a number, assume Unix timestamp
    if (typeof value === 'number') {
      let timestamp = value;
      
      // Convert milliseconds to seconds if needed
      if (timestamp > 10000000000) {
        timestamp = timestamp / 1000;
      }
      
      const date = new Date(timestamp * 1000);
      
      // Format as MySQL datetime: YYYY-MM-DD HH:MM:SS
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      const hours = String(date.getHours()).padStart(2, '0');
      const minutes = String(date.getMinutes()).padStart(2, '0');
      const seconds = String(date.getSeconds()).padStart(2, '0');
      
      return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
    }

    return value;
  }

  private extractValue(obj: any, path: string): any {
    const parts = path.split('.');
    let value = obj;

    for (const part of parts) {
      if (value === null || value === undefined) {
        return null;
      }
      value = value[part];
    }

    if (Array.isArray(value)) {
      return value.length > 0 ? value[0] : null;
    }

    if (typeof value === 'object' && value !== null) {
      return JSON.stringify(value);
    }

    return value;
  }
}
