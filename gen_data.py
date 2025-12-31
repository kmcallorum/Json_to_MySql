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

# More realistic variations based on DumpFromEndpoint.txt
event_types = [
    "pipeline.quality_scan.sonar",
    "pipeline.build",
    "pipeline.deploy",
    "pipeline.test.unit",
    "pipeline.test.integration",
    "pipeline.scan.security"
]

statuses = ["SUCCESS", "FAILURE", "UNSTABLE", "ABORTED"]

test_types = ["AcceptanceTest", "UnitTest", "IntegrationTest", "PerformanceTest", "SecurityTest"]

# Realistic project keys from real data
project_keys = [
    "com.optum.acet:acet-salesforce",
    "com.optum.advanceddevelopment.bne:bne-api",
    "com.optum.caip:caip-service",
    "com.optum.rally:rally-integration",
    "com.optum.uhc:member-services"
]

# Real branch name patterns
branch_patterns = [
    "master",
    "main",
    "develop",
    lambda: f"DE{random.randint(1000000, 9999999)}_{random.choice(['bug_fix', 'feature', 'enhancement', 'refactor'])}",
    lambda: f"feature/{random.choice(['auth', 'api', 'ui', 'data', 'security'])}",
    lambda: f"PR-{random.randint(1000, 99999)}",
    lambda: f"bugfix/{random.choice(['login', 'payment', 'data', 'ui', 'api'])}"
]

# Real ca_agile_id patterns
ca_agile_patterns = [
    "poc",
    lambda: f"{random.randint(100000, 999999)}{random.randint(100000, 999999)}ud",
    lambda: f"agile-{random.randint(1000, 9999)}"
]

# Real Jenkins URL patterns
jenkins_servers = [
    "acet-jenkins-hcc.optum.com",
    "caip-ghec-jenkins.optum.com",
    "jenkins.optum.com",
    "rally-jenkins.optum.com"
]

def generate_ask_ids():
    """Generate realistic ASK IDs like UHGWM110-014781"""
    if random.random() < 0.3:  # 30% single
        return [f"UHGWM{random.randint(100, 999)}-{random.randint(100000, 999999)}"]
    else:  # 70% multiple
        count = random.randint(2, 4)
        return [f"UHGWM{random.randint(100, 999)}-{random.randint(100000, 999999)}" for _ in range(count)]

def generate_milestone_id():
    """Sometimes NULL"""
    if random.random() < 0.2:  # 20% NULL
        return None
    return f"MI{random.randint(10000, 99999)}-{random.randint(10, 99)}"

def generate_git_commit():
    """Generate realistic 40-character SHA commit"""
    return ''.join(random.choices('abcdef0123456789', k=40))

def generate_branch_name():
    """Generate realistic branch name"""
    pattern = random.choice(branch_patterns)
    if callable(pattern):
        return pattern()
    return pattern

def generate_ca_agile_id():
    """Generate realistic caAgileId"""
    pattern = random.choice(ca_agile_patterns)
    if callable(pattern):
        return pattern()
    return pattern

def generate_jenkins_url(project_key, branch, pipeline_id):
    """Generate realistic Jenkins URL"""
    server = random.choice(jenkins_servers)

    # Extract project name from key
    parts = project_key.split(':')
    project_name = parts[-1] if len(parts) > 1 else project_key

    # Create job path
    job_parts = [
        random.choice(["StatusChecks", "Customer-Enablement", "Deploy", "Build", "Test"]),
        project_name,
        branch.replace('/', '-') if '/' in branch else branch
    ]

    job_path = "/job/".join(job_parts)
    return f"https://{server}/job/{job_path}/{pipeline_id}/"

def generate_sonar_data():
    """Generate realistic Sonar quality scan data"""
    return {
        "scanTool": "SonarQube",
        "targetQualityGate": random.choice(["-1", "1", "2"]),
        "loc": random.randint(100, 10000),
        "isPreview": False,
        "additionalMetrics": None,
        "unitTestMetrics": f"[coverage:{random.randint(-1, 100)}, new_coverage:{random.randint(-1, 100)}, skipped_tests:{random.randint(-1, 10)}, test_errors:{random.randint(-1, 5)}, test_failures:{random.randint(-1, 5)}, tests:{random.randint(-1, 100)}]",
        "sonarMetrics": f"[blocker_violations:{random.randint(0, 5)}, critical_violations:{random.randint(0, 10)}, major_violations:{random.randint(0, 20)}, new_blocker_violations:{random.randint(0, 5)}, new_critical_violations:{random.randint(0, 10)}, new_major_violations:{random.randint(0, 20)}]",
        "sonarQualityGate": random.choice(["1", "2", "3"])
    }

def generate_pipeline_libraries():
    """Generate realistic pipeline library entries"""
    libraries = [
        {"id": "com.optum.jenkins.pipeline.library-ghec", "version": random.choice(["master", "main", "unknown"])},
        {"id": "com.optum.jenkins.pipeline.library", "version": random.choice(["master", "v1.0", "v2.0"])},
        {"id": "com.optum.caip.library", "version": f"{random.randint(1, 3)}.{random.randint(0, 9)}"}
    ]

    # Return 1-2 libraries
    return random.sample(libraries, random.randint(1, 2))

def generate_git_url(project_key):
    """Generate realistic Git URL"""
    # Extract project/repo name
    parts = project_key.split(':')
    repo_name = parts[-1] if len(parts) > 1 else project_key

    org = random.choice([
        "uhc-tech-employer-individual",
        "optum-eeps",
        "optum-caip",
        "optum-rally"
    ])

    # Sometimes with token, sometimes without
    if random.random() < 0.5:
        token = ''.join(random.choices('abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789', k=40))
        return f"https://build_user:ghp_{token}@github.com/{org}/{repo_name}.git"
    else:
        return f"https://github.com/{org}/{repo_name}.git"

def generate_record(index):
    base_time = datetime.now() - timedelta(days=random.randint(0, 30))
    timestamp_ms = int(base_time.timestamp() * 1000)

    event_type = random.choice(event_types)
    project_key = random.choice(project_keys)
    branch = generate_branch_name()
    pipeline_id = str(random.randint(1, 999))

    has_test_data = "test" in event_type
    has_sonar_data = "sonar" in event_type or "quality_scan" in event_type

    record = {
        "_id": f"{''.join(random.choices('abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789', k=16))}",
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
                "duration_ms": random.randint(5000, 300000),
                "timestamp_ms": timestamp_ms,
                "reportingTool": "Jenkins",
                "reportingToolURL": generate_jenkins_url(project_key, branch, pipeline_id)
            },
            "@timestamp": base_time.strftime("%Y-%m-%dT%H:%M:%S.%f") + "Z",
            "pipelineData": {
                "askId": generate_ask_ids(),
                "gitURL": generate_git_url(project_key),
                "caAgileId": generate_ca_agile_id(),
                "gitBranch": branch,
                "gitCommit": generate_git_commit(),
                "isTestMode": random.choice([True, False]),
                "pipelineId": pipeline_id,
                "projectKey": project_key,
                "pipelineLibraries": generate_pipeline_libraries()
            }
        },
        "_ignored": ["event.original.keyword"]
    }

    # Add testData only if event type contains 'test'
    if has_test_data:
        total_tests = random.randint(10, 200)
        tests_failed = random.randint(0, int(total_tests * 0.1))
        tests_passed = total_tests - tests_failed

        record["_source"]["testData"] = {
            "type": random.choice(test_types),
            "resultsURL": f"https://testresults.uhg.com/integration-{random.randint(100000, 999999)}",
            "totalTests": total_tests,
            "testsFailed": tests_failed,
            "testsPassed": tests_passed,
            "testsExecuted": total_tests
        }

    # Add sonar data if quality scan
    if has_sonar_data:
        record["_source"]["sonarData"] = generate_sonar_data()
        record["_source"]["qualityScanData"] = {
            "resultsURL": f"https://sonar.optum.com/dashboard?id={project_key}"
        }

    # Create the original event string (matches what's in event.original)
    event_obj = {
        "eventData": record["_source"]["eventData"],
        "pipelineData": record["_source"]["pipelineData"]
    }

    if has_test_data:
        event_obj["testData"] = record["_source"]["testData"]

    if has_sonar_data:
        event_obj["sonarData"] = record["_source"]["sonarData"]
        event_obj["qualityScanData"] = record["_source"]["qualityScanData"]

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
print(f"- NULL milestoneId records: {sum(1 for r in records if r['_source']['pipelineData'].get('milestoneId') is None)}")

print(f"\nEvent type distribution:")
event_type_counts = {}
for r in records:
    et = r['_source']['eventData']['type']
    event_type_counts[et] = event_type_counts.get(et, 0) + 1
for et, count in sorted(event_type_counts.items()):
    print(f"  {et}: {count}")

print(f"\nRecords with sonar data: {sum(1 for r in records if 'sonarData' in r['_source'])}")
print(f"Records with test data: {sum(1 for r in records if 'testData' in r['_source'])}")
