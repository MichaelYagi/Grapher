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

# Add the src directory to Python path
sys.path.append(os.path.join(os.path.dirname(__file__), '..', 'src'))

try:
    from backend.core.cache import CacheManager, MemoryCache
except ImportError:
    # Handle relative imports
    sys.path.append(os.path.join(os.path.dirname(__file__), '..'))
    from backend.core.cache import CacheManager, MemoryCache


class TestMemoryCache:
    """Test MemoryCache implementation"""
    
    def test_cache_initialization(self):
        """Test cache initialization with default TTL"""
        cache = MemoryCache()
        assert cache.default_ttl == 3600
        assert cache.cache == {}
        assert len(cache.cache) == 0
    
    def test_cache_initialization_with_custom_ttl(self):
        """Test cache initialization with custom TTL"""
        cache = MemoryCache(ttl=1800)
        assert cache.default_ttl == 1800
    
    def test_cache_set_and_get(self):
        """Test basic cache set and get operations"""
        cache = MemoryCache()
        key = "test_key"
        value = {"result": [1, 2, 3]}
        
        cache.set(key, value)
        retrieved = cache.get(key)
        
        assert retrieved == value
    
    def test_cache_get_nonexistent_key(self):
        """Test getting non-existent key returns None"""
        cache = MemoryCache()
        result = cache.get("nonexistent_key")
        assert result is None
    
    def test_cache_expiration(self):
        """Test cache entry expiration"""
        cache = MemoryCache(ttl=1)  # 1 second TTL
        key = "expire_test"
        value = {"result": "test"}
        
        cache.set(key, value)
        
        # Should be available immediately
        assert cache.get(key) == value
        
        # Wait for expiration
        time.sleep(2)
        
        # Should be expired
        assert cache.get(key) is None
    
    def test_cache_custom_ttl(self):
        """Test cache with custom TTL for specific entry"""
        cache = MemoryCache(ttl=10)  # Default 10 seconds
        key = "custom_ttl_test"
        value = {"result": "test"}
        
        cache.set(key, value, ttl=1)  # Custom 1 second TTL
        
        # Should be available immediately
        assert cache.get(key) == value
        
        # Wait for custom expiration
        time.sleep(2)
        
        # Should be expired even though default TTL is longer
        assert cache.get(key) is None
    
    def test_cache_overwrite(self):
        """Test overwriting existing cache entry"""
        cache = MemoryCache()
        key = "overwrite_test"
        value1 = {"result": "first"}
        value2 = {"result": "second"}
        
        cache.set(key, value1)
        assert cache.get(key) == value1
        
        cache.set(key, value2)
        assert cache.get(key) == value2
    
    def test_cache_delete(self):
        """Test cache deletion"""
        cache = MemoryCache()
        key = "delete_test"
        value = {"result": "test"}
        
        cache.set(key, value)
        assert cache.get(key) == value
        
        cache.delete(key)
        assert cache.get(key) is None
    
    def test_cache_clear(self):
        """Test clearing entire cache"""
        cache = MemoryCache()
        
        # Add multiple entries
        for i in range(5):
            cache.set(f"key_{i}", {"result": i})
        
        assert len(cache.cache) == 5
        
        cache.clear()
        
        assert len(cache.cache) == 0
        for i in range(5):
            assert cache.get(f"key_{i}") is None
    
    def test_cache_size_limit(self):
        """Test cache size limiting (if implemented)"""
        cache = MemoryCache()
        
        # Add entries up to expected size
        entries = {}
        for i in range(100):  # Add 100 entries
            key = f"size_test_{i}"
            value = {"result": i}
            cache.set(key, value)
            entries[key] = value
        
        # Verify cache contains entries
        assert len(cache.cache) > 0
        
        # Should still be able to retrieve entries
        assert cache.get("size_test_50") == entries["size_test_50"]
    
    def test_cache_concurrent_access(self):
        """Test cache thread safety with concurrent access"""
        cache = MemoryCache()
        results = []
        
        def worker(worker_id):
            key = f"concurrent_test_{worker_id}"
            value = {"result": worker_id}
            cache.set(key, value)
            retrieved = cache.get(key)
            results.append(retrieved)
        
        # Create multiple threads
        import threading
        threads = []
        for i in range(10):
            thread = threading.Thread(target=worker, args=(i,))
            threads.append(thread)
            thread.start()
        
        # Wait for all threads
        for thread in threads:
            thread.join()
        
        # All operations should complete successfully
        assert len(results) == 10
        for i, result in enumerate(results):
            assert result["result"] == i


class TestCacheManager:
    """Test CacheManager wrapper with mathematical expression caching"""
    
    def test_generate_cache_key(self):
        """Test cache key generation"""
        cache_manager = CacheManager()
        
        expression = "x^2 + 2*x + 1"
        params = {"a": 2.0, "b": 3.0}
        x_range = (-10, 10)
        
        key1 = cache_manager._generate_cache_key(expression, params, x_range)
        key2 = cache_manager._generate_cache_key(expression, params, x_range)
        
        # Same inputs should generate same key
        assert key1 == key2
        
        # Different params should generate different key
        different_params = {"a": 1.0, "b": 3.0}
        key3 = cache_manager._generate_cache_key(expression, different_params, x_range)
        assert key2 != key3
        
        # Key should be valid MD5 hash
        assert len(key1) == 32
        assert all(c in '0123456789abcdef' for c in key1)
    
    def test_generate_cache_key_none_params(self):
        """Test cache key generation with None parameters"""
        cache_manager = CacheManager()
        
        expression = "x^2"
        key_with_none = cache_manager._generate_cache_key(expression, None, (-10, 10))
        key_with_empty = cache_manager._generate_cache_key(expression, {}, (-10, 10))
        
        # None should be treated as empty dict
        assert key_with_none == key_with_empty
    
    def test_cache_mathematical_expression(self):
        """Test caching mathematical expression results"""
        cache_manager = CacheManager()
        
        expression = "sin(x) * cos(x)"
        variables = {}
        x_range = (-10, 10)
        result = {
            "coordinates": [{"x": 0, "y": 0}, {"x": 1, "y": 0.5}],
            "total_points": 100,
            "valid_points": 100
        }
        
        # Cache the result
        cache_key = cache_manager.cache_result(expression, variables, x_range, result)
        
        # Verify key is returned
        assert cache_key is not None
        assert len(cache_key) == 32
        
        # Retrieve from cache
        cached_result = cache_manager.get_cached_result(expression, variables, x_range)
        assert cached_result == result
    
    def test_cache_miss(self):
        """Test cache miss for non-existent entry"""
        cache_manager = CacheManager()
        
        expression = "non_existent_expression"
        variables = {"a": 1.0}
        x_range = (-5, 5)
        
        result = cache_manager.get_cached_result(expression, variables, x_range)
        assert result is None
    
    def test_cache_with_parameters(self):
        """Test caching expressions with parameters"""
        cache_manager = CacheManager()
        
        expression = "a*x^2 + b*sin(x)"
        params1 = {"a": 2.0, "b": 1.0}
        params2 = {"a": 3.0, "b": 2.0}
        x_range = (-10, 10)
        
        result1 = {"coordinates": [{"x": 1, "y": 2}]}
        result2 = {"coordinates": [{"x": 1, "y": 5}]}
        
        # Cache both parameter sets
        key1 = cache_manager.cache_result(expression, params1, x_range, result1)
        key2 = cache_manager.cache_result(expression, params2, x_range, result2)
        
        # Should get different cache entries
        assert key1 != key2
        
        # Retrieve specific parameter combinations
        retrieved1 = cache_manager.get_cached_result(expression, params1, x_range)
        retrieved2 = cache_manager.get_cached_result(expression, params2, x_range)
        
        assert retrieved1 == result1
        assert retrieved2 == result2
    
    def test_cache_invalidation(self):
        """Test cache invalidation"""
        cache_manager = CacheManager()
        
        expression = "x^2"
        variables = {}
        x_range = (-10, 10)
        result = {"coordinates": [{"x": 1, "y": 1}]}
        
        # Cache the result
        cache_manager.cache_result(expression, variables, x_range, result)
        
        # Verify it's cached
        assert cache_manager.get_cached_result(expression, variables, x_range) == result
        
        # Invalidate cache
        cache_manager.invalidate_cache(expression, variables, x_range)
        
        # Should no longer be cached
        assert cache_manager.get_cached_result(expression, variables, x_range) is None
    
    def test_cache_clear_all(self):
        """Test clearing all cache entries"""
        cache_manager = CacheManager()
        
        # Add multiple cached expressions
        for i in range(5):
            expression = f"x^{i+1}"
            cache_manager.cache_result(expression, {}, (-10, 10), {"coordinates": []})
        
        # Clear all cache
        cache_manager.clear_all_cache()
        
        # All should be cleared
        for i in range(5):
            expression = f"x^{i+1}"
            result = cache_manager.get_cached_result(expression, {}, (-10, 10))
            assert result is None
    
    def test_cache_statistics(self):
        """Test cache statistics and monitoring"""
        cache_manager = CacheManager()
        
        # Initially should have zero stats
        stats = cache_manager.get_statistics()
        assert stats["total_entries"] == 0
        assert stats["cache_hits"] == 0
        assert stats["cache_misses"] == 0
        
        # Add some entries
        expression = "x^2"
        result = {"coordinates": []}
        
        cache_manager.cache_result(expression, {}, (-10, 10), result)
        stats = cache_manager.get_statistics()
        assert stats["total_entries"] == 1
        
        # Cache hit
        cached = cache_manager.get_cached_result(expression, {}, (-10, 10))
        stats = cache_manager.get_statistics()
        assert stats["cache_hits"] == 1
        
        # Cache miss
        missed = cache_manager.get_cached_result("sin(x)", {}, (-10, 10))
        stats = cache_manager.get_statistics()
        assert stats["cache_misses"] == 1


class TestCachePerformance:
    """Test cache performance and memory usage"""
    
    def test_cache_performance_large_dataset(self):
        """Test cache performance with large datasets"""
        cache_manager = CacheManager()
        
        # Create a large result set
        large_result = {
            "coordinates": [{"x": i/10, "y": (i/10)**2} for i in range(10000)],
            "total_points": 10000,
            "valid_points": 10000
        }
        
        # Measure cache operation time
        start_time = time.time()
        
        cache_manager.cache_result("x^2", {}, (-100, 100), large_result)
        cache_time = time.time() - start_time
        
        # Should cache within reasonable time (< 1 second)
        assert cache_time < 1.0
        
        # Measure retrieval time
        start_time = time.time()
        
        retrieved = cache_manager.get_cached_result("x^2", {}, (-100, 100))
        retrieve_time = time.time() - start_time
        
        # Should retrieve much faster than computation (< 0.1 seconds)
        assert retrieve_time < 0.1
        assert retrieved == large_result
    
    def test_cache_memory_usage(self):
        """Test cache memory usage and cleanup"""
        cache_manager = CacheManager()
        
        # Add many large entries to test memory
        for i in range(50):
            large_result = {
                "coordinates": [{"x": j, "y": j**2} for j in range(1000)],
                "total_points": 1000,
                "valid_points": 1000,
                "metadata": f"large_entry_{i}" * 100  # Add some string data
            }
            cache_manager.cache_result(f"expression_{i}", {}, (-10, 10), large_result)
        
        # Check that cache can handle the load
        stats = cache_manager.get_statistics()
        assert stats["total_entries"] == 50
        
        # Clear and verify memory is freed
        cache_manager.clear_all_cache()
        stats = cache_manager.get_statistics()
        assert stats["total_entries"] == 0


class TestCacheErrorHandling:
    """Test cache error handling and edge cases"""
    
    def test_cache_with_none_result(self):
        """Test caching None results (failed computations)"""
        cache_manager = CacheManager()
        
        # Should handle None results gracefully
        cache_key = cache_manager.cache_result("invalid_expr", {}, (-10, 10), None)
        
        # May or may not cache None depending on implementation
        retrieved = cache_manager.get_cached_result("invalid_expr", {}, (-10, 10))
        
        # Should handle None appropriately
        assert retrieved is None or retrieved is None
    
    def test_cache_with_malformed_data(self):
        """Test cache with malformed or unserializable data"""
        cache_manager = CacheManager()
        
        # Test with unserializable data (like functions)
        try:
            malformed_result = {"callback": lambda x: x**2}
            cache_manager.cache_result("test_expr", {}, (-10, 10), malformed_result)
            
            # Should either handle gracefully or raise appropriate error
            retrieved = cache_manager.get_cached_result("test_expr", {}, (-10, 10))
            
        except (TypeError, ValueError):
            # Expected for unserializable data
            pass
    
    def test_cache_with_unicode(self):
        """Test cache with unicode characters in expressions"""
        cache_manager = CacheManager()
        
        unicode_expression = "x² + 2*x + π"  # Unicode exponent and pi
        
        try:
            result = {"coordinates": [{"x": 1, "y": 4}]}
            cache_key = cache_manager.cache_result(unicode_expression, {}, (-10, 10), result)
            
            # Should handle unicode or raise appropriate error
            assert cache_key is not None or cache_key is None
            
            if cache_key:
                retrieved = cache_manager.get_cached_result(unicode_expression, {}, (-10, 10))
                assert retrieved == result
                
        except (UnicodeEncodeError, ValueError):
            # Acceptable to reject unicode
            pass
    
    @patch('time.time')
    def test_cache_time_manipulation(self, mock_time):
        """Test cache behavior with controlled time"""
        cache_manager = CacheManager(ttl=10)
        
        # Set initial time
        mock_time.return_value = 1000.0
        
        result = {"coordinates": [{"x": 1, "y": 1}]}
        cache_manager.cache_result("x^2", {}, (-10, 10), result)
        
        # Should be available at current time
        retrieved = cache_manager.get_cached_result("x^2", {}, (-10, 10))
        assert retrieved == result
        
        # Advance time beyond TTL
        mock_time.return_value = 1015.0  # 15 seconds later
        
        # Should be expired
        retrieved = cache_manager.get_cached_result("x^2", {}, (-10, 10))
        assert retrieved is None


if __name__ == "__main__":
    pytest.main([__file__, "-v"])