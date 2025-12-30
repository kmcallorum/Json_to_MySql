# Elasticsearch to MySQL Migration CLI


A robust, production-grade Python CLI tool for migrating data from Elasticsearch to MySQL, supporting daily incremental loads, duplicate avoidance, secure automation, and detailed logging. Designed for large-scale, repeatable migrations with operational safety and auditability in mind.

## Project Purpose

This tool enables reliable, automated migration of data from Elasticsearch indices to MySQL tables, with features for:
- Daily incremental migration (e.g., 12:00 to 12:00 Central)
- Duplicate avoidance across staging and main tables
- API key authentication for Elasticsearch
- Multi-threaded, batched inserts for high throughput
- Robust error handling and detailed logging for debugging and audit
- Secure handling of secrets via environment variables

## Key Components

- **migrate.py**: Main migration script. Handles ES scroll, batching, threading, API key auth, and MySQL inserts (with `INSERT IGNORE` for duplicate skipping).
- **resume_from_logs.py**: Utility to resume interrupted migrations by parsing logs.
- **daily_run.sh**: Automation script for daily runs, sourcing secrets from environment variables and `.env` file.
- **Dockerfile**: Containerizes the tool for portable, reproducible runs.
- **requirements.txt / pyproject.toml**: Python dependencies.

## Security & Secrets Management

**Never commit secrets or credentials to version control.**

All sensitive values (API keys, DB credentials, etc.) are loaded from environment variables, optionally via a `.env` file (which must be listed in `.gitignore`). Example `.env`:

```env
ES_URL="http://your-es-url"
API_KEY="your-api-key"
DB_HOST="your-db-host"
DB_USER="your-db-user"
DB_PASS="your-db-password"
DB_NAME="your-db-name"
DB_TABLE="your-db-table"
```

**Add `.env` and `daily_run.sh` to `.gitignore` to prevent accidental commits.**

## Automation & Scheduling

To automate daily runs (e.g., after 12 PM Central), use `cron` with the following entry:

```
CRON_TZ=America/Chicago
1 12 * * * /Users/kmcallo@optum.com/git/es-to-mysql-cli/daily_run.sh >> /Users/kmcallo@optum.com/git/es-to-mysql-cli/daily_run.log 2>&1
```

`daily_run.sh` will:
- Source the Python virtual environment
- Load secrets from `.env` (if present)
- Run `migrate.py` with all arguments from environment variables
- Log all output and errors with timestamps for debugging

## Detailed Logging & Debugging

All output (stdout and stderr) is logged to `daily_run.log` with timestamps and exit codes. This enables easy debugging of failures and auditing of successful runs. Example log snippet:

```
----- 2025-12-11 12:01:00 START -----
... migration output ...
Exit code: 0
----- 2025-12-11 12:10:00 END -----
```

## Duplicate Avoidance & Data Integrity

- Uses `INSERT IGNORE` to skip duplicate records by primary key (`id`)
- SQL queries provided for post-migration duplicate detection across staging (`platforms_cicd_data_toprocess`) and main (`platforms_cicd_data`) tables
- Supports daily incremental loads by date range

## Table Schema

Tables must have:
- `id` (VARCHAR, PK): ES document `_id`
- `content` (JSON): Full ES document

## Example Usage

See `daily_run.sh` for a template. All arguments are passed via environment variables for security.

## Best Practices

- Never commit secrets or `.env` to git
- Use environment variables for all credentials
- Monitor `daily_run.log` for failures
- Test cron jobs by setting a near-future time

## For more details, see the rest of this README and the codebase.

## Overview

This tool efficiently transfers data from Elasticsearch indices to MySQL databases using Elasticsearch's scroll API for pagination and multi-threaded workers for parallel database inserts. It's designed to handle large datasets with features like duplicate detection, error logging, and flexible query options.

## Features

- **Elasticsearch Scroll API**: Efficient pagination for large datasets
- **Multi-threaded Inserts**: Configurable worker threads for parallel MySQL inserts
- **Flexible Querying**: Support for both range queries and match_all queries
- **Duplicate Handling**: Automatically skips duplicate IDs during insertion
- **Comprehensive Logging**: File and console logging with detailed error tracking
- **Configurable Batch Size**: Adjustable batch sizes for optimal performance
- **JSON Preservation**: Stores entire Elasticsearch documents as JSON in MySQL

## Requirements

- Python 3.9+
- Elasticsearch cluster (accessible via HTTP/HTTPS)
- MySQL database
- Required Python packages:
  - `requests`
  - `mysql-connector-python==9.1.0`
  - `elasticsearch==8.11.0`

## Installation

### Using pip (from source)

```bash
# Clone the repository
cd es-to-mysql-cli

# Install dependencies
pip install -r requirements.txt

# Install the package
pip install -e .
```

### Using Docker

```bash
# Build the Docker image
docker build -t es-to-mysql-cli .

# Run with Docker
docker run es-to-mysql-cli [arguments]
```

## Database Setup

Before running the migration, ensure your MySQL table exists with the following schema:

```sql
CREATE TABLE your_table (
    id VARCHAR(255) PRIMARY KEY,
    content JSON NOT NULL
);
```

The tool expects:
- `id`: Primary key field that stores the Elasticsearch document `_id`
- `content`: JSON field that stores the entire Elasticsearch document as JSON

## Usage

### Basic Command Structure

```bash
python migrate.py \
  --es_url "http://elasticsearch-host:9200/index_name/_search" \
  --es_user "username" \
  --es_pass "password" \
  --db_host "mysql-host" \
  --db_user "mysql-user" \
  --db_pass "mysql-password" \
  --db_name "database_name" \
  --db_table "table_name" \
  [OPTIONS]
```

### Command-Line Arguments

#### Required Arguments

| Argument | Description | Example |
|----------|-------------|---------|
| `--es_url` | Elasticsearch URL including index path | `http://localhost:9200/logs/_search` |
| `--es_user` | Elasticsearch username | `elastic` |
| `--es_pass` | Elasticsearch password | `your_password` |
| `--db_host` | MySQL host address | `localhost` |
| `--db_user` | MySQL username | `root` |
| `--db_pass` | MySQL password | `mysql_password` |
| `--db_name` | MySQL database name | `my_database` |
| `--db_table` | MySQL table name | `elasticsearch_data` |

#### Optional Arguments

| Argument | Description | Default | Example |
|----------|-------------|---------|---------|
| `--gte` | Range query start date (ISO 8601) | None | `2020-06-01T00:00:00` |
| `--lte` | Range query end date (ISO 8601) | None | `2020-06-30T23:59:59` |
| `--match_all` | Use match_all query instead of range | `false` | `--match_all` |
| `--threads` | Number of worker threads for inserts | `5` | `--threads 10` |
| `--batch_size` | Elasticsearch scroll batch size | `1000` | `--batch_size 5000` |

### Usage Examples

#### Example 1: Range Query with Date Filter

```bash
python migrate.py \
  --es_url "http://localhost:9200/logs-2020/_search" \
  --es_user "elastic" \
  --es_pass "changeme" \
  --db_host "localhost" \
  --db_user "root" \
  --db_pass "mysql123" \
  --db_name "logs_db" \
  --db_table "log_entries" \
  --gte "2020-06-01T00:00:00" \
  --lte "2020-06-30T23:59:59" \
  --threads 10 \
  --batch_size 2000
```

This migrates all documents with `@timestamp` between June 1-30, 2020, using 10 worker threads and batches of 2000 documents.

#### Example 2: Match All Query

```bash
python migrate.py \
  --es_url "http://localhost:9200/products/_search" \
  --es_user "elastic" \
  --es_pass "changeme" \
  --db_host "localhost" \
  --db_user "root" \
  --db_pass "mysql123" \
  --db_name "catalog_db" \
  --db_table "products" \
  --match_all \
  --threads 5 \
  --batch_size 1000
```

This migrates all documents from the index without any filtering.

#### Example 3: Using as Installed CLI Tool

If installed via `setup.py`, you can use the `melasmigrate` command:

```bash
melasmigrate \
  --es_url "http://localhost:9200/index/_search" \
  --es_user "user" \
  --es_pass "pass" \
  --db_host "localhost" \
  --db_user "root" \
  --db_pass "pass" \
  --db_name "db" \
  --db_table "table" \
  --match_all
```

## How It Works

1. **Query Construction**: Based on arguments, builds either a range query (filtering by `@timestamp`) or a match_all query
2. **Worker Thread Initialization**: Spawns specified number of worker threads, each with its own MySQL connection
3. **Elasticsearch Scrolling**: 
   - Initiates scroll with batch size
   - Fetches documents in batches
   - Maintains scroll context for 2 minutes
4. **Queue-Based Processing**: Documents are queued and processed by worker threads in parallel
5. **MySQL Insertion**: Each worker inserts documents with duplicate detection
6. **Graceful Shutdown**: After all documents are processed, workers complete remaining tasks and close connections

## Logging

The tool provides comprehensive logging to both console and file:

- **Log File**: `es_to_mysql.log` (created in the current directory)
- **Log Levels**: INFO for progress, WARNING for duplicates, ERROR for failures
- **Log Format**: `%(asctime)s [%(levelname)s] %(message)s`

### Sample Log Output

```
2025-12-02 10:30:15 [INFO] Starting Elasticsearch scroll...
2025-12-02 10:30:16 [INFO] Queued 1000 records. Total so far: 1000
2025-12-02 10:30:17 [WARNING] Duplicate ID skipped: abc123
2025-12-02 10:30:18 [INFO] Queued 1000 records. Total so far: 2000
2025-12-02 10:30:25 [ERROR] Error inserting ID xyz789: Connection timeout
2025-12-02 10:35:42 [INFO] Completed. Total inserted (including duplicates skipped): 50000
```

## Error Handling

- **Duplicate Keys**: Automatically skipped with WARNING log
- **Insert Errors**: Logged with ERROR level, including document ID and error details
- **Elasticsearch Errors**: Scroll failures are logged with status code and response text
- **Non-blocking**: Individual document errors don't stop the migration process

## Performance Tuning

### Recommended Settings by Data Size

| Data Size | `--batch_size` | `--threads` |
|-----------|----------------|-------------|
| < 100K docs | 1000 | 3-5 |
| 100K - 1M docs | 2000-5000 | 5-10 |
| > 1M docs | 5000-10000 | 10-20 |

### Considerations

- **Thread Count**: Balance between MySQL connection limits and CPU cores
- **Batch Size**: Larger batches reduce API calls but increase memory usage
- **Network**: Ensure sufficient bandwidth between ES, the tool, and MySQL
- **MySQL Configuration**: Adjust `max_connections` if using many threads

## Utility Scripts

### resume_from_logs.py

A utility script to help resume interrupted migrations by analyzing log files:

```bash
python resume_from_logs.py
```

This script parses `migration.log` to find the last successfully processed batch, helping you determine where to resume a failed migration.

## Docker Deployment

### Building the Image

```bash
docker build -t es-to-mysql-cli:latest .
```

### Running in Docker

```bash
docker run --rm \
  -v $(pwd)/logs:/app/logs \
  es-to-mysql-cli:latest \
  --es_url "http://host.docker.internal:9200/index/_search" \
  --es_user "elastic" \
  --es_pass "password" \
  --db_host "host.docker.internal" \
  --db_user "root" \
  --db_pass "mysql_pass" \
  --db_name "db" \
  --db_table "table" \
  --match_all
```

## Troubleshooting

### Common Issues

**Issue**: "Initial scroll request failed: 401"  
**Solution**: Verify Elasticsearch credentials and URL

**Issue**: "Access denied for user"  
**Solution**: Check MySQL credentials and ensure user has INSERT privileges

**Issue**: "Duplicate ID skipped" appearing frequently  
**Solution**: This is normal for re-runs; use `REPLACE INTO` instead of `INSERT INTO` if you want to update existing records

**Issue**: Process hangs or is very slow  
**Solution**: 
- Reduce `--threads` if hitting connection limits
- Reduce `--batch_size` if experiencing memory issues
- Check network connectivity and latency

**Issue**: "scroll_id not found"  
**Solution**: Increase scroll timeout if processing is slow, or reduce batch size

## Architecture

```
┌─────────────────────┐
│  Elasticsearch      │
│  (Scroll API)       │
└──────────┬──────────┘
           │
           │ Fetch batches
           │
           ▼
┌─────────────────────┐
│   Main Thread       │
│   - Query ES        │
│   - Manage scroll   │
│   - Queue documents │
└──────────┬──────────┘
           │
           │ Queue
           │
           ▼
┌─────────────────────┐
│  Worker Threads     │
│  (Thread Pool)      │
│  - Pop from queue   │
│  - Insert to MySQL  │
│  - Handle errors    │
└──────────┬──────────┘
           │
           │ INSERT
           ▼
┌─────────────────────┐
│   MySQL Database    │
│   (id, content)     │
└─────────────────────┘
```

## Contributing

This project is maintained by Kevin P McAllorun. For contributions or issues, please follow standard Git workflow practices.

## License

Internal use - Optum EEPS

## Package Information

- **Package Name**: melasmigrate
- **Version**: 1.0.0
- **Author**: Kevin P McAllorun
- **Description**: CLI tool to migrate data from Elasticsearch to MySQL with checkpointing and email summary
