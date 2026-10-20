import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import { applyTheme, initialTheme } from './theme/useTheme';
import './theme/theme.css';
import './App.css';

// Aplica o tema antes do primeiro render para não piscar.
applyTheme(initialTheme());

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
