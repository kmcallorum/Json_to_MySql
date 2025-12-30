import { jsx as _jsx } from "react/jsx-runtime";
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
        render(_jsx(JsonAnalyzerComponent, { onAnalysisComplete: mockOnAnalysisComplete }));
        expect(screen.getByText(/Step 1: Test Database Connection/i)).toBeInTheDocument();
        expect(screen.getByText(/Step 2: Discover Fields/i)).toBeInTheDocument();
        // Step 3 only appears after fields are discovered
    });
    it('should have default base table name', () => {
        render(_jsx(JsonAnalyzerComponent, { onAnalysisComplete: mockOnAnalysisComplete }));
        const input = screen.getByPlaceholderText(/platforms_cicd_data/i);
        expect(input).toHaveValue('platforms_cicd_data');
    });
    it('should test connection successfully', async () => {
        api.testConnection.mockResolvedValue({ success: true });
        render(_jsx(JsonAnalyzerComponent, { onAnalysisComplete: mockOnAnalysisComplete }));
        const testButton = screen.getByText(/Test Connection/i);
        fireEvent.click(testButton);
        await waitFor(() => {
            expect(api.testConnection).toHaveBeenCalled();
        });
    });
    it('should discover fields', async () => {
        api.discoverFields.mockResolvedValue({
            success: true,
            fields: [
                { path: 'test.field', uniqueValues: [], nullCount: 0, totalCount: 100 }
            ]
        });
        render(_jsx(JsonAnalyzerComponent, { onAnalysisComplete: mockOnAnalysisComplete }));
        const discoverButton = screen.getByText(/Discover All Fields & Values/i);
        fireEvent.click(discoverButton);
        await waitFor(() => {
            expect(api.discoverFields).toHaveBeenCalledWith('platforms_cicd_data', 1000);
        });
    });
    it('should show discovered fields count', async () => {
        api.discoverFields.mockResolvedValue({
            success: true,
            fields: [
                { path: 'field1', uniqueValues: [], nullCount: 0, totalCount: 100 },
                { path: 'field2', uniqueValues: [], nullCount: 0, totalCount: 100 }
            ]
        });
        render(_jsx(JsonAnalyzerComponent, { onAnalysisComplete: mockOnAnalysisComplete }));
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
        api.discoverFields.mockResolvedValue({
            success: true,
            fields: [{ path: 'test.field', uniqueValues: [], nullCount: 0, totalCount: 100 }]
        });
        api.analyze.mockResolvedValue(mockAnalysisResult);
        render(_jsx(JsonAnalyzerComponent, { onAnalysisComplete: mockOnAnalysisComplete }));
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
        api.testConnection.mockResolvedValue({
            success: false,
            error: 'Connection failed'
        });
        render(_jsx(JsonAnalyzerComponent, { onAnalysisComplete: mockOnAnalysisComplete }));
        fireEvent.click(screen.getByText(/Test Connection/i));
        await waitFor(() => {
            expect(screen.getByText(/Database connection failed/i)).toBeInTheDocument();
        });
    });
    it('should update base table name', () => {
        render(_jsx(JsonAnalyzerComponent, { onAnalysisComplete: mockOnAnalysisComplete }));
        const input = screen.getByPlaceholderText(/platforms_cicd_data/i);
        fireEvent.change(input, { target: { value: 'new_table' } });
        expect(input).toHaveValue('new_table');
    });
    it('should update sample size', async () => {
        // Mock discover fields to show Step 4
        api.discoverFields.mockResolvedValue({
            success: true,
            fields: [{ path: 'test.field', uniqueValues: [], nullCount: 0, totalCount: 100 }]
        });
        render(_jsx(JsonAnalyzerComponent, { onAnalysisComplete: mockOnAnalysisComplete }));
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
});
