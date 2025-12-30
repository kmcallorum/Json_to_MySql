import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
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

    expect(screen.getByText(/Step 1: Test Database Connection/i)).toBeInTheDocument();
    expect(screen.getByText(/Step 2: Discover Fields/i)).toBeInTheDocument();
    // Step 3 only appears after fields are discovered
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

    const discoverButton = screen.getByText(/Discover All Fields & Values/i);
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

    fireEvent.click(screen.getByText(/Discover All Fields & Values/i));

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
    fireEvent.click(screen.getByText(/Discover All Fields & Values/i));

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

  it('should update sample size', async () => {
    // Mock discover fields to show Step 4
    (api.discoverFields as jest.Mock).mockResolvedValue({
      success: true,
      fields: [{ path: 'test.field', uniqueValues: [], nullCount: 0, totalCount: 100 }]
    });

    render(<JsonAnalyzerComponent onAnalysisComplete={mockOnAnalysisComplete} />);

    // First discover fields to make Step 4 appear
    fireEvent.click(screen.getByText(/Discover All Fields & Values/i));

    await waitFor(() => {
      expect(screen.getByText(/Step 4:/i)).toBeInTheDocument();
    });

    // Now find sample size input in Step 4
    const sampleSizeInput = screen.getByRole('spinbutton');
    expect(sampleSizeInput).toHaveValue(100);

    fireEvent.change(sampleSizeInput, { target: { value: '500' } });
    expect(sampleSizeInput).toHaveValue(500);
  });

  it('should handle connection exception', async () => {
    (api.testConnection as jest.Mock).mockRejectedValue(new Error('Network error'));

    render(<JsonAnalyzerComponent onAnalysisComplete={mockOnAnalysisComplete} />);

    fireEvent.click(screen.getByText(/Test Connection/i));

    await waitFor(() => {
      expect(screen.getByText(/Network error/i)).toBeInTheDocument();
    });
  });

  it('should handle discover fields error response', async () => {
    (api.discoverFields as jest.Mock).mockResolvedValue({
      success: false,
      error: 'Table not found'
    });

    render(<JsonAnalyzerComponent onAnalysisComplete={mockOnAnalysisComplete} />);

    fireEvent.click(screen.getByText(/Discover All Fields & Values/i));

    await waitFor(() => {
      expect(screen.getByText(/Table not found/i)).toBeInTheDocument();
    });
  });

  it('should handle discover fields exception', async () => {
    (api.discoverFields as jest.Mock).mockRejectedValue(new Error('Database error'));

    render(<JsonAnalyzerComponent onAnalysisComplete={mockOnAnalysisComplete} />);

    fireEvent.click(screen.getByText(/Discover All Fields & Values/i));

    await waitFor(() => {
      expect(screen.getByText(/Database error/i)).toBeInTheDocument();
    });
  });

  it('should handle analyze error response', async () => {
    (api.discoverFields as jest.Mock).mockResolvedValue({
      success: true,
      fields: [{ path: 'test.field', uniqueValues: [], nullCount: 0, totalCount: 100 }]
    });

    (api.analyze as jest.Mock).mockResolvedValue({
      success: false,
      error: 'Analysis failed'
    });

    render(<JsonAnalyzerComponent onAnalysisComplete={mockOnAnalysisComplete} />);

    // Discover fields first
    fireEvent.click(screen.getByText(/Discover All Fields & Values/i));

    await waitFor(() => {
      expect(screen.getByText(/Analyze & Suggest Tables/i)).toBeInTheDocument();
    });

    // Click analyze
    fireEvent.click(screen.getByText(/Analyze & Suggest Tables/i));

    await waitFor(() => {
      expect(screen.getByText(/Analysis failed/i)).toBeInTheDocument();
    });
  });

  it('should handle analyze exception', async () => {
    (api.discoverFields as jest.Mock).mockResolvedValue({
      success: true,
      fields: [{ path: 'test.field', uniqueValues: [], nullCount: 0, totalCount: 100 }]
    });

    (api.analyze as jest.Mock).mockRejectedValue(new Error('Server error'));

    render(<JsonAnalyzerComponent onAnalysisComplete={mockOnAnalysisComplete} />);

    // Discover fields first
    fireEvent.click(screen.getByText(/Discover All Fields & Values/i));

    await waitFor(() => {
      expect(screen.getByText(/Analyze & Suggest Tables/i)).toBeInTheDocument();
    });

    // Click analyze
    fireEvent.click(screen.getByText(/Analyze & Suggest Tables/i));

    await waitFor(() => {
      expect(screen.getByText(/Server error/i)).toBeInTheDocument();
    });
  });
});
