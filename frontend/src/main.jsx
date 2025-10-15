import { StrictMode, useEffect } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

// Wrapper component to disable autocomplete globally
function AppWrapper() {
  useEffect(() => {
    // Disable autocomplete for all existing and future form elements
    const disableAutocomplete = () => {
      const inputs = document.querySelectorAll('input, textarea, select');
      inputs.forEach(input => {
        input.setAttribute('autocomplete', 'off');
        input.setAttribute('autocorrect', 'off');
        input.setAttribute('autocapitalize', 'off');
        input.setAttribute('spellcheck', 'false');
      });
    };

    // Initial disable
    disableAutocomplete();

    // Set up MutationObserver to disable autocomplete on dynamically added elements
    const observer = new MutationObserver(disableAutocomplete);
    observer.observe(document.body, {
      childList: true,
      subtree: true
    });

    return () => observer.disconnect();
  }, []);

  return <App />;
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <AppWrapper />
  </StrictMode>,
)
