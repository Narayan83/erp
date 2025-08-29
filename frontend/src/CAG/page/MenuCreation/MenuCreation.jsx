import React, { useState } from "react";
import "../../styles/menu_creation.scss";

const MenuCreation = () => {
  const [menuName, setMenuName] = useState("");
  const [permissions, setPermissions] = useState({
    all: false,
    view: false,
    update: false,
    delete: false,
  });
  const [remarks, setRemarks] = useState("");

  const handlePermissionChange = (perm) => {
    if (perm === "all") {
      const newVal = !permissions.all;
      setPermissions({
        all: newVal,
        view: newVal,
        create: newVal,
        update: newVal,
        delete: newVal,
      });
    } else {
      const newPerms = { ...permissions, [perm]: !permissions[perm] };
      newPerms.all = newPerms.view && newPerms.update && newPerms.delete;
      setPermissions(newPerms);
    }
  };

  return (
    <div className="menu-creation-container">
      <h1 className="menu-title">Menu Management</h1>
      <form className="menu-form">
        <label className="menu-label">Menu Name</label>
        <input
          className="menu-input"
          type="text"
          placeholder="Enter menu name"
          value={menuName}
          onChange={(e) => setMenuName(e.target.value)}
        />

        <label className="menu-label">Permissions</label>
        <div className="permissions-group">
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

        <label className="menu-label">Remarks</label>
        <textarea
          className="menu-textarea"
          placeholder="Enter remarks (optional)"
          value={remarks}
          onChange={(e) => setRemarks(e.target.value)}
        />

        <button className="menu-submit-btn" type="submit">
          Create Menu
        </button>
      </form>
    </div>
  );
};

export default MenuCreation;
