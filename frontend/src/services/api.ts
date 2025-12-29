import { WhereCondition, TableRelationship } from '../types';

const API_URL = 'http://localhost:3001/api';

export interface AnalyzeRequest {
  baseTableName: string;
  sampleSize: number;
  whereConditions: WhereCondition[];
}

export interface MappingConfig {
  name: string;
  description?: string;
  baseTableName: string;
  whereConditions: any[];
  tables: any[];
  mappings: any[];
  fields?: any[];
  relationships?: TableRelationship[];
}

export interface FilterPreset {
  name: string;
  description?: string;
  baseTableName: string;
  whereConditions: any[];
}

export const api = {
  async testConnection(credentials: {
    host: string;
    port: number;
    user: string;
    password: string;
    database: string;
  }) {
    const response = await fetch(`${API_URL}/analysis/test-connection`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(credentials),
    });
    return response.json();
  },

  async discoverFields(baseTableName: string, sampleSize: number = 1000) {
    const response = await fetch(`${API_URL}/analysis/discover-fields`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ baseTableName, sampleSize }),
    });
    return response.json();
  },

  async analyze(request: AnalyzeRequest) {
    const response = await fetch(`${API_URL}/analysis/analyze`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(request),
    });
    return response.json();
  },

  async getTableList() {
    const response = await fetch(`${API_URL}/tables/list`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    });
    return response.json();
  },

  async getTableStructures(tableNames: string[]) {
    const response = await fetch(`${API_URL}/tables/structures`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tableNames }),
    });
    return response.json();
  },

  async saveMappingConfig(config: MappingConfig) {
    const response = await fetch(`${API_URL}/mappings/save`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(config),
    });
    return response.json();
  },

  async loadMappingConfig(name: string) {
    const response = await fetch(`${API_URL}/mappings/load/${encodeURIComponent(name)}`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    });
    return response.json();
  },

  async listMappingConfigs() {
    const response = await fetch(`${API_URL}/mappings/list`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    });
    return response.json();
  },

  async findMappingsByTables(tableNames: string[], baseTableName?: string) {
    const response = await fetch(`${API_URL}/mappings/find-by-tables`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tableNames, baseTableName }),
    });
    return response.json();
  },

  async deleteMappingConfig(name: string) {
    const response = await fetch(`${API_URL}/mappings/${encodeURIComponent(name)}`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
    });
    return response.json();
  },

  async saveFilterPreset(preset: FilterPreset) {
    const response = await fetch(`${API_URL}/filters/save`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(preset),
    });
    return response.json();
  },

  async loadFilterPreset(name: string) {
    const response = await fetch(`${API_URL}/filters/load/${encodeURIComponent(name)}`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    });
    return response.json();
  },

  async listFilterPresets(baseTableName?: string) {
    const url = baseTableName
      ? `${API_URL}/filters/list?baseTableName=${encodeURIComponent(baseTableName)}`
      : `${API_URL}/filters/list`;

    const response = await fetch(url, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    });
    return response.json();
  },

  async deleteFilterPreset(name: string) {
    const response = await fetch(`${API_URL}/filters/${encodeURIComponent(name)}`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
    });
    return response.json();
  },

  async executeFlattening(data: {
    baseTableName: string;
    tables: any[];
    mappings: any[];
    whereConditions: any[];
    relationships?: TableRelationship[];
    batchSize?: number;
  }) {
    const response = await fetch(`${API_URL}/mappings/execute`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return response.json();
  },
};
