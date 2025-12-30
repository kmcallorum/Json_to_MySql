import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { Button } from '../Button';
import { TextField } from '../TextField';
// Simple form component for integration testing
const SimpleForm = () => {
    const [value, setValue] = useState('');
    const [submitted, setSubmitted] = useState(false);
    const handleSubmit = () => {
        setSubmitted(true);
    };
    return (_jsxs("div", { children: [_jsx(TextField, { value: value, onChange: setValue, placeholder: "Enter name" }), _jsx(Button, { label: "Submit", onClick: handleSubmit }), submitted && _jsx("div", { "data-testid": "success", children: "Form submitted!" })] }));
};
describe('Form Integration', () => {
    it('should submit form with text input', () => {
        render(_jsx(SimpleForm, {}));
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
