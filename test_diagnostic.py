#!/usr/bin/env python3
"""
Diagnostic test to understand why segments don't extend to boundaries
"""

import sys
import os

# Add backend src directory to the path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'backend', 'src'))

try:
    from backend.core.math_engine import ExpressionEvaluator
    import numpy as np
    
    def diagnostic_test():
        """Diagnose why segments don't extend to boundaries"""
        evaluator = ExpressionEvaluator()
        
        print("DIAGNOSTIC TEST: Why segments don't extend to ±30")
        print("=" * 60)
        
        # Test tan(x) with very fine resolution near boundaries
        x_range = (-10, 10)
        num_points = 1000  # Higher resolution
        
        # Get raw data without discontinuity detection
        print("1. Raw evaluation (no segment detection):")
        data = evaluator.generate_graph_data('tan(x)', x_range=x_range, num_points=num_points)
        
        # Find points near y-boundaries
        coordinates = data['coordinates']
        points_near_30 = []
        points_near_minus_30 = []
        
        for coord in coordinates:
            y = coord['y']
            if not np.isnan(y):
                if abs(y - 30) < 2:  # Within 2 units of +30
                    points_near_30.append(coord)
                if abs(y + 30) < 2:  # Within 2 units of -30  
                    points_near_minus_30.append(coord)
        
        print(f"   Points near y=30: {len(points_near_30)}")
        print(f"   Points near y=-30: {len(points_near_minus_30)}")
        
        if points_near_30:
            y_vals = [p['y'] for p in points_near_30]
            x_vals = [p['x'] for p in points_near_30]
            print(f"   Max Y near +30: {max(y_vals):.2f} at X: {x_vals[y_vals.index(max(y_vals))]:.3f}")
            
        if points_near_minus_30:
            y_vals = [p['y'] for p in points_near_minus_30]
            x_vals = [p['x'] for p in points_near_minus_30]
            print(f"   Min Y near -30: {min(y_vals):.2f} at X: {x_vals[y_vals.index(min(y_vals))]:.3f}")
        
        print(f"\n2. Segment-based evaluation:")
        # Test with current segment detection
        segments = data.get('segments', [])
        
        for i, segment in enumerate(segments):
            y_vals = segment['y']
            y_max, y_min = np.max(y_vals), np.min(y_vals)
            
            # Check if this segment should extend further
            if y_max > 20:  # Getting close to boundary
                print(f"   Segment {i} extends to Y: {y_max:.2f} (distance to +30: {30-y_max:.2f})")
                if y_max < 28:
                    print(f"      WARNING: Segment stops {30-y_max:.2f} units short of boundary")
            
            if y_min < -20:  # Getting close to negative boundary
                print(f"   Segment {i} extends to Y: {y_min:.2f} (distance to -30: {y_min+30:.2f})")
                if y_min > -28:
                    print(f"      WARNING: Segment stops {y_min+30:.2f} units short of boundary")
        
        print(f"\n3. Boundary crossing analysis:")
        # Look specifically at the last points before each segment break
        for i, segment in enumerate(segments):
            if len(segment['y']) > 0:
                last_y = segment['y'][-1]
                last_x = segment['x'][-1]
                print(f"   Segment {i} ends at: X={last_x:.3f}, Y={last_y:.2f}")
                
                # Check if this point should continue toward boundary
                if abs(last_y) < 25:  # Not near boundary yet
                    # Calculate expected next point if continued
                    # For tan(x), near asymptotes, the function grows rapidly
                    if 25 < abs(last_y) < 50:  # Growing toward boundary
                        print(f"      Should continue toward boundary (growing)")

    if __name__ == "__main__":
        diagnostic_test()
        
except ImportError as e:
    print(f"Import error: {e}")
    sys.exit(1)
except Exception as e:
    print(f"Test error: {e}")
    sys.exit(1)