import { describe, it, expect } from '@jest/globals';
import { RelationshipService } from '../../../src/services/relationshipService.js';

describe('RelationshipService', () => {
  describe('autoDetectRelationships', () => {
    it('should detect relationships when parent table exists', () => {
      const tables = [
        {
          name: 'users',
          columns: [{ name: 'id', isPrimaryKey: true }]
        },
        {
          name: 'posts',
          columns: [
            { name: 'id', isPrimaryKey: true },
            { name: 'users_id', isPrimaryKey: false }
          ]
        }
      ];

      const relationships = RelationshipService.autoDetectRelationships(tables);

      expect(relationships).toBeDefined();
      expect(Array.isArray(relationships)).toBe(true);
      expect(relationships.length).toBe(1);
      expect(relationships[0].parentTable).toBe('users');
      expect(relationships[0].childTable).toBe('posts');
      expect(relationships[0].foreignKeyColumn).toBe('users_id');
      expect(relationships[0].parentKeyColumn).toBe('id');
    });

    it('should return empty array for tables with no _id columns', () => {
      const tables = [
        {
          name: 'events',
          columns: [
            { name: 'id', isPrimaryKey: true },
            { name: 'type', isPrimaryKey: false }
          ]
        }
      ];

      const relationships = RelationshipService.autoDetectRelationships(tables);

      expect(relationships).toEqual([]);
    });

    it('should handle empty tables array', () => {
      const relationships = RelationshipService.autoDetectRelationships([]);

      expect(relationships).toEqual([]);
    });

    it('should not detect relationship when parent table does not exist', () => {
      const tables = [
        {
          name: 'posts',
          columns: [
            { name: 'id', isPrimaryKey: true },
            { name: 'users_id', isPrimaryKey: false }
          ]
        }
      ];

      const relationships = RelationshipService.autoDetectRelationships(tables);

      expect(relationships).toEqual([]);
    });

    it('should ignore primary key columns ending in _id', () => {
      const tables = [
        {
          name: 'events',
          columns: [{ name: 'event_id', isPrimaryKey: true }]
        }
      ];

      const relationships = RelationshipService.autoDetectRelationships(tables);

      expect(relationships).toEqual([]);
    });
  });

  describe('getInsertOrder', () => {
    it('should sort tables in correct insert order', () => {
      const tableNames = ['event_details', 'events'];
      const relationships = [
        {
          parentTable: 'events',
          childTable: 'event_details',
          foreignKeyColumn: 'event_id',
          parentKeyColumn: 'id'
        }
      ];

      const sorted = RelationshipService.getInsertOrder(tableNames, relationships);

      expect(sorted[0]).toBe('events');
      expect(sorted[1]).toBe('event_details');
    });

    it('should handle tables with no relationships', () => {
      const tableNames = ['table1', 'table2'];

      const sorted = RelationshipService.getInsertOrder(tableNames, []);

      expect(sorted).toHaveLength(2);
      expect(sorted).toContain('table1');
      expect(sorted).toContain('table2');
    });

    it('should throw error for circular dependencies', () => {
      const tableNames = ['table1', 'table2'];
      const relationships = [
        { parentTable: 'table1', childTable: 'table2', foreignKeyColumn: 'fk1', parentKeyColumn: 'id' },
        { parentTable: 'table2', childTable: 'table1', foreignKeyColumn: 'fk2', parentKeyColumn: 'id' }
      ];

      expect(() => {
        RelationshipService.getInsertOrder(tableNames, relationships);
      }).toThrow('Circular dependency detected');
    });

    it('should handle complex dependency chains', () => {
      const tableNames = ['table_c', 'table_a', 'table_b'];
      const relationships = [
        { parentTable: 'table_a', childTable: 'table_b', foreignKeyColumn: 'a_id', parentKeyColumn: 'id' },
        { parentTable: 'table_b', childTable: 'table_c', foreignKeyColumn: 'b_id', parentKeyColumn: 'id' }
      ];

      const sorted = RelationshipService.getInsertOrder(tableNames, relationships);

      const aIndex = sorted.findIndex(t => t === 'table_a');
      const bIndex = sorted.findIndex(t => t === 'table_b');
      const cIndex = sorted.findIndex(t => t === 'table_c');

      expect(aIndex).toBeLessThan(bIndex);
      expect(bIndex).toBeLessThan(cIndex);
    });

    it('should handle empty tables array', () => {
      const sorted = RelationshipService.getInsertOrder([], []);

      expect(sorted).toEqual([]);
    });

    it('should handle relationships with missing tables', () => {
      const tableNames = ['table1', 'table2'];
      const relationships = [
        // Relationship where child references parent not in tableNames
        { parentTable: 'table3', childTable: 'table1', foreignKeyColumn: 'fk', parentKeyColumn: 'id' }
      ];

      // Should still return all tables even if relationship references missing table
      const sorted = RelationshipService.getInsertOrder(tableNames, relationships);

      expect(sorted).toHaveLength(2);
      expect(sorted).toContain('table1');
      expect(sorted).toContain('table2');
    });

    it('should handle mixed scenarios with partial relationships', () => {
      const tableNames = ['a', 'b', 'c'];
      const relationships = [
        { parentTable: 'a', childTable: 'd', foreignKeyColumn: 'fk', parentKeyColumn: 'id' },  // d not in list
        { parentTable: 'x', childTable: 'b', foreignKeyColumn: 'fk2', parentKeyColumn: 'id' }  // x not in list
      ];

      // Should handle gracefully and return all tables
      const sorted = RelationshipService.getInsertOrder(tableNames, relationships);

      expect(sorted).toHaveLength(3);
      expect(sorted).toContain('a');
      expect(sorted).toContain('b');
      expect(sorted).toContain('c');
    });
  });
});
