import React, { useState } from 'react';
import { Expression } from '../../types';
import { ExpressionInput } from '../ExpressionInput/ExpressionInput';
import { GraphRenderer } from '../GraphRenderer/GraphRenderer';
import './App.css';

export const App: React.FC = () => {
  const [expressions, setExpressions] = useState<Expression[]>([
    {
      id: '1',
      formula: 'x^2',
      variables: [],
      color: '#3B82F6',
      visible: true,
      isValid: true,
      compiledFunction: {
        evaluate: (x: number) => x * x,
        variables: ['x'],
        parameters: []
      }
    }
  ]);
  const [theme, setTheme] = useState<'light' | 'dark' | 'high-contrast'>('light');

  const handleExpressionAdd = (newExpression: Expression) => {
    setExpressions(prev => [...prev, newExpression]);
  };

  const handleExpressionRemove = (id: string) => {
    setExpressions(prev => prev.filter(expr => expr.id !== id));
  };

  const handleExpressionToggle = (id: string) => {
    setExpressions(prev => 
      prev.map(expr => 
        expr.id === id ? { ...expr, visible: !expr.visible } : expr
      )
    );
  };

  const toggleTheme = () => {
    const themes: Array<'light' | 'dark' | 'high-contrast'> = ['light', 'dark', 'high-contrast'];
    const currentIndex = themes.indexOf(theme);
    const nextIndex = (currentIndex + 1) % themes.length;
    setTheme(themes[nextIndex]);
  };

  return (
    <div className="app" data-theme={theme}>
      <header className="app-header">
        <div className="header-content">
          <div className="flex items-center justify-between">
            <h1 className="app-title">Grapher</h1>
            <button
              onClick={toggleTheme}
              className="theme-toggle"
              aria-label="Toggle theme"
            >
              {theme === 'light' && '🌙'}
              {theme === 'dark' && '☀️'}
              {theme === 'high-contrast' && '🔲'}
            </button>
          </div>
        </div>
      </header>

      <main className="app-main">
        <div className="main-content">
          <div className="layout-grid">
            {/* Left panel - Input and controls */}
            <div className="input-panel">
              <div className="input-section">
                <div className="section-header">
                  <h2 className="section-title">Enter a problem...</h2>
                </div>
                <div className="section-content">
                  <ExpressionInput 
                    onExpressionAdd={handleExpressionAdd}
                  />
                </div>
              </div>

              {/* Expression list */}
              {expressions.length > 0 && (
                <div className="functions-section">
                  <div className="section-header">
                    <h3 className="section-title">Functions</h3>
                  </div>
                  <div className="functions-list">
                    {expressions.map((expr) => (
                      <div 
                        key={expr.id}
                        className="function-item"
                      >
                        <input
                          type="checkbox"
                          checked={expr.visible}
                          onChange={() => handleExpressionToggle(expr.id)}
                          className="function-checkbox"
                          style={{ accentColor: expr.color }}
                        />
                        <div 
                          className="function-color" 
                          style={{ backgroundColor: expr.color }}
                        />
                        <code className="function-formula">
                          {expr.formula}
                        </code>
                        <button
                          onClick={() => handleExpressionRemove(expr.id)}
                          className="function-remove"
                          aria-label={`Remove ${expr.formula}`}
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Right panel - Graph */}
            <div className="graph-panel">
              <div className="graph-section">
                {expressions.length > 0 ? (
                    <GraphRenderer
                      expressions={expressions}
                      width={500}
                      height={500}
                      className="graph-canvas"
                    />
                  ) : (
                  <div className="graph-placeholder">
                    <div className="placeholder-content">
                      <div className="placeholder-icon">📈</div>
                      <h3 className="placeholder-title">No Functions Yet</h3>
                      <p className="placeholder-text">
                        Add a mathematical function to see it graphed here
                      </p>
                      <div className="placeholder-examples">
                        <p className="examples-title">Try these examples:</p>
                        <ul className="examples-list">
                          <li><code>x^2</code> - Parabola</li>
                          <li><code>sin(x)</code> - Sine wave</li>
                          <li><code>x^3 - 2*x</code> - Cubic function</li>
                          <li><code>a*x^2 + b*x + c</code> - Quadratic with parameters</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};