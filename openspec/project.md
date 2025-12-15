# Project Context

## Purpose
Grapher is a modern, interactive web application for mathematical function visualization. It combines the computational power of Python with NumPy for backend processing and the visualization capabilities of D3.js for frontend rendering. The application allows users to plot, analyze, and interact with complex mathematical expressions in real-time.

## Tech Stack
### Backend
- **Python 3.8+**: Core language
- **FastAPI**: Modern, high-performance web framework
- **NumPy**: High-performance numerical computing
- **numexpr**: Fast expression evaluation
- **Pydantic**: Data validation and settings management
- **scipy**: Advanced mathematical functions and interpolation

### Frontend
- **JavaScript (ES6+)**: Core frontend language
- **D3.js v7**: Data-driven visualization library
- **HTML5/CSS3**: Modern web standards
- **Responsive Design**: Mobile-first approach

### Development Tools
- **OpenSpec**: Project specification and proposal management
- **Git**: Version control
- **pytest**: Backend testing
- **ESLint**: Code quality (when configured)

## Project Conventions

### Code Style
#### Python Backend
- **PEP 8 compliant**: Standard Python formatting
- **Type hints**: Mandatory for all function parameters and return values
- **Docstrings**: Comprehensive documentation for all public methods
- **Naming conventions**:
  - snake_case for variables and functions
  - PascalCase for classes
  - UPPER_CASE for constants

#### JavaScript Frontend
- **ES6+ features**: Modern JavaScript patterns
- **CamelCase**: For variables and functions
- **PascalCase**: For classes
- **JSDoc comments**: For complex functions
- **Modular design**: Clean separation of concerns

### Architecture Patterns
#### Backend Architecture
- **MVC-inspired**: Clear separation of concerns
  - **Models** (`api/models.py`): Data validation and API contracts
  - **Controllers** (`api/endpoints.py`): Request handling and business logic
  - **Core Services** (`core/`): Domain-specific functionality
- **Dependency Injection**: Clean service management
- **Error Handling**: Consistent error response patterns
- **Caching Strategy**: TTL-based in-memory caching

#### Frontend Architecture
- **Component-based**: Modular JavaScript structure
  - **GraphRenderer**: D3.js visualization management
  - **APIClient**: Backend communication
  - **GrapherApp**: Main application controller
- **Event-driven**: User interaction handling
- **State Management**: Centralized in main app controller
- **API Abstraction**: Clean separation between UI and backend

### Key Design Decisions
1. **Dual-Range System**: 
   - Computation range: Always [-30, 30] for consistency
   - Display range: Default [-10, 10] with toggle to [-30, 30]
   - Purpose: Focused default view with comprehensive data available

2. **Expression Processing Pipeline**:
   - Frontend validation → Backend parsing → Computation → Caching → Visualization
   - Security layers at multiple points

3. **Error Handling Strategy**:
   - Graceful degradation when backend unavailable
   - User-friendly error messages
   - Fallback to offline mode for basic functions

### Testing Strategy
#### Backend Testing
- **Unit Tests**: Individual function testing with `pytest`
- **Integration Tests**: API endpoint testing
- **Expression Testing**: Comprehensive mathematical function validation
- **Performance Tests**: Caching and computation benchmarks

#### Frontend Testing
- **Manual Testing**: Browser compatibility across major browsers
- **Responsive Testing**: Various screen sizes and devices
- **API Integration**: Network request/response validation
- **User Interaction**: Mouse and keyboard event handling

### Git Workflow
- **Main Branch**: `main` (production-ready)
- **Feature Branches**: `feature/description` for new development
- **Commit Convention**: 
  - `feat`: New features
  - `fix`: Bug fixes
  - `refactor`: Code improvements without functionality changes
  - `docs`: Documentation updates
- **Pull Request**: Required for all changes to main branch

## Domain Context

### Mathematical Function Support
The application supports comprehensive mathematical expressions:
- **Basic Operations**: Addition, subtraction, multiplication, division, exponentiation
- **Trigonometric**: sin, cos, tan, asin, acos, atan + hyperbolic variants
- **Logarithmic**: log, log10, log2, exp
- **Other**: sqrt, abs, floor, ceil, round, sign
- **Constants**: pi, e, tau

### Expression Evaluation Pipeline
1. **User Input**: Raw mathematical expression string
2. **Frontend Validation**: Basic syntax checking
3. **Backend Parsing**: AST-based safe parsing with parameter extraction
4. **Computation**: NumPy/numexpr evaluation over specified range
5. **Caching**: Result storage with parameter-specific keys
6. **Visualization**: D3.js rendering with interactive features

### Performance Considerations
- **Computational Range**: Fixed [-30, 30] ensures consistent data structure
- **Point Sampling**: Configurable density (default 1000 points)
- **Caching Strategy**: Expression + parameters + range = cache key
- **Memory Management**: Automatic cleanup of graph elements
- **Request Debouncing**: Prevents excessive API calls during parameter updates

## Important Constraints

### Security Constraints
- **Expression Validation**: AST-based parsing prevents code injection
- **Input Sanitization**: Length limits and character validation
- **Resource Limits**: Computation timeouts and memory constraints
- **CORS Configuration**: Restricted to approved origins

### Performance Constraints
- **Computation Timeout**: 5 seconds maximum per expression
- **Memory Usage**: Efficient data structures to prevent browser crashes
- **API Rate Limiting**: Debounced requests prevent overload
- **Cache TTL**: 1 hour default for expression results

### Functional Constraints
- **Single Variable**: Primary visualization for y = f(x) functions
- **Real-time Updates**: Parameter changes trigger immediate re-computation
- **Browser Compatibility**: Support for modern browsers with ES6+ features
- **Responsive Design**: Must work on desktop and mobile devices

## External Dependencies

### Backend Dependencies
- **FastAPI**: Web framework and API routing
- **NumPy**: Numerical computation and array operations
- **numexpr**: Optimized expression evaluation
- **Pydantic**: Data validation and serialization
- **scipy**: Advanced mathematical functions
- **uvicorn**: ASGI server (development)

### Frontend Dependencies
- **D3.js v7**: Data visualization and SVG manipulation
- **Modern Browser APIs**: Fetch API, ES6+ features
- **No build system**: Direct browser-based loading

### Development Dependencies
- **pytest**: Backend testing framework
- **OpenSpec**: Project specification management
- **Git**: Version control system

## Current Implementation Status

### ✅ Completed Features
1. **Core Functionality**
   - Mathematical expression parsing and evaluation
   - Real-time graph rendering with D3.js
   - Multi-variable parameter support with sliders
   - Basic error handling and validation

2. **Advanced Features**
   - Dual-range system (computation vs display)
   - Multiple function plotting with color coding
   - Graph export (PNG/SVG)
   - Expression caching for performance
   - Batch evaluation capabilities
   - Offline mode fallback

3. **User Interface**
   - Responsive design for mobile/desktop
   - Interactive parameter controls
   - Function management sidebar
   - Grid toggle and range toggle
   - Hover coordinate display

4. **Code Quality**
   - Duplicate function removal
   - Code consolidation and optimization
   - Type hints and documentation
   - Modular architecture

### 🔄 Current Development Focus
- Performance optimization
- UI/UX improvements
- Additional mathematical functions
- Enhanced error handling

### 📋 Future Roadmap
- 3D visualization capabilities
- Expression history and favorites
- Advanced mathematical operations (derivatives, integrals)
- Animation support
- Collaboration features
- Custom themes and layouts