import React, { useState, useEffect } from "react";
import "../../styles/role_creation.scss";

export default function RoleCreation({ isEditing = false, editingRole = null, onUpdateRole, onCancel }) {
  const [roleName, setRoleName] = useState("");
  const [description, setDescription] = useState("");
  const [permissions, setPermissions] = useState({
    all: false,
    create: false,
    delete: false,
    update: false,
    view: false,
  });

  useEffect(() => {
    if (isEditing && editingRole) {
      setRoleName(editingRole.name || "");
      setDescription(editingRole.description || "");
      const perms = editingRole.permissions || {};
      setPermissions({
        view: !!perms.view,
        create: !!perms.create,
        update: !!perms.update,
        delete: !!perms.delete,
        all: !!perms.view && !!perms.create && !!perms.update && !!perms.delete,
      });
    } else {
      setRoleName("");
      setDescription("");
      setPermissions({
        all: false,
        create: false,
        delete: false,
        update: false,
        view: false,
      });
    }
  }, [isEditing, editingRole]);

  const handlePermissionChange = (perm) => {
    if (perm === "all") {
      const newVal = !permissions.all;
      setPermissions({
        all: newVal,
        create: newVal,
        delete: newVal,
        update: newVal,
        view: newVal,
      });
    } else {
      const newPerms = { ...permissions, [perm]: !permissions[perm] };
      newPerms.all = newPerms.create && newPerms.delete && newPerms.update && newPerms.view;
      setPermissions(newPerms);
    }
  };

  const handleSubmit = () => {
    const trimmedName = roleName.trim();
    if (!trimmedName) return;
    const perms = { ...permissions };
    delete perms.all;
    const role = { name: trimmedName, description, permissions: perms };
    console.log("RoleCreation: submitting role", role);
    if (isEditing) {
      onUpdateRole(role, editingRole.name);
    } else {
      const existingRoles = JSON.parse(localStorage.getItem("roles") || "[]");
      const duplicate = existingRoles.find(r => r.name === role.name);
      if (duplicate) {
        alert("Role name already exists");
        return;
      }
      existingRoles.push(role);
      localStorage.setItem("roles", JSON.stringify(existingRoles));
      console.log("RoleCreation: added to localStorage", role);
      // Reset form
      setRoleName("");
      setDescription("");
      setPermissions({ all: false, create: false, delete: false, update: false, view: false });
      alert("Role created successfully!");
    }
  };

  return (
    <div className={`role-creation-bg ${isEditing ? 'embedded' : ''}`}>
      <div className="role-creation-container">
        <h1 className="role-creation-title">
          {isEditing ? "Edit Role" : "Create New Role"}
        </h1>
        <div className="role-creation-field">
          <label className="role-creation-label">Role Name</label>
          <input
            type="text"
            placeholder="Enter role name"
            value={roleName}
            onChange={e => setRoleName(e.target.value)}
            className="role-creation-input"
          />
        </div>
        <div className="role-creation-field">
          <label className="role-creation-label">Description</label>
          <textarea
            placeholder="Enter description (optional)"
            value={description}
            onChange={e => setDescription(e.target.value)}
            className="role-creation-textarea"
          />
        </div>
        <div className="role-creation-field">
          <label className="role-creation-label">Permissions</label>
          <div className="role-creation-permissions">
            <label>
              <input
                type="checkbox"
                checked={permissions.all}
                onChange={() => handlePermissionChange("all")}
              />
              All
            </label>
            <label>
              <input
                type="checkbox"
                checked={permissions.view}
                onChange={() => handlePermissionChange("view")}
              />
              View
            </label>
            <label>
              <input
                type="checkbox"
                checked={permissions.create}
                onChange={() => handlePermissionChange("create")}
              />
              Create
            </label>
            <label>
              <input
                type="checkbox"
                checked={permissions.update}
                onChange={() => handlePermissionChange("update")}
              />
              Update
            </label>
            <label>
              <input
                type="checkbox"
                checked={permissions.delete}
                onChange={() => handlePermissionChange("delete")}
              />
              Delete
            </label>
          </div>
        </div>
        <div className="form-buttons">
          {isEditing && (
            <button className="role-creation-btn" onClick={onCancel}>
              Cancel
            </button>
          )}
          <button className="role-creation-btn" onClick={handleSubmit}>
            {isEditing ? "Update Role" : "Create Role"}
          </button>
        </div>
      </div>
    </div>
  );
}

