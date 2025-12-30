import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { TableDefinition } from '../../types';

interface StagingWorkflowProps {
  sourceTables: TableDefinition[];
  onClose: () => void;
}

export const StagingWorkflow: React.FC<StagingWorkflowProps> = ({
  sourceTables,
  onClose,
}) => {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [sourceAnalysis, setSourceAnalysis] = useState<any[]>([]);
  const [stagingTables, setStagingTables] = useState<any[]>([]);
  const [mappings, setMappings] = useState<any[]>([]);
  const [isExecuting, setIsExecuting] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    analyzeSourceTables();
  }, []);

  const analyzeSourceTables = async () => {
    setIsAnalyzing(true);
    try {
      const tableNames = sourceTables.map(t => t.name);
      const result = await api.analyzeTables(tableNames);

      if (result.success) {
        setSourceAnalysis(result.tables);
        // Auto-suggest staging tables
        autoSuggestStagingTables(result.tables);
      } else {
        setMessage(`Error: ${result.error}`);
      }
    } catch (error: any) {
      setMessage(`Error: ${error.message}`);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const autoSuggestStagingTables = (tables: any[]) => {
    const suggested = tables.map(table => ({
      name: `staging_${table.tableName}`,
      isNew: true,
      columns: table.columns.map((col: any) => ({
        ...col,
        name: col.name,
        type: col.type,
      })),
    }));
    setStagingTables(suggested);

    // Auto-create mappings (1-to-1 column mapping)
    const autoMappings: any[] = [];
    tables.forEach(table => {
      table.columns.forEach((col: any) => {
        autoMappings.push({
          sourceTable: table.tableName,
          sourceColumn: col.name,
          targetTable: `staging_${table.tableName}`,
          targetColumn: col.name,
        });
      });
    });
    setMappings(autoMappings);
  };

  const handleExecute = async () => {
    if (!confirm(`Create staging tables and copy data?\n\n${stagingTables.length} tables will be created.\n${mappings.length} columns will be mapped.`)) {
      return;
    }

    setIsExecuting(true);
    setMessage('');

    try {
      // Step 1: Create staging tables
      const createResult = await api.createStagingTables(stagingTables);

      if (!createResult.success) {
        setMessage(`Error creating tables: ${createResult.error}`);
        return;
      }

      setMessage(`✓ Created ${createResult.tablesCreated.length} staging tables`);

      // Step 2: Execute staging copy
      const sourceTableNames = sourceTables.map(t => t.name);
      const copyResult = await api.executeStagingCopy({
        mappings,
        relationships: [], // You can enhance this later
        sourceTables: sourceTableNames,
        batchSize: 100,
      });

      if (copyResult.success) {
        setMessage(`✓ Success! Copied ${copyResult.processed} records to staging tables.`);
        if (copyResult.errors.length > 0) {
          setMessage(prev => prev + `\n⚠ ${copyResult.errors.length} errors occurred.`);
        }
      } else {
        setMessage(`Error: ${copyResult.error}`);
      }
    } catch (error: any) {
      setMessage(`Error: ${error.message}`);
    } finally {
      setIsExecuting(false);
    }
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0,0,0,0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
    }}>
      <div style={{
        backgroundColor: 'white',
        padding: '30px',
        borderRadius: '8px',
        maxWidth: '900px',
        width: '90%',
        maxHeight: '80vh',
        overflowY: 'auto',
      }}>
        <h2>Stage Data to Staging Tables</h2>
        <p style={{ color: '#666' }}>
          Copy data from your flattened tables to staging tables for DEV/STAGE/PROD deployment.
        </p>

        {isAnalyzing && (
          <div style={{ padding: '20px', textAlign: 'center' }}>
            <p>Analyzing source tables...</p>
          </div>
        )}

        {!isAnalyzing && sourceAnalysis.length > 0 && (
          <div>
            <div style={{ marginBottom: '20px' }}>
              <h3>Source Tables ({sourceAnalysis.length})</h3>
              <div style={{ display: 'grid', gap: '10px' }}>
                {sourceAnalysis.map(table => (
                  <div key={table.tableName} style={{
                    padding: '10px',
                    backgroundColor: '#f8f9fa',
                    borderRadius: '4px',
                    border: '1px solid #dee2e6',
                  }}>
                    <strong>{table.tableName}</strong>
                    <span style={{ marginLeft: '10px', color: '#666', fontSize: '14px' }}>
                      {table.columns.length} columns • {table.rowCount} rows
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div style={{ marginBottom: '20px' }}>
              <h3>Staging Tables (Auto-Generated)</h3>
              <div style={{ display: 'grid', gap: '10px' }}>
                {stagingTables.map(table => (
                  <div key={table.name} style={{
                    padding: '10px',
                    backgroundColor: '#d4edda',
                    borderRadius: '4px',
                    border: '1px solid #c3e6cb',
                  }}>
                    <strong>{table.name}</strong>
                    <span style={{ marginLeft: '10px', color: '#666', fontSize: '14px' }}>
                      {table.columns.length} columns
                    </span>
                  </div>
                ))}
              </div>
              <p style={{ marginTop: '10px', fontSize: '14px', color: '#666' }}>
                Columns will be mapped 1-to-1 from source to staging tables.
              </p>
            </div>

            {message && (
              <div style={{
                padding: '15px',
                marginBottom: '20px',
                backgroundColor: message.includes('Error') ? '#f8d7da' : '#d4edda',
                borderRadius: '4px',
                whiteSpace: 'pre-line',
              }}>
                {message}
              </div>
            )}

            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
              <button
                onClick={onClose}
                disabled={isExecuting}
                style={{
                  padding: '10px 20px',
                  backgroundColor: '#6c757d',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: isExecuting ? 'not-allowed' : 'pointer',
                }}
              >
                Close
              </button>
              <button
                onClick={handleExecute}
                disabled={isExecuting}
                style={{
                  padding: '12px 24px',
                  backgroundColor: isExecuting ? '#ccc' : '#28a745',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: isExecuting ? 'not-allowed' : 'pointer',
                  fontWeight: 'bold',
                }}
              >
                {isExecuting ? '⏳ Processing...' : '🚀 Execute Staging'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
