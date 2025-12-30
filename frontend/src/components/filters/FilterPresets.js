import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
import { api } from '../../services/api';
export const FilterPresets = ({ baseTableName, currentFilters, onLoadPreset, }) => {
    const [presets, setPresets] = useState([]);
    const [showSave, setShowSave] = useState(false);
    const [showLoad, setShowLoad] = useState(false);
    const [presetName, setPresetName] = useState('');
    const [presetDescription, setPresetDescription] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [loadStatus, setLoadStatus] = useState('');
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
        }
        catch (error) {
            console.error('Failed to load presets:', error);
            alert(`Error loading presets: ${error}`);
        }
        finally {
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
            }
            else {
                alert(`Failed: ${result.error}`);
            }
        }
        catch (error) {
            console.error('Save error:', error);
            alert(`Error: ${error.message}`);
        }
        finally {
            setIsLoading(false);
        }
    };
    const handleLoad = async (name) => {
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
            }
            else {
                setLoadStatus(`✗ Failed: ${result.error}`);
                setTimeout(() => setLoadStatus(''), 3000);
            }
        }
        catch (error) {
            console.error('Load error:', error);
            setLoadStatus(`✗ Error: ${error.message}`);
            setTimeout(() => setLoadStatus(''), 3000);
        }
        finally {
            setIsLoading(false);
        }
    };
    const handleDelete = async (name) => {
        if (!confirm(`Delete filter preset '${name}'?`))
            return;
        try {
            const result = await api.deleteFilterPreset(name);
            if (result.success) {
                alert(`Deleted '${name}'`);
                loadPresets();
            }
        }
        catch (error) {
            alert(`Error: ${error.message}`);
        }
    };
    return (_jsxs("div", { style: { marginBottom: '15px', display: 'flex', gap: '10px' }, children: [_jsx("button", { onClick: () => setShowSave(true), style: {
                    padding: '8px 16px',
                    backgroundColor: '#17a2b8',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontSize: '14px',
                }, children: "\uD83D\uDCBE Save Filter Preset" }), _jsx("button", { onClick: () => {
                    loadPresets();
                    setShowLoad(true);
                }, style: {
                    padding: '8px 16px',
                    backgroundColor: '#6c757d',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontSize: '14px',
                }, children: "\uD83D\uDCC2 Load Filter Preset" }), showSave && (_jsx("div", { style: {
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                    backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex',
                    alignItems: 'center', justifyContent: 'center', zIndex: 1000,
                }, children: _jsxs("div", { style: {
                        backgroundColor: 'white', padding: '30px', borderRadius: '8px',
                        maxWidth: '500px', width: '90%',
                    }, children: [_jsx("h3", { children: "Save Filter Preset" }), _jsxs("div", { style: { marginBottom: '15px' }, children: [_jsx("label", { style: { display: 'block', marginBottom: '5px', fontWeight: 'bold' }, children: "Preset Name *" }), _jsx("input", { type: "text", value: presetName, onChange: (e) => setPresetName(e.target.value), placeholder: "e.g., pipeline_test_filters", style: {
                                        width: '100%', padding: '8px', border: '1px solid #ccc', borderRadius: '4px',
                                    } })] }), _jsxs("div", { style: { marginBottom: '20px' }, children: [_jsx("label", { style: { display: 'block', marginBottom: '5px', fontWeight: 'bold' }, children: "Description" }), _jsx("textarea", { value: presetDescription, onChange: (e) => setPresetDescription(e.target.value), placeholder: "Describe this filter...", rows: 2, style: {
                                        width: '100%', padding: '8px', border: '1px solid #ccc', borderRadius: '4px',
                                    } })] }), _jsxs("div", { style: { marginBottom: '15px', padding: '10px', backgroundColor: '#f8f9fa', borderRadius: '4px' }, children: [_jsx("strong", { children: "Current Filters:" }), " ", currentFilters.length === 0 ? 'None' : `${currentFilters.length} condition(s)`] }), _jsxs("div", { style: { display: 'flex', gap: '10px', justifyContent: 'flex-end' }, children: [_jsx("button", { onClick: () => setShowSave(false), style: {
                                        padding: '8px 16px', backgroundColor: '#6c757d', color: 'white',
                                        border: 'none', borderRadius: '4px', cursor: 'pointer',
                                    }, children: "Cancel" }), _jsx("button", { onClick: handleSave, disabled: isLoading || !presetName.trim(), style: {
                                        padding: '8px 16px', backgroundColor: '#28a745', color: 'white',
                                        border: 'none', borderRadius: '4px', cursor: 'pointer',
                                    }, children: isLoading ? 'Saving...' : 'Save' })] })] }) })), showLoad && (_jsx("div", { style: {
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                    backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex',
                    alignItems: 'center', justifyContent: 'center', zIndex: 1000,
                }, children: _jsxs("div", { style: {
                        backgroundColor: 'white', padding: '30px', borderRadius: '8px',
                        maxWidth: '600px', width: '90%', maxHeight: '80vh', overflowY: 'auto',
                    }, children: [_jsx("h3", { children: "Load Filter Preset" }), loadStatus && (_jsx("div", { style: {
                                marginBottom: '15px', padding: '10px', borderRadius: '4px',
                                backgroundColor: loadStatus.startsWith('✓') ? '#d4edda' : '#f8d7da',
                                color: loadStatus.startsWith('✓') ? '#155724' : '#721c24',
                                border: `1px solid ${loadStatus.startsWith('✓') ? '#c3e6cb' : '#f5c6cb'}`
                            }, children: loadStatus })), isLoading ? (_jsx("p", { children: "Loading..." })) : presets.length === 0 ? (_jsx("div", { children: _jsx("p", { style: { color: '#666', fontStyle: 'italic' }, children: "No saved filter presets found." }) })) : (_jsxs("div", { children: [_jsxs("p", { style: { marginBottom: '15px', color: '#666' }, children: ["Found ", presets.length, " saved preset(s):"] }), presets.map(preset => (_jsxs("div", { style: {
                                        padding: '15px', marginBottom: '10px', border: '1px solid #ddd',
                                        borderRadius: '4px', backgroundColor: '#f8f9fa',
                                    }, children: [_jsx("div", { style: { fontWeight: 'bold', fontSize: '16px', marginBottom: '5px' }, children: preset.name }), preset.description && (_jsx("div", { style: { fontSize: '14px', color: '#666', marginBottom: '5px' }, children: preset.description })), _jsxs("div", { style: { fontSize: '12px', color: '#666' }, children: ["Table: ", preset.baseTableName, " \u2022 Updated: ", new Date(preset.updatedAt).toLocaleString()] }), _jsxs("div", { style: { marginTop: '10px', display: 'flex', gap: '10px' }, children: [_jsx("button", { onClick: (e) => {
                                                        e.preventDefault();
                                                        e.stopPropagation();
                                                        handleLoad(preset.name);
                                                    }, style: {
                                                        padding: '6px 12px', backgroundColor: '#007bff', color: 'white',
                                                        border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '14px',
                                                    }, children: "Load" }), _jsx("button", { onClick: (e) => {
                                                        e.preventDefault();
                                                        e.stopPropagation();
                                                        handleDelete(preset.name);
                                                    }, style: {
                                                        padding: '6px 12px', backgroundColor: '#dc3545', color: 'white',
                                                        border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '14px',
                                                    }, children: "Delete" })] })] }, preset.id)))] })), _jsx("button", { onClick: () => setShowLoad(false), style: {
                                marginTop: '15px', padding: '8px 16px', backgroundColor: '#6c757d',
                                color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer',
                            }, children: "Close" })] }) }))] }));
};
