import json
import hashlib
from typing import Optional, Dict, Any
import asyncio
from datetime import datetime, timedelta

# Simple in-memory cache for development
# In production, replace with Redis or similar
class MemoryCache:
    def __init__(self):
        self._cache: Dict[str, Dict[str, Any]] = {}
        self._lock = asyncio.Lock()
    
    async def get(self, key: str) -> Optional[Any]:
        async with self._lock:
            if key in self._cache:
                item = self._cache[key]
                if datetime.now() < item['expires']:
                    return item['value']
                else:
                    del self._cache[key]
            return None
    
    async def set(self, key: str, value: Any, ttl: int = 3600) -> None:
        async with self._lock:
            self._cache[key] = {
                'value': value,
                'expires': datetime.now() + timedelta(seconds=ttl)
            }
    
    async def delete(self, key: str) -> None:
        async with self._lock:
            if key in self._cache:
                del self._cache[key]
    
    async def clear(self) -> None:
        async with self._lock:
            self._cache.clear()

# Global cache instance
cache: MemoryCache = None

async def init_cache():
    global cache
    cache = MemoryCache()

def get_cache() -> MemoryCache:
    return cache

def generate_cache_key(expression: str, params: Dict[str, float] = None, x_range: tuple = None) -> str:
    """Generate a unique cache key for expression evaluation"""
    key_data = {
        'expression': expression,
        'params': params or {},
        'x_range': x_range or (-5, 5)
    }
    key_str = json.dumps(key_data, sort_keys=True)
    return hashlib.md5(key_str.encode()).hexdigest()