import React, { useState, useEffect } from 'react';
import { FaTimes, FaTrash, FaPlus } from 'react-icons/fa';
import '../Sources/sources.scss';

const RejectionReasons = ({ isOpen, onClose }) => {
  const [items, setItems] = useState([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newName, setNewName] = useState('');
  const [loading, setLoading] = useState(false);

  // Fetch reasons from localStorage when modal opens
  useEffect(() => {
    if (isOpen) {
      try {
        const saved = JSON.parse(localStorage.getItem('leadRejectionReasons') || '[]');
        if (Array.isArray(saved) && saved.length > 0) setItems(saved);
      } catch (e) {
        // ignore
      }
    }
  }, [isOpen]);

  const handleAdd = async () => {
    if (!newName.trim()) { alert('Please enter a reason'); return; }
    setLoading(true);
    try {
      const newItem = { id: Math.max(...items.map(i => i.id), 0) + 1, name: newName };
      setItems(prev => [...prev, newItem]);
      // persist to localStorage
      try { localStorage.setItem('leadRejectionReasons', JSON.stringify([...items, newItem])); } catch (e) {}
      setNewName('');
      setShowAddModal(false);
    } catch (err) {
      console.error(err);
      alert('Failed to add');
    } finally { setLoading(false); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this reason?')) return;
    try { 
      setItems(prev => prev.filter(i => i.id !== id));
      try { localStorage.setItem('leadRejectionReasons', JSON.stringify(items.filter(i => i.id !== id))); } catch (e) {}
    } catch (err) { console.error(err); alert('Failed to delete'); }
  };

  const handleKeyPress = (e) => { if (e.key === 'Enter') handleAdd(); };
  if (!isOpen) return null;

  return (
    <div className="sources-modal-overlay" onClick={onClose}>
      <div className="sources-modal" onClick={(e) => e.stopPropagation()}>
        <div className="sources-modal-header">
          <h2>Rejection Reasons</h2>
          <button className="close-btn" onClick={onClose}><FaTimes /></button>
        </div>

        <div className="sources-modal-content">
          <div className="sources-list-header">
            <span>Rejection Reasons</span>
            <button className="add-btn" onClick={() => setShowAddModal(true)}><FaPlus /> Add</button>
          </div>

          <div className="sources-list">
            {items.length === 0 ? (
              <div className="no-sources">No reasons found. Click Add to create one.</div>
            ) : (
              items.map(item => (
                <div key={item.id} className="source-item">
                  <span className="source-name">{item.name}</span>
                  <button className="delete-btn" onClick={() => handleDelete(item.id)} title="Delete reason"><FaTrash /></button>
                </div>
              ))
            )}
          </div>
        </div>

        {showAddModal && (
          <div className="add-source-modal-overlay" onClick={() => setShowAddModal(false)}>
            <div className="add-source-modal" onClick={(e) => e.stopPropagation()}>
              <div className="add-source-header">
                <h3>Add Rejection Reason</h3>
                <button className="close-btn" onClick={() => setShowAddModal(false)}><FaTimes /></button>
              </div>

              <div className="add-source-content">
                <label htmlFor="reason-input">Reason</label>
                <input id="reason-input" type="text" placeholder="Enter reason" value={newName} onChange={(e) => setNewName(e.target.value)} onKeyPress={handleKeyPress} autoFocus />
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

export default RejectionReasons;
