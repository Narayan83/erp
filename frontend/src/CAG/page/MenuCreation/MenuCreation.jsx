import React, { useState, useEffect } from "react";
import axios from "axios";
import "../../styles/menu_creation.scss";
import { BASE_URL }  from "../../../Config";

const MenuCreation = ({ onAddMenu, isEditing, editingMenu, onUpdateMenu, onCancel }) => {
  const [menuName, setMenuName] = useState("");
  const [url, setUrl] = useState("");
  const [icon, setIcon] = useState("");
  const [parentId, setParentId] = useState("");
  const [sortOrder, setSortOrder] = useState(0);
  const [menuType, setMenuType] = useState("main");
  const [isActive, setIsActive] = useState(true);
  const [requiresAuth, setRequiresAuth] = useState(false);
  const [permissions, setPermissions] = useState({
    all: false,
    view: false,
    create: false,
    update: false,
    delete: false,
  });
  const [remarks, setRemarks] = useState("");
  const [existingMenus, setExistingMenus] = useState([]);
  const [parentMenus, setParentMenus] = useState([]);
  const [menuSearch, setMenuSearch] = useState("");
  const [showDropdown, setShowDropdown] = useState(false);
  const [loading, setLoading] = useState(false);

  // Load existing menus from backend
const loadMenus = async () => {
  try {
    setLoading(true);
    const res = await axios.get(`${BASE_URL}/api/loadMenus`); // Updated endpoint to match backend GetAllMenus

    console.log("Loaded menus raw:", res.data);

    // ✅ Extract the array from "data"
    const menusArray = Array.isArray(res.data) ? res.data : res.data.data || [];
    setExistingMenus(menusArray);

    // Filter menus that can be parents
    const parentOptions = menusArray.filter(menu => 
      !isEditing || menu.id !== editingMenu?.id
    );
    setParentMenus(parentOptions);

  } catch (error) {
    console.error("Failed to load menus", error);
  } finally {
    setLoading(false);
  }
};


  useEffect(() => {
    loadMenus();
  }, []);

  useEffect(() => {
    if (isEditing && editingMenu) {
      setMenuName(editingMenu.menu_name || "");
      setUrl(editingMenu.url || "");
      setIcon(editingMenu.icon || "");
      setParentId(editingMenu.parent_id || "");
      setSortOrder(editingMenu.sort_order || 0);
      setMenuType(editingMenu.menu_type || "main");
      setIsActive(editingMenu.is_active !== undefined ? editingMenu.is_active : true);
      setRequiresAuth(editingMenu.requires_auth !== undefined ? editingMenu.requires_auth : false);
      setRemarks(editingMenu.description || "");
      
      const perms = editingMenu.permissions || {};
      setPermissions({
        view: !!perms.view,
        create: !!perms.create,
        update: !!perms.update,
        delete: !!perms.delete,
        all: perms.view && perms.create && perms.update && perms.delete,
      });
    } else {
      // Reset form for new menu
      setMenuName("");
      setUrl("");
      setIcon("");
      setParentId("");
      setSortOrder(0);
      setMenuType("main");
      setIsActive(true);
      setRequiresAuth(false);
      setPermissions({
        all: false,
        view: false,
        create: false,
        update: false,
        delete: false,
      });
      setRemarks("");
    }
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    const trimmedName = menuName.trim();
    if (!trimmedName) return;
    
    const perms = { ...permissions };
    delete perms.all;
    
    const newMenu = {
      menu_name: trimmedName,
      description: remarks,
      url: url,
      icon: icon,
      parent_id: parentId ? parseInt(parentId) : null,
      sort_order: sortOrder,
      menu_type: menuType,
      is_active: isActive,
      requires_auth: requiresAuth,
      permissions: perms,
    };

    console.log("Sending to backend:", newMenu);

    try {
      setLoading(true);
      
      if (isEditing) {
        const res = await axios.put(`${BASE_URL}/api/menus/${editingMenu.id}`, newMenu);
        if (typeof onUpdateMenu === "function") {
          onUpdateMenu(res.data);
        }
      } else {
        const res = await axios.post(`${BASE_URL}/api/menus`, newMenu);
        if (typeof onAddMenu === "function") {
          onAddMenu(res.data);
        }
        
        // Reload menus to update dropdown with new menu
        await loadMenus();
        
        // Reset form
        setMenuName("");
        setUrl("");
        setIcon("");
        setParentId("");
        setSortOrder(0);
        setMenuType("main");
        setIsActive(true);
        setRequiresAuth(false);
        setPermissions({
          all: false,
          view: false,
          create: false,
          update: false,
          delete: false,
        });
        setRemarks("");
      }
    } catch (error) {
      console.error("Failed to save menu", error);
    } finally {
      setLoading(false);
    }
  };

  // Filtered menus for dropdown
  const filteredMenus = existingMenus.filter(
    m => m.menu_name.toLowerCase().includes(menuSearch.toLowerCase()) && 
         (!isEditing || m.id !== editingMenu?.id)
  );

  return (
    <div className={`menu-creation-container ${isEditing ? 'embedded' : ''}`}>
      <h1 className="menu-title">{isEditing ? "Edit Menu" : "Menu Creation"}</h1>
      <form className="menu-form" onSubmit={handleSubmit}>
        <label className="menu-label">Menu Name *</label>
        <input
          className="menu-input"
          type="text"
          placeholder="Enter menu name"
          value={menuName}
          onChange={(e) => setMenuName(e.target.value)}
          disabled={loading}
          required
        />

        <label className="menu-label">URL</label>
        <input
          className="menu-input"
          type="text"
          placeholder="Enter URL path (e.g., /dashboard)"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          disabled={loading}
        />

        <label className="menu-label">Icon</label>
        <input
          className="menu-input"
          type="text"
          placeholder="Enter icon class name (e.g., fa fa-home)"
          value={icon}
          onChange={(e) => setIcon(e.target.value)}
          disabled={loading}
        />

        <label className="menu-label">Parent Menu</label>
        <select
          className="menu-input"
          value={parentId}
          onChange={(e) => setParentId(e.target.value)}
          disabled={loading}
        >
          <option value="">No Parent (Top Level)</option>
          {parentMenus.map(menu => (
            <option key={menu.id} value={menu.id}>
              {menu.menu_name}
            </option>
          ))}
        </select>

        <label className="menu-label">Sort Order</label>
        <input
          className="menu-input"
          type="number"
          placeholder="Sort order"
          value={sortOrder}
          onChange={(e) => setSortOrder(parseInt(e.target.value) || 0)}
          disabled={loading}
        />

        <label className="menu-label">Menu Type</label>
        <select
          className="menu-input"
          value={menuType}
          onChange={(e) => setMenuType(e.target.value)}
          disabled={loading}
        >
          <option value="main">Main Menu</option>
          <option value="sub">Sub Menu</option>
          <option value="footer">Footer Menu</option>
          <option value="sidebar">Sidebar Menu</option>
        </select>

        <div className="checkbox-group">
          <label>
            <input
              type="checkbox"
              checked={isActive}
              onChange={() => setIsActive(!isActive)}
              disabled={loading}
            />
            Active
          </label>
          <label>
            <input
              type="checkbox"
              checked={requiresAuth}
              onChange={() => setRequiresAuth(!requiresAuth)}
              disabled={loading}
            />
            Requires Authentication
          </label>
        </div>

        <label className="menu-label">Permissions</label>
        <div className="permissions-group">
          <label>
            <input
              type="checkbox"
              checked={permissions.all}
              onChange={() => handlePermissionChange("all")}
              disabled={loading}
            />
            All
          </label>
          <label>
            <input
              type="checkbox"
              checked={permissions.view}
              onChange={() => handlePermissionChange("view")}
              disabled={loading}
            />
            View
          </label>
          <label>
            <input
              type="checkbox"
              checked={permissions.create}
              onChange={() => handlePermissionChange("create")}
              disabled={loading}
            />
            Create
          </label>
          <label>
            <input
              type="checkbox"
              checked={permissions.update}
              onChange={() => handlePermissionChange("update")}
              disabled={loading}
            />
            Update
          </label>
          <label>
            <input
              type="checkbox"
              checked={permissions.delete}
              onChange={() => handlePermissionChange("delete")}
              disabled={loading}
            />
            Delete
          </label>
        </div>

        <label className="menu-label">Remarks</label>
        <textarea
          className="menu-textarea"
          placeholder="Enter description (optional)"
          value={remarks}
          onChange={(e) => setRemarks(e.target.value)}
          disabled={loading}
        />

        <div className="form-buttons">
          {isEditing && (
            <button
              className="menu-cancel-btn"
              type="button"
              onClick={onCancel}
              disabled={loading}
            >
              Cancel
            </button>
          )}
          <button
            className="menu-submit-btn"
            type="submit"
            disabled={loading}
          >
            {loading ? "Processing..." : (isEditing ? "Update Menu" : "Create Menu")}
          </button>
        </div>
      </form>
    </div>
  );
};

export default MenuCreation;