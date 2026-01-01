import React, { useState, useEffect } from "react";
import axios from "axios";
import "../../styles/menu_management.scss";
import { FaEdit, FaTrash, FaArrowUp, FaArrowDown } from "react-icons/fa";
import MenuCreation from "../MenuCreation/MenuCreation"; // Adjust the import based on your file structure
import { BASE_URL } from "../../../config/Config"; // Add this import

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
  const [loading, setLoading] = useState(false); // Added for fetch loading
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // Load menus from backend
  const loadMenus = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${BASE_URL}/api/loadMenus?limit=1000`); // Load up to 1000 menus to handle pagination on frontend
      const menusArray = Array.isArray(res.data) ? res.data : res.data.data || [];
      displaySetMenus(menusArray);
    } catch (error) {
      console.error("Failed to load menus", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMenus(); // Fetch on mount
    const onMenuCreated = (e) => {
      // refresh lists when a menu is created elsewhere
      loadMenus();
    };
    window.addEventListener('menuCreated', onMenuCreated);
    return () => window.removeEventListener('menuCreated', onMenuCreated);
  }, []);

  const displayMenus = menus || localMenus;

  const displaySetMenus = (newMenus) => {
    if (setMenus && typeof setMenus === "function") {
      setMenus(newMenus);
    } else {
      setLocalMenus(newMenus);
      localStorage.setItem("menus", JSON.stringify(newMenus));
    }
  };

  // Create a map for menu ID to name for parent lookup
  const menuMap = new Map(displayMenus.map(menu => [menu.id, menu.menu_name]));

  const safeMenus = Array.isArray(displayMenus) ? displayMenus : [];

  const handleDelete = async (id) => { // Make async
    if (setMenus && typeof setMenus !== "function") {
      console.error("ExistingMenus: setMenus provided but not a function");
      return;
    }
    if (!window.confirm("Are you sure you want to delete this menu?")) {
      return;
    }
    try {
      await axios.delete(`${BASE_URL}/api/menus/${id}`); // Add DELETE request
      displaySetMenus(safeMenus.filter((menu) => menu.id !== id)); // Update local state
      loadMenus(); // Refresh from backend
    } catch (error) {
      console.error("Failed to delete menu", error);
    }
  };

  const handleEdit = (menu) => {
    setIsEditing(true);
    setEditingMenu(menu);
  };

  const handleUpdateMenu = (updatedMenu) => {
    const updatedMenus = safeMenus.map((menu) =>
      menu.id === updatedMenu.id ? updatedMenu : menu // Use id
    );
    displaySetMenus(updatedMenus);
    loadMenus(); // Refresh from backend after update
    setIsEditing(false);
    setEditingMenu(null);
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditingMenu(null);
  };

  const handleSearch = (e) => {
    setSearch(e.target.value);
    setCurrentPage(1);
  };

  const handleRefresh = () => {
    if (setMenus && typeof setMenus !== "function") {
      console.error("ExistingMenus: setMenus provided but not a function");
      return;
    }
    loadMenus(); // Fetch from backend on refresh
    setSearch("");
    setCurrentPage(1);
  };

  const handleSort = () => {
    setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc');
    setCurrentPage(1);
  };

  const filteredMenus = safeMenus.filter((menu) =>
    menu.menu_name.toLowerCase().includes(search.toLowerCase()) // Use menu_name
  );

  const sortedMenus = [...filteredMenus].sort((a, b) => {
    if (sortOrder === 'asc') {
      return a.menu_name.localeCompare(b.menu_name); // Use menu_name
    } else {
      return b.menu_name.localeCompare(a.menu_name); // Use menu_name
    }
  });

  const totalPages = Math.ceil(sortedMenus.length / itemsPerPage);
  const paginatedMenus = sortedMenus.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  return (
    <div className="existing-menus-container">
      <section className="title-section">
        <div>
          <h1 className="page-title">Menu Management</h1>
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
              <th>URL</th>
              <th>Icon</th>
              <th>Parent Menu</th>
              <th>Sort Order</th>
              <th>Menu Type</th>
              <th>Active</th>
              <th>Requires Auth</th>
              <th>Permissions</th>
              <th>Remarks</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {paginatedMenus.map((menu) => (
              <tr key={menu.id}>
                <td>{menu.menu_name}</td>
                <td>{menu.url || ''}</td>
                <td>{menu.icon || ''}</td>
                <td>{menu.parent_id ? menuMap.get(menu.parent_id) || 'N/A' : 'N/A'}</td>
                <td>{menu.sort_order || 0}</td>
                <td>{menu.menu_type || 'main'}</td>
                <td>{menu.is_active ? 'Yes' : 'No'}</td>
                <td>{menu.requires_auth ? 'Yes' : 'No'}</td>
                <td>
                  {menu.permissions
                    ? Object.entries(menu.permissions)
                        .filter(([k, v]) => v && k !== "all")
                        .map(([k]) => k.charAt(0).toUpperCase() + k.slice(1))
                        .join(", ")
                    : ""}
                </td>
                <td>{menu.description}</td>
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
                    onClick={() => handleDelete(menu.id)} 
                  >
                    <FaTrash />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
      <div className="pagination-container">
        <div className="pagination-info">
          Showing {paginatedMenus.length > 0 ? (currentPage - 1) * itemsPerPage + 1 : 0} to {Math.min(currentPage * itemsPerPage, sortedMenus.length)} of {sortedMenus.length} entries
        </div>
        <div className="pagination-controls">
          <button 
            className="pagination-btn" 
            onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))} 
            disabled={currentPage === 1}
          >
            Previous
          </button>
          {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
            <button 
              key={page} 
              className={`pagination-btn ${currentPage === page ? 'active' : ''}`} 
              onClick={() => setCurrentPage(page)}
            >
              {page}
            </button>
          ))}
          <button 
            className="pagination-btn" 
            onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))} 
            disabled={currentPage === totalPages}
          >
            Next
          </button>
        </div>
        <div className="items-per-page">
          <label>Show:</label>
          <select 
            value={itemsPerPage} 
            onChange={(e) => { 
              setItemsPerPage(Number(e.target.value)); 
              setCurrentPage(1); 
            }}
          >
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


