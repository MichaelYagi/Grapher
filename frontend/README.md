# Grapher Frontend

A modern, interactive web application for mathematical function visualization, built with D3.js and designed to work seamlessly with the Grapher Python backend.

## Features

- **Interactive Graphing**: Smooth, real-time graph rendering with D3.js
- **10x10 Equal Aspect Ratio Viewport**: Fixed viewport for consistent visualization
- **Real-time Parameter Updates**: Interactive sliders for multi-variable expressions
- **Color-coded Functions**: Consistent color scheme across UI and graphs
- **Responsive Design**: Works on desktop and mobile devices
- **Offline Mode**: Limited functionality when backend is unavailable
- **Expression Validation**: Real-time syntax checking and error reporting

## File Structure

```
frontend/
├── public/
│   ├── index.html          # Main HTML file
│   └── js/
│       ├── api-client.js   # Backend API communication
│       ├── graph-renderer.js  # D3.js graph rendering
│       ├── param-controller.js # Parameter slider controls
│       └── app.js          # Main application controller
└── README.md               # This file
```

## Quick Start

### Option 1: Live Server (Recommended)

1. **Start the backend service**:
   ```bash
   cd backend/src
   python main.py
   ```

2. **Serve the frontend**:
   ```bash
   cd frontend/public
   python -m http.server 3000
   ```
   Or use any other static file server (Node.js http-server, VS Code Live Server, etc.)

3. **Open your browser**:
   Navigate to `http://localhost:3000`

### Option 2: Direct File Access

You can also open `frontend/public/index.html` directly in your browser, but some features may be limited due to CORS restrictions.

## Browser Compatibility

- **Chrome/Edge**: Full support
- **Firefox**: Full support  
- **Safari**: Full support
- **Mobile Browsers**: Supported with responsive design

## Core Components

### GraphRenderer (`graph-renderer.js`)

Handles all D3.js visualization:

```javascript
// Create a new graph renderer
const graph = new GraphRenderer('graph', {
    width: 600,
    height: 600,
    xRange: [-5, 5],
    yRange: [-5, 5]
});

// Plot a function
graph.plotFunction('x^2', coordinates, 0);
```

**Features:**
- 10x10 equal aspect ratio viewport
- Colorful axes and grid
- Interactive hover tracing
- Smooth animations
- Responsive resizing

### ApiClient (`api-client.js`)

Manages communication with the Python backend:

```javascript
// Evaluate expression
const result = await apiClient.evaluateExpression(
    'x^2 + 2*x + 1',
    { a: 1, b: 2 },
    [-5, 5],
    1000
);
```

**Features:**
- Automatic error handling
- Request debouncing
- Timeout management
- Batch request support
- Offline fallback

### ParameterController (`param-controller.js`)

Creates interactive parameter sliders:

```javascript
// Set up parameters
const paramController = new ParameterController('parameters-container');
paramController.setParameters(['a', 'b', 'c'], 'a*x^2 + b*x + c');

// Listen for changes
paramController.onParametersChanged((params) => {
    console.log('Parameters changed:', params);
});
```

**Features:**
- Color-coded sliders
- Real-time updates
- Keyboard shortcuts
- Accessibility support
- Animation capabilities

### GrapherApp (`app.js`)

Main application controller that coordinates all components:

```javascript
// Initialize app
const app = new GrapherApp();

// Plot expression programmatically
app.plotExpression('sin(x) * cos(2*x)');

// Set parameters
app.setParameters({ a: 2.5, b: -1.0 });
```

## Usage Examples

### Basic Function Plotting

1. Enter a mathematical expression in the input field
2. Click "Plot Function" or press Enter
3. The function will be rendered on the 10x10 graph

### Multi-variable Functions

1. Enter an expression with parameters: `a*x^2 + b*sin(x)`
2. Slider controls will appear for variables `a` and `b`
3. Adjust sliders to see real-time graph updates

### Supported Expressions

- **Basic**: `x^2 + 2*x + 1`
- **Trigonometric**: `sin(x) + cos(2*x)`
- **Complex**: `a*x^2 + b*sin(x) + c`
- **Nested**: `sqrt(x^2 + 1) * log(abs(x) + 1)`

## Interactive Features

### Graph Interactions

- **Hover**: Display coordinates and function values
- **Reset View**: Return to default 10x10 viewport
- **Toggle Grid**: Show/hide background grid

### Keyboard Shortcuts

- **Enter**: Plot the current expression
- **Ctrl/Cmd + R**: Reset all parameters to defaults

### Parameter Controls

- **Slider**: Adjust parameter values
- **Double-click**: Reset parameter to default
- **Real-time**: Graph updates as you drag

## API Integration

The frontend automatically detects backend availability:

- **Backend Available**: Full functionality with Python evaluation
- **Backend Unavailable**: Limited offline mode with basic JavaScript evaluation

### Error Handling

- **Network Errors**: Automatic retry and fallback
- **Invalid Expressions**: Detailed error messages
- **Timeout Protection**: Prevents hanging requests

## Customization

### Colors

Modify the color schemes in `graph-renderer.js`:

```javascript
const colors = {
    axis: {
        x: '#2563eb',  // Blue x-axis
        y: '#dc2626',  // Red y-axis
        grid: '#e5e7eb' // Light gray grid
    },
    functions: [
        '#8b5cf6', '#10b981', '#f59e0b', '#ef4444'
    ]
};
```

### Viewport Settings

Change the default viewport in `graph-renderer.js`:

```javascript
const options = {
    xRange: [-5, 5],  // 10x10 viewport
    yRange: [-5, 5],
    width: 600,
    height: 600
};
```

### Parameter Ranges

Adjust parameter slider ranges in `param-controller.js`:

```javascript
const options = {
    sliderMin: -10,
    sliderMax: 10,
    sliderStep: 0.1
};
```

## Development

### Adding New Features

1. **New Mathematical Functions**: Update backend first, then frontend validation
2. **UI Components**: Follow existing patterns with consistent styling
3. **Graph Features**: Extend `GraphRenderer` class with new methods

### Testing

Test different browsers and screen sizes:
- Desktop (Chrome, Firefox, Safari, Edge)
- Mobile (iOS Safari, Android Chrome)
- Tablet (iPad Safari, Android Chrome)

### Debug Mode

Enable console logging for debugging:

```javascript
// In browser console
window.grapherApp.debug = true;
```

## Performance Considerations

- **Graph Rendering**: Uses D3.js for efficient SVG manipulation
- **Request Debouncing**: Prevents excessive API calls
- **Caching**: Backend caching for repeated expressions
- **Memory Management**: Automatic cleanup of graph elements

## Accessibility

- **Keyboard Navigation**: Full keyboard support
- **Screen Reader**: ARIA labels and descriptions
- **High Contrast**: Color schemes with proper contrast ratios
- **Focus Management**: Logical tab order and focus indicators

## Security

- **Input Validation**: Client-side and server-side validation
- **XSS Prevention**: Safe DOM manipulation with D3.js
- **HTTPS Recommended**: Use secure connections in production

## Browser DevTools

Use browser developer tools to debug:

1. **Network Tab**: Monitor API requests
2. **Console**: View application logs
3. **Elements**: Inspect DOM and SVG structure
4. **Performance**: Profile graph rendering performance

## Troubleshooting

### Common Issues

1. **Backend Not Found**: Ensure backend is running on `localhost:8000`
2. **CORS Errors**: Check backend CORS configuration
3. **Graph Not Rendering**: Verify D3.js is loaded
4. **Parameters Not Working**: Check expression syntax and variable names

### Error Messages

- **"Backend not available"**: Backend service is not running
- **"Invalid expression syntax"**: Check mathematical expression format
- **"Network error"**: Connection issues with backend

## Future Enhancements

- Multiple function plotting
- 3D graphing capabilities
- Export functionality (PNG, SVG, PDF)
- Expression history and favorites
- Custom themes and color schemes
- Advanced mathematical operations (derivatives, integrals)