import { injectable, inject } from 'tsyringe';
import { DatabaseConnection } from '../database/connection.js';

export interface FilterPreset {
  id?: number;
  name: string;
  description?: string;
  baseTableName: string;
  whereConditions: any[];
  createdAt?: Date;
  updatedAt?: Date;
}

@injectable()
export class FilterPresetService {
  constructor(@inject(DatabaseConnection) private db: DatabaseConnection) {}

  async savePreset(
    name: string,
    baseTableName: string,
    whereConditions: any[],
    description?: string
  ): Promise<FilterPreset> {
    const sql = `
      INSERT INTO filter_presets (name, description, base_table_name, where_conditions)
      VALUES (?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE
        description = VALUES(description),
        base_table_name = VALUES(base_table_name),
        where_conditions = VALUES(where_conditions),
        updated_at = CURRENT_TIMESTAMP
    `;

    await this.db.query(sql, [
      name,
      description || null,
      baseTableName,
      JSON.stringify(whereConditions)
    ]);

    return this.loadPreset(name) as Promise<FilterPreset>;
  }

  async loadPreset(name: string): Promise<FilterPreset | null> {
    const sql = 'SELECT * FROM filter_presets WHERE name = ?';
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
      createdAt: row.created_at,
      updatedAt: row.updated_at
    };
  }

  async listPresets(): Promise<FilterPreset[]> {
    const sql = 'SELECT * FROM filter_presets ORDER BY updated_at DESC';
    const results = await this.db.query<any>(sql);

    return results.map(row => ({
      id: row.id,
      name: row.name,
      description: row.description,
      baseTableName: row.base_table_name,
      whereConditions: this.parseJSON(row.where_conditions),
      createdAt: row.created_at,
      updatedAt: row.updated_at
    }));
  }

  async deletePreset(name: string): Promise<void> {
    const sql = 'DELETE FROM filter_presets WHERE name = ?';
    await this.db.query(sql, [name]);
  }

  // Safe JSON parser that handles both strings and objects
  private parseJSON(value: any): any {
    // If it's null or undefined, return empty array
    if (value === null || value === undefined) {
      return [];
    }

    // If it's already an object/array, return as-is
    if (typeof value === 'object') {
      return value;
    }

    // If it's a string, try to parse it
    if (typeof value === 'string') {
      try {
        return JSON.parse(value);
      } catch (e) {
        console.error('Failed to parse JSON:', value, e);
        return [];
      }
    }

    // Default fallback
    return [];
  }
}
