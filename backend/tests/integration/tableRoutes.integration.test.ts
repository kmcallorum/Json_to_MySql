import { describe, it, expect, beforeAll, afterAll, jest } from '@jest/globals';
import request from 'supertest';
import express from 'express';
import tableRoutes from '../../src/routes/tableRoutes.js';
import { container } from 'tsyringe';
import { TableService } from '../../src/services/tableService.js';
import { DatabaseConnection } from '../../src/database/connection.js';

// Create test Express app
const app = express();
app.use(express.json());
app.use('/api/tables', tableRoutes);

describe('Table Routes Integration Tests', () => {
  let mockDb: jest.Mocked<DatabaseConnection>;
  let mockService: jest.Mocked<TableService>;

  beforeAll(() => {
    // Mock the database connection
    mockDb = {
      query: jest.fn(),
      rawQuery: jest.fn(),
      close: jest.fn()
    } as any;

    // Mock the service
    mockService = {
      listTables: jest.fn(),
      getTableStructures: jest.fn()
    } as any;

    // Register mocks in container
    container.registerInstance(DatabaseConnection, mockDb);
    container.registerInstance(TableService, mockService);
  });

  afterAll(() => {
    container.clearInstances();
  });

  describe('GET /list', () => {
    it('should list all tables in the database', async () => {
      const mockTables = ['events', 'logs', 'users', 'test_json'];
      mockService.listTables.mockResolvedValue(mockTables);

      const response = await request(app).get('/api/tables/list');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.tables).toEqual(mockTables);
      expect(mockService.listTables).toHaveBeenCalledTimes(1);
    });

    it('should return empty array when no tables exist', async () => {
      mockService.listTables.mockResolvedValue([]);

      const response = await request(app).get('/api/tables/list');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.tables).toEqual([]);
    });

    it('should handle errors when listing tables', async () => {
      mockService.listTables.mockRejectedValue(new Error('Database connection failed'));

      const response = await request(app).get('/api/tables/list');

      expect(response.status).toBe(500);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Database connection failed');
    });
  });

  describe('POST /structures', () => {
    it('should get table structures for specified tables', async () => {
      const mockStructures = [
        {
          name: 'events',
          columns: [
            {
              name: 'id',
              type: 'INT',
              nullable: false,
              isPrimaryKey: true,
              default: null
            },
            {
              name: 'type',
              type: 'VARCHAR(255)',
              nullable: true,
              isPrimaryKey: false,
              default: null
            }
          ],
          isNew: false
        },
        {
          name: 'logs',
          columns: [
            {
              name: 'id',
              type: 'BIGINT',
              nullable: false,
              isPrimaryKey: true,
              default: null
            },
            {
              name: 'message',
              type: 'TEXT',
              nullable: true,
              isPrimaryKey: false,
              default: null
            }
          ],
          isNew: false
        }
      ];

      mockService.getTableStructures.mockResolvedValue(mockStructures);

      const response = await request(app)
        .post('/api/tables/structures')
        .send({
          tableNames: ['events', 'logs']
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.tables).toEqual(mockStructures);
      expect(mockService.getTableStructures).toHaveBeenCalledWith(['events', 'logs']);
    });

    it('should handle single table structure request', async () => {
      const mockStructures = [
        {
          name: 'events',
          columns: [
            {
              name: 'id',
              type: 'INT',
              nullable: false,
              isPrimaryKey: true,
              default: null
            }
          ],
          isNew: false
        }
      ];

      mockService.getTableStructures.mockResolvedValue(mockStructures);

      const response = await request(app)
        .post('/api/tables/structures')
        .send({
          tableNames: ['events']
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.tables).toHaveLength(1);
    });

    it('should return error if tableNames is missing', async () => {
      const response = await request(app)
        .post('/api/tables/structures')
        .send({});

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('tableNames array is required');
    });

    it('should return error if tableNames is not an array', async () => {
      const response = await request(app)
        .post('/api/tables/structures')
        .send({
          tableNames: 'not-an-array'
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('tableNames array is required');
    });

    it('should return error if tableNames is empty array', async () => {
      const response = await request(app)
        .post('/api/tables/structures')
        .send({
          tableNames: []
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('tableNames array is required');
    });

    it('should handle errors getting table structures', async () => {
      mockService.getTableStructures.mockRejectedValue(new Error('Table not found'));

      const response = await request(app)
        .post('/api/tables/structures')
        .send({
          tableNames: ['invalid_table']
        });

      expect(response.status).toBe(500);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Table not found');
    });
  });
});
