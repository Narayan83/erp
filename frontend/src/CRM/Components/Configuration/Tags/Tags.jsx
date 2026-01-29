import React, { useState, useEffect } from 'react';
import { FaTimes, FaEdit, FaTrash } from 'react-icons/fa';
import '../Sources/sources.scss';

const apiBase = '/api';

const Tags = ({ isOpen, onClose }) => {
  const [items, setItems] = useState([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [loading, setLoading] = useState(false);

  const [showEditModal, setShowEditModal] = useState(false);
  const [editing, setEditing] = useState({ id: null, title: '', code: '' });

  const genCode = (title) => title.toLowerCase().trim().replace(/\s+/g, '-').replace(/[^a-z0-9\-]/g, '').slice(0, 50);

  const fetchTags = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${apiBase}/crm-tags`);
      if (!res.ok) throw new Error('Failed to fetch');
      const data = await res.json();
      setItems(data || []);
    } catch (err) { console.error('Failed to load tags', err); alert('Failed to load tags'); }
    finally { setLoading(false); }
  };

  useEffect(() => { if (isOpen) fetchTags(); }, [isOpen]);

  const handleAdd = async () => {
    if (!newTitle.trim()) { alert('Please enter a title'); return; }
    setLoading(true);
    try {
      const payload = { code: genCode(newTitle), title: newTitle };
      const res = await fetch(`${apiBase}/crm-tags`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      if (!res.ok) { const err = await res.json().catch(() => ({})); throw new Error(err.error || 'Create failed'); }
      const created = await res.json();
      setItems(prev => [...prev, created]);
      setNewTitle(''); setShowAddModal(false);
    } catch (err) { console.error(err); alert('Failed to add tag'); } finally { setLoading(false); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this tag?')) return;
    try {
      const res = await fetch(`${apiBase}/crm-tags/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Delete failed');
      setItems(prev => prev.filter(i => i.id !== id));
    } catch (err) { console.error(err); alert('Failed to delete tag'); }
  };

  const openEdit = (t) => { setEditing({ id: t.id, title: t.title, code: t.code || genCode(t.title) }); setShowEditModal(true); };

  const handleUpdate = async () => {
    const { id, title, code } = editing;
    if (!title.trim()) { alert('Title required'); return; }
    setLoading(true);
    try {
      const payload = { title, code };
      const res = await fetch(`${apiBase}/crm-tags/${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      if (!res.ok) { const err = await res.json().catch(() => ({})); throw new Error(err.error || 'Update failed'); }
      const updated = await res.json();
      setItems(prev => prev.map(i => i.id === updated.ID || i.id === updated.id ? updated : i));
      setShowEditModal(false);
    } catch (err) { console.error(err); alert('Failed to update tag'); } finally { setLoading(false); }
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
          {loading ? (
            <div className="muted">Loading...</div>
          ) : items.length === 0 ? (
            <div className="muted">No tags found. Add one.</div>
          ) : (
            items.map(item => (
              <div key={item.id} className="tandc-item">
                <div className="tandc-name">
                  {item.title}
                </div>
                <div className="item-actions">
                  <button className="icon-button edit" onClick={() => openEdit(item)} title="Edit tag">
                    <FaEdit />
                  </button>
                  <button className="icon-button delete" onClick={() => handleDelete(item.id)} title="Delete tag">
                    <FaTrash />
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
                  <input id="tag-input" type="text" placeholder="Enter tag name" value={newTitle} onChange={(e) => setNewTitle(e.target.value)} onKeyPress={handleKeyPress} autoFocus />
                </div>
              </div>

              <div className="tandc-dialog-footer">
                <button className="btn-primary save" onClick={handleAdd} disabled={loading || !newTitle.trim()}>{loading ? 'Saving...' : 'Done'}</button>
              </div>
            </div>
          </div>
        )}

        {showEditModal && (
          <div className="tandc-overlay" onClick={() => setShowEditModal(false)}>
            <div className="tandc-dialog small" onClick={(e) => e.stopPropagation()}>
              <div className="tandc-dialog-header">
                <div className="title">Edit Tag</div>
                <div className="actions">
                  <button className="close" onClick={() => setShowEditModal(false)}>✕</button>
                </div>
              </div>

              <div className="tandc-dialog-body">
                <div className="form-row">
                  <label>Title</label>
                  <input type="text" value={editing.title} onChange={(e) => setEditing(prev => ({ ...prev, title: e.target.value }))} autoFocus />
                </div>
              </div>

              <div className="tandc-dialog-footer">
                <button className="btn-primary save" onClick={handleUpdate} disabled={loading || !editing.title.trim()}>{loading ? 'Saving...' : 'Update'}</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Tags;
