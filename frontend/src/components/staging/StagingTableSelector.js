import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useEffect } from 'react';
import { api } from '../../services/api';
export const StagingTableSelector = ({ sourceTableNames, onTablesSelected, }) => {
    const [availableTables, setAvailableTables] = useState([]);
    const [selectedTables, setSelectedTables] = useState([]);
    const [newTableName, setNewTableName] = useState('');
    const [isLoadingTables, setIsLoadingTables] = useState(true);
    useEffect(() => {
        loadAvailableTables();
    }, []);
    const loadAvailableTables = async () => {
        setIsLoadingTables(true);
        try {
            const result = await api.getTableList();
            if (result.success) {
                setAvailableTables(result.tables);
                // After loading available tables, auto-suggest
                await autoSuggestTables(result.tables);
            }
        }
        catch (error) {
            console.error('Error loading tables:', error);
        }
        finally {
            setIsLoadingTables(false);
        }
    };
    const autoSuggestTables = async (existingTables) => {
        // Auto-suggest staging tables based on source tables
        const suggested = [];
        for (const sourceName of sourceTableNames) {
            const stagingName = `staging_${sourceName}`;
            // Check if this staging table already exists
            if (existingTables.includes(stagingName)) {
                // Load the existing table structure
                try {
                    const result = await api.getTableStructures([stagingName]);
                    if (result.success && result.tables.length > 0) {
                        suggested.push({ ...result.tables[0], isNew: false });
                    }
                }
                catch (error) {
                    console.error(`Error loading ${stagingName}:`, error);
                }
            }
            else {
                // Create a new table suggestion
                suggested.push({
                    name: stagingName,
                    isNew: true,
                    columns: [
                        { name: 'id', type: 'INT', isPrimaryKey: true, nullable: false },
                    ],
                });
            }
        }
        setSelectedTables(suggested);
    };
    const handleSelectExisting = async (tableName) => {
        // Load table structure
        const result = await api.getTableStructures([tableName]);
        if (result.success && result.tables.length > 0) {
            const table = result.tables[0];
            setSelectedTables(prev => [...prev, { ...table, isNew: false }]);
        }
    };
    const handleCreateNew = () => {
        if (!newTableName.trim()) {
            alert('Please enter a table name');
            return;
        }
        setSelectedTables(prev => [
            ...prev,
            {
                name: newTableName.trim(),
                isNew: true,
                columns: [
                    { name: 'id', type: 'INT', isPrimaryKey: true, nullable: false },
                ],
            },
        ]);
        setNewTableName('');
    };
    const handleRemoveTable = (tableName) => {
        setSelectedTables(prev => prev.filter(t => t.name !== tableName));
    };
    const handleAddColumn = (tableName) => {
        const colName = prompt('Column name:');
        const colType = prompt('Column type (e.g., VARCHAR(255), INT):', 'VARCHAR(255)');
        if (colName && colType) {
            setSelectedTables(prev => prev.map(t => t.name === tableName
                ? {
                    ...t,
                    columns: [
                        ...t.columns,
                        { name: colName, type: colType, isPrimaryKey: false, nullable: true },
                    ],
                }
                : t));
        }
    };
    const handleContinue = () => {
        if (selectedTables.length === 0) {
            alert('Please select or create at least one staging table');
            return;
        }
        onTablesSelected(selectedTables);
    };
    return (_jsxs("div", { style: { padding: '20px' }, children: [_jsx("h3", { children: "Select or Create Staging Tables" }), _jsx("p", { style: { color: '#666' }, children: "Choose existing staging tables or create new ones to receive your data." }), _jsxs("div", { style: { marginBottom: '20px', padding: '15px', backgroundColor: '#d4edda', borderRadius: '4px' }, children: [_jsx("h4", { style: { marginTop: 0 }, children: "Auto-Suggested Tables" }), _jsx("div", { style: { display: 'grid', gap: '10px' }, children: selectedTables
                            .filter(t => t.isNew)
                            .map(table => (_jsxs("div", { style: {
                                padding: '10px',
                                backgroundColor: 'white',
                                borderRadius: '4px',
                                border: '1px solid #c3e6cb',
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                            }, children: [_jsxs("div", { children: [_jsx("strong", { children: table.name }), _jsx("span", { style: { marginLeft: '10px', color: '#666', fontSize: '14px' }, children: "(New table - will be created)" })] }), _jsxs("div", { style: { display: 'flex', gap: '5px' }, children: [_jsx("button", { onClick: () => handleAddColumn(table.name), style: {
                                                padding: '5px 10px',
                                                backgroundColor: '#007bff',
                                                color: 'white',
                                                border: 'none',
                                                borderRadius: '3px',
                                                cursor: 'pointer',
                                                fontSize: '12px',
                                            }, children: "+ Add Column" }), _jsx("button", { onClick: () => handleRemoveTable(table.name), style: {
                                                padding: '5px 10px',
                                                backgroundColor: '#dc3545',
                                                color: 'white',
                                                border: 'none',
                                                borderRadius: '3px',
                                                cursor: 'pointer',
                                                fontSize: '12px',
                                            }, children: "Remove" })] })] }, table.name))) })] }), _jsxs("div", { style: { marginBottom: '20px' }, children: [_jsx("h4", { children: "Or Select Existing Table" }), _jsxs("select", { onChange: e => {
                            if (e.target.value) {
                                handleSelectExisting(e.target.value);
                                e.target.value = '';
                            }
                        }, style: {
                            padding: '8px',
                            border: '1px solid #ccc',
                            borderRadius: '4px',
                            width: '300px',
                        }, children: [_jsx("option", { value: "", children: "-- Select existing table --" }), availableTables
                                .filter(t => !selectedTables.some(st => st.name === t))
                                .map(table => (_jsx("option", { value: table, children: table }, table)))] })] }), _jsxs("div", { style: { marginBottom: '20px' }, children: [_jsx("h4", { children: "Or Create New Table" }), _jsxs("div", { style: { display: 'flex', gap: '10px' }, children: [_jsx("input", { type: "text", value: newTableName, onChange: e => setNewTableName(e.target.value), placeholder: "staging_table_name", style: {
                                    padding: '8px',
                                    border: '1px solid #ccc',
                                    borderRadius: '4px',
                                    width: '300px',
                                } }), _jsx("button", { onClick: handleCreateNew, style: {
                                    padding: '8px 16px',
                                    backgroundColor: '#28a745',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '4px',
                                    cursor: 'pointer',
                                    fontWeight: 'bold',
                                }, children: "+ Create Table" })] })] }), selectedTables.filter(t => !t.isNew).length > 0 && (_jsxs("div", { style: { marginBottom: '20px' }, children: [_jsx("h4", { children: "Selected Existing Tables" }), _jsx("div", { style: { display: 'grid', gap: '10px' }, children: selectedTables
                            .filter(t => !t.isNew)
                            .map(table => (_jsxs("div", { style: {
                                padding: '10px',
                                backgroundColor: '#f8f9fa',
                                borderRadius: '4px',
                                border: '1px solid #dee2e6',
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                            }, children: [_jsxs("div", { children: [_jsx("strong", { children: table.name }), _jsxs("span", { style: { marginLeft: '10px', color: '#666', fontSize: '14px' }, children: [table.columns?.length || 0, " columns"] })] }), _jsx("button", { onClick: () => handleRemoveTable(table.name), style: {
                                        padding: '5px 10px',
                                        backgroundColor: '#dc3545',
                                        color: 'white',
                                        border: 'none',
                                        borderRadius: '3px',
                                        cursor: 'pointer',
                                        fontSize: '12px',
                                    }, children: "Remove" })] }, table.name))) })] })), _jsx("button", { onClick: handleContinue, disabled: selectedTables.length === 0, style: {
                    padding: '12px 24px',
                    backgroundColor: selectedTables.length > 0 ? '#28a745' : '#ccc',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: selectedTables.length > 0 ? 'pointer' : 'not-allowed',
                    fontWeight: 'bold',
                    fontSize: '16px',
                }, children: "Continue to Column Mapping \u2192" })] }));
};
