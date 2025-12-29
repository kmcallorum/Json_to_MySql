/**
 * Unit Tests for JSON Analyzer Service
 * TDD Approach - 100% Code Coverage
 */

const JsonAnalyzer = require('../../backend/services/jsonAnalyzer');

describe('JsonAnalyzer Service', () => {
  let analyzer;

  beforeEach(() => {
    analyzer = new JsonAnalyzer();
  });

  describe('analyzeJsonStructure()', () => {
    test('should analyze simple flat JSON structure', () => {
      const json = {
        id: 1,
        name: 'Test User',
        email: 'test@example.com',
        age: 30
      };

      const result = analyzer.analyzeJsonStructure(json);

      expect(result).toHaveValidSchema();
      expect(result.name).toBe('root');
      expect(result.fields).toHaveLength(4);
      expect(result.fields.map(f => f.name)).toEqual(['id', 'name', 'email', 'age']);
    });

    test('should analyze nested object structure', () => {
      const json = {
        id: 1,
        user: {
          name: 'John Doe',
          email: 'john@example.com'
        }
      };

      const result = analyzer.analyzeJsonStructure(json);

      expect(result.tables).toHaveLength(2);
      expect(result.tables[0].name).toBe('root');
      expect(result.tables[1].name).toBe('user');
      expect(result.relationships).toContainEqual({
        from: 'root',
        to: 'user',
        type: '1:1',
        foreignKey: 'user_id'
      });
    });

    test('should analyze array of objects', () => {
      const json = {
        id: 1,
        tags: [
          { name: 'tag1', value: 'value1' },
          { name: 'tag2', value: 'value2' }
        ]
      };

      const result = analyzer.analyzeJsonStructure(json);

      expect(result.tables).toHaveLength(2);
      expect(result.relationships).toContainEqual({
        from: 'root',
        to: 'tags',
        type: '1:N',
        foreignKey: 'root_id'
      });
    });

    test('should handle array of primitives', () => {
      const json = {
        id: 1,
        tags: ['tag1', 'tag2', 'tag3']
      };

      const result = analyzer.analyzeJsonStructure(json);

      const tagsTable = result.tables.find(t => t.name === 'tags');
      expect(tagsTable).toBeDefined();
      expect(tagsTable.fields).toContainEqual({
        name: 'value',
        type: 'VARCHAR(255)',
        nullable: false
      });
    });

    test('should handle deeply nested structures', () => {
      const json = {
        level1: {
          level2: {
            level3: {
              value: 'deep'
            }
          }
        }
      };

      const result = analyzer.analyzeJsonStructure(json);

      expect(result.tables.length).toBeGreaterThanOrEqual(2);
      expect(result.relationships.length).toBeGreaterThanOrEqual(1);
    });

    test('should handle null values', () => {
      const json = {
        id: 1,
        nullField: null,
        name: 'Test'
      };

      const result = analyzer.analyzeJsonStructure(json);

      const nullField = result.fields.find(f => f.name === 'nullField');
      expect(nullField.nullable).toBe(true);
      expect(nullField.type).toBe('TEXT');
    });

    test('should handle undefined values', () => {
      const json = {
        id: 1,
        undefinedField: undefined,
        name: 'Test'
      };

      const result = analyzer.analyzeJsonStructure(json);

      const undefinedField = result.fields.find(f => f.name === 'undefinedField');
      expect(undefinedField.nullable).toBe(true);
    });

    test('should handle empty objects', () => {
      const json = {
        id: 1,
        emptyObject: {}
      };

      const result = analyzer.analyzeJsonStructure(json);

      expect(result).toBeDefined();
      expect(result.fields.find(f => f.name === 'id')).toBeDefined();
    });

    test('should handle empty arrays', () => {
      const json = {
        id: 1,
        emptyArray: []
      };

      const result = analyzer.analyzeJsonStructure(json);

      expect(result).toBeDefined();
      const emptyArrayField = result.fields.find(f => f.name === 'emptyArray');
      expect(emptyArrayField.type).toBe('JSON');
    });

    test('should handle mixed type arrays', () => {
      const json = {
        id: 1,
        mixed: [1, 'string', { obj: 'value' }, true]
      };

      const result = analyzer.analyzeJsonStructure(json);

      const mixedField = result.fields.find(f => f.name === 'mixed');
      expect(mixedField.type).toBe('JSON');
    });

    test('should throw error for invalid JSON', () => {
      expect(() => {
        analyzer.analyzeJsonStructure('invalid json');
      }).toThrow('Invalid JSON structure');
    });

    test('should throw error for null input', () => {
      expect(() => {
        analyzer.analyzeJsonStructure(null);
      }).toThrow('Input cannot be null or undefined');
    });
  });

  describe('inferDataTypes()', () => {
    test('should infer INTEGER type for numbers without decimals', () => {
      const type = analyzer.inferDataType(42);
      expect(type).toBe('INT');
    });

    test('should infer BIGINT for large numbers', () => {
      const type = analyzer.inferDataType(2147483648);
      expect(type).toBe('BIGINT');
    });

    test('should infer DECIMAL for floating point numbers', () => {
      const type = analyzer.inferDataType(42.5);
      expect(type).toBe('DECIMAL(10,2)');
    });

    test('should infer VARCHAR for short strings', () => {
      const type = analyzer.inferDataType('short string');
      expect(type).toBe('VARCHAR(255)');
    });

    test('should infer TEXT for long strings', () => {
      const longString = 'a'.repeat(300);
      const type = analyzer.inferDataType(longString);
      expect(type).toBe('TEXT');
    });

    test('should infer BOOLEAN for boolean values', () => {
      expect(analyzer.inferDataType(true)).toBe('BOOLEAN');
      expect(analyzer.inferDataType(false)).toBe('BOOLEAN');
    });

    test('should infer DATETIME for date strings', () => {
      const type = analyzer.inferDataType('2024-12-27T10:00:00Z');
      expect(type).toBe('DATETIME');
    });

    test('should infer DATETIME for timestamp numbers', () => {
      const type = analyzer.inferDataType(1650945600000);
      expect(type).toBe('BIGINT'); // Timestamp in milliseconds
    });

    test('should infer JSON for objects', () => {
      const type = analyzer.inferDataType({ key: 'value' });
      expect(type).toBe('JSON');
    });

    test('should infer JSON for arrays', () => {
      const type = analyzer.inferDataType([1, 2, 3]);
      expect(type).toBe('JSON');
    });

    test('should infer TEXT for null', () => {
      const type = analyzer.inferDataType(null);
      expect(type).toBe('TEXT');
    });

    test('should infer TEXT for undefined', () => {
      const type = analyzer.inferDataType(undefined);
      expect(type).toBe('TEXT');
    });
  });

  describe('detectRelationships()', () => {
    test('should detect 1:1 relationship for nested object', () => {
      const structure = {
        root: { id: 1, userId: 2 },
        user: { id: 2, name: 'John' }
      };

      const relationships = analyzer.detectRelationships(structure);

      expect(relationships).toContainEqual({
        from: 'root',
        to: 'user',
        type: '1:1',
        foreignKey: 'user_id'
      });
    });

    test('should detect 1:N relationship for arrays', () => {
      const structure = {
        root: { id: 1 },
        items: [{ id: 1, rootId: 1 }]
      };

      const relationships = analyzer.detectRelationships(structure);

      expect(relationships).toContainEqual({
        from: 'root',
        to: 'items',
        type: '1:N',
        foreignKey: 'root_id'
      });
    });

    test('should detect M:N relationship for junction tables', () => {
      const structure = {
        users: { id: 1 },
        roles: { id: 1 },
        user_roles: { userId: 1, roleId: 1 }
      };

      const relationships = analyzer.detectRelationships(structure);

      expect(relationships.some(r => r.type === 'M:N')).toBe(true);
    });

    test('should handle no relationships', () => {
      const structure = {
        root: { id: 1, name: 'Test' }
      };

      const relationships = analyzer.detectRelationships(structure);

      expect(relationships).toEqual([]);
    });
  });

  describe('generateSchema()', () => {
    test('should generate complete SQL schema', () => {
      const json = {
        id: 1,
        name: 'Test',
        tags: ['tag1', 'tag2']
      };

      const schema = analyzer.generateSchema(json);

      expect(schema).toHaveProperty('tables');
      expect(schema).toHaveProperty('relationships');
      expect(schema).toHaveProperty('indexes');
      expect(schema.tables.length).toBeGreaterThan(0);
    });

    test('should include primary keys for all tables', () => {
      const json = {
        id: 1,
        user: { id: 2, name: 'John' }
      };

      const schema = analyzer.generateSchema(json);

      schema.tables.forEach(table => {
        const hasPrimaryKey = table.fields.some(f => f.primaryKey === true);
        expect(hasPrimaryKey).toBe(true);
      });
    });

    test('should include foreign keys for relationships', () => {
      const json = {
        id: 1,
        user: { id: 2, name: 'John' }
      };

      const schema = analyzer.generateSchema(json);

      const rootTable = schema.tables.find(t => t.name === 'root');
      const hasForeignKey = rootTable.fields.some(f => f.foreignKey === true);
      expect(hasForeignKey).toBe(true);
    });

    test('should generate indexes for foreign keys', () => {
      const json = {
        id: 1,
        userId: 2,
        user: { id: 2, name: 'John' }
      };

      const schema = analyzer.generateSchema(json);

      expect(schema.indexes.length).toBeGreaterThan(0);
      expect(schema.indexes.some(idx => idx.column === 'user_id')).toBe(true);
    });
  });

  describe('Edge Cases', () => {
    test('should handle circular references', () => {
      const obj = { id: 1 };
      obj.self = obj;

      expect(() => {
        analyzer.analyzeJsonStructure(obj);
      }).toThrow('Circular reference detected');
    });

    test('should handle very large JSON documents', () => {
      const largeJson = {
        items: Array(10000).fill(null).map((_, i) => ({ id: i, value: `item${i}` }))
      };

      const result = analyzer.analyzeJsonStructure(largeJson);

      expect(result).toBeDefined();
      expect(result.tables).toBeDefined();
    });

    test('should handle special characters in field names', () => {
      const json = {
        'field-with-dash': 1,
        'field.with.dot': 2,
        'field with space': 3
      };

      const result = analyzer.analyzeJsonStructure(json);

      expect(result.fields.length).toBe(3);
      expect(result.fields.map(f => f.safeName)).toEqual([
        'field_with_dash',
        'field_with_dot',
        'field_with_space'
      ]);
    });

    test('should handle unicode characters', () => {
      const json = {
        id: 1,
        name: '日本語',
        emoji: '🚀'
      };

      const result = analyzer.analyzeJsonStructure(json);

      expect(result.fields.find(f => f.name === 'name').type).toBe('VARCHAR(255)');
      expect(result.fields.find(f => f.name === 'emoji').type).toBe('VARCHAR(255)');
    });

    test('should handle arrays with different object structures', () => {
      const json = {
        items: [
          { id: 1, name: 'Item 1' },
          { id: 2, name: 'Item 2', extra: 'field' }
        ]
      };

      const result = analyzer.analyzeJsonStructure(json);

      const itemsTable = result.tables.find(t => t.name === 'items');
      expect(itemsTable.fields.some(f => f.name === 'extra')).toBe(true);
      expect(itemsTable.fields.find(f => f.name === 'extra').nullable).toBe(true);
    });

    test('should maintain field order', () => {
      const json = {
        z_field: 1,
        a_field: 2,
        m_field: 3
      };

      const result = analyzer.analyzeJsonStructure(json);

      expect(result.fields[0].name).toBe('z_field');
      expect(result.fields[1].name).toBe('a_field');
      expect(result.fields[2].name).toBe('m_field');
    });
  });

  describe('Performance Tests', () => {
    test('should analyze structure in reasonable time for large documents', () => {
      const largeJson = {
        items: Array(1000).fill(null).map((_, i) => ({
          id: i,
          name: `Item ${i}`,
          nested: {
            value: i * 2,
            tags: ['tag1', 'tag2', 'tag3']
          }
        }))
      };

      const startTime = Date.now();
      analyzer.analyzeJsonStructure(largeJson);
      const endTime = Date.now();

      expect(endTime - startTime).toBeLessThan(5000); // Should complete in under 5 seconds
    });
  });
});
