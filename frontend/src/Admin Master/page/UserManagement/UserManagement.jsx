import React, { useState, useEffect } from "react";
import axios from "axios";
import "../../styles/user_management.scss";
import { BASE_URL } from "../../../Config";

const users = [
  { label: "admin assignor (admin@cag.com)", value: "admin@cag.com" },
  // ...add more users as needed
];

const roles = (() => {
  const stored = JSON.parse(localStorage.getItem("roles") || "[]");
  if (stored.length > 0) {
    return stored.map(role => ({ label: `${role.name} - ${role.description}`, value: role.name }));
  } else {
    return [
      { label: "superadmin - Super Administrator with access to all p", value: "superadmin" },
    ];
  }
})();

const permissionsData = [
  { menu: "Home", permissions: ["All", "View", "Create", "Update", "Delete"] },
  { menu: "About", permissions: ["All", "View", "Create", "Update", "Delete"] },
  { menu: "Feedback", permissions: ["All", "View", "Create", "Update", "Delete"] },
  { menu: "Data Validation", permissions: ["All", "View", "Create", "Update", "Delete"] },
  { menu: "Bulk Upload", permissions: ["All", "View", "Create", "Update", "Delete"] },
];

export default function UserManagement() {
  const [selectedUser, setSelectedUser] = useState(users[0].value);
  const [selectedRole, setSelectedRole] = useState(roles[0].value);

  const [menus, setMenus] = useState([{ label: "All menus...", value: "all" }]);
  const [selectedMenu, setSelectedMenu] = useState("all");

  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  useEffect(() => {
    // fetch menus from backend and populate dropdown
    const fetchMenus = async () => {
      try {
        const res = await axios.get(`${BASE_URL}/api/loadMenus?limit=1000`);
        const menusArray = Array.isArray(res.data) ? res.data : res.data.data || [];
        const mapped = [{ label: "All menus...", value: "all" }, ...menusArray.map(m => ({ label: m.menu_name, value: m.menu_name, id: m.id }))];
        setMenus(mapped);
        // store in localStorage for compatibility
        try { localStorage.setItem('menus', JSON.stringify(menusArray)); } catch(e) {}
        if (mapped.length) setSelectedMenu(mapped[0].value);
      } catch (err) {
        console.error('UserManagement: failed to fetch menus, falling back to localStorage', err);
        const stored = JSON.parse(localStorage.getItem("menus") || "[]");
        if (stored.length) {
          const mapped = [{ label: "All menus...", value: "all" }, ...stored.map(m => ({ label: m.name || m.menu_name, value: m.name || m.menu_name }))];
          setMenus(mapped);
          if (mapped.length) setSelectedMenu(mapped[0].value);
        }
      }
    };

    fetchMenus();
  }, []);

  // Permissions state: { [menu]: { [perm]: boolean } }
  const loadPermissions = (user, role) => {
    let stored = localStorage.getItem(`permissions_${user}_${role}`);
    if (stored) return JSON.parse(stored);
    stored = localStorage.getItem(`permissions_${role}`);
    return stored ? JSON.parse(stored) : {
      Home: { All: false, View: false, Create: false, Update: false, Delete: false },
      About: { All: false, View: false, Create: false, Update: false, Delete: false },
      Feedback: { All: false, View: false, Create: false, Update: false, Delete: false },
      "Data Validation": { All: true, View: true, Create: true, Update: true, Delete: true },
      "Bulk Upload": { All: true, View: true, Create: true, Update: true, Delete: true },
    };
  };

  const [permissions, setPermissions] = useState(loadPermissions(selectedUser, selectedRole));

  // Update permissions when selectedUser or selectedRole changes
  useEffect(() => {
    setPermissions(loadPermissions(selectedUser, selectedRole));
  }, [selectedUser, selectedRole]);

  useEffect(() => {
    if (currentPage > Math.max(1, Math.ceil(permissionsData.length / itemsPerPage))) setCurrentPage(1);
  }, [permissionsData.length]);

  const handlePermissionChange = (menu, perm) => {
    setPermissions(prev => {
      const newPerms = {
        ...prev[menu],
        [perm]: !prev[menu][perm],
      };
      // Update "All" based on whether all other permissions are checked
      const allOthers = newPerms.View && newPerms.Create && newPerms.Update && newPerms.Delete;
      newPerms.All = allOthers;
      return {
        ...prev,
        [menu]: newPerms,
      };
    });
  };

  const handleAllChange = (menu) => {
    const allChecked = !permissions[menu].All;
    setPermissions(prev => ({
      ...prev,
      [menu]: {
        All: allChecked,
        View: allChecked,
        Create: allChecked,
        Update: allChecked,
        Delete: allChecked,
      }
    }));
  };

  const handleReset = () => {
    localStorage.removeItem(`permissions_${selectedUser}_${selectedRole}`);
    setPermissions(loadPermissions(selectedUser, selectedRole));
  };

  return (
    <div className="user-management-container">
      <div className="user-management-header">User Management</div>
      <div className="user-management-selectors">
        <div>
          <label>Select User</label>
          <select value={selectedUser} onChange={e => setSelectedUser(e.target.value)}>
            {users.map(u => <option key={u.value} value={u.value}>{u.label}</option>)}
          </select>
        </div>
        <div>
          <label>Select Role</label>
          <select value={selectedRole} onChange={e => setSelectedRole(e.target.value)}>
            {roles.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
          </select>
        </div>
        <div>
          <label>Select Menu</label>
          <select value={selectedMenu} onChange={e => setSelectedMenu(e.target.value)}>
            {menus.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
          </select>
        </div>
      </div>
      <div className="user-management-permissions">
        <div className="user-management-permissions-title">
          Assign Permissions for: <b>{selectedRole}</b>
        </div>
        <div className="permissions-table">
          {permissionsData.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage).map(({ menu, permissions: perms }) => (
            <div className={`permissions-row${permissions[menu].All ? " active" : ""}`} key={menu}>
              <span className="menu-title">{menu}</span>
              {perms.map(perm => (
                <label key={perm} className="perm-label">
                  <input
                    type="checkbox"
                    checked={permissions[menu][perm]}
                    onChange={() => perm === "All" ? handleAllChange(menu) : handlePermissionChange(menu, perm)}
                  />
                  {perm}
                </label>
              ))}
            </div>
          ))}
        </div>
        <div className="pagination">
          <div className="page-info">Showing {(permissionsData.length === 0) ? 0 : ((currentPage - 1) * itemsPerPage + 1)} - {Math.min(currentPage * itemsPerPage, permissionsData.length)} of {permissionsData.length}</div>
          <div className="page-controls">
            <button disabled={currentPage === 1} onClick={() => setCurrentPage(p => Math.max(1, p - 1))}>Prev</button>
            {[...Array(Math.max(1, Math.ceil(permissionsData.length / itemsPerPage)))].map((_, i) => {
              const p = i + 1;
              return <button key={p} className={p === currentPage ? 'active' : ''} onClick={() => setCurrentPage(p)}>{p}</button>;
            })}
            <button disabled={currentPage === Math.max(1, Math.ceil(permissionsData.length / itemsPerPage))} onClick={() => setCurrentPage(p => Math.min(Math.max(1, Math.ceil(permissionsData.length / itemsPerPage)), p + 1))}>Next</button>
          </div>
          <div className="items-per-page">
            <label>Show:</label>
            <select value={itemsPerPage} onChange={(e) => { setItemsPerPage(Number(e.target.value)); setCurrentPage(1); }}>
              <option value={5}>5</option>
              <option value={10}>10</option>
              <option value={20}>20</option>
              <option value={50}>50</option>
            </select>
          </div>
        </div>
        <div className="buttons-container">
          <button className="save-button" onClick={handleReset}>
            Reset Permissions
          </button>
          <button className="save-button" onClick={() => {
            localStorage.setItem(`permissions_${selectedUser}_${selectedRole}`, JSON.stringify(permissions));
            console.log('Changes saved for user:', selectedUser, 'role:', selectedRole);
          }}>
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
}
