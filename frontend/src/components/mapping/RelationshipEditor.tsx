import React, { useState } from 'react';

export interface TableRelationship {
  parentTable: string;
  childTable: string;
  foreignKeyColumn: string;
  parentKeyColumn: string;
}

interface RelationshipEditorProps {
  tables: Array<{ name: string; columns: Array<{ name: string; type: string }> }>;
  relationships: TableRelationship[];
  onRelationshipsChange: (relationships: TableRelationship[]) => void;
}

export const RelationshipEditor: React.FC<RelationshipEditorProps> = ({
  tables,
  relationships,
  onRelationshipsChange,
}) => {
  const [showEditor, setShowEditor] = useState(false);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [parentTable, setParentTable] = useState('');
  const [childTable, setChildTable] = useState('');
  const [foreignKeyColumn, setForeignKeyColumn] = useState('');
  const [parentKeyColumn, setParentKeyColumn] = useState('id');

  const handleAutoDetect = () => {
    const detected: TableRelationship[] = [];

    tables.forEach(table => {
      table.columns.forEach(column => {
        const match = column.name.match(/^(.+)_id$/);
        if (match) {
          const potentialParent = match[1];
          const parentTable = tables.find(t => t.name === potentialParent);
          
          if (parentTable && parentTable.columns.some(c => c.name === 'id')) {
            detected.push({
              parentTable: parentTable.name,
              childTable: table.name,
              foreignKeyColumn: column.name,
              parentKeyColumn: 'id',
            });
          }
        }
      });
    });

    onRelationshipsChange(detected);
    alert(`Auto-detected ${detected.length} relationship(s)!`);
  };

  const handleAddRelationship = () => {
    if (!parentTable || !childTable || !foreignKeyColumn) {
      alert('Please fill in all fields');
      return;
    }

    const newRel: TableRelationship = {
      parentTable,
      childTable,
      foreignKeyColumn,
      parentKeyColumn: parentKeyColumn || 'id',
    };

    if (editingIndex !== null) {
      const updated = [...relationships];
      updated[editingIndex] = newRel;
      onRelationshipsChange(updated);
      setEditingIndex(null);
    } else {
      onRelationshipsChange([...relationships, newRel]);
    }

    // Reset form
    setParentTable('');
    setChildTable('');
    setForeignKeyColumn('');
    setParentKeyColumn('id');
    setShowEditor(false);
  };

  const handleEdit = (index: number) => {
    const rel = relationships[index];
    setParentTable(rel.parentTable);
    setChildTable(rel.childTable);
    setForeignKeyColumn(rel.foreignKeyColumn);
    setParentKeyColumn(rel.parentKeyColumn);
    setEditingIndex(index);
    setShowEditor(true);
  };

  const handleDelete = (index: number) => {
    if (confirm('Delete this relationship?')) {
      onRelationshipsChange(relationships.filter((_, i) => i !== index));
    }
  };

  const getChildColumns = () => {
    const table = tables.find(t => t.name === childTable);
    return table?.columns || [];
  };

  const getParentColumns = () => {
    const table = tables.find(t => t.name === parentTable);
    return table?.columns || [];
  };

  return (
    <div style={{ marginTop: '30px', padding: '20px', backgroundColor: '#f8f9fa', borderRadius: '8px' }}>
      <h3>Table Relationships (Optional)</h3>
      <p style={{ color: '#666', marginBottom: '15px' }}>
        Define parent-child relationships to handle foreign keys during insert. 
        Auto-detect finds columns like <code>document_id</code> → <code>document.id</code>
      </p>

      <div style={{ marginBottom: '15px', display: 'flex', gap: '10px' }}>
        <button
          onClick={handleAutoDetect}
          style={{
            padding: '10px 20px',
            backgroundColor: '#17a2b8',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            fontWeight: 'bold',
          }}
        >
          🔍 Auto-Detect Relationships
        </button>
        <button
          onClick={() => setShowEditor(true)}
          style={{
            padding: '10px 20px',
            backgroundColor: '#28a745',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
          }}
        >
          + Add Relationship
        </button>
      </div>

      {/* Existing Relationships */}
      {relationships.length > 0 && (
        <div style={{ marginBottom: '20px' }}>
          <h4>Defined Relationships ({relationships.length}):</h4>
          <div style={{ backgroundColor: 'white', padding: '15px', borderRadius: '4px' }}>
            {relationships.map((rel, index) => (
              <div
                key={index}
                style={{
                  padding: '10px',
                  marginBottom: '8px',
                  backgroundColor: '#e7f3ff',
                  borderRadius: '4px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <div style={{ fontSize: '14px' }}>
                  <strong>{rel.parentTable}</strong>.{rel.parentKeyColumn} 
                  <span style={{ margin: '0 10px', color: '#666' }}>→</span>
                  <strong>{rel.childTable}</strong>.{rel.foreignKeyColumn}
                </div>
                <div style={{ display: 'flex', gap: '5px' }}>
                  <button
                    onClick={() => handleEdit(index)}
                    style={{
                      padding: '4px 12px',
                      fontSize: '12px',
                      backgroundColor: '#007bff',
                      color: 'white',
                      border: 'none',
                      borderRadius: '3px',
                      cursor: 'pointer',
                    }}
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(index)}
                    style={{
                      padding: '4px 12px',
                      fontSize: '12px',
                      backgroundColor: '#dc3545',
                      color: 'white',
                      border: 'none',
                      borderRadius: '3px',
                      cursor: 'pointer',
                    }}
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Add/Edit Form */}
      {showEditor && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex',
          alignItems: 'center', justifyContent: 'center', zIndex: 1000,
        }}>
          <div style={{
            backgroundColor: 'white', padding: '30px', borderRadius: '8px',
            maxWidth: '600px', width: '90%',
          }}>
            <h3>{editingIndex !== null ? 'Edit' : 'Add'} Relationship</h3>

            <div style={{ marginBottom: '15px' }}>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                Parent Table *
              </label>
              <select
                value={parentTable}
                onChange={(e) => setParentTable(e.target.value)}
                style={{
                  width: '100%', padding: '8px', border: '1px solid #ccc', borderRadius: '4px',
                }}
              >
                <option value="">-- Select Parent Table --</option>
                {tables.map(table => (
                  <option key={table.name} value={table.name}>{table.name}</option>
                ))}
              </select>
            </div>

            <div style={{ marginBottom: '15px' }}>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                Parent Key Column
              </label>
              <select
                value={parentKeyColumn}
                onChange={(e) => setParentKeyColumn(e.target.value)}
                disabled={!parentTable}
                style={{
                  width: '100%', padding: '8px', border: '1px solid #ccc', borderRadius: '4px',
                }}
              >
                <option value="id">id (default)</option>
                {getParentColumns().map(col => (
                  <option key={col.name} value={col.name}>{col.name}</option>
                ))}
              </select>
            </div>

            <div style={{ marginBottom: '15px' }}>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                Child Table *
              </label>
              <select
                value={childTable}
                onChange={(e) => setChildTable(e.target.value)}
                style={{
                  width: '100%', padding: '8px', border: '1px solid #ccc', borderRadius: '4px',
                }}
              >
                <option value="">-- Select Child Table --</option>
                {tables.filter(t => t.name !== parentTable).map(table => (
                  <option key={table.name} value={table.name}>{table.name}</option>
                ))}
              </select>
            </div>

            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                Foreign Key Column (in child table) *
              </label>
              <select
                value={foreignKeyColumn}
                onChange={(e) => setForeignKeyColumn(e.target.value)}
                disabled={!childTable}
                style={{
                  width: '100%', padding: '8px', border: '1px solid #ccc', borderRadius: '4px',
                }}
              >
                <option value="">-- Select Column --</option>
                {getChildColumns().map(col => (
                  <option key={col.name} value={col.name}>{col.name} ({col.type})</option>
                ))}
              </select>
            </div>

            <div style={{ 
              padding: '10px', 
              backgroundColor: '#fff3cd', 
              borderRadius: '4px',
              marginBottom: '20px',
              fontSize: '13px'
            }}>
              <strong>Example:</strong> If document.id is parent of event_data.document_id:<br/>
              Parent Table: <code>document</code>, Parent Key: <code>id</code><br/>
              Child Table: <code>event_data</code>, Foreign Key: <code>document_id</code>
            </div>

            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
              <button
                onClick={() => {
                  setShowEditor(false);
                  setEditingIndex(null);
                  setParentTable('');
                  setChildTable('');
                  setForeignKeyColumn('');
                  setParentKeyColumn('id');
                }}
                style={{
                  padding: '8px 16px', backgroundColor: '#6c757d', color: 'white',
                  border: 'none', borderRadius: '4px', cursor: 'pointer',
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleAddRelationship}
                disabled={!parentTable || !childTable || !foreignKeyColumn}
                style={{
                  padding: '8px 16px', backgroundColor: '#28a745', color: 'white',
                  border: 'none', borderRadius: '4px', cursor: 'pointer',
                }}
              >
                {editingIndex !== null ? 'Update' : 'Add'} Relationship
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Visual Hierarchy */}
      {relationships.length > 0 && (
        <div style={{ marginTop: '20px' }}>
          <h4>Insert Order Preview:</h4>
          <div style={{ 
            padding: '15px', 
            backgroundColor: 'white', 
            borderRadius: '4px',
            fontFamily: 'monospace',
            fontSize: '13px'
          }}>
            {(() => {
              // Simple hierarchy visualization
              const parents = new Set(relationships.map(r => r.parentTable));
              const children = new Set(relationships.map(r => r.childTable));
              const roots = Array.from(parents).filter(p => !children.has(p));
              
              const renderTree = (table: string, level: number = 0): string[] => {
                const indent = '  '.repeat(level);
                const lines = [`${indent}${level > 0 ? '↳ ' : ''}${table}`];
                
                relationships
                  .filter(r => r.parentTable === table)
                  .forEach(rel => {
                    lines.push(...renderTree(rel.childTable, level + 1));
                  });
                
                return lines;
              };

              return roots.flatMap(root => renderTree(root)).map((line, i) => (
                <div key={i}>{line}</div>
              ));
            })()}
          </div>
        </div>
      )}
    </div>
  );
};
