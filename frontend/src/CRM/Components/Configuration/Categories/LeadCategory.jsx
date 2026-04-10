import React, { useEffect, useRef, useState } from 'react';
import { FaEdit, FaTrash } from 'react-icons/fa';
import { getAuthHeaders } from '../../../../config/Config';
import '../Sources/sources.scss';

const apiBase = '/api';

const LeadCategory = ({ isOpen, onClose }) => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [newName, setNewName] = useState('');
  const [editing, setEditing] = useState({ id: null, name: '', code: '', description: '' });

  const addInputRef = useRef(null);
  const editInputRef = useRef(null);

  const genCode = (name) => name.toLowerCase().trim().replace(/\s+/g, '-').replace(/[^a-z0-9\-]/g, '').slice(0, 50);

  const normalizeItem = (item) => ({
    id: item?.id ?? item?.ID,
    name: item?.name ?? item?.Name ?? '',
    code: item?.code ?? item?.Code ?? '',
    description: item?.description ?? item?.Description ?? '',
  });

  const fetchItems = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${apiBase}/lead-categories`, { headers: getAuthHeaders() });
      if (!res.ok) {
        const txt = await res.text().catch(() => '');
        throw new Error(`Failed to fetch: ${res.status} ${txt}`);
      }
      const data = await res.json();
      setItems(Array.isArray(data) ? data.map(normalizeItem) : []);
    } catch (err) {
      console.error('Failed to load lead categories', err);
      alert('Failed to load lead categories: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) fetchItems();
  }, [isOpen]);

  useEffect(() => {
    if (showAddModal && addInputRef.current) {
      setTimeout(() => addInputRef.current.focus(), 50);
    }
  }, [showAddModal]);

  useEffect(() => {
    if (showEditModal && editInputRef.current) {
      setTimeout(() => editInputRef.current.focus(), 50);
    }
  }, [showEditModal]);

  const handleAdd = async () => {
    if (!newName.trim()) {
      alert('Please enter a category name');
      return;
    }
    setLoading(true);
    try {
      const payload = { code: genCode(newName), name: newName.trim() };
      const res = await fetch(`${apiBase}/lead-categories`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'Create failed');
      }
      const created = normalizeItem(await res.json());
      setItems((prev) => [...prev, created].sort((a, b) => a.name.localeCompare(b.name)));
      setNewName('');
      setShowAddModal(false);
    } catch (err) {
      console.error('Error adding lead category:', err);
      alert('Failed to add lead category: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this category?')) return;
    try {
      const res = await fetch(`${apiBase}/lead-categories/${id}`, { method: 'DELETE', headers: getAuthHeaders() });
      if (!res.ok) throw new Error('Delete failed');
      setItems((prev) => prev.filter((item) => item.id !== id));
    } catch (err) {
      console.error('Error deleting lead category:', err);
      alert('Failed to delete lead category');
    }
  };

  const openEdit = (item) => {
    setEditing({
      id: item.id,
      name: item.name,
      code: item.code || genCode(item.name),
      description: item.description || '',
    });
    setShowEditModal(true);
  };

  const handleUpdate = async () => {
    if (!editing.name.trim()) {
      alert('Category name is required');
      return;
    }
    setLoading(true);
    try {
      const payload = { name: editing.name.trim(), code: editing.code || genCode(editing.name), description: editing.description || '' };
      const res = await fetch(`${apiBase}/lead-categories/${editing.id}`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'Update failed');
      }
      const updated = normalizeItem(await res.json());
      setItems((prev) => prev.map((item) => (item.id === updated.id ? updated : item)).sort((a, b) => a.name.localeCompare(b.name)));
      setShowEditModal(false);
    } catch (err) {
      console.error('Error updating lead category:', err);
      alert('Failed to update lead category: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleAddKeyPress = (e) => {
    if (e.key === 'Enter') handleAdd();
  };

  const handleEditKeyPress = (e) => {
    if (e.key === 'Enter') handleUpdate();
  };

  if (!isOpen) return null;

  return (
    <div className="tandc-overlay" onClick={onClose}>
      <div className="tandc-dialog" onClick={(e) => e.stopPropagation()}>
        <div className="tandc-dialog-header">
          <div className="title">Lead Categories</div>
          <div className="actions">
            <button className="btn-add small" onClick={() => setShowAddModal(true)}>+ Add</button>
            <button className="close" onClick={onClose}>✕</button>
          </div>
        </div>

        <div className="tandc-dialog-body">
          {loading ? (
            <div className="muted">Loading...</div>
          ) : items.length === 0 ? (
            <div className="muted">No lead categories found. Add one.</div>
          ) : (
            items.map((item) => (
              <div className="tandc-item" key={item.id}>
                <div className="tandc-name">{item.name}</div>
                <div className="item-actions">
                  <button className="icon-button edit" onClick={() => openEdit(item)} title="Edit lead category">
                    <FaEdit />
                  </button>
                  <button className="icon-button delete" onClick={() => handleDelete(item.id)} title="Delete lead category">
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
              <div className="title">Add Lead Category</div>
              <div className="actions">
                <button className="close" onClick={() => setShowAddModal(false)}>✕</button>
              </div>
            </div>

            <div className="tandc-dialog-body">
              <div className="form-row">
                <label htmlFor="lead-category-input">Category</label>
                <input
                  ref={addInputRef}
                  id="lead-category-input"
                  type="text"
                  placeholder="Enter category name"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  onKeyPress={handleAddKeyPress}
                />
              </div>
            </div>

            <div className="tandc-dialog-footer">
              <button className="btn-primary save" onClick={handleAdd} disabled={loading || !newName.trim()}>
                {loading ? 'Saving...' : 'Done'}
              </button>
            </div>
          </div>
        </div>
      )}

      {showEditModal && (
        <div className="tandc-overlay" onClick={() => setShowEditModal(false)}>
          <div className="tandc-dialog small" onClick={(e) => e.stopPropagation()}>
            <div className="tandc-dialog-header">
              <div className="title">Edit Lead Category</div>
              <div className="actions">
                <button className="close" onClick={() => setShowEditModal(false)}>✕</button>
              </div>
            </div>

            <div className="tandc-dialog-body">
              <div className="form-row">
                <label htmlFor="edit-lead-category-name">Category</label>
                <input
                  ref={editInputRef}
                  id="edit-lead-category-name"
                  type="text"
                  placeholder="Enter category name"
                  value={editing.name}
                  onChange={(e) => setEditing((prev) => ({ ...prev, name: e.target.value }))}
                  onKeyPress={handleEditKeyPress}
                />
              </div>
            </div>

            <div className="tandc-dialog-footer">
              <button className="btn-primary save" onClick={handleUpdate} disabled={loading || !editing.name.trim()}>
                {loading ? 'Saving...' : 'Update'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LeadCategory;