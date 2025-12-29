#!/bin/bash

LOG_FILE="etl.log"

echo "📊 ETL Monitoring Dashboard"
echo "======================================"
echo ""

echo "✅ Last 5 Successful Runs:"
grep "ETL Complete" $LOG_FILE | tail -5
echo ""

echo "❌ Recent Errors:"
grep "ETL Failed" $LOG_FILE | tail -5
echo ""

echo "📈 Database Stats:"
mysql -u root -proot test_json -e "
SELECT 
  'toprocess' as table_name, COUNT(*) as count FROM platforms_cicd_data_toprocess
UNION ALL
SELECT 
  'processed' as table_name, COUNT(*) as count FROM platforms_cicd_data;
" 2>/dev/null
