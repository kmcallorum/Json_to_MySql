import 'reflect-metadata';
import { container } from 'tsyringe';
import { DatabaseConnection } from './database/connection.js';
import { ExecutionService } from './services/executionService.js';
import { FilterPresetService } from './services/filterPresetService.js';
import { MappingConfigService } from './services/mappingConfigService.js';

// Database configuration from environment
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '3306'),
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || 'root',
  database: process.env.DB_NAME || 'test_json'
};

// Register DatabaseConnection as singleton
container.registerSingleton(DatabaseConnection, DatabaseConnection);

// Manually resolve and register the singleton instance
const dbConnection = new DatabaseConnection(dbConfig);
container.registerInstance(DatabaseConnection, dbConnection);

// Register services - they will automatically receive DatabaseConnection via constructor injection
container.registerSingleton(ExecutionService, ExecutionService);
container.registerSingleton(FilterPresetService, FilterPresetService);
container.registerSingleton(MappingConfigService, MappingConfigService);

export { container };
