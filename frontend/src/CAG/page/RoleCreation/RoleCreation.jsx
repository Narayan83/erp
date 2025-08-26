import React, { useState } from "react";
import "../../styles/role_creation.scss";

export default function RoleCreation() {
  const [roleName, setRoleName] = useState("");
  const [description, setDescription] = useState("");
  const [permissions, setPermissions] = useState({
    all: false,
    create: false,
    delete: false,
    update: false,
    view: false,
  });

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

  return (
    <div className="role-creation-bg">
      <div className="role-creation-container">
        <h1 className="role-creation-title">
          Create New Role
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
                checked={permissions.delete}
                onChange={() => handlePermissionChange("delete")}
              />
              Delete
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
                checked={permissions.view}
                onChange={() => handlePermissionChange("view")}
              />
              View
            </label>
          </div>
        </div>
        <button className="role-creation-btn">
          Create Role
        </button>
      </div>
    </div>
  );
}
     
