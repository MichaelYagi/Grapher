// Main Application Controller
class GrapherApp {
    constructor() {
        this.graphRenderer = new GraphRenderer('graph');
        this.graphRenderer3D = null; // Will be initialized when needed
        this.currentExpression = '';
        this.currentParameters = {};
        
        // Plot management
        this.plots = [];
        this.plotIdCounter = 0;
        this.functionColors = [
            '#8b5cf6', '#10b981', '#f59e0b', '#ef4444', '#06b6d4', 
            '#ec4899', '#84cc16', '#f97316', '#3b82f6', '#a855f7'
        ];
        
        // Graph mode management
        this.currentGraphMode = '2d'; // '2d', 'surface-3d', 'parametric-3d'
        
        // Range management
        this.currentRange = 'small'; // 'small' or 'large'
        this.ranges = {
            small: { x: [-10, 10], y: [-10, 10], z: [-10, 10] },
            large: { x: [-30, 30], y: [-30, 30], z: [-30, 30] }
        };
        
        // Set initial range to default display range
        this.graphRenderer.updateRange(this.ranges[this.currentRange].x, this.ranges[this.currentRange].y);
        
        // Setup mobile optimizations
        this.setupMobileOptimizations();
        
        this.initialize();
    }

    async initialize() {
        // Setup event listeners
        this.setupEventListeners();
        
        // Check backend availability
        await this.checkBackendAvailability();
        
        // Initialize with default expression
        await this.validateAndParseExpression(document.getElementById('expression').value);
        
        // Initial render of plot list
        this.renderPlotList();
        
        console.log('Grapher app initialized');
    }

    setupEventListeners() {
        const graphTypeSelect = document.getElementById('graph-type');
        const expressionInput = document.getElementById('expression');
        const plotButton = document.getElementById('plot-btn');
        const toggleGridButton = document.getElementById('toggle-grid-btn');
        const toggleRangeButton = document.getElementById('toggle-range-btn');
        const downloadPngButton = document.getElementById('download-png-btn');
        const downloadSvgButton = document.getElementById('download-svg-btn');
        const download3dButton = document.getElementById('download-3d-btn');
        const resetViewButton = document.getElementById('reset-view-btn');
        const toggleRotationButton = document.getElementById('toggle-rotation-btn');
        const deleteAllButton = document.getElementById('delete-all-btn');
        const hideAllButton = document.getElementById('hide-all-btn');
        const showAllButton = document.getElementById('show-all-btn');

        // Graph type change
        graphTypeSelect.addEventListener('change', (e) => {
            this.switchGraphMode(e.target.value);
        });

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

        // Range toggle button
        toggleRangeButton.addEventListener('click', () => {
            this.toggleRange();
        });

        // Download buttons
        downloadPngButton.addEventListener('click', () => {
            this.graphRenderer.downloadGraph('png');
        });

        downloadSvgButton.addEventListener('click', () => {
            this.graphRenderer.downloadGraph('svg');
        });

        download3dButton.addEventListener('click', () => {
            if (this.graphRenderer3D) {
                this.graphRenderer3D.downloadImage('png');
            }
        });

        resetViewButton.addEventListener('click', () => {
            if (this.graphRenderer3D) {
                this.graphRenderer3D.updateRange(
                    this.ranges[this.currentRange].x,
                    this.ranges[this.currentRange].y,
                    this.ranges[this.currentRange].z
                );
            }
        });

        toggleRotationButton.addEventListener('click', () => {
            // Toggle rotation would require additional implementation
            console.log('Toggle rotation not yet implemented');
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
        // window.addEventListener('resize', () => {
        //     this.handleResize();
        // });
    }

    // Debounced expression validation for real-time feedback
    createDebouncedExpressionValidation(delay = 300) {
        let timeoutId;
        
        return (expression) => {
            clearTimeout(timeoutId);
            timeoutId = setTimeout(() => {
                this.validateAndParseExpression(expression);
            }, delay);
        };
    }

    async validateAndParseExpression(expression) {
        try {
            const result = await apiClient.parseExpression(expression);
            
            if (result.is_valid) {
                this.currentExpression = expression;
                this.currentVariables = result.variables;
                this.currentParameters = result.parameters || {};
                this.showValidationSuccess();
            } else {
                this.showValidationError(result.error);
            }
            
            return result;
            
        } catch (error) {
            this.showValidationError(error.message);
            return { is_valid: false, variables: [], error: error.message };
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
        const validationMessage = document.getElementById('validation-message');

        expressionInput.classList.add('valid');
        expressionInput.classList.remove('invalid');
        validationMessage.textContent = 'Valid expression';

        this.currentExpression = expressionInput.value;

        if (this.currentGraphMode === '2d') {
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
                let errorMessage = error.message;
                if (error.message === "iteration over a 0-d array") {
                    errorMessage = "Invalid expression";
                }

                this.showError(`Plotting failed: ${errorMessage}`);
                expressionInput.classList.remove('valid');
                expressionInput.classList.add('invalid');
                validationMessage.textContent = errorMessage;
            } finally {
                plotButton.disabled = false;
                plotButton.textContent = originalText;
            }
        } else if (this.currentGraphMode === 'surface-3d') {
            const surfaceExpression = document.getElementById('surface-expression').value;
            await this.add3DSurface(surfaceExpression);
        } else if (this.currentGraphMode === 'parametric-3d') {
            const xExpr = document.getElementById('parametric-x').value;
            const yExpr = document.getElementById('parametric-y').value;
            const zExpr = document.getElementById('parametric-z').value;
            await this.add3DParametric(xExpr, yExpr, zExpr);
        }
    }

    async add3DSurface(expression) {
        const plotId = this.plotIdCounter++;
        const colorIndex = this.plots.length % this.functionColors.length;
        
        const plot = {
            id: plotId,
            expression: expression,
            color: this.functionColors[colorIndex],
            visible: true,
            data: null,
            graphType: 'surface-3d'
        };

        try {
            const result = await apiClient.evaluate3DSurface(
                expression,
                {},
                this.ranges[this.currentRange].x,
                this.ranges[this.currentRange].y,
                50
            );

            plot.data = result.graph_data.coordinates;
            plot.zRange = result.graph_data.z_range;

            this.plots.push(plot);
            this.renderPlotList();
            this.updateGraph();
            this.showSuccess(`Added 3D surface: ${expression}`);

        } catch (error) {
            console.error('3D surface plotting error:', error);
            this.showError(`3D surface plotting failed: ${error.message}`);
        }
    }

    async add3DParametric(xExpr, yExpr, zExpr) {
        const plotId = this.plotIdCounter++;
        const colorIndex = this.plots.length % this.functionColors.length;
        
        const plot = {
            id: plotId,
            expression: `parametric(${xExpr}, ${yExpr}, ${zExpr})`,
            color: this.functionColors[colorIndex],
            visible: true,
            data: null,
            graphType: 'parametric-3d'
        };

        try {
            const result = await apiClient.evaluate3DParametric(
                xExpr,
                yExpr,
                zExpr,
                {},
                this.ranges[this.currentRange].x,
                this.ranges[this.currentRange].y,
                50
            );

            plot.data = result.graph_data.coordinates;
            plot.zRange = result.graph_data.z_range;

            this.plots.push(plot);
            this.renderPlotList();
            this.updateGraph();
            this.showSuccess(`Added 3D parametric: ${plot.expression}`);

        } catch (error) {
            console.error('3D parametric plotting error:', error);
            this.showError(`3D parametric plotting failed: ${error.message}`);
        }
    }

    // Mobile-specific optimizations
    setupMobileOptimizations() {
        this.isMobile = window.innerWidth <= 768;
        this.isSmallMobile = window.innerWidth <= 480;
        
        if (this.isMobile) {
            this.setupMobileUI();
            this.setupMobileKeyboardHandling();
            this.setupMobileTouchOptimizations();
        }
    }

    setupMobileUI() {
        // Add mobile-specific UI elements
        const header = document.querySelector('.header');
        if (this.isSmallMobile) {
            header.style.padding = '15px';
        }
        
        // Optimize button layout for mobile
        const graphControls = document.querySelector('.graph-controls');
        if (graphControls) {
            graphControls.classList.add('mobile-optimized');
        }
        
        // Add mobile-specific class to body
        document.body.classList.add(this.isMobile ? 'mobile' : 'desktop');
    }

    setupMobileKeyboardHandling() {
        const expressionInput = document.getElementById('expression');
        
        // Prevent zoom on iOS when focusing input
        expressionInput.addEventListener('touchstart', (e) => {
            e.target.style.fontSize = '16px';
        });
        
        // Better handling of virtual keyboard
        expressionInput.addEventListener('focus', () => {
            if (this.isMobile) {
                // Scroll input into view when keyboard appears
                setTimeout(() => {
                    expressionInput.scrollIntoView({ 
                        behavior: 'smooth', 
                        block: 'center' 
                    });
                }, 300);
            }
        });
        
        // Auto-advance to plot button on mobile
        expressionInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter' && this.isMobile) {
                const plotBtn = document.getElementById('plot-btn');
                if (!plotBtn.disabled) {
                    plotBtn.click();
                }
            }
        });
    }

    setupMobileTouchOptimizations() {
        // Add better touch targets for mobile
        const plotItems = document.querySelectorAll('.plot-item');
        plotItems.forEach(item => {
            item.style.minHeight = '48px'; // Minimum touch target size
        });
        
        // Prevent accidental touches during graph interaction
        const graphContainer = document.querySelector('.graph-container');
        if (graphContainer) {
            graphContainer.addEventListener('touchmove', (e) => {
                if (e.touches.length > 1) {
                    e.preventDefault(); // Prevent page scroll on pinch
                }
            }, { passive: false });
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

    switchGraphMode(mode) {
        this.currentGraphMode = mode;
        
        // Show/hide appropriate controls
        const surfaceInputs = document.getElementById('surface-inputs');
        const parametricInputs = document.getElementById('parametric-inputs');
        const expressionLabel = document.querySelector('label[for="expression"]');
        const graph2D = document.getElementById('graph-2d');
        const graph3D = document.getElementById('graph-3d');
        const controls2D = document.getElementById('2d-controls');
        const controls3D = document.getElementById('3d-controls');

        // Hide all specialized inputs first
        surfaceInputs.style.display = 'none';
        parametricInputs.style.display = 'none';

        if (mode === '2d') {
            expressionLabel.textContent = 'Mathematical Expression';
            const expressionInput = document.getElementById('expression');
            expressionInput.placeholder = 'e.g., x^2 + 2*x + 1';
            graph2D.style.display = 'block';
            graph3D.style.display = 'none';
            controls2D.style.display = 'flex';
            controls3D.style.display = 'none';
        } else if (mode === 'surface-3d') {
            expressionLabel.textContent = 'Surface Expression';
            surfaceInputs.style.display = 'block';
            graph2D.style.display = 'none';
            graph3D.style.display = 'block';
            controls2D.style.display = 'none';
            controls3D.style.display = 'flex';
            
            // Initialize 3D renderer if needed
            this.init3DRenderer();
        } else if (mode === 'parametric-3d') {
            expressionLabel.textContent = 'Parametric Equations';
            parametricInputs.style.display = 'block';
            graph2D.style.display = 'none';
            graph3D.style.display = 'block';
            controls2D.style.display = 'none';
            controls3D.style.display = 'flex';
            
            // Initialize 3D renderer if needed
            this.init3DRenderer();
        }
    }

    init3DRenderer() {
        if (!this.graphRenderer3D) {
            this.graphRenderer3D = new GraphRenderer3D('graph-3d');
        }
    }

    showSuccess(message) {
        const errorContainer = document.getElementById('error-container');
        errorContainer.innerHTML = `<div class="success" style="background: #d4edda; color: #155724; border: 1px solid #c3e6cb; padding: 15px; border-radius: 8px; margin-bottom: 20px;">${message}</div>`;
        
        setTimeout(() => {
            errorContainer.innerHTML = '';
        }, 3000);
    }

    async addPlot(expression) {
        // Allow all expressions - no duplicate checking

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
                [-30, 30], // Always use computation range
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
            let typeLabel = 'Function';
            if (plot.graphType === 'surface-3d') {
                typeLabel = '3D Surface';
            } else if (plot.graphType === 'parametric-3d') {
                typeLabel = '3D Parametric';
            } else {
                const typeClass = plot.classification?.type || 'explicit';
                typeLabel = {
                    'explicit': 'Function',
                    'implicit': 'Implicit',
                    'parametric': 'Parametric'
                }[typeClass] || 'Function';
            }

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
        // Separate 2D and 3D plots
        const plots2D = this.plots.filter(plot => !plot.graphType || plot.graphType === '2d');
        const plots3D = this.plots.filter(plot => plot.graphType && plot.graphType.includes('3d'));

        // Update 2D graph
        this.graphRenderer.clearAllFunctions();
        plots2D.forEach((plot, index) => {
            if (plot.visible && plot.data) {
                const colorIndex = this.functionColors.indexOf(plot.color);
                this.graphRenderer.plotFunction(
                    plot.expression,
                    plot.data,
                    colorIndex >= 0 ? colorIndex : index
                );
            }
        });

        // Update 3D graph if available
        if (this.graphRenderer3D) {
            this.graphRenderer3D.clearAllFunctions();
            plots3D.forEach((plot, index) => {
                if (plot.visible && plot.data) {
                    const colorIndex = this.functionColors.indexOf(plot.color);
                    if (plot.graphType === 'surface-3d') {
                        this.graphRenderer3D.plotSurface(
                            plot.expression,
                            plot.data,
                            plot.zRange,
                            colorIndex >= 0 ? colorIndex : index
                        );
                    } else if (plot.graphType === 'parametric-3d') {
                        this.graphRenderer3D.plotParametric(
                            plot.expression,
                            plot.data,
                            plot.zRange,
                            colorIndex >= 0 ? colorIndex : index
                        );
                    }
                }
            });
        }
    }

    toggleRange() {
        // Switch between ranges
        this.currentRange = this.currentRange === 'small' ? 'large' : 'small';
        const range = this.ranges[this.currentRange];
        
        // Update graph renderer with new range (scales handle rest)
        this.graphRenderer.updateRange(range.x, range.y);
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