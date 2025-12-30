import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { MappingConfigService } from '../../../src/services/mappingConfigService.js';
import { DatabaseConnection } from '../../../src/database/connection.js';

jest.mock('../../../src/database/connection.js');

describe('MappingConfigService', () => {
  let service: MappingConfigService;
  let mockDb: jest.Mocked<DatabaseConnection>;

  beforeEach(() => {
    mockDb = {
      query: jest.fn(),
      rawQuery: jest.fn(),
      close: jest.fn()
    } as any;

    service = new MappingConfigService(mockDb);
  });

  describe('saveConfig', () => {
    it('should save a new config', async () => {
      const config = {
        name: 'test_config',
        description: 'Test config',
        baseTableName: 'test_table',
        whereConditions: [],
        tables: [{ name: 'table1' }],
        mappings: [{ source: 'field1', target: 'col1' }],
        fields: [{ path: 'test.field' }],
        relationships: []
      };

      const mockSavedConfig = {
        ...config,
        id: 1,
        where_conditions: '[]',
        base_table_name: 'test_table',
        tables: JSON.stringify(config.tables),
        mappings: JSON.stringify(config.mappings),
        fields: JSON.stringify(config.fields),
        relationships: '[]',
        created_at: new Date(),
        updated_at: new Date()
      };

      mockDb.query
        .mockResolvedValueOnce([]) // INSERT
        .mockResolvedValueOnce([mockSavedConfig]); // SELECT

      const result = await service.saveConfig(config);

      expect(mockDb.query).toHaveBeenCalledTimes(2);
      expect(result.name).toBe('test_config');
      expect(result.tables).toHaveLength(1);
    });

    it('should save config without optional fields', async () => {
      const config = {
        name: 'minimal_config',
        baseTableName: 'test_table',
        whereConditions: [],
        tables: [],
        mappings: []
      };

      const mockSavedConfig = {
        ...config,
        id: 1,
        description: null,
        base_table_name: 'test_table',
        where_conditions: '[]',
        tables: '[]',
        mappings: '[]',
        fields: '[]',
        relationships: '[]',
        created_at: new Date(),
        updated_at: new Date()
      };

      mockDb.query
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([mockSavedConfig]);

      const result = await service.saveConfig(config);

      expect(result.name).toBe('minimal_config');
      // Database returns null for NULL columns
      expect(result.description).toBeNull();
    });

    it('should handle config without whereConditions', async () => {
      const config: any = {
        name: 'no_where_config',
        baseTableName: 'test_table',
        tables: [],
        mappings: []
        // whereConditions is undefined - will be handled by || []
      };

      const mockSavedConfig = {
        ...config,
        id: 1,
        description: null,
        base_table_name: 'test_table',
        where_conditions: '[]',  // Should default to []
        tables: '[]',
        mappings: '[]',
        fields: '[]',
        relationships: '[]',
        created_at: new Date(),
        updated_at: new Date()
      };

      mockDb.query
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([mockSavedConfig]);

      const result = await service.saveConfig(config);

      expect(result.name).toBe('no_where_config');
      expect(result.whereConditions).toEqual([]);
    });
  });

  describe('loadConfig', () => {
    it('should load an existing config', async () => {
      const mockRow = {
        id: 1,
        name: 'test_config',
        description: 'Test',
        base_table_name: 'test_table',
        where_conditions: '[]',
        tables: '[{"name":"table1"}]',
        mappings: '[{"source":"field1"}]',
        fields: '[{"path":"test.field"}]',
        relationships: '[]',
        created_at: new Date(),
        updated_at: new Date()
      };

      mockDb.query.mockResolvedValue([mockRow]);

      const result = await service.loadConfig('test_config');

      expect(result).not.toBeNull();
      expect(result?.name).toBe('test_config');
      expect(result?.tables).toHaveLength(1);
      expect(result?.mappings).toHaveLength(1);
      expect(result?.fields).toHaveLength(1);
    });

    it('should return null when config not found', async () => {
      mockDb.query.mockResolvedValue([]);

      const result = await service.loadConfig('nonexistent');

      expect(result).toBeNull();
    });

    it('should handle already-parsed JSON objects', async () => {
      const mockRow = {
        id: 1,
        name: 'test_config',
        description: 'Test',
        base_table_name: 'test_table',
        where_conditions: [],
        tables: [{ name: 'table1' }],
        mappings: [{ source: 'field1' }],
        fields: [{ path: 'test.field' }],
        relationships: [],
        created_at: new Date(),
        updated_at: new Date()
      };

      mockDb.query.mockResolvedValue([mockRow]);

      const result = await service.loadConfig('test_config');

      expect(result?.tables).toHaveLength(1);
      expect(result?.mappings).toHaveLength(1);
    });

    it('should handle invalid JSON gracefully', async () => {
      const mockRow = {
        id: 1,
        name: 'test_config',
        description: 'Test',
        base_table_name: 'test_table',
        where_conditions: 'invalid{json',
        tables: 'invalid{json',
        mappings: '["valid"]',
        fields: null,
        relationships: undefined,
        created_at: new Date(),
        updated_at: new Date()
      };

      mockDb.query.mockResolvedValue([mockRow]);

      const result = await service.loadConfig('test_config');

      // Invalid JSON strings should be returned as-is per parseJSON implementation
      expect(result?.whereConditions).toBe('invalid{json');
      expect(result?.tables).toBe('invalid{json');
      // Valid JSON string should be parsed to array
      expect(Array.isArray(result?.mappings)).toBe(true);
      expect(result?.mappings).toEqual(['valid']);
      // Null/undefined should stay as-is
      expect(result?.fields).toBeNull();
      expect(result?.relationships).toBeUndefined();
    });
  });

  describe('listConfigs', () => {
    it('should return all configs', async () => {
      const mockRows = [
        {
          id: 1,
          name: 'config1',
          description: 'First',
          base_table_name: 'table1',
          where_conditions: '[]',
          tables: '[]',
          mappings: '[]',
          fields: '[]',
          relationships: '[]',
          created_at: new Date(),
          updated_at: new Date()
        },
        {
          id: 2,
          name: 'config2',
          description: 'Second',
          base_table_name: 'table2',
          where_conditions: '[]',
          tables: '[]',
          mappings: '[]',
          fields: '[]',
          relationships: '[]',
          created_at: new Date(),
          updated_at: new Date()
        }
      ];

      mockDb.query.mockResolvedValue(mockRows);

      const result = await service.listConfigs();

      expect(result).toHaveLength(2);
      expect(result[0].name).toBe('config1');
      expect(result[1].name).toBe('config2');
    });

    it('should return empty array when no configs exist', async () => {
      mockDb.query.mockResolvedValue([]);

      const result = await service.listConfigs();

      expect(result).toEqual([]);
    });

    it('should parse all JSON fields in list', async () => {
      const mockRows = [
        {
          id: 1,
          name: 'config1',
          description: 'Test',
          base_table_name: 'table1',
          where_conditions: '[{"field":"x"}]',
          tables: '[{"name":"t1"}]',
          mappings: '[{"src":"a"}]',
          fields: '[{"path":"p"}]',
          relationships: '[{"rel":"r"}]',
          created_at: new Date(),
          updated_at: new Date()
        }
      ];

      mockDb.query.mockResolvedValue(mockRows);

      const result = await service.listConfigs();

      expect(result[0].whereConditions).toHaveLength(1);
      expect(result[0].tables).toHaveLength(1);
      expect(result[0].mappings).toHaveLength(1);
      expect(result[0].fields).toHaveLength(1);
      expect(result[0].relationships).toHaveLength(1);
    });
  });

  describe('deleteConfig', () => {
    it('should delete a config', async () => {
      mockDb.query.mockResolvedValue([]);

      await service.deleteConfig('test_config');

      expect(mockDb.query).toHaveBeenCalledWith(
        'DELETE FROM mapping_configs WHERE name = ?',
        ['test_config']
      );
    });
  });
});
