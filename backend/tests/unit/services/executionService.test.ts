import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { ExecutionService } from '../../../src/services/executionService.js';
import { DatabaseConnection } from '../../../src/database/connection.js';
import { RelationshipService } from '../../../src/services/relationshipService.js';

jest.mock('../../../src/database/connection.js');

describe('ExecutionService', () => {
  let service: ExecutionService;
  let mockDb: jest.Mocked<DatabaseConnection>;

  beforeEach(() => {
    mockDb = {
      query: jest.fn(),
      rawQuery: jest.fn(),
      close: jest.fn()
    } as any;

    service = new ExecutionService(mockDb);
    jest.clearAllMocks();
  });

  describe('createTables', () => {
    it('should create new tables only', async () => {
      const tables = [
        {
          name: 'events',
          isNew: true,
          columns: [
            { name: 'id', type: 'INT', isPrimaryKey: true, nullable: false },
            { name: 'type', type: 'VARCHAR(255)', isPrimaryKey: false, nullable: false }
          ]
        },
        {
          name: 'existing_table',
          isNew: false,
          columns: [{ name: 'id', type: 'INT', isPrimaryKey: true }]
        }
      ];

      mockDb.rawQuery.mockResolvedValue([]);

      const result = await service.createTables(tables);

      expect(result).toEqual(['events']);
      expect(mockDb.rawQuery).toHaveBeenCalledTimes(1);
      expect(mockDb.rawQuery).toHaveBeenCalledWith(expect.stringContaining('CREATE TABLE'));
      expect(mockDb.rawQuery).toHaveBeenCalledWith(expect.stringContaining('events'));
    });

    it('should handle primary key columns', async () => {
      const tables = [
        {
          name: 'test_table',
          isNew: true,
          columns: [
            { name: 'id', type: 'INT', isPrimaryKey: true, nullable: false }
          ]
        }
      ];

      mockDb.rawQuery.mockResolvedValue([]);

      await service.createTables(tables);

      const callArg = (mockDb.rawQuery as jest.Mock).mock.calls[0][0];
      expect(callArg).toContain('PRIMARY KEY AUTO_INCREMENT');
    });

    it('should handle nullable columns', async () => {
      const tables = [
        {
          name: 'test_table',
          isNew: true,
          columns: [
            { name: 'id', type: 'INT', isPrimaryKey: true, nullable: false },
            { name: 'optional', type: 'VARCHAR(255)', isPrimaryKey: false, nullable: true }
          ]
        }
      ];

      mockDb.rawQuery.mockResolvedValue([]);

      await service.createTables(tables);

      const callArg = (mockDb.rawQuery as jest.Mock).mock.calls[0][0];
      // Primary key should have NOT NULL
      expect(callArg).toContain('`id` INT PRIMARY KEY AUTO_INCREMENT');
      // Nullable column should not have NOT NULL
      expect(callArg).not.toContain('`optional` VARCHAR(255) NOT NULL');
    });

    it('should handle non-nullable non-primary columns', async () => {
      const tables = [
        {
          name: 'test_table',
          isNew: true,
          columns: [
            { name: 'id', type: 'INT', isPrimaryKey: true, nullable: false },
            { name: 'required', type: 'VARCHAR(255)', isPrimaryKey: false, nullable: false }
          ]
        }
      ];

      mockDb.rawQuery.mockResolvedValue([]);

      await service.createTables(tables);

      const callArg = (mockDb.rawQuery as jest.Mock).mock.calls[0][0];
      expect(callArg).toContain('NOT NULL');
    });

    it('should return empty array when no new tables', async () => {
      const tables = [
        { name: 'existing', isNew: false, columns: [] }
      ];

      const result = await service.createTables(tables);

      expect(result).toEqual([]);
      expect(mockDb.rawQuery).not.toHaveBeenCalled();
    });

    it('should create multiple tables', async () => {
      const tables = [
        {
          name: 'table1',
          isNew: true,
          columns: [{ name: 'id', type: 'INT', isPrimaryKey: true }]
        },
        {
          name: 'table2',
          isNew: true,
          columns: [{ name: 'id', type: 'INT', isPrimaryKey: true }]
        }
      ];

      mockDb.rawQuery.mockResolvedValue([]);

      const result = await service.createTables(tables);

      expect(result).toEqual(['table1', 'table2']);
      expect(mockDb.rawQuery).toHaveBeenCalledTimes(2);
    });
  });

  describe('flattenRecords', () => {
    beforeEach(() => {
      // Mock console methods to suppress output during tests
      jest.spyOn(console, 'log').mockImplementation(() => {});
      jest.spyOn(console, 'warn').mockImplementation(() => {});
      jest.spyOn(console, 'error').mockImplementation(() => {});
    });

    afterEach(() => {
      (console.log as jest.Mock).mockRestore();
      (console.warn as jest.Mock).mockRestore();
      (console.error as jest.Mock).mockRestore();
    });

    it('should process records with no where conditions', async () => {
      const tables = [
        {
          name: 'events',
          columns: [
            { name: 'id', type: 'INT', isPrimaryKey: true },
            { name: 'type', type: 'VARCHAR(255)', isPrimaryKey: false }
          ]
        }
      ];
      const mappings = [
        { sourcePath: 'eventType', targetTable: 'events', targetColumn: 'type' }
      ];

      mockDb.rawQuery
        .mockResolvedValueOnce([  // SELECT query
          { id: 1, content: JSON.stringify({ eventType: 'test' }) }
        ])
        .mockResolvedValueOnce({ insertId: 1 } as any)  // INSERT query
        .mockResolvedValueOnce([])  // Copy to archive
        .mockResolvedValueOnce({ affectedRows: 1 } as any)  // DELETE from _toprocess
        .mockResolvedValueOnce([{ count: 0 }]);  // Remaining count

      const result = await service.flattenRecords('test_table', mappings, tables);

      expect(result.processed).toBe(1);
      expect(result.moved).toBe(1);
    });

    it('should handle where conditions with = operator', async () => {
      const tables = [{ name: 'events', columns: [] }];
      const mappings = [
        { sourcePath: 'type', targetTable: 'events', targetColumn: 'type' }
      ];
      const whereConditions = [
        { field: 'status', operator: '=', value: 'active' }
      ];

      mockDb.rawQuery
        .mockResolvedValueOnce([])  // No records match
        .mockResolvedValueOnce([{ count: 0 }]);  // Remaining count

      await service.flattenRecords('test_table', mappings, tables, whereConditions);

      const selectCall = (mockDb.rawQuery as jest.Mock).mock.calls[0][0];
      expect(selectCall).toContain('WHERE');
      expect(selectCall).toContain('JSON_UNQUOTE');
      expect(selectCall).toContain('status');
    });

    it('should handle where conditions with IS NOT NULL operator', async () => {
      const tables = [{ name: 'events', columns: [] }];
      const mappings = [
        { sourcePath: 'type', targetTable: 'events', targetColumn: 'type' }
      ];
      const whereConditions = [
        { field: 'data', operator: 'IS NOT NULL', value: null }
      ];

      mockDb.rawQuery
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([{ count: 0 }]);

      await service.flattenRecords('test_table', mappings, tables, whereConditions);

      const selectCall = (mockDb.rawQuery as jest.Mock).mock.calls[0][0];
      expect(selectCall).toContain('IS NOT NULL');
    });

    it('should auto-detect relationships when not provided', async () => {
      const tables = [
        {
          name: 'users',
          columns: [{ name: 'id', type: 'INT', isPrimaryKey: true }]
        },
        {
          name: 'posts',
          columns: [
            { name: 'id', type: 'INT', isPrimaryKey: true },
            { name: 'users_id', type: 'INT', isPrimaryKey: false }
          ]
        }
      ];
      const mappings = [
        { sourcePath: 'userId', targetTable: 'users', targetColumn: 'id' },
        { sourcePath: 'post', targetTable: 'posts', targetColumn: 'id' }
      ];

      mockDb.rawQuery
        .mockResolvedValueOnce([])  // No records
        .mockResolvedValueOnce([{ count: 0 }]);

      await service.flattenRecords('test_table', mappings, tables, []);

      // Should have called auto-detect
      expect(mockDb.rawQuery).toHaveBeenCalled();
    });

    it('should handle records with string content', async () => {
      const tables = [
        {
          name: 'events',
          columns: [{ name: 'type', type: 'VARCHAR(255)', isPrimaryKey: false }]
        }
      ];
      const mappings = [
        { sourcePath: 'eventType', targetTable: 'events', targetColumn: 'type' }
      ];

      mockDb.rawQuery
        .mockResolvedValueOnce([
          { id: 1, content: '{"eventType":"test"}' }  // String JSON
        ])
        .mockResolvedValueOnce({ insertId: 1 } as any)
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce({ affectedRows: 1 } as any)
        .mockResolvedValueOnce([{ count: 0 }]);

      const result = await service.flattenRecords('test_table', mappings, tables);

      expect(result.processed).toBe(1);
    });

    it('should skip tables with no mappings', async () => {
      const tables = [
        { name: 'events', columns: [] },
        { name: 'other_table', columns: [] }
      ];
      const mappings = [
        { sourcePath: 'type', targetTable: 'events', targetColumn: 'type' }
      ];

      mockDb.rawQuery
        .mockResolvedValueOnce([
          { id: 1, content: { type: 'test' } }
        ])
        .mockResolvedValueOnce({ insertId: 1 } as any)
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce({ affectedRows: 1 } as any)
        .mockResolvedValueOnce([{ count: 0 }]);

      await service.flattenRecords('test_table', mappings, tables);

      expect(console.log).toHaveBeenCalledWith(expect.stringContaining('Skipping'));
    });

    it('should handle datetime conversion', async () => {
      const tables = [
        {
          name: 'events',
          columns: [
            { name: 'created_at', type: 'DATETIME', isPrimaryKey: false }
          ]
        }
      ];
      const mappings = [
        { sourcePath: 'timestamp', targetTable: 'events', targetColumn: 'created_at' }
      ];

      mockDb.rawQuery
        .mockResolvedValueOnce([
          { id: 1, content: { timestamp: 1640000000 } }
        ])
        .mockResolvedValueOnce({ insertId: 1 } as any)
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce({ affectedRows: 1 } as any)
        .mockResolvedValueOnce([{ count: 0 }]);

      await service.flattenRecords('test_table', mappings, tables);

      const insertCall = (mockDb.rawQuery as jest.Mock).mock.calls[1][0];
      expect(insertCall).toContain('2021-12-20');
    });

    it('should handle foreign key relationships', async () => {
      const tables = [
        {
          name: 'users',
          columns: [{ name: 'id', type: 'INT', isPrimaryKey: true }]
        },
        {
          name: 'posts',
          columns: [
            { name: 'id', type: 'INT', isPrimaryKey: true },
            { name: 'users_id', type: 'INT', isPrimaryKey: false }
          ]
        }
      ];
      const mappings = [
        { sourcePath: 'userId', targetTable: 'users', targetColumn: 'id' },
        { sourcePath: 'postId', targetTable: 'posts', targetColumn: 'id' }
      ];
      const relationships = [
        {
          parentTable: 'users',
          childTable: 'posts',
          foreignKeyColumn: 'users_id',
          parentKeyColumn: 'id'
        }
      ];

      mockDb.rawQuery
        .mockResolvedValueOnce([
          { id: 1, content: { userId: 100, postId: 200 } }
        ])
        .mockResolvedValueOnce({ insertId: 1 } as any)  // users insert
        .mockResolvedValueOnce({ insertId: 2 } as any)  // posts insert
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce({ affectedRows: 1 } as any)
        .mockResolvedValueOnce([{ count: 0 }]);

      await service.flattenRecords('test_table', mappings, tables, [], relationships);

      const postsInsert = (mockDb.rawQuery as jest.Mock).mock.calls[2][0];
      expect(postsInsert).toContain('users_id');
    });

    it('should handle insert errors gracefully', async () => {
      const tables = [
        {
          name: 'events',
          columns: [{ name: 'type', type: 'VARCHAR(255)', isPrimaryKey: false }]
        }
      ];
      const mappings = [
        { sourcePath: 'type', targetTable: 'events', targetColumn: 'type' }
      ];

      mockDb.rawQuery
        .mockResolvedValueOnce([
          { id: 1, content: { type: 'test' } }
        ])
        .mockRejectedValueOnce(new Error('Duplicate entry'))
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce({ affectedRows: 1 } as any)
        .mockResolvedValueOnce([{ count: 0 }]);

      const result = await service.flattenRecords('test_table', mappings, tables);

      expect(result.processed).toBe(0);  // Failed
      expect(result.moved).toBe(1);  // But still moved to archive
    });

    it('should cleanup remaining records', async () => {
      const tables = [
        { name: 'events', columns: [] }
      ];
      const mappings = [
        { sourcePath: 'type', targetTable: 'events', targetColumn: 'type' }
      ];

      mockDb.rawQuery
        .mockResolvedValueOnce([])  // No records match filter
        .mockResolvedValueOnce([{ count: 5 }])  // 5 remaining records
        .mockResolvedValueOnce([])  // Copy remaining
        .mockResolvedValueOnce({ affectedRows: 5 } as any);  // Delete remaining

      const result = await service.flattenRecords('test_table', mappings, tables);

      expect(result.moved).toBe(5);
      expect(console.log).toHaveBeenCalledWith(expect.stringContaining('Archiving'));
    });

    it('should respect batch size', async () => {
      const tables = [{ name: 'events', columns: [] }];
      const mappings = [
        { sourcePath: 'type', targetTable: 'events', targetColumn: 'type' }
      ];

      mockDb.rawQuery
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([{ count: 0 }]);

      await service.flattenRecords('test_table', mappings, tables, [], [], 50);

      const selectCall = (mockDb.rawQuery as jest.Mock).mock.calls[0][0];
      expect(selectCall).toContain('LIMIT 50');
    });

    it('should handle nested object extraction', async () => {
      const tables = [
        {
          name: 'events',
          columns: [{ name: 'user_name', type: 'VARCHAR(255)', isPrimaryKey: false }]
        }
      ];
      const mappings = [
        { sourcePath: '_source.user.name', targetTable: 'events', targetColumn: 'user_name' }
      ];

      mockDb.rawQuery
        .mockResolvedValueOnce([
          { id: 1, content: { _source: { user: { name: 'John' } } } }
        ])
        .mockResolvedValueOnce({ insertId: 1 } as any)
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce({ affectedRows: 1 } as any)
        .mockResolvedValueOnce([{ count: 0 }]);

      const result = await service.flattenRecords('test_table', mappings, tables);

      expect(result.processed).toBe(1);
    });

    it('should handle array values by taking first element', async () => {
      const tables = [
        {
          name: 'events',
          columns: [{ name: 'tag', type: 'VARCHAR(255)', isPrimaryKey: false }]
        }
      ];
      const mappings = [
        { sourcePath: 'tags', targetTable: 'events', targetColumn: 'tag' }
      ];

      mockDb.rawQuery
        .mockResolvedValueOnce([
          { id: 1, content: { tags: ['first', 'second'] } }
        ])
        .mockResolvedValueOnce({ insertId: 1 } as any)
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce({ affectedRows: 1 } as any)
        .mockResolvedValueOnce([{ count: 0 }]);

      const result = await service.flattenRecords('test_table', mappings, tables);

      expect(result.processed).toBe(1);
      const insertCall = (mockDb.rawQuery as jest.Mock).mock.calls[1][0];
      expect(insertCall).toContain('first');
    });

    it('should stringify complex objects', async () => {
      const tables = [
        {
          name: 'events',
          columns: [{ name: 'metadata', type: 'JSON', isPrimaryKey: false }]
        }
      ];
      const mappings = [
        { sourcePath: 'data', targetTable: 'events', targetColumn: 'metadata' }
      ];

      mockDb.rawQuery
        .mockResolvedValueOnce([
          { id: 1, content: { data: { complex: 'object' } } }
        ])
        .mockResolvedValueOnce({ insertId: 1 } as any)
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce({ affectedRows: 1 } as any)
        .mockResolvedValueOnce([{ count: 0 }]);

      await service.flattenRecords('test_table', mappings, tables);

      const insertCall = (mockDb.rawQuery as jest.Mock).mock.calls[1][0];
      // JSON is escaped by mysql.escape, so check for escaped version
      expect(insertCall).toContain('complex');
    });

    it('should handle null/undefined values in extraction', async () => {
      const tables = [
        {
          name: 'events',
          columns: [{ name: 'value', type: 'VARCHAR(255)', isPrimaryKey: false }]
        }
      ];
      const mappings = [
        { sourcePath: 'missing.path', targetTable: 'events', targetColumn: 'value' }
      ];

      mockDb.rawQuery
        .mockResolvedValueOnce([
          { id: 1, content: {} }
        ])
        .mockResolvedValueOnce({ insertId: 1 } as any)
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce({ affectedRows: 1 } as any)
        .mockResolvedValueOnce([{ count: 0 }]);

      const result = await service.flattenRecords('test_table', mappings, tables);

      expect(result.processed).toBe(1);
    });
  });

  describe('error translation', () => {
    beforeEach(() => {
      jest.spyOn(console, 'error').mockImplementation(() => {});
    });

    afterEach(() => {
      (console.error as jest.Mock).mockRestore();
    });

    it('should translate foreign key constraint errors', async () => {
      const tables = [
        {
          name: 'posts',
          columns: [{ name: 'user_id', type: 'INT', isPrimaryKey: false }]
        }
      ];
      const mappings = [
        { sourcePath: 'userId', targetTable: 'posts', targetColumn: 'user_id' }
      ];

      const fkError = new Error(
        "Cannot add or update a child row: a foreign key constraint fails (`db`.`posts`, CONSTRAINT `fk_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`))"
      );

      mockDb.rawQuery
        .mockResolvedValueOnce([
          { id: 1, content: { userId: 999 } }
        ])
        .mockRejectedValueOnce(fkError)
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce({ affectedRows: 1 } as any)
        .mockResolvedValueOnce([{ count: 0 }]);

      await service.flattenRecords('test_table', mappings, tables);

      expect(console.error).toHaveBeenCalledWith(
        expect.stringContaining('references users.id')
      );
    });

    it('should translate missing required field errors', async () => {
      const tables = [
        {
          name: 'events',
          columns: [{ name: 'type', type: 'VARCHAR(255)', isPrimaryKey: false, nullable: false }]
        }
      ];
      const mappings = [
        { sourcePath: 'other', targetTable: 'events', targetColumn: 'other' }
      ];

      const requiredError = new Error("Field 'type' doesn't have a default value");

      mockDb.rawQuery
        .mockResolvedValueOnce([
          { id: 1, content: { other: 'value' } }
        ])
        .mockRejectedValueOnce(requiredError)
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce({ affectedRows: 1 } as any)
        .mockResolvedValueOnce([{ count: 0 }]);

      await service.flattenRecords('test_table', mappings, tables);

      expect(console.error).toHaveBeenCalledWith(
        expect.stringContaining("Required field 'type'")
      );
    });

    it('should translate data type mismatch errors', async () => {
      const tables = [
        {
          name: 'events',
          columns: [{ name: 'count', type: 'INT', isPrimaryKey: false }]
        }
      ];
      const mappings = [
        { sourcePath: 'count', targetTable: 'events', targetColumn: 'count' }
      ];

      const typeError = new Error("Incorrect integer value: 'not a number' for column 'count' at row 1");

      mockDb.rawQuery
        .mockResolvedValueOnce([
          { id: 1, content: { count: 'not a number' } }
        ])
        .mockRejectedValueOnce(typeError)
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce({ affectedRows: 1 } as any)
        .mockResolvedValueOnce([{ count: 0 }]);

      await service.flattenRecords('test_table', mappings, tables);

      expect(console.error).toHaveBeenCalledWith(
        expect.stringContaining('Data type mismatch')
      );
    });

    it('should translate duplicate entry errors', async () => {
      const tables = [
        {
          name: 'events',
          columns: [{ name: 'unique_id', type: 'VARCHAR(255)', isPrimaryKey: false }]
        }
      ];
      const mappings = [
        { sourcePath: 'id', targetTable: 'events', targetColumn: 'unique_id' }
      ];

      const dupError = new Error("Duplicate entry 'abc123' for key 'unique_id'");

      mockDb.rawQuery
        .mockResolvedValueOnce([
          { id: 1, content: { id: 'abc123' } }
        ])
        .mockRejectedValueOnce(dupError)
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce({ affectedRows: 1 } as any)
        .mockResolvedValueOnce([{ count: 0 }]);

      await service.flattenRecords('test_table', mappings, tables);

      expect(console.error).toHaveBeenCalledWith(
        expect.stringContaining("Duplicate value: 'abc123'")
      );
    });

    it('should translate unknown column errors', async () => {
      const tables = [
        {
          name: 'events',
          columns: [{ name: 'type', type: 'VARCHAR(255)', isPrimaryKey: false }]
        }
      ];
      const mappings = [
        { sourcePath: 'type', targetTable: 'events', targetColumn: 'nonexistent' }
      ];

      const colError = new Error("Unknown column 'nonexistent' in 'field list'");

      mockDb.rawQuery
        .mockResolvedValueOnce([
          { id: 1, content: { type: 'test' } }
        ])
        .mockRejectedValueOnce(colError)
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce({ affectedRows: 1 } as any)
        .mockResolvedValueOnce([{ count: 0 }]);

      await service.flattenRecords('test_table', mappings, tables);

      expect(console.error).toHaveBeenCalledWith(
        expect.stringContaining("Column 'nonexistent' doesn't exist")
      );
    });

    it('should handle generic errors', async () => {
      const tables = [
        {
          name: 'events',
          columns: [{ name: 'type', type: 'VARCHAR(255)', isPrimaryKey: false }]
        }
      ];
      const mappings = [
        { sourcePath: 'type', targetTable: 'events', targetColumn: 'type' }
      ];

      const genericError = new Error('Some random database error');

      mockDb.rawQuery
        .mockResolvedValueOnce([
          { id: 1, content: { type: 'test' } }
        ])
        .mockRejectedValueOnce(genericError)
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce({ affectedRows: 1 } as any)
        .mockResolvedValueOnce([{ count: 0 }]);

      await service.flattenRecords('test_table', mappings, tables);

      expect(console.error).toHaveBeenCalledWith(
        expect.stringContaining('Error inserting into events')
      );
    });
  });

  describe('datetime conversion', () => {
    beforeEach(() => {
      jest.spyOn(console, 'log').mockImplementation(() => {});
    });

    afterEach(() => {
      (console.log as jest.Mock).mockRestore();
    });

    it('should convert unix timestamp to datetime', async () => {
      const tables = [
        {
          name: 'events',
          columns: [{ name: 'created_at', type: 'DATETIME', isPrimaryKey: false }]
        }
      ];
      const mappings = [
        { sourcePath: 'timestamp', targetTable: 'events', targetColumn: 'created_at' }
      ];

      mockDb.rawQuery
        .mockResolvedValueOnce([
          { id: 1, content: { timestamp: 1640000000 } }
        ])
        .mockResolvedValueOnce({ insertId: 1 } as any)
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce({ affectedRows: 1 } as any)
        .mockResolvedValueOnce([{ count: 0 }]);

      await service.flattenRecords('test_table', mappings, tables);

      const insertCall = (mockDb.rawQuery as jest.Mock).mock.calls[1][0];
      expect(insertCall).toMatch(/\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}/);
    });

    it('should convert millisecond timestamp to datetime', async () => {
      const tables = [
        {
          name: 'events',
          columns: [{ name: 'created_at', type: 'TIMESTAMP', isPrimaryKey: false }]
        }
      ];
      const mappings = [
        { sourcePath: 'timestamp', targetTable: 'events', targetColumn: 'created_at' }
      ];

      mockDb.rawQuery
        .mockResolvedValueOnce([
          { id: 1, content: { timestamp: 1640000000000 } }  // Milliseconds
        ])
        .mockResolvedValueOnce({ insertId: 1 } as any)
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce({ affectedRows: 1 } as any)
        .mockResolvedValueOnce([{ count: 0 }]);

      await service.flattenRecords('test_table', mappings, tables);

      const insertCall = (mockDb.rawQuery as jest.Mock).mock.calls[1][0];
      expect(insertCall).toMatch(/\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}/);
    });

    it('should handle ISO date strings', async () => {
      const tables = [
        {
          name: 'events',
          columns: [{ name: 'created_at', type: 'DATE', isPrimaryKey: false }]
        }
      ];
      const mappings = [
        { sourcePath: 'timestamp', targetTable: 'events', targetColumn: 'created_at' }
      ];

      mockDb.rawQuery
        .mockResolvedValueOnce([
          { id: 1, content: { timestamp: '2025-12-02T14:26:18.893385Z' } }
        ])
        .mockResolvedValueOnce({ insertId: 1 } as any)
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce({ affectedRows: 1 } as any)
        .mockResolvedValueOnce([{ count: 0 }]);

      await service.flattenRecords('test_table', mappings, tables);

      const insertCall = (mockDb.rawQuery as jest.Mock).mock.calls[1][0];
      expect(insertCall).toContain('2025-12-02 14:26:18');
    });

    it('should handle null datetime values', async () => {
      const tables = [
        {
          name: 'events',
          columns: [{ name: 'created_at', type: 'DATETIME', isPrimaryKey: false, nullable: true }]
        }
      ];
      const mappings = [
        { sourcePath: 'timestamp', targetTable: 'events', targetColumn: 'created_at' }
      ];

      mockDb.rawQuery
        .mockResolvedValueOnce([
          { id: 1, content: { timestamp: null } }
        ])
        .mockResolvedValueOnce({ insertId: 1 } as any)
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce({ affectedRows: 1 } as any)
        .mockResolvedValueOnce([{ count: 0 }]);

      const result = await service.flattenRecords('test_table', mappings, tables);

      expect(result.processed).toBe(1);
    });

    it('should pass through already formatted datetime strings', async () => {
      const tables = [
        {
          name: 'events',
          columns: [{ name: 'created_at', type: 'DATETIME', isPrimaryKey: false }]
        }
      ];
      const mappings = [
        { sourcePath: 'timestamp', targetTable: 'events', targetColumn: 'created_at' }
      ];

      mockDb.rawQuery
        .mockResolvedValueOnce([
          { id: 1, content: { timestamp: '2025-12-20 10:30:45' } }
        ])
        .mockResolvedValueOnce({ insertId: 1 } as any)
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce({ affectedRows: 1 } as any)
        .mockResolvedValueOnce([{ count: 0 }]);

      await service.flattenRecords('test_table', mappings, tables);

      const insertCall = (mockDb.rawQuery as jest.Mock).mock.calls[1][0];
      expect(insertCall).toContain('2025-12-20 10:30:45');
    });

    it('should handle non-ISO datetime strings', async () => {
      const tables = [
        {
          name: 'events',
          columns: [{ name: 'created_at', type: 'DATETIME', isPrimaryKey: false }]
        }
      ];
      const mappings = [
        { sourcePath: 'timestamp', targetTable: 'events', targetColumn: 'created_at' }
      ];

      mockDb.rawQuery
        .mockResolvedValueOnce([
          { id: 1, content: { timestamp: 'Mon Dec 20 2021 10:30:45' } }  // Non-ISO format
        ])
        .mockResolvedValueOnce({ insertId: 1 } as any)
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce({ affectedRows: 1 } as any)
        .mockResolvedValueOnce([{ count: 0 }]);

      const result = await service.flattenRecords('test_table', mappings, tables);

      expect(result.processed).toBe(1);
    });

    it('should handle non-string non-number datetime values', async () => {
      const tables = [
        {
          name: 'events',
          columns: [{ name: 'created_at', type: 'DATETIME', isPrimaryKey: false }]
        }
      ];
      const mappings = [
        { sourcePath: 'timestamp', targetTable: 'events', targetColumn: 'created_at' }
      ];

      mockDb.rawQuery
        .mockResolvedValueOnce([
          { id: 1, content: { timestamp: true } }  // Boolean value
        ])
        .mockResolvedValueOnce({ insertId: 1 } as any)
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce({ affectedRows: 1 } as any)
        .mockResolvedValueOnce([{ count: 0 }]);

      const result = await service.flattenRecords('test_table', mappings, tables);

      expect(result.processed).toBe(1);
    });
  });

  describe('missing parent ID warning', () => {
    beforeEach(() => {
      jest.spyOn(console, 'log').mockImplementation(() => {});
      jest.spyOn(console, 'warn').mockImplementation(() => {});
    });

    afterEach(() => {
      (console.log as jest.Mock).mockRestore();
      (console.warn as jest.Mock).mockRestore();
    });

    it('should warn when parent ID is not found', async () => {
      const tables = [
        {
          name: 'users',
          columns: [{ name: 'id', type: 'INT', isPrimaryKey: true }]
        },
        {
          name: 'posts',
          columns: [
            { name: 'id', type: 'INT', isPrimaryKey: true },
            { name: 'users_id', type: 'INT', isPrimaryKey: false }
          ]
        }
      ];
      const mappings = [
        { sourcePath: 'postId', targetTable: 'posts', targetColumn: 'id' }
        // Note: No mapping for users table, so no parent ID will be generated
      ];
      const relationships = [
        {
          parentTable: 'users',
          childTable: 'posts',
          foreignKeyColumn: 'users_id',
          parentKeyColumn: 'id'
        }
      ];

      mockDb.rawQuery
        .mockResolvedValueOnce([
          { id: 1, content: { postId: 200 } }
        ])
        .mockResolvedValueOnce({ insertId: 2 } as any)  // posts insert
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce({ affectedRows: 1 } as any)
        .mockResolvedValueOnce([{ count: 0 }]);

      await service.flattenRecords('test_table', mappings, tables, [], relationships);

      expect(console.warn).toHaveBeenCalledWith(
        expect.stringContaining('Missing parent ID for users')
      );
    });
  });

  describe('error translation edge cases', () => {
    beforeEach(() => {
      jest.spyOn(console, 'error').mockImplementation(() => {});
    });

    afterEach(() => {
      (console.error as jest.Mock).mockRestore();
    });

    it('should handle FK error without regex match', async () => {
      const tables = [
        {
          name: 'posts',
          columns: [{ name: 'user_id', type: 'INT', isPrimaryKey: false }]
        }
      ];
      const mappings = [
        { sourcePath: 'userId', targetTable: 'posts', targetColumn: 'user_id' }
      ];

      const fkError = new Error('foreign key constraint fails but no match');

      mockDb.rawQuery
        .mockResolvedValueOnce([
          { id: 1, content: { userId: 999 } }
        ])
        .mockRejectedValueOnce(fkError)
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce({ affectedRows: 1 } as any)
        .mockResolvedValueOnce([{ count: 0 }]);

      await service.flattenRecords('test_table', mappings, tables);

      expect(console.error).toHaveBeenCalledWith(
        expect.stringContaining('Foreign key constraint failed for posts')
      );
    });

    it('should handle required field error without regex match', async () => {
      const tables = [
        {
          name: 'events',
          columns: [{ name: 'type', type: 'VARCHAR(255)', isPrimaryKey: false, nullable: false }]
        }
      ];
      const mappings = [
        { sourcePath: 'other', targetTable: 'events', targetColumn: 'other' }
      ];

      const requiredError = new Error("doesn't have a default value but no field match");

      mockDb.rawQuery
        .mockResolvedValueOnce([
          { id: 1, content: { other: 'value' } }
        ])
        .mockRejectedValueOnce(requiredError)
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce({ affectedRows: 1 } as any)
        .mockResolvedValueOnce([{ count: 0 }]);

      await service.flattenRecords('test_table', mappings, tables);

      expect(console.error).toHaveBeenCalledWith(
        expect.stringContaining('Required field missing in events')
      );
    });

    it('should handle type mismatch error without full regex match', async () => {
      const tables = [
        {
          name: 'events',
          columns: [{ name: 'count', type: 'INT', isPrimaryKey: false }]
        }
      ];
      const mappings = [
        { sourcePath: 'count', targetTable: 'events', targetColumn: 'count' }
      ];

      const typeError = new Error('Incorrect value but no full match');

      mockDb.rawQuery
        .mockResolvedValueOnce([
          { id: 1, content: { count: 'not a number' } }
        ])
        .mockRejectedValueOnce(typeError)
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce({ affectedRows: 1 } as any)
        .mockResolvedValueOnce([{ count: 0 }]);

      await service.flattenRecords('test_table', mappings, tables);

      expect(console.error).toHaveBeenCalledWith(
        expect.stringContaining('Data type mismatch in events')
      );
    });

    it('should handle duplicate entry error without regex match', async () => {
      const tables = [
        {
          name: 'events',
          columns: [{ name: 'unique_id', type: 'VARCHAR(255)', isPrimaryKey: false }]
        }
      ];
      const mappings = [
        { sourcePath: 'id', targetTable: 'events', targetColumn: 'unique_id' }
      ];

      const dupError = new Error('Duplicate entry but no match');

      mockDb.rawQuery
        .mockResolvedValueOnce([
          { id: 1, content: { id: 'abc123' } }
        ])
        .mockRejectedValueOnce(dupError)
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce({ affectedRows: 1 } as any)
        .mockResolvedValueOnce([{ count: 0 }]);

      await service.flattenRecords('test_table', mappings, tables);

      expect(console.error).toHaveBeenCalledWith(
        expect.stringContaining('Duplicate entry in events')
      );
    });

    it('should handle unknown column error without regex match', async () => {
      const tables = [
        {
          name: 'events',
          columns: [{ name: 'type', type: 'VARCHAR(255)', isPrimaryKey: false }]
        }
      ];
      const mappings = [
        { sourcePath: 'type', targetTable: 'events', targetColumn: 'nonexistent' }
      ];

      const colError = new Error('Unknown column but no match');

      mockDb.rawQuery
        .mockResolvedValueOnce([
          { id: 1, content: { type: 'test' } }
        ])
        .mockRejectedValueOnce(colError)
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce({ affectedRows: 1 } as any)
        .mockResolvedValueOnce([{ count: 0 }]);

      await service.flattenRecords('test_table', mappings, tables);

      expect(console.error).toHaveBeenCalledWith(
        expect.stringContaining('Column mismatch in events')
      );
    });

    it('should handle error without message property', async () => {
      const tables = [
        {
          name: 'events',
          columns: [{ name: 'type', type: 'VARCHAR(255)', isPrimaryKey: false }]
        }
      ];
      const mappings = [
        { sourcePath: 'type', targetTable: 'events', targetColumn: 'type' }
      ];

      const errorWithoutMessage: any = {};  // No message property

      mockDb.rawQuery
        .mockResolvedValueOnce([
          { id: 1, content: { type: 'test' } }
        ])
        .mockRejectedValueOnce(errorWithoutMessage)
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce({ affectedRows: 1 } as any)
        .mockResolvedValueOnce([{ count: 0 }]);

      await service.flattenRecords('test_table', mappings, tables);

      expect(console.error).toHaveBeenCalledWith(
        expect.stringContaining('Error inserting into events')
      );
    });
  });

  describe('edge case branches', () => {
    beforeEach(() => {
      jest.spyOn(console, 'log').mockImplementation(() => {});
    });

    afterEach(() => {
      (console.log as jest.Mock).mockRestore();
    });

    it('should handle empty where conditions clauses', async () => {
      const tables = [
        {
          name: 'events',
          columns: [{ name: 'type', type: 'VARCHAR(255)', isPrimaryKey: false }]
        }
      ];
      const mappings = [
        { sourcePath: 'type', targetTable: 'events', targetColumn: 'type' }
      ];
      const whereConditions = [
        { field: 'x', operator: 'UNSUPPORTED', value: 'y' }  // Won't match any case in switch
      ];

      mockDb.rawQuery
        .mockResolvedValueOnce([])  // No records will match
        .mockResolvedValueOnce([{ count: 0 }]);

      await service.flattenRecords('test_table', mappings, tables, whereConditions);

      // Should build query without WHERE clause since no clauses were generated
      const selectCall = (mockDb.rawQuery as jest.Mock).mock.calls[0][0];
      expect(selectCall).not.toContain('WHERE');
    });

    it('should handle delete result without affectedRows', async () => {
      const tables = [
        {
          name: 'events',
          columns: [{ name: 'type', type: 'VARCHAR(255)', isPrimaryKey: false }]
        }
      ];
      const mappings = [
        { sourcePath: 'type', targetTable: 'events', targetColumn: 'type' }
      ];

      mockDb.rawQuery
        .mockResolvedValueOnce([
          { id: 1, content: { type: 'test' } }
        ])
        .mockResolvedValueOnce({ insertId: 1 } as any)
        .mockResolvedValueOnce([])  // Copy
        .mockResolvedValueOnce([])  // DELETE returns empty array instead of result object
        .mockResolvedValueOnce([{ count: 0 }]);

      const result = await service.flattenRecords('test_table', mappings, tables);

      expect(result.moved).toBe(0);  // Should default to 0
    });

    it('should handle cleanup result without affectedRows', async () => {
      const tables = [
        {
          name: 'events',
          columns: [{ name: 'type', type: 'VARCHAR(255)', isPrimaryKey: false }]
        }
      ];
      const mappings = [
        { sourcePath: 'type', targetTable: 'events', targetColumn: 'type' }
      ];

      mockDb.rawQuery
        .mockResolvedValueOnce([])  // No records match filter
        .mockResolvedValueOnce([{ count: 5 }])  // 5 remaining
        .mockResolvedValueOnce([])  // Copy
        .mockResolvedValueOnce([]);  // DELETE returns empty array

      const result = await service.flattenRecords('test_table', mappings, tables);

      expect(result.moved).toBe(0);  // Should default to 0
    });

    it('should handle empty array extraction', async () => {
      const tables = [
        {
          name: 'events',
          columns: [{ name: 'tag', type: 'VARCHAR(255)', isPrimaryKey: false }]
        }
      ];
      const mappings = [
        { sourcePath: 'tags', targetTable: 'events', targetColumn: 'tag' }
      ];

      mockDb.rawQuery
        .mockResolvedValueOnce([
          { id: 1, content: { tags: [] } }  // Empty array
        ])
        .mockResolvedValueOnce({ insertId: 1 } as any)
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce({ affectedRows: 1 } as any)
        .mockResolvedValueOnce([{ count: 0 }]);

      const result = await service.flattenRecords('test_table', mappings, tables);

      expect(result.processed).toBe(1);
      const insertCall = (mockDb.rawQuery as jest.Mock).mock.calls[1][0];
      expect(insertCall).toContain('NULL');  // Empty array should map to null
    });
  });
});
