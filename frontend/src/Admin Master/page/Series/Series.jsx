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
    document_type: "",
    name: "",
    prefix: "",
    postfix: "",
    prefix_number: 1,
    remarks: "",
    company_id: null,
    company_branch_id: null,
    company_branch_ids: [],
    is_active: true,
  });

  const documentTypes = [
    "Quotation",
    "Sales Order",
    "Purchase Order",
    "Transfer Order",
    "Proforma Invoice",
  ];

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
      
      // Normalize series records: ensure company_branch_ids is an array and document_type exists
      const list = (Array.isArray(data.data) ? data.data : []).map(item => {
        const normalized = { ...item };
        try {
          if (normalized.company_branch_ids) {
            // could be already an array or a JSON string
            if (typeof normalized.company_branch_ids === 'string') {
              normalized.company_branch_ids = JSON.parse(normalized.company_branch_ids);
            }
            if (!Array.isArray(normalized.company_branch_ids)) {
              normalized.company_branch_ids = [];
            }
          } else {
            normalized.company_branch_ids = [];
          }
        } catch (e) {
          normalized.company_branch_ids = [];
        }

        if (!normalized.document_type) normalized.document_type = '';
        return normalized;
      });

      setSeriesList(list);
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
      document_type: "",
      name: "",
      prefix: "",
      postfix: "",
      prefix_number: 1,
      remarks: "",
      company_id: null,
      company_branch_id: null,
      company_branch_ids: [],
      is_active: true,
    });
    setShowForm(true);
  };

  const handleEdit = (series) => {
    // normalize incoming company_branch_ids (can be string or array)
    let branchIds = [];
    try {
      if (series.company_branch_ids) {
        if (typeof series.company_branch_ids === 'string') branchIds = JSON.parse(series.company_branch_ids);
        else if (Array.isArray(series.company_branch_ids)) branchIds = series.company_branch_ids;
      } else if (series.company_branch_id) {
        branchIds = [series.company_branch_id];
      }
    } catch (e) {
      branchIds = series.company_branch_id ? [series.company_branch_id] : [];
    }

    setEditingSeries(series);
    setFormData({
      document_type: series.document_type || "",
      name: series.name || "",
      prefix: series.prefix || "",
      postfix: series.postfix || "",
      prefix_number: series.prefix_number || 1,
      remarks: series.remarks || "",
      company_id: series.company_id || null,
      company_branch_id: series.company_branch_id || (branchIds.length ? branchIds[0] : null),
      company_branch_ids: branchIds,
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

  // Toggle branch selection for multi-select checkboxes
  const toggleBranch = (branchId, checked) => {
    setFormData(prev => {
      const current = Array.isArray(prev.company_branch_ids) ? prev.company_branch_ids.slice() : [];
      let ids = current;
      if (checked) {
        if (!ids.includes(branchId)) ids.push(branchId);
      } else {
        ids = ids.filter(id => id !== branchId);
      }
      return { ...prev, company_branch_ids: ids, company_branch_id: ids.length ? ids[0] : null };
    });
  };

  // Toggle all branches on/off
  const toggleAllBranches = (checked) => {
    setFormData(prev => {
      const ids = checked ? (branches || []).map(b => b.id) : [];
      return { ...prev, company_branch_ids: ids, company_branch_id: ids.length ? ids[0] : null };
    });
  };

  const handleSubmit = async () => {
    const { name, prefix, postfix, prefix_number } = formData;
    
    if (!name.trim() || !prefix.trim() || !postfix.trim()) {
      alert("Name, Prefix, and Postfix are required");
      return;
    }

    const payload = {
      document_type: formData.document_type || null,
      name: name.trim(),
      prefix: prefix.trim(),
      postfix: postfix.trim(),
      remarks: formData.remarks.trim(),
      prefix_number: formData.prefix_number,
      company_id: formData.company_id || null,
      company_branch_ids: formData.company_branch_ids || [],
      company_branch_id: formData.company_branch_id || (formData.company_branch_ids && formData.company_branch_ids.length ? formData.company_branch_ids[0] : null),
      is_active: formData.is_active,
    };  

    const url = editingSeries 
      ? `${BASE_URL}/api/series/${editingSeries.id}` 
      : `${BASE_URL}/api/series`;
    const method = editingSeries ? 'PUT' : 'POST';

    try {
      // Debug: log payload being sent to backend (helps verify document_type & branch ids)
      console.debug('Saving series payload:', payload);

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
        document_type: "",
        name: "",
        prefix: "",
        postfix: "",
        prefix_number: 1,
        remarks: "",
        company_id: null,
        company_branch_id: null,
        company_branch_ids: [],
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
      document_type: "",
      name: "",
      prefix: "",
      postfix: "",
      prefix_number: 1,
      remarks: "",
      company_id: null,
      company_branch_id: null,
      company_branch_ids: [],
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

  // Return a readable string for series' branch selections (compact)
  const getBranchNames = (series) => {
    let ids = [];
    if (series && series.company_branch_ids) {
      if (typeof series.company_branch_ids === 'string') {
        try { ids = JSON.parse(series.company_branch_ids); } catch (e) { ids = []; }
      } else if (Array.isArray(series.company_branch_ids)) {
        ids = series.company_branch_ids;
      }
    } else if (series && series.company_branch_id) {
      ids = [series.company_branch_id];
    }

    const names = ids.map(id => {
      const b = branches.find(x => x.id === id);
      return b ? b.name : null;
    }).filter(Boolean);

    if (names.length === 0) return getBranchName(series.company_branch_id);
    if (branches.length > 0 && names.length === branches.length) return `All (${names.length})`;
    if (names.length <= 2) return names.join(', ');
    return `${names.slice(0,2).join(', ')} (+${names.length - 2})`;
  };

  // Return array of branch names for vertical display
  const getBranchNameArray = (series) => {
    let ids = [];
    if (series && series.company_branch_ids) {
      if (typeof series.company_branch_ids === 'string') {
        try { ids = JSON.parse(series.company_branch_ids); } catch (e) { ids = []; }
      } else if (Array.isArray(series.company_branch_ids)) {
        ids = series.company_branch_ids;
      }
    } else if (series && series.company_branch_id) {
      ids = [series.company_branch_id];
    }

    const names = ids.map(id => {
      const b = branches.find(x => x.id === id);
      return b ? b.name : null;
    }).filter(Boolean);

    return names;
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
              <label>Document Type</label>
              <select
                value={formData.document_type || ""}
                onChange={e => setFormData({ ...formData, document_type: e.target.value })}
              >
                <option value="">-- Select Document Type --</option>
                {documentTypes.map(dt => (
                  <option key={dt} value={dt}>
                    {dt}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-field">
              <label>Name *</label>
              <input
                type="text"
                value={formData.name}
                onChange={e => setFormData({ ...formData, name: e.target.value })}
              />
            </div>

            <div className="form-field">
              <label>Prefix *</label>
              <input
                type="text"
                value={formData.prefix}
                onChange={e => setFormData({ ...formData, prefix: e.target.value })}
              />
            </div>

            <div className="form-field">
              <label>Postfix *</label>
              <input
                type="text"
                value={formData.postfix}
                onChange={e => setFormData({ ...formData, postfix: e.target.value })}
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
              <div className="branch-checkbox-list">
                <label className="branch-item branch-all">
                  <input
                    type="checkbox"
                    checked={branches.length > 0 && Array.isArray(formData.company_branch_ids) && formData.company_branch_ids.length === branches.length}
                    onChange={e => toggleAllBranches(e.target.checked)}
                  />
                  All
                </label>

                {branches.map(branch => (
                  <label key={branch.id} className="branch-item">
                    <input
                      type="checkbox"
                      checked={Array.isArray(formData.company_branch_ids) ? formData.company_branch_ids.includes(branch.id) : false}
                      onChange={e => toggleBranch(branch.id, e.target.checked)}
                    />
                    {branch.name}
                  </label>
                ))}
              </div>
              <small className="muted">Select one or more branches</small>
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
                <th>Document Type</th>
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
                    <td>{series.document_type || '-'}</td>
                    <td><strong>{series.name}</strong></td>
                    <td>{series.prefix}</td>
                    <td>{series.postfix}</td>
                    <td>{series.remarks || '-'}</td>
                    <td>
                      <div className="branch-list">
                        {(() => {
                          const names = getBranchNameArray(series);
                          if (!names || names.length === 0) return <div className="branch-name">-</div>;
                          return names.map((n, i) => (
                            <div key={i} className="branch-name">
                              {n}{i < names.length - 1 ? ',' : ''}
                            </div>
                          ));
                        })()}
                      </div>
                    </td>
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
