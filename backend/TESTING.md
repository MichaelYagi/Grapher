# Testing Guide for Grapher

## 🧪 Running Tests

### Backend Tests (Python)

#### Prerequisites
```bash
# Install test dependencies
cd backend
pip install pytest pytest-asyncio httpx

# Ensure you're in the backend directory
cd backend
```

#### Run All Backend Tests
```bash
# Run all tests with verbose output
python -m pytest tests/ -v

# Run with coverage
python -m pytest tests/ -v --cov=src --cov-report=html --cov-report=term

# Run specific test file
python -m pytest tests/test_api_endpoints.py -v
python -m pytest tests/test_math_engine.py -v
python -m pytest tests/test_normalization.py -v
python -m pytest tests/test_cache_system.py -v
python -m pytest tests/test_math_engine_edge_cases.py -v
python -m pytest tests/test_integration.py -v
```

#### Run Specific Test Categories
```bash
# Run only API endpoint tests
python -m pytest tests/test_api_endpoints.py -v -k "test_parse"

# Run only edge case tests
python -m pytest tests/test_math_engine_edge_cases.py -v -k "test_security"

# Run only performance tests
python -m pytest tests/test_integration.py -v -k "performance"
```

### Frontend Tests (JavaScript)

#### Prerequisites
```bash
# Install Node.js dependencies
npm install

# Or install globally if preferred
npm install -g jest jest-environment-jsdom
```

#### Run All Frontend Tests
```bash
# Run frontend unit tests
npm run test:frontend

# Run with coverage
npm run test:frontend -- --coverage

# Run tests in watch mode for development
npm run test:frontend -- --watch
```

#### Run Specific Frontend Tests
```bash
# Run specific test files
npx jest backend/tests/test_frontend_unit_tests.js

# Run tests matching pattern
npx jest --testNamePattern="APIClient"

# Run tests with coverage report
npx jest --coverage --coverageReporters=html
```

### Run All Tests (Both Backend and Frontend)

#### Complete Test Suite
```bash
# Run all tests (backend + frontend)
npm run test

# Run with coverage for both
npm run test:coverage
```

## 🔍 Test Categories

### Backend Test Files
1. **test_api_endpoints.py** - All REST API endpoints
2. **test_math_engine.py** - Basic mathematical functions
3. **test_normalization.py** - Expression normalization
4. **test_cache_system.py** - Caching behavior
5. **test_math_engine_edge_cases.py** - Edge cases and security
6. **test_integration.py** - End-to-end workflows

### Frontend Test Categories
1. **API Client Tests** - Backend communication
2. **Graph Renderer Tests** - D3.js visualization
3. **App Controller Tests** - Main application logic
4. **Integration Tests** - Complete user workflows

## 📊 Coverage Reports

### Backend Coverage
```bash
# Generate HTML coverage report
python -m pytest tests/ --cov=src --cov-report=html

# View coverage report
open tests/htmlcov/index.html

# Generate coverage for specific module
python -m pytest tests/test_api_endpoints.py --cov=src/backend/api --cov-report=html
```

### Frontend Coverage
```bash
# Generate coverage report
npm run test:frontend -- --coverage --coverageReporters=html

# View coverage report
open coverage/lcov-report/index.html
```

## ⚡ Quick Test Commands

### Development Testing
```bash
# Fast backend test during development
python -m pytest tests/test_math_engine.py -v --tb=short

# Fast frontend test during development
npm run test:frontend -- --watch --testPathPattern="GraphRenderer"
```

### Before Commit Testing
```bash
# Run full test suite before committing
npm run test:coverage

# Or run with specific focus
python -m pytest tests/ -v -k "not slow"
```

### CI/CD Testing
```bash
# Run tests in headless mode (CI)
CI=true npm run test

# Run with specific configuration
TEST_ENV=ci npm run test:backend
```

## 🐛 Debugging Tests

### Backend Debugging
```bash
# Run with maximum verbosity
python -m pytest tests/ -v -s --tb=long

# Stop on first failure
python -m pytest tests/ -x

# Run with debugger
python -m pytest tests/ --pdb

# Run specific failing test
python -m pytest tests/test_api_endpoints.py::TestParseEndpoint::test_parse_valid_simple_expression -v -s
```

### Frontend Debugging
```bash
# Run with verbose output
npx jest --verbose

# Run tests for specific file
npx jest backend/tests/test_frontend_unit_tests.js --verbose

# Run with Node.js debugging
node --inspect-brk node_modules/.bin/jest backend/tests/test_frontend_unit_tests.js
```

## 🔧 Test Configuration

### Backend Configuration
Create `pytest.ini` in backend directory:
```ini
[tool:pytest]
testpaths = tests
python_files = test_*.py
python_classes = Test*
python_functions = test_*
addopts = 
    -v
    --tb=short
    --strict-markers
    --disable-warnings
markers =
    slow: marks tests as slow (deselect with -m "not slow")
    integration: marks tests as integration tests
    unit: marks tests as unit tests
    security: marks tests as security tests
    performance: marks tests as performance tests
```

### Frontend Configuration
Jest configuration is in `package.json` and `backend/tests/jest.setup.js`.

## 📋 Test Results Interpretation

### Success Indicators
- **Backend**: All tests pass with no failures
- **Frontend**: All Jest tests pass, coverage report generated
- **Integration**: End-to-end workflows complete successfully

### Coverage Targets
- **Backend**: Aim for >80% line coverage
- **Frontend**: Aim for >75% statement coverage
- **Critical**: All security and edge case tests pass

## 🚨 Common Issues & Solutions

### Import Errors
```bash
# Python path issues
export PYTHONPATH="${PYTHONPATH}:$(pwd)/backend/src"

# Node.js module issues
npm install  # Install dependencies
```

### Test Environment Issues
```bash
# Clean test environment
python -m pytest tests/ --cache-clear
npm run test:frontend -- --clearCache
```

### Permission Issues
```bash
# macOS/Linux permission fixes
chmod +x backend/tests/*.py
```

## 🔄 Continuous Testing

### During Development
```bash
# Backend: Watch for changes and re-run tests
watchdog -p "*.py" -c "python -m pytest tests/ -v"

# Frontend: Jest watch mode
npm run test:frontend -- --watch
```

### Pre-commit Hooks
```bash
# Install pre-commit hooks
pip install pre-commit
pre-commit install

# Run tests before commit
pre-commit run pytest
```

This comprehensive testing setup ensures reliability of both backend and frontend components!