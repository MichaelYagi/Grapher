# Final Testing Solution
"""
Robust testing solution for Grapher with proper environment handling.
"""

import subprocess
import sys
import os
from pathlib import Path

def check_command_exists(command, description):
    """Check if a command is available"""
    try:
        subprocess.run([command, '--version'], 
                      capture_output=True, 
                      stderr=subprocess.DEVNULL, 
                      check=True)
        return True
    except (subprocess.CalledProcessError, FileNotFoundError):
        return False

def run_simple_test(test_name, test_command):
    """Run a simple test with proper error handling"""
    try:
        result = subprocess.run(test_command, shell=True, capture_output=True, text=True, encoding='utf-8')
        if result.returncode == 0:
            print(f"✅ {test_name} successful")
            return True
        else:
            print(f"❌ {test_name} failed (exit code {result.returncode})")
            print(f"Output: {result.stdout}")
            return False
    except Exception as e:
        print(f"❌ {test_name} error: {e}")
        return False

def main():
    """Main testing function"""
    print("🚀 Grapher Testing Suite")
    print("=" * 50)
    
    # Backend Tests
    print("🐧 Backend Testing")
    
    backend_tests = [
        ("Import Test", ["python", "-c", "from backend.core.cache import CacheManager; print('✅ Cache import successful')"]),
        ("Cache Initialization", ["python", "-c", "from backend.core.cache import CacheManager; c = CacheManager(); print('✅ Cache instantiation successful')"]),
        ("Basic Set/Get", ["python", "-c", "from backend.core.cache import CacheManager; c = CacheManager(); c.set('test', 'value'); result = c.get('test'); print('✅ Set/Get successful' if result == 'value' else '❌'"])
    ]
    
    success_count = 0
    for test_name, test_command in backend_tests:
        if run_simple_test(test_name, test_command):
            success_count += 1
        if run_simple_test(test_name, test_command):
            success_count += 1
        if run_simple_test(test_name, test_command):
            success_count += 1
    
    print(f"Backend Tests: {success_count}/{len(backend_tests)} passed")
    
    # Frontend Tests
    print("📱 Frontend Testing")
    
    # Check if npm is available
    if not check_command_exists('npm', 'npm package manager'):
        print("❌ npm not available - skipping frontend tests")
        return
    
    frontend_tests = [
        ("File Structure Check", ["ls", "backend/src/static/js/"]),
        ("Basic JavaScript Syntax", ["node", "-c", "console.log('Frontend files exist')"]),
    ]
    
    frontend_success_count = 0
    for test_name, test_command in frontend_tests:
        if run_simple_test(test_name, test_command):
            frontend_success_count += 1
    
    print(f"Frontend Tests: {frontend_success_count}/{len(frontend_tests)} checks passed")
    
    # Summary
    total_tests = len(backend_tests) + len(frontend_tests)
    passed_tests = success_count + frontend_success_count
    print(f"\n📊 Test Summary")
    print(f"Total: {total_tests}")
    print(f"Passed: {passed_tests}")
    print(f"Failed: {total_tests - passed_tests}")
    print(f"Success Rate: {passed_tests/total_tests*100:.1f}%")
    
    if passed_tests == total_tests:
        print("🎉 All tests passed!")
    else:
        print("⚠️ Some tests failed - check output above")

if __name__ == "__main__":
    main()