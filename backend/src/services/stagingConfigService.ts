import { injectable, inject } from 'tsyringe';
import { DatabaseConnection } from '../database/connection.js';

export interface StagingConfig {
  id?: number;
  name: string;
  description?: string;
  sourceTables: string[];
  mappings: any[];
  relationships?: any[];
  whereConditions?: any[];
  createdAt?: Date;
  updatedAt?: Date;
}

@injectable()
export class StagingConfigService {
  constructor(@inject(DatabaseConnection) private db: DatabaseConnection) {}

  async saveConfig(config: StagingConfig): Promise<StagingConfig> {
    const sql = `
      INSERT INTO staging_configs (
        name, description, source_tables, mappings, relationships, where_conditions
      )
      VALUES (?, ?, ?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE
        description = VALUES(description),
        source_tables = VALUES(source_tables),
        mappings = VALUES(mappings),
        relationships = VALUES(relationships),
        where_conditions = VALUES(where_conditions),
        updated_at = CURRENT_TIMESTAMP
    `;

    await this.db.query(sql, [
      config.name,
      config.description || null,
      JSON.stringify(config.sourceTables),
      JSON.stringify(config.mappings),
      JSON.stringify(config.relationships || []),
      JSON.stringify(config.whereConditions || [])
    ]);

    return this.loadConfig(config.name) as Promise<StagingConfig>;
  }

  async loadConfig(name: string): Promise<StagingConfig | null> {
    const sql = 'SELECT * FROM staging_configs WHERE name = ?';
    const results = await this.db.query<any>(sql, [name]);

    if (results.length === 0) {
      return null;
    }

    const row = results[0];
    return {
      id: row.id,
      name: row.name,
      description: row.description,
      sourceTables: this.parseJSON(row.source_tables),
      mappings: this.parseJSON(row.mappings),
      relationships: this.parseJSON(row.relationships),
      whereConditions: this.parseJSON(row.where_conditions),
      createdAt: row.created_at,
      updatedAt: row.updated_at
    };
  }

  async listConfigs(): Promise<StagingConfig[]> {
    const sql = 'SELECT * FROM staging_configs ORDER BY updated_at DESC';
    const results = await this.db.query<any>(sql);

    return results.map(row => ({
      id: row.id,
      name: row.name,
      description: row.description,
      sourceTables: this.parseJSON(row.source_tables),
      mappings: this.parseJSON(row.mappings),
      relationships: this.parseJSON(row.relationships),
      whereConditions: this.parseJSON(row.where_conditions),
      createdAt: row.created_at,
      updatedAt: row.updated_at
    }));
  }

  async deleteConfig(name: string): Promise<void> {
    const sql = 'DELETE FROM staging_configs WHERE name = ?';
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
