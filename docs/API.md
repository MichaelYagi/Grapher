# Grapher API Documentation

## 🔧 API Documentation

### Expression Parsing
```http
POST /api/parse
Content-Type: application/json

{
    "expression": "a*x^2 + b*sin(x)"
}


**Response**:
```json
{
    "is_valid": true,
    "variables": ["a", "b", "x"],
    "error": null,
    "expression_type": "mathematical",
    "parameters": ["a", "b"],
    "primary_variable": "x"
}


### Expression Evaluation
```http
POST /api/evaluate
Content-Type: application/json

{
    "expression": "x^2",
    "variables": {},
    "x_range": [-30, 30],
    "num_points": 1000
}


**Response**:
```json
{
    "expression": "x^2",
    "graph_data": {
        "coordinates": [
            {"x": -30.0, "y": 900.0},
            {"x": -29.94, "y": 896.4},
            // ... more points
        ],
        "total_points": 1000,
        "valid_points": 1000,
        "x_range": [-30.0, 30.0],
        "y_range": [0.0, 900.0]
    },
    "evaluation_time_ms": 12.5
}


### Batch Evaluation
```http
POST /api/batch-evaluate
Content-Type: application/json

{
    "expressions": ["x^2", "sin(x)", "x*sin(x)"],
    "variables": {},
    "x_range": [-30, 30],
    "num_points": 1000
}


## 🏗️ Architecture

### Backend Architecture
- **FastAPI**: Modern Python web framework
- **NumPy**: High-performance numerical computing
- **numexpr**: Fast expression evaluation
- **Pydantic**: Data validation and settings
- **In-memory Cache**: Performance optimization with TTL
- **Comprehensive Error Handling**: Graceful degradation

### Frontend Architecture
- **D3.js**: Data-driven document manipulation
- **Modular JavaScript**: Clean separation of concerns
- **API Client**: Robust backend communication with debouncing
- **Responsive Design**: Mobile-first approach
- **Event-driven**: Efficient state management

### Key Design Patterns
- **Dual-Range System**: Separate computation and display ranges
- **State Management**: Centralized in main app controller
- **Component Separation**: Renderer, API client, and UI controller
- **Error Handling**: Graceful fallbacks and user feedback

## 🛡️ Security Features

- **Expression Validation**: AST-based parsing prevents code injection
- **Input Sanitization**: Comprehensive validation on both client and server
- **Resource Limits**: Timeout and size limits prevent abuse
- **CORS Configuration**: Proper cross-origin setup
- **Error Handling**: Secure error messages without information leakage

## 📈 Performance Optimizations

### Backend
- **Vectorized Computation**: NumPy arrays for efficiency
- **Expression Caching**: Cache frequently computed results
- **Parallel Processing**: Batch evaluation support
- **Intelligent Sampling**: Adaptive point generation
- **Memory Management**: Efficient data structures

### Frontend
- **Request Debouncing**: Prevents excessive API calls
- **Efficient Rendering**: D3.js optimization techniques
- **Memory Management**: Automatic cleanup of graph elements
- **Lazy Loading**: Components loaded as needed
- **Viewport Optimization**: Efficient range switching