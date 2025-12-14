# Grapher - Mathematical Function Visualizer

A modern, interactive web application for mathematical function visualization featuring a Python backend with NumPy computation and a D3.js frontend with real-time graphing capabilities.

![Grapher Preview](https://img.shields.io/badge/Python-3.8+-blue.svg)
![FastAPI](https://img.shields.io/badge/FastAPI-0.104+-green.svg)
![D3.js](https://img.shields.io/badge/D3.js-7.0+-orange.svg)
![License](https://img.shields.io/badge/License-MIT-yellow.svg)

## ✨ Features

### Backend (Python/FastAPI)
- **🧮 Mathematical Expression Evaluation**: Parse and evaluate complex mathematical expressions using NumPy and numexpr
- **🔄 Multi-variable Support**: Handle expressions with multiple parameters and variables
- **⚡ High Performance**: Vectorized computations with intelligent caching
- **🛡️ Security**: Safe expression parsing with protection against code injection
- **📊 REST API**: Clean, documented API endpoints for frontend integration

### Frontend (JavaScript/D3.js)
- **📈 Interactive Graphing**: Smooth, real-time graph rendering with D3.js
- **🎯 10x10 Equal Aspect Ratio**: Fixed viewport for consistent visualization (-5 to 5 on both axes)
- **🎛️ Real-time Parameter Updates**: Interactive sliders for multi-variable expressions
- **🎨 Color-coded Interface**: Consistent color scheme across UI and graphs
- **📱 Responsive Design**: Works seamlessly on desktop and mobile devices
- **🔄 Offline Mode**: Limited functionality when backend is unavailable

## 🚀 Quick Start

### Prerequisites

- Python 3.8 or higher
- Modern web browser (Chrome, Firefox, Safari, Edge)

### Installation

1. **Clone the repository**:
   ```bash
   git clone <repository-url>
   cd Grapher
   ```

2. **Set up the Python backend**:
   ```bash
   cd backend
   pip install -r requirements.txt
   ```

3. **Start the server**:
   ```bash
   cd src
   python start_server.py
   ```
   Navigate to `http://localhost:3000` in your browser

## 📁 Project Structure

```
Grapher/
├── backend/                    # Python FastAPI backend
│   ├── src/
│   │   ├── backend/
│   │   │   ├── api/           # API endpoints and models
│   │   │   ├── core/          # Core functionality (math, cache, config)
│   │   │   └── __init__.py
│   │   └── main.py           # FastAPI application entry point
│   ├── tests/                # Backend tests
│   ├── requirements.txt      # Python dependencies
│   └── README.md            # Backend documentation
├── frontend/                 # JavaScript/D3.js frontend
│   └── public/
│       ├── index.html       # Main HTML file
│       └── js/
│           ├── api-client.js      # Backend API communication
│           ├── graph-renderer.js  # D3.js graph rendering
│           ├── param-controller.js # Parameter controls
│           └── app.js            # Main application
├── openspec/                # OpenSpec specifications and proposals
├── .gitignore
└── README.md               # This file
```

## 🎯 Usage Examples

### Basic Function Plotting

1. **Enter a simple expression**:
   ```
   x^2 + 2*x + 1
   ```

2. **Click "Plot Function"** to see the parabola on the 10x10 graph

### Multi-variable Functions

1. **Enter an expression with parameters**:
   ```
   a*x^2 + b*sin(x)
   ```

2. **Adjust the sliders** that appear for `a` and `b` to see real-time updates

### Supported Mathematical Functions

- **Basic Operations**: `+`, `-`, `*`, `/`, `^`, `%`
- **Trigonometric**: `sin`, `cos`, `tan`, `asin`, `acos`, `atan`
- **Hyperbolic**: `sinh`, `cosh`, `tanh`
- **Logarithmic**: `log`, `log10`, `log2`, `exp`
- **Other**: `sqrt`, `abs`, `floor`, `ceil`, `round`, `sign`
- **Constants**: `pi`, `e`, `tau`

### Example Expressions

```
# Basic polynomial
x^3 - 2*x^2 + x - 1

# Trigonometric
sin(x) * cos(2*x)

# Complex multi-variable
a*x^2 + b*sin(x) + c

# Nested functions
sqrt(abs(x)) * log(x^2 + 1)

# Parametric-style
sin(x) * exp(-x^2/10)
```

## 🔧 API Documentation

### Expression Parsing
```http
POST /api/parse
Content-Type: application/json

{
    "expression": "a*x^2 + b*sin(x)"
}
```

**Response**:
```json
{
    "is_valid": true,
    "variables": ["a", "b", "x"],
    "error": null
}
```

### Expression Evaluation
```http
POST /api/evaluate
Content-Type: application/json

{
    "expression": "x^2",
    "variables": {},
    "x_range": [-5, 5],
    "num_points": 1000
}
```

**Response**:
```json
{
    "expression": "x^2",
    "graph_data": {
        "coordinates": [
            {"x": -5.0, "y": 25.0},
            {"x": -4.99, "y": 24.9},
            // ... more points
        ],
        "total_points": 1000,
        "valid_points": 1000,
        "x_range": [-5.0, 5.0],
        "y_range": [0.0, 25.0]
    },
    "evaluation_time_ms": 12.5
}
```

## 🎨 Interactive Features

### Graph Interactions
- **Hover Tracing**: Display coordinates and function values
- **Reset View**: Return to default 10x10 viewport
- **Toggle Grid**: Show/hide background grid lines

### Parameter Controls
- **Real-time Sliders**: Adjust parameters and see instant graph updates
- **Color Coding**: Each parameter has a unique color for easy identification
- **Double-click Reset**: Quickly reset parameters to default values

### Keyboard Shortcuts
- **Enter**: Plot the current expression
- **Ctrl/Cmd + R**: Reset all parameters to defaults

## 🧪 Testing

### Backend Tests
```bash
cd backend/tests
python test_math_engine.py
```

### Frontend Testing
- Open browser developer tools
- Test different browsers and screen sizes
- Verify API integration in network tab

## 🔧 Configuration

### Backend Environment Variables
Create a `.env` file in the backend directory:

```env
DEBUG=true
HOST=127.0.0.1
PORT=8000
ALLOWED_ORIGINS=["http://localhost:3000"]
CACHE_TTL=3600
MAX_EXPRESSION_LENGTH=1000
MAX_BATCH_SIZE=100
COMPUTATION_TIMEOUT=5.0
```

### Frontend Customization
Modify settings in the JavaScript files:
- **Viewport Size**: `graph-renderer.js` - adjust xRange, yRange
- **Colors**: Update color schemes in component files
- **Parameter Ranges**: `param-controller.js` - slider limits

## 🏗️ Architecture

### Backend Architecture
- **FastAPI**: Modern Python web framework
- **NumPy**: High-performance numerical computing
- **numexpr**: Fast expression evaluation
- **Pydantic**: Data validation and settings
- **In-memory Cache**: Performance optimization

### Frontend Architecture
- **D3.js**: Data-driven document manipulation
- **Modular JavaScript**: Clean separation of concerns
- **API Client**: Robust backend communication
- **Responsive Design**: Mobile-first approach

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

### Frontend
- **Request Debouncing**: Prevents excessive API calls
- **Efficient Rendering**: D3.js optimization techniques
- **Memory Management**: Automatic cleanup of graph elements
- **Lazy Loading**: Components loaded as needed

## 🔮 Future Enhancements

- **Multiple Function Plotting**: Display several functions simultaneously
- **3D Graphing**: Three-dimensional function visualization
- **Export Functionality**: Save graphs as PNG, SVG, or PDF
- **Expression History**: Save and reuse favorite expressions
- **Advanced Mathematics**: Derivatives, integrals, and differential equations
- **Custom Themes**: User-selectable color schemes and layouts
- **Collaboration**: Share expressions and graphs with others

## 🐛 Troubleshooting

### Common Issues

1. **Backend Connection Failed**:
   - Ensure backend is running on `localhost:8000`
   - Check firewall settings
   - Verify Python dependencies are installed

2. **Graph Not Displaying**:
   - Check browser console for errors
   - Verify D3.js is loading correctly
   - Test with a simple expression like `x`

3. **Parameter Sliders Not Working**:
   - Check expression syntax
   - Ensure variables are properly named
   - Verify backend is responding to parameter updates

### Error Messages

- **"Backend not available"**: Backend service is not running
- **"Invalid expression syntax"**: Check mathematical expression format
- **"Network error"**: Connection issues with backend
- **"Computation timeout"**: Expression too complex or resource constraints

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📞 Support

For questions, issues, or contributions:

- **Issues**: [GitHub Issues](https://github.com/your-repo/grapher/issues)
- **Discussions**: [GitHub Discussions](https://github.com/your-repo/grapher/discussions)
- **Documentation**: Check the `backend/README.md` and `frontend/README.md` for detailed information

---

**Built with ❤️ for mathematics and visualization enthusiasts**