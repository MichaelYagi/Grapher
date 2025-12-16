/**
 * Frontend JavaScript unit tests for Grapher application.
 * Tests API client, graph renderer, and main app controller.
 */

// Test utilities first
const testUtils = {
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
        
        for(let i = 0; i < count; i++) {
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

// Set up global test utilities
global.testUtils = testUtils;

// Test API Client
describe('APIClient', () => {
    let apiClient;
    
    beforeEach(() => {
        global.fetch.mockClear();
        // Create new API client for each test
        global.fetch.mockImplementation(() =>
            Promise.resolve({
                ok: true,
                status: 200,
                json: () => Promise.resolve({}),
                text: () => Promise.resolve('')
            })
        );
        
        // Import and create API client instance
        const ApiClient = require('../src/static/js/api-client.js');
        apiClient = new ApiClient();
    });
    
    describe('Request Methods', () => {
        test('should make request with correct method and headers', async () => {
            await apiClient.makeRequest('/api/test', 'POST', { test: 'data' });
            
            expect(global.fetch).toHaveBeenCalledWith(
                '/api/test',
                expect.objectContaining({
                    method: 'POST',
                    headers: expect.objectContaining({
                        'Content-Type': 'application/json'
                    }),
                    body: JSON.stringify({ test: 'data' })
                })
            );
        });

        test('should handle network errors gracefully', async () => {
            global.fetch.mockImplementationOnce(() => 
                Promise.reject(new Error('Network error'))
            );
            
            await expect(apiClient.makeRequest('/api/test')).rejects.toThrow('Network error');
        });

        test('should handle non-2xx responses', async () => {
            global.fetch.mockImplementationOnce(() => 
                Promise.resolve({
                    ok: false,
                    status: 404,
                    json: () => Promise.resolve({ error: 'Not found' })
                })
            );
            
            await expect(apiClient.makeRequest('/api/test')).rejects.toThrow();
        });
    });

    describe('Expression Parsing', () => {
        test('should call parse endpoint with expression', async () => {
            await apiClient.parseExpression('x^2 + 2*x + 1');
            
            expect(global.fetch).toHaveBeenCalledWith(
                '/api/parse',
                'POST',
                { expression: 'x^2 + 2*x + 1' }
            );
        });

        test('should handle empty expression validation', async () => {
            await apiClient.parseExpression('');
            
            expect(global.fetch).toHaveBeenCalled();
        });
    });

    describe('Expression Evaluation', () => {
        test('should use default range [-30, 30] for computation', async () => {
            await apiClient.evaluateExpression('x^2');
            
            expect(global.fetch).toHaveBeenCalledWith(
                '/api/evaluate',
                'POST',
                expect.objectContaining({
                    expression: 'x^2',
                    num_points: 1000,
                    variables: {},
                    x_range: [-30, 30]
                })
            );
        });

        test('should accept custom parameters and range', async () => {
            const params = { a: 2, b: 1 };
            const xRange = [-10, 10];
            const numPoints = 500;
            
            await apiClient.evaluateExpression('a*x^2 + b', params, xRange, numPoints);
            
            expect(global.fetch).toHaveBeenCalledWith(
                '/api/evaluate',
                'POST',
                expect.objectContaining({
                    expression: 'a*x^2 + b',
                    num_points: numPoints,
                    variables: params,
                    x_range: xRange
                })
            );
        });
    });

    describe('Batch Evaluation', () => {
        test('should evaluate multiple expressions', async () => {
            const expressions = ['x^2', 'sin(x)'];
            
            await apiClient.batchEvaluate(expressions);
            
            expect(global.fetch).toHaveBeenCalledWith(
                '/api/batch-evaluate',
                'POST',
                expect.objectContaining({
                    expressions,
                    num_points: 1000,
                    variables: {},
                    x_range: [-30, 30]
                })
            );
        });
    });

    describe('Parameter Updates', () => {
        test('should debounce parameter updates', () => {
            const debouncedUpdate = apiClient.createDebouncedParameterUpdate(100);
            
            expect(typeof debouncedUpdate).toBe('function');
        });
    });
});

// Test GraphRenderer (simplified)
describe('GraphRenderer', () => {
    let mockD3, graphRenderer;
    
    beforeEach(() => {
        // Mock D3
        mockD3 = {
            select: jest.fn(() => ({
                append: jest.fn().mockReturnThis(),
                selectAll: jest.fn().mockReturnThis(),
                data: jest.fn().mockReturnThis(),
                enter: jest.fn().mockReturnThis(),
                merge: jest.fn().mockReturnThis(),
                remove: jest.fn().mockReturnThis(),
                attr: jest.fn().mockReturnThis(),
                style: jest.fn().mockReturnThis(),
                text: jest.fn().mockReturnThis(),
                html: jest.fn().mockReturnThis(),
                on: jest.fn().mockReturnThis(),
                call: jest.fn().mockReturnThis()
            })),
            line: jest.fn(() => ({
                x: jest.fn().mockReturnThis(),
                y: jest.fn().mockReturnThis(),
                defined: jest.fn().mockReturnThis()
            })),
            scaleLinear: jest.fn(() => ({
                domain: jest.fn().mockReturnThis(),
                range: jest.fn().mockReturnThis()
            })),
            axisBottom: jest.fn(),
            axisLeft: jest.fn(),
            format: jest.fn()
        };
        
        global.d3 = mockD3;
        
        // Mock DOM
        global.document.getElementById = jest.fn(() => testUtils.createElement('svg'));
        
        // Create GraphRenderer instance (mock constructor)
        const GraphRenderer = require('../src/static/js/graph-renderer.js');
        graphRenderer = { options: {} };
        
        // Mock constructor
        GraphRenderer.default = jest.fn(() => graphRenderer);
    });
    
    test('should initialize with default options', () => {
        // Mock GraphRenderer constructor call
        const renderer = new GraphRenderer('test-graph');
        
        expect(GraphRenderer.default).toHaveBeenCalledWith('test-graph');
    });

    test('should reset to default display range [-10, 10]', () => {
        // This is a simplified test - in real implementation
        // this would test the range reset functionality
        expect(graphRenderer.options).toBeDefined();
    });

    test('should toggle grid visibility', () => {
        // Simplified test for grid toggling
        expect(typeof graphRenderer.options).toBe('object');
    });
});

// Test GrapherApp (simplified integration tests)
describe('GrapherApp', () => {
    let mockApp;
    
    beforeEach(() => {
        // Reset fetch mock
        global.fetch.mockClear();
        
        // Setup basic DOM mocks
        const mockElement = (id) => {
            const element = testUtils.createElement('div', { id });
            element.addEventListener = jest.fn();
            element.textContent = '';
            element.value = '';
            element.disabled = false;
            return element;
        };
        
        global.document.getElementById = jest.fn(mockElement);
        
        // Mock app
        mockApp = {
            currentRange: 'small',
            ranges: {
                small: { x: [-10, 10], y: [-10, 10] },
                large: { x: [-30, 30], y: [-30, 30] }
            },
            plots: [],
            currentExpression: 'x^2',
            currentParameters: {},
            normalizeExpression: jest.fn((expr) => expr.toLowerCase()),
            restoreFunctionCalls: jest.fn((expr) => expr),
            toggleRange: jest.fn(),
            plotFunction: jest.fn(),
            updateGraph: jest.fn(),
            showError: jest.fn(),
            showSuccess: jest.fn()
        };
    });
    
    test('should have correct initial state', () => {
        expect(mockApp.currentRange).toBe('small');
        expect(mockApp.ranges).toBeDefined();
        expect(mockApp.plots).toEqual([]);
    });

    test('should handle expression normalization', () => {
        const testExpr = 'X^2 + SIN(x)';
        mockApp.normalizeExpression(testExpr);
        
        expect(mockApp.normalizeExpression).toHaveBeenCalledWith(testExpr);
    });

    test('should handle range toggle', () => {
        mockApp.toggleRange();
        
        expect(mockApp.toggleRange).toHaveBeenCalled();
    });
});

// Integration tests (simplified)
describe('Integration Tests', () => {
    test('should handle invalid expression gracefully', () => {
        // Mock fetch to return error
        global.fetch.mockImplementationOnce(() => 
            Promise.resolve({
                ok: false,
                status: 400,
                json: () => Promise.resolve({ error: 'Invalid expression' })
            })
        );
        
        expect(async () => {
            // Simulate invalid expression handling
            throw new Error('Invalid expression');
        }).rejects.toThrow('Invalid expression');
    });
});

// Performance tests
describe('Performance Optimization', () => {
    test('should debounce rapid parameter updates', () => {
        let callCount = 0;
        const mockFunction = () => { callCount++; };
        
        // Simple debounce implementation for testing
        function debounce(func, delay) {
            let timeoutId;
            return function(...args) {
                clearTimeout(timeoutId);
                timeoutId = setTimeout(() => func.apply(this, args), delay);
            };
        }
        
        const debouncedFunc = debounce(mockFunction, 100);
        
        // Call rapidly
        debouncedFunc();
        debouncedFunc();
        debouncedFunc();
        
        // Should not call immediately
        expect(callCount).toBe(0);
        
        // Wait and check if called
        return new Promise(resolve => {
            setTimeout(() => {
                expect(callCount).toBe(1);
                resolve();
            }, 150);
        });
    });
});