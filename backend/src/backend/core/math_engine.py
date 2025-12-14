import ast
import operator
import numpy as np
import numexpr as ne
from typing import Dict, List, Set, Tuple, Any, Optional, Union
import re
import math
from scipy import optimize
from scipy.ndimage import uniform_filter1d

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
        self.latex_mapping = {
            r'\\frac\{([^}]+)\}\{([^}]+)\}': r'(\1)/(\2)',
            r'\\sqrt\{([^}]+)\}': r'sqrt(\1)',
            r'\\sin': r'sin',
            r'\\cos': r'cos', 
            r'\\tan': r'tan',
            r'\\log': r'log',
            r'\\exp': r'exp',
            r'\\pi': r'pi',
            r'\\infty': 'inf',
            r'\^': '**',
            r'\\cdot': '*',
            r'\\times': '*',
            r'\\div': '/',
            r'\\leq': '<=',
            r'\\geq': '>=',
            r'\\neq': '!=',
            r'\\approx': '~=',
        }
        
        self.html_entity_mapping = {
            '&sup2;': '^2',
            '&sup3;': '^3',
            '&sdot;': '*',
            '&times;': '*',
            '&divide;': '/',
            '&le;': '<=',
            '&ge;': '>=',
            '&ne;': '!=',
            '&approx;': '~=',
            '&pi;': 'pi',
            '&infin;': 'inf',
        }
    
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
    
    def parse_expression_type(self, expression: str) -> str:
        """Determine if expression is implicit, parametric, or explicit function"""
        # Check for explicit implicit equations first
        if '=' in expression and not any(op in expression for op in ['<', '>', '<=', '>=', '!=']):
            return "implicit"
        # Check for parametric - only if it looks like x(t) or y(t) specifically
        elif re.search(r'[xy]\s*\(', expression):
            return "parametric"
        else:
            return "explicit"
    
    def convert_latex_to_ascii(self, expression: str) -> str:
        """Convert LaTeX expressions to ASCII format"""
        result = expression
        for latex_pattern, ascii_replacement in self.latex_mapping.items():
            result = re.sub(latex_pattern, ascii_replacement, result)
        return result
    
    def convert_html_entities(self, expression: str) -> str:
        """Convert HTML entities to ASCII format"""
        result = expression
        for html_entity, ascii_replacement in self.html_entity_mapping.items():
            result = result.replace(html_entity, ascii_replacement)
        return result
    
    def add_implicit_multiplication(self, expression: str) -> str:
        """Add explicit multiplication operators for implicit multiplication cases"""
        result = expression
        
        # Define mathematical function names that should NOT be broken up
        function_names = [
            'sin', 'cos', 'tan', 'log', 'exp', 'sqrt', 'abs', 'asin', 'acos', 'atan',
            'sinh', 'cosh', 'tanh', 'log10', 'log2', 'floor', 'ceil', 'round', 'sign'
        ]
        
        # Step 1: Handle function-variable cases first (highest priority)
        # sinx -> sin(x), cosx -> cos(x), etc.
        for func in function_names:
            # Handle sinx -> sin(x) where x is a single variable
            result = re.sub(rf'{func}([a-zA-Z])(?!\w)', rf'{func}(\1)', result)
        
        # Step 2: Handle number-function cases
        # 2sin(x) -> 2*sin(x), 2sin -> 2*sin
        for func in function_names:
            # Handle 2sin(x) -> 2*sin(x)
            result = re.sub(rf'(\d+){func}\s*\(', rf'\1*{func}(', result)
            # Handle 2sin -> 2*sin (standalone function name)
            result = re.sub(rf'(\d+){func}(?!\w)', rf'\1*{func}', result)
        
        # Step 3: Handle variable-function cases
        # xsin(x) -> x*sin(x), xsin -> x*sin, xcosy -> x*cos(y)
        for func in function_names:
            # Handle xsin(x) -> x*sin(x)
            result = re.sub(rf'([a-zA-Z]){func}\s*\(', rf'\1*{func}(', result)
            # Handle xcosy -> x*cos(y) where y is a single variable
            result = re.sub(rf'([a-zA-Z]){func}([a-zA-Z])(?!\w)', rf'\1*{func}(\2)', result)
            # Handle xsin -> x*sin (standalone function name)
            result = re.sub(rf'([a-zA-Z]){func}(?!\w)(?!\()', rf'\1*{func}', result)
        
        # Step 4: Handle function-function cases (after function-variable is handled)
        # This should now work on sin(x)cosy -> sin(x)*cos(y) and sin(x)cos(y) -> sin(x)*cos(y)
        for func1 in function_names:
            for func2 in function_names:
                # Handle func1(x)func2y -> func1(x)*func2(y)
                result = re.sub(rf'({func1}\([^)]*\))({func2})([a-zA-Z])(?!\w)', rf'\1*\2(\3)', result)
                # Handle func1(x)func2( -> func1(x)*func2(
                result = re.sub(rf'({func1}\([^)]*\))({func2})\s*\(', rf'\1*\2(', result)
                # Handle func1(x)func2(y) -> func1(x)*func2(y) (NEW CASE)
                result = re.sub(rf'({func1}\([^)]*\))({func2})\s*\(\s*([a-zA-Z]+)\s*\)', rf'\1*\2(\3)', result)
        
        # Step 4.5: Handle remaining function-variable cases that might have been missed
        # This catches cases like sinx in sinxcosy that weren't processed earlier
        for func in function_names:
            result = re.sub(rf'{func}([a-zA-Z])(?!\w)', rf'{func}(\1)', result)
        
        # Step 5: Handle basic cases
        # 2x -> 2*x
        result = re.sub(r'(\d)([a-zA-Z])', r'\1*\2', result)
        
        # 2(x+1) -> 2*(x+1)
        result = re.sub(r'(\d)\s*\(', r'\1*(', result)
        
        # x(y+1) -> x*(y+1), but NOT sin(x)
        # First protect function calls with parentheses
        for func in function_names:
            result = re.sub(rf'\b{func}\s*\(', f'FUNC_{func}_CALL_', result)
        
        result = re.sub(r'([a-zA-Z])\s*\(', r'\1*(', result)
        
        # Restore function calls
        for func in function_names:
            result = result.replace(f'FUNC_{func}_CALL_', f'{func}(')
        
        # (x+1)2 -> (x+1)*2
        result = re.sub(r'\)(\d)', r')*\1', result)
        
        # (x+1)y -> (x+1)*y
        result = re.sub(r'\)([a-zA-Z])', r')*\1', result)
        
        # (x+1)(y+2) -> (x+1)*(y+2)
        result = re.sub(r'\)\s*\(', r')*(', result)
        
        # Step 6: Handle simple variable-variable cases only (avoid breaking function names)
        # Only handle the most obvious cases: consecutive single letters that are clearly variables
        # Use a very conservative approach to avoid breaking function names
        
        # Only apply to patterns that are clearly not function names
        # Look for single letter followed by single letter, where neither is part of a function name
        # This is a simplified approach that handles the most common cases safely
        
        # Handle xy, xz, yz, etc. but only when they're standalone
        # Use negative lookbehind and lookahead to avoid function names
        result = re.sub(r'(?<!\w)([a-zA-Z])([a-zA-Z])(?!\w)', r'\1*\2', result)
        
        # Apply again for cases like xyz -> xy*z -> x*y*z
        result = re.sub(r'(?<!\w)([a-zA-Z])([a-zA-Z])(?!\w)', r'\1*\2', result)
        
        return result
    
    def preprocess_expression(self, expression: str) -> str:
        """Preprocess expression by converting LaTeX and HTML entities and adding implicit multiplication"""
        # Convert HTML entities first
        expression = self.convert_html_entities(expression)
        # Then convert LaTeX
        expression = self.convert_latex_to_ascii(expression)
        # Finally add implicit multiplication
        expression = self.add_implicit_multiplication(expression)
        return expression
    
    def validate_expression(self, expression: str) -> Tuple[bool, Optional[str]]:
        """Validate if the expression is syntactically correct and safe"""
        try:
            # Check expression type first
            expr_type = self.parse_expression_type(expression)
            
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
            ]
            
            # Allow '=' for implicit equations, block for other types
            if expr_type != 'implicit' and '=' in expression:
                return False, "Assignment operator (=) not supported in this context. For implicit equations, use format like 'x^2 + y^2 = 1'"
            
            for pattern in unsupported_patterns:
                if re.search(pattern, expression, re.IGNORECASE):
                    return False, f"Unsupported expression construct: {pattern}"
            
            # For implicit equations, validate both sides separately
            if expr_type == 'implicit':
                if '=' not in expression:
                    return False, "Implicit equation must contain '=' sign"
                
                parts = expression.split('=', 1)
                if len(parts) != 2:
                    return False, "Invalid implicit equation format"
                
                left_side = parts[0].strip()
                right_side = parts[1].strip()
                
                # Try to parse both sides
                try:
                    ast.parse(left_side, mode='eval')
                    ast.parse(right_side, mode='eval')
                except SyntaxError as e:
                    return False, f"Syntax error in implicit equation: {e}"
                
                return True, None
            
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
                ast.IfExp, ast.Attribute, ast.BitXor, ast.Pow,
                ast.Add, ast.Sub, ast.Mult, ast.Div, ast.Mod,
                ast.UAdd, ast.USub, ast.FloorDiv,
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
    
    def solve_implicit_equation(self, equation: str, x_range: Tuple[float, float], 
                               num_points: int = 1000, params: Dict[str, float] = None) -> Tuple[np.ndarray, np.ndarray]:
        """
        Solve implicit equation f(x, y) = 0 for coordinate pairs
        Returns (x_coords, y_coords) for plotting
        """
        try:
            # Preprocess the equation
            equation = self.parser.preprocess_expression(equation)
            
            # Handle common implicit equation patterns
            equation = equation.replace('**', '^')
            
            # Simple pattern matching for common equations
            import re

            # x=5 or y=-6
            simple_match = re.search(r'([xy])\s*=\s*(-?\d+(?:\.\d+)?)', equation)
            if simple_match:
                if simple_match.group(1) == 'x':
                    x_coords = [float(simple_match.group(2)), float(simple_match.group(2))]
                    y_coords = [10.0, -10.0]
                elif simple_match.group(1) == 'y':
                    x_coords = [10.0, -10.0]
                    y_coords = [float(simple_match.group(2)), float(simple_match.group(2))]
                else:
                    x_coords = [float(simple_match.group(2)), float(simple_match.group(2))]
                    y_coords = [10.0, -10.0]

                return x_coords, y_coords
            
            # Circle: x^2 + y^2 = r^2
            if re.search(r'x\^2\s*\+\s*y\^2\s*=', equation):
                match = re.search(r'=\s*(\d+(?:\.\d+)?)', equation)
                if match:
                    radius_squared = float(match.group(1))
                    radius = np.sqrt(radius_squared)
                    angles = np.linspace(0, 2*np.pi, num_points)
                    x_coords = radius * np.cos(angles)
                    y_coords = radius * np.sin(angles)
                    return x_coords, y_coords
            
            # Ellipse: x^2/a^2 + y^2/b^2 = 1 or x^2/a + y^2/b = 1
            ellipse_match = re.search(r'x\^2\s*/\s*(\d+(?:\.\d+)?)\s*\+\s*y\^2(?:\s*/\s*(\d+(?:\.\d+)?))?\s*=\s*1', equation)
            if ellipse_match:
                a_val = float(ellipse_match.group(1))
                b_val = float(ellipse_match.group(2)) if ellipse_match.group(2) else 1.0
                
                # a_val and b_val are the denominators, so semi-axes are sqrt of them
                a = np.sqrt(a_val)
                b = np.sqrt(b_val)
                
                angles = np.linspace(0, 2*np.pi, num_points)
                x_coords = a * np.cos(angles)
                y_coords = b * np.sin(angles)
                return x_coords, y_coords
            
            # Fallback: return empty arrays
            return np.array([]), np.array([])
            
        except Exception as e:
            raise ValueError(f"Implicit equation solving failed: {str(e)[:100]}")
    
    def _finite_difference(self, x_val: float, y_val: float, func, h: float = 1e-6) -> float:
        """Calculate finite difference approximation of derivative"""
        return (func(x_val, y_val + h) - func(x_val, y_val - h)) / (2 * h)
    
    def evaluate_parametric(self, x_expr: str, y_expr: str, t_range: Tuple[float, float], 
                           num_points: int = 1000, params: Dict[str, float] = None) -> Tuple[np.ndarray, np.ndarray]:
        """
        Evaluate parametric equations x(t), y(t)
        """
        try:
            # Preprocess expressions
            x_expr = self.parser.preprocess_expression(x_expr)
            y_expr = self.parser.preprocess_expression(y_expr)
            
            # Generate t values
            t_values = np.linspace(t_range[0], t_range[1], num_points)
            
            # Prepare evaluation context
            context = {
                **MATH_FUNCTIONS, **MATH_CONSTANTS,
                **(params or {})
            }
            
            # Evaluate x(t) and y(t)
            context['t'] = t_values
            x_values = ne.evaluate(self.parser.compile_expression(x_expr), local_dict=context)
            y_values = ne.evaluate(self.parser.compile_expression(y_expr), local_dict=context)
            
            # Handle infinite values
            x_values = np.where(np.isfinite(x_values), x_values, np.nan)
            y_values = np.where(np.isfinite(y_values), y_values, np.nan)
            
            return x_values, y_values
            
        except Exception as e:
            raise ValueError(f"Parametric evaluation failed: {e}")
    
    def parse_and_classify_expression(self, expression: str) -> Dict[str, Any]:
        """
        Parse expression and classify its type with detailed information
        """
        try:
            # Preprocess expression
            processed_expr = self.parser.preprocess_expression(expression)

            # Determine expression type
            expr_type = self.parser.parse_expression_type(processed_expr)
            
            # For implicit equations, handle directly without AST parsing
            if expr_type == 'implicit':
                if '=' not in processed_expr:
                    return {
                        'original_expression': expression,
                        'processed_expression': processed_expr,
                        'type': 'error',
                        'variables': [],
                        'is_valid': False,
                        'error': 'Implicit equation must contain = sign',
                        'primary_variable': None,
                        'parameters': []
                    }
                
                # Split into left and right sides
                parts = processed_expr.split('=', 1)
                if len(parts) != 2:
                    return {
                        'original_expression': expression,
                        'processed_expression': processed_expr,
                        'type': 'error',
                        'variables': [],
                        'is_valid': False,
                        'error': 'Invalid implicit equation format',
                        'primary_variable': None,
                        'parameters': []
                    }
                
                left_side = parts[0].strip()
                right_side = parts[1].strip()
                
                # Extract variables from both sides
                all_variables = set()
                try:
                    all_variables.update(self.parser.extract_variables(left_side))
                    all_variables.update(self.parser.extract_variables(right_side))
                except:
                    # If variable extraction fails, do basic extraction
                    import re
                    all_variables.update(re.findall(r'\b[a-zA-Z]\b', processed_expr))
                
                return {
                    'original_expression': expression,
                    'processed_expression': processed_expr,
                    'type': 'implicit',
                    'variables': list(all_variables),
                    'is_valid': True,
                    'error': None,
                    'primary_variable': 'x' if 'x' in all_variables else None,
                    'parameters': [v for v in all_variables if v not in ['x', 'y', 't']],
                    'equation_parts': {
                        'left': left_side,
                        'right': right_side
                    }
                }
            
            # For explicit expressions, use normal parsing
            variables = self.parser.extract_variables(processed_expr)
            is_valid, error_msg = self.parser.validate_expression(processed_expr)
            
            result = {
                'original_expression': expression,
                'processed_expression': processed_expr,
                'type': expr_type,
                'variables': list(variables),
                'is_valid': is_valid,
                'error': error_msg,
                'primary_variable': 'x' if 'x' in variables else None,
                'parameters': [v for v in variables if v not in ['x', 'y', 't']]
            }
            
            return result
            
        except Exception as e:
            return {
                'original_expression': expression,
                'processed_expression': expression,
                'type': 'error',
                'variables': [],
                'is_valid': False,
                'error': f'Parse error: {str(e)}',
                'primary_variable': None,
                'parameters': []
            }
    
    def _parse_implicit_equation(self, equation: str) -> Dict[str, str]:
        """Parse implicit equation into left and right parts"""
        if '=' not in equation:
            return {'left': equation, 'right': '0'}
        
        parts = equation.split('=', 1)
        return {
            'left': parts[0].strip(),
            'right': parts[1].strip()
        }
    
    def _parse_parametric_expression(self, expression: str) -> Dict[str, str]:
        """Parse parametric expression components"""
        # This is a simplified parser - in production would be more robust
        return {
            'raw': expression,
            'note': 'Parametric parsing to be enhanced'
        }
    
    def generate_graph_data(self, expression: str, x_range: Tuple[float, float] = (-5, 5), 
                          num_points: int = 1000, params: Dict[str, float] = None) -> Dict[str, Any]:
        """Generate coordinate data for graphing an expression (with preprocessing)"""
        try:
            # Preprocess the expression to handle implicit multiplication
            processed_expression = self.parser.preprocess_expression(expression)
            
            # Generate x coordinates
            x_values = np.linspace(x_range[0], x_range[1], num_points)
            
            # Evaluate expression
            y_values = self.evaluate_expression(processed_expression, x_values, params)
            
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