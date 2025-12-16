# Troubleshooting Guide

## Setup Issues

### "Python not found"
**Windows**: Download Python 3.7+ from https://python.org  
**Mac**: `brew install python`  
**Linux**: `sudo apt install python3 python3-pip` (Ubuntu) or `sudo dnf install python3 python3-pip` (Fedora)

### "Permission denied" (Linux/Mac)
```bash
chmod +x setup.sh start_grapher.sh
```

### "externally-managed-environment" error
This is normal on modern Linux systems. The script handles it automatically:

**Option 1 - Let script handle it** (recommended):
- The script will use `--break-system-packages` automatically
- This is safe for application-specific packages

**Option 2 - Manual install with override**:
```bash
pip3 install --break-system-packages fastapi uvicorn python-dotenv numpy scipy pydantic-settings numexpr
```

**Option 3 - Use user install**:
```bash
pip3 install --user fastapi uvicorn python-dotenv numpy scipy pydantic-settings numexpr
```

**Option 4 - System packages** (Ubuntu/Debian):
```bash
sudo apt install python3-fastapi python3-uvicorn python3-numpy python3-scipy
```

### "pip install fails"
**Option 1 - Use user install**:
```bash
pip install --user -r backend/requirements.txt
```

**Option 2 - Upgrade pip first**:
```bash
python -m pip install --upgrade pip
```

### "Virtual environment activation fails"
**Linux/Mac**:
```bash
source venv/bin/activate
```

**Windows**:
```cmd
venv\Scripts\activate.bat
```

## Runtime Issues

### "Port already in use"
1. Kill the process:
   - **Linux/Mac**: `lsof -ti:3000 | xargs kill`
   - **Windows**: `netstat -ano | findstr :3000` then `taskkill /PID <PID> /F`

2. Or change port in `.env` file:
```
PORT=3001
```

### "ModuleNotFoundError"
1. Make sure you're in the project directory
2. Run setup script again: `./setup.sh` (or `setup.bat`)
3. Check virtual environment is active

### "Connection refused"
1. Check if server is running (should see "Uvicorn running on...")
2. Try accessing http://localhost:3000 directly
3. Check if firewall is blocking the connection

## Testing Issues

### "pytest not found"
```bash
pip install pytest pytest-asyncio httpx
```

### "Tests fail with import errors"
```bash
export PYTHONPATH="${PYTHONPATH}:$(pwd)/backend/src"  # Linux/Mac
set PYTHONPATH=%PYTHONPATH%;%cd%\backend\src          # Windows
```

## Browser Issues

### Graph not displaying
1. Open browser developer tools (F12)
2. Check Console tab for JavaScript errors
3. Check Network tab for failed API requests
4. Try a simple expression like `x` first

### "Backend not available" error
1. Verify server is running (no errors in terminal)
2. Check you're accessing http://localhost:3000
3. Try refreshing the page

## Quick Reset

If everything is messed up, start fresh:

```bash
# Remove everything except your code
rm -rf venv/ __pycache__/ .coverage .pytest_cache/

# Run setup again
./setup.sh    # Linux/Mac
# or
setup.bat     # Windows
```

## Still Stuck?

1. Check the exact error message
2. Run `python backend/src/main.py` manually to see detailed errors
3. Verify Python version: `python --version` (should be 3.7+)
4. Check you're in the correct directory (should see `backend/` folder)

## Environment Variables

Create `.env` file if issues persist:
```env
HOST=127.0.0.1
PORT=3000
DEBUG=True
```