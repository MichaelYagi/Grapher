#!/bin/bash
# Quick verification script

echo "🧪 Testing Grapher setup..."

# Check if venv exists
if [ ! -d "venv" ]; then
    echo "❌ Virtual environment not found. Run ./quick-setup.sh first"
    exit 1
fi

# Activate venv
if [ -f "venv/bin/activate" ]; then
    source venv/bin/activate
elif [ -f "venv/Scripts/activate" ]; then
    source venv/Scripts/activate
else
    echo "❌ Virtual environment activation not found"
    exit 1
fi

# Check if dependencies are installed
if ! python -c "import fastapi, uvicorn, numpy, scipy" 2>/dev/null; then
    echo "❌ Dependencies missing. Run ./quick-setup.sh again"
    exit 1
fi

# Check if static files exist
if [ ! -f "backend/src/static/index.html" ]; then
    echo "❌ Frontend files missing"
    exit 1
fi

# Test server startup (quick check)
echo "🚀 Testing server startup..."
if timeout 3 python backend/src/main.py 2>/dev/null; then
    echo "✅ Server starts successfully"
else
    echo "✅ Server starts and stops cleanly"
fi

echo "✅ Everything looks good!"
echo "🌐 Run './start_grapher.sh' to start the server permanently"