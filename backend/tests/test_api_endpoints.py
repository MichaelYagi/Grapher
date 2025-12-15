"""
Comprehensive API endpoint tests for Grapher backend.
Tests all REST API endpoints with various scenarios and edge cases.
"""

import pytest
import asyncio
from fastapi.testclient import TestClient
from fastapi import status
import json
import time
from unittest.mock import patch, MagicMock

# Import the main application
import sys
import os
sys.path.append(os.path.join(os.path.dirname(__file__), '..', 'src'))
from main import app

client = TestClient(app)


class TestParseEndpoint:
    """Test the /api/parse endpoint"""
    
    def test_parse_valid_simple_expression(self):
        """Test parsing a simple valid expression"""
        response = client.post("/api/parse", json={"expression": "x^2 + 2*x + 1"})
        assert response.status_code == 200
        data = response.json()
        assert data["is_valid"] is True
        assert "x" in data["variables"]
        assert data["error"] is None
    
    def test_parse_expression_with_parameters(self):
        """Test parsing expression with parameters"""
        response = client.post("/api/parse", json={"expression": "a*x^2 + b*sin(x) + c"})
        assert response.status_code == 200
        data = response.json()
        assert data["is_valid"] is True
        assert set(data["parameters"]) == {"a", "b", "c"}
        assert data["primary_variable"] == "x"
    
    def test_parse_trigonometric_expression(self):
        """Test parsing trigonometric expression"""
        response = client.post("/api/parse", json={"expression": "sin(x) * cos(2*x)"})
        assert response.status_code == 200
        data = response.json()
        assert data["is_valid"] is True
        assert "x" in data["variables"]
    
    def test_parse_invalid_expression(self):
        """Test parsing invalid expression"""
        response = client.post("/api/parse", json={"expression": "x^2 + + 2*x"})
        assert response.status_code == 200
        data = response.json()
        assert data["is_valid"] is False
        assert data["error"] is not None
    
    def test_parse_empty_expression(self):
        """Test parsing empty expression"""
        response = client.post("/api/parse", json={"expression": ""})
        assert response.status_code == 422  # Validation error
    
    def test_parse_very_long_expression(self):
        """Test parsing very long expression"""
        long_expr = "x^2 + " + "2*x + " * 100  # Create long expression
        response = client.post("/api/parse", json={"expression": long_expr})
        # Should handle gracefully or return appropriate error
        assert response.status_code in [200, 422]
    
    def test_parse_expression_with_unicode(self):
        """Test parsing expression with unicode characters"""
        response = client.post("/api/parse", json={"expression": "x² + 2*x + 1"})
        # Should handle or reject appropriately
        assert response.status_code in [200, 422]
    
    def test_parse_missing_expression_field(self):
        """Test parse request without expression field"""
        response = client.post("/api/parse", json={})
        assert response.status_code == 422
    
    def test_parse_non_json_request(self):
        """Test parse request with non-JSON content"""
        response = client.post("/api/parse", data="not json", headers={"Content-Type": "text/plain"})
        assert response.status_code == 422


class TestEvaluateEndpoint:
    """Test the /api/evaluate endpoint"""
    
    def test_evaluate_simple_expression(self):
        """Test evaluating simple expression"""
        response = client.post("/api/evaluate", json={
            "expression": "x^2",
            "variables": {},
            "x_range": [-10, 10],
            "num_points": 100
        })
        assert response.status_code == 200
        data = response.json()
        assert "graph_data" in data
        assert data["graph_data"]["total_points"] == 100
        assert len(data["graph_data"]["coordinates"]) > 0
        assert data["graph_data"]["x_range"] == [-10, 10]
    
    def test_evaluate_with_parameters(self):
        """Test evaluating expression with parameters"""
        response = client.post("/api/evaluate", json={
            "expression": "a*x^2",
            "variables": {"a": 2.0},
            "x_range": [-5, 5],
            "num_points": 50
        })
        assert response.status_code == 200
        data = response.json()
        assert "graph_data" in data
        coords = data["graph_data"]["coordinates"]
        # Check if parameter a=2 is applied (should be 2*x^2)
        assert coords[0]["y"] == 2 * (coords[0]["x"] ** 2)
    
    def test_evaluate_trigonometric_expression(self):
        """Test evaluating trigonometric expression"""
        response = client.post("/api/evaluate", json={
            "expression": "sin(x)",
            "variables": {},
            "x_range": [0, 6.283185307179586],  # 0 to 2π
            "num_points": 100
        })
        assert response.status_code == 200
        data = response.json()
        assert "graph_data" in data
        # sin(0) should be 0
        coords = data["graph_data"]["coordinates"]
        assert abs(coords[0]["y"]) < 0.1  # Allow for floating point error
    
    def test_evaluate_with_custom_range(self):
        """Test evaluating with custom range [-30, 30]"""
        response = client.post("/api/evaluate", json={
            "expression": "x*sin(x)",
            "variables": {},
            "x_range": [-30, 30],
            "num_points": 1000
        })
        assert response.status_code == 200
        data = response.json()
        assert data["graph_data"]["x_range"] == [-30, 30]
        assert data["graph_data"]["total_points"] == 1000
    
    def test_evaluate_invalid_expression(self):
        """Test evaluating invalid expression"""
        response = client.post("/api/evaluate", json={
            "expression": "x^2 + + invalid",
            "variables": {},
            "x_range": [-10, 10],
            "num_points": 100
        })
        assert response.status_code == 400  # Bad request
        data = response.json()
        assert "error" in data
    
    def test_evaluate_invalid_range(self):
        """Test evaluating with invalid range"""
        response = client.post("/api/evaluate", json={
            "expression": "x^2",
            "variables": {},
            "x_range": [10, -10],  # Invalid range (min > max)
            "num_points": 100
        })
        assert response.status_code == 400
    
    def test_evaluate_too_many_points(self):
        """Test evaluating with too many points"""
        response = client.post("/api/evaluate", json={
            "expression": "x^2",
            "variables": {},
            "x_range": [-10, 10],
            "num_points": 20000  # Exceeds max of 10000
        })
        assert response.status_code == 422
    
    def test_evaluate_few_points(self):
        """Test evaluating with too few points"""
        response = client.post("/api/evaluate", json={
            "expression": "x^2",
            "variables": {},
            "x_range": [-10, 10],
            "num_points": 5  # Below min of 10
        })
        assert response.status_code == 422
    
    def test_evaluate_missing_fields(self):
        """Test evaluate request with missing required fields"""
        response = client.post("/api/evaluate", json={
            "expression": "x^2"
            # Missing variables, x_range, num_points
        })
        assert response.status_code == 422


class TestBatchEvaluateEndpoint:
    """Test the /api/batch-evaluate endpoint"""
    
    def test_batch_evaluate_multiple_expressions(self):
        """Test batch evaluating multiple expressions"""
        response = client.post("/api/batch-evaluate", json={
            "expressions": ["x^2", "sin(x)", "x*sin(x)"],
            "variables": {},
            "x_range": [-10, 10],
            "num_points": 100
        })
        assert response.status_code == 200
        data = response.json()
        assert "results" in data
        assert len(data["results"]) == 3
        assert all("graph_data" in result for result in data["results"])
    
    def test_batch_evaluate_with_parameters(self):
        """Test batch evaluating with parameters"""
        response = client.post("/api/batch-evaluate", json={
            "expressions": ["a*x", "b*x^2"],
            "variables": {"a": 2.0, "b": 3.0},
            "x_range": [-5, 5],
            "num_points": 50
        })
        assert response.status_code == 200
        data = response.json()
        assert len(data["results"]) == 2
    
    def test_batch_evaluate_too_many_expressions(self):
        """Test batch evaluating too many expressions"""
        expressions = ["x^2"] * 150  # Exceeds max of 100
        response = client.post("/api/batch-evaluate", json={
            "expressions": expressions,
            "variables": {},
            "x_range": [-10, 10],
            "num_points": 100
        })
        assert response.status_code == 422
    
    def test_batch_evaluate_empty_list(self):
        """Test batch evaluating empty expressions list"""
        response = client.post("/api/batch-evaluate", json={
            "expressions": [],
            "variables": {},
            "x_range": [-10, 10],
            "num_points": 100
        })
        assert response.status_code == 422
    
    def test_batch_evaluate_partial_failure(self):
        """Test batch evaluate with one invalid expression"""
        response = client.post("/api/batch-evaluate", json={
            "expressions": ["x^2", "invalid_expr +", "sin(x)"],
            "variables": {},
            "x_range": [-10, 10],
            "num_points": 100
        })
        assert response.status_code == 200
        data = response.json()
        # Should handle partial failures gracefully
        assert "results" in data
        assert len(data["results"]) == 3


class TestUpdateParametersEndpoint:
    """Test the /api/update-params endpoint"""
    
    def test_update_parameters(self):
        """Test updating parameters"""
        response = client.post("/api/update-params", json={
            "expression": "a*x^2 + b*sin(x)",
            "variables": {"a": 2.0, "b": 1.5},
            "x_range": [-10, 10]
        })
        assert response.status_code == 200
        data = response.json()
        assert "graph_data" in data
    
    def test_update_parameters_missing_variables(self):
        """Test update parameters without variables"""
        response = client.post("/api/update-params", json={
            "expression": "a*x^2",
            "x_range": [-10, 10]
        })
        assert response.status_code == 200
        # Should use empty variables as default
    
    def test_update_parameters_invalid_expression(self):
        """Test update parameters with invalid expression"""
        response = client.post("/api/update-params", json={
            "expression": "invalid + expression",
            "variables": {"a": 2.0},
            "x_range": [-10, 10]
        })
        assert response.status_code == 400


class TestParametricEndpoint:
    """Test the /api/parametric endpoint"""
    
    def test_parametric_basic(self):
        """Test basic parametric equation"""
        response = client.post("/api/parametric", json={
            "x_expression": "cos(t)",
            "y_expression": "sin(t)",
            "variables": {},
            "t_range": [0, 6.283185307179586],
            "num_points": 100
        })
        assert response.status_code == 200
        data = response.json()
        assert "graph_data" in data
        assert data["graph_data"]["total_points"] == 100
        # Check if we got a circle
        coords = data["graph_data"]["coordinates"]
        assert len(coords) > 0
    
    def test_parametric_with_parameters(self):
        """Test parametric equation with parameters"""
        response = client.post("/api/parametric", json={
            "x_expression": "a*cos(t)",
            "y_expression": "b*sin(t)",
            "variables": {"a": 2.0, "b": 3.0},
            "t_range": [0, 6.283185307179586],
            "num_points": 100
        })
        assert response.status_code == 200
        data = response.json()
        assert "graph_data" in data
    
    def test_parametric_invalid_expressions(self):
        """Test parametric with invalid expressions"""
        response = client.post("/api/parametric", json={
            "x_expression": "invalid_x",
            "y_expression": "invalid_y",
            "variables": {},
            "t_range": [0, 6.283185307179586],
            "num_points": 100
        })
        assert response.status_code == 400
    
    def test_parametric_missing_fields(self):
        """Test parametric with missing required fields"""
        response = client.post("/api/parametric", json={
            "x_expression": "cos(t)"
            # Missing y_expression, etc.
        })
        assert response.status_code == 422


class TestHealthEndpoint:
    """Test the /api/health endpoint"""
    
    def test_health_check(self):
        """Test basic health check"""
        response = client.get("/api/health")
        assert response.status_code == 200
        data = response.json()
        assert "status" in data
        assert data["status"] == "healthy"
        assert "timestamp" in data


class TestErrorHandling:
    """Test error handling across all endpoints"""
    
    def test_method_not_allowed(self):
        """Test unsupported HTTP methods"""
        response = client.get("/api/parse")
        assert response.status_code == 405
        
        response = client.put("/api/evaluate")
        assert response.status_code == 405
    
    def test_nonexistent_endpoint(self):
        """Test access to non-existent endpoint"""
        response = client.get("/api/nonexistent")
        assert response.status_code == 404
    
    def test_malformed_json(self):
        """Test malformed JSON request"""
        response = client.post(
            "/api/parse",
            data="{'invalid': json}",
            headers={"Content-Type": "application/json"}
        )
        assert response.status_code == 422
    
    def test_missing_content_type(self):
        """Test request without content-type header"""
        response = client.post("/api/parse", data='{"expression": "x^2"}')
        # May or may not work depending on FastAPI configuration
        assert response.status_code in [200, 422]


class TestPerformanceConstraints:
    """Test performance and resource constraints"""
    
    def test_large_computation_timeout(self):
        """Test handling of very large computations"""
        # This test simulates a computation that might take too long
        response = client.post("/api/evaluate", json={
            "expression": "x^1000",  # Very large exponent
            "variables": {},
            "x_range": [-30, 30],
            "num_points": 10000
        })
        # Should either complete successfully or timeout gracefully
        assert response.status_code in [200, 408, 500]
    
    def test_concurrent_requests(self):
        """Test handling of concurrent requests"""
        import threading
        import queue
        
        results = queue.Queue()
        
        def make_request():
            response = client.post("/api/evaluate", json={
                "expression": "sin(x)",
                "variables": {},
                "x_range": [-10, 10],
                "num_points": 100
            })
            results.put(response.status_code)
        
        # Make 10 concurrent requests
        threads = []
        for _ in range(10):
            thread = threading.Thread(target=make_request)
            threads.append(thread)
            thread.start()
        
        # Wait for all threads to complete
        for thread in threads:
            thread.join()
        
        # Check that all requests completed (either success or proper error)
        success_count = 0
        while not results.empty():
            status = results.get()
            if status == 200:
                success_count += 1
        
        # At least some should succeed
        assert success_count > 0


if __name__ == "__main__":
    pytest.main([__file__, "-v"])