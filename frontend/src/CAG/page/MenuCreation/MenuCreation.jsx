import React, { useState } from "react";
import "../../styles/menu_creation.scss";

export default function MenuCreation() {
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
    <div className="menu-creation-bg">
      <div className="menu-creation-container">
        <h1 className="menu-creation-title">
          Menu Management
        </h1>
        <div className="menu-creation-field">
          <label className="menu-creation-label">Menu Name</label>
          <input
            type="text"
            placeholder="Enter menu name"
            value={menuName}
            onChange={e => setMenuName(e.target.value)}
            className="menu-creation-input"
          />
        </div>
        <div className="menu-creation-field">
          <label className="menu-creation-label">Permissions</label>
          <div className="menu-creation-permissions">
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
        <div className="menu-creation-field">
          <label className="menu-creation-label">Remarks</label>
          <textarea
            placeholder="Enter remarks (optional)"
            value={remarks}
            onChange={e => setRemarks(e.target.value)}
            className="menu-creation-textarea"
          />
        </div>
        <button className="menu-creation-btn">
          Create Menu
        </button>
      </div>
    </div>
  );
}