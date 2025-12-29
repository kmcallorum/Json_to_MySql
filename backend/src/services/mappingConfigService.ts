import { DatabaseConnection } from '../database/connection.js';

export interface MappingConfig {
  id?: number;
  name: string;
  description?: string;
  baseTableName: string;
  whereConditions: any[];
  tables: any[];
  mappings: any[];
  fields?: any[];
  relationships?: any[];
  createdAt?: Date;
  updatedAt?: Date;
}

export class MappingConfigService {
  constructor(private db: DatabaseConnection) {}

  async saveConfig(config: MappingConfig): Promise<MappingConfig> {
    const sql = `
      INSERT INTO mapping_configs (
        name, description, base_table_name, where_conditions,
        tables, mappings, fields, relationships
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE
        description = VALUES(description),
        base_table_name = VALUES(base_table_name),
        where_conditions = VALUES(where_conditions),
        tables = VALUES(tables),
        mappings = VALUES(mappings),
        fields = VALUES(fields),
        relationships = VALUES(relationships),
        updated_at = CURRENT_TIMESTAMP
    `;

    await this.db.query(sql, [
      config.name,
      config.description || null,
      config.baseTableName,
      JSON.stringify(config.whereConditions || []),
      JSON.stringify(config.tables),
      JSON.stringify(config.mappings),
      JSON.stringify(config.fields || []),
      JSON.stringify(config.relationships || [])
    ]);

    return this.loadConfig(config.name) as Promise<MappingConfig>;
  }

  async loadConfig(name: string): Promise<MappingConfig | null> {
    const sql = 'SELECT * FROM mapping_configs WHERE name = ?';
    const results = await this.db.query<any>(sql, [name]);

    if (results.length === 0) {
      return null;
    }

    const row = results[0];
    return {
      id: row.id,
      name: row.name,
      description: row.description,
      baseTableName: row.base_table_name,
      whereConditions: this.parseJSON(row.where_conditions),
      tables: this.parseJSON(row.tables),
      mappings: this.parseJSON(row.mappings),
      fields: this.parseJSON(row.fields),
      relationships: this.parseJSON(row.relationships),
      createdAt: row.created_at,
      updatedAt: row.updated_at
    };
  }

  async listConfigs(): Promise<MappingConfig[]> {
    const sql = 'SELECT * FROM mapping_configs ORDER BY updated_at DESC';
    const results = await this.db.query<any>(sql);

    return results.map(row => ({
      id: row.id,
      name: row.name,
      description: row.description,
      baseTableName: row.base_table_name,
      whereConditions: this.parseJSON(row.where_conditions),
      tables: this.parseJSON(row.tables),
      mappings: this.parseJSON(row.mappings),
      fields: this.parseJSON(row.fields),
      relationships: this.parseJSON(row.relationships),
      createdAt: row.created_at,
      updatedAt: row.updated_at
    }));
  }

  async deleteConfig(name: string): Promise<void> {
    const sql = 'DELETE FROM mapping_configs WHERE name = ?';
    await this.db.query(sql, [name]);
  }

  private parseJSON(value: any): any {
    if (typeof value === 'string') {
      try {
        return JSON.parse(value);
      } catch {
        return value;
      }
    }
    return value;
  }
}
