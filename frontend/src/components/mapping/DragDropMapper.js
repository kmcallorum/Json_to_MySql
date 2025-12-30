import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useEffect } from 'react';
import { api } from '../../services/api';
export const DragDropMapper = ({ fields, tables, onMappingsChange, initialMappings = [], baseTableName, }) => {
    const [mappings, setMappings] = useState(initialMappings);
    const [draggedField, setDraggedField] = useState(null);
    const [showLoadMapping, setShowLoadMapping] = useState(false);
    const [savedMappings, setSavedMappings] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    useEffect(() => {
        if (initialMappings.length > 0) {
            setMappings(initialMappings);
        }
    }, [initialMappings]);
    const loadSavedMappings = async () => {
        setIsLoading(true);
        try {
            const result = await api.listMappingConfigs();
            if (result.success) {
                // Filter by base table name if provided
                const filtered = baseTableName
                    ? result.configs.filter((c) => c.baseTableName === baseTableName)
                    : result.configs;
                setSavedMappings(filtered);
            }
        }
        catch (error) {
            console.error('Failed to load mappings:', error);
        }
        finally {
            setIsLoading(false);
        }
    };
    const handleLoadMapping = async (name) => {
        setIsLoading(true);
        try {
            const result = await api.loadMappingConfig(name);
            if (result.success) {
                const config = result.config;
                setMappings(config.mappings);
                onMappingsChange(config.mappings);
                setShowLoadMapping(false);
                alert(`Mapping '${name}' loaded! ${config.mappings.length} fields mapped.`);
            }
            else {
                alert(`Failed: ${result.error}`);
            }
        }
        catch (error) {
            alert(`Error: ${error.message}`);
        }
        finally {
            setIsLoading(false);
        }
    };
    const handleDragStart = (field) => {
        setDraggedField(field);
    };
    const handleDragOver = (e) => {
        e.preventDefault();
    };
    const handleDrop = (tableName, columnName, dataType) => {
        if (!draggedField)
            return;
        const newMapping = {
            sourcePath: draggedField.path,
            targetTable: tableName,
            targetColumn: columnName,
            dataType: dataType,
            isArray: draggedField.isArray,
        };
        const updated = [...mappings.filter(m => m.sourcePath !== draggedField.path), newMapping];
        setMappings(updated);
        onMappingsChange(updated);
        setDraggedField(null);
    };
    const removeMapping = (sourcePath) => {
        const updated = mappings.filter(m => m.sourcePath !== sourcePath);
        setMappings(updated);
        onMappingsChange(updated);
    };
    const clearAllMappings = () => {
        if (confirm('Clear all mappings?')) {
            setMappings([]);
            onMappingsChange([]);
        }
    };
    const isMapped = (fieldPath) => {
        return mappings.some(m => m.sourcePath === fieldPath);
    };
    const getMappingForField = (fieldPath) => {
        return mappings.find(m => m.sourcePath === fieldPath);
    };
    return (_jsxs("div", { children: [_jsxs("div", { style: { marginBottom: '15px', display: 'flex', gap: '10px', justifyContent: 'flex-end' }, children: [_jsx("button", { onClick: () => {
                            loadSavedMappings();
                            setShowLoadMapping(true);
                        }, style: {
                            padding: '10px 20px',
                            backgroundColor: '#17a2b8',
                            color: 'white',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            fontWeight: 'bold',
                        }, children: "\uD83D\uDCC2 Load Saved Mapping" }), mappings.length > 0 && (_jsx("button", { onClick: clearAllMappings, style: {
                            padding: '10px 20px',
                            backgroundColor: '#dc3545',
                            color: 'white',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: 'pointer',
                        }, children: "\uD83D\uDDD1\uFE0F Clear All Mappings" }))] }), showLoadMapping && (_jsx("div", { style: {
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                    backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex',
                    alignItems: 'center', justifyContent: 'center', zIndex: 1000,
                }, children: _jsxs("div", { style: {
                        backgroundColor: 'white', padding: '30px', borderRadius: '8px',
                        maxWidth: '600px', width: '90%', maxHeight: '80vh', overflowY: 'auto',
                    }, children: [_jsx("h3", { children: "Load Saved Mapping" }), isLoading ? (_jsx("p", { children: "Loading..." })) : savedMappings.length === 0 ? (_jsxs("p", { style: { color: '#666', fontStyle: 'italic' }, children: ["No saved mappings found", baseTableName ? ` for table '${baseTableName}'` : '', "."] })) : (_jsx("div", { children: savedMappings.map(mapping => (_jsxs("div", { style: {
                                    padding: '15px', marginBottom: '10px', border: '1px solid #ddd',
                                    borderRadius: '4px', backgroundColor: '#f8f9fa',
                                }, children: [_jsx("div", { style: { fontWeight: 'bold', fontSize: '16px', marginBottom: '5px' }, children: mapping.name }), mapping.description && (_jsx("div", { style: { fontSize: '14px', color: '#666', marginBottom: '5px' }, children: mapping.description })), _jsxs("div", { style: { fontSize: '12px', color: '#666' }, children: ["Table: ", mapping.baseTableName, " \u2022 Updated: ", new Date(mapping.updatedAt).toLocaleString()] }), _jsx("button", { onClick: () => handleLoadMapping(mapping.name), disabled: isLoading, style: {
                                            marginTop: '10px', padding: '8px 16px', backgroundColor: '#28a745',
                                            color: 'white', border: 'none', borderRadius: '4px',
                                            cursor: 'pointer', fontWeight: 'bold',
                                        }, children: "Load This Mapping" })] }, mapping.id))) })), _jsx("button", { onClick: () => setShowLoadMapping(false), style: {
                                marginTop: '15px', padding: '8px 16px', backgroundColor: '#6c757d',
                                color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer',
                            }, children: "Close" })] }) })), mappings.length > 0 && (_jsxs("div", { style: {
                    marginBottom: '15px',
                    padding: '10px',
                    backgroundColor: '#d4edda',
                    borderRadius: '4px',
                    border: '1px solid #c3e6cb'
                }, children: [_jsxs("strong", { children: ["\u2713 ", mappings.length, " field(s) mapped"] }), ' • ', fields.length - mappings.length, " remaining"] })), _jsxs("div", { style: { display: 'flex', gap: '20px' }, children: [_jsxs("div", { style: { flex: '1', backgroundColor: '#f8f9fa', padding: '15px', borderRadius: '8px' }, children: [_jsxs("h3", { children: ["JSON Fields (", fields.length, ")"] }), _jsx("div", { style: { fontSize: '12px', color: '#666', marginBottom: '10px' }, children: "Drag fields to table columns \u2192" }), _jsx("div", { style: { maxHeight: '600px', overflowY: 'auto' }, children: fields.map(field => {
                                    const mapping = getMappingForField(field.path);
                                    return (_jsxs("div", { draggable: true, onDragStart: () => handleDragStart(field), style: {
                                            padding: '10px',
                                            marginBottom: '8px',
                                            backgroundColor: isMapped(field.path) ? '#d4edda' : 'white',
                                            border: '1px solid #ddd',
                                            borderRadius: '4px',
                                            cursor: 'move',
                                        }, children: [_jsxs("div", { style: { fontWeight: 'bold', fontSize: '14px' }, children: [field.path, field.isArray && _jsx("span", { style: { marginLeft: '5px', color: '#007bff' }, children: "[]" })] }), _jsxs("div", { style: { fontSize: '12px', color: '#666' }, children: [Array.from(field.types).join(', '), " \u2022 ", field.suggestedType] }), mapping && (_jsxs("div", { style: { fontSize: '12px', color: '#28a745', marginTop: '5px' }, children: ["\u2713 Mapped to: ", mapping.targetTable, ".", mapping.targetColumn, _jsx("button", { onClick: () => removeMapping(field.path), style: {
                                                            marginLeft: '10px',
                                                            padding: '2px 8px',
                                                            fontSize: '11px',
                                                            backgroundColor: '#dc3545',
                                                            color: 'white',
                                                            border: 'none',
                                                            borderRadius: '3px',
                                                            cursor: 'pointer',
                                                        }, children: "Remove" })] }))] }, field.path));
                                }) })] }), _jsxs("div", { style: { flex: '1', backgroundColor: '#f8f9fa', padding: '15px', borderRadius: '8px' }, children: [_jsxs("h3", { children: ["Target Tables (", tables.length, ")"] }), _jsx("div", { style: { fontSize: '12px', color: '#666', marginBottom: '10px' }, children: "Drop fields onto columns" }), _jsx("div", { style: { maxHeight: '600px', overflowY: 'auto' }, children: tables.map(table => (_jsxs("div", { style: {
                                        marginBottom: '20px',
                                        padding: '15px',
                                        backgroundColor: 'white',
                                        border: '2px solid #007bff',
                                        borderRadius: '8px',
                                    }, children: [_jsxs("h4", { style: { marginTop: 0 }, children: [table.name, table.isNew && _jsx("span", { style: { marginLeft: '8px', fontSize: '12px', color: '#28a745' }, children: "(New)" })] }), _jsxs("div", { style: { fontSize: '12px', color: '#666', marginBottom: '10px' }, children: [table.columns.length, " columns"] }), table.columns.map(column => {
                                            const mappedField = mappings.find(m => m.targetTable === table.name && m.targetColumn === column.name);
                                            return (_jsxs("div", { onDragOver: handleDragOver, onDrop: (e) => {
                                                    e.preventDefault();
                                                    handleDrop(table.name, column.name, column.type);
                                                }, style: {
                                                    padding: '8px',
                                                    marginBottom: '6px',
                                                    backgroundColor: mappedField ? '#fff3cd' : '#f8f9fa',
                                                    border: '1px dashed #ccc',
                                                    borderRadius: '4px',
                                                    minHeight: '40px',
                                                }, children: [_jsxs("div", { style: { fontWeight: 'bold', fontSize: '13px' }, children: [column.name, column.isPrimaryKey && _jsx("span", { style: { marginLeft: '5px', color: '#dc3545' }, children: "\uD83D\uDD11" })] }), _jsxs("div", { style: { fontSize: '11px', color: '#666' }, children: [column.type, !column.nullable && ' • NOT NULL'] }), mappedField && (_jsxs("div", { style: { fontSize: '11px', color: '#856404', marginTop: '4px', fontStyle: 'italic' }, children: ["\u2190 ", mappedField.sourcePath] }))] }, column.name));
                                        })] }, table.name))) })] })] })] }));
};
