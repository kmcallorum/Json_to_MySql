import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { FilterBuilder } from '../../components/filters/FilterBuilder';
import { api } from '../../services/api';

// Mock console.log
global.console.log = jest.fn() as any;

jest.mock('../../services/api');
jest.mock('../../components/filters/FilterPresets', () => ({
  FilterPresets: ({ onLoadPreset }: any) => (
    <div>
      <button onClick={() => {
        const mockFilters = [
          { field: '_source.type', operator: '=' as const, value: 'event.test' }
        ];
        onLoadPreset(mockFilters);
      }}>
        Mock Load Preset
      </button>
    </div>
  )
}));

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
    render(
      <FilterBuilder
        fields={mockFields}
        baseTableName="test_table"
        onFiltersChange={mockOnFiltersChange}
      />
    );

    expect(screen.getByText('Build WHERE Conditions')).toBeInTheDocument();
  });

  it('should show add condition button', () => {
    render(
      <FilterBuilder
        fields={mockFields}
        baseTableName="test_table"
        onFiltersChange={mockOnFiltersChange}
      />
    );

    expect(screen.getByText('+ Add Condition')).toBeInTheDocument();
  });

  it('should add a new condition when button clicked', () => {
    render(
      <FilterBuilder
        fields={mockFields}
        baseTableName="test_table"
        onFiltersChange={mockOnFiltersChange}
      />
    );

    const addButton = screen.getByText('+ Add Condition');
    fireEvent.click(addButton);

    expect(screen.getByText('Field')).toBeInTheDocument();
    expect(screen.getByText('Operator')).toBeInTheDocument();
  });

  it('should remove a condition', () => {
    render(
      <FilterBuilder
        fields={mockFields}
        baseTableName="test_table"
        onFiltersChange={mockOnFiltersChange}
      />
    );

    const addButton = screen.getByText('+ Add Condition');
    fireEvent.click(addButton);

    const removeButton = screen.getByText('Remove');
    fireEvent.click(removeButton);

    expect(mockOnFiltersChange).toHaveBeenCalledWith([]);
  });

  it('should show SQL preview when conditions exist', () => {
    render(
      <FilterBuilder
        fields={mockFields}
        baseTableName="test_table"
        onFiltersChange={mockOnFiltersChange}
      />
    );

    const addButton = screen.getByText('+ Add Condition');
    fireEvent.click(addButton);

    expect(screen.getByText('SQL Preview:')).toBeInTheDocument();
  });

  it('should handle field selection', () => {
    render(
      <FilterBuilder
        fields={mockFields}
        baseTableName="test_table"
        onFiltersChange={mockOnFiltersChange}
      />
    );

    const addButton = screen.getByText('+ Add Condition');
    fireEvent.click(addButton);

    // Check that "Field" label exists
    expect(screen.getByText('Field')).toBeInTheDocument();
    // Get all selects - first one is the field select
    const selects = screen.getAllByRole('combobox');
    expect(selects.length).toBeGreaterThan(0);
  });

  it('should display operator options', () => {
    render(
      <FilterBuilder
        fields={mockFields}
        baseTableName="test_table"
        onFiltersChange={mockOnFiltersChange}
      />
    );

    fireEvent.click(screen.getByText('+ Add Condition'));

    // Check that "Operator" label exists
    expect(screen.getByText('Operator')).toBeInTheDocument();
  });

  it('should show no filters message initially', () => {
    render(
      <FilterBuilder
        fields={mockFields}
        baseTableName="test_table"
        onFiltersChange={mockOnFiltersChange}
      />
    );

    expect(screen.getByText(/No filters applied/i)).toBeInTheDocument();
  });

  it('should handle IS NULL operator without value input', () => {
    render(
      <FilterBuilder
        fields={mockFields}
        baseTableName="test_table"
        onFiltersChange={mockOnFiltersChange}
      />
    );

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

  it('should handle loading preset', () => {
    render(
      <FilterBuilder
        fields={mockFields}
        baseTableName="test_table"
        onFiltersChange={mockOnFiltersChange}
      />
    );

    // Click the mock load preset button
    fireEvent.click(screen.getByText('Mock Load Preset'));

    // Should call onFiltersChange with loaded filters
    expect(mockOnFiltersChange).toHaveBeenCalledWith([
      { field: '_source.type', operator: '=', value: 'event.test' }
    ]);

    // Should log the loaded filters
    expect(console.log).toHaveBeenCalledWith('Loading preset with filters:', [
      { field: '_source.type', operator: '=', value: 'event.test' }
    ]);
  });

  it('should handle field change', () => {
    render(
      <FilterBuilder
        fields={mockFields}
        baseTableName="test_table"
        onFiltersChange={mockOnFiltersChange}
      />
    );

    fireEvent.click(screen.getByText('+ Add Condition'));

    const selects = screen.getAllByRole('combobox');
    const fieldSelect = selects[0];

    // Change field
    fireEvent.change(fieldSelect, { target: { value: '_source.id' } });

    expect(mockOnFiltersChange).toHaveBeenCalled();
  });

  it('should show value select when unique values exist and count <= 50', () => {
    const fieldsWithLimitedValues = [
      {
        path: '_source.status',
        types: ['string'],
        uniqueValues: ['active', 'inactive', 'pending'],
        nullCount: 0,
        totalCount: 100
      }
    ];

    render(
      <FilterBuilder
        fields={fieldsWithLimitedValues}
        baseTableName="test_table"
        onFiltersChange={mockOnFiltersChange}
      />
    );

    fireEvent.click(screen.getByText('+ Add Condition'));

    // Should show value select with unique values
    expect(screen.getByText('-- Select Value --')).toBeInTheDocument();
  });

  it('should handle value select change', () => {
    const fieldsWithLimitedValues = [
      {
        path: '_source.status',
        types: ['string'],
        uniqueValues: ['active', 'inactive'],
        nullCount: 0,
        totalCount: 100
      }
    ];

    render(
      <FilterBuilder
        fields={fieldsWithLimitedValues}
        baseTableName="test_table"
        onFiltersChange={mockOnFiltersChange}
      />
    );

    fireEvent.click(screen.getByText('+ Add Condition'));

    const selects = screen.getAllByRole('combobox');
    const valueSelect = selects[2]; // Third select is value

    fireEvent.change(valueSelect, { target: { value: 'active' } });

    expect(mockOnFiltersChange).toHaveBeenCalled();
  });

  it('should show text input when no unique values or count > 50', () => {
    const fieldsWithManyValues = [
      {
        path: '_source.name',
        types: ['string'],
        uniqueValues: Array.from({ length: 100 }, (_, i) => `value${i}`),
        nullCount: 0,
        totalCount: 1000
      }
    ];

    render(
      <FilterBuilder
        fields={fieldsWithManyValues}
        baseTableName="test_table"
        onFiltersChange={mockOnFiltersChange}
      />
    );

    fireEvent.click(screen.getByText('+ Add Condition'));

    // Should show text input
    expect(screen.getByPlaceholderText('Enter value...')).toBeInTheDocument();
  });

  it('should handle text input value change', () => {
    const fieldsWithManyValues = [
      {
        path: '_source.name',
        types: ['string'],
        uniqueValues: Array.from({ length: 100 }, (_, i) => `value${i}`),
        nullCount: 0,
        totalCount: 1000
      }
    ];

    render(
      <FilterBuilder
        fields={fieldsWithManyValues}
        baseTableName="test_table"
        onFiltersChange={mockOnFiltersChange}
      />
    );

    fireEvent.click(screen.getByText('+ Add Condition'));

    const textInput = screen.getByPlaceholderText('Enter value...') as HTMLInputElement;
    fireEvent.change(textInput, { target: { value: 'test value' } });

    expect(mockOnFiltersChange).toHaveBeenCalled();
  });

  it('should handle IN operator with multiple select', () => {
    render(
      <FilterBuilder
        fields={mockFields}
        baseTableName="test_table"
        onFiltersChange={mockOnFiltersChange}
      />
    );

    fireEvent.click(screen.getByText('+ Add Condition'));

    const selects = screen.getAllByRole('combobox');
    const operatorSelect = selects[1];

    // Change to IN operator
    fireEvent.change(operatorSelect, { target: { value: 'IN' } });

    // Should show multi-select
    expect(screen.getByText(/Select Values/)).toBeInTheDocument();
    expect(screen.getByText('Hold Ctrl/Cmd to select multiple')).toBeInTheDocument();
  });

  it('should handle multiple value selection for IN operator', () => {
    render(
      <FilterBuilder
        fields={mockFields}
        baseTableName="test_table"
        onFiltersChange={mockOnFiltersChange}
      />
    );

    fireEvent.click(screen.getByText('+ Add Condition'));

    const selects = screen.getAllByRole('combobox');
    const operatorSelect = selects[1];

    // Change to IN operator
    fireEvent.change(operatorSelect, { target: { value: 'IN' } });

    // Find the multi-select (it's a listbox role)
    const multiSelect = screen.getByRole('listbox') as HTMLSelectElement;

    // Mock selectedOptions
    const mockOptions = [
      { value: 'event.test' },
      { value: 'event.run' }
    ];

    Object.defineProperty(multiSelect, 'selectedOptions', {
      value: mockOptions,
      writable: true
    });

    fireEvent.change(multiSelect);

    expect(mockOnFiltersChange).toHaveBeenCalled();
  });

  it('should show SQL preview with IN operator', () => {
    render(
      <FilterBuilder
        fields={mockFields}
        baseTableName="test_table"
        onFiltersChange={mockOnFiltersChange}
      />
    );

    fireEvent.click(screen.getByText('+ Add Condition'));

    const selects = screen.getAllByRole('combobox');
    const operatorSelect = selects[1];

    // Change to IN operator
    fireEvent.change(operatorSelect, { target: { value: 'IN' } });

    // Find the multi-select
    const multiSelect = screen.getByRole('listbox') as HTMLSelectElement;

    // Mock selectedOptions
    const mockOptions = [
      { value: 'event.test' },
      { value: 'event.run' }
    ];

    Object.defineProperty(multiSelect, 'selectedOptions', {
      value: mockOptions,
      writable: true
    });

    fireEvent.change(multiSelect);

    // Should show SQL preview with IN clause
    expect(screen.getByText(/SQL Preview:/)).toBeInTheDocument();
    const preview = screen.getByText(/_source\.type IN/);
    expect(preview).toBeInTheDocument();
  });

  it('should show field info when available', () => {
    render(
      <FilterBuilder
        fields={mockFields}
        baseTableName="test_table"
        onFiltersChange={mockOnFiltersChange}
      />
    );

    fireEvent.click(screen.getByText('+ Add Condition'));

    // Should show field info
    expect(screen.getByText(/Info:/)).toBeInTheDocument();
    expect(screen.getByText(/2 unique values/)).toBeInTheDocument();
    expect(screen.getByText(/100 total records/)).toBeInTheDocument();
  });

  it('should show null count in field info when nulls exist', () => {
    const fieldsWithNulls = [
      {
        path: '_source.optional',
        types: ['string'],
        uniqueValues: ['value1', 'value2'],
        nullCount: 15,
        totalCount: 100
      }
    ];

    render(
      <FilterBuilder
        fields={fieldsWithNulls}
        baseTableName="test_table"
        onFiltersChange={mockOnFiltersChange}
      />
    );

    fireEvent.click(screen.getByText('+ Add Condition'));

    // Should show null count
    expect(screen.getByText(/15 nulls/)).toBeInTheDocument();
  });

  it('should handle IS NOT NULL operator', () => {
    render(
      <FilterBuilder
        fields={mockFields}
        baseTableName="test_table"
        onFiltersChange={mockOnFiltersChange}
      />
    );

    fireEvent.click(screen.getByText('+ Add Condition'));

    const selects = screen.getAllByRole('combobox');
    const operatorSelect = selects[1];

    fireEvent.change(operatorSelect, { target: { value: 'IS NOT NULL' } });

    // Should not show value input
    const selectsAfter = screen.getAllByRole('combobox');
    expect(selectsAfter.length).toBe(2);
  });

  it('should update SQL preview with different operators', () => {
    render(
      <FilterBuilder
        fields={mockFields}
        baseTableName="test_table"
        onFiltersChange={mockOnFiltersChange}
      />
    );

    fireEvent.click(screen.getByText('+ Add Condition'));

    const selects = screen.getAllByRole('combobox');
    const operatorSelect = selects[1];

    // Test LIKE operator
    fireEvent.change(operatorSelect, { target: { value: 'LIKE' } });

    expect(screen.getByText(/SQL Preview:/)).toBeInTheDocument();
  });
});
