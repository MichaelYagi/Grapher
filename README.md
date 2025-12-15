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

## 🚀 Quick Start

### Prerequisites

- Python 3.8 or higher
- Modern web browser (Chrome, Firefox, Safari, Edge)

### Installation

1. **Clone repository**:
   ```bash
   git clone <repository-url>
   cd Grapher
   ```

2. **Set up Python backend**:
   ```bash
   cd backend
   pip install -r requirements.txt
   ```

3. **Start server**:
   ```bash
   # Option 1: Start backend and frontend separately
   cd backend/src
   python main.py
   # Then open backend/src/static/index.html in browser
   
   # Option 2: Use convenience scripts
   python start_backend.py    # Starts backend only
   python start_server.py     # Starts backend and serves frontend
   ```
   Navigate to `http://localhost:8000` in browser

## 📁 Project Structure

```
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
```

## 🎯 Usage Examples

### Basic Function Plotting

1. **Enter a simple expression**:
   ```
   x^2 + 2*x + 1
   ```

2. **Click "Plot Function"** to see parabola with default [-10, 10] view

3. **Toggle Range** to see full [-30, 30] computed data

### Multi-variable Functions

1. **Enter an expression with parameters**:
   ```
   a*x^2 + b*sin(x)
   ```

2. **Adjust sliders** that appear for `a` and `b` to see real-time updates

### Multiple Functions

1. **Plot multiple functions** - each gets unique color
2. **Manage functions** in the sidebar:
   - Toggle visibility on/off
   - Delete individual functions
   - Delete all functions

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

# Parametric-style (shows full range benefit)
sin(x) * exp(-x^2/10)

# Large range example (toggle to see full behavior)
x*sin(x)
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
    "error": null,
    "expression_type": "mathematical",
    "parameters": ["a", "b"],
    "primary_variable": "x"
}
```

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
```

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
```

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
```

## 🎨 Interactive Features

### Graph Interactions
- **Hover Tracing**: Display coordinates and function values
- **Toggle Range**: Switch between [-10, 10] and [-30, 30] views
- **Toggle Grid**: Show/hide background grid lines
- **Download Export**: Save graphs as PNG or SVG

### Function Management
- **Multiple Functions**: Plot unlimited functions simultaneously
- **Color Coding**: Each function gets unique color from palette
- **Visibility Control**: Show/hide individual functions
- **Batch Operations**: Delete all, show all, hide all
- **Function List**: Organized sidebar with expression display

### Parameter Controls
- **Real-time Sliders**: Adjust parameters and see instant graph updates
- **Color Coding**: Each parameter has a unique color for easy identification
- **Double-click Reset**: Quickly reset parameters to default values

### Keyboard Shortcuts
- **Enter**: Plot current expression
- **Ctrl/Cmd + R**: Reset all parameters to defaults

## 🎯 Range System Details

### Dual-Range Architecture
1. **Computation Range**: Always [-30, 30]
   - Ensures complete data for all functions
   - Consistent backend processing
   - Full context for complex functions

2. **Display Range**: Default [-10, 10], toggleable to [-30, 30]
   - Starts focused on central behavior
   - Can expand to see full computed range
   - Smooth transitions between views

3. **Reset Behavior**: Returns to [-10, 10] default view
   - Maintains consistent user experience
   - Preserves computational data integrity

## 🧪 Testing

### Backend Tests
```bash
cd backend/tests
python test_math_engine.py
python test_normalization.py
```

### Frontend Testing
- Open browser developer tools
- Test different browsers and screen sizes
- Verify API integration in network tab
- Test range toggle functionality

## 🔧 Configuration

### Backend Environment Variables
Create a `.env` file in backend directory:

```env
DEBUG=true
HOST=127.0.0.1
PORT=8000
ALLOWED_ORIGINS=["http://localhost:3000", "http://localhost:8000"]
CACHE_TTL=3600
MAX_EXPRESSION_LENGTH=1000
MAX_BATCH_SIZE=100
COMPUTATION_TIMEOUT=5.0
```

### Frontend Customization
Modify settings in JavaScript files:
- **Viewport Size**: `app.js` - adjust ranges in `this.ranges` object
- **Colors**: Update `functionColors` array in app.js
- **Default Range**: Change `currentRange` in app.js constructor

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

3. **Range Toggle Not Working**:
   - Ensure functions are plotted with full computation range
   - Check for JavaScript errors in console
   - Verify backend is returning complete data

4. **Parameter Sliders Not Working**:
   - Check expression syntax
   - Ensure variables are properly named
   - Verify backend is responding to parameter updates

### Error Messages

- **"Backend not available"**: Backend service is not running
- **"Invalid expression syntax"**: Check mathematical expression format
- **"Network error"**: Connection issues with backend
- **"Computation timeout"**: Expression too complex or resource constraints

## 📄 License

This project is licensed under MIT License - see [LICENSE](LICENSE) file for details.

## 🤝 Contributing

1. Fork repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Development Guidelines
- Follow existing code style and patterns
- Add tests for new features
- Update documentation for API changes
- Ensure both ranges (-30,30 computation and -10,10 default display) work correctly

## 📞 Support

For questions, issues, or contributions:

- **Issues**: [GitHub Issues](https://github.com/your-repo/grapher/issues)
- **Discussions**: [GitHub Discussions](https://github.com/your-repo/grapher/discussions)
- **Documentation**: Check `backend/README.md` for detailed API information

---

**Built with ❤️ for mathematics and visualization enthusiasts**