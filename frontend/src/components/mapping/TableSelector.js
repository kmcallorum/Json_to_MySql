import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useState, useEffect } from 'react';
import { api } from '../../services/api';
export const TableSelector = ({ suggestedTables, fields, baseTableName, onTablesSelected, }) => {
    const [mode, setMode] = useState('suggested');
    const [existingTables, setExistingTables] = useState([]);
    const [selectedExisting, setSelectedExisting] = useState([]);
    const [customTables, setCustomTables] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [availableMappings, setAvailableMappings] = useState([]);
    const [showMappingPrompt, setShowMappingPrompt] = useState(false);
    useEffect(() => {
        if (mode === 'existing') {
            loadExistingTables();
        }
    }, [mode]);
    const loadExistingTables = async () => {
        setIsLoading(true);
        try {
            const result = await api.getTableList();
            if (result.success) {
                setExistingTables(result.tables);
            }
        }
        catch (error) {
            console.error('Failed to load tables:', error);
        }
        finally {
            setIsLoading(false);
        }
    };
    const checkForExistingMappings = async (tableNames) => {
        try {
            const result = await api.findMappingsByTables(tableNames, baseTableName);
            if (result.success && result.matches.length > 0) {
                setAvailableMappings(result.matches);
                setShowMappingPrompt(true);
                return true;
            }
        }
        catch (error) {
            console.error('Failed to check for mappings:', error);
        }
        return false;
    };
    const handleUseSuggested = () => {
        const uniqueTables = Array.from(new Set(suggestedTables));
        const tables = uniqueTables.map(tableName => ({
            name: tableName,
            columns: fields
                .filter(f => f.suggestedTable === tableName)
                .map(f => ({
                name: f.suggestedColumn,
                type: f.suggestedType,
                nullable: f.isNullable,
            })),
            isNew: true,
        }));
        onTablesSelected(tables);
    };
    const handleLoadExisting = async () => {
        if (selectedExisting.length === 0) {
            alert('Please select at least one table');
            return;
        }
        setIsLoading(true);
        try {
            // Check for existing mappings
            const hasMappings = await checkForExistingMappings(selectedExisting);
            if (!hasMappings) {
                // No mappings found, just load tables
                const result = await api.getTableStructures(selectedExisting);
                if (result.success) {
                    onTablesSelected(result.tables.map((t) => ({ ...t, isNew: false })));
                }
            }
        }
        catch (error) {
            console.error('Failed to load table structures:', error);
        }
        finally {
            setIsLoading(false);
        }
    };
    const handleLoadWithMapping = async (mappingName) => {
        setIsLoading(true);
        try {
            const result = await api.loadMappingConfig(mappingName);
            if (result.success) {
                const config = result.config;
                onTablesSelected(config.tables, config);
                setShowMappingPrompt(false);
            }
            else {
                alert(`Failed to load mapping: ${result.error}`);
            }
        }
        catch (error) {
            alert(`Error: ${error.message}`);
        }
        finally {
            setIsLoading(false);
        }
    };
    const handleSkipMapping = async () => {
        setShowMappingPrompt(false);
        setIsLoading(true);
        try {
            const result = await api.getTableStructures(selectedExisting);
            if (result.success) {
                onTablesSelected(result.tables.map((t) => ({ ...t, isNew: false })));
            }
        }
        catch (error) {
            console.error('Failed to load table structures:', error);
        }
        finally {
            setIsLoading(false);
        }
    };
    const addCustomTable = () => {
        const tableName = prompt('Enter table name:');
        if (!tableName)
            return;
        const newTable = {
            name: tableName,
            columns: [
                { name: 'id', type: 'BIGINT', nullable: false, isPrimaryKey: true },
            ],
            isNew: true,
        };
        setCustomTables([...customTables, newTable]);
    };
    const addColumnToCustomTable = (tableIndex) => {
        const columnName = prompt('Enter column name:');
        if (!columnName)
            return;
        const dataType = prompt('Enter data type (e.g., VARCHAR(255), INT):', 'VARCHAR(255)');
        if (!dataType)
            return;
        const updated = [...customTables];
        updated[tableIndex].columns.push({
            name: columnName,
            type: dataType,
            nullable: true,
        });
        setCustomTables(updated);
    };
    const handleUseCustom = () => {
        if (customTables.length === 0) {
            alert('Please create at least one table');
            return;
        }
        onTablesSelected(customTables);
    };
    return (_jsxs("div", { style: { padding: '20px', backgroundColor: '#f8f9fa', borderRadius: '8px' }, children: [_jsx("h3", { children: "Choose Table Setup" }), _jsxs("div", { style: { marginBottom: '20px', display: 'flex', gap: '10px' }, children: [_jsx("button", { onClick: () => setMode('suggested'), style: {
                            padding: '10px 20px',
                            backgroundColor: mode === 'suggested' ? '#007bff' : '#6c757d',
                            color: 'white',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: 'pointer',
                        }, children: "Use Suggested Tables" }), _jsx("button", { onClick: () => setMode('existing'), style: {
                            padding: '10px 20px',
                            backgroundColor: mode === 'existing' ? '#007bff' : '#6c757d',
                            color: 'white',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: 'pointer',
                        }, children: "Load Existing Tables" }), _jsx("button", { onClick: () => setMode('custom'), style: {
                            padding: '10px 20px',
                            backgroundColor: mode === 'custom' ? '#007bff' : '#6c757d',
                            color: 'white',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: 'pointer',
                        }, children: "Create Custom Tables" })] }), showMappingPrompt && (_jsx("div", { style: {
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                    backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex',
                    alignItems: 'center', justifyContent: 'center', zIndex: 1000,
                }, children: _jsxs("div", { style: {
                        backgroundColor: 'white', padding: '30px', borderRadius: '8px',
                        maxWidth: '600px', width: '90%',
                    }, children: [_jsx("h3", { children: "\uD83C\uDF89 Found Existing Mappings!" }), _jsxs("p", { children: ["We found ", availableMappings.length, " saved mapping(s) for these tables. Would you like to load one?"] }), _jsx("div", { style: { marginBottom: '20px', maxHeight: '300px', overflowY: 'auto' }, children: availableMappings.map(mapping => (_jsxs("div", { style: {
                                    padding: '15px', marginBottom: '10px', border: '1px solid #ddd',
                                    borderRadius: '4px', backgroundColor: '#f8f9fa',
                                }, children: [_jsx("div", { style: { fontWeight: 'bold', fontSize: '16px', marginBottom: '5px' }, children: mapping.name }), mapping.description && (_jsx("div", { style: { fontSize: '14px', color: '#666', marginBottom: '5px' }, children: mapping.description })), _jsxs("div", { style: { fontSize: '12px', color: '#666' }, children: ["Updated: ", new Date(mapping.updatedAt).toLocaleString()] }), _jsx("button", { onClick: () => handleLoadWithMapping(mapping.name), disabled: isLoading, style: {
                                            marginTop: '10px', padding: '8px 16px', backgroundColor: '#28a745',
                                            color: 'white', border: 'none', borderRadius: '4px',
                                            cursor: 'pointer', fontWeight: 'bold',
                                        }, children: "Load This Mapping" })] }, mapping.id))) }), _jsx("div", { style: { display: 'flex', gap: '10px', justifyContent: 'flex-end' }, children: _jsx("button", { onClick: handleSkipMapping, disabled: isLoading, style: {
                                    padding: '10px 20px', backgroundColor: '#6c757d', color: 'white',
                                    border: 'none', borderRadius: '4px', cursor: 'pointer',
                                }, children: "Skip - Map Manually" }) })] }) })), mode === 'suggested' && (_jsxs("div", { children: [_jsxs("p", { children: ["The analyzer has suggested ", _jsx("strong", { children: Array.from(new Set(suggestedTables)).length }), " tables based on your JSON structure."] }), _jsx("ul", { children: Array.from(new Set(suggestedTables)).map(table => (_jsxs("li", { children: [_jsx("strong", { children: table }), " (", fields.filter(f => f.suggestedTable === table).length, " fields)"] }, table))) }), _jsx("button", { onClick: handleUseSuggested, style: {
                            padding: '12px 24px',
                            backgroundColor: '#28a745',
                            color: 'white',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            fontWeight: 'bold',
                        }, children: "Use These Suggested Tables" })] })), mode === 'existing' && (_jsx("div", { children: isLoading ? (_jsx("p", { children: "Loading tables..." })) : (_jsxs(_Fragment, { children: [_jsx("p", { children: "Select existing tables to map fields to:" }), _jsx("div", { style: { maxHeight: '300px', overflowY: 'auto', border: '1px solid #ccc', padding: '10px', backgroundColor: 'white' }, children: existingTables.map(table => (_jsxs("label", { style: { display: 'block', marginBottom: '5px' }, children: [_jsx("input", { type: "checkbox", checked: selectedExisting.includes(table), onChange: (e) => {
                                            if (e.target.checked) {
                                                setSelectedExisting([...selectedExisting, table]);
                                            }
                                            else {
                                                setSelectedExisting(selectedExisting.filter(t => t !== table));
                                            }
                                        }, style: { marginRight: '8px' } }), table] }, table))) }), _jsxs("button", { onClick: handleLoadExisting, disabled: selectedExisting.length === 0, style: {
                                marginTop: '10px',
                                padding: '12px 24px',
                                backgroundColor: selectedExisting.length > 0 ? '#28a745' : '#ccc',
                                color: 'white',
                                border: 'none',
                                borderRadius: '4px',
                                cursor: selectedExisting.length > 0 ? 'pointer' : 'not-allowed',
                                fontWeight: 'bold',
                            }, children: ["Load Selected Tables (", selectedExisting.length, ")"] })] })) })), mode === 'custom' && (_jsxs("div", { children: [_jsx("button", { onClick: addCustomTable, style: {
                            marginBottom: '15px',
                            padding: '10px 20px',
                            backgroundColor: '#17a2b8',
                            color: 'white',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: 'pointer',
                        }, children: "+ Create New Table" }), customTables.map((table, tableIndex) => (_jsxs("div", { style: { marginBottom: '15px', padding: '10px', border: '1px solid #ddd', backgroundColor: 'white', borderRadius: '4px' }, children: [_jsx("h4", { children: table.name }), _jsx("ul", { children: table.columns.map((col, colIndex) => (_jsxs("li", { children: [_jsx("strong", { children: col.name }), ": ", col.type, " ", col.isPrimaryKey && '(PK)'] }, colIndex))) }), _jsx("button", { onClick: () => addColumnToCustomTable(tableIndex), style: {
                                    padding: '6px 12px',
                                    backgroundColor: '#6c757d',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '4px',
                                    cursor: 'pointer',
                                    fontSize: '12px',
                                }, children: "+ Add Column" })] }, tableIndex))), customTables.length > 0 && (_jsx("button", { onClick: handleUseCustom, style: {
                            padding: '12px 24px',
                            backgroundColor: '#28a745',
                            color: 'white',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            fontWeight: 'bold',
                        }, children: "Use These Custom Tables" }))] }))] }));
};
