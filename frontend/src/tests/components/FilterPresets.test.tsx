import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { FilterPresets } from '../../components/filters/FilterPresets';
import { api } from '../../services/api';

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
    global.alert = jest.fn();

    render(
      <FilterPresets
        baseTableName="test_table"
        currentFilters={mockFilters}
        onLoadPreset={mockOnLoadPreset}
      />
    );

    fireEvent.click(screen.getByText(/Save Filter Preset/i));
    fireEvent.click(screen.getByText('Save'));

    expect(global.alert).toHaveBeenCalledWith('Please enter a preset name');
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
});
