# Grapher Backend

A FastAPI-based Python backend service for mathematical expression evaluation and graphing, designed to work with the Grapher frontend application.

## Features

- **Mathematical Expression Evaluation**: Parse and evaluate complex mathematical expressions using NumPy
- **Multi-variable Support**: Handle expressions with multiple parameters and variables
- **High Performance**: Uses NumPy and numexpr for vectorized computations
- **Caching**: Built-in caching layer for frequently computed expressions
- **REST API**: Clean RESTful interface for frontend integration
- **Security**: Safe expression parsing with protection against code injection

## Installation

1. **Install Python dependencies**:
   ```bash
   cd backend
   pip install -r requirements.txt
   ```

2. **Set up environment variables**:
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

## Running the Backend

### Development Mode

```bash
cd backend/src
python main.py
```

The server will start on `http://localhost:8000` by default.

### Production Mode

```bash
cd backend/src
uvicorn main:app --host 0.0.0.0 --port 8000 --workers 4
```

## API Endpoints

### Expression Parsing
- **POST** `/api/parse`
  - Parse and validate mathematical expressions
  - Returns variables and validation status

### Expression Evaluation
- **POST** `/api/evaluate`
  - Evaluate expression and generate graph coordinates
  - Supports parameter substitution and custom ranges

### Batch Evaluation
- **POST** `/api/batch-evaluate`
  - Evaluate multiple expressions in parallel
  - Optimized for performance

### Parameter Updates
- **POST** `/api/update-params`
  - Update expression parameters and get new graph data
  - Optimized for real-time interactions

### Health Check
- **GET** `/api/health`
  - Check service health status

## API Usage Examples

### Parse Expression
```javascript
const response = await fetch('http://localhost:8000/api/parse', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ expression: 'a*x^2 + b*sin(x)' })
});
const result = await response.json();
// Returns: { is_valid: true, variables: ['a', 'b', 'x'] }
```

### Evaluate Expression
```javascript
const response = await fetch('http://localhost:8000/api/evaluate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
        expression: 'x^2',
        variables: {},
        x_range: [-5, 5],
        num_points: 1000
    })
});
const result = await response.json();
// Returns graph coordinates and metadata
```

## Supported Mathematical Functions

- **Basic Operations**: `+`, `-`, `*`, `/`, `^` (power), `%` (modulo)
- **Trigonometric**: `sin`, `cos`, `tan`, `asin`, `acos`, `atan`
- **Hyperbolic**: `sinh`, `cosh`, `tanh`
- **Logarithmic**: `log`, `log10`, `log2`, `exp`
- **Other**: `sqrt`, `abs`, `floor`, `ceil`, `round`, `sign`
- **Constants**: `pi`, `e`, `tau`

## Configuration

The backend can be configured using environment variables:

- `DEBUG`: Enable debug mode (default: true)
- `HOST`: Server host (default: 127.0.0.1)
- `PORT`: Server port (default: 8000)
- `ALLOWED_ORIGINS`: CORS allowed origins
- `CACHE_TTL`: Cache time-to-live in seconds (default: 3600)
- `MAX_EXPRESSION_LENGTH`: Maximum expression length (default: 1000)
- `MAX_BATCH_SIZE`: Maximum batch size (default: 100)
- `COMPUTATION_TIMEOUT`: Computation timeout in seconds (default: 5.0)
- `MAX_POINTS_PER_GRAPH`: Maximum points per graph (default: 10000)

## Testing

Run the math engine tests:

```bash
cd backend/tests
python test_math_engine.py
```

## Architecture

- **FastAPI**: Modern, fast web framework for building APIs
- **NumPy**: High-performance numerical computing
- **numexpr**: Fast expression evaluation
- **Pydantic**: Data validation and settings management
- **Uvicorn**: ASGI server

## Security Features

- **Expression Validation**: AST-based parsing prevents code injection
- **Input Sanitization**: Comprehensive input validation
- **Resource Limits**: Timeout and size limits to prevent abuse
- **CORS Configuration**: Proper cross-origin resource sharing setup

## Performance Optimizations

- **Vectorized Computation**: NumPy arrays for efficient numerical operations
- **Expression Caching**: Cache frequently computed results
- **Parallel Processing**: Batch evaluation for multiple expressions
- **Intelligent Sampling**: Adaptive point generation for graphs

## Error Handling

The API provides detailed error responses with:
- Error messages and descriptions
- Error codes for programmatic handling
- HTTP status codes following REST conventions

## Development

### Adding New Mathematical Functions

1. Add the function to `MATH_FUNCTIONS` in `math_engine.py`
2. Update the validation list if needed
3. Add tests for the new function

### Extending the API

1. Define new request/response models in `api/models.py`
2. Add new endpoints in `api/endpoints.py`
3. Update the main router if needed

## License

This project is part of the Grapher mathematical visualization system.