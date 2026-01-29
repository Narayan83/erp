import React, { useState, useEffect } from 'react';
import { FaTimes, FaEdit, FaTrash } from 'react-icons/fa';
import './sources.scss';

const apiBase = '/api';

const Sources = ({ isOpen, onClose }) => {
  const [sources, setSources] = useState([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newSourceName, setNewSourceName] = useState('');
  const [loading, setLoading] = useState(false);

  const [showEditModal, setShowEditModal] = useState(false);
  const [editingSource, setEditingSource] = useState({ id: null, name: '', code: '', description: '' });

  const genCode = (name) => name.toLowerCase().trim().replace(/\s+/g, '-').replace(/[^a-z0-9\-]/g, '').slice(0, 50);

  const fetchSources = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${apiBase}/lead-sources`);
      if (!res.ok) throw new Error('Failed to fetch');
      const data = await res.json();
      setSources(data || []);
    } catch (err) {
      console.error('Failed to load sources', err);
      alert('Failed to load lead sources');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) fetchSources();
  }, [isOpen]);

  const handleAddSource = async () => {
    if (!newSourceName.trim()) { alert('Please enter a source name'); return; }
    setLoading(true);
    try {
      const payload = { code: genCode(newSourceName), name: newSourceName };
      const res = await fetch(`${apiBase}/lead-sources`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'Create failed');
      }
      const created = await res.json();
      setSources(prev => [...prev, created]);
      setNewSourceName('');
      setShowAddModal(false);
    } catch (error) {
      console.error('Error adding source:', error);
      alert('Failed to add source: ' + error.message);
    } finally { setLoading(false); }
  };

  const handleDeleteSource = async (id) => {
    if (!window.confirm('Are you sure you want to delete this source?')) return;
    try {
      const res = await fetch(`${apiBase}/lead-sources/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Delete failed');
      setSources(prev => prev.filter(s => s.id !== id));
    } catch (error) {
      console.error('Error deleting source:', error);
      alert('Failed to delete source');
    }
  };

  const openEdit = (s) => { setEditingSource({ id: s.id, name: s.name, code: s.code || genCode(s.name), description: s.description || '' }); setShowEditModal(true); };

  const handleUpdateSource = async () => {
    const { id, name, code } = editingSource;
    if (!name.trim()) { alert('Name is required'); return; }
    setLoading(true);
    try {
      const payload = { name, code };
      const res = await fetch(`${apiBase}/lead-sources/${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'Update failed');
      }
      const updated = await res.json();
      setSources(prev => prev.map(s => s.id === updated.ID || s.id === updated.id ? updated : s));
      setShowEditModal(false);
    } catch (error) {
      console.error('Error updating source:', error);
      alert('Failed to update source');
    } finally { setLoading(false); }
  };

  const handleKeyPress = (e) => { if (e.key === 'Enter') handleAddSource(); };
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
          {loading ? (
            <div className="muted">Loading...</div>
          ) : sources.length === 0 ? (
            <div className="muted">No sources found. Add one.</div>
          ) : (
            sources.map((source) => (
              <div className="tandc-item" key={source.id}>
                <div className="tandc-name">
                  {source.name}
                </div>
                <div className="item-actions">
                  <button className="icon-button edit" onClick={() => openEdit(source)} title="Edit source">
                    <FaEdit />
                  </button>
                  <button className="icon-button delete" onClick={() => handleDeleteSource(source.id)} title="Delete source">
                    <FaTrash />
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

      {showEditModal && (
        <div className="tandc-overlay" onClick={() => setShowEditModal(false)}>
          <div className="tandc-dialog small" onClick={(e) => e.stopPropagation()}>
            <div className="tandc-dialog-header">
              <div className="title">Edit Lead Source</div>
              <div className="actions">
                <button className="close" onClick={() => setShowEditModal(false)}>✕</button>
              </div>
            </div>

            <div className="tandc-dialog-body">
              <div className="form-row">
                <label htmlFor="edit-source-name">Source</label>
                <input id="edit-source-name" type="text" placeholder="Enter source name" value={editingSource.name} onChange={(e) => setEditingSource(prev => ({ ...prev, name: e.target.value }))} autoFocus />
              </div>
            </div>

            <div className="tandc-dialog-footer">
              <button className="btn-primary save" onClick={handleUpdateSource} disabled={loading || !editingSource.name.trim()}>{loading ? 'Saving...' : 'Update'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Sources;
