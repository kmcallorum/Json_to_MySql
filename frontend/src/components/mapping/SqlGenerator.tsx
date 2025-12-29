import React, { useState } from 'react';
import { TableDefinition, FieldMapping, TableRelationship } from '../../types';
import { api } from '../../services/api';

interface SqlGeneratorProps {
  tables: TableDefinition[];
  mappings: FieldMapping[];
  baseTableName: string;
  whereConditions?: any[];
  relationships?: TableRelationship[];
}

export const SqlGenerator: React.FC<SqlGeneratorProps> = ({
  tables,
  mappings,
  baseTableName,
  whereConditions = [],
  relationships = [],
}) => {
  const [isExecuting, setIsExecuting] = useState(false);
  const [executionResult, setExecutionResult] = useState<any>(null);

  const generateCreateTableSql = (table: TableDefinition): string => {
    if (!table.isNew) {
      return `-- Table '${table.name}' already exists`;
    }

    const columns = table.columns.map(col => {
      let sql = `  ${col.name} ${col.type}`;
      if (col.isPrimaryKey) {
        sql += ' PRIMARY KEY AUTO_INCREMENT';
      }
      if (!col.nullable && !col.isPrimaryKey) {
        sql += ' NOT NULL';
      }
      return sql;
    });

    if (!table.columns.some(c => c.name === 'elastic_id')) {
      columns.push('  elastic_id VARCHAR(255) NOT NULL');
      columns.push('  INDEX idx_elastic_id (elastic_id)');
    }

    return `CREATE TABLE IF NOT EXISTS \`${table.name}\` (\n${columns.join(',\n')}\n);`;
  };

  const generateAllSql = (): string => {
    const sqlStatements: string[] = [];

    sqlStatements.push('-- ========================================');
    sqlStatements.push('-- JSON to SQL Flattener - Generated DDL');
    sqlStatements.push(`-- Source: ${baseTableName}_toprocess`);
    sqlStatements.push(`-- Generated: ${new Date().toISOString()}`);
    sqlStatements.push('-- ========================================\n');

    sqlStatements.push('-- Table Definitions');
    sqlStatements.push('-- ========================================\n');
    
    tables.forEach(table => {
      sqlStatements.push(generateCreateTableSql(table));
      sqlStatements.push('');
    });

    if (relationships.length > 0) {
      sqlStatements.push('\n-- ========================================');
      sqlStatements.push('-- Table Relationships');
      sqlStatements.push('-- ========================================');
      relationships.forEach(rel => {
        sqlStatements.push(`-- ${rel.parentTable}.${rel.parentKeyColumn} → ${rel.childTable}.${rel.foreignKeyColumn}`);
      });
      sqlStatements.push('');
    }

    sqlStatements.push('\n-- ========================================');
    sqlStatements.push('-- Field Mappings Summary');
    sqlStatements.push('-- ========================================');
    sqlStatements.push(`-- Total fields mapped: ${mappings.length}`);
    sqlStatements.push(`-- Total tables: ${tables.length}`);
    sqlStatements.push(`-- Relationships: ${relationships.length}\n`);

    mappings.forEach(mapping => {
      sqlStatements.push(`-- ${mapping.sourcePath} → ${mapping.targetTable}.${mapping.targetColumn} (${mapping.dataType})`);
    });

    return sqlStatements.join('\n');
  };

  const downloadSql = () => {
    const sql = generateAllSql();
    const blob = new Blob([sql], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${baseTableName}_schema.sql`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const copySql = () => {
    const sql = generateAllSql();
    navigator.clipboard.writeText(sql);
    alert('SQL copied to clipboard!');
  };

  const handleExecute = async () => {
    const confirmMsg = relationships.length > 0
      ? `Execute flattening with ${relationships.length} relationship(s)?\n\nInsert order will be:\n${relationships.map(r => `${r.parentTable} → ${r.childTable}`).join('\n')}\n\nContinue?`
      : `Execute flattening process?\n\nThis will:\n1. Create new tables\n2. Flatten records from ${baseTableName}_toprocess\n3. Move processed records to ${baseTableName}\n\nContinue?`;

    if (!confirm(confirmMsg)) {
      return;
    }

    setIsExecuting(true);
    setExecutionResult(null);

    try {
      const result = await api.executeFlattening({
        baseTableName,
        tables,
        mappings,
        whereConditions,
        relationships, // Pass relationships!
        batchSize: 100,
      });

      setExecutionResult(result);

      if (result.success) {
        alert(`Success!\n\nRecords processed: ${result.recordsProcessed}\nRecords moved: ${result.recordsMoved}\nTables created: ${result.tablesCreated.join(', ') || 'none'}`);
      } else {
        alert(`Error: ${result.error}`);
      }
    } catch (error: any) {
      alert(`Execution failed: ${error.message}`);
    } finally {
      setIsExecuting(false);
    }
  };

  return (
    <div style={{ marginTop: '30px', padding: '20px', backgroundColor: '#f8f9fa', borderRadius: '8px' }}>
      <h3>Execute or Download SQL</h3>
      
      <div style={{ marginBottom: '15px', display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
        <button
          onClick={handleExecute}
          disabled={isExecuting}
          style={{
            padding: '12px 24px',
            backgroundColor: isExecuting ? '#ccc' : '#dc3545',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: isExecuting ? 'not-allowed' : 'pointer',
            fontWeight: 'bold',
            fontSize: '16px',
          }}
        >
          {isExecuting ? '⏳ Executing...' : '🚀 Execute Now (Create Tables + Flatten Data)'}
        </button>

        <button
          onClick={downloadSql}
          style={{
            padding: '10px 20px',
            backgroundColor: '#28a745',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            fontWeight: 'bold',
          }}
        >
          📥 Download SQL Script
        </button>

        <button
          onClick={copySql}
          style={{
            padding: '10px 20px',
            backgroundColor: '#17a2b8',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            fontWeight: 'bold',
          }}
        >
          📋 Copy to Clipboard
        </button>
      </div>

      {executionResult && executionResult.success && (
        <div style={{ 
          marginBottom: '20px', 
          padding: '15px', 
          backgroundColor: '#d4edda', 
          borderRadius: '4px',
          border: '1px solid #c3e6cb'
        }}>
          <h4 style={{ marginTop: 0, color: '#155724' }}>✓ Execution Successful!</h4>
          <ul style={{ marginBottom: 0 }}>
            <li>Records Processed: <strong>{executionResult.recordsProcessed}</strong></li>
            <li>Records Moved: <strong>{executionResult.recordsMoved}</strong></li>
            {executionResult.tablesCreated.length > 0 && (
              <li>Tables Created: <strong>{executionResult.tablesCreated.join(', ')}</strong></li>
            )}
          </ul>
        </div>
      )}

      <pre style={{
        backgroundColor: '#2d2d2d',
        color: '#f8f8f2',
        padding: '20px',
        borderRadius: '8px',
        maxHeight: '400px',
        overflowY: 'auto',
        fontSize: '13px',
        lineHeight: '1.5',
      }}>
        {generateAllSql()}
      </pre>

      <div style={{ marginTop: '15px', padding: '10px', backgroundColor: '#d1ecf1', borderRadius: '4px', border: '1px solid #bee5eb' }}>
        <strong>📊 Summary:</strong>
        <ul>
          <li>{tables.length} table(s) defined</li>
          <li>{tables.filter(t => t.isNew).length} new table(s) to create</li>
          <li>{mappings.length} field(s) mapped</li>
          <li>{relationships.length} relationship(s) defined</li>
        </ul>
      </div>
    </div>
  );
};
