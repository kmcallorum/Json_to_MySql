import { jsxs as _jsxs, jsx as _jsx } from "react/jsx-runtime";
import { useState } from 'react';
export const StagingColumnMapper = ({ sourceTables, stagingTables, onMappingsChange, initialMappings = [], }) => {
    const [mappings, setMappings] = useState(initialMappings);
    const [draggedColumn, setDraggedColumn] = useState(null);
    const handleDragStart = (tableName, columnName, columnType) => {
        setDraggedColumn({ tableName, columnName, columnType });
    };
    const handleDragOver = (e) => {
        e.preventDefault();
    };
    const handleDrop = (targetTable, targetColumn) => {
        if (!draggedColumn)
            return;
        const newMapping = {
            sourceTable: draggedColumn.tableName,
            sourceColumn: draggedColumn.columnName,
            targetTable,
            targetColumn,
        };
        const updated = [
            ...mappings.filter(m => !(m.sourceTable === draggedColumn.tableName && m.sourceColumn === draggedColumn.columnName)),
            newMapping,
        ];
        setMappings(updated);
        onMappingsChange(updated);
        setDraggedColumn(null);
    };
    const removeMapping = (sourceTable, sourceColumn) => {
        const updated = mappings.filter(m => !(m.sourceTable === sourceTable && m.sourceColumn === sourceColumn));
        setMappings(updated);
        onMappingsChange(updated);
    };
    const isMapped = (sourceTable, sourceColumn) => {
        return mappings.some(m => m.sourceTable === sourceTable && m.sourceColumn === sourceColumn);
    };
    const getMappingFor = (sourceTable, sourceColumn) => {
        return mappings.find(m => m.sourceTable === sourceTable && m.sourceColumn === sourceColumn);
    };
    return (_jsxs("div", { children: [_jsxs("div", { style: { marginBottom: '15px', padding: '10px', backgroundColor: '#d4edda', borderRadius: '4px' }, children: [_jsxs("strong", { children: ["\u2713 ", mappings.length, " column(s) mapped"] }), ' • ', sourceTables.reduce((sum, t) => sum + (t.columns?.length || 0), 0) - mappings.length, " remaining"] }), _jsxs("div", { style: { display: 'flex', gap: '20px' }, children: [_jsxs("div", { style: { flex: '1', backgroundColor: '#f8f9fa', padding: '15px', borderRadius: '8px' }, children: [_jsx("h3", { children: "Source Tables & Columns" }), _jsx("div", { style: { fontSize: '12px', color: '#666', marginBottom: '10px' }, children: "Drag columns to staging tables \u2192" }), sourceTables.map(table => (_jsxs("div", { style: { marginBottom: '20px' }, children: [_jsx("h4", { style: {
                                            backgroundColor: '#007bff',
                                            color: 'white',
                                            padding: '8px 12px',
                                            borderRadius: '4px',
                                            fontSize: '14px',
                                            margin: '0 0 10px 0',
                                        }, children: table.tableName }), _jsx("div", { style: { maxHeight: '400px', overflowY: 'auto' }, children: table.columns?.map((col) => {
                                            const mapping = getMappingFor(table.tableName, col.name);
                                            return (_jsxs("div", { draggable: true, onDragStart: () => handleDragStart(table.tableName, col.name, col.type), style: {
                                                    padding: '10px',
                                                    marginBottom: '8px',
                                                    backgroundColor: isMapped(table.tableName, col.name) ? '#d4edda' : 'white',
                                                    border: '1px solid #ddd',
                                                    borderRadius: '4px',
                                                    cursor: 'move',
                                                }, children: [_jsxs("div", { style: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' }, children: [_jsxs("div", { children: [_jsx("div", { style: { fontWeight: 'bold' }, children: col.name }), _jsx("div", { style: { fontSize: '12px', color: '#666' }, children: col.type })] }), mapping && (_jsxs("div", { style: { fontSize: '12px', color: '#28a745' }, children: ["\u2192 ", mapping.targetTable, ".", mapping.targetColumn] }))] }), mapping && (_jsx("button", { onClick: () => removeMapping(table.tableName, col.name), style: {
                                                            marginTop: '5px',
                                                            padding: '4px 8px',
                                                            backgroundColor: '#dc3545',
                                                            color: 'white',
                                                            border: 'none',
                                                            borderRadius: '3px',
                                                            cursor: 'pointer',
                                                            fontSize: '11px',
                                                        }, children: "Remove Mapping" }))] }, col.name));
                                        }) })] }, table.tableName)))] }), _jsxs("div", { style: { flex: '1', backgroundColor: '#f8f9fa', padding: '15px', borderRadius: '8px' }, children: [_jsx("h3", { children: "Staging Tables & Columns" }), _jsx("div", { style: { fontSize: '12px', color: '#666', marginBottom: '10px' }, children: "Drop columns here \u2190" }), stagingTables.map(table => (_jsxs("div", { style: { marginBottom: '20px' }, children: [_jsx("h4", { style: {
                                            backgroundColor: '#28a745',
                                            color: 'white',
                                            padding: '8px 12px',
                                            borderRadius: '4px',
                                            fontSize: '14px',
                                            margin: '0 0 10px 0',
                                        }, children: table.name }), _jsx("div", { style: { maxHeight: '400px', overflowY: 'auto' }, children: table.columns?.map((col) => (_jsxs("div", { onDragOver: handleDragOver, onDrop: () => handleDrop(table.name, col.name), style: {
                                                padding: '10px',
                                                marginBottom: '8px',
                                                backgroundColor: 'white',
                                                border: '2px dashed #ddd',
                                                borderRadius: '4px',
                                                cursor: 'pointer',
                                            }, children: [_jsx("div", { style: { fontWeight: 'bold' }, children: col.name }), _jsx("div", { style: { fontSize: '12px', color: '#666' }, children: col.type })] }, col.name))) })] }, table.name)))] })] })] }));
};
