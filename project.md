# Project Context

## Purpose
Grapher is a 2D mathematical function graphing application that allows users to input algebraic formulas and visualize them on an interactive graph. The application supports multiple input formats including plain ASCII characters, HTML entities, and LaTeX syntax, providing real-time graph updates with validation feedback.

## Current Status
- **Phase**: Project initialization and planning
- **Progress**: OpenSpec configuration complete, technical specifications defined
- **Next Steps**: Choose frontend framework (React/TypeScript vs alternatives), setup development environment

## Tech Stack
- **Frontend**: React + TypeScript (planned)
- **Backend**: Python (FastAPI/Flask for equation parsing and evaluation) (planned)
- **Styling**: Tailwind CSS + CSS Modules (planned)
- **Build Tools**: Vite (planned)
- **Testing**: Vitest (frontend), pytest (backend) (planned)
- **Graph Rendering**: D3.js + Canvas API or Plotly.js (decision pending)
- **Math Parsing**: SymPy (Python backend), KaTeX (frontend LaTeX rendering) (planned)
- **Communication**: REST API or WebSocket for real-time updates (decision pending)

## Project Conventions

### Code Style
- ESLint + Prettier configuration with TypeScript strict mode
- camelCase for variables and functions, PascalCase for components
- 2-space indentation, single quotes for strings
- Functional components with React hooks
- Type-safe interfaces for all data structures

### Architecture Patterns
- Component-based architecture with separation of concerns
- State management using React Context API + useReducer
- Modular file structure: components/, hooks/, services/, types/
- API layer abstraction for backend communication
- Error boundary implementation for graceful error handling

### Testing Strategy
- Unit tests for mathematical parsing and evaluation functions
- Component tests for UI interactions
- Integration tests for API communication
- E2E tests for critical user workflows (equation input → graph rendering)
- Minimum 80% code coverage requirement

### Git Workflow
- Feature branch development with descriptive names
- Conventional commit messages (feat:, fix:, docs:, etc.)
- Pull request reviews required for all changes
- Automated CI/CD pipeline for testing and deployment

## Domain Context
- Mathematical expression parsing and validation
- Coordinate system transformations (screen ↔ mathematical coordinates)
- Support for common functions: polynomials, trigonometric, logarithmic, exponential
- Graph scaling and viewport management
- Mathematical notation rendering (LaTeX to visual representation)

## Important Constraints
- Browser compatibility: modern browsers supporting ES2020+
- Performance: smooth rendering with multiple functions simultaneously
- Accessibility: WCAG 2.1 AA compliance for keyboard navigation and screen readers
- Security: safe evaluation of mathematical expressions (no code injection)
- Input validation: comprehensive error handling for malformed expressions

## External Dependencies
- **Mathematical Computing**: SymPy (Python) for symbolic computation
- **LaTeX Rendering**: KaTeX for fast mathematical notation display
- **Graph Visualization**: D3.js for custom graph rendering or Plotly.js for pre-built components
- **HTTP Client**: Axios or fetch API for backend communication
- **Build Tools**: Vite for fast development and optimized builds
