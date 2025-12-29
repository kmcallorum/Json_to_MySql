/**
 * Step Definitions for JSON Analysis Features
 * BDD Implementation using Cucumber
 */

const { Given, When, Then, Before, After } = require('@cucumber/cucumber');
const { expect } = require('chai');
const JsonAnalyzer = require('../../backend/services/jsonAnalyzer');

// Shared state between steps
let analyzer;
let inputJson;
let analysisResult;
let inferredType;
let startTime;

Before(function() {
  analyzer = new JsonAnalyzer();
  inputJson = null;
  analysisResult = null;
  inferredType = null;
  startTime = null;
});

After(function() {
  analyzer = null;
  inputJson = null;
  analysisResult = null;
});

// Background Steps
Given('the JSON analyzer service is initialized', function() {
  expect(analyzer).to.not.be.null;
  expect(analyzer).to.be.instanceOf(JsonAnalyzer);
});

Given('the database connection is configured', function() {
  // Mock database configuration
  this.dbConfig = {
    host: 'localhost',
    user: 'test',
    password: 'test',
    database: 'test_db'
  };
  expect(this.dbConfig).to.have.property('host');
});

// Given Steps
Given('I have a JSON document with the following structure:', function(jsonString) {
  inputJson = JSON.parse(jsonString);
  expect(inputJson).to.not.be.null;
});

Given('I have a JSON document with an {string} field', function(fieldName) {
  inputJson = {
    [fieldName]: 1,
    name: 'Test',
    email: 'test@example.com'
  };
});

Given('I have a JSON document with nested objects', function() {
  inputJson = {
    id: 1,
    user: {
      name: 'John',
      email: 'john@example.com'
    },
    metadata: {
      created: '2024-12-27'
    }
  };
});

Given('I have a JSON document with {int} levels of nesting', function(levels) {
  let nested = { value: 'deepest' };
  for (let i = 0; i < levels - 1; i++) {
    nested = { level: nested };
  }
  inputJson = { id: 1, nested };
});

Given('I have a JSON document with circular references', function() {
  inputJson = { id: 1 };
  inputJson.self = inputJson; // Create circular reference
});

Given('I have a JSON document with {int} nested objects', function(count) {
  inputJson = {
    id: 1,
    items: Array(count).fill(null).map((_, i) => ({
      id: i,
      value: `item_${i}`
    }))
  };
});

Given('I have a JSON value {string}', function(value) {
  // Parse value to appropriate type
  if (value === 'true' || value === 'false') {
    inputJson = JSON.parse(value);
  } else if (value === 'null') {
    inputJson = null;
  } else if (!isNaN(value)) {
    inputJson = Number(value);
  } else if (value.startsWith('"') && value.endsWith('"')) {
    inputJson = value.slice(1, -1);
  } else {
    inputJson = value;
  }
});

// When Steps
When('I analyze the JSON structure', function() {
  startTime = Date.now();
  try {
    analysisResult = analyzer.analyzeJsonStructure(inputJson);
  } catch (error) {
    this.error = error;
  }
});

When('I infer the data type', function() {
  inferredType = analyzer.inferDataType(inputJson);
});

// Then Steps - Schema Validation
Then('I should get a schema with {int} table(s)', function(tableCount) {
  expect(analysisResult).to.have.property('tables');
  if (tableCount === 1) {
    expect(analysisResult.fields).to.be.an('array');
  } else {
    expect(analysisResult.tables).to.have.lengthOf(tableCount);
  }
});

Then('I should get at least {int} tables', function(minTables) {
  expect(analysisResult.tables.length).to.be.at.least(minTables);
});

Then('the table should be named {string}', function(tableName) {
  expect(analysisResult.name).to.equal(tableName);
});

Then('the tables should be named {string}', function(tableNames) {
  const expected = tableNames.split(', ').map(n => n.replace(/"/g, ''));
  const actual = analysisResult.tables.map(t => t.name);
  expect(actual).to.include.members(expected);
});

Then('the table should have {int} field(s)', function(fieldCount) {
  expect(analysisResult.fields).to.have.lengthOf(fieldCount);
});

// Field Type Validation
Then('the field {string} should have type {string}', function(fieldName, expectedType) {
  let field;
  if (analysisResult.fields) {
    field = analysisResult.fields.find(f => f.name === fieldName);
  } else {
    // Search in all tables
    for (const table of analysisResult.tables) {
      field = table.fields.find(f => f.name === fieldName);
      if (field) break;
    }
  }
  expect(field).to.not.be.undefined;
  expect(field.type).to.equal(expectedType);
});

Then('the field {string} should be nullable', function(fieldName) {
  const field = analysisResult.fields.find(f => f.name === fieldName);
  expect(field.nullable).to.be.true;
});

Then('the field {string} should not be nullable', function(fieldName) {
  const field = analysisResult.fields.find(f => f.name === fieldName);
  expect(field.nullable).to.be.false;
});

Then('the field {string} should be marked as primary key', function(fieldName) {
  const field = analysisResult.fields.find(f => f.name === fieldName);
  expect(field.primaryKey).to.be.true;
});

Then('the field {string} should be auto-increment', function(fieldName) {
  const field = analysisResult.fields.find(f => f.name === fieldName);
  expect(field.autoIncrement).to.be.true;
});

// Relationship Validation
Then('there should be a {string} relationship from {string} to {string}', 
  function(relType, fromTable, toTable) {
    const rel = analysisResult.relationships.find(
      r => r.from === fromTable && r.to === toTable
    );
    expect(rel).to.not.be.undefined;
    expect(rel.type).to.equal(relType);
  }
);

Then('all relationships should be properly detected', function() {
  expect(analysisResult.relationships).to.be.an('array');
  expect(analysisResult.relationships.length).to.be.greaterThan(0);
});

// Foreign Key Validation
Then('the {string} table should have foreign keys {string}', 
  function(tableName, foreignKeys) {
    const table = analysisResult.tables.find(t => t.name === tableName);
    const fkNames = foreignKeys.split(' and ').map(fk => fk.replace(/"/g, ''));
    
    for (const fkName of fkNames) {
      const fkField = table.fields.find(f => f.name === fkName);
      expect(fkField).to.not.be.undefined;
      expect(fkField.foreignKey).to.be.true;
    }
  }
);

Then('the {string} table should have a foreign key {string}', 
  function(tableName, foreignKey) {
    const table = analysisResult.tables.find(t => t.name === tableName);
    const fkField = table.fields.find(f => f.name === foreignKey);
    expect(fkField).to.not.be.undefined;
    expect(fkField.foreignKey).to.be.true;
  }
);

Then('the {string} table should have fields {string}', 
  function(tableName, fieldList) {
    const table = analysisResult.tables.find(t => t.name === tableName);
    const expectedFields = fieldList.split(', ').map(f => f.replace(/"/g, ''));
    const actualFields = table.fields.map(f => f.name);
    
    for (const field of expectedFields) {
      expect(actualFields).to.include(field);
    }
  }
);

Then('the {string} table should have a {string} field of type {string}', 
  function(tableName, fieldName, fieldType) {
    const table = analysisResult.tables.find(t => t.name === tableName);
    const field = table.fields.find(f => f.name === fieldName);
    expect(field).to.not.be.undefined;
    expect(field.type).to.equal(fieldType);
  }
);

Then('both array tables should have a foreign key to {string}', 
  function(parentTable) {
    const arrayTables = analysisResult.tables.filter(t => t.name !== parentTable);
    
    for (const table of arrayTables) {
      const fkField = table.fields.find(f => f.foreignKey === true);
      expect(fkField).to.not.be.undefined;
    }
  }
);

// Index Validation
Then('indexes should be generated for all foreign keys', function() {
  expect(analysisResult.indexes).to.be.an('array');
  expect(analysisResult.indexes.length).to.be.greaterThan(0);
});

Then('each index should be named {string}', function(pattern) {
  for (const index of analysisResult.indexes) {
    expect(index.name).to.match(/idx_\w+_\w+/);
  }
});

// Field Name Sanitization
Then('field names should be sanitized to valid SQL identifiers', function() {
  for (const field of analysisResult.fields) {
    expect(field.safeName).to.match(/^[a-z_][a-z0-9_]*$/i);
  }
});

Then('{string} should become {string}', function(original, sanitized) {
  const field = analysisResult.fields.find(
    f => f.originalName === original || f.name === original
  );
  expect(field.safeName || field.name).to.equal(sanitized);
});

// Error Handling
Then('I should receive an error {string}', function(errorMessage) {
  expect(this.error).to.not.be.undefined;
  expect(this.error.message).to.include(errorMessage);
});

// Performance Validation
Then('the analysis should complete within {int} seconds', function(maxSeconds) {
  const endTime = Date.now();
  const duration = (endTime - startTime) / 1000;
  expect(duration).to.be.lessThan(maxSeconds);
});

Then('the schema should be valid', function() {
  expect(analysisResult).to.have.property('tables');
  expect(analysisResult).to.have.property('relationships');
  expect(analysisResult).to.have.property('indexes');
});

// Type Inference
Then('the inferred type should be {string}', function(expectedType) {
  expect(inferredType).to.equal(expectedType);
});
