import React, { useState, useEffect, useRef } from "react";
import "../../styles/role_management.scss";

import { BASE_URL }  from "../../../Config";

export default function RoleManagement() {
  // Simple console capture setup
  useEffect(() => {
    if (typeof window !== "undefined" && !window.__ROLE_MGMT_CONSOLE_WRAPPED) {
      console.log('🔧 [RoleManagement] Setting up console wrapper');
      window.__ROLE_MGMT_CONSOLE_LOGS = [];
      
      const levels = ["log", "info", "warn", "error", "debug"];
      const originals = {};
      
      levels.forEach(level => {
        originals[level] = console[level].bind(console);
      });

      levels.forEach(level => {
        console[level] = (...args) => {
          // Call original console method first
          try {
            originals[level](...args);
          } catch (e) {
            // swallow errors in original console
          }

          // Capture the log for our UI
          try {
            const text = args.map(arg => {
              try {
                if (typeof arg === 'string') return arg;
                if (typeof arg === 'object') return JSON.stringify(arg);
                return String(arg);
              } catch (e) {
                return '[Unserializable]';
              }
            }).join(' ');

            const entry = {
              level: level,
              text: text,
              time: new Date().toLocaleTimeString()
            };

            window.__ROLE_MGMT_CONSOLE_LOGS.push(entry);
            
            // Keep buffer manageable
            if (window.__ROLE_MGMT_CONSOLE_LOGS.length > 200) {
              window.__ROLE_MGMT_CONSOLE_LOGS.shift();
            }

            // Notify component if listener exists
            if (typeof window.__ROLE_MGMT_ON_LOG === 'function') {
              try {
                window.__ROLE_MGMT_ON_LOG(entry);
              } catch (e) {
                // swallow callback errors
              }
            }
          } catch (e) {
            // swallow capture errors
          }
        };
      });

      window.__ROLE_MGMT_CONSOLE_WRAPPED = true;
      console.log('🔧 [RoleManagement] Console wrapper installed successfully');
    }
  }, []);

  const [roles, setRoles] = useState(() => {
    console.log('🔧 [RoleManagement] Initializing roles state');
    const stored = JSON.parse(localStorage.getItem("roles") || "[]");
    if (stored.length > 0) {
      console.log('🔧 [RoleManagement] Using stored roles:', stored);
      return stored.map(role => ({ label: `${role.name} - ${role.description}`, value: role.name, id: role.id }));
    }
    console.log('🔧 [RoleManagement] Using default superadmin role');
    return [{ label: "superadmin - Super Administrator with access to all p", value: "superadmin" }];
  });

  const [selectedRole, setSelectedRole] = useState(roles.length ? roles[0].value : "");

  useEffect(() => {
    console.log('🔧 [RoleManagement] Fetching roles from backend...');
    console.log('🔧 [RoleManagement] BASE_URL:', BASE_URL);
    
    fetch(`${BASE_URL}/api/roles?limit=1000`)
      .then(async res => {
        console.log('🔧 [RoleManagement] Roles API response status:', res.status);
        const text = await res.text();
        console.log('🔧 [RoleManagement] Roles API raw response:', text);
        
        let data;
        try { 
          data = JSON.parse(text); 
          console.log('🔧 [RoleManagement] Roles API parsed data:', data);
        } catch (e) { 
          data = text; 
          console.error('🔧 [RoleManagement] Failed to parse roles JSON:', e);
        }
        
        if (!res.ok) throw new Error((data && data.error) || (typeof data === 'string' ? data : 'Failed to fetch roles'));
        
        const list = Array.isArray(data.data) ? data.data : data;
        console.log('🔧 [RoleManagement] Roles list:', list);
        
        const mapped = list.map(r => ({ label: `${r.role_name} - ${r.description || ''}`, value: r.role_name, id: r.id }));
        console.log('🔧 [RoleManagement] Mapped roles:', mapped);
        
        setRoles(mapped);
        
        if (mapped.length) {
          setSelectedRole(prev => {
            if (prev && mapped.find(r => r.value === prev)) return prev;
            return mapped[0].value;
          });
        }
        
        try { 
          localStorage.setItem('roles', JSON.stringify(mapped.map(r=>({ name: r.value, description: r.label.split(' - ')[1] || '', id: r.id })))); 
          console.log('🔧 [RoleManagement] Roles saved to localStorage');
        } catch (e) {
          console.error('🔧 [RoleManagement] Failed to save roles to localStorage:', e);
        }
      })
      .catch(err => {
        console.error('🔧 [RoleManagement] Failed to fetch roles, using localStorage fallback', err);
        const stored = JSON.parse(localStorage.getItem("roles") || "[]");
        console.log('🔧 [RoleManagement] Fallback stored roles:', stored);
        if (stored.length) setRoles(stored.map(role => ({ label: `${role.name} - ${role.description}`, value: role.name, id: role.id })));
      });
  }, []);

  const [menus, setMenus] = useState([{ label: "All menus...", value: "all" }]);
  const [permissionsData, setPermissionsData] = useState([]);
  const [selectedMenu, setSelectedMenu] = useState("all");

  useEffect(() => {
    console.log('🔧 [RoleManagement] Fetching menus from backend...');
    
    (async () => {
      try {
        const res = await fetch(`${BASE_URL}/api/loadMenus`);
        console.log('🔧 [RoleManagement] Menus API response status:', res.status);
        
        const text = await res.text();
        console.log('🔧 [RoleManagement] Menus API raw response:', text.substring(0, 500) + '...');
        
        let data;
        try { 
          data = JSON.parse(text); 
          console.log('🔧 [RoleManagement] Menus API parsed data:', data);
        } catch (e) { 
          data = text; 
          console.error('🔧 [RoleManagement] Failed to parse menus JSON:', e);
        }
        
        if (!res.ok) throw new Error((data && data.error) || (typeof data === 'string' ? data : 'Failed to fetch menus'));
        
        const list = Array.isArray(data) ? data : (data && data.data) ? data.data : [];
        console.log('🔧 [RoleManagement] Menus list:', list);
        
        const mapped = [{ label: 'All menus...', value: 'all' }, ...list.map(m => ({ label: m.menu_name || m.name, value: m.menu_name || m.name, id: m.id }))];
        console.log('🔧 [RoleManagement] Mapped menus:', mapped);
        
        setMenus(mapped);
        if (mapped.length) setSelectedMenu(mapped[0].value);
        
        const perms = list.map(m => ({ menu: m.menu_name || m.name, permissions: ["All", "View", "Create", "Update", "Delete"], id: m.id }));
        console.log('🔧 [RoleManagement] Permissions data:', perms);
        
        setPermissionsData(perms);
      } catch (err) {
        console.error('🔧 [RoleManagement] Failed to fetch menus from backend', err);
        
        const stored = JSON.parse(localStorage.getItem('menus') || '[]');
        console.log('🔧 [RoleManagement] Using fallback stored menus:', stored);
        
        if (stored.length) {
          const mapped = [{ label: 'All menus...', value: 'all' }, ...stored.map(m => ({ label: m.name || m.menu_name, value: m.name || m.menu_name }))];
          setMenus(mapped);
          if (mapped.length) setSelectedMenu(mapped[0].value);
          const perms = stored.map(m => ({ menu: m.name || m.menu_name, permissions: ["All","View","Create","Update","Delete"], id: m.id }));
          setPermissionsData(perms);
        }
      }
    })();
  }, []);

  const [permissions, setPermissions] = useState({});
  const [roleMenuTree, setRoleMenuTree] = useState([]);
  const latestRef = useRef({});
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
 
  const [debugMessages, setDebugMessages] = useState([]);
  const [debugVisible, setDebugVisible] = useState(false);

  useEffect(() => {
    console.log('🔧 [RoleManagement] Setting up console log listener');
    
    const buffered = (window.__ROLE_MGMT_CONSOLE_LOGS || []).slice(-200);
    console.log('🔧 [RoleManagement] Buffered logs count:', buffered.length);
    setDebugMessages(buffered);
    
    window.__ROLE_MGMT_ON_LOG = (entry) => {
      setDebugMessages(prev => {
        const next = prev.concat(entry);
        return next.length > 200 ? next.slice(next.length - 200) : next;
      });
    };
    
    return () => {
      try { 
        delete window.__ROLE_MGMT_ON_LOG; 
        console.log('🔧 [RoleManagement] Cleaned up console listener');
      } catch (e) {
        console.error('🔧 [RoleManagement] Error cleaning up console listener:', e);
      }
    };
  }, []);

  useEffect(() => {
    latestRef.current = { roles, selectedRole, menus, permissionsData, roleMenuTree, permissions };
    console.log('🔧 [RoleManagement] Updated ref with current state');
  }, [roles, selectedRole, menus, permissionsData, roleMenuTree, permissions]);

  useEffect(() => {
    console.log('🔧 [RoleManagement] Component fully mounted and ready');
    console.log('🔧 [RoleManagement] Current state:', {
      rolesCount: roles.length,
      selectedRole,
      menusCount: menus.length,
      permissionsDataCount: permissionsData.length,
      permissionsKeys: Object.keys(permissions)
    });
    
    window.__ROLE_MGMT = () => {
      console.log('🔧 [RoleManagement] Debug function called, returning current state');
      return latestRef.current;
    };
    
    return () => { 
      try { 
        delete window.__ROLE_MGMT;
        console.log('🔧 [RoleManagement] Cleaned up debug function');
      } catch(e) {
        console.error('🔧 [RoleManagement] Error cleaning up debug function:', e);
      }
    };
  }, []);

  useEffect(() => {
    console.log('🔧 [RoleManagement] Effect: selectedRole or permissionsData changed', {
      selectedRole,
      permissionsDataLength: permissionsData.length
    });
    
    if (!selectedRole) {
      console.log('🔧 [RoleManagement] No selected role, skipping permission fetch');
      return;
    }

    if (!permissionsData.length) {
      console.log('🔧 [RoleManagement] Permissions data not loaded yet, initializing empty');
      setPermissions({});
      return;
    }

    const roleObj = roles.find(r => r.value === selectedRole);
    console.log('🔧 [RoleManagement] Found role object:', roleObj);

    if (roleObj && roleObj.id) {
      console.log('🔧 [RoleManagement] Fetching permissions for role ID:', roleObj.id);
      
      (async () => {
        try {
          const url = `${BASE_URL}/api/roles/${roleObj.id}/permissions/menu-tree`;
          console.log('🔧 [RoleManagement] Fetching role menu tree from:', url);
          
          const res = await fetch(url);
          console.log('🔧 [RoleManagement] Permissions API response status:', res.status);
          
          const text = await res.text();
          console.log('🔧 [RoleManagement] Permissions API raw response:', text);
          
          let data;
          try { 
            data = JSON.parse(text); 
            console.log('🔧 [RoleManagement] Permissions API parsed data:', data);
          } catch (e) { 
            data = text; 
            console.error('🔧 [RoleManagement] Failed to parse permissions JSON:', e);
          }
          
          setRoleMenuTree(data);

          const mapped = {};
          if (Array.isArray(data)) {
            console.log('🔧 [RoleManagement] Processing array-shaped permissions data');
            permissionsData.forEach(({ menu }) => {
              const found = data.find(m => (m.menu_name || m.MenuName || m.name) === menu || (m.Menu && m.Menu.menu_name) === menu);
              const p = found ? (found.permissions || found.Permissions || {}) : {};
              mapped[menu] = {
                All: !!p.can_all,
                View: !!p.can_view,
                Create: !!p.can_create,
                Update: !!p.can_update,
                Delete: !!p.can_delete,
              };
              console.log(`🔧 [RoleManagement] Menu ${menu} permissions:`, mapped[menu]);
            });
          } else if (data && typeof data === 'object') {
            console.log('🔧 [RoleManagement] Processing object-shaped permissions data');
            const keys = Object.keys(data);
            permissionsData.forEach(({ menu, id }) => {
              let p;
              if (id && data[String(id)]) p = data[String(id)];
              if (!p && data[menu]) p = data[menu];
              if (!p) {
                for (const k of keys) {
                  const v = data[k];
                  if (!v) continue;
                  if (typeof v === 'object') {
                    if (k === String(id) || String(k) === String(id)) { p = v; break; }
                    if (v.Menu && (v.Menu.menu_name === menu || v.Menu.name === menu)) { p = v.permissions || v.Permissions || {}; break; }
                    if (v.menu_name === menu || v.name === menu) { p = v.permissions || v.Permissions || v; break; }
                  }
                }
              }
              const permsObj = p && (p.permissions || p.Permissions) ? (p.permissions || p.Permissions) : p || {};
              mapped[menu] = {
                All: !!permsObj.can_all,
                View: !!permsObj.can_view,
                Create: !!permsObj.can_create,
                Update: !!permsObj.can_update,
                Delete: !!permsObj.can_delete,
              };
              console.log(`🔧 [RoleManagement] Menu ${menu} permissions:`, mapped[menu]);
            });
          } else {
            console.log('🔧 [RoleManagement] Unknown permissions data shape, using defaults');
            permissionsData.forEach(({ menu }) => {
              mapped[menu] = { All: false, View: false, Create: false, Update: false, Delete: false };
            });
          }
          
          console.log('🔧 [RoleManagement] Final mapped permissions:', mapped);
          setPermissions(mapped);
        } catch (err) {
          console.error('🔧 [RoleManagement] Failed to load permissions from backend', err);
          const mapped = {};
          permissionsData.forEach(({ menu }) => {
            mapped[menu] = { All: false, View: false, Create: false, Update: false, Delete: false };
          });
          setPermissions(mapped);
        }
      })();
    } else {
      console.log('🔧 [RoleManagement] No role ID found, initializing default permissions');
      const mapped = {};
      permissionsData.forEach(({ menu }) => {
        mapped[menu] = { All: false, View: false, Create: false, Update: false, Delete: false };
      });
      setPermissions(mapped);
    }
  }, [selectedRole, permissionsData, roles]);

  const handlePermissionChange = (menu, perm) => {
    console.log(`🔧 [RoleManagement] Changing permission: ${menu}.${perm}`);
    setPermissions(prev => {
      const newPerms = {
        ...prev[menu],
        [perm]: !prev[menu][perm],
      };
      const allOthers = newPerms.View && newPerms.Create && newPerms.Update && newPerms.Delete;
      newPerms.All = allOthers;
      console.log(`🔧 [RoleManagement] New permissions for ${menu}:`, newPerms);
      return {
        ...prev,
        [menu]: newPerms,
      };
    });
  };

  const handleAllChange = (menu) => {
    console.log(`🔧 [RoleManagement] Toggling 'All' for menu: ${menu}`);
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

  const handleSave = async () => {
    console.log('🔧 [RoleManagement] Save button clicked');
    console.log('🔧 [RoleManagement] Current selectedRole:', selectedRole);
    console.log('🔧 [RoleManagement] Current permissions:', permissions);
    
    const roleObj = roles.find(r => r.value === selectedRole);
    console.log('🔧 [RoleManagement] Found role object for save:', roleObj);
    
    if (!roleObj || !roleObj.id) {
      console.error('🔧 [RoleManagement] Cannot save permissions: role id not found for', selectedRole);
      alert('Error: Role ID not found. Please select a valid role.');
      return;
    }

    if (!permissionsData.length) {
      console.error('🔧 [RoleManagement] Cannot save permissions: menus not loaded yet');
      alert('Error: Menus not loaded yet. Please wait and try again.');
      return;
    }

    // Build a stable lookup map from permissionsData (menu name -> id)
    const lookupMap = new Map(permissionsData.map(p => [p.menu, p.id]));
    // Also allow resolving from roleMenuTree if provided (it may have numeric keys & nested structure)
    if (roleMenuTree && roleMenuTree.length) {
      try {
        // Extract flat map from roleMenuTree if items have menu_name and id
        roleMenuTree.forEach(item => {
          if (item && (item.menu_name || item.name) && item.id) {
            lookupMap.set(item.menu_name || item.name, item.id);
          }
        });
      } catch (e) { /* ignore */ }
    }

    console.log('🔧 [RoleManagement] Lookup map (menu -> id):', Array.from(lookupMap.entries()));

    const payload = {};
    const missingMenus = [];
    permissionsData.forEach(({ menu }) => {
      const perms = permissions[menu] || { All: false, View: false, Create: false, Update: false, Delete: false };
      const menuId = lookupMap.get(menu);
      if (!menuId) {
        missingMenus.push(menu);
        return; // skip building payload for this menu
      }
      const key = String(menuId);
      payload[key] = {
        can_all: !!perms.All,
        can_view: !!perms.View,
        can_create: !!perms.Create,
        can_update: !!perms.Update,
        can_delete: !!perms.Delete,
      };
      console.log(`🔧 [RoleManagement] Payload for ${menu} (ID: ${key}):`, payload[key]);
    });

    if (missingMenus.length) {
      console.error('🔧 [RoleManagement] Cannot save: missing menu IDs for menus:', missingMenus);
      alert(`Error: The following menus lack IDs and cannot be saved: ${missingMenus.join(', ')}`);
      return;
    }

    console.log('🔧 [RoleManagement] Final payload to send (IDs only):', payload);

    try {
      const url = `${BASE_URL}/api/roles/${roleObj.id}/permissions`;
      console.log('🔧 [RoleManagement] Saving to:', url);
      
// print payload raw string too
      console.log('🔧 [RoleManagement] Payload JSON string:', JSON.stringify(payload));
      const res = await fetch(url, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
            
       console.log('🔧 [RoleManagement] Save response status:', res.status);
       const data = await res.json();
       console.log('🔧 [RoleManagement] Save response data:', data);
       
       if (!res.ok) throw new Error(data.error || data.message || 'Failed to update permissions');
       
       console.log('🔧 [RoleManagement] Permissions updated successfully for role:', selectedRole);
       alert('Permissions saved successfully!');
     } catch (err) {
       console.error('🔧 [RoleManagement] Failed to save permissions to backend:', err);
       alert('Error saving permissions: ' + err.message);
     }
  };

  return (
    <div className="role-management-container">
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <div className="role-management-header">Role Management</div>
        <button
          type="button"
          onClick={() => {
            console.log('🔧 [RoleManagement] Debug button clicked');
            console.log('🔧 [RoleManagement] Current state via ref:', latestRef.current);
            setDebugVisible(v => !v);
          }}
          className="debug-button"
          style={{ marginLeft: 12 }}
        >
          Debug
        </button>
      </div>
      
      {debugVisible && (
        <div style={{ marginTop: 8, maxHeight: 220, overflow: 'auto', background: '#111', color: '#dcdcdc', padding: 8, borderRadius: 6 }}>
          <div style={{ fontSize: 12, marginBottom: 6 }}>Console capture (last {debugMessages.length}):</div>
          <div style={{ fontFamily: 'monospace', fontSize: 12 }}>
            {debugMessages.map((m, i) => (
              <div key={i} style={{ opacity: 0.95 }}>
                <span style={{ color: m.level === 'error' ? '#ff6b6b' : m.level === 'warn' ? '#ffb86b' : '#9ad0ff' }}>[{m.time}] {m.level}</span>
                <span>: {m.text}</span>
              </div>
            ))}
          </div>
        </div>
      )}
      
      <div className="role-management-selectors">
        <div>
          <label>Select Role</label>
          <select value={selectedRole} onChange={e => {
            console.log('🔧 [RoleManagement] Role changed to:', e.target.value);
            setSelectedRole(e.target.value);
          }}>
            {roles.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
          </select>
        </div>
        <div>
          <label>Select Menu</label>
          <select value={selectedMenu} onChange={e => {
            console.log('🔧 [RoleManagement] Menu changed to:', e.target.value);
            setSelectedMenu(e.target.value);
          }}>
            {menus.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
          </select>
        </div>
      </div>
      
      <div className="role-management-permissions">
        <div className="role-management-permissions-title">
          Role Permissions for: <b>{selectedRole}</b>
        </div>
        <div className="permissions-table">
          {permissionsData.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage).map(({ menu, permissions: perms }) => (
            <div className={`permissions-row${permissions[menu]?.All ? " active" : ""}`} key={menu}>
              <span className="menu-title">{menu}</span>
              {perms.map(perm => (
                <label key={perm} className="perm-label">
                  <input
                    type="checkbox"
                    checked={!!permissions[menu]?.[perm]}
                    onChange={() => {
                      console.log(`🔧 [RoleManagement] Checkbox changed: ${menu}.${perm}`);
                      perm === "All" ? handleAllChange(menu) : handlePermissionChange(menu, perm);
                    }}
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
        <button className="save-button" onClick={handleSave}>
          Save Changes
        </button>
      </div>
    </div>
  );
}