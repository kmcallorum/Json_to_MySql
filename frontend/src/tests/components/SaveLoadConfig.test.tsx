import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { SaveLoadConfig } from '../../components/mapping/SaveLoadConfig';
import { api } from '../../services/api';

// Mock global functions
global.alert = jest.fn() as any;
global.confirm = jest.fn() as any;

jest.mock('../../services/api');

describe('SaveLoadConfig Component', () => {
  const mockConfig = {
    baseTableName: 'test_table',
    whereConditions: [],
    tables: [
      {
        name: 'events',
        columns: [
          { name: 'id', type: 'INT', nullable: false, isPrimaryKey: true }
        ],
        isNew: true
      }
    ],
    mappings: [
      {
        sourcePath: '_source.type',
        targetTable: 'events',
        targetColumn: 'type',
        dataType: 'VARCHAR(255)',
        isArray: false
      }
    ]
  };

  const mockOnLoad = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    (global.alert as any).mockClear();
    (global.confirm as any).mockClear();
  });

  it('should render save and load buttons', () => {
    render(
      <SaveLoadConfig
        currentConfig={mockConfig}
        onLoad={mockOnLoad}
      />
    );

    expect(screen.getByText(/Save Configuration/i)).toBeInTheDocument();
    expect(screen.getByText(/Load Configuration/i)).toBeInTheDocument();
  });

  it('should open save modal when save button clicked', () => {
    render(
      <SaveLoadConfig
        currentConfig={mockConfig}
        onLoad={mockOnLoad}
      />
    );

    fireEvent.click(screen.getByText(/Save Configuration/i));

    expect(screen.getByText('Save Mapping Configuration')).toBeInTheDocument();
    expect(screen.getByText('Configuration Name *')).toBeInTheDocument();
  });

  it('should require configuration name for save', () => {
    render(
      <SaveLoadConfig
        currentConfig={mockConfig}
        onLoad={mockOnLoad}
      />
    );

    fireEvent.click(screen.getByText(/Save Configuration/i));

    const saveButton = screen.getByRole('button', { name: /^Save$/i });

    // Button should be disabled when name is empty
    expect(saveButton).toBeDisabled();
  });

  it('should save configuration successfully', async () => {
    (api.saveMappingConfig as jest.Mock).mockResolvedValue({
      success: true,
      config: mockConfig
    });

    render(
      <SaveLoadConfig
        currentConfig={mockConfig}
        onLoad={mockOnLoad}
      />
    );

    fireEvent.click(screen.getByText(/Save Configuration/i));

    const nameInput = screen.getByPlaceholderText(/e\.g\., daily_pipeline_test_mapping/i);
    fireEvent.change(nameInput, { target: { value: 'test_config' } });

    const saveButton = screen.getByRole('button', { name: /^Save$/i });
    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(api.saveMappingConfig).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'test_config',
          ...mockConfig
        })
      );
    });
  });

  it('should load configurations list', async () => {
    const mockConfigs = [
      {
        id: 1,
        name: 'config1',
        description: 'Test config',
        baseTableName: 'test_table',
        updatedAt: new Date().toISOString()
      }
    ];

    (api.listMappingConfigs as jest.Mock).mockResolvedValue({
      success: true,
      configs: mockConfigs
    });

    render(
      <SaveLoadConfig
        currentConfig={mockConfig}
        onLoad={mockOnLoad}
      />
    );

    fireEvent.click(screen.getByText(/Load Configuration/i));

    await waitFor(() => {
      expect(api.listMappingConfigs).toHaveBeenCalled();
      expect(screen.getByText('config1')).toBeInTheDocument();
    });
  });

  it('should load a specific configuration', async () => {
    const loadedConfig = {
      ...mockConfig,
      name: 'loaded_config'
    };

    (api.listMappingConfigs as jest.Mock).mockResolvedValue({
      success: true,
      configs: [{ id: 1, name: 'loaded_config', baseTableName: 'test_table' }]
    });

    (api.loadMappingConfig as jest.Mock).mockResolvedValue({
      success: true,
      config: loadedConfig
    });

    render(
      <SaveLoadConfig
        currentConfig={mockConfig}
        onLoad={mockOnLoad}
      />
    );

    fireEvent.click(screen.getByText(/Load Configuration/i));

    await waitFor(() => {
      expect(screen.getByText('loaded_config')).toBeInTheDocument();
    });

    const loadButton = screen.getAllByText('Load')[0];
    fireEvent.click(loadButton);

    await waitFor(() => {
      expect(mockOnLoad).toHaveBeenCalledWith(loadedConfig);
    });
  });

  it('should delete a configuration', async () => {
    global.confirm = jest.fn(() => true);

    (api.listMappingConfigs as jest.Mock).mockResolvedValue({
      success: true,
      configs: [{ id: 1, name: 'to_delete', baseTableName: 'test_table' }]
    });

    (api.deleteMappingConfig as jest.Mock).mockResolvedValue({
      success: true
    });

    render(
      <SaveLoadConfig
        currentConfig={mockConfig}
        onLoad={mockOnLoad}
      />
    );

    fireEvent.click(screen.getByText(/Load Configuration/i));

    await waitFor(() => {
      expect(screen.getByText('to_delete')).toBeInTheDocument();
    });

    const deleteButton = screen.getByText('Delete');
    fireEvent.click(deleteButton);

    expect(global.confirm).toHaveBeenCalled();

    await waitFor(() => {
      expect(api.deleteMappingConfig).toHaveBeenCalledWith('to_delete');
    });
  });

  it('should close save modal on cancel', () => {
    render(
      <SaveLoadConfig
        currentConfig={mockConfig}
        onLoad={mockOnLoad}
      />
    );

    fireEvent.click(screen.getByText(/Save Configuration/i));

    const cancelButton = screen.getByText('Cancel');
    fireEvent.click(cancelButton);

    expect(screen.queryByText('Save Mapping Configuration')).not.toBeInTheDocument();
  });

  it('should show no configs message when list is empty', async () => {
    (api.listMappingConfigs as jest.Mock).mockResolvedValue({
      success: true,
      configs: []
    });

    render(
      <SaveLoadConfig
        currentConfig={mockConfig}
        onLoad={mockOnLoad}
      />
    );

    fireEvent.click(screen.getByText(/Load Configuration/i));

    await waitFor(() => {
      expect(screen.getByText(/No saved configurations found/i)).toBeInTheDocument();
    });
  });

  it('should handle error when loading configs list fails', async () => {
    const consoleError = jest.spyOn(console, 'error').mockImplementation(() => {});
    (api.listMappingConfigs as jest.Mock).mockRejectedValue(new Error('Network error'));

    render(
      <SaveLoadConfig
        currentConfig={mockConfig}
        onLoad={mockOnLoad}
      />
    );

    fireEvent.click(screen.getByText(/Load Configuration/i));

    await waitFor(() => {
      expect(consoleError).toHaveBeenCalledWith('Failed to load configs:', expect.any(Error));
    });

    consoleError.mockRestore();
  });

  it('should handle save failure with error response', async () => {
    (api.saveMappingConfig as jest.Mock).mockResolvedValue({
      success: false,
      error: 'Database error'
    });

    render(
      <SaveLoadConfig
        currentConfig={mockConfig}
        onLoad={mockOnLoad}
      />
    );

    fireEvent.click(screen.getByText(/Save Configuration/i));

    const nameInput = screen.getByPlaceholderText(/e\.g\., daily_pipeline_test_mapping/i);
    fireEvent.change(nameInput, { target: { value: 'test_config' } });

    const saveButton = screen.getByRole('button', { name: /^Save$/i });
    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(global.alert).toHaveBeenCalledWith('Failed to save: Database error');
    });
  });

  it('should handle save exception', async () => {
    (api.saveMappingConfig as jest.Mock).mockRejectedValue(new Error('Network error'));

    render(
      <SaveLoadConfig
        currentConfig={mockConfig}
        onLoad={mockOnLoad}
      />
    );

    fireEvent.click(screen.getByText(/Save Configuration/i));

    const nameInput = screen.getByPlaceholderText(/e\.g\., daily_pipeline_test_mapping/i);
    fireEvent.change(nameInput, { target: { value: 'test_config' } });

    const saveButton = screen.getByRole('button', { name: /^Save$/i });
    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(global.alert).toHaveBeenCalledWith('Error: Network error');
    });
  });

  it('should handle load failure with error response', async () => {
    (api.listMappingConfigs as jest.Mock).mockResolvedValue({
      success: true,
      configs: [{ id: 1, name: 'test_config', baseTableName: 'test_table', updatedAt: new Date().toISOString() }]
    });

    (api.loadMappingConfig as jest.Mock).mockResolvedValue({
      success: false,
      error: 'Config not found'
    });

    render(
      <SaveLoadConfig
        currentConfig={mockConfig}
        onLoad={mockOnLoad}
      />
    );

    fireEvent.click(screen.getByText(/Load Configuration/i));

    await waitFor(() => {
      expect(screen.getByText('test_config')).toBeInTheDocument();
    });

    const loadButton = screen.getAllByText('Load')[0];
    fireEvent.click(loadButton);

    await waitFor(() => {
      expect(global.alert).toHaveBeenCalledWith('Failed to load: Config not found');
    });
  });

  it('should handle load exception', async () => {
    (api.listMappingConfigs as jest.Mock).mockResolvedValue({
      success: true,
      configs: [{ id: 1, name: 'test_config', baseTableName: 'test_table', updatedAt: new Date().toISOString() }]
    });

    (api.loadMappingConfig as jest.Mock).mockRejectedValue(new Error('Server error'));

    render(
      <SaveLoadConfig
        currentConfig={mockConfig}
        onLoad={mockOnLoad}
      />
    );

    fireEvent.click(screen.getByText(/Load Configuration/i));

    await waitFor(() => {
      expect(screen.getByText('test_config')).toBeInTheDocument();
    });

    const loadButton = screen.getAllByText('Load')[0];
    fireEvent.click(loadButton);

    await waitFor(() => {
      expect(global.alert).toHaveBeenCalledWith('Error: Server error');
    });
  });

  it('should not delete when user cancels confirmation', async () => {
    (global.confirm as any).mockReturnValue(false);

    (api.listMappingConfigs as jest.Mock).mockResolvedValue({
      success: true,
      configs: [{ id: 1, name: 'to_delete', baseTableName: 'test_table', updatedAt: new Date().toISOString() }]
    });

    render(
      <SaveLoadConfig
        currentConfig={mockConfig}
        onLoad={mockOnLoad}
      />
    );

    fireEvent.click(screen.getByText(/Load Configuration/i));

    await waitFor(() => {
      expect(screen.getByText('to_delete')).toBeInTheDocument();
    });

    const deleteButton = screen.getByText('Delete');
    fireEvent.click(deleteButton);

    expect(global.confirm).toHaveBeenCalled();
    expect(api.deleteMappingConfig).not.toHaveBeenCalled();
  });

  it('should handle delete failure with error response', async () => {
    (global.confirm as any).mockReturnValue(true);

    (api.listMappingConfigs as jest.Mock).mockResolvedValue({
      success: true,
      configs: [{ id: 1, name: 'to_delete', baseTableName: 'test_table', updatedAt: new Date().toISOString() }]
    });

    (api.deleteMappingConfig as jest.Mock).mockResolvedValue({
      success: false,
      error: 'Delete failed'
    });

    render(
      <SaveLoadConfig
        currentConfig={mockConfig}
        onLoad={mockOnLoad}
      />
    );

    fireEvent.click(screen.getByText(/Load Configuration/i));

    await waitFor(() => {
      expect(screen.getByText('to_delete')).toBeInTheDocument();
    });

    const deleteButton = screen.getByText('Delete');
    fireEvent.click(deleteButton);

    await waitFor(() => {
      expect(global.alert).toHaveBeenCalledWith('Failed to delete: Delete failed');
    });
  });

  it('should handle delete exception', async () => {
    (global.confirm as any).mockReturnValue(true);

    (api.listMappingConfigs as jest.Mock).mockResolvedValue({
      success: true,
      configs: [{ id: 1, name: 'to_delete', baseTableName: 'test_table', updatedAt: new Date().toISOString() }]
    });

    (api.deleteMappingConfig as jest.Mock).mockRejectedValue(new Error('Database error'));

    render(
      <SaveLoadConfig
        currentConfig={mockConfig}
        onLoad={mockOnLoad}
      />
    );

    fireEvent.click(screen.getByText(/Load Configuration/i));

    await waitFor(() => {
      expect(screen.getByText('to_delete')).toBeInTheDocument();
    });

    const deleteButton = screen.getByText('Delete');
    fireEvent.click(deleteButton);

    await waitFor(() => {
      expect(global.alert).toHaveBeenCalledWith('Error: Database error');
    });
  });

  it('should show description when available in config list', async () => {
    (api.listMappingConfigs as jest.Mock).mockResolvedValue({
      success: true,
      configs: [{
        id: 1,
        name: 'test_config',
        description: 'This is a test description',
        baseTableName: 'test_table',
        updatedAt: new Date().toISOString()
      }]
    });

    render(
      <SaveLoadConfig
        currentConfig={mockConfig}
        onLoad={mockOnLoad}
      />
    );

    fireEvent.click(screen.getByText(/Load Configuration/i));

    await waitFor(() => {
      expect(screen.getByText('This is a test description')).toBeInTheDocument();
    });
  });

  it('should allow description input when saving', () => {
    render(
      <SaveLoadConfig
        currentConfig={mockConfig}
        onLoad={mockOnLoad}
      />
    );

    fireEvent.click(screen.getByText(/Save Configuration/i));

    const descriptionInput = screen.getByPlaceholderText(/Describe this mapping configuration.../i);
    fireEvent.change(descriptionInput, { target: { value: 'My test description' } });

    expect(descriptionInput).toHaveValue('My test description');
  });

  it('should close load modal when Close button clicked', async () => {
    (api.listMappingConfigs as jest.Mock).mockResolvedValue({
      success: true,
      configs: []
    });

    render(
      <SaveLoadConfig
        currentConfig={mockConfig}
        onLoad={mockOnLoad}
      />
    );

    fireEvent.click(screen.getByText(/Load Configuration/i));

    await waitFor(() => {
      expect(screen.getByText('Close')).toBeInTheDocument();
    });

    const closeButton = screen.getByText('Close');
    fireEvent.click(closeButton);

    expect(screen.queryByText('Close')).not.toBeInTheDocument();
  });
});
