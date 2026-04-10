import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { FiEdit2, FiSlash, FiTrash2 } from 'react-icons/fi';
import { BASE_URL, getAuthHeaders } from '../config/Config';

const LeadProductManager = ({ isOpen, onClose }) => {
  const [items, setItems] = useState([]);
  const [newName, setNewName] = useState('');
  const [editingItem, setEditingItem] = useState(null);
  const [formError, setFormError] = useState('');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const loadItems = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${BASE_URL}/api/lead-products`, { headers: getAuthHeaders() });
      setItems(Array.isArray(res.data) ? res.data : (res.data?.data || []));
    } catch (error) {
      console.error('Failed to load lead products:', error);
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadItems();
    }
  }, [isOpen]);

  const handleCreate = async () => {
    const name = newName.trim();
    if (!name) {
      setFormError('Product name is required');
      return;
    }

    setSaving(true);
    setFormError('');
    try {
      if (editingItem?.id) {
        await axios.put(`${BASE_URL}/api/lead-products/${editingItem.id}`, { name }, { headers: getAuthHeaders() });
      } else {
        await axios.post(`${BASE_URL}/api/lead-products`, { name, active: true }, { headers: getAuthHeaders() });
      }
      setNewName('');
      setEditingItem(null);
      await loadItems();
    } catch (error) {
      setFormError(error?.response?.data?.error || `Failed to ${editingItem?.id ? 'update' : 'save'} product`);
    } finally {
      setSaving(false);
    }
  };

  const handleToggle = async (item) => {
    try {
      await axios.put(`${BASE_URL}/api/lead-products/${item.id}`, {
        active: !item.active,
      }, { headers: getAuthHeaders() });
      await loadItems();
    } catch (error) {
      alert(error?.response?.data?.error || 'Failed to update product');
    }
  };

  const handleEdit = async (item) => {
    setEditingItem(item);
    setNewName(item?.name || '');
    setFormError('');
  };

  const cancelEdit = () => {
    setEditingItem(null);
    setNewName('');
    setFormError('');
  };

  const handleDelete = async (item) => {
    const ok = window.confirm(`Delete product '${item.name}'?`);
    if (!ok) return;

    try {
      await axios.delete(`${BASE_URL}/api/lead-products/${item.id}`, { headers: getAuthHeaders() });
      await loadItems();
    } catch (error) {
      alert(error?.response?.data?.error || 'Failed to delete product');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="crm-modal-overlay" onClick={onClose}>
      <div className="crm-modal-card" onClick={(e) => e.stopPropagation()}>
        <div className="crm-modal-header">
          <h3>CRM Product List</h3>
          <button type="button" className="crm-modal-close" onClick={onClose}>x</button>
        </div>

        <div className="crm-modal-body">
          <div className="crm-modal-row">
            <input
              type="text"
              value={newName}
              onChange={(e) => {
                setNewName(e.target.value);
                if (formError) setFormError('');
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !saving && newName.trim()) {
                  e.preventDefault();
                  handleCreate();
                }
              }}
              placeholder={editingItem ? 'Edit product name' : 'Enter product name'}
              className={`crm-modal-input ${formError ? 'has-error' : ''}`}
            />
            <button type="button" className="crm-modal-btn" onClick={handleCreate} disabled={saving || !newName.trim()}>
              {saving ? (editingItem ? 'Updating...' : 'Saving...') : (editingItem ? 'Update' : 'Add')}
            </button>
            {editingItem && (
              <button type="button" className="crm-modal-btn secondary" onClick={cancelEdit} disabled={saving}>
                Cancel
              </button>
            )}
          </div>
          {formError && <div className="crm-inline-error">{formError}</div>}

          <div className="crm-modal-table-wrap">
            <table className="crm-modal-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading && (
                  <tr>
                    <td colSpan={3}>Loading...</td>
                  </tr>
                )}
                {!loading && items.length === 0 && (
                  <tr>
                    <td colSpan={3}>No products added yet.</td>
                  </tr>
                )}
                {!loading && items.map((item) => (
                  <tr key={item.id}>
                    <td>{item.name}</td>
                    <td>{item.active ? 'Active' : 'Inactive'}</td>
                    <td>
                      <div className="crm-action-icons">
                        <button
                          type="button"
                          className="crm-icon-btn edit"
                          title="Edit"
                          aria-label={`Edit ${item.name}`}
                          onClick={() => handleEdit(item)}
                        >
                          <FiEdit2 />
                        </button>
                        <button
                          type="button"
                          className="crm-icon-btn disable"
                          title={item.active ? 'Disable' : 'Enable'}
                          aria-label={`${item.active ? 'Disable' : 'Enable'} ${item.name}`}
                          onClick={() => handleToggle(item)}
                        >
                          <FiSlash />
                        </button>
                        <button
                          type="button"
                          className="crm-icon-btn delete"
                          title="Delete"
                          aria-label={`Delete ${item.name}`}
                          onClick={() => handleDelete(item)}
                        >
                          <FiTrash2 />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LeadProductManager;
