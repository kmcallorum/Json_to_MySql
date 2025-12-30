import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { StagingTableSelector } from './StagingTableSelector';
import { StagingColumnMapper } from './StagingColumnMapper';
import { StagingRelationshipEditor } from './StagingRelationshipEditor';

interface StagingWorkflowProps {
  sourceTables?: any[];
  onClose: () => void;
}

type StagingStep = 'select-source' | 'where-clause' | 'select-staging' | 'map-columns' | 'define-relationships' | 'execute';

export const StagingWorkflow: React.FC<StagingWorkflowProps> = ({
  sourceTables: propsSourceTables,
  onClose,
}) => {
  const [currentStep, setCurrentStep] = useState<StagingStep>('select-source');
  const [sourceTables, setSourceTables] = useState<any[]>(propsSourceTables || []);
  const [stagingTables, setStagingTables] = useState<any[]>([]);
  const [mappings, setMappings] = useState<any[]>([]);
  const [relationships, setRelationships] = useState<any[]>([]);
  const [whereConditions, setWhereConditions] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isExecuting, setIsExecuting] = useState(false);
  const [message, setMessage] = useState('');
  const [availableTables, setAvailableTables] = useState<string[]>([]);
  const [selectedSourceTables, setSelectedSourceTables] = useState<string[]>([]);

  useEffect(() => {
    if (propsSourceTables && propsSourceTables.length > 0) {
      // Skip source selection if tables were provided
      setCurrentStep('select-staging');
    } else {
      loadAvailableTables();
    }
  }, [propsSourceTables]);

  const loadAvailableTables = async () => {
    setIsLoading(true);
    try {
      const result = await api.getTableList();
      if (result.success) {
        // Filter out _toprocess tables
        const filtered = result.tables.filter((t: string) => !t.endsWith('_toprocess'));
        setAvailableTables(filtered);
      }
    } catch (error) {
      console.error('Error loading tables:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSourceTablesSelected = async () => {
    if (selectedSourceTables.length === 0) {
      alert('Please select at least one source table');
      return;
    }

    setIsLoading(true);
    try {
      // Load structures of selected tables
      const result = await api.analyzeTables(selectedSourceTables);
      if (result.success) {
        setSourceTables(result.tables);
        setCurrentStep('where-clause');
      } else {
        setMessage(`Error: ${result.error}`);
      }
    } catch (error: any) {
      setMessage(`Error: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleWhereClauseComplete = () => {
    setCurrentStep('select-staging');
  };

  const handleStagingTablesSelected = (tables: any[]) => {
    setStagingTables(tables);
    setCurrentStep('map-columns');
  };

  const handleMappingsComplete = () => {
    if (mappings.length === 0) {
      alert('Please map at least one column');
      return;
    }
    setCurrentStep('define-relationships');
  };

  const handleRelationshipsComplete = () => {
    setCurrentStep('execute');
  };

  const handleExecute = async () => {
    if (
      !confirm(
        `Execute staging process?\n\n${stagingTables.filter(t => t.isNew).length} new tables will be created\n${mappings.length} columns will be mapped\n${relationships.length} relationships defined\n\nContinue?`
      )
    ) {
      return;
    }

    setIsExecuting(true);
    setMessage('');

    try {
      // Step 1: Create new staging tables
      const newTables = stagingTables.filter(t => t.isNew);
      if (newTables.length > 0) {
        const createResult = await api.createStagingTables(newTables);
        if (!createResult.success) {
          setMessage(`Error creating tables: ${createResult.error}`);
          return;
        }
        setMessage(`✓ Created ${createResult.tablesCreated.length} staging tables\n`);
      }

      // Step 2: Execute staging copy
      const sourceTableNames = sourceTables.map(t => t.tableName);
      const copyResult = await api.executeStagingCopy({
        mappings,
        relationships,
        sourceTables: sourceTableNames,
        whereConditions,
        batchSize: 100,
      });

      if (copyResult.success) {
        setMessage(
          prev =>
            prev + `\n✓ Success! Copied ${copyResult.processed} records to staging tables.`
        );
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

  const handleBack = () => {
    const steps: StagingStep[] = ['select-source', 'where-clause', 'select-staging', 'map-columns', 'define-relationships', 'execute'];
    const currentIndex = steps.indexOf(currentStep);
    if (currentIndex > 0) {
      // Skip select-source if we had props source tables
      if (steps[currentIndex - 1] === 'select-source' && propsSourceTables && propsSourceTables.length > 0) {
        return; // Can't go back
      }
      setCurrentStep(steps[currentIndex - 1]);
    }
  };

  return (
    <div
      style={{
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
      }}
    >
      <div
        style={{
          backgroundColor: 'white',
          padding: '30px',
          borderRadius: '8px',
          maxWidth: '1200px',
          width: '95%',
          maxHeight: '90vh',
          overflowY: 'auto',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h2>Stage Data Workflow</h2>
          <button
            onClick={onClose}
            style={{
              padding: '8px 16px',
              backgroundColor: '#6c757d',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
            }}
          >
            ✕ Close
          </button>
        </div>

        {/* Progress Indicator */}
        <div style={{ marginBottom: '30px', display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
          {(!propsSourceTables || propsSourceTables.length === 0) && (
            <>
              <div
                style={{
                  padding: '8px 16px',
                  backgroundColor: currentStep === 'select-source' ? '#007bff' : '#28a745',
                  color: 'white',
                  borderRadius: '4px',
                  fontSize: '14px',
                }}
              >
                {currentStep === 'select-source' ? '1. Selecting Source...' : '✓ 1. Source'}
              </div>
              <div style={{ width: '20px', height: '2px', backgroundColor: '#dee2e6' }} />
            </>
          )}
          <div
            style={{
              padding: '8px 16px',
              backgroundColor:
                currentStep === 'select-staging'
                  ? '#007bff'
                  : ['map-columns', 'define-relationships', 'execute'].includes(currentStep)
                  ? '#28a745'
                  : '#dee2e6',
              color:
                currentStep === 'select-staging' || ['map-columns', 'define-relationships', 'execute'].includes(currentStep)
                  ? 'white'
                  : '#6c757d',
              borderRadius: '4px',
              fontSize: '14px',
            }}
          >
            {currentStep === 'select-staging' ? '2. Selecting Staging...' : '✓ 2. Staging'}
          </div>
          <div style={{ width: '20px', height: '2px', backgroundColor: '#dee2e6' }} />
          <div
            style={{
              padding: '8px 16px',
              backgroundColor:
                currentStep === 'map-columns'
                  ? '#007bff'
                  : ['define-relationships', 'execute'].includes(currentStep)
                  ? '#28a745'
                  : '#dee2e6',
              color:
                currentStep === 'map-columns' || ['define-relationships', 'execute'].includes(currentStep)
                  ? 'white'
                  : '#6c757d',
              borderRadius: '4px',
              fontSize: '14px',
            }}
          >
            {currentStep === 'map-columns' ? '3. Mapping...' : '✓ 3. Mapped'}
          </div>
          <div style={{ width: '20px', height: '2px', backgroundColor: '#dee2e6' }} />
          <div
            style={{
              padding: '8px 16px',
              backgroundColor:
                currentStep === 'define-relationships'
                  ? '#007bff'
                  : currentStep === 'execute'
                  ? '#28a745'
                  : '#dee2e6',
              color: ['define-relationships', 'execute'].includes(currentStep) ? 'white' : '#6c757d',
              borderRadius: '4px',
              fontSize: '14px',
            }}
          >
            {currentStep === 'define-relationships' ? '4. Relationships...' : '✓ 4. Relations'}
          </div>
          <div style={{ width: '20px', height: '2px', backgroundColor: '#dee2e6' }} />
          <div
            style={{
              padding: '8px 16px',
              backgroundColor: currentStep === 'execute' ? '#007bff' : '#dee2e6',
              color: currentStep === 'execute' ? 'white' : '#6c757d',
              borderRadius: '4px',
              fontSize: '14px',
            }}
          >
            5. Execute
          </div>
        </div>

        {/* Step 1: Select Source Tables */}
        {currentStep === 'select-source' && (
          <div>
            <h3>Step 1: Select Source Tables</h3>
            <p style={{ color: '#666' }}>Select the flattened tables you want to copy to staging.</p>

            {isLoading ? (
              <p>Loading available tables...</p>
            ) : (
              <div>
                <div style={{ marginBottom: '20px', maxHeight: '400px', overflowY: 'auto' }}>
                  {availableTables.map(table => (
                    <div
                      key={table}
                      style={{
                        padding: '10px',
                        marginBottom: '8px',
                        backgroundColor: selectedSourceTables.includes(table) ? '#d4edda' : '#f8f9fa',
                        border: '1px solid #dee2e6',
                        borderRadius: '4px',
                        cursor: 'pointer',
                      }}
                      onClick={() => {
                        if (selectedSourceTables.includes(table)) {
                          setSelectedSourceTables(prev => prev.filter(t => t !== table));
                        } else {
                          setSelectedSourceTables(prev => [...prev, table]);
                        }
                      }}
                    >
                      <strong>{table}</strong>
                      {selectedSourceTables.includes(table) && (
                        <span style={{ marginLeft: '10px', color: '#28a745' }}>✓ Selected</span>
                      )}
                    </div>
                  ))}
                </div>

                <button
                  onClick={handleSourceTablesSelected}
                  disabled={selectedSourceTables.length === 0}
                  style={{
                    padding: '12px 24px',
                    backgroundColor: selectedSourceTables.length > 0 ? '#28a745' : '#ccc',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: selectedSourceTables.length > 0 ? 'pointer' : 'not-allowed',
                    fontWeight: 'bold',
                  }}
                >
                  Continue to Staging Tables →
                </button>
              </div>
            )}
          </div>
        )}

        {/* Step 2: WHERE Clause (Optional) */}
        {currentStep === 'where-clause' && (() => {
          // Build list of all available columns from source tables with table name prefix
          const availableColumns: Array<{ display: string; value: string }> = [];
          sourceTables.forEach(table => {
            table.columns?.forEach((col: any) => {
              availableColumns.push({
                display: `${table.tableName}.${col.name}`,
                value: `${table.tableName}.${col.name}`
              });
            });
          });
          // Sort by display name
          availableColumns.sort((a, b) => a.display.localeCompare(b.display));

          return (
            <div>
              <h3>Step 2: WHERE Conditions (Optional)</h3>
              <p style={{ color: '#666' }}>
                Add conditions to filter source data (e.g., milestoneId IS NOT NULL).
              </p>

              {whereConditions.length === 0 && (
                <p style={{ color: '#666', fontStyle: 'italic', marginBottom: '20px' }}>
                  No filters applied. Click "Add Condition" to filter your data.
                </p>
              )}

              <div style={{ marginBottom: '20px' }}>
                {whereConditions.map((condition, index) => {
                  const showValueInput = !['IS NOT NULL', 'IS NULL'].includes(condition.operator);

                  return (
                    <div
                      key={index}
                      style={{
                        padding: '15px',
                        marginBottom: '10px',
                        backgroundColor: 'white',
                        border: '1px solid #dee2e6',
                        borderRadius: '4px',
                      }}
                    >
                      <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-start', flexWrap: 'wrap' }}>
                        <div style={{ flex: '1 1 200px' }}>
                          <label style={{ display: 'block', fontSize: '12px', marginBottom: '5px', fontWeight: 'bold' }}>
                            Field
                          </label>
                          <select
                            value={condition.field}
                            onChange={e => {
                              const updated = [...whereConditions];
                              updated[index].field = e.target.value;
                              setWhereConditions(updated);
                            }}
                            style={{
                              width: '100%',
                              padding: '8px',
                              border: '1px solid #ccc',
                              borderRadius: '4px',
                            }}
                          >
                            <option value="">-- Select Field --</option>
                            {availableColumns.map(col => (
                              <option key={col.value} value={col.value}>
                                {col.display}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div style={{ flex: '0 0 150px' }}>
                          <label style={{ display: 'block', fontSize: '12px', marginBottom: '5px', fontWeight: 'bold' }}>
                            Operator
                          </label>
                          <select
                            value={condition.operator}
                            onChange={e => {
                              const updated = [...whereConditions];
                              updated[index].operator = e.target.value;
                              if (['IS NOT NULL', 'IS NULL'].includes(e.target.value)) {
                                updated[index].value = undefined;
                              }
                              setWhereConditions(updated);
                            }}
                            style={{
                              width: '100%',
                              padding: '8px',
                              border: '1px solid #ccc',
                              borderRadius: '4px',
                            }}
                          >
                            <option value="=">= (equals)</option>
                            <option value="!=">!= (not equals)</option>
                            <option value=">"> &gt; (greater than)</option>
                            <option value="<">&lt; (less than)</option>
                            <option value="IS NOT NULL">IS NOT NULL</option>
                            <option value="IS NULL">IS NULL</option>
                          </select>
                        </div>

                        {showValueInput && (
                          <div style={{ flex: '1 1 200px' }}>
                            <label style={{ display: 'block', fontSize: '12px', marginBottom: '5px', fontWeight: 'bold' }}>
                              Value
                            </label>
                            <input
                              type="text"
                              placeholder="Enter value..."
                              value={condition.value || ''}
                              onChange={e => {
                                const updated = [...whereConditions];
                                updated[index].value = e.target.value;
                                setWhereConditions(updated);
                              }}
                              style={{
                                width: '100%',
                                padding: '8px',
                                border: '1px solid #ccc',
                                borderRadius: '4px',
                              }}
                            />
                          </div>
                        )}

                        <div style={{ flex: '0 0 auto' }}>
                          <label style={{ display: 'block', fontSize: '12px', marginBottom: '5px', visibility: 'hidden' }}>
                            Action
                          </label>
                          <button
                            onClick={() => {
                              setWhereConditions(whereConditions.filter((_, i) => i !== index));
                            }}
                            style={{
                              padding: '8px 16px',
                              backgroundColor: '#dc3545',
                              color: 'white',
                              border: 'none',
                              borderRadius: '4px',
                              cursor: 'pointer',
                            }}
                          >
                            Remove
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}

                <button
                  onClick={() => {
                    setWhereConditions([
                      ...whereConditions,
                      { field: '', operator: 'IS NOT NULL', value: '' },
                    ]);
                  }}
                  style={{
                    padding: '10px 20px',
                    backgroundColor: '#28a745',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontWeight: 'bold',
                  }}
                >
                  + Add Condition
                </button>
              </div>

              {whereConditions.length > 0 && (
                <div
                  style={{
                    marginBottom: '20px',
                    padding: '15px',
                    backgroundColor: '#e7f3ff',
                    borderRadius: '4px',
                  }}
                >
                  <strong>SQL Preview:</strong>
                  <pre style={{ margin: '5px 0 0 0', fontSize: '13px' }}>
                    {whereConditions
                      .map((c, i) => {
                        let clause = `${i > 0 ? 'AND ' : ''}${c.field} ${c.operator}`;
                        if (c.operator === '=' || c.operator === '!=' || c.operator === '>' || c.operator === '<') {
                          clause += ` '${c.value}'`;
                        }
                        return clause;
                      })
                      .join('\n')}
                  </pre>
                </div>
              )}

              <div style={{ display: 'flex', gap: '10px' }}>
                <button
                  onClick={handleBack}
                  style={{
                    padding: '10px 20px',
                    backgroundColor: '#6c757d',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer',
                  }}
                >
                  ← Back
                </button>
                <button
                  onClick={handleWhereClauseComplete}
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
                  Continue to Staging Tables →
                </button>
              </div>
            </div>
          );
        })()}

        {/* Step 3: Select Staging Tables */}
        {currentStep === 'select-staging' && (
          <div>
            <StagingTableSelector
              sourceTableNames={sourceTables.map(t => t.tableName)}
              onTablesSelected={handleStagingTablesSelected}
            />
            {sourceTables.length > 0 && (
              <button
                onClick={handleBack}
                style={{
                  marginTop: '10px',
                  padding: '10px 20px',
                  backgroundColor: '#6c757d',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                }}
              >
                ← Back
              </button>
            )}
          </div>
        )}

        {/* Step 3: Map Columns */}
        {currentStep === 'map-columns' && (
          <div>
            <h3>Step 3: Map Columns</h3>
            <p style={{ color: '#666' }}>Drag columns from source tables to staging tables.</p>

            <StagingColumnMapper
              sourceTables={sourceTables}
              stagingTables={stagingTables}
              onMappingsChange={setMappings}
              initialMappings={mappings}
            />

            <div style={{ marginTop: '20px', display: 'flex', gap: '10px' }}>
              <button
                onClick={handleBack}
                style={{
                  padding: '10px 20px',
                  backgroundColor: '#6c757d',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                }}
              >
                ← Back
              </button>
              <button
                onClick={handleMappingsComplete}
                disabled={mappings.length === 0}
                style={{
                  padding: '12px 24px',
                  backgroundColor: mappings.length > 0 ? '#28a745' : '#ccc',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: mappings.length > 0 ? 'pointer' : 'not-allowed',
                  fontWeight: 'bold',
                }}
              >
                Continue to Relationships →
              </button>
            </div>
          </div>
        )}

        {/* Step 4: Define Relationships */}
        {currentStep === 'define-relationships' && (
          <div>
            <StagingRelationshipEditor
              tables={stagingTables}
              relationships={relationships}
              onRelationshipsChange={setRelationships}
            />

            <div style={{ marginTop: '20px', display: 'flex', gap: '10px' }}>
              <button
                onClick={handleBack}
                style={{
                  padding: '10px 20px',
                  backgroundColor: '#6c757d',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                }}
              >
                ← Back
              </button>
              <button
                onClick={handleRelationshipsComplete}
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
                Continue to Execute →
              </button>
            </div>
          </div>
        )}

        {/* Step 5: Execute */}
        {currentStep === 'execute' && (
          <div>
            <h3>Step 5: Execute Staging Process</h3>
            <p style={{ color: '#666' }}>Review and execute the staging copy process.</p>

            <div style={{ marginBottom: '20px', padding: '15px', backgroundColor: '#f8f9fa', borderRadius: '4px' }}>
              <h4>Summary:</h4>
              <ul>
                <li>Source Tables: {sourceTables.length}</li>
                <li>Staging Tables: {stagingTables.length}</li>
                <li>New Tables to Create: {stagingTables.filter(t => t.isNew).length}</li>
                <li>Column Mappings: {mappings.length}</li>
                <li>Relationships: {relationships.length}</li>
              </ul>
            </div>

            {message && (
              <div
                style={{
                  padding: '15px',
                  marginBottom: '20px',
                  backgroundColor: message.includes('Error') ? '#f8d7da' : '#d4edda',
                  borderRadius: '4px',
                  whiteSpace: 'pre-line',
                }}
              >
                {message}
              </div>
            )}

            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                onClick={handleBack}
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
                ← Back
              </button>
              <button
                onClick={handleExecute}
                disabled={isExecuting}
                style={{
                  padding: '12px 24px',
                  backgroundColor: isExecuting ? '#ccc' : '#dc3545',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: isExecuting ? 'not-allowed' : 'pointer',
                  fontWeight: 'bold',
                  fontSize: '16px',
                }}
              >
                {isExecuting ? '⏳ Executing...' : '🚀 Execute Staging Process'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
