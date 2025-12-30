import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { TableService } from '../../../src/services/tableService.js';
import { DatabaseConnection } from '../../../src/database/connection.js';

jest.mock('../../../src/database/connection.js');

describe('TableService', () => {
  let service: TableService;
  let mockDb: jest.Mocked<DatabaseConnection>;

  beforeEach(() => {
    mockDb = {
      query: jest.fn(),
      rawQuery: jest.fn(),
      close: jest.fn()
    } as any;

    service = new TableService(mockDb);
    jest.clearAllMocks();
  });

  describe('listTables', () => {
    it('should list all tables in the database', async () => {
      const mockResults = [
        { 'Tables_in_testdb': 'users' },
        { 'Tables_in_testdb': 'posts' },
        { 'Tables_in_testdb': 'comments' }
      ];

      mockDb.rawQuery.mockResolvedValue(mockResults);

      const tables = await service.listTables();

      expect(tables).toEqual(['users', 'posts', 'comments']);
      expect(mockDb.rawQuery).toHaveBeenCalledWith('SHOW TABLES');
    });

    it('should handle empty database', async () => {
      mockDb.rawQuery.mockResolvedValue([]);

      const tables = await service.listTables();

      expect(tables).toEqual([]);
    });

    it('should handle different database column naming conventions', async () => {
      // Different databases may return different column names
      const mockResults = [
        { 'TABLE_NAME': 'users' },
        { 'TABLE_NAME': 'posts' }
      ];

      mockDb.rawQuery.mockResolvedValue(mockResults);

      const tables = await service.listTables();

      expect(tables).toEqual(['users', 'posts']);
    });

    it('should extract table names from any column format', async () => {
      const mockResults = [
        { SomeColumnName: 'table1' },
        { SomeColumnName: 'table2' },
        { SomeColumnName: 'table3' }
      ];

      mockDb.rawQuery.mockResolvedValue(mockResults);

      const tables = await service.listTables();

      expect(tables).toEqual(['table1', 'table2', 'table3']);
    });
  });

  describe('getTableStructures', () => {
    it('should get structure for a single table', async () => {
      const mockDescribeResult = [
        {
          Field: 'id',
          Type: 'int(11)',
          Null: 'NO',
          Key: 'PRI',
          Default: null
        },
        {
          Field: 'name',
          Type: 'varchar(255)',
          Null: 'YES',
          Key: '',
          Default: null
        }
      ];

      mockDb.rawQuery.mockResolvedValue(mockDescribeResult);

      const result = await service.getTableStructures(['users']);

      expect(result).toHaveLength(1);
      expect(result[0]).toEqual({
        name: 'users',
        isNew: false,
        columns: [
          {
            name: 'id',
            type: 'int(11)',
            nullable: false,
            isPrimaryKey: true,
            default: null
          },
          {
            name: 'name',
            type: 'varchar(255)',
            nullable: true,
            isPrimaryKey: false,
            default: null
          }
        ]
      });

      expect(mockDb.rawQuery).toHaveBeenCalledWith('DESCRIBE users');
    });

    it('should get structures for multiple tables', async () => {
      const mockUsersDescribe = [
        {
          Field: 'id',
          Type: 'int(11)',
          Null: 'NO',
          Key: 'PRI',
          Default: null
        }
      ];

      const mockPostsDescribe = [
        {
          Field: 'id',
          Type: 'int(11)',
          Null: 'NO',
          Key: 'PRI',
          Default: null
        },
        {
          Field: 'title',
          Type: 'varchar(255)',
          Null: 'NO',
          Key: '',
          Default: null
        }
      ];

      mockDb.rawQuery
        .mockResolvedValueOnce(mockUsersDescribe)
        .mockResolvedValueOnce(mockPostsDescribe);

      const result = await service.getTableStructures(['users', 'posts']);

      expect(result).toHaveLength(2);
      expect(result[0].name).toBe('users');
      expect(result[1].name).toBe('posts');
      expect(result[0].columns).toHaveLength(1);
      expect(result[1].columns).toHaveLength(2);

      expect(mockDb.rawQuery).toHaveBeenCalledTimes(2);
      expect(mockDb.rawQuery).toHaveBeenNthCalledWith(1, 'DESCRIBE users');
      expect(mockDb.rawQuery).toHaveBeenNthCalledWith(2, 'DESCRIBE posts');
    });

    it('should handle columns with default values', async () => {
      const mockDescribeResult = [
        {
          Field: 'status',
          Type: 'varchar(50)',
          Null: 'NO',
          Key: '',
          Default: 'active'
        },
        {
          Field: 'created_at',
          Type: 'timestamp',
          Null: 'NO',
          Key: '',
          Default: 'CURRENT_TIMESTAMP'
        }
      ];

      mockDb.rawQuery.mockResolvedValue(mockDescribeResult);

      const result = await service.getTableStructures(['settings']);

      expect(result[0].columns[0].default).toBe('active');
      expect(result[0].columns[1].default).toBe('CURRENT_TIMESTAMP');
    });

    it('should correctly identify nullable columns', async () => {
      const mockDescribeResult = [
        {
          Field: 'required_field',
          Type: 'varchar(255)',
          Null: 'NO',
          Key: '',
          Default: null
        },
        {
          Field: 'optional_field',
          Type: 'varchar(255)',
          Null: 'YES',
          Key: '',
          Default: null
        }
      ];

      mockDb.rawQuery.mockResolvedValue(mockDescribeResult);

      const result = await service.getTableStructures(['test_table']);

      expect(result[0].columns[0].nullable).toBe(false);
      expect(result[0].columns[1].nullable).toBe(true);
    });

    it('should correctly identify primary key columns', async () => {
      const mockDescribeResult = [
        {
          Field: 'id',
          Type: 'int(11)',
          Null: 'NO',
          Key: 'PRI',
          Default: null
        },
        {
          Field: 'data',
          Type: 'text',
          Null: 'YES',
          Key: '',
          Default: null
        }
      ];

      mockDb.rawQuery.mockResolvedValue(mockDescribeResult);

      const result = await service.getTableStructures(['test_table']);

      expect(result[0].columns[0].isPrimaryKey).toBe(true);
      expect(result[0].columns[1].isPrimaryKey).toBe(false);
    });

    it('should mark all tables as not new (isNew: false)', async () => {
      const mockDescribeResult = [
        {
          Field: 'id',
          Type: 'int(11)',
          Null: 'NO',
          Key: 'PRI',
          Default: null
        }
      ];

      mockDb.rawQuery.mockResolvedValue(mockDescribeResult);

      const result = await service.getTableStructures(['existing_table']);

      expect(result[0].isNew).toBe(false);
    });

    it('should throw error when tableNames is undefined', async () => {
      await expect(service.getTableStructures(undefined as any))
        .rejects
        .toThrow('tableNames array is required');
    });

    it('should throw error when tableNames is null', async () => {
      await expect(service.getTableStructures(null as any))
        .rejects
        .toThrow('tableNames array is required');
    });

    it('should throw error when tableNames is not an array', async () => {
      await expect(service.getTableStructures('not an array' as any))
        .rejects
        .toThrow('tableNames array is required');
    });

    it('should throw error when tableNames is an empty array', async () => {
      await expect(service.getTableStructures([]))
        .rejects
        .toThrow('tableNames array is required');
    });

    it('should handle table with many columns', async () => {
      const mockDescribeResult = Array.from({ length: 20 }, (_, i) => ({
        Field: `column_${i}`,
        Type: 'varchar(255)',
        Null: 'YES',
        Key: i === 0 ? 'PRI' : '',
        Default: null
      }));

      mockDb.rawQuery.mockResolvedValue(mockDescribeResult);

      const result = await service.getTableStructures(['large_table']);

      expect(result[0].columns).toHaveLength(20);
      expect(result[0].columns[0].isPrimaryKey).toBe(true);
      expect(result[0].columns[1].isPrimaryKey).toBe(false);
    });

    it('should handle complex column types', async () => {
      const mockDescribeResult = [
        {
          Field: 'json_field',
          Type: 'json',
          Null: 'YES',
          Key: '',
          Default: null
        },
        {
          Field: 'enum_field',
          Type: "enum('active','inactive','pending')",
          Null: 'NO',
          Key: '',
          Default: 'pending'
        },
        {
          Field: 'decimal_field',
          Type: 'decimal(10,2)',
          Null: 'YES',
          Key: '',
          Default: null
        }
      ];

      mockDb.rawQuery.mockResolvedValue(mockDescribeResult);

      const result = await service.getTableStructures(['complex_table']);

      expect(result[0].columns[0].type).toBe('json');
      expect(result[0].columns[1].type).toBe("enum('active','inactive','pending')");
      expect(result[0].columns[2].type).toBe('decimal(10,2)');
    });
  });
});
