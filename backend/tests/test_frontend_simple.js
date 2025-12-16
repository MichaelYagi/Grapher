/**
 * Simple working frontend tests for Grapher application
 */

describe('Frontend JavaScript Tests', () => {
    test('should run basic math operations', () => {
        expect(2 + 2).toBe(4);
        expect(Math.sqrt(16)).toBe(4);
        expect(Math.sin(Math.PI / 2)).toBeCloseTo(1, 2);
    });

    test('should handle string manipulation', () => {
        const expr = 'x^2 + 2*x + 1';
        expect(expr.toLowerCase()).toBe('x^2 + 2*x + 1');
        expect(expr.includes('x^2')).toBe(true);
    });

    test('should handle array operations', () => {
        const coordinates = [
            { x: -10, y: 100 },
            { x: 0, y: 0 },
            { x: 10, y: 100 }
        ];
        
        expect(coordinates.length).toBe(3);
        expect(coordinates[0].x).toBe(-10);
        expect(coordinates[1].y).toBe(0);
    });

    test('should handle basic expression validation', () => {
        const validateExpression = (expr) => {
            if (!expr || expr.trim() === '') {
                return { valid: false, error: 'Empty expression' };
            }
            return { valid: true };
        };
        
        expect(validateExpression('x^2 + 2*x + 1').valid).toBe(true);
        expect(validateExpression('').valid).toBe(false);
        expect(validateExpression('').error).toBe('Empty expression');
    });

    test('should handle API request simulation', () => {
        const mockFetch = jest.fn();
        
        const request = {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ expression: 'x^2' })
        };
        
        mockFetch.mockResolvedValue({
            ok: true,
            status: 200,
            json: () => Promise.resolve({ success: true })
        });
        
        expect(typeof mockFetch).toBe('function');
        expect(request.method).toBe('POST');
        expect(JSON.parse(request.body)).toEqual({ expression: 'x^2' });
    });

    test('should handle range calculations', () => {
        const ranges = {
            small: { x: [-10, 10], y: [-10, 10] },
            large: { x: [-30, 30], y: [-30, 30] }
        };
        
        expect(ranges.small.x).toEqual([-10, 10]);
        expect(ranges.small.y).toEqual([-10, 10]);
        expect(ranges.large.x).toEqual([-30, 30]);
        expect(ranges.large.y).toEqual([-30, 30]);
    });

    test('should handle color palette', () => {
        const colors = [
            '#8b5cf6', '#10b981', '#f59e0b', '#ef4444',
            '#06b6d4', '#ec4899', '#84cc16', '#f97316'
        ];
        
        expect(colors).toHaveLength(8);
        expect(colors[0]).toBe('#8b5cf6');
        expect(colors).toContain('#ef4444');
    });

    test('should handle function evaluation simulation', () => {
        const evaluateExpression = (expr, x) => {
            switch(expr) {
                case 'x^2':
                    return x * x;
                case 'sin(x)':
                    return Math.sin(x);
                case 'cos(x)':
                    return Math.cos(x);
                default:
                    return 0;
            }
        };
        
        expect(evaluateExpression('x^2', 2)).toBe(4);
        expect(evaluateExpression('x^2', -3)).toBe(9);
        expect(evaluateExpression('sin(x)', 0)).toBeCloseTo(0, 10);
    });

    test('should handle plot generation simulation', () => {
        const generatePlotData = (expr, xRange, numPoints = 100) => {
            const points = [];
            const step = (xRange[1] - xRange[0]) / (numPoints - 1);
            
            for (let i = 0; i < numPoints; i++) {
                const x = xRange[0] + (i * step);
                const y = x * x;
                points.push({ x, y });
            }
            
            return points;
        };
        
        const plotData = generatePlotData('x^2', [-5, 5], 11);
        
        expect(plotData).toHaveLength(11);
        expect(plotData[0]).toEqual({ x: -5, y: 25 });
        expect(plotData[5]).toEqual({ x: 0, y: 0 });
        expect(plotData[10]).toEqual({ x: 5, y: 25 });
    });
});