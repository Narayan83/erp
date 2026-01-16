import React, { useState, useEffect } from 'react';
import { FaTimes } from 'react-icons/fa';
import './sources.scss';

const Sources = ({ isOpen, onClose }) => {
  // Start with an empty list — no pre-saved sources
  const [sources, setSources] = useState([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newSourceName, setNewSourceName] = useState('');
  const [loading, setLoading] = useState(false);

  // Fetch sources from backend when modal opens (placeholder)
  useEffect(() => {
    if (isOpen) {
      // Load saved sources from localStorage
      try {
        const saved = JSON.parse(localStorage.getItem('leadSources') || '[]');
        if (Array.isArray(saved) && saved.length > 0) setSources(saved);
      } catch (e) {
        // ignore
      }
    }
  }, [isOpen]);

  // const fetchSources = async () => {
  //   try {
  //     const res = await fetch('/api/sources');
  //     const data = await res.json();
  //     setSources(data);
  //   } catch (err) {
  //     console.error('Failed to load sources', err);
  //   }
  // };

  const handleAddSource = async () => {
    if (!newSourceName.trim()) {
      alert('Please enter a source name');
      return;
    }

    setLoading(true);
    try {
      // Placeholder for POST API call
      // const res = await fetch('/api/sources', { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify({name: newSourceName}) });
      // const created = await res.json();

      // Temporary: add locally
      const newSource = { id: Math.max(...sources.map(s => s.id), 0) + 1, name: newSourceName };
      setSources(prev => [...prev, newSource]);
      // persist to localStorage
      try { localStorage.setItem('leadSources', JSON.stringify([...sources, newSource])); } catch (e) {}
      setNewSourceName('');
      setShowAddModal(false);
    } catch (error) {
      console.error('Error adding source:', error);
      alert('Failed to add source');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteSource = async (id) => {
    if (!window.confirm('Are you sure you want to delete this source?')) return;
    try {
      // Placeholder for DELETE API call
      // await fetch(`/api/sources/${id}`, { method: 'DELETE' });
      setSources(prev => prev.filter(s => s.id !== id));
      try { localStorage.setItem('leadSources', JSON.stringify(sources.filter(s => s.id !== id))); } catch (e) {}
    } catch (error) {
      console.error('Error deleting source:', error);
      alert('Failed to delete source');
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') handleAddSource();
  };

  if (!isOpen) return null;

  return (
    <div className="tandc-overlay" onClick={onClose}>
      <div className="tandc-dialog" onClick={(e) => e.stopPropagation()}>
        <div className="tandc-dialog-header">
          <div className="title">Lead Sources</div>
          <div className="actions">
            <button className="btn-add small" onClick={() => setShowAddModal(true)}>+ Add</button>
            <button className="close" onClick={onClose}>✕</button>
          </div>
        </div>

        <div className="tandc-dialog-body">
          {sources.length === 0 ? (
            <div className="muted">No sources found. Add one.</div>
          ) : (
            sources.map((source) => (
              <div className="tandc-item" key={source.id}>
                <div className="tandc-name">{source.name}</div>
                <div className="item-actions">
                  <button className="icon-button delete" title="Delete source" onClick={() => handleDeleteSource(source.id)}>
                    <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" focusable="false">
                      <path d="M6 19a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z" fill="currentColor"/>
                    </svg>
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {showAddModal && (
        <div className="tandc-overlay" onClick={() => setShowAddModal(false)}>
          <div className="tandc-dialog small" onClick={(e) => e.stopPropagation()}>
            <div className="tandc-dialog-header">
              <div className="title">Add Lead Source</div>
              <div className="actions">
                <button className="close" onClick={() => setShowAddModal(false)}>✕</button>
              </div>
            </div>

            <div className="tandc-dialog-body">
              <div className="form-row">
                <label htmlFor="source-input">Source</label>
                <input id="source-input" type="text" placeholder="Enter source name" value={newSourceName} onChange={(e) => setNewSourceName(e.target.value)} onKeyPress={handleKeyPress} autoFocus />
              </div>
            </div>

            <div className="tandc-dialog-footer">
              <button className="btn-primary save" onClick={handleAddSource} disabled={loading || !newSourceName.trim()}>{loading ? 'Saving...' : 'Done'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Sources;
