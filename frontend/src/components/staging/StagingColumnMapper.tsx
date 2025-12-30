import React, { useState } from 'react';

interface SourceColumn {
  tableName: string;
  columnName: string;
  columnType: string;
}

interface StagingColumnMapperProps {
  sourceTables: any[];
  stagingTables: any[];
  onMappingsChange: (mappings: any[]) => void;
  initialMappings?: any[];
}

export const StagingColumnMapper: React.FC<StagingColumnMapperProps> = ({
  sourceTables,
  stagingTables,
  onMappingsChange,
  initialMappings = [],
}) => {
  const [mappings, setMappings] = useState<any[]>(initialMappings);
  const [draggedColumn, setDraggedColumn] = useState<SourceColumn | null>(null);

  const handleDragStart = (tableName: string, columnName: string, columnType: string) => {
    setDraggedColumn({ tableName, columnName, columnType });
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (targetTable: string, targetColumn: string) => {
    if (!draggedColumn) return;

    const newMapping = {
      sourceTable: draggedColumn.tableName,
      sourceColumn: draggedColumn.columnName,
      targetTable,
      targetColumn,
    };

    const updated = [
      ...mappings.filter(
        m => !(m.sourceTable === draggedColumn.tableName && m.sourceColumn === draggedColumn.columnName)
      ),
      newMapping,
    ];

    setMappings(updated);
    onMappingsChange(updated);
    setDraggedColumn(null);
  };

  const removeMapping = (sourceTable: string, sourceColumn: string) => {
    const updated = mappings.filter(
      m => !(m.sourceTable === sourceTable && m.sourceColumn === sourceColumn)
    );
    setMappings(updated);
    onMappingsChange(updated);
  };

  const isMapped = (sourceTable: string, sourceColumn: string) => {
    return mappings.some(m => m.sourceTable === sourceTable && m.sourceColumn === sourceColumn);
  };

  const getMappingFor = (sourceTable: string, sourceColumn: string) => {
    return mappings.find(m => m.sourceTable === sourceTable && m.sourceColumn === sourceColumn);
  };

  return (
    <div>
      <div style={{ marginBottom: '15px', padding: '10px', backgroundColor: '#d4edda', borderRadius: '4px' }}>
        <strong>✓ {mappings.length} column(s) mapped</strong>
        {' • '}
        {sourceTables.reduce((sum, t) => sum + (t.columns?.length || 0), 0) - mappings.length} remaining
      </div>

      <div style={{ display: 'flex', gap: '20px' }}>
        {/* Source Tables */}
        <div style={{ flex: '1', backgroundColor: '#f8f9fa', padding: '15px', borderRadius: '8px' }}>
          <h3>Source Tables & Columns</h3>
          <div style={{ fontSize: '12px', color: '#666', marginBottom: '10px' }}>
            Drag columns to staging tables →
          </div>

          {sourceTables.map(table => (
            <div key={table.tableName} style={{ marginBottom: '20px' }}>
              <h4 style={{
                backgroundColor: '#007bff',
                color: 'white',
                padding: '8px 12px',
                borderRadius: '4px',
                fontSize: '14px',
                margin: '0 0 10px 0',
              }}>
                {table.tableName}
              </h4>

              <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
                {table.columns?.map((col: any) => {
                  const mapping = getMappingFor(table.tableName, col.name);
                  return (
                    <div
                      key={col.name}
                      draggable
                      onDragStart={() => handleDragStart(table.tableName, col.name, col.type)}
                      style={{
                        padding: '10px',
                        marginBottom: '8px',
                        backgroundColor: isMapped(table.tableName, col.name) ? '#d4edda' : 'white',
                        border: '1px solid #ddd',
                        borderRadius: '4px',
                        cursor: 'move',
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                          <div style={{ fontWeight: 'bold' }}>{col.name}</div>
                          <div style={{ fontSize: '12px', color: '#666' }}>{col.type}</div>
                        </div>
                        {mapping && (
                          <div style={{ fontSize: '12px', color: '#28a745' }}>
                            → {mapping.targetTable}.{mapping.targetColumn}
                          </div>
                        )}
                      </div>
                      {mapping && (
                        <button
                          onClick={() => removeMapping(table.tableName, col.name)}
                          style={{
                            marginTop: '5px',
                            padding: '4px 8px',
                            backgroundColor: '#dc3545',
                            color: 'white',
                            border: 'none',
                            borderRadius: '3px',
                            cursor: 'pointer',
                            fontSize: '11px',
                          }}
                        >
                          Remove Mapping
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* Staging Tables */}
        <div style={{ flex: '1', backgroundColor: '#f8f9fa', padding: '15px', borderRadius: '8px' }}>
          <h3>Staging Tables & Columns</h3>
          <div style={{ fontSize: '12px', color: '#666', marginBottom: '10px' }}>
            Drop columns here ←
          </div>

          {stagingTables.map(table => (
            <div key={table.name} style={{ marginBottom: '20px' }}>
              <h4 style={{
                backgroundColor: '#28a745',
                color: 'white',
                padding: '8px 12px',
                borderRadius: '4px',
                fontSize: '14px',
                margin: '0 0 10px 0',
              }}>
                {table.name}
              </h4>

              <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
                {table.columns?.map((col: any) => (
                  <div
                    key={col.name}
                    onDragOver={handleDragOver}
                    onDrop={() => handleDrop(table.name, col.name)}
                    style={{
                      padding: '10px',
                      marginBottom: '8px',
                      backgroundColor: 'white',
                      border: '2px dashed #ddd',
                      borderRadius: '4px',
                      cursor: 'pointer',
                    }}
                  >
                    <div style={{ fontWeight: 'bold' }}>{col.name}</div>
                    <div style={{ fontSize: '12px', color: '#666' }}>{col.type}</div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
