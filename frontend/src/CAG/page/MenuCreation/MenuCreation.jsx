import React, { useState, useEffect } from "react";
import "../../styles/menu_creation.scss";

const MenuCreation = ({ onAddMenu, isEditing, editingMenu, onUpdateMenu, onCancel }) => {
  const [menuName, setMenuName] = useState("");
  const [permissions, setPermissions] = useState({
    all: false,
    view: false,
    create: false,
    update: false,
    delete: false,
  });
  const [remarks, setRemarks] = useState("");
  const [existingMenus, setExistingMenus] = useState([]);
  const [menuSearch, setMenuSearch] = useState("");
  const [showDropdown, setShowDropdown] = useState(false);

  useEffect(() => {
    if (isEditing && editingMenu) {
      setMenuName(editingMenu.name || "");
      setRemarks(editingMenu.remarks || "");
      const perms = editingMenu.permissions || {};
      setPermissions({
        view: !!perms.view,
        create: !!perms.create,
        update: !!perms.update,
        delete: !!perms.delete,
        all: perms.view && perms.create && perms.update && perms.delete,
      });
    } else {
      setMenuName("");
      setPermissions({
        all: false,
        view: false,
        create: false,
        update: false,
        delete: false,
      });
      setRemarks("");
    }

    // Load existing menus from localStorage
    const stored = JSON.parse(localStorage.getItem('menus') || '[]');
    setExistingMenus(stored);
  }, [isEditing, editingMenu]);

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
      newPerms.all = newPerms.view && newPerms.create && newPerms.update && newPerms.delete;
      setPermissions(newPerms);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const trimmedName = menuName.trim();
    if (!trimmedName) return;
    const perms = { ...permissions };
    delete perms.all;
    const newMenu = {
      name: trimmedName,
      permissions: perms,
      remarks,
    };
    console.log("MenuCreation: submitting menu", newMenu);
    if (isEditing) {
      if (typeof onUpdateMenu === "function") {
        onUpdateMenu(newMenu, editingMenu.name);
      }
    } else {
      if (typeof onAddMenu === "function") {
        onAddMenu(newMenu);
      } else {
        const stored = JSON.parse(localStorage.getItem('menus') || '[]');
        const exists = stored.some((m) => m.name === newMenu.name);
        if (exists) {
          console.warn(`MenuCreation: menu with name "${newMenu.name}" already exists`);
          return;
        }
        stored.push(newMenu);
        localStorage.setItem('menus', JSON.stringify(stored));
        console.log("MenuCreation: added to localStorage", newMenu);
      }
      setMenuName("");
      setPermissions({
        all: false,
        view: false,
        create: false,
        update: false,
        delete: false,
      });
      setRemarks("");
    }
  };

  // Filtered menus for dropdown
  const filteredMenus = existingMenus.filter(
    m => m.name.toLowerCase().includes(menuSearch.toLowerCase()) && m.name !== menuName
  );

  return (
    <div className={`menu-creation-container ${isEditing ? 'embedded' : ''}`}>
      <h1 className="menu-title">{isEditing ? "Edit Menu" : "Menu Creation"}</h1>
      <form className="menu-form" onSubmit={handleSubmit}>
        <label className="menu-label">Menu Name</label>
        <input
          className="menu-input"
          type="text"
          placeholder="Enter menu name"
          value={menuName}
          onChange={(e) => setMenuName(e.target.value)}
        />

        {/* Label for existing menus dropdown */}
        <label className="menu-label">Existing Menus</label>
        {/* 2-in-1 search/dropdown for existing menus */}
        <div style={{ position: "relative", maxWidth: 500 }}>
          <input
            className="menu-input"
            type="text"
            placeholder="Search or select existing menu"
            value={menuSearch}
            onChange={e => {
              setMenuSearch(e.target.value);
              setShowDropdown(true);
            }}
            onFocus={() => setShowDropdown(true)}
            onBlur={() => setTimeout(() => setShowDropdown(false), 150)}
            autoComplete="off"
          />
          {showDropdown && filteredMenus.length > 0 && (
            <ul style={{
              position: "absolute",
              left: 0,
              right: 0,
              top: "100%",
              background: "#fff",
              border: "1px solid #e0e0e0",
              borderRadius: "6px",
              maxHeight: "150px",
              overflowY: "auto",
              zIndex: 10,
              margin: 0,
              padding: "4px 0",
              listStyle: "none"
            }}>
              {filteredMenus.map(menu => (
                <li
                  key={menu.name}
                  style={{
                    padding: "8px 16px",
                    cursor: "pointer",
                    fontSize: "1rem"
                  }}
                  onMouseDown={() => {
                    setMenuName(menu.name);
                    setMenuSearch(menu.name);
                    setShowDropdown(false);
                  }}
                >
                  {menu.name}
                </li>
              ))}
            </ul>
          )}
        </div>

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

        <div className="form-buttons">
          {isEditing && (
            <button
              className="menu-submit-btn"
              type="button"
              onClick={onCancel}
            >
              Cancel
            </button>
          )}
          <button
            className="menu-submit-btn"
            type="submit"
            disabled={isEditing && !editingMenu}
          >
            {isEditing ? "Update Menu" : "Create Menu"}
          </button>
        </div>
      </form>
    </div>
  );
};

export default MenuCreation;
