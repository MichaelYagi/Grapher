# Grapher Usage Guide

## 🎯 Usage Examples

### Basic Function Plotting

1. **Enter a simple expression**:
   
   x^2 + 2*x + 1
   

2. **Click "Plot Function"** to see parabola with default [-10, 10] view

3. **Toggle Range** to see full [-30, 30] computed data

### Multi-variable Functions

1. **Enter an expression with parameters**:
   
   a*x^2 + b*sin(x)
   

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