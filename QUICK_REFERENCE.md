# Quick Reference Card

## 🚀 Daily Operations

```bash
# Start services
cd backend && npm run dev &
cd frontend && npm run dev &

# Run ETL manually
node run-daily-etl-v2.js production

# Check status
./monitor-etl.sh

# View logs
tail -f etl.log
```

## 📊 Common SQL Queries

```sql
-- Check pending records
SELECT COUNT(*) FROM platforms_cicd_data_toprocess;

-- Check processed records
SELECT COUNT(*) FROM platforms_cicd_data;

-- View latest
SELECT * FROM document ORDER BY id DESC LIMIT 10;

-- Check relationships
SELECT d.id, ed.id, etd.id, pd.id
FROM document d
JOIN event_data ed ON ed.document_id = d.id
JOIN event_test_data etd ON etd.event_data_id = ed.id
JOIN pipeline_data pd ON pd.event_data_id = ed.id;
```

## 🔧 Troubleshooting

| Problem | Solution |
|---------|----------|
| Config not found | Check `curl http://localhost:3001/api/mappings/configs` |
| Duplicate errors | Records already processed (not an error) |
| FK errors | Check `SHOW CREATE TABLE table_name` |
| No records | Check filter conditions match data |
| Backend down | Restart with `npm run dev` |

## 📞 Quick Commands

```bash
# Health check
curl http://localhost:3001/health

# List configs
curl http://localhost:3001/api/mappings/configs | jq .

# Test ETL
node run-daily-etl-v2.js production

# Monitor
watch -n 5 './monitor-etl.sh'
```

## 🎯 Cron Schedule Examples

```bash
# Daily at 2 AM
0 2 * * *

# Every 6 hours
0 */6 * * *

# Weekdays at 6 AM
0 6 * * 1-5

# Every hour
0 * * * *
```

## 📈 Success Indicators

✅ **Healthy System:**
- Backend responds to health check
- ETL completes in < 1 minute
- 0 records in _toprocess after run
- No FK constraint errors
- Logs show "ETL Complete!"

⚠️ **Needs Attention:**
- Growing _toprocess table
- Repeated FK errors
- ETL timeouts
- Duplicate entry warnings (many)
