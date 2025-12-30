import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
import { api } from '../../services/api';
import { FilterBuilder } from '../filters/FilterBuilder';
export const JsonAnalyzerComponent = ({ onAnalysisComplete }) => {
    const [baseTableName, setBaseTableName] = useState('platforms_cicd_data');
    const [sampleSize, setSampleSize] = useState(100);
    const [discoveredFields, setDiscoveredFields] = useState([]);
    const [whereConditions, setWhereConditions] = useState([]);
    const [error, setError] = useState(null);
    const [isDiscovering, setIsDiscovering] = useState(false);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [connectionStatus, setConnectionStatus] = useState('unknown');
    const handleTestConnection = async () => {
        try {
            const result = await api.testConnection();
            if (result.success) {
                setConnectionStatus('connected');
                setError(null);
            }
            else {
                setConnectionStatus('failed');
                setError('Database connection failed');
            }
        }
        catch (err) {
            setConnectionStatus('failed');
            setError(err.message);
        }
    };
    const handleDiscoverFields = async () => {
        if (!baseTableName) {
            setError('Please enter a table name');
            return;
        }
        setIsDiscovering(true);
        setError(null);
        try {
            const result = await api.discoverFields(baseTableName, 1000);
            if (result.success) {
                setDiscoveredFields(result.fields);
                setError(null);
            }
            else {
                setError(result.error);
            }
        }
        catch (err) {
            setError(err.message);
        }
        finally {
            setIsDiscovering(false);
        }
    };
    const handleAnalyze = async () => {
        setError(null);
        setIsAnalyzing(true);
        try {
            const result = await api.analyze({
                baseTableName,
                sampleSize,
                whereConditions,
            });
            if (result.success) {
                const analysis = {
                    ...result.analysis,
                    fields: result.analysis.fields.map((f) => ({
                        ...f,
                        types: new Set(f.types),
                    })),
                };
                onAnalysisComplete(analysis, {
                    totalRecordsInTable: result.totalRecordsInTable,
                    sampledRecords: result.sampledRecords,
                    baseTableName: result.baseTableName,
                    toProcessTable: result.toProcessTable,
                    appliedFilters: result.appliedFilters,
                });
            }
            else {
                setError(result.error);
            }
        }
        catch (err) {
            setError(err.message);
        }
        finally {
            setIsAnalyzing(false);
        }
    };
    return (_jsxs("div", { style: { padding: '20px' }, children: [_jsx("h2", { children: "JSON to SQL Flattener - Smart Analysis" }), _jsxs("div", { style: { marginBottom: '30px', padding: '15px', backgroundColor: '#f8f9fa', borderRadius: '4px' }, children: [_jsx("h3", { children: "Step 1: Test Database Connection" }), _jsx("button", { onClick: handleTestConnection, style: {
                            padding: '10px 20px',
                            backgroundColor: '#17a2b8',
                            color: 'white',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            marginRight: '10px',
                        }, children: "Test Connection" }), connectionStatus === 'connected' && (_jsx("span", { style: { color: '#28a745', fontWeight: 'bold' }, children: "\u2713 Connected" })), connectionStatus === 'failed' && (_jsx("span", { style: { color: '#dc3545', fontWeight: 'bold' }, children: "\u2717 Failed" }))] }), _jsxs("div", { style: { marginBottom: '30px', padding: '15px', backgroundColor: '#f8f9fa', borderRadius: '4px' }, children: [_jsx("h3", { children: "Step 2: Discover Fields" }), _jsxs("div", { style: { marginBottom: '15px' }, children: [_jsx("label", { style: { display: 'block', marginBottom: '8px', fontWeight: 'bold' }, children: "Destination Table Name:" }), _jsx("input", { type: "text", value: baseTableName, onChange: (e) => setBaseTableName(e.target.value), placeholder: "e.g., platforms_cicd_data", style: {
                                    padding: '8px',
                                    width: '300px',
                                    border: '1px solid #ccc',
                                    borderRadius: '4px',
                                    marginRight: '10px',
                                } }), _jsxs("small", { style: { color: '#666', display: 'block', marginTop: '5px' }, children: ["Will read from: ", _jsxs("strong", { children: [baseTableName, "_toprocess"] })] })] }), _jsx("button", { onClick: handleDiscoverFields, disabled: !baseTableName || isDiscovering, style: {
                            padding: '10px 20px',
                            backgroundColor: isDiscovering ? '#ccc' : '#007bff',
                            color: 'white',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: isDiscovering ? 'not-allowed' : 'pointer',
                            fontWeight: 'bold',
                        }, children: isDiscovering ? 'Discovering Fields...' : 'Discover All Fields & Values' }), discoveredFields.length > 0 && (_jsxs("div", { style: { marginTop: '15px', color: '#28a745', fontWeight: 'bold' }, children: ["\u2713 Discovered ", discoveredFields.length, " fields"] }))] }), discoveredFields.length > 0 && (_jsxs("div", { style: { marginBottom: '30px' }, children: [_jsx("h3", { children: "Step 3: Build WHERE Conditions (Optional)" }), _jsx(FilterBuilder, { fields: discoveredFields, baseTableName: baseTableName, onFiltersChange: setWhereConditions })] })), discoveredFields.length > 0 && (_jsxs("div", { style: { marginBottom: '30px', padding: '15px', backgroundColor: '#f8f9fa', borderRadius: '4px' }, children: [_jsx("h3", { children: "Step 4: Analyze & Generate Table Suggestions" }), _jsxs("div", { style: { marginBottom: '15px' }, children: [_jsx("label", { style: { display: 'block', marginBottom: '8px', fontWeight: 'bold' }, children: "Sample Size:" }), _jsx("input", { type: "number", value: sampleSize, onChange: (e) => setSampleSize(Number(e.target.value)), min: 1, max: 10000, style: {
                                    padding: '8px',
                                    width: '100px',
                                    border: '1px solid #ccc',
                                    borderRadius: '4px',
                                } }), _jsx("small", { style: { color: '#666', marginLeft: '10px' }, children: "Records to analyze for schema discovery" })] }), _jsx("button", { onClick: handleAnalyze, disabled: isAnalyzing, style: {
                            padding: '12px 24px',
                            backgroundColor: isAnalyzing ? '#ccc' : '#28a745',
                            color: 'white',
                            border: 'none',
                            borderRadius: '4px',
                            fontSize: '16px',
                            cursor: isAnalyzing ? 'not-allowed' : 'pointer',
                            fontWeight: 'bold',
                        }, children: isAnalyzing ? 'Analyzing...' : '🚀 Analyze & Suggest Tables' })] })), error && (_jsxs("div", { style: {
                    padding: '12px',
                    marginTop: '20px',
                    backgroundColor: '#f8d7da',
                    color: '#721c24',
                    border: '1px solid #f5c6cb',
                    borderRadius: '4px',
                }, children: [_jsx("strong", { children: "Error:" }), " ", error] }))] }));
};
