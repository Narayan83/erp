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

  // Keep the latest menu tree returned by backend for id lookup when saving
  const [roleMenuTree, setRoleMenuTree] = useState([]);

  // Update permissions when selectedRole changes
  useEffect(() => {
    // Try to load permissions from backend for the selected role
    const roleObj = roles.find(r => r.value === selectedRole);
    if (roleObj && roleObj.id) {
      (async () => {
        try {
          const res = await fetch(`${API_BASE}/api/roles/${roleObj.id}/permissions/menu-tree`);
          if (!res.ok) throw new Error('Failed to fetch role menu tree');
          const data = await res.json();
          // data is expected to be an array of menus with .menu_name and .permissions
          setRoleMenuTree(data);
          // Map backend permissions (can_view/can_create/...) into our UI shape
          const mapped = {};
          permissionsData.forEach(({ menu, permissions: perms }) => {
            // Find menu in returned tree by name
            const found = data.find(m => (m.menu_name || m.MenuName || m.name) === menu || (m.Menu && m.Menu.menu_name) === menu);
            if (found) {
              const p = found.permissions || found.Permissions || {};
              mapped[menu] = {
                All: !!p.can_all,
                View: !!p.can_view,
                Create: !!p.can_create,
                Update: !!p.can_update,
                Delete: !!p.can_delete,
              };
            } else {
              // fallback to local default
              mapped[menu] = (loadPermissions(selectedRole)[menu]) || { All: false, View: false, Create: false, Update: false, Delete: false };
            }
          });
          setPermissions(mapped);
        } catch (err) {
          console.error('Failed to load permissions from backend, falling back to localStorage', err);
          setPermissions(loadPermissions(selectedRole));
        }
      })();
    } else {
      setPermissions(loadPermissions(selectedRole));
    }
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
            <div className={`permissions-row${permissions[menu]?.All ? " active" : ""}`} key={menu}>
              <span className="menu-title">{menu}</span>
              {perms.map(perm => (
                <label key={perm} className="perm-label">
                  <input
                    type="checkbox"
                    checked={!!permissions[menu]?.[perm]}
                    onChange={() => perm === "All" ? handleAllChange(menu) : handlePermissionChange(menu, perm)}
                  />
                  {perm}
                </label>
              ))}
            </div>
          ))}
        </div>
        <button className="save-button" onClick={() => {
          // Persist locally first
          try { localStorage.setItem(`permissions_${selectedRole}`, JSON.stringify(permissions)); } catch (e) {}

          // Attempt to save to backend
          (async () => {
            const roleObj = roles.find(r => r.value === selectedRole);
            if (!roleObj || !roleObj.id) {
              console.error('Cannot save permissions: role id not found for', selectedRole);
              return;
            }

            // Build payload keyed by menu ID (string) as backend expects
            const payload = {};

            // Use roleMenuTree if available to map names to IDs, otherwise try menus state
            const lookupList = roleMenuTree.length ? roleMenuTree : (menus.map(m => ({ menu_name: m.label, id: m.id })));

            permissionsData.forEach(({ menu }) => {
              const perms = permissions[menu] || { All: false, View: false, Create: false, Update: false, Delete: false };
              // Find menu id
              const found = lookupList.find(l => (l.menu_name || l.label || l.name) === menu || (l.Menu && l.Menu.menu_name) === menu || (l.menu_name && l.menu_name === menu));
              const menuId = found && (found.id || found.ID || (found.Menu && found.Menu.ID));
              const key = menuId ? String(menuId) : menu; // fallback to name key if id not present

              payload[key] = {
                can_all: !!perms.All,
                can_view: !!perms.View,
                can_create: !!perms.Create,
                can_update: !!perms.Update,
                can_delete: !!perms.Delete,
              };
            });

            try {
              const res = await fetch(`${API_BASE}/api/roles/${roleObj.id}/permissions`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
              });
              const data = await res.json();
              if (!res.ok) throw new Error(data.error || data.message || 'Failed to update permissions');
              console.log('Permissions updated on server for role:', selectedRole, data);
            } catch (err) {
              console.error('Failed to save permissions to backend:', err);
            }
          })();
        }}>
          Save Changes
        </button>
      </div>
    </div>
  );
}
