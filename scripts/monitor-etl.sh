#!/bin/bash

# ETL Monitoring Dashboard
# Usage: ./monitor-etl.sh

LOG_FILE="etl.log"

echo "📊 ETL Monitoring Dashboard"
echo "======================================"
echo ""

if [ ! -f "$LOG_FILE" ]; then
  echo "⚠️  Log file not found: $LOG_FILE"
  echo "Run the ETL at least once to generate logs"
  exit 1
fi

echo "✅ Last 5 Successful Runs:"
grep "ETL Complete" $LOG_FILE | tail -5
echo ""

echo "❌ Recent Errors:"
ERRORS=$(grep "ETL Failed" $LOG_FILE | tail -5)
if [ -z "$ERRORS" ]; then
  echo "No errors found"
else
  echo "$ERRORS"
fi
echo ""

echo "📈 Database Stats:"
echo "Checking database connection..."
mysql -u root -proot test_json -e "
SELECT 
  'toprocess' as table_name, COUNT(*) as count FROM platforms_cicd_data_toprocess
UNION ALL
SELECT 
  'processed' as table_name, COUNT(*) as count FROM platforms_cicd_data;
" 2>/dev/null || echo "⚠️  Could not connect to database"

echo ""
echo "Last log entry:"
tail -1 $LOG_FILE
