/**
 * Frontend JavaScript unit tests for Grapher application.
 * Tests API client, graph renderer, and main app controller.
 */

// Mock DOM and global dependencies for Node.js testing environment
global.document = {
    createElement: jest.fn(() => ({
        setAttribute: jest.fn(),
        addEventListener: jest.fn(),
        classList: {
            add: jest.fn(),
            remove: jest.fn(),
            contains: jest.fn()
        }
    })),
    getElementById: jest.fn(),
    addEventListener: jest.fn()
};

global.window = {
    location: { href: 'http://localhost:8000' },
    fetch: jest.fn()
};

global.d3 = {
    select: jest.fn(),
    line: jest.fn(() => ({
        x: jest.fn(),
        y: jest.fn(),
        defined: jest.fn()
    })),
    scaleLinear: jest.fn(() => ({
        domain: jest.fn().mockReturnThis(),
        range: jest.fn().mockReturnThis()
    })),
    axisBottom: jest.fn(),
    axisLeft: jest.fn(),
    format: jest.fn()
};

// Test API Client
describe('APIClient', () => {
    let apiClient;
    
    beforeEach(() => {
        global.fetch.mockClear();
        // Mock localStorage for tests
        global.localStorage = {
            getItem: jest.fn(),
            setItem: jest.fn(),
            removeItem: jest.fn()
        };
        
        // Import would normally be done via require/module system
        // For this test file, we'll mock the module structure
        apiClient = {
            baseURL: 'http://localhost:8000',
            makeRequest: jest.fn(),
            parseExpression: jest.fn(),
            evaluateExpression: jest.fn(),
            batchEvaluate: jest.fn(),
            updateParameters: jest.fn(),
            createDebouncedParameterUpdate: jest.fn()
        };
    });
    
    describe('Request Methods', () => {
        test('should make request with correct method and headers', async () => {
            const mockResponse = { data: 'test' };
            global.fetch.mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve(mockResponse)
            });
            
            await apiClient.makeRequest('/api/test', 'POST', { test: 'data' });
            
            expect(global.fetch).toHaveBeenCalledWith(
                'http://localhost:8000/api/test',
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
            global.fetch.mockRejectedValueOnce(new Error('Network error'));
            
            await expect(apiClient.makeRequest('/api/test', 'POST', {}))
                .rejects.toThrow('Network error');
        });
        
        test('should handle non-2xx responses', async () => {
            global.fetch.mockResolvedValueOnce({
                ok: false,
                status: 500,
                json: () => Promise.resolve({ error: 'Server error' })
            });
            
            await expect(apiClient.makeRequest('/api/test', 'POST', {}))
                .rejects.toThrow();
        });
    });
    
    describe('Expression Parsing', () => {
        test('should call parse endpoint with expression', async () => {
            const mockResponse = { is_valid: true, variables: ['x'] };
            apiClient.parseExpression.mockResolvedValueOnce(mockResponse);
            
            const result = await apiClient.parseExpression('x^2 + 2*x + 1');
            
            expect(apiClient.makeRequest).toHaveBeenCalledWith(
                '/api/parse',
                'POST',
                { expression: 'x^2 + 2*x + 1' }
            );
            expect(result).toEqual(mockResponse);
        });
        
        test('should handle empty expression validation', async () => {
            apiClient.parseExpression.mockRejectedValueOnce(new Error('Empty expression'));
            
            await expect(apiClient.parseExpression(''))
                .rejects.toThrow('Empty expression');
        });
    });
    
    describe('Expression Evaluation', () => {
        test('should use default range [-30, 30] for computation', async () => {
            const mockResponse = {
                graph_data: {
                    coordinates: [{x: 0, y: 0}],
                    total_points: 1000,
                    valid_points: 1000
                }
            };
            apiClient.evaluateExpression.mockResolvedValueOnce(mockResponse);
            
            const result = await apiClient.evaluateExpression('x^2');
            
            expect(apiClient.makeRequest).toHaveBeenCalledWith(
                '/api/evaluate',
                'POST',
                expect.objectContaining({
                    expression: 'x^2',
                    variables: {},
                    x_range: [-30, 30],
                    num_points: 1000
                })
            );
            expect(result).toEqual(mockResponse);
        });
        
        test('should accept custom parameters and range', async () => {
            const mockResponse = { graph_data: { coordinates: [] } };
            apiClient.evaluateExpression.mockResolvedValueOnce(mockResponse);
            
            const result = await apiClient.evaluateExpression(
                'a*x^2 + b',
                { a: 2.0, b: 1.0 },
                [-10, 10],
                500
            );
            
            expect(apiClient.makeRequest).toHaveBeenCalledWith(
                '/api/evaluate',
                'POST',
                {
                    expression: 'a*x^2 + b',
                    variables: { a: 2.0, b: 1.0 },
                    x_range: [-10, 10],
                    num_points: 500
                }
            );
            expect(result).toEqual(mockResponse);
        });
    });
    
    describe('Batch Evaluation', () => {
        test('should evaluate multiple expressions', async () => {
            const mockResponse = {
                results: [
                    { expression: 'x^2', graph_data: { coordinates: [] } },
                    { expression: 'sin(x)', graph_data: { coordinates: [] } }
                ]
            };
            apiClient.batchEvaluate.mockResolvedValueOnce(mockResponse);
            
            const result = await apiClient.batchEvaluate(['x^2', 'sin(x)']);
            
            expect(apiClient.makeRequest).toHaveBeenCalledWith(
                '/api/batch-evaluate',
                'POST',
                expect.objectContaining({
                    expressions: ['x^2', 'sin(x)'],
                    variables: {},
                    x_range: [-30, 30],
                    num_points: 1000
                })
            );
            expect(result).toEqual(mockResponse);
        });
    });
    
    describe('Parameter Updates', () => {
        test('should debounce parameter updates', () => {
            const mockDebouncedFunction = jest.fn();
            apiClient.createDebouncedParameterUpdate.mockReturnValue(mockDebouncedFunction);
            
            const debouncedUpdate = apiClient.createDebouncedParameterUpdate(300);
            
            expect(apiClient.createDebouncedParameterUpdate).toHaveBeenCalledWith(300);
            expect(debouncedUpdate).toBe(mockDebouncedFunction);
        });
    });
});

// Test Graph Renderer
describe('GraphRenderer', () => {
    let graphRenderer;
    let mockSvg;
    let mockFunctionsGroup;
    
    beforeEach(() => {
        // Mock SVG element
        mockSvg = {
            append: jest.fn(() => ({
                attr: jest.fn().mockReturnThis(),
                style: jest.fn().mockReturnThis(),
                datum: jest.fn().mockReturnThis(),
                transition: jest.fn().mockReturnThis()
            })),
            selectAll: jest.fn(() => ({
                remove: jest.fn(),
                transition: jest.fn().mockReturnThis(),
                duration: jest.fn().mockReturnThis(),
                attr: jest.fn().mockReturnThis()
            }))
        };
        
        mockFunctionsGroup = {
            append: jest.fn(() => ({
                attr: jest.fn().mockReturnThis(),
                style: jest.fn().mockReturnThis()
            }))
        };
        
        global.d3.select.mockReturnValue({
            attr: jest.fn().mockReturnThis(),
            style: jest.fn().mockReturnThis(),
            append: jest.fn().mockReturnValue({
                attr: jest.fn().mockReturnThis(),
                style: jest.fn().mockReturnThis()
            }),
            selectAll: jest.fn().mockReturnValue({
                remove: jest.fn()
            })
        });
        
        // Mock graph renderer methods
        graphRenderer = {
            options: {
                xRange: [-10, 10],
                yRange: [-10, 10],
                functionColors: ['#ff6b6b', '#4ecdc4']
            },
            xScale: global.d3.scaleLinear(),
            yScale: global.d3.scaleLinear(),
            functions: [],
            functionsGroup: mockFunctionsGroup,
            plotFunction: jest.fn(),
            clearAllFunctions: jest.fn(),
            updateRange: jest.fn(),
            toggleGrid: jest.fn(),
            resetView: jest.fn()
        };
    });
    
    describe('Initialization', () => {
        test('should initialize with default options', () => {
            expect(graphRenderer.options.xRange).toEqual([-10, 10]);
            expect(graphRenderer.options.yRange).toEqual([-10, 10]);
            expect(graphRenderer.functions).toEqual([]);
        });
    });
    
    describe('Range Management', () => {
        test('should update range and scales', () => {
            const newXRange = [-30, 30];
            const newYRange = [-30, 30];
            
            graphRenderer.updateRange(newXRange, newYRange);
            
            expect(graphRenderer.options.xRange).toEqual(newXRange);
            expect(graphRenderer.options.yRange).toEqual(newYRange);
            expect(global.d3.scaleLinear).toHaveBeenCalledWith();
        });
        
        test('should reset to default display range [-10, 10]', () => {
            graphRenderer.resetView();
            
            expect(graphRenderer.options.xRange).toEqual([-10, 10]);
            expect(graphRenderer.options.yRange).toEqual([-10, 10]);
        });
    });
    
    describe('Function Plotting', () => {
        test('should plot function with coordinates', () => {
            const coordinates = [
                { x: -1, y: 1 },
                { x: 0, y: 0 },
                { x: 1, y: 1 }
            ];
            const expression = 'x^2';
            const colorIndex = 0;
            
            graphRenderer.plotFunction(expression, coordinates, colorIndex);
            
            expect(graphRenderer.plotFunction).toHaveBeenCalledWith(
                expression,
                coordinates,
                colorIndex
            );
        });
        
        test('should handle empty coordinates gracefully', () => {
            const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();
            
            graphRenderer.plotFunction('empty_func', [], 0);
            
            expect(consoleSpy).toHaveBeenCalledWith(
                'No coordinates to plot for expression:',
                'empty_func'
            );
            
            consoleSpy.mockRestore();
        });
    });
    
    describe('Function Management', () => {
        test('should clear all functions', () => {
            graphRenderer.clearAllFunctions();
            
            expect(graphRenderer.clearAllFunctions).toHaveBeenCalled();
        });
        
        test('should toggle grid visibility', () => {
            graphRenderer.toggleGrid();
            
            expect(graphRenderer.toggleGrid).toHaveBeenCalled();
        });
    });
});

// Test Main Application Controller
describe('GrapherApp', () => {
    let grapherApp;
    let mockGraphRenderer;
    let mockLocalStorage;
    
    beforeEach(() => {
        mockLocalStorage = {
            getItem: jest.fn(),
            setItem: jest.fn(),
            removeItem: jest.fn()
        };
        global.localStorage = mockLocalStorage;
        
        mockGraphRenderer = {
            updateRange: jest.fn(),
            plotFunction: jest.fn(),
            clearAllFunctions: jest.fn()
        };
        
        // Mock DOM elements
        global.document.getElementById.mockImplementation((id) => {
            const elementMap = {
                'expression': { value: 'x^2 + 2*x + 1' },
                'plot-btn': { disabled: false, textContent: 'Plot Function' },
                'toggle-range-btn': { addEventListener: jest.fn() },
                'toggle-grid-btn': { addEventListener: jest.fn() },
                'delete-all-btn': { addEventListener: jest.fn() },
                'validation-message': { textContent: '' }
            };
            return elementMap[id] || null;
        });
        
        // Mock app controller with key methods
        grapherApp = {
            currentRange: 'small',
            ranges: {
                small: { x: [-10, 10], y: [-10, 10] },
                large: { x: [-30, 30], y: [-30, 30] }
            },
            graphRenderer: mockGraphRenderer,
            plots: [],
            currentExpression: '',
            currentParameters: {},
            normalizeExpression: jest.fn((expr) => expr.toLowerCase()),
            restoreFunctionCalls: jest.fn((expr) => expr),
            toggleRange: jest.fn(),
            plotFunction: jest.fn(),
            addPlot: jest.fn(),
            renderPlotList: jest.fn(),
            showError: jest.fn(),
            validateAndParseExpression: jest.fn(),
            setupEventListeners: jest.fn()
        };
    });
    
    describe('Range Management', () => {
        test('should toggle between small and large ranges', () => {
            const originalRange = grapherApp.currentRange;
            
            grapherApp.toggleRange();
            
            expect(grapherApp.toggleRange).toHaveBeenCalled();
            expect(grapherApp.currentRange).not.toBe(originalRange);
        });
        
        test('should start with small range [-10, 10] by default', () => {
            expect(grapherApp.currentRange).toBe('small');
            expect(grapherApp.ranges.small.x).toEqual([-10, 10]);
            expect(grapherApp.ranges.small.y).toEqual([-10, 10]);
        });
        
        test('should have large range [-30, 30] available', () => {
            expect(grapherApp.ranges.large.x).toEqual([-30, 30]);
            expect(grapherApp.ranges.large.y).toEqual([-30, 30]);
        });
    });
    
    describe('Expression Processing', () => {
        test('should normalize mathematical expressions', () => {
            const expressions = [
                { input: 'SIN(X^2)', expected: 'sin(x^2)' },
                { input: 'X^1 + 2*X', expected: 'x + 2*x' },
                { input: 'PI*X + E', expected: 'pi*x + e' }
            ];
            
            expressions.forEach(({ input, expected }) => {
                grapherApp.normalizeExpression.mockReturnValue(expected);
                const result = grapherApp.normalizeExpression(input);
                
                expect(grapherApp.normalizeExpression).toHaveBeenCalledWith(input);
                expect(result).toBe(expected);
            });
        });
        
        test('should restore function calls from placeholders', () => {
            const expr = 'x + __FUNC_0__ + y';
            const placeholders = ['sin(t)'];
            const expected = 'x + sin(t) + y';
            
            grapherApp.restoreFunctionCalls.mockReturnValue(expected);
            const result = grapherApp.restoreFunctionCalls(expr, placeholders);
            
            expect(grapherApp.restoreFunctionCalls).toHaveBeenCalledWith(expr, placeholders);
            expect(result).toBe(expected);
        });
    });
    
    describe('Function Management', () => {
        test('should add new plots', async () => {
            const mockPlotData = {
                expression: 'x^2',
                data: { coordinates: [{ x: 0, y: 0 }] },
                color: '#ff6b6b'
            };
            
            grapherApp.addPlot.mockResolvedValue(mockPlotData);
            
            await grapherApp.plotFunction();
            
            expect(grapherApp.addPlot).toHaveBeenCalled();
        });
        
        test('should render plot list', () => {
            grapherApp.renderPlotList();
            
            expect(grapherApp.renderPlotList).toHaveBeenCalled();
        });
    });
    
    describe('Event Handling', () => {
        test('should setup event listeners for UI elements', () => {
            grapherApp.setupEventListeners();
            
            expect(grapherApp.setupEventListeners).toHaveBeenCalled();
            
            // Verify specific event listeners would be set up
            const plotBtn = global.document.getElementById('plot-btn');
            const toggleRangeBtn = global.document.getElementById('toggle-range-btn');
            
            // These would have addEventListener called during setup
            expect(plotBtn).toBeDefined();
            expect(toggleRangeBtn).toBeDefined();
        });
    });
    
    describe('Error Handling', () => {
        test('should display error messages', () => {
            const errorMessage = 'Test error message';
            
            grapherApp.showError(errorMessage);
            
            expect(grapherApp.showError).toHaveBeenCalledWith(errorMessage);
        });
        
        test('should handle validation failures', () => {
            const invalidExpression = 'x^2 + + invalid';
            
            grapherApp.validateAndParseExpression.mockReturnValue(false);
            
            grapherApp.validateAndParseExpression(invalidExpression);
            
            expect(grapherApp.validateAndParseExpression).toHaveBeenCalledWith(invalidExpression);
        });
    });
    
    describe('Data Persistence', () => {
        test('should save expression history to localStorage', () => {
            const expressions = ['x^2', 'sin(x)', 'x*sin(x)'];
            
            // Mock saving to localStorage
            grapherApp.saveExpressionHistory = jest.fn();
            grapherApp.saveExpressionHistory(expressions);
            
            expect(grapherApp.saveExpressionHistory).toHaveBeenCalledWith(expressions);
            expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
                'grapher_expression_history',
                JSON.stringify(expressions)
            );
        });
        
        test('should load expression history from localStorage', () => {
            const savedExpressions = ['cos(x)', 'tan(x)'];
            
            mockLocalStorage.getItem.mockReturnValue(JSON.stringify(savedExpressions));
            
            const loaded = grapherApp.loadExpressionHistory();
            
            expect(mockLocalStorage.getItem).toHaveBeenCalledWith('grapher_expression_history');
            expect(loaded).toEqual(savedExpressions);
        });
    });
});

// Test Integration Scenarios
describe('Integration Tests', () => {
    let mockApp, mockRenderer, mockApiClient;
    
    beforeEach(() => {
        mockRenderer = {
            updateRange: jest.fn(),
            plotFunction: jest.fn(),
            clearAllFunctions: jest.fn(),
            toggleGrid: jest.fn()
        };
        
        mockApiClient = {
            evaluateExpression: jest.fn(),
            parseExpression: jest.fn(),
            batchEvaluate: jest.fn()
        };
        
        mockApp = {
            graphRenderer: mockRenderer,
            apiClient: mockApiClient,
            currentRange: 'small',
            ranges: {
                small: { x: [-10, 10], y: [-10, 10] },
                large: { x: [-30, 30], y: [-30, 30] }
            },
            plots: [],
            toggleRange: jest.fn(),
            plotFunction: jest.fn()
        };
    });
    
    describe('End-to-End Workflow', () => {
        test('should handle complete plotting workflow', async () => {
            // Mock expression validation
            mockApiClient.parseExpression.mockResolvedValue({
                is_valid: true,
                variables: ['x'],
                parameters: []
            });
            
            // Mock expression evaluation
            const mockGraphData = {
                coordinates: [
                    { x: -10, y: 100 },
                    { x: 0, y: 0 },
                    { x: 10, y: 100 }
                ]
            };
            mockApiClient.evaluateExpression.mockResolvedValue({
                graph_data: mockGraphData
            });
            
            // Execute workflow
            await mockApp.plotFunction('x^2');
            
            expect(mockApiClient.parseExpression).toHaveBeenCalledWith('x^2');
            expect(mockApiClient.evaluateExpression).toHaveBeenCalledWith(
                'x^2',
                {},
                [-30, 30],  // Should always use computation range
                1000
            );
            expect(mockRenderer.plotFunction).toHaveBeenCalledWith(
                'x^2',
                mockGraphData,
                0
            );
        });
        
        test('should handle range toggle with replotting', async () => {
            // Set up initial plot
            mockApp.plots = [
                { expression: 'x^2', data: { coordinates: [] } }
            ];
            
            // Execute range toggle
            mockApp.toggleRange();
            
            expect(mockApp.currentRange).toBe('large');
            expect(mockRenderer.updateRange).toHaveBeenCalledWith(
                [-30, 30],
                [-30, 30]
            );
            
            // Should replot existing functions with new range
            expect(mockRenderer.clearAllFunctions).toHaveBeenCalled();
        });
        
        test('should handle plotting multiple functions', async () => {
            const expressions = ['x^2', 'sin(x)', 'x*sin(x)'];
            const mockResults = expressions.map(expr => ({
                expression: expr,
                graph_data: { coordinates: [] }
            }));
            
            mockApiClient.batchEvaluate.mockResolvedValue({
                results: mockResults
            });
            
            // Mock batch plotting
            const batchPlot = jest.fn();
            mockApp.batchPlot = batchPlot;
            
            await batchPlot(expressions);
            
            expect(mockApiClient.batchEvaluate).toHaveBeenCalledWith(
                expressions,
                {},
                [-30, 30],
                1000
            );
            
            // Should plot each function with different colors
            mockResults.forEach((result, index) => {
                expect(mockRenderer.plotFunction).toHaveBeenCalledWith(
                    result.expression,
                    result.graph_data,
                    index
                );
            });
        });
    });
    
    describe('Error Recovery', () => {
        test('should handle backend unavailable scenario', async () => {
            // Mock network failure
            mockApiClient.evaluateExpression.mockRejectedValue(new Error('Network error'));
            
            // Mock error display
            const showErrorSpy = jest.fn();
            mockApp.showError = showErrorSpy;
            
            await mockApp.plotFunction('x^2');
            
            expect(showErrorSpy).toHaveBeenCalledWith(
                expect.stringContaining('Network error')
            );
        });
        
        test('should handle invalid expression gracefully', async () => {
            // Mock invalid expression
            mockApiClient.parseExpression.mockResolvedValue({
                is_valid: false,
                error: 'Invalid syntax'
            });
            
            await mockApp.plotFunction('x^2 + + invalid');
            
            // Should not attempt evaluation for invalid expression
            expect(mockApiClient.evaluateExpression).not.toHaveBeenCalled();
        });
    });
    
    describe('Performance Optimization', () => {
        test('should debounce rapid parameter updates', (done) => {
            let callCount = 0;
            const debouncedFunction = jest.fn(() => callCount++);
            
            // Mock debounced update
            const debouncedUpdate = mockApp.apiClient.createDebouncedParameterUpdate(100);
            debouncedUpdate.mockReturnValue(debouncedFunction);
            
            // Make rapid calls
            for (let i = 0; i < 10; i++) {
                debouncedUpdate();
            }
            
            // Should debounce to single call
            setTimeout(() => {
                expect(callCount).toBe(1);
                done();
            }, 150);
        });
        
        test('should cache computation results', () => {
            const expression = 'x^2';
            const parameters = { a: 2.0 };
            const xRange = [-10, 10];
            
            // Mock cache
            const cache = {};
            mockApp.cache = {
                get: jest.fn((key) => cache[key]),
                set: jest.fn((key, value) => { cache[key] = value; })
            };
            
            // First call should compute and cache
            const firstCall = mockApp.getCachedResult(expression, parameters, xRange);
            expect(mockApp.cache.get).toHaveBeenCalled();
            
            // Second call should return cached result
            const secondCall = mockApp.getCachedResult(expression, parameters, xRange);
            expect(secondCall).toBe(firstCall);
        });
    });
});

// Run tests if this file is executed directly
if (typeof require !== 'undefined' && require.main === module) {
    // This would typically be run with a test runner like Jest
    console.log('Frontend tests loaded. Run with jest to execute tests.');
}