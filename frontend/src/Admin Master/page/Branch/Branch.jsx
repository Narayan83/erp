import React, { useState, useEffect } from "react";
import { BASE_URL as API_BASE } from "../../../config/Config";
import "./branch.scss";
import { FaEdit, FaTrash } from "react-icons/fa";

export default function Branch() {
  const [branches, setBranches] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingBranch, setEditingBranch] = useState(null);
  const [formData, setFormData] = useState({
    code: "",
    name: "",
    gst_number: "",
    address: "",
    city: "",
    state: "",
    pincode: "",
    is_head_office: false,
  });

  const fetchBranches = () => {
    setLoading(true);
    fetch(`${API_BASE}/api/company-branches?limit=1000`)
      .then(async res => {
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Failed to fetch branches');
        const raw = Array.isArray(data.data) ? data.data : data;
        const list = Array.isArray(raw) ? raw.map(b => ({ 
          id: b.id,
          code: b.code,
          name: b.name,
          gst_number: b.gst_number,
          address: b.address,
          city: b.city,
          state: b.state,
          pincode: b.pincode,
          is_head_office: b.is_head_office
        })) : [];
        setBranches(list);
      })
      .catch(err => {
        console.error('Fetch branches failed', err);
        alert('Failed to fetch branches');
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchBranches();
  }, []);

  const handleAddBranch = () => {
    setEditingBranch(null);
    setFormData({ code: "", name: "", gst_number: "", address: "", city: "", state: "", pincode: "", is_head_office: false });
    setShowForm(true);
  };

  const handleEdit = (branch) => {
    setEditingBranch(branch);
    setFormData({ 
      code: branch.code || "",
      name: branch.name || "",
      gst_number: branch.gst_number || "",
      address: branch.address || "",
      city: branch.city || "",
      state: branch.state || "",
      pincode: branch.pincode || "",
      is_head_office: branch.is_head_office || false
    });
    setShowForm(true);
  };

  const handleDelete = (branch) => {
    if (!window.confirm("Are you sure you want to delete this branch?")) return;
    fetch(`${API_BASE}/api/company-branches/${branch.id}`, { method: 'DELETE' })
      .then(res => {
        if (!res.ok) throw new Error('Failed to delete branch');
        setBranches(prev => prev.filter(b => String(b.id) !== String(branch.id)));
      })
      .catch(err => {
        console.error('Delete failed', err);
        alert('Failed to delete branch');
      });
  };

  const handleSubmit = () => {
    const { code, name, state } = formData;
    if (!name.trim() || !state.trim() || !code.trim()) {
      alert("Code, Name, and State are required");
      return;
    }
    const payload = { 
      company_id: 1, // Default company ID - adjust as needed
      code: code.trim(),
      name: name.trim(),
      gst_number: formData.gst_number.trim(),
      address: formData.address.trim(),
      city: formData.city.trim(),
      state: state.trim(),
      pincode: formData.pincode.trim(),
      is_head_office: formData.is_head_office
    };
    const url = editingBranch ? `${API_BASE}/api/company-branches/${editingBranch.id}` : `${API_BASE}/api/company-branches`;
    const method = editingBranch ? 'PUT' : 'POST';

    fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    })
      .then(async res => {
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Failed to save branch');
        const saved = data;
        if (editingBranch) {
          setBranches(branches.map(b => b.id === editingBranch.id ? { 
            id: saved.id,
            code: saved.code,
            name: saved.name,
            gst_number: saved.gst_number,
            address: saved.address,
            city: saved.city,
            state: saved.state,
            pincode: saved.pincode,
            is_head_office: saved.is_head_office
          } : b));
        } else {
          setBranches([...branches, { 
            id: saved.id,
            code: saved.code,
            name: saved.name,
            gst_number: saved.gst_number,
            address: saved.address,
            city: saved.city,
            state: saved.state,
            pincode: saved.pincode,
            is_head_office: saved.is_head_office
          }]);
        }
        setShowForm(false);
        setFormData({ code: "", name: "", gst_number: "", address: "", city: "", state: "", pincode: "", is_head_office: false });
      })
      .catch(err => {
        console.error('Save failed', err);
        alert(err.message || 'Failed to save branch');
      });
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditingBranch(null);
    setFormData({ code: "", name: "", gst_number: "", address: "", city: "", state: "", pincode: "", is_head_office: false });
  };

  const filteredBranches = branches;

  return (
    <div className="branch-container">
      <section className="title-section">
        <div>
          <h1 className="page-title">Branch Master</h1>
        </div>
        <div className="actions-row">
          <button className="add-btn" onClick={handleAddBranch}>
            Add Branch
          </button>
        </div>
      </section>

      {showForm && (
        <div className="modal-overlay" onClick={handleCancel}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h2>{editingBranch ? "Edit Branch" : "Add New Branch"}</h2>
            <div className="form-field">
              <label>Code</label>
              <input
                type="text"
                value={formData.code}
                onChange={e => setFormData({ ...formData, code: e.target.value })}
                placeholder="Enter branch code"
              />
            </div>
            <div className="form-field">
              <label>Name</label>
              <input
                type="text"
                value={formData.name}
                onChange={e => setFormData({ ...formData, name: e.target.value })}
                placeholder="Enter branch name"
              />
            </div>
            <div className="form-field">
              <label>GST Number</label>
              <input
                type="text"
                value={formData.gst_number}
                onChange={e => setFormData({ ...formData, gst_number: e.target.value })}
                placeholder="Enter 15-char GSTIN"
                maxLength="15"
              />
            </div>
            <div className="form-field">
              <label>Address</label>
              <input
                type="text"
                value={formData.address}
                onChange={e => setFormData({ ...formData, address: e.target.value })}
                placeholder="Enter address"
              />
            </div>
            <div className="form-field">
              <label>City</label>
              <input
                type="text"
                value={formData.city}
                onChange={e => setFormData({ ...formData, city: e.target.value })}
                placeholder="Enter city"
              />
            </div>
            <div className="form-field">
              <label>State</label>
              <input
                type="text"
                value={formData.state}
                onChange={e => setFormData({ ...formData, state: e.target.value })}
                placeholder="Enter state"
              />
            </div>
            <div className="form-field">
              <label>Pincode</label>
              <input
                type="text"
                value={formData.pincode}
                onChange={e => setFormData({ ...formData, pincode: e.target.value })}
                placeholder="Enter pincode"
              />
            </div>
            <div className="form-field">
              <label>
                <input
                  type="checkbox"
                  checked={formData.is_head_office}
                  onChange={e => setFormData({ ...formData, is_head_office: e.target.checked })}
                />
                Is Head Office
              </label>
            </div>
            <div className="form-buttons">
              <button onClick={handleCancel}>Cancel</button>
              <button onClick={handleSubmit}>{editingBranch ? "Update" : "Add"} Branch</button>
            </div>
          </div>
        </div>
      )}

      <table className="branches-table">
        <thead>
          <tr>
            <th>Code</th>
            <th>Name</th>
            <th>GST Number</th>
            <th>Address</th>
            <th>City</th>
            <th>State</th>
            <th>Pincode</th>
            <th>Head Office</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {filteredBranches.map((branch) => (
            <tr key={branch.id}>
              <td>{branch.code}</td>
              <td>{branch.name}</td>
              <td>{branch.gst_number}</td>
              <td>{branch.address}</td>
              <td>{branch.city}</td>
              <td>{branch.state}</td>
              <td>{branch.pincode}</td>
              <td>{branch.is_head_office ? 'Yes' : 'No'}</td>
              <td>
                <button className="action-btn edit-btn" onClick={() => handleEdit(branch)}>
                  <FaEdit />
                </button>
                <button className="action-btn delete-btn" onClick={() => handleDelete(branch)}>
                  <FaTrash />
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
