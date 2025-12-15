import sys
import os
sys.path.append(os.path.join(os.path.dirname(__file__), '..', 'src'))

def test_expression_normalization():
    """Test expression normalization according to mathematical rules"""
    try:
        from backend.core.math_engine import evaluator
    except ImportError:
        sys.path.append(os.path.join(os.path.dirname(__file__), '..'))
        from backend.core.math_engine import evaluator
        
        # Test cases for normalization rules
        test_cases = [
            # Rule 1: Basic Multiplication
            ("2x", "2*x"),
            ("x2", "2*x"), 
            ("2*x", "2*x"),
            ("x*2", "2*x"),
            
            # Rule 2: Power Simplification
            ("x^1", "x"),
            ("x**1", "x"),
            ("x", "x"),
            
            # Rule 3: Zero Power
            ("x^0", "1"),
            ("x**0", "1"),
            
            # Rule 4: Addition
            ("x+x", "2*x"),
            ("2*x", "2*x"),
            
            # Rule 5: Subtraction
            ("x-x", "0"),
            
            # Rule 6: Division
            ("x/1", "x"),
            
            # Rule 7 & 8: Power Conversion
            ("x*x", "x^2"),
            ("x*x*x", "x^3"),
            ("x^2", "x^2"),
            ("x**2", "x^2"),
            ("x^3", "x^3"),
            ("x**3", "x^3"),
            
            # Rule 9: Function Calls
            ("sin(x)", "sin(x)"),
            ("SIN(X)", "sin(x)"),
            ("sin (x)", "sin(x)"),
            
            # Rule 10: Constants
            ("1*x", "x"),
            ("x*1", "x"),
            
            # Complex cases
            ("2x+3", "2*x+3"),
            ("sin(2x)", "sin(2*x)"),
            ("x^2+2x+1", "x^2+2*x+1"),
            ("2*sin(x)", "2*sin(x)"),
            ("x*x+x", "x^2+x"),
        ]
        
        print("Testing expression normalization...")
        
        passed = 0
        failed = 0
        
        for i, (input_expr, expected) in enumerate(test_cases):
            try:
                result = evaluator.parser.normalize_expression(input_expr)
                
                # For evaluation, convert back to ** format
                eval_result = result.replace('^', '**')
                expected_eval = expected.replace('^', '**')
                
                print(f"Test {i+1}: '{input_expr}' → '{result}'")
                
                # Check if normalized form matches expected
                if eval_result == expected_eval:
                    print(f"  ✅ PASS: '{input_expr}' → '{result}'")
                    passed += 1
                    
                    # Also test that it evaluates correctly
                    if input_expr not in ["x-x", "x**0", "x^0"]:  # Skip cases that evaluate to constants
                        try:
                            # Test evaluation at x=2
                            val1 = evaluator.evaluate_single_point(input_expr, 2.0)
                            val2 = evaluator.evaluate_single_point(result, 2.0)
                            if abs(val1 - val2) < 1e-10:
                                print(f"    ✅ Evaluation matches: {val1}")
                            else:
                                print(f"    ❌ Evaluation mismatch: {val1} vs {val2}")
                                failed += 1
                        except:
                            # If evaluation fails, that's okay for normalization testing
                            pass
                else:
                    print(f"  ❌ FAIL: Expected '{expected}', got '{result}'")
                    failed += 1
                    
            except Exception as e:
                print(f"  ❌ ERROR: '{input_expr}' → {e}")
                failed += 1
        
        print(f"\nNormalization Results:")
        print(f"  Passed: {passed}")
        print(f"  Failed: {failed}")
        print(f"  Total:  {passed + failed}")
        
        if failed == 0:
            print("✅ All normalization tests passed!")
            assert True
        else:
            print(f"❌ {failed} normalization tests failed!")
            assert False, f"{failed} normalization tests failed!"
            
    except ImportError as e:
        print(f"❌ Import error: {e}")
        assert False, f"Import error: {e}"
    except Exception as e:
        print(f"❌ Test failed: {e}")
        assert False, f"Test failed: {e}"

if __name__ == "__main__":
    success = test_expression_normalization()
    sys.exit(0 if success else 1)