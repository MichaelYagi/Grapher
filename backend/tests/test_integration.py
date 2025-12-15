"""
Integration tests for Grapher application.
Tests end-to-end workflows and component interactions.
"""

import pytest
import asyncio
import time
import json
from unittest.mock import patch, MagicMock, AsyncMock
import sys
import os

# Add src directory to Python path
sys.path.append(os.path.join(os.path.dirname(__file__), '..', 'src'))

try:
    from main import app
    from fastapi.testclient import TestClient
    import httpx
except ImportError:
    sys.path.append(os.path.join(os.path.dirname(__file__), '..'))
    from main import app
    from fastapi.testclient import TestClient
    import httpx


class TestEndToEndWorkflows:
    """Test complete user workflows from start to finish"""
    
    def setup_method(self):
        """Set up test client and environment"""
        self.client = TestClient(app)
        self.test_expressions = [
            "x^2 + 2*x + 1",
            "sin(x) * cos(2*x)",
            "a*x^2 + b*sin(x) + c",
            "x*sin(x)"
        ]
    
    def test_complete_plotting_workflow(self):
        """Test complete workflow from expression input to graph display"""
        # Step 1: Parse expression
        parse_response = self.client.post("/api/parse", json={
            "expression": "x^2 + 2*x + 1"
        })
        assert parse_response.status_code == 200
        parse_data = parse_response.json()
        assert parse_data["is_valid"] is True
        assert "x" in parse_data["variables"]
        
        # Step 2: Evaluate expression
        eval_response = self.client.post("/api/evaluate", json={
            "expression": "x^2 + 2*x + 1",
            "variables": {},
            "x_range": [-30, 30],
            "num_points": 1000
        })
        assert eval_response.status_code == 200
        eval_data = eval_response.json()
        assert "graph_data" in eval_data
        assert eval_data["graph_data"]["total_points"] == 1000
        assert len(eval_data["graph_data"]["coordinates"]) > 0
        
        # Step 3: Verify data consistency
        coords = eval_data["graph_data"]["coordinates"]
        assert coords[0]["x"] >= -30
        assert coords[-1]["x"] <= 30
        
        # Verify mathematical accuracy (at least for some points)
        for coord in coords[:10]:  # Check first 10 points
            x_val = coord["x"]
            y_val = coord["y"]
            expected_y = x_val**2 + 2*x_val + 1
            assert abs(y_val - expected_y) < 0.01  # Allow some tolerance
    
    def test_multi_variable_parameter_workflow(self):
        """Test workflow with expressions containing parameters"""
        expression = "a*x^2 + b*sin(x) + c"
        parameters = {"a": 2.0, "b": 1.5, "c": -1.0}
        
        # Step 1: Parse with parameters
        parse_response = self.client.post("/api/parse", json={
            "expression": expression
        })
        assert parse_response.status_code == 200
        parse_data = parse_response.json()
        assert set(parse_data["parameters"]) == {"a", "b", "c"}
        assert parse_data["primary_variable"] == "x"
        
        # Step 2: Evaluate with parameters
        eval_response = self.client.post("/api/evaluate", json={
            "expression": expression,
            "variables": parameters,
            "x_range": [-30, 30],
            "num_points": 500
        })
        assert eval_response.status_code == 200
        eval_data = eval_response.json()
        
        # Step 3: Verify parameter application
        coords = eval_data["graph_data"]["coordinates"]
        for coord in coords[:5]:  # Check first 5 points
            x_val = coord["x"]
            y_val = coord["y"]
            expected_y = (2.0 * x_val**2 + 1.5 * np.sin(x_val) - 1.0)
            assert abs(y_val - expected_y) < 0.01
    
    def test_batch_evaluation_workflow(self):
        """Test batch evaluation of multiple expressions"""
        expressions = ["x^2", "sin(x)", "x*sin(x)"]
        
        # Step 1: Batch evaluate
        batch_response = self.client.post("/api/batch-evaluate", json={
            "expressions": expressions,
            "variables": {},
            "x_range": [-30, 30],
            "num_points": 100
        })
        assert batch_response.status_code == 200
        batch_data = batch_response.json()
        assert "results" in batch_data
        assert len(batch_data["results"]) == 3
        
        # Step 2: Verify each expression was processed
        for i, expr in enumerate(expressions):
            result = batch_data["results"][i]
            assert "graph_data" in result
            assert result["graph_data"]["total_points"] == 100
            assert len(result["graph_data"]["coordinates"]) > 0
    
    def test_parameter_update_workflow(self):
        """Test parameter update workflow"""
        expression = "a*x^2"
        initial_params = {"a": 1.0}
        updated_params = {"a": 3.0}
        
        # Step 1: Initial evaluation
        initial_response = self.client.post("/api/update-params", json={
            "expression": expression,
            "variables": initial_params,
            "x_range": [-30, 30]
        })
        assert initial_response.status_code == 200
        
        # Step 2: Parameter update
        update_response = self.client.post("/api/update-params", json={
            "expression": expression,
            "variables": updated_params,
            "x_range": [-30, 30]
        })
        assert update_response.status_code == 200
        update_data = update_response.json()
        
        # Step 3: Verify parameter change effect
        initial_coords = initial_response.json()["graph_data"]["coordinates"]
        updated_coords = update_data["graph_data"]["coordinates"]
        
        # With a=3, y values should be 3x larger than with a=1
        for i in range(min(5, len(updated_coords))):
            initial_y = initial_coords[i]["y"] if i < len(initial_coords) else 0
            updated_y = updated_coords[i]["y"]
            assert abs(updated_y - 3 * initial_y) < 0.01
    
    def test_parametric_workflow(self):
        """Test parametric equation workflow"""
        x_expr = "cos(t)"
        y_expr = "sin(t)"
        t_range = [0, 6.283185307179586]  # 0 to 2π
        
        # Step 1: Parametric evaluation
        param_response = self.client.post("/api/parametric", json={
            "x_expression": x_expr,
            "y_expression": y_expr,
            "variables": {},
            "t_range": t_range,
            "num_points": 100
        })
        assert param_response.status_code == 200
        param_data = param_response.json()
        assert "graph_data" in param_data
        assert param_data["graph_data"]["total_points"] == 100
        
        # Step 2: Verify parametric behavior
        coords = param_data["graph_data"]["coordinates"]
        # Should approximately form a circle
        x_vals = [coord["x"] for coord in coords]
        y_vals = [coord["y"] for coord in coords]
        
        # Check that points are approximately on unit circle
        for i in range(0, len(coords), 10):  # Check every 10th point
            x, y = x_vals[i], y_vals[i]
            radius = np.sqrt(x**2 + y**2)
            assert abs(radius - 1.0) < 0.01  # Should be unit circle


class TestRangeToggleIntegration:
    """Test range toggle functionality integration"""
    
    def setup_method(self):
        """Set up test client"""
        self.client = TestClient(app)
    
    def test_computation_range_consistency(self):
        """Test that computation always uses [-30, 30] regardless of display range"""
        expression = "x*sin(x)"
        
        # Test with different display ranges but computation should be consistent
        for display_range in [(-10, 10), (-20, 20), (-30, 30)]:
            response = self.client.post("/api/evaluate", json={
                "expression": expression,
                "variables": {},
                "x_range": display_range,  # This is what frontend sends
                "num_points": 100
            })
            
            # Response should reflect computation range, not display range
            assert response.status_code == 200
            data = response.json()
            coords = data["graph_data"]["coordinates"]
            
            # Should always compute full [-30, 30] range internally
            min_x = min(coord["x"] for coord in coords)
            max_x = max(coord["x"] for coord in coords)
            
            # Even if frontend requests [-10, 10], backend should compute [-30, 30]
            assert min_x <= -29  # Should cover negative range
            assert max_x >= 29   # Should cover positive range
    
    def test_range_toggle_display_behavior(self):
        """Test that range toggle affects display but not computation"""
        expression = "x^2"
        
        # Get computation data
        compute_response = self.client.post("/api/evaluate", json={
            "expression": expression,
            "variables": {},
            "x_range": [-30, 30],  # Always compute with this
            "num_points": 1000
        })
        compute_data = compute_response.json()
        compute_coords = compute_data["graph_data"]["coordinates"]
        
        # Simulate what frontend would do:
        # For small display range [-10, 10], filter/zoom the computed data
        small_display_coords = [
            coord for coord in compute_coords 
            if -10 <= coord["x"] <= 10
        ]
        
        # For large display range [-30, 30], use all data
        large_display_coords = compute_coords
        
        # Verify small view is subset of large view
        assert len(small_display_coords) < len(large_display_coords)
        assert all(coord in large_display_coords for coord in small_display_coords)


class TestCacheIntegration:
    """Test cache behavior in integration scenarios"""
    
    def setup_method(self):
        """Set up test client"""
        self.client = TestClient(app)
    
    def test_cache_hit_and_miss_workflow(self):
        """Test cache hit and miss in workflow"""
        expression = "sin(x)"
        variables = {}
        x_range = (-10, 10)
        
        # Step 1: First request should be cache miss
        response1 = self.client.post("/api/evaluate", json={
            "expression": expression,
            "variables": variables,
            "x_range": x_range,
            "num_points": 100
        })
        assert response1.status_code == 200
        
        # Step 2: Second request with same parameters should be cache hit
        response2 = self.client.post("/api/evaluate", json={
            "expression": expression,
            "variables": variables,
            "x_range": x_range,
            "num_points": 100
        })
        assert response2.status_code == 200
        
        # Both responses should be identical (cached result)
        data1 = response1.json()
        data2 = response2.json()
        
        # Compare coordinates (should be identical if cached)
        coords1 = data1["graph_data"]["coordinates"]
        coords2 = data2["graph_data"]["coordinates"]
        
        # Should be identical or nearly identical
        assert len(coords1) == len(coords2)
        for i in range(min(10, len(coords1))):
            assert abs(coords1[i]["y"] - coords2[i]["y"]) < 1e-10
    
    def test_cache_invalidation_with_parameters(self):
        """Test cache invalidation with different parameters"""
        expression = "a*x^2"
        params1 = {"a": 1.0}
        params2 = {"a": 2.0}
        x_range = (-10, 10)
        
        # Step 1: Cache with first parameters
        response1 = self.client.post("/api/evaluate", json={
            "expression": expression,
            "variables": params1,
            "x_range": x_range,
            "num_points": 100
        })
        assert response1.status_code == 200
        
        # Step 2: Different parameters should be cache miss
        response2 = self.client.post("/api/evaluate", json={
            "expression": expression,
            "variables": params2,
            "x_range": x_range,
            "num_points": 100
        })
        assert response2.status_code == 200
        
        # Results should be different due to different parameters
        data1 = response1.json()
        data2 = response2.json()
        coords1 = data1["graph_data"]["coordinates"][0]  # First point
        coords2 = data2["graph_data"]["coordinates"][0]  # First point
        
        # Y values should be different (a=1 vs a=2)
        assert abs(coords2["y"] - 2 * coords1["y"]) < 0.01


class TestErrorHandlingIntegration:
    """Test error handling in integration scenarios"""
    
    def setup_method(self):
        """Set up test client"""
        self.client = TestClient(app)
    
    def test_invalid_expression_propagation(self):
        """Test that invalid expression errors propagate correctly"""
        invalid_expression = "x^2 + + invalid_syntax"
        
        # Step 1: Parse should detect invalid expression
        parse_response = self.client.post("/api/parse", json={
            "expression": invalid_expression
        })
        assert parse_response.status_code == 200
        parse_data = parse_response.json()
        assert parse_data["is_valid"] is False
        assert parse_data["error"] is not None
        
        # Step 2: Evaluate should also handle invalid expression
        eval_response = self.client.post("/api/evaluate", json={
            "expression": invalid_expression,
            "variables": {},
            "x_range": [-10, 10],
            "num_points": 100
        })
        # Should return 400 Bad Request for invalid expression
        assert eval_response.status_code in [400, 422]
    
    def test_resource_exhaustion_handling(self):
        """Test handling of resource exhaustion scenarios"""
        # Very large computation that might timeout
        large_expression = "sin(cos(tan(x^1000)))"
        
        response = self.client.post("/api/evaluate", json={
            "expression": large_expression,
            "variables": {},
            "x_range": [-30, 30],
            "num_points": 10000  # Maximum allowed
        })
        
        # Should either succeed or fail gracefully
        assert response.status_code in [200, 408, 500, 422]
        
        if response.status_code == 200:
            data = response.json()
            # Should have valid data structure
            assert "graph_data" in data
    
    def test_concurrent_request_handling(self):
        """Test handling of concurrent requests"""
        import threading
        import queue
        
        expression = "x^2"
        results = queue.Queue()
        
        def make_request():
            response = self.client.post("/api/evaluate", json={
                "expression": expression,
                "variables": {},
                "x_range": [-10, 10],
                "num_points": 100
            })
            results.put(response.status_code)
        
        # Make concurrent requests
        threads = []
        for _ in range(5):
            thread = threading.Thread(target=make_request)
            threads.append(thread)
            thread.start()
        
        # Wait for completion
        for thread in threads:
            thread.join()
        
        # Collect results
        status_codes = []
        while not results.empty():
            status_codes.append(results.get())
        
        # Most should succeed or fail consistently
        success_count = sum(1 for code in status_codes if code == 200)
        assert success_count > 0  # At least some should succeed


class TestPerformanceIntegration:
    """Test performance characteristics in integration"""
    
    def setup_method(self):
        """Set up test client"""
        self.client = TestClient(app)
    
    def test_response_time_performance(self):
        """Test response times for different complexity levels"""
        expressions = [
            ("x", "simple"),
            ("x^2 + 2*x + 1", "polynomial"),
            ("sin(x) * cos(2*x)", "trigonometric"),
            ("x*sin(x)*cos(x^2)", "complex")
        ]
        
        for expr, complexity in expressions:
            start_time = time.time()
            
            response = self.client.post("/api/evaluate", json={
                "expression": expr,
                "variables": {},
                "x_range": [-30, 30],
                "num_points": 1000
            })
            
            elapsed_time = time.time() - start_time
            
            assert response.status_code == 200
            
            # Simple expressions should be faster
            if complexity == "simple":
                assert elapsed_time < 0.1
            elif complexity == "complex":
                assert elapsed_time < 1.0  # Even complex should be reasonable
    
    def test_memory_usage_integration(self):
        """Test memory usage with large datasets"""
        # Large number of points
        response = self.client.post("/api/evaluate", json={
            "expression": "x^2",
            "variables": {},
            "x_range": [-30, 30],
            "num_points": 10000  # Maximum
        })
        
        assert response.status_code == 200
        data = response.json()
        
        # Should handle large datasets gracefully
        assert len(data["graph_data"]["coordinates"]) == 10000
        assert data["graph_data"]["total_points"] == 10000
        assert data["graph_data"]["valid_points"] == 10000


class TestAPICoherence:
    """Test API coherence and consistency"""
    
    def setup_method(self):
        """Set up test client"""
        self.client = TestClient(app)
    
    def test_api_response_format_consistency(self):
        """Test that all endpoints return consistent response formats"""
        expression = "x^2 + 2*x + 1"
        
        # Parse endpoint
        parse_response = self.client.post("/api/parse", json={
            "expression": expression
        })
        assert parse_response.status_code == 200
        parse_data = parse_response.json()
        
        # Expected fields in parse response
        expected_parse_fields = ["is_valid", "variables", "parameters", "primary_variable", "expression_type"]
        for field in expected_parse_fields:
            assert field in parse_data
        
        # Evaluate endpoint
        eval_response = self.client.post("/api/evaluate", json={
            "expression": expression,
            "variables": {},
            "x_range": [-10, 10],
            "num_points": 100
        })
        assert eval_response.status_code == 200
        eval_data = eval_response.json()
        
        # Expected fields in evaluate response
        expected_eval_fields = ["expression", "graph_data", "evaluation_time_ms"]
        for field in expected_eval_fields:
            assert field in eval_data
        
        # Graph data structure consistency
        graph_data = eval_data["graph_data"]
        expected_graph_fields = ["coordinates", "total_points", "valid_points", "x_range", "y_range"]
        for field in expected_graph_fields:
            assert field in graph_data
    
    def test_error_response_consistency(self):
        """Test that error responses have consistent format"""
        # Various error scenarios
        error_scenarios = [
            {
                "endpoint": "/api/parse",
                "data": {"expression": ""},
                "expected_status": 422
            },
            {
                "endpoint": "/api/evaluate", 
                "data": {
                    "expression": "x^2 + + invalid",
                    "variables": {},
                    "x_range": [-10, 10],
                    "num_points": 100
                },
                "expected_status": [400, 422]
            },
            {
                "endpoint": "/api/batch-evaluate",
                "data": {
                    "expressions": ["x^2"] * 150,  # Too many
                    "variables": {},
                    "x_range": [-10, 10],
                    "num_points": 100
                },
                "expected_status": 422
            }
        ]
        
        for scenario in error_scenarios:
            if isinstance(scenario["expected_status"], list):
                response = self.client.post(scenario["endpoint"], json=scenario["data"])
                assert response.status_code in scenario["expected_status"]
            else:
                response = self.client.post(scenario["endpoint"], json=scenario["data"])
                assert response.status_code == scenario["expected_status"]


if __name__ == "__main__":
    pytest.main([__file__, "-v"])