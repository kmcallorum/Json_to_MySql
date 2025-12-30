import express from 'express';
import { container } from 'tsyringe';
import { AnalysisService } from '../services/analysisService.js';

const router = express.Router();

// Test database connection
router.post('/test-connection', async (req, res) => {
  try {
    const service = container.resolve(AnalysisService);
    await service.testConnection(req.body);

    res.json({
      success: true,
      message: 'Connection successful!'
    });
  } catch (error: any) {
    console.error('Database connection test failed:', error);
    res.json({
      success: false,
      error: error.message || 'Connection failed'
    });
  }
});

// Discover fields from JSON content with metadata
router.post('/discover-fields', async (req, res) => {
  try {
    const tableName = req.body.tableName || req.body.baseTableName;
    const sampleSize = req.body.sampleSize || 1000;

    if (!tableName) {
      return res.status(400).json({ error: 'tableName or baseTableName is required' });
    }

    const service = container.resolve(AnalysisService);
    const result = await service.discoverFields(tableName, sampleSize);

    res.json({
      success: true,
      ...result
    });
  } catch (error: any) {
    console.error('Error discovering fields:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Analyze JSON structure and suggest table mappings
router.post('/analyze', async (req, res) => {
  try {
    const { baseTableName, sampleSize = 100, whereConditions = [] } = req.body;

    if (!baseTableName) {
      return res.status(400).json({
        success: false,
        error: 'baseTableName is required'
      });
    }

    const service = container.resolve(AnalysisService);
    const result = await service.analyze(baseTableName, sampleSize, whereConditions);

    res.json({
      success: true,
      ...result
    });
  } catch (error: any) {
    console.error('Error analyzing JSON:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Get unique values for a specific field (for filter UI)
router.post('/field-values', async (req, res) => {
  try {
    const { tableName, fieldPath, limit = 100 } = req.body;

    if (!tableName || !fieldPath) {
      return res.status(400).json({ error: 'tableName and fieldPath are required' });
    }

    const service = container.resolve(AnalysisService);
    const result = await service.getFieldValues(tableName, fieldPath, limit);

    res.json(result);
  } catch (error: any) {
    console.error('Error getting field values:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
