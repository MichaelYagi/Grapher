"""
Cache edge case tests to improve core/cache.py coverage
Tests uncovered line 45 and related cache functionality
"""

import pytest
import sys
import os

# Add src directory to Python path
sys.path.append(os.path.join(os.path.dirname(__file__), '..', 'src'))

try:
    from backend.core.cache import init_cache, get_cache, cache, MemoryCache
except ImportError:
    sys.path.append(os.path.join(os.path.dirname(__file__), '..'))
    from backend.core.cache import init_cache, get_cache, cache, MemoryCache

def test_cache_initialization_function():
    """Test the cache initialization function (line 45)"""
    import asyncio
    
    async def test_init():
        # Store current cache state
        from backend.core.cache import get_cache
        old_cache = get_cache()
        
        # Run init_cache function
        await init_cache()
        
        # Verify cache is properly initialized
        new_cache = get_cache()
        assert new_cache is not None
        assert isinstance(new_cache, MemoryCache)
    
    # Run the async test
    asyncio.run(test_init())

def test_get_cache_function():
    """Test the get_cache function"""
    returned_cache = get_cache()
    assert returned_cache is not None
    assert isinstance(returned_cache, MemoryCache)

def test_cache_global_state():
    """Test global cache state management"""
    # Get current cache state
    initial_cache = get_cache()
    
    # Initialize new cache
    import asyncio
    
    async def reinitialize():
        await init_cache()
    
    asyncio.run(reinitialize())
    
    # Verify cache changed or remained valid
    new_cache = get_cache()
    assert new_cache is not None
    
    # Should be either the same cache or a new one, both valid
    assert isinstance(new_cache, MemoryCache)

def test_multiple_initializations():
    """Test multiple cache initializations"""
    import asyncio
    
    async def test_multiple():
        # Initialize cache twice
        await init_cache()
        first_cache = get_cache()
        
        await init_cache()
        second_cache = get_cache()
        
        # Both should be valid MemoryCache instances
        assert isinstance(first_cache, MemoryCache)
        assert isinstance(second_cache, MemoryCache)
    
    asyncio.run(test_multiple())