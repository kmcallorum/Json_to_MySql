import express from 'express';
import { container } from 'tsyringe';
import { FilterPresetService } from '../services/filterPresetService.js';

const router = express.Router();

// Save filter preset
router.post('/save', async (req, res) => {
  try {
    const service = container.resolve(FilterPresetService);
    
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
    const service = container.resolve(FilterPresetService);
    
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
    const service = container.resolve(FilterPresetService);
    
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
    const service = container.resolve(FilterPresetService);
    
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
    const service = container.resolve(FilterPresetService);
    
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
    const service = container.resolve(FilterPresetService);
    
    await service.deletePreset(req.params.name);
    res.json({ success: true, message: 'Preset deleted successfully' });
  } catch (error: any) {
    console.error('Error deleting preset:', error);
    res.json({ success: false, error: error.message });
  }
});

export default router;
