#!/usr/bin/env python3
"""
Test the fixed tan(x) implementation
"""

import sys
import os
sys.path.append(os.path.join(os.path.dirname(__file__), 'backend', 'src'))

import requests
import json

def test_tan_fix():
    """Test tan(x) fix via API with detailed debugging"""
    
    try:
        # Test tan(x) via API
        response = requests.post('http://localhost:3000/api/evaluate', json={
            'expression': 'tan(x)',
            'x_range': [-10, 10],
            'num_points': 100
        }, timeout=10)
        
        if response.status_code == 200:
            data = response.json()
            coordinates = data['graph_data']['coordinates']
            
            print("=== TAN(X) FIX TEST ===")
            print(f"Expression: {data['expression']}")
            print(f"Total points requested: {data['graph_data']['total_points']}")
            print(f"Valid points returned: {data['graph_data']['valid_points']}")
            print(f"Coordinate array length: {len(coordinates)}")
            
            # Check for null markers
            null_count = 0
            valid_count = 0
            for i, coord in enumerate(coordinates):
                if coord is None:
                    null_count += 1
                    print(f"  Null marker at position {i}")
                elif isinstance(coord, dict) and 'x' in coord and 'y' in coord:
                    valid_count += 1
                else:
                    print(f"  Unexpected coordinate at position {i}: {coord}")
            
            print(f"\nNull markers (line breaks): {null_count}")
            print(f"Actual data points: {valid_count}")
            
            # Check first few coordinates
            print("\nFirst 15 coordinates:")
            for i, coord in enumerate(coordinates[:15]):
                if coord is None:
                    print(f"  {i}: None (LINE BREAK)")
                else:
                    print(f"  {i}: x={coord['x']:.3f}, y={coord['y']:.3f}")
            
            return null_count > 0
        else:
            print(f"ERROR: API returned status {response.status_code}")
            print(response.text)
            return False
            
    except Exception as e:
        print(f"ERROR: {e}")
        return False

if __name__ == "__main__":
    success = test_tan_fix()
    if success:
        print("\nSUCCESS: Tan fix is working with proper line breaks!")
        print("The frontend should now render tan(x) without unwanted vertical lines.")
    else:
        print("\nFAILED: Tan fix is not working correctly.")