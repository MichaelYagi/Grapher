class ParameterController {
    constructor(containerId, options = {}) {
        this.containerId = containerId;
        this.container = document.getElementById(containerId);
        this.options = {
            sliderMin: -10,
            sliderMax: 10,
            sliderStep: 0.1,
            defaultValues: {},
            colors: [
                '#8b5cf6', // Purple
                '#10b981', // Green
                '#f59e0b', // Orange
                '#ef4444', // Red
                '#06b6d4', // Cyan
            ],
            ...options
        };
        
        this.parameters = {};
        this.callbacks = [];
        this.debouncedUpdate = this.createDebouncedCallback();
    }

    createDebouncedCallback() {
        let timeoutId;
        return (parameters) => {
            clearTimeout(timeoutId);
            timeoutId = setTimeout(() => {
                this.notifyCallbacks(parameters);
            }, 300); // 300ms debounce for smooth interaction
        };
    }

    setParameters(variables, expression = '') {
        // Clear existing parameters
        this.clearParameters();
        this.parameters = {};

        if (!variables || variables.length === 0) {
            this.container.innerHTML = '<p style="color: #6c757d; font-style: italic;">No parameters in expression</p>';
            return;
        }

        // Filter out 'x' as it's the primary graphing variable
        const filteredVariables = variables.filter(v => v !== 'x');

        if (filteredVariables.length === 0) {
            this.container.innerHTML = '<p style="color: #6c757d; font-style: italic;">No adjustable parameters (x is the graphing variable)</p>';
            return;
        }

        // Create parameter controls
        filteredVariables.forEach((variable, index) => {
            this.createParameterControl(variable, index);
            this.parameters[variable] = this.options.defaultValues[variable] || 0;
        });
    }

    createParameterControl(variable, index) {
        const color = this.options.colors[index % this.options.colors.length];
        
        const controlDiv = document.createElement('div');
        controlDiv.className = 'parameter-control';
        controlDiv.style.borderLeft = `4px solid ${color}`;
        
        controlDiv.innerHTML = `
            <h4 style="color: ${color}; margin-bottom: 12px;">${variable}</h4>
            <div class="slider-container">
                <input 
                    type="range" 
                    class="parameter-slider" 
                    id="slider-${variable}"
                    min="${this.options.sliderMin}" 
                    max="${this.options.sliderMax}" 
                    step="${this.options.sliderStep}"
                    value="${this.options.defaultValues[variable] || 0}"
                    style="accent-color: ${color};"
                >
                <div class="parameter-value" id="value-${variable}" style="color: ${color}; font-weight: bold;">
                    ${this.options.defaultValues[variable] || 0}
                </div>
            </div>
        `;
        
        this.container.appendChild(controlDiv);
        
        // Add event listeners
        const slider = controlDiv.querySelector(`#slider-${variable}`);
        const valueDisplay = controlDiv.querySelector(`#value-${variable}`);
        
        slider.addEventListener('input', (e) => {
            const value = parseFloat(e.target.value);
            this.parameters[variable] = value;
            valueDisplay.textContent = value.toFixed(1);
            this.debouncedUpdate(this.parameters);
        });
        
        // Add double-click to reset
        slider.addEventListener('dblclick', () => {
            const defaultValue = this.options.defaultValues[variable] || 0;
            slider.value = defaultValue;
            valueDisplay.textContent = defaultValue.toFixed(1);
            this.parameters[variable] = defaultValue;
            this.notifyCallbacks(this.parameters);
        });
    }

    clearParameters() {
        this.container.innerHTML = '';
        this.parameters = {};
    }

    getParameters() {
        return { ...this.parameters };
    }

    setParameterValue(variable, value) {
        if (this.parameters.hasOwnProperty(variable)) {
            this.parameters[variable] = value;
            
            // Update UI
            const slider = document.getElementById(`slider-${variable}`);
            const valueDisplay = document.getElementById(`value-${variable}`);
            
            if (slider) {
                slider.value = value;
            }
            if (valueDisplay) {
                valueDisplay.textContent = value.toFixed(1);
            }
            
            this.notifyCallbacks(this.parameters);
        }
    }

    resetAllParameters() {
        Object.keys(this.parameters).forEach(variable => {
            const defaultValue = this.options.defaultValues[variable] || 0;
            this.setParameterValue(variable, defaultValue);
        });
    }

    setParameterLimits(variable, min, max, step) {
        const slider = document.getElementById(`slider-${variable}`);
        if (slider) {
            slider.min = min;
            slider.max = max;
            slider.step = step;
        }
    }

    addParameterVariable(variable, defaultValue = 0, min = -10, max = 10, step = 0.1) {
        if (!this.parameters.hasOwnProperty(variable)) {
            const index = Object.keys(this.parameters).length;
            this.createParameterControl(variable, index);
            this.parameters[variable] = defaultValue;
            
            // Set the slider value
            const slider = document.getElementById(`slider-${variable}`);
            const valueDisplay = document.getElementById(`value-${variable}`);
            
            if (slider) {
                slider.min = min;
                slider.max = max;
                slider.step = step;
                slider.value = defaultValue;
            }
            if (valueDisplay) {
                valueDisplay.textContent = defaultValue.toFixed(1);
            }
            
            this.notifyCallbacks(this.parameters);
        }
    }

    removeParameterVariable(variable) {
        if (this.parameters.hasOwnProperty(variable)) {
            delete this.parameters[variable];
            this.setParameters(Object.keys(this.parameters));
        }
    }

    onParametersChanged(callback) {
        this.callbacks.push(callback);
    }

    notifyCallbacks(parameters) {
        this.callbacks.forEach(callback => {
            try {
                callback(parameters);
            } catch (error) {
                console.error('Error in parameter callback:', error);
            }
        });
    }

    // Animation support
    animateParameter(variable, fromValue, toValue, duration = 1000) {
        if (!this.parameters.hasOwnProperty(variable)) {
            return;
        }

        const slider = document.getElementById(`slider-${variable}`);
        const valueDisplay = document.getElementById(`value-${variable}`);
        
        if (!slider || !valueDisplay) {
            return;
        }

        const startTime = performance.now();
        const valueRange = toValue - fromValue;

        const animate = (currentTime) => {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);
            
            // Easing function (ease-in-out)
            const easedProgress = progress < 0.5 
                ? 2 * progress * progress 
                : 1 - Math.pow(-2 * progress + 2, 2) / 2;
            
            const currentValue = fromValue + (valueRange * easedProgress);
            
            slider.value = currentValue;
            valueDisplay.textContent = currentValue.toFixed(1);
            this.parameters[variable] = currentValue;
            
            if (progress < 1) {
                requestAnimationFrame(animate);
            } else {
                this.notifyCallbacks(this.parameters);
            }
        };
        
        requestAnimationFrame(animate);
    }

    // Preset configurations
    loadPreset(preset) {
        if (preset.parameters) {
            Object.keys(preset.parameters).forEach(variable => {
                if (this.parameters.hasOwnProperty(variable)) {
                    this.setParameterValue(variable, preset.parameters[variable]);
                }
            });
        }
    }

    savePreset(name) {
        return {
            name: name,
            parameters: { ...this.parameters },
            timestamp: new Date().toISOString()
        };
    }

    // Keyboard shortcuts
    enableKeyboardShortcuts() {
        document.addEventListener('keydown', (e) => {
            // Ctrl/Cmd + R to reset all parameters
            if ((e.ctrlKey || e.metaKey) && e.key === 'r') {
                e.preventDefault();
                this.resetAllParameters();
            }
        });
    }

    // Accessibility features
    enableAccessibility() {
        Object.keys(this.parameters).forEach(variable => {
            const slider = document.getElementById(`slider-${variable}`);
            if (slider) {
                slider.setAttribute('aria-label', `Parameter ${variable} slider`);
                slider.setAttribute('role', 'slider');
                slider.setAttribute('aria-valuemin', this.options.sliderMin);
                slider.setAttribute('aria-valuemax', this.options.sliderMax);
                slider.setAttribute('aria-valuenow', this.parameters[variable]);
                slider.setAttribute('aria-valuetext', `${variable}: ${this.parameters[variable].toFixed(1)}`);
                
                // Update aria-valuenow on change
                slider.addEventListener('input', (e) => {
                    slider.setAttribute('aria-valuenow', e.target.value);
                    slider.setAttribute('aria-valuetext', `${variable}: ${parseFloat(e.target.value).toFixed(1)}`);
                });
            }
        });
    }
}