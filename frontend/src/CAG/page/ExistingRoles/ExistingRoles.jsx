import React, { useState } from "react";
import "../../styles/existing_roles.scss";
import { FaEdit, FaTrash } from "react-icons/fa";
import RoleCreation from "../RoleCreation/RoleCreation"; // Adjust the import based on your file structure

const defaultOnEdit = () => {};

export default function ExistingRoles({ roles, setRoles, initialRoles, onEditRole = defaultOnEdit }) {
  const [search, setSearch] = useState("");
  const [localRoles, setLocalRoles] = useState(() => {
    if (roles) return roles;
    return JSON.parse(localStorage.getItem("roles") || "[]");
  });
  const [isEditing, setIsEditing] = useState(false);
  const [editingRole, setEditingRole] = useState(null);

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
    displaySetRoles(safeRoles.filter((role) => role.name !== name));
  };

  const handleEdit = (role) => {
    setIsEditing(true);
    setEditingRole(role);
  };

  const handleUpdateRole = (updatedRole, oldName) => {
    const updatedRoles = safeRoles.map((role) =>
      role.name === oldName ? updatedRole : role
    );
    displaySetRoles(updatedRoles);
    setIsEditing(false);
    setEditingRole(null);
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditingRole(null);
  };

  const handleSearch = (e) => {
    setSearch(e.target.value);
  };

  const handleRefresh = () => {
    if (setRoles && typeof setRoles !== "function") {
      console.error("ExistingRoles: setRoles provided but not a function");
      return;
    }
    if (Array.isArray(initialRoles) && initialRoles.length > 0) {
      displaySetRoles(initialRoles);
    }
    setSearch("");
  };

  const filteredRoles = safeRoles.filter((role) =>
    role.name.toLowerCase().includes(search.toLowerCase())
  );

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
              <th>Role Name &#8593;</th>
              <th>Description</th>
              <th>Permissions</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredRoles.map((role) => (
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
    </div>
  );
}
