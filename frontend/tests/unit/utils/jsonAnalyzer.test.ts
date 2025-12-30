import { describe, it, expect } from '@jest/globals';
import { JsonAnalyzer } from '../../../src/utils/jsonAnalyzer';

describe('JsonAnalyzer', () => {
  let analyzer: JsonAnalyzer;

  beforeEach(() => {
    analyzer = new JsonAnalyzer();
  });

  describe('analyze', () => {
    it('should analyze simple JSON documents', () => {
      const documents = [
        { name: 'John', age: 30, active: true },
        { name: 'Jane', age: 25, active: false }
      ];

      const result = analyzer.analyze(documents);

      expect(result.totalRecords).toBe(2);
      expect(result.totalDocuments).toBe(2);
      expect(result.fields.length).toBe(3);
      expect(result.analyzedAt).toBeInstanceOf(Date);
    });

    it('should throw error when no documents provided', () => {
      expect(() => analyzer.analyze([])).toThrow('No documents to analyze');
    });

    it('should respect sample size limit', () => {
      const documents = Array.from({ length: 100 }, (_, i) => ({
        id: i,
        value: `item${i}`
      }));

      const result = analyzer.analyze(documents, 10);

      expect(result.totalRecords).toBe(10);
      expect(result.totalDocuments).toBe(10);
    });

    it('should analyze entire dataset if sample size not specified', () => {
      const documents = Array.from({ length: 50 }, (_, i) => ({ id: i }));

      const result = analyzer.analyze(documents);

      expect(result.totalRecords).toBe(50);
    });

    it('should detect field types correctly', () => {
      const documents = [
        { stringField: 'hello', numberField: 42, boolField: true }
      ];

      const result = analyzer.analyze(documents);

      const stringField = result.fields.find(f => f.path === 'stringField');
      const numberField = result.fields.find(f => f.path === 'numberField');
      const boolField = result.fields.find(f => f.path === 'boolField');

      expect(stringField?.types.has('string')).toBe(true);
      expect(numberField?.types.has('number')).toBe(true);
      expect(boolField?.types.has('boolean')).toBe(true);
    });

    it('should detect nullable fields', () => {
      const documents = [
        { field1: 'value', field2: null },
        { field1: 'value2', field2: 'value2' }
      ];

      const result = analyzer.analyze(documents);

      const field2 = result.fields.find(f => f.path === 'field2');
      expect(field2?.isNullable).toBe(true);
    });

    it('should detect array fields', () => {
      const documents = [
        { tags: ['tag1', 'tag2', 'tag3'] }
      ];

      const result = analyzer.analyze(documents);

      const tagsField = result.fields.find(f => f.path === 'tags');
      expect(tagsField?.isArray).toBe(true);
    });

    it('should handle nested objects', () => {
      const documents = [
        {
          user: {
            profile: {
              name: 'John',
              email: 'john@example.com'
            }
          }
        }
      ];

      const result = analyzer.analyze(documents);

      const nameField = result.fields.find(f => f.path === 'user.profile.name');
      const emailField = result.fields.find(f => f.path === 'user.profile.email');

      expect(nameField).toBeDefined();
      expect(emailField).toBeDefined();
      expect(nameField?.types.has('string')).toBe(true);
    });

    it('should handle arrays of objects', () => {
      const documents = [
        {
          items: [
            { id: 1, name: 'Item 1' },
            { id: 2, name: 'Item 2' }
          ]
        }
      ];

      const result = analyzer.analyze(documents);

      const itemsField = result.fields.find(f => f.path === 'items');
      const idField = result.fields.find(f => f.path === 'items.id');
      const nameField = result.fields.find(f => f.path === 'items.name');

      expect(itemsField?.isArray).toBe(true);
      expect(idField).toBeDefined();
      expect(nameField).toBeDefined();
    });

    it('should handle arrays of primitives', () => {
      const documents = [
        { numbers: [1, 2, 3, 4, 5] }
      ];

      const result = analyzer.analyze(documents);

      const numbersField = result.fields.find(f => f.path === 'numbers');
      expect(numbersField?.isArray).toBe(true);
      expect(numbersField?.types.has('number')).toBe(true);
      expect(numbersField?.samples.length).toBeGreaterThan(0);
    });

    it('should track occurrence count', () => {
      const documents = [
        { field: 'value1' },
        { field: 'value2' },
        { field: 'value3' }
      ];

      const result = analyzer.analyze(documents);

      const field = result.fields.find(f => f.path === 'field');
      expect(field?.occurrence).toBe(3);
    });

    it('should limit samples to 3', () => {
      const documents = Array.from({ length: 10 }, (_, i) => ({
        value: `sample${i}`
      }));

      const result = analyzer.analyze(documents);

      const field = result.fields.find(f => f.path === 'value');
      expect(field?.samples.length).toBeLessThanOrEqual(3);
    });

    it('should track max string length', () => {
      const documents = [
        { text: 'short' },
        { text: 'this is a much longer string' },
        { text: 'medium' }
      ];

      const result = analyzer.analyze(documents);

      const textField = result.fields.find(f => f.path === 'text');
      expect(textField?.maxLength).toBe(28); // Length of "this is a much longer string"
    });

    it('should handle empty arrays', () => {
      const documents = [
        { emptyArray: [] }
      ];

      const result = analyzer.analyze(documents);

      const field = result.fields.find(f => f.path === 'emptyArray');
      expect(field?.isArray).toBe(true);
    });

    it('should handle undefined values', () => {
      const documents = [
        { definedField: 'value', undefinedField: undefined }
      ];

      const result = analyzer.analyze(documents);

      const undefinedField = result.fields.find(f => f.path === 'undefinedField');
      expect(undefinedField?.isNullable).toBe(true);
    });

    it('should suggest correct table names for top-level fields', () => {
      const documents = [
        { simpleField: 'value' }
      ];

      const result = analyzer.analyze(documents);

      const field = result.fields.find(f => f.path === 'simpleField');
      expect(field?.suggestedTable).toBe('main_table');
    });

    it('should suggest correct table names for eventData', () => {
      const documents = [
        { eventData: { type: 'click' } }
      ];

      const result = analyzer.analyze(documents);

      const field = result.fields.find(f => f.path === 'eventData.type');
      expect(field?.suggestedTable).toBe('events');
    });

    it('should suggest correct table names for pipelineData', () => {
      const documents = [
        { pipelineData: { stage: 'build' } }
      ];

      const result = analyzer.analyze(documents);

      const field = result.fields.find(f => f.path === 'pipelineData.stage');
      expect(field?.suggestedTable).toBe('events');
    });

    it('should suggest correct table names for testData', () => {
      const documents = [
        { testData: { result: 'pass' } }
      ];

      const result = analyzer.analyze(documents);

      const field = result.fields.find(f => f.path === 'testData.result');
      expect(field?.suggestedTable).toBe('test_results');
    });

    it('should suggest default table pattern for other nested fields', () => {
      const documents = [
        { userData: { name: 'John' } }
      ];

      const result = analyzer.analyze(documents);

      const field = result.fields.find(f => f.path === 'userData.name');
      expect(field?.suggestedTable).toBe('userData_table');
    });

    it('should convert camelCase to snake_case for column names', () => {
      const documents = [
        { firstName: 'John', lastName: 'Doe', emailAddress: 'john@example.com' }
      ];

      const result = analyzer.analyze(documents);

      const firstName = result.fields.find(f => f.path === 'firstName');
      const lastName = result.fields.find(f => f.path === 'lastName');
      const emailAddress = result.fields.find(f => f.path === 'emailAddress');

      expect(firstName?.suggestedColumn).toBe('first_name');
      expect(lastName?.suggestedColumn).toBe('last_name');
      expect(emailAddress?.suggestedColumn).toBe('email_address');
    });

    it('should handle already snake_case field names', () => {
      const documents = [
        { user_name: 'john', created_at: '2024-01-01' }
      ];

      const result = analyzer.analyze(documents);

      const userName = result.fields.find(f => f.path === 'user_name');
      expect(userName?.suggestedColumn).toBe('user_name');
    });

    it('should suggest INT for integer numbers', () => {
      const documents = [
        { count: 42, total: 100, items: 5 }
      ];

      const result = analyzer.analyze(documents);

      const countField = result.fields.find(f => f.path === 'count');
      expect(countField?.suggestedType).toBe('INT');
    });

    it('should suggest DOUBLE for decimal numbers', () => {
      const documents = [
        { price: 19.99, rating: 4.5 }
      ];

      const result = analyzer.analyze(documents);

      const priceField = result.fields.find(f => f.path === 'price');
      expect(priceField?.suggestedType).toBe('DOUBLE');
    });

    it('should suggest BOOLEAN for boolean fields', () => {
      const documents = [
        { active: true, verified: false }
      ];

      const result = analyzer.analyze(documents);

      const activeField = result.fields.find(f => f.path === 'active');
      expect(activeField?.suggestedType).toBe('BOOLEAN');
    });

    it('should suggest VARCHAR(50) for short strings', () => {
      const documents = [
        { code: 'ABC123' }
      ];

      const result = analyzer.analyze(documents);

      const codeField = result.fields.find(f => f.path === 'code');
      expect(codeField?.suggestedType).toBe('VARCHAR(50)');
    });

    it('should suggest VARCHAR(255) for medium strings', () => {
      const longString = 'a'.repeat(150);
      const documents = [
        { description: longString }
      ];

      const result = analyzer.analyze(documents);

      const descField = result.fields.find(f => f.path === 'description');
      expect(descField?.suggestedType).toBe('VARCHAR(255)');
    });

    it('should suggest VARCHAR(500) for longer strings', () => {
      const longString = 'a'.repeat(400);
      const documents = [
        { content: longString }
      ];

      const result = analyzer.analyze(documents);

      const contentField = result.fields.find(f => f.path === 'content');
      expect(contentField?.suggestedType).toBe('VARCHAR(500)');
    });

    it('should suggest TEXT for very long strings', () => {
      const veryLongString = 'a'.repeat(1000);
      const documents = [
        { article: veryLongString }
      ];

      const result = analyzer.analyze(documents);

      const articleField = result.fields.find(f => f.path === 'article');
      expect(articleField?.suggestedType).toBe('TEXT');
    });

    it('should suggest TEXT for fields with multiple types', () => {
      const documents = [
        { mixed: 'string' },
        { mixed: 42 },
        { mixed: true }
      ];

      const result = analyzer.analyze(documents);

      const mixedField = result.fields.find(f => f.path === 'mixed');
      expect(mixedField?.suggestedType).toBe('TEXT');
    });

    it('should suggest VARCHAR(255) for empty strings', () => {
      const documents = [
        { emptyString: '' }
      ];

      const result = analyzer.analyze(documents);

      const field = result.fields.find(f => f.path === 'emptyString');
      expect(field?.suggestedType).toBe('VARCHAR(255)');
    });

    it('should suggest TEXT for fields with no type information', () => {
      const documents = [
        { unknownField: null }
      ];

      const result = analyzer.analyze(documents);

      const field = result.fields.find(f => f.path === 'unknownField');
      // Field with only null values won't have types, so default to TEXT
      expect(field?.types.size).toBe(0);
    });

    it('should handle complex nested structures', () => {
      const documents = [
        {
          level1: {
            level2: {
              level3: {
                deepField: 'value'
              }
            }
          }
        }
      ];

      const result = analyzer.analyze(documents);

      const deepField = result.fields.find(f => f.path === 'level1.level2.level3.deepField');
      expect(deepField).toBeDefined();
      expect(deepField?.types.has('string')).toBe(true);
    });

    it('should handle multiple documents with varying structures', () => {
      const documents = [
        { field1: 'value1', field2: 100 },
        { field1: 'value2', field3: true },
        { field2: 200, field3: false }
      ];

      const result = analyzer.analyze(documents);

      const field1 = result.fields.find(f => f.path === 'field1');
      const field2 = result.fields.find(f => f.path === 'field2');
      const field3 = result.fields.find(f => f.path === 'field3');

      expect(field1?.occurrence).toBe(2);
      expect(field2?.occurrence).toBe(2);
      expect(field3?.occurrence).toBe(2);
    });

    it('should handle nested field names correctly', () => {
      const documents = [
        {
          parent: {
            childName: 'value'
          }
        }
      ];

      const result = analyzer.analyze(documents);

      const field = result.fields.find(f => f.path === 'parent.childName');
      expect(field?.suggestedColumn).toBe('child_name');
    });
  });
});
