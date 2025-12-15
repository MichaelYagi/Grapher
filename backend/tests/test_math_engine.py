import sys
import os
sys.path.append(os.path.join(os.path.dirname(__file__), '..', 'src'))

def test_math_engine():
    """Test the mathematical expression engine"""
    try:
        from backend.core.math_engine import evaluator
    except ImportError:
        sys.path.append(os.path.join(os.path.dirname(__file__), '..'))
        from backend.core.math_engine import evaluator
        
        # Test basic expression
        print("Testing basic expression evaluation...")
        result = evaluator.evaluate_single_point("x^2 + 2*x + 1", 3.0)
        print(f"x^2 + 2*x + 1 at x=3: {result}")
        assert abs(result - 16.0) < 1e-10, f"Expected 16.0, got {result}"
        
        # Test expression with parameters
        print("\nTesting expression with parameters...")
        result = evaluator.evaluate_single_point("a*x^2 + b*x + c", 2.0, {"a": 1, "b": 3, "c": -4})
        print(f"a*x^2 + b*x + c at x=2 (a=1,b=3,c=-4): {result}")
        assert abs(result - 6.0) < 1e-10, f"Expected 6.0, got {result}"
        
        # Test trigonometric functions
        print("\nTesting trigonometric functions...")
        result = evaluator.evaluate_single_point("sin(pi/2)", 0.0)
        print(f"sin(pi/2): {result}")
        assert abs(result - 1.0) < 1e-10, f"Expected 1.0, got {result}"
        
        # Test graph data generation
        print("\nTesting graph data generation...")
        graph_data = evaluator.generate_graph_data("x^2", (-2, 2), 5)
        print(f"Generated {graph_data['valid_points']} points for x^2 from -2 to 2")
        assert graph_data['total_points'] == 5, f"Expected 5 total points, got {graph_data['total_points']}"
        assert graph_data['valid_points'] == 5, f"Expected 5 valid points, got {graph_data['valid_points']}"
        
        # Test variable extraction
        print("\nTesting variable extraction...")
        variables = evaluator.parser.extract_variables("a*x^2 + b*sin(x) + c")
        print(f"Variables in 'a*x^2 + b*sin(x) + c': {sorted(variables)}")
        expected_vars = {'a', 'b', 'c', 'x'}
        assert variables == expected_vars, f"Expected {expected_vars}, got {variables}"
        
        # Test expression validation
        print("\nTesting expression validation...")
        is_valid, error = evaluator.parser.validate_expression("x^2 + 2*x + 1")
        print(f"'x^2 + 2*x + 1' is valid: {is_valid}")
        assert is_valid, "Expected valid expression to pass validation"
        
        is_valid, error = evaluator.parser.validate_expression("x^2 + + 2*x")
        print(f"'x^2 + + 2*x' is valid: {is_valid}")
        assert not is_valid, "Expected invalid expression to fail validation"
        
        print("\n✅ All math engine tests passed!")
        assert True
        
    except ImportError as e:
        print(f"❌ Import error: {e}")
        print("Note: This requires numpy and numexpr to be installed")
        assert False, f"Import error: {e}"
    except Exception as e:
        print(f"❌ Test failed: {e}")
        assert False, f"Test failed: {e}"

if __name__ == "__main__":
    success = test_math_engine()
    sys.exit(0 if success else 1)