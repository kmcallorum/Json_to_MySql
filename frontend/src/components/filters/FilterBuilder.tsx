import React, { useState, useMemo } from 'react';
import { FieldInfo, WhereCondition } from '../../types';
import { FilterPresets } from './FilterPresets';

interface FilterBuilderProps {
  fields: FieldInfo[];
  baseTableName: string;
  onFiltersChange: (conditions: WhereCondition[]) => void;
}

export const FilterBuilder: React.FC<FilterBuilderProps> = ({
  fields,
  baseTableName,
  onFiltersChange
}) => {
  const [conditions, setConditions] = useState<WhereCondition[]>([]);

  const handleLoadPreset = (loadedFilters: WhereCondition[]) => {
    console.log('Loading preset with filters:', loadedFilters);
    setConditions(loadedFilters);
    onFiltersChange(loadedFilters);
  };

  // Merge discovered fields with any fields from loaded conditions
  const allFieldPaths = useMemo(() => {
    const discoveredPaths = new Set(fields.map(f => f.path));
    const conditionPaths = new Set(conditions.map(c => c.field).filter(f => f));

    // Combine both sets
    const combined = new Set([...discoveredPaths, ...conditionPaths]);
    return Array.from(combined).sort();
  }, [fields, conditions]);

  const addCondition = () => {
    const newCondition: WhereCondition = {
      field: fields[0]?.path || '',
      operator: '=',
      value: '',
    };
    const updated = [...conditions, newCondition];
    setConditions(updated);
    onFiltersChange(updated);
  };

  const updateCondition = (index: number, updates: Partial<WhereCondition>) => {
    const updated = [...conditions];
    updated[index] = { ...updated[index], ...updates };
    
    if (updates.operator === 'IS NULL' || updates.operator === 'IS NOT NULL') {
      updated[index].value = undefined;
    }
    
    setConditions(updated);
    onFiltersChange(updated);
  };

  const removeCondition = (index: number) => {
    const updated = conditions.filter((_, i) => i !== index);
    setConditions(updated);
    onFiltersChange(updated);
  };

  const getFieldInfo = (fieldPath: string): FieldInfo | undefined => {
    return fields.find(f => f.path === fieldPath);
  };

  return (
    <div style={{ 
      padding: '20px', 
      backgroundColor: '#f8f9fa', 
      borderRadius: '8px',
      marginBottom: '20px'
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
        <h3 style={{ margin: 0 }}>Build WHERE Conditions</h3>
        <div style={{ display: 'flex', gap: '10px' }}>
          <FilterPresets
            baseTableName={baseTableName}
            currentFilters={conditions}
            onLoadPreset={handleLoadPreset}
          />
          <button
            onClick={addCondition}
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
            + Add Condition
          </button>
        </div>
      </div>

      {conditions.length === 0 && (
        <p style={{ color: '#666', fontStyle: 'italic' }}>
          No filters applied. Click "Add Condition" to filter your data or load a saved preset.
        </p>
      )}

      {conditions.map((condition, index) => {
        const fieldInfo = getFieldInfo(condition.field);
        const showValueInput = condition.operator !== 'IS NULL' && condition.operator !== 'IS NOT NULL';
        const showInValues = condition.operator === 'IN';

        return (
          <div
            key={index}
            style={{
              padding: '15px',
              backgroundColor: 'white',
              borderRadius: '4px',
              marginBottom: '10px',
              border: '1px solid #dee2e6',
            }}
          >
            <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-start', flexWrap: 'wrap' }}>
              <div style={{ flex: '1 1 200px' }}>
                <label style={{ display: 'block', fontSize: '12px', marginBottom: '5px', fontWeight: 'bold' }}>
                  Field
                </label>
                <select
                  value={condition.field}
                  onChange={(e) => updateCondition(index, { field: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '8px',
                    border: '1px solid #ccc',
                    borderRadius: '4px',
                  }}
                >
                  <option value="">-- Select Field --</option>
                  {allFieldPaths.map((fieldPath, idx) => (
                    <option key={`${fieldPath}-${idx}`} value={fieldPath}>
                      {fieldPath}
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
                  onChange={(e) => updateCondition(index, { operator: e.target.value as any })}
                  style={{
                    width: '100%',
                    padding: '8px',
                    border: '1px solid #ccc',
                    borderRadius: '4px',
                  }}
                >
                  <option value="=">= (equals)</option>
                  <option value="!=">!= (not equals)</option>
                  <option value="IS NULL">IS NULL</option>
                  <option value="IS NOT NULL">IS NOT NULL</option>
                  <option value="IN">IN (one of)</option>
                  <option value="LIKE">LIKE (contains)</option>
                </select>
              </div>

              {showValueInput && !showInValues && (
                <div style={{ flex: '1 1 200px' }}>
                  <label style={{ display: 'block', fontSize: '12px', marginBottom: '5px', fontWeight: 'bold' }}>
                    Value
                  </label>
                  {fieldInfo && fieldInfo.uniqueValues.length > 0 && fieldInfo.uniqueValues.length <= 50 ? (
                    <select
                      value={condition.value || ''}
                      onChange={(e) => updateCondition(index, { value: e.target.value })}
                      style={{
                        width: '100%',
                        padding: '8px',
                        border: '1px solid #ccc',
                        borderRadius: '4px',
                      }}
                    >
                      <option value="">-- Select Value --</option>
                      {fieldInfo.uniqueValues.map((val, i) => (
                        <option key={i} value={String(val)}>
                          {String(val)}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <input
                      type="text"
                      value={condition.value || ''}
                      onChange={(e) => updateCondition(index, { value: e.target.value })}
                      placeholder="Enter value..."
                      style={{
                        width: '100%',
                        padding: '8px',
                        border: '1px solid #ccc',
                        borderRadius: '4px',
                      }}
                    />
                  )}
                </div>
              )}

              {showInValues && fieldInfo && (
                <div style={{ flex: '1 1 300px' }}>
                  <label style={{ display: 'block', fontSize: '12px', marginBottom: '5px', fontWeight: 'bold' }}>
                    Select Values ({fieldInfo.uniqueValues.length} available)
                  </label>
                  <select
                    multiple
                    value={condition.value || []}
                    onChange={(e) => {
                      const selected = Array.from(e.target.selectedOptions, option => option.value);
                      updateCondition(index, { value: selected });
                    }}
                    style={{
                      width: '100%',
                      padding: '8px',
                      border: '1px solid #ccc',
                      borderRadius: '4px',
                      minHeight: '100px',
                    }}
                  >
                    {fieldInfo.uniqueValues.map((val, i) => (
                      <option key={i} value={String(val)}>
                        {String(val)}
                      </option>
                    ))}
                  </select>
                  <small style={{ color: '#666' }}>Hold Ctrl/Cmd to select multiple</small>
                </div>
              )}

              <div style={{ flex: '0 0 auto' }}>
                <label style={{ display: 'block', fontSize: '12px', marginBottom: '5px', visibility: 'hidden' }}>
                  Action
                </label>
                <button
                  onClick={() => removeCondition(index)}
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

            {fieldInfo && (
              <div style={{ marginTop: '10px', fontSize: '12px', color: '#666' }}>
                <strong>Info:</strong> {fieldInfo.uniqueValues.length} unique values, 
                {fieldInfo.nullCount > 0 && ` ${fieldInfo.nullCount} nulls,`}
                {' '}{fieldInfo.totalCount} total records
              </div>
            )}
          </div>
        );
      })}

      {conditions.length > 0 && (
        <div style={{ marginTop: '15px', padding: '10px', backgroundColor: '#e7f3ff', borderRadius: '4px' }}>
          <strong>SQL Preview:</strong>
          <pre style={{ margin: '5px 0 0 0', fontSize: '13px' }}>
            {conditions.map((c, i) => {
              let clause = `${i > 0 ? 'AND ' : ''}${c.field} ${c.operator}`;
              if (c.operator === '=' || c.operator === '!=' || c.operator === 'LIKE') {
                clause += ` '${c.value}'`;
              } else if (c.operator === 'IN') {
                clause += ` (${(c.value || []).map((v: any) => `'${v}'`).join(', ')})`;
              }
              return clause;
            }).join('\n')}
          </pre>
        </div>
      )}
    </div>
  );
};
