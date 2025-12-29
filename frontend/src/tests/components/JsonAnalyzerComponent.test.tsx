import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { JsonAnalyzerComponent } from '../../components/analysis/JsonAnalyzerComponent';
import { api } from '../../services/api';

jest.mock('../../services/api');

describe('JsonAnalyzerComponent', () => {
  const mockOnAnalysisComplete = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render all main sections', () => {
    render(<JsonAnalyzerComponent onAnalysisComplete={mockOnAnalysisComplete} />);

    expect(screen.getByText(/Step 1: Test Connection/i)).toBeInTheDocument();
    expect(screen.getByText(/Step 2: Discover Fields/i)).toBeInTheDocument();
    expect(screen.getByText(/Step 3: Build WHERE Conditions/i)).toBeInTheDocument();
  });

  it('should have default base table name', () => {
    render(<JsonAnalyzerComponent onAnalysisComplete={mockOnAnalysisComplete} />);

    const input = screen.getByPlaceholderText(/platforms_cicd_data/i);
    expect(input).toHaveValue('platforms_cicd_data');
  });

  it('should test connection successfully', async () => {
    (api.testConnection as jest.Mock).mockResolvedValue({ success: true });

    render(<JsonAnalyzerComponent onAnalysisComplete={mockOnAnalysisComplete} />);

    const testButton = screen.getByText(/Test Connection/i);
    fireEvent.click(testButton);

    await waitFor(() => {
      expect(api.testConnection).toHaveBeenCalled();
    });
  });

  it('should discover fields', async () => {
    (api.discoverFields as jest.Mock).mockResolvedValue({
      success: true,
      fields: [
        { path: 'test.field', uniqueValues: [], nullCount: 0, totalCount: 100 }
      ]
    });

    render(<JsonAnalyzerComponent onAnalysisComplete={mockOnAnalysisComplete} />);

    const discoverButton = screen.getByText(/Discover Fields/i);
    fireEvent.click(discoverButton);

    await waitFor(() => {
      expect(api.discoverFields).toHaveBeenCalledWith('platforms_cicd_data', 1000);
    });
  });

  it('should show discovered fields count', async () => {
    (api.discoverFields as jest.Mock).mockResolvedValue({
      success: true,
      fields: [
        { path: 'field1', uniqueValues: [], nullCount: 0, totalCount: 100 },
        { path: 'field2', uniqueValues: [], nullCount: 0, totalCount: 100 }
      ]
    });

    render(<JsonAnalyzerComponent onAnalysisComplete={mockOnAnalysisComplete} />);

    fireEvent.click(screen.getByText(/Discover Fields/i));

    await waitFor(() => {
      expect(screen.getByText(/Discovered 2 fields/i)).toBeInTheDocument();
    });
  });

  it('should analyze and call onAnalysisComplete', async () => {
    const mockAnalysisResult = {
      success: true,
      analysis: {
        fields: [
          {
            path: 'test.field',
            types: ['string'],
            isArray: false,
            isNullable: false,
            samples: ['test'],
            occurrence: 100,
            suggestedTable: 'test_table',
            suggestedColumn: 'field',
            suggestedType: 'VARCHAR(255)'
          }
        ],
        totalDocuments: 100
      },
      totalRecordsInTable: 1000,
      sampledRecords: 100,
      baseTableName: 'test_table',
      toProcessTable: 'test_table_toprocess',
      appliedFilters: []
    };

    (api.discoverFields as jest.Mock).mockResolvedValue({
      success: true,
      fields: [{ path: 'test.field', uniqueValues: [], nullCount: 0, totalCount: 100 }]
    });

    (api.analyze as jest.Mock).mockResolvedValue(mockAnalysisResult);

    render(<JsonAnalyzerComponent onAnalysisComplete={mockOnAnalysisComplete} />);

    // Discover fields first
    fireEvent.click(screen.getByText(/Discover Fields/i));

    await waitFor(() => {
      expect(screen.getByText(/Analyze & Suggest Tables/i)).toBeInTheDocument();
    });

    // Click analyze
    fireEvent.click(screen.getByText(/Analyze & Suggest Tables/i));

    await waitFor(() => {
      expect(mockOnAnalysisComplete).toHaveBeenCalled();
    });
  });

  it('should handle connection error', async () => {
    (api.testConnection as jest.Mock).mockResolvedValue({
      success: false,
      error: 'Connection failed'
    });

    render(<JsonAnalyzerComponent onAnalysisComplete={mockOnAnalysisComplete} />);

    fireEvent.click(screen.getByText(/Test Connection/i));

    await waitFor(() => {
      expect(screen.getByText(/Database connection failed/i)).toBeInTheDocument();
    });
  });

  it('should update base table name', () => {
    render(<JsonAnalyzerComponent onAnalysisComplete={mockOnAnalysisComplete} />);

    const input = screen.getByPlaceholderText(/platforms_cicd_data/i);
    fireEvent.change(input, { target: { value: 'new_table' } });

    expect(input).toHaveValue('new_table');
  });

  it('should update sample size', () => {
    render(<JsonAnalyzerComponent onAnalysisComplete={mockOnAnalysisComplete} />);

    // Find sample size input in Step 4
    const sampleInputs = screen.getAllByRole('spinbutton');
    const sampleSizeInput = sampleInputs.find(input =>
      (input as HTMLInputElement).value === '100'
    );

    if (sampleSizeInput) {
      fireEvent.change(sampleSizeInput, { target: { value: '500' } });
      expect(sampleSizeInput).toHaveValue(500);
    }
  });
});
