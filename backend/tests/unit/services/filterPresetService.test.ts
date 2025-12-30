import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { FilterPresetService } from '../../../src/services/filterPresetService.js';
import { DatabaseConnection } from '../../../src/database/connection.js';

// Mock the DatabaseConnection
jest.mock('../../../src/database/connection.js');

describe('FilterPresetService', () => {
  let service: FilterPresetService;
  let mockDb: jest.Mocked<DatabaseConnection>;

  beforeEach(() => {
    mockDb = {
      query: jest.fn(),
      rawQuery: jest.fn(),
      close: jest.fn()
    } as any;

    service = new FilterPresetService(mockDb);
  });

  describe('savePreset', () => {
    it('should save a new preset', async () => {
      const mockSavedPreset = {
        id: 1,
        name: 'test_preset',
        description: 'Test description',
        base_table_name: 'test_table',
        where_conditions: JSON.stringify([{ field: 'status', operator: '=', value: 'active' }]),
        created_at: new Date(),
        updated_at: new Date()
      };

      mockDb.query
        .mockResolvedValueOnce([]) // INSERT response
        .mockResolvedValueOnce([mockSavedPreset]); // SELECT response from loadPreset

      const result = await service.savePreset(
        'test_preset',
        'test_table',
        [{ field: 'status', operator: '=', value: 'active' }],
        'Test description'
      );

      expect(mockDb.query).toHaveBeenCalledTimes(2);
      expect(result.name).toBe('test_preset');
      expect(result.baseTableName).toBe('test_table');
    });

    it('should save preset without description', async () => {
      const mockSavedPreset = {
        id: 1,
        name: 'test_preset',
        description: null,
        base_table_name: 'test_table',
        where_conditions: '[]',
        created_at: new Date(),
        updated_at: new Date()
      };

      mockDb.query
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([mockSavedPreset]);

      const result = await service.savePreset('test_preset', 'test_table', []);

      // Database returns null for NULL columns
      expect(result.description).toBeNull();
    });
  });

  describe('loadPreset', () => {
    it('should load an existing preset', async () => {
      const mockRow = {
        id: 1,
        name: 'test_preset',
        description: 'Test',
        base_table_name: 'test_table',
        where_conditions: '[{"field":"status","operator":"=","value":"active"}]',
        created_at: new Date(),
        updated_at: new Date()
      };

      mockDb.query.mockResolvedValue([mockRow]);

      const result = await service.loadPreset('test_preset');

      expect(result).not.toBeNull();
      expect(result?.name).toBe('test_preset');
      expect(result?.whereConditions).toHaveLength(1);
    });

    it('should return null when preset not found', async () => {
      mockDb.query.mockResolvedValue([]);

      const result = await service.loadPreset('nonexistent');

      expect(result).toBeNull();
    });

    it('should handle JSON object in where_conditions', async () => {
      const mockRow = {
        id: 1,
        name: 'test_preset',
        description: 'Test',
        base_table_name: 'test_table',
        where_conditions: [{ field: 'status', operator: '=', value: 'active' }], // Already an object
        created_at: new Date(),
        updated_at: new Date()
      };

      mockDb.query.mockResolvedValue([mockRow]);

      const result = await service.loadPreset('test_preset');

      expect(result?.whereConditions).toHaveLength(1);
      expect(result?.whereConditions[0].field).toBe('status');
    });

    it('should handle null where_conditions', async () => {
      const mockRow = {
        id: 1,
        name: 'test_preset',
        description: 'Test',
        base_table_name: 'test_table',
        where_conditions: null,
        created_at: new Date(),
        updated_at: new Date()
      };

      mockDb.query.mockResolvedValue([mockRow]);

      const result = await service.loadPreset('test_preset');

      expect(result?.whereConditions).toEqual([]);
    });

    it('should handle invalid JSON in where_conditions', async () => {
      const mockRow = {
        id: 1,
        name: 'test_preset',
        description: 'Test',
        base_table_name: 'test_table',
        where_conditions: 'invalid json{',
        created_at: new Date(),
        updated_at: new Date()
      };

      mockDb.query.mockResolvedValue([mockRow]);

      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

      const result = await service.loadPreset('test_preset');

      expect(result?.whereConditions).toEqual([]);
        expect(consoleSpy).toHaveBeenCalled();

      consoleSpy.mockRestore();
    });

    it('should handle non-standard types in where_conditions', async () => {
      const mockRow = {
        id: 1,
        name: 'test_preset',
        description: 'Test',
        base_table_name: 'test_table',
        where_conditions: 123,  // Number instead of string/object/array
        created_at: new Date(),
        updated_at: new Date()
      };

      mockDb.query.mockResolvedValue([mockRow]);

      const result = await service.loadPreset('test_preset');

      // Should fallback to empty array for non-standard types
      expect(result?.whereConditions).toEqual([]);
    });
  });

  describe('listPresets', () => {
    it('should return all presets', async () => {
      const mockRows = [
        {
          id: 1,
          name: 'preset1',
          description: 'First',
          base_table_name: 'table1',
          where_conditions: '[]',
          created_at: new Date(),
          updated_at: new Date()
        },
        {
          id: 2,
          name: 'preset2',
          description: 'Second',
          base_table_name: 'table2',
          where_conditions: '[]',
          created_at: new Date(),
          updated_at: new Date()
        }
      ];

      mockDb.query.mockResolvedValue(mockRows);

      const result = await service.listPresets();

      expect(result).toHaveLength(2);
      expect(result[0].name).toBe('preset1');
      expect(result[1].name).toBe('preset2');
    });

    it('should return empty array when no presets exist', async () => {
      mockDb.query.mockResolvedValue([]);

      const result = await service.listPresets();

      expect(result).toEqual([]);
    });

    it('should handle presets with various where_conditions formats', async () => {
      const mockRows = [
        {
          id: 1,
          name: 'preset1',
          description: 'String JSON',
          base_table_name: 'table1',
          where_conditions: '[{"field":"x"}]',
          created_at: new Date(),
          updated_at: new Date()
        },
        {
          id: 2,
          name: 'preset2',
          description: 'Object',
          base_table_name: 'table2',
          where_conditions: [{ field: 'y' }],
          created_at: new Date(),
          updated_at: new Date()
        },
        {
          id: 3,
          name: 'preset3',
          description: 'Null',
          base_table_name: 'table3',
          where_conditions: null,
          created_at: new Date(),
          updated_at: new Date()
        }
      ];

      mockDb.query.mockResolvedValue(mockRows);

      const result = await service.listPresets();

      expect(result).toHaveLength(3);
      expect(result[0].whereConditions).toHaveLength(1);
      expect(result[1].whereConditions).toHaveLength(1);
      expect(result[2].whereConditions).toEqual([]);
    });
  });

  describe('deletePreset', () => {
    it('should delete a preset', async () => {
      mockDb.query.mockResolvedValue([]);

      await service.deletePreset('test_preset');

      expect(mockDb.query).toHaveBeenCalledWith(
        'DELETE FROM filter_presets WHERE name = ?',
        ['test_preset']
      );
    });
  });
});
