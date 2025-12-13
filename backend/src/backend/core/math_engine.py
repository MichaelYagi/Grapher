import ast
import operator
import numpy as np
import numexpr as ne
from typing import Dict, List, Set, Tuple, Any, Optional
import re
import math

# Supported mathematical functions and constants
MATH_FUNCTIONS = {
    'sin': np.sin,
    'cos': np.cos,
    'tan': np.tan,
    'asin': np.arcsin,
    'acos': np.arccos,
    'atan': np.arctan,
    'sinh': np.sinh,
    'cosh': np.cosh,
    'tanh': np.tanh,
    'exp': np.exp,
    'log': np.log,
    'log10': np.log10,
    'log2': np.log2,
    'sqrt': np.sqrt,
    'abs': np.abs,
    'floor': np.floor,
    'ceil': np.ceil,
    'round': np.round,
    'sign': np.sign,
}

MATH_CONSTANTS = {
    'pi': np.pi,
    'e': np.e,
    'tau': 2 * np.pi,
}

OPERATORS = {
    ast.Add: operator.add,
    ast.Sub: operator.sub,
    ast.Mult: operator.mul,
    ast.Div: operator.truediv,
    ast.Pow: operator.pow,
    ast.Mod: operator.mod,
    ast.USub: operator.neg,
    ast.UAdd: operator.pos,
    ast.BitXor: operator.pow,  # Treat ^ as exponentiation
}

class ExpressionParser:
    def __init__(self):
        self.compiled_expressions = {}
    
    def extract_variables(self, expression: str) -> Set[str]:
        """Extract variable names from a mathematical expression"""
        try:
            # Parse the expression into an AST
            tree = ast.parse(expression, mode='eval')
            
            variables = set()
            
            # Walk the AST and collect variable names
            for node in ast.walk(tree):
                if isinstance(node, ast.Name):
                    # Exclude mathematical functions and constants
                    if node.id not in MATH_FUNCTIONS and node.id not in MATH_CONSTANTS:
                        variables.add(node.id)
            
            return variables
        except Exception as e:
            raise ValueError(f"Failed to parse expression: {e}")
    
    def validate_expression(self, expression: str) -> Tuple[bool, Optional[str]]:
        """Validate if the expression is syntactically correct and safe"""
        try:
            # Check for unsupported constructs in function expressions
            unsupported_patterns = [
                r'__.*__',  # dunder methods
                r'import\s+',
                r'exec\s*\(',
                r'eval\s*\(',
                r'open\s*\(',
                r'file\s*\(',
                r'input\s*\(',
                r'globals\s*\(',
                r'locals\s*\(',
                r'vars\s*\(',
                r'dir\s*\(',
                r'=',  # Assignment operator (not supported in function expressions)
            ]
            
            for pattern in unsupported_patterns:
                if re.search(pattern, expression, re.IGNORECASE):
                    if pattern == r'=':
                        return False, "Assignment operator (=) not supported. Enter expressions like 'x^2' instead of 'y = x^2'"
                    else:
                        return False, f"Unsupported expression construct: {pattern}"
            
            # Try to parse the expression
            tree = ast.parse(expression, mode='eval')
            
            # Check for unsupported AST nodes
            allowed_nodes = {
                ast.Expression, ast.BinOp, ast.UnaryOp, ast.Constant,
                ast.Name, ast.Load, ast.Call, ast.Subscript,
                ast.ListComp, ast.SetComp, ast.DictComp, ast.GeneratorExp,
                ast.Compare, ast.Eq, ast.NotEq, ast.Lt, ast.LtE, ast.Gt, ast.GtE,
                ast.Is, ast.IsNot, ast.In, ast.NotIn,
                ast.BoolOp, ast.And, ast.Or, ast.Not,
                ast.IfExp, ast.Attribute, ast.BitXor,
            }
            
            for node in ast.walk(tree):
                if type(node) not in allowed_nodes:
                    return False, f"Unsupported expression construct: {type(node).__name__}"
            
            return True, None
            
        except SyntaxError as e:
            return False, f"Syntax error: {e}"
        except Exception as e:
            return False, f"Validation error: {e}"
    
    def compile_expression(self, expression: str) -> Optional[str]:
        """Compile expression to optimized numexpr format for faster evaluation"""
        try:
            # Replace mathematical functions with numexpr-compatible versions
            compiled_expr = expression
            
            # Replace common mathematical notation
            compiled_expr = re.sub(r'\^', '**', compiled_expr)  # ^ to **
            compiled_expr = re.sub(r'pi\b', 'pi', compiled_expr)
            compiled_expr = re.sub(r'e\b', 'e', compiled_expr)
            
            # Cache the compiled expression
            expr_hash = hash(expression)
            self.compiled_expressions[expr_hash] = compiled_expr
            
            return compiled_expr
            
        except Exception as e:
            raise ValueError(f"Failed to compile expression: {e}")

class ExpressionEvaluator:
    def __init__(self):
        self.parser = ExpressionParser()
    
    def evaluate_expression(self, expression: str, x_values: np.ndarray, 
                          params: Dict[str, float] = None) -> np.ndarray:
        """Evaluate expression for given x values and parameters"""
        try:
            # Validate expression
            is_valid, error_msg = self.parser.validate_expression(expression)
            if not is_valid:
                raise ValueError(error_msg)
            
            # Compile expression
            compiled_expr = self.parser.compile_expression(expression)
            
            # Prepare evaluation context
            context = {
                'x': x_values,
                **MATH_FUNCTIONS,
                **MATH_CONSTANTS,
                **(params or {})
            }
            
            # Add any missing variables from parameters
            variables = self.parser.extract_variables(expression)
            for var in variables:
                if var != 'x' and var not in context:
                    if var in params:
                        context[var] = params[var]
                    else:
                        # If variable not provided, assume it's 0
                        context[var] = 0.0
            
            # Evaluate using numexpr for better performance
            result = ne.evaluate(compiled_expr, local_dict=context)
            
            # Handle infinite values and NaN
            result = np.where(np.isfinite(result), result, np.nan)
            
            return result
            
        except Exception as e:
            raise ValueError(f"Expression evaluation failed: {e}")
    
    def evaluate_single_point(self, expression: str, x: float, 
                            params: Dict[str, float] = None) -> float:
        """Evaluate expression at a single point"""
        x_array = np.array([x])
        result = self.evaluate_expression(expression, x_array, params)
        return float(result[0]) if not np.isnan(result[0]) else float('nan')
    
    def generate_graph_data(self, expression: str, x_range: Tuple[float, float] = (-5, 5), 
                          num_points: int = 1000, params: Dict[str, float] = None) -> Dict[str, Any]:
        """Generate coordinate data for graphing an expression"""
        try:
            # Generate x coordinates
            x_values = np.linspace(x_range[0], x_range[1], num_points)
            
            # Evaluate expression
            y_values = self.evaluate_expression(expression, x_values, params)
            
            # Filter out invalid points (NaN, infinite)
            valid_mask = np.isfinite(y_values)
            x_valid = x_values[valid_mask]
            y_valid = y_values[valid_mask]
            
            # Create coordinate pairs
            coordinates = []
            for i in range(len(x_valid)):
                coordinates.append({
                    'x': float(x_valid[i]),
                    'y': float(y_valid[i])
                })
            
            return {
                'coordinates': coordinates,
                'total_points': len(x_values),
                'valid_points': len(x_valid),
                'x_range': x_range,
                'y_range': [float(np.nanmin(y_values)), float(np.nanmax(y_values))] if len(y_valid) > 0 else [0, 0]
            }
            
        except Exception as e:
            raise ValueError(f"Failed to generate graph data: {e}")

# Global evaluator instance
evaluator = ExpressionEvaluator()