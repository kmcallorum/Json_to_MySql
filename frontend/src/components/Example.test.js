import { screen } from '@testing-library/react';
describe('Example Test', () => {
    it('should pass basic test', () => {
        const div = document.createElement('div');
        div.textContent = 'Hello World';
        document.body.appendChild(div);
        expect(screen.getByText('Hello World')).toBeInTheDocument();
    });
});
