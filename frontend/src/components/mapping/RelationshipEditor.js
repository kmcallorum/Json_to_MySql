import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
export const RelationshipEditor = ({ tables, relationships, onRelationshipsChange, }) => {
    const [showEditor, setShowEditor] = useState(false);
    const [editingIndex, setEditingIndex] = useState(null);
    const [parentTable, setParentTable] = useState('');
    const [childTable, setChildTable] = useState('');
    const [foreignKeyColumn, setForeignKeyColumn] = useState('');
    const [parentKeyColumn, setParentKeyColumn] = useState('id');
    const handleAutoDetect = () => {
        const detected = [];
        tables.forEach(table => {
            table.columns.forEach(column => {
                const match = column.name.match(/^(.+)_id$/);
                if (match) {
                    const potentialParent = match[1];
                    const parentTable = tables.find(t => t.name === potentialParent);
                    if (parentTable && parentTable.columns.some(c => c.name === 'id')) {
                        detected.push({
                            parentTable: parentTable.name,
                            childTable: table.name,
                            foreignKeyColumn: column.name,
                            parentKeyColumn: 'id',
                        });
                    }
                }
            });
        });
        onRelationshipsChange(detected);
        alert(`Auto-detected ${detected.length} relationship(s)!`);
    };
    const handleAddRelationship = () => {
        if (!parentTable || !childTable || !foreignKeyColumn) {
            alert('Please fill in all fields');
            return;
        }
        const newRel = {
            parentTable,
            childTable,
            foreignKeyColumn,
            parentKeyColumn: parentKeyColumn || 'id',
        };
        if (editingIndex !== null) {
            const updated = [...relationships];
            updated[editingIndex] = newRel;
            onRelationshipsChange(updated);
            setEditingIndex(null);
        }
        else {
            onRelationshipsChange([...relationships, newRel]);
        }
        // Reset form
        setParentTable('');
        setChildTable('');
        setForeignKeyColumn('');
        setParentKeyColumn('id');
        setShowEditor(false);
    };
    const handleEdit = (index) => {
        const rel = relationships[index];
        setParentTable(rel.parentTable);
        setChildTable(rel.childTable);
        setForeignKeyColumn(rel.foreignKeyColumn);
        setParentKeyColumn(rel.parentKeyColumn);
        setEditingIndex(index);
        setShowEditor(true);
    };
    const handleDelete = (index) => {
        if (confirm('Delete this relationship?')) {
            onRelationshipsChange(relationships.filter((_, i) => i !== index));
        }
    };
    const getChildColumns = () => {
        const table = tables.find(t => t.name === childTable);
        return table?.columns || [];
    };
    const getParentColumns = () => {
        const table = tables.find(t => t.name === parentTable);
        return table?.columns || [];
    };
    return (_jsxs("div", { style: { marginTop: '30px', padding: '20px', backgroundColor: '#f8f9fa', borderRadius: '8px' }, children: [_jsx("h3", { children: "Table Relationships (Optional)" }), _jsxs("p", { style: { color: '#666', marginBottom: '15px' }, children: ["Define parent-child relationships to handle foreign keys during insert. Auto-detect finds columns like ", _jsx("code", { children: "document_id" }), " \u2192 ", _jsx("code", { children: "document.id" })] }), _jsxs("div", { style: { marginBottom: '15px', display: 'flex', gap: '10px' }, children: [_jsx("button", { onClick: handleAutoDetect, style: {
                            padding: '10px 20px',
                            backgroundColor: '#17a2b8',
                            color: 'white',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            fontWeight: 'bold',
                        }, children: "\uD83D\uDD0D Auto-Detect Relationships" }), _jsx("button", { onClick: () => setShowEditor(true), style: {
                            padding: '10px 20px',
                            backgroundColor: '#28a745',
                            color: 'white',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: 'pointer',
                        }, children: "+ Add Relationship" })] }), relationships.length > 0 && (_jsxs("div", { style: { marginBottom: '20px' }, children: [_jsxs("h4", { children: ["Defined Relationships (", relationships.length, "):"] }), _jsx("div", { style: { backgroundColor: 'white', padding: '15px', borderRadius: '4px' }, children: relationships.map((rel, index) => (_jsxs("div", { style: {
                                padding: '10px',
                                marginBottom: '8px',
                                backgroundColor: '#e7f3ff',
                                borderRadius: '4px',
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                            }, children: [_jsxs("div", { style: { fontSize: '14px' }, children: [_jsx("strong", { children: rel.parentTable }), ".", rel.parentKeyColumn, _jsx("span", { style: { margin: '0 10px', color: '#666' }, children: "\u2192" }), _jsx("strong", { children: rel.childTable }), ".", rel.foreignKeyColumn] }), _jsxs("div", { style: { display: 'flex', gap: '5px' }, children: [_jsx("button", { onClick: () => handleEdit(index), style: {
                                                padding: '4px 12px',
                                                fontSize: '12px',
                                                backgroundColor: '#007bff',
                                                color: 'white',
                                                border: 'none',
                                                borderRadius: '3px',
                                                cursor: 'pointer',
                                            }, children: "Edit" }), _jsx("button", { onClick: () => handleDelete(index), style: {
                                                padding: '4px 12px',
                                                fontSize: '12px',
                                                backgroundColor: '#dc3545',
                                                color: 'white',
                                                border: 'none',
                                                borderRadius: '3px',
                                                cursor: 'pointer',
                                            }, children: "Delete" })] })] }, index))) })] })), showEditor && (_jsx("div", { style: {
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                    backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex',
                    alignItems: 'center', justifyContent: 'center', zIndex: 1000,
                }, children: _jsxs("div", { style: {
                        backgroundColor: 'white', padding: '30px', borderRadius: '8px',
                        maxWidth: '600px', width: '90%',
                    }, children: [_jsxs("h3", { children: [editingIndex !== null ? 'Edit' : 'Add', " Relationship"] }), _jsxs("div", { style: { marginBottom: '15px' }, children: [_jsx("label", { style: { display: 'block', marginBottom: '5px', fontWeight: 'bold' }, children: "Parent Table *" }), _jsxs("select", { value: parentTable, onChange: (e) => setParentTable(e.target.value), style: {
                                        width: '100%', padding: '8px', border: '1px solid #ccc', borderRadius: '4px',
                                    }, children: [_jsx("option", { value: "", children: "-- Select Parent Table --" }), tables.map(table => (_jsx("option", { value: table.name, children: table.name }, table.name)))] })] }), _jsxs("div", { style: { marginBottom: '15px' }, children: [_jsx("label", { style: { display: 'block', marginBottom: '5px', fontWeight: 'bold' }, children: "Parent Key Column" }), _jsxs("select", { value: parentKeyColumn, onChange: (e) => setParentKeyColumn(e.target.value), disabled: !parentTable, style: {
                                        width: '100%', padding: '8px', border: '1px solid #ccc', borderRadius: '4px',
                                    }, children: [_jsx("option", { value: "id", children: "id (default)" }), getParentColumns().map(col => (_jsx("option", { value: col.name, children: col.name }, col.name)))] })] }), _jsxs("div", { style: { marginBottom: '15px' }, children: [_jsx("label", { style: { display: 'block', marginBottom: '5px', fontWeight: 'bold' }, children: "Child Table *" }), _jsxs("select", { value: childTable, onChange: (e) => setChildTable(e.target.value), style: {
                                        width: '100%', padding: '8px', border: '1px solid #ccc', borderRadius: '4px',
                                    }, children: [_jsx("option", { value: "", children: "-- Select Child Table --" }), tables.filter(t => t.name !== parentTable).map(table => (_jsx("option", { value: table.name, children: table.name }, table.name)))] })] }), _jsxs("div", { style: { marginBottom: '20px' }, children: [_jsx("label", { style: { display: 'block', marginBottom: '5px', fontWeight: 'bold' }, children: "Foreign Key Column (in child table) *" }), _jsxs("select", { value: foreignKeyColumn, onChange: (e) => setForeignKeyColumn(e.target.value), disabled: !childTable, style: {
                                        width: '100%', padding: '8px', border: '1px solid #ccc', borderRadius: '4px',
                                    }, children: [_jsx("option", { value: "", children: "-- Select Column --" }), getChildColumns().map(col => (_jsxs("option", { value: col.name, children: [col.name, " (", col.type, ")"] }, col.name)))] })] }), _jsxs("div", { style: {
                                padding: '10px',
                                backgroundColor: '#fff3cd',
                                borderRadius: '4px',
                                marginBottom: '20px',
                                fontSize: '13px'
                            }, children: [_jsx("strong", { children: "Example:" }), " If document.id is parent of event_data.document_id:", _jsx("br", {}), "Parent Table: ", _jsx("code", { children: "document" }), ", Parent Key: ", _jsx("code", { children: "id" }), _jsx("br", {}), "Child Table: ", _jsx("code", { children: "event_data" }), ", Foreign Key: ", _jsx("code", { children: "document_id" })] }), _jsxs("div", { style: { display: 'flex', gap: '10px', justifyContent: 'flex-end' }, children: [_jsx("button", { onClick: () => {
                                        setShowEditor(false);
                                        setEditingIndex(null);
                                        setParentTable('');
                                        setChildTable('');
                                        setForeignKeyColumn('');
                                        setParentKeyColumn('id');
                                    }, style: {
                                        padding: '8px 16px', backgroundColor: '#6c757d', color: 'white',
                                        border: 'none', borderRadius: '4px', cursor: 'pointer',
                                    }, children: "Cancel" }), _jsxs("button", { onClick: handleAddRelationship, disabled: !parentTable || !childTable || !foreignKeyColumn, style: {
                                        padding: '8px 16px', backgroundColor: '#28a745', color: 'white',
                                        border: 'none', borderRadius: '4px', cursor: 'pointer',
                                    }, children: [editingIndex !== null ? 'Update' : 'Add', " Relationship"] })] })] }) })), relationships.length > 0 && (_jsxs("div", { style: { marginTop: '20px' }, children: [_jsx("h4", { children: "Insert Order Preview:" }), _jsx("div", { style: {
                            padding: '15px',
                            backgroundColor: 'white',
                            borderRadius: '4px',
                            fontFamily: 'monospace',
                            fontSize: '13px'
                        }, children: (() => {
                            // Simple hierarchy visualization
                            const parents = new Set(relationships.map(r => r.parentTable));
                            const children = new Set(relationships.map(r => r.childTable));
                            const roots = Array.from(parents).filter(p => !children.has(p));
                            const renderTree = (table, level = 0) => {
                                const indent = '  '.repeat(level);
                                const lines = [`${indent}${level > 0 ? '↳ ' : ''}${table}`];
                                relationships
                                    .filter(r => r.parentTable === table)
                                    .forEach(rel => {
                                    lines.push(...renderTree(rel.childTable, level + 1));
                                });
                                return lines;
                            };
                            return roots.flatMap(root => renderTree(root)).map((line, i) => (_jsx("div", { children: line }, i)));
                        })() })] }))] }));
};
