import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { WhereCondition } from '../../types';

interface FilterPresetsProps {
  baseTableName: string;
  currentFilters: WhereCondition[];
  onLoadPreset: (filters: WhereCondition[]) => void;
}

export const FilterPresets: React.FC<FilterPresetsProps> = ({
  baseTableName,
  currentFilters,
  onLoadPreset,
}) => {
  const [presets, setPresets] = useState<any[]>([]);
  const [showSave, setShowSave] = useState(false);
  const [showLoad, setShowLoad] = useState(false);
  const [presetName, setPresetName] = useState('');
  const [presetDescription, setPresetDescription] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [loadStatus, setLoadStatus] = useState<string>('');

  const loadPresets = async () => {
    setIsLoading(true);
    try {
      console.log('Loading presets...');
      const result = await api.listFilterPresets();
      console.log('List result:', result);
      
      if (result.success) {
        console.log('Setting presets:', result.presets);
        setPresets(result.presets); // FIXED TYPO!
      }
    } catch (error) {
      console.error('Failed to load presets:', error);
      alert(`Error loading presets: ${error}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    if (!presetName.trim()) {
      alert('Please enter a preset name');
      return;
    }

    const payload = {
      name: presetName,
      description: presetDescription,
      baseTableName: baseTableName,
      whereConditions: currentFilters || [],
    };

    console.log('Saving preset:', payload);

    setIsLoading(true);
    try {
      const result = await api.saveFilterPreset(payload);
      console.log('Save result:', result);

      if (result.success) {
        alert(`Filter preset '${presetName}' saved!`);
        setShowSave(false);
        setPresetName('');
        setPresetDescription('');
      } else {
        alert(`Failed: ${result.error}`);
      }
    } catch (error: any) {
      console.error('Save error:', error);
      alert(`Error: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLoad = async (name: string) => {
    console.log('Loading preset:', name);
    setIsLoading(true);
    try {
      const result = await api.loadFilterPreset(name);
      console.log('Load result:', result);
      
      if (result.success) {
        console.log('Loaded whereConditions:', result.preset.whereConditions);
        onLoadPreset(result.preset.whereConditions || []);
        // Show status message instead of alert
        setLoadStatus(`✓ Loaded "${name}"`);
        setTimeout(() => setLoadStatus(''), 3000);
      } else {
        setLoadStatus(`✗ Failed: ${result.error}`);
        setTimeout(() => setLoadStatus(''), 3000);
      }
    } catch (error: any) {
      console.error('Load error:', error);
      setLoadStatus(`✗ Error: ${error.message}`);
      setTimeout(() => setLoadStatus(''), 3000);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (name: string) => {
    if (!confirm(`Delete filter preset '${name}'?`)) return;

    try {
      const result = await api.deleteFilterPreset(name);
      if (result.success) {
        alert(`Deleted '${name}'`);
        loadPresets();
      }
    } catch (error: any) {
      alert(`Error: ${error.message}`);
    }
  };

  return (
    <div style={{ marginBottom: '15px', display: 'flex', gap: '10px' }}>
      <button
        onClick={() => setShowSave(true)}
        style={{
          padding: '8px 16px',
          backgroundColor: '#17a2b8',
          color: 'white',
          border: 'none',
          borderRadius: '4px',
          cursor: 'pointer',
          fontSize: '14px',
        }}
      >
        💾 Save Filter Preset
      </button>

      <button
        onClick={() => {
          loadPresets();
          setShowLoad(true);
        }}
        style={{
          padding: '8px 16px',
          backgroundColor: '#6c757d',
          color: 'white',
          border: 'none',
          borderRadius: '4px',
          cursor: 'pointer',
          fontSize: '14px',
        }}
      >
        📂 Load Filter Preset
      </button>

      {/* Save Modal */}
      {showSave && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex',
          alignItems: 'center', justifyContent: 'center', zIndex: 1000,
        }}>
          <div style={{
            backgroundColor: 'white', padding: '30px', borderRadius: '8px',
            maxWidth: '500px', width: '90%',
          }}>
            <h3>Save Filter Preset</h3>

            <div style={{ marginBottom: '15px' }}>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                Preset Name *
              </label>
              <input
                type="text"
                value={presetName}
                onChange={(e) => setPresetName(e.target.value)}
                placeholder="e.g., pipeline_test_filters"
                style={{
                  width: '100%', padding: '8px', border: '1px solid #ccc', borderRadius: '4px',
                }}
              />
            </div>
            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                Description
              </label>
              <textarea
                value={presetDescription}
                onChange={(e) => setPresetDescription(e.target.value)}
                placeholder="Describe this filter..."
                rows={2}
                style={{
                  width: '100%', padding: '8px', border: '1px solid #ccc', borderRadius: '4px',
                }}
              />
            </div>
            <div style={{ marginBottom: '15px', padding: '10px', backgroundColor: '#f8f9fa', borderRadius: '4px' }}>
              <strong>Current Filters:</strong> {currentFilters.length === 0 ? 'None' : `${currentFilters.length} condition(s)`}
            </div>
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
              <button onClick={() => setShowSave(false)} style={{
                padding: '8px 16px', backgroundColor: '#6c757d', color: 'white',
                border: 'none', borderRadius: '4px', cursor: 'pointer',
              }}>Cancel</button>
              <button onClick={handleSave} disabled={isLoading || !presetName.trim()} style={{
                padding: '8px 16px', backgroundColor: '#28a745', color: 'white',
                border: 'none', borderRadius: '4px', cursor: 'pointer',
              }}>{isLoading ? 'Saving...' : 'Save'}</button>
            </div>
          </div>
        </div>
      )}

      {/* Load Modal */}
      {showLoad && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex',
          alignItems: 'center', justifyContent: 'center', zIndex: 1000,
        }}>
          <div style={{
            backgroundColor: 'white', padding: '30px', borderRadius: '8px',
            maxWidth: '600px', width: '90%', maxHeight: '80vh', overflowY: 'auto',
          }}>
            <h3>Load Filter Preset</h3>

            {loadStatus && (
              <div style={{
                marginBottom: '15px', padding: '10px', borderRadius: '4px',
                backgroundColor: loadStatus.startsWith('✓') ? '#d4edda' : '#f8d7da',
                color: loadStatus.startsWith('✓') ? '#155724' : '#721c24',
                border: `1px solid ${loadStatus.startsWith('✓') ? '#c3e6cb' : '#f5c6cb'}`
              }}>
                {loadStatus}
              </div>
            )}

            {isLoading ? (
              <p>Loading...</p>
            ) : presets.length === 0 ? (
              <div>
                <p style={{ color: '#666', fontStyle: 'italic' }}>No saved filter presets found.</p>
              </div>
            ) : (
              <div>
                <p style={{ marginBottom: '15px', color: '#666' }}>
                  Found {presets.length} saved preset(s):
                </p>
                {presets.map(preset => (
                  <div key={preset.id} style={{
                    padding: '15px', marginBottom: '10px', border: '1px solid #ddd',
                    borderRadius: '4px', backgroundColor: '#f8f9fa',
                  }}>
                    <div style={{ fontWeight: 'bold', fontSize: '16px', marginBottom: '5px' }}>
                      {preset.name}
                    </div>
                    {preset.description && (
                      <div style={{ fontSize: '14px', color: '#666', marginBottom: '5px' }}>
                        {preset.description}
                      </div>
                    )}
                    <div style={{ fontSize: '12px', color: '#666' }}>
                      Table: {preset.baseTableName} • Updated: {new Date(preset.updatedAt).toLocaleString()}
                    </div>
                    <div style={{ marginTop: '10px', display: 'flex', gap: '10px' }}>
                      <button 
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          handleLoad(preset.name);
                        }} 
                        style={{
                          padding: '6px 12px', backgroundColor: '#007bff', color: 'white',
                          border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '14px',
                        }}>Load</button>
                      <button 
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          handleDelete(preset.name);
                        }} 
                        style={{
                          padding: '6px 12px', backgroundColor: '#dc3545', color: 'white',
                          border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '14px',
                        }}>Delete</button>
                    </div>
                  </div>
                ))}
              </div>
            )}
            <button onClick={() => setShowLoad(false)} style={{
              marginTop: '15px', padding: '8px 16px', backgroundColor: '#6c757d',
              color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer',
            }}>Close</button>
          </div>
        </div>
      )}
    </div>
  );
};
