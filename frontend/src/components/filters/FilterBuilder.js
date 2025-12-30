import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useMemo } from 'react';
import { FilterPresets } from './FilterPresets';
export const FilterBuilder = ({ fields, baseTableName, onFiltersChange }) => {
    const [conditions, setConditions] = useState([]);
    const handleLoadPreset = (loadedFilters) => {
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
        const newCondition = {
            field: fields[0]?.path || '',
            operator: '=',
            value: '',
        };
        const updated = [...conditions, newCondition];
        setConditions(updated);
        onFiltersChange(updated);
    };
    const updateCondition = (index, updates) => {
        const updated = [...conditions];
        updated[index] = { ...updated[index], ...updates };
        if (updates.operator === 'IS NULL' || updates.operator === 'IS NOT NULL') {
            updated[index].value = undefined;
        }
        setConditions(updated);
        onFiltersChange(updated);
    };
    const removeCondition = (index) => {
        const updated = conditions.filter((_, i) => i !== index);
        setConditions(updated);
        onFiltersChange(updated);
    };
    const getFieldInfo = (fieldPath) => {
        return fields.find(f => f.path === fieldPath);
    };
    return (_jsxs("div", { style: {
            padding: '20px',
            backgroundColor: '#f8f9fa',
            borderRadius: '8px',
            marginBottom: '20px'
        }, children: [_jsxs("div", { style: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }, children: [_jsx("h3", { style: { margin: 0 }, children: "Build WHERE Conditions" }), _jsxs("div", { style: { display: 'flex', gap: '10px' }, children: [_jsx(FilterPresets, { baseTableName: baseTableName, currentFilters: conditions, onLoadPreset: handleLoadPreset }), _jsx("button", { onClick: addCondition, style: {
                                    padding: '8px 16px',
                                    backgroundColor: '#28a745',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '4px',
                                    cursor: 'pointer',
                                    fontWeight: 'bold',
                                }, children: "+ Add Condition" })] })] }), conditions.length === 0 && (_jsx("p", { style: { color: '#666', fontStyle: 'italic' }, children: "No filters applied. Click \"Add Condition\" to filter your data or load a saved preset." })), conditions.map((condition, index) => {
                const fieldInfo = getFieldInfo(condition.field);
                const showValueInput = condition.operator !== 'IS NULL' && condition.operator !== 'IS NOT NULL';
                const showInValues = condition.operator === 'IN';
                return (_jsxs("div", { style: {
                        padding: '15px',
                        backgroundColor: 'white',
                        borderRadius: '4px',
                        marginBottom: '10px',
                        border: '1px solid #dee2e6',
                    }, children: [_jsxs("div", { style: { display: 'flex', gap: '10px', alignItems: 'flex-start', flexWrap: 'wrap' }, children: [_jsxs("div", { style: { flex: '1 1 200px' }, children: [_jsx("label", { style: { display: 'block', fontSize: '12px', marginBottom: '5px', fontWeight: 'bold' }, children: "Field" }), _jsxs("select", { value: condition.field, onChange: (e) => updateCondition(index, { field: e.target.value }), style: {
                                                width: '100%',
                                                padding: '8px',
                                                border: '1px solid #ccc',
                                                borderRadius: '4px',
                                            }, children: [_jsx("option", { value: "", children: "-- Select Field --" }), allFieldPaths.map((fieldPath, idx) => (_jsx("option", { value: fieldPath, children: fieldPath }, `${fieldPath}-${idx}`)))] })] }), _jsxs("div", { style: { flex: '0 0 150px' }, children: [_jsx("label", { style: { display: 'block', fontSize: '12px', marginBottom: '5px', fontWeight: 'bold' }, children: "Operator" }), _jsxs("select", { value: condition.operator, onChange: (e) => updateCondition(index, { operator: e.target.value }), style: {
                                                width: '100%',
                                                padding: '8px',
                                                border: '1px solid #ccc',
                                                borderRadius: '4px',
                                            }, children: [_jsx("option", { value: "=", children: "= (equals)" }), _jsx("option", { value: "!=", children: "!= (not equals)" }), _jsx("option", { value: "IS NULL", children: "IS NULL" }), _jsx("option", { value: "IS NOT NULL", children: "IS NOT NULL" }), _jsx("option", { value: "IN", children: "IN (one of)" }), _jsx("option", { value: "LIKE", children: "LIKE (contains)" })] })] }), showValueInput && !showInValues && (_jsxs("div", { style: { flex: '1 1 200px' }, children: [_jsx("label", { style: { display: 'block', fontSize: '12px', marginBottom: '5px', fontWeight: 'bold' }, children: "Value" }), fieldInfo && fieldInfo.uniqueValues.length > 0 && fieldInfo.uniqueValues.length <= 50 ? (_jsxs("select", { value: condition.value || '', onChange: (e) => updateCondition(index, { value: e.target.value }), style: {
                                                width: '100%',
                                                padding: '8px',
                                                border: '1px solid #ccc',
                                                borderRadius: '4px',
                                            }, children: [_jsx("option", { value: "", children: "-- Select Value --" }), fieldInfo.uniqueValues.map((val, i) => (_jsx("option", { value: String(val), children: String(val) }, i)))] })) : (_jsx("input", { type: "text", value: condition.value || '', onChange: (e) => updateCondition(index, { value: e.target.value }), placeholder: "Enter value...", style: {
                                                width: '100%',
                                                padding: '8px',
                                                border: '1px solid #ccc',
                                                borderRadius: '4px',
                                            } }))] })), showInValues && fieldInfo && (_jsxs("div", { style: { flex: '1 1 300px' }, children: [_jsxs("label", { style: { display: 'block', fontSize: '12px', marginBottom: '5px', fontWeight: 'bold' }, children: ["Select Values (", fieldInfo.uniqueValues.length, " available)"] }), _jsx("select", { multiple: true, value: condition.value || [], onChange: (e) => {
                                                const selected = Array.from(e.target.selectedOptions, option => option.value);
                                                updateCondition(index, { value: selected });
                                            }, style: {
                                                width: '100%',
                                                padding: '8px',
                                                border: '1px solid #ccc',
                                                borderRadius: '4px',
                                                minHeight: '100px',
                                            }, children: fieldInfo.uniqueValues.map((val, i) => (_jsx("option", { value: String(val), children: String(val) }, i))) }), _jsx("small", { style: { color: '#666' }, children: "Hold Ctrl/Cmd to select multiple" })] })), _jsxs("div", { style: { flex: '0 0 auto' }, children: [_jsx("label", { style: { display: 'block', fontSize: '12px', marginBottom: '5px', visibility: 'hidden' }, children: "Action" }), _jsx("button", { onClick: () => removeCondition(index), style: {
                                                padding: '8px 16px',
                                                backgroundColor: '#dc3545',
                                                color: 'white',
                                                border: 'none',
                                                borderRadius: '4px',
                                                cursor: 'pointer',
                                            }, children: "Remove" })] })] }), fieldInfo && (_jsxs("div", { style: { marginTop: '10px', fontSize: '12px', color: '#666' }, children: [_jsx("strong", { children: "Info:" }), " ", fieldInfo.uniqueValues.length, " unique values,", fieldInfo.nullCount > 0 && ` ${fieldInfo.nullCount} nulls,`, ' ', fieldInfo.totalCount, " total records"] }))] }, index));
            }), conditions.length > 0 && (_jsxs("div", { style: { marginTop: '15px', padding: '10px', backgroundColor: '#e7f3ff', borderRadius: '4px' }, children: [_jsx("strong", { children: "SQL Preview:" }), _jsx("pre", { style: { margin: '5px 0 0 0', fontSize: '13px' }, children: conditions.map((c, i) => {
                            let clause = `${i > 0 ? 'AND ' : ''}${c.field} ${c.operator}`;
                            if (c.operator === '=' || c.operator === '!=' || c.operator === 'LIKE') {
                                clause += ` '${c.value}'`;
                            }
                            else if (c.operator === 'IN') {
                                clause += ` (${(c.value || []).map((v) => `'${v}'`).join(', ')})`;
                            }
                            return clause;
                        }).join('\n') })] }))] }));
};
