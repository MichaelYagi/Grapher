#!/bin/bash

# Grapher Setup Script - Works in any environment
# This script handles all the complexity of setting up the project

set -e  # Exit on any error

echo "🚀 Setting up Grapher..."
echo "=============================="

# Detect Python
if command -v python3 &> /dev/null; then
    PYTHON="python3"
elif command -v python &> /dev/null; then
    PYTHON="python"
else
    echo "❌ Error: Python is not installed"
    exit 1
fi

echo "✅ Using Python: $($PYTHON --version)"

# Check if we're in the right directory
if [ ! -f "backend/src/main.py" ]; then
    echo "❌ Error: Please run this script from the Grapher project root"
    exit 1
fi

# Create virtual environment (recreate if incomplete)
if [ ! -f "venv/bin/activate" ] && [ ! -f "venv/Scripts/activate" ]; then
    echo "📦 Creating virtual environment..."
    rm -rf venv
    $PYTHON -m venv venv
fi

# Activate virtual environment
echo "🔧 Activating virtual environment..."
if [ -f "venv/bin/activate" ]; then
    source venv/bin/activate
elif [ -f "venv/Scripts/activate" ]; then
    source venv/Scripts/activate
else
    echo "❌ Error: Virtual environment activation file not found"
    exit 1
fi

# Upgrade pip
echo "⬆️  Upgrading pip..."
pip install --upgrade pip

# Install requirements
echo "📚 Installing dependencies..."
if [ -f "backend/requirements.txt" ]; then
    pip install -r backend/requirements.txt
else
    # Fallback to essential packages
    pip install fastapi uvicorn python-dotenv numpy scipy pydantic-settings numexpr
fi

# Create .env file if it doesn't exist
if [ ! -f ".env" ]; then
    echo "📝 Creating .env file..."
    cp backend/.env.example .env 2>/dev/null || cat > .env << EOF
# Grapher Environment Variables
HOST=127.0.0.1
PORT=3000
DEBUG=True
EOF
fi

# Create startup script
echo "🔨 Creating startup script..."
cat > start_grapher.sh << 'EOF'
#!/bin/bash
cd "$(dirname "$0")"
source venv/bin/activate 2>/dev/null || source venv/Scripts/activate 2>/dev/null
python backend/src/main.py
EOF
chmod +x start_grapher.sh

# Create Windows startup script
cat > start_grapher.bat << 'EOF'
@echo off
cd /d "%~dp0"
call venv\Scripts\activate.bat
python backend\src\main.py
pause
EOF

echo ""
echo "✅ Setup complete!"
echo "=============================="
echo "🎯 To start the server:"
echo "   Linux/Mac: ./start_grapher.sh"
echo "   Windows:   start_grapher.bat"
echo ""
echo "🌐 Server will run on: http://localhost:3000"
echo "📚 API docs will be at: http://localhost:3000/docs"
echo ""