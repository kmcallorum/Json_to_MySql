import { describe, it, expect, beforeAll, afterAll, jest } from '@jest/globals';
import request from 'supertest';
import express from 'express';
import filterRoutes from '../../src/routes/filterRoutes.js';
import { container } from 'tsyringe';
import { FilterPresetService } from '../../src/services/filterPresetService.js';
import { DatabaseConnection } from '../../src/database/connection.js';

// Create test Express app
const app = express();
app.use(express.json());
app.use('/api/filters', filterRoutes);

describe('Filter Routes Integration Tests', () => {
  let mockDb: jest.Mocked<DatabaseConnection>;
  let mockService: jest.Mocked<FilterPresetService>;

  beforeAll(() => {
    // Mock the database connection
    mockDb = {
      query: jest.fn() as any,
      rawQuery: jest.fn() as any,
      close: jest.fn() as any
    } as any;

    // Mock the service
    mockService = {
      savePreset: jest.fn() as any,
      loadPreset: jest.fn() as any,
      listPresets: jest.fn() as any,
      deletePreset: jest.fn() as any
    } as any;

    // Register mocks in container
    container.registerInstance(DatabaseConnection, mockDb);
    container.registerInstance(FilterPresetService, mockService);
  });

  afterAll(() => {
    // Clear container
    container.clearInstances();
  });

  describe('POST /api/filters/save', () => {
    it('should save a filter preset successfully', async () => {
      const mockPreset = {
        id: 1,
        name: 'test_preset',
        description: 'Test preset',
        baseTableName: 'test_table',
        whereConditions: [{ field: 'status', operator: '=', value: 'active' }],
        createdAt: new Date(),
        updatedAt: new Date()
      };

      mockService.savePreset.mockResolvedValue(mockPreset);

      const response = await request(app)
        .post('/api/filters/save')
        .send({
          name: 'test_preset',
          description: 'Test preset',
          baseTableName: 'test_table',
          whereConditions: [{ field: 'status', operator: '=', value: 'active' }]
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.preset.name).toBe('test_preset');
      expect(mockService.savePreset).toHaveBeenCalledWith(
        'test_preset',
        'test_table',
        [{ field: 'status', operator: '=', value: 'active' }],
        'Test preset'
      );
    });

    it('should handle save errors gracefully', async () => {
      mockService.savePreset.mockRejectedValue(new Error('Database error'));

      const response = await request(app)
        .post('/api/filters/save')
        .send({
          name: 'test_preset',
          baseTableName: 'test_table',
          whereConditions: []
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Database error');
    });
  });

  describe('GET /api/filters/list', () => {
    it('should list all filter presets', async () => {
      const mockPresets = [
        {
          id: 1,
          name: 'preset1',
          description: 'First preset',
          baseTableName: 'table1',
          whereConditions: [],
          createdAt: new Date(),
          updatedAt: new Date()
        },
        {
          id: 2,
          name: 'preset2',
          description: 'Second preset',
          baseTableName: 'table2',
          whereConditions: [],
          createdAt: new Date(),
          updatedAt: new Date()
        }
      ];

      mockService.listPresets.mockResolvedValue(mockPresets);

      const response = await request(app)
        .get('/api/filters/list');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.presets).toHaveLength(2);
      expect(response.body.presets[0].name).toBe('preset1');
    });

    it('should return empty array when no presets exist', async () => {
      mockService.listPresets.mockResolvedValue([]);

      const response = await request(app)
        .get('/api/filters/list');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.presets).toEqual([]);
    });
  });

  describe('GET /api/filters/load/:name', () => {
    it('should load a specific preset by name', async () => {
      const mockPreset = {
        id: 1,
        name: 'test_preset',
        description: 'Test',
        baseTableName: 'test_table',
        whereConditions: [{ field: 'x', operator: '=', value: 'y' }],
        createdAt: new Date(),
        updatedAt: new Date()
      };

      mockService.loadPreset.mockResolvedValue(mockPreset);

      const response = await request(app)
        .get('/api/filters/load/test_preset');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.preset.name).toBe('test_preset');
      expect(mockService.loadPreset).toHaveBeenCalledWith('test_preset');
    });

    it('should return 404 when preset not found', async () => {
      mockService.loadPreset.mockResolvedValue(null);

      const response = await request(app)
        .get('/api/filters/load/nonexistent');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('not found');
    });
  });

  describe('DELETE /api/filters/:name', () => {
    it('should delete a preset successfully', async () => {
      mockService.deletePreset.mockResolvedValue(undefined);

      const response = await request(app)
        .delete('/api/filters/test_preset');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain('deleted successfully');
      expect(mockService.deletePreset).toHaveBeenCalledWith('test_preset');
    });

    it('should handle delete errors', async () => {
      mockService.deletePreset.mockRejectedValue(new Error('Delete failed'));

      const response = await request(app)
        .delete('/api/filters/test_preset');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Delete failed');
    });
  });
});
