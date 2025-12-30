import express from 'express';
import { container } from 'tsyringe';
import { TableService } from '../services/tableService.js';

const router = express.Router();

// Get list of all tables in the database
router.get('/list', async (req, res) => {
  try {
    const service = container.resolve(TableService);
    const tables = await service.listTables();

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

    const service = container.resolve(TableService);
    const tables = await service.getTableStructures(tableNames);

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
