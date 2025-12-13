// Main Application Controller
class GrapherApp {
constructor() {
        this.graphRenderer = new GraphRenderer('graph');
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
        

        
        console.log('Grapher app initialized');
    }

    setupEventListeners() {
        const expressionInput = document.getElementById('expression');
        const plotButton = document.getElementById('plot-btn');
        const resetViewButton = document.getElementById('reset-view-btn');
        const toggleGridButton = document.getElementById('toggle-grid-btn');

        // Expression input events
        // expressionInput.addEventListener('input', (e) => {
        //     this.debounceExpressionValidation(e.target.value);
        // });

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



        // Window resize
        window.addEventListener('resize', () => {
            this.handleResize();
        });
    }

    debounceExpressionValidation(expression) {
        clearTimeout(this.debounceTimer);
        this.debounceTimer = setTimeout(() => {
            this.validateAndParseExpression(expression, false); // Silent validation during typing
        }, 300);
    }

    async validateAndParseExpression(expression, showMessage = false) {
        const inputElement = document.getElementById('expression');
        const validationMessage = document.getElementById('validation-message');
        const plotButton = document.getElementById('plot-btn');

        if (!expression.trim()) {
            if (showMessage) {
                this.setValidationState('empty', 'Enter a mathematical expression');
            } else {
                this.clearValidationState();
            }
            return;
        }

        try {
            if (this.isBackendAvailable) {
                // Use backend for validation
                const result = await apiClient.parseExpression(expression);
                
                if (result.is_valid) {
                    if (showMessage) {
                        this.setValidationState('valid', 'Valid expression');
                    }
                    this.currentExpression = expression;
                    this.currentVariables = result.variables;

                    plotButton.disabled = false;
                } else {
                    if (showMessage) {
                        this.setValidationState('invalid', result.error || 'Invalid expression');
                    }
                    plotButton.disabled = true;
                }
            } else {
                // Fallback to simple client-side validation
                this.validateExpressionLocally(expression);
            }
        } catch (error) {
            console.error('Expression validation error:', error);
            if (showMessage) {
                this.setValidationState('invalid', `Validation failed: ${error.message}`);
            }
            plotButton.disabled = true;
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

            plotButton.disabled = false;
        } catch (error) {
            this.setValidationState('invalid', 'Invalid expression syntax');

            plotButton.disabled = true;
        }
    }

    setValidationState(state, message) {
        const inputElement = document.getElementById('expression');
        const validationMessage = document.getElementById('validation-message');

        inputElement.classList.remove('valid', 'invalid');
        validationMessage.classList.remove('success', 'error');
        validationMessage.innerHTML = '';

        switch (state) {
            case 'valid':
                inputElement.classList.add('valid');
                validationMessage.classList.add('success');
                validationMessage.textContent = message;
                break;
            case 'invalid':
                inputElement.classList.add('invalid');
                validationMessage.classList.add('error');
                validationMessage.textContent = message;
                break;
            case 'empty':
                validationMessage.innerHTML = '';
                break;
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

            // Validate with messages shown before plotting
            await this.validateAndParseExpression(this.currentExpression, true);

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
        const result = await apiClient.evaluateExpression(
            this.currentExpression,
 {},
            [-5, 5], // 10x10 viewport
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

        const func = new Function('x', `return ${expr}`);
        return func(x);
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

// Global error handling
window.addEventListener('error', (event) => {
    console.error('Global error:', event.error);
});

window.addEventListener('unhandledrejection', (event) => {
    console.error('Unhandled promise rejection:', event.reason);
});