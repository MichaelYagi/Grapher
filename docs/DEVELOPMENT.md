# Grapher Development Guide

## 🧪 Testing

### Backend Tests
```bash
# Run all backend tests
cd backend && python -m pytest tests/ -v

# Run with coverage
cd backend && python -m pytest tests/ --cov=src --cov-report=html

# Run specific test file
cd backend && python -m pytest tests/test_api_endpoints.py -v

### All Tests
```bash
# Run complete test suite
npm run test

# Run with coverage for both backend and frontend
npm run test:coverage


### Quick Test Commands
```bash
# Fast development test
npm run test:backend && npm run test:frontend

# Before commit testing
npm run test:coverage

# Specific backend test file
python -m pytest tests/test_api_endpoints.py -v

# Specific frontend test file
npx jest backend/tests/test_frontend_unit_tests.js
```

### Test Coverage
- **Backend**: 95% overall coverage, 94% math_engine.py coverage (exceeded 90% target)
- **Frontend**: 75-80% statement coverage targeting >75%
- **Total**: 229 test cases across all modules, 100% passing

## 🔧 Configuration

### Environment Setup
Create `.env` file in backend directory:
```env
DEBUG=true
HOST=127.0.0.1
PORT=8000
ALLOWED_ORIGINS=["http://localhost:3000", "http://localhost:8000"]
CACHE_TTL=3600
MAX_EXPRESSION_LENGTH=1000
MAX_BATCH_SIZE=100
COMPUTATION_TIMEOUT=5.0


### Development Scripts
Available npm scripts in package.json:
- `npm start` - Start full server
- `npm run start:backend` - Backend only
- `npm run test` - Run all tests
- `npm run test:coverage` - Tests with coverage
- `npm run install:dev` - Install all dependencies

### Frontend Customization
Modify settings in JavaScript files:
- **Viewport Size**: `app.js` - adjust ranges in `this.ranges` object
- **Colors**: Update `functionColors` array in app.js
- **Default Range**: Change `currentRange` in app.js constructor

## 📁 Project Structure

Grapher/
├── backend/                    # Python FastAPI backend
│   ├── src/
│   │   ├── backend/
│   │   │   ├── api/           # API endpoints and models
│   │   │   │   ├── endpoints.py    # API route handlers
│   │   │   │   └── models.py      # Pydantic data models
│   │   │   ├── core/          # Core functionality
│   │   │   │   ├── math_engine.py # Mathematical computation engine
│   │   │   │   ├── cache.py      # Expression result caching
│   │   │   │   └── config.py     # Configuration management
│   │   │   └── __init__.py
│   │   ├── static/             # Frontend files
│   │   │   ├── index.html     # Main HTML file
│   │   │   └── js/
│   │   │       ├── api-client.js      # Backend API communication
│   │   │       ├── graph-renderer.js  # D3.js graph rendering
│   │   │       └── app.js            # Main application controller
│   │   └── main.py           # FastAPI application entry point
│   ├── tests/                # Backend tests
│   ├── requirements.txt      # Python dependencies
│   └── README.md            # Backend documentation
├── openspec/                # OpenSpec specifications and proposals
├── .gitignore
├── AGENTS.md              # AI assistant instructions
└── README.md               # This file


## 🚀 Recent Updates

### Version Improvements
- **Dual-Range System**: Implemented computation/display range separation
- **Code Optimization**: Removed duplicate functions and consolidated logic
- **Enhanced API**: Added batch evaluation and improved error handling
- **UI/UX**: Better function management and export features
- **Performance**: Improved caching and rendering optimizations

### Technical Debt Cleanup
- **Removed Duplicate Functions**: Eliminated redundant `parseExpression` methods
- **Consolidated Logic**: Extracted common expression processing to helper methods
- **Clean Architecture**: Simplified wrapper methods and improved code organization

## 🔮 Future Enhancements

- **3D Graphing**: Three-dimensional function visualization
- **Animation**: Time-based function visualization
- **Export Options**: Additional formats (PDF, CSV data)
- **Expression History**: Save and reuse favorite expressions
- **Advanced Mathematics**: Derivatives, integrals, and differential equations
- **Custom Themes**: User-selectable color schemes and layouts
- **Collaboration**: Share expressions and graphs with others
- **Parameter Optimization**: Automatic parameter tuning