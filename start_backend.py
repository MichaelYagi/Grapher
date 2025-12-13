#!/usr/bin/env python3
"""
Grapher Backend Server
Run this script to start the Python FastAPI backend server
"""

import sys
import os
import subprocess

def check_dependencies():
    """Check if required packages are installed"""
    required_packages = ['fastapi', 'uvicorn', 'numpy', 'numexpr', 'pydantic']
    missing_packages = []
    
    for package in required_packages:
        try:
            __import__(package)
        except ImportError:
            missing_packages.append(package)
    
    if missing_packages:
        print(f"❌ Missing required packages: {', '.join(missing_packages)}")
        print("Please install them with:")
        print(f"pip install {' '.join(missing_packages)}")
        return False
    
    print("✅ All required packages are installed")
    return True

def install_dependencies():
    """Install required packages"""
    print("📦 Installing required packages...")
    try:
        subprocess.run([sys.executable, '-m', 'pip', 'install', '-r', 'requirements.txt'], 
                      check=True, cwd='backend')
        print("✅ Packages installed successfully")
        return True
    except subprocess.CalledProcessError:
        print("❌ Failed to install packages")
        return False

def start_backend():
    """Start the FastAPI backend server"""
    print("\n🚀 Starting Grapher Backend Server...")
    print("📍 Backend will run on: http://localhost:8000")
    print("📖 API Documentation: http://localhost:8000/docs")
    print("\n💡 Keep this terminal open while using the application")
    print("⚠️  Press Ctrl+C to stop the server")
    print("-" * 50)
    
    # Change to backend directory and start the server
    backend_dir = os.path.join(os.path.dirname(__file__), 'backend', 'src')
    os.chdir(backend_dir)
    
    try:
        import uvicorn
        uvicorn.run(
            "main:app",
            host="127.0.0.1",
            port=8000,
            reload=True,
            log_level="info"
        )
    except ImportError:
        print("❌ uvicorn not found. Please install dependencies first.")
        return False
    except KeyboardInterrupt:
        print("\n👋 Backend server stopped")
        return True

def main():
    """Main setup and start script"""
    print("=" * 60)
    print("🎯 GRAPHER BACKEND SERVER SETUP")
    print("=" * 60)
    
    # Check if we're in the right directory
    if not os.path.exists('backend'):
        print("❌ Please run this script from the Grapher project root directory")
        print("   (the directory that contains the 'backend' folder)")
        return 1
    
    # Check dependencies
    if not check_dependencies():
        # Try to install dependencies
        response = input("\n❓ Would you like to install missing packages? (y/n): ")
        if response.lower() in ['y', 'yes']:
            if not install_dependencies():
                return 1
        else:
            print("❌ Cannot start server without required packages")
            return 1
    
    # Start the backend server
    try:
        start_backend()
        return 0
    except Exception as e:
        print(f"❌ Failed to start backend server: {e}")
        return 1

if __name__ == "__main__":
    sys.exit(main())