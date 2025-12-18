#!/usr/bin/env python3
"""
Test to verify segments extend to graph boundaries properly
"""

import sys
import os

# Add backend src directory to the path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'backend', 'src'))

try:
    from backend.core.math_engine import ExpressionEvaluator
    import numpy as np
    
    def test_boundary_extension():
        """Test that segments extend properly to graph boundaries"""
        evaluator = ExpressionEvaluator()
        
        print("Testing boundary extension for tan(x)")
        print("=" * 50)
        
        # Test with typical graph range [-10, 10]
        data = evaluator.generate_graph_data('tan(x)', x_range=(-10, 10), num_points=500)
        segments = data.get('segments', [])
        
        print(f"Found {len(segments)} segments")
        
        # Check each segment's y-range
        for i, segment in enumerate(segments):
            y_vals = segment['y']
            x_vals = segment['x']
            y_min, y_max = np.min(y_vals), np.max(y_vals)
            x_min, x_max = np.min(x_vals), np.max(x_vals)
            
            print(f"\nSegment {i}:")
            print(f"  X range: [{x_min:.3f}, {x_max:.3f}]")
            print(f"  Y range: [{y_min:.3f}, {y_max:.3f}]")
            print(f"  Points: {len(y_vals)}")
            
            # Check if segment reaches near boundaries
            if abs(y_max - 30) < 5 or abs(y_min + 30) < 5:
                print(f"  Good: Extends toward Y-boundary (±30)")
            else:
                print(f"  WARNING: Stays away from Y-boundary")
        
        # Test specifically near asymptote at π/2 ≈ 1.571
        print(f"\nChecking behavior near π/2 asymptote (x ≈ 1.571):")
        for i, segment in enumerate(segments):
            x_vals = segment['x']
            # Check if segment approaches asymptote
            if any(abs(x - 1.571) < 0.2 for x in x_vals):
                y_vals = segment['y']
                y_max = np.max(y_vals)
                print(f"  Segment {i} approaches asymptote with max Y: {y_max:.1f}")
                if y_max > 25:  # Should extend close to boundary
                    print(f"    Good: extension toward boundary")
                else:
                    print(f"    WARNING: May be cutting short")

    if __name__ == "__main__":
        test_boundary_extension()
        
except ImportError as e:
    print(f"Import error: {e}")
    sys.exit(1)
except Exception as e:
    print(f"Test error: {e}")
    sys.exit(1)