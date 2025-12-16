"""
Single test to get endpoints.py to 90% coverage
Covers line 39-40 (parse exception handling)
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


def test_parse_endpoint_exception_coverage():
    """Test parse endpoint exception handling (lines 39-40)"""
    # Test with expression that causes parsing error
    response = client.post("/api/parse", json={
        "expression": "x + "  # Incomplete syntax
    })
    
    # The endpoint handles errors gracefully and returns 200 with error info
    assert response.status_code == 200
    data = response.json()
    assert data["is_valid"] == False
    assert "error" in data
    assert "Parse error" in data["error"]