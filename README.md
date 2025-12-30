# JSON-to-SQL Flattener

[![CI](https://github.com/YOUR_USERNAME/Json-Flattener/workflows/CI/badge.svg)](https://github.com/YOUR_USERNAME/Json-Flattener/actions)
[![codecov](https://codecov.io/gh/YOUR_USERNAME/Json-Flattener/branch/main/graph/badge.svg)](https://codecov.io/gh/YOUR_USERNAME/Json-Flattener)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js Version](https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen)](https://nodejs.org)

A production-ready tool for transforming nested JSON data from Elasticsearch into normalized SQL tables with automated ETL pipelines.

## 🎯 Overview

This system transforms complex, nested JSON documents stored in Elasticsearch into normalized relational database tables with proper foreign key relationships. It features a drag-and-drop UI for field mapping, automatic relationship detection, and fully automated daily ETL processing.

### Key Features

- ✅ **Visual Field Mapping** - Drag-and-drop interface for mapping JSON paths to SQL columns
- ✅ **Automatic Relationship Detection** - Detects `table_id` → `table.id` patterns
- ✅ **Cascading Inserts** - Handles hierarchical data with foreign key relationships
- ✅ **Type Conversion** - Automatic datetime/timestamp conversion
- ✅ **Filter Presets** - Save and reuse complex WHERE conditions
- ✅ **Configuration Management** - Save complete mappings for daily reuse
- ✅ **Automated ETL** - Run via cron for daily processing
- ✅ **Error Handling** - Comprehensive error messages and logging
- ✅ **Archive Strategy** - All records moved to landing table (processed or not)

## 📋 Table of Contents

- [Architecture](#architecture)
- [Installation](#installation)
- [Quick Start](#quick-start)
- [Testing](#testing)
- [Configuration](#configuration)
- [Daily ETL Workflow](#daily-etl-workflow)
- [Monitoring](#monitoring)
- [API Reference](#api-reference)
- [Contributing](#contributing)
- [Troubleshooting](#troubleshooting)

---

## 🏗 Architecture

### System Components

```
┌─────────────────┐
│  Elasticsearch  │
│  (Source Data)  │
└────────┬────────┘
         │
         ▼
┌─────────────────────────┐
│  MySQL Landing Table    │
│  table_name_toprocess   │
│  - id (ES _id)          │
│  - content (JSON)       │
└────────┬────────────────┘
         │
         ▼
┌─────────────────────────┐
│  Flattening Service     │
│  - Filters data         │
│  - Maps JSON → SQL      │
│  - Cascading inserts    │
└────────┬────────────────┘
         │
         ▼
┌─────────────────────────┐
│  Normalized SQL Tables  │
│  ┌─ document (parent)   │
│  ├─ event_data          │
│  │  ├─ event_test_data  │
│  │  └─ pipeline_data    │
│  │     └─ pipeline_libs │
└─────────────────────────┘
         │
         ▼
┌─────────────────────────┐
│  Archive Table          │
│  table_name             │
│  (All processed records)│
└─────────────────────────┘
```

### Data Flow

1. **Ingest**: Elasticsearch data → MySQL `_toprocess` table
2. **Filter**: Apply WHERE conditions to select records
3. **Map**: Extract JSON fields → SQL columns
4. **Insert**: Cascading inserts maintaining FK relationships
5. **Archive**: Move all records to landing table

### Tech Stack

**Backend:**
- Node.js + TypeScript
- Express.js
- MySQL2
- tsx (for development)

**Frontend:**
- React + TypeScript
- Vite
- Tailwind CSS
- Drag-and-drop UI

**Database:**
- MySQL 8.0+

---

## 🚀 Installation

### Prerequisites

- Node.js 18+
- MySQL 8.0+
- npm or yarn

### Setup

```bash
# Clone the repository
git clone https://github.com/YOUR_USERNAME/Json-Flattener.git
cd Json-Flattener

# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../frontend
npm install

# Configure database (if you have a setup script)
mysql -u root -p < setup/database.sql
```

### Environment Configuration

Create `.env` in the backend directory:

```bash
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=test_json
PORT=3001
```

### Database Setup

```sql
-- Create required tables
CREATE TABLE filter_presets (
  id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(255) UNIQUE NOT NULL,
  description TEXT,
  base_table_name VARCHAR(255) NOT NULL,
  where_conditions JSON,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE mapping_configs (
  id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(255) UNIQUE NOT NULL,
  description TEXT,
  base_table_name VARCHAR(255) NOT NULL,
  where_conditions JSON,
  tables JSON NOT NULL,
  mappings JSON NOT NULL,
  relationships JSON,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Create your source tables (example)
CREATE TABLE platforms_cicd_data_toprocess (
  id VARCHAR(255) PRIMARY KEY,
  content JSON NOT NULL
);

CREATE TABLE platforms_cicd_data (
  id VARCHAR(255) PRIMARY KEY,
  content JSON NOT NULL
);
```

---

## ⚡ Quick Start

### 1. Start the Services

```bash
# Terminal 1: Start backend
cd backend
npm run dev

# Terminal 2: Start frontend
cd frontend
npm run dev
```

### 2. Access the UI

Open http://localhost:5173

### 3. First-Time Workflow (45 seconds)

**Step 1: Analyze Data**
- Select source table: `platforms_cicd_data_toprocess`
- Add filters (optional):
  - Field: `_source.eventData.type`
  - Operator: `=`
  - Value: `pipeline.test`
- Click "Analyze Data"
- Save filter as preset: `v1`

**Step 2: Select Tables**
- Auto-generate tables OR select existing
- Review/edit table schemas
- Click "Continue"

**Step 3: Map Fields**
- Drag JSON fields from left panel
- Drop onto target table columns
- Visual feedback shows mappings
- Click "Continue"

**Step 4: Define Relationships**
- Click "Auto-Detect Relationships"
- Or manually add:
  - Parent: `document`, Child: `event_data`, FK: `document_id`
  - Parent: `event_data`, Child: `event_test_data`, FK: `event_data_id`
- Review insert order
- Click "Continue"

**Step 5: Execute**
- Review summary
- Click "Execute"
- Save configuration: `production`

**✅ Done! Records processed and archived.**

---

## 🧪 Testing

This project has **comprehensive test coverage** across all layers with **150 tests** achieving 100% coverage on critical services.

### Test Statistics

| Test Type | Count | Coverage | Status |
|-----------|-------|----------|--------|
| **Backend Unit Tests** | 80 | 100% statements/functions/lines | ✅ Passing |
| **Backend Integration Tests** | 16 | All API endpoints | ✅ Passing |
| **Frontend Unit Tests** | 49 | All components | ✅ Passing |
| **E2E Tests (Playwright)** | 5 | Main workflows | ✅ Passing |
| **TOTAL** | **150** | **Comprehensive** | **✅ 100%** |

### Running Tests

#### Backend Tests

```bash
cd backend

# Run all tests (unit + integration)
npm test

# Run only unit tests
npm run test:unit

# Run only integration tests
npm run test:integration

# Run with coverage report
npm run test:coverage
```

**Expected Output:**
```
Test Suites: 8 passed, 8 total
Tests:       96 passed, 96 total
Coverage:    100% statements, 100% functions, 100% lines, 98.23% branches
Time:        3.979s
```

#### Frontend Tests

```bash
cd frontend

# Run unit tests
npm run test:unit

# Run integration tests
npm run test:integration

# Run all tests
npm test

# Run E2E tests (requires dev server)
npm run test:e2e

# Run with coverage report
npm run test:coverage
```

**Expected Output:**
```
Test Suites: 10 passed, 10 total
Tests:       49 passed, 49 total
Time:        1.986s

E2E Tests:   5 passed, 5 total
```

### Test Coverage Details

#### Backend Services (100% Coverage)

- **executionService.ts**: Table creation, record flattening, WHERE clauses, auto-relationships, FK handling, error translation
- **filterPresetService.ts**: CRUD operations, JSON parsing, edge cases
- **mappingConfigService.ts**: Configuration management, data formats
- **relationshipService.ts**: Auto-detect, topological sorting, circular dependency detection

#### Integration Tests

- **Filter Routes**: Save, load, list, delete presets
- **Mapping Routes**: Save, load, list, delete configs, execute flattening

#### Frontend Components

- **JsonAnalyzerComponent**: All workflow steps, connection testing, field discovery
- **FilterBuilder**: Add/remove conditions, field selection, operators
- **FilterPresets**: Save/load/delete presets, validation
- **SaveLoadConfig**: Configuration management

#### E2E Tests (Playwright)

- Complete user workflow: connect → discover → filter → analyze → execute
- Error handling scenarios
- UI state changes and interactions
- Filter preset management

### Dependency Injection for Testing

This project uses **TSyringe** for dependency injection, making all services easily mockable:

```typescript
// Example: Mocking in tests
const mockDb = { query: jest.fn(), ... };
container.registerInstance(DatabaseConnection, mockDb);

// Service automatically receives mock
const service = container.resolve(FilterPresetService);
```

### Continuous Integration

All tests run automatically on every pull request via GitHub Actions. See [`.github/workflows/ci.yml`](.github/workflows/ci.yml) for the CI configuration.

---

## ⚙️ Configuration

### Filter Presets

Saved filter configurations for reuse:

```json
{
  "name": "v1",
  "baseTableName": "platforms_cicd_data",
  "whereConditions": [
    {
      "field": "_source.eventData.type",
      "value": "pipeline.test",
      "operator": "="
    },
    {
      "field": "_source.pipelineData.milestoneId",
      "operator": "IS NOT NULL"
    }
  ]
}
```

### Mapping Configuration

Complete mapping saved for daily ETL:

```json
{
  "name": "production",
  "baseTableName": "platforms_cicd_data",
  "whereConditions": [...],
  "tables": [
    {
      "name": "document",
      "columns": [
        {"name": "id", "type": "int", "isPrimaryKey": true},
        {"name": "src_index", "type": "varchar(255)"}
      ]
    }
  ],
  "mappings": [
    {
      "sourcePath": "_index",
      "targetTable": "document",
      "targetColumn": "src_index"
    }
  ],
  "relationships": [
    {
      "parentTable": "document",
      "childTable": "event_data",
      "foreignKeyColumn": "document_id",
      "parentKeyColumn": "id"
    }
  ]
}
```

---

## 🤖 Daily ETL Workflow

### Automated Execution

The ETL script (`run-daily-etl-v2.js`) handles:
1. Loading configuration
2. Processing filtered records
3. Archiving all records
4. Logging results

### Manual Execution

```bash
cd /path/to/Json-Flattener

# Run with default config
node run-daily-etl-v2.js

# Run with specific config
node run-daily-etl-v2.js production
```

### Cron Setup

```bash
# Edit crontab
crontab -e

# Add daily 2 AM execution
0 2 * * * cd /path/to/Json-Flattener && node run-daily-etl-v2.js production >> etl.log 2>&1

# Other schedule examples:
# Every 6 hours: 0 */6 * * *
# Weekdays at 6 AM: 0 6 * * 1-5
# Every hour: 0 * * * *
```

### ETL Output

```
🚀 Starting Daily ETL Process
📅 2025-12-27T18:16:37.741Z
⚙️  Config: production

1️⃣  Loading configuration...
   ✓ Base table: platforms_cicd_data
   ✓ Loaded 25 field mappings
   ✓ Filter conditions: 2
   ✓ Relationships: 4

2️⃣  Executing flattening process...
   ✓ Processed: 24 records
   ✓ Moved: 100 records

✅ ETL Complete!
📊 Summary:
   - Records processed: 24
   - Records archived: 100
   - Timestamp: 2025-12-27T18:16:38.039Z
```

---

## 📊 Monitoring

### View ETL Logs

```bash
# View recent logs
tail -50 etl.log

# Follow live
tail -f etl.log

# Search for errors
grep "Failed" etl.log
```

### Monitoring Dashboard

```bash
# Run monitoring script
./monitor-etl.sh
```

Output:
```
📊 ETL Monitoring Dashboard
======================================

✅ Last 5 Successful Runs:
2025-12-27 02:00:15 - ETL Complete! Processed: 142 records
2025-12-26 02:00:12 - ETL Complete! Processed: 98 records

❌ Recent Errors:
No errors found

📈 Database Stats:
+------------+-------+
| table_name | count |
+------------+-------+
| toprocess  |     0 |
| processed  |  1240 |
+------------+-------+
```

### Health Check

```bash
# Check backend health
curl http://localhost:3001/health

# Response
{"status":"ok","timestamp":"2025-12-27T18:00:00.000Z"}
```

### Database Queries

```sql
-- Check _toprocess table
SELECT COUNT(*) FROM platforms_cicd_data_toprocess;

-- Check archived records
SELECT COUNT(*) FROM platforms_cicd_data;

-- Check child tables
SELECT 
  (SELECT COUNT(*) FROM document) as documents,
  (SELECT COUNT(*) FROM event_data) as events,
  (SELECT COUNT(*) FROM event_test_data) as tests,
  (SELECT COUNT(*) FROM pipeline_data) as pipelines;

-- View recent records
SELECT * FROM document ORDER BY id DESC LIMIT 10;

-- Check FK relationships
SELECT 
  d.id as doc_id,
  ed.id as event_id,
  etd.id as test_id
FROM document d
LEFT JOIN event_data ed ON ed.document_id = d.id
LEFT JOIN event_test_data etd ON etd.event_data_id = ed.id
LIMIT 10;
```

---

## 🔌 API Reference

### Filter Presets

**List all presets**
```bash
GET /api/filters/presets
```

**Get preset by name**
```bash
GET /api/filters/presets/:name
```

**Save preset**
```bash
POST /api/filters/presets
Content-Type: application/json

{
  "name": "v1",
  "baseTableName": "platforms_cicd_data",
  "whereConditions": [...]
}
```

**Delete preset**
```bash
DELETE /api/filters/presets/:name
```

### Mapping Configs

**List all configs**
```bash
GET /api/mappings/configs
```

**Get config by name**
```bash
GET /api/mappings/configs/:name
```

**Save config**
```bash
POST /api/mappings/configs
Content-Type: application/json

{
  "name": "production",
  "baseTableName": "platforms_cicd_data",
  "whereConditions": [...],
  "tables": [...],
  "mappings": [...],
  "relationships": [...]
}
```

**Execute flattening**
```bash
POST /api/mappings/execute
Content-Type: application/json

{
  "baseTableName": "platforms_cicd_data",
  "tables": [...],
  "mappings": [...],
  "whereConditions": [...],
  "relationships": [...]
}
```

### Analysis

**Discover fields**
```bash
POST /api/analysis/discover-fields
Content-Type: application/json

{
  "tableName": "platforms_cicd_data_toprocess",
  "sampleSize": 1000
}
```

---

## 🐛 Troubleshooting

### Common Issues

**1. "Config not found"**
```bash
# List available configs
curl http://localhost:3001/api/mappings/configs | jq .

# Make sure you saved your configuration in the UI
```

**2. "Duplicate entry" error**
```bash
# Clear duplicate records
DELETE FROM platforms_cicd_data 
WHERE id IN (
  SELECT id FROM platforms_cicd_data_toprocess
);

# Or use INSERT IGNORE (already configured)
```

**3. "Foreign key constraint fails"**
```sql
-- Check FK definitions
SHOW CREATE TABLE event_data;

-- FK should be on foreign_key column, not id column
-- Correct: FOREIGN KEY (document_id) REFERENCES document(id)
-- Wrong: FOREIGN KEY (id) REFERENCES document(id)

-- Fix it
ALTER TABLE event_data DROP FOREIGN KEY constraint_name;
ALTER TABLE event_data 
ADD CONSTRAINT event_data_document_fk 
FOREIGN KEY (document_id) REFERENCES document(id);
```

**4. "No records processed"**
```sql
-- Check if _toprocess has data
SELECT COUNT(*) FROM platforms_cicd_data_toprocess;

-- Check if records match filter
SELECT COUNT(*) FROM platforms_cicd_data_toprocess
WHERE JSON_UNQUOTE(JSON_EXTRACT(content, '$._source.eventData.type')) = 'pipeline.test';
```

**5. Backend not responding**
```bash
# Check if backend is running
curl http://localhost:3001/health

# Check logs
cd backend
npm run dev

# Check port
lsof -i :3001
```

### Debug Mode

Enable verbose logging in backend:

```typescript
// src/services/executionService.ts
console.log('Debug: Processing record', record.id);
console.log('Debug: Generated IDs', Array.from(generatedIds.entries()));
```

---

## 📚 Additional Resources

### Example Data Structure

**Input (Elasticsearch JSON):**
```json
{
  "_id": "_h5rWJsBWoZxyggOp0001",
  "_index": "platforms.cicd.data-000008",
  "_source": {
    "@version": "1",
    "@timestamp": "2025-12-01T14:26:18.894Z",
    "eventData": {
      "type": "pipeline.test",
      "status": "success",
      "duration_ms": 45000,
      "timestamp_ms": 1764703578893
    },
    "testData": {
      "type": "UnitTest",
      "totalTests": 59,
      "testsFailed": 16,
      "testsPassed": 43
    },
    "pipelineData": {
      "pipelineId": "pipeline-5374",
      "gitURL": "https://github.com/project",
      "milestoneId": "MI83177-58"
    }
  }
}
```

**Output (Normalized SQL):**
```sql
-- document table
| id | src_index                    | version | timestamp           |
|----|------------------------------|---------|---------------------|
| 1  | platforms.cicd.data-000008   | 1       | 2025-12-01 14:26:18 |

-- event_data table
| id | document_id | type          | status  | duration_ms |
|----|-------------|---------------|---------|-------------|
| 1  | 1           | pipeline.test | success | 45000       |

-- event_test_data table
| id | event_data_id | type     | totalTests | testsFailed |
|----|---------------|----------|------------|-------------|
| 1  | 1             | UnitTest | 59         | 16          |

-- pipeline_data table
| id | event_data_id | pipelineId      | gitURL               |
|----|---------------|-----------------|----------------------|
| 1  | 1             | pipeline-5374   | https://github.com/  |
```

### Performance Tips

1. **Batch Size**: Adjust in `executionService.ts` (default: 100)
2. **Indexes**: Add indexes on frequently queried columns
3. **Partitioning**: Consider table partitioning for large datasets
4. **Archive Strategy**: Periodically archive old processed records

### Best Practices

1. **Test configurations** in dev before production
2. **Save multiple versions** of configs (v1, v2, production)
3. **Monitor logs** regularly
4. **Backup database** before major changes
5. **Document custom transformations** in config descriptions

---

## 📝 License

MIT License - See [LICENSE](LICENSE) file for details.

## 🤝 Contributing

Contributions are welcome! Please see [CONTRIBUTING.md](CONTRIBUTING.md) for details on:

- Code of conduct
- Development setup
- Submitting pull requests
- Reporting issues

### Quick Contribution Guide

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Run tests (`npm test` in both backend and frontend)
4. Commit your changes (`git commit -m 'Add amazing feature'`)
5. Push to the branch (`git push origin feature/amazing-feature`)
6. Open a Pull Request

All PRs must:
- ✅ Pass all existing tests
- ✅ Include tests for new functionality
- ✅ Maintain 100% test coverage on critical services
- ✅ Follow existing code style

---

## 🎉 Success Metrics

After setup, your daily ETL workflow:

- ⏱️ **Time**: Fully automated (0 manual time)
- 📊 **Records**: Processes 100-1000+ records daily
- 🎯 **Accuracy**: 100% data integrity with FK relationships
- 📈 **Scalability**: Handles growing data volumes
- 🔒 **Reliability**: Error handling and retry logic

**From 45-second manual workflow → Fully automated!** 🚀
