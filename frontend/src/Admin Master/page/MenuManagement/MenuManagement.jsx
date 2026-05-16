import React, { useState, useEffect, useMemo } from "react";
import axios from "axios";
import "../../styles/menu_management.scss";
import { FaEdit, FaTrash, FaChevronRight, FaChevronDown } from "react-icons/fa";
import MenuCreation from "../MenuCreation/MenuCreation"; // Adjust the import based on your file structure
import { BASE_URL } from "../../../config/Config"; // Add this import

const defaultOnEdit = () => {};

/** Build tree from flat menus (parent_id). Orphans / missing parent → root. */
function buildMenuTree(flatMenus) {
  if (!Array.isArray(flatMenus) || flatMenus.length === 0) return [];
  const byId = new Map();
  for (const m of flatMenus) {
    if (m == null || m.id == null) continue;
    byId.set(m.id, { ...m, children: [] });
  }
  const roots = [];
  for (const m of byId.values()) {
    const pid = m.parent_id;
    if (pid != null && byId.has(pid)) {
      byId.get(pid).children.push(m);
    } else {
      roots.push(m);
    }
  }
  const sortRec = (nodes) => {
    nodes.sort(
      (a, b) =>
        (a.sort_order || 0) - (b.sort_order || 0) ||
        (a.menu_name || "").localeCompare(b.menu_name || "")
    );
    for (const n of nodes) {
      if (n.children?.length) sortRec(n.children);
    }
  };
  sortRec(roots);
  return roots;
}

function filterMenuTree(nodes, q) {
  if (!q.trim()) return nodes;
  const lower = q.toLowerCase();
  const walk = (node) => {
    const name = (node.menu_name || "").toLowerCase();
    const url = (node.url || "").toLowerCase();
    const selfMatch = name.includes(lower) || url.includes(lower);
    const kids = (node.children || []).map(walk).filter(Boolean);
    if (selfMatch || kids.length) {
      return { ...node, children: kids };
    }
    return null;
  };
  return nodes.map(walk).filter(Boolean);
}

function collectIdsWithChildren(nodes, acc = new Set()) {
  for (const n of nodes) {
    if (n.children?.length) {
      acc.add(n.id);
      collectIdsWithChildren(n.children, acc);
    }
  }
  return acc;
}

export default function ExistingMenus({ menus, setMenus, initialMenus, onEditMenu = defaultOnEdit }) {
  const [search, setSearch] = useState("");
  const [localMenus, setLocalMenus] = useState(() => {
    if (menus) return menus;
    return JSON.parse(localStorage.getItem("menus") || "[]");
  });
  const [isEditing, setIsEditing] = useState(false);
  const [editingMenu, setEditingMenu] = useState(null);
  const [loading, setLoading] = useState(false); // Added for fetch loading
  /** Set of expanded node ids (only nodes with children need tracking). */
  const [expandedIds, setExpandedIds] = useState(() => new Set());

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

  const safeMenus = Array.isArray(displayMenus) ? displayMenus : [];

  const fullTree = useMemo(() => buildMenuTree(safeMenus), [safeMenus]);
  const treeToShow = useMemo(() => filterMenuTree(fullTree, search), [fullTree, search]);

  useEffect(() => {
    setExpandedIds(collectIdsWithChildren(fullTree));
  }, [fullTree]);

  const toggleExpand = (id) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const expandAll = () => setExpandedIds(collectIdsWithChildren(treeToShow));
  const collapseAll = () => setExpandedIds(new Set());

  const directChildCount = (id) => safeMenus.filter((m) => m.parent_id === id).length;

  const handleDelete = async (id) => {
    if (setMenus && typeof setMenus !== "function") {
      console.error("ExistingMenus: setMenus provided but not a function");
      return;
    }
    const dc = directChildCount(id);
    const msg =
      dc > 0
        ? `This menu has ${dc} direct child menu(s). Deleting it may affect navigation or leave inconsistent data depending on your database.\n\nDelete anyway?`
        : "Are you sure you want to delete this menu?";
    if (!window.confirm(msg)) {
      return;
    }
    try {
      await axios.delete(`${BASE_URL}/api/menus/${id}`); // Add DELETE request
      displaySetMenus(safeMenus.filter((menu) => menu.id !== id)); // Update local state
      loadMenus(); // Refresh from backend
      try {
        window.dispatchEvent(new CustomEvent('menusUpdated', { detail: { id } }));
      } catch (e) {}
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
  };

  const handleRefresh = () => {
    if (setMenus && typeof setMenus !== "function") {
      console.error("ExistingMenus: setMenus provided but not a function");
      return;
    }
    loadMenus();
    setSearch("");
  };

  const renderMenuTree = (nodes, depth = 0) =>
    nodes.map((menu) => {
      const hasChildren = menu.children?.length > 0;
      const isExpanded = hasChildren && expandedIds.has(menu.id);
      const permObj =
        menu.permissions && typeof menu.permissions === "object"
          ? menu.permissions
          : {};
      const permStr = Object.entries(permObj)
        .filter(([k, v]) => v && k !== "all")
        .map(([k]) => k.charAt(0).toUpperCase() + k.slice(1))
        .join(", ");

      return (
        <React.Fragment key={menu.id}>
          <div
            className="menu-tree-row"
            style={{ paddingLeft: `${8 + depth * 22}px` }}
          >
            <div className="menu-tree-row-lead">
              {hasChildren ? (
                <button
                  type="button"
                  className="menu-tree-toggle"
                  aria-expanded={isExpanded}
                  onClick={() => toggleExpand(menu.id)}
                  title={isExpanded ? "Collapse" : "Expand"}
                >
                  {isExpanded ? <FaChevronDown /> : <FaChevronRight />}
                </button>
              ) : (
                <span className="menu-tree-toggle-spacer" aria-hidden />
              )}
              <div className="menu-tree-label">
                <span className="menu-tree-name">{menu.menu_name || "(unnamed)"}</span>
                <span className="menu-tree-meta">
                  {menu.url ? (
                    <span className="menu-tree-url">{menu.url}</span>
                  ) : null}
                  {menu.menu_type ? (
                    <span className="menu-tree-badge">{menu.menu_type}</span>
                  ) : null}
                  {!menu.is_active ? (
                    <span className="menu-tree-badge menu-tree-badge--inactive">Inactive</span>
                  ) : null}
                </span>
              </div>
            </div>
            <div className="menu-tree-row-detail">
              <span title="Icon">{menu.icon || "—"}</span>
              <span title="Sort order">{menu.sort_order ?? 0}</span>
              <span title="Requires auth">{menu.requires_auth ? "Auth" : "—"}</span>
              <span className="menu-tree-perms" title="Permissions">
                {permStr || "—"}
              </span>
            </div>
            <div className="menu-tree-row-actions">
              <button
                type="button"
                className="action-btn edit-btn"
                title="Edit"
                onClick={() => handleEdit(menu)}
              >
                <FaEdit />
              </button>
              <button
                type="button"
                className="action-btn delete-btn"
                title="Delete"
                onClick={() => handleDelete(menu.id)}
              >
                <FaTrash />
              </button>
            </div>
          </div>
          {menu.description ? (
            <div
              className="menu-tree-desc"
              style={{ paddingLeft: `${36 + depth * 22}px` }}
            >
              {menu.description}
            </div>
          ) : null}
          {hasChildren && isExpanded ? renderMenuTree(menu.children, depth + 1) : null}
        </React.Fragment>
      );
    });

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
            placeholder="Search by name or URL…"
            value={search}
            onChange={handleSearch}
          />
          <button type="button" className="refresh-btn refresh-btn--secondary" onClick={expandAll}>
            Expand all
          </button>
          <button type="button" className="refresh-btn refresh-btn--secondary" onClick={collapseAll}>
            Collapse all
          </button>
          <button className="refresh-btn" onClick={handleRefresh}>
            Refresh
          </button>
        </div>
      </section>
      {loading && <div className="menus-loading">Loading menus…</div>}
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
        <div className="menus-tree-panel">
          <div className="menus-tree-header">
            <span className="menus-tree-col menus-tree-col--main">Menu</span>
            <span className="menus-tree-col menus-tree-col--detail">Icon / Order / Auth / Perms</span>
            <span className="menus-tree-col menus-tree-col--actions">Actions</span>
          </div>
          <div className="menus-tree-body">
            {treeToShow.length === 0 ? (
              <div className="menus-tree-empty">
                {safeMenus.length === 0 && !loading
                  ? "No menus loaded."
                  : "No menus match your search."}
              </div>
            ) : (
              renderMenuTree(treeToShow, 0)
            )}
          </div>
          <div className="menus-tree-footer">
            Showing {treeToShow.length} root {treeToShow.length === 1 ? "branch" : "branches"} ·{" "}
            {safeMenus.length} total menus
          </div>
        </div>
      )}
    </div>
  );
}


