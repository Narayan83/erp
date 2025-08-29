import React, { useState } from "react";
import "../../styles/user_management.scss";

const users = [
  { label: "admin assignor (admin@cag.com)", value: "admin@cag.com" },
  // ...add more users as needed
];

const roles = [
  { label: "superadmin - Super Administrator with access to all p", value: "superadmin" },
  // ...add more roles as needed
];

const menus = [
  { label: "All menus...", value: "all" },
  // ...add more menus as needed
];

const permissionsData = [
  { menu: "Home", permissions: ["All", "View", "Create", "Update", "Delete"] },
  { menu: "About", permissions: ["All", "View", "Create", "Update", "Delete"] },
  { menu: "Feedback", permissions: ["All", "View", "Create", "Update", "Delete"] },
  { menu: "Data Validation", permissions: ["All", "View", "Create", "Update", "Delete"] },
  { menu: "Bulk Upload", permissions: ["All", "View", "Create", "Update", "Delete"] },
];

export default function RoleManagement() {
  const [selectedUser, setSelectedUser] = useState(users[0].value);
  const [selectedRole, setSelectedRole] = useState(roles[0].value);
  const [selectedMenu, setSelectedMenu] = useState(menus[0].value);

  // Permissions state: { [menu]: { [perm]: boolean } }
  const [permissions, setPermissions] = useState({
    Home: { All: false, View: false, Create: false, Update: false, Delete: false },
    About: { All: false, View: false, Create: false, Update: false, Delete: false },
    Feedback: { All: false, View: false, Create: false, Update: false, Delete: false },
    "Data Validation": { All: true, View: true, Create: true, Update: true, Delete: true },
    "Bulk Upload": { All: true, View: true, Create: true, Update: true, Delete: true },
  });

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
      </div>
    </div>
  );
}
