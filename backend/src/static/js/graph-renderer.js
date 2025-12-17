class GraphRenderer {
    constructor(svgId, options = {}) {
        this.svgId = svgId;
        this.svg = d3.select(`#${svgId}`);
        
        // Default options for 20x20 viewport with equal aspect ratio
        this.options = {
            width: 600,
            height: 600,
            margin: { top: 10, right: 14, bottom: 10, left: 10 },
            xRange: [-30, 30],
            yRange: [-30, 30],
            gridEnabled: true,
            axisColors: {
                x: '#6b7280', // Grey
                y: '#6b7280', // Grey
                grid: '#e5e7eb',
                text: '#374151'
            },
            functionColors: [
                '#8b5cf6', // Purple
                '#10b981', // Green
                '#f59e0b', // Orange
                '#ef4444', // Red
                '#06b6d4', // Cyan
                '#ec4899', // Pink
                '#84cc16', // Lime
                '#f97316'  // Dark Orange
            ],
            ...options
        };

        // Calculate inner dimensions
        this.innerWidth = this.options.width - this.options.margin.left - this.options.margin.right;
        this.innerHeight = this.options.height - this.options.margin.top - this.options.margin.bottom;

        this.setupChart();
        this.functions = [];
        
        // Mobile touch support
        this.setupTouchEvents();
        this.setupResizeHandler();
    }

    setupResponsiveDimensions() {
        const isMobile = window.innerWidth <= 768;
        const isSmallMobile = window.innerWidth <= 480;
        const isLandscape = window.innerHeight < window.innerWidth && isMobile;

        if (isMobile) {
            if (isLandscape) {
                // Landscape mobile - square ish
                this.options.width = Math.min(450, window.innerWidth - 40);
                this.options.height = Math.min(450, window.innerHeight - 200);
            } else if (isSmallMobile) {
                // Small mobile portrait
                this.options.width = window.innerWidth - 30;
                this.options.height = 350;
            } else {
                // Regular mobile portrait
                this.options.width = window.innerWidth - 30;
                this.options.height = 400;
            }
            
            // Reduce margins for mobile
            this.options.margin = { top: 8, right: 10, bottom: 8, left: 8 };
        } else if (window.innerWidth <= 1024) {
            // Tablet
            this.options.width = 500;
            this.options.height = 500;
        }
        
        // Recalculate inner dimensions
        this.innerWidth = this.options.width - this.options.margin.left - this.options.margin.right;
        this.innerHeight = this.options.height - this.options.margin.top - this.options.margin.bottom;
    }

    setupTouchEvents() {
        const svg = this.svg.node();
        
        // Touch event handlers for mobile interaction
        let touchStartPoint = null;
        let initialTransform = null;

        const handleTouchStart = (event) => {
            if (event.touches.length === 1) {
                const touch = event.touches[0];
                touchStartPoint = {
                    x: touch.clientX,
                    y: touch.clientY
                };
                initialTransform = this.getCurrentTransform();
            }
        };

        const handleTouchMove = (event) => {
            if (event.touches.length === 1 && touchStartPoint) {
                event.preventDefault();
                const touch = event.touches[0];
                const dx = touch.clientX - touchStartPoint.x;
                const dy = touch.clientY - touchStartPoint.y;
                
                // Apply pan with touch
                this.panTo(initialTransform.x + dx, initialTransform.y + dy);
            }
        };

        const handleTouchEnd = () => {
            touchStartPoint = null;
            initialTransform = null;
        };

        // Add touch event listeners
        // svg.addEventListener('touchstart', handleTouchStart, { passive: false });
        // svg.addEventListener('touchmove', handleTouchMove, { passive: false });
        // svg.addEventListener('touchend', handleTouchEnd);

        // Pinch-to-zoom support
        let initialDistance = 0;
        let initialScale = 1;

        const handlePinchStart = (event) => {
            if (event.touches.length === 2) {
                const touch1 = event.touches[0];
                const touch2 = event.touches[1];
                initialDistance = Math.hypot(
                    touch2.clientX - touch1.clientX,
                    touch2.clientY - touch1.clientY
                );
                initialScale = this.getCurrentTransform().scale;
            }
        };

        const handlePinchMove = (event) => {
            if (event.touches.length === 2 && initialDistance > 0) {
                event.preventDefault();
                const touch1 = event.touches[0];
                const touch2 = event.touches[1];
                const currentDistance = Math.hypot(
                    touch2.clientX - touch1.clientX,
                    touch2.clientY - touch1.clientY
                );
                
                const scale = initialScale * (currentDistance / initialDistance);
                this.zoomTo(scale);
            }
        };

        // svg.addEventListener('touchstart', handlePinchStart, { passive: false });
        // svg.addEventListener('touchmove', handlePinchMove, { passive: false });
    }

    setupResizeHandler() {
        let resizeTimeout;
        
        const handleResize = () => {
            clearTimeout(resizeTimeout);
            resizeTimeout = setTimeout(() => {
                const oldWidth = this.options.width;
                const oldHeight = this.options.height;
                
                this.setupResponsiveDimensions();
                
                // Only redraw if dimensions actually changed
                if (oldWidth !== this.options.width || oldHeight !== this.options.height) {
                    this.setupChart();
                    this.redrawAllFunctions();
                }
            }, 250); // Debounce resize events
        };

        // window.addEventListener('resize', handleResize);
        // window.addEventListener('orientationchange', handleResize);
    }

    getCurrentTransform() {
        // Get current transformation matrix for pan/zoom operations
        const transform = this.mainGroup.property('__zoom') || { x: 0, y: 0, scale: 1 };
        return transform;
    }

    panTo(x, y) {
        // Pan the graph to the specified coordinates
        this.mainGroup.transition()
            .duration(100)
            .attr('transform', `translate(${x},${y})`);
    }

    zoomTo(scale) {
        // Zoom the graph to the specified scale
        const currentTransform = this.getCurrentTransform();
        this.mainGroup.transition()
            .duration(100)
            .attr('transform', `translate(${currentTransform.x},${currentTransform.y}) scale(${scale})`);
    }

    redrawAllFunctions() {
        // Redraw all functions after resize
        const tempFunctions = [...this.functions];
        this.functions = [];
        tempFunctions.forEach(func => {
            this.addFunction(func.data, func.color, func.expression, func.type);
        });
    }

    setupChart() {
        // Clear any existing content
        this.svg.selectAll('*').remove();

        // Set up responsive dimensions for mobile
        this.setupResponsiveDimensions();

        // Create main group
        this.mainGroup = this.svg
            .attr('width', this.options.width)
            .attr('height', this.options.height)
            .append('g')
            .attr('transform', `translate(${this.options.margin.left},${this.options.margin.top})`); // 35,30

        // Create scales with equal aspect ratio
        this.xScale = d3.scaleLinear()
            .domain(this.options.xRange)
            .range([0, this.innerWidth]);

        this.yScale = d3.scaleLinear()
            .domain(this.options.yRange)
            .range([this.innerHeight, 0]); // Inverted for SVG coordinates

        // Create grid
        this.gridGroup = this.mainGroup.append('g')
            .attr('class', 'grid')
            .attr('opacity', this.options.gridEnabled ? 1 : 0);

        // Create axes
        this.xAxis = this.mainGroup.append('g')
            .attr('class', 'x-axis')
            .attr('transform', `translate(0,${this.innerHeight / 2})`);

        this.yAxis = this.mainGroup.append('g')
            .attr('class', 'y-axis')
            .attr('transform', `translate(${this.innerWidth / 2},0)`);

        // Create function plots group
        this.functionsGroup = this.mainGroup.append('g')
            .attr('class', 'functions');

        // Create interactive elements group
        this.interactiveGroup = this.mainGroup.append('g')
            .attr('class', 'interactive');

    this.renderGrid();
        this.renderAxes();
    }

    updateRange(xRange, yRange) {
        // Update options with new ranges
        this.options.xRange = xRange;
        this.options.yRange = yRange;

        // Update scales
        this.xScale = d3.scaleLinear()
            .domain(xRange)
            .range([0, this.innerWidth]);

        this.yScale = d3.scaleLinear()
            .domain(yRange)
            .range([this.innerHeight, 0]); // Inverted for SVG coordinates

        // Update all existing plot paths with new scales
        this.updatePlotPaths();

        // Re-render grid and axes
        this.renderGrid();
        this.renderAxes();
    }

    updatePlotPaths() {
        // Update all existing plot paths to use new scales
        this.functions.forEach((func, index) => {
            if (func.element && func.coordinates) {
                // Create line generator with updated scales
                const line = d3.line()
                    .x(d => this.xScale(d.x))
                    .y(d => this.yScale(d.y))
                    .defined(d => !isNaN(d.y) && isFinite(d.y));

                // Update the path with new scale transformation
                func.element
                    .datum(func.coordinates)
                    .transition()
                    .duration(300)
                    .attr('d', line);
            }
        });
    }

renderGrid() {
        // Clear existing grid
        this.gridGroup.selectAll('*').remove();

        // Create vertical grid lines
        const xTicks = this.xScale.ticks(20);
        this.gridGroup.selectAll('.vertical-grid')
            .data(xTicks)
            .enter()
            .append('line')
            .attr('class', 'vertical-grid')
            .attr('x1', d => this.xScale(d))
            .attr('x2', d => this.xScale(d))
            .attr('y1', 0)
            .attr('y2', this.innerHeight)
            .style('stroke', this.options.axisColors.grid)
            .style('stroke-width', 0.5)
            .style('opacity', 0.7);

        // Create horizontal grid lines
        const yTicks = this.yScale.ticks(20);
        this.gridGroup.selectAll('.horizontal-grid')
            .data(yTicks)
            .enter()
            .append('line')
            .attr('class', 'horizontal-grid')
            .attr('x1', 0)
            .attr('x2', this.innerWidth)
            .attr('y1', d => this.yScale(d))
            .attr('y2', d => this.yScale(d))
            .style('stroke', this.options.axisColors.grid)
            .style('stroke-width', 0.5)
            .style('opacity', 0.7);

        
    }

    renderAxes() {
        // X-axis
        const xAxisBottom = d3.axisBottom(this.xScale)
            .ticks(21) // -10 to 10 inclusive
            .tickSize(0) // Remove ticks
            .tickFormat(d => {
                if (d === 0) {
                    return '            0'; // Add more spaces to shift 0 further right
                }
                return d3.format('d')(d);
            });

        this.xAxis
            .call(xAxisBottom)
            .selectAll('line')
            .style('stroke', this.options.axisColors.x)
            .style('stroke-width', 2);

        this.xAxis
            .selectAll('text')
            .style('fill', this.options.axisColors.text)
            .style('font-size', '12px')
            .style('transform', d => d === 0 ? 'translate(5px,0)' : 'none');

        // Main x-axis line (y=0)
        this.mainGroup
            .append('line')
            .attr('class', 'x-axis-main')
            .attr('x1', 0)
            .attr('x2', this.innerWidth)
            .attr('y1', this.innerHeight / 2)
            .attr('y2', this.innerHeight / 2)
            .style('stroke', this.options.axisColors.x)
            .style('stroke-width', 2);

        // Y-axis
        const yAxisLeft = d3.axisLeft(this.yScale)
            .ticks(21) // -10 to 10 inclusive
            .tickSize(0) // Remove ticks
            .tickFormat(d => d === 0 ? '' : d3.format('d')(d));

        this.yAxis
            .call(yAxisLeft)
            .selectAll('line')
            .style('stroke', this.options.axisColors.y)
            .style('stroke-width', 2);

        this.yAxis
            .selectAll('text')
            .style('fill', this.options.axisColors.text)
            .style('font-size', '12px');

        // Main y-axis line (x=0)
        this.mainGroup
            .append('line')
            .attr('class', 'y-axis-main')
            .attr('x1', this.innerWidth / 2)
            .attr('x2', this.innerWidth / 2)
            .attr('y1', 0)
            .attr('y2', this.innerHeight)
            .style('stroke', this.options.axisColors.y)
            .style('stroke-width', 2);

        // Add axis labels
        this.mainGroup
            .append('text')
            .attr('class', 'x-label')
            .attr('x', (this.innerWidth / 2) + 5)
            .attr('y', this.innerHeight - 5)
            .style('text-anchor', 'top')
            .style('fill', this.options.axisColors.y)
            .text('y');

        this.mainGroup
            .append('text')
            .attr('class', 'y-label')
            .attr('x', 5)
            .attr('y', (this.innerHeight / 2) - 5)
            .style('text-anchor', 'start')
            .style('fill', this.options.axisColors.x)
            .text('x');
    }

    plotFunction(expression, coordinates, colorIndex = 0) {
        if (!coordinates || coordinates.length === 0) {
            console.warn('No coordinates to plot for expression:', expression);
            return;
        }

        const color = this.options.functionColors[colorIndex % this.options.functionColors.length];
        
        // Remove existing function with same expression if it exists
        this.removeFunction(expression);

        // Process coordinates to detect and break at asymptotes
        const processedCoordinates = this.breakAtAsymptotes(coordinates);

        // Create line generator
        const line = d3.line()
            .x(d => this.xScale(d.x))
            .y(d => this.yScale(d.y))
            .defined(d => !isNaN(d.y) && isFinite(d.y));

// Add the function to our tracking array
        this.functions.push({ expression, color, element: null, coordinates: processedCoordinates });

        // Draw the function curve
        const path = this.functionsGroup
            .append('path')
            .datum(processedCoordinates)
            .attr('class', `function-${this.functions.length - 1}`)
            .attr('d', line)
            .style('fill', 'none')
            .style('stroke', color)
            .style('stroke-width', 2.5)
            .style('stroke-linejoin', 'round')
            .style('stroke-linecap', 'round');

        // Update the tracked element
        this.functions[this.functions.length - 1].element = path;

        // Add hover interactions
        this.addInteractions(expression, processedCoordinates, color);
    }

    breakAtAsymptotes(coordinates) {
        if (!coordinates || coordinates.length < 2) return coordinates;
        
        const processed = [];
        const jumpThreshold = 50; // Threshold for detecting large jumps
        
        for (let i = 0; i < coordinates.length; i++) {
            const coord = coordinates[i];
            
            // Check for large jump from previous point (indicating asymptote)
            if (i > 0) {
                const prevCoord = coordinates[i - 1];
                const yDiff = Math.abs(coord.y - prevCoord.y);
                
                // If there's a large jump, insert NaN to break the line
                if (yDiff > jumpThreshold) {
                    processed.push({ x: NaN, y: NaN });
                }
            }
            
            processed.push(coord);
        }
        
        return processed;
    }

    addInteractions(expression, coordinates, color) {
        // Create hover points for tracing
        const hoverCircle = this.interactiveGroup
            .append('circle')
            .attr('r', 4)
            .style('fill', color)
            .style('stroke', 'white')
            .style('stroke-width', 2)
            .style('opacity', 0);

        // Create tooltip
        const tooltip = this.interactiveGroup
            .append('g')
            .style('opacity', 0);

        const tooltipRect = tooltip
            .append('rect')
            .attr('rx', 4)
            .attr('ry', 4)
            .style('fill', 'rgba(0, 0, 0, 0.8)');

        const tooltipText = tooltip
            .append('text')
            .style('fill', 'white')
            .style('font-size', '12px')
            .style('font-family', 'monospace');

        // Create invisible overlay for mouse events
        const overlay = this.mainGroup
            .append('rect')
            .attr('class', 'overlay')
            .attr('width', this.innerWidth)
            .attr('height', this.innerHeight)
            .style('fill', 'none')
            .style('pointer-events', 'all');

        // Mouse move handler
        overlay.on('mousemove', (event) => {
            const [mouseX, mouseY] = d3.pointer(event);
            const xValue = this.xScale.invert(mouseX);
            
            // Find closest point on the curve
            const closestPoint = this.findClosestPoint(xValue, coordinates);
            
            if (closestPoint) {
                hoverCircle
                    .attr('cx', this.xScale(closestPoint.x))
                    .attr('cy', this.yScale(closestPoint.y))
                    .style('opacity', 1);

                const tooltipContent = `x: ${closestPoint.x.toFixed(3)}\\ny: ${closestPoint.y.toFixed(3)}`;
                tooltipText.text(tooltipContent);
                
                const bbox = tooltipText.node().getBBox();
                tooltipRect
                    .attr('x', bbox.x - 6)
                    .attr('y', bbox.y - 4)
                    .attr('width', bbox.width + 12)
                    .attr('height', bbox.height + 8);

                tooltip
                    .attr('transform', `translate(${this.xScale(closestPoint.x) + 10}, ${this.yScale(closestPoint.y) - 20})`)
                    .style('opacity', 1);
            }
        });

        overlay.on('mouseleave', () => {
            hoverCircle.style('opacity', 0);
            tooltip.style('opacity', 0);
        });
    }

    findClosestPoint(targetX, coordinates) {
        if (!coordinates || coordinates.length === 0) return null;

        let closestPoint = null;
        let minDistance = Infinity;

        for (const point of coordinates) {
            const distance = Math.abs(point.x - targetX);
            if (distance < minDistance) {
                minDistance = distance;
                closestPoint = point;
            }
        }

        return closestPoint;
    }

    removeFunction(expression) {
        const index = this.functions.findIndex(f => f.expression === expression);
        if (index !== -1) {
            if (this.functions[index].element) {
                this.functions[index].element.remove();
            }
            this.functions.splice(index, 1);
        }
    }

    clearAllFunctions() {
        this.functionsGroup.selectAll('*').remove();
        this.interactiveGroup.selectAll('*').remove();
        this.functions = [];
    }

    toggleGrid() {
        this.options.gridEnabled = !this.options.gridEnabled;
        this.gridGroup
            .transition()
            .duration(300)
            .attr('opacity', this.options.gridEnabled ? 1 : 0);
    }

    resetView() {
        // Reset to default 10x10 viewport (display default)
        this.options.xRange = [-10, 10];
        this.options.yRange = [-10, 10];
        
        this.xScale.domain(this.options.xRange);
        this.yScale.domain(this.options.yRange);
        
        // Update axes
        this.xAxis.transition().duration(500).call(
            d3.axisBottom(this.xScale).ticks(11).tickFormat(d3.format('d'))
        );
        this.yAxis.transition().duration(500).call(
            d3.axisLeft(this.yScale).ticks(11).tickFormat(d3.format('d'))
        );
        
        // Update grid
        this.gridGroup.select('.x-grid')
            .transition()
            .duration(500)
            .call(d3.axisBottom(this.xScale).tickSize(-this.innerHeight).tickFormat(''));
            
        this.gridGroup.select('.y-grid')
            .transition()
            .duration(500)
            .call(d3.axisLeft(this.yScale).tickSize(-this.innerWidth).tickFormat(''));
        
        // Update main axes
        this.mainGroup.select('.x-axis-main')
            .transition()
            .duration(500)
            .attr('y1', this.innerHeight / 2)
            .attr('y2', this.innerHeight / 2);
            
        this.mainGroup.select('.y-axis-main')
            .transition()
            .duration(500)
            .attr('x1', this.innerWidth / 2)
            .attr('x2', this.innerWidth / 2);
    }

    resize(width, height) {
        this.options.width = width;
        this.options.height = height;
        
        this.innerWidth = width - this.options.margin.left - this.options.margin.right;
        this.innerHeight = height - this.options.margin.top - this.options.margin.bottom;
        
        this.setupChart();
        
        // Re-plot all functions
        this.functions.forEach((func, index) => {
            // Note: This would require re-fetching coordinates or caching them
            // For now, just recreate the chart structure
        });
    }

    downloadGraph(format = 'png', filename = null) {
        const svgElement = document.getElementById(this.svgId);
        
        if (!filename) {
            const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-');
            const expression = this.functions.length > 0 ? this.functions[0].expression.replace(/[^a-zA-Z0-9]/g, '_') : 'graph';
            filename = `grapher_${expression}_${timestamp}`;
        }

        if (format === 'svg') {
            this.downloadSVG(svgElement, filename);
        } else {
            this.downloadAsImage(svgElement, filename, format);
        }
    }

    downloadSVG(svgElement, filename) {
        // Clone the SVG to avoid modifying the original
        const svgClone = svgElement.cloneNode(true);
        
        // Get the SVG content as string
        const svgData = new XMLSerializer().serializeToString(svgClone);
        
        // Create a blob and download link
        const blob = new Blob([svgData], { type: 'image/svg+xml' });
        const url = URL.createObjectURL(blob);
        
        const downloadLink = document.createElement('a');
        downloadLink.href = url;
        downloadLink.download = `${filename}.svg`;
        document.body.appendChild(downloadLink);
        downloadLink.click();
        document.body.removeChild(downloadLink);
        
        // Clean up
        URL.revokeObjectURL(url);
    }

    downloadAsImage(svgElement, filename, format = 'png') {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        // Set canvas size to match SVG
        canvas.width = this.options.width;
        canvas.height = this.options.height;
        
        // Get SVG data
        const svgData = new XMLSerializer().serializeToString(svgElement);
        const img = new Image();
        
        img.onload = () => {
            // Fill white background
            ctx.fillStyle = 'white';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            
            // Draw the image
            ctx.drawImage(img, 0, 0);
            
            // Convert to blob and download
            canvas.toBlob((blob) => {
                const url = URL.createObjectURL(blob);
                const downloadLink = document.createElement('a');
                downloadLink.href = url;
                downloadLink.download = `${filename}.${format}`;
                document.body.appendChild(downloadLink);
                downloadLink.click();
                document.body.removeChild(downloadLink);
                URL.revokeObjectURL(url);
            }, `image/${format}`);
        };
        
        // Set the image source with proper encoding
        const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
        const svgUrl = URL.createObjectURL(svgBlob);
        img.src = svgUrl;
    }
}