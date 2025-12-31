import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useEffect } from 'react';
import { api } from '../../services/api';
export const StagingSaveLoadConfig = ({ currentConfig, onLoad, }) => {
    const [savedConfigs, setSavedConfigs] = useState([]);
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
        }
        catch (error) {
            console.error('Failed to load staging configs:', error);
        }
        finally {
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
            }
            else {
                alert(`Failed to save: ${result.error}`);
            }
        }
        catch (error) {
            alert(`Error: ${error.message}`);
        }
        finally {
            setIsLoading(false);
        }
    };
    const handleLoad = async (name) => {
        setIsLoading(true);
        try {
            const result = await api.loadStagingConfig(name);
            if (result.success) {
                onLoad(result.config);
                setShowLoad(false);
                alert(`Staging configuration '${name}' loaded successfully!`);
            }
            else {
                alert(`Failed to load: ${result.error}`);
            }
        }
        catch (error) {
            alert(`Error: ${error.message}`);
        }
        finally {
            setIsLoading(false);
        }
    };
    const handleDelete = async (name) => {
        if (!confirm(`Delete staging configuration '${name}'?`)) {
            return;
        }
        try {
            const result = await api.deleteStagingConfig(name);
            if (result.success) {
                alert(`Staging configuration '${name}' deleted`);
                loadConfigList();
            }
            else {
                alert(`Failed to delete: ${result.error}`);
            }
        }
        catch (error) {
            alert(`Error: ${error.message}`);
        }
    };
    return (_jsxs("div", { style: { marginBottom: '20px', display: 'flex', gap: '10px' }, children: [_jsx("button", { onClick: () => setShowSave(true), style: {
                    padding: '10px 20px',
                    backgroundColor: '#28a745',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontWeight: 'bold',
                }, children: "\uD83D\uDCBE Save Staging Config" }), _jsx("button", { onClick: () => setShowLoad(true), style: {
                    padding: '10px 20px',
                    backgroundColor: '#17a2b8',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontWeight: 'bold',
                }, children: "\uD83D\uDCC2 Load Staging Config" }), showSave && (_jsx("div", { style: {
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
                }, children: _jsxs("div", { style: {
                        backgroundColor: 'white',
                        padding: '30px',
                        borderRadius: '8px',
                        maxWidth: '500px',
                        width: '90%',
                    }, children: [_jsx("h3", { children: "Save Staging Configuration" }), _jsxs("div", { style: { marginBottom: '15px' }, children: [_jsx("label", { style: { display: 'block', marginBottom: '5px', fontWeight: 'bold' }, children: "Configuration Name *" }), _jsx("input", { type: "text", value: configName, onChange: (e) => setConfigName(e.target.value), placeholder: "e.g., daily_staging_pipeline", style: {
                                        width: '100%',
                                        padding: '8px',
                                        border: '1px solid #ccc',
                                        borderRadius: '4px',
                                    } })] }), _jsxs("div", { style: { marginBottom: '20px' }, children: [_jsx("label", { style: { display: 'block', marginBottom: '5px', fontWeight: 'bold' }, children: "Description (optional)" }), _jsx("textarea", { value: configDescription, onChange: (e) => setConfigDescription(e.target.value), placeholder: "Describe this staging configuration...", rows: 3, style: {
                                        width: '100%',
                                        padding: '8px',
                                        border: '1px solid #ccc',
                                        borderRadius: '4px',
                                    } })] }), _jsxs("div", { style: { display: 'flex', gap: '10px', justifyContent: 'flex-end' }, children: [_jsx("button", { onClick: () => setShowSave(false), style: {
                                        padding: '8px 16px',
                                        backgroundColor: '#6c757d',
                                        color: 'white',
                                        border: 'none',
                                        borderRadius: '4px',
                                        cursor: 'pointer',
                                    }, children: "Cancel" }), _jsx("button", { onClick: handleSave, disabled: isLoading || !configName.trim(), style: {
                                        padding: '8px 16px',
                                        backgroundColor: '#28a745',
                                        color: 'white',
                                        border: 'none',
                                        borderRadius: '4px',
                                        cursor: 'pointer',
                                    }, children: isLoading ? 'Saving...' : 'Save' })] })] }) })), showLoad && (_jsx("div", { style: {
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
                }, children: _jsxs("div", { style: {
                        backgroundColor: 'white',
                        padding: '30px',
                        borderRadius: '8px',
                        maxWidth: '600px',
                        width: '90%',
                        maxHeight: '80vh',
                        overflowY: 'auto',
                    }, children: [_jsx("h3", { children: "Load Staging Configuration" }), isLoading ? (_jsx("p", { children: "Loading configurations..." })) : savedConfigs.length === 0 ? (_jsx("p", { style: { color: '#666', fontStyle: 'italic' }, children: "No saved staging configurations found." })) : (_jsx("div", { children: savedConfigs.map(config => (_jsxs("div", { style: {
                                    padding: '15px',
                                    marginBottom: '10px',
                                    border: '1px solid #ddd',
                                    borderRadius: '4px',
                                    backgroundColor: '#f8f9fa',
                                }, children: [_jsx("div", { style: { fontWeight: 'bold', fontSize: '16px', marginBottom: '5px' }, children: config.name }), config.description && (_jsx("div", { style: { fontSize: '14px', color: '#666', marginBottom: '5px' }, children: config.description })), _jsxs("div", { style: { fontSize: '12px', color: '#666' }, children: ["Sources: ", config.sourceTables?.join(', ') || 'N/A', " \u2022 Updated: ", new Date(config.updatedAt).toLocaleString()] }), _jsxs("div", { style: { marginTop: '10px', display: 'flex', gap: '10px' }, children: [_jsx("button", { onClick: () => handleLoad(config.name), style: {
                                                    padding: '6px 12px',
                                                    backgroundColor: '#007bff',
                                                    color: 'white',
                                                    border: 'none',
                                                    borderRadius: '4px',
                                                    cursor: 'pointer',
                                                    fontSize: '14px',
                                                }, children: "Load" }), _jsx("button", { onClick: () => handleDelete(config.name), style: {
                                                    padding: '6px 12px',
                                                    backgroundColor: '#dc3545',
                                                    color: 'white',
                                                    border: 'none',
                                                    borderRadius: '4px',
                                                    cursor: 'pointer',
                                                    fontSize: '14px',
                                                }, children: "Delete" })] })] }, config.id))) })), _jsx("button", { onClick: () => setShowLoad(false), style: {
                                marginTop: '15px',
                                padding: '8px 16px',
                                backgroundColor: '#6c757d',
                                color: 'white',
                                border: 'none',
                                borderRadius: '4px',
                                cursor: 'pointer',
                            }, children: "Close" })] }) }))] }));
};
