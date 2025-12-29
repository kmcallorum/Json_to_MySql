import json
import random
import mysql.connector
import os
from dotenv import load_dotenv
from datetime import datetime, timedelta

load_dotenv()

# Database connection
db_config = {
    'host': os.getenv('DB_HOST', 'localhost'),
    'user': os.getenv('DB_USER', 'root'),
    'password': os.getenv('DB_PASSWORD'),
    'database': os.getenv('DB_NAME', 'test_json')
}

# Variations
event_types = ["pipeline.test", "pipeline.build", "pipeline.deploy", "pipeline.scan", "pipeline.analyze"]
statuses = ["pass", "fail", "success", "error", "warning"]
test_types = ["AcceptanceTest", "UnitTest", "IntegrationTest", "PerformanceTest", "SecurityTest"]
tools = ["maven", "gradle", "jenkins", "bamboo", "azure-devops"]
project_keys = ["myproject", "project-alpha", "backend-api", "frontend-ui", "data-pipeline"]
branches = ["main", "develop", "feature/auth", "bugfix/login", "release/v2.0"]

def generate_ask_ids():
    """Sometimes single string, sometimes array of multiple"""
    if random.random() < 0.3:  # 30% single string
        return [f"ask-{random.randint(1000, 9999)}"]
    else:  # 70% multiple
        count = random.randint(2, 4)
        return [f"ask-{random.randint(1000, 9999)}" for _ in range(count)]

def generate_milestone_id():
    """Sometimes NULL"""
    if random.random() < 0.2:  # 20% NULL
        return None
    return f"MI{random.randint(10000, 99999)}-{random.randint(10, 99)}"

def generate_record(index):
    base_time = datetime.now() - timedelta(days=random.randint(0, 30))
    timestamp_ms = int(base_time.timestamp() * 1000)
    
    event_type = random.choice(event_types)
    has_test_data = event_type == "pipeline.test"
    
    record = {
        "_id": f"_h5rWJsBWoZxyggOp{index:04d}",
        "_index": "platforms.cicd.data-000008",
        "_score": 1.0,
        "_source": {
            "event": {
                "original": ""  # Will be filled below
            },
            "@version": "1",
            "eventData": {
                "type": event_type,
                "status": random.choice(statuses),
                "duration_ms": random.randint(1000, 300000),
                "timestamp_ms": timestamp_ms,
                "reportingTool": random.choice(["atool", "jenkins", "sonar", "nexus"]),
                "reportingToolURL": f"http://test.optum.com/test-{random.randint(100, 999)}"
            },
            "@timestamp": base_time.isoformat() + "Z",
            "pipelineData": {
                "askId": generate_ask_ids(),
                "gitURL": f"https://github.optum.com/{random.choice(project_keys)}",
                "caAgileId": f"agile-{random.randint(1000, 9999)}",
                "eventTool": random.choice(tools),
                "gitBranch": random.choice(branches),
                "gitCommit": f"commit-{''.join(random.choices('abcdefghijklmnopqrstuvwxyz0123456789', k=7))}",
                "isTestMode": random.choice([True, False]),
                "pipelineId": f"pipeline-{random.randint(1000, 9999)}",
                "projectKey": random.choice(project_keys),
                "milestoneId": generate_milestone_id(),
                "eventToolVersion": f"{random.randint(1, 5)}.{random.randint(0, 9)}.{random.randint(0, 20)}",
                "pipelineLibraries": [
                    {
                        "id": f"library{i}",
                        "version": f"{random.randint(1, 3)}.{random.randint(0, 9)}"
                    } for i in range(1, random.randint(1, 4))
                ]
            }
        },
        "_ignored": ["event.original.keyword"]
    }
    
    # Add testData only if event type is pipeline.test
    if has_test_data:
        total_tests = random.randint(5, 100)
        tests_failed = random.randint(0, total_tests)
        tests_passed = total_tests - tests_failed
        
        record["_source"]["testData"] = {
            "type": random.choice(test_types),
            "resultsURL": f"https://testresults.uhg.com/integration-{random.randint(100000, 999999)}",
            "totalTests": total_tests,
            "testsFailed": tests_failed,
            "testsPassed": tests_passed,
            "testsExecuted": total_tests
        }
    
    # Create the original event string
    event_obj = {
        "eventData": record["_source"]["eventData"],
        "pipelineData": record["_source"]["pipelineData"]
    }
    if has_test_data:
        event_obj["testData"] = record["_source"]["testData"]
    
    record["_source"]["event"]["original"] = json.dumps(event_obj)
    
    return record

def insert_to_mysql(records):
    """Insert records into MySQL"""
    conn = mysql.connector.connect(**db_config)
    cursor = conn.cursor()
    
    insert_query = """
    INSERT INTO platforms_cicd_data_toprocess (id, content)
    VALUES (%s, %s)
    """
    
    for record in records:
        cursor.execute(insert_query, (
            record['_id'],
            json.dumps(record)  # Store entire record as JSON
        ))
    
    conn.commit()
    print(f"Inserted {len(records)} records into database")
    cursor.close()
    conn.close()

# Generate 100 records
records = [generate_record(i) for i in range(100)]

# Save to file
with open('mock_es_records.json', 'w') as f:
    json.dump(records, f, indent=2)

print(f"Generated 100 mock records to mock_es_records.json")

# Insert to database
try:
    insert_to_mysql(records)
    print("Database insertion successful!")
except mysql.connector.Error as err:
    print(f"Database error: {err}")

print(f"\nSample variations:")
print(f"- Single askId records: {sum(1 for r in records if len(r['_source']['pipelineData']['askId']) == 1)}")
print(f"- Multiple askId records: {sum(1 for r in records if len(r['_source']['pipelineData']['askId']) > 1)}")
print(f"- NULL milestoneId records: {sum(1 for r in records if r['_source']['pipelineData']['milestoneId'] is None)}")
print(f"\nEvent type distribution:")
event_type_counts = {}
for r in records:
    et = r['_source']['eventData']['type']
    event_type_counts[et] = event_type_counts.get(et, 0) + 1
for et, count in sorted(event_type_counts.items()):
    print(f"  {et}: {count}")
