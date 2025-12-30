import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useEffect } from 'react';
import { api } from '../../services/api';
export const StagingWorkflow = ({ sourceTables, onClose, }) => {
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [sourceAnalysis, setSourceAnalysis] = useState([]);
    const [stagingTables, setStagingTables] = useState([]);
    const [mappings, setMappings] = useState([]);
    const [isExecuting, setIsExecuting] = useState(false);
    const [message, setMessage] = useState('');
    useEffect(() => {
        analyzeSourceTables();
    }, []);
    const analyzeSourceTables = async () => {
        setIsAnalyzing(true);
        try {
            const tableNames = sourceTables.map(t => t.name);
            const result = await api.analyzeTables(tableNames);
            if (result.success) {
                setSourceAnalysis(result.tables);
                // Auto-suggest staging tables
                autoSuggestStagingTables(result.tables);
            }
            else {
                setMessage(`Error: ${result.error}`);
            }
        }
        catch (error) {
            setMessage(`Error: ${error.message}`);
        }
        finally {
            setIsAnalyzing(false);
        }
    };
    const autoSuggestStagingTables = (tables) => {
        const suggested = tables.map(table => ({
            name: `staging_${table.tableName}`,
            isNew: true,
            columns: table.columns.map((col) => ({
                ...col,
                name: col.name,
                type: col.type,
            })),
        }));
        setStagingTables(suggested);
        // Auto-create mappings (1-to-1 column mapping)
        const autoMappings = [];
        tables.forEach(table => {
            table.columns.forEach((col) => {
                autoMappings.push({
                    sourceTable: table.tableName,
                    sourceColumn: col.name,
                    targetTable: `staging_${table.tableName}`,
                    targetColumn: col.name,
                });
            });
        });
        setMappings(autoMappings);
    };
    const handleExecute = async () => {
        if (!confirm(`Create staging tables and copy data?\n\n${stagingTables.length} tables will be created.\n${mappings.length} columns will be mapped.`)) {
            return;
        }
        setIsExecuting(true);
        setMessage('');
        try {
            // Step 1: Create staging tables
            const createResult = await api.createStagingTables(stagingTables);
            if (!createResult.success) {
                setMessage(`Error creating tables: ${createResult.error}`);
                return;
            }
            setMessage(`✓ Created ${createResult.tablesCreated.length} staging tables`);
            // Step 2: Execute staging copy
            const sourceTableNames = sourceTables.map(t => t.name);
            const copyResult = await api.executeStagingCopy({
                mappings,
                relationships: [], // You can enhance this later
                sourceTables: sourceTableNames,
                batchSize: 100,
            });
            if (copyResult.success) {
                setMessage(`✓ Success! Copied ${copyResult.processed} records to staging tables.`);
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
                maxWidth: '900px',
                width: '90%',
                maxHeight: '80vh',
                overflowY: 'auto',
            }, children: [_jsx("h2", { children: "Stage Data to Staging Tables" }), _jsx("p", { style: { color: '#666' }, children: "Copy data from your flattened tables to staging tables for DEV/STAGE/PROD deployment." }), isAnalyzing && (_jsx("div", { style: { padding: '20px', textAlign: 'center' }, children: _jsx("p", { children: "Analyzing source tables..." }) })), !isAnalyzing && sourceAnalysis.length > 0 && (_jsxs("div", { children: [_jsxs("div", { style: { marginBottom: '20px' }, children: [_jsxs("h3", { children: ["Source Tables (", sourceAnalysis.length, ")"] }), _jsx("div", { style: { display: 'grid', gap: '10px' }, children: sourceAnalysis.map(table => (_jsxs("div", { style: {
                                            padding: '10px',
                                            backgroundColor: '#f8f9fa',
                                            borderRadius: '4px',
                                            border: '1px solid #dee2e6',
                                        }, children: [_jsx("strong", { children: table.tableName }), _jsxs("span", { style: { marginLeft: '10px', color: '#666', fontSize: '14px' }, children: [table.columns.length, " columns \u2022 ", table.rowCount, " rows"] })] }, table.tableName))) })] }), _jsxs("div", { style: { marginBottom: '20px' }, children: [_jsx("h3", { children: "Staging Tables (Auto-Generated)" }), _jsx("div", { style: { display: 'grid', gap: '10px' }, children: stagingTables.map(table => (_jsxs("div", { style: {
                                            padding: '10px',
                                            backgroundColor: '#d4edda',
                                            borderRadius: '4px',
                                            border: '1px solid #c3e6cb',
                                        }, children: [_jsx("strong", { children: table.name }), _jsxs("span", { style: { marginLeft: '10px', color: '#666', fontSize: '14px' }, children: [table.columns.length, " columns"] })] }, table.name))) }), _jsx("p", { style: { marginTop: '10px', fontSize: '14px', color: '#666' }, children: "Columns will be mapped 1-to-1 from source to staging tables." })] }), message && (_jsx("div", { style: {
                                padding: '15px',
                                marginBottom: '20px',
                                backgroundColor: message.includes('Error') ? '#f8d7da' : '#d4edda',
                                borderRadius: '4px',
                                whiteSpace: 'pre-line',
                            }, children: message })), _jsxs("div", { style: { display: 'flex', gap: '10px', justifyContent: 'flex-end' }, children: [_jsx("button", { onClick: onClose, disabled: isExecuting, style: {
                                        padding: '10px 20px',
                                        backgroundColor: '#6c757d',
                                        color: 'white',
                                        border: 'none',
                                        borderRadius: '4px',
                                        cursor: isExecuting ? 'not-allowed' : 'pointer',
                                    }, children: "Close" }), _jsx("button", { onClick: handleExecute, disabled: isExecuting, style: {
                                        padding: '12px 24px',
                                        backgroundColor: isExecuting ? '#ccc' : '#28a745',
                                        color: 'white',
                                        border: 'none',
                                        borderRadius: '4px',
                                        cursor: isExecuting ? 'not-allowed' : 'pointer',
                                        fontWeight: 'bold',
                                    }, children: isExecuting ? '⏳ Processing...' : '🚀 Execute Staging' })] })] }))] }) }));
};
