import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { TableDefinition, FieldAnalysis } from '../../types';

interface TableSelectorProps {
  suggestedTables: string[];
  fields: FieldAnalysis[];
  baseTableName: string;
  onTablesSelected: (tables: TableDefinition[], mappingConfig?: any) => void;
}

export const TableSelector: React.FC<TableSelectorProps> = ({
  suggestedTables,
  fields,
  baseTableName,
  onTablesSelected,
}) => {
  const [mode, setMode] = useState<'suggested' | 'existing' | 'custom'>('suggested');
  const [existingTables, setExistingTables] = useState<string[]>([]);
  const [selectedExisting, setSelectedExisting] = useState<string[]>([]);
  const [customTables, setCustomTables] = useState<TableDefinition[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [availableMappings, setAvailableMappings] = useState<any[]>([]);
  const [showMappingPrompt, setShowMappingPrompt] = useState(false);

  useEffect(() => {
    if (mode === 'existing') {
      loadExistingTables();
    }
  }, [mode]);

  const loadExistingTables = async () => {
    setIsLoading(true);
    try {
      const result = await api.getTableList();
      if (result.success) {
        setExistingTables(result.tables);
      }
    } catch (error) {
      console.error('Failed to load tables:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const checkForExistingMappings = async (tableNames: string[]) => {
    try {
      const result = await api.findMappingsByTables(tableNames, baseTableName);
      if (result.success && result.matches.length > 0) {
        setAvailableMappings(result.matches);
        setShowMappingPrompt(true);
        return true;
      }
    } catch (error) {
      console.error('Failed to check for mappings:', error);
    }
    return false;
  };

  const handleUseSuggested = () => {
    const uniqueTables = Array.from(new Set(suggestedTables));
    const tables: TableDefinition[] = uniqueTables.map(tableName => ({
      name: tableName,
      columns: fields
        .filter(f => f.suggestedTable === tableName)
        .map(f => ({
          name: f.suggestedColumn,
          type: f.suggestedType,
          nullable: f.isNullable,
        })),
      isNew: true,
    }));

    onTablesSelected(tables);
  };

  const handleLoadExisting = async () => {
    if (selectedExisting.length === 0) {
      alert('Please select at least one table');
      return;
    }

    setIsLoading(true);
    try {
      // Check for existing mappings
      const hasMappings = await checkForExistingMappings(selectedExisting);
      
      if (!hasMappings) {
        // No mappings found, just load tables
        const result = await api.getTableStructures(selectedExisting);
        if (result.success) {
          onTablesSelected(result.tables.map((t: TableDefinition) => ({ ...t, isNew: false })));
        }
      }
    } catch (error) {
      console.error('Failed to load table structures:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLoadWithMapping = async (mappingName: string) => {
    setIsLoading(true);
    try {
      const result = await api.loadMappingConfig(mappingName);
      if (result.success) {
        const config = result.config;
        onTablesSelected(config.tables, config);
        setShowMappingPrompt(false);
      } else {
        alert(`Failed to load mapping: ${result.error}`);
      }
    } catch (error: any) {
      alert(`Error: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSkipMapping = async () => {
    setShowMappingPrompt(false);
    setIsLoading(true);
    try {
      const result = await api.getTableStructures(selectedExisting);
      if (result.success) {
        onTablesSelected(result.tables.map((t: TableDefinition) => ({ ...t, isNew: false })));
      }
    } catch (error) {
      console.error('Failed to load table structures:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const addCustomTable = () => {
    const tableName = prompt('Enter table name:');
    if (!tableName) return;

    const newTable: TableDefinition = {
      name: tableName,
      columns: [
        { name: 'id', type: 'BIGINT', nullable: false, isPrimaryKey: true },
      ],
      isNew: true,
    };

    setCustomTables([...customTables, newTable]);
  };

  const addColumnToCustomTable = (tableIndex: number) => {
    const columnName = prompt('Enter column name:');
    if (!columnName) return;

    const dataType = prompt('Enter data type (e.g., VARCHAR(255), INT):', 'VARCHAR(255)');
    if (!dataType) return;

    const updated = [...customTables];
    updated[tableIndex].columns.push({
      name: columnName,
      type: dataType,
      nullable: true,
    });

    setCustomTables(updated);
  };

  const handleUseCustom = () => {
    if (customTables.length === 0) {
      alert('Please create at least one table');
      return;
    }
    onTablesSelected(customTables);
  };

  return (
    <div style={{ padding: '20px', backgroundColor: '#f8f9fa', borderRadius: '8px' }}>
      <h3>Choose Table Setup</h3>

      {/* Mode Selection */}
      <div style={{ marginBottom: '20px', display: 'flex', gap: '10px' }}>
        <button
          onClick={() => setMode('suggested')}
          style={{
            padding: '10px 20px',
            backgroundColor: mode === 'suggested' ? '#007bff' : '#6c757d',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
          }}
        >
          Use Suggested Tables
        </button>
        <button
          onClick={() => setMode('existing')}
          style={{
            padding: '10px 20px',
            backgroundColor: mode === 'existing' ? '#007bff' : '#6c757d',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
          }}
        >
          Load Existing Tables
        </button>
        <button
          onClick={() => setMode('custom')}
          style={{
            padding: '10px 20px',
            backgroundColor: mode === 'custom' ? '#007bff' : '#6c757d',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
          }}
        >
          Create Custom Tables
        </button>
      </div>

      {/* Mapping Prompt Modal */}
      {showMappingPrompt && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex',
          alignItems: 'center', justifyContent: 'center', zIndex: 1000,
        }}>
          <div style={{
            backgroundColor: 'white', padding: '30px', borderRadius: '8px',
            maxWidth: '600px', width: '90%',
          }}>
            <h3>🎉 Found Existing Mappings!</h3>
            <p>We found {availableMappings.length} saved mapping(s) for these tables. Would you like to load one?</p>
            
            <div style={{ marginBottom: '20px', maxHeight: '300px', overflowY: 'auto' }}>
              {availableMappings.map(mapping => (
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
                    Updated: {new Date(mapping.updatedAt).toLocaleString()}
                  </div>
                  <button
                    onClick={() => handleLoadWithMapping(mapping.name)}
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

            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
              <button
                onClick={handleSkipMapping}
                disabled={isLoading}
                style={{
                  padding: '10px 20px', backgroundColor: '#6c757d', color: 'white',
                  border: 'none', borderRadius: '4px', cursor: 'pointer',
                }}
              >
                Skip - Map Manually
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Suggested Tables */}
      {mode === 'suggested' && (
        <div>
          <p>The analyzer has suggested <strong>{Array.from(new Set(suggestedTables)).length}</strong> tables based on your JSON structure.</p>
          <ul>
            {Array.from(new Set(suggestedTables)).map(table => (
              <li key={table}>
                <strong>{table}</strong> ({fields.filter(f => f.suggestedTable === table).length} fields)
              </li>
            ))}
          </ul>
          <button
            onClick={handleUseSuggested}
            style={{
              padding: '12px 24px',
              backgroundColor: '#28a745',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontWeight: 'bold',
            }}
          >
            Use These Suggested Tables
          </button>
        </div>
      )}

      {/* Existing Tables */}
      {mode === 'existing' && (
        <div>
          {isLoading ? (
            <p>Loading tables...</p>
          ) : (
            <>
              <p>Select existing tables to map fields to:</p>
              <div style={{ maxHeight: '300px', overflowY: 'auto', border: '1px solid #ccc', padding: '10px', backgroundColor: 'white' }}>
                {existingTables.map(table => (
                  <label key={table} style={{ display: 'block', marginBottom: '5px' }}>
                    <input
                      type="checkbox"
                      checked={selectedExisting.includes(table)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedExisting([...selectedExisting, table]);
                        } else {
                          setSelectedExisting(selectedExisting.filter(t => t !== table));
                        }
                      }}
                      style={{ marginRight: '8px' }}
                    />
                    {table}
                  </label>
                ))}
              </div>
              <button
                onClick={handleLoadExisting}
                disabled={selectedExisting.length === 0}
                style={{
                  marginTop: '10px',
                  padding: '12px 24px',
                  backgroundColor: selectedExisting.length > 0 ? '#28a745' : '#ccc',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: selectedExisting.length > 0 ? 'pointer' : 'not-allowed',
                  fontWeight: 'bold',
                }}
              >
                Load Selected Tables ({selectedExisting.length})
              </button>
            </>
          )}
        </div>
      )}

      {/* Custom Tables */}
      {mode === 'custom' && (
        <div>
          <button
            onClick={addCustomTable}
            style={{
              marginBottom: '15px',
              padding: '10px 20px',
              backgroundColor: '#17a2b8',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
            }}
          >
            + Create New Table
          </button>

          {customTables.map((table, tableIndex) => (
            <div key={tableIndex} style={{ marginBottom: '15px', padding: '10px', border: '1px solid #ddd', backgroundColor: 'white', borderRadius: '4px' }}>
              <h4>{table.name}</h4>
              <ul>
                {table.columns.map((col, colIndex) => (
                  <li key={colIndex}>
                    <strong>{col.name}</strong>: {col.type} {col.isPrimaryKey && '(PK)'}
                  </li>
                ))}
              </ul>
              <button
                onClick={() => addColumnToCustomTable(tableIndex)}
                style={{
                  padding: '6px 12px',
                  backgroundColor: '#6c757d',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '12px',
                }}
              >
                + Add Column
              </button>
            </div>
          ))}

          {customTables.length > 0 && (
            <button
              onClick={handleUseCustom}
              style={{
                padding: '12px 24px',
                backgroundColor: '#28a745',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontWeight: 'bold',
              }}
            >
              Use These Custom Tables
            </button>
          )}
        </div>
      )}
    </div>
  );
};
