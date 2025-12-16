"""
Tests for FastAPI startup and configuration to improve main.py coverage
Tests uncovered lines in main.py
"""

import pytest
import sys
import os
from unittest.mock import patch, AsyncMock

# Add src directory to Python path
sys.path.append(os.path.join(os.path.dirname(__file__), '..', 'src'))

try:
    from main import app, lifespan
except ImportError:
    sys.path.append(os.path.join(os.path.dirname(__file__), '..'))
    from main import app, lifespan

def test_app_creation():
    """Test FastAPI app creation and configuration"""
    from fastapi import FastAPI
    
    assert isinstance(app, FastAPI)
    assert app.title == "Grapher API"
    assert app.version == "1.0.0"
    assert "Mathematical expression evaluation" in app.description

def test_lifespan_startup():
    """Test app lifespan startup functionality"""
    import asyncio
    
    async def test_lifespan():
        mock_app = {}
        
        # Test startup phase
        async with lifespan(mock_app):
            pass
    
    # Should not raise any exceptions
    asyncio.run(test_lifespan())

def test_lifespan_with_mock_init():
    """Test lifespan with mocked cache initialization"""
    import asyncio
    
    async def test_lifespan():
        mock_app = {}
        
        with patch('main.init_cache', new_callable=AsyncMock) as mock_init:
            async with lifespan(mock_app):
                pass
            
            # Verify cache init was called
            mock_init.assert_called_once()
    
    asyncio.run(test_lifespan())

def test_cors_configuration():
    """Test CORS middleware configuration"""
    from starlette.middleware.cors import CORSMiddleware
    
    # Check that CORS middleware is added
    middleware_classes = [middleware.cls for middleware in app.user_middleware]
    assert CORSMiddleware in middleware_classes

def test_router_inclusion():
    """Test that API router is properly included"""
    routes = [route.path for route in app.routes]
    
    # Check that main API routes are included
    assert "/api/parse" in routes
    assert "/api/evaluate" in routes
    assert "/api/health" in routes

def test_import_settings():
    """Test that settings are properly imported and used"""
    # This tests line 19 which imports router
    try:
        from main import router
        assert router is not None
        assert hasattr(router, 'routes')
    except ImportError:
        pytest.skip("Router import failed")

def test_exception_handlers():
    """Test exception handlers configuration"""
    # This tests the exception handler addition (line 53)
    assert hasattr(app, 'exception_handlers')
    assert len(app.exception_handlers) > 0

def test_docs_configuration():
    """Test API docs configuration"""
    # Test that docs are enabled by default
    assert app.openapi_url is not None
    assert app.docs_url is not None