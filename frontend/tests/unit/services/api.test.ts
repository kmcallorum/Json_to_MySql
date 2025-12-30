import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { api } from '../../../src/services/api';

// Mock global fetch
global.fetch = jest.fn();

describe('API Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('testConnection', () => {
    it('should test connection with credentials', async () => {
      const mockResponse = { success: true, message: 'Connected' };
      (global.fetch as jest.Mock).mockResolvedValue({
        json: async () => mockResponse
      });

      const credentials = {
        host: 'localhost',
        port: 3306,
        user: 'root',
        password: 'password',
        database: 'testdb'
      };

      const result = await api.testConnection(credentials);

      expect(result).toEqual(mockResponse);
      expect(global.fetch).toHaveBeenCalledWith(
        'http://localhost:3001/api/analysis/test-connection',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(credentials)
        }
      );
    });

    it('should test connection without credentials', async () => {
      const mockResponse = { success: true };
      (global.fetch as jest.Mock).mockResolvedValue({
        json: async () => mockResponse
      });

      const result = await api.testConnection();

      expect(result).toEqual(mockResponse);
      expect(global.fetch).toHaveBeenCalled();
    });
  });

  describe('discoverFields', () => {
    it('should discover fields with custom sample size', async () => {
      const mockResponse = { success: true, fields: [] };
      (global.fetch as jest.Mock).mockResolvedValue({
        json: async () => mockResponse
      });

      const result = await api.discoverFields('test_table', 500);

      expect(result).toEqual(mockResponse);
      expect(global.fetch).toHaveBeenCalledWith(
        'http://localhost:3001/api/analysis/discover-fields',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ baseTableName: 'test_table', sampleSize: 500 })
        }
      );
    });

    it('should use default sample size of 1000', async () => {
      const mockResponse = { success: true, fields: [] };
      (global.fetch as jest.Mock).mockResolvedValue({
        json: async () => mockResponse
      });

      await api.discoverFields('test_table');

      const callArgs = (global.fetch as jest.Mock).mock.calls[0];
      const body = JSON.parse(callArgs[1].body);
      expect(body.sampleSize).toBe(1000);
    });
  });

  describe('analyze', () => {
    it('should analyze with request data', async () => {
      const mockResponse = { success: true, analysis: {} };
      (global.fetch as jest.Mock).mockResolvedValue({
        json: async () => mockResponse
      });

      const request = {
        baseTableName: 'test_table',
        sampleSize: 100,
        whereConditions: [{ field: 'status', operator: '=', value: 'active' }]
      };

      const result = await api.analyze(request);

      expect(result).toEqual(mockResponse);
      expect(global.fetch).toHaveBeenCalledWith(
        'http://localhost:3001/api/analysis/analyze',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(request)
        }
      );
    });
  });

  describe('getTableList', () => {
    it('should get list of tables', async () => {
      const mockResponse = { success: true, tables: ['users', 'posts'] };
      (global.fetch as jest.Mock).mockResolvedValue({
        json: async () => mockResponse
      });

      const result = await api.getTableList();

      expect(result).toEqual(mockResponse);
      expect(global.fetch).toHaveBeenCalledWith(
        'http://localhost:3001/api/tables/list',
        {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' }
        }
      );
    });
  });

  describe('getTableStructures', () => {
    it('should get table structures for multiple tables', async () => {
      const mockResponse = { success: true, tables: [] };
      (global.fetch as jest.Mock).mockResolvedValue({
        json: async () => mockResponse
      });

      const tableNames = ['users', 'posts', 'comments'];
      const result = await api.getTableStructures(tableNames);

      expect(result).toEqual(mockResponse);
      expect(global.fetch).toHaveBeenCalledWith(
        'http://localhost:3001/api/tables/structures',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ tableNames })
        }
      );
    });
  });

  describe('saveMappingConfig', () => {
    it('should save mapping configuration', async () => {
      const mockResponse = { success: true, message: 'Saved' };
      (global.fetch as jest.Mock).mockResolvedValue({
        json: async () => mockResponse
      });

      const config = {
        name: 'test_mapping',
        description: 'Test mapping',
        baseTableName: 'test_table',
        whereConditions: [],
        tables: [],
        mappings: [],
        fields: [],
        relationships: []
      };

      const result = await api.saveMappingConfig(config);

      expect(result).toEqual(mockResponse);
      expect(global.fetch).toHaveBeenCalledWith(
        'http://localhost:3001/api/mappings/save',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(config)
        }
      );
    });
  });

  describe('loadMappingConfig', () => {
    it('should load mapping configuration', async () => {
      const mockResponse = { success: true, config: {} };
      (global.fetch as jest.Mock).mockResolvedValue({
        json: async () => mockResponse
      });

      const result = await api.loadMappingConfig('test_mapping');

      expect(result).toEqual(mockResponse);
      expect(global.fetch).toHaveBeenCalledWith(
        'http://localhost:3001/api/mappings/load/test_mapping',
        {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' }
        }
      );
    });

    it('should encode special characters in mapping name', async () => {
      const mockResponse = { success: true, config: {} };
      (global.fetch as jest.Mock).mockResolvedValue({
        json: async () => mockResponse
      });

      await api.loadMappingConfig('test mapping with spaces');

      const callArgs = (global.fetch as jest.Mock).mock.calls[0];
      expect(callArgs[0]).toContain('test%20mapping%20with%20spaces');
    });
  });

  describe('listMappingConfigs', () => {
    it('should list all mapping configurations', async () => {
      const mockResponse = { success: true, configs: [] };
      (global.fetch as jest.Mock).mockResolvedValue({
        json: async () => mockResponse
      });

      const result = await api.listMappingConfigs();

      expect(result).toEqual(mockResponse);
      expect(global.fetch).toHaveBeenCalledWith(
        'http://localhost:3001/api/mappings/list',
        {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' }
        }
      );
    });
  });

  describe('findMappingsByTables', () => {
    it('should find mappings by table names', async () => {
      const mockResponse = { success: true, mappings: [] };
      (global.fetch as jest.Mock).mockResolvedValue({
        json: async () => mockResponse
      });

      const tableNames = ['users', 'posts'];
      const result = await api.findMappingsByTables(tableNames);

      expect(result).toEqual(mockResponse);
      expect(global.fetch).toHaveBeenCalledWith(
        'http://localhost:3001/api/mappings/find-by-tables',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ tableNames, baseTableName: undefined })
        }
      );
    });

    it('should find mappings with base table name', async () => {
      const mockResponse = { success: true, mappings: [] };
      (global.fetch as jest.Mock).mockResolvedValue({
        json: async () => mockResponse
      });

      const tableNames = ['users'];
      const baseTableName = 'test_table';
      const result = await api.findMappingsByTables(tableNames, baseTableName);

      expect(result).toEqual(mockResponse);
      const callArgs = (global.fetch as jest.Mock).mock.calls[0];
      const body = JSON.parse(callArgs[1].body);
      expect(body.baseTableName).toBe(baseTableName);
    });
  });

  describe('deleteMappingConfig', () => {
    it('should delete mapping configuration', async () => {
      const mockResponse = { success: true, message: 'Deleted' };
      (global.fetch as jest.Mock).mockResolvedValue({
        json: async () => mockResponse
      });

      const result = await api.deleteMappingConfig('test_mapping');

      expect(result).toEqual(mockResponse);
      expect(global.fetch).toHaveBeenCalledWith(
        'http://localhost:3001/api/mappings/test_mapping',
        {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' }
        }
      );
    });

    it('should encode special characters in mapping name for delete', async () => {
      const mockResponse = { success: true };
      (global.fetch as jest.Mock).mockResolvedValue({
        json: async () => mockResponse
      });

      await api.deleteMappingConfig('test/mapping');

      const callArgs = (global.fetch as jest.Mock).mock.calls[0];
      expect(callArgs[0]).toContain('test%2Fmapping');
    });
  });

  describe('saveFilterPreset', () => {
    it('should save filter preset', async () => {
      const mockResponse = { success: true, message: 'Saved' };
      (global.fetch as jest.Mock).mockResolvedValue({
        json: async () => mockResponse
      });

      const preset = {
        name: 'active_users',
        description: 'Filter for active users',
        baseTableName: 'users',
        whereConditions: [{ field: 'status', operator: '=', value: 'active' }]
      };

      const result = await api.saveFilterPreset(preset);

      expect(result).toEqual(mockResponse);
      expect(global.fetch).toHaveBeenCalledWith(
        'http://localhost:3001/api/filters/save',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(preset)
        }
      );
    });
  });

  describe('loadFilterPreset', () => {
    it('should load filter preset', async () => {
      const mockResponse = { success: true, preset: {} };
      (global.fetch as jest.Mock).mockResolvedValue({
        json: async () => mockResponse
      });

      const result = await api.loadFilterPreset('active_users');

      expect(result).toEqual(mockResponse);
      expect(global.fetch).toHaveBeenCalledWith(
        'http://localhost:3001/api/filters/load/active_users',
        {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' }
        }
      );
    });
  });

  describe('listFilterPresets', () => {
    it('should list all filter presets without base table name', async () => {
      const mockResponse = { success: true, presets: [] };
      (global.fetch as jest.Mock).mockResolvedValue({
        json: async () => mockResponse
      });

      const result = await api.listFilterPresets();

      expect(result).toEqual(mockResponse);
      expect(global.fetch).toHaveBeenCalledWith(
        'http://localhost:3001/api/filters/list',
        {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' }
        }
      );
    });

    it('should list filter presets with base table name filter', async () => {
      const mockResponse = { success: true, presets: [] };
      (global.fetch as jest.Mock).mockResolvedValue({
        json: async () => mockResponse
      });

      const result = await api.listFilterPresets('users');

      expect(result).toEqual(mockResponse);
      const callArgs = (global.fetch as jest.Mock).mock.calls[0];
      expect(callArgs[0]).toBe('http://localhost:3001/api/filters/list?baseTableName=users');
    });

    it('should encode special characters in base table name', async () => {
      const mockResponse = { success: true, presets: [] };
      (global.fetch as jest.Mock).mockResolvedValue({
        json: async () => mockResponse
      });

      await api.listFilterPresets('test table');

      const callArgs = (global.fetch as jest.Mock).mock.calls[0];
      expect(callArgs[0]).toContain('test%20table');
    });
  });

  describe('deleteFilterPreset', () => {
    it('should delete filter preset', async () => {
      const mockResponse = { success: true, message: 'Deleted' };
      (global.fetch as jest.Mock).mockResolvedValue({
        json: async () => mockResponse
      });

      const result = await api.deleteFilterPreset('active_users');

      expect(result).toEqual(mockResponse);
      expect(global.fetch).toHaveBeenCalledWith(
        'http://localhost:3001/api/filters/active_users',
        {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' }
        }
      );
    });
  });

  describe('executeFlattening', () => {
    it('should execute flattening operation', async () => {
      const mockResponse = { success: true, message: 'Executed' };
      (global.fetch as jest.Mock).mockResolvedValue({
        json: async () => mockResponse
      });

      const data = {
        baseTableName: 'test_table',
        tables: [],
        mappings: [],
        whereConditions: [],
        relationships: [],
        batchSize: 100
      };

      const result = await api.executeFlattening(data);

      expect(result).toEqual(mockResponse);
      expect(global.fetch).toHaveBeenCalledWith(
        'http://localhost:3001/api/mappings/execute',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data)
        }
      );
    });

    it('should execute flattening without optional fields', async () => {
      const mockResponse = { success: true };
      (global.fetch as jest.Mock).mockResolvedValue({
        json: async () => mockResponse
      });

      const data = {
        baseTableName: 'test_table',
        tables: [],
        mappings: [],
        whereConditions: []
      };

      const result = await api.executeFlattening(data);

      expect(result).toEqual(mockResponse);
      const callArgs = (global.fetch as jest.Mock).mock.calls[0];
      const body = JSON.parse(callArgs[1].body);
      expect(body.relationships).toBeUndefined();
      expect(body.batchSize).toBeUndefined();
    });
  });
});
