import express from 'express';
import { container } from 'tsyringe';
import { StagingService } from '../services/stagingService.js';

const router = express.Router();

// Analyze source tables to get their structure
router.post('/analyze-tables', async (req, res) => {
  try {
    const { tableNames } = req.body;

    if (!tableNames || !Array.isArray(tableNames)) {
      return res.status(400).json({
        success: false,
        error: 'tableNames array is required'
      });
    }

    const service = container.resolve(StagingService);
    const analysis = await service.analyzeTables(tableNames);

    res.json({
      success: true,
      tables: analysis
    });
  } catch (error: any) {
    console.error('Error analyzing tables:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Create staging tables
router.post('/create-tables', async (req, res) => {
  try {
    const { tables } = req.body;

    if (!tables || !Array.isArray(tables)) {
      return res.status(400).json({
        success: false,
        error: 'tables array is required'
      });
    }

    const service = container.resolve(StagingService);
    const created = await service.createStagingTables(tables);

    res.json({
      success: true,
      tablesCreated: created
    });
  } catch (error: any) {
    console.error('Error creating staging tables:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Execute staging copy
router.post('/execute', async (req, res) => {
  try {
    const { mappings, relationships, sourceTables, whereConditions, batchSize = 100 } = req.body;

    if (!mappings || !Array.isArray(mappings)) {
      return res.status(400).json({
        success: false,
        error: 'mappings array is required'
      });
    }

    if (!sourceTables || !Array.isArray(sourceTables)) {
      return res.status(400).json({
        success: false,
        error: 'sourceTables array is required'
      });
    }

    const service = container.resolve(StagingService);
    const result = await service.executeStagingCopy(
      mappings,
      relationships || [],
      sourceTables,
      whereConditions || [],
      batchSize
    );

    res.json({
      success: true,
      ...result
    });
  } catch (error: any) {
    console.error('Error executing staging copy:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

export default router;
