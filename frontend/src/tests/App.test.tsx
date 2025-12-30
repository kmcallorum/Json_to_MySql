import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { render, screen, fireEvent, within } from '@testing-library/react';
import '@testing-library/jest-dom';
import { App } from '../App';
import { SchemaAnalysis, TableDefinition, FieldMapping } from '../types';

// Mock all child components
jest.mock('../components/analysis/JsonAnalyzerComponent', () => ({
  JsonAnalyzerComponent: ({ onAnalysisComplete }: any) => (
    <div>
      <div>JsonAnalyzerComponent</div>
      <button onClick={() => {
        const mockAnalysis: SchemaAnalysis = {
          fields: [
            {
              path: 'user.name',
              types: new Set(['string']),
              isArray: false,
              isNullable: false,
              samples: ['John'],
              occurrence: 100,
              suggestedTable: 'users',
              suggestedColumn: 'name',
              suggestedType: 'VARCHAR(255)',
              maxLength: 50
            },
            {
              path: 'user.email',
              types: new Set(['string']),
              isArray: false,
              isNullable: true,
              samples: ['john@example.com'],
              occurrence: 95,
              suggestedTable: 'users',
              suggestedColumn: 'email',
              suggestedType: 'VARCHAR(255)',
              maxLength: 100
            }
          ],
          totalRecords: 100,
          nestedStructures: []
        };
        const mockMetadata = {
          baseTableName: 'events',
          toProcessTable: 'events_toprocess',
          appliedFilters: []
        };
        onAnalysisComplete(mockAnalysis, mockMetadata);
      }}>
        Complete Analysis
      </button>
    </div>
  )
}));

jest.mock('../components/analysis/AnalysisResults', () => ({
  AnalysisResults: () => <div>AnalysisResults</div>
}));

jest.mock('../components/mapping/TableSelector', () => ({
  TableSelector: ({ onTablesSelected }: any) => (
    <div>
      <div>TableSelector</div>
      <button onClick={() => {
        const tables: TableDefinition[] = [
          {
            name: 'users',
            isNew: true,
            columns: [
              { name: 'id', type: 'INT', isPrimaryKey: true, nullable: false },
              { name: 'name', type: 'VARCHAR(255)', isPrimaryKey: false, nullable: false }
            ]
          }
        ];
        onTablesSelected(tables);
      }}>
        Select Tables
      </button>
      <button onClick={() => {
        const tables: TableDefinition[] = [
          {
            name: 'users',
            isNew: true,
            columns: [
              { name: 'id', type: 'INT', isPrimaryKey: true, nullable: false }
            ]
          }
        ];
        const loadedConfig = {
          mappings: [
            {
              sourcePath: 'user.name',
              targetTable: 'users',
              targetColumn: 'name',
              dataType: 'VARCHAR(255)',
              isArray: false
            }
          ],
          relationships: [
            {
              parentTable: 'users',
              childTable: 'posts',
              foreignKeyColumn: 'user_id',
              parentKeyColumn: 'id'
            }
          ]
        };
        onTablesSelected(tables, loadedConfig);
      }}>
        Select Tables With Config
      </button>
    </div>
  )
}));

jest.mock('../components/mapping/DragDropMapper', () => ({
  DragDropMapper: ({ onMappingsChange }: any) => (
    <div>
      <div>DragDropMapper</div>
      <button onClick={() => {
        const mappings: FieldMapping[] = [
          {
            sourcePath: 'user.name',
            targetTable: 'users',
            targetColumn: 'name',
            dataType: 'VARCHAR(255)',
            isArray: false
          }
        ];
        onMappingsChange(mappings);
      }}>
        Add Mapping
      </button>
    </div>
  )
}));

jest.mock('../components/mapping/RelationshipEditor', () => ({
  RelationshipEditor: () => <div>RelationshipEditor</div>
}));

jest.mock('../components/mapping/SqlGenerator', () => ({
  SqlGenerator: () => <div>SqlGenerator</div>
}));

jest.mock('../components/mapping/SaveLoadConfig', () => ({
  SaveLoadConfig: ({ onLoad }: any) => (
    <div>
      <div>SaveLoadConfig</div>
      <button onClick={() => {
        const config = {
          baseTableName: 'loaded_table',
          whereConditions: [{ field: 'status', operator: '=', value: 'active' }],
          tables: [
            {
              name: 'loaded_users',
              isNew: true,
              columns: [
                { name: 'id', type: 'INT', isPrimaryKey: true, nullable: false }
              ]
            }
          ],
          mappings: [
            {
              sourcePath: 'loaded.field',
              targetTable: 'loaded_users',
              targetColumn: 'field',
              dataType: 'VARCHAR(255)',
              isArray: false
            }
          ],
          fields: [
            {
              path: 'loaded.field',
              types: new Set(['string']),
              isArray: false,
              isNullable: false,
              samples: ['test'],
              occurrence: 100,
              suggestedTable: 'loaded_users',
              suggestedColumn: 'field',
              suggestedType: 'VARCHAR(255)',
              maxLength: 50
            }
          ],
          relationships: [
            {
              parentTable: 'loaded_users',
              childTable: 'loaded_posts',
              foreignKeyColumn: 'user_id',
              parentKeyColumn: 'id'
            }
          ]
        };
        onLoad(config);
      }}>
        Load Config
      </button>
      <button onClick={() => {
        const config = {
          baseTableName: 'no_fields_table',
          whereConditions: [],
          tables: [],
          mappings: [],
          fields: [],
          relationships: []
        };
        onLoad(config);
      }}>
        Load Config Without Fields
      </button>
    </div>
  )
}));

describe('App Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render the main heading', () => {
    render(<App />);
    expect(screen.getByText('JSON to SQL Flattener')).toBeInTheDocument();
  });

  it('should start on analyze step', () => {
    render(<App />);
    expect(screen.getByText(/1\. Analyzing/)).toBeInTheDocument();
  });

  it('should render JsonAnalyzerComponent on analyze step', () => {
    render(<App />);
    expect(screen.getByText('JsonAnalyzerComponent')).toBeInTheDocument();
  });

  it('should show progress indicators', () => {
    render(<App />);
    expect(screen.getByText(/2\. Tables/)).toBeInTheDocument();
    expect(screen.getByText(/3\. Map/)).toBeInTheDocument();
    expect(screen.getByText(/4\. Relations/)).toBeInTheDocument();
    expect(screen.getByText(/5\. Execute/)).toBeInTheDocument();
  });

  it('should not show save config button on analyze step', () => {
    render(<App />);
    expect(screen.queryByText('SaveLoadConfig')).not.toBeInTheDocument();
  });

  describe('handleAnalysisComplete', () => {
    it('should transition to select-tables step after analysis', () => {
      render(<App />);

      const completeButton = screen.getByText('Complete Analysis');
      fireEvent.click(completeButton);

      expect(screen.getByText(/2\. Selecting/)).toBeInTheDocument();
      expect(screen.getByText('AnalysisResults')).toBeInTheDocument();
      expect(screen.getByText('TableSelector')).toBeInTheDocument();
    });

    it('should show Back to Analysis button on select-tables step', () => {
      render(<App />);

      fireEvent.click(screen.getByText('Complete Analysis'));

      expect(screen.getByText('← Back to Analysis')).toBeInTheDocument();
    });

    it('should go back to analyze step when clicking Back to Analysis', () => {
      render(<App />);

      fireEvent.click(screen.getByText('Complete Analysis'));
      fireEvent.click(screen.getByText('← Back to Analysis'));

      expect(screen.getByText(/1\. Analyzing/)).toBeInTheDocument();
      expect(screen.getByText('JsonAnalyzerComponent')).toBeInTheDocument();
    });
  });

  describe('handleTablesSelected', () => {
    it('should transition to map-fields step after selecting tables', () => {
      render(<App />);

      fireEvent.click(screen.getByText('Complete Analysis'));
      fireEvent.click(screen.getByText('Select Tables'));

      expect(screen.getByText(/3\. Mapping/)).toBeInTheDocument();
      expect(screen.getByText('Map Fields to Tables')).toBeInTheDocument();
      expect(screen.getByText('DragDropMapper')).toBeInTheDocument();
    });

    it('should load config mappings and relationships when provided', () => {
      render(<App />);

      fireEvent.click(screen.getByText('Complete Analysis'));
      fireEvent.click(screen.getByText('Select Tables With Config'));

      expect(screen.getByText(/3\. Mapping/)).toBeInTheDocument();
      expect(screen.getByText('SaveLoadConfig')).toBeInTheDocument();
    });
  });

  describe('handleMappingsComplete', () => {
    it('should transition to define-relationships step', () => {
      render(<App />);

      fireEvent.click(screen.getByText('Complete Analysis'));
      fireEvent.click(screen.getByText('Select Tables'));
      fireEvent.click(screen.getByText('Add Mapping'));

      const continueButton = screen.getByText('Continue to Relationships →');
      fireEvent.click(continueButton);

      expect(screen.getByText(/4\. Relationships/)).toBeInTheDocument();
      expect(screen.getByText('Define Table Relationships')).toBeInTheDocument();
      expect(screen.getByText('RelationshipEditor')).toBeInTheDocument();
    });

    it('should disable Continue to Relationships button when no mappings', () => {
      render(<App />);

      fireEvent.click(screen.getByText('Complete Analysis'));
      fireEvent.click(screen.getByText('Select Tables'));

      const continueButton = screen.getByText('Continue to Relationships →') as HTMLButtonElement;
      expect(continueButton).toBeDisabled();
    });
  });

  describe('handleRelationshipsComplete', () => {
    it('should transition to generate-sql step', () => {
      render(<App />);

      fireEvent.click(screen.getByText('Complete Analysis'));
      fireEvent.click(screen.getByText('Select Tables'));
      fireEvent.click(screen.getByText('Add Mapping'));
      fireEvent.click(screen.getByText('Continue to Relationships →'));
      fireEvent.click(screen.getByText('Continue to Execute →'));

      expect(screen.getByText(/5\. Execute/)).toBeInTheDocument();
      expect(screen.getByText('Execute Flattening Process')).toBeInTheDocument();
      expect(screen.getByText('SqlGenerator')).toBeInTheDocument();
    });
  });

  describe('handleLoadConfig', () => {
    it('should load complete config with fields', () => {
      render(<App />);

      fireEvent.click(screen.getByText('Complete Analysis'));
      fireEvent.click(screen.getByText('Select Tables'));
      fireEvent.click(screen.getByText('Add Mapping'));
      fireEvent.click(screen.getByText('Load Config'));

      expect(screen.getByText(/3\. Mapping/)).toBeInTheDocument();
      expect(screen.getByText('DragDropMapper')).toBeInTheDocument();
    });

    it('should load config without fields', () => {
      render(<App />);

      fireEvent.click(screen.getByText('Complete Analysis'));
      fireEvent.click(screen.getByText('Select Tables'));
      fireEvent.click(screen.getByText('Add Mapping'));
      fireEvent.click(screen.getByText('Load Config Without Fields'));

      expect(screen.getByText(/3\. Mapping/)).toBeInTheDocument();
    });
  });

  describe('handleStartOver', () => {
    it('should reset to analyze step and clear all state', () => {
      render(<App />);

      // Navigate through all steps
      fireEvent.click(screen.getByText('Complete Analysis'));
      fireEvent.click(screen.getByText('Select Tables'));
      fireEvent.click(screen.getByText('Add Mapping'));
      fireEvent.click(screen.getByText('Continue to Relationships →'));
      fireEvent.click(screen.getByText('Continue to Execute →'));

      // Start over
      fireEvent.click(screen.getByText('🔄 Start New Analysis'));

      expect(screen.getByText(/1\. Analyzing/)).toBeInTheDocument();
      expect(screen.getByText('JsonAnalyzerComponent')).toBeInTheDocument();
      expect(screen.queryByText('SaveLoadConfig')).not.toBeInTheDocument();
    });
  });

  describe('map-fields step', () => {
    it('should render map-fields step content', () => {
      render(<App />);

      fireEvent.click(screen.getByText('Complete Analysis'));
      fireEvent.click(screen.getByText('Select Tables'));

      expect(screen.getByText('Map Fields to Tables')).toBeInTheDocument();
      expect(screen.getByText('Drag JSON fields from the left and drop them onto table columns on the right.')).toBeInTheDocument();
      expect(screen.getByText('DragDropMapper')).toBeInTheDocument();
    });

    it('should show Back to Table Selection button on map-fields step', () => {
      render(<App />);

      fireEvent.click(screen.getByText('Complete Analysis'));
      fireEvent.click(screen.getByText('Select Tables'));

      expect(screen.getByText('← Back to Table Selection')).toBeInTheDocument();
    });

    it('should go back to select-tables step when clicking Back to Table Selection', () => {
      render(<App />);

      fireEvent.click(screen.getByText('Complete Analysis'));
      fireEvent.click(screen.getByText('Select Tables'));
      fireEvent.click(screen.getByText('← Back to Table Selection'));

      expect(screen.getByText(/2\. Selecting/)).toBeInTheDocument();
      expect(screen.getByText('TableSelector')).toBeInTheDocument();
    });

    it('should enable Continue button when mappings exist', () => {
      render(<App />);

      fireEvent.click(screen.getByText('Complete Analysis'));
      fireEvent.click(screen.getByText('Select Tables'));
      fireEvent.click(screen.getByText('Add Mapping'));

      const continueButton = screen.getByText('Continue to Relationships →') as HTMLButtonElement;
      expect(continueButton).not.toBeDisabled();
    });

    it('should show SaveLoadConfig when mappings exist', () => {
      render(<App />);

      fireEvent.click(screen.getByText('Complete Analysis'));
      fireEvent.click(screen.getByText('Select Tables'));
      fireEvent.click(screen.getByText('Add Mapping'));

      expect(screen.getByText('SaveLoadConfig')).toBeInTheDocument();
    });
  });

  describe('define-relationships step', () => {
    it('should render define-relationships step content', () => {
      render(<App />);

      fireEvent.click(screen.getByText('Complete Analysis'));
      fireEvent.click(screen.getByText('Select Tables'));
      fireEvent.click(screen.getByText('Add Mapping'));
      fireEvent.click(screen.getByText('Continue to Relationships →'));

      expect(screen.getByText('Define Table Relationships')).toBeInTheDocument();
      expect(screen.getByText('Configure parent-child relationships for proper insert order and foreign key handling.')).toBeInTheDocument();
      expect(screen.getByText('RelationshipEditor')).toBeInTheDocument();
    });

    it('should show Back to Mapping button on define-relationships step', () => {
      render(<App />);

      fireEvent.click(screen.getByText('Complete Analysis'));
      fireEvent.click(screen.getByText('Select Tables'));
      fireEvent.click(screen.getByText('Add Mapping'));
      fireEvent.click(screen.getByText('Continue to Relationships →'));

      expect(screen.getByText('← Back to Mapping')).toBeInTheDocument();
    });

    it('should go back to map-fields step when clicking Back to Mapping', () => {
      render(<App />);

      fireEvent.click(screen.getByText('Complete Analysis'));
      fireEvent.click(screen.getByText('Select Tables'));
      fireEvent.click(screen.getByText('Add Mapping'));
      fireEvent.click(screen.getByText('Continue to Relationships →'));
      fireEvent.click(screen.getByText('← Back to Mapping'));

      expect(screen.getByText(/3\. Mapping/)).toBeInTheDocument();
      expect(screen.getByText('Map Fields to Tables')).toBeInTheDocument();
    });

    it('should show Continue to Execute button', () => {
      render(<App />);

      fireEvent.click(screen.getByText('Complete Analysis'));
      fireEvent.click(screen.getByText('Select Tables'));
      fireEvent.click(screen.getByText('Add Mapping'));
      fireEvent.click(screen.getByText('Continue to Relationships →'));

      expect(screen.getByText('Continue to Execute →')).toBeInTheDocument();
    });

    it('should show SaveLoadConfig on define-relationships step', () => {
      render(<App />);

      fireEvent.click(screen.getByText('Complete Analysis'));
      fireEvent.click(screen.getByText('Select Tables'));
      fireEvent.click(screen.getByText('Add Mapping'));
      fireEvent.click(screen.getByText('Continue to Relationships →'));

      expect(screen.getByText('SaveLoadConfig')).toBeInTheDocument();
    });
  });

  describe('generate-sql step', () => {
    it('should render generate-sql step content', () => {
      render(<App />);

      fireEvent.click(screen.getByText('Complete Analysis'));
      fireEvent.click(screen.getByText('Select Tables'));
      fireEvent.click(screen.getByText('Add Mapping'));
      fireEvent.click(screen.getByText('Continue to Relationships →'));
      fireEvent.click(screen.getByText('Continue to Execute →'));

      expect(screen.getByText('Execute Flattening Process')).toBeInTheDocument();
      expect(screen.getByText('SqlGenerator')).toBeInTheDocument();
    });

    it('should show Back to Relationships button on generate-sql step', () => {
      render(<App />);

      fireEvent.click(screen.getByText('Complete Analysis'));
      fireEvent.click(screen.getByText('Select Tables'));
      fireEvent.click(screen.getByText('Add Mapping'));
      fireEvent.click(screen.getByText('Continue to Relationships →'));
      fireEvent.click(screen.getByText('Continue to Execute →'));

      expect(screen.getByText('← Back to Relationships')).toBeInTheDocument();
    });

    it('should go back to define-relationships step when clicking Back to Relationships', () => {
      render(<App />);

      fireEvent.click(screen.getByText('Complete Analysis'));
      fireEvent.click(screen.getByText('Select Tables'));
      fireEvent.click(screen.getByText('Add Mapping'));
      fireEvent.click(screen.getByText('Continue to Relationships →'));
      fireEvent.click(screen.getByText('Continue to Execute →'));
      fireEvent.click(screen.getByText('← Back to Relationships'));

      expect(screen.getByText(/4\. Relationships/)).toBeInTheDocument();
      expect(screen.getByText('Define Table Relationships')).toBeInTheDocument();
    });

    it('should show Start New Analysis button', () => {
      render(<App />);

      fireEvent.click(screen.getByText('Complete Analysis'));
      fireEvent.click(screen.getByText('Select Tables'));
      fireEvent.click(screen.getByText('Add Mapping'));
      fireEvent.click(screen.getByText('Continue to Relationships →'));
      fireEvent.click(screen.getByText('Continue to Execute →'));

      expect(screen.getByText('🔄 Start New Analysis')).toBeInTheDocument();
    });

    it('should show SaveLoadConfig on generate-sql step', () => {
      render(<App />);

      fireEvent.click(screen.getByText('Complete Analysis'));
      fireEvent.click(screen.getByText('Select Tables'));
      fireEvent.click(screen.getByText('Add Mapping'));
      fireEvent.click(screen.getByText('Continue to Relationships →'));
      fireEvent.click(screen.getByText('Continue to Execute →'));

      expect(screen.getByText('SaveLoadConfig')).toBeInTheDocument();
    });
  });

  describe('progress indicator styling', () => {
    it('should show correct styling for analyze step', () => {
      render(<App />);

      expect(screen.getByText(/1\. Analyzing/)).toBeInTheDocument();
    });

    it('should show correct styling for select-tables step', () => {
      render(<App />);

      fireEvent.click(screen.getByText('Complete Analysis'));

      expect(screen.getByText(/✓ 1\. Analyzed/)).toBeInTheDocument();
      expect(screen.getByText(/2\. Selecting/)).toBeInTheDocument();
    });

    it('should show correct styling for map-fields step', () => {
      render(<App />);

      fireEvent.click(screen.getByText('Complete Analysis'));
      fireEvent.click(screen.getByText('Select Tables'));

      expect(screen.getByText(/✓ 1\. Analyzed/)).toBeInTheDocument();
      expect(screen.getByText(/✓ 2\. Tables/)).toBeInTheDocument();
      expect(screen.getByText(/3\. Mapping/)).toBeInTheDocument();
    });

    it('should show correct styling for define-relationships step', () => {
      render(<App />);

      fireEvent.click(screen.getByText('Complete Analysis'));
      fireEvent.click(screen.getByText('Select Tables'));
      fireEvent.click(screen.getByText('Add Mapping'));
      fireEvent.click(screen.getByText('Continue to Relationships →'));

      expect(screen.getByText(/✓ 1\. Analyzed/)).toBeInTheDocument();
      expect(screen.getByText(/✓ 2\. Tables/)).toBeInTheDocument();
      expect(screen.getByText(/✓ 3\. Mapped/)).toBeInTheDocument();
      expect(screen.getByText(/4\. Relationships/)).toBeInTheDocument();
    });

    it('should show correct styling for generate-sql step', () => {
      render(<App />);

      fireEvent.click(screen.getByText('Complete Analysis'));
      fireEvent.click(screen.getByText('Select Tables'));
      fireEvent.click(screen.getByText('Add Mapping'));
      fireEvent.click(screen.getByText('Continue to Relationships →'));
      fireEvent.click(screen.getByText('Continue to Execute →'));

      expect(screen.getByText(/✓ 1\. Analyzed/)).toBeInTheDocument();
      expect(screen.getByText(/✓ 2\. Tables/)).toBeInTheDocument();
      expect(screen.getByText(/✓ 3\. Mapped/)).toBeInTheDocument();
      expect(screen.getByText(/✓ 4\. Relations/)).toBeInTheDocument();
      expect(screen.getByText(/5\. Execute/)).toBeInTheDocument();
    });
  });

  describe('suggestedTables calculation', () => {
    it('should calculate suggested tables from analysis fields', () => {
      render(<App />);

      fireEvent.click(screen.getByText('Complete Analysis'));

      // The analysis has fields with 'users' as suggestedTable
      expect(screen.getByText('TableSelector')).toBeInTheDocument();
    });
  });
});
