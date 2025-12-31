#!/usr/bin/env node

import http from 'http';

const CONFIG_NAME = process.argv[2];
const API_URL = 'http://localhost:3001';

if (!CONFIG_NAME) {
  console.error('❌ Error: Config name is required');
  console.error('Usage: node run-staging.js <config-name>');
  console.error('Example: node run-staging.js my-staging-config');
  process.exit(1);
}

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

async function runStaging() {
  console.log('🚀 Starting Staging Process');
  console.log('📅', new Date().toISOString());
  console.log('⚙️  Config:', CONFIG_NAME);
  console.log('');

  try {
    // Load staging config
    console.log('1️⃣  Loading staging configuration...');
    const response = await request(`/api/staging/configs/${CONFIG_NAME}`);

    if (!response.success || !response.config) {
      throw new Error(`Failed to load config: ${response.error || 'Unknown error'}`);
    }

    const config = response.config;

    console.log(`   ✓ Source tables: ${config.sourceTables?.join(', ') || 'none'}`);
    console.log(`   ✓ Mappings: ${config.mappings?.length || 0}`);
    console.log(`   ✓ Relationships: ${config.relationships?.length || 0}`);
    console.log(`   ✓ Where conditions: ${config.whereConditions?.length || 0}`);

    // Execute staging copy
    console.log('2️⃣  Executing staging copy...');
    const executePayload = {
      sourceTables: config.sourceTables,
      mappings: config.mappings,
      relationships: config.relationships || [],
      whereConditions: config.whereConditions || [],
      batchSize: 100
    };

    const result = await request('/api/staging/execute', 'POST', executePayload);

    if (!result.success) {
      throw new Error(`Staging failed: ${result.error || 'Unknown error'}`);
    }

    const processed = result.processed || 0;
    const errors = result.errors || [];

    console.log(`   ✓ Processed: ${processed} records`);

    if (errors.length > 0) {
      console.log(`   ⚠️  Errors: ${errors.length}`);
      errors.slice(0, 5).forEach(err => console.log(`      - ${err}`));
      if (errors.length > 5) {
        console.log(`      ... and ${errors.length - 5} more errors`);
      }
    }

    console.log('');

    if (processed === 0) {
      console.log('⚠️  No records processed (source tables may be empty or filters excluded all records)');
      process.exit(0);
    }

    console.log('✅ Staging Complete!');
    console.log('📊 Summary:');
    console.log(`   - Records copied: ${processed}`);
    console.log(`   - Errors: ${errors.length}`);
    console.log(`   - Timestamp: ${new Date().toISOString()}`);

    process.exit(errors.length > 0 ? 1 : 0);

  } catch (error) {
    console.error('❌ Staging Failed:', error.message);
    console.error('Stack:', error.stack);
    process.exit(1);
  }
}

runStaging();
