import React, { useState, useEffect } from "react";
import "../../styles/role_management.scss";

const API_BASE = 'http://localhost:8000';

const users = [
  { label: "admin assignor (admin@cag.com)", value: "admin@cag.com" },
  // ...add more users as needed
];


const permissionsData = [
  { menu: "Home", permissions: ["All", "View", "Create", "Update", "Delete"] },
  { menu: "About", permissions: ["All", "View", "Create", "Update", "Delete"] },
  { menu: "Feedback", permissions: ["All", "View", "Create", "Update", "Delete"] },
  { menu: "Data Validation", permissions: ["All", "View", "Create", "Update", "Delete"] },
  { menu: "Bulk Upload", permissions: ["All", "View", "Create", "Update", "Delete"] },
];

export default function RoleManagement() {
  const [roles, setRoles] = useState(() => {
    const stored = JSON.parse(localStorage.getItem("roles") || "[]");
    if (stored.length > 0) return stored.map(role => ({ label: `${role.name} - ${role.description}`, value: role.name, id: role.id }));
    return [{ label: "superadmin - Super Administrator with access to all p", value: "superadmin" }];
  });

  const [selectedRole, setSelectedRole] = useState(roles.length ? roles[0].value : "");

  useEffect(() => {
    // fetch roles from backend, fallback to localStorage
    fetch(`${API_BASE}/api/roles?limit=1000`)
      .then(async res => {
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Failed to fetch roles');
        const list = Array.isArray(data.data) ? data.data : data;
        const mapped = list.map(r => ({ label: `${r.role_name} - ${r.description || ''}`, value: r.role_name, id: r.id }));
        setRoles(mapped);
        if (mapped.length && !selectedRole) setSelectedRole(mapped[0].value);
        // store in localStorage for other parts of app that read it
        try { localStorage.setItem('roles', JSON.stringify(mapped.map(r=>({ name: r.value, description: r.label.split(' - ')[1] || '', id: r.id })))); } catch (e) {}
      })
      .catch(err => {
        console.error('RoleManagement: failed to fetch roles, using localStorage fallback', err);
        const stored = JSON.parse(localStorage.getItem("roles") || "[]");
        if (stored.length) setRoles(stored.map(role => ({ label: `${role.name} - ${role.description}`, value: role.name, id: role.id })));
      });
  }, []);

  const [menus, setMenus] = useState(() => {
    const stored = JSON.parse(localStorage.getItem("menus") || "[]");
    return [
      { label: "All menus...", value: "all" },
      ...stored.map(m => ({ label: m.name || m.menu_name, value: m.name || m.menu_name }))
    ];
  });

  const [selectedMenu, setSelectedMenu] = useState(menus[0].value);

  useEffect(() => {
    // fetch menus from backend and populate dropdown
    (async () => {
      try {
        const res = await fetch(`${API_BASE}/api/loadMenus?limit=1000`);
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Failed to fetch menus');
        const list = Array.isArray(data) ? data : data.data || [];
        const mapped = [{ label: 'All menus...', value: 'all' }, ...list.map(m => ({ label: m.menu_name, value: m.menu_name, id: m.id }))];
        setMenus(mapped);
        if (mapped.length) setSelectedMenu(mapped[0].value);
        try { localStorage.setItem('menus', JSON.stringify(list)); } catch (e) {}
      } catch (err) {
        console.error('RoleManagement: failed to fetch menus, using localStorage fallback', err);
        const stored = JSON.parse(localStorage.getItem('menus') || '[]');
        if (stored.length) {
          const mapped = [{ label: 'All menus...', value: 'all' }, ...stored.map(m => ({ label: m.name || m.menu_name, value: m.name || m.menu_name }))];
          setMenus(mapped);
          if (mapped.length) setSelectedMenu(mapped[0].value);
        }
      }
    })();
  }, []);

  // Permissions state: { [menu]: { [perm]: boolean } }
  const loadPermissions = (role) => {
    const stored = localStorage.getItem(`permissions_${role}`);
    return stored ? JSON.parse(stored) : {
      Home: { All: false, View: false, Create: false, Update: false, Delete: false },
      About: { All: false, View: false, Create: false, Update: false, Delete: false },
      Feedback: { All: false, View: false, Create: false, Update: false, Delete: false },
      "Data Validation": { All: true, View: true, Create: true, Update: true, Delete: true },
      "Bulk Upload": { All: true, View: true, Create: true, Update: true, Delete: true },
    };
  };

  const [permissions, setPermissions] = useState(loadPermissions(selectedRole));

  // Update permissions when selectedRole changes
  useEffect(() => {
    setPermissions(loadPermissions(selectedRole));
  }, [selectedRole]);

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
    <div className="role-management-container">
      <div className="role-management-header">Role Management</div>
      <div className="role-management-selectors">
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
      <div className="role-management-permissions">
        <div className="role-management-permissions-title">
          Role Permissions for: <b>{selectedRole}</b>
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
          localStorage.setItem(`permissions_${selectedRole}`, JSON.stringify(permissions));
          console.log('Changes saved for role:', selectedRole);
        }}>
          Save Changes
        </button>
      </div>
    </div>
  );
}
