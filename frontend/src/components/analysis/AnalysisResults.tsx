import React from 'react';
import { SchemaAnalysis } from '../../types';

interface AnalysisResultsProps {
  analysis: SchemaAnalysis;
  metadata?: any;
}

export const AnalysisResults: React.FC<AnalysisResultsProps> = ({ analysis, metadata }) => {
  return (
    <div style={{ padding: '20px' }}>
      <h2>Discovered Schema</h2>
      
      {metadata && (
        <div style={{ 
          marginBottom: '20px', 
          padding: '15px', 
          backgroundColor: '#d1ecf1',
          borderRadius: '4px',
          border: '1px solid #bee5eb'
        }}>
          <h3 style={{ marginTop: 0 }}>Source Information</h3>
          <p><strong>Source Table:</strong> {metadata.toProcessTable}</p>
          <p><strong>Destination Table:</strong> {metadata.baseTableName}</p>
          <p><strong>Event Type Filter:</strong> {metadata.eventType}</p>
          <p><strong>Total Records in Table:</strong> {metadata.totalRecordsInTable.toLocaleString()}</p>
          <p><strong>Analyzed Sample:</strong> {metadata.sampledRecords} records</p>
        </div>
      )}
      
      <div style={{ marginBottom: '20px', color: '#666' }}>
        <p>Found {analysis.fields.length} unique field(s)</p>
      </div>

      <div style={{ overflowX: 'auto' }}>
        <table style={{
          width: '100%',
          borderCollapse: 'collapse',
          border: '1px solid #ddd',
        }}>
          <thead>
            <tr style={{ backgroundColor: '#f8f9fa' }}>
              <th style={tableHeaderStyle}>Field Path</th>
              <th style={tableHeaderStyle}>Type</th>
              <th style={tableHeaderStyle}>Array?</th>
              <th style={tableHeaderStyle}>Nullable?</th>
              <th style={tableHeaderStyle}>Samples</th>
              <th style={tableHeaderStyle}>Suggested Table</th>
              <th style={tableHeaderStyle}>Suggested Column</th>
              <th style={tableHeaderStyle}>SQL Type</th>
            </tr>
          </thead>
          <tbody>
            {analysis.fields.map((field, index) => (
              <tr key={field.path} style={{ 
                backgroundColor: index % 2 === 0 ? 'white' : '#f8f9fa' 
              }}>
                <td style={tableCellStyle}>
                  <code>{field.path}</code>
                </td>
                <td style={tableCellStyle}>
                  {Array.from(field.types).join(', ')}
                </td>
                <td style={tableCellStyle}>
                  {field.isArray ? '✓' : ''}
                </td>
                <td style={tableCellStyle}>
                  {field.isNullable ? '✓' : ''}
                </td>
                <td style={tableCellStyle}>
                  <div style={{ maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {field.samples.map((s, i) => (
                      <span key={i} style={{
                        display: 'inline-block',
                        padding: '2px 6px',
                        margin: '2px',
                        backgroundColor: '#e9ecef',
                        borderRadius: '3px',
                        fontSize: '12px',
                      }}>
                        {JSON.stringify(s)}
                      </span>
                    ))}
                  </div>
                </td>
                <td style={tableCellStyle}>
                  <strong>{field.suggestedTable}</strong>
                </td>
                <td style={tableCellStyle}>
                  {field.suggestedColumn}
                </td>
                <td style={tableCellStyle}>
                  <code>{field.suggestedType}</code>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

const tableHeaderStyle: React.CSSProperties = {
  padding: '12px',
  textAlign: 'left',
  borderBottom: '2px solid #dee2e6',
  fontWeight: 'bold',
};

const tableCellStyle: React.CSSProperties = {
  padding: '12px',
  borderBottom: '1px solid #dee2e6',
};
