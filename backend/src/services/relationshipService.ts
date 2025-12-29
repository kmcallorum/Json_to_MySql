export interface TableRelationship {
  parentTable: string;
  childTable: string;
  foreignKeyColumn: string;
  parentKeyColumn: string;
}

export class RelationshipService {
  static autoDetectRelationships(tables: any[]): TableRelationship[] {
    const relationships: TableRelationship[] = [];

    for (const table of tables) {
      for (const column of table.columns) {
        // Look for columns ending with _id
        if (column.name.endsWith('_id') && !column.isPrimaryKey) {
          // Extract the parent table name (e.g., "document_id" -> "document")
          const parentTableName = column.name.replace(/_id$/, '');
          
          // Check if parent table exists
          const parentTable = tables.find(t => t.name === parentTableName);
          
          if (parentTable) {
            relationships.push({
              parentTable: parentTableName,
              childTable: table.name,
              foreignKeyColumn: column.name,
              parentKeyColumn: 'id'
            });
          }
        }
      }
    }

    return relationships;
  }

  static getInsertOrder(tableNames: string[], relationships: TableRelationship[]): string[] {
    const graph = new Map<string, string[]>();
    const inDegree = new Map<string, number>();

    // Initialize graph
    for (const table of tableNames) {
      graph.set(table, []);
      inDegree.set(table, 0);
    }

    // Build graph
    for (const rel of relationships) {
      if (graph.has(rel.parentTable) && graph.has(rel.childTable)) {
        graph.get(rel.parentTable)!.push(rel.childTable);
        inDegree.set(rel.childTable, (inDegree.get(rel.childTable) || 0) + 1);
      }
    }

    // Topological sort (Kahn's algorithm)
    const queue: string[] = [];
    const result: string[] = [];

    // Find all nodes with no incoming edges
    for (const [table, degree] of inDegree.entries()) {
      if (degree === 0) {
        queue.push(table);
      }
    }

    while (queue.length > 0) {
      const current = queue.shift()!;
      result.push(current);

      for (const neighbor of graph.get(current) || []) {
        inDegree.set(neighbor, (inDegree.get(neighbor) || 0) - 1);
        if (inDegree.get(neighbor) === 0) {
          queue.push(neighbor);
        }
      }
    }

    // Check for cycles
    if (result.length !== tableNames.length) {
      throw new Error('Circular dependency detected in table relationships');
    }

    return result;
  }
}
