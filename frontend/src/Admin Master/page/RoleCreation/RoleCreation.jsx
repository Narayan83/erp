import React, { useState, useEffect } from "react";
import axios from "axios";
import { BASE_URL } from "../../../config/Config";
import { useNavigate } from "react-router-dom";
import "../../styles/role_creation.scss";

export default function RoleCreation({ isEditing = false, editingRole = null, onSave, onCancel }) {
  const [roleName, setRoleName] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const [permissions, setPermissions] = useState({
    view: false,
    create: false,
    update: false,
    delete: false,
  });

  useEffect(() => {
    if (isEditing && editingRole) {
      setRoleName(editingRole.name || "");
      setDescription(editingRole.description || "");

      const perms = editingRole.permissions || {};
      setPermissions({
        view: !!(perms.view || perms.can_view),
        create: !!(perms.create || perms.can_create),
        update: !!(perms.update || perms.can_update),
        delete: !!(perms.delete || perms.can_delete),
      });
    } else {
      setRoleName("");
      setDescription("");
      setPermissions({ view: false, create: false, update: false, delete: false });
    }
  }, [isEditing, editingRole]);

  const handlePermissionChange = (perm) => {
    setPermissions(prev => ({ ...prev, [perm]: !prev[perm] }));
  };

  const handleCheckAll = (e) => {
    const checked = e.target.checked;
    setPermissions({
      view: checked,
      create: checked,
      update: checked,
      delete: checked,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!roleName.trim()) {
      alert("Role name is required");
      return;
    }

    const permsPayload = {
      can_view: permissions.view,
      can_create: permissions.create,
      can_update: permissions.update,
      can_delete: permissions.delete,
    };

    const roleData = {
      name: roleName.trim(),
      description,
      permissions: permsPayload
    };

    // If onSave is provided (e.g. from RoleManagement modal), delegate to it
    if (typeof onSave === "function") {
      onSave(roleData);
      return;
    }

    // Standalone mode: Handle save internally
    try {
      setLoading(true);
      const payload = {
        role_name: roleData.name,
        description: roleData.description,
        permissions: roleData.permissions
      };

      if (isEditing && editingRole?.id) {
        await axios.put(`${BASE_URL}/api/roles/${editingRole.id}`, payload);
        alert("Role updated successfully!");
      } else {
        await axios.post(`${BASE_URL}/api/roles`, payload);
        alert("Role created successfully!");
      }

      // If standalone, navigate away or reset
      navigate("/existingroles");
    } catch (err) {
      console.error("RoleCreation: Internal save failed", err);
      alert(err.response?.data?.error || "Failed to save role.");
    } finally {
      setLoading(false);
    }
  };

  const handleCancelClick = () => {
    if (typeof onCancel === "function") {
      onCancel();
    } else {
      // Standalone mode: go back
      navigate(-1);
    }
  };

  const isAllChecked = Object.values(permissions).every(v => v);

  return (
    <div className={onSave ? "role-creation-overlay" : "role-creation-page-wrapper"}>
      <div className="role-creation-container">
        <h2 className="role-creation-title">
          {isEditing ? "Edit Role" : "Create New Role"}
        </h2>

        <form onSubmit={handleSubmit}>
          <div className="role-creation-field">
            <label className="role-creation-label">Role Name</label>
            <input
              type="text"
              placeholder="e.g. Sales Manager"
              value={roleName}
              onChange={e => setRoleName(e.target.value)}
              className="role-creation-input"
              required
            />
          </div>

          <div className="role-creation-field">
            <label className="role-creation-label">Description</label>
            <textarea
              placeholder="Brief description of responsibilities..."
              value={description}
              onChange={e => setDescription(e.target.value)}
              className="role-creation-textarea"
            />
          </div>

          <div className="permissions-section">
            <div className="section-title">Base Permissions</div>
            <div className="permissions-grid">
              <label className="all-check">
                <input
                  type="checkbox"
                  checked={isAllChecked}
                  onChange={handleCheckAll}
                />
                <strong>Select All</strong>
              </label>
              <div></div> {/* Spacer */}

              <label>
                <input
                  type="checkbox"
                  checked={permissions.view}
                  onChange={() => handlePermissionChange("view")}
                />
                Can View
              </label>
              <label>
                <input
                  type="checkbox"
                  checked={permissions.create}
                  onChange={() => handlePermissionChange("create")}
                />
                Can Create
              </label>
              <label>
                <input
                  type="checkbox"
                  checked={permissions.update}
                  onChange={() => handlePermissionChange("update")}
                />
                Can Update
              </label>
              <label>
                <input
                  type="checkbox"
                  checked={permissions.delete}
                  onChange={() => handlePermissionChange("delete")}
                />
                Can Delete
              </label>
            </div>
          </div>

          <div className="form-actions">
            <button type="button" className="btn btn-cancel" onClick={handleCancelClick} disabled={loading}>
              Cancel
            </button>
            <button type="submit" className="btn btn-submit" disabled={loading}>
              {loading ? "Saving..." : (isEditing ? "Update Role" : "Create Role")}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
