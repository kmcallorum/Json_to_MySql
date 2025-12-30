import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { StagingTableSelector } from './StagingTableSelector';
import { StagingColumnMapper } from './StagingColumnMapper';
import { StagingRelationshipEditor } from './StagingRelationshipEditor';
export const StagingWorkflow = ({ sourceTables: propsSourceTables, onClose, }) => {
    const [currentStep, setCurrentStep] = useState('select-source');
    const [sourceTables, setSourceTables] = useState(propsSourceTables || []);
    const [stagingTables, setStagingTables] = useState([]);
    const [mappings, setMappings] = useState([]);
    const [relationships, setRelationships] = useState([]);
    const [whereConditions, setWhereConditions] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isExecuting, setIsExecuting] = useState(false);
    const [message, setMessage] = useState('');
    const [availableTables, setAvailableTables] = useState([]);
    const [selectedSourceTables, setSelectedSourceTables] = useState([]);
    useEffect(() => {
        if (propsSourceTables && propsSourceTables.length > 0) {
            // Skip source selection if tables were provided
            setCurrentStep('select-staging');
        }
        else {
            loadAvailableTables();
        }
    }, [propsSourceTables]);
    const loadAvailableTables = async () => {
        setIsLoading(true);
        try {
            const result = await api.getTableList();
            if (result.success) {
                // Filter out _toprocess tables
                const filtered = result.tables.filter((t) => !t.endsWith('_toprocess'));
                setAvailableTables(filtered);
            }
        }
        catch (error) {
            console.error('Error loading tables:', error);
        }
        finally {
            setIsLoading(false);
        }
    };
    const handleSourceTablesSelected = async () => {
        if (selectedSourceTables.length === 0) {
            alert('Please select at least one source table');
            return;
        }
        setIsLoading(true);
        try {
            // Load structures of selected tables
            const result = await api.analyzeTables(selectedSourceTables);
            if (result.success) {
                setSourceTables(result.tables);
                setCurrentStep('where-clause');
            }
            else {
                setMessage(`Error: ${result.error}`);
            }
        }
        catch (error) {
            setMessage(`Error: ${error.message}`);
        }
        finally {
            setIsLoading(false);
        }
    };
    const handleWhereClauseComplete = () => {
        setCurrentStep('select-staging');
    };
    const handleStagingTablesSelected = (tables) => {
        setStagingTables(tables);
        setCurrentStep('map-columns');
    };
    const handleMappingsComplete = () => {
        if (mappings.length === 0) {
            alert('Please map at least one column');
            return;
        }
        setCurrentStep('define-relationships');
    };
    const handleRelationshipsComplete = () => {
        setCurrentStep('execute');
    };
    const handleExecute = async () => {
        if (!confirm(`Execute staging process?\n\n${stagingTables.filter(t => t.isNew).length} new tables will be created\n${mappings.length} columns will be mapped\n${relationships.length} relationships defined\n\nContinue?`)) {
            return;
        }
        setIsExecuting(true);
        setMessage('');
        try {
            // Step 1: Create new staging tables
            const newTables = stagingTables.filter(t => t.isNew);
            if (newTables.length > 0) {
                const createResult = await api.createStagingTables(newTables);
                if (!createResult.success) {
                    setMessage(`Error creating tables: ${createResult.error}`);
                    return;
                }
                setMessage(`✓ Created ${createResult.tablesCreated.length} staging tables\n`);
            }
            // Step 2: Execute staging copy
            const sourceTableNames = sourceTables.map(t => t.tableName);
            const copyResult = await api.executeStagingCopy({
                mappings,
                relationships,
                sourceTables: sourceTableNames,
                whereConditions,
                batchSize: 100,
            });
            if (copyResult.success) {
                setMessage(prev => prev + `\n✓ Success! Copied ${copyResult.processed} records to staging tables.`);
                if (copyResult.errors.length > 0) {
                    setMessage(prev => prev + `\n⚠ ${copyResult.errors.length} errors occurred.`);
                }
            }
            else {
                setMessage(`Error: ${copyResult.error}`);
            }
        }
        catch (error) {
            setMessage(`Error: ${error.message}`);
        }
        finally {
            setIsExecuting(false);
        }
    };
    const handleBack = () => {
        const steps = ['select-source', 'where-clause', 'select-staging', 'map-columns', 'define-relationships', 'execute'];
        const currentIndex = steps.indexOf(currentStep);
        if (currentIndex > 0) {
            // Skip select-source if we had props source tables
            if (steps[currentIndex - 1] === 'select-source' && propsSourceTables && propsSourceTables.length > 0) {
                return; // Can't go back
            }
            setCurrentStep(steps[currentIndex - 1]);
        }
    };
    return (_jsx("div", { style: {
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
                maxWidth: '1200px',
                width: '95%',
                maxHeight: '90vh',
                overflowY: 'auto',
            }, children: [_jsxs("div", { style: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }, children: [_jsx("h2", { children: "Stage Data Workflow" }), _jsx("button", { onClick: onClose, style: {
                                padding: '8px 16px',
                                backgroundColor: '#6c757d',
                                color: 'white',
                                border: 'none',
                                borderRadius: '4px',
                                cursor: 'pointer',
                            }, children: "\u2715 Close" })] }), _jsxs("div", { style: { marginBottom: '30px', display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }, children: [(!propsSourceTables || propsSourceTables.length === 0) && (_jsxs(_Fragment, { children: [_jsx("div", { style: {
                                        padding: '8px 16px',
                                        backgroundColor: currentStep === 'select-source' ? '#007bff' : '#28a745',
                                        color: 'white',
                                        borderRadius: '4px',
                                        fontSize: '14px',
                                    }, children: currentStep === 'select-source' ? '1. Selecting Source...' : '✓ 1. Source' }), _jsx("div", { style: { width: '20px', height: '2px', backgroundColor: '#dee2e6' } })] })), _jsx("div", { style: {
                                padding: '8px 16px',
                                backgroundColor: currentStep === 'select-staging'
                                    ? '#007bff'
                                    : ['map-columns', 'define-relationships', 'execute'].includes(currentStep)
                                        ? '#28a745'
                                        : '#dee2e6',
                                color: currentStep === 'select-staging' || ['map-columns', 'define-relationships', 'execute'].includes(currentStep)
                                    ? 'white'
                                    : '#6c757d',
                                borderRadius: '4px',
                                fontSize: '14px',
                            }, children: currentStep === 'select-staging' ? '2. Selecting Staging...' : '✓ 2. Staging' }), _jsx("div", { style: { width: '20px', height: '2px', backgroundColor: '#dee2e6' } }), _jsx("div", { style: {
                                padding: '8px 16px',
                                backgroundColor: currentStep === 'map-columns'
                                    ? '#007bff'
                                    : ['define-relationships', 'execute'].includes(currentStep)
                                        ? '#28a745'
                                        : '#dee2e6',
                                color: currentStep === 'map-columns' || ['define-relationships', 'execute'].includes(currentStep)
                                    ? 'white'
                                    : '#6c757d',
                                borderRadius: '4px',
                                fontSize: '14px',
                            }, children: currentStep === 'map-columns' ? '3. Mapping...' : '✓ 3. Mapped' }), _jsx("div", { style: { width: '20px', height: '2px', backgroundColor: '#dee2e6' } }), _jsx("div", { style: {
                                padding: '8px 16px',
                                backgroundColor: currentStep === 'define-relationships'
                                    ? '#007bff'
                                    : currentStep === 'execute'
                                        ? '#28a745'
                                        : '#dee2e6',
                                color: ['define-relationships', 'execute'].includes(currentStep) ? 'white' : '#6c757d',
                                borderRadius: '4px',
                                fontSize: '14px',
                            }, children: currentStep === 'define-relationships' ? '4. Relationships...' : '✓ 4. Relations' }), _jsx("div", { style: { width: '20px', height: '2px', backgroundColor: '#dee2e6' } }), _jsx("div", { style: {
                                padding: '8px 16px',
                                backgroundColor: currentStep === 'execute' ? '#007bff' : '#dee2e6',
                                color: currentStep === 'execute' ? 'white' : '#6c757d',
                                borderRadius: '4px',
                                fontSize: '14px',
                            }, children: "5. Execute" })] }), currentStep === 'select-source' && (_jsxs("div", { children: [_jsx("h3", { children: "Step 1: Select Source Tables" }), _jsx("p", { style: { color: '#666' }, children: "Select the flattened tables you want to copy to staging." }), isLoading ? (_jsx("p", { children: "Loading available tables..." })) : (_jsxs("div", { children: [_jsx("div", { style: { marginBottom: '20px', maxHeight: '400px', overflowY: 'auto' }, children: availableTables.map(table => (_jsxs("div", { style: {
                                            padding: '10px',
                                            marginBottom: '8px',
                                            backgroundColor: selectedSourceTables.includes(table) ? '#d4edda' : '#f8f9fa',
                                            border: '1px solid #dee2e6',
                                            borderRadius: '4px',
                                            cursor: 'pointer',
                                        }, onClick: () => {
                                            if (selectedSourceTables.includes(table)) {
                                                setSelectedSourceTables(prev => prev.filter(t => t !== table));
                                            }
                                            else {
                                                setSelectedSourceTables(prev => [...prev, table]);
                                            }
                                        }, children: [_jsx("strong", { children: table }), selectedSourceTables.includes(table) && (_jsx("span", { style: { marginLeft: '10px', color: '#28a745' }, children: "\u2713 Selected" }))] }, table))) }), _jsx("button", { onClick: handleSourceTablesSelected, disabled: selectedSourceTables.length === 0, style: {
                                        padding: '12px 24px',
                                        backgroundColor: selectedSourceTables.length > 0 ? '#28a745' : '#ccc',
                                        color: 'white',
                                        border: 'none',
                                        borderRadius: '4px',
                                        cursor: selectedSourceTables.length > 0 ? 'pointer' : 'not-allowed',
                                        fontWeight: 'bold',
                                    }, children: "Continue to Staging Tables \u2192" })] }))] })), currentStep === 'where-clause' && (_jsxs("div", { children: [_jsx("h3", { children: "Step 2: WHERE Conditions (Optional)" }), _jsx("p", { style: { color: '#666' }, children: "Add conditions to filter source data (e.g., milestoneId IS NOT NULL)." }), _jsxs("div", { style: { marginBottom: '20px' }, children: [whereConditions.map((condition, index) => (_jsxs("div", { style: {
                                        display: 'flex',
                                        gap: '10px',
                                        marginBottom: '10px',
                                        padding: '10px',
                                        backgroundColor: '#f8f9fa',
                                        borderRadius: '4px',
                                    }, children: [_jsx("input", { type: "text", placeholder: "Field name (e.g., milestoneId)", value: condition.field, onChange: e => {
                                                const updated = [...whereConditions];
                                                updated[index].field = e.target.value;
                                                setWhereConditions(updated);
                                            }, style: {
                                                flex: 1,
                                                padding: '8px',
                                                border: '1px solid #ccc',
                                                borderRadius: '4px',
                                            } }), _jsxs("select", { value: condition.operator, onChange: e => {
                                                const updated = [...whereConditions];
                                                updated[index].operator = e.target.value;
                                                setWhereConditions(updated);
                                            }, style: {
                                                padding: '8px',
                                                border: '1px solid #ccc',
                                                borderRadius: '4px',
                                            }, children: [_jsx("option", { value: "=", children: "= (equals)" }), _jsx("option", { value: "!=", children: "!= (not equals)" }), _jsx("option", { value: ">", children: " > (greater than)" }), _jsx("option", { value: "<", children: "< (less than)" }), _jsx("option", { value: "IS NOT NULL", children: "IS NOT NULL" }), _jsx("option", { value: "IS NULL", children: "IS NULL" })] }), !['IS NOT NULL', 'IS NULL'].includes(condition.operator) && (_jsx("input", { type: "text", placeholder: "Value", value: condition.value || '', onChange: e => {
                                                const updated = [...whereConditions];
                                                updated[index].value = e.target.value;
                                                setWhereConditions(updated);
                                            }, style: {
                                                flex: 1,
                                                padding: '8px',
                                                border: '1px solid #ccc',
                                                borderRadius: '4px',
                                            } })), _jsx("button", { onClick: () => {
                                                setWhereConditions(whereConditions.filter((_, i) => i !== index));
                                            }, style: {
                                                padding: '8px 16px',
                                                backgroundColor: '#dc3545',
                                                color: 'white',
                                                border: 'none',
                                                borderRadius: '4px',
                                                cursor: 'pointer',
                                            }, children: "Remove" })] }, index))), _jsx("button", { onClick: () => {
                                        setWhereConditions([
                                            ...whereConditions,
                                            { field: '', operator: 'IS NOT NULL', value: '' },
                                        ]);
                                    }, style: {
                                        padding: '10px 20px',
                                        backgroundColor: '#007bff',
                                        color: 'white',
                                        border: 'none',
                                        borderRadius: '4px',
                                        cursor: 'pointer',
                                    }, children: "+ Add Condition" })] }), whereConditions.length > 0 && (_jsxs("div", { style: {
                                marginBottom: '20px',
                                padding: '15px',
                                backgroundColor: '#d4edda',
                                borderRadius: '4px',
                            }, children: [_jsx("strong", { children: "WHERE Clause Preview:" }), _jsx("div", { style: { marginTop: '10px', fontFamily: 'monospace', fontSize: '14px' }, children: whereConditions
                                        .map(c => ['IS NOT NULL', 'IS NULL'].includes(c.operator)
                                        ? `${c.field} ${c.operator}`
                                        : `${c.field} ${c.operator} '${c.value}'`)
                                        .join(' AND ') })] })), _jsxs("div", { style: { display: 'flex', gap: '10px' }, children: [_jsx("button", { onClick: handleBack, style: {
                                        padding: '10px 20px',
                                        backgroundColor: '#6c757d',
                                        color: 'white',
                                        border: 'none',
                                        borderRadius: '4px',
                                        cursor: 'pointer',
                                    }, children: "\u2190 Back" }), _jsx("button", { onClick: handleWhereClauseComplete, style: {
                                        padding: '12px 24px',
                                        backgroundColor: '#28a745',
                                        color: 'white',
                                        border: 'none',
                                        borderRadius: '4px',
                                        cursor: 'pointer',
                                        fontWeight: 'bold',
                                    }, children: "Continue to Staging Tables \u2192" })] })] })), currentStep === 'select-staging' && (_jsxs("div", { children: [_jsx(StagingTableSelector, { sourceTableNames: sourceTables.map(t => t.tableName), onTablesSelected: handleStagingTablesSelected }), sourceTables.length > 0 && (_jsx("button", { onClick: handleBack, style: {
                                marginTop: '10px',
                                padding: '10px 20px',
                                backgroundColor: '#6c757d',
                                color: 'white',
                                border: 'none',
                                borderRadius: '4px',
                                cursor: 'pointer',
                            }, children: "\u2190 Back" }))] })), currentStep === 'map-columns' && (_jsxs("div", { children: [_jsx("h3", { children: "Step 3: Map Columns" }), _jsx("p", { style: { color: '#666' }, children: "Drag columns from source tables to staging tables." }), _jsx(StagingColumnMapper, { sourceTables: sourceTables, stagingTables: stagingTables, onMappingsChange: setMappings, initialMappings: mappings }), _jsxs("div", { style: { marginTop: '20px', display: 'flex', gap: '10px' }, children: [_jsx("button", { onClick: handleBack, style: {
                                        padding: '10px 20px',
                                        backgroundColor: '#6c757d',
                                        color: 'white',
                                        border: 'none',
                                        borderRadius: '4px',
                                        cursor: 'pointer',
                                    }, children: "\u2190 Back" }), _jsx("button", { onClick: handleMappingsComplete, disabled: mappings.length === 0, style: {
                                        padding: '12px 24px',
                                        backgroundColor: mappings.length > 0 ? '#28a745' : '#ccc',
                                        color: 'white',
                                        border: 'none',
                                        borderRadius: '4px',
                                        cursor: mappings.length > 0 ? 'pointer' : 'not-allowed',
                                        fontWeight: 'bold',
                                    }, children: "Continue to Relationships \u2192" })] })] })), currentStep === 'define-relationships' && (_jsxs("div", { children: [_jsx(StagingRelationshipEditor, { tables: stagingTables, relationships: relationships, onRelationshipsChange: setRelationships }), _jsxs("div", { style: { marginTop: '20px', display: 'flex', gap: '10px' }, children: [_jsx("button", { onClick: handleBack, style: {
                                        padding: '10px 20px',
                                        backgroundColor: '#6c757d',
                                        color: 'white',
                                        border: 'none',
                                        borderRadius: '4px',
                                        cursor: 'pointer',
                                    }, children: "\u2190 Back" }), _jsx("button", { onClick: handleRelationshipsComplete, style: {
                                        padding: '12px 24px',
                                        backgroundColor: '#28a745',
                                        color: 'white',
                                        border: 'none',
                                        borderRadius: '4px',
                                        cursor: 'pointer',
                                        fontWeight: 'bold',
                                    }, children: "Continue to Execute \u2192" })] })] })), currentStep === 'execute' && (_jsxs("div", { children: [_jsx("h3", { children: "Step 5: Execute Staging Process" }), _jsx("p", { style: { color: '#666' }, children: "Review and execute the staging copy process." }), _jsxs("div", { style: { marginBottom: '20px', padding: '15px', backgroundColor: '#f8f9fa', borderRadius: '4px' }, children: [_jsx("h4", { children: "Summary:" }), _jsxs("ul", { children: [_jsxs("li", { children: ["Source Tables: ", sourceTables.length] }), _jsxs("li", { children: ["Staging Tables: ", stagingTables.length] }), _jsxs("li", { children: ["New Tables to Create: ", stagingTables.filter(t => t.isNew).length] }), _jsxs("li", { children: ["Column Mappings: ", mappings.length] }), _jsxs("li", { children: ["Relationships: ", relationships.length] })] })] }), message && (_jsx("div", { style: {
                                padding: '15px',
                                marginBottom: '20px',
                                backgroundColor: message.includes('Error') ? '#f8d7da' : '#d4edda',
                                borderRadius: '4px',
                                whiteSpace: 'pre-line',
                            }, children: message })), _jsxs("div", { style: { display: 'flex', gap: '10px' }, children: [_jsx("button", { onClick: handleBack, disabled: isExecuting, style: {
                                        padding: '10px 20px',
                                        backgroundColor: '#6c757d',
                                        color: 'white',
                                        border: 'none',
                                        borderRadius: '4px',
                                        cursor: isExecuting ? 'not-allowed' : 'pointer',
                                    }, children: "\u2190 Back" }), _jsx("button", { onClick: handleExecute, disabled: isExecuting, style: {
                                        padding: '12px 24px',
                                        backgroundColor: isExecuting ? '#ccc' : '#dc3545',
                                        color: 'white',
                                        border: 'none',
                                        borderRadius: '4px',
                                        cursor: isExecuting ? 'not-allowed' : 'pointer',
                                        fontWeight: 'bold',
                                        fontSize: '16px',
                                    }, children: isExecuting ? '⏳ Executing...' : '🚀 Execute Staging Process' })] })] }))] }) }));
};
