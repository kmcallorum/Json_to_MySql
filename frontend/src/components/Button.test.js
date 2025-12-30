import { jsx as _jsx } from "react/jsx-runtime";
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { Button } from './Button';
describe('Button', () => {
    it('should render button with label', () => {
        render(_jsx(Button, { label: "Click me" }));
        expect(screen.getByTestId('button')).toHaveTextContent('Click me');
    });
    it('should be in the document', () => {
        render(_jsx(Button, { label: "Test" }));
        expect(screen.getByTestId('button')).toBeInTheDocument();
    });
});
