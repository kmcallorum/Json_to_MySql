import { injectable, inject } from 'tsyringe';
import { DatabaseConnection } from '../database/connection.js';

export interface TestConnectionConfig {
  host?: string;
  port?: number;
  user?: string;
  password?: string;
  database?: string;
}

export interface FieldMetadata {
  path: string;
  uniqueValues: any[];
  nullCount: number;
  totalCount: number;
}

export interface FieldAnalysis {
  path: string;
  types: string[];
  isArray: boolean;
  isNullable: boolean;
  samples: any[];
  occurrence: number;
  maxLength?: number;
  suggestedTable: string;
  suggestedColumn: string;
  suggestedType: string;
}

export interface AnalysisResult {
  fields: FieldAnalysis[];
  totalDocuments: number;
  analyzedAt: Date;
}

@injectable()
export class AnalysisService {
  constructor(@inject(DatabaseConnection) private db: DatabaseConnection) {}

  async testConnection(config: TestConnectionConfig): Promise<void> {
    const testDb = new DatabaseConnection({
      host: config.host || process.env.DB_HOST || 'localhost',
      port: config.port || parseInt(process.env.DB_PORT || '3306'),
      user: config.user || process.env.DB_USER || 'root',
      password: config.password || process.env.DB_PASSWORD || '',
      database: config.database || process.env.DB_NAME || 'test_json'
    });

    try {
      await testDb.rawQuery('SELECT 1');
    } finally {
      await testDb.close();
    }
  }

  async discoverFields(tableName: string, sampleSize: number = 1000): Promise<{
    tableName: string;
    sampleSize: number;
    fields: FieldMetadata[];
  }> {
    const sql = `SELECT content FROM ${tableName} LIMIT ${sampleSize}`;
    const records = await this.db.rawQuery<any>(sql);

    const fieldMap = new Map<string, any>();

    for (const record of records) {
      const content = typeof record.content === 'string'
        ? JSON.parse(record.content)
        : record.content;

      this.extractFieldMetadata(content, '', fieldMap);
    }

    const fields = Array.from(fieldMap.entries()).map(([path, metadata]) => ({
      path,
      uniqueValues: Array.from(metadata.values).slice(0, 100),
      nullCount: metadata.nullCount,
      totalCount: metadata.totalCount
    })).sort((a, b) => a.path.localeCompare(b.path));

    return {
      tableName,
      sampleSize: records.length,
      fields
    };
  }

  async analyze(
    baseTableName: string,
    sampleSize: number = 100,
    whereConditions: any[] = []
  ): Promise<{
    analysis: AnalysisResult;
    totalRecordsInTable: number;
    sampledRecords: number;
    baseTableName: string;
    toProcessTable: string;
    appliedFilters: any[];
  }> {
    // Build WHERE clause from conditions
    let whereClause = '';
    const queryParams: any[] = [];

    if (whereConditions.length > 0) {
      const clauses = whereConditions.map((condition: any) => {
        const { field, operator, value } = condition;

        if (operator === 'IS NULL' || operator === 'IS NOT NULL') {
          return `JSON_EXTRACT(content, '$.${field}') ${operator}`;
        } else if (operator === '=') {
          queryParams.push(`$.${field}`, value);
          return `JSON_UNQUOTE(JSON_EXTRACT(content, ?)) = ?`;
        } else if (operator === '!=') {
          queryParams.push(`$.${field}`, value);
          return `JSON_UNQUOTE(JSON_EXTRACT(content, ?)) != ?`;
        } else if (operator === 'LIKE') {
          queryParams.push(`$.${field}`, `%${value}%`);
          return `JSON_UNQUOTE(JSON_EXTRACT(content, ?)) LIKE ?`;
        } else if (operator === 'IN' && Array.isArray(value)) {
          const placeholders = value.map(() => '?').join(', ');
          queryParams.push(`$.${field}`, ...value);
          return `JSON_UNQUOTE(JSON_EXTRACT(content, ?)) IN (${placeholders})`;
        }
        return null;
      }).filter(Boolean);

      if (clauses.length > 0) {
        whereClause = 'WHERE ' + clauses.join(' AND ');
      }
    }

    // Get total count
    const countSql = `SELECT COUNT(*) as total FROM ${baseTableName} ${whereClause}`;
    const countResult = await this.db.query<any>(countSql, queryParams);
    const totalRecordsInTable = countResult[0]?.total || 0;

    // Get sample records
    const sampleSql = `SELECT content FROM ${baseTableName} ${whereClause} LIMIT ${sampleSize}`;
    const records = await this.db.query<any>(sampleSql, queryParams);

    // Analyze fields
    const fieldMap = new Map<string, any>();

    for (const record of records) {
      const content = typeof record.content === 'string'
        ? JSON.parse(record.content)
        : record.content;

      this.analyzeObject(content, '', fieldMap);
    }

    // Convert to array and add suggestions
    const fields = Array.from(fieldMap.values()).map((field: any) => ({
      ...field,
      types: Array.from(field.types),
      suggestedTable: this.suggestTableName(field.path, baseTableName),
      suggestedColumn: this.suggestColumnName(field.path),
      suggestedType: this.suggestSqlType(field),
    }));

    return {
      analysis: {
        fields,
        totalDocuments: records.length,
        analyzedAt: new Date(),
      },
      totalRecordsInTable,
      sampledRecords: records.length,
      baseTableName,
      toProcessTable: `${baseTableName}_toprocess`,
      appliedFilters: whereConditions,
    };
  }

  async getFieldValues(tableName: string, fieldPath: string, limit: number = 100): Promise<{
    fieldPath: string;
    values: any[];
  }> {
    const jsonPath = `$.${fieldPath}`;
    const sql = `
      SELECT DISTINCT JSON_UNQUOTE(JSON_EXTRACT(content, ?)) as value
      FROM ${tableName}
      WHERE JSON_EXTRACT(content, ?) IS NOT NULL
      LIMIT ${limit}
    `;

    const results = await this.db.query<any>(sql, [jsonPath, jsonPath]);
    const values = results.map(r => r.value).filter(v => v !== null);

    return {
      fieldPath,
      values
    };
  }

  // Helper methods
  private extractFieldMetadata(
    obj: any,
    prefix: string,
    fieldMap: Map<string, any>,
    visited: WeakSet<object> = new WeakSet(),
    depth: number = 0,
    maxDepth: number = 50
  ): void {
    if (obj === null || obj === undefined) {
      return;
    }

    // Prevent infinite recursion from deeply nested structures
    if (depth > maxDepth) {
      console.warn(`Max depth ${maxDepth} reached at path: ${prefix}`);
      return;
    }

    if (Array.isArray(obj)) {
      if (obj.length > 0) {
        this.extractFieldMetadata(obj[0], prefix, fieldMap, visited, depth + 1, maxDepth);
      }
      return;
    }

    if (typeof obj === 'object') {
      // Prevent circular reference infinite loops
      if (visited.has(obj)) {
        console.warn(`Circular reference detected at path: ${prefix}`);
        return;
      }
      visited.add(obj);

      for (const key in obj) {
        const path = prefix ? `${prefix}.${key}` : key;
        const value = obj[key];

        if (!fieldMap.has(path)) {
          fieldMap.set(path, {
            values: new Set(),
            nullCount: 0,
            totalCount: 0
          });
        }

        const metadata = fieldMap.get(path);
        metadata.totalCount++;

        if (value === null || value === undefined) {
          metadata.nullCount++;
        } else {
          if (metadata.values.size < 100) {
            if (typeof value !== 'object' || Array.isArray(value)) {
              const valueStr = Array.isArray(value) ? JSON.stringify(value) : value;
              metadata.values.add(valueStr);
            }
          }
        }

        if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
          this.extractFieldMetadata(value, path, fieldMap, visited, depth + 1, maxDepth);
        } else if (Array.isArray(value) && value.length > 0) {
          this.extractFieldMetadata(value[0], path, fieldMap, visited, depth + 1, maxDepth);
        }
      }
    }
  }

  private analyzeObject(
    obj: any,
    prefix: string,
    fieldMap: Map<string, any>,
    visited: WeakSet<object> = new WeakSet(),
    depth: number = 0,
    maxDepth: number = 50
  ): void {
    if (obj === null || obj === undefined) {
      return;
    }

    // Prevent infinite recursion from deeply nested structures
    if (depth > maxDepth) {
      console.warn(`Max depth ${maxDepth} reached at path: ${prefix}`);
      return;
    }

    if (Array.isArray(obj)) {
      if (obj.length > 0) {
        this.analyzeObject(obj[0], prefix, fieldMap, visited, depth + 1, maxDepth);
      }
      return;
    }

    if (typeof obj === 'object') {
      // Prevent circular reference infinite loops
      if (visited.has(obj)) {
        console.warn(`Circular reference detected at path: ${prefix}`);
        return;
      }
      visited.add(obj);

      for (const key in obj) {
        const path = prefix ? `${prefix}.${key}` : key;
        const value = obj[key];

        if (!fieldMap.has(path)) {
          fieldMap.set(path, {
            path,
            types: new Set<string>(),
            isArray: Array.isArray(value),
            isNullable: false,
            samples: [],
            occurrence: 0,
            maxLength: 0,
          });
        }

        const field = fieldMap.get(path);
        field.occurrence++;

        if (value === null || value === undefined) {
          field.isNullable = true;
        } else {
          const type = Array.isArray(value) ? 'array' : typeof value;
          field.types.add(type);

          if (field.samples.length < 5) {
            field.samples.push(value);
          }

          if (typeof value === 'string' && value.length > (field.maxLength || 0)) {
            field.maxLength = value.length;
          }

          if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
            this.analyzeObject(value, path, fieldMap, visited, depth + 1, maxDepth);
          } else if (Array.isArray(value) && value.length > 0) {
            this.analyzeObject(value[0], path, fieldMap, visited, depth + 1, maxDepth);
          }
        }
      }
    }
  }

  private suggestTableName(path: string, baseTableName: string): string {
    const parts = path.split('.');

    if (parts.length > 1) {
      const parent = parts[parts.length - 2];
      if (parent.toLowerCase().endsWith('data')) {
        return parent.slice(0, -4).toLowerCase() + 's';
      }
      return parent.toLowerCase() + '_data';
    }

    return baseTableName;
  }

  private suggestColumnName(path: string): string {
    const parts = path.split('.');
    return parts[parts.length - 1].replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`);
  }

  private suggestSqlType(field: any): string {
    const types = Array.from(field.types);

    if (types.includes('number')) {
      const hasLargeNumbers = field.samples.some((s: any) => typeof s === 'number' && s > 1000000000);
      if (hasLargeNumbers) {
        return 'BIGINT';
      }
      return 'INT';
    }

    if (types.includes('boolean')) {
      return 'TINYINT(1)';
    }

    if (types.includes('string')) {
      const maxLen = field.maxLength || 0;
      if (maxLen > 1000) return 'TEXT';
      if (maxLen > 255) return 'VARCHAR(500)';
      return 'VARCHAR(255)';
    }

    if (types.includes('object')) {
      return 'JSON';
    }

    if (types.includes('array')) {
      return 'JSON';
    }

    return 'TEXT';
  }
}
