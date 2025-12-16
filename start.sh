#!/bin/bash
echo "🚀 Quick Start Grapher (works everywhere)"

# 1. Install packages globally if needed
echo "📦 Installing dependencies..."
if pip3 install fastapi uvicorn python-dotenv numpy scipy pydantic-settings numexpr --quiet 2>/dev/null; then
    echo "✅ Packages installed successfully"
else
    echo "🔧 Using system override for managed environment..."
    pip3 install fastapi uvicorn python-dotenv numpy scipy pydantic-settings numexpr --quiet --break-system-packages
fi

# 2. Start server
echo "🌐 Starting server..."
cd "$(dirname "$0")"
python3 backend/src/main.py