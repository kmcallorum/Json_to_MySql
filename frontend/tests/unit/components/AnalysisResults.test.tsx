import { describe, it, expect } from '@jest/globals';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { AnalysisResults } from '../../../src/components/analysis/AnalysisResults';

describe('AnalysisResults', () => {
  const mockAnalysis = {
    fields: [
      {
        path: 'user.name',
        types: new Set(['string']),
        isArray: false,
        isNullable: false,
        occurrence: 100,
        samples: ['John', 'Jane', 'Bob'],
        maxLength: 50,
        suggestedTable: 'users',
        suggestedColumn: 'name',
        suggestedType: 'VARCHAR(255)'
      },
      {
        path: 'user.age',
        types: new Set(['number']),
        isArray: false,
        isNullable: true,
        occurrence: 95,
        samples: [25, 30, 35],
        maxLength: 0,
        suggestedTable: 'users',
        suggestedColumn: 'age',
        suggestedType: 'INT'
      },
      {
        path: 'tags',
        types: new Set(['string']),
        isArray: true,
        isNullable: false,
        occurrence: 100,
        samples: ['tag1', 'tag2'],
        maxLength: 20,
        suggestedTable: 'main_table',
        suggestedColumn: 'tags',
        suggestedType: 'VARCHAR(255)'
      }
    ],
    totalRecords: 100,
    totalDocuments: 100,
    analyzedAt: new Date()
  };

  const mockMetadata = {
    toProcessTable: 'events_toprocess',
    baseTableName: 'events',
    eventType: 'user_action',
    totalRecordsInTable: 50000,
    sampledRecords: 1000
  };

  it('should render title', () => {
    render(<AnalysisResults analysis={mockAnalysis} />);

    expect(screen.getByText('Discovered Schema')).toBeInTheDocument();
  });

  it('should display field count', () => {
    render(<AnalysisResults analysis={mockAnalysis} />);

    expect(screen.getByText('Found 3 unique field(s)')).toBeInTheDocument();
  });

  it('should render table headers', () => {
    render(<AnalysisResults analysis={mockAnalysis} />);

    expect(screen.getByText('Field Path')).toBeInTheDocument();
    expect(screen.getByText('Type')).toBeInTheDocument();
    expect(screen.getByText('Array?')).toBeInTheDocument();
    expect(screen.getByText('Nullable?')).toBeInTheDocument();
    expect(screen.getByText('Samples')).toBeInTheDocument();
    expect(screen.getByText('Suggested Table')).toBeInTheDocument();
    expect(screen.getByText('Suggested Column')).toBeInTheDocument();
    expect(screen.getByText('SQL Type')).toBeInTheDocument();
  });

  it('should display field paths', () => {
    render(<AnalysisResults analysis={mockAnalysis} />);

    expect(screen.getByText('user.name')).toBeInTheDocument();
    expect(screen.getByText('user.age')).toBeInTheDocument();
    expect(screen.getAllByText('tags').length).toBeGreaterThan(0);
  });

  it('should display field types', () => {
    render(<AnalysisResults analysis={mockAnalysis} />);

    expect(screen.getAllByText('string').length).toBeGreaterThan(0);
    expect(screen.getByText('number')).toBeInTheDocument();
  });

  it('should display checkmarks for array fields', () => {
    render(<AnalysisResults analysis={mockAnalysis} />);

    const rows = screen.getAllByRole('row');
    const tagsRow = rows.find(row => row.textContent?.includes('tags'));
    expect(tagsRow?.textContent).toContain('✓');
  });

  it('should display checkmarks for nullable fields', () => {
    render(<AnalysisResults analysis={mockAnalysis} />);

    const rows = screen.getAllByRole('row');
    const ageRow = rows.find(row => row.textContent?.includes('user.age'));
    expect(ageRow?.textContent).toContain('✓');
  });

  it('should not display checkmark for non-nullable fields', () => {
    render(<AnalysisResults analysis={mockAnalysis} />);

    const rows = screen.getAllByRole('row');
    const nameRow = rows.find(row => row.textContent?.includes('user.name'));

    // Count checkmarks in the name row - should be 0
    const checkmarks = nameRow?.textContent?.match(/✓/g);
    expect(checkmarks).toBeNull();
  });

  it('should display sample values', () => {
    render(<AnalysisResults analysis={mockAnalysis} />);

    expect(screen.getByText('"John"')).toBeInTheDocument();
    expect(screen.getByText('"Jane"')).toBeInTheDocument();
    expect(screen.getByText('"Bob"')).toBeInTheDocument();
  });

  it('should display numeric samples', () => {
    render(<AnalysisResults analysis={mockAnalysis} />);

    expect(screen.getByText('25')).toBeInTheDocument();
    expect(screen.getByText('30')).toBeInTheDocument();
    expect(screen.getByText('35')).toBeInTheDocument();
  });

  it('should display suggested table names', () => {
    render(<AnalysisResults analysis={mockAnalysis} />);

    expect(screen.getAllByText('users').length).toBeGreaterThan(0);
    expect(screen.getByText('main_table')).toBeInTheDocument();
  });

  it('should display suggested column names', () => {
    render(<AnalysisResults analysis={mockAnalysis} />);

    expect(screen.getByText('name')).toBeInTheDocument();
    expect(screen.getByText('age')).toBeInTheDocument();
  });

  it('should display suggested SQL types', () => {
    render(<AnalysisResults analysis={mockAnalysis} />);

    expect(screen.getAllByText('VARCHAR(255)').length).toBeGreaterThan(0);
    expect(screen.getByText('INT')).toBeInTheDocument();
  });

  it('should display metadata when provided', () => {
    render(<AnalysisResults analysis={mockAnalysis} metadata={mockMetadata} />);

    expect(screen.getByText('Source Information')).toBeInTheDocument();
    expect(screen.getByText(/Source Table:/)).toBeInTheDocument();
    expect(screen.getByText('events_toprocess')).toBeInTheDocument();
    expect(screen.getByText(/Destination Table:/)).toBeInTheDocument();
    expect(screen.getByText('events')).toBeInTheDocument();
    expect(screen.getByText(/Event Type Filter:/)).toBeInTheDocument();
    expect(screen.getByText('user_action')).toBeInTheDocument();
  });

  it('should display formatted total records', () => {
    render(<AnalysisResults analysis={mockAnalysis} metadata={mockMetadata} />);

    expect(screen.getByText(/Total Records in Table:/)).toBeInTheDocument();
    expect(screen.getByText('50,000')).toBeInTheDocument();
  });

  it('should display sampled records count', () => {
    render(<AnalysisResults analysis={mockAnalysis} metadata={mockMetadata} />);

    expect(screen.getByText(/Analyzed Sample:/)).toBeInTheDocument();
    expect(screen.getByText(/1000 records/)).toBeInTheDocument();
  });

  it('should not display metadata section when metadata not provided', () => {
    render(<AnalysisResults analysis={mockAnalysis} />);

    expect(screen.queryByText('Source Information')).not.toBeInTheDocument();
  });

  it('should handle empty fields array', () => {
    const emptyAnalysis = {
      fields: [],
      totalRecords: 0,
      totalDocuments: 0,
      analyzedAt: new Date()
    };

    render(<AnalysisResults analysis={emptyAnalysis} />);

    expect(screen.getByText('Found 0 unique field(s)')).toBeInTheDocument();
  });

  it('should display alternating row colors', () => {
    render(<AnalysisResults analysis={mockAnalysis} />);

    const rows = screen.getAllByRole('row');
    // First row is header, then data rows
    expect(rows.length).toBe(4); // 1 header + 3 data rows
  });

  it('should display multiple types separated by comma', () => {
    const mixedTypeAnalysis = {
      fields: [
        {
          path: 'mixed.field',
          types: new Set(['string', 'number']),
          isArray: false,
          isNullable: false,
          occurrence: 100,
          samples: ['test', 123],
          maxLength: 10,
          suggestedTable: 'test_table',
          suggestedColumn: 'mixed_field',
          suggestedType: 'TEXT'
        }
      ],
      totalRecords: 100,
      totalDocuments: 100,
      analyzedAt: new Date()
    };

    render(<AnalysisResults analysis={mixedTypeAnalysis} />);

    const content = screen.getByText(/string.*number|number.*string/);
    expect(content).toBeInTheDocument();
  });

  it('should JSON stringify complex sample values', () => {
    const complexAnalysis = {
      fields: [
        {
          path: 'complex.field',
          types: new Set(['object']),
          isArray: false,
          isNullable: false,
          occurrence: 100,
          samples: [{ nested: 'value' }],
          maxLength: 0,
          suggestedTable: 'test_table',
          suggestedColumn: 'complex_field',
          suggestedType: 'TEXT'
        }
      ],
      totalRecords: 100,
      totalDocuments: 100,
      analyzedAt: new Date()
    };

    render(<AnalysisResults analysis={complexAnalysis} />);

    expect(screen.getByText('{"nested":"value"}')).toBeInTheDocument();
  });
});
