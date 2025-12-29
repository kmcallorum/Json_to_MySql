import express from 'express';
import { MappingConfigService } from '../services/mappingConfigService.js';
import { ExecutionService } from '../services/executionService.js';
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

// Save mapping configuration
router.post('/save', async (req, res) => {
  try {
    const db = getDb();
    const service = new MappingConfigService(db);

    const result = await service.saveConfig(req.body);
    res.json({ success: true, config: result });
  } catch (error: any) {
    console.error('Error saving mapping config:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get all mapping configurations
router.get('/list', async (req, res) => {
  try {
    const db = getDb();
    const service = new MappingConfigService(db);

    const configs = await service.listConfigs();
    res.json({ success: true, configs });
  } catch (error: any) {
    console.error('Error listing configs:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get mapping config by name
router.get('/load/:name', async (req, res) => {
  try {
    const db = getDb();
    const service = new MappingConfigService(db);

    const config = await service.loadConfig(req.params.name);

    if (!config) {
      return res.status(404).json({ success: false, error: `Config '${req.params.name}' not found` });
    }

    res.json({ success: true, config });
  } catch (error: any) {
    console.error('Error loading config:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Delete mapping configuration
router.delete('/:name', async (req, res) => {
  try {
    const db = getDb();
    const service = new MappingConfigService(db);

    await service.deleteConfig(req.params.name);
    res.json({ success: true, message: 'Config deleted successfully' });
  } catch (error: any) {
    console.error('Error deleting config:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Execute flattening
router.post('/execute', async (req, res) => {
  try {
    const db = getDb();
    const executionService = new ExecutionService(db);
    
    const {
      baseTableName,
      tables,
      mappings,
      whereConditions = [],
      relationships = []
    } = req.body;

    // Create tables if needed
    const tablesCreated = await executionService.createTables(tables);

    // Flatten records
    const { processed, moved } = await executionService.flattenRecords(
      baseTableName,
      mappings,
      tables,
      whereConditions,
      relationships
    );

    res.json({
      success: true,
      tablesCreated,
      recordsProcessed: processed,
      recordsMoved: moved
    });
  } catch (error: any) {
    console.error('Error executing flattening:', error);
    res.status(500).json({ 
      success: false,
      error: error.message 
    });
  }
});

export default router;
