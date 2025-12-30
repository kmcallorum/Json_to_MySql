import { injectable, inject } from 'tsyringe';
import { DatabaseConnection } from '../database/connection.js';

export interface ColumnInfo {
  name: string;
  type: string;
  nullable: boolean;
  isPrimaryKey: boolean;
  default: any;
}

export interface TableDefinition {
  name: string;
  columns: ColumnInfo[];
  isNew: boolean;
}

@injectable()
export class TableService {
  constructor(@inject(DatabaseConnection) private db: DatabaseConnection) {}

  async listTables(): Promise<string[]> {
    const sql = 'SHOW TABLES';
    const results = await this.db.rawQuery<any>(sql);

    // Extract table names (the column name varies by database)
    const tables = results.map((row: any) => Object.values(row)[0] as string);

    return tables;
  }

  async getTableStructures(tableNames: string[]): Promise<TableDefinition[]> {
    if (!tableNames || !Array.isArray(tableNames) || tableNames.length === 0) {
      throw new Error('tableNames array is required');
    }

    const tables: TableDefinition[] = [];

    for (const tableName of tableNames) {
      // Get column information for this table
      const sql = `DESCRIBE ${tableName}`;
      const columns = await this.db.rawQuery<any>(sql);

      const tableDefinition: TableDefinition = {
        name: tableName,
        columns: columns.map((col: any) => ({
          name: col.Field,
          type: col.Type,
          nullable: col.Null === 'YES',
          isPrimaryKey: col.Key === 'PRI',
          default: col.Default,
        })),
        isNew: false
      };

      tables.push(tableDefinition);
    }

    return tables;
  }
}
