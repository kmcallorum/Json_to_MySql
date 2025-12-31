import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { AnalysisService } from '../../../src/services/analysisService.js';
import { DatabaseConnection } from '../../../src/database/connection.js';

jest.mock('../../../src/database/connection.js');

describe('AnalysisService', () => {
  let service: AnalysisService;
  let mockDb: jest.Mocked<DatabaseConnection>;

  beforeEach(() => {
    mockDb = {
      query: jest.fn(),
      rawQuery: jest.fn(),
      close: jest.fn()
    } as any;

    service = new AnalysisService(mockDb);
    jest.clearAllMocks();
  });

  // NOTE: testConnection() is tested in integration tests since it creates its own DB connection
  // which cannot be easily mocked in unit tests

  describe('discoverFields', () => {
    it('should discover fields from JSON content', async () => {
      const mockRecords = [
        {
          content: JSON.stringify({
            _source: {
              type: 'event.test',
              status: 'success',
              timestamp: 1640000000
            }
          })
        },
        {
          content: JSON.stringify({
            _source: {
              type: 'event.run',
              status: 'failed',
              timestamp: 1640100000
            }
          })
        }
      ];

      mockDb.rawQuery.mockResolvedValue(mockRecords);

      const result = await service.discoverFields('test_table', 1000);

      expect(result.tableName).toBe('test_table');
      expect(result.sampleSize).toBe(2);
      expect(result.fields.length).toBeGreaterThan(0);

      // Check that fields are discovered
      const typeField = result.fields.find(f => f.path === '_source.type');
      expect(typeField).toBeDefined();
      expect(typeField?.uniqueValues).toContain('event.test');
      expect(typeField?.uniqueValues).toContain('event.run');
      expect(typeField?.totalCount).toBe(2);
      expect(typeField?.nullCount).toBe(0);
    });

    it('should handle already parsed JSON objects', async () => {
      const mockRecords = [
        {
          content: {
            name: 'Alice',
            age: 30
          }
        }
      ];

      mockDb.rawQuery.mockResolvedValue(mockRecords);

      const result = await service.discoverFields('users', 100);

      expect(result.fields.length).toBe(2);
      const nameField = result.fields.find(f => f.path === 'name');
      expect(nameField?.uniqueValues).toContain('Alice');
    });

    it('should handle nested objects', async () => {
      const mockRecords = [
        {
          content: JSON.stringify({
            user: {
              profile: {
                name: 'John',
                email: 'john@example.com'
              }
            }
          })
        }
      ];

      mockDb.rawQuery.mockResolvedValue(mockRecords);

      const result = await service.discoverFields('test_table');

      const nestedField = result.fields.find(f => f.path === 'user.profile.name');
      expect(nestedField).toBeDefined();
      expect(nestedField?.uniqueValues).toContain('John');
    });

    it('should handle arrays in JSON', async () => {
      const mockRecords = [
        {
          content: JSON.stringify({
            tags: ['tag1', 'tag2', 'tag3']
          })
        }
      ];

      mockDb.rawQuery.mockResolvedValue(mockRecords);

      const result = await service.discoverFields('test_table');

      const tagsField = result.fields.find(f => f.path === 'tags');
      expect(tagsField).toBeDefined();
    });

    it('should track null values', async () => {
      const mockRecords = [
        { content: JSON.stringify({ field1: 'value1', field2: null }) },
        { content: JSON.stringify({ field1: 'value2', field2: 'value2' }) },
        { content: JSON.stringify({ field1: 'value3', field2: null }) }
      ];

      mockDb.rawQuery.mockResolvedValue(mockRecords);

      const result = await service.discoverFields('test_table');

      const field2 = result.fields.find(f => f.path === 'field2');
      expect(field2?.nullCount).toBe(2);
      expect(field2?.totalCount).toBe(3);
    });

    it('should limit unique values to 100', async () => {
      const mockRecords = Array.from({ length: 200 }, (_, i) => ({
        content: JSON.stringify({ id: i })
      }));

      mockDb.rawQuery.mockResolvedValue(mockRecords);

      const result = await service.discoverFields('test_table');

      const idField = result.fields.find(f => f.path === 'id');
      expect(idField?.uniqueValues.length).toBeLessThanOrEqual(100);
    });

    it('should sort fields alphabetically by path', async () => {
      const mockRecords = [
        {
          content: JSON.stringify({
            zebra: 1,
            alpha: 2,
            beta: 3
          })
        }
      ];

      mockDb.rawQuery.mockResolvedValue(mockRecords);

      const result = await service.discoverFields('test_table');

      expect(result.fields[0].path).toBe('alpha');
      expect(result.fields[1].path).toBe('beta');
      expect(result.fields[2].path).toBe('zebra');
    });
  });

  describe('analyze', () => {
    it('should analyze JSON documents and provide field analysis', async () => {
      const mockCountResult = [{ total: 1000 }];
      const mockRecords = [
        {
          content: JSON.stringify({
            _source: {
              type: 'event.test',
              id: 123,
              active: true
            }
          })
        }
      ];

      mockDb.query.mockResolvedValueOnce(mockCountResult);
      mockDb.query.mockResolvedValueOnce(mockRecords);

      const result = await service.analyze('test_table', 100, []);

      expect(result.totalRecordsInTable).toBe(1000);
      expect(result.sampledRecords).toBe(1);
      expect(result.baseTableName).toBe('test_table');
      expect(result.toProcessTable).toBe('test_table_toprocess');
      expect(result.analysis.fields.length).toBeGreaterThan(0);
      expect(result.analysis.totalDocuments).toBe(1);
      expect(result.analysis.analyzedAt).toBeInstanceOf(Date);
    });

    it('should include SQL type suggestions for fields', async () => {
      mockDb.query
        .mockResolvedValueOnce([{ total: 100 }])
        .mockResolvedValueOnce([
          {
            content: JSON.stringify({
              stringField: 'test',
              numberField: 42,
              boolField: true,
              objectField: { nested: 'value' },
              arrayField: [1, 2, 3]
            })
          }
        ]);

      const result = await service.analyze('test_table');

      const stringField = result.analysis.fields.find(f => f.path === 'stringField');
      expect(stringField?.suggestedType).toBe('VARCHAR(255)');

      const numberField = result.analysis.fields.find(f => f.path === 'numberField');
      expect(numberField?.suggestedType).toBe('INT');

      const boolField = result.analysis.fields.find(f => f.path === 'boolField');
      expect(boolField?.suggestedType).toBe('TINYINT(1)');

      const objectField = result.analysis.fields.find(f => f.path === 'objectField');
      expect(objectField?.suggestedType).toBe('JSON');

      const arrayField = result.analysis.fields.find(f => f.path === 'arrayField');
      expect(arrayField?.suggestedType).toBe('JSON');
    });

    it('should suggest BIGINT for large numbers', async () => {
      mockDb.query
        .mockResolvedValueOnce([{ total: 10 }])
        .mockResolvedValueOnce([
          {
            content: JSON.stringify({
              timestamp: 1640000000000 // Large number > 1 billion
            })
          }
        ]);

      const result = await service.analyze('test_table');

      const timestampField = result.analysis.fields.find(f => f.path === 'timestamp');
      expect(timestampField?.suggestedType).toBe('BIGINT');
    });

    it('should suggest TEXT for long strings', async () => {
      const longString = 'a'.repeat(1500);
      mockDb.query
        .mockResolvedValueOnce([{ total: 10 }])
        .mockResolvedValueOnce([
          {
            content: JSON.stringify({
              description: longString
            })
          }
        ]);

      const result = await service.analyze('test_table');

      const descField = result.analysis.fields.find(f => f.path === 'description');
      expect(descField?.suggestedType).toBe('TEXT');
      expect(descField?.maxLength).toBe(1500);
    });

    it('should suggest VARCHAR(500) for medium strings', async () => {
      const mediumString = 'a'.repeat(400);
      mockDb.query
        .mockResolvedValueOnce([{ total: 10 }])
        .mockResolvedValueOnce([
          {
            content: JSON.stringify({
              title: mediumString
            })
          }
        ]);

      const result = await service.analyze('test_table');

      const titleField = result.analysis.fields.find(f => f.path === 'title');
      expect(titleField?.suggestedType).toBe('VARCHAR(500)');
    });

    it('should build WHERE clause with = operator', async () => {
      const whereConditions = [
        { field: '_source.type', operator: '=', value: 'event.test' }
      ];

      // When WHERE conditions are present, COUNT query is skipped
      mockDb.query.mockResolvedValueOnce([
        { content: JSON.stringify({ _source: { type: 'event.test' } }) }
      ]);

      await service.analyze('test_table', 100, whereConditions);

      const selectCall = (mockDb.query as jest.Mock).mock.calls[0];
      expect(selectCall[0]).toContain('WHERE');
      expect(selectCall[0]).toContain('JSON_UNQUOTE(JSON_EXTRACT(content, ?)) = ?');
      expect(selectCall[1]).toEqual(['$._source.type', 'event.test']);
    });

    it('should build WHERE clause with != operator', async () => {
      const whereConditions = [
        { field: 'status', operator: '!=', value: 'failed' }
      ];

      // When WHERE conditions are present, COUNT query is skipped
      mockDb.query.mockResolvedValueOnce([
        { content: JSON.stringify({ status: 'active' }) }
      ]);

      await service.analyze('test_table', 100, whereConditions);

      const selectCall = (mockDb.query as jest.Mock).mock.calls[0];
      expect(selectCall[0]).toContain('!=');
      expect(selectCall[1]).toEqual(['$.status', 'failed']);
    });

    it('should build WHERE clause with IS NULL operator', async () => {
      const whereConditions = [
        { field: 'optional_field', operator: 'IS NULL', value: null }
      ];

      // When WHERE conditions are present, COUNT query is skipped
      mockDb.query.mockResolvedValueOnce([
        { content: JSON.stringify({ name: 'test' }) }
      ]);

      await service.analyze('test_table', 100, whereConditions);

      const selectCall = (mockDb.query as jest.Mock).mock.calls[0];
      expect(selectCall[0]).toContain('IS NULL');
      expect(selectCall[1]).toEqual([]);
    });

    it('should build WHERE clause with IS NOT NULL operator', async () => {
      const whereConditions = [
        { field: 'required_field', operator: 'IS NOT NULL', value: null }
      ];

      // When WHERE conditions are present, COUNT query is skipped
      mockDb.query.mockResolvedValueOnce([
        { content: JSON.stringify({ required_field: 'value' }) }
      ]);

      await service.analyze('test_table', 100, whereConditions);

      const selectCall = (mockDb.query as jest.Mock).mock.calls[0];
      expect(selectCall[0]).toContain('IS NOT NULL');
    });

    it('should build WHERE clause with LIKE operator', async () => {
      const whereConditions = [
        { field: 'name', operator: 'LIKE', value: 'test' }
      ];

      // When WHERE conditions are present, COUNT query is skipped
      mockDb.query.mockResolvedValueOnce([
        { content: JSON.stringify({ name: 'test123' }) }
      ]);

      await service.analyze('test_table', 100, whereConditions);

      const selectCall = (mockDb.query as jest.Mock).mock.calls[0];
      expect(selectCall[0]).toContain('LIKE');
      expect(selectCall[1]).toEqual(['$.name', '%test%']);
    });

    it('should build WHERE clause with IN operator', async () => {
      const whereConditions = [
        { field: 'status', operator: 'IN', value: ['active', 'pending', 'completed'] }
      ];

      // When WHERE conditions are present, COUNT query is skipped
      mockDb.query.mockResolvedValueOnce([
        { content: JSON.stringify({ status: 'active' }) }
      ]);

      await service.analyze('test_table', 100, whereConditions);

      const selectCall = (mockDb.query as jest.Mock).mock.calls[0];
      expect(selectCall[0]).toContain('IN (?, ?, ?)');
      expect(selectCall[1]).toEqual(['$.status', 'active', 'pending', 'completed']);
    });

    it('should combine multiple WHERE conditions with AND', async () => {
      const whereConditions = [
        { field: 'type', operator: '=', value: 'event.test' },
        { field: 'status', operator: '!=', value: 'failed' }
      ];

      // When WHERE conditions are present, COUNT query is skipped
      mockDb.query.mockResolvedValueOnce([
        { content: JSON.stringify({ type: 'event.test', status: 'active' }) }
      ]);

      await service.analyze('test_table', 100, whereConditions);

      const selectCall = (mockDb.query as jest.Mock).mock.calls[0];
      expect(selectCall[0]).toContain('AND');
    });

    it('should track field types and samples', async () => {
      mockDb.query
        .mockResolvedValueOnce([{ total: 10 }])
        .mockResolvedValueOnce([
          { content: JSON.stringify({ field: 'sample1' }) },
          { content: JSON.stringify({ field: 'sample2' }) },
          { content: JSON.stringify({ field: 'sample3' }) }
        ]);

      const result = await service.analyze('test_table');

      const field = result.analysis.fields.find(f => f.path === 'field');
      expect(field?.types).toContain('string');
      expect(field?.samples.length).toBeGreaterThan(0);
      expect(field?.occurrence).toBe(3);
    });

    it('should detect nullable fields', async () => {
      mockDb.query
        .mockResolvedValueOnce([{ total: 10 }])
        .mockResolvedValueOnce([
          { content: JSON.stringify({ field: 'value' }) },
          { content: JSON.stringify({ field: null }) }
        ]);

      const result = await service.analyze('test_table');

      const field = result.analysis.fields.find(f => f.path === 'field');
      expect(field?.isNullable).toBe(true);
    });

    it('should detect array fields', async () => {
      mockDb.query
        .mockResolvedValueOnce([{ total: 10 }])
        .mockResolvedValueOnce([
          { content: JSON.stringify({ tags: ['tag1', 'tag2'] }) }
        ]);

      const result = await service.analyze('test_table');

      const field = result.analysis.fields.find(f => f.path === 'tags');
      expect(field?.isArray).toBe(true);
    });

    it('should suggest table names based on path', async () => {
      mockDb.query
        .mockResolvedValueOnce([{ total: 10 }])
        .mockResolvedValueOnce([
          {
            content: JSON.stringify({
              userData: {
                userName: 'test'
              }
            })
          }
        ]);

      const result = await service.analyze('base_table');

      const field = result.analysis.fields.find(f => f.path === 'userData.userName');
      expect(field?.suggestedTable).toBe('users'); // userData -> user + s = users
    });

    it('should suggest column names with snake_case conversion', async () => {
      mockDb.query
        .mockResolvedValueOnce([{ total: 10 }])
        .mockResolvedValueOnce([
          {
            content: JSON.stringify({
              eventName: 'test',
              createdAt: '2024-01-01'
            })
          }
        ]);

      const result = await service.analyze('test_table');

      const eventField = result.analysis.fields.find(f => f.path === 'eventName');
      expect(eventField?.suggestedColumn).toBe('event_name');

      const createdField = result.analysis.fields.find(f => f.path === 'createdAt');
      expect(createdField?.suggestedColumn).toBe('created_at');
    });

    it('should limit samples to 5 per field', async () => {
      mockDb.query
        .mockResolvedValueOnce([{ total: 10 }])
        .mockResolvedValueOnce(
          Array.from({ length: 10 }, (_, i) => ({
            content: JSON.stringify({ id: i })
          }))
        );

      const result = await service.analyze('test_table');

      const idField = result.analysis.fields.find(f => f.path === 'id');
      expect(idField?.samples.length).toBeLessThanOrEqual(5);
    });
  });

  describe('getFieldValues', () => {
    it('should retrieve distinct values for a field', async () => {
      const mockResults = [
        { value: 'value1' },
        { value: 'value2' },
        { value: 'value3' }
      ];

      mockDb.query.mockResolvedValue(mockResults);

      const result = await service.getFieldValues('test_table', '_source.type', 100);

      expect(result.fieldPath).toBe('_source.type');
      expect(result.values).toEqual(['value1', 'value2', 'value3']);
      expect(mockDb.query).toHaveBeenCalledWith(
        expect.stringContaining('SELECT DISTINCT'),
        ['$._source.type', '$._source.type']
      );
    });

    it('should filter out null values', async () => {
      const mockResults = [
        { value: 'value1' },
        { value: null },
        { value: 'value2' }
      ];

      mockDb.query.mockResolvedValue(mockResults);

      const result = await service.getFieldValues('test_table', 'field');

      expect(result.values).toEqual(['value1', 'value2']);
      expect(result.values).not.toContain(null);
    });

    it('should respect the limit parameter', async () => {
      mockDb.query.mockResolvedValue([]);

      await service.getFieldValues('test_table', 'field', 50);

      const queryCall = (mockDb.query as jest.Mock).mock.calls[0][0];
      expect(queryCall).toContain('LIMIT 50');
    });

    it('should use default limit of 100', async () => {
      mockDb.query.mockResolvedValue([]);

      await service.getFieldValues('test_table', 'field');

      const queryCall = (mockDb.query as jest.Mock).mock.calls[0][0];
      expect(queryCall).toContain('LIMIT 100');
    });

    it('should exclude NULL values in WHERE clause', async () => {
      mockDb.query.mockResolvedValue([]);

      await service.getFieldValues('test_table', 'field.path');

      const queryCall = (mockDb.query as jest.Mock).mock.calls[0][0];
      expect(queryCall).toContain('WHERE JSON_EXTRACT(content, ?) IS NOT NULL');
    });
  });
});
