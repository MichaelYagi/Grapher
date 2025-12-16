import json
import hashlib
from typing import Optional, Dict, Any
import asyncio
from datetime import datetime, timedelta
import threading

# Simple in-memory cache for development
# In production, replace with Redis or similar
class MemoryCache:
    def __init__(self):
        self._cache: Dict[str, Dict[str, Any]] = {}
        self._lock = threading.Lock()  # Use threading lock for compatibility
        
    async def get(self, key: str) -> Optional[Any]:
        """Get value from cache if it exists and hasn't expired"""
        with self._lock:
            if key in self._cache:
                item = self._cache[key]
                if datetime.now() < item['expires']:
                    return item['value']
                else:
                    del self._cache[key]
            return None
    
    async def set(self, key: str, value: Any, ttl: int = 3600) -> None:
        """Set value in cache with TTL"""
        with self._lock:
            self._cache[key] = {
                'value': value,
                'expires': datetime.now() + timedelta(seconds=ttl)
            }
    
    async def delete(self, key: str) -> None:
        """Delete key from cache"""
        with self._lock:
            if key in self._cache:
                del self._cache[key]
    
    async def clear(self) -> None:
        """Clear all cache entries"""
        with self._lock:
            self._cache.clear()

# Global cache instance
cache: Optional[MemoryCache] = None

async def init_cache():
    """Initialize the global cache instance"""
    global cache
    cache = MemoryCache()

def get_cache() -> Optional[MemoryCache]:
    """Get the global cache instance"""
    return cache

def generate_cache_key(expression: str, params: Optional[Dict[str, float]] = None, x_range: Optional[tuple] = None) -> str:
    """Generate a unique cache key for expression evaluation"""
    key_data = {
        'expression': expression,
        'params': params or {},
        'x_range': x_range or (-30, 30)
    }
    key_str = json.dumps(key_data, sort_keys=True)
    return hashlib.md5(key_str.encode()).hexdigest()