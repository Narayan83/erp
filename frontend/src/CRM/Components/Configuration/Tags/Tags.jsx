import React, { useState, useEffect } from 'react';
import { FaTimes, FaTrash, FaPlus } from 'react-icons/fa';
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
    <div className="sources-modal-overlay" onClick={onClose}>
      <div className="sources-modal" onClick={(e) => e.stopPropagation()}>
        <div className="sources-modal-header">
          <h2>Tags</h2>
          <button className="close-btn" onClick={onClose}><FaTimes /></button>
        </div>

        <div className="sources-modal-content">
          <div className="sources-list-header">
            <span>Tags</span>
            <button className="add-btn" onClick={() => setShowAddModal(true)}><FaPlus /> Add</button>
          </div>

          <div className="sources-list">
            {items.length === 0 ? (
              <div className="no-sources">No tags found. Click Add to create one.</div>
            ) : (
              items.map(item => (
                <div key={item.id} className="source-item">
                  <span className="source-name">{item.name}</span>
                  <button className="delete-btn" onClick={() => handleDelete(item.id)} title="Delete tag"><FaTrash /></button>
                </div>
              ))
            )}
          </div>
        </div>

        {showAddModal && (
          <div className="add-source-modal-overlay" onClick={() => setShowAddModal(false)}>
            <div className="add-source-modal" onClick={(e) => e.stopPropagation()}>
              <div className="add-source-header">
                <h3>Add Tag</h3>
                <button className="close-btn" onClick={() => setShowAddModal(false)}><FaTimes /></button>
              </div>

              <div className="add-source-content">
                <label htmlFor="tag-input">Tag</label>
                <input id="tag-input" type="text" placeholder="Enter tag name" value={newName} onChange={(e) => setNewName(e.target.value)} onKeyPress={handleKeyPress} autoFocus />
              </div>

              <div className="add-source-footer">
                <button className="save-btn" onClick={handleAdd} disabled={loading || !newName.trim()}>{loading ? 'Saving...' : '✓ Save'}</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Tags;
