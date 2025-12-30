import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { SqlGenerator } from '../../../src/components/mapping/SqlGenerator';
import { api } from '../../../src/services/api';

// Mock API
jest.mock('../../../src/services/api');

// Mock window functions
global.alert = jest.fn();
global.confirm = jest.fn();

// Mock clipboard API
Object.assign(navigator, {
  clipboard: {
    writeText: jest.fn(),
  },
});

// Mock URL.createObjectURL and revokeObjectURL
global.URL.createObjectURL = jest.fn(() => 'blob:mock-url');
global.URL.revokeObjectURL = jest.fn();

describe('SqlGenerator', () => {
  const mockTables = [
    {
      name: 'users',
      isNew: true,
      columns: [
        { name: 'id', type: 'INT', isPrimaryKey: true, nullable: false },
        { name: 'name', type: 'VARCHAR(255)', isPrimaryKey: false, nullable: false },
        { name: 'email', type: 'VARCHAR(255)', isPrimaryKey: false, nullable: true }
      ]
    },
    {
      name: 'posts',
      isNew: false,
      columns: [
        { name: 'id', type: 'INT', isPrimaryKey: true, nullable: false },
        { name: 'title', type: 'VARCHAR(255)', isPrimaryKey: false, nullable: false }
      ]
    }
  ];

  const mockMappings = [
    {
      sourcePath: 'user.name',
      targetTable: 'users',
      targetColumn: 'name',
      dataType: 'VARCHAR(255)'
    },
    {
      sourcePath: 'user.email',
      targetTable: 'users',
      targetColumn: 'email',
      dataType: 'VARCHAR(255)'
    }
  ];

  const mockRelationships = [
    {
      parentTable: 'users',
      childTable: 'posts',
      foreignKeyColumn: 'user_id',
      parentKeyColumn: 'id'
    }
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    (global.confirm as any).mockReturnValue(true);
  });

  it('should render component with title', () => {
    render(
      <SqlGenerator
        tables={mockTables}
        mappings={mockMappings}
        baseTableName="test_table"
      />
    );

    expect(screen.getByText('Execute or Download SQL')).toBeInTheDocument();
  });

  it('should render execute button', () => {
    render(
      <SqlGenerator
        tables={mockTables}
        mappings={mockMappings}
        baseTableName="test_table"
      />
    );

    expect(screen.getByText(/Execute Now/)).toBeInTheDocument();
  });

  it('should render download button', () => {
    render(
      <SqlGenerator
        tables={mockTables}
        mappings={mockMappings}
        baseTableName="test_table"
      />
    );

    expect(screen.getByText(/Download SQL Script/)).toBeInTheDocument();
  });

  it('should render copy to clipboard button', () => {
    render(
      <SqlGenerator
        tables={mockTables}
        mappings={mockMappings}
        baseTableName="test_table"
      />
    );

    expect(screen.getByText(/Copy to Clipboard/)).toBeInTheDocument();
  });

  it('should display generated SQL in pre tag', () => {
    render(
      <SqlGenerator
        tables={mockTables}
        mappings={mockMappings}
        baseTableName="test_table"
      />
    );

    const pre = screen.getByText(/JSON to SQL Flattener/);
    expect(pre).toBeInTheDocument();
  });

  it('should generate CREATE TABLE statement for new table', () => {
    render(
      <SqlGenerator
        tables={mockTables}
        mappings={mockMappings}
        baseTableName="test_table"
      />
    );

    expect(screen.getByText(/CREATE TABLE IF NOT EXISTS `users`/)).toBeInTheDocument();
  });

  it('should include column definitions in CREATE TABLE', () => {
    render(
      <SqlGenerator
        tables={mockTables}
        mappings={mockMappings}
        baseTableName="test_table"
      />
    );

    const sqlText = screen.getByText(/CREATE TABLE IF NOT EXISTS `users`/).textContent || '';
    expect(sqlText).toContain('id INT PRIMARY KEY AUTO_INCREMENT');
    expect(sqlText).toContain('name VARCHAR(255) NOT NULL');
    expect(sqlText).toContain('email VARCHAR(255)');
  });

  it('should skip CREATE TABLE for existing tables', () => {
    render(
      <SqlGenerator
        tables={mockTables}
        mappings={mockMappings}
        baseTableName="test_table"
      />
    );

    expect(screen.getByText(/Table 'posts' already exists/)).toBeInTheDocument();
  });

  it('should add elastic_id column to tables', () => {
    render(
      <SqlGenerator
        tables={mockTables}
        mappings={mockMappings}
        baseTableName="test_table"
      />
    );

    const sqlText = screen.getByText(/CREATE TABLE IF NOT EXISTS `users`/).textContent || '';
    expect(sqlText).toContain('elastic_id VARCHAR(255) NOT NULL');
    expect(sqlText).toContain('INDEX idx_elastic_id (elastic_id)');
  });

  it('should display relationships in SQL comments', () => {
    render(
      <SqlGenerator
        tables={mockTables}
        mappings={mockMappings}
        baseTableName="test_table"
        relationships={mockRelationships}
      />
    );

    expect(screen.getByText(/Table Relationships/)).toBeInTheDocument();
    expect(screen.getByText(/users\.id → posts\.user_id/)).toBeInTheDocument();
  });

  it('should display field mappings summary', () => {
    render(
      <SqlGenerator
        tables={mockTables}
        mappings={mockMappings}
        baseTableName="test_table"
      />
    );

    expect(screen.getByText(/Field Mappings Summary/)).toBeInTheDocument();
    expect(screen.getByText(/Total fields mapped: 2/)).toBeInTheDocument();
  });

  it('should display mapping details', () => {
    render(
      <SqlGenerator
        tables={mockTables}
        mappings={mockMappings}
        baseTableName="test_table"
      />
    );

    expect(screen.getByText(/user\.name → users\.name/)).toBeInTheDocument();
    expect(screen.getByText(/user\.email → users\.email/)).toBeInTheDocument();
  });

  it('should display summary statistics', () => {
    render(
      <SqlGenerator
        tables={mockTables}
        mappings={mockMappings}
        baseTableName="test_table"
        relationships={mockRelationships}
      />
    );

    expect(screen.getByText(/2 table\(s\) defined/)).toBeInTheDocument();
    expect(screen.getByText(/1 new table\(s\) to create/)).toBeInTheDocument();
    expect(screen.getByText(/2 field\(s\) mapped/)).toBeInTheDocument();
    expect(screen.getByText(/1 relationship\(s\) defined/)).toBeInTheDocument();
  });

  it('should copy SQL to clipboard when copy button clicked', async () => {
    render(
      <SqlGenerator
        tables={mockTables}
        mappings={mockMappings}
        baseTableName="test_table"
      />
    );

    const copyButton = screen.getByText(/Copy to Clipboard/);
    fireEvent.click(copyButton);

    expect(navigator.clipboard.writeText).toHaveBeenCalled();
    expect(global.alert).toHaveBeenCalledWith('SQL copied to clipboard!');
  });

  it('should download SQL file when download button clicked', () => {
    render(
      <SqlGenerator
        tables={mockTables}
        mappings={mockMappings}
        baseTableName="test_table"
      />
    );

    const downloadButton = screen.getByText(/Download SQL Script/);

    // Just verify clicking doesn't throw and URL methods are called
    expect(() => fireEvent.click(downloadButton)).not.toThrow();

    // Verify URL.createObjectURL was called (for blob creation)
    expect(global.URL.createObjectURL).toHaveBeenCalled();
  });

  it('should confirm before executing flattening', async () => {
    (global.confirm as any).mockReturnValue(false);

    render(
      <SqlGenerator
        tables={mockTables}
        mappings={mockMappings}
        baseTableName="test_table"
      />
    );

    const executeButton = screen.getByText(/Execute Now/);
    fireEvent.click(executeButton);

    expect(global.confirm).toHaveBeenCalled();
    expect(api.executeFlattening).not.toHaveBeenCalled();
  });

  it('should execute flattening when confirmed', async () => {
    (global.confirm as any).mockReturnValue(true);
    (api.executeFlattening as any).mockResolvedValue({
      success: true,
      recordsProcessed: 100,
      recordsMoved: 100,
      tablesCreated: ['users']
    });

    render(
      <SqlGenerator
        tables={mockTables}
        mappings={mockMappings}
        baseTableName="test_table"
      />
    );

    const executeButton = screen.getByText(/Execute Now/);
    fireEvent.click(executeButton);

    await waitFor(() => {
      expect(api.executeFlattening).toHaveBeenCalledWith({
        baseTableName: 'test_table',
        tables: mockTables,
        mappings: mockMappings,
        whereConditions: [],
        relationships: [],
        batchSize: 100
      });
    });
  });

  it('should pass relationships when executing', async () => {
    (global.confirm as any).mockReturnValue(true);
    (api.executeFlattening as any).mockResolvedValue({
      success: true,
      recordsProcessed: 100,
      recordsMoved: 100,
      tablesCreated: ['users']
    });

    render(
      <SqlGenerator
        tables={mockTables}
        mappings={mockMappings}
        baseTableName="test_table"
        relationships={mockRelationships}
      />
    );

    const executeButton = screen.getByText(/Execute Now/);
    fireEvent.click(executeButton);

    await waitFor(() => {
      expect(api.executeFlattening).toHaveBeenCalledWith({
        baseTableName: 'test_table',
        tables: mockTables,
        mappings: mockMappings,
        whereConditions: [],
        relationships: mockRelationships,
        batchSize: 100
      });
    });
  });

  it('should show executing state when flattening', async () => {
    (global.confirm as any).mockReturnValue(true);
    (api.executeFlattening as any).mockImplementation(() => new Promise(resolve => setTimeout(resolve, 1000)));

    render(
      <SqlGenerator
        tables={mockTables}
        mappings={mockMappings}
        baseTableName="test_table"
      />
    );

    const executeButton = screen.getByText(/Execute Now/);
    fireEvent.click(executeButton);

    await waitFor(() => {
      expect(screen.getByText(/Executing\.\.\./)).toBeInTheDocument();
    });
  });

  it('should disable execute button while executing', async () => {
    (global.confirm as any).mockReturnValue(true);
    (api.executeFlattening as any).mockImplementation(() => new Promise(resolve => setTimeout(resolve, 1000)));

    render(
      <SqlGenerator
        tables={mockTables}
        mappings={mockMappings}
        baseTableName="test_table"
      />
    );

    const executeButton = screen.getByText(/Execute Now/) as HTMLButtonElement;
    fireEvent.click(executeButton);

    await waitFor(() => {
      const executingButton = screen.getByText(/Executing\.\.\./) as HTMLButtonElement;
      expect(executingButton).toBeDisabled();
    });
  });

  it('should show success result after execution', async () => {
    (global.confirm as any).mockReturnValue(true);
    (api.executeFlattening as any).mockResolvedValue({
      success: true,
      recordsProcessed: 150,
      recordsMoved: 145,
      tablesCreated: ['users', 'posts']
    });

    render(
      <SqlGenerator
        tables={mockTables}
        mappings={mockMappings}
        baseTableName="test_table"
      />
    );

    const executeButton = screen.getByText(/Execute Now/);
    fireEvent.click(executeButton);

    await waitFor(() => {
      expect(screen.getByText(/Execution Successful!/)).toBeInTheDocument();
    });

    expect(screen.getByText(/Records Processed:/)).toBeInTheDocument();
    expect(screen.getByText('150')).toBeInTheDocument();
    expect(screen.getByText('145')).toBeInTheDocument();
    expect(screen.getByText(/users, posts/)).toBeInTheDocument();
  });

  it('should show alert on success', async () => {
    (global.confirm as any).mockReturnValue(true);
    (api.executeFlattening as any).mockResolvedValue({
      success: true,
      recordsProcessed: 100,
      recordsMoved: 100,
      tablesCreated: ['users']
    });

    render(
      <SqlGenerator
        tables={mockTables}
        mappings={mockMappings}
        baseTableName="test_table"
      />
    );

    const executeButton = screen.getByText(/Execute Now/);
    fireEvent.click(executeButton);

    await waitFor(() => {
      expect(global.alert).toHaveBeenCalledWith(
        expect.stringContaining('Success!')
      );
    });
  });

  it('should handle execution failure', async () => {
    (global.confirm as any).mockReturnValue(true);
    (api.executeFlattening as any).mockResolvedValue({
      success: false,
      error: 'Database connection failed'
    });

    render(
      <SqlGenerator
        tables={mockTables}
        mappings={mockMappings}
        baseTableName="test_table"
      />
    );

    const executeButton = screen.getByText(/Execute Now/);
    fireEvent.click(executeButton);

    await waitFor(() => {
      expect(global.alert).toHaveBeenCalledWith('Error: Database connection failed');
    });
  });

  it('should handle execution exception', async () => {
    (global.confirm as any).mockReturnValue(true);
    (api.executeFlattening as any).mockRejectedValue(new Error('Network error'));

    render(
      <SqlGenerator
        tables={mockTables}
        mappings={mockMappings}
        baseTableName="test_table"
      />
    );

    const executeButton = screen.getByText(/Execute Now/);
    fireEvent.click(executeButton);

    await waitFor(() => {
      expect(global.alert).toHaveBeenCalledWith('Execution failed: Network error');
    });
  });

  it('should show relationship confirmation message', async () => {
    (global.confirm as any).mockReturnValue(false);

    render(
      <SqlGenerator
        tables={mockTables}
        mappings={mockMappings}
        baseTableName="test_table"
        relationships={mockRelationships}
      />
    );

    const executeButton = screen.getByText(/Execute Now/);
    fireEvent.click(executeButton);

    expect(global.confirm).toHaveBeenCalledWith(
      expect.stringContaining('Execute flattening with 1 relationship(s)?')
    );
    expect(global.confirm).toHaveBeenCalledWith(
      expect.stringContaining('users → posts')
    );
  });

  it('should include base table name in generated SQL header', () => {
    render(
      <SqlGenerator
        tables={mockTables}
        mappings={mockMappings}
        baseTableName="my_custom_table"
      />
    );

    expect(screen.getByText(/Source: my_custom_table_toprocess/)).toBeInTheDocument();
  });

  it('should include generated date in SQL header', () => {
    render(
      <SqlGenerator
        tables={mockTables}
        mappings={mockMappings}
        baseTableName="test_table"
      />
    );

    expect(screen.getByText(/Generated:/)).toBeInTheDocument();
  });

  it('should show zero relationships when none provided', () => {
    render(
      <SqlGenerator
        tables={mockTables}
        mappings={mockMappings}
        baseTableName="test_table"
      />
    );

    expect(screen.getByText(/Relationships: 0/)).toBeInTheDocument();
    expect(screen.getByText(/0 relationship\(s\) defined/)).toBeInTheDocument();
  });
});
