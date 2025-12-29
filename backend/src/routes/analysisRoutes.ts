import express from 'express';
import { DatabaseConnection } from '../database/connection.js';

const router = express.Router();

// Test database connection
router.post('/test-connection', async (req, res) => {
  try {
    // Use credentials from request OR fall back to .env
    const host = req.body.host || process.env.DB_HOST || 'localhost';
    const port = req.body.port || parseInt(process.env.DB_PORT || '3306');
    const user = req.body.user || process.env.DB_USER || 'root';
    const password = req.body.password || process.env.DB_PASSWORD || '';
    const database = req.body.database || process.env.DB_NAME || 'test_json';

    // Create a test connection
    const db = new DatabaseConnection({
      host,
      port,
      user,
      password,
      database
    });

    // Try a simple query
    await db.rawQuery('SELECT 1');

    // Close the connection
    await db.close();

    res.json({ 
      success: true,
      message: 'Connection successful!' 
    });

  } catch (error: any) {
    console.error('Database connection test failed:', error);
    res.json({ 
      success: false,
      error: error.message || 'Connection failed'
    });
  }
});

// Discover fields from JSON content with metadata
router.post('/discover-fields', async (req, res) => {
  try {
    // Accept both tableName and baseTableName for compatibility
    const tableName = req.body.tableName || req.body.baseTableName;
    const sampleSize = req.body.sampleSize || 1000;

    if (!tableName) {
      return res.status(400).json({ error: 'tableName or baseTableName is required' });
    }

    const db = new DatabaseConnection({
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '3306'),
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || 'root',
      database: process.env.DB_NAME || 'test_json'
    });

    // Get sample records
    const sql = `SELECT content FROM ${tableName} LIMIT ${sampleSize}`;
    const records = await db.rawQuery<any>(sql);

    // Extract field metadata
    const fieldMap = new Map<string, any>();

    for (const record of records) {
      const content = typeof record.content === 'string'
        ? JSON.parse(record.content)
        : record.content;

      extractFieldMetadata(content, '', fieldMap);
    }

    // Convert to array with metadata
    const fields = Array.from(fieldMap.entries()).map(([path, metadata]) => ({
      path,
      uniqueValues: Array.from(metadata.values).slice(0, 100), // Limit to first 100 unique values
      nullCount: metadata.nullCount,
      totalCount: metadata.totalCount
    })).sort((a, b) => a.path.localeCompare(b.path));

    await db.close();

    res.json({
      success: true,
      tableName,
      sampleSize: records.length,
      fields
    });

  } catch (error: any) {
    console.error('Error discovering fields:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Helper function to recursively extract field metadata
function extractFieldMetadata(obj: any, prefix: string, fieldMap: Map<string, any>) {
  if (obj === null || obj === undefined) {
    return;
  }

  if (Array.isArray(obj)) {
    // For arrays, explore the first element
    if (obj.length > 0) {
      extractFieldMetadata(obj[0], prefix, fieldMap);
    }
    return;
  }

  if (typeof obj === 'object') {
    for (const key in obj) {
      const path = prefix ? `${prefix}.${key}` : key;
      const value = obj[key];

      // Initialize field metadata if not exists
      if (!fieldMap.has(path)) {
        fieldMap.set(path, {
          values: new Set(),
          nullCount: 0,
          totalCount: 0
        });
      }

      const metadata = fieldMap.get(path);
      metadata.totalCount++;

      if (value === null || value === undefined) {
        metadata.nullCount++;
      } else {
        // Store unique values (limit to prevent memory issues)
        if (metadata.values.size < 100) {
          // Only store primitive values
          if (typeof value !== 'object' || Array.isArray(value)) {
            const valueStr = Array.isArray(value) ? JSON.stringify(value) : value;
            metadata.values.add(valueStr);
          }
        }
      }

      // Recursively explore nested objects
      if (typeof value === 'object' && !Array.isArray(value)) {
        extractFieldMetadata(value, path, fieldMap);
      } else if (Array.isArray(value) && value.length > 0) {
        extractFieldMetadata(value[0], path, fieldMap);
      }
    }
  }
}

// Helper function to recursively extract field paths (kept for backwards compatibility)
function extractPaths(obj: any, prefix: string, paths: Set<string>) {
  if (obj === null || obj === undefined) {
    return;
  }

  if (Array.isArray(obj)) {
    // For arrays, explore the first element
    if (obj.length > 0) {
      extractPaths(obj[0], prefix, paths);
    }
    return;
  }

  if (typeof obj === 'object') {
    for (const key in obj) {
      const path = prefix ? `${prefix}.${key}` : key;
      paths.add(path);

      // Recursively explore nested objects
      extractPaths(obj[key], path, paths);
    }
  }
}

// Analyze JSON structure and suggest table mappings
router.post('/analyze', async (req, res) => {
  try {
    const { baseTableName, sampleSize = 100, whereConditions = [] } = req.body;

    if (!baseTableName) {
      return res.status(400).json({
        success: false,
        error: 'baseTableName is required'
      });
    }

    const db = new DatabaseConnection({
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '3306'),
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || 'root',
      database: process.env.DB_NAME || 'test_json'
    });

    // Build WHERE clause from conditions
    let whereClause = '';
    const queryParams: any[] = [];

    if (whereConditions.length > 0) {
      const clauses = whereConditions.map((condition: any) => {
        const { field, operator, value } = condition;

        if (operator === 'IS NULL' || operator === 'IS NOT NULL') {
          return `JSON_EXTRACT(content, '$.${field}') ${operator}`;
        } else if (operator === '=') {
          queryParams.push(`$.${field}`, value);
          return `JSON_UNQUOTE(JSON_EXTRACT(content, ?)) = ?`;
        } else if (operator === '!=') {
          queryParams.push(`$.${field}`, value);
          return `JSON_UNQUOTE(JSON_EXTRACT(content, ?)) != ?`;
        } else if (operator === 'LIKE') {
          queryParams.push(`$.${field}`, `%${value}%`);
          return `JSON_UNQUOTE(JSON_EXTRACT(content, ?)) LIKE ?`;
        } else if (operator === 'IN' && Array.isArray(value)) {
          const placeholders = value.map(() => '?').join(', ');
          queryParams.push(`$.${field}`, ...value);
          return `JSON_UNQUOTE(JSON_EXTRACT(content, ?)) IN (${placeholders})`;
        }
        return null;
      }).filter(Boolean);

      if (clauses.length > 0) {
        whereClause = 'WHERE ' + clauses.join(' AND ');
      }
    }

    // Get total count
    const countSql = `SELECT COUNT(*) as total FROM ${baseTableName} ${whereClause}`;
    const countResult = await db.query<any>(countSql, queryParams);
    const totalRecordsInTable = countResult[0]?.total || 0;

    // Get sample records
    const sampleSql = `SELECT content FROM ${baseTableName} ${whereClause} LIMIT ${sampleSize}`;
    const records = await db.query<any>(sampleSql, queryParams);

    // Analyze fields
    const fieldMap = new Map<string, any>();

    for (const record of records) {
      const content = typeof record.content === 'string'
        ? JSON.parse(record.content)
        : record.content;

      analyzeObject(content, '', fieldMap);
    }

    // Convert to array and add suggestions
    const fields = Array.from(fieldMap.values()).map((field: any) => ({
      ...field,
      types: Array.from(field.types),
      suggestedTable: suggestTableName(field.path, baseTableName),
      suggestedColumn: suggestColumnName(field.path),
      suggestedType: suggestSqlType(field),
    }));

    await db.close();

    res.json({
      success: true,
      analysis: {
        fields,
        totalDocuments: records.length,
        analyzedAt: new Date(),
      },
      totalRecordsInTable,
      sampledRecords: records.length,
      baseTableName,
      toProcessTable: `${baseTableName}_toprocess`,
      appliedFilters: whereConditions,
    });

  } catch (error: any) {
    console.error('Error analyzing JSON:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Helper function to analyze object structure
function analyzeObject(obj: any, prefix: string, fieldMap: Map<string, any>) {
  if (obj === null || obj === undefined) {
    return;
  }

  if (Array.isArray(obj)) {
    // Analyze first element of array
    if (obj.length > 0) {
      analyzeObject(obj[0], prefix, fieldMap);
    }
    return;
  }

  if (typeof obj === 'object') {
    for (const key in obj) {
      const path = prefix ? `${prefix}.${key}` : key;
      const value = obj[key];

      if (!fieldMap.has(path)) {
        fieldMap.set(path, {
          path,
          types: new Set<string>(),
          isArray: Array.isArray(value),
          isNullable: false,
          samples: [],
          occurrence: 0,
          maxLength: 0,
        });
      }

      const field = fieldMap.get(path);
      field.occurrence++;

      if (value === null || value === undefined) {
        field.isNullable = true;
      } else {
        const type = Array.isArray(value) ? 'array' : typeof value;
        field.types.add(type);

        if (field.samples.length < 5) {
          field.samples.push(value);
        }

        if (typeof value === 'string' && value.length > (field.maxLength || 0)) {
          field.maxLength = value.length;
        }

        // Recursively analyze nested objects
        if (typeof value === 'object' && !Array.isArray(value)) {
          analyzeObject(value, path, fieldMap);
        } else if (Array.isArray(value) && value.length > 0) {
          analyzeObject(value[0], path, fieldMap);
        }
      }
    }
  }
}

// Suggest table name based on field path
function suggestTableName(path: string, baseTableName: string): string {
  const parts = path.split('.');

  // If path contains common parent keys, use them
  if (parts.length > 1) {
    const parent = parts[parts.length - 2];
    // Common patterns: eventData -> events, pipelineData -> pipelines, etc.
    if (parent.toLowerCase().endsWith('data')) {
      return parent.slice(0, -4).toLowerCase() + 's';
    }
    return parent.toLowerCase() + '_data';
  }

  return baseTableName;
}

// Suggest column name from path
function suggestColumnName(path: string): string {
  const parts = path.split('.');
  return parts[parts.length - 1].replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`);
}

// Suggest SQL type based on field analysis
function suggestSqlType(field: any): string {
  const types = Array.from(field.types);

  if (types.includes('number')) {
    // Check if it's likely a timestamp
    const hasLargeNumbers = field.samples.some((s: any) => typeof s === 'number' && s > 1000000000);
    if (hasLargeNumbers) {
      return 'BIGINT'; // Unix timestamp
    }
    return 'INT';
  }

  if (types.includes('boolean')) {
    return 'TINYINT(1)';
  }

  if (types.includes('string')) {
    const maxLen = field.maxLength || 0;
    if (maxLen > 1000) return 'TEXT';
    if (maxLen > 255) return 'VARCHAR(500)';
    return 'VARCHAR(255)';
  }

  if (types.includes('object')) {
    return 'JSON';
  }

  if (types.includes('array')) {
    return 'JSON';
  }

  return 'TEXT';
}

// Get unique values for a specific field (for filter UI)
router.post('/field-values', async (req, res) => {
  try {
    const { tableName, fieldPath, limit = 100 } = req.body;

    if (!tableName || !fieldPath) {
      return res.status(400).json({ error: 'tableName and fieldPath are required' });
    }

    const db = new DatabaseConnection({
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '3306'),
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || 'root',
      database: process.env.DB_NAME || 'test_json'
    });

    // Build JSON extraction query
    const jsonPath = `$.${fieldPath}`;
    const sql = `
      SELECT DISTINCT JSON_UNQUOTE(JSON_EXTRACT(content, ?)) as value
      FROM ${tableName}
      WHERE JSON_EXTRACT(content, ?) IS NOT NULL
      LIMIT ${limit}
    `;

    const results = await db.query<any>(sql, [jsonPath, jsonPath]);
    const values = results.map(r => r.value).filter(v => v !== null);

    res.json({
      fieldPath,
      values
    });

  } catch (error: any) {
    console.error('Error getting field values:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
