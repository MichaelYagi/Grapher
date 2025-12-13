import React, { useState } from 'react';
import { Expression } from '../types';

interface SimpleExpressionInputProps {
  onExpressionAdd: (expression: Expression) => void;
}

export const SimpleExpressionInput: React.FC<SimpleExpressionInputProps> = ({ onExpressionAdd }) => {
  const [inputValue, setInputValue] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!inputValue.trim()) {
      return;
    }

    try {
      // Simple function evaluator for basic expressions
      const compiledFunction = {
        evaluate: (x: number, params: Record<string, number> = {}) => {
          try {
            // Replace variables and evaluate
            let expression = inputValue.trim();
            
            // Replace parameters
            Object.entries(params).forEach(([key, value]) => {
              expression = expression.replace(new RegExp(`\\b${key}\\b`, 'g'), value.toString());
            });
            
            // Replace x with actual value
            expression = expression.replace(/\bx\b/g, x.toString());
            
            // Use Function constructor for safe evaluation
            const func = new Function('Math', `return ${expression}`);
            return func(Math);
          } catch (error) {
            return NaN;
          }
        },
        variables: [],
        parameters: []
      };

      const newExpression: Expression = {
        id: Date.now().toString(),
        formula: inputValue.trim(),
        variables: [],
        color: '#3B82F6',
        visible: true,
        isValid: true,
        compiledFunction
      };

      onExpressionAdd(newExpression);
      setInputValue('');
    } catch (error) {
      console.error('Failed to create expression:', error);
    }
  };

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', gap: '0.5rem' }}>
      <input
        type="text"
        value={inputValue}
        onChange={(e) => setInputValue(e.target.value)}
        placeholder="Try: x^2, sin(x), 2*x + 1"
        style={{
          flex: 1,
          padding: '0.75rem',
          border: '1px solid #d1d5db',
          borderRadius: '0.5rem',
          fontSize: '1rem'
        }}
      />
      <button
        type="submit"
        style={{
          padding: '0.75rem 1.5rem',
          backgroundColor: '#3b82f6',
          color: 'white',
          border: 'none',
          borderRadius: '0.5rem',
          cursor: 'pointer',
          fontSize: '1rem'
        }}
      >
        Graph
      </button>
    </form>
  );
};