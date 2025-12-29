import React, { useState, useEffect } from 'react';
import { FieldAnalysis, TableDefinition, FieldMapping } from '../../types';
import { api } from '../../services/api';

interface DragDropMapperProps {
  fields: FieldAnalysis[];
  tables: TableDefinition[];
  onMappingsChange: (mappings: FieldMapping[]) => void;
  initialMappings?: FieldMapping[];
  baseTableName?: string;
}

export const DragDropMapper: React.FC<DragDropMapperProps> = ({
  fields,
  tables,
  onMappingsChange,
  initialMappings = [],
  baseTableName,
}) => {
  const [mappings, setMappings] = useState<FieldMapping[]>(initialMappings);
  const [draggedField, setDraggedField] = useState<FieldAnalysis | null>(null);
  const [showLoadMapping, setShowLoadMapping] = useState(false);
  const [savedMappings, setSavedMappings] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (initialMappings.length > 0) {
      setMappings(initialMappings);
    }
  }, [initialMappings]);

  const loadSavedMappings = async () => {
    setIsLoading(true);
    try {
      const result = await api.listMappingConfigs();
      if (result.success) {
        // Filter by base table name if provided
        const filtered = baseTableName 
          ? result.configs.filter((c: any) => c.baseTableName === baseTableName)
          : result.configs;
        setSavedMappings(filtered);
      }
    } catch (error) {
      console.error('Failed to load mappings:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLoadMapping = async (name: string) => {
    setIsLoading(true);
    try {
      const result = await api.loadMappingConfig(name);
      if (result.success) {
        const config = result.config;
        setMappings(config.mappings);
        onMappingsChange(config.mappings);
        setShowLoadMapping(false);
        alert(`Mapping '${name}' loaded! ${config.mappings.length} fields mapped.`);
      } else {
        alert(`Failed: ${result.error}`);
      }
    } catch (error: any) {
      alert(`Error: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDragStart = (field: FieldAnalysis) => {
    setDraggedField(field);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (tableName: string, columnName: string, dataType: string) => {
    if (!draggedField) return;

    const newMapping: FieldMapping = {
      sourcePath: draggedField.path,
      targetTable: tableName,
      targetColumn: columnName,
      dataType: dataType,
      isArray: draggedField.isArray,
    };

    const updated = [...mappings.filter(m => m.sourcePath !== draggedField.path), newMapping];
    setMappings(updated);
    onMappingsChange(updated);
    setDraggedField(null);
  };

  const removeMapping = (sourcePath: string) => {
    const updated = mappings.filter(m => m.sourcePath !== sourcePath);
    setMappings(updated);
    onMappingsChange(updated);
  };

  const clearAllMappings = () => {
    if (confirm('Clear all mappings?')) {
      setMappings([]);
      onMappingsChange([]);
    }
  };

  const isMapped = (fieldPath: string) => {
    return mappings.some(m => m.sourcePath === fieldPath);
  };

  const getMappingForField = (fieldPath: string) => {
    return mappings.find(m => m.sourcePath === fieldPath);
  };

  return (
    <div>
      {/* Mapping Actions */}
      <div style={{ marginBottom: '15px', display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
        <button
          onClick={() => {
            loadSavedMappings();
            setShowLoadMapping(true);
          }}
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
          📂 Load Saved Mapping
        </button>
        {mappings.length > 0 && (
          <button
            onClick={clearAllMappings}
            style={{
              padding: '10px 20px',
              backgroundColor: '#dc3545',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
            }}
          >
            🗑️ Clear All Mappings
          </button>
        )}
      </div>

      {/* Load Mapping Modal */}
      {showLoadMapping && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex',
          alignItems: 'center', justifyContent: 'center', zIndex: 1000,
        }}>
          <div style={{
            backgroundColor: 'white', padding: '30px', borderRadius: '8px',
            maxWidth: '600px', width: '90%', maxHeight: '80vh', overflowY: 'auto',
          }}>
            <h3>Load Saved Mapping</h3>
            {isLoading ? (
              <p>Loading...</p>
            ) : savedMappings.length === 0 ? (
              <p style={{ color: '#666', fontStyle: 'italic' }}>
                No saved mappings found{baseTableName ? ` for table '${baseTableName}'` : ''}.
              </p>
            ) : (
              <div>
                {savedMappings.map(mapping => (
                  <div key={mapping.id} style={{
                    padding: '15px', marginBottom: '10px', border: '1px solid #ddd',
                    borderRadius: '4px', backgroundColor: '#f8f9fa',
                  }}>
                    <div style={{ fontWeight: 'bold', fontSize: '16px', marginBottom: '5px' }}>
                      {mapping.name}
                    </div>
                    {mapping.description && (
                      <div style={{ fontSize: '14px', color: '#666', marginBottom: '5px' }}>
                        {mapping.description}
                      </div>
                    )}
                    <div style={{ fontSize: '12px', color: '#666' }}>
                      Table: {mapping.baseTableName} • Updated: {new Date(mapping.updatedAt).toLocaleString()}
                    </div>
                    <button
                      onClick={() => handleLoadMapping(mapping.name)}
                      disabled={isLoading}
                      style={{
                        marginTop: '10px', padding: '8px 16px', backgroundColor: '#28a745',
                        color: 'white', border: 'none', borderRadius: '4px',
                        cursor: 'pointer', fontWeight: 'bold',
                      }}
                    >
                      Load This Mapping
                    </button>
                  </div>
                ))}
              </div>
            )}
            <button onClick={() => setShowLoadMapping(false)} style={{
              marginTop: '15px', padding: '8px 16px', backgroundColor: '#6c757d',
              color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer',
            }}>Close</button>
          </div>
        </div>
      )}

      {/* Mapping Status */}
      {mappings.length > 0 && (
        <div style={{ 
          marginBottom: '15px', 
          padding: '10px', 
          backgroundColor: '#d4edda', 
          borderRadius: '4px',
          border: '1px solid #c3e6cb'
        }}>
          <strong>✓ {mappings.length} field(s) mapped</strong> 
          {' • '}
          {fields.length - mappings.length} remaining
        </div>
      )}

      <div style={{ display: 'flex', gap: '20px' }}>
        {/* Source Fields */}
        <div style={{ flex: '1', backgroundColor: '#f8f9fa', padding: '15px', borderRadius: '8px' }}>
          <h3>JSON Fields ({fields.length})</h3>
          <div style={{ fontSize: '12px', color: '#666', marginBottom: '10px' }}>
            Drag fields to table columns →
          </div>
          <div style={{ maxHeight: '600px', overflowY: 'auto' }}>
            {fields.map(field => {
              const mapping = getMappingForField(field.path);
              return (
                <div
                  key={field.path}
                  draggable
                  onDragStart={() => handleDragStart(field)}
                  style={{
                    padding: '10px',
                    marginBottom: '8px',
                    backgroundColor: isMapped(field.path) ? '#d4edda' : 'white',
                    border: '1px solid #ddd',
                    borderRadius: '4px',
                    cursor: 'move',
                  }}
                >
                  <div style={{ fontWeight: 'bold', fontSize: '14px' }}>
                    {field.path}
                    {field.isArray && <span style={{ marginLeft: '5px', color: '#007bff' }}>[]</span>}
                  </div>
                  <div style={{ fontSize: '12px', color: '#666' }}>
                    {Array.from(field.types).join(', ')} • {field.suggestedType}
                  </div>
                  {mapping && (
                    <div style={{ fontSize: '12px', color: '#28a745', marginTop: '5px' }}>
                      ✓ Mapped to: {mapping.targetTable}.{mapping.targetColumn}
                      <button
                        onClick={() => removeMapping(field.path)}
                        style={{
                          marginLeft: '10px',
                          padding: '2px 8px',
                          fontSize: '11px',
                          backgroundColor: '#dc3545',
                          color: 'white',
                          border: 'none',
                          borderRadius: '3px',
                          cursor: 'pointer',
                        }}
                      >
                        Remove
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Target Tables */}
        <div style={{ flex: '1', backgroundColor: '#f8f9fa', padding: '15px', borderRadius: '8px' }}>
          <h3>Target Tables ({tables.length})</h3>
          <div style={{ fontSize: '12px', color: '#666', marginBottom: '10px' }}>
            Drop fields onto columns
          </div>
          <div style={{ maxHeight: '600px', overflowY: 'auto' }}>
            {tables.map(table => (
              <div
                key={table.name}
                style={{
                  marginBottom: '20px',
                  padding: '15px',
                  backgroundColor: 'white',
                  border: '2px solid #007bff',
                  borderRadius: '8px',
                }}
              >
                <h4 style={{ marginTop: 0 }}>
                  {table.name}
                  {table.isNew && <span style={{ marginLeft: '8px', fontSize: '12px', color: '#28a745' }}>(New)</span>}
                </h4>
                <div style={{ fontSize: '12px', color: '#666', marginBottom: '10px' }}>
                  {table.columns.length} columns
                </div>
                {table.columns.map(column => {
                  const mappedField = mappings.find(
                    m => m.targetTable === table.name && m.targetColumn === column.name
                  );

                  return (
                    <div
                      key={column.name}
                      onDragOver={handleDragOver}
                      onDrop={(e) => {
                        e.preventDefault();
                        handleDrop(table.name, column.name, column.type);
                      }}
                      style={{
                        padding: '8px',
                        marginBottom: '6px',
                        backgroundColor: mappedField ? '#fff3cd' : '#f8f9fa',
                        border: '1px dashed #ccc',
                        borderRadius: '4px',
                        minHeight: '40px',
                      }}
                    >
                      <div style={{ fontWeight: 'bold', fontSize: '13px' }}>
                        {column.name}
                        {column.isPrimaryKey && <span style={{ marginLeft: '5px', color: '#dc3545' }}>🔑</span>}
                      </div>
                      <div style={{ fontSize: '11px', color: '#666' }}>
                        {column.type}
                        {!column.nullable && ' • NOT NULL'}
                      </div>
                      {mappedField && (
                        <div style={{ fontSize: '11px', color: '#856404', marginTop: '4px', fontStyle: 'italic' }}>
                          ← {mappedField.sourcePath}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
