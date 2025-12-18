#!/usr/bin/env python3
"""
Simple test to find where NoneType error occurs
"""

import sys
import os
sys.path.append(os.path.join(os.path.dirname(__file__), 'backend', 'src'))

import requests

def simple_test():
    try:
        response = requests.post('http://localhost:3000/api/evaluate', json={
            'expression': 'tan(x)',
            'x_range': [-10, 10],
            'num_points': 20  # Small number to debug
        }, timeout=10)
        
        print(f"Status: {response.status_code}")
        print(f"Response: {response.text}")
        
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    simple_test()