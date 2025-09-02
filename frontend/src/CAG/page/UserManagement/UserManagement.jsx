import React, { useState, useEffect } from "react";
import "../../styles/user_management.scss";

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

  const [menus, setMenus] = useState(() => {
    const stored = JSON.parse(localStorage.getItem("menus") || "[]");
    return [
      { label: "All menus...", value: "all" },
      ...stored.map(m => ({ label: m.name, value: m.name }))
    ];
  });

  const [selectedMenu, setSelectedMenu] = useState(menus[0].value);

  // Permissions state: { [menu]: { [perm]: boolean } }
  const loadPermissions = (user) => {
    const stored = localStorage.getItem(`permissions_${user}`);
    return stored ? JSON.parse(stored) : {
      Home: { All: false, View: false, Create: false, Update: false, Delete: false },
      About: { All: false, View: false, Create: false, Update: false, Delete: false },
      Feedback: { All: false, View: false, Create: false, Update: false, Delete: false },
      "Data Validation": { All: true, View: true, Create: true, Update: true, Delete: true },
      "Bulk Upload": { All: true, View: true, Create: true, Update: true, Delete: true },
    };
  };

  const [permissions, setPermissions] = useState(loadPermissions(selectedUser));

  // Update permissions when selectedUser changes
  useEffect(() => {
    setPermissions(loadPermissions(selectedUser));
  }, [selectedUser]);

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
          {permissionsData.map(({ menu, permissions: perms }) => (
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
        <button className="save-button" onClick={() => {
          localStorage.setItem(`permissions_${selectedUser}`, JSON.stringify(permissions));
          console.log('Changes saved for user:', selectedUser);
        }}>
          Save Changes
        </button>
      </div>
    </div>
  );
}
