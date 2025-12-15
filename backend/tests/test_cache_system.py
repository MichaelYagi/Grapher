"""
Comprehensive cache system tests for Grapher backend.
Tests caching behavior, TTL expiration, and memory management.
"""

import pytest
import asyncio
import time
import json
import hashlib
from unittest.mock import patch, MagicMock
import sys
import os

# Add src directory to Python path
sys.path.append(os.path.join(os.path.dirname(__file__), '..', 'src'))

from backend.core.cache import MemoryCache, generate_cache_key


class TestMemoryCache:
    """Test MemoryCache implementation"""
    
    def test_cache_initialization(self):
        """Test cache initialization"""
        cache = MemoryCache()
        assert cache._cache == {}
        assert cache._lock is not None
    
    @pytest.mark.asyncio
    async def test_cache_set_and_get(self):
        """Test basic cache set and get operations"""
        cache = MemoryCache()
        key = "test_key"
        value = {"result": [1, 2, 3]}
        
        await cache.set(key, value)
        retrieved = await cache.get(key)
        
        assert retrieved == value
    
    @pytest.mark.asyncio
    async def test_cache_get_nonexistent_key(self):
        """Test getting non-existent key returns None"""
        cache = MemoryCache()
        result = await cache.get("nonexistent_key")
        assert result is None
    
    @pytest.mark.asyncio
    async def test_cache_expiration(self):
        """Test cache entry expiration"""
        cache = MemoryCache()
        key = "expire_test"
        value = {"result": "expired"}
        
        # Set with very short TTL (1 second)
        await cache.set(key, value, ttl=1)
        
        # Should be available immediately
        retrieved = await cache.get(key)
        assert retrieved == value
        
        # Wait for expiration
        await asyncio.sleep(1.1)
        
        # Should be expired now
        retrieved = await cache.get(key)
        assert retrieved is None
    
    @pytest.mark.asyncio
    async def test_cache_custom_ttl(self):
        """Test cache with custom TTL for specific entry"""
        cache = MemoryCache()
        key = "ttl_test"
        value = {"result": "custom_ttl"}
        
        # Set with 10 second TTL
        await cache.set(key, value, ttl=10)
        
        # Should be available
        retrieved = await cache.get(key)
        assert retrieved == value
    
    @pytest.mark.asyncio
    async def test_cache_overwrite(self):
        """Test overwriting existing cache entry"""
        cache = MemoryCache()
        key = "overwrite_test"
        value1 = {"result": "first"}
        value2 = {"result": "second"}
        
        await cache.set(key, value1)
        assert await cache.get(key) == value1
        
        await cache.set(key, value2)
        assert await cache.get(key) == value2
        assert await cache.get(key) != value1
    
    @pytest.mark.asyncio
    async def test_cache_delete(self):
        """Test cache deletion"""
        cache = MemoryCache()
        key = "delete_test"
        value = {"result": "test"}
        
        await cache.set(key, value)
        assert await cache.get(key) == value
        
        await cache.delete(key)
        assert await cache.get(key) is None
    
    @pytest.mark.asyncio
    async def test_cache_clear(self):
        """Test clearing entire cache"""
        cache = MemoryCache()
        
        # Add multiple entries
        for i in range(5):
            await cache.set(f"key_{i}", {"result": i})
        
        # Clear all
        await cache.clear()
        
        # All should be gone
        for i in range(5):
            assert await cache.get(f"key_{i}") is None
    
    @pytest.mark.asyncio
    async def test_cache_size_limit(self):
        """Test cache size handling"""
        cache = MemoryCache()
        
        # Add entries
        entries = {}
        for i in range(10):
            key = f"size_test_{i}"
            value = {"result": i}
            await cache.set(key, value)
            entries[key] = value
        
        # Verify cache contains entries
        for key, value in entries.items():
            retrieved = await cache.get(key)
            assert retrieved == value
    
    @pytest.mark.asyncio
    async def test_cache_concurrent_access(self):
        """Test cache thread safety with concurrent access"""
        cache = MemoryCache()
        
        async def worker(worker_id):
            key = f"concurrent_test_{worker_id}"
            value = {"result": worker_id}
            await cache.set(key, value)
            retrieved = await cache.get(key)
            return retrieved
        
        # Create multiple concurrent tasks
        tasks = [worker(i) for i in range(10)]
        results = await asyncio.gather(*tasks)
        
        # All operations should complete successfully
        assert len(results) == 10
        for i, result in enumerate(results):
            assert result["result"] == i


class TestCacheFunctions:
    """Test cache utility functions"""
    
    def test_generate_cache_key(self):
        """Test cache key generation"""
        expression = "x^2 + 2*x + 1"
        params = {"a": 2.0, "b": 1.5}
        x_range = (-10, 10)
        
        key = generate_cache_key(expression, params, x_range)
        
        # Key should be consistent
        key2 = generate_cache_key(expression, params, x_range)
        assert key == key2
        
        # Key should be MD5 hash (32 characters)
        assert len(key) == 32
        assert all(c in '0123456789abcdef' for c in key)
    
    def test_generate_cache_key_none_params(self):
        """Test cache key generation with None parameters"""
        expression = "sin(x)"
        
        key1 = generate_cache_key(expression)
        key2 = generate_cache_key(expression, None)
        key3 = generate_cache_key(expression, None, None)
        
        # All should be the same
        assert key1 == key2 == key3
    
    def test_generate_cache_key_different_params(self):
        """Test cache key generation with different parameters"""
        expression = "a*x^2"
        
        key1 = generate_cache_key(expression, {"a": 1.0})
        key2 = generate_cache_key(expression, {"a": 2.0})
        key3 = generate_cache_key(expression, {"b": 1.0})
        
        # All should be different
        assert key1 != key2 != key3
    
    def test_generate_cache_key_different_ranges(self):
        """Test cache key generation with different ranges"""
        expression = "x^2"
        params = {}
        
        key1 = generate_cache_key(expression, params, (-10, 10))
        key2 = generate_cache_key(expression, params, (-20, 20))
        key3 = generate_cache_key(expression, params, (0, 5))
        
        # All should be different
        assert key1 != key2 != key3
    
    @pytest.mark.asyncio
    async def test_cache_mathematical_expression(self):
        """Test caching mathematical expression results"""
        cache = MemoryCache()
        expression = "x^2 + sin(x)"
        params = {"frequency": 1.0}
        x_range = (-5, 5)
        
        # Generate cache key
        key = generate_cache_key(expression, params, x_range)
        
        # Mock result
        result = {
            "coordinates": [{"x": 0, "y": 0}, {"x": 1, "y": 1.84}],
            "total_points": 100,
            "valid_points": 98
        }
        
        # Cache result
        await cache.set(key, result)
        
        # Retrieve result
        cached_result = await cache.get(key)
        assert cached_result == result
        assert cached_result["coordinates"] == result["coordinates"]
    
    @pytest.mark.asyncio
    async def test_cache_miss(self):
        """Test cache miss for non-existent entry"""
        cache = MemoryCache()
        expression = "non_existent_function"
        
        key = generate_cache_key(expression, {}, (-10, 10))
        result = await cache.get(key)
        
        assert result is None
    
    @pytest.mark.asyncio
    async def test_cache_with_parameters(self):
        """Test caching expressions with parameters"""
        cache = MemoryCache()
        expression = "a*x^2 + b*sin(x)"
        
        # Cache result for specific parameters
        params1 = {"a": 1.0, "b": 2.0}
        key1 = generate_cache_key(expression, params1, (-10, 10))
        result1 = {"result": "with_params1"}
        await cache.set(key1, result1)
        
        # Cache result for different parameters
        params2 = {"a": 2.0, "b": 1.0}
        key2 = generate_cache_key(expression, params2, (-10, 10))
        result2 = {"result": "with_params2"}
        await cache.set(key2, result2)
        
        # Should get different results
        assert await cache.get(key1) == result1
        assert await cache.get(key2) == result2
        assert await cache.get(key1) != await cache.get(key2)
    
    @pytest.mark.asyncio
    async def test_cache_invalidation(self):
        """Test cache invalidation"""
        cache = MemoryCache()
        expression = "expiring_function"
        
        key = generate_cache_key(expression, {}, (-10, 10))
        result = {"result": "will_expire"}
        
        # Set with short TTL
        await cache.set(key, result, ttl=1)
        
        # Should be available
        assert await cache.get(key) == result
        
        # Delete manually
        await cache.delete(key)
        assert await cache.get(key) is None
    
    @pytest.mark.asyncio
    async def test_cache_clear_all(self):
        """Test clearing all cache entries"""
        cache = MemoryCache()
        
        # Add multiple expressions
        expressions = ["x^2", "sin(x)", "exp(x)", "log(x)"]
        for expr in expressions:
            key = generate_cache_key(expr, {}, (-10, 10))
            await cache.set(key, {"expression": expr})
        
        # Verify all exist
        for expr in expressions:
            key = generate_cache_key(expr, {}, (-10, 10))
            assert await cache.get(key) is not None
        
        # Clear all
        await cache.clear()
        
        # Verify all are gone
        for expr in expressions:
            key = generate_cache_key(expr, {}, (-10, 10))
            assert await cache.get(key) is None
    
    @pytest.mark.asyncio
    async def test_cache_statistics(self):
        """Test cache statistics and monitoring"""
        cache = MemoryCache()
        
        # Initially empty
        await cache.clear()
        
        # Add some entries
        for i in range(5):
            key = f"stats_test_{i}"
            await cache.set(key, {"value": i})
        
        # Check internal cache size
        assert len(cache._cache) == 5
        
        # Get some entries
        for i in range(3):
            key = f"stats_test_{i}"
            result = await cache.get(key)
            assert result["value"] == i
        
        # Delete some entries
        await cache.delete("stats_test_0")
        await cache.delete("stats_test_1")
        
        # Check final size
        assert len(cache._cache) == 3


class TestCachePerformance:
    """Test cache performance characteristics"""
    
    @pytest.mark.asyncio
    async def test_cache_performance_large_dataset(self):
        """Test cache performance with large datasets"""
        cache = MemoryCache()
        
        # Add many entries
        start_time = time.time()
        for i in range(100):
            key = f"perf_test_{i}"
            value = {"data": list(range(100)), "index": i}
            await cache.set(key, value)
        
        set_time = time.time() - start_time
        
        # Retrieve many entries
        start_time = time.time()
        for i in range(100):
            key = f"perf_test_{i}"
            await cache.get(key)
        
        get_time = time.time() - start_time
        
        # Performance should be reasonable (less than 1 second for 100 operations)
        assert set_time < 1.0
        assert get_time < 1.0
    
    @pytest.mark.asyncio
    async def test_cache_memory_usage(self):
        """Test cache memory usage and cleanup"""
        cache = MemoryCache()
        
        # Add entries with substantial data
        for i in range(10):
            key = f"memory_test_{i}"
            value = {"data": list(range(1000)), "metadata": f"test_data_{i}"}
            await cache.set(key, value)
        
        # Verify entries exist
        assert len(cache._cache) == 10
        
        # Clear cache
        await cache.clear()
        
        # Verify memory is cleared
        assert len(cache._cache) == 0


class TestCacheErrorHandling:
    """Test cache error handling and edge cases"""
    
    @pytest.mark.asyncio
    async def test_cache_with_none_result(self):
        """Test caching None results (failed computations)"""
        cache = MemoryCache()
        key = "none_result_test"
        
        # Cache None result
        await cache.set(key, None)
        
        # Should retrieve None
        result = await cache.get(key)
        assert result is None
    
    @pytest.mark.asyncio
    async def test_cache_with_malformed_data(self):
        """Test cache with malformed or unserializable data"""
        cache = MemoryCache()
        key = "malformed_test"
        
        # Cache complex data structure
        value = {
            "function": lambda x: x**2,  # Non-serializable
            "nested": {"deep": {"value": [1, 2, 3]}},
            "unicode": "测试 🧮 数学"
        }
        
        # Should still work (cache doesn't serialize, just stores)
        await cache.set(key, value)
        retrieved = await cache.get(key)
        
        # Retrieved value should match original
        assert retrieved["unicode"] == value["unicode"]
        assert retrieved["nested"] == value["nested"]
    
    @pytest.mark.asyncio
    async def test_cache_with_unicode(self):
        """Test cache with unicode characters in expressions"""
        cache = MemoryCache()
        
        expressions = [
            "x² + 2*x + 1",  # Superscript
            "sin(π*x)",         # Pi symbol
            "∑(i=1 to n)",      # Summation
            "测试函数"           # Chinese characters
        ]
        
        for expr in expressions:
            key = f"unicode_test_{hash(expr)}"
            await cache.set(key, {"expression": expr})
            result = await cache.get(key)
            assert result["expression"] == expr
    
    @patch('backend.core.cache.datetime')
    @pytest.mark.asyncio
    async def test_cache_time_manipulation(self, mock_datetime):
        """Test cache behavior with controlled time"""
        from datetime import datetime as real_datetime
        
        # Setup mock time
        fixed_time = real_datetime(2023, 1, 1, 12, 0, 0)
        mock_datetime.now.return_value = fixed_time
        
        cache = MemoryCache()
        key = "time_test"
        value = {"result": "time_sensitive"}
        
        # Set cache entry
        await cache.set(key, value, ttl=3600)
        
        # Should be available
        assert await cache.get(key) == value
        
        # Advance time beyond TTL
        future_time = real_datetime(2023, 1, 1, 13, 0, 1)  # 1 hour and 1 second later
        mock_datetime.now.return_value = future_time
        
        # Should be expired
        assert await cache.get(key) is None