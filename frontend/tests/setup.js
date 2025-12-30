import '@testing-library/jest-dom';
// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: jest.fn().mockImplementation(query => ({
        matches: false,
        media: query,
        onchange: null,
        addListener: jest.fn(),
        removeListener: jest.fn(),
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
        dispatchEvent: jest.fn(),
    })),
});
// Mock IntersectionObserver
class IntersectionObserverMock {
    constructor() {
        this.observe = jest.fn();
        this.disconnect = jest.fn();
        this.unobserve = jest.fn();
    }
}
Object.defineProperty(window, 'IntersectionObserver', {
    writable: true,
    configurable: true,
    value: IntersectionObserverMock,
});
// Mock ResizeObserver
class ResizeObserverMock {
    constructor() {
        this.observe = jest.fn();
        this.disconnect = jest.fn();
        this.unobserve = jest.fn();
    }
}
Object.defineProperty(window, 'ResizeObserver', {
    writable: true,
    configurable: true,
    value: ResizeObserverMock,
});
