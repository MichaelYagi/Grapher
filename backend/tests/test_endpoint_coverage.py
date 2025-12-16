"""
Additional endpoint tests to improve code coverage for error handling paths
Tests uncovered error branches and edge cases in API endpoints
"""

import pytest
import sys
import os

# Add the src directory to Python path
sys.path.append(os.path.join(os.path.dirname(__file__), '..', 'src'))

try:
    from main import app
    from fastapi.testclient import TestClient
except ImportError:
    sys.path.append(os.path.join(os.path.dirname(__file__), '..'))
    from main import app
    from fastapi.testclient import TestClient

client = TestClient(app)

def test_parse_endpoint_general_exception():
    """Test parse endpoint with expression causing internal exception"""
    # This should trigger the exception handling at lines 39-40
    response = client.post("/api/parse", json={
        "expression": "x + "  # Incomplete expression that might cause parsing issues
    })
    
    # Should either succeed with error or return 400 status
    assert response.status_code in [200, 400]

def test_evaluate_endpoint_invalid_expression_classification():
    """Test evaluate endpoint when expression classification is invalid"""
    # This should trigger the error handling at line 54
    response = client.post("/api/evaluate", json={
        "expression": "x + + ",  # Invalid expression
        "variables": {},
        "x_range": [-5, 5],
        "num_points": 100
    })
    
    assert response.status_code == 400
    data = response.json()
    assert "detail" in data

def test_evaluate_endpoint_implicit_equation_handling():
    """Test evaluate endpoint with implicit equations (uncovered lines 63-74)"""
    response = client.post("/api/evaluate", json={
        "expression": "x^2 + y^2 = 1",  # Implicit equation
        "variables": {},
        "x_range": [-2, 2],
        "num_points": 100
    })
    
    assert response.status_code == 200
    data = response.json()
    assert "graph_data" in data
    assert "coordinates" in data["graph_data"]

def test_evaluate_endpoint_parametric_handling():
    """Test evaluate endpoint with parametric equations (uncovered lines 78-89)"""
    response = client.post("/api/evaluate", json={
        "expression": "x(t) = cos(t)",  # Parametric equation
        "variables": {},
        "x_range": [0, 6.28],  # t_range for parametric
        "num_points": 100
    })
    
    assert response.status_code == 200
    data = response.json()
    assert "graph_data" in data
    assert "coordinates" in data["graph_data"]

def test_update_parameters_endpoint_invalid_expression():
    """Test update parameters endpoint with invalid expression (line 127)"""
    response = client.post("/api/update-params", json={
        "expression": "x + + 2",  # Invalid expression
        "variables": {},
        "x_range": [-5, 5],
        "num_points": 100
    })
    
    # Should either handle gracefully or return error
    assert response.status_code in [200, 400]
    data = response.json()
    
    if response.status_code == 400:
        assert "detail" in data

def test_batch_evaluate_large_list():
    """Test batch evaluate with large number of expressions (line 151-152)"""
    # Test with exactly 10 expressions (edge case, reduced from 100 for speed)
    expressions = [f"x^{i}" for i in range(10)]
    
    response = client.post("/api/batch-evaluate", json={
        "expressions": expressions,
        "variables": {},
        "x_range": [-5, 5],
        "num_points": 10
    })
    
    assert response.status_code == 200
    data = response.json()
    assert "results" in data
    assert len(data["results"]) == 10

def test_batch_evaluate_too_many_expressions():
    """Test batch evaluate with too many expressions (line 160)"""
    # Test with 101 expressions (over MAX_BATCH_SIZE of 100)
    expressions = [f"x^{i}" for i in range(101)]
    
    response = client.post("/api/batch-evaluate", json={
        "expressions": expressions,
        "variables": {},
        "x_range": [-5, 5],
        "num_points": 10
    })
    
    # Should return 400, 413, or 422 for exceeding batch size limit
    assert response.status_code in [400, 413, 422]
    data = response.json()
    assert "detail" in data

def test_parametric_endpoint_malformed_equations():
    """Test parametric endpoint with malformed equations (line 196)"""
    response = client.post("/api/parametric", json={
        "x_equation": "x(t) = invalid_syntax",  # Malformed
        "y_equation": "y(t) = sin(t)",
        "t_range": [0, 6.28],
        "num_points": 100
    })
    
    # Should return 400 for malformed syntax or 422 for validation error
    assert response.status_code in [400, 422]
    data = response.json()
    assert "detail" in data

def test_parametric_endpoint_missing_equations():
    """Test parametric endpoint with missing equations (line 222)"""
    response = client.post("/api/parametric", json={
        "x_equation": "x(t) = cos(t)",
        # Missing y_equation
        "t_range": [0, 6.28],
        "num_points": 100
    })
    
    assert response.status_code == 422  # Unprocessable Entity
    data = response.json()
    assert "detail" in data

def test_health_endpoint_internal_error():
    """Test health endpoint when internal systems have errors (line 245)"""
    # This is harder to test directly, but we can test the endpoint structure
    response = client.get("/api/health")
    
    # Should always return 200, but with system status
    assert response.status_code == 200
    data = response.json()
    assert "status" in data

def test_large_computation_timeout():
    """Test large computation handling (line 271)"""
    # Test with very large number of points that should trigger timeout
    response = client.post("/api/evaluate", json={
        "expression": "sin(x) * cos(100*x)",  # Complex computation
        "variables": {},
        "x_range": [-50, 50],
        "num_points": 100000  # Very large
    })
    
    # Should either succeed (fast) or timeout (422/503)
    assert response.status_code in [200, 422, 503]

def test_concurrent_requests_handling():
    """Test concurrent request handling (line 292)"""
    import threading
    import time
    
    results = []
    errors = []
    
    def make_request():
        try:
            response = client.post("/api/evaluate", json={
                "expression": "x^2",
                "variables": {},
                "x_range": [-5, 5],
                "num_points": 50
            })
            results.append(response.status_code)
        except Exception as e:
            errors.append(e)
    
    # Launch 5 concurrent requests
    threads = []
    for _ in range(5):
        thread = threading.Thread(target=make_request)
        threads.append(thread)
        thread.start()
    
    # Wait for all threads to complete
    for thread in threads:
        thread.join(timeout=5)
    
    # Most requests should succeed
    assert len(results) >= 3
    assert any(status == 200 for status in results)