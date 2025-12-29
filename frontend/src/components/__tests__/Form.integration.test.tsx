import React, { useState } from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { Button } from '../Button';
import { TextField } from '../TextField';

// Simple form component for integration testing
const SimpleForm: React.FC = () => {
  const [value, setValue] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = () => {
    setSubmitted(true);
  };

  return (
    <div>
      <TextField 
        value={value} 
        onChange={setValue} 
        placeholder="Enter name"
      />
      <Button label="Submit" onClick={handleSubmit} />
      {submitted && <div data-testid="success">Form submitted!</div>}
    </div>
  );
};

describe('Form Integration', () => {
  it('should submit form with text input', () => {
    render(<SimpleForm />);
    
    // Type in text field
    const input = screen.getByTestId('textfield');
    fireEvent.change(input, { target: { value: 'John Doe' } });
    
    // Click submit button
    const button = screen.getByTestId('button');
    fireEvent.click(button);
    
    // Verify success message appears
    expect(screen.getByTestId('success')).toHaveTextContent('Form submitted!');
  });
});
