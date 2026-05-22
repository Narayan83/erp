import React, { useState, useEffect } from "react";
import axios from "axios";
import { BASE_URL } from "../../../config/Config";
import { useAuth } from "../../../context/AuthContext";
import { useLocation } from "react-router-dom";
import "../../styles/role_management.scss";
// Icons
import { FaEdit, FaTrash, FaPlus, FaSearch, FaSync, FaArrowUp, FaArrowDown } from "react-icons/fa";
import RoleCreation from "../RoleCreation/RoleCreation";

export default function ExistingRoles() {
  const { getPermissions } = useAuth();
  const location = useLocation();
  const perms = getPermissions(location.pathname);
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(false);

  // Search & Pagination
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [sortOrder, setSortOrder] = useState('asc');

  // Editing
  const [isEditing, setIsEditing] = useState(false);
  const [editingRole, setEditingRole] = useState(null);

  useEffect(() => {
    fetchRoles();
  }, []);

  const fetchRoles = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${BASE_URL}/api/roles?limit=1000`);
      const data = Array.isArray(res.data) ? res.data : res.data.data || [];
      // Normalize data
      const normalized = data.map(r => ({
        id: r.id,
        name: r.role_name || r.name,
        description: r.description,
        permissions: r.permissions || {}
      }));
      setRoles(normalized);
    } catch (err) {
      console.error("Failed to fetch roles", err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (role) => {
    if (!window.confirm(`Are you sure you want to delete role: ${role.name}?`)) return;

    try {
      await axios.delete(`${BASE_URL}/api/roles/${role.id}`);
      // Optimistic update or refresh
      setRoles(prev => prev.filter(r => r.id !== role.id));
      // fetchRoles(); // Optional: ensure sync
    } catch (err) {
      console.error("Failed to delete role", err);
      alert("Failed to delete role. It may be assigned to users.");
    }
  };

  const handleEdit = (role) => {
    setEditingRole(role);
    setIsEditing(true);
  };

  const handleCreate = () => {
    setEditingRole(null);
    setIsEditing(true);
  };

  const onUpdateSuccess = () => {
    setIsEditing(false);
    setEditingRole(null);
    fetchRoles();
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditingRole(null);
  };

  // --- Filtering & Sorting ---
  const filteredRoles = roles.filter(r =>
    (r.name || "").toLowerCase().includes(search.toLowerCase())
  );

  const sortedRoles = [...filteredRoles].sort((a, b) => {
    const nameA = (a.name || "").toLowerCase();
    const nameB = (b.name || "").toLowerCase();
    return sortOrder === 'asc' ? nameA.localeCompare(nameB) : nameB.localeCompare(nameA);
  });

  const totalPages = Math.ceil(sortedRoles.length / itemsPerPage);
  const paginatedRoles = sortedRoles.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  // Reset page on search
  useEffect(() => { setCurrentPage(1); }, [search]);

  // Implementation of Save logic (Create or Update)
  const handleSaveRole = async (roleData) => {
    console.log("RoleManagement: handleSaveRole initiated", { roleData, editingRole });
    try {
      setLoading(true);
      const payload = {
        role_name: roleData.name,
        description: roleData.description,
        permissions: roleData.permissions
      };

      if (editingRole && editingRole.id) {
        // Update existing role
        console.log("RoleManagement: Calling PUT /api/roles/" + editingRole.id);
        await axios.put(`${BASE_URL}/api/roles/${editingRole.id}`, payload);
      } else {
        // Create new role
        console.log("RoleManagement: Calling POST /api/roles");
        await axios.post(`${BASE_URL}/api/roles`, payload);
      }

      console.log("RoleManagement: Save successful");
      onUpdateSuccess();
      alert(`Role ${editingRole ? "updated" : "created"} successfully!`);
    } catch (err) {
      console.error("RoleManagement: Save failed", err);
      const errorMsg = err.response?.data?.error || err.message || "Failed to save role.";
      alert("Error: " + errorMsg);
    } finally {
      setLoading(false);
    }
  };

  if (isEditing) {
    return (
      <div className="existing-roles-container">
        <RoleCreation
          isEditing={!!editingRole}
          editingRole={editingRole}
          onSave={handleSaveRole}
          onCancel={handleCancelEdit}
        />
      </div>
    )
  }

  return (
    <div className="existing-roles-container">
      <section className="title-section">
        {/* left: title */}
        <div className="title-wrapper">
          <h1 className="page-title">Role Management</h1>
          <div className="subtitle">Manage system roles and definitions</div>
        </div>

        {/* center: search bar (absolutely positioned in CSS) */}
        <div className="search-wrapper">
          <input
            type="text"
            className="search-input"
            placeholder="Search roles..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>

        {/* right: create button */}
        <div className="button-wrapper">
          {perms?.can_create && (
          <button className="create-btn" onClick={handleCreate}>
            <FaPlus /> New Role
          </button>
          )}
        </div>
      </section>

      <div className="roles-table-card">
        <table className="roles-table">
          <thead>
            <tr>
              <th className="sortable-header col-role" onClick={() => setSortOrder(s => s === 'asc' ? 'desc' : 'asc')}>
                Role Name {sortOrder === 'asc' ? <FaArrowUp size={10} /> : <FaArrowDown size={10} />}
              </th>
              <th className="col-desc">Description</th>
              <th className="col-perms">Default Permissions</th>
              <th className="actions-header col-actions">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading && roles.length === 0 ? (
              <tr><td colSpan="4" className="table-message">Loading system roles...</td></tr>
            ) : paginatedRoles.length === 0 ? (
              <tr><td colSpan="4" className="table-message">No roles found matching your search.</td></tr>
            ) : (
              paginatedRoles.map(role => (
                <tr key={role.id}>
                  <td className="role-name-cell col-role">{role.name}</td>
                  <td className="description-cell col-desc" title={role.description}>{role.description}</td>
                  <td className="col-perms">
                    <div className="perm-chips">
                      {role.permissions && Object.entries(role.permissions)
                        .filter(([k, v]) => v)
                        .map(([k]) => (
                          <span key={k} className="perm-chip">
                            {k.replace('can_', '').toUpperCase()}
                          </span>
                        ))
                      }
                      {(!role.permissions || Object.values(role.permissions).every(v => !v)) && "-"}
                    </div>
                  </td>
                  <td className="actions-cell">
                    {perms?.can_update && (
                      <button className="icon-btn edit" onClick={() => handleEdit(role)} title="Edit Role"><FaEdit /></button>
                    )}
                    {perms?.can_delete && (
                      <button className="icon-btn delete" onClick={() => handleDelete(role)} title="Delete Role"><FaTrash /></button>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="pagination">
          <span className="page-info">
            Showing <strong>{(currentPage - 1) * itemsPerPage + 1}</strong> to <strong>{Math.min(currentPage * itemsPerPage, sortedRoles.length)}</strong> of <strong>{sortedRoles.length}</strong> roles
          </span>
          <div className="page-controls">
            <button 
              className="page-btn" 
              disabled={currentPage === 1} 
              onClick={() => setCurrentPage(p => p - 1)}
            >
              Prev
            </button>
            
            {[...Array(totalPages)].map((_, i) => {
              const pageNum = i + 1;
              // Show adjacent pages, first, and last
              if (
                pageNum === 1 || 
                pageNum === totalPages || 
                (pageNum >= currentPage - 1 && pageNum <= currentPage + 1)
              ) {
                return (
                  <button
                    key={pageNum}
                    className={`page-btn ${currentPage === pageNum ? 'active' : ''}`}
                    onClick={() => setCurrentPage(pageNum)}
                  >
                    {pageNum}
                  </button>
                );
              } else if (
                (pageNum === 2 && currentPage > 3) ||
                (pageNum === totalPages - 1 && currentPage < totalPages - 2)
              ) {
                return <span key={pageNum} className="pagination-ellipsis">...</span>;
              }
              return null;
            })}

            <button 
              className="page-btn" 
              disabled={currentPage === totalPages} 
              onClick={() => setCurrentPage(p => p + 1)}
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
