import { injectable, inject } from 'tsyringe';
import { DatabaseConnection } from '../database/connection.js';
import mysql from 'mysql2/promise';

export interface TableColumn {
  name: string;
  type: string;
  nullable: boolean;
  isPrimaryKey: boolean;
  defaultValue?: string;
}

export interface SourceTableAnalysis {
  tableName: string;
  columns: TableColumn[];
  rowCount: number;
}

export interface StagingMapping {
  sourceTable: string;
  sourceColumn: string;
  targetTable: string;
  targetColumn: string;
}

export interface StagingRelationship {
  parentTable: string;
  childTable: string;
  parentKeyColumn: string;
  foreignKeyColumn: string;
}

@injectable()
export class StagingService {
  constructor(@inject(DatabaseConnection) private db: DatabaseConnection) {}

  /**
   * Analyze source tables to get their structure
   */
  async analyzeTables(tableNames: string[]): Promise<SourceTableAnalysis[]> {
    const results: SourceTableAnalysis[] = [];

    for (const tableName of tableNames) {
      // Get table structure
      const columnsSql = `
        SELECT
          COLUMN_NAME as name,
          COLUMN_TYPE as type,
          IS_NULLABLE as nullable,
          COLUMN_KEY as columnKey,
          COLUMN_DEFAULT as defaultValue
        FROM INFORMATION_SCHEMA.COLUMNS
        WHERE TABLE_SCHEMA = DATABASE()
          AND TABLE_NAME = ?
        ORDER BY ORDINAL_POSITION
      `;

      const columnsData = await this.db.query<any>(columnsSql, [tableName]);

      const columns: TableColumn[] = columnsData.map((col: any) => ({
        name: col.name,
        type: col.type,
        nullable: col.nullable === 'YES',
        isPrimaryKey: col.columnKey === 'PRI',
        defaultValue: col.defaultValue,
      }));

      // Get row count
      const countSql = `SELECT COUNT(*) as total FROM ${mysql.escapeId(tableName)}`;
      const countResult = await this.db.query<any>(countSql, []);
      const rowCount = countResult[0]?.total || 0;

      results.push({
        tableName,
        columns,
        rowCount,
      });
    }

    return results;
  }

  /**
   * Create staging tables based on definitions
   */
  async createStagingTables(tables: any[]): Promise<string[]> {
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

  /**
   * Copy data from source tables to staging tables
   */
  async executeStagingCopy(
    mappings: StagingMapping[],
    relationships: StagingRelationship[],
    sourceTables: string[],
    whereConditions?: any[],
    batchSize: number = 100
  ): Promise<{ processed: number; errors: string[] }> {
    console.log('[STAGING] Starting staging copy...');
    console.log('[STAGING] Mappings:', mappings.length);
    console.log('[STAGING] Relationships:', relationships.length);

    const errors: string[] = [];
    let totalProcessed = 0;

    // Group mappings by source table
    const tableGroups = new Map<string, StagingMapping[]>();
    for (const mapping of mappings) {
      if (!tableGroups.has(mapping.sourceTable)) {
        tableGroups.set(mapping.sourceTable, []);
      }
      tableGroups.get(mapping.sourceTable)!.push(mapping);
    }

    // Determine insert order based on relationships
    const insertOrder = this.getInsertOrder(sourceTables, relationships);
    console.log('[STAGING] Insert order:', insertOrder);

    // Build WHERE clause if conditions provided
    let whereClause = '';
    if (whereConditions && whereConditions.length > 0) {
      const clauses: string[] = [];
      for (const condition of whereConditions) {
        if (condition.operator === 'IS NOT NULL') {
          clauses.push(`${mysql.escapeId(condition.field)} IS NOT NULL`);
        } else if (condition.operator === 'IS NULL') {
          clauses.push(`${mysql.escapeId(condition.field)} IS NULL`);
        } else {
          clauses.push(`${mysql.escapeId(condition.field)} ${condition.operator} ${mysql.escape(condition.value)}`);
        }
      }
      if (clauses.length > 0) {
        whereClause = 'WHERE ' + clauses.join(' AND ');
      }
    }

    // Process each source table in dependency order
    for (const sourceTable of insertOrder) {
      const tableMappings = tableGroups.get(sourceTable) || [];
      if (tableMappings.length === 0) {
        console.log(`[STAGING] No mappings for ${sourceTable}, skipping`);
        continue;
      }

      // Get all records from source table with WHERE clause
      const selectSql = `SELECT * FROM ${mysql.escapeId(sourceTable)} ${whereClause} LIMIT ${batchSize}`;
      console.log(`[STAGING] Query: ${selectSql}`);
      const records = await this.db.rawQuery<any>(selectSql);
      console.log(`[STAGING] Processing ${records.length} records from ${sourceTable}`);

      // Group mappings by target table
      const targetGroups = new Map<string, StagingMapping[]>();
      for (const mapping of tableMappings) {
        if (!targetGroups.has(mapping.targetTable)) {
          targetGroups.set(mapping.targetTable, []);
        }
        targetGroups.get(mapping.targetTable)!.push(mapping);
      }

      // Insert into each target table
      for (const [targetTable, targetMappings] of targetGroups.entries()) {
        for (const record of records) {
          try {
            // Build column values from mappings
            const values: any = {};
            for (const mapping of targetMappings) {
              const sourceValue = record[mapping.sourceColumn];
              values[mapping.targetColumn] = sourceValue;
            }

            // Build INSERT IGNORE query for delta loading
            const columns = Object.keys(values);
            const escapedValues = Object.values(values).map(v => mysql.escape(v));

            const insertSql = `
              INSERT IGNORE INTO ${mysql.escapeId(targetTable)}
              (${columns.map(c => mysql.escapeId(c)).join(', ')})
              VALUES (${escapedValues.join(', ')})
            `;

            await this.db.rawQuery(insertSql);
            totalProcessed++;
          } catch (error: any) {
            const errorMsg = `Failed to insert from ${sourceTable} to ${targetTable}: ${error.message}`;
            console.error(`[STAGING] ${errorMsg}`);
            errors.push(errorMsg);
          }
        }
      }
    }

    console.log(`[STAGING] Completed. Processed ${totalProcessed} records, ${errors.length} errors`);

    return {
      processed: totalProcessed,
      errors,
    };
  }

  /**
   * Determine insert order based on relationships
   */
  private getInsertOrder(tables: string[], relationships: StagingRelationship[]): string[] {
    const graph = new Map<string, Set<string>>();
    const inDegree = new Map<string, number>();

    // Initialize
    for (const table of tables) {
      graph.set(table, new Set());
      inDegree.set(table, 0);
    }

    // Build graph (parent -> children)
    for (const rel of relationships) {
      if (graph.has(rel.parentTable) && graph.has(rel.childTable)) {
        graph.get(rel.parentTable)!.add(rel.childTable);
        inDegree.set(rel.childTable, (inDegree.get(rel.childTable) || 0) + 1);
      }
    }

    // Topological sort
    const order: string[] = [];
    const queue: string[] = [];

    // Start with tables that have no dependencies
    for (const [table, degree] of inDegree.entries()) {
      if (degree === 0) {
        queue.push(table);
      }
    }

    while (queue.length > 0) {
      const current = queue.shift()!;
      order.push(current);

      for (const child of graph.get(current) || []) {
        const newDegree = (inDegree.get(child) || 0) - 1;
        inDegree.set(child, newDegree);
        if (newDegree === 0) {
          queue.push(child);
        }
      }
    }

    // If not all tables are in order, add remaining (circular dependency or isolated)
    for (const table of tables) {
      if (!order.includes(table)) {
        order.push(table);
      }
    }

    return order;
  }
}
