import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Expression, Variable } from '../../types';
import { ExpressionParser } from '../../utils/ExpressionParser';
import { useDebounce } from '../../hooks/useDebounce';
import { useExpressionHistory } from '../../hooks/useExpressionHistory';
import { useValidation } from '../../hooks/useValidation';
import './ExpressionInput.css';

interface ExpressionInputProps {
  onExpressionAdd: (expression: Expression) => void;
  className?: string;
}

export const ExpressionInput: React.FC<ExpressionInputProps> = ({
  onExpressionAdd,
  className = ''
}) => {
  const [inputValue, setInputValue] = useState('');
  const [variables, setVariables] = useState<Variable[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [selectedColor, setSelectedColor] = useState('#3B82F6');
  
  const parser = useMemo(() => new ExpressionParser(), []);
  const debouncedInput = useDebounce(inputValue, 300);
  const { history, addToHistory } = useExpressionHistory();
  const { validationResult, validate } = useValidation(parser);

  // Function colors for selection
  const functionColors = [
    '#3B82F6', // Blue
    '#10B981', // Emerald
    '#8B5CF6', // Purple
    '#F97316', // Orange
    '#EC4899', // Pink
    '#14B8A6', // Teal
    '#6366F1', // Indigo
    '#EF4444', // Red
  ];

  // Validate expression when debounced input changes
  useEffect(() => {
    if (debouncedInput.trim()) {
      validate(debouncedInput);
    }
  }, [debouncedInput, validate]);

  // Extract variables from validation result
  useEffect(() => {
    if (validationResult?.isValid && validationResult.variables) {
      const newVariables: Variable[] = validationResult.variables
        .filter(v => v !== 'x') // x is the independent variable
        .map((varName, index) => ({
          name: varName,
          value: 1,
          min: -10,
          max: 10,
          step: 0.1,
          isParameter: true,
          color: functionColors[index % functionColors.length]
        }));
      setVariables(newVariables);
    } else {
      setVariables([]);
    }
  }, [validationResult]);

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value);
  }, []);

  const handleSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    
    if (!inputValue.trim() || !validationResult?.isValid) {
      return;
    }

    const newExpression: Expression = {
      id: Date.now().toString(),
      formula: inputValue.trim(),
      variables: variables,
      color: selectedColor,
      visible: true,
      isValid: true,
      compiledFunction: validationResult.compiledFunction
    };

    onExpressionAdd(newExpression);
    addToHistory(inputValue.trim());
    setInputValue('');
    setVariables([]);
  }, [inputValue, validationResult, variables, selectedColor, onExpressionAdd, addToHistory]);

  const handleHistorySelect = useCallback((expression: string) => {
    setInputValue(expression);
    setShowHistory(false);
  }, []);

  const handleVariableChange = useCallback((varName: string, value: number) => {
    setVariables(prev => prev.map(v => 
      v.name === varName ? { ...v, value } : v
    ));
  }, []);

  const getValidationIcon = () => {
    if (!debouncedInput.trim()) return null;
    
    if (validationResult?.isValid) {
      return (
        <svg className="w-5 h-5 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
      );
    }
    
    return (
      <svg className="w-5 h-5 text-rose-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
      </svg>
    );
  };

  const getValidationMessage = () => {
    if (!debouncedInput.trim()) return '';
    return validationResult?.errorMessage || '';
  };

  return (
    <div className={`expression-input ${className}`}>
      <form onSubmit={handleSubmit} className="input-form">
        {/* Main input row */}
        <div className="input-row">
          {/* Color selector */}
          <div className="color-selector">
            <div className="color-grid">
              {functionColors.map((color) => (
                <button
                  key={color}
                  type="button"
                  onClick={() => setSelectedColor(color)}
                  className={`color-button ${
                    selectedColor === color ? 'color-button--selected' : ''
                  }`}
                  style={{ backgroundColor: color }}
                  aria-label={`Select ${color} color`}
                />
              ))}
            </div>
          </div>

          {/* Input field */}
          <div className="input-field-wrapper">
            <input
              id="expression-input"
              type="text"
              value={inputValue}
              onChange={handleInputChange}
              onFocus={() => setShowHistory(true)}
              placeholder="Enter a problem..."
              className={`expression-field ${
                validationResult?.isValid === false ? 'expression-field--error' : ''
              }`}
              autoComplete="off"
              spellCheck="false"
            />
            
            {/* Validation indicator */}
            <div className="validation-indicator">
              {getValidationIcon()}
            </div>

            {/* History dropdown */}
            {showHistory && history.length > 0 && (
              <div className="history-dropdown">
                {history.map((expr, index) => (
                  <button
                    key={index}
                    type="button"
                    onClick={() => handleHistorySelect(expr)}
                    className="history-item"
                  >
                    {expr}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Submit button */}
          <button
            type="submit"
            disabled={!inputValue.trim() || !validationResult?.isValid}
            className="submit-button"
            style={{ backgroundColor: selectedColor }}
          >
            Graph
          </button>
        </div>
        
        {/* Validation message */}
        {getValidationMessage() && (
          <div className="validation-message">
            {getValidationMessage()}
          </div>
        )}

        {/* Variable controls */}
        {variables.length > 0 && (
          <div className="parameters-section">
            <h4 className="parameters-title">Parameters</h4>
            <div className="parameters-grid">
              {variables.map((variable) => (
                <div key={variable.name} className="parameter-item">
                  <label className="parameter-label">
                    <span 
                      className="parameter-color" 
                      style={{ backgroundColor: variable.color }}
                    />
                    {variable.name}
                    <span className="parameter-value">= {variable.value.toFixed(2)}</span>
                  </label>
                  <div className="parameter-controls">
                    <input
                      type="range"
                      min={variable.min}
                      max={variable.max}
                      step={variable.step}
                      value={variable.value}
                      onChange={(e) => handleVariableChange(variable.name, parseFloat(e.target.value))}
                      className="parameter-slider"
                      style={{
                        background: `linear-gradient(to right, ${variable.color} 0%, ${variable.color} ${
                          ((variable.value - (variable.min || 0)) / ((variable.max || 10) - (variable.min || 0))) * 100
                        }%, #e5e7eb ${
                          ((variable.value - (variable.min || 0)) / ((variable.max || 10) - (variable.min || 0))) * 100
                        }%, #e5e7eb 100%)`
                      }}
                    />
                    <input
                      type="number"
                      min={variable.min}
                      max={variable.max}
                      step={variable.step}
                      value={variable.value}
                      onChange={(e) => handleVariableChange(variable.name, parseFloat(e.target.value))}
                      className="parameter-input"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </form>
    </div>
  );
};