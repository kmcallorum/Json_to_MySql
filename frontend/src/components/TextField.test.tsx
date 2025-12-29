import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { TextField } from './TextField';

describe('TextField', () => {
  it('should render with value', () => {
    render(<TextField value="hello" onChange={() => {}} />);
    expect(screen.getByTestId('textfield')).toHaveValue('hello');
  });

  it('should call onChange when typing', () => {
    const handleChange = jest.fn();
    render(<TextField value="" onChange={handleChange} />);
    
    fireEvent.change(screen.getByTestId('textfield'), {
      target: { value: 'new value' },
    });
    
    expect(handleChange).toHaveBeenCalledWith('new value');
  });

  it('should display placeholder', () => {
    render(<TextField value="" onChange={() => {}} placeholder="Enter text" />);
    expect(screen.getByPlaceholderText('Enter text')).toBeInTheDocument();
  });
});
