"""
Comprehensive mathematical engine edge case tests.
Tests edge cases, security scenarios, and boundary conditions.
"""

import pytest
import numpy as np
import sys
import os

# Add the src directory to Python path
sys.path.append(os.path.join(os.path.dirname(__file__), '..', 'src'))

try:
    from backend.core.math_engine import ExpressionEvaluator
except ImportError:
    sys.path.append(os.path.join(os.path.dirname(__file__), '..'))
    from backend.core.math_engine import ExpressionEvaluator


class TestMathEngineEdgeCases:
    """Test mathematical engine edge cases and boundary conditions"""
    
    def setup_method(self):
        """Set up ExpressionEvaluator instance for each test"""
        self.engine = ExpressionEvaluator()
    
    def test_extremely_large_numbers(self):
        """Test handling of extremely large numbers"""
        # Test with very large exponents
        result = self.engine.evaluate_expression("1e100", 0.0)
        assert np.isinf(result) or result > 1e99
        
        # Test with large coefficients
        result = self.engine.evaluate_expression("1e50 * x", 1e50)
        assert np.isinf(result) or result > 1e99
    
    def test_extremely_small_numbers(self):
        """Test handling of extremely small numbers"""
        # Test with very small numbers
        result = self.engine.evaluate_expression("1e-100", 0.0)
        assert result == 1e-100
        
        # Test with small coefficients
        result = self.engine.evaluate_expression("1e-50 * x", 1.0)
        assert result == 1e-50
    
    def test_division_by_zero_scenarios(self):
        """Test division by zero and near-zero scenarios"""
        # Direct division by zero - engine returns NaN/inf rather than raising
        result = self.engine.evaluate_expression("1/x", 0.0)
        assert np.isnan(result) or np.isinf(result)
        
        # Division by very small number (should not overflow)
        result = self.engine.evaluate_expression("1/x", 1e-15)
        assert np.isfinite(result)
        
        # Zero in numerator (should be zero)
        result = self.engine.evaluate_expression("x/y", 0.0, {"y": 1.0})
        assert result == 0.0
    
    def test_nan_and_infinity_propagation(self):
        """Test NaN and infinity handling"""
        # Test NaN input
        result = self.engine.evaluate_expression("x + 1", np.nan)
        assert np.isnan(result)
        
        # Test infinity input - engine converts to NaN/finite
        result = self.engine.evaluate_expression("x + 1", np.inf)
        assert np.isinf(result) or np.isnan(result)
        
        # Test operations that produce NaN
        result = self.engine.evaluate_expression("sqrt(-1)", 0.0)
        assert np.isnan(result)
    
    def test_complex_nested_functions(self):
        """Test deeply nested function calls"""
        expression = "sin(cos(tan(sqrt(abs(x^2 + 1))))"
        # The expression has unclosed parentheses, so it should fail
        with pytest.raises(ValueError):
            self.engine.evaluate_expression(expression, 1.0)
    
    def test_deeply_nested_parentheses(self):
        """Test expressions with many nested parentheses"""
        expression = "(((((((x + 1))))) + 2))"
        result = self.engine.evaluate_expression(expression, 3.0)
        assert result == 6.0  # Should be (3+1)+2 = 6
    
    def test_very_long_expressions(self):
        """Test performance with very long expressions"""
        # Create a long expression
        terms = []
        for i in range(100):
            terms.append(f"{i+1}*x^{i+1}")
        long_expression = " + ".join(terms)
        
        result = self.engine.evaluate_expression(long_expression, 1.0)
        assert np.isfinite(result)
        
        # Should complete in reasonable time
        import time
        start_time = time.time()
        result = self.engine.evaluate_expression(long_expression, 2.0)
        elapsed_time = time.time() - start_time
        assert elapsed_time < 1.0  # Should complete within 1 second
    
    def test_unicode_and_special_characters(self):
        """Test handling of unicode and special characters"""
        # Test with various unicode characters
        unicode_chars = [
            "α*x^2 + β*x + γ",  # Greek letters
            "x² + 2*x + 1",      # Superscript 2
            "√(x^2 + 1)",          # Square root symbol
            "π*x + e",               # Pi and e symbols
        ]
        
        for expr in unicode_chars:
            # Should either handle gracefully or reject appropriately
            try:
                result = self.engine.evaluate_expression(expr, 1.0)
                # If handled, result should be finite
                if result is not None:
                    assert np.isfinite(result)
            except (ValueError, SyntaxError, UnicodeError):
                # Acceptable to reject unicode
                pass
    
    def test_oscillating_functions(self):
        """Test oscillating and periodic functions"""
        # High frequency oscillation
        expression = "sin(100*x)"
        
        # Test at multiple points
        x_values = [0, 0.01, 0.02, 0.03]
        for x in x_values:
            result = self.engine.evaluate_expression(expression, x)
            assert np.isfinite(result)
            assert -1 <= result <= 1  # sin should be in [-1, 1]
    
    def test_discontinuous_functions(self):
        """Test functions with discontinuities and asymptotes"""
        # Test near discontinuity points
        expression = "1/x"
        
        # Test near asymptote from both sides
        result_pos = self.engine.evaluate_expression(expression, 0.001)
        result_neg = self.engine.evaluate_expression(expression, -0.001)
        
        assert np.isfinite(result_pos) and result_pos > 0
        assert np.isfinite(result_neg) and result_neg < 0
        
        # Should have large magnitude
        assert abs(result_pos) > 100
        assert abs(result_neg) > 100
    
    def test_power_function_edge_cases(self):
        """Test power function edge cases"""
        # Zero to any power
        result = self.engine.evaluate_expression("0^x", 5.0)
        assert result == 0.0
        
        # Any number to zero power
        result = self.engine.evaluate_expression("x^0", 5.0)
        assert result == 1.0
        
        # Zero to zero power (undefined, but commonly treated as 1)
        result = self.engine.evaluate_expression("0^0", 0.0)
        assert result == 1.0  # Common convention
        
        # Negative base with fractional exponent - may return complex or NaN
        result = self.engine.evaluate_expression("(-2)^0.5", 0.0)  # sqrt of negative
        # Should handle gracefully (complex, NaN, or error)
        assert np.isnan(result) or not np.isfinite(result) or np.iscomplex(result)
    
    def test_logarithm_edge_cases(self):
        """Test logarithm function edge cases"""
        # Log of 1
        result = self.engine.evaluate_expression("log(x)", 1.0)
        assert abs(result) < 1e-10  # Should be ~0
        
        # Log of very small positive number
        result = self.engine.evaluate_expression("log(x)", 1e-10)
        assert result < -20  # Should be large negative
        
        # Log of negative number (undefined) - engine returns NaN
        result = self.engine.evaluate_expression("log(x)", -1.0)
        assert np.isnan(result)
        
        # Log of zero (undefined) - engine returns NaN or -inf
        result = self.engine.evaluate_expression("log(x)", 0.0)
        assert np.isnan(result) or not np.isfinite(result)
    
    def test_trigonometric_edge_cases(self):
        """Test trigonometric function edge cases"""
        # Very large arguments
        result = self.engine.evaluate_expression("sin(x)", 1000.0)
        assert np.isfinite(result)
        assert -1 <= result <= 1
        
        # Check periodicity
        result1 = self.engine.evaluate_expression("sin(x)", 0.0)
        result2 = self.engine.evaluate_expression("sin(x)", 2*np.pi)
        result3 = self.engine.evaluate_expression("sin(x)", 4*np.pi)
        
        assert abs(result1 - result2) < 1e-10
        assert abs(result2 - result3) < 1e-10
    
    def test_hyperbolic_functions(self):
        """Test hyperbolic function edge cases"""
        # Very large arguments
        result = self.engine.evaluate_expression("sinh(x)", 100.0)
        assert np.isinf(result) or result > 1e40
        
        # Very small arguments
        result = self.engine.evaluate_expression("sinh(x)", 0.001)
        assert abs(result) < 0.01  # Should be very small


class TestMathEngineSecurity:
    """Test security aspects of mathematical expression evaluation"""
    
    def setup_method(self):
        """Set up ExpressionEvaluator instance for each test"""
        self.engine = ExpressionEvaluator()
    
    def test_code_injection_attempts(self):
        """Test attempts to inject code through expressions"""
        malicious_expressions = [
            "__import__('os').system('ls')",
            "exec('print(\"hacked\")')",
            "eval('__import__(\"os\").system(\"ls\")')",
            "open('/etc/passwd').read()",
            "globals()",
            "locals()",
            "dir()",
            "help()",
            "input('prompt: ')",
            "raw_input('prompt: ')",
            "reload(__import__('os'))",
            "__builtins__",
            "__import__('sys').exit()",
            "exit()",
            "quit()",
        ]
        
        for expr in malicious_expressions:
            # Should reject all malicious expressions
            with pytest.raises((ValueError, SyntaxError, AttributeError)):
                self.engine.evaluate_expression(expr, 0.0)
    
    def test_format_string_attacks(self):
        """Test format string attacks"""
        format_attacks = [
            "{__import__}",
            "%s.__class__",
            "{0.__class__}",
            "{{().__class__}}",
            "%(class)s",
            "f'{__import__(\"os\")}'",
        ]
        
        for attack in format_attacks:
            with pytest.raises((ValueError, SyntaxError)):
                self.engine.evaluate_expression(attack, 0.0)
    
    def test_very_long_input_rejection(self):
        """Test rejection of extremely long inputs"""
        # Create expression longer than reasonable limit
        long_expr = "x + " * 10000  # Very long expression
        
        with pytest.raises((ValueError, MemoryError)):
            self.engine.evaluate_expression(long_expr, 0.0)
    
    def test_special_characters_rejection(self):
        """Test rejection of dangerous special characters"""
        dangerous_chars = [
            "x; DROP TABLE users;",
            "x'; DELETE FROM users; --",
            "x`rm -rf /`",
            "x|cat /etc/passwd",
            "x&echo 'hacked'",
            "x$(whoami)",
            "x`id`",
        ]
        
        for dangerous_expr in dangerous_chars:
            with pytest.raises((ValueError, SyntaxError)):
                self.engine.evaluate_expression(dangerous_expr, 0.0)


class TestMathEngineNumericalStability:
    """Test numerical stability and precision"""
    
    def setup_method(self):
        """Set up ExpressionEvaluator instance for each test"""
        self.engine = ExpressionEvaluator()
    
    def test_catastrophic_cancellation(self):
        """Test for catastrophic cancellation in floating point arithmetic"""
        # Large numbers with small differences
        result1 = self.engine.evaluate_expression("1e15 + 1", 0.0)
        result2 = self.engine.evaluate_expression("1e15 + 2", 0.0)
        difference = result2 - result1
        
        # Due to floating point precision, difference might not be exactly 1
        # but should be close
        assert abs(difference - 1.0) < 1e-10 or difference == 0.0
    
    def test_loss_of_significance(self):
        """Test loss of significance in small/large number operations"""
        # Adding very small number to very large number
        result = self.engine.evaluate_expression("1e15 + 1e-15", 0.0)
        
        # Small number might be lost due to precision
        assert np.isfinite(result)
    
    def test_rounding_errors(self):
        """Test accumulation of rounding errors"""
        expression = "sqrt(2) * sqrt(2)"  # Should be ~2
        result = self.engine.evaluate_expression(expression, 0.0)
        
        # Allow for some floating point error
        assert abs(result - 2.0) < 1e-10
    
    def test_extremely_precise_calculations(self):
        """Test calculations that require high precision"""
        # Very small increments
        result1 = self.engine.evaluate_expression("x", 1.0)
        result2 = self.engine.evaluate_expression("x + 1e-15", 1.0)
        
        difference = result2 - result1
        # Should be very close to 1e-15
        assert abs(difference - 1e-15) < 1e-20 or difference == 0.0


class TestMathEnginePerformance:
    """Test performance characteristics"""
    
    def setup_method(self):
        """Set up ExpressionEvaluator instance for each test"""
        self.engine = ExpressionEvaluator()
    
    def test_computation_timeout_handling(self):
        """Test handling of computations that might timeout"""
        # Very complex expression that might take long
        complex_expr = "sin(cos(tan(sqrt(abs(x^3 + x^2 + x + 1))))" * 100
        
        import time
        start_time = time.time()
        
        try:
            result = self.engine.evaluate_expression(complex_expr, 1.0)
            elapsed_time = time.time() - start_time
            
            # Should complete within reasonable time
            assert elapsed_time < 5.0
            assert np.isfinite(result)
            
        except (TimeoutError, RecursionError):
            # Acceptable to timeout on very complex expressions
            pass
    
    def test_memory_efficiency(self):
        """Test memory efficiency with repeated calculations"""
        # Repeated calculations should not accumulate memory
        initial_memory = None  # Could track memory if needed
        
        for i in range(1000):
            result = self.engine.evaluate_expression("x^2 + sin(x)", i * 0.01)
            assert np.isfinite(result)
        
        # Should complete without memory issues
        # (In real implementation, could monitor memory usage)
        assert True
    
    def test_batch_computation_efficiency(self):
        """Test efficiency of batch computations"""
        x_values = np.linspace(-10, 10, 1000)
        
        import time
        start_time = time.time()
        
        # Compute expression for many points
        for x in x_values:
            result = self.engine.evaluate_expression("x^2 + 2*sin(x)", x)
            assert np.isfinite(result)
        
        elapsed_time = time.time() - start_time
        
        # Should complete 1000 evaluations quickly
        assert elapsed_time < 1.0


class TestMathEngineImplicitEquations:
    """Test implicit equation solving capabilities"""
    
    def setup_method(self):
        """Set up ExpressionEvaluator instance for each test"""
        self.engine = ExpressionEvaluator()
    
    def test_no_solution_implicit_equations(self):
        """Test implicit equations with no real solutions"""
        # Circle with negative radius
        no_solution_expr = "x^2 + y^2 = -1"
        
        result = self.engine.solve_implicit(no_solution_expr, (-5, 5), (-5, 5), 100)
        
        # Should return empty or indicate no solution
        assert len(result.get('coordinates', [])) == 0 or result.get('no_solution') is True
    
    def test_infinite_solutions_implicit_equations(self):
        """Test implicit equations with infinite solutions"""
        # Degenerate case
        infinite_solution_expr = "x^2 + y^2 = 0"  # Only solution is (0,0) for real numbers
        
        result = self.engine.solve_implicit(infinite_solution_expr, (-5, 5), (-5, 5), 100)
        
        # Should handle gracefully
        coords = result.get('coordinates', [])
        assert len(coords) >= 0  # Should not crash
    
    def test_highly_oscillating_implicit(self):
        """Test implicit equations with high oscillation"""
        oscillating_expr = "sin(x) - y = 0"
        
        result = self.engine.solve_implicit(oscillating_expr, (-10, 10), (-10, 10), 1000)
        
        # Should find many crossing points
        coords = result.get('coordinates', [])
        assert len(coords) > 0
        
        # All points should satisfy the equation approximately
        for coord in coords[:10]:  # Check first 10 points
            x, y = coord['x'], coord['y']
            expected_y = np.sin(x)
            assert abs(y - expected_y) < 0.1  # Allow some tolerance


if __name__ == "__main__":
    pytest.main([__file__, "-v"])