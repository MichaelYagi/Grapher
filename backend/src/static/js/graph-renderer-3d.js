class GraphRenderer3D {
    constructor(containerId, options = {}) {
        this.containerId = containerId;
        this.container = document.getElementById(containerId);
        
        this.options = {
            width: 800,
            height: 600,
            xRange: [-10, 10],
            yRange: [-10, 10],
            zRange: [-10, 10],
            colorscale: 'Viridis',
            ...options
        };

        this.functions = [];
        this.init();
    }

    init() {
        // Clear existing content
        this.container.innerHTML = '';
        
        // Load Plotly.js if not already loaded
        if (typeof Plotly === 'undefined') {
            this.loadPlotly();
        } else {
            this.setupPlot();
        }
    }

    loadPlotly() {
        const script = document.createElement('script');
        script.src = 'https://cdn.plot.ly/plotly-2.27.0.min.js';
        script.onload = () => this.setupPlot();
        document.head.appendChild(script);
    }

    setupPlot() {
        const layout = {
            autosize: true,
            width: this.options.width,
            height: this.options.height,
            scene: {
                xaxis: { 
                    title: 'X',
                    range: this.options.xRange
                },
                yaxis: { 
                    title: 'Y',
                    range: this.options.yRange
                },
                zaxis: { 
                    title: 'Z',
                    range: this.options.zRange
                },
                camera: {
                    eye: { x: 1.5, y: 1.5, z: 1.5 }
                }
            },
            margin: { l: 0, r: 0, b: 0, t: 0 },
            paper_bgcolor: 'rgba(0,0,0,0)',
            plot_bgcolor: 'rgba(0,0,0,0)',
            showlegend: true,
            legend: {
                x: 0,
                y: 1,
                bgcolor: 'rgba(255,255,255,0.8)',
                bordercolor: '#333',
                borderwidth: 1
            }
        };

        const config = {
            responsive: true,
            displayModeBar: true,
            displaylogo: false,
            modeBarButtonsToRemove: ['pan2d', 'select2d', 'lasso2d', 'resetScale2d'],
            toImageButtonOptions: {
                format: 'png',
                filename: 'graph_3d',
                height: this.options.height,
                width: this.options.width,
                scale: 2
            }
        };

        Plotly.newPlot(this.containerId, [], layout, config);
    }

    plotSurface(expression, coordinates, zRange, colorIndex = 0) {
        if (!coordinates || coordinates.length === 0) {
            console.warn('No coordinates to plot for 3D surface:', expression);
            return;
        }

        // Convert coordinates to the format expected by Plotly
        const xValues = [];
        const yValues = [];
        const zValues = [];
        const xSet = new Set();
        const ySet = new Set();

        // Extract unique x and y values
        coordinates.forEach(coord => {
            xSet.add(coord.x);
            ySet.add(coord.y);
        });

        const sortedX = Array.from(xSet).sort((a, b) => a - b);
        const sortedY = Array.from(ySet).sort((a, b) => a - b);

        // Create Z matrix
        const zMatrix = [];
        for (let i = 0; i < sortedY.length; i++) {
            const row = [];
            for (let j = 0; j < sortedX.length; j++) {
                const coord = coordinates.find(c => 
                    Math.abs(c.x - sortedX[j]) < 0.001 && 
                    Math.abs(c.y - sortedY[i]) < 0.001
                );
                row.push(coord ? coord.z : null);
            }
            zMatrix.push(row);
        }

        const colorscales = ['Viridis', 'Plasma', 'Inferno', 'Magma', 'Cividis', 'Blues', 'Reds', 'Greens'];
        const colorscale = colorscales[colorIndex % colorscales.length];

        const trace = {
            type: 'surface',
            name: expression,
            x: sortedX,
            y: sortedY,
            z: zMatrix,
            colorscale: colorscale,
            showscale: true,
            contours: {
                z: {
                    show: true,
                    usecolormap: true,
                    highlightcolor: "#42f462",
                    project: { z: true }
                }
            }
        };

        // Add to functions list
        this.functions.push({
            expression,
            type: 'surface',
            trace,
            colorIndex
        });

        // Update plot
        this.updatePlot();
    }

    plotParametric(expression, coordinates, zRange, colorIndex = 0) {
        if (!coordinates || coordinates.length === 0) {
            console.warn('No coordinates to plot for 3D parametric:', expression);
            return;
        }

        // Separate coordinates
        const xValues = coordinates.map(coord => coord.x);
        const yValues = coordinates.map(coord => coord.y);
        const zValues = coordinates.map(coord => coord.z);

        const colors = ['#1f77b4', '#ff7f0e', '#2ca02c', '#d62728', '#9467bd', '#8c564b', '#e377c2', '#7f7f7f'];
        const color = colors[colorIndex % colors.length];

        const trace = {
            type: 'scatter3d',
            mode: 'markers',
            name: expression,
            x: xValues,
            y: yValues,
            z: zValues,
            marker: {
                color: color,
                size: 3,
                opacity: 0.8
            },
            line: {
                color: color,
                width: 2
            }
        };

        // Add to functions list
        this.functions.push({
            expression,
            type: 'parametric',
            trace,
            colorIndex
        });

        // Update plot
        this.updatePlot();
    }

    updatePlot() {
        const traces = this.functions.map(func => func.trace);
        Plotly.react(this.containerId, traces, this.getLayout());
    }

    getLayout() {
        return {
            autosize: true,
            width: this.options.width,
            height: this.options.height,
            scene: {
                xaxis: { 
                    title: 'X',
                    range: this.options.xRange
                },
                yaxis: { 
                    title: 'Y',
                    range: this.options.yRange
                },
                zaxis: { 
                    title: 'Z',
                    range: this.options.zRange
                },
                camera: {
                    eye: { x: 1.5, y: 1.5, z: 1.5 }
                }
            },
            margin: { l: 0, r: 0, b: 0, t: 0 },
            paper_bgcolor: 'rgba(0,0,0,0)',
            plot_bgcolor: 'rgba(0,0,0,0)',
            showlegend: true,
            legend: {
                x: 0,
                y: 1,
                bgcolor: 'rgba(255,255,255,0.8)',
                bordercolor: '#333',
                borderwidth: 1
            }
        };
    }

    removeFunction(expression) {
        const index = this.functions.findIndex(f => f.expression === expression);
        if (index !== -1) {
            this.functions.splice(index, 1);
            this.updatePlot();
        }
    }

    clearAllFunctions() {
        this.functions = [];
        this.updatePlot();
    }

    updateRange(xRange, yRange, zRange) {
        this.options.xRange = xRange;
        this.options.yRange = yRange;
        this.options.zRange = zRange;
        this.updatePlot();
    }

    resize(width, height) {
        this.options.width = width;
        this.options.height = height;
        const update = {
            width: width,
            height: height
        };
        Plotly.relayout(this.containerId, update);
    }

    downloadImage(format = 'png', filename = null) {
        if (!filename) {
            const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-');
            const expression = this.functions.length > 0 ? this.functions[0].expression.replace(/[^a-zA-Z0-9]/g, '_') : 'graph_3d';
            filename = `grapher_3d_${expression}_${timestamp}`;
        }

        const config = {
            format: format,
            filename: filename,
            width: this.options.width,
            height: this.options.height,
            scale: 2
        };

        Plotly.downloadImage(this.containerId, config);
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = GraphRenderer3D;
}