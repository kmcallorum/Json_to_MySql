import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { FilterPresets } from '../../components/filters/FilterPresets';
import { api } from '../../services/api';

// Mock global functions
global.alert = jest.fn() as any;
global.confirm = jest.fn() as any;

jest.mock('../../services/api');

describe('FilterPresets Component', () => {
  const mockFilters = [
    { field: 'status', operator: '=' as const, value: 'active' }
  ];
  const mockOnLoadPreset = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render save and load buttons', () => {
    render(
      <FilterPresets
        baseTableName="test_table"
        currentFilters={mockFilters}
        onLoadPreset={mockOnLoadPreset}
      />
    );

    expect(screen.getByText(/Save Filter Preset/i)).toBeInTheDocument();
    expect(screen.getByText(/Load Filter Preset/i)).toBeInTheDocument();
  });

  it('should open save modal when save button clicked', () => {
    render(
      <FilterPresets
        baseTableName="test_table"
        currentFilters={mockFilters}
        onLoadPreset={mockOnLoadPreset}
      />
    );

    fireEvent.click(screen.getByText(/Save Filter Preset/i));

    expect(screen.getByText('Preset Name *')).toBeInTheDocument();
  });

  it('should open load modal when load button clicked', async () => {
    (api.listFilterPresets as jest.Mock).mockResolvedValue({
      success: true,
      presets: []
    });

    render(
      <FilterPresets
        baseTableName="test_table"
        currentFilters={mockFilters}
        onLoadPreset={mockOnLoadPreset}
      />
    );

    fireEvent.click(screen.getByText(/Load Filter Preset/i));

    await waitFor(() => {
      expect(api.listFilterPresets).toHaveBeenCalled();
    });
  });

  it('should display current filter count in save modal', () => {
    render(
      <FilterPresets
        baseTableName="test_table"
        currentFilters={mockFilters}
        onLoadPreset={mockOnLoadPreset}
      />
    );

    fireEvent.click(screen.getByText(/Save Filter Preset/i));

    expect(screen.getByText(/1 condition\(s\)/i)).toBeInTheDocument();
  });

  it('should save preset successfully', async () => {
    (api.saveFilterPreset as jest.Mock).mockResolvedValue({
      success: true
    });

    global.alert = jest.fn();

    render(
      <FilterPresets
        baseTableName="test_table"
        currentFilters={mockFilters}
        onLoadPreset={mockOnLoadPreset}
      />
    );

    fireEvent.click(screen.getByText(/Save Filter Preset/i));

    const nameInput = screen.getByPlaceholderText(/e\.g\., pipeline_test_filters/i);
    fireEvent.change(nameInput, { target: { value: 'test_preset' } });

    const saveButton = screen.getByText('Save');
    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(api.saveFilterPreset).toHaveBeenCalled();
    });
  });

  it('should show error when saving without name', () => {
    render(
      <FilterPresets
        baseTableName="test_table"
        currentFilters={mockFilters}
        onLoadPreset={mockOnLoadPreset}
      />
    );

    fireEvent.click(screen.getByText(/Save Filter Preset/i));

    const saveButton = screen.getByText('Save');

    // Button should be disabled when name is empty
    expect(saveButton).toBeDisabled();
  });

  it('should load and display presets', async () => {
    const mockPresets = [
      {
        id: 1,
        name: 'test_preset',
        description: 'Test',
        baseTableName: 'test_table',
        updatedAt: new Date().toISOString()
      }
    ];

    (api.listFilterPresets as jest.Mock).mockResolvedValue({
      success: true,
      presets: mockPresets
    });

    render(
      <FilterPresets
        baseTableName="test_table"
        currentFilters={mockFilters}
        onLoadPreset={mockOnLoadPreset}
      />
    );

    fireEvent.click(screen.getByText(/Load Filter Preset/i));

    await waitFor(() => {
      expect(screen.getByText('test_preset')).toBeInTheDocument();
    });
  });

  it('should call onLoadPreset when preset loaded', async () => {
    const mockWhereConditions = [
      { field: 'test', operator: '=' as const, value: 'val' }
    ];

    (api.listFilterPresets as jest.Mock).mockResolvedValue({
      success: true,
      presets: [{ id: 1, name: 'test_preset', baseTableName: 'test_table' }]
    });

    (api.loadFilterPreset as jest.Mock).mockResolvedValue({
      success: true,
      preset: { whereConditions: mockWhereConditions }
    });

    render(
      <FilterPresets
        baseTableName="test_table"
        currentFilters={mockFilters}
        onLoadPreset={mockOnLoadPreset}
      />
    );

    fireEvent.click(screen.getByText(/Load Filter Preset/i));

    await waitFor(() => {
      expect(screen.getByText('test_preset')).toBeInTheDocument();
    });

    const loadButton = screen.getAllByText('Load')[0];
    fireEvent.click(loadButton);

    await waitFor(() => {
      expect(mockOnLoadPreset).toHaveBeenCalledWith(mockWhereConditions);
    });
  });

  it('should handle error when loading presets fails', async () => {
    (api.listFilterPresets as jest.Mock).mockRejectedValue(new Error('Network error'));

    render(
      <FilterPresets
        baseTableName="test_table"
        currentFilters={mockFilters}
        onLoadPreset={mockOnLoadPreset}
      />
    );

    fireEvent.click(screen.getByText(/Load Filter Preset/i));

    await waitFor(() => {
      expect(global.alert).toHaveBeenCalledWith(expect.stringContaining('Network error'));
    });
  });

  it('should disable save button when name is empty', () => {
    render(
      <FilterPresets
        baseTableName="test_table"
        currentFilters={mockFilters}
        onLoadPreset={mockOnLoadPreset}
      />
    );

    fireEvent.click(screen.getByText(/Save Filter Preset/i));

    const saveButton = screen.getByText('Save') as HTMLButtonElement;

    // Button should be disabled when name is empty
    expect(saveButton).toBeDisabled();
  });

  it('should handle save failure with error response', async () => {
    (api.saveFilterPreset as jest.Mock).mockResolvedValue({
      success: false,
      error: 'Database error'
    });

    render(
      <FilterPresets
        baseTableName="test_table"
        currentFilters={mockFilters}
        onLoadPreset={mockOnLoadPreset}
      />
    );

    fireEvent.click(screen.getByText(/Save Filter Preset/i));

    const nameInput = screen.getByPlaceholderText(/e\.g\., pipeline_test_filters/i);
    fireEvent.change(nameInput, { target: { value: 'test_preset' } });

    const saveButton = screen.getByText('Save');
    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(global.alert).toHaveBeenCalledWith('Failed: Database error');
    });
  });

  it('should handle save exception', async () => {
    (api.saveFilterPreset as jest.Mock).mockRejectedValue(new Error('Network error'));

    render(
      <FilterPresets
        baseTableName="test_table"
        currentFilters={mockFilters}
        onLoadPreset={mockOnLoadPreset}
      />
    );

    fireEvent.click(screen.getByText(/Save Filter Preset/i));

    const nameInput = screen.getByPlaceholderText(/e\.g\., pipeline_test_filters/i);
    fireEvent.change(nameInput, { target: { value: 'test_preset' } });

    const saveButton = screen.getByText('Save');
    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(global.alert).toHaveBeenCalledWith('Error: Network error');
    });
  });

  it('should close save modal when Cancel button clicked', () => {
    render(
      <FilterPresets
        baseTableName="test_table"
        currentFilters={mockFilters}
        onLoadPreset={mockOnLoadPreset}
      />
    );

    fireEvent.click(screen.getByText(/Save Filter Preset/i));

    expect(screen.getByText('Preset Name *')).toBeInTheDocument();

    const cancelButton = screen.getByText('Cancel');
    fireEvent.click(cancelButton);

    expect(screen.queryByText('Preset Name *')).not.toBeInTheDocument();
  });

  it('should handle load failure with error response', async () => {
    (api.listFilterPresets as jest.Mock).mockResolvedValue({
      success: true,
      presets: [{ id: 1, name: 'test_preset', baseTableName: 'test_table', updatedAt: new Date().toISOString() }]
    });

    (api.loadFilterPreset as jest.Mock).mockResolvedValue({
      success: false,
      error: 'Preset not found'
    });

    render(
      <FilterPresets
        baseTableName="test_table"
        currentFilters={mockFilters}
        onLoadPreset={mockOnLoadPreset}
      />
    );

    fireEvent.click(screen.getByText(/Load Filter Preset/i));

    await waitFor(() => {
      expect(screen.getByText('test_preset')).toBeInTheDocument();
    });

    const loadButton = screen.getAllByText('Load')[0];
    fireEvent.click(loadButton);

    await waitFor(() => {
      expect(screen.getByText(/Failed: Preset not found/)).toBeInTheDocument();
    });
  });

  it('should handle load exception', async () => {
    (api.listFilterPresets as jest.Mock).mockResolvedValue({
      success: true,
      presets: [{ id: 1, name: 'test_preset', baseTableName: 'test_table', updatedAt: new Date().toISOString() }]
    });

    (api.loadFilterPreset as jest.Mock).mockRejectedValue(new Error('Network error'));

    render(
      <FilterPresets
        baseTableName="test_table"
        currentFilters={mockFilters}
        onLoadPreset={mockOnLoadPreset}
      />
    );

    fireEvent.click(screen.getByText(/Load Filter Preset/i));

    await waitFor(() => {
      expect(screen.getByText('test_preset')).toBeInTheDocument();
    });

    const loadButton = screen.getAllByText('Load')[0];
    fireEvent.click(loadButton);

    await waitFor(() => {
      expect(screen.getByText(/Error: Network error/)).toBeInTheDocument();
    });
  });

  it('should delete preset when confirmed', async () => {
    (global.confirm as any).mockReturnValue(true);
    (api.listFilterPresets as jest.Mock).mockResolvedValue({
      success: true,
      presets: [{ id: 1, name: 'test_preset', baseTableName: 'test_table', updatedAt: new Date().toISOString() }]
    });
    (api.deleteFilterPreset as jest.Mock).mockResolvedValue({
      success: true
    });

    render(
      <FilterPresets
        baseTableName="test_table"
        currentFilters={mockFilters}
        onLoadPreset={mockOnLoadPreset}
      />
    );

    fireEvent.click(screen.getByText(/Load Filter Preset/i));

    await waitFor(() => {
      expect(screen.getByText('test_preset')).toBeInTheDocument();
    });

    const deleteButton = screen.getByText('Delete');
    fireEvent.click(deleteButton);

    await waitFor(() => {
      expect(api.deleteFilterPreset).toHaveBeenCalledWith('test_preset');
      expect(global.alert).toHaveBeenCalledWith("Deleted 'test_preset'");
    });
  });

  it('should not delete preset when cancelled', async () => {
    (global.confirm as any).mockReturnValue(false);
    (api.listFilterPresets as jest.Mock).mockResolvedValue({
      success: true,
      presets: [{ id: 1, name: 'test_preset', baseTableName: 'test_table', updatedAt: new Date().toISOString() }]
    });

    render(
      <FilterPresets
        baseTableName="test_table"
        currentFilters={mockFilters}
        onLoadPreset={mockOnLoadPreset}
      />
    );

    fireEvent.click(screen.getByText(/Load Filter Preset/i));

    await waitFor(() => {
      expect(screen.getByText('test_preset')).toBeInTheDocument();
    });

    const deleteButton = screen.getByText('Delete');
    fireEvent.click(deleteButton);

    expect(api.deleteFilterPreset).not.toHaveBeenCalled();
  });

  it('should handle delete exception', async () => {
    (global.confirm as any).mockReturnValue(true);
    (api.listFilterPresets as jest.Mock).mockResolvedValue({
      success: true,
      presets: [{ id: 1, name: 'test_preset', baseTableName: 'test_table', updatedAt: new Date().toISOString() }]
    });
    (api.deleteFilterPreset as jest.Mock).mockRejectedValue(new Error('Delete failed'));

    render(
      <FilterPresets
        baseTableName="test_table"
        currentFilters={mockFilters}
        onLoadPreset={mockOnLoadPreset}
      />
    );

    fireEvent.click(screen.getByText(/Load Filter Preset/i));

    await waitFor(() => {
      expect(screen.getByText('test_preset')).toBeInTheDocument();
    });

    const deleteButton = screen.getByText('Delete');
    fireEvent.click(deleteButton);

    await waitFor(() => {
      expect(global.alert).toHaveBeenCalledWith('Error: Delete failed');
    });
  });

  it('should show description textarea and allow input', () => {
    render(
      <FilterPresets
        baseTableName="test_table"
        currentFilters={mockFilters}
        onLoadPreset={mockOnLoadPreset}
      />
    );

    fireEvent.click(screen.getByText(/Save Filter Preset/i));

    const descriptionInput = screen.getByPlaceholderText(/Describe this filter.../);
    fireEvent.change(descriptionInput, { target: { value: 'Test description' } });

    expect(descriptionInput).toHaveValue('Test description');
  });

  it('should show preset description when available', async () => {
    (api.listFilterPresets as jest.Mock).mockResolvedValue({
      success: true,
      presets: [{
        id: 1,
        name: 'test_preset',
        description: 'This is a test description',
        baseTableName: 'test_table',
        updatedAt: new Date().toISOString()
      }]
    });

    render(
      <FilterPresets
        baseTableName="test_table"
        currentFilters={mockFilters}
        onLoadPreset={mockOnLoadPreset}
      />
    );

    fireEvent.click(screen.getByText(/Load Filter Preset/i));

    await waitFor(() => {
      expect(screen.getByText('This is a test description')).toBeInTheDocument();
    });
  });

  it('should close load modal when Close button clicked', async () => {
    (api.listFilterPresets as jest.Mock).mockResolvedValue({
      success: true,
      presets: []
    });

    render(
      <FilterPresets
        baseTableName="test_table"
        currentFilters={mockFilters}
        onLoadPreset={mockOnLoadPreset}
      />
    );

    fireEvent.click(screen.getByText(/Load Filter Preset/i));

    await waitFor(() => {
      expect(screen.getByText('Close')).toBeInTheDocument();
    });

    const closeButton = screen.getByText('Close');
    fireEvent.click(closeButton);

    expect(screen.queryByText('Close')).not.toBeInTheDocument();
  });

  it('should show loading state in save modal', async () => {
    (api.saveFilterPreset as jest.Mock).mockImplementation(() => new Promise(resolve => setTimeout(resolve, 1000)));

    render(
      <FilterPresets
        baseTableName="test_table"
        currentFilters={mockFilters}
        onLoadPreset={mockOnLoadPreset}
      />
    );

    fireEvent.click(screen.getByText(/Save Filter Preset/i));

    const nameInput = screen.getByPlaceholderText(/e\.g\., pipeline_test_filters/i);
    fireEvent.change(nameInput, { target: { value: 'test_preset' } });

    const saveButton = screen.getByText('Save');
    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(screen.getByText('Saving...')).toBeInTheDocument();
    });
  });
});
