import React, { useRef, useEffect, useCallback, useState } from 'react';
import { Expression, Viewport, GraphPoint, GraphInteractionEvent } from '../../types';
import './GraphRenderer.css';

interface GraphRendererProps {
  expressions: Expression[];
  height?: number;
  className?: string;
  onInteraction?: (event: GraphInteractionEvent) => void;
}

export const GraphRenderer: React.FC<GraphRendererProps> = ({
  expressions,
  height = 500,
  className = '',
  onInteraction
}) => {
const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(500);
  const [viewport, setViewport] = useState<Viewport>({
    xMin: -10,
    xMax: 10,
    yMin: -10,
    yMax: 10,
    scale: 25 // pixels per unit (500px / 20 units = 25px per unit)
  });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [hoveredPoint, setHoveredPoint] = useState<(GraphPoint & { expressionId?: string }) | null>(null);
  const animationFrameRef = useRef<number>();
  const cacheRef = useRef(new Map<string, GraphPoint[]>());

  // Coordinate transformation utilities
const mathToScreen = useCallback((x: number, y: number): { x: number; y: number } => {
    const screenX = ((x - viewport.xMin) / (viewport.xMax - viewport.xMin)) * width;
    const screenY = width - ((y - viewport.yMin) / (viewport.yMax - viewport.yMin)) * width;
    return { x: screenX, y: screenY };
  }, [viewport, width]);

const screenToMath = useCallback((screenX: number, screenY: number): { x: number; y: number } => {
    const x = (screenX / width) * (viewport.xMax - viewport.xMin) + viewport.xMin;
    const y = ((width - screenY) / width) * (viewport.yMax - viewport.yMin) + viewport.yMin;
    return { x, y };
  }, [viewport, width]);

  // Generate cache key for function points
const getCacheKey = useCallback((expression: Expression, viewport: Viewport): string => {
    return `${expression.id}_${expression.formula}_${viewport.xMin}_${viewport.xMax}_${width}_${width}_${Object.values(expression.variables || {}).map(v => v.value).join('_')}`;
  }, [width]);

  // Sample function points with higher quality
  const sampleFunction = useCallback((expression: Expression, viewport: Viewport): GraphPoint[] => {
    if (!expression.compiledFunction) return [];

    const cacheKey = getCacheKey(expression, viewport);
    const cached = cacheRef.current.get(cacheKey);
    if (cached) return cached;

    const points: GraphPoint[] = [];
    
    // Higher density sampling for smooth curves
    const numPoints = width * 3; // 3 samples per pixel for smoothness
    const step = (viewport.xMax - viewport.xMin) / numPoints;
    
    // Pre-calculate parameter values
    const params: Record<string, number> = {};
    expression.variables?.forEach(v => {
      if (v.isParameter) {
        params[v.name] = v.value;
      }
    });

    // Sample points
    for (let i = 0; i <= numPoints; i++) {
      const x = viewport.xMin + i * step;
      try {
        const y = expression.compiledFunction.evaluate(x, params);
        if (isFinite(y)) {
          const screen = mathToScreen(x, y);
          points.push({
            x,
            y,
            screenX: screen.x,
            screenY: screen.y
          });
        }
      } catch (error) {
        // Skip invalid points
      }
    }

    // Cache the result
    cacheRef.current.set(cacheKey, points);
    
    // Limit cache size
    if (cacheRef.current.size > 100) {
      const firstKey = cacheRef.current.keys().next().value;
      if (firstKey) {
        cacheRef.current.delete(firstKey);
      }
    }

    return points;
  }, [getCacheKey, mathToScreen, width]);

  // Draw grid and axes
  const drawGrid = useCallback((ctx: CanvasRenderingContext2D) => {
    const { xMin, xMax, yMin, yMax } = viewport;
    const xRange = xMax - xMin;
    
// Clear canvas with theme-appropriate background
    ctx.fillStyle = getComputedStyle(document.documentElement).getPropertyValue('--graph-bg');
    ctx.fillRect(0, 0, width, width);

    // Draw grid lines
    ctx.strokeStyle = getComputedStyle(document.documentElement).getPropertyValue('--graph-grid');
    ctx.lineWidth = 1;
    ctx.setLineDash([2, 4]);

// Vertical grid lines - at every integer
    for (let x = Math.ceil(xMin); x <= xMax; x += 1) {
      const screen = mathToScreen(x, 0);
      ctx.beginPath();
      ctx.moveTo(screen.x, 0);
      ctx.lineTo(screen.x, width);
      ctx.stroke();
    }

    // Horizontal grid lines - at every integer
    for (let y = Math.ceil(yMin); y <= yMax; y += 1) {
      const screen = mathToScreen(0, y);
      ctx.beginPath();
      ctx.moveTo(0, screen.y);
      ctx.lineTo(width, screen.y);
      ctx.stroke();
    }

    ctx.setLineDash([]);

    // Draw axes
    ctx.strokeStyle = getComputedStyle(document.documentElement).getPropertyValue('--graph-axes');
    ctx.lineWidth = 2;

// X-axis
    const xAxisY = mathToScreen(0, 0).y;
    if (xAxisY >= 0 && xAxisY <= width) {
      ctx.beginPath();
      ctx.moveTo(0, xAxisY);
      ctx.lineTo(width, xAxisY);
      ctx.stroke();
    }

    // Y-axis
    const yAxisX = mathToScreen(0, 0).x;
    if (yAxisX >= 0 && yAxisX <= width) {
      ctx.beginPath();
      ctx.moveTo(yAxisX, 0);
      ctx.lineTo(yAxisX, width);
      ctx.stroke();
    }

    // Draw axis labels
    ctx.fillStyle = getComputedStyle(document.documentElement).getPropertyValue('--graph-text');
    ctx.font = '12px Inter, sans-serif';
    
    // X-axis labels - show every 2 units for cleaner look
    for (let x = Math.ceil(xMin); x <= xMax; x += 2) {
      if (x !== 0) { // Skip the origin
        const screen = mathToScreen(x, 0);
        ctx.fillText(x.toString(), screen.x - 8, xAxisY + 20);
      }
    }

    // Y-axis labels - show every 2 units for cleaner look
    for (let y = Math.ceil(yMin); y <= yMax; y += 2) {
      if (y !== 0) { // Skip the origin
        const screen = mathToScreen(0, y);
        ctx.fillText(y.toString(), yAxisX + 10, screen.y + 5);
      }
    }
  }, [viewport, width, mathToScreen]);

  // Draw functions with improved curve rendering
  const drawFunctions = useCallback((ctx: CanvasRenderingContext2D) => {
    expressions
      .filter(expr => expr.visible && expr.compiledFunction)
      .forEach(expression => {
        const points = sampleFunction(expression, viewport);
        
        if (points.length < 2) return;

        ctx.strokeStyle = expression.color;
        ctx.lineWidth = 2.5;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';

        // Group points into continuous segments
        const segments: GraphPoint[][] = [];
        let currentSegment: GraphPoint[] = [];

        for (let i = 0; i < points.length; i++) {
          const point = points[i];
          
          if (currentSegment.length === 0) {
            currentSegment.push(point);
          } else {
            const prevPoint = currentSegment[currentSegment.length - 1];
            
            // Check for discontinuities (large jumps)
            const distance = Math.sqrt(
              Math.pow(point.screenX! - prevPoint.screenX!, 2) + 
              Math.pow(point.screenY! - prevPoint.screenY!, 2)
            );
            
            // If the jump is too large, start a new segment
            if (distance > 100 || !isFinite(point.y)) {
              if (currentSegment.length > 1) {
                segments.push(currentSegment);
              }
              currentSegment = [];
            } else {
              currentSegment.push(point);
            }
          }
        }
        
        if (currentSegment.length > 1) {
          segments.push(currentSegment);
        }

        // Draw each continuous segment
        segments.forEach(segment => {
          if (segment.length < 2) return;
          
          ctx.beginPath();
          ctx.moveTo(segment[0].screenX!, segment[0].screenY!);
          
          // Use straight lines between points for accurate rendering
          for (let i = 1; i < segment.length; i++) {
            ctx.lineTo(segment[i].screenX!, segment[i].screenY!);
          }
          
          ctx.stroke();
        });
      });
  }, [expressions, sampleFunction, viewport]);

  // Main render function
  const render = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Enable anti-aliasing for smooth curves
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    
    // Set line rendering quality
    ctx.antialias = 'subpixel';

    drawGrid(ctx);
    drawFunctions(ctx);

    // Draw hover indicator
    if (hoveredPoint) {
      const exprColor = hoveredPoint.expressionId ? 
        expressions.find(e => e.id === hoveredPoint.expressionId)?.color || '#3B82F6' : 
        '#3B82F6';
      ctx.fillStyle = exprColor;
      ctx.beginPath();
      ctx.arc(hoveredPoint.screenX!, hoveredPoint.screenY!, 5, 0, 2 * Math.PI);
      ctx.fill();
      
      // Draw coordinates
      ctx.fillStyle = getComputedStyle(document.documentElement).getPropertyValue('--text-primary');
      ctx.fillRect(hoveredPoint.screenX! + 10, hoveredPoint.screenY! - 25, 120, 20);
      ctx.fillStyle = '#000000';
      ctx.font = '12px Inter, sans-serif';
      ctx.fillText(`(${hoveredPoint.x.toFixed(2)}, ${hoveredPoint.y.toFixed(2)})`, hoveredPoint.screenX! + 15, hoveredPoint.screenY! - 10);
    }
  }, [drawGrid, drawFunctions, hoveredPoint, expressions]);

  // Animation loop for smooth rendering
  const animate = useCallback(() => {
    render();
    animationFrameRef.current = requestAnimationFrame(animate);
  }, [render]);

// Monitor container width changes
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const resizeObserver = new ResizeObserver(entries => {
      const entry = entries[0];
      if (entry) {
        setWidth(entry.contentRect.width);
      }
    });

    resizeObserver.observe(container);

    return () => {
      resizeObserver.disconnect();
    };
  }, []);

  // Initialize canvas and start animation
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Set canvas size
    canvas.width = width;
    canvas.height = width;

    // Start animation loop
    animate();

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [width, animate]);

  // Re-render when expressions or viewport change
  useEffect(() => {
    render();
  }, [expressions, viewport, render]);

  // Mouse event handlers
  const handleMouseDown = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    setIsDragging(true);
    setDragStart({ x: e.clientX, y: e.clientY });
  }, []);

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;

    const screenX = e.clientX - rect.left;
    const screenY = e.clientY - rect.top;
    const mathCoords = screenToMath(screenX, screenY);

    if (isDragging && dragStart) {
      // Pan the viewport
      const deltaX = (e.clientX - dragStart.x) / viewport.scale;
      const deltaY = (e.clientY - dragStart.y) / viewport.scale;
      
      setViewport(prev => ({
        ...prev,
        xMin: prev.xMin - deltaX,
        xMax: prev.xMax - deltaX,
        yMin: prev.yMin + deltaY,
        yMax: prev.yMax + deltaY
      }));
      
      setDragStart({ x: e.clientX, y: e.clientY });
    } else {
      // Find nearest function point for hover
      let nearestPoint: GraphPoint | null = null;
      let minDistance = Infinity;
      let nearestExpressionId: string | undefined;

      expressions
        .filter(expr => expr.visible && expr.compiledFunction)
        .forEach(expression => {
          const points = sampleFunction(expression, viewport);
          
          for (const point of points) {
            const distance = Math.sqrt(
              Math.pow(screenX - point.screenX!, 2) + 
              Math.pow(screenY - point.screenY!, 2)
            );
            
if (distance < minDistance && distance < 10) { // 10px threshold
              minDistance = distance;
              nearestPoint = point;
              nearestExpressionId = expression.id;
            }
          }
        });

      setHoveredPoint(nearestPoint);

      // Trigger interaction event
      if (onInteraction && nearestPoint && nearestExpressionId) {
        onInteraction({
          type: 'hover',
          x: mathCoords.x,
          y: mathCoords.y,
          screenX,
          screenY,
          expressionId: nearestExpressionId,
          point: nearestPoint
        });
      }
    }
  }, [isDragging, dragStart, viewport, screenToMath, expressions, sampleFunction, onInteraction]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  const handleWheel = useCallback((e: React.WheelEvent<HTMLCanvasElement>) => {
    // Disable zooming - prevent default and do nothing
    e.preventDefault();
  }, []);

return (
    <div ref={containerRef} className={`graph-renderer ${className}`}>
      <canvas
        ref={canvasRef}
        width={width}
        height={width}
        style={{ width: '100%', height: '100%', aspectRatio: '1' }}
        className="graph-canvas"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onWheel={(e) => e.preventDefault()}
      />
      
      {/* Controls */}
      <div className="graph-controls">
        <button
          onClick={() => setViewport({ xMin: -10, xMax: 10, yMin: -10, yMax: 10, scale: 25 })}
          className="reset-button"
        >
          Reset View
        </button>
      </div>

      {/* Coordinate display */}
      {hoveredPoint && (
        <div className="coordinate-display">
          <code className="coordinate-text">
            ({hoveredPoint.x.toFixed(3)}, {hoveredPoint.y.toFixed(3)})
          </code>
        </div>
      )}
    </div>
  );
};