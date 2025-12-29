import React from 'react';

interface TextFieldProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

export const TextField: React.FC<TextFieldProps> = ({ 
  value, 
  onChange, 
  placeholder 
}) => {
  return (
    <input
      type="text"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      data-testid="textfield"
    />
  );
};
