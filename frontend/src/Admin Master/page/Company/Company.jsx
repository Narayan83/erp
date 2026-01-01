import React, { useState, useEffect } from "react";
import "./company.scss";
import { FaEdit, FaTrash } from "react-icons/fa";
import axios from "axios";
import { BASE_URL } from "../../../config/Config";

export default function Company() {
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingCompany, setEditingCompany] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [formData, setFormData] = useState({
    code: "",
    name: "",
  });

  console.log("🔄 Component rendered, companies state:", companies);

  // Fetch companies on mount
  useEffect(() => {
    fetchCompanies();
  }, []);

  const fetchCompanies = async () => {
    console.log("=== fetchCompanies called ===");
    console.log("BASE_URL:", BASE_URL);
    setLoading(true);
    try {
      const url = `${BASE_URL}/api/companies?limit=1000`;
      console.log("Fetching from:", url);
      const response = await axios.get(url);
      console.log("✅ Full response:", response);
      console.log("Response data:", response.data);
      const data = response.data && response.data.data ? response.data.data : response.data;
      console.log("Extracted data:", data);
      console.log("Is array?", Array.isArray(data));
      if (Array.isArray(data)) {
        console.log("Setting companies to:", data);
        setCompanies(data);
      } else {
        console.warn("Data is not an array, setting empty array");
        setCompanies([]);
      }
    } catch (error) {
      console.error("❌ Error fetching companies:", error);
      alert("Failed to fetch companies: " + (error.response?.data?.error || error.message));
      setCompanies([]);
    } finally {
      setLoading(false);
    }
  };

  const handleAddCompany = () => {
    setEditingCompany(null);
    setFormData({ code: "", name: "" });
    setShowForm(true);
  };

  const handleEdit = (company) => {
    setEditingCompany(company);
    setFormData({
      code: company.code || "",
      name: company.name || "",
    });
    setShowForm(true);
  };

  const handleDelete = async (company) => {
    if (!window.confirm("Are you sure you want to delete this company?")) return;
    try {
      await axios.delete(`${BASE_URL}/api/companies/${company.id}`);
      setCompanies(companies.filter((c) => c.id !== company.id));
    } catch (error) {
      console.error("Delete failed:", error);
      alert("Failed to delete company: " + (error.response?.data?.error || error.message));
    }
  };

  const handleSubmit = async () => {
    const { code, name } = formData;
    if (!code.trim() || !name.trim()) {
      alert("Code and Name are required");
      return;
    }

    const payload = {
      code: code.trim(),
      name: name.trim(),
    };

    try {
      if (editingCompany) {
        // Update existing company
        const response = await axios.put(
          `${BASE_URL}/api/companies/${editingCompany.id}`,
          payload
        );
        const updated = response.data;
        setCompanies(companies.map((c) => (c.id === editingCompany.id ? updated : c)));
      } else {
        // Create new company
        const response = await axios.post(`${BASE_URL}/api/companies`, payload);
        const created = response.data;
        setCompanies([created, ...companies]);
      }
      handleCancel();
    } catch (error) {
      console.error("Save failed:", error);
      alert("Failed to save company: " + (error.response?.data?.error || error.message));
    }
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditingCompany(null);
    setFormData({ code: "", name: "" });
  };

  // Filter companies based on search query
  const filteredCompanies = companies.filter((company) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      String(company.code || "").toLowerCase().includes(q) ||
      String(company.name || "").toLowerCase().includes(q)
    );
  });

  return (
    <div className="company-container">
      <section className="title-section">
        <div>
          <h1 className="page-title">Company Master</h1>
        </div>
        <div className="actions-row">
          <input
            type="text"
            className="search-input"
            placeholder="Search by code or name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <button className="add-btn" onClick={handleAddCompany}>
            + Add Company
          </button>
        </div>
      </section>

      {/* Form Modal */}
      {showForm && (
        <div className="modal-overlay" onClick={handleCancel}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h2>{editingCompany ? "Edit Company" : "Add New Company"}</h2>

            <div className="form-field">
              <label>Code</label>
              <input
                type="text"
                value={formData.code}
                onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                placeholder="Enter company code"
              />
            </div>

            <div className="form-field">
              <label>Name</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Enter company name"
              />
            </div>

            <div className="form-buttons">
              <button className="cancel-btn" onClick={handleCancel}>
                Cancel
              </button>
              <button className="submit-btn" onClick={handleSubmit}>
                {editingCompany ? "Update" : "Add"} Company
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Companies Table */}
      <div className="companies-table-wrapper">
        {loading ? (
          <div className="loading">Loading...</div>
        ) : filteredCompanies.length === 0 ? (
          <div className="empty-state">
            <p>No companies found</p>
          </div>
        ) : (
          <table className="companies-table">
            <thead>
              <tr>
                <th>Code</th>
                <th>Name</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredCompanies.map((company) => (
                <tr key={company.id}>
                  <td>{company.code}</td>
                  <td>{company.name}</td>
                  <td className="actions-cell">
                    <button
                      className="action-btn edit-btn"
                      onClick={() => handleEdit(company)}
                      title="Edit"
                    >
                      <FaEdit />
                    </button>
                    <button
                      className="action-btn delete-btn"
                      onClick={() => handleDelete(company)}
                      title="Delete"
                    >
                      <FaTrash />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
