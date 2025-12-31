import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';

interface StagingSaveLoadConfigProps {
  currentConfig: {
    sourceTables: string[];
    mappings: any[];
    relationships: any[];
    whereConditions: any[];
  };
  onLoad: (config: any) => void;
}

export const StagingSaveLoadConfig: React.FC<StagingSaveLoadConfigProps> = ({
  currentConfig,
  onLoad,
}) => {
  const [savedConfigs, setSavedConfigs] = useState<any[]>([]);
  const [showSave, setShowSave] = useState(false);
  const [showLoad, setShowLoad] = useState(false);
  const [configName, setConfigName] = useState('');
  const [configDescription, setConfigDescription] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (showLoad) {
      loadConfigList();
    }
  }, [showLoad]);

  const loadConfigList = async () => {
    setIsLoading(true);
    try {
      const result = await api.listStagingConfigs();
      if (result.success) {
        setSavedConfigs(result.configs);
      }
    } catch (error) {
      console.error('Failed to load staging configs:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    if (!configName.trim()) {
      alert('Please enter a configuration name');
      return;
    }

    setIsLoading(true);
    try {
      const result = await api.saveStagingConfig({
        name: configName,
        description: configDescription,
        ...currentConfig,
      });

      if (result.success) {
        alert(`Staging configuration '${configName}' saved successfully!`);
        setShowSave(false);
        setConfigName('');
        setConfigDescription('');
      } else {
        alert(`Failed to save: ${result.error}`);
      }
    } catch (error: any) {
      alert(`Error: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLoad = async (name: string) => {
    setIsLoading(true);
    try {
      const result = await api.loadStagingConfig(name);
      if (result.success) {
        onLoad(result.config);
        setShowLoad(false);
        alert(`Staging configuration '${name}' loaded successfully!`);
      } else {
        alert(`Failed to load: ${result.error}`);
      }
    } catch (error: any) {
      alert(`Error: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (name: string) => {
    if (!confirm(`Delete staging configuration '${name}'?`)) {
      return;
    }

    try {
      const result = await api.deleteStagingConfig(name);
      if (result.success) {
        alert(`Staging configuration '${name}' deleted`);
        loadConfigList();
      } else {
        alert(`Failed to delete: ${result.error}`);
      }
    } catch (error: any) {
      alert(`Error: ${error.message}`);
    }
  };

  return (
    <div style={{ marginBottom: '20px', display: 'flex', gap: '10px' }}>
      <button
        onClick={() => setShowSave(true)}
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
        💾 Save Staging Config
      </button>

      <button
        onClick={() => setShowLoad(true)}
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
        📂 Load Staging Config
      </button>

      {/* Save Modal */}
      {showSave && (
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
            maxWidth: '500px',
            width: '90%',
          }}>
            <h3>Save Staging Configuration</h3>
            <div style={{ marginBottom: '15px' }}>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                Configuration Name *
              </label>
              <input
                type="text"
                value={configName}
                onChange={(e) => setConfigName(e.target.value)}
                placeholder="e.g., daily_staging_pipeline"
                style={{
                  width: '100%',
                  padding: '8px',
                  border: '1px solid #ccc',
                  borderRadius: '4px',
                }}
              />
            </div>
            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                Description (optional)
              </label>
              <textarea
                value={configDescription}
                onChange={(e) => setConfigDescription(e.target.value)}
                placeholder="Describe this staging configuration..."
                rows={3}
                style={{
                  width: '100%',
                  padding: '8px',
                  border: '1px solid #ccc',
                  borderRadius: '4px',
                }}
              />
            </div>
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
              <button
                onClick={() => setShowSave(false)}
                style={{
                  padding: '8px 16px',
                  backgroundColor: '#6c757d',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={isLoading || !configName.trim()}
                style={{
                  padding: '8px 16px',
                  backgroundColor: '#28a745',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                }}
              >
                {isLoading ? 'Saving...' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Load Modal */}
      {showLoad && (
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
            maxWidth: '600px',
            width: '90%',
            maxHeight: '80vh',
            overflowY: 'auto',
          }}>
            <h3>Load Staging Configuration</h3>
            {isLoading ? (
              <p>Loading configurations...</p>
            ) : savedConfigs.length === 0 ? (
              <p style={{ color: '#666', fontStyle: 'italic' }}>No saved staging configurations found.</p>
            ) : (
              <div>
                {savedConfigs.map(config => (
                  <div
                    key={config.id}
                    style={{
                      padding: '15px',
                      marginBottom: '10px',
                      border: '1px solid #ddd',
                      borderRadius: '4px',
                      backgroundColor: '#f8f9fa',
                    }}
                  >
                    <div style={{ fontWeight: 'bold', fontSize: '16px', marginBottom: '5px' }}>
                      {config.name}
                    </div>
                    {config.description && (
                      <div style={{ fontSize: '14px', color: '#666', marginBottom: '5px' }}>
                        {config.description}
                      </div>
                    )}
                    <div style={{ fontSize: '12px', color: '#666' }}>
                      Sources: {config.sourceTables?.join(', ') || 'N/A'} • Updated: {new Date(config.updatedAt).toLocaleString()}
                    </div>
                    <div style={{ marginTop: '10px', display: 'flex', gap: '10px' }}>
                      <button
                        onClick={() => handleLoad(config.name)}
                        style={{
                          padding: '6px 12px',
                          backgroundColor: '#007bff',
                          color: 'white',
                          border: 'none',
                          borderRadius: '4px',
                          cursor: 'pointer',
                          fontSize: '14px',
                        }}
                      >
                        Load
                      </button>
                      <button
                        onClick={() => handleDelete(config.name)}
                        style={{
                          padding: '6px 12px',
                          backgroundColor: '#dc3545',
                          color: 'white',
                          border: 'none',
                          borderRadius: '4px',
                          cursor: 'pointer',
                          fontSize: '14px',
                        }}
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
            <button
              onClick={() => setShowLoad(false)}
              style={{
                marginTop: '15px',
                padding: '8px 16px',
                backgroundColor: '#6c757d',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
              }}
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
