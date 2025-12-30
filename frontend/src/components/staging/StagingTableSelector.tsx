import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';

interface StagingTableSelectorProps {
  sourceTableNames: string[];
  onTablesSelected: (tables: any[]) => void;
}

export const StagingTableSelector: React.FC<StagingTableSelectorProps> = ({
  sourceTableNames,
  onTablesSelected,
}) => {
  const [availableTables, setAvailableTables] = useState<string[]>([]);
  const [selectedTables, setSelectedTables] = useState<any[]>([]);
  const [newTableName, setNewTableName] = useState('');
  const [isLoadingTables, setIsLoadingTables] = useState(true);

  useEffect(() => {
    loadAvailableTables();
  }, []);

  const loadAvailableTables = async () => {
    setIsLoadingTables(true);
    try {
      const result = await api.getTableList();
      if (result.success) {
        setAvailableTables(result.tables);
        // After loading available tables, auto-suggest
        await autoSuggestTables(result.tables);
      }
    } catch (error) {
      console.error('Error loading tables:', error);
    } finally {
      setIsLoadingTables(false);
    }
  };

  const autoSuggestTables = async (existingTables: string[]) => {
    // Auto-suggest staging tables based on source tables
    const suggested: any[] = [];

    for (const sourceName of sourceTableNames) {
      const stagingName = `staging_${sourceName}`;

      // Check if this staging table already exists
      if (existingTables.includes(stagingName)) {
        // Load the existing table structure
        try {
          const result = await api.getTableStructures([stagingName]);
          if (result.success && result.tables.length > 0) {
            suggested.push({ ...result.tables[0], isNew: false });
          }
        } catch (error) {
          console.error(`Error loading ${stagingName}:`, error);
        }
      } else {
        // Create a new table suggestion
        suggested.push({
          name: stagingName,
          isNew: true,
          columns: [
            { name: 'id', type: 'INT', isPrimaryKey: true, nullable: false },
          ],
        });
      }
    }

    setSelectedTables(suggested);
  };

  const handleSelectExisting = async (tableName: string) => {
    // Load table structure
    const result = await api.getTableStructures([tableName]);
    if (result.success && result.tables.length > 0) {
      const table = result.tables[0];
      setSelectedTables(prev => [...prev, { ...table, isNew: false }]);
    }
  };

  const handleCreateNew = () => {
    if (!newTableName.trim()) {
      alert('Please enter a table name');
      return;
    }

    setSelectedTables(prev => [
      ...prev,
      {
        name: newTableName.trim(),
        isNew: true,
        columns: [
          { name: 'id', type: 'INT', isPrimaryKey: true, nullable: false },
        ],
      },
    ]);
    setNewTableName('');
  };

  const handleRemoveTable = (tableName: string) => {
    setSelectedTables(prev => prev.filter(t => t.name !== tableName));
  };

  const handleAddColumn = (tableName: string) => {
    const colName = prompt('Column name:');
    const colType = prompt('Column type (e.g., VARCHAR(255), INT):', 'VARCHAR(255)');

    if (colName && colType) {
      setSelectedTables(prev =>
        prev.map(t =>
          t.name === tableName
            ? {
                ...t,
                columns: [
                  ...t.columns,
                  { name: colName, type: colType, isPrimaryKey: false, nullable: true },
                ],
              }
            : t
        )
      );
    }
  };

  const handleContinue = () => {
    if (selectedTables.length === 0) {
      alert('Please select or create at least one staging table');
      return;
    }
    onTablesSelected(selectedTables);
  };

  return (
    <div style={{ padding: '20px' }}>
      <h3>Select or Create Staging Tables</h3>
      <p style={{ color: '#666' }}>
        Choose existing staging tables or create new ones to receive your data.
      </p>

      {/* Auto-suggested tables */}
      <div style={{ marginBottom: '20px', padding: '15px', backgroundColor: '#d4edda', borderRadius: '4px' }}>
        <h4 style={{ marginTop: 0 }}>Auto-Suggested Tables</h4>
        <div style={{ display: 'grid', gap: '10px' }}>
          {selectedTables
            .filter(t => t.isNew)
            .map(table => (
              <div
                key={table.name}
                style={{
                  padding: '10px',
                  backgroundColor: 'white',
                  borderRadius: '4px',
                  border: '1px solid #c3e6cb',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <div>
                  <strong>{table.name}</strong>
                  <span style={{ marginLeft: '10px', color: '#666', fontSize: '14px' }}>
                    (New table - will be created)
                  </span>
                </div>
                <div style={{ display: 'flex', gap: '5px' }}>
                  <button
                    onClick={() => handleAddColumn(table.name)}
                    style={{
                      padding: '5px 10px',
                      backgroundColor: '#007bff',
                      color: 'white',
                      border: 'none',
                      borderRadius: '3px',
                      cursor: 'pointer',
                      fontSize: '12px',
                    }}
                  >
                    + Add Column
                  </button>
                  <button
                    onClick={() => handleRemoveTable(table.name)}
                    style={{
                      padding: '5px 10px',
                      backgroundColor: '#dc3545',
                      color: 'white',
                      border: 'none',
                      borderRadius: '3px',
                      cursor: 'pointer',
                      fontSize: '12px',
                    }}
                  >
                    Remove
                  </button>
                </div>
              </div>
            ))}
        </div>
      </div>

      {/* Add existing table */}
      <div style={{ marginBottom: '20px' }}>
        <h4>Or Select Existing Table</h4>
        <select
          onChange={e => {
            if (e.target.value) {
              handleSelectExisting(e.target.value);
              e.target.value = '';
            }
          }}
          style={{
            padding: '8px',
            border: '1px solid #ccc',
            borderRadius: '4px',
            width: '300px',
          }}
        >
          <option value="">-- Select existing table --</option>
          {availableTables
            .filter(t => !selectedTables.some(st => st.name === t))
            .map(table => (
              <option key={table} value={table}>
                {table}
              </option>
            ))}
        </select>
      </div>

      {/* Create new table */}
      <div style={{ marginBottom: '20px' }}>
        <h4>Or Create New Table</h4>
        <div style={{ display: 'flex', gap: '10px' }}>
          <input
            type="text"
            value={newTableName}
            onChange={e => setNewTableName(e.target.value)}
            placeholder="staging_table_name"
            style={{
              padding: '8px',
              border: '1px solid #ccc',
              borderRadius: '4px',
              width: '300px',
            }}
          />
          <button
            onClick={handleCreateNew}
            style={{
              padding: '8px 16px',
              backgroundColor: '#28a745',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontWeight: 'bold',
            }}
          >
            + Create Table
          </button>
        </div>
      </div>

      {/* Selected existing tables */}
      {selectedTables.filter(t => !t.isNew).length > 0 && (
        <div style={{ marginBottom: '20px' }}>
          <h4>Selected Existing Tables</h4>
          <div style={{ display: 'grid', gap: '10px' }}>
            {selectedTables
              .filter(t => !t.isNew)
              .map(table => (
                <div
                  key={table.name}
                  style={{
                    padding: '10px',
                    backgroundColor: '#f8f9fa',
                    borderRadius: '4px',
                    border: '1px solid #dee2e6',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}
                >
                  <div>
                    <strong>{table.name}</strong>
                    <span style={{ marginLeft: '10px', color: '#666', fontSize: '14px' }}>
                      {table.columns?.length || 0} columns
                    </span>
                  </div>
                  <button
                    onClick={() => handleRemoveTable(table.name)}
                    style={{
                      padding: '5px 10px',
                      backgroundColor: '#dc3545',
                      color: 'white',
                      border: 'none',
                      borderRadius: '3px',
                      cursor: 'pointer',
                      fontSize: '12px',
                    }}
                  >
                    Remove
                  </button>
                </div>
              ))}
          </div>
        </div>
      )}

      <button
        onClick={handleContinue}
        disabled={selectedTables.length === 0}
        style={{
          padding: '12px 24px',
          backgroundColor: selectedTables.length > 0 ? '#28a745' : '#ccc',
          color: 'white',
          border: 'none',
          borderRadius: '4px',
          cursor: selectedTables.length > 0 ? 'pointer' : 'not-allowed',
          fontWeight: 'bold',
          fontSize: '16px',
        }}
      >
        Continue to Column Mapping →
      </button>
    </div>
  );
};
