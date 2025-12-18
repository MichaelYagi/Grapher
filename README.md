# Grapher - Mathematical Function Plotter

A web-based mathematical function plotting tool with Python backend and D3.js frontend.

## ✨ Features

### Backend (Python/FastAPI)
- **🧮 Mathematical Expression Evaluation**: Parse and evaluate complex mathematical expressions using NumPy and numexpr
- **🔄 Multi-variable Support**: Handle expressions with multiple parameters and variables
- **⚡ High Performance**: Vectorized computations with intelligent caching
- **🛡️ Security**: Safe expression parsing with protection against code injection
- **📊 REST API**: Clean, documented API endpoints for frontend integration
- **🎯 Comprehensive Function Support**: Trigonometric, logarithmic, exponential, and polynomial functions

### Frontend (JavaScript/D3.js)
- **📈 Interactive Graphing**: Smooth, real-time graph rendering with D3.js
- **🔄 Dual Range System**: 
  - **Default Display**: [-10, 10] for focused view
  - **Full Computation**: [-30, 30] for comprehensive data
  - **Toggle Range**: Instantly switch between zoomed and full views
- **🎛️ Real-time Parameter Updates**: Interactive sliders for multi-variable expressions
- **🎨 Color-coded Interface**: Consistent color scheme across UI and graphs
- **📱 Responsive Design**: Works seamlessly on desktop and mobile devices
- **🔄 Offline Mode**: Limited functionality when backend is unavailable
- **📊 Multi-function Support**: Plot and manage multiple functions simultaneously
- **💾 Export Functionality**: Download graphs as PNG or SVG

## 🚀 Quick Start (1 command!)

### Linux/Mac:
```bash
./start.sh
```

### Windows:
```bash
start.bat
```

That's it! The app will be running at http://localhost:3000

### Alternatively:
```\backend\src> python -m uvicorn main:app --host <private_ip> --port 3000```

## 📋 What this command does:
- Installs dependencies automatically (handles managed environments)
- Starts server immediately
- Works in any Python environment (Linux, Mac, Windows)

**Note**: If you see "externally-managed-environment" message, that's normal! The script handles it automatically.

### If you want virtual environment (optional):
```bash
./quick-setup.sh  # Creates venv
./start_grapher.sh  # Uses venv
```

## 📋 What these commands do:

1. **`./setup.sh`** (or `setup.bat` on Windows):
   - Creates a Python virtual environment automatically
   - Installs all required dependencies
   - Creates startup scripts
   - Sets up configuration

2. **`./start_grapher.sh`** (or `start_grapher.bat`):
   - Activates the virtual environment
   - Starts the FastAPI server
   - Runs on http://localhost:3000

## 🌐 Access the Application

- **Main App**: http://localhost:3000
- **API Documentation**: http://localhost:3000/docs

## 📚 Detailed Documentation

### For Users:
- **[Usage Guide](docs/USAGE.md)** - How to use the application, examples, features

### For Developers:
- **[API Documentation](docs/API.md)** - REST API endpoints, architecture, security
- **[Development Guide](docs/DEVELOPMENT.md)** - Testing, configuration, project structure
- **[OpenSpec Process](docs/OPENSPEC.md)** - AI-assisted development methodology

## 🧪 Quick Test

```bash
# Run backend tests
cd backend && python -m pytest tests/ -v

# Run with coverage
cd backend && python -m pytest tests/ --cov=src
```

## 📄 License

This project is licensed under MIT License.