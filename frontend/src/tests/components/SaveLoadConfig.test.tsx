import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { SaveLoadConfig } from '../../components/mapping/SaveLoadConfig';
import { api } from '../../services/api';

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
    global.alert = jest.fn();
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
});
