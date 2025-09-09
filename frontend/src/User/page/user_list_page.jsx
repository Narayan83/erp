// UserListPage.jsx
import React, { useEffect, useState } from "react";
import {
  Box,
  Button,
  Grid,
  TextField,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  CircularProgress,
  TablePagination,
  InputAdornment,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormGroup,
  FormControlLabel,
  Checkbox,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from "@mui/material";
import { Edit, Visibility, Search, TableView, WhatsApp, Mail, FileUpload, FileDownload } from "@mui/icons-material";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { BASE_URL } from "../../Config";
import * as XLSX from 'xlsx';

export default function UserListPage() {
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [filters, setFilters] = useState({ name: "", roleID: '', deptHead: '', userType: '' });
  const [page, setPage] = useState(0);
  const [limit, setRowsPerPage] = useState(10);
  const [totalItems, setTotalItems] = useState(0);
  const [loading, setLoading] = useState(false);

  // Display Preferences dialog state
  const [displayPrefOpen, setDisplayPrefOpen] = useState(false);
  // User struct fields from user.go, customized for display
  const userFields = [
    "Name", // Salutation + Firstname + Lastname
    "DOB",
    "Gender",
    "CountryCode",
    "MobileNumber",
    "EmergencyNumber",
    "AlternateNumber",
    "WhatsappNumber",
    "Email",
    "Website",
    "BusinessName",
    "Title",
    "CompanyName",
    "Designation",
    "IndustrySegment",
    "Address1",
    "Address2",
    "Address3",
    "Address4",
    "Address5",
    "State",
    "Country",
    "Pincode",
    "AadharNumber",
    "PANNumber",
    "GSTIN",
    "MSMENo",
    // --- Add Bank Information fields below ---
    "BankName",
    "BranchName",
    "BranchAddress",
    "AccountNumber",
    "IFSCCode",
    // --- End Bank Information fields ---
    "Active",
    "IsUser",
    "IsCustomer",
    "IsSupplier",
    "IsEmployee",
    "IsDealer",
    "IsDistributor",
    "RoleID",
    "Additional Address",
    "Additional Bank Info" // <-- Add this line
  ];
  const [checkedFields, setCheckedFields] = useState(() => {
    const stored = localStorage.getItem('userListCheckedFields');
    return stored ? JSON.parse(stored) : userFields;
  });

  const handleDisplayPrefOpen = () => setDisplayPrefOpen(true);
  const handleDisplayPrefClose = () => setDisplayPrefOpen(false);

  // Save checkedFields to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('userListCheckedFields', JSON.stringify(checkedFields));
  }, [checkedFields]);
  const handleFieldToggle = (field) => {
    setCheckedFields((prev) => {
      const updated = prev.includes(field)
        ? prev.filter((f) => f !== field)
        : [...prev, field];
      localStorage.setItem('userListCheckedFields', JSON.stringify(updated));
      return updated;
    });
  };

  useEffect(() => {
    fetchUsers();
  }, [page, limit]);

  // Debounced search effect for all filters
  useEffect(() => {
    const handler = setTimeout(() => {
      setPage(0);
      fetchUsers();
    }, 300);
    return () => clearTimeout(handler);
  }, [filters.name, filters.roleID, filters.deptHead, filters.userType]);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${BASE_URL}/api/users`, {
        params: {
          page: page + 1,
          limit,
          filter: filters.name,
          role_id: filters.roleID,
          dept_head: filters.deptHead,
          user_type: filters.userType,
        },
      });
      setUsers(res.data.data);
      setTotalItems(res.data.total);
    } catch (err) {
      console.error("Error fetching users:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    setPage(0);
    fetchUsers();
  };

  // Add state for view dialog and selected user
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);

  // Selection state for table rows
  const [selectedIds, setSelectedIds] = useState([]);

  const handleToggleSelectAll = (e) => {
    const checked = e.target.checked;
    if (checked) setSelectedIds(users.map(u => u.id));
    else setSelectedIds([]);
  };

  const handleToggleSelect = (id) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  };

  return (
    <Box p={3}>
      <Typography variant="h5" mb={2}>👤 User Master</Typography>

      <Paper sx={{ p: 2, mb: 2 }}>
        <Box display="flex" alignItems="center" width="100%">
          <Box flex={1}>
            <TextField
              label="Search by Name"
              fullWidth
              size="small"
              value={filters.name}
              onChange={(e) => setFilters({ ...filters, name: e.target.value })}
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton color="primary" aria-label="search">
                      <Search />
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />
          </Box>
          <Tooltip title="Display Preferences">
            <IconButton sx={{ mx: 2 }} aria-label="table view" onClick={handleDisplayPrefOpen}>
              <TableView />
            </IconButton>
          </Tooltip>
          <Tooltip title="Import">
            <IconButton sx={{ mx: 2 }} aria-label="import" onClick={() => {/* Add import logic here */}}>
              <FileDownload />
            </IconButton>
          </Tooltip>
          <Tooltip title="Export">
            <IconButton sx={{ mx: 2 }} aria-label="export" onClick={() => {
              // Export only selected users if any are selected; otherwise export current page users
              const exportSource = selectedIds.length > 0 ? users.filter(u => selectedIds.includes(u.id)) : users;
              const data = exportSource.map(user => {
                const obj = {};
                checkedFields.forEach(field => {
                  obj[field] = field === "Name"
                    ? [user.salutation, user.firstname, user.lastname].filter(Boolean).join(" ")
                    : field === "DOB"
                    ? (user.dob ? new Date(user.dob).toLocaleDateString() : "")
                    : field === "Gender"
                    ? user.gender
                    : field === "CountryCode"
                    ? user.country_code
                    : field === "MobileNumber"
                    ? user.mobile_number
                    : field === "EmergencyNumber"
                    ? user.emergency_number
                    : field === "AlternateNumber"
                    ? user.alternate_number
                    : field === "WhatsappNumber"
                    ? user.whatsapp_number
                    : field === "Email"
                    ? user.email
                    : field === "Website"
                    ? user.website
                    : field === "BusinessName"
                    ? user.business_name
                    : field === "Title"
                    ? user.title
                    : field === "CompanyName"
                    ? user.companyname
                    : field === "Designation"
                    ? user.designation
                    : field === "IndustrySegment"
                    ? user.industry_segment
                    : field === "Address1"
                    ? user.address1
                    : field === "Address2"
                    ? user.address2
                    : field === "Address3"
                    ? user.address3
                    : field === "Address4"
                    ? user.address4
                    : field === "Address5"
                    ? user.address5
                    : field === "State"
                    ? user.state
                    : field === "Country"
                    ? user.country
                    : field === "Pincode"
                    ? user.pincode
                    : field === "AadharNumber"
                    ? user.aadhar_number
                    : field === "PANNumber"
                    ? user.pan_number
                    : field === "GSTIN"
                    ? user.gstin
                    : field === "MSMENo"
                    ? user.msme_no
                    : field === "BankName"
                    ? user.bank_name
                    : field === "BranchName"
                    ? user.branch_name
                    : field === "BranchAddress"
                    ? user.branch_address
                    : field === "AccountNumber"
                    ? user.account_number
                    : field === "IFSCCode"
                    ? user.ifsc_code
                    : field === "Active"
                    ? (user.active ? "Yes" : "No")
                    : field === "IsUser"
                    ? (user.is_user ? "Yes" : "No")
                    : field === "IsCustomer"
                    ? (user.is_customer ? "Yes" : "No")
                    : field === "IsSupplier"
                    ? (user.is_supplier ? "Yes" : "No")
                    : field === "IsEmployee"
                    ? (user.is_employee ? "Yes" : "No")
                    : field === "IsDealer"
                    ? (user.is_dealer ? "Yes" : "No")
                    : field === "IsDistributor"
                    ? (user.is_distributor ? "Yes" : "No")
                    : field === "RoleID"
                    ? user.role_id
                    : field === "Additional Address"
                    ? (Array.isArray(user.additional_addresses) && user.additional_addresses.length > 0
                        ? user.additional_addresses.map(addr => Object.entries(addr).filter(([k, v]) => k !== "keyValues" && v).map(([k, v]) => `${k}: ${v}`).join("; ")).join(" | ")
                        : Array.isArray(user.Addresses) && user.Addresses.length > 0
                        ? user.Addresses.map(addrStr => {
                            try {
                              const addr = JSON.parse(addrStr);
                              return Object.entries(addr).filter(([k, v]) => k !== "keyValues" && v).map(([k, v]) => `${k}: ${v}`).join("; ");
                            } catch { return ""; }
                          }).join(" | ")
                        : "")
                    : field === "Additional Bank Info"
                    ? (Array.isArray(user.AdditionalBankInfos) && user.AdditionalBankInfos.length > 0
                        ? user.AdditionalBankInfos.map(biStr => {
                            try {
                              const bi = typeof biStr === "string" ? JSON.parse(biStr) : biStr;
                              return Object.entries(bi).filter(([k, v]) => k !== "keyValues" && v).map(([k, v]) => `${k}: ${v}`).join("; ");
                            } catch { return ""; }
                          }).join(" | ")
                        : "")
                    : "";
                });
                return obj;
              });
              const ws = XLSX.utils.json_to_sheet(data);
              const wb = XLSX.utils.book_new();
              XLSX.utils.book_append_sheet(wb, ws, "Users");
              XLSX.writeFile(wb, `users_export${selectedIds.length>0? '_selected':''}.xlsx`);
            }}>
              <FileUpload />
            </IconButton>
          </Tooltip>
           
           {/* DEPT HEAD DROPDOWN */}
          <Box flex={0.5} sx={{ mr: 1 }}>
            <FormControl fullWidth size="small">
              <InputLabel>Dept Head</InputLabel>
              <Select
                value={filters.deptHead}
                label="Dept Head"
                onChange={(e) => setFilters({ ...filters, deptHead: e.target.value })}
              >
                <MenuItem value="">All</MenuItem>
                <MenuItem value="1">Dept Head 1</MenuItem>
                <MenuItem value="2">Dept Head 2</MenuItem>
                <MenuItem value="3">Dept Head 3</MenuItem>
              </Select>
            </FormControl>
          </Box>

           {/* SELECT EXECUTIVE DROPDOWN */}
          <Box flex={0.5} sx={{ mr: 1 }}>
            <FormControl fullWidth size="small">
              <InputLabel id="demo-simple-select-label">Select Executive</InputLabel>
              <Select
                labelId="demo-simple-select-label"
                id="demo-simple-select"
                value={filters.roleID !== undefined ? filters.roleID : ''}
                label="Select Executive"
                onChange={(e) => setFilters({ ...filters, roleID: e.target.value })}
              >
                <MenuItem value={1}>Executive 1</MenuItem>
                <MenuItem value={2}>Executive 2</MenuItem>
                <MenuItem value={3}>Executive 3</MenuItem>
                <MenuItem value={4}>Executive 4</MenuItem>
              </Select>
            </FormControl>
          </Box>

          {/* USER TYPE DROPDOWN */}
          <Box flex={0.5}>
            <FormControl fullWidth size="small">
              <InputLabel>User Type</InputLabel>
              <Select
                value={filters.userType}
                label="User Type"
                onChange={(e) => setFilters({ ...filters, userType: e.target.value })}
              >
                <MenuItem value="">All</MenuItem>
                <MenuItem value="user">User</MenuItem>
                <MenuItem value="customer">Customer</MenuItem>
                <MenuItem value="supplier">Supplier</MenuItem>
                <MenuItem value="employee">Employee</MenuItem>
                <MenuItem value="dealer">Dealer</MenuItem>
                <MenuItem value="distributor">Distributor</MenuItem>
              </Select>
            </FormControl>
          </Box>

          <Button variant="contained" color="primary" sx={{ ml: 2, flex: 0.3 }} onClick={() => navigate("/users/add")}>+ Add User</Button>
        </Box>
      </Paper>

      <Paper>
        {loading ? (
          <Box p={3} textAlign="center">
            <CircularProgress />
          </Box>
        ) : users.length === 0 ? (
          <Box p={3} textAlign="center">No users found.</Box>
        ) : (
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell padding="checkbox">
                    <Checkbox
                      checked={users.length > 0 && selectedIds.length === users.length}
                      indeterminate={selectedIds.length > 0 && selectedIds.length < users.length}
                      onChange={handleToggleSelectAll}
                      size="small"
                    />
                  </TableCell>
                  <TableCell sx={{ fontWeight: "bold" }}>S.No</TableCell>
                  {userFields.filter(field => checkedFields.includes(field)).map((field) => (
                    <TableCell key={field} sx={{ fontWeight: "bold" }}>{field}</TableCell>
                  ))}
                  {checkedFields.length > 0 && (
                    <TableCell sx={{ fontWeight: "bold" }} align="center">Actions</TableCell>
                  )}
                </TableRow>
              </TableHead>
              <TableBody>
                {users.map((user, index) => (
                  <TableRow key={user.id} selected={selectedIds.includes(user.id)}>
                    <TableCell padding="checkbox">
                      <Checkbox
                        checked={selectedIds.includes(user.id)}
                        onChange={() => handleToggleSelect(user.id)}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>{page * limit + index + 1}</TableCell>
                    {userFields.filter(field => checkedFields.includes(field)).map((field) => (
                      <TableCell key={field} sx={field === "Name" ? { whiteSpace: 'nowrap' } : {}}>
                        {field === "Name"
                          ? [user.salutation, user.firstname, user.lastname].filter(Boolean).join(" ")
                          : field === "DOB"
                          ? user.dob ? new Date(user.dob).toLocaleDateString() : ""
                          : field === "Gender"
                          ? user.gender
                          : field === "CountryCode"
                          ? user.country_code
                          : field === "MobileNumber"
                          ? user.mobile_number
                          : field === "EmergencyNumber"
                          ? user.emergency_number
                          : field === "AlternateNumber"
                          ? user.alternate_number
                          : field === "WhatsappNumber"
                          ? user.whatsapp_number
                          : field === "Email"
                          ? user.email
                          : field === "Website"
                          ? user.website
                          : field === "BusinessName"
                          ? user.business_name
                          : field === "Title"
                          ? user.title
                          : field === "CompanyName"
                          ? user.companyname
                          : field === "Designation"
                          ? user.designation
                          : field === "IndustrySegment"
                          ? user.industry_segment
                          : field === "Address1"
                          ? user.address1
                          : field === "Address2"
                          ? user.address2
                          : field === "Address3"
                          ? user.address3
                          : field === "Address4"
                          ? user.address4
                          : field === "Address5"
                          ? user.address5
                          : field === "State"
                          ? user.state
                          : field === "Country"
                          ? user.country
                          : field === "Pincode"
                          ? user.pincode
                          : field === "AadharNumber"
                          ? user.aadhar_number
                          : field === "PANNumber"
                          ? user.pan_number
                          : field === "GSTIN"
                          ? user.gstin
                          : field === "MSMENo"
                          ? user.msme_no
                          // --- Add Bank Information display logic below ---
                          : field === "BankName"
                          ? user.bank_name
                          : field === "BranchName"
                          ? user.branch_name
                          : field === "BranchAddress"
                          ? user.branch_address
                          : field === "AccountNumber"
                          ? user.account_number
                          : field === "IFSCCode"
                          ? user.ifsc_code
                          // --- End Bank Information display logic ---
                          : field === "Active"
                          ? user.active ? "Yes" : "No"
                          : field === "IsUser"
                          ? user.is_user ? "Yes" : "No"
                          : field === "IsCustomer"
                          ? user.is_customer ? "Yes" : "No"
                          : field === "IsSupplier"
                          ? user.is_supplier ? "Yes" : "No"
                          : field === "IsEmployee"
                          ? user.is_employee ? "Yes" : "No"
                          : field === "IsDealer"
                          ? user.is_dealer ? "Yes" : "No"
                          : field === "IsDistributor"
                          ? user.is_distributor ? "Yes" : "No"
                          : field === "RoleID"
                          ? user.role_id
                          : field === "Additional Address"
                          ? (
                              Array.isArray(user.additional_addresses) && user.additional_addresses.length > 0
                                ? user.additional_addresses.map((addr, idx) => (
                                    <div key={idx} style={{ marginBottom: 8 }}>
                                      {Object.entries(addr).map(([key, value]) => (
                                        key !== "keyValues"
                                          ? value
                                            ? <div key={key}><b>{key}:</b> {value}</div>
                                            : null
                                          : Array.isArray(value) && value.length > 0
                                            ? <div key={key}><b>keyValues:</b>
                                                {value.map((kv, i) => (
                                                  <span key={i}> [{kv.key}: {kv.value}]</span>
                                                ))}
                                              </div>
                                            : null
                                      ))}
                                    </div>
                                  ))
                                // Fallback: try to parse Addresses if additional_addresses is empty
                                : Array.isArray(user.Addresses) && user.Addresses.length > 0
                                  ? user.Addresses.map((addrStr, idx) => {
                                      let addr;
                                      try { addr = JSON.parse(addrStr); } catch { addr = {}; }
                                      return (
                                        <div key={idx} style={{ marginBottom: 8 }}>
                                          {Object.entries(addr).map(([key, value]) =>
                                            key !== "keyValues"
                                              ? value
                                                ? <div key={key}><b>{key}:</b> {value}</div>
                                                : null
                                              : Array.isArray(value) && value.length > 0
                                                ? <div key={key}><b>keyValues:</b>
                                                    {value.map((kv, i) => (
                                                      <span key={i}> [{kv.key}: {kv.value}]</span>
                                                    ))}
                                                  </div>
                                                : null
                                          )}
                                        </div>
                                      );
                                    })
                                  : ""
                          )
                          : field === "Additional Bank Info"
                          ? (
                              Array.isArray(user.AdditionalBankInfos) && user.AdditionalBankInfos.length > 0
                                ? user.AdditionalBankInfos.map((biStr, idx) => {
                                    let bi;
                                    try { bi = typeof biStr === "string" ? JSON.parse(biStr) : biStr; } catch { bi = {}; }
                                    return (
                                      <div key={idx} style={{ marginBottom: 8 }}>
                                        {Object.entries(bi).map(([key, value]) =>
                                          key !== "keyValues"
                                            ? value
                                              ? <div key={key}><b>{key}:</b> {value}</div>
                                              : null
                                            : Array.isArray(value) && value.length > 0
                                              ? <div key={key}><b>keyValues:</b>
                                                  {value.map((kv, i) => (
                                                    <span key={i}> [{kv.key}: {kv.value}]</span>
                                                  ))}
                                                </div>
                                              : null
                                      )}
                                    </div>
                                    );
                                  })
                                : ""
                          )
                          : ""
                        }
                      </TableCell>
                    ))}
                    {checkedFields.length > 0 && (
                      <TableCell align="center" sx={{ whiteSpace: 'nowrap' }}>
                        {/* Change View button to open dialog */}
                        <Tooltip title="View">
                          <IconButton
                            onClick={() => {
                              setSelectedUser(user);
                              setViewDialogOpen(true);
                            }}
                          >
                            <Visibility />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Edit"><IconButton onClick={() => navigate(`/users/${user.id}/edit`)}><Edit /></IconButton></Tooltip>
                        <Tooltip title="WhatsApp"><IconButton><WhatsApp /></IconButton></Tooltip>
                        <Tooltip title="Mail"><IconButton><Mail /></IconButton></Tooltip>
                      </TableCell>
                    )}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}

        <Box p={2} display="flex" justifyContent="flex-end" alignItems="center">
          <TablePagination
            component="div"
            count={totalItems}
            page={page}
            onPageChange={(e, newPage) => setPage(newPage)}
            rowsPerPage={limit}
            onRowsPerPageChange={(e) => {
              setRowsPerPage(parseInt(e.target.value, 10));
              setPage(0);
            }}
            rowsPerPageOptions={[5, 10, 25]}
          />
        </Box>
      </Paper>
    {/* Display Preferences Dialog */}
      <Dialog open={displayPrefOpen} onClose={handleDisplayPrefClose} maxWidth="xs" fullWidth>
        <DialogTitle>Display Preferences</DialogTitle>
        <DialogContent>
          {/* Select All Checkbox */}
          <Box display="flex" alignItems="center" mb={2}>
            <Checkbox
              checked={checkedFields.length === userFields.length}
              indeterminate={checkedFields.length > 0 && checkedFields.length < userFields.length}
              onChange={e => {
                if (e.target.checked) {
                  setCheckedFields(userFields);
                  localStorage.setItem('userListCheckedFields', JSON.stringify(userFields));
                } else {
                  setCheckedFields([]);
                  localStorage.setItem('userListCheckedFields', JSON.stringify([]));
                }
              }}
              size="small"
              sx={{ p: 0.5, mr: 1 }}
            />
            <span style={{ fontWeight: 500, fontSize: 15 }}>Select All</span>
          </Box>
          {/* 8 rows x 5 columns grid, checkbox and label, visually improved */}
          {Array.from({ length: Math.ceil(userFields.length / 5) }).map((_, rowIdx) => (
            <Grid container spacing={2} key={rowIdx}>
              {userFields.slice(rowIdx * 5, rowIdx * 5 + 5).map((field) => (
                <Grid item xs={2.4} key={field} style={{ display: 'flex', alignItems: 'center', minHeight: 40 }}>
                  <Checkbox
                    checked={checkedFields.includes(field)}
                    onChange={() => handleFieldToggle(field)}
                    size="small"
                    sx={{ p: 0.5, mr: 1 }}
                  />
                  <span style={{ fontSize: 14 }}>{field}</span>
                </Grid>
              ))}
            </Grid>
          ))}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleDisplayPrefClose}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* View User Dialog */}
      <Dialog open={viewDialogOpen} onClose={() => setViewDialogOpen(false)} maxWidth="lg" fullWidth>
        <DialogTitle>User Details</DialogTitle>
        <DialogContent dividers sx={{ maxHeight: '80vh', overflowY: 'auto', bgcolor: '#fafafa' }}>
          {selectedUser ? (
            <Box>
              {/* User Type Information */}
              <Paper sx={{ p: 2, mb: 3 }} elevation={1}>
                <Grid container spacing={2}>
                  <Grid item xs={12} md={8}>
                    <Typography variant="h6" sx={{ mb: 1, color: 'primary.main' }}>Account Type</Typography>
                    <Box display="flex" flexWrap="wrap" gap={2}>
                      {/* Only show account types that are selected */}
                      {[
                        { value: "is_user", label: "User" },
                        { value: "is_customer", label: "Customer" },
                        { value: "is_supplier", label: "Supplier" },
                        { value: "is_employee", label: "Employee" },
                        { value: "is_dealer", label: "Dealer" },
                        { value: "is_distributor", label: "Distributor" }
                      ].filter(type => selectedUser[type.value]).map(type => (
                        <Paper 
                          key={type.value} 
                          sx={{ 
                            px: 2, 
                            py: 1, 
                            bgcolor: 'primary.light',
                            color: 'white',
                            borderRadius: 2
                          }}
                        >
                          {type.label}
                        </Paper>
                      ))}
                      {/* Show message if no account types are selected */}
                      {!selectedUser.is_user && 
                       !selectedUser.is_customer && 
                       !selectedUser.is_supplier && 
                       !selectedUser.is_employee && 
                       !selectedUser.is_dealer && 
                       !selectedUser.is_distributor && (
                        <Typography color="text.secondary">No account types assigned</Typography>
                      )}
                    </Box>
                  </Grid>
                  <Grid item xs={12} md={4}>
                    <Box display="flex" justifyContent="flex-end" alignItems="center" height="100%">
                      <Paper 
                        sx={{ 
                          px: 3, 
                          py: 1, 
                          bgcolor: selectedUser.active ? 'success.light' : 'error.light',
                          color: 'white',
                          borderRadius: 2
                        }}
                      >
                        Status: {selectedUser.active ? "Active" : "Inactive"}
                      </Paper>
                    </Box>
                  </Grid>
                </Grid>
              </Paper>

              {/* Personal Information */}
              <Paper sx={{ p: 2, mb: 3 }} elevation={1}>
                <Typography variant="h6" sx={{ mb: 2, color: 'primary.main' }}>Personal Information</Typography>
                <Grid container spacing={2}>
                  <Grid item xs={12} md={2}>
                    <TextField
                      label="Salutation"
                      value={selectedUser.salutation || ""}
                      fullWidth
                      InputProps={{ readOnly: true }}
                      variant="outlined"
                      size="small"
                    />
                  </Grid>
                  <Grid item xs={12} md={5}>
                    <TextField
                      label="First Name"
                      value={selectedUser.firstname || ""}
                      fullWidth
                      InputProps={{ readOnly: true }}
                      variant="outlined"
                      size="small"
                    />
                  </Grid>
                  <Grid item xs={12} md={5}>
                    <TextField
                      label="Last Name"
                      value={selectedUser.lastname || ""}
                      fullWidth
                      InputProps={{ readOnly: true }}
                      variant="outlined"
                      size="small"
                    />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <TextField
                      label="Date of Birth"
                      value={selectedUser.dob ? new Date(selectedUser.dob).toLocaleDateString() : ""}
                      fullWidth
                      InputProps={{ readOnly: true }}
                      variant="outlined"
                      size="small"
                    />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <TextField
                      label="Gender"
                      value={selectedUser.gender || ""}
                      fullWidth
                      InputProps={{ readOnly: true }}
                      variant="outlined"
                      size="small"
                    />
                  </Grid>
                </Grid>
              </Paper>

              {/* Contact Information */}
              <Paper sx={{ p: 2, mb: 3 }} elevation={1}>
                <Typography variant="h6" sx={{ mb: 2, color: 'primary.main' }}>Contact Information</Typography>
                <Grid container spacing={2}>
                  <Grid item xs={12} md={3}>
                    <TextField
                      label="Country"
                      value={selectedUser.country || ""}
                      fullWidth
                      InputProps={{ readOnly: true }}
                      variant="outlined"
                      size="small"
                    />
                  </Grid>
                  <Grid item xs={12} md={3}>
                    <TextField
                      label="Country Code"
                      value={selectedUser.country_code || ""}
                      fullWidth
                      InputProps={{ readOnly: true }}
                      variant="outlined"
                      size="small"
                    />
                  </Grid>
                  <Grid item xs={12} md={3}>
                    <TextField
                      label="Mobile Number"
                      value={selectedUser.mobile_number || ""}
                      fullWidth
                      InputProps={{ readOnly: true }}
                      variant="outlined"
                      size="small"
                    />
                  </Grid>
                  <Grid item xs={12} md={3}>
                    <TextField
                      label="Emergency Number"
                      value={selectedUser.emergency_number || ""}
                      fullWidth
                      InputProps={{ readOnly: true }}
                      variant="outlined"
                      size="small"
                    />
                  </Grid>
                  <Grid item xs={12} md={3}>
                    <TextField
                      label="Alternate Number"
                      value={selectedUser.alternate_number || ""}
                      fullWidth
                      InputProps={{ readOnly: true }}
                      variant="outlined"
                      size="small"
                    />
                  </Grid>
                  <Grid item xs={12} md={3}>
                    <TextField
                      label="WhatsApp Number"
                      value={selectedUser.whatsapp_number || ""}
                      fullWidth
                      InputProps={{ readOnly: true }}
                      variant="outlined"
                      size="small"
                    />
                  </Grid>
                  <Grid item xs={12} md={3}>
                    <TextField
                      label="Email"
                      value={selectedUser.email || ""}
                      fullWidth
                      InputProps={{ readOnly: true }}
                      variant="outlined"
                      size="small"
                    />
                  </Grid>
                  <Grid item xs={12} md={3}>
                    <TextField
                      label="Website"
                      value={selectedUser.website || ""}
                      fullWidth
                      InputProps={{ readOnly: true }}
                      variant="outlined"
                      size="small"
                    />
                  </Grid>
                </Grid>
              </Paper>
              
              {/* Business Information (shown only if user is not a pure User) */}
              {(selectedUser.is_customer || selectedUser.is_supplier || selectedUser.is_employee || selectedUser.is_dealer || selectedUser.is_distributor) && (
                <Paper sx={{ p: 2, mb: 3 }} elevation={1}>
                  <Typography variant="h6" sx={{ mb: 2, color: 'primary.main' }}>Business Information</Typography>
                  <Grid container spacing={2}>
                    <Grid item xs={12} md={3}>
                      <TextField
                        label="Business Name"
                        value={selectedUser.business_name || ""}
                        fullWidth
                        InputProps={{ readOnly: true }}
                        variant="outlined"
                        size="small"
                      />
                    </Grid>
                    <Grid item xs={12} md={3}>
                      <TextField
                        label="Company Name"
                        value={selectedUser.companyname || ""}
                        fullWidth
                        InputProps={{ readOnly: true }}
                        variant="outlined"
                        size="small"
                      />
                    </Grid>
                    <Grid item xs={12} md={3}>
                      <TextField
                        label="Designation"
                        value={selectedUser.designation || ""}
                        fullWidth
                        InputProps={{ readOnly: true }}
                        variant="outlined"
                        size="small"
                      />
                    </Grid>
                    <Grid item xs={12} md={3}>
                      <TextField
                        label="Title"
                        value={selectedUser.title || ""}
                        fullWidth
                        InputProps={{ readOnly: true }}
                        variant="outlined"
                        size="small"
                      />
                    </Grid>
                    <Grid item xs={12} md={3}>
                      <TextField
                        label="Industry Segment"
                        value={selectedUser.industry_segment || ""}
                        fullWidth
                        InputProps={{ readOnly: true }}
                        variant="outlined"
                        size="small"
                      />
                    </Grid>
                  </Grid>
                </Paper>
              )}

              {/* Permanent Address */}
              <Paper sx={{ p: 2, mb: 3 }} elevation={1}>
                <Typography variant="h6" sx={{ mb: 2, color: 'primary.main' }}>Permanent Address</Typography>
                <Grid container spacing={2}>
                  {[1, 2, 3, 4, 5].map(n => (
                    <Grid item xs={12} md={4} key={`address${n}`}>
                      <TextField
                        label={`Address ${n}`}
                        value={selectedUser[`address${n}`] || ""}
                        fullWidth
                        InputProps={{ readOnly: true }}
                        variant="outlined"
                        size="small"
                      />
                    </Grid>
                  ))}
                  <Grid item xs={12} md={4}>
                    <TextField
                      label="State"
                      value={selectedUser.state || ""}
                      fullWidth
                      InputProps={{ readOnly: true }}
                      variant="outlined"
                      size="small"
                    />
                  </Grid>
                  <Grid item xs={12} md={4}>
                    <TextField
                      label="Country"
                      value={selectedUser.country || ""}
                      fullWidth
                      InputProps={{ readOnly: true }}
                      variant="outlined"
                      size="small"
                    />
                  </Grid>
                  <Grid item xs={12} md={4}>
                    <TextField
                      label="Pincode"
                      value={selectedUser.pincode || ""}
                      fullWidth
                      InputProps={{ readOnly: true }}
                      variant="outlined"
                      size="small"
                    />
                  </Grid>
                </Grid>
              </Paper>

              {/* Additional Addresses */}
              <Paper sx={{ p: 2, mb: 3 }} elevation={1}>
                <Typography variant="h6" sx={{ mb: 2, color: 'primary.main' }}>Additional Addresses</Typography>
                {Array.isArray(selectedUser.additional_addresses) && selectedUser.additional_addresses.length > 0 ? (
                  selectedUser.additional_addresses.map((addr, idx) => (
                    <Paper key={idx} elevation={0} sx={{ p: 2, mb: 2, border: '1px solid #e0e0e0', bgcolor: '#f5f5f5' }}>
                      <Typography variant="subtitle1" sx={{ mb: 1, color: 'primary.dark' }}>
                        Address {idx + 1}: {addr.address_name || ""}
                      </Typography>
                      <Grid container spacing={2}>
                        {/* Show only non-empty fields */}
                        {Object.entries(addr).filter(([key, value]) => 
                          key !== "keyValues" && value && typeof value === "string"
                        ).map(([key, value]) => (
                          <Grid item xs={12} md={4} key={key}>
                            <TextField
                              label={key.replace(/([A-Z])/g, ' $1').replace(/^./, function(str){ return str.toUpperCase(); })}
                              value={value}
                              fullWidth
                              InputProps={{ readOnly: true }}
                              variant="outlined"
                              size="small"
                            />
                          </Grid>
                        ))}
                        
                        {/* Key-Values section */}
                        {Array.isArray(addr.keyValues) && addr.keyValues.length > 0 && (
                          <Grid item xs={12}>
                            <Typography variant="subtitle2" sx={{ mt: 1, mb: 1 }}>Additional Information</Typography>
                            <Grid container spacing={1}>
                              {addr.keyValues.map((kv, kvIdx) => (
                                <Grid item xs={12} md={4} key={kvIdx}>
                                  <TextField
                                    label={kv.key}
                                    value={kv.value}
                                    fullWidth
                                    InputProps={{ readOnly: true }}
                                    variant="outlined"
                                    size="small"
                                  />
                                </Grid>
                              ))}
                            </Grid>
                          </Grid>
                        )}
                      </Grid>
                    </Paper>
                  ))
                ) : Array.isArray(selectedUser.Addresses) && selectedUser.Addresses.length > 0 ? (
                  selectedUser.Addresses.map((addrStr, idx) => {
                    let addr;
                    try { addr = JSON.parse(addrStr); } catch { addr = {}; }
                    return (
                      <Paper key={idx} elevation={0} sx={{ p: 2, mb: 2, border: '1px solid #e0e0e0', bgcolor: '#f5f5f5' }}>
                        <Typography variant="subtitle1" sx={{ mb: 1, color: 'primary.dark' }}>
                          Address {idx + 1}: {addr.address_name || ""}
                        </Typography>
                        <Grid container spacing={2}>
                          {/* Show only non-empty fields */}
                          {Object.entries(addr).filter(([key, value]) => 
                            key !== "keyValues" && value && typeof value === "string"
                          ).map(([key, value]) => (
                            <Grid item xs={12} md={4} key={key}>
                              <TextField
                                label={key.replace(/([A-Z])/g, ' $1').replace(/^./, function(str){ return str.toUpperCase(); })}
                                value={value}
                                fullWidth
                                InputProps={{ readOnly: true }}
                                variant="outlined"
                                size="small"
                              />
                            </Grid>
                          ))}
                          
                          {/* Key-Values section */}
                          {Array.isArray(addr.keyValues) && addr.keyValues.length > 0 && (
                            <Grid item xs={12}>
                              <Typography variant="subtitle2" sx={{ mt: 1, mb: 1 }}>Additional Information</Typography>
                              <Grid container spacing={1}>
                                {addr.keyValues.map((kv, kvIdx) => (
                                  <Grid item xs={12} md={4} key={kvIdx}>
                                    <TextField
                                      label={kv.key}
                                      value={kv.value}
                                      fullWidth
                                      InputProps={{ readOnly: true }}
                                      variant="outlined"
                                      size="small"
                                    />
                                  </Grid>
                                ))}
                              </Grid>
                            </Grid>
                          )}
                        </Grid>
                      </Paper>
                    );
                  })
                ) : (
                  <Typography color="text.secondary">No additional addresses</Typography>
                )}
              </Paper>

              {/* Legal Information */}
              <Paper sx={{ p: 2, mb: 3 }} elevation={1}>
                <Typography variant="h6" sx={{ mb: 2, color: 'primary.main' }}>Legal Information</Typography>
                <Grid container spacing={2}>
                  <Grid item xs={12} md={3}>
                    <TextField
                      label="Aadhar Number"
                      value={selectedUser.aadhar_number || ""}
                      fullWidth
                      InputProps={{ readOnly: true }}
                      variant="outlined"
                      size="small"
                    />
                  </Grid>
                  <Grid item xs={12} md={3}>
                    <TextField
                      label="PAN Number"
                      value={selectedUser.pan_number || ""}
                      fullWidth
                      InputProps={{ readOnly: true }}
                      variant="outlined"
                      size="small"
                    />
                  </Grid>
                  <Grid item xs={12} md={3}>
                    <TextField
                      label="GSTIN"
                      value={selectedUser.gstin || ""}
                      fullWidth
                      InputProps={{ readOnly: true }}
                      variant="outlined"
                      size="small"
                    />
                  </Grid>
                  <Grid item xs={12} md={3}>
                    <TextField
                      label="MSME No"
                      value={selectedUser.msme_no || ""}
                      fullWidth
                      InputProps={{ readOnly: true }}
                      variant="outlined"
                      size="small"
                    />
                  </Grid>
                </Grid>
              </Paper>

              {/* Bank Information */}
              <Paper sx={{ p: 2, mb: 3 }} elevation={1}>
                <Typography variant="h6" sx={{ mb: 2, color: 'primary.main' }}>Bank Information</Typography>
                <Grid container spacing={2}>
                  <Grid item xs={12} md={4}>
                    <TextField
                      label="Bank Name"
                      value={selectedUser.bank_name || ""}
                      fullWidth
                      InputProps={{ readOnly: true }}
                      variant="outlined"
                      size="small"
                    />
                  </Grid>
                  <Grid item xs={12} md={4}>
                    <TextField
                      label="Branch Name"
                      value={selectedUser.branch_name || ""}
                      fullWidth
                      InputProps={{ readOnly: true }}
                      variant="outlined"
                      size="small"
                    />
                  </Grid>
                  <Grid item xs={12} md={4}>
                    <TextField
                      label="Branch Address"
                      value={selectedUser.branch_address || ""}
                      fullWidth
                      InputProps={{ readOnly: true }}
                      variant="outlined"
                      size="small"
                    />
                  </Grid>
                  <Grid item xs={12} md={4}>
                    <TextField
                      label="Account Number"
                      value={selectedUser.account_number || ""}
                      fullWidth
                      InputProps={{ readOnly: true }}
                      variant="outlined"
                      size="small"
                    />
                  </Grid>
                  <Grid item xs={12} md={4}>
                    <TextField
                      label="IFSC Code"
                      value={selectedUser.ifsc_code || ""}
                      fullWidth
                      InputProps={{ readOnly: true }}
                      variant="outlined"
                      size="small"
                    />
                  </Grid>
                </Grid>
              </Paper>

              {/* Additional Bank Info */}
              <Paper sx={{ p: 2, mb: 3 }} elevation={1}>
                <Typography variant="h6" sx={{ mb: 2, color: 'primary.main' }}>Additional Bank Information</Typography>
                {Array.isArray(selectedUser.AdditionalBankInfos) && selectedUser.AdditionalBankInfos.length > 0 ? (
                  selectedUser.AdditionalBankInfos.map((biStr, idx) => {
                    let bi;
                    try { bi = typeof biStr === "string" ? JSON.parse(biStr) : biStr; } catch { bi = {}; }
                    return (
                      <Paper key={idx} elevation={0} sx={{ p: 2, mb: 2, border: '1px solid #e0e0e0', bgcolor: '#f5f5f5' }}>
                        <Typography variant="subtitle1" sx={{ mb: 1, color: 'primary.dark' }}>
                          Bank Info {idx + 1}
                        </Typography>
                        <Grid container spacing={2}>
                          {/* Show only non-empty fields */}
                          {Object.entries(bi).filter(([key, value]) => 
                            key !== "keyValues" && value && typeof value === "string"
                          ).map(([key, value]) => (
                            <Grid item xs={12} md={4} key={key}>
                              <TextField
                                label={key.replace(/([A-Z])/g, ' $1').replace(/^./, function(str){ return str.toUpperCase(); })}
                                value={value}
                                fullWidth
                                InputProps={{ readOnly: true }}
                                variant="outlined"
                                size="small"
                              />
                            </Grid>
                          ))}
                          
                          {/* Key-Values section */}
                          {Array.isArray(bi.keyValues) && bi.keyValues.length > 0 && (
                            <Grid item xs={12}>
                              <Typography variant="subtitle2" sx={{ mt: 1, mb: 1 }}>Additional Information</Typography>
                              <Grid container spacing={1}>
                                {bi.keyValues.map((kv, kvIdx) => (
                                  <Grid item xs={12} md={4} key={kvIdx}>
                                    <TextField
                                      label={kv.key}
                                      value={kv.value}
                                      fullWidth
                                      InputProps={{ readOnly: true }}
                                      variant="outlined"
                                      size="small"
                                    />
                                  </Grid>
                                ))}
                              </Grid>
                            </Grid>
                          )}
                        </Grid>
                      </Paper>
                    );
                  })
                ) : (
                  <Typography color="text.secondary">No additional bank information</Typography>
                )}
              </Paper>

              {/* Authentication Information */}
              <Paper sx={{ p: 2, mb: 3 }} elevation={1}>
                <Typography variant="h6" sx={{ mb: 2, color: 'primary.main' }}>Authentication</Typography>
                <Grid container spacing={2}>
                  <Grid item xs={12} md={6}>
                    <TextField
                      label="Username"
                      value={selectedUser.username || ""}
                      fullWidth
                      InputProps={{ readOnly: true }}
                      variant="outlined"
                      size="small"
                    />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <TextField
                      label="Role ID"
                      value={selectedUser.role_id || ""}
                      fullWidth
                      InputProps={{ readOnly: true }}
                      variant="outlined"
                      size="small"
                    />
                  </Grid>
                </Grid>
              </Paper>
            </Box>
          ) : (
            <Typography>No user selected.</Typography>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setViewDialogOpen(false)} variant="contained" color="primary">Close</Button>
          <Button 
            variant="outlined" 
            color="primary" 
            onClick={() => {
              setViewDialogOpen(false);
              navigate(`/users/${selectedUser.id}/edit`);
            }}
          >
            Edit User
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}