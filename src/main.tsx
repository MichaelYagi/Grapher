import React from 'react';
import ReactDOM from 'react-dom/client';
import { App } from './components/App/App';
import './styles/global.css';
import 'katex/dist/katex.min.css';

// Set default theme
document.documentElement.setAttribute('data-theme', 'light');

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);