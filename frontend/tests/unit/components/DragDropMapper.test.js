import { jsx as _jsx } from "react/jsx-runtime";
import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { DragDropMapper } from '../../../src/components/mapping/DragDropMapper';
import { api } from '../../../src/services/api';
// Mock the API
jest.mock('../../../src/services/api');
// Mock window.confirm and window.alert
global.confirm = jest.fn();
global.alert = jest.fn();
describe('DragDropMapper', () => {
    const mockFields = [
        {
            path: 'user.name',
            types: new Set(['string']),
            isArray: false,
            isNullable: false,
            samples: ['John'],
            occurrence: 10,
            suggestedTable: 'users',
            suggestedColumn: 'name',
            suggestedType: 'VARCHAR(255)'
        },
        {
            path: 'user.age',
            types: new Set(['number']),
            isArray: false,
            isNullable: false,
            samples: [30],
            occurrence: 10,
            suggestedTable: 'users',
            suggestedColumn: 'age',
            suggestedType: 'INT'
        }
    ];
    const mockTables = [
        {
            name: 'users',
            isNew: true,
            columns: [
                { name: 'id', type: 'INT', nullable: false, isPrimaryKey: true, default: null },
                { name: 'name', type: 'VARCHAR(255)', nullable: false, isPrimaryKey: false, default: null },
                { name: 'age', type: 'INT', nullable: true, isPrimaryKey: false, default: null }
            ]
        }
    ];
    const mockOnMappingsChange = jest.fn();
    beforeEach(() => {
        jest.clearAllMocks();
        global.confirm.mockReturnValue(true);
    });
    it('should render fields and tables', () => {
        render(_jsx(DragDropMapper, { fields: mockFields, tables: mockTables, onMappingsChange: mockOnMappingsChange }));
        expect(screen.getByText(/JSON Fields/)).toBeInTheDocument();
        expect(screen.getByText(/Target Tables/)).toBeInTheDocument();
        expect(screen.getByText('user.name')).toBeInTheDocument();
        expect(screen.getByText('user.age')).toBeInTheDocument();
        expect(screen.getByText('users')).toBeInTheDocument();
    });
    it('should show field count', () => {
        render(_jsx(DragDropMapper, { fields: mockFields, tables: mockTables, onMappingsChange: mockOnMappingsChange }));
        expect(screen.getByText(/JSON Fields \(2\)/)).toBeInTheDocument();
        expect(screen.getByText(/Target Tables \(1\)/)).toBeInTheDocument();
    });
    it('should display field types and suggested types', () => {
        render(_jsx(DragDropMapper, { fields: mockFields, tables: mockTables, onMappingsChange: mockOnMappingsChange }));
        expect(screen.getByText(/string • VARCHAR\(255\)/)).toBeInTheDocument();
        expect(screen.getByText(/number • INT/)).toBeInTheDocument();
    });
    it('should display table columns with types', () => {
        render(_jsx(DragDropMapper, { fields: mockFields, tables: mockTables, onMappingsChange: mockOnMappingsChange }));
        expect(screen.getByText('name')).toBeInTheDocument();
        expect(screen.getByText('age')).toBeInTheDocument();
        expect(screen.getAllByText(/VARCHAR\(255\)/).length).toBeGreaterThan(0);
    });
    it('should show primary key indicator', () => {
        render(_jsx(DragDropMapper, { fields: mockFields, tables: mockTables, onMappingsChange: mockOnMappingsChange }));
        const idColumn = screen.getByText('id').parentElement;
        expect(idColumn).toHaveTextContent('🔑');
    });
    it('should show NOT NULL indicator for non-nullable columns', () => {
        render(_jsx(DragDropMapper, { fields: mockFields, tables: mockTables, onMappingsChange: mockOnMappingsChange }));
        expect(screen.getAllByText(/NOT NULL/)).toHaveLength(2); // id and name are NOT NULL
    });
    it('should show array indicator for array fields', () => {
        const fieldsWithArray = [
            ...mockFields,
            {
                path: 'tags',
                types: new Set(['string']),
                isArray: true,
                isNullable: false,
                samples: [['tag1', 'tag2']],
                occurrence: 5,
                suggestedTable: 'tags',
                suggestedColumn: 'tag',
                suggestedType: 'VARCHAR(255)'
            }
        ];
        render(_jsx(DragDropMapper, { fields: fieldsWithArray, tables: mockTables, onMappingsChange: mockOnMappingsChange }));
        const tagsElement = screen.getByText('tags').parentElement;
        expect(tagsElement).toHaveTextContent('[]');
    });
    it('should show (New) indicator for new tables', () => {
        render(_jsx(DragDropMapper, { fields: mockFields, tables: mockTables, onMappingsChange: mockOnMappingsChange }));
        expect(screen.getByText('(New)')).toBeInTheDocument();
    });
    it('should show Load Saved Mapping button', () => {
        render(_jsx(DragDropMapper, { fields: mockFields, tables: mockTables, onMappingsChange: mockOnMappingsChange }));
        expect(screen.getByText(/Load Saved Mapping/)).toBeInTheDocument();
    });
    it('should not show Clear All button when no mappings', () => {
        render(_jsx(DragDropMapper, { fields: mockFields, tables: mockTables, onMappingsChange: mockOnMappingsChange }));
        expect(screen.queryByText(/Clear All Mappings/)).not.toBeInTheDocument();
    });
    it('should show Clear All button when mappings exist', () => {
        const initialMappings = [
            {
                sourcePath: 'user.name',
                targetTable: 'users',
                targetColumn: 'name',
                dataType: 'VARCHAR(255)',
                isArray: false
            }
        ];
        render(_jsx(DragDropMapper, { fields: mockFields, tables: mockTables, onMappingsChange: mockOnMappingsChange, initialMappings: initialMappings }));
        expect(screen.getByText(/Clear All Mappings/)).toBeInTheDocument();
    });
    it('should display mapping status when mappings exist', () => {
        const initialMappings = [
            {
                sourcePath: 'user.name',
                targetTable: 'users',
                targetColumn: 'name',
                dataType: 'VARCHAR(255)',
                isArray: false
            }
        ];
        render(_jsx(DragDropMapper, { fields: mockFields, tables: mockTables, onMappingsChange: mockOnMappingsChange, initialMappings: initialMappings }));
        expect(screen.getByText(/✓ 1 field\(s\) mapped/)).toBeInTheDocument();
        expect(screen.getByText(/1 remaining/)).toBeInTheDocument();
    });
    it('should clear all mappings when confirmed', () => {
        const initialMappings = [
            {
                sourcePath: 'user.name',
                targetTable: 'users',
                targetColumn: 'name',
                dataType: 'VARCHAR(255)',
                isArray: false
            }
        ];
        global.confirm.mockReturnValue(true);
        render(_jsx(DragDropMapper, { fields: mockFields, tables: mockTables, onMappingsChange: mockOnMappingsChange, initialMappings: initialMappings }));
        const clearButton = screen.getByText(/Clear All Mappings/);
        fireEvent.click(clearButton);
        expect(global.confirm).toHaveBeenCalledWith('Clear all mappings?');
        expect(mockOnMappingsChange).toHaveBeenCalledWith([]);
    });
    it('should not clear mappings when cancelled', () => {
        const initialMappings = [
            {
                sourcePath: 'user.name',
                targetTable: 'users',
                targetColumn: 'name',
                dataType: 'VARCHAR(255)',
                isArray: false
            }
        ];
        global.confirm.mockReturnValue(false);
        render(_jsx(DragDropMapper, { fields: mockFields, tables: mockTables, onMappingsChange: mockOnMappingsChange, initialMappings: initialMappings }));
        const clearButton = screen.getByText(/Clear All Mappings/);
        fireEvent.click(clearButton);
        expect(global.confirm).toHaveBeenCalled();
        expect(mockOnMappingsChange).not.toHaveBeenCalled();
    });
    it('should show mapped field with target information', () => {
        const initialMappings = [
            {
                sourcePath: 'user.name',
                targetTable: 'users',
                targetColumn: 'name',
                dataType: 'VARCHAR(255)',
                isArray: false
            }
        ];
        render(_jsx(DragDropMapper, { fields: mockFields, tables: mockTables, onMappingsChange: mockOnMappingsChange, initialMappings: initialMappings }));
        expect(screen.getByText(/✓ Mapped to: users\.name/)).toBeInTheDocument();
    });
    it('should remove mapping when Remove button clicked', () => {
        const initialMappings = [
            {
                sourcePath: 'user.name',
                targetTable: 'users',
                targetColumn: 'name',
                dataType: 'VARCHAR(255)',
                isArray: false
            }
        ];
        render(_jsx(DragDropMapper, { fields: mockFields, tables: mockTables, onMappingsChange: mockOnMappingsChange, initialMappings: initialMappings }));
        const removeButton = screen.getByText('Remove');
        fireEvent.click(removeButton);
        expect(mockOnMappingsChange).toHaveBeenCalledWith([]);
    });
    it('should open load mapping modal when Load button clicked', async () => {
        api.listMappingConfigs.mockResolvedValue({
            success: true,
            configs: []
        });
        render(_jsx(DragDropMapper, { fields: mockFields, tables: mockTables, onMappingsChange: mockOnMappingsChange }));
        const loadButton = screen.getByText(/Load Saved Mapping/);
        fireEvent.click(loadButton);
        await waitFor(() => {
            expect(screen.getByText('Load Saved Mapping')).toBeInTheDocument();
            expect(screen.getByText('Close')).toBeInTheDocument();
        });
    });
    it('should show loading state in modal', async () => {
        api.listMappingConfigs.mockImplementation(() => new Promise(resolve => setTimeout(resolve, 100)));
        render(_jsx(DragDropMapper, { fields: mockFields, tables: mockTables, onMappingsChange: mockOnMappingsChange }));
        const loadButton = screen.getByText(/Load Saved Mapping/);
        fireEvent.click(loadButton);
        expect(await screen.findByText('Loading...')).toBeInTheDocument();
    });
    it('should display saved mappings in modal', async () => {
        api.listMappingConfigs.mockResolvedValue({
            success: true,
            configs: [
                {
                    id: 1,
                    name: 'Test Mapping',
                    description: 'Test description',
                    baseTableName: 'users',
                    updatedAt: new Date('2024-01-01').toISOString()
                }
            ]
        });
        render(_jsx(DragDropMapper, { fields: mockFields, tables: mockTables, onMappingsChange: mockOnMappingsChange }));
        const loadButton = screen.getByText(/Load Saved Mapping/);
        fireEvent.click(loadButton);
        await waitFor(() => {
            expect(screen.getByText('Test Mapping')).toBeInTheDocument();
            expect(screen.getByText('Test description')).toBeInTheDocument();
            expect(screen.getByText(/Table: users/)).toBeInTheDocument();
        });
    });
    it('should show no mappings message when list is empty', async () => {
        api.listMappingConfigs.mockResolvedValue({
            success: true,
            configs: []
        });
        render(_jsx(DragDropMapper, { fields: mockFields, tables: mockTables, onMappingsChange: mockOnMappingsChange }));
        const loadButton = screen.getByText(/Load Saved Mapping/);
        fireEvent.click(loadButton);
        await waitFor(() => {
            expect(screen.getByText(/No saved mappings found/)).toBeInTheDocument();
        });
    });
    it('should filter mappings by base table name', async () => {
        api.listMappingConfigs.mockResolvedValue({
            success: true,
            configs: [
                { id: 1, name: 'Mapping 1', baseTableName: 'users', updatedAt: new Date().toISOString() },
                { id: 2, name: 'Mapping 2', baseTableName: 'posts', updatedAt: new Date().toISOString() }
            ]
        });
        render(_jsx(DragDropMapper, { fields: mockFields, tables: mockTables, onMappingsChange: mockOnMappingsChange, baseTableName: "users" }));
        const loadButton = screen.getByText(/Load Saved Mapping/);
        fireEvent.click(loadButton);
        await waitFor(() => {
            expect(screen.getByText('Mapping 1')).toBeInTheDocument();
            expect(screen.queryByText('Mapping 2')).not.toBeInTheDocument();
        });
    });
    it('should load mapping configuration when Load This Mapping clicked', async () => {
        api.listMappingConfigs.mockResolvedValue({
            success: true,
            configs: [
                {
                    id: 1,
                    name: 'Test Mapping',
                    baseTableName: 'users',
                    updatedAt: new Date().toISOString()
                }
            ]
        });
        api.loadMappingConfig.mockResolvedValue({
            success: true,
            config: {
                name: 'Test Mapping',
                mappings: [
                    {
                        sourcePath: 'user.name',
                        targetTable: 'users',
                        targetColumn: 'name',
                        dataType: 'VARCHAR(255)',
                        isArray: false
                    }
                ]
            }
        });
        render(_jsx(DragDropMapper, { fields: mockFields, tables: mockTables, onMappingsChange: mockOnMappingsChange }));
        const loadButton = screen.getByText(/📂 Load Saved Mapping/);
        fireEvent.click(loadButton);
        await waitFor(() => {
            expect(screen.getByText('Load This Mapping')).toBeInTheDocument();
        });
        const loadThisButton = screen.getByText('Load This Mapping');
        fireEvent.click(loadThisButton);
        await waitFor(() => {
            expect(api.loadMappingConfig).toHaveBeenCalledWith('Test Mapping');
            expect(mockOnMappingsChange).toHaveBeenCalled();
            expect(global.alert).toHaveBeenCalledWith("Mapping 'Test Mapping' loaded! 1 fields mapped.");
        });
    });
    it('should close modal when Close button clicked', async () => {
        api.listMappingConfigs.mockResolvedValue({
            success: true,
            configs: []
        });
        render(_jsx(DragDropMapper, { fields: mockFields, tables: mockTables, onMappingsChange: mockOnMappingsChange }));
        const loadButton = screen.getByText(/Load Saved Mapping/);
        fireEvent.click(loadButton);
        await waitFor(() => {
            expect(screen.getByText('Close')).toBeInTheDocument();
        });
        const closeButton = screen.getByText('Close');
        fireEvent.click(closeButton);
        await waitFor(() => {
            expect(screen.queryByText('Close')).not.toBeInTheDocument();
        });
    });
    it('should handle load mapping API error', async () => {
        api.listMappingConfigs.mockResolvedValue({
            success: true,
            configs: [
                { id: 1, name: 'Test', baseTableName: 'users', updatedAt: new Date().toISOString() }
            ]
        });
        api.loadMappingConfig.mockResolvedValue({
            success: false,
            error: 'Mapping not found'
        });
        render(_jsx(DragDropMapper, { fields: mockFields, tables: mockTables, onMappingsChange: mockOnMappingsChange }));
        const loadButton = screen.getByText(/Load Saved Mapping/);
        fireEvent.click(loadButton);
        await waitFor(() => {
            expect(screen.getByText('Load This Mapping')).toBeInTheDocument();
        });
        const loadThisButton = screen.getByText('Load This Mapping');
        fireEvent.click(loadThisButton);
        await waitFor(() => {
            expect(global.alert).toHaveBeenCalledWith('Failed: Mapping not found');
        });
    });
    it('should update mappings when initialMappings prop changes', () => {
        const { rerender } = render(_jsx(DragDropMapper, { fields: mockFields, tables: mockTables, onMappingsChange: mockOnMappingsChange, initialMappings: [] }));
        expect(screen.queryByText(/✓ Mapped to:/)).not.toBeInTheDocument();
        const newMappings = [
            {
                sourcePath: 'user.name',
                targetTable: 'users',
                targetColumn: 'name',
                dataType: 'VARCHAR(255)',
                isArray: false
            }
        ];
        rerender(_jsx(DragDropMapper, { fields: mockFields, tables: mockTables, onMappingsChange: mockOnMappingsChange, initialMappings: newMappings }));
        expect(screen.getByText(/✓ Mapped to: users\.name/)).toBeInTheDocument();
    });
});
