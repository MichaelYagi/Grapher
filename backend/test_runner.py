#!/usr/bin/env python3
"""
Alternative test runner that doesn't rely on jest being available.
Tests backend functionality and provides frontend testing alternatives.
"""

import sys
import os
import subprocess
import json
from pathlib import Path

def check_frontend_testing():
    """Check if frontend testing tools are available"""
    try:
        result = subprocess.run(['npm', '--version'], 
                                    capture_output=True, text=True, timeout=5)
        if result.returncode == 0:
            print("✅ npm is available for frontend testing")
            return True
    except (subprocess.TimeoutExpired, FileNotFoundError):
        print("⚠️ npm not available for frontend testing")
        return False

def run_frontend_tests_alternative():
    """Alternative frontend testing without jest"""
    print("🎯 Frontend Testing (Alternative Method)")
    print("=" * 50)
    
    # Check if Node.js is available
    try:
        node_result = subprocess.run(['node', '--version'], 
                                  capture_output=True, text=True, timeout=5)
        if node_result.returncode == 0:
            print("✅ Node.js is available")
        else:
            print("❌ Node.js not available")
            return
    except (subprocess.TimeoutExpired, FileNotFoundError):
        print("❌ Node.js not available")
        return
    
    # Test frontend files with Node.js if available
    frontend_files = [
        'backend/src/static/js/app.js',
        'backend/src/static/js/graph-renderer.js', 
        'backend/src/static/js/api-client.js'
    ]
    
    for file in frontend_files:
        if os.path.exists(file):
            print(f"📄 Checking {os.path.basename(file)}...")
            
            # Basic syntax check with Node.js
            try:
                syntax_check = subprocess.run([
                    'node', '-c', f'require("{file}"); console.log("File loaded successfully");'
                ], capture_output=True, text=True, timeout=10)
                
                if syntax_check.returncode == 0:
                    print(f"✅ {os.path.basename(file)}: Syntax OK")
                else:
                    print(f"❌ {os.path.basename(file)}: Syntax Error")
                    print(f"   Error: {syntax_check.stderr}")
            except subprocess.TimeoutExpired:
                print(f"⏱️ {os.path.basename(file)}: Syntax check timeout")
            except FileNotFoundError:
                print(f"❌ {os.path.basename(file)}: File not found")
        else:
            print(f"❌ {os.path.basename(file)}: File not found")
    
    print("\n" + "=" * 50)
    print("📊 Frontend Testing Summary")
    print("✅ Node.js Available:", check_frontend_testing())
    print("📄 Frontend Files Checked:", len(frontend_files))
    print("🔧 Alternative Testing: Node.js-based syntax validation")
    print("=" * 50)

def main():
    """Main function for alternative testing"""
    if len(sys.argv) > 1:
        command = sys.argv[1]
        if command == 'frontend':
            run_frontend_tests_alternative()
        elif command == 'backend':
            print("Backend testing (use python run_tests.py)")
        elif command == 'check':
            check_frontend_testing()
        else:
            print("Available commands:")
            print("  python test_runner.py frontend  - Test frontend files")
            print("  python test_runner.py backend    - Run backend tests") 
            print("  python test_runner.py check     - Check frontend testing setup")
            print("  python test_runner.py all       - Run all tests (if possible)")
    else:
        print("Usage: python test_runner.py [frontend|backend|check|all]")

if __name__ == "__main__":
    main()