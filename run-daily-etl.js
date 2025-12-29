#!/usr/bin/env node

const http = require('http');

const CONFIG_NAME = process.argv[2] || 'v1';
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
        try {
          resolve(JSON.parse(data));
        } catch (e) {
          resolve(data);
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
    // Step 1: Load filter preset
    console.log('1️⃣  Loading filter preset...');
    const preset = await request(`/api/filters/presets/${CONFIG_NAME}`);
    const baseTable = preset.baseTableName;
    console.log(`   ✓ Loaded preset for table: ${baseTable}`);

    // Step 2: Load mapping config
    console.log('2️⃣  Loading saved mapping configuration...');
    const config = await request(`/api/mappings/configs/${CONFIG_NAME}`);
    console.log('   ✓ Loaded mapping config');

    // Step 3: Execute flattening
    console.log('3️⃣  Executing flattening process...');
    const result = await request('/api/mappings/execute', 'POST', config);

    const processed = result.recordsProcessed || 0;
    const moved = result.recordsMoved || 0;

    console.log(`   ✓ Processed: ${processed} records`);
    console.log(`   ✓ Moved: ${moved} records`);
    console.log('');

    if (processed === 0 && moved === 0) {
      console.log('⚠️  Warning: No records processed');
      process.exit(1);
    }

    console.log('✅ ETL Complete!');
    console.log('📊 Summary:');
    console.log(`   - Records processed: ${processed}`);
    console.log(`   - Records archived: ${moved}`);
    console.log(`   - Timestamp: ${new Date().toISOString()}`);

    process.exit(0);

  } catch (error) {
    console.error('❌ ETL Failed:', error.message);
    process.exit(1);
  }
}

runETL();
