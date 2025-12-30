import { describe, it, expect, beforeAll, afterAll, jest } from '@jest/globals';
import request from 'supertest';
import express from 'express';
import analysisRoutes from '../../src/routes/analysisRoutes.js';
import { container } from 'tsyringe';
import { AnalysisService } from '../../src/services/analysisService.js';
import { DatabaseConnection } from '../../src/database/connection.js';

// Create test Express app
const app = express();
app.use(express.json());
app.use('/api/analysis', analysisRoutes);

describe('Analysis Routes Integration Tests', () => {
  let mockDb: jest.Mocked<DatabaseConnection>;
  let mockService: jest.Mocked<AnalysisService>;

  beforeAll(() => {
    // Mock the database connection
    mockDb = {
      query: jest.fn(),
      rawQuery: jest.fn(),
      close: jest.fn()
    } as any;

    // Mock the service
    mockService = {
      testConnection: jest.fn(),
      discoverFields: jest.fn(),
      analyze: jest.fn(),
      getFieldValues: jest.fn()
    } as any;

    // Register mocks in container
    container.registerInstance(DatabaseConnection, mockDb);
    container.registerInstance(AnalysisService, mockService);
  });

  afterAll(() => {
    container.clearInstances();
  });

  describe('POST /test-connection', () => {
    it('should successfully test database connection', async () => {
      mockService.testConnection.mockResolvedValue(undefined);

      const response = await request(app)
        .post('/api/analysis/test-connection')
        .send({
          host: 'localhost',
          port: 3306,
          user: 'root',
          password: 'root',
          database: 'test_json'
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Connection successful!');
      expect(mockService.testConnection).toHaveBeenCalledWith({
        host: 'localhost',
        port: 3306,
        user: 'root',
        password: 'root',
        database: 'test_json'
      });
    });

    it('should handle connection failure', async () => {
      mockService.testConnection.mockRejectedValue(new Error('Connection failed'));

      const response = await request(app)
        .post('/api/analysis/test-connection')
        .send({
          host: 'invalid-host'
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Connection failed');
    });
  });

  describe('POST /discover-fields', () => {
    it('should discover fields from a table', async () => {
      const mockFields = {
        tableName: 'test_table',
        sampleSize: 100,
        fields: [
          {
            path: '_source.type',
            uniqueValues: ['event.test', 'event.run'],
            nullCount: 0,
            totalCount: 100
          }
        ]
      };

      mockService.discoverFields.mockResolvedValue(mockFields);

      const response = await request(app)
        .post('/api/analysis/discover-fields')
        .send({
          tableName: 'test_table',
          sampleSize: 100
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.fields).toEqual(mockFields.fields);
      expect(mockService.discoverFields).toHaveBeenCalledWith('test_table', 100);
    });

    it('should handle baseTableName parameter', async () => {
      const mockFields = {
        tableName: 'test_table',
        sampleSize: 1000,
        fields: []
      };

      mockService.discoverFields.mockResolvedValue(mockFields);

      const response = await request(app)
        .post('/api/analysis/discover-fields')
        .send({
          baseTableName: 'test_table'
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(mockService.discoverFields).toHaveBeenCalledWith('test_table', 1000);
    });

    it('should return error if table name is missing', async () => {
      const response = await request(app)
        .post('/api/analysis/discover-fields')
        .send({});

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('tableName or baseTableName is required');
    });

    it('should handle errors during field discovery', async () => {
      mockService.discoverFields.mockRejectedValue(new Error('Table not found'));

      const response = await request(app)
        .post('/api/analysis/discover-fields')
        .send({
          tableName: 'invalid_table'
        });

      expect(response.status).toBe(500);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Table not found');
    });
  });

  describe('POST /analyze', () => {
    it('should analyze JSON structure', async () => {
      const mockAnalysis = {
        analysis: {
          fields: [
            {
              path: '_source.type',
              types: ['string'],
              isArray: false,
              isNullable: false,
              samples: ['event.test'],
              occurrence: 100,
              suggestedTable: 'events',
              suggestedColumn: 'type',
              suggestedType: 'VARCHAR(255)'
            }
          ],
          totalDocuments: 100,
          analyzedAt: new Date()
        },
        totalRecordsInTable: 1000,
        sampledRecords: 100,
        baseTableName: 'test_table',
        toProcessTable: 'test_table_toprocess',
        appliedFilters: []
      };

      mockService.analyze.mockResolvedValue(mockAnalysis);

      const response = await request(app)
        .post('/api/analysis/analyze')
        .send({
          baseTableName: 'test_table',
          sampleSize: 100
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.analysis).toBeDefined();
      expect(mockService.analyze).toHaveBeenCalledWith('test_table', 100, []);
    });

    it('should analyze with WHERE conditions', async () => {
      const whereConditions = [
        { field: '_source.type', operator: '=', value: 'event.test' }
      ];

      const mockAnalysis = {
        analysis: {
          fields: [],
          totalDocuments: 50,
          analyzedAt: new Date()
        },
        totalRecordsInTable: 50,
        sampledRecords: 50,
        baseTableName: 'test_table',
        toProcessTable: 'test_table_toprocess',
        appliedFilters: whereConditions
      };

      mockService.analyze.mockResolvedValue(mockAnalysis);

      const response = await request(app)
        .post('/api/analysis/analyze')
        .send({
          baseTableName: 'test_table',
          sampleSize: 100,
          whereConditions
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(mockService.analyze).toHaveBeenCalledWith('test_table', 100, whereConditions);
    });

    it('should return error if baseTableName is missing', async () => {
      const response = await request(app)
        .post('/api/analysis/analyze')
        .send({});

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('baseTableName is required');
    });

    it('should handle analysis errors', async () => {
      mockService.analyze.mockRejectedValue(new Error('Analysis failed'));

      const response = await request(app)
        .post('/api/analysis/analyze')
        .send({
          baseTableName: 'test_table'
        });

      expect(response.status).toBe(500);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Analysis failed');
    });
  });

  describe('POST /field-values', () => {
    it('should get unique field values', async () => {
      const mockValues = {
        fieldPath: '_source.type',
        values: ['event.test', 'event.run']
      };

      mockService.getFieldValues.mockResolvedValue(mockValues);

      const response = await request(app)
        .post('/api/analysis/field-values')
        .send({
          tableName: 'test_table',
          fieldPath: '_source.type',
          limit: 100
        });

      expect(response.status).toBe(200);
      expect(response.body.fieldPath).toBe('_source.type');
      expect(response.body.values).toEqual(['event.test', 'event.run']);
      expect(mockService.getFieldValues).toHaveBeenCalledWith('test_table', '_source.type', 100);
    });

    it('should use default limit if not specified', async () => {
      const mockValues = {
        fieldPath: '_source.type',
        values: []
      };

      mockService.getFieldValues.mockResolvedValue(mockValues);

      const response = await request(app)
        .post('/api/analysis/field-values')
        .send({
          tableName: 'test_table',
          fieldPath: '_source.type'
        });

      expect(response.status).toBe(200);
      expect(mockService.getFieldValues).toHaveBeenCalledWith('test_table', '_source.type', 100);
    });

    it('should return error if tableName is missing', async () => {
      const response = await request(app)
        .post('/api/analysis/field-values')
        .send({
          fieldPath: '_source.type'
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('tableName and fieldPath are required');
    });

    it('should return error if fieldPath is missing', async () => {
      const response = await request(app)
        .post('/api/analysis/field-values')
        .send({
          tableName: 'test_table'
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('tableName and fieldPath are required');
    });

    it('should handle errors getting field values', async () => {
      mockService.getFieldValues.mockRejectedValue(new Error('Query failed'));

      const response = await request(app)
        .post('/api/analysis/field-values')
        .send({
          tableName: 'test_table',
          fieldPath: '_source.type'
        });

      expect(response.status).toBe(500);
      expect(response.body.error).toBe('Query failed');
    });
  });
});
