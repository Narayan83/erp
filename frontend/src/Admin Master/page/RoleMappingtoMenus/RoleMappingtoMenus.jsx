import React, { useState, useEffect, useCallback } from "react";
import axios from "axios";
import { BASE_URL } from "../../../config/Config";
import "../../../styles/role_permissions_tree.scss";
// Icons
import { FaChevronRight, FaChevronDown, FaShieldAlt, FaSave, FaLayerGroup } from "react-icons/fa";

export default function RoleManagement() {
  const [roles, setRoles] = useState([]);
  const [selectedRole, setSelectedRole] = useState(null);
  const [menuTree, setMenuTree] = useState([]);
  const [loading, setLoading] = useState(false);
  const [permissions, setPermissions] = useState({});
  const [expandedNodes, setExpandedNodes] = useState({});

  // 1. Fetch Roles
  useEffect(() => {
    fetchRoles();
  }, []);

  const fetchRoles = async () => {
    try {
      const res = await axios.get(`${BASE_URL}/api/roles?limit=100`);
      const rolesData = Array.isArray(res.data) ? res.data : res.data.data || [];
      setRoles(rolesData);
      if (rolesData.length > 0 && !selectedRole) {
        setSelectedRole(rolesData[0]);
      }
    } catch (err) {
      console.error("Failed to fetch roles", err);
    }
  };

  // 2. Fetch Menu Tree & Permissions for Selected Role
  useEffect(() => {
    if (selectedRole) {
      fetchRolePermissions(selectedRole.id);
    }
  }, [selectedRole]);

  const fetchRolePermissions = async (roleId) => {
    setLoading(true);
    try {
      // Use the endpoint that returns the tree WITH permissions if available
      // Or fetch tree and permissions separately. 
      // Assuming existing endpoint /api/roles/:id/permissions/menu-tree returns full tree with embedded 'permissions' object in nodes
      const res = await axios.get(`${BASE_URL}/api/roles/${roleId}/permissions/menu-tree`);

      const treeData = res.data || [];
      setMenuTree(treeData);

      // Initialize permissions state map from the tree
      const permMap = {};
      const expandMap = {};

      const processNode = (nodes) => {
        nodes.forEach(node => {
          // Flatten embedded permissions to simple state
          // Node usually has: { id, menu_name, permissions: { can_view: true... }, children: [] }
          const perms = node.permissions || node.Permissions || {};

          permMap[node.id] = {
            can_view: !!perms.can_view,
            can_create: !!perms.can_create,
            can_update: !!perms.can_update,
            can_delete: !!perms.can_delete,
            can_all: !!perms.can_all, // Often calculated, but store it
          };

          // Auto-expand if has children
          if (node.children && node.children.length > 0) {
            expandMap[node.id] = true;
            processNode(node.children);
          }
        });
      };

      processNode(treeData);
      setPermissions(permMap);
      setExpandedNodes(expandMap);

    } catch (err) {
      console.error("Failed to fetch permissions", err);
    } finally {
      setLoading(false);
    }
  };

  // 3. Handle Checkbox Change
  const handleCheck = (menuId, type, value, children = []) => {
    setPermissions(prev => {
      const newPerms = { ...prev };

      // Update current node
      const current = { ...newPerms[menuId] };

      if (type === 'can_all') {
        // Toggle all
        const specificVal = value;
        current.can_all = specificVal;
        current.can_view = specificVal;
        current.can_create = specificVal;
        current.can_update = specificVal;
        current.can_delete = specificVal;
      } else {
        current[type] = value;
        // Auto-check view if create/update/delete is checked
        if (value && (type === 'can_create' || type === 'can_update' || type === 'can_delete')) {
          current.can_view = true;
        }
        // Check/Uncheck 'all' based on others
        const allTypes = ['can_view', 'can_create', 'can_update', 'can_delete'];
        current.can_all = allTypes.every(t => current[t]);
      }
      newPerms[menuId] = current;

      // Cascade to children? (Optional user preference, often helpful)
      // Recursive helper
      const updateChildren = (childNodes) => {
        childNodes.forEach(child => {
          const childPerm = { ...newPerms[child.id] };
          if (type === 'can_all') {
            childPerm.can_all = value;
            childPerm.can_view = value;
            childPerm.can_create = value;
            childPerm.can_update = value;
            childPerm.can_delete = value;
          }
          // If just modifying view/etc, maybe we don't auto-cascade unless it's 'All'
          // For now let's only cascade 'All' or if requested.
          // Let's simplified: If I click "All" on parent, apply "All" to children.
          newPerms[child.id] = childPerm;
          if (child.children?.length) updateChildren(child.children);
        });
      };

      if (type === 'can_all' && children.length > 0) {
        updateChildren(children);
      }

      return newPerms;
    });
  };

  // 4. Save
  const handleSave = async () => {
    if (!selectedRole) return;
    try {
      const payload = {};
      Object.keys(permissions).forEach(menuId => {
        const p = permissions[menuId];
        // Only send if at least one permission is true, or strictly send all status?
        // Usually sending all is safer to clear permissions
        payload[menuId] = p;
      });

      await axios.put(`${BASE_URL}/api/roles/${selectedRole.id}/permissions`, payload);
      alert("Permissions updated successfully!");
    } catch (err) {
      console.error("Save failed", err);
      alert("Failed to save permissions.");
    }
  };

  const toggleExpand = (id) => {
    setExpandedNodes(prev => ({ ...prev, [id]: !prev[id] }));
  };

  // Recursive Tree Node Renderer
  const renderTreeNodes = (nodes, level = 0) => {
    return nodes.map(node => {
      const p = permissions[node.id] || { can_view: false, can_create: false, can_update: false, can_delete: false, can_all: false };
      const hasChildren = node.children && node.children.length > 0;
      const isExpanded = expandedNodes[node.id];

      return (
        <div key={node.id} className="tree-node">
          <div className="node-row" style={{ paddingLeft: `${20 + (level * 20)}px` }}>
            <div className="node-name">
              <span className="toggle-icon" onClick={() => hasChildren && toggleExpand(node.id)}>
                {hasChildren && (isExpanded ? <FaChevronDown size={12} /> : <FaChevronRight size={12} />)}
              </span>
              <span style={{ fontWeight: level === 0 ? 600 : 400 }}>{node.menu_name}</span>
            </div>

            <div className="node-check">
              <input type="checkbox" checked={p.can_view} onChange={(e) => handleCheck(node.id, 'can_view', e.target.checked)} />
            </div>
            <div className="node-check">
              <input type="checkbox" checked={p.can_create} onChange={(e) => handleCheck(node.id, 'can_create', e.target.checked)} />
            </div>
            <div className="node-check">
              <input type="checkbox" checked={p.can_update} onChange={(e) => handleCheck(node.id, 'can_update', e.target.checked)} />
            </div>
            <div className="node-check">
              <input type="checkbox" checked={p.can_delete} onChange={(e) => handleCheck(node.id, 'can_delete', e.target.checked)} />
            </div>
            <div className="node-check">
              {/* ALL box */}
              <input type="checkbox" checked={p.can_all} onChange={(e) => handleCheck(node.id, 'can_all', e.target.checked, node.children)} />
            </div>
          </div>

          {hasChildren && isExpanded && (
            <div className="node-children">
              {renderTreeNodes(node.children, level + 1)}
            </div>
          )}
        </div>
      );
    });
  };

  return (
    <div className="role-permission-container">
      {/* Sidebar: Roles List */}
      <div className="role-sidebar">
        <div className="sidebar-header">
          <h3>Roles</h3>
          <div className="subtitle">Select a role to manage</div>
        </div>
        <div className="role-list">
          {roles.map(role => (
            <div
              key={role.id}
              className={`role-item ${selectedRole?.id === role.id ? 'active' : ''}`}
              onClick={() => setSelectedRole(role)}
            >
              <div className="role-name">{role.role_name}</div>
              <div className="role-desc">{role.description}</div>
            </div>
          ))}
        </div>
        <div className="sidebar-footer">
          {/* Link to Role Creation if needed */}
          {/* <button className="btn-new-role">Create New Role</button> */}
        </div>
      </div>

      {/* Main Content: Permission Matrix */}
      <div className="permission-content">
        <div className="content-header">
          <div className="header-info">
            <h2>{selectedRole ? selectedRole.role_name : "Select a Role"}</h2>
            <p>Manage access permissions for this role</p>
          </div>
          <div className="header-actions">
            <button className="btn-save" onClick={handleSave} disabled={!selectedRole}>
              <FaSave style={{ marginRight: 8 }} /> Save Changes
            </button>
          </div>
        </div>

        {loading ? (
          <div className="spinner-container">Loading...</div>
        ) : (
          <>
            <div className="tree-header">
              <div>Menu Item</div>
              <div>View</div>
              <div>Create</div>
              <div>Update</div>
              <div>Delete</div>
              <div>All</div>
            </div>
            <div className="permission-tree-wrapper">
              {renderTreeNodes(menuTree)}
            </div>
          </>
        )}
      </div>
    </div>
  );
}