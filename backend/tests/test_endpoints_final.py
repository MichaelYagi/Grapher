"""
Simple test to cover missing endpoints.py lines for 90%+ coverage
"""

import pytest
import sys
import os

# Add src directory to Python path
sys.path.append(os.path.join(os.path.dirname(__file__), '..', 'src'))

try:
    from main import app
    from fastapi.testclient import TestClient
except ImportError:
    sys.path.append(os.path.join(os.path.dirname(__file__), '..'))
    from main import app
    from fastapi.testclient import TestClient

client = TestClient(app)


def test_parse_endpoint_invalid_input():
    """Test parse endpoint with various invalid inputs (line 54)"""
    # Test with None expression
    response = client.post("/api/parse", json={
        "expression": None
    })
    
    # Should return 422 for None expression (validation error)
    assert response.status_code == 422


def test_evaluate_endpoint_with_none_values():
    """Test evaluate endpoint with None values that trigger error paths"""
    # Test expression that might cause evaluation issues
    response = client.post("/api/evaluate", json={
        "expression": "x", 
        "variables": None,  # None variables
        "x_range": None,  # None x_range 
        "num_points": None  # None num_points
    })
    
    # Should handle gracefully with appropriate error response
    assert response.status_code in [400, 422, 500]


def test_batch_evaluate_with_mixed_content():
    """Test batch evaluate with mixed valid/invalid content (line 181)"""
    response = client.post("/api/batch-evaluate", json={
        "expressions": ["x", "x+1", "invalid_syntax ++"],  # Mix of valid and invalid
        "variables": {},
        "x_range": [-5, 5],
        "num_points": 10
    })
    
    # Should return 400 because invalid expressions cause validation errors
    assert response.status_code == 400
    data = response.json()
    assert "detail" in data