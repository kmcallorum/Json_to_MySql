#!/usr/bin/env node

import http from 'http';

const CONFIG_NAME = process.argv[2] || '2nd';
const API_URL = 'http://localhost:3001';

async function request(path, method = 'GET', body = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, API_URL);
    const options = {
      method,
      headers: { 'Content-Type': 'application/json' }
    };

    const req = http.request(url, options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        if (res.statusCode !== 200) {
          reject(new Error(`HTTP ${res.statusCode}: ${data}`));
          return;
        }
        try {
          resolve(JSON.parse(data));
        } catch (e) {
          reject(new Error(`Invalid JSON: ${data}`));
        }
      });
    });

    req.on('error', reject);
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}

async function runETL() {
  console.log('🚀 Starting Daily ETL Process');
  console.log('📅', new Date().toISOString());
  console.log('⚙️  Config:', CONFIG_NAME);
  console.log('');

  try {
    // Load mapping config (includes filters, mappings, and relationships)
    console.log('1️⃣  Loading configuration...');
    const response = await request(`/api/mappings/load/${CONFIG_NAME}`);

    if (!response.success || !response.config) {
      throw new Error(`Failed to load config: ${response.error || 'Unknown error'}`);
    }

    const config = response.config;

    if (!config || !config.mappings) {
      throw new Error(`Invalid config: ${JSON.stringify(config)}`);
    }
    
    console.log(`   ✓ Base table: ${config.baseTableName}`);
    console.log(`   ✓ Loaded ${config.mappings.length} field mappings`);
    console.log(`   ✓ Filter conditions: ${config.whereConditions?.length || 0}`);
    console.log(`   ✓ Relationships: ${config.relationships?.length || 0}`);

    // Execute flattening
    console.log('2️⃣  Executing flattening process...');
    const result = await request('/api/mappings/execute', 'POST', config);

    const processed = result.recordsProcessed || 0;
    const moved = result.recordsMoved || 0;

    console.log(`   ✓ Processed: ${processed} records`);
    console.log(`   ✓ Moved: ${moved} records`);
    console.log('');

    if (processed === 0 && moved === 0) {
      console.log('⚠️  No records to process (table may be empty)');
      process.exit(0);
    }

    console.log('✅ ETL Complete!');
    console.log('📊 Summary:');
    console.log(`   - Records processed: ${processed}`);
    console.log(`   - Records archived: ${moved}`);
    console.log(`   - Timestamp: ${new Date().toISOString()}`);

    process.exit(0);

  } catch (error) {
    console.error('❌ ETL Failed:', error.message);
    console.error('Stack:', error.stack);
    process.exit(1);
  }
}

runETL();
