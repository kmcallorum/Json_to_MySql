import express from 'express';
import { DatabaseConnection } from '../database/connection.js';

const router = express.Router();

// Get database connection
function getDb() {
  return new DatabaseConnection({
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '3306'),
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || 'root',
    database: process.env.DB_NAME || 'test_json'
  });
}

// Get list of all tables in the database
router.get('/list', async (req, res) => {
  try {
    const db = getDb();

    const sql = 'SHOW TABLES';
    const results = await db.rawQuery<any>(sql);

    // Extract table names (the column name varies by database)
    const tables = results.map((row: any) => Object.values(row)[0] as string);

    await db.close();

    res.json({
      success: true,
      tables
    });
  } catch (error: any) {
    console.error('Error listing tables:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Get structures for specific tables
router.post('/structures', async (req, res) => {
  try {
    const { tableNames } = req.body;

    if (!tableNames || !Array.isArray(tableNames) || tableNames.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'tableNames array is required'
      });
    }

    const db = getDb();
    const tables = [];

    for (const tableName of tableNames) {
      // Get column information for this table
      const sql = `DESCRIBE ${tableName}`;
      const columns = await db.rawQuery<any>(sql);

      const tableDefinition = {
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

    await db.close();

    res.json({
      success: true,
      tables
    });
  } catch (error: any) {
    console.error('Error getting table structures:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

export default router;
