@echo off
echo 🚀 Quick Start Grapher (works everywhere)

REM 1. Install packages if needed
echo 📦 Installing dependencies...
pip install fastapi uvicorn python-dotenv numpy scipy pydantic-settings numexpr --quiet 2>nul
if %errorlevel% neq 0 (
    echo 🔧 Using system override for managed environment...
    pip install fastapi uvicorn python-dotenv numpy scipy pydantic-settings numexpr --quiet --break-system-packages
)

REM 2. Start server
echo 🌐 Starting server...
cd /d "%~dp0"
python backend\src\main.py
pause