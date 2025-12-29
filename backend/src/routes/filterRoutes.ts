import express from 'express';
import { FilterPresetService } from '../services/filterPresetService.js';
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

// Save filter preset
router.post('/save', async (req, res) => {
  try {
    const db = getDb();
    const service = new FilterPresetService(db);
    
    const { name, description, baseTableName, whereConditions } = req.body;
    
    const result = await service.savePreset(
      name,
      baseTableName,
      whereConditions,
      description
    );
    
    res.json({ success: true, preset: result });
  } catch (error: any) {
    console.error('Error saving filter preset:', error);
    res.json({ success: false, error: error.message });
  }
});

// Get all filter presets (frontend calls /list)
router.get('/list', async (req, res) => {
  try {
    const db = getDb();
    const service = new FilterPresetService(db);
    
    const presets = await service.listPresets();
    res.json({ success: true, presets });
  } catch (error: any) {
    console.error('Error listing presets:', error);
    res.json({ success: false, error: error.message });
  }
});

// Also support /presets for compatibility
router.get('/presets', async (req, res) => {
  try {
    const db = getDb();
    const service = new FilterPresetService(db);
    
    const presets = await service.listPresets();
    res.json({ success: true, presets });
  } catch (error: any) {
    console.error('Error listing presets:', error);
    res.json({ success: false, error: error.message });
  }
});

// Get filter preset by name (frontend calls /load/:name)
router.get('/load/:name', async (req, res) => {
  try {
    const db = getDb();
    const service = new FilterPresetService(db);
    
    const preset = await service.loadPreset(req.params.name);
    
    if (!preset) {
      return res.json({ 
        success: false, 
        error: `Preset '${req.params.name}' not found` 
      });
    }
    
    res.json({ success: true, preset });
  } catch (error: any) {
    console.error('Error loading preset:', error);
    res.json({ success: false, error: error.message });
  }
});

// Also support /presets/:name for compatibility
router.get('/presets/:name', async (req, res) => {
  try {
    const db = getDb();
    const service = new FilterPresetService(db);
    
    const preset = await service.loadPreset(req.params.name);
    
    if (!preset) {
      return res.json({ 
        success: false, 
        error: `Preset '${req.params.name}' not found` 
      });
    }
    
    res.json({ success: true, preset });
  } catch (error: any) {
    console.error('Error loading preset:', error);
    res.json({ success: false, error: error.message });
  }
});

// Delete filter preset
router.delete('/:name', async (req, res) => {
  try {
    const db = getDb();
    const service = new FilterPresetService(db);
    
    await service.deletePreset(req.params.name);
    res.json({ success: true, message: 'Preset deleted successfully' });
  } catch (error: any) {
    console.error('Error deleting preset:', error);
    res.json({ success: false, error: error.message });
  }
});

export default router;
