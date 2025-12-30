/**
 * Analyzes JSON documents and discovers their schema
 * This is pure JavaScript logic - no React, no backend
 */
export class JsonAnalyzer {
    /**
     * Analyze an array of JSON documents
     */
    analyze(documents, sampleSize) {
        const docsToAnalyze = sampleSize
            ? documents.slice(0, sampleSize)
            : documents;
        if (docsToAnalyze.length === 0) {
            throw new Error('No documents to analyze');
        }
        const fieldStats = new Map();
        // Analyze each document
        docsToAnalyze.forEach(doc => {
            this.traverseObject(doc, '', fieldStats);
        });
        // Convert to FieldAnalysis format
        const fields = Array.from(fieldStats.entries()).map(([path, stats]) => {
            return {
                path,
                types: stats.types,
                isArray: stats.isArray,
                isNullable: stats.isNullable,
                samples: stats.samples.slice(0, 3), // Keep first 3 samples
                occurrence: stats.count,
                maxLength: stats.maxLength,
                suggestedTable: this.suggestTableName(path),
                suggestedColumn: this.suggestColumnName(path),
                suggestedType: this.suggestDataType(stats),
            };
        });
        return {
            fields,
            totalRecords: docsToAnalyze.length,
            totalDocuments: docsToAnalyze.length,
            analyzedAt: new Date(),
        };
    }
    /**
     * Recursively traverse an object to discover all fields
     */
    traverseObject(obj, prefix, stats) {
        if (obj === null || obj === undefined) {
            return;
        }
        for (const [key, value] of Object.entries(obj)) {
            const path = prefix ? `${prefix}.${key}` : key;
            if (!stats.has(path)) {
                stats.set(path, {
                    types: new Set(),
                    samples: [],
                    isArray: false,
                    isNullable: false,
                    count: 0,
                    maxLength: undefined,
                });
            }
            const fieldStats = stats.get(path);
            fieldStats.count++;
            if (value === null || value === undefined) {
                fieldStats.isNullable = true;
                return;
            }
            if (Array.isArray(value)) {
                fieldStats.isArray = true;
                if (value.length > 0) {
                    const firstItem = value[0];
                    if (typeof firstItem === 'object' && firstItem !== null) {
                        // Array of objects - recurse into first item
                        this.traverseObject(firstItem, path, stats);
                    }
                    else {
                        // Array of primitives
                        fieldStats.types.add(typeof firstItem);
                        if (fieldStats.samples.length < 3) {
                            fieldStats.samples.push(firstItem);
                        }
                    }
                }
            }
            else if (typeof value === 'object') {
                // Nested object - recurse
                this.traverseObject(value, path, stats);
            }
            else {
                // Primitive value
                fieldStats.types.add(typeof value);
                if (fieldStats.samples.length < 3) {
                    fieldStats.samples.push(value);
                }
                // Track max length for strings
                if (typeof value === 'string') {
                    const len = value.length;
                    if (!fieldStats.maxLength || len > fieldStats.maxLength) {
                        fieldStats.maxLength = len;
                    }
                }
            }
        }
    }
    /**
     * Suggest a table name based on the field path
     */
    suggestTableName(path) {
        const parts = path.split('.');
        if (parts.length === 1) {
            return 'main_table';
        }
        // First part usually indicates the table
        const firstPart = parts[0];
        // Common patterns
        if (firstPart === 'eventData' || firstPart === 'pipelineData') {
            return 'events';
        }
        if (firstPart === 'testData') {
            return 'test_results';
        }
        return `${firstPart}_table`;
    }
    /**
     * Convert camelCase to snake_case
     */
    suggestColumnName(path) {
        const parts = path.split('.');
        const lastPart = parts[parts.length - 1];
        return lastPart
            .replace(/([A-Z])/g, '_$1')
            .toLowerCase()
            .replace(/^_/, '');
    }
    /**
     * Suggest SQL data type based on the field statistics
     */
    suggestDataType(stats) {
        const types = Array.from(stats.types);
        if (types.length === 0) {
            return 'TEXT';
        }
        // Multiple types - use TEXT
        if (types.length > 1) {
            return 'TEXT';
        }
        const type = types[0];
        if (type === 'number') {
            // Check if any samples have decimals
            const hasDecimals = stats.samples.some((s) => s % 1 !== 0);
            return hasDecimals ? 'DOUBLE' : 'INT';
        }
        if (type === 'boolean') {
            return 'BOOLEAN';
        }
        if (type === 'string') {
            const maxLen = stats.maxLength || 0;
            if (maxLen === 0) {
                return 'VARCHAR(255)';
            }
            if (maxLen <= 50) {
                return 'VARCHAR(50)';
            }
            if (maxLen <= 255) {
                return 'VARCHAR(255)';
            }
            if (maxLen <= 500) {
                return 'VARCHAR(500)';
            }
            return 'TEXT';
        }
        return 'TEXT';
    }
}
