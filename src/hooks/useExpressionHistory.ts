import { useState, useCallback } from 'react';

/**
 * Custom hook for managing expression history
 */
export function useExpressionHistory(maxHistory: number = 10) {
  const [history, setHistory] = useState<string[]>([]);

  const addToHistory = useCallback((expression: string) => {
    setHistory(prev => {
      const newHistory = [expression, ...prev.filter(expr => expr !== expression)];
      return newHistory.slice(0, maxHistory);
    });
  }, [maxHistory]);

  const clearHistory = useCallback(() => {
    setHistory([]);
  }, []);

  const removeFromHistory = useCallback((index: number) => {
    setHistory(prev => prev.filter((_, i) => i !== index));
  }, []);

  return {
    history,
    addToHistory,
    clearHistory,
    removeFromHistory
  };
}