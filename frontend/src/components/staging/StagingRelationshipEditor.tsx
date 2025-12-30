import React, { useState, useEffect } from 'react';

interface StagingRelationshipEditorProps {
  tables: any[];
  relationships: any[];
  onRelationshipsChange: (relationships: any[]) => void;
}

export const StagingRelationshipEditor: React.FC<StagingRelationshipEditorProps> = ({
  tables,
  relationships,
  onRelationshipsChange,
}) => {
  const [localRelationships, setLocalRelationships] = useState(relationships);

  useEffect(() => {
    // Auto-detect relationships based on naming conventions
    autoDetectRelationships();
  }, [tables]);

  const autoDetectRelationships = () => {
    const detected: any[] = [];

    // Look for tables with naming pattern: staging_event_data and staging_event_test_data
    tables.forEach(table => {
      tables.forEach(potentialChild => {
        if (table.name !== potentialChild.name) {
          // Check if child table name starts with parent table name
          if (potentialChild.name.startsWith(table.name + '_')) {
            // Look for ID columns
            const parentIdCol = table.columns?.find((c: any) => c.name === 'id');
            const childFkCol = potentialChild.columns?.find(
              (c: any) => c.name === table.name.replace('staging_', '') + '_id' || c.name === 'parent_id'
            );

            if (parentIdCol) {
              detected.push({
                parentTable: table.name,
                childTable: potentialChild.name,
                parentKeyColumn: 'id',
                foreignKeyColumn: childFkCol?.name || 'parent_id',
              });
            }
          }
        }
      });
    });

    if (detected.length > 0) {
      setLocalRelationships(detected);
      onRelationshipsChange(detected);
    }
  };

  const handleAddRelationship = () => {
    const newRel = {
      parentTable: tables[0]?.name || '',
      childTable: tables[1]?.name || '',
      parentKeyColumn: 'id',
      foreignKeyColumn: 'parent_id',
    };

    const updated = [...localRelationships, newRel];
    setLocalRelationships(updated);
    onRelationshipsChange(updated);
  };

  const handleRemoveRelationship = (index: number) => {
    const updated = localRelationships.filter((_, i) => i !== index);
    setLocalRelationships(updated);
    onRelationshipsChange(updated);
  };

  const handleUpdateRelationship = (index: number, field: string, value: string) => {
    const updated = localRelationships.map((rel, i) =>
      i === index ? { ...rel, [field]: value } : rel
    );
    setLocalRelationships(updated);
    onRelationshipsChange(updated);
  };

  return (
    <div style={{ padding: '20px' }}>
      <h3>Table Relationships</h3>
      <p style={{ color: '#666' }}>
        Define parent-child relationships for proper insert order.
      </p>

      {localRelationships.length > 0 && (
        <div style={{ marginBottom: '20px', padding: '15px', backgroundColor: '#d4edda', borderRadius: '4px' }}>
          <h4 style={{ marginTop: 0 }}>Auto-Detected Relationships:</h4>
          {localRelationships.map((rel, index) => (
            <div key={index} style={{ marginBottom: '10px', fontSize: '14px' }}>
              ✓ {rel.parentTable}.{rel.parentKeyColumn} → {rel.childTable}.{rel.foreignKeyColumn}
            </div>
          ))}
        </div>
      )}

      <button
        onClick={handleAddRelationship}
        style={{
          padding: '10px 20px',
          backgroundColor: '#007bff',
          color: 'white',
          border: 'none',
          borderRadius: '4px',
          cursor: 'pointer',
          marginBottom: '20px',
        }}
      >
        + Add Relationship
      </button>

      {localRelationships.map((rel, index) => (
        <div
          key={index}
          style={{
            marginBottom: '15px',
            padding: '15px',
            backgroundColor: '#f8f9fa',
            borderRadius: '4px',
            border: '1px solid #dee2e6',
          }}
        >
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '10px' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                Parent Table
              </label>
              <select
                value={rel.parentTable}
                onChange={e => handleUpdateRelationship(index, 'parentTable', e.target.value)}
                style={{
                  width: '100%',
                  padding: '8px',
                  border: '1px solid #ccc',
                  borderRadius: '4px',
                }}
              >
                {tables.map(t => (
                  <option key={t.name} value={t.name}>
                    {t.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                Parent Key Column
              </label>
              <select
                value={rel.parentKeyColumn}
                onChange={e => handleUpdateRelationship(index, 'parentKeyColumn', e.target.value)}
                style={{
                  width: '100%',
                  padding: '8px',
                  border: '1px solid #ccc',
                  borderRadius: '4px',
                }}
              >
                {tables
                  .find(t => t.name === rel.parentTable)
                  ?.columns?.map((c: any) => (
                    <option key={c.name} value={c.name}>
                      {c.name}
                    </option>
                  ))}
              </select>
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                Child Table
              </label>
              <select
                value={rel.childTable}
                onChange={e => handleUpdateRelationship(index, 'childTable', e.target.value)}
                style={{
                  width: '100%',
                  padding: '8px',
                  border: '1px solid #ccc',
                  borderRadius: '4px',
                }}
              >
                {tables.map(t => (
                  <option key={t.name} value={t.name}>
                    {t.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                Foreign Key Column
              </label>
              <select
                value={rel.foreignKeyColumn}
                onChange={e => handleUpdateRelationship(index, 'foreignKeyColumn', e.target.value)}
                style={{
                  width: '100%',
                  padding: '8px',
                  border: '1px solid #ccc',
                  borderRadius: '4px',
                }}
              >
                {tables
                  .find(t => t.name === rel.childTable)
                  ?.columns?.map((c: any) => (
                    <option key={c.name} value={c.name}>
                      {c.name}
                    </option>
                  ))}
              </select>
            </div>
          </div>

          <button
            onClick={() => handleRemoveRelationship(index)}
            style={{
              padding: '6px 12px',
              backgroundColor: '#dc3545',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '12px',
            }}
          >
            Remove
          </button>
        </div>
      ))}
    </div>
  );
};
