import React, { useState, useEffect } from 'react';
import { FaTimes } from 'react-icons/fa';
import '../Sources/sources.scss';

const Tags = ({ isOpen, onClose }) => {
  const [items, setItems] = useState([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newName, setNewName] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      // load saved tags from localStorage
      try {
        const saved = JSON.parse(localStorage.getItem('leadTags') || '[]');
        if (Array.isArray(saved) && saved.length > 0) setItems(saved);
      } catch (e) {}
    }
  }, [isOpen]);

  const handleAdd = async () => {
    if (!newName.trim()) {
      alert('Please enter a tag name');
      return;
    }
    setLoading(true);
    try {
      // POST placeholder
      const newItem = { id: Math.max(...items.map(i => i.id), 0) + 1, name: newName };
      setItems(prev => [...prev, newItem]);
      try { localStorage.setItem('leadTags', JSON.stringify([...items, newItem])); } catch (e) {}
      setNewName('');
      setShowAddModal(false);
    } catch (err) {
      console.error(err);
      alert('Failed to add');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this tag?')) return;
    try {
      // DELETE placeholder
      const remaining = items.filter(i => i.id !== id);
      setItems(remaining);
      try { localStorage.setItem('leadTags', JSON.stringify(remaining)); } catch (e) {}
    } catch (err) {
      console.error(err);
      alert('Failed to delete');
    }
  };

  const handleKeyPress = (e) => { if (e.key === 'Enter') handleAdd(); };

  if (!isOpen) return null;

  return (
    <div className="tandc-overlay" onClick={onClose}>
      <div className="tandc-dialog" onClick={(e) => e.stopPropagation()}>
        <div className="tandc-dialog-header">
          <div className="title">Tags</div>
          <div className="actions">
            <button className="btn-add small" onClick={() => setShowAddModal(true)}>+ Add</button>
            <button className="close" onClick={onClose}>✕</button>
          </div>
        </div>

        <div className="tandc-dialog-body">
          {items.length === 0 ? (
            <div className="muted">No tags found. Add one.</div>
          ) : (
            items.map(item => (
              <div key={item.id} className="tandc-item">
                <div className="tandc-name">{item.name}</div>
                <div className="item-actions">
                  <button className="icon-button delete" onClick={() => handleDelete(item.id)} title="Delete tag">
                    <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" focusable="false">
                      <path d="M6 19a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z" fill="currentColor"/>
                    </svg>
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {showAddModal && (
          <div className="tandc-overlay" onClick={() => setShowAddModal(false)}>
            <div className="tandc-dialog small" onClick={(e) => e.stopPropagation()}>
              <div className="tandc-dialog-header">
                <div className="title">Add Tag</div>
                <div className="actions">
                  <button className="close" onClick={() => setShowAddModal(false)}>✕</button>
                </div>
              </div>

              <div className="tandc-dialog-body">
                <div className="form-row">
                  <label htmlFor="tag-input">Tag</label>
                  <input id="tag-input" type="text" placeholder="Enter tag name" value={newName} onChange={(e) => setNewName(e.target.value)} onKeyPress={handleKeyPress} autoFocus />
                </div>
              </div>

              <div className="tandc-dialog-footer">
                <button className="btn-primary save" onClick={handleAdd} disabled={loading || !newName.trim()}>{loading ? 'Saving...' : 'Done'}</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Tags;
