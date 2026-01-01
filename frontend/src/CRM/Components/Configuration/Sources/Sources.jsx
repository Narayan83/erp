import React, { useState, useEffect } from 'react';
import { FaTimes, FaTrash, FaPlus } from 'react-icons/fa';
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
    <div className="sources-modal-overlay" onClick={onClose}>
      <div className="sources-modal" onClick={(e) => e.stopPropagation()}>
        <div className="sources-modal-header">
          <h2>Lead Sources</h2>
          <button className="close-btn" onClick={onClose}><FaTimes /></button>
        </div>

        <div className="sources-modal-content">
          <div className="sources-list-header">
            <span>Sources</span>
            <button className="add-btn" onClick={() => setShowAddModal(true)}><FaPlus /> Add</button>
          </div>

          <div className="sources-list">
            {sources.length === 0 ? (
              <div className="no-sources">No sources found. Click Add to create one.</div>
            ) : (
              sources.map((source) => (
                <div key={source.id} className="source-item">
                  <span className="source-name">{source.name}</span>
                  <button className="delete-btn" onClick={() => handleDeleteSource(source.id)} title="Delete source"><FaTrash /></button>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {showAddModal && (
        <div className="add-source-modal-overlay" onClick={() => setShowAddModal(false)}>
          <div className="add-source-modal" onClick={(e) => e.stopPropagation()}>
            <div className="add-source-header">
              <h3>Add Lead Source</h3>
              <button className="close-btn" onClick={() => setShowAddModal(false)}><FaTimes /></button>
            </div>

            <div className="add-source-content">
              <label htmlFor="source-input">Source</label>
              <input id="source-input" type="text" placeholder="Enter source name" value={newSourceName} onChange={(e) => setNewSourceName(e.target.value)} onKeyPress={handleKeyPress} autoFocus />
            </div>

            <div className="add-source-footer">
              <button className="save-btn" onClick={handleAddSource} disabled={loading || !newSourceName.trim()}>{loading ? 'Saving...' : '✓ Save'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Sources;
