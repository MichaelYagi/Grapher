/**
 * Jest setup file for frontend JavaScript tests.
 * Configures test environment and global mocks.
 */

// Import JSDOM for DOM testing
require('jest-environment-jsdom');

// Mock global fetch for API testing
global.fetch = jest.fn(() =>
    Promise.resolve({
        ok: true,
        status: 200,
        json: () => Promise.resolve({}),
        text: () => Promise.resolve('')
    })
);

// Mock localStorage
const localStorageMock = (() => {
    let store = {};
    return {
        getItem: jest.fn((key) => store[key] || null),
        setItem: jest.fn((key, value) => {
            store[key] = value.toString();
        }),
        removeItem: jest.fn((key) => {
            delete store[key];
        }),
        clear: jest.fn(() => {
            store = {};
        })
    };
})();

Object.defineProperty(window, 'localStorage', {
    value: localStorageMock
});

// Mock WebSocket (if needed)
global.WebSocket = jest.fn(() => ({
    close: jest.fn(),
    send: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn()
}));

// Mock console methods to reduce noise in tests
const originalConsole = { ...console };
global.console = {
    ...originalConsole,
    // Suppress console.log in tests unless debugging
    log: jest.fn(),
    warn: jest.fn(),
    error: jest.fn()
};

// Test utilities
global.testUtils = {
    // Helper to create mock DOM elements
    createElement: (tag, attributes = {}) => {
        const element = {
            tag,
            attributes: {},
            children: [],
            classList: {
                add: jest.fn(),
                remove: jest.fn(),
                contains: jest.fn()
            },
            style: {},
            addEventListener: jest.fn(),
            removeEventListener: jest.fn(),
            setAttribute: jest.fn((attr, value) => {
                element.attributes[attr] = value;
            }),
            getAttribute: jest.fn((attr) => element.attributes[attr]),
            appendChild: jest.fn((child) => {
                element.children.push(child);
            }),
            textContent: ''
        };
        
        Object.assign(element.attributes, attributes);
        return element;
    },
    
    // Helper to create mock coordinate data
    createCoordinates: (startX, endX, count, fn) => {
        const coords = [];
        const step = (endX - startX) / (count - 1);
        
        for (let i = 0; i < count; i++) {
            const x = startX + (i * step);
            const y = fn(x);
            coords.push({ x, y });
        }
        
        return coords;
    },
    
    // Helper to compare floating point numbers with tolerance
    approxEquals: (a, b, tolerance = 1e-10) => {
        return Math.abs(a - b) < tolerance;
    },
    
    // Helper to wait for async operations
    waitFor: (condition, timeout = 1000) => {
        return new Promise((resolve, reject) => {
            const startTime = Date.now();
            
            const check = () => {
                if (condition()) {
                    resolve();
                } else if (Date.now() - startTime > timeout) {
                    reject(new Error('Timeout waiting for condition'));
                } else {
                    setTimeout(check, 10);
                }
            };
            
            check();
        });
    }
};

// Reset mocks before each test
beforeEach(() => {
    // Clear all mock calls
    jest.clearAllMocks();
    
    // Reset localStorage
    localStorageMock.clear();
    
    // Reset fetch mock
    global.fetch.mockClear();
});

// Cleanup after each test
afterEach(() => {
    // Restore console
    global.console = originalConsole;
});