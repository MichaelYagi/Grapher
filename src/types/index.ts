// Core application types

export interface Expression {
  id: string;
  formula: string;
  variables: Variable[];
  color: string;
  visible: boolean;
  compiledFunction?: CompiledFunction;
  isValid: boolean;
  errorMessage?: string;
}

export interface Variable {
  name: string;
  value: number;
  min?: number;
  max?: number;
  step?: number;
  isParameter: boolean; // true if it's a user-adjustable parameter
  color?: string;
}

export interface CompiledFunction {
  evaluate: (x: number, params?: Record<string, number>) => number;
  derivative?: (x: number, params?: Record<string, number>) => number;
  variables: string[];
  parameters: string[];
}

export interface Viewport {
  xMin: number;
  xMax: number;
  yMin: number;
  yMax: number;
  scale: number; // pixels per unit
}

export interface GraphPoint {
  x: number;
  y: number;
  screenX?: number;
  screenY?: number;
  expressionId?: string;
}

export interface GraphBounds {
  minX: number;
  maxX: number;
  minY: number;
  maxY: number;
}

// Validation and parsing types
export interface ValidationResult {
  isValid: boolean;
  errorMessage?: string;
  warnings?: string[];
  variables?: string[];
  compiledFunction?: CompiledFunction;
}

export interface Token {
  type: TokenType;
  value: string;
  position: number;
}

export enum TokenType {
  NUMBER = 'NUMBER',
  VARIABLE = 'VARIABLE',
  OPERATOR = 'OPERATOR',
  FUNCTION = 'FUNCTION',
  LEFT_PAREN = 'LEFT_PAREN',
  RIGHT_PAREN = 'RIGHT_PAREN',
  COMMA = 'COMMA',
  EOF = 'EOF'
}

export interface ASTNode {
  type: ASTNodeType;
  value?: string | number;
  children?: ASTNode[];
  left?: ASTNode;
  right?: ASTNode;
  position?: number;
}

export enum ASTNodeType {
  NUMBER = 'NUMBER',
  VARIABLE = 'VARIABLE',
  BINARY_OPERATION = 'BINARY_OPERATION',
  UNARY_OPERATION = 'UNARY_OPERATION',
  FUNCTION_CALL = 'FUNCTION_CALL',
  PARAMETER_LIST = 'PARAMETER_LIST'
}

// UI Theme types
export type Theme = 'light' | 'dark' | 'high-contrast';

export interface ThemeConfig {
  name: Theme;
  colors: Record<string, string>;
  isHighContrast: boolean;
}

// Performance monitoring types
export interface PerformanceMetrics {
  parseTime: number;
  compileTime: number;
  evaluationTime: number;
  renderTime: number;
  cacheHitRate: number;
  memoryUsage: number;
}

export interface CacheEntry<T> {
  key: string;
  value: T;
  timestamp: number;
  accessCount: number;
  size: number;
}

// Event types
export interface GraphInteractionEvent {
  type: 'click' | 'hover' | 'pan' | 'zoom';
  x: number;
  y: number;
  screenX: number;
  screenY: number;
  expressionId?: string;
  point?: GraphPoint;
}

export interface ParameterChangeEvent {
  variableName: string;
  oldValue: number;
  newValue: number;
  expressionId: string;
}

// Configuration types
export interface GraphConfig {
  lineWidth: number;
  samplingDensity: number;
  enableAntialiasing: boolean;
  enableGrid: boolean;
  enableAxes: true;
  backgroundColor: string;
  gridColor: string;
  axesColor: string;
  maxExpressions: number;
}

export interface AppConfig {
  theme: Theme;
  autoSave: boolean;
  performanceMonitoring: boolean;
  maxCacheSize: number;
  animationDuration: number;
}