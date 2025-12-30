import { jsx as _jsx } from "react/jsx-runtime";
import { render, screen, fireEvent } from '@testing-library/react';
import { FilterBuilder } from '../../components/filters/FilterBuilder';
jest.mock('../../services/api');
describe('FilterBuilder Component', () => {
    const mockFields = [
        {
            path: '_source.type',
            types: ['string'],
            uniqueValues: ['event.test', 'event.run'],
            nullCount: 0,
            totalCount: 100
        },
        {
            path: '_source.id',
            types: ['number'],
            uniqueValues: [1, 2, 3],
            nullCount: 0,
            totalCount: 100
        }
    ];
    const mockOnFiltersChange = jest.fn();
    beforeEach(() => {
        jest.clearAllMocks();
    });
    it('should render filter builder section', () => {
        render(_jsx(FilterBuilder, { fields: mockFields, baseTableName: "test_table", onFiltersChange: mockOnFiltersChange }));
        expect(screen.getByText('Build WHERE Conditions')).toBeInTheDocument();
    });
    it('should show add condition button', () => {
        render(_jsx(FilterBuilder, { fields: mockFields, baseTableName: "test_table", onFiltersChange: mockOnFiltersChange }));
        expect(screen.getByText('+ Add Condition')).toBeInTheDocument();
    });
    it('should add a new condition when button clicked', () => {
        render(_jsx(FilterBuilder, { fields: mockFields, baseTableName: "test_table", onFiltersChange: mockOnFiltersChange }));
        const addButton = screen.getByText('+ Add Condition');
        fireEvent.click(addButton);
        expect(screen.getByText('Field')).toBeInTheDocument();
        expect(screen.getByText('Operator')).toBeInTheDocument();
    });
    it('should remove a condition', () => {
        render(_jsx(FilterBuilder, { fields: mockFields, baseTableName: "test_table", onFiltersChange: mockOnFiltersChange }));
        const addButton = screen.getByText('+ Add Condition');
        fireEvent.click(addButton);
        const removeButton = screen.getByText('Remove');
        fireEvent.click(removeButton);
        expect(mockOnFiltersChange).toHaveBeenCalledWith([]);
    });
    it('should show SQL preview when conditions exist', () => {
        render(_jsx(FilterBuilder, { fields: mockFields, baseTableName: "test_table", onFiltersChange: mockOnFiltersChange }));
        const addButton = screen.getByText('+ Add Condition');
        fireEvent.click(addButton);
        expect(screen.getByText('SQL Preview:')).toBeInTheDocument();
    });
    it('should handle field selection', () => {
        render(_jsx(FilterBuilder, { fields: mockFields, baseTableName: "test_table", onFiltersChange: mockOnFiltersChange }));
        const addButton = screen.getByText('+ Add Condition');
        fireEvent.click(addButton);
        // Check that "Field" label exists
        expect(screen.getByText('Field')).toBeInTheDocument();
        // Get all selects - first one is the field select
        const selects = screen.getAllByRole('combobox');
        expect(selects.length).toBeGreaterThan(0);
    });
    it('should display operator options', () => {
        render(_jsx(FilterBuilder, { fields: mockFields, baseTableName: "test_table", onFiltersChange: mockOnFiltersChange }));
        fireEvent.click(screen.getByText('+ Add Condition'));
        // Check that "Operator" label exists
        expect(screen.getByText('Operator')).toBeInTheDocument();
    });
    it('should show no filters message initially', () => {
        render(_jsx(FilterBuilder, { fields: mockFields, baseTableName: "test_table", onFiltersChange: mockOnFiltersChange }));
        expect(screen.getByText(/No filters applied/i)).toBeInTheDocument();
    });
    it('should handle IS NULL operator without value input', () => {
        render(_jsx(FilterBuilder, { fields: mockFields, baseTableName: "test_table", onFiltersChange: mockOnFiltersChange }));
        fireEvent.click(screen.getByText('+ Add Condition'));
        // Get all selects: [0] = Field, [1] = Operator, [2] = Value (if shown)
        const selects = screen.getAllByRole('combobox');
        const operatorSelect = selects[1]; // Second select is operator
        fireEvent.change(operatorSelect, { target: { value: 'IS NULL' } });
        // After changing to IS NULL, Value select/input should not be present
        // There should only be 2 selects now (Field and Operator)
        const selectsAfter = screen.getAllByRole('combobox');
        expect(selectsAfter.length).toBe(2);
    });
});
