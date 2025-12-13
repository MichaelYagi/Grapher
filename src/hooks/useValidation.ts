import { useState, useCallback } from 'react';
import { ValidationResult } from '../types';
import { ExpressionParser } from '../utils/ExpressionParser';

/**
 * Custom hook for expression validation
 */
export function useValidation(parser: ExpressionParser) {
  const [validationResult, setValidationResult] = useState<ValidationResult | null>(null);
  const [isValidating, setIsValidating] = useState(false);

  const validate = useCallback(async (expression: string) => {
    setIsValidating(true);
    
    try {
      // Simulate async validation for better UX
      await new Promise(resolve => setTimeout(resolve, 50));
      
      const result = parser.parse(expression);
      setValidationResult(result);
    } catch (error) {
      setValidationResult({
        isValid: false,
        errorMessage: error instanceof Error ? error.message : 'Validation failed'
      });
    } finally {
      setIsValidating(false);
    }
  }, [parser]);

  const clearValidation = useCallback(() => {
    setValidationResult(null);
  }, []);

  return {
    validationResult,
    isValidating,
    validate,
    clearValidation
  };
}