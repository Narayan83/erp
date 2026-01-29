import React, { useState, useEffect } from 'react';
import { FaTimes, FaEdit, FaTrash } from 'react-icons/fa';
import '../Sources/sources.scss';

const apiBase = '/api';

const RejectionReasons = ({ isOpen, onClose }) => {
  const [items, setItems] = useState([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [loading, setLoading] = useState(false);

  const [showEditModal, setShowEditModal] = useState(false);
  const [editing, setEditing] = useState({ id: null, title: '', code: '' });

  const genCode = (title) => title.toLowerCase().trim().replace(/\s+/g, '-').replace(/[^a-z0-9\-]/g, '').slice(0, 50);

  const fetchReasons = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${apiBase}/rejection-reasons`);
      if (!res.ok) throw new Error('Failed to fetch');
      const data = await res.json();
      setItems(data || []);
    } catch (err) {
      console.error('Failed to load reasons', err);
      alert('Failed to load rejection reasons');
    } finally { setLoading(false); }
  };

  useEffect(() => { if (isOpen) fetchReasons(); }, [isOpen]);

  const handleAdd = async () => {
    if (!newTitle.trim()) { alert('Please enter a title'); return; }
    setLoading(true);
    try {
      const payload = { code: genCode(newTitle), title: newTitle, };
      const res = await fetch(`${apiBase}/rejection-reasons`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'Create failed');
      }
      const created = await res.json();
      setItems(prev => [...prev, created]);
      setNewTitle(''); setShowAddModal(false);
    } catch (err) { console.error(err); alert('Failed to add reason'); } finally { setLoading(false); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this reason?')) return;
    try {
      const res = await fetch(`${apiBase}/rejection-reasons/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Delete failed');
      setItems(prev => prev.filter(i => i.id !== id));
    } catch (err) { console.error(err); alert('Failed to delete'); }
  };

  const openEdit = (r) => { setEditing({ id: r.id, title: r.title, code: r.code || genCode(r.title) }); setShowEditModal(true); };

  const handleUpdate = async () => {
    const { id, title, code } = editing;
    if (!title.trim()) { alert('Title required'); return; }
    setLoading(true);
    try {
      const payload = { title, code };
      const res = await fetch(`${apiBase}/rejection-reasons/${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'Update failed');
      }
      const updated = await res.json();
      setItems(prev => prev.map(i => i.id === updated.ID || i.id === updated.id ? updated : i));
      setShowEditModal(false);
    } catch (err) { console.error(err); alert('Failed to update'); } finally { setLoading(false); }
  };

  const handleKeyPress = (e) => { if (e.key === 'Enter') handleAdd(); };
  if (!isOpen) return null;

  return (
    <div className="tandc-overlay" onClick={onClose}>
      <div className="tandc-dialog" onClick={(e) => e.stopPropagation()}>
        <div className="tandc-dialog-header">
          <div className="title">Rejection Reasons</div>
          <div className="actions">
            <button className="btn-add small" onClick={() => setShowAddModal(true)}>+ Add</button>
            <button className="close" onClick={onClose}>✕</button>
          </div>
        </div>

        <div className="tandc-dialog-body">
          {loading ? (
            <div className="muted">Loading...</div>
          ) : items.length === 0 ? (
            <div className="muted">No reasons found. Add one.</div>
          ) : (
            items.map(item => (
              <div key={item.id} className="tandc-item">
                <div className="tandc-name">
                  {item.title}
                </div>
                <div className="item-actions">
                  <button className="icon-button edit" onClick={() => openEdit(item)} title="Edit reason">
                    <FaEdit />
                  </button>
                  <button className="icon-button delete" onClick={() => handleDelete(item.id)} title="Delete reason">
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
                <div className="title">Add Rejection Reason</div>
                <div className="actions">
                  <button className="close" onClick={() => setShowAddModal(false)}>✕</button>
                </div>
              </div>

              <div className="tandc-dialog-body">
                <div className="form-row">
                  <label htmlFor="reason-input">Rejection Reason</label>
                  <input id="reason-input" type="text" placeholder="Enter title" value={newTitle} onChange={(e) => setNewTitle(e.target.value)} onKeyPress={handleKeyPress} autoFocus />
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
                <div className="title">Edit Rejection Reason</div>
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

export default RejectionReasons;
