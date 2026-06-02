import { StrictMode, useEffect } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

// Wrapper component to disable autocomplete globally
function AppWrapper() {
  useEffect(() => {
    // AGGRESSIVE: Use readonly trick to prevent autocomplete
    // Inputs start as readonly, then become editable on focus
    const skipAggressiveInputHardening = (input) =>
      input.hasAttribute('data-no-readonly-trick');

    const applyReadonlyTrick = () => {
      const inputs = document.querySelectorAll('input, textarea');
      inputs.forEach(input => {
        if (skipAggressiveInputHardening(input)) return;

        const isMuiAutocomplete = input.closest('.MuiAutocomplete-root');
        const isCustomAutocomplete = input.closest('.autocomplete-wrapper');
        
        if (!isMuiAutocomplete && !isCustomAutocomplete) {
          // Make readonly initially
          if (!input.hasAttribute('data-readonly-applied')) {
            input.setAttribute('readonly', 'readonly');
            input.setAttribute('data-readonly-applied', 'true');
            
            // Remove readonly on focus - this prevents browser from suggesting
            input.addEventListener('focus', function handleFocus() {
              this.removeAttribute('readonly');
            }, { once: false });
            
            // Re-apply readonly on blur to prevent any cached suggestions
            input.addEventListener('blur', function handleBlur() {
              setTimeout(() => {
                this.setAttribute('readonly', 'readonly');
              }, 100);
            });
          }
        }
      });
    };

    // Disable autocomplete for all existing and future form elements
    const disableAutocomplete = () => {
      // Handle form elements
      const forms = document.querySelectorAll('form');
      forms.forEach(form => {
        if (!form.hasAttribute('data-allow-autocomplete')) {
          form.setAttribute('autocomplete', 'off');
          form.setAttribute('autocomplete', 'nope'); // Some browsers respond better to invalid values
        }
      });

      // Handle input, textarea, and select elements
      const inputs = document.querySelectorAll('input, textarea, select');
      inputs.forEach(input => {
        if (skipAggressiveInputHardening(input)) return;
        // Native <select> is fully controlled by React; mutating name/autocomplete breaks controlled value
        if (input.tagName === 'SELECT') return;

        const isMuiAutocomplete = input.closest('.MuiAutocomplete-root');
        const isCustomAutocomplete = input.closest('.autocomplete-wrapper');
        
        if (!isMuiAutocomplete && !isCustomAutocomplete) {
          // Multiple autocomplete strategies
          input.setAttribute('autocomplete', 'off');
          input.setAttribute('autocomplete', 'nope');
          input.setAttribute('autocomplete', 'new-password');
          input.setAttribute('autocorrect', 'off');
          input.setAttribute('autocapitalize', 'off');
          input.setAttribute('spellcheck', 'false');
          
          // Additional prevention attributes
          input.setAttribute('data-form-type', 'other');
          input.setAttribute('data-lpignore', 'true'); // LastPass
          input.setAttribute('data-1p-ignore', 'true'); // 1Password
          input.setAttribute('data-bwignore', 'true'); // Bitwarden
          
          // Randomize name attribute to prevent browser history matching
          if (input.name && !input.hasAttribute('data-name-randomized')) {
            const originalName = input.name;
            const randomSuffix = '_' + Math.random().toString(36).substring(2, 9);
            input.setAttribute('data-original-name', originalName);
            input.setAttribute('name', originalName + randomSuffix);
            input.setAttribute('data-name-randomized', 'true');
          }
        }
      });
      
      // Apply readonly trick
      applyReadonlyTrick();
    };

    // Initial disable
    setTimeout(disableAutocomplete, 0);

    // Set up MutationObserver to disable autocomplete on dynamically added elements
    const observer = new MutationObserver((mutations) => {
      const hasNewNodes = mutations.some(mutation => 
        mutation.addedNodes && mutation.addedNodes.length > 0
      );
      if (hasNewNodes) {
        setTimeout(disableAutocomplete, 10);
      }
    });
    
    observer.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: false
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
