import React, { useState } from 'react';
import IndiaMartAPI from './components/IndiaMartAPI';
import 'bootstrap/dist/css/bootstrap.min.css';
import './App.css';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [apiKey, setApiKey] = useState('');

  const handleLogin = () => {
    if (apiKey.trim()) {
      localStorage.setItem('indiamart_api_key', apiKey);
      setIsAuthenticated(true);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('indiamart_api_key');
    setIsAuthenticated(false);
    setApiKey('');
  };

  // Check for existing API key on mount
  React.useEffect(() => {
    const savedKey = localStorage.getItem('indiamart_api_key');
    if (savedKey) {
      setApiKey(savedKey);
      setIsAuthenticated(true);
    }
  }, []);

  return (
    <div className="App container mt-4">
      <header className="mb-4">
        <h1 className="text-center text-primary">
          <i className="bi bi-shop me-2"></i>
          IndiaMART CRM Integration
        </h1>
        <p className="text-center text-muted">
          Pull and manage leads from IndiaMART seller account
        </p>
      </header>

      {!isAuthenticated ? (
        <div className="card shadow-sm mx-auto" style={{ maxWidth: '500px' }}>
          <div className="card-body p-4">
            <h3 className="card-title mb-4">🔐 Enter API Key</h3>
            <div className="mb-3">
              <label htmlFor="apiKey" className="form-label">
                IndiaMART API Key
              </label>
              <input
                type="password"
                className="form-control"
                id="apiKey"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="Enter your 32-character API key"
              />
              <div className="form-text">
                Enter the API key provided by IndiaMART seller
              </div>
            </div>
            <div className="d-grid">
              <button 
                onClick={handleLogin}
                className="btn btn-primary btn-lg"
                disabled={!apiKey.trim()}
              >
                Connect to IndiaMART
              </button>
            </div>
            
            <div className="mt-4 p-3 bg-light rounded">
              <h6>Test with provided key:</h6>
              <code className="text-success">
                mRy1F71v4HfES/ep4nyY/FuNplDHlDA=
              </code>
              <button
                className="btn btn-sm btn-outline-success ms-2"
                onClick={() => setApiKey('mRy1F71v4HfES/ep4nyY/FuNplDHlDA=')}
              >
                Use Test Key
              </button>
            </div>
          </div>
        </div>
      ) : (
        <>
          <div className="d-flex justify-content-between align-items-center mb-4">
            <div>
              <span className="badge bg-success">
                <i className="bi bi-check-circle me-1"></i>
                Connected to IndiaMART
              </span>
            </div>
            <button 
              onClick={handleLogout}
              className="btn btn-outline-danger"
            >
              <i className="bi bi-power me-1"></i>
              Disconnect
            </button>
          </div>
          
          <IndiaMartAPI apiKey={apiKey} />
        </>
      )}

      <footer className="mt-5 pt-4 border-top text-center text-muted">
        <small>
          IndiaMART CRM Integration Tool • For testing purposes only
        </small>
      </footer>
    </div>
  );
}

export default App;