Feature: JSON Structure Analysis
  As a developer
  I want to analyze JSON documents automatically
  So that I can generate SQL schemas without manual work

  Background:
    Given the JSON analyzer service is initialized
    And the database connection is configured

  Scenario: Analyze simple flat JSON structure
    Given I have a JSON document with the following structure:
      """
      {
        "id": 1,
        "name": "John Doe",
        "email": "john@example.com",
        "age": 30,
        "active": true
      }
      """
    When I analyze the JSON structure
    Then I should get a schema with 1 table
    And the table should be named "root"
    And the table should have 5 fields
    And the field "id" should have type "INT"
    And the field "name" should have type "VARCHAR(255)"
    And the field "email" should have type "VARCHAR(255)"
    And the field "age" should have type "INT"
    And the field "active" should have type "BOOLEAN"

  Scenario: Analyze nested JSON with objects
    Given I have a JSON document with the following structure:
      """
      {
        "id": 1,
        "user": {
          "name": "John Doe",
          "email": "john@example.com"
        },
        "metadata": {
          "created_at": "2024-12-27T10:00:00Z",
          "updated_at": "2024-12-27T12:00:00Z"
        }
      }
      """
    When I analyze the JSON structure
    Then I should get a schema with 3 tables
    And the tables should be named "root", "user", "metadata"
    And there should be a 1:1 relationship from "root" to "user"
    And there should be a 1:1 relationship from "root" to "metadata"
    And the "root" table should have foreign keys "user_id" and "metadata_id"

  Scenario: Analyze JSON with arrays of objects
    Given I have a JSON document with the following structure:
      """
      {
        "id": 1,
        "name": "Project Alpha",
        "tasks": [
          {
            "id": 101,
            "title": "Task 1",
            "status": "completed"
          },
          {
            "id": 102,
            "title": "Task 2",
            "status": "in-progress"
          }
        ]
      }
      """
    When I analyze the JSON structure
    Then I should get a schema with 2 tables
    And the tables should be named "root", "tasks"
    And there should be a 1:N relationship from "root" to "tasks"
    And the "tasks" table should have a foreign key "root_id"
    And the "tasks" table should have fields "id", "title", "status", "root_id"

  Scenario: Analyze JSON with arrays of primitives
    Given I have a JSON document with the following structure:
      """
      {
        "id": 1,
        "tags": ["javascript", "nodejs", "mysql"],
        "scores": [95, 87, 92]
      }
      """
    When I analyze the JSON structure
    Then I should get a schema with 3 tables
    And the "tags" table should have a "value" field of type "VARCHAR(255)"
    And the "scores" table should have a "value" field of type "INT"
    And both array tables should have a foreign key to "root"

  Scenario: Handle null and undefined values
    Given I have a JSON document with the following structure:
      """
      {
        "id": 1,
        "optional_field": null,
        "name": "Test"
      }
      """
    When I analyze the JSON structure
    Then the field "optional_field" should be nullable
    And the field "optional_field" should have type "TEXT"
    And the field "name" should not be nullable

  Scenario: Detect data types correctly
    Given I have a JSON document with the following structure:
      """
      {
        "integer": 42,
        "big_integer": 9999999999,
        "decimal": 42.5,
        "short_string": "hello",
        "long_string": "a very long string that exceeds 255 characters...",
        "boolean": true,
        "date": "2024-12-27T10:00:00Z",
        "timestamp": 1650945600000,
        "object": {"key": "value"},
        "array": [1, 2, 3]
      }
      """
    When I analyze the JSON structure
    Then the field "integer" should have type "INT"
    And the field "big_integer" should have type "BIGINT"
    And the field "decimal" should have type "DECIMAL(10,2)"
    And the field "short_string" should have type "VARCHAR(255)"
    And the field "long_string" should have type "TEXT"
    And the field "boolean" should have type "BOOLEAN"
    And the field "date" should have type "DATETIME"
    And the field "timestamp" should have type "BIGINT"
    And the field "object" should have type "JSON"
    And the field "array" should have type "JSON"

  Scenario: Handle deeply nested structures
    Given I have a JSON document with 5 levels of nesting
    When I analyze the JSON structure
    Then I should get at least 3 tables
    And all relationships should be properly detected
    And all foreign keys should be generated

  Scenario: Handle empty objects and arrays
    Given I have a JSON document with the following structure:
      """
      {
        "id": 1,
        "empty_object": {},
        "empty_array": []
      }
      """
    When I analyze the JSON structure
    Then I should get a schema with 1 table
    And the field "empty_object" should have type "JSON"
    And the field "empty_array" should have type "JSON"

  Scenario: Detect primary keys
    Given I have a JSON document with an "id" field
    When I analyze the JSON structure
    Then the "id" field should be marked as primary key
    And the "id" field should be auto-increment

  Scenario: Generate indexes for foreign keys
    Given I have a JSON document with nested objects
    When I analyze the JSON structure
    Then indexes should be generated for all foreign keys
    And each index should be named "idx_{table}_{column}"

  Scenario: Handle special characters in field names
    Given I have a JSON document with the following structure:
      """
      {
        "field-with-dash": 1,
        "field.with.dot": 2,
        "field with space": 3,
        "field_with_underscore": 4
      }
      """
    When I analyze the JSON structure
    Then field names should be sanitized to valid SQL identifiers
    And "field-with-dash" should become "field_with_dash"
    And "field.with.dot" should become "field_with_dot"
    And "field with space" should become "field_with_space"

  Scenario: Handle circular references
    Given I have a JSON document with circular references
    When I analyze the JSON structure
    Then I should receive an error "Circular reference detected"

  Scenario: Performance test with large documents
    Given I have a JSON document with 10000 nested objects
    When I analyze the JSON structure
    Then the analysis should complete within 5 seconds
    And the schema should be valid

  Scenario Outline: Infer correct SQL types for various values
    Given I have a JSON value <value>
    When I infer the data type
    Then the inferred type should be <sql_type>

    Examples:
      | value                    | sql_type      |
      | 42                       | INT           |
      | 2147483648               | BIGINT        |
      | 3.14                     | DECIMAL(10,2) |
      | "short text"             | VARCHAR(255)  |
      | "very long text..."      | TEXT          |
      | true                     | BOOLEAN       |
      | "2024-12-27T10:00:00Z"   | DATETIME      |
      | 1650945600000            | BIGINT        |
      | null                     | TEXT          |
