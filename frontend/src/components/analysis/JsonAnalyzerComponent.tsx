import React, { useState } from 'react';
import { api } from '../../services/api';
import { SchemaAnalysis, FieldInfo, WhereCondition } from '../../types';
import { FilterBuilder } from '../filters/FilterBuilder';

interface JsonAnalyzerComponentProps {
  onAnalysisComplete: (analysis: SchemaAnalysis, metadata: any) => void;
}

export const JsonAnalyzerComponent: React.FC<JsonAnalyzerComponentProps> = ({ 
  onAnalysisComplete 
}) => {
  const [baseTableName, setBaseTableName] = useState('platforms_cicd_data');
  const [sampleSize, setSampleSize] = useState(100);
  const [discoveredFields, setDiscoveredFields] = useState<FieldInfo[]>([]);
  const [whereConditions, setWhereConditions] = useState<WhereCondition[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isDiscovering, setIsDiscovering] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'unknown' | 'connected' | 'failed'>('unknown');

  const handleTestConnection = async () => {
    try {
      const result = await api.testConnection();
      if (result.success) {
        setConnectionStatus('connected');
        setError(null);
      } else {
        setConnectionStatus('failed');
        setError('Database connection failed');
      }
    } catch (err: any) {
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
      } else {
        setError(result.error);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
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
          fields: result.analysis.fields.map((f: any) => ({
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
      } else {
        setError(result.error);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div style={{ padding: '20px' }}>
      <h2>JSON to SQL Flattener - Smart Analysis</h2>

      {/* Step 1: Connection */}
      <div style={{ marginBottom: '30px', padding: '15px', backgroundColor: '#f8f9fa', borderRadius: '4px' }}>
        <h3>Step 1: Test Database Connection</h3>
        <button
          onClick={handleTestConnection}
          style={{
            padding: '10px 20px',
            backgroundColor: '#17a2b8',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            marginRight: '10px',
          }}
        >
          Test Connection
        </button>
        {connectionStatus === 'connected' && (
          <span style={{ color: '#28a745', fontWeight: 'bold' }}>✓ Connected</span>
        )}
        {connectionStatus === 'failed' && (
          <span style={{ color: '#dc3545', fontWeight: 'bold' }}>✗ Failed</span>
        )}
      </div>

      {/* Step 2: Table Name & Discovery */}
      <div style={{ marginBottom: '30px', padding: '15px', backgroundColor: '#f8f9fa', borderRadius: '4px' }}>
        <h3>Step 2: Discover Fields</h3>
        <div style={{ marginBottom: '15px' }}>
          <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>
            Destination Table Name:
          </label>
          <input
            type="text"
            value={baseTableName}
            onChange={(e) => setBaseTableName(e.target.value)}
            placeholder="e.g., platforms_cicd_data"
            style={{
              padding: '8px',
              width: '300px',
              border: '1px solid #ccc',
              borderRadius: '4px',
              marginRight: '10px',
            }}
          />
          <small style={{ color: '#666', display: 'block', marginTop: '5px' }}>
            Will read from: <strong>{baseTableName}_toprocess</strong>
          </small>
        </div>
        <button
          onClick={handleDiscoverFields}
          disabled={!baseTableName || isDiscovering}
          style={{
            padding: '10px 20px',
            backgroundColor: isDiscovering ? '#ccc' : '#007bff',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: isDiscovering ? 'not-allowed' : 'pointer',
            fontWeight: 'bold',
          }}
        >
          {isDiscovering ? 'Discovering Fields...' : 'Discover All Fields & Values'}
        </button>
        
        {discoveredFields.length > 0 && (
          <div style={{ marginTop: '15px', color: '#28a745', fontWeight: 'bold' }}>
            ✓ Discovered {discoveredFields.length} fields
          </div>
        )}
      </div>

      {/* Step 3: Build Filters - PASS baseTableName HERE */}
      {discoveredFields.length > 0 && (
        <div style={{ marginBottom: '30px' }}>
          <h3>Step 3: Build WHERE Conditions (Optional)</h3>
          <FilterBuilder 
            fields={discoveredFields}
            baseTableName={baseTableName}
            onFiltersChange={setWhereConditions}
          />
        </div>
      )}

      {/* Step 4: Analyze */}
      {discoveredFields.length > 0 && (
        <div style={{ marginBottom: '30px', padding: '15px', backgroundColor: '#f8f9fa', borderRadius: '4px' }}>
          <h3>Step 4: Analyze & Generate Table Suggestions</h3>
          <div style={{ marginBottom: '15px' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>
              Sample Size:
            </label>
            <input
              type="number"
              value={sampleSize}
              onChange={(e) => setSampleSize(Number(e.target.value))}
              min={1}
              max={10000}
              style={{
                padding: '8px',
                width: '100px',
                border: '1px solid #ccc',
                borderRadius: '4px',
              }}
            />
            <small style={{ color: '#666', marginLeft: '10px' }}>
              Records to analyze for schema discovery
            </small>
          </div>

          <button
            onClick={handleAnalyze}
            disabled={isAnalyzing}
            style={{
              padding: '12px 24px',
              backgroundColor: isAnalyzing ? '#ccc' : '#28a745',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              fontSize: '16px',
              cursor: isAnalyzing ? 'not-allowed' : 'pointer',
              fontWeight: 'bold',
            }}
          >
            {isAnalyzing ? 'Analyzing...' : '🚀 Analyze & Suggest Tables'}
          </button>
        </div>
      )}

      {/* Error Display */}
      {error && (
        <div
          style={{
            padding: '12px',
            marginTop: '20px',
            backgroundColor: '#f8d7da',
            color: '#721c24',
            border: '1px solid #f5c6cb',
            borderRadius: '4px',
          }}
        >
          <strong>Error:</strong> {error}
        </div>
      )}
    </div>
  );
};
