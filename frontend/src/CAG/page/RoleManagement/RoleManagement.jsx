import React, { useState } from "react";
import { Box, Typography, Select, MenuItem, FormControl, Checkbox, FormControlLabel, Grid, Paper } from "@mui/material";

const users = [
  { label: "admin assignor (admin@cag.com)", value: "admin" }
];
const roles = [
  { label: "superadmin - Super Administrator with access to all p", value: "superadmin" }
];
const menus = [
  { label: "All menus...", value: "all" }
];

const permissions = [
  { name: "Home", checked: false, perms: { all: false, view: true, create: false, update: false, delete: false } },
  { name: "About", checked: false, perms: { all: false, view: true, create: false, update: false, delete: false } },
  { name: "Feedback", checked: false, perms: { all: false, view: true, create: false, update: false, delete: false } },
  { name: "Data Validation", checked: true, perms: { all: false, view: true, create: true, update: true, delete: true } },
  { name: "Bulk Upload", checked: true, perms: { all: false, view: true, create: true, update: true, delete: true } }
];

export default function RoleManagement() {
  const [selectedUser, setSelectedUser] = useState(users[0].value);
  const [selectedRole, setSelectedRole] = useState(roles[0].value);
  const [selectedMenu, setSelectedMenu] = useState(menus[0].value);

  return (
    <Box className="role-management-root">
      <Box className="role-management-header">
        <Typography variant="h6" align="center">Role Management</Typography>
      </Box>
      <Box className="role-management-content">
        <Grid container spacing={2}>
          <Grid item xs={12} sm={4}>
            <Typography fontWeight={600} mb={1}>Select User</Typography>
            <FormControl fullWidth>
              <Select value={selectedUser} onChange={e => setSelectedUser(e.target.value)}>
                {users.map(u => <MenuItem key={u.value} value={u.value}>{u.label}</MenuItem>)}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={4}>
            <Typography fontWeight={600} mb={1}>Select Role</Typography>
            <FormControl fullWidth>
              <Select value={selectedRole} onChange={e => setSelectedRole(e.target.value)}>
                {roles.map(r => <MenuItem key={r.value} value={r.value}>{r.label}</MenuItem>)}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={4}>
            <Typography fontWeight={600} mb={1}>Select Menu</Typography>
            <FormControl fullWidth>
              <Select value={selectedMenu} onChange={e => setSelectedMenu(e.target.value)}>
                {menus.map(m => <MenuItem key={m.value} value={m.value}>{m.label}</MenuItem>)}
              </Select>
            </FormControl>
          </Grid>
        </Grid>
        <Box className="role-management-permissions">
          <Typography variant="subtitle1" mb={2}>
            Role Permissions for: <b>superadmin</b>
          </Typography>
          <Paper elevation={0} className="role-management-permissions-paper">
            {permissions.map((perm, idx) => (
              <Box key={perm.name} className="role-management-permission-row">
                <FormControlLabel
                  control={<Checkbox checked={perm.checked} />}
                  label={<Typography fontWeight={600}>{perm.name}</Typography>}
                  sx={{ minWidth: 160 }}
                />
                <Box className="role-management-permission-checkboxes">
                  <FormControlLabel control={<Checkbox checked={perm.perms.all} />} label="All" />
                  <FormControlLabel control={<Checkbox checked={perm.perms.view} />} label="View" />
                  <FormControlLabel control={<Checkbox checked={perm.perms.create} />} label="Create" />
                  <FormControlLabel control={<Checkbox checked={perm.perms.update} />} label="Update" />
                  <FormControlLabel control={<Checkbox checked={perm.perms.delete} />} label="Delete" />
                </Box>
              </Box>
            ))}
          </Paper>
        </Box>
      </Box>
    </Box>
  );
}
