#!/bin/bash

# Daily ETL Script for JSON → SQL Flattening
# Usage: ./run-daily-etl.sh [config_name]

CONFIG_NAME="${1:-v1}"
API_URL="http://localhost:3001"

echo "🚀 Starting Daily ETL Process"
echo "📅 $(date)"
echo "⚙️  Config: $CONFIG_NAME"
echo ""

# Step 1: Load filter preset
echo "1️⃣  Loading filter preset..."
PRESET=$(curl -s "$API_URL/api/filters/presets/$CONFIG_NAME")
BASE_TABLE=$(echo $PRESET | jq -r '.baseTableName')
echo "   ✓ Loaded preset for table: $BASE_TABLE"

# Step 2: Discover fields
echo "2️⃣  Discovering fields..."
FIELDS=$(curl -s "$API_URL/api/analysis/discover-fields" \
  -H "Content-Type: application/json" \
  -d "{\"tableName\":\"${BASE_TABLE}_toprocess\"}")
FIELD_COUNT=$(echo $FIELDS | jq '.fields | length')
echo "   ✓ Discovered $FIELD_COUNT fields"

# Step 3: Load saved mapping config
echo "3️⃣  Loading saved mapping configuration..."
CONFIG=$(curl -s "$API_URL/api/mappings/configs/$CONFIG_NAME")
echo "   ✓ Loaded mapping config"

# Step 4: Execute flattening
echo "4️⃣  Executing flattening process..."
RESULT=$(curl -s "$API_URL/api/mappings/execute" \
  -H "Content-Type: application/json" \
  -d "$CONFIG")

# Parse results
PROCESSED=$(echo $RESULT | jq -r '.recordsProcessed // 0')
MOVED=$(echo $RESULT | jq -r '.recordsMoved // 0')

echo "   ✓ Processed: $PROCESSED records"
echo "   ✓ Moved: $MOVED records"
echo ""

# Check for errors
if [ "$PROCESSED" -eq 0 ] && [ "$MOVED" -eq 0 ]; then
  echo "⚠️  Warning: No records processed"
  exit 1
fi

echo "✅ ETL Complete!"
echo "📊 Summary:"
echo "   - Records processed: $PROCESSED"
echo "   - Records archived: $MOVED"
echo "   - Timestamp: $(date)"

exit 0
