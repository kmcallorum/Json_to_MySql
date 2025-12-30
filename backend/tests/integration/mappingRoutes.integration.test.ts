import { describe, it, expect, beforeAll, afterAll, jest } from '@jest/globals';
import request from 'supertest';
import express from 'express';
import mappingRoutes from '../../src/routes/mappingRoutes.js';
import { container } from 'tsyringe';
import { MappingConfigService } from '../../src/services/mappingConfigService.js';
import { ExecutionService } from '../../src/services/executionService.js';
import { DatabaseConnection } from '../../src/database/connection.js';

// Create test Express app
const app = express();
app.use(express.json());
app.use('/api/mappings', mappingRoutes);

describe('Mapping Routes Integration Tests', () => {
  let mockDb: jest.Mocked<DatabaseConnection>;
  let mockMappingService: jest.Mocked<MappingConfigService>;
  let mockExecutionService: jest.Mocked<ExecutionService>;

  beforeAll(() => {
    // Mock the database connection
    mockDb = {
      query: jest.fn() as any,
      rawQuery: jest.fn() as any,
      close: jest.fn() as any
    } as any;

    // Mock services
    mockMappingService = {
      saveConfig: jest.fn() as any,
      loadConfig: jest.fn() as any,
      listConfigs: jest.fn() as any,
      deleteConfig: jest.fn() as any
    } as any;

    mockExecutionService = {
      createTables: jest.fn() as any,
      flattenRecords: jest.fn() as any
    } as any;

    // Register mocks in container
    container.registerInstance(DatabaseConnection, mockDb);
    container.registerInstance(MappingConfigService, mockMappingService);
    container.registerInstance(ExecutionService, mockExecutionService);
  });

  afterAll(() => {
    // Clear container
    container.clearInstances();
  });

  describe('POST /api/mappings/save', () => {
    it('should save a mapping configuration successfully', async () => {
      const mockConfig = {
        id: 1,
        name: 'test_config',
        description: 'Test config',
        baseTableName: 'test_table',
        whereConditions: [],
        tables: [{ name: 'events', columns: [] }],
        mappings: [{ sourcePath: 'field1', targetTable: 'events', targetColumn: 'col1' }],
        createdAt: new Date(),
        updatedAt: new Date()
      };

      mockMappingService.saveConfig.mockResolvedValue(mockConfig);

      const response = await request(app)
        .post('/api/mappings/save')
        .send(mockConfig);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.config.name).toBe('test_config');
      expect(mockMappingService.saveConfig).toHaveBeenCalled();
    });

    it('should handle save errors gracefully', async () => {
      mockMappingService.saveConfig.mockRejectedValue(new Error('Save failed'));

      const response = await request(app)
        .post('/api/mappings/save')
        .send({ name: 'test', baseTableName: 'table', whereConditions: [], tables: [], mappings: [] });

      expect(response.status).toBe(500);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Save failed');
    });
  });

  describe('GET /api/mappings/list', () => {
    it('should list all mapping configurations', async () => {
      const mockConfigs = [
        {
          id: 1,
          name: 'config1',
          description: 'First',
          baseTableName: 'table1',
          whereConditions: [],
          tables: [],
          mappings: [],
          createdAt: new Date(),
          updatedAt: new Date()
        }
      ];

      mockMappingService.listConfigs.mockResolvedValue(mockConfigs);

      const response = await request(app)
        .get('/api/mappings/list');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.configs).toHaveLength(1);
    });
  });

  describe('GET /api/mappings/load/:name', () => {
    it('should load a specific configuration', async () => {
      const mockConfig = {
        id: 1,
        name: 'test_config',
        description: 'Test',
        baseTableName: 'test_table',
        whereConditions: [],
        tables: [],
        mappings: [],
        createdAt: new Date(),
        updatedAt: new Date()
      };

      mockMappingService.loadConfig.mockResolvedValue(mockConfig);

      const response = await request(app)
        .get('/api/mappings/load/test_config');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.config.name).toBe('test_config');
    });

    it('should return 404 when config not found', async () => {
      mockMappingService.loadConfig.mockResolvedValue(null);

      const response = await request(app)
        .get('/api/mappings/load/nonexistent');

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
    });
  });

  describe('DELETE /api/mappings/:name', () => {
    it('should delete a configuration successfully', async () => {
      mockMappingService.deleteConfig.mockResolvedValue(undefined);

      const response = await request(app)
        .delete('/api/mappings/test_config');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });
  });

  describe('POST /api/mappings/execute', () => {
    it('should execute flattening successfully', async () => {
      mockExecutionService.createTables.mockResolvedValue(['events', 'logs']);
      mockExecutionService.flattenRecords.mockResolvedValue({ processed: 10, moved: 10 });

      const response = await request(app)
        .post('/api/mappings/execute')
        .send({
          baseTableName: 'test_table',
          tables: [{ name: 'events', columns: [], isNew: true }],
          mappings: [],
          whereConditions: [],
          relationships: []
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.tablesCreated).toEqual(['events', 'logs']);
      expect(response.body.recordsProcessed).toBe(10);
      expect(response.body.recordsMoved).toBe(10);
      expect(mockExecutionService.createTables).toHaveBeenCalled();
      expect(mockExecutionService.flattenRecords).toHaveBeenCalled();
    });

    it('should handle execution errors', async () => {
      mockExecutionService.createTables.mockRejectedValue(new Error('Execution failed'));

      const response = await request(app)
        .post('/api/mappings/execute')
        .send({
          baseTableName: 'test_table',
          tables: [],
          mappings: [],
          whereConditions: [],
          relationships: []
        });

      expect(response.status).toBe(500);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Execution failed');
    });
  });
});
