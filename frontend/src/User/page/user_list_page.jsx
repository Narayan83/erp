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
import { Edit, Visibility, Search, TableView, WhatsApp, Mail } from "@mui/icons-material";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { BASE_URL } from "../../Config";

export default function UserListPage() {
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [filters, setFilters] = useState({ name: "" });
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
    "RoleID"
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

  // Debounced search effect for filters.name
  useEffect(() => {
    const handler = setTimeout(() => {
      setPage(0);
      fetchUsers();
    }, 300);
    return () => clearTimeout(handler);
  }, [filters.name]);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${BASE_URL}/api/users`, {
        params: {
          page: page + 1,
          limit,
          filter: filters.name,
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
           
           {/* SELECT EXECUTIVE DROPDOWN */}

          <Box flex={0.5}>
            <FormControl fullWidth size="small">
              <InputLabel id="demo-simple-select-label">Select Executive</InputLabel>
              <Select
                labelId="demo-simple-select-label"
                id="demo-simple-select"
                value={filters.roleID}
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
                  {userFields.filter(field => checkedFields.includes(field)).map((field) => (
                    <TableCell key={field} sx={{ fontWeight: "bold" }}>{field}</TableCell>
                  ))}
                  {checkedFields.length > 0 && (
                    <TableCell sx={{ fontWeight: "bold" }} align="center">Actions</TableCell>
                  )}
                </TableRow>
              </TableHead>
              <TableBody>
                {users.map((user) => (
                  <TableRow key={user.id}>
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
                          : ""
                        }
                      </TableCell>
                    ))}
                    {checkedFields.length > 0 && (
                      <TableCell align="center" sx={{ whiteSpace: 'nowrap' }}>
                        <Tooltip title="View"><IconButton onClick={() => navigate(`/users/${user.id}`)}><Visibility /></IconButton></Tooltip>
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
          {Array.from({ length: 8 }).map((_, rowIdx) => (
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
    </Box>
  );
}
