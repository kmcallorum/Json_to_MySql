import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { RelationshipEditor } from '../../../src/components/mapping/RelationshipEditor';

// Mock window.alert and window.confirm
global.alert = jest.fn() as any;
global.confirm = jest.fn() as any;

describe('RelationshipEditor', () => {
  const mockTables = [
    {
      name: 'users',
      columns: [
        { name: 'id', type: 'INT' },
        { name: 'name', type: 'VARCHAR(255)' }
      ]
    },
    {
      name: 'posts',
      columns: [
        { name: 'id', type: 'INT' },
        { name: 'user_id', type: 'INT' },
        { name: 'title', type: 'VARCHAR(255)' }
      ]
    },
    {
      name: 'comments',
      columns: [
        { name: 'id', type: 'INT' },
        { name: 'post_id', type: 'INT' },
        { name: 'content', type: 'TEXT' }
      ]
    }
  ];

  const mockOnRelationshipsChange = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    (global.confirm as any).mockReturnValue(true);
  });

  it('should render relationship editor with title', () => {
    render(
      <RelationshipEditor
        tables={mockTables}
        relationships={[]}
        onRelationshipsChange={mockOnRelationshipsChange}
      />
    );

    expect(screen.getByText('Table Relationships (Optional)')).toBeInTheDocument();
  });

  it('should show auto-detect button', () => {
    render(
      <RelationshipEditor
        tables={mockTables}
        relationships={[]}
        onRelationshipsChange={mockOnRelationshipsChange}
      />
    );

    expect(screen.getByText(/Auto-Detect Relationships/)).toBeInTheDocument();
  });

  it('should show add relationship button', () => {
    render(
      <RelationshipEditor
        tables={mockTables}
        relationships={[]}
        onRelationshipsChange={mockOnRelationshipsChange}
      />
    );

    expect(screen.getByText('+ Add Relationship')).toBeInTheDocument();
  });

  it('should auto-detect relationships based on _id pattern', () => {
    // Create tables with matching names for auto-detect to work
    const tablesForAutoDetect = [
      {
        name: 'user',
        columns: [
          { name: 'id', type: 'INT' },
          { name: 'name', type: 'VARCHAR(255)' }
        ]
      },
      {
        name: 'post',
        columns: [
          { name: 'id', type: 'INT' },
          { name: 'user_id', type: 'INT' },
          { name: 'title', type: 'VARCHAR(255)' }
        ]
      },
      {
        name: 'comment',
        columns: [
          { name: 'id', type: 'INT' },
          { name: 'post_id', type: 'INT' },
          { name: 'content', type: 'TEXT' }
        ]
      }
    ];

    render(
      <RelationshipEditor
        tables={tablesForAutoDetect}
        relationships={[]}
        onRelationshipsChange={mockOnRelationshipsChange}
      />
    );

    const autoDetectButton = screen.getByText(/Auto-Detect Relationships/);
    fireEvent.click(autoDetectButton);

    const calledWith = mockOnRelationshipsChange.mock.calls[0][0];
    expect(calledWith).toHaveLength(2);
    expect(calledWith).toContainEqual({
      parentTable: 'user',
      childTable: 'post',
      foreignKeyColumn: 'user_id',
      parentKeyColumn: 'id'
    });
    expect(calledWith).toContainEqual({
      parentTable: 'post',
      childTable: 'comment',
      foreignKeyColumn: 'post_id',
      parentKeyColumn: 'id'
    });
    expect(global.alert).toHaveBeenCalledWith('Auto-detected 2 relationship(s)!');
  });

  it('should not detect relationships when no _id columns exist', () => {
    const tablesWithoutFKs = [
      {
        name: 'users',
        columns: [
          { name: 'id', type: 'INT' },
          { name: 'name', type: 'VARCHAR(255)' }
        ]
      }
    ];

    render(
      <RelationshipEditor
        tables={tablesWithoutFKs}
        relationships={[]}
        onRelationshipsChange={mockOnRelationshipsChange}
      />
    );

    const autoDetectButton = screen.getByText(/Auto-Detect Relationships/);
    fireEvent.click(autoDetectButton);

    expect(mockOnRelationshipsChange).toHaveBeenCalledWith([]);
    expect(global.alert).toHaveBeenCalledWith('Auto-detected 0 relationship(s)!');
  });

  it('should open modal when Add Relationship is clicked', () => {
    render(
      <RelationshipEditor
        tables={mockTables}
        relationships={[]}
        onRelationshipsChange={mockOnRelationshipsChange}
      />
    );

    const addButton = screen.getByText('+ Add Relationship');
    fireEvent.click(addButton);

    expect(screen.getByRole('heading', { name: /Add Relationship/ })).toBeInTheDocument();
    expect(screen.getByText('Parent Table *')).toBeInTheDocument();
    expect(screen.getByText('Child Table *')).toBeInTheDocument();
  });

  it('should display existing relationships', () => {
    const existingRelationships = [
      {
        parentTable: 'users',
        childTable: 'posts',
        foreignKeyColumn: 'user_id',
        parentKeyColumn: 'id'
      }
    ];

    render(
      <RelationshipEditor
        tables={mockTables}
        relationships={existingRelationships}
        onRelationshipsChange={mockOnRelationshipsChange}
      />
    );

    expect(screen.getByText(/Defined Relationships \(1\):/)).toBeInTheDocument();
    expect(screen.getAllByText('users').length).toBeGreaterThan(0);
    expect(screen.getAllByText('posts').length).toBeGreaterThan(0);
  });

  it('should show relationship details correctly', () => {
    const existingRelationships = [
      {
        parentTable: 'users',
        childTable: 'posts',
        foreignKeyColumn: 'user_id',
        parentKeyColumn: 'id'
      }
    ];

    render(
      <RelationshipEditor
        tables={mockTables}
        relationships={existingRelationships}
        onRelationshipsChange={mockOnRelationshipsChange}
      />
    );

    // Text is split across multiple elements, so check for parts
    expect(screen.getAllByText('users').length).toBeGreaterThan(0);
    expect(screen.getByText('→')).toBeInTheDocument();
    // Check for parts of the relationship display
    expect(screen.getAllByText(/posts/).length).toBeGreaterThan(0);
  });

  it('should show Edit and Delete buttons for relationships', () => {
    const existingRelationships = [
      {
        parentTable: 'users',
        childTable: 'posts',
        foreignKeyColumn: 'user_id',
        parentKeyColumn: 'id'
      }
    ];

    render(
      <RelationshipEditor
        tables={mockTables}
        relationships={existingRelationships}
        onRelationshipsChange={mockOnRelationshipsChange}
      />
    );

    expect(screen.getByText('Edit')).toBeInTheDocument();
    expect(screen.getByText('Delete')).toBeInTheDocument();
  });

  it('should delete relationship when Delete is clicked and confirmed', () => {
    const existingRelationships = [
      {
        parentTable: 'users',
        childTable: 'posts',
        foreignKeyColumn: 'user_id',
        parentKeyColumn: 'id'
      }
    ];

    (global.confirm as any).mockReturnValue(true);

    render(
      <RelationshipEditor
        tables={mockTables}
        relationships={existingRelationships}
        onRelationshipsChange={mockOnRelationshipsChange}
      />
    );

    const deleteButton = screen.getByText('Delete');
    fireEvent.click(deleteButton);

    expect(global.confirm).toHaveBeenCalledWith('Delete this relationship?');
    expect(mockOnRelationshipsChange).toHaveBeenCalledWith([]);
  });

  it('should not delete relationship when Delete is cancelled', () => {
    const existingRelationships = [
      {
        parentTable: 'users',
        childTable: 'posts',
        foreignKeyColumn: 'user_id',
        parentKeyColumn: 'id'
      }
    ];

    (global.confirm as any).mockReturnValue(false);

    render(
      <RelationshipEditor
        tables={mockTables}
        relationships={existingRelationships}
        onRelationshipsChange={mockOnRelationshipsChange}
      />
    );

    const deleteButton = screen.getByText('Delete');
    fireEvent.click(deleteButton);

    expect(global.confirm).toHaveBeenCalled();
    expect(mockOnRelationshipsChange).not.toHaveBeenCalled();
  });

  it('should populate form when Edit is clicked', () => {
    const existingRelationships = [
      {
        parentTable: 'users',
        childTable: 'posts',
        foreignKeyColumn: 'user_id',
        parentKeyColumn: 'id'
      }
    ];

    render(
      <RelationshipEditor
        tables={mockTables}
        relationships={existingRelationships}
        onRelationshipsChange={mockOnRelationshipsChange}
      />
    );

    const editButton = screen.getByText('Edit');
    fireEvent.click(editButton);

    expect(screen.getByRole('heading', { name: /Edit Relationship/ })).toBeInTheDocument();

    const selects = screen.getAllByRole('combobox');
    const parentTableSelect = selects[0] as HTMLSelectElement;
    const childTableSelect = selects[2] as HTMLSelectElement;

    expect(parentTableSelect.value).toBe('users');
    expect(childTableSelect.value).toBe('posts');
  });

  it('should show all tables in parent table dropdown', () => {
    render(
      <RelationshipEditor
        tables={mockTables}
        relationships={[]}
        onRelationshipsChange={mockOnRelationshipsChange}
      />
    );

    const addButton = screen.getByText('+ Add Relationship');
    fireEvent.click(addButton);

    // Check that all tables are available
    expect(screen.getByText('-- Select Parent Table --')).toBeInTheDocument();
    const selects = screen.getAllByRole('combobox');
    const parentTableSelect = selects[0] as HTMLSelectElement;
    const options = Array.from(parentTableSelect.options);
    const tableOptions = options.filter(opt => mockTables.some(t => opt.textContent === t.name));
    expect(tableOptions.length).toBe(3);
  });

  it('should filter out parent table from child table dropdown', () => {
    render(
      <RelationshipEditor
        tables={mockTables}
        relationships={[]}
        onRelationshipsChange={mockOnRelationshipsChange}
      />
    );

    const addButton = screen.getByText('+ Add Relationship');
    fireEvent.click(addButton);

    const selects = screen.getAllByRole('combobox');
    const parentTableSelect = selects[0] as HTMLSelectElement;
    fireEvent.change(parentTableSelect, { target: { value: 'users' } });

    // Child table should not include the selected parent table
    const childTableSelect = selects[2] as HTMLSelectElement;
    const childOptions = Array.from(childTableSelect.options).map(opt => opt.value);

    expect(childOptions).not.toContain('users');
    expect(childOptions).toContain('posts');
    expect(childOptions).toContain('comments');
  });

  it('should show parent columns when parent table is selected', () => {
    render(
      <RelationshipEditor
        tables={mockTables}
        relationships={[]}
        onRelationshipsChange={mockOnRelationshipsChange}
      />
    );

    const addButton = screen.getByText('+ Add Relationship');
    fireEvent.click(addButton);

    const selects = screen.getAllByRole('combobox');
    const parentTableSelect = selects[0] as HTMLSelectElement;
    fireEvent.change(parentTableSelect, { target: { value: 'users' } });

    const parentKeySelect = selects[1] as HTMLSelectElement;
    expect(parentKeySelect).not.toBeDisabled();

    const options = Array.from(parentKeySelect.options).map(opt => opt.value);
    expect(options).toContain('id');
    expect(options).toContain('name');
  });

  it('should show child columns when child table is selected', () => {
    render(
      <RelationshipEditor
        tables={mockTables}
        relationships={[]}
        onRelationshipsChange={mockOnRelationshipsChange}
      />
    );

    const addButton = screen.getByText('+ Add Relationship');
    fireEvent.click(addButton);

    const selects = screen.getAllByRole('combobox');
    const childTableSelect = selects[2] as HTMLSelectElement;
    fireEvent.change(childTableSelect, { target: { value: 'posts' } });

    const foreignKeySelect = selects[3] as HTMLSelectElement;
    expect(foreignKeySelect).not.toBeDisabled();

    const options = Array.from(foreignKeySelect.options).map(opt => opt.textContent || '');
    expect(options.some(opt => opt.includes('user_id'))).toBe(true);
  });

  it('should disable parent key column select when no parent table selected', () => {
    render(
      <RelationshipEditor
        tables={mockTables}
        relationships={[]}
        onRelationshipsChange={mockOnRelationshipsChange}
      />
    );

    const addButton = screen.getByText('+ Add Relationship');
    fireEvent.click(addButton);

    const selects = screen.getAllByRole('combobox');
    const parentKeySelect = selects[1] as HTMLSelectElement;
    expect(parentKeySelect).toBeDisabled();
  });

  it('should disable foreign key column select when no child table selected', () => {
    render(
      <RelationshipEditor
        tables={mockTables}
        relationships={[]}
        onRelationshipsChange={mockOnRelationshipsChange}
      />
    );

    const addButton = screen.getByText('+ Add Relationship');
    fireEvent.click(addButton);

    const selects = screen.getAllByRole('combobox');
    const foreignKeySelect = selects[3] as HTMLSelectElement;
    expect(foreignKeySelect).toBeDisabled();
  });

  it('should disable submit button when not all fields are filled', () => {
    render(
      <RelationshipEditor
        tables={mockTables}
        relationships={[]}
        onRelationshipsChange={mockOnRelationshipsChange}
      />
    );

    const addButton = screen.getByText('+ Add Relationship');
    fireEvent.click(addButton);

    // Get all buttons and find the submit button
    const buttons = screen.getAllByRole('button');
    const submitButton = buttons.find(btn => btn.textContent?.includes('Add Relationship') && !btn.textContent?.includes('+')) as HTMLButtonElement;

    expect(submitButton).toBeDisabled();
    expect(mockOnRelationshipsChange).not.toHaveBeenCalled();
  });

  it('should add new relationship when form is complete', () => {
    render(
      <RelationshipEditor
        tables={mockTables}
        relationships={[]}
        onRelationshipsChange={mockOnRelationshipsChange}
      />
    );

    const addButton = screen.getByText('+ Add Relationship');
    fireEvent.click(addButton);

    const selects = screen.getAllByRole('combobox');
    const parentTableSelect = selects[0] as HTMLSelectElement;
    fireEvent.change(parentTableSelect, { target: { value: 'users' } });

    const childTableSelect = selects[2] as HTMLSelectElement;
    fireEvent.change(childTableSelect, { target: { value: 'posts' } });

    const foreignKeySelect = selects[3] as HTMLSelectElement;
    fireEvent.change(foreignKeySelect, { target: { value: 'user_id' } });

    const submitButton = screen.getAllByText('Add Relationship')[1]; // Second one is the button
    fireEvent.click(submitButton);

    expect(mockOnRelationshipsChange).toHaveBeenCalledWith([
      {
        parentTable: 'users',
        childTable: 'posts',
        foreignKeyColumn: 'user_id',
        parentKeyColumn: 'id'
      }
    ]);
  });

  it('should close modal after adding relationship', () => {
    render(
      <RelationshipEditor
        tables={mockTables}
        relationships={[]}
        onRelationshipsChange={mockOnRelationshipsChange}
      />
    );

    const addButton = screen.getByText('+ Add Relationship');
    fireEvent.click(addButton);

    const selects = screen.getAllByRole('combobox');
    const parentTableSelect = selects[0] as HTMLSelectElement;
    fireEvent.change(parentTableSelect, { target: { value: 'users' } });

    const childTableSelect = selects[2] as HTMLSelectElement;
    fireEvent.change(childTableSelect, { target: { value: 'posts' } });

    const foreignKeySelect = selects[3] as HTMLSelectElement;
    fireEvent.change(foreignKeySelect, { target: { value: 'user_id' } });

    const submitButton = screen.getAllByText('Add Relationship')[1]; // Second one is the button
    fireEvent.click(submitButton);

    expect(screen.queryByRole('heading', { name: /Add Relationship/ })).not.toBeInTheDocument();
  });

  it('should update relationship when editing', () => {
    const existingRelationships = [
      {
        parentTable: 'users',
        childTable: 'posts',
        foreignKeyColumn: 'user_id',
        parentKeyColumn: 'id'
      }
    ];

    render(
      <RelationshipEditor
        tables={mockTables}
        relationships={existingRelationships}
        onRelationshipsChange={mockOnRelationshipsChange}
      />
    );

    const editButton = screen.getByText('Edit');
    fireEvent.click(editButton);

    const selects = screen.getAllByRole('combobox');
    const foreignKeySelect = selects[3] as HTMLSelectElement;
    fireEvent.change(foreignKeySelect, { target: { value: 'title' } });

    const updateButton = screen.getByText('Update Relationship');
    fireEvent.click(updateButton);

    expect(mockOnRelationshipsChange).toHaveBeenCalledWith([
      {
        parentTable: 'users',
        childTable: 'posts',
        foreignKeyColumn: 'title',
        parentKeyColumn: 'id'
      }
    ]);
  });

  it('should close modal when Cancel is clicked', () => {
    render(
      <RelationshipEditor
        tables={mockTables}
        relationships={[]}
        onRelationshipsChange={mockOnRelationshipsChange}
      />
    );

    const addButton = screen.getByText('+ Add Relationship');
    fireEvent.click(addButton);

    expect(screen.getByRole('heading', { name: /Add Relationship/ })).toBeInTheDocument();

    const cancelButton = screen.getByText('Cancel');
    fireEvent.click(cancelButton);

    expect(screen.queryByRole('heading', { name: /Add Relationship/ })).not.toBeInTheDocument();
  });

  it('should reset form when Cancel is clicked', () => {
    render(
      <RelationshipEditor
        tables={mockTables}
        relationships={[]}
        onRelationshipsChange={mockOnRelationshipsChange}
      />
    );

    const addButton = screen.getByText('+ Add Relationship');
    fireEvent.click(addButton);

    const selects = screen.getAllByRole('combobox');
    const parentTableSelect = selects[0] as HTMLSelectElement;
    fireEvent.change(parentTableSelect, { target: { value: 'users' } });

    const cancelButton = screen.getByText('Cancel');
    fireEvent.click(cancelButton);

    // Open modal again
    const addButton2 = screen.getByText('+ Add Relationship');
    fireEvent.click(addButton2);

    const selects2 = screen.getAllByRole('combobox');
    const parentTableSelect2 = selects2[0] as HTMLSelectElement;
    expect(parentTableSelect2.value).toBe('');
  });

  it('should show insert order preview for relationships', () => {
    const existingRelationships = [
      {
        parentTable: 'users',
        childTable: 'posts',
        foreignKeyColumn: 'user_id',
        parentKeyColumn: 'id'
      },
      {
        parentTable: 'posts',
        childTable: 'comments',
        foreignKeyColumn: 'post_id',
        parentKeyColumn: 'id'
      }
    ];

    render(
      <RelationshipEditor
        tables={mockTables}
        relationships={existingRelationships}
        onRelationshipsChange={mockOnRelationshipsChange}
      />
    );

    expect(screen.getByText('Insert Order Preview:')).toBeInTheDocument();
  });

  it('should display hierarchy tree correctly', () => {
    const existingRelationships = [
      {
        parentTable: 'users',
        childTable: 'posts',
        foreignKeyColumn: 'user_id',
        parentKeyColumn: 'id'
      }
    ];

    render(
      <RelationshipEditor
        tables={mockTables}
        relationships={existingRelationships}
        onRelationshipsChange={mockOnRelationshipsChange}
      />
    );

    const hierarchyDiv = screen.getByText('Insert Order Preview:').nextElementSibling;
    expect(hierarchyDiv).toBeInTheDocument();
    expect(hierarchyDiv?.textContent).toContain('users');
    expect(hierarchyDiv?.textContent).toContain('posts');
  });

  it('should show example in form modal', () => {
    render(
      <RelationshipEditor
        tables={mockTables}
        relationships={[]}
        onRelationshipsChange={mockOnRelationshipsChange}
      />
    );

    const addButton = screen.getByText('+ Add Relationship');
    fireEvent.click(addButton);

    expect(screen.getByText(/Example:/)).toBeInTheDocument();
    expect(screen.getByText(/document\.id is parent/)).toBeInTheDocument();
  });

  it('should default parent key column to id', () => {
    render(
      <RelationshipEditor
        tables={mockTables}
        relationships={[]}
        onRelationshipsChange={mockOnRelationshipsChange}
      />
    );

    const addButton = screen.getByText('+ Add Relationship');
    fireEvent.click(addButton);

    const selects = screen.getAllByRole('combobox');
    const parentKeySelect = selects[1] as HTMLSelectElement;
    expect(parentKeySelect.value).toBe('id');
  });

  it('should show column type in foreign key dropdown', () => {
    render(
      <RelationshipEditor
        tables={mockTables}
        relationships={[]}
        onRelationshipsChange={mockOnRelationshipsChange}
      />
    );

    const addButton = screen.getByText('+ Add Relationship');
    fireEvent.click(addButton);

    const selects = screen.getAllByRole('combobox');
    const childTableSelect = selects[2] as HTMLSelectElement;
    fireEvent.change(childTableSelect, { target: { value: 'posts' } });

    const foreignKeySelect = selects[3] as HTMLSelectElement;
    const options = Array.from(foreignKeySelect.options).map(opt => opt.textContent || '');

    expect(options.some(opt => opt.includes('INT'))).toBe(true);
    expect(options.some(opt => opt.includes('VARCHAR'))).toBe(true);
  });
});
