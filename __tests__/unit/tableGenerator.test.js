/**
 * Unit Tests for Table Generator Service
 * TDD Approach - 100% Code Coverage
 */

const TableGenerator = require('../../backend/services/tableGenerator');
const mysql = require('mysql2/promise');

// Mock MySQL connection
jest.mock('mysql2/promise');

describe('TableGenerator Service', () => {
  let generator;
  let mockConnection;
  let mockQuery;

  beforeEach(() => {
    mockQuery = jest.fn().mockResolvedValue([]);
    mockConnection = {
      query: mockQuery,
      execute: mockQuery,
      beginTransaction: jest.fn().mockResolvedValue(undefined),
      commit: jest.fn().mockResolvedValue(undefined),
      rollback: jest.fn().mockResolvedValue(undefined),
      end: jest.fn().mockResolvedValue(undefined)
    };

    mysql.createConnection.mockResolvedValue(mockConnection);
    
    generator = new TableGenerator({
      host: 'localhost',
      user: 'test',
      password: 'test',
      database: 'test_db'
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('createTablesFromSchema()', () => {
    test('should create single table with basic fields', async () => {
      const schema = {
        tables: [{
          name: 'users',
          fields: [
            { name: 'id', type: 'INT', primaryKey: true, autoIncrement: true },
            { name: 'name', type: 'VARCHAR(255)', nullable: false },
            { name: 'email', type: 'VARCHAR(255)', nullable: false, unique: true }
          ]
        }],
        relationships: [],
        indexes: []
      };

      await generator.createTablesFromSchema(schema);

      expect(mockQuery).toHaveBeenCalledWith(expect.stringContaining('CREATE TABLE users'));
      expect(mockQuery).toHaveBeenCalledWith(expect.stringContaining('id INT AUTO_INCREMENT PRIMARY KEY'));
      expect(mockQuery).toHaveBeenCalledWith(expect.stringContaining('UNIQUE KEY'));
    });

    test('should create multiple related tables', async () => {
      const schema = {
        tables: [
          {
            name: 'users',
            fields: [
              { name: 'id', type: 'INT', primaryKey: true, autoIncrement: true },
              { name: 'name', type: 'VARCHAR(255)', nullable: false }
            ]
          },
          {
            name: 'orders',
            fields: [
              { name: 'id', type: 'INT', primaryKey: true, autoIncrement: true },
              { name: 'user_id', type: 'INT', nullable: false, foreignKey: true },
              { name: 'amount', type: 'DECIMAL(10,2)', nullable: false }
            ]
          }
        ],
        relationships: [
          {
            from: 'orders',
            to: 'users',
            foreignKey: 'user_id',
            type: '1:N'
          }
        ],
        indexes: []
      };

      await generator.createTablesFromSchema(schema);

      expect(mockQuery).toHaveBeenCalledWith(expect.stringContaining('CREATE TABLE users'));
      expect(mockQuery).toHaveBeenCalledWith(expect.stringContaining('CREATE TABLE orders'));
      expect(mockQuery).toHaveBeenCalledWith(expect.stringContaining('FOREIGN KEY'));
    });

    test('should handle table creation errors gracefully', async () => {
      mockQuery.mockRejectedValueOnce(new Error('Table already exists'));

      const schema = {
        tables: [{
          name: 'users',
          fields: [{ name: 'id', type: 'INT', primaryKey: true }]
        }],
        relationships: [],
        indexes: []
      };

      await expect(generator.createTablesFromSchema(schema)).rejects.toThrow('Table already exists');
    });

    test('should use transactions for multiple table creation', async () => {
      const schema = {
        tables: [
          { name: 'table1', fields: [{ name: 'id', type: 'INT', primaryKey: true }] },
          { name: 'table2', fields: [{ name: 'id', type: 'INT', primaryKey: true }] }
        ],
        relationships: [],
        indexes: []
      };

      await generator.createTablesFromSchema(schema);

      expect(mockConnection.beginTransaction).toHaveBeenCalled();
      expect(mockConnection.commit).toHaveBeenCalled();
    });

    test('should rollback on error during table creation', async () => {
      mockQuery
        .mockResolvedValueOnce([]) // First table succeeds
        .mockRejectedValueOnce(new Error('Creation failed')); // Second fails

      const schema = {
        tables: [
          { name: 'table1', fields: [{ name: 'id', type: 'INT', primaryKey: true }] },
          { name: 'table2', fields: [{ name: 'id', type: 'INT', primaryKey: true }] }
        ],
        relationships: [],
        indexes: []
      };

      await expect(generator.createTablesFromSchema(schema)).rejects.toThrow();
      expect(mockConnection.rollback).toHaveBeenCalled();
    });
  });

  describe('generateForeignKeys()', () => {
    test('should generate foreign key constraint', () => {
      const relationship = {
        from: 'orders',
        to: 'users',
        foreignKey: 'user_id',
        type: '1:N'
      };

      const sql = generator.generateForeignKey(relationship);

      expect(sql).toContain('FOREIGN KEY (user_id)');
      expect(sql).toContain('REFERENCES users(id)');
      expect(sql).toContain('ON DELETE CASCADE');
    });

    test('should handle different cascade options', () => {
      const relationship = {
        from: 'orders',
        to: 'users',
        foreignKey: 'user_id',
        onDelete: 'SET NULL',
        onUpdate: 'CASCADE'
      };

      const sql = generator.generateForeignKey(relationship);

      expect(sql).toContain('ON DELETE SET NULL');
      expect(sql).toContain('ON UPDATE CASCADE');
    });

    test('should generate composite foreign keys', () => {
      const relationship = {
        from: 'order_items',
        to: 'products',
        foreignKey: ['product_id', 'variant_id'],
        type: '1:N'
      };

      const sql = generator.generateForeignKey(relationship);

      expect(sql).toContain('FOREIGN KEY (product_id, variant_id)');
    });
  });

  describe('createIndexes()', () => {
    test('should create index on single column', async () => {
      const index = {
        table: 'users',
        column: 'email',
        name: 'idx_users_email',
        unique: true
      };

      await generator.createIndex(index);

      expect(mockQuery).toHaveBeenCalledWith(
        expect.stringContaining('CREATE UNIQUE INDEX idx_users_email ON users(email)')
      );
    });

    test('should create composite index', async () => {
      const index = {
        table: 'orders',
        columns: ['user_id', 'created_at'],
        name: 'idx_orders_user_created'
      };

      await generator.createIndex(index);

      expect(mockQuery).toHaveBeenCalledWith(
        expect.stringContaining('CREATE INDEX idx_orders_user_created ON orders(user_id, created_at)')
      );
    });

    test('should create fulltext index', async () => {
      const index = {
        table: 'articles',
        column: 'content',
        type: 'FULLTEXT',
        name: 'idx_articles_content_fulltext'
      };

      await generator.createIndex(index);

      expect(mockQuery).toHaveBeenCalledWith(
        expect.stringContaining('CREATE FULLTEXT INDEX')
      );
    });

    test('should handle index creation errors', async () => {
      mockQuery.mockRejectedValueOnce(new Error('Index already exists'));

      const index = {
        table: 'users',
        column: 'email',
        name: 'idx_users_email'
      };

      await expect(generator.createIndex(index)).rejects.toThrow('Index already exists');
    });
  });

  describe('validateSchema()', () => {
    test('should validate correct schema', () => {
      const schema = {
        tables: [{
          name: 'users',
          fields: [
            { name: 'id', type: 'INT', primaryKey: true },
            { name: 'name', type: 'VARCHAR(255)', nullable: false }
          ]
        }],
        relationships: [],
        indexes: []
      };

      const result = generator.validateSchema(schema);

      expect(result.valid).toBe(true);
      expect(result.errors).toEqual([]);
    });

    test('should detect missing primary key', () => {
      const schema = {
        tables: [{
          name: 'users',
          fields: [
            { name: 'name', type: 'VARCHAR(255)', nullable: false }
          ]
        }],
        relationships: [],
        indexes: []
      };

      const result = generator.validateSchema(schema);

      expect(result.valid).toBe(false);
      expect(result.errors).toContainEqual(
        expect.stringContaining('No primary key defined')
      );
    });

    test('should detect invalid field types', () => {
      const schema = {
        tables: [{
          name: 'users',
          fields: [
            { name: 'id', type: 'INVALID_TYPE', primaryKey: true }
          ]
        }],
        relationships: [],
        indexes: []
      };

      const result = generator.validateSchema(schema);

      expect(result.valid).toBe(false);
      expect(result.errors).toContainEqual(
        expect.stringContaining('Invalid field type')
      );
    });

    test('should detect missing foreign key references', () => {
      const schema = {
        tables: [
          {
            name: 'orders',
            fields: [
              { name: 'id', type: 'INT', primaryKey: true },
              { name: 'user_id', type: 'INT', foreignKey: true }
            ]
          }
        ],
        relationships: [
          {
            from: 'orders',
            to: 'users', // This table doesn't exist
            foreignKey: 'user_id'
          }
        ],
        indexes: []
      };

      const result = generator.validateSchema(schema);

      expect(result.valid).toBe(false);
      expect(result.errors).toContainEqual(
        expect.stringContaining('Referenced table does not exist')
      );
    });

    test('should detect duplicate table names', () => {
      const schema = {
        tables: [
          {
            name: 'users',
            fields: [{ name: 'id', type: 'INT', primaryKey: true }]
          },
          {
            name: 'users', // Duplicate
            fields: [{ name: 'id', type: 'INT', primaryKey: true }]
          }
        ],
        relationships: [],
        indexes: []
      };

      const result = generator.validateSchema(schema);

      expect(result.valid).toBe(false);
      expect(result.errors).toContainEqual(
        expect.stringContaining('Duplicate table name')
      );
    });

    test('should detect duplicate field names in table', () => {
      const schema = {
        tables: [{
          name: 'users',
          fields: [
            { name: 'id', type: 'INT', primaryKey: true },
            { name: 'id', type: 'INT' } // Duplicate
          ]
        }],
        relationships: [],
        indexes: []
      };

      const result = generator.validateSchema(schema);

      expect(result.valid).toBe(false);
      expect(result.errors).toContainEqual(
        expect.stringContaining('Duplicate field name')
      );
    });
  });

  describe('dropTable()', () => {
    test('should drop table with CASCADE', async () => {
      await generator.dropTable('users', true);

      expect(mockQuery).toHaveBeenCalledWith(
        'DROP TABLE IF EXISTS users CASCADE'
      );
    });

    test('should drop table without CASCADE', async () => {
      await generator.dropTable('users', false);

      expect(mockQuery).toHaveBeenCalledWith(
        'DROP TABLE IF EXISTS users'
      );
    });

    test('should handle drop errors', async () => {
      mockQuery.mockRejectedValueOnce(new Error('Cannot drop table'));

      await expect(generator.dropTable('users')).rejects.toThrow('Cannot drop table');
    });
  });

  describe('alterTable()', () => {
    test('should add column to existing table', async () => {
      const alteration = {
        type: 'ADD_COLUMN',
        column: {
          name: 'new_field',
          type: 'VARCHAR(255)',
          nullable: true
        }
      };

      await generator.alterTable('users', alteration);

      expect(mockQuery).toHaveBeenCalledWith(
        expect.stringContaining('ALTER TABLE users ADD COLUMN new_field VARCHAR(255)')
      );
    });

    test('should drop column from table', async () => {
      const alteration = {
        type: 'DROP_COLUMN',
        column: 'old_field'
      };

      await generator.alterTable('users', alteration);

      expect(mockQuery).toHaveBeenCalledWith(
        expect.stringContaining('ALTER TABLE users DROP COLUMN old_field')
      );
    });

    test('should modify column type', async () => {
      const alteration = {
        type: 'MODIFY_COLUMN',
        column: {
          name: 'email',
          type: 'TEXT'
        }
      };

      await generator.alterTable('users', alteration);

      expect(mockQuery).toHaveBeenCalledWith(
        expect.stringContaining('ALTER TABLE users MODIFY COLUMN email TEXT')
      );
    });

    test('should rename column', async () => {
      const alteration = {
        type: 'RENAME_COLUMN',
        oldName: 'old_name',
        newName: 'new_name',
        type: 'VARCHAR(255)'
      };

      await generator.alterTable('users', alteration);

      expect(mockQuery).toHaveBeenCalledWith(
        expect.stringContaining('ALTER TABLE users CHANGE old_name new_name')
      );
    });
  });

  describe('getTableInfo()', () => {
    test('should retrieve table structure', async () => {
      mockQuery.mockResolvedValueOnce([[
        { Field: 'id', Type: 'int', Key: 'PRI', Null: 'NO' },
        { Field: 'name', Type: 'varchar(255)', Key: '', Null: 'NO' }
      ]]);

      const info = await generator.getTableInfo('users');

      expect(info.fields).toHaveLength(2);
      expect(info.fields[0].name).toBe('id');
      expect(info.fields[0].primaryKey).toBe(true);
    });

    test('should handle non-existent table', async () => {
      mockQuery.mockRejectedValueOnce(new Error('Table does not exist'));

      await expect(generator.getTableInfo('nonexistent')).rejects.toThrow();
    });
  });

  describe('Edge Cases', () => {
    test('should handle reserved SQL keywords in table names', async () => {
      const schema = {
        tables: [{
          name: 'order', // Reserved keyword
          fields: [{ name: 'id', type: 'INT', primaryKey: true }]
        }],
        relationships: [],
        indexes: []
      };

      await generator.createTablesFromSchema(schema);

      expect(mockQuery).toHaveBeenCalledWith(
        expect.stringContaining('CREATE TABLE `order`')
      );
    });

    test('should handle very long table names', async () => {
      const longName = 'a'.repeat(64); // MySQL max table name length
      const schema = {
        tables: [{
          name: longName,
          fields: [{ name: 'id', type: 'INT', primaryKey: true }]
        }],
        relationships: [],
        indexes: []
      };

      await generator.createTablesFromSchema(schema);

      expect(mockQuery).toHaveBeenCalled();
    });

    test('should handle special characters in table names', async () => {
      const schema = {
        tables: [{
          name: 'user-data', // Contains hyphen
          fields: [{ name: 'id', type: 'INT', primaryKey: true }]
        }],
        relationships: [],
        indexes: []
      };

      await generator.createTablesFromSchema(schema);

      expect(mockQuery).toHaveBeenCalledWith(
        expect.stringContaining('`user-data`')
      );
    });
  });
});
