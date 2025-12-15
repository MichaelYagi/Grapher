# Simple cache test
import sys
import os

# Add src to path
sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), 'src'))

print("Python path:", sys.path[0])

try:
    print("Attempting to import CacheManager...")
    from backend.core.cache import CacheManager
    print("✅ CacheManager imported successfully!")
    
    print("Attempting to instantiate CacheManager...")
    cache = CacheManager()
    print("✅ CacheManager instantiated successfully!")
    
    print("Testing _generate_cache_key method...")
    key = cache._generate_cache_key("x^2", {"a": 2.0}, (-30, 30))
    print(f"✅ Generated cache key: {key}")
    
except ImportError as e:
    print(f"❌ Import failed: {e}")
except Exception as e:
    print(f"❌ Error: {e}")

print("Test completed!")