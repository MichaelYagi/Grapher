@echo off
REM Grapher Setup Script for Windows - Works in any environment
REM This script handles all the complexity of setting up the project

echo 🚀 Setting up Grapher...
echo ==============================

REM Check if Python is installed
python --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Error: Python is not installed
    echo Please install Python 3.7+ from https://python.org
    pause
    exit /b 1
)

echo ✅ Using Python:
python --version

REM Check if we're in the right directory
if not exist "backend\src\main.py" (
    echo ❌ Error: Please run this script from the Grapher project root
    pause
    exit /b 1
)

REM Create virtual environment if it doesn't exist
if not exist "venv" (
    echo 📦 Creating virtual environment...
    python -m venv venv
)

REM Activate virtual environment
echo 🔧 Activating virtual environment...
call venv\Scripts\activate.bat

REM Upgrade pip
echo ⬆️  Upgrading pip...
python -m pip install --upgrade pip

REM Install requirements
echo 📚 Installing dependencies...
if exist "backend\requirements.txt" (
    pip install -r backend\requirements.txt
) else (
    REM Fallback to essential packages
    pip install fastapi uvicorn python-dotenv numpy scipy pydantic-settings numexpr
)

REM Create .env file if it doesn't exist
if not exist ".env" (
    echo 📝 Creating .env file...
    copy backend\.env.example .env 2>nul || (
        echo # Grapher Environment Variables > .env
        echo HOST=127.0.0.1 >> .env
        echo PORT=3000 >> .env
        echo DEBUG=True >> .env
    )
)

REM Create startup script
echo 🔨 Creating startup script...
echo @echo off > start_grapher.bat
echo cd /d "%%~dp0" >> start_grapher.bat
echo call venv\Scripts\activate.bat >> start_grapher.bat
echo python backend\src\main.py >> start_grapher.bat
echo pause >> start_grapher.bat

echo.
echo ✅ Setup complete!
echo ==============================
echo 🎯 To start the server:
echo    Windows: start_grapher.bat
echo.
echo 🌐 Server will run on: http://localhost:3000
echo 📚 API docs will be at: http://localhost:3000/docs
echo.
pause