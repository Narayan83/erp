import React, { useState } from "react";
import "../../styles/existing_menus.scss";
import { FaEdit, FaTrash, FaArrowUp, FaArrowDown } from "react-icons/fa";
import MenuCreation from "../MenuCreation/MenuCreation"; // Adjust the import based on your file structure

const defaultOnEdit = () => {};

export default function ExistingMenus({ menus, setMenus, initialMenus, onEditMenu = defaultOnEdit }) {
  const [search, setSearch] = useState("");
  const [localMenus, setLocalMenus] = useState(() => {
    if (menus) return menus;
    return JSON.parse(localStorage.getItem("menus") || "[]");
  });
  const [isEditing, setIsEditing] = useState(false);
  const [editingMenu, setEditingMenu] = useState(null);
  const [sortOrder, setSortOrder] = useState('asc');

  const displayMenus = menus || localMenus;

  const displaySetMenus = (newMenus) => {
    if (setMenus && typeof setMenus === "function") {
      setMenus(newMenus);
    } else {
      setLocalMenus(newMenus);
      localStorage.setItem("menus", JSON.stringify(newMenus));
    }
  };

  const safeMenus = Array.isArray(displayMenus) ? displayMenus : [];

  const handleDelete = (name) => {
    if (setMenus && typeof setMenus !== "function") {
      console.error("ExistingMenus: setMenus provided but not a function");
      return;
    }
    if (!window.confirm("Are you sure you want to delete this menu?")) {
      return;
    }
    displaySetMenus(safeMenus.filter((menu) => menu.name !== name));
  };

  const handleEdit = (menu) => {
    setIsEditing(true);
    setEditingMenu(menu);
  };

  const handleUpdateMenu = (updatedMenu, oldName) => {
    const updatedMenus = safeMenus.map((menu) =>
      menu.name === oldName ? updatedMenu : menu
    );
    displaySetMenus(updatedMenus);
    setIsEditing(false);
    setEditingMenu(null);
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditingMenu(null);
  };

  const handleSearch = (e) => {
    setSearch(e.target.value);
  };

  const handleRefresh = () => {
    if (setMenus && typeof setMenus !== "function") {
      console.error("ExistingMenus: setMenus provided but not a function");
      return;
    }
    if (Array.isArray(initialMenus) && initialMenus.length > 0) {
      displaySetMenus(initialMenus);
    }
    setSearch("");
  };

  const handleSort = () => {
    setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc');
  };

  const filteredMenus = safeMenus.filter((menu) =>
    menu.name.toLowerCase().includes(search.toLowerCase())
  );

  const sortedMenus = [...filteredMenus].sort((a, b) => {
    if (sortOrder === 'asc') {
      return a.name.localeCompare(b.name);
    } else {
      return b.name.localeCompare(a.name);
    }
  });

  return (
    <div className="existing-menus-container">
      <section className="title-section">
        <div>
          <h1 className="page-title">Existing Menus</h1>
          <div className="subtitle">Manage all your available menus</div>
        </div>
        <div className="actions-row">
          <input
            type="text"
            className="search-input"
            placeholder="Search menu..."
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
          <MenuCreation
            isEditing={isEditing}
            editingMenu={editingMenu}
            onUpdateMenu={handleUpdateMenu}
            onCancel={handleCancelEdit}
          />
        </div>
      )}
      {!isEditing && (
        <table className="menus-table">
          <thead>
            <tr>
              <th onClick={handleSort} style={{ cursor: 'pointer' }}>
                Menu Name {sortOrder === 'asc' ? <FaArrowUp /> : <FaArrowDown />}
              </th>
              <th>Permissions</th>
              <th>Remarks</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {sortedMenus.map((menu) => (
              <tr key={menu.name}>
                <td>{menu.name}</td>
                <td>
                  {menu.permissions
                    ? Object.entries(menu.permissions)
                        .filter(([k, v]) => v && k !== "all")
                        .map(([k]) => k.charAt(0).toUpperCase() + k.slice(1))
                        .join(", ")
                    : ""}
                </td>
                <td>{menu.remarks}</td>
                <td>
                  <button
                    className="action-btn edit-btn"
                    title="Edit"
                    onClick={() => handleEdit(menu)}
                  >
                    <FaEdit />
                  </button>
                  <button
                    className="action-btn delete-btn"
                    title="Delete"
                    onClick={() => handleDelete(menu.name)}
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


