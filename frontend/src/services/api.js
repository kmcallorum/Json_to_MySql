const API_URL = 'http://localhost:3001/api';
export const api = {
    async testConnection(credentials) {
        const response = await fetch(`${API_URL}/analysis/test-connection`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(credentials),
        });
        return response.json();
    },
    async discoverFields(baseTableName, sampleSize = 1000) {
        const response = await fetch(`${API_URL}/analysis/discover-fields`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ baseTableName, sampleSize }),
        });
        return response.json();
    },
    async analyze(request) {
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
    async getTableStructures(tableNames) {
        const response = await fetch(`${API_URL}/tables/structures`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ tableNames }),
        });
        return response.json();
    },
    async saveMappingConfig(config) {
        const response = await fetch(`${API_URL}/mappings/save`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(config),
        });
        return response.json();
    },
    async loadMappingConfig(name) {
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
    async findMappingsByTables(tableNames, baseTableName) {
        const response = await fetch(`${API_URL}/mappings/find-by-tables`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ tableNames, baseTableName }),
        });
        return response.json();
    },
    async deleteMappingConfig(name) {
        const response = await fetch(`${API_URL}/mappings/${encodeURIComponent(name)}`, {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
        });
        return response.json();
    },
    async saveFilterPreset(preset) {
        const response = await fetch(`${API_URL}/filters/save`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(preset),
        });
        return response.json();
    },
    async loadFilterPreset(name) {
        const response = await fetch(`${API_URL}/filters/load/${encodeURIComponent(name)}`, {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' },
        });
        return response.json();
    },
    async listFilterPresets(baseTableName) {
        const url = baseTableName
            ? `${API_URL}/filters/list?baseTableName=${encodeURIComponent(baseTableName)}`
            : `${API_URL}/filters/list`;
        const response = await fetch(url, {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' },
        });
        return response.json();
    },
    async deleteFilterPreset(name) {
        const response = await fetch(`${API_URL}/filters/${encodeURIComponent(name)}`, {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
        });
        return response.json();
    },
    async executeFlattening(data) {
        const response = await fetch(`${API_URL}/mappings/execute`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
        });
        return response.json();
    },
    // Staging API methods
    async analyzeTables(tableNames) {
        const response = await fetch(`${API_URL}/staging/analyze-tables`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ tableNames }),
        });
        return response.json();
    },
    async createStagingTables(tables) {
        const response = await fetch(`${API_URL}/staging/create-tables`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ tables }),
        });
        return response.json();
    },
    async executeStagingCopy(data) {
        const response = await fetch(`${API_URL}/staging/execute`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
        });
        return response.json();
    },
};
