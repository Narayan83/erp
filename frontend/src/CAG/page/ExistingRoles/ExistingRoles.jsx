import React, { useState, useEffect } from "react";
const API_BASE = 'http://localhost:8000';
import "../../styles/existing_roles.scss";
import { FaEdit, FaTrash, FaArrowUp, FaArrowDown } from "react-icons/fa";
import RoleCreation from "../RoleCreation/RoleCreation"; // Adjust the import based on your file structure

const defaultOnEdit = () => {};

export default function ExistingRoles({ roles, setRoles, initialRoles, onEditRole = defaultOnEdit }) {
  const [search, setSearch] = useState("");
  const [localRoles, setLocalRoles] = useState(() => {
    if (roles) return roles;
    return JSON.parse(localStorage.getItem("roles") || "[]");
  });
  const [loading, setLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editingRole, setEditingRole] = useState(null);
  const [sortOrder, setSortOrder] = useState('asc');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  const displayRoles = roles || localRoles;

  const displaySetRoles = (newRoles) => {
    if (setRoles && typeof setRoles === "function") {
      setRoles(newRoles);
    } else {
      setLocalRoles(newRoles);
      localStorage.setItem("roles", JSON.stringify(newRoles));
    }
  };

  const safeRoles = Array.isArray(displayRoles) ? displayRoles : [];

  const handleDelete = (name) => {
    if (setRoles && typeof setRoles !== "function") {
      console.error("ExistingRoles: setRoles provided but not a function");
      return;
    }
    if (!window.confirm("Are you sure you want to delete this role?")) {
      return;
    }
    // delete by id when available
    const roleToDelete = safeRoles.find(r => r.name === name || r.id === name?.id);
    if (!roleToDelete) return;

    if (roleToDelete.id) {
      fetch(`${API_BASE}/api/roles/${roleToDelete.id}`, { method: 'DELETE' })
        .then(res => {
          if (!res.ok) throw new Error('Failed to delete role');
          displaySetRoles(safeRoles.filter((role) => role.name !== name));
        })
        .catch(err => {
          console.error('ExistingRoles: delete failed', err);
          alert('Failed to delete role');
        });
    } else {
      displaySetRoles(safeRoles.filter((role) => role.name !== name));
    }
  };

  const handleEdit = (role) => {
    setIsEditing(true);
    setEditingRole(role);
  };

  const handleUpdateRole = (updatedRole, oldName) => {
    // try to find existing role by oldName or id and update via backend if possible
    const target = safeRoles.find(r => r.name === oldName || (updatedRole && updatedRole.id && r.id === updatedRole.id));
    if (target && target.id) {
  const payload = { role_name: updatedRole.name, description: updatedRole.description, permissions: updatedRole.permissions };
  fetch(`${API_BASE}/api/roles/${target.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
        .then(async res => {
          const data = await res.json();
          if (!res.ok) throw new Error(data.error || 'Failed to update role');
          const newRole = { id: data.id, name: data.role_name, description: data.description, permissions: data.permissions };
          const updatedRoles = safeRoles.map((role) => role.id === newRole.id ? newRole : role);
          displaySetRoles(updatedRoles);
          setIsEditing(false);
          setEditingRole(null);
        })
        .catch(err => {
          console.error('ExistingRoles: update failed', err);
          alert(err.message || 'Failed to update role');
        });
    } else {
      const updatedRoles = safeRoles.map((role) =>
        role.name === oldName ? updatedRole : role
      );
      displaySetRoles(updatedRoles);
      setIsEditing(false);
      setEditingRole(null);
    }
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditingRole(null);
  };

  const handleSearch = (e) => {
    setSearch(e.target.value);
    setCurrentPage(1);
  };

  const handleRefresh = () => {
    if (setRoles && typeof setRoles !== "function") {
      console.error("ExistingRoles: setRoles provided but not a function");
      return;
    }
    // fetch fresh list from backend
  fetchRoles();
    setSearch("");
  };

  // fetchRoles must be declared before effects that call it
  function fetchRoles(query = '') {
    setLoading(true);
  const q = query ? `?filter=${encodeURIComponent(query)}&limit=1000` : '?limit=1000';
  fetch(`${API_BASE}/api/roles${q}`)
      .then(async res => {
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Failed to fetch roles');
        const list = Array.isArray(data.data) ? data.data : data;
        const mapped = list.map(r => ({ id: r.id, name: r.role_name || r.RoleName || r.name, description: r.description || '', permissions: r.permissions || {} }));
        displaySetRoles(mapped);
      })
      .catch(err => {
        console.error('ExistingRoles: fetch failed', err);
        if (Array.isArray(initialRoles) && initialRoles.length > 0) displaySetRoles(initialRoles);
      })
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    if (roles) setLocalRoles(roles);
  }, [roles]);

  useEffect(() => {
    // fetch roles on mount
    fetchRoles();

    const onRoleCreated = (e) => {
      const newRole = e.detail;
      displaySetRoles([...(Array.isArray(safeRoles) ? safeRoles : []), newRole]);
    };
    window.addEventListener('roleCreated', onRoleCreated);
    return () => window.removeEventListener('roleCreated', onRoleCreated);
  }, []);

  

  const handleSort = () => {
    setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc');
  };

  const filteredRoles = safeRoles.filter((role) =>
    role.name.toLowerCase().includes(search.toLowerCase())
  );

  const sortedRoles = [...filteredRoles].sort((a, b) => {
    if (sortOrder === 'asc') {
      return a.name.localeCompare(b.name);
    } else {
      return b.name.localeCompare(a.name);
    }
  });

  const totalPages = Math.max(1, Math.ceil(sortedRoles.length / itemsPerPage));
  useEffect(() => {
    if (currentPage > totalPages) setCurrentPage(1);
  }, [sortedRoles.length, itemsPerPage]);

  const paginatedRoles = sortedRoles.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  return (
    <div className="existing-roles-container">
      <section className="title-section">
        <div>
          <h1 className="page-title">Existing Roles</h1>
          <div className="subtitle">Manage all your available roles</div>
        </div>
        <div className="actions-row">
          <input
            type="text"
            className="search-input"
            placeholder="Search role..."
            value={search}
            onChange={handleSearch}
          />
          <button className="refresh-btn" onClick={handleRefresh}>
            Refresh
          </button>
        </div>
      </section>
      {isEditing && (
        <div className="editing-container">
          <RoleCreation
            isEditing={isEditing}
            editingRole={editingRole}
            onUpdateRole={handleUpdateRole}
            onCancel={handleCancelEdit}
          />
        </div>
      )}
      {!isEditing && (
        <table className="roles-table">
          <thead>
            <tr>
              <th onClick={handleSort} style={{ cursor: 'pointer' }}>
                Role Name {sortOrder === 'asc' ? <FaArrowUp /> : <FaArrowDown />}
              </th>
              <th>Description</th>
              <th>Permissions</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {paginatedRoles.map((role) => (
              <tr key={role.name}>
                <td>{role.name}</td>
                <td>{role.description}</td>
                <td>
                  {role.permissions
                    ? Object.entries(role.permissions)
                        .filter(([k, v]) => v && k !== "all")
                        .map(([k]) => k.charAt(0).toUpperCase() + k.slice(1))
                        .join(", ")
                    : ""}
                </td>
                <td>
                  <button
                    className="action-btn edit-btn"
                    title="Edit"
                    onClick={() => handleEdit(role)}
                  >
                    <FaEdit />
                  </button>
                  <button
                    className="action-btn delete-btn"
                    title="Delete"
                    onClick={() => handleDelete(role.name)}
                  >
                    <FaTrash />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
      <div className="pagination">
        <div className="page-info">
          Showing {(sortedRoles.length === 0) ? 0 : ( (currentPage - 1) * itemsPerPage + 1 )} - {Math.min(currentPage * itemsPerPage, sortedRoles.length)} of {sortedRoles.length}
        </div>
        <div className="page-controls">
          <button disabled={currentPage === 1} onClick={() => setCurrentPage(p => Math.max(1, p - 1))}>Prev</button>
          {[...Array(totalPages)].map((_, i) => {
            const p = i + 1;
            return (
              <button key={p} className={p === currentPage ? 'active' : ''} onClick={() => setCurrentPage(p)}>{p}</button>
            );
          })}
          <button disabled={currentPage === totalPages} onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}>Next</button>
        </div>
        <div className="items-per-page">
          <label>Show:</label>
          <select value={itemsPerPage} onChange={(e) => { setItemsPerPage(Number(e.target.value)); setCurrentPage(1); }}>
            <option value={5}>5</option>
            <option value={10}>10</option>
            <option value={20}>20</option>
            <option value={50}>50</option>
          </select>
        </div>
      </div>
    </div>
  );
}
