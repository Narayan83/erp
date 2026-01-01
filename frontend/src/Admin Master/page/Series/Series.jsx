import React, { useState, useEffect } from "react";
import { BASE_URL } from "../../../config/Config";
import "./series.scss";
import { FaEdit, FaTrash } from "react-icons/fa";

export default function Series() {
  const [seriesList, setSeriesList] = useState([]);
  const [branches, setBranches] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingSeries, setEditingSeries] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0
  });
  
  const [formData, setFormData] = useState({
    name: "",
    prefix: "",
    postfix: "",
    prefix_number: 1,
    remarks: "",
    company_id: null,
    company_branch_id: null,
    is_active: true,
  });

  useEffect(() => {
    fetchBranches();
    fetchSeries();
  }, [pagination.page, pagination.limit, searchQuery]);

  const fetchBranches = async () => {
    try {
      const res = await fetch(`${BASE_URL}/api/company-branches?limit=1000`);
      const data = await res.json();
      const branchList = Array.isArray(data.data) ? data.data : data;
      setBranches(Array.isArray(branchList) ? branchList : []);
    } catch (err) {
      console.error('Fetch branches failed', err);
      setBranches([]);
    }
  };

  const fetchSeries = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: pagination.page,
        limit: pagination.limit,
      });
      
      if (searchQuery) {
        params.append('search', searchQuery);
      }

      const res = await fetch(`${BASE_URL}/api/series?${params}`);
      const data = await res.json();
      
      setSeriesList(Array.isArray(data.data) ? data.data : []);
      setPagination(prev => ({
        ...prev,
        total: data.total || 0
      }));
    } catch (err) {
      console.error('Fetch series failed', err);
      setSeriesList([]);
    } finally {
      setLoading(false);
    }
  };

  const handleAddSeries = () => {
    setEditingSeries(null);
    setFormData({
      name: "",
      prefix: "",
      postfix: "",
      prefix_number: 1,
      remarks: "",
      company_id: null,
      company_branch_id: null,
      is_active: true,
    });
    setShowForm(true);
  };

  const handleEdit = (series) => {
    setEditingSeries(series);
    setFormData({
      name: series.name || "",
      prefix: series.prefix || "",
      postfix: series.postfix || "",
      prefix_number: series.prefix_number || 1,
      remarks: series.remarks || "",
      company_id: series.company_id || null,
      company_branch_id: series.company_branch_id || null,
      is_active: series.is_active !== undefined ? series.is_active : true,
    });
    setShowForm(true);
  };

  const handleDelete = async (series) => {
    if (!window.confirm(`Are you sure you want to delete series "${series.prefix}"?`)) return;
    
    try {
      const res = await fetch(`${BASE_URL}/api/series/${series.id}`, { 
        method: 'DELETE' 
      });
      
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to delete series');
      }
      
      fetchSeries();
    } catch (err) {
      console.error('Delete failed', err);
      alert(err.message || 'Failed to delete series');
    }
  };

  const handleSubmit = async () => {
    const { name, prefix, postfix, prefix_number } = formData;
    
    if (!name.trim() || !prefix.trim() || !postfix.trim()) {
      alert("Name, Prefix, and Postfix are required");
      return;
    }

    const payload = {
      name: name.trim(),
      prefix: prefix.trim(),
      postfix: postfix.trim(),
      remarks: formData.remarks.trim(),
      prefix_number: formData.prefix_number,
      company_id: formData.company_id || null,
      company_branch_id: formData.company_branch_id || null,
      is_active: formData.is_active,
    };

    const url = editingSeries 
      ? `${BASE_URL}/api/series/${editingSeries.id}` 
      : `${BASE_URL}/api/series`;
    const method = editingSeries ? 'PUT' : 'POST';

    try {
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.error || 'Failed to save series');
      }

      setShowForm(false);
      setFormData({
        name: "",
        prefix: "",
        postfix: "",
        prefix_number: 1,
        remarks: "",
        company_id: null,
        company_branch_id: null,
        is_active: true,
      });
      fetchSeries();
    } catch (err) {
      console.error('Save failed', err);
      alert(err.message || 'Failed to save series');
    }
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditingSeries(null);
    setFormData({
      name: "",
      prefix: "",
      postfix: "",
      prefix_number: 1,
      remarks: "",
      company_id: null,
      company_branch_id: null,
      is_active: true,
    });
  };

  const handleSearch = (e) => {
    setSearchQuery(e.target.value);
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const handlePageChange = (newPage) => {
    setPagination(prev => ({ ...prev, page: newPage }));
  };

  const totalPages = Math.ceil(pagination.total / pagination.limit);

  const getBranchName = (branchId) => {
    const branch = branches.find(b => b.id === branchId);
    return branch ? branch.name : '-';
  };

  return (
    <div className="series-container">
      <section className="title-section">
        <div>
          <h1 className="page-title">Series Master</h1>
        </div>
        <div className="actions-row">
          <input
            type="text"
            className="search-input"
            placeholder="Search by prefix or remarks..."
            value={searchQuery}
            onChange={handleSearch}
          />
          <button className="add-btn" onClick={handleAddSeries}>
            Add Series
          </button>
        </div>
      </section>

      {showForm && (
        <div className="modal-overlay" onClick={handleCancel}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h2>{editingSeries ? "Edit Series" : "Add New Series"}</h2>
            
            <div className="form-field">
              <label>Name *</label>
              <input
                type="text"
                value={formData.name}
                onChange={e => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g. Estimate, Invoice, Purchase Order"
              />
            </div>

            <div className="form-field">
              <label>Prefix *</label>
              <input
                type="text"
                value={formData.prefix}
                onChange={e => setFormData({ ...formData, prefix: e.target.value })}
                placeholder="e.g. EC, INV, PO, DN, CN"
              />
            </div>

            <div className="form-field">
              <label>Postfix *</label>
              <input
                type="text"
                value={formData.postfix}
                onChange={e => setFormData({ ...formData, postfix: e.target.value })}
                placeholder="e.g. /2024, /12, -A"
              />
            </div>

            <div className="form-field">
              <label>Remarks</label>
              <textarea
                value={formData.remarks}
                onChange={e => setFormData({ ...formData, remarks: e.target.value })}
                placeholder="Enter remarks"
                rows="3"
              />
            </div>

            <div className="form-field">
              <label>Company Branch</label>
              <select
                value={formData.company_branch_id || ""}
                onChange={e => setFormData({ 
                  ...formData, 
                  company_branch_id: e.target.value ? parseInt(e.target.value) : null 
                })}
              >
                <option value="">-- Select Branch --</option>
                {branches.map(branch => (
                  <option key={branch.id} value={branch.id}>
                    {branch.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-field checkbox-field">
              <label>
                <input
                  type="checkbox"
                  checked={formData.is_active}
                  onChange={e => setFormData({ ...formData, is_active: e.target.checked })}
                />
                Is Active
              </label>
            </div>

            <div className="form-buttons">
              <button onClick={handleCancel}>Cancel</button>
              <button onClick={handleSubmit}>
                {editingSeries ? "Update" : "Add"} Series
              </button>
            </div>
          </div>
        </div>
      )}

      {loading ? (
        <div className="loading">Loading...</div>
      ) : (
        <>
          <table className="series-table">
            <thead>
              <tr>
                <th>S.No</th>
                <th>Name</th>
                <th>Prefix</th>
                <th>Postfix</th>
                <th>Remarks</th>
                <th>Company Branch</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {seriesList.length === 0 ? (
                <tr>
                  <td colSpan="8" className="no-data">No series found</td>
                </tr>
              ) : (
                seriesList.map((series, index) => (
                  <tr key={series.id}>
                    <td>{(pagination.page - 1) * pagination.limit + index + 1}</td>
                    <td><strong>{series.name}</strong></td>
                    <td>{series.prefix}</td>
                    <td>{series.postfix}</td>
                    <td>{series.remarks || '-'}</td>
                    <td>{getBranchName(series.company_branch_id)}</td>
                    <td>
                      <span className={`status-badge ${series.is_active ? 'active' : 'inactive'}`}>
                        {series.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td>
                      <button 
                        className="action-btn edit-btn" 
                        onClick={() => handleEdit(series)}
                        title="Edit"
                      >
                        <FaEdit />
                      </button>
                      <button 
                        className="action-btn delete-btn" 
                        onClick={() => handleDelete(series)}
                        title="Delete"
                      >
                        <FaTrash />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>

          {totalPages > 1 && (
            <div className="pagination">
              <button
                disabled={pagination.page === 1}
                onClick={() => handlePageChange(pagination.page - 1)}
              >
                Previous
              </button>
              <span>
                Page {pagination.page} of {totalPages} (Total: {pagination.total})
              </span>
              <button
                disabled={pagination.page >= totalPages}
                onClick={() => handlePageChange(pagination.page + 1)}
              >
                Next
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
