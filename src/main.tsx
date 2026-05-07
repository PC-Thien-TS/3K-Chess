import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { runMultiplayerArchitectureQA } from './rules/multiplayerQA.devTests';

if ((import.meta as any).env?.DEV) {
  (window as any).runMultiplayerQA = runMultiplayerArchitectureQA;
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
