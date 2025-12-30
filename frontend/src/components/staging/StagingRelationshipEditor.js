import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useEffect } from 'react';
export const StagingRelationshipEditor = ({ tables, relationships, onRelationshipsChange, }) => {
    const [localRelationships, setLocalRelationships] = useState(relationships);
    useEffect(() => {
        // Auto-detect relationships based on naming conventions
        autoDetectRelationships();
    }, [tables]);
    const autoDetectRelationships = () => {
        const detected = [];
        // Look for tables with naming pattern: staging_event_data and staging_event_test_data
        tables.forEach(table => {
            tables.forEach(potentialChild => {
                if (table.name !== potentialChild.name) {
                    // Check if child table name starts with parent table name
                    if (potentialChild.name.startsWith(table.name + '_')) {
                        // Look for ID columns
                        const parentIdCol = table.columns?.find((c) => c.name === 'id');
                        const childFkCol = potentialChild.columns?.find((c) => c.name === table.name.replace('staging_', '') + '_id' || c.name === 'parent_id');
                        if (parentIdCol) {
                            detected.push({
                                parentTable: table.name,
                                childTable: potentialChild.name,
                                parentKeyColumn: 'id',
                                foreignKeyColumn: childFkCol?.name || 'parent_id',
                            });
                        }
                    }
                }
            });
        });
        if (detected.length > 0) {
            setLocalRelationships(detected);
            onRelationshipsChange(detected);
        }
    };
    const handleAddRelationship = () => {
        const newRel = {
            parentTable: tables[0]?.name || '',
            childTable: tables[1]?.name || '',
            parentKeyColumn: 'id',
            foreignKeyColumn: 'parent_id',
        };
        const updated = [...localRelationships, newRel];
        setLocalRelationships(updated);
        onRelationshipsChange(updated);
    };
    const handleRemoveRelationship = (index) => {
        const updated = localRelationships.filter((_, i) => i !== index);
        setLocalRelationships(updated);
        onRelationshipsChange(updated);
    };
    const handleUpdateRelationship = (index, field, value) => {
        const updated = localRelationships.map((rel, i) => i === index ? { ...rel, [field]: value } : rel);
        setLocalRelationships(updated);
        onRelationshipsChange(updated);
    };
    return (_jsxs("div", { style: { padding: '20px' }, children: [_jsx("h3", { children: "Table Relationships" }), _jsx("p", { style: { color: '#666' }, children: "Define parent-child relationships for proper insert order." }), localRelationships.length > 0 && (_jsxs("div", { style: { marginBottom: '20px', padding: '15px', backgroundColor: '#d4edda', borderRadius: '4px' }, children: [_jsx("h4", { style: { marginTop: 0 }, children: "Auto-Detected Relationships:" }), localRelationships.map((rel, index) => (_jsxs("div", { style: { marginBottom: '10px', fontSize: '14px' }, children: ["\u2713 ", rel.parentTable, ".", rel.parentKeyColumn, " \u2192 ", rel.childTable, ".", rel.foreignKeyColumn] }, index)))] })), _jsx("button", { onClick: handleAddRelationship, style: {
                    padding: '10px 20px',
                    backgroundColor: '#007bff',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    marginBottom: '20px',
                }, children: "+ Add Relationship" }), localRelationships.map((rel, index) => (_jsxs("div", { style: {
                    marginBottom: '15px',
                    padding: '15px',
                    backgroundColor: '#f8f9fa',
                    borderRadius: '4px',
                    border: '1px solid #dee2e6',
                }, children: [_jsxs("div", { style: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '10px' }, children: [_jsxs("div", { children: [_jsx("label", { style: { display: 'block', marginBottom: '5px', fontWeight: 'bold' }, children: "Parent Table" }), _jsx("select", { value: rel.parentTable, onChange: e => handleUpdateRelationship(index, 'parentTable', e.target.value), style: {
                                            width: '100%',
                                            padding: '8px',
                                            border: '1px solid #ccc',
                                            borderRadius: '4px',
                                        }, children: tables.map(t => (_jsx("option", { value: t.name, children: t.name }, t.name))) })] }), _jsxs("div", { children: [_jsx("label", { style: { display: 'block', marginBottom: '5px', fontWeight: 'bold' }, children: "Parent Key Column" }), _jsx("select", { value: rel.parentKeyColumn, onChange: e => handleUpdateRelationship(index, 'parentKeyColumn', e.target.value), style: {
                                            width: '100%',
                                            padding: '8px',
                                            border: '1px solid #ccc',
                                            borderRadius: '4px',
                                        }, children: tables
                                            .find(t => t.name === rel.parentTable)
                                            ?.columns?.map((c) => (_jsx("option", { value: c.name, children: c.name }, c.name))) })] }), _jsxs("div", { children: [_jsx("label", { style: { display: 'block', marginBottom: '5px', fontWeight: 'bold' }, children: "Child Table" }), _jsx("select", { value: rel.childTable, onChange: e => handleUpdateRelationship(index, 'childTable', e.target.value), style: {
                                            width: '100%',
                                            padding: '8px',
                                            border: '1px solid #ccc',
                                            borderRadius: '4px',
                                        }, children: tables.map(t => (_jsx("option", { value: t.name, children: t.name }, t.name))) })] }), _jsxs("div", { children: [_jsx("label", { style: { display: 'block', marginBottom: '5px', fontWeight: 'bold' }, children: "Foreign Key Column" }), _jsx("select", { value: rel.foreignKeyColumn, onChange: e => handleUpdateRelationship(index, 'foreignKeyColumn', e.target.value), style: {
                                            width: '100%',
                                            padding: '8px',
                                            border: '1px solid #ccc',
                                            borderRadius: '4px',
                                        }, children: tables
                                            .find(t => t.name === rel.childTable)
                                            ?.columns?.map((c) => (_jsx("option", { value: c.name, children: c.name }, c.name))) })] })] }), _jsx("button", { onClick: () => handleRemoveRelationship(index), style: {
                            padding: '6px 12px',
                            backgroundColor: '#dc3545',
                            color: 'white',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            fontSize: '12px',
                        }, children: "Remove" })] }, index)))] }));
};
