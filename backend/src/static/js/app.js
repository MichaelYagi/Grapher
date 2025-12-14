// Main Application Controller
class GrapherApp {
    constructor() {
        this.graphRenderer = new GraphRenderer('graph');
        this.currentExpression = '';
        this.currentVariables = [];
        this.currentParameters = {};
        this.debounceTimer = null;
        this.isBackendAvailable = false;
        
        // Plot management
        this.plots = [];
        this.plotIdCounter = 0;
        this.functionColors = [
            '#8b5cf6', '#10b981', '#f59e0b', '#ef4444', '#06b6d4', 
            '#ec4899', '#84cc16', '#f97316', '#3b82f6', '#a855f7'
        ];
        
        this.initialize();
    }

    async initialize() {
        // Setup event listeners
        this.setupEventListeners();
        
        // Check backend availability
        await this.checkBackendAvailability();
        
        // Initialize with default expression
        this.validateAndParseExpression(document.getElementById('expression').value);
        
        // Initial render of plot list
        this.renderPlotList();
        
        console.log('Grapher app initialized');
    }

    setupEventListeners() {
        const expressionInput = document.getElementById('expression');
        const plotButton = document.getElementById('plot-btn');
        const toggleGridButton = document.getElementById('toggle-grid-btn');
        const downloadPngButton = document.getElementById('download-png-btn');
        const downloadSvgButton = document.getElementById('download-svg-btn');
        const deleteAllButton = document.getElementById('delete-all-btn');
        const hideAllButton = document.getElementById('hide-all-btn');
        const showAllButton = document.getElementById('show-all-btn');

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
        toggleGridButton.addEventListener('click', () => {
            this.graphRenderer.toggleGrid();
        });

        // Download buttons
        downloadPngButton.addEventListener('click', () => {
            this.graphRenderer.downloadGraph('png');
        });

        downloadSvgButton.addEventListener('click', () => {
            this.graphRenderer.downloadGraph('svg');
        });

        // Plots control buttons
        deleteAllButton.addEventListener('click', () => {
            this.deleteAllPlots();
        });

        hideAllButton.addEventListener('click', () => {
            this.hideAllPlots();
        });

        showAllButton.addEventListener('click', () => {
            this.showAllPlots();
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
        const expressionInput = document.getElementById('expression');
        const validationMessage= document.getElementById('validation-message');

        expressionInput.classList.add('valid');
        expressionInput.classList.remove('invalid');
        validationMessage.textContent = 'Valid expression';

        this.currentExpression = expressionInput.value;

        const result = await apiClient.parseExpression(this.currentExpression);

        if (!result.is_valid) {
            this.showError(`Current expression is not valid`);
            expressionInput.classList.remove('valid');
            expressionInput.classList.add('invalid');
            validationMessage.textContent = 'Invalid expression';
            return;
        }

        if (!this.currentExpression) {
            this.showError(`Current expression DNE`);
            expressionInput.classList.remove('valid');
            expressionInput.classList.add('invalid');
            validationMessage.textContent = 'Invalid expression';
            return;
        }

        const plotButton = document.getElementById('plot-btn');
        const originalText = plotButton.textContent;
        plotButton.disabled = true;
        plotButton.textContent = 'Adding...';

        try {
            await this.addPlot(this.currentExpression);
        } catch (error) {
            console.error('Plotting error:', error);
            this.showError(`Plotting failed: ${error.message}`);
        } finally {
            plotButton.disabled = false;
            plotButton.textContent = originalText;
        }
    }

        

    async plotWithBackend() {
        // Ensure we have valid parameters (object, not array)
        const parameters = (this.currentParameters && typeof this.currentParameters === 'object' && !Array.isArray(this.currentParameters)) ? 
                          this.currentParameters : {};
        
        const xRange = [-10, 10]; // Use the 20x20 viewport
        
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



    normalizeExpression(expression) {
        // Normalize expression by removing spaces and converting to lowercase
        let normalized = expression.toLowerCase().replace(/\s+/g, '');
        
        // Replace common mathematical operators and constants first
        normalized = normalized
            .replace(/\^/g, '**') // Convert ^ to ** for power
            .replace(/pi/g, 'math.pi')
            .replace(/e(?![a-z])/g, 'math.e'); // Only replace standalone 'e'
        
        // Handle function calls first to protect them from multiplication logic
        const functionData = this.preserveFunctionCalls(normalized);
        normalized = functionData.expr;
        
        // Add explicit multiplication for implied multiplication (e.g., "2x" -> "2*x")
        normalized = this.addExplicitMultiplication(normalized);
        
        // Restore function calls
        normalized = this.restoreFunctionCalls(normalized, functionData.placeholders);
        
        // Sort multiplication terms
        normalized = this.sortMultiplicationTerms(normalized);
        
        return normalized;
    }

    preserveFunctionCalls(expr) {
        // Replace function calls with placeholders to protect them
        const placeholders = [];
        let placeholderIndex = 0;
        
        const processedExpr = expr.replace(/(sin|cos|tan|sqrt|log|exp)\s*\([^)]+\)/g, (match) => {
            const placeholder = `__FUNC_${placeholderIndex}__`;
            placeholders[placeholderIndex] = match;
            placeholderIndex++;
            return placeholder;
        });
        
        return { expr: processedExpr, placeholders };
    }

    restoreFunctionCalls(expr, placeholders) {
        // Restore function calls from placeholders
        if (!placeholders) return expr;
        
        placeholders.forEach((funcCall, index) => {
            const placeholder = `__FUNC_${index}__`;
            // Simple string replacement since placeholders are unique
            expr = expr.split(placeholder).join(funcCall);
        });
        
        return expr;
    }

    restoreFunctionCalls(expr) {
        // Restore function calls from placeholders
        if (!this.functionPlaceholders) return expr;
        
        this.functionPlaceholders.forEach((funcCall, index) => {
            const placeholder = `__FUNC_${index}__`;
            // Simple string replacement since placeholders are unique
            expr = expr.split(placeholder).join(funcCall);
        });
        
        return expr;
    }

    addExplicitMultiplication(expr) {
        // Add explicit multiplication for cases like "2x", "x2", etc.
        // Skip placeholders (function calls)
        return expr
            // Number followed by variable: "2x" -> "2*x"
            .replace(/(\d)([a-z])/g, '$1*$2')
            // Variable followed by number: "x2" -> "x*2"
            .replace(/([a-z])(\d)/g, '$1*$2')
            // Variable followed by function (but not placeholders): "xsin" -> "x*sin"
            .replace(/([a-z])(sin|cos|tan|sqrt|log|exp)(?!__)/g, '$1*$2')
            // Variable followed by parenthesis (but not placeholders): "x(" -> "x*("
            .replace(/([a-z])(?!\w*__\s*)\(/g, '$1*(')
            // Parenthesis followed by variable: ")x" -> ")*x"
            .replace(/\)([a-z])/g, ')*$1')
            // Number followed by parenthesis: "2(" -> "2*("
            .replace(/(\d)\(/g, '$1*(')
            // Parenthesis followed by number: ")2" -> ")*2"
            .replace(/\)(\d)/g, ')*$1');
    }

    sortMultiplicationTerms(expr) {
        // Sort multiplication terms to handle commutative property
        // This is a simplified approach for basic cases
        
        const sortMultiplicationChain = (chain) => {
            const terms = chain.split('*');
            const sorted = terms.sort((a, b) => {
                const aIsNumber = /^\d+(\.\d+)?$/.test(a);
                const bIsNumber = /^\d+(\.\d+)?$/.test(b);
                const aIsConstant = /^(math\.pi|math\.e)$/.test(a);
                const bIsConstant = /^(math\.pi|math\.e)$/.test(b);
                
                // Order: numbers, constants, variables, functions
                if (aIsNumber && !bIsNumber) return -1;
                if (!aIsNumber && bIsNumber) return 1;
                if (aIsConstant && !bIsConstant) return -1;
                if (!aIsConstant && bIsConstant) return 1;
                if (a.startsWith('math.') && !b.startsWith('math.')) return 1;
                if (!a.startsWith('math.') && b.startsWith('math.')) return -1;
                return a.localeCompare(b);
            });
            return sorted.join('*');
        };

        // Find and sort multiplication chains
        return expr.replace(/([a-z0-9.]+(?:\*\*[0-9.]+)?|\([^)]+\)(?:\*\*[0-9.]+)?)(?:\*([a-z0-9.]+(?:\*\*[0-9.]+)?|\([^)]+\)(?:\*\*[0-9.]+)?))*/g, sortMultiplicationChain);
    }

    areExpressionsEquivalent(expr1, expr2) {
        const norm1 = this.normalizeExpression(expr1);
        const norm2 = this.normalizeExpression(expr2);
        return norm1 === norm2;
    }

    async addPlot(expression) {
        // Check if plot already exists (exact match)
        if (this.plots.some(plot => plot.expression === expression)) {
            this.showError('This expression is already plotted');
            return;
        }

        // Check for equivalent expressions
        if (this.plots.some(plot => this.areExpressionsEquivalent(plot.expression, expression))) {
            this.showError('This expression is already plotted');
            return;
        }

        const plotId = this.plotIdCounter++;
        const colorIndex = this.plots.length % this.functionColors.length;
        const color = this.functionColors[colorIndex];
        
        const plot = {
            id: plotId,
            expression: expression,
            color: color,
            visible: true,
            data: null,
            classification: null
        };

        try {
            // Get expression classification
            const classification = await apiClient.parseExpression(expression);
            plot.classification = classification;

            // Get plot data - ensure parameters is an object
            const parameters = (this.currentParameters && typeof this.currentParameters === 'object' && !Array.isArray(this.currentParameters)) ? 
                              this.currentParameters : {};
            
            const result = await apiClient.evaluateExpression(
                expression,
                parameters,
                [-10, 10],
                1000
            );

            plot.data = result.graph_data.coordinates;
            
            // Add to plots array
            this.plots.push(plot);
            
            // Update UI
            this.renderPlotList();
            this.updateGraph();
            
            this.showSuccess(`Added: ${expression}`);
            
        } catch (error) {
            throw error;
        }
    }

    removePlot(plotId) {
        const index = this.plots.findIndex(plot => plot.id === plotId);
        if (index !== -1) {
            this.plots.splice(index, 1);
            this.renderPlotList();
            this.updateGraph();
        }
    }

    togglePlot(plotId) {
        const plot = this.plots.find(p => p.id === plotId);
        if (plot) {
            plot.visible = !plot.visible;
            this.renderPlotList();
            this.updateGraph();
        }
    }

    deleteAllPlots() {
        if (this.plots.length === 0) {
            this.showError('No plots to delete');
            return;
        }

        if (confirm(`Are you sure you want to delete all ${this.plots.length} plotted function(s)?`)) {
            this.plots = [];
            this.renderPlotList();
            this.updateGraph();
            this.showSuccess('All plots deleted');
        }
    }

    hideAllPlots() {
        if (this.plots.length === 0) {
            this.showError('No plots to hide');
            return;
        }

        let hiddenCount = 0;
        this.plots.forEach(plot => {
            if (plot.visible) {
                plot.visible = false;
                hiddenCount++;
            }
        });

        if (hiddenCount > 0) {
            this.renderPlotList();
            this.updateGraph();
            this.showSuccess(`${hiddenCount} plot(s) hidden`);
        } else {
            this.showError('All plots are already hidden');
        }
    }

    showAllPlots() {
        if (this.plots.length === 0) {
            this.showError('No plots to show');
            return;
        }

        let shownCount = 0;
        this.plots.forEach(plot => {
            if (!plot.visible) {
                plot.visible = true;
                shownCount++;
            }
        });

        if (shownCount > 0) {
            this.renderPlotList();
            this.updateGraph();
            this.showSuccess(`${shownCount} plot(s) shown`);
        } else {
            this.showError('All plots are already visible');
        }
    }

    renderPlotList() {
        const container = document.getElementById('plots-container');
        const controlsContainer = document.querySelector('.plots-controls');
        
        if (this.plots.length === 0) {
            container.innerHTML = '<div class="empty-plots">No functions plotted yet</div>';
            // Hide control buttons when no plots
            if (controlsContainer) {
                controlsContainer.style.display = 'none';
            }
            return;
        }

        // Show control buttons when there are plots
        if (controlsContainer) {
            controlsContainer.style.display = 'flex';
        }

        container.innerHTML = this.plots.map(plot => {
            const typeClass = plot.classification?.type || 'explicit';
            const typeLabel = {
                'explicit': 'Function',
                'implicit': 'Implicit',
                'parametric': 'Parametric'
            }[typeClass] || 'Function';

            return `
                <div class="plot-item">
                    <div class="plot-info">
                        <div class="plot-color" style="background-color: ${plot.color}"></div>
                        <div>
                            <div class="plot-expression">${plot.expression}</div>
                            <div class="plot-type">${typeLabel}</div>
                        </div>
                    </div>
                    <div class="plot-controls">
                        <button class="plot-btn toggle ${plot.visible ? 'active' : ''}" 
                                onclick="grapherApp.togglePlot(${plot.id})">
                            ${plot.visible ? 'Hide' : 'Show'}
                        </button>
                        <button class="plot-btn delete" onclick="grapherApp.removePlot(${plot.id})">
                            Delete
                        </button>
                    </div>
                </div>
            `;
        }).join('');
    }

    updateGraph() {
        // Clear all functions
        this.graphRenderer.clearAllFunctions();
        
        // Add visible plots with their specific colors
        this.plots.forEach((plot, index) => {
            if (plot.visible && plot.data) {
                // Find the color index for this plot
                const colorIndex = this.functionColors.indexOf(plot.color);
                this.graphRenderer.plotFunction(
                    plot.expression,
                    plot.data,
                    colorIndex >= 0 ? colorIndex : index
                );
            }
        });
    }

    showSuccess(message) {
        const errorContainer = document.getElementById('error-container');
        errorContainer.innerHTML = `<div class="success" style="background: #d4edda; color: #155724; border: 1px solid #c3e6cb; padding: 15px; border-radius: 8px; margin-bottom: 20px;">${message}</div>`;
        
        setTimeout(() => {
            errorContainer.innerHTML = '';
        }, 3000);
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