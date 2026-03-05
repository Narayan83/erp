import React, { useState, useEffect } from "react";
import axios from "axios";
import { BASE_URL } from "../../../config/Config";
import "../../styles/user_mapping.scss";
// Icons
import { FaUserCircle, FaSearch, FaSave, FaSync } from "react-icons/fa";

export default function UserMapping() {
  const [users, setUsers] = useState([]);
  const [roles, setRoles] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [assignedRoleIds, setAssignedRoleIds] = useState(new Set());
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  // 1. Fetch Users and Roles on Mount
  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    setLoading(true);
    try {
      const [usersRes, rolesRes] = await Promise.all([
        axios.get(`${BASE_URL}/api/users?limit=1000&user_type=all`),
        axios.get(`${BASE_URL}/api/roles?limit=1000`)
      ]);

      const usersData = Array.isArray(usersRes.data) ? usersRes.data : usersRes.data.data || [];
      const rolesData = Array.isArray(rolesRes.data) ? rolesRes.data : rolesRes.data.data || [];

      setUsers(usersData);
      setRoles(rolesData);

      // Auto-select first user if available
      if (usersData.length > 0) {
        handleUserSelect(usersData[0]);
      }

    } catch (err) {
      console.error("Failed to load initial data", err);
    } finally {
      setLoading(false);
    }
  };

  // 2. Handle User Selection -> Fetch Assigned Roles
  const handleUserSelect = async (user) => {
    setSelectedUser(user);
    // Optimistic UI or loading? Better loading for accuracy
    // Fetch specific user roles
    try {
      // Endpoint: /api/user/:id (GetUserRoles -> returns []Role)
      // Note: Endpoint defined in main.go as api.Get("/user/:user_id", handler.GetUserRoles)
      const res = await axios.get(`${BASE_URL}/api/user/${user.id}`);
      const assignedRoles = res.data || [];

      // Extract IDs
      const ids = new Set(assignedRoles.map(r => r.id));
      setAssignedRoleIds(ids);

    } catch (err) {
      console.error("Failed to fetch user roles", err);
      setAssignedRoleIds(new Set()); // Reset on error
    }
  };

  // 3. Toggle Role Checkbox
  const toggleRole = (roleId) => {
    setAssignedRoleIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(roleId)) {
        newSet.delete(roleId);
      } else {
        newSet.add(roleId);
      }
      return newSet;
    });
  };

  // 4. Save Changes
  const handleSave = async () => {
    if (!selectedUser) return;

    try {
      const payload = {
        role_ids: Array.from(assignedRoleIds)
      };

      // Endpoint: PUT /api/user/:id (UpdateUserRoles)
      await axios.put(`${BASE_URL}/api/user/${selectedUser.id}`, payload);
      alert(`Roles updated successfully for ${getUserDisplayName(selectedUser)}`);

      // Optional: Refresh local user list if it displays summaries of roles
      // For now, we remain on the same selection. 
    } catch (err) {
      console.error("Failed to save roles", err);
      alert("Failed to save changes.");
    }
  };

  // Helper to get display name
  const getUserDisplayName = (user) => {
    if (user.username) return user.username;
    if (user.firstname || user.lastname) {
      return `${user.firstname || ""} ${user.lastname || ""}`.trim();
    }
    return user.email || "Unknown User";
  };

  // Filter users by search
  const filteredUsers = users.filter(u => {
    const q = searchQuery.toLowerCase();
    const displayName = getUserDisplayName(u).toLowerCase();
    const email = (u.email || "").toLowerCase();
    return displayName.includes(q) || email.includes(q);
  });

  return (
    <div className="user-mapping-container">
      {/* Left Sidebar: User List */}
      <div className="user-sidebar">
        <div className="sidebar-header">
          <h3>User Management</h3>
          <div className="subtitle">Select a user to assign roles</div>
          <div className="search-box">
            <input
              type="text"
              placeholder="Search users..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        <div className="user-list">
          {filteredUsers.map(user => (
            <div
              key={user.id}
              className={`user-item ${selectedUser?.id === user.id ? 'active' : ''}`}
              onClick={() => handleUserSelect(user)}
            >
              <div className="user-name">{getUserDisplayName(user)}</div>
              <div className="user-email">{user.email}</div>
              {/* Optional: Show role count badge if we had that info pre-loaded */}
            </div>
          ))}
        </div>
      </div>

      {/* Right Content: Role Assignment */}
      <div className="role-mapping-content">
        <div className="content-header">
          <div className="header-info">
            <h2>{selectedUser ? getUserDisplayName(selectedUser) : "Select a User"}</h2>
            <p>Assign roles to grant permissions</p>
          </div>

          <button
            className="btn-save"
            onClick={handleSave}
            disabled={!selectedUser}
          >
            <FaSave style={{ marginBottom: -2, marginRight: 6 }} />
            Save Changes
          </button>
        </div>

        <div className="roles-grid">
          {loading && roles.length === 0 ? (
            <p style={{ padding: 20 }}>Loading roles...</p>
          ) : (
            <div className="roles-grid-inner">
              {roles.map(role => {
                const isChecked = assignedRoleIds.has(role.id);
                return (
                  <label
                    key={role.id}
                    className={`role-card ${isChecked ? 'selected' : ''}`}
                  >
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={() => toggleRole(role.id)}
                    />
                    <div className="role-info">
                      <div className="role-title">{role.role_name}</div>
                      <div className="role-desc">{role.description}</div>
                    </div>
                  </label>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
