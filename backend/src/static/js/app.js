// Main Application Controller
class GrapherApp {
    constructor() {
        this.graphRenderer = new GraphRenderer('graph');
        this.parameterController = new ParameterController('parameters-container');
        this.currentExpression = '';
        this.currentVariables = [];
        this.currentParameters = {};
        this.debounceTimer = null;
        this.isBackendAvailable = false;
        
        this.initialize();
    }

    async initialize() {
        // Setup event listeners
        this.setupEventListeners();
        
        // Check backend availability
        await this.checkBackendAvailability();
        
        // Initialize with default expression
        this.validateAndParseExpression(document.getElementById('expression').value);
        
        // Enable parameter controller features
        this.parameterController.enableKeyboardShortcuts();
        this.parameterController.enableAccessibility();
        
        console.log('Grapher app initialized');
    }

    setupEventListeners() {
        const expressionInput = document.getElementById('expression');
        const plotButton = document.getElementById('plot-btn');
        const resetViewButton = document.getElementById('reset-view-btn');
        const toggleGridButton = document.getElementById('toggle-grid-btn');

        // Expression input events
        expressionInput.addEventListener('input', (e) => {
            this.debounceExpressionValidation(e.target.value);
        });

        expressionInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                this.plotFunction();
            }
        });

        // Plot button
        plotButton.addEventListener('click', () => {
            this.plotFunction();
        });

        // Graph control buttons
        resetViewButton.addEventListener('click', () => {
            this.graphRenderer.resetView();
        });

        toggleGridButton.addEventListener('click', () => {
            this.graphRenderer.toggleGrid();
        });

        // Parameter changes
        this.parameterController.onParametersChanged((parameters) => {
            this.currentParameters = parameters;
            this.updateFunctionWithNewParameters();
        });

        // Window resize
        window.addEventListener('resize', () => {
            this.handleResize();
        });
    }

    debounceExpressionValidation(expression) {
        clearTimeout(this.debounceTimer);
        this.debounceTimer = setTimeout(() => {
            this.validateAndParseExpression(expression);
        }, 300);
    }

async validateAndParseExpression(expression) {
        try {
            const result = await apiClient.parseExpression(expression);
            
            if (result.is_valid) {
                this.currentExpression = expression;
                this.currentVariables = result.variables;
                this.currentExpressionType = result.expression_type || 'explicit';
                this.currentParameters = result.parameters || {};
                this.showValidationSuccess();
                this.updateParameterControls();
                this.updateExpressionTypeDisplay(result);
            } else {
                this.showValidationError(result.error);
            }
            
            return result;
            
        } catch (error) {
            this.showValidationError(error.message);
            return { is_valid: false, variables: [], error: error.message };
        }
    }

    updateExpressionTypeDisplay(parseResult) {
        const typeDisplay = document.createElement('div');
        typeDisplay.className = 'expression-type-info';
        typeDisplay.style.cssText = `
            margin-top: 5px;
            padding: 5px 10px;
            border-radius: 5px;
            font-size: 12px;
            background: ${getTypeColor(parseResult.expression_type)}20;
            color: ${getTypeColor(parseResult.expression_type)};
            border: 1px solid ${getTypeColor(parseResult.expression_type)}40;
        `;
        
        const typeLabels = {
            'explicit': 'Function: y = f(x)',
            'implicit': 'Implicit Equation: f(x, y) = 0',
            'parametric': 'Parametric: (x(t), y(t))'
        };
        
        typeDisplay.textContent = typeLabels[parseResult.expression_type] || 'Mathematical Expression';
        
        // Remove existing type display
        const existing = document.querySelector('.expression-type-info');
        if (existing) {
            existing.remove();
        }
        
        // Add new type display
        const inputGroup = document.querySelector('.input-group');
        inputGroup.appendChild(typeDisplay);
    }

    updateParameterControls() {
        // Clear existing parameter controls
        this.parameterController.clearParameters();
        
        // Add controls for parameters (variables that are not x, y, or t)
        const parameters = this.currentVariables.filter(v => !['x', 'y', 't'].includes(v));
        
        if (parameters.length > 0) {
            this.parameterController.setParameters(parameters);
        }
    }

        

    validateExpressionLocally(expression) {
        // Simple client-side validation as fallback
        const inputElement = document.getElementById('expression');
        const plotButton = document.getElementById('plot-btn');

        try {
            // Basic syntax check using Function constructor (safer than eval)
            // This is a simplified check - backend validation is preferred
            const testExpr = expression.toLowerCase()
                .replace(/sin/g, 'Math.sin')
                .replace(/cos/g, 'Math.cos')
                .replace(/tan/g, 'Math.tan')
                .replace(/sqrt/g, 'Math.sqrt')
                .replace(/log/g, 'Math.log')
                .replace(/exp/g, 'Math.exp')
                .replace(/pi/g, 'Math.PI')
                .replace(/e/g, 'Math.E')
                .replace(/\^/g, '**');

            // Extract variables (simple pattern matching)
            const variablePattern = /\\b[a-zA-Z][a-zA-Z0-9]*\\b/g;
            const matches = testExpr.match(variablePattern) || [];
            const variables = [...new Set(matches)].filter(v => 
                !['Math', 'sin', 'cos', 'tan', 'sqrt', 'log', 'exp', 'PI', 'E'].includes(v)
            );

            // Test with x=1
            const testFunc = new Function('x', ...variables, `return ${testExpr}`);
            testFunc(1, ...variables.map(() => 1));

            this.setValidationState('valid', 'Valid expression (offline mode)');
            this.currentExpression = expression;
            this.currentVariables = variables;
            this.parameterController.setParameters(variables, expression);
            plotButton.disabled = false;
        } catch (error) {
            this.setValidationState('invalid', 'Invalid expression syntax');
            this.parameterController.clearParameters();
            plotButton.disabled = true;
        }
    }

showValidationSuccess(message = 'Valid expression') {
        this.setValidationState('valid', message);
    }
    
    showValidationError(message = 'Invalid expression') {
        this.setValidationState('invalid', message);
    }

    setValidationState(state, message) {
        const inputElement = document.getElementById('expression');
        const validationMessage = document.getElementById('validation-message');
        
        // Remove all validation classes
        inputElement.classList.remove('valid', 'invalid');
        validationMessage.classList.remove('success', 'error');
        
        if (state === 'valid') {
            inputElement.classList.add('valid');
            validationMessage.classList.add('success');
            validationMessage.textContent = message || 'Valid expression';
        } else if (state === 'invalid') {
            inputElement.classList.add('invalid');
            validationMessage.classList.add('error');
            validationMessage.textContent = message || 'Invalid expression';
        } else {
            validationMessage.textContent = '';
        }
    }

    async plotFunction() {
        if (!this.currentExpression) {
            return;
        }

        const plotButton = document.getElementById('plot-btn');
        const originalText = plotButton.textContent;
        
        try {
            plotButton.disabled = true;
            plotButton.textContent = 'Plotting...';
            
            this.showError(null);

            if (this.isBackendAvailable) {
                await this.plotWithBackend();
            } else {
                await this.plotLocally();
            }
        } catch (error) {
            console.error('Plotting error:', error);
            this.showError(`Failed to plot function: ${error.message}`);
        } finally {
            plotButton.disabled = false;
            plotButton.textContent = originalText;
        }
    }

    async plotWithBackend() {
        // Ensure we have valid parameters (object, not array)
        console.log('Current parameters before fix:', this.currentParameters, typeof this.currentParameters, Array.isArray(this.currentParameters));
        
        let parameters = {};
        if (this.currentParameters && typeof this.currentParameters === 'object' && !Array.isArray(this.currentParameters)) {
            parameters = this.currentParameters;
        } else {
            console.warn('Parameters was not a valid object, using empty object');
        }
        
        const xRange = [-10, 10]; // Use the new 20x20 viewport
        
        console.log('Plotting with:', {
            expression: this.currentExpression,
            parameters: parameters,
            parametersType: typeof parameters,
            parametersIsArray: Array.isArray(parameters),
            xRange: xRange
        });
        
        const result = await apiClient.evaluateExpression(
            this.currentExpression,
            parameters,
            xRange,
            1000
        );

        if (result.graph_data && result.graph_data.coordinates) {
            this.graphRenderer.plotFunction(
                this.currentExpression,
                result.graph_data.coordinates,
                0 // Use first color
            );
        } else {
            throw new Error('Invalid response from backend');
        }
    }

    async plotLocally() {
        // Fallback local plotting (simplified - for demonstration only)
        const coordinates = [];
        for (let x = -5; x <= 5; x += 0.01) {
            try {
                const y = this.evaluateExpressionLocally(x);
                coordinates.push({ x, y });
            } catch (error) {
                // Skip invalid points
            }
        }

        if (coordinates.length > 0) {
            this.graphRenderer.plotFunction(
                this.currentExpression,
                coordinates,
                0
            );
        } else {
            throw new Error('No valid points to plot');
        }
    }

    evaluateExpressionLocally(x) {
        const expr = this.currentExpression.toLowerCase()
            .replace(/sin/g, 'Math.sin')
            .replace(/cos/g, 'Math.cos')
            .replace(/tan/g, 'Math.tan')
            .replace(/sqrt/g, 'Math.sqrt')
            .replace(/log/g, 'Math.log')
            .replace(/exp/g, 'Math.exp')
            .replace(/pi/g, 'Math.PI')
            .replace(/e/g, 'Math.E')
            .replace(/\^/g, '**');

        const variables = ['x', ...this.currentVariables.filter(v => v !== 'x')];
        const values = [x, ...variables.slice(1).map(v => this.currentParameters[v] || 0)];
        
        const func = new Function(...variables, `return ${expr}`);
        return func(...values);
    }

    async updateFunctionWithNewParameters() {
        if (!this.currentExpression || !this.isBackendAvailable) {
            return;
        }

        try {
            const result = await apiClient.evaluateExpression(
                this.currentExpression,
                this.currentParameters,
                [-5, 5], // 10x10 viewport
                1000
            );

            if (result.graph_data && result.graph_data.coordinates) {
                this.graphRenderer.removeFunction(this.currentExpression);
                this.graphRenderer.plotFunction(
                    this.currentExpression,
                    result.graph_data.coordinates,
                    0
                );
            }
        } catch (error) {
            console.error('Parameter update error:', error);
            // Don't show error for parameter updates to avoid annoying the user
        }
    }

    async checkBackendAvailability() {
        try {
            const response = await apiClient.healthCheck();
            this.isBackendAvailable = true;
            console.log('Backend is available:', response);
        } catch (error) {
            this.isBackendAvailable = false;
            console.warn('Backend not available, running in offline mode:', error.message);
            this.showWarning('Backend not available - running in offline mode with limited functionality');
        }
    }

    showError(message) {
        const errorContainer = document.getElementById('error-container');
        if (message) {
            errorContainer.innerHTML = `<div class="error">${message}</div>`;
        } else {
            errorContainer.innerHTML = '';
        }
    }

    showWarning(message) {
        const errorContainer = document.getElementById('error-container');
        errorContainer.innerHTML = `<div class="warning" style="background: #fff3cd; color: #856404; border: 1px solid #ffeaa7; padding: 15px; border-radius: 8px; margin-bottom: 20px;">${message}</div>`;
        
        // Auto-hide warning after 5 seconds
        setTimeout(() => {
            errorContainer.innerHTML = '';
        }, 5000);
    }

    handleResize() {
        // Simple resize handling - could be enhanced
        const container = document.querySelector('.graph-container');
        const maxWidth = container.clientWidth - 40; // Account for padding
        
        if (maxWidth < 600) {
            const newSize = Math.max(300, maxWidth);
            this.graphRenderer.resize(newSize, newSize);
        }
    }

    // Public methods for external control
    setExpression(expression) {
        document.getElementById('expression').value = expression;
        this.validateAndParseExpression(expression);
    }

    plotExpression(expression) {
        this.setExpression(expression);
        this.plotFunction();
    }

    setParameters(parameters) {
        Object.keys(parameters).forEach(variable => {
            this.parameterController.setParameterValue(variable, parameters[variable]);
        });
    }

    resetView() {
        this.graphRenderer.resetView();
    }

    toggleGrid() {
        this.graphRenderer.toggleGrid();
    }
}

// Initialize the app when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.grapherApp = new GrapherApp();
});

// Helper function for expression type colors
function getTypeColor(type) {
    const colors = {
        'explicit': '#8b5cf6',      // Purple
        'implicit': '#10b981',      // Green  
        'parametric': '#f59e0b',    // Orange
        'error': '#ef4444'          // Red
    };
    return colors[type] || '#6b7280';  // Gray default
}

// Global error handling
window.addEventListener('error', (event) => {
    console.error('Global error:', event.error);
});

window.addEventListener('unhandledrejection', (event) => {
    console.error('Unhandled promise rejection:', event.reason);
});