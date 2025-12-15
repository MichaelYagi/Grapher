#!/usr/bin/env python3
"""
Simplified test runner for Grapher backend tests.
Fixes common import issues and provides clean test execution.
"""

import sys
import os
import subprocess
from pathlib import Path

def setup_python_path():
    """Set up the Python path correctly for tests"""
    # Get the backend directory
    backend_dir = Path(__file__).parent
    src_dir = backend_dir / "src"
    
    # Add src to Python path
    if str(src_dir) not in sys.path:
        sys.path.insert(0, str(src_dir))
    
    print(f"Python path configured: {sys.path[0]}")

def run_backend_tests():
    """Run backend tests with proper setup"""
    setup_python_path()
    
    # Change to backend directory
    os.chdir(Path(__file__).parent)
    
    # Run pytest with specific configuration
    test_args = [
        sys.executable, "-m", "pytest",
        "tests/",
        "-v",
        "--tb=short",
        "--color=yes",
        "-x",  # Stop on first failure
        "--disable-warnings"  # Suppress deprecation warnings for now
    ]
    
    try:
        result = subprocess.run(test_args, check=True)
        return result.returncode
    except subprocess.CalledProcessError as e:
        print(f"Error running tests: {e}")
        return 1

def run_specific_test(test_file):
    """Run a specific test file"""
    setup_python_path()
    
    os.chdir(Path(__file__).parent)
    
    test_args = [
        sys.executable, "-m", "pytest",
        f"tests/{test_file}",
        "-v",
        "--tb=short",
        "--color=yes"
    ]
    
    try:
        result = subprocess.run(test_args, check=True)
        return result.returncode
    except subprocess.CalledProcessError as e:
        print(f"Error running {test_file}: {e}")
        return 1

def main():
    if len(sys.argv) > 1:
        test_file = sys.argv[1]
        print(f"Running specific test: {test_file}")
        return run_specific_test(test_file)
    else:
        print("Running all backend tests...")
        return run_backend_tests()

if __name__ == "__main__":
    sys.exit(main())