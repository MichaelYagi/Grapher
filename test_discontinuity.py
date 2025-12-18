#!/usr/bin/env python3
"""
Test script for discontinuity detection improvements
"""

import numpy as np
import sys
import os

# Add the backend src directory to the path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'backend', 'src'))

try:
    from backend.core.math_engine import ExpressionEvaluator
    
    def test_tangent_discontinuities():
        """Test discontinuity detection for tan(x) and x*tan(x)"""
        evaluator = ExpressionEvaluator()
        
        print("Testing discontinuity detection improvements...")
        print("=" * 50)
        
        # Test tan(x)
        print("\n1. Testing tan(x):")
        try:
            data = evaluator.generate_graph_data('tan(x)', x_range=(-10, 10), num_points=500)
            print(f"   - Generated {data['total_points']} total points")
            print(f"   - Found {len(data['segments'])} segments")
            print(f"   - Valid points: {data['valid_points']}")
            
            # Check segment lengths
            for i, segment in enumerate(data['segments']):
                print(f"   - Segment {i}: {len(segment['x'])} points")
                
        except Exception as e:
            print(f"   Error: {e}")
        
        # Test x*tan(x)
        print("\n2. Testing x*tan(x):")
        try:
            data = evaluator.generate_graph_data('x*tan(x)', x_range=(-10, 10), num_points=500)
            print(f"   - Generated {data['total_points']} total points")
            print(f"   - Found {len(data['segments'])} segments")
            print(f"   - Valid points: {data['valid_points']}")
            
            # Check segment lengths
            for i, segment in enumerate(data['segments']):
                print(f"   - Segment {i}: {len(segment['x'])} points")
                
        except Exception as e:
            print(f"   Error: {e}")
        
        # Test 1/tan(x) (cotangent)
        print("\n3. Testing 1/tan(x) (cotangent):")
        try:
            data = evaluator.generate_graph_data('1/tan(x)', x_range=(-10, 10), num_points=500)
            print(f"   - Generated {data['total_points']} total points")
            print(f"   - Found {len(data['segments'])} segments")
            print(f"   - Valid points: {data['valid_points']}")
            
            # Check segment lengths
            for i, segment in enumerate(data['segments']):
                print(f"   - Segment {i}: {len(segment['x'])} points")
                
        except Exception as e:
            print(f"   Error: {e}")
        
        print("\n" + "=" * 50)
        print("Discontinuity detection test completed!")

    if __name__ == "__main__":
        test_tangent_discontinuities()
        
except ImportError as e:
    print(f"Import error: {e}")
    print("Make sure the backend is properly set up and dependencies are installed.")
except Exception as e:
    print(f"Test error: {e}")