import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Typography, 
  Paper, 
  Table, 
  TableBody, 
  TableCell, 
  TableContainer, 
  TableHead, 
  TableRow,
  TablePagination,
  IconButton,
  TextField,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Grid,
  FormControlLabel,
  Checkbox,
  Tooltip,
  CircularProgress
} from '@mui/material';
import { Settings as SettingsIcon } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { BASE_URL } from "../../config/Config";

export default function Address() {
  const navigate = useNavigate();
  const [addresses, setAddresses] = useState([]);
  const [filters, setFilters] = useState({ title: "" });
  const [page, setPage] = useState(0);
  const [limit, setRowsPerPage] = useState(10);
  const [totalItems, setTotalItems] = useState(0);
  const [loading, setLoading] = useState(false);
  
  // Display Preferences dialog state
  const [displayPrefOpen, setDisplayPrefOpen] = useState(false);
  
  // Address fields from Addresses.go (ID hidden, not included in list)
  const addressFields = [
    // User fields placed at the top
    "User Code",
    "Name",
    "AddressTitle",
    "AddressType",
    "AddressLine1",
    "AddressLine2",
    "AddressLine3",
    "AddressLine4",
    "City",
    "District",
    "State",
    "Country",
    "Pincode"
  ];
  
  // Helper to ensure 'id' columns are never shown (filter different casings)
  const sanitizeFields = (fields) => {
    if (!Array.isArray(fields)) return [];
    const forbidden = new Set(['id', 'ID', 'Id']);
    return fields.filter(f => !forbidden.has(String(f).trim()));
  };

  const [checkedFields, setCheckedFields] = useState(() => {
    const saved = localStorage.getItem('addressDisplayPrefs');
    // Default shows first 7 fields including User Code and Name
    const defaults = addressFields.slice(0, 7);
    const initial = saved ? JSON.parse(saved) : defaults;
    return sanitizeFields(initial);
  });

  const handleDisplayPrefOpen = () => setDisplayPrefOpen(true);
  const handleDisplayPrefClose = () => setDisplayPrefOpen(false);

  // Save checkedFields to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('addressDisplayPrefs', JSON.stringify(checkedFields));
  }, [checkedFields]);
  
  const handleFieldToggle = (field) => {
    setCheckedFields(prev => {
      if (prev.includes(field)) {
        return prev.filter(f => f !== field);
      } else {
        return [...prev, field];
      }
    });
  };

  // Helper: format country and country_code together
  const formatCountryWithCode = (country, country_code) => {
    const getNameAndCode = (c, cc) => {
      let name = '';
      let code = '';
      if (c && typeof c === 'object') {
        name = c.name || c.country || c.label || c.title || '';
        code = c.code || c.dial_code || c.dialCode || c.country_code || c.phone_code || '';
      } else if (typeof c === 'string') {
        if (/^\+/.test(c) || /^\d+$/.test(c)) code = c;
        else name = c;
      }
      if (cc && typeof cc === 'object') {
        code = code || cc.code || cc.dial_code || cc.dialCode || cc.country_code || cc.phone_code || '';
        name = name || cc.name || cc.country || cc.label || '';
      } else if (typeof cc === 'string') {
        if (!code) {
          if (/^\+/.test(cc) || /^\d+$/.test(cc)) code = cc;
          else name = name || cc;
        } else {
          name = name || cc;
        }
      }
      return { name, code };
    };
    const { name, code } = getNameAndCode(country, country_code);
    
    const codeStr = code ? String(code).trim() : '';
    const codeFormatted = codeStr ? (codeStr.startsWith('+') ? codeStr : ('+' + codeStr.replace(/^\+/, ''))) : '';
    
    if (name && codeFormatted) return `${name} ${codeFormatted}`;
    if (name) return name;
    if (codeFormatted) return codeFormatted;
    return '';
  };

  // Helper to read a value for a given field name from the address object.
  // This is updated to work with our modified data structure that comes from user data
  const getFieldValue = (address, field) => {
    if (!address) return '';
    
    // Special handling for User Code field
    if (field === "User Code") {
      // First try from our user object
      const userObj = address.user || address.User;
      
      if (userObj) {
        return userObj.code || '';
      }
      
      // Try from original user data
      const originalUser = address.originalUser;
      if (originalUser) {
        return originalUser.UserCode || originalUser.Usercode || originalUser.usercode || '';
      }
      
      // Fallback to direct address properties
      return address.usercode || address.Usercode || address.user_code || '';
    }
    
    // Special handling for Name field
    if (field === "Name") {
      const userObj = address.user || address.User;
      if (userObj) {
        const firstName = userObj.firstname || '';
        const lastName = userObj.lastname || '';
        return [firstName, lastName].filter(Boolean).join(" ");
      }
      
      // Try from original user data
      const originalUser = address.originalUser;
      if (originalUser) {
        const firstName = originalUser.FirstName || originalUser.Firstname || originalUser.firstname || '';
        const lastName = originalUser.LastName || originalUser.Lastname || originalUser.lastname || '';
        return [firstName, lastName].filter(Boolean).join(" ");
      }
      
      return address.name || address.AddressTitle || '';
    }
    
    // Special handling for Country field to show country + code
    if (field === "Country") {
      const country = address.Country || address.country || '';
      const countryCode = address.CountryCode || address.country_code || address.countrycode || '';
      return formatCountryWithCode(country, countryCode);
    }
    
    // For non-user fields, try direct lookup
    const attempts = [];
    attempts.push(field);
    attempts.push(field.toLowerCase());
    attempts.push(field.toLowerCase().replace(/\s+/g, ''));
    attempts.push(field.toLowerCase().replace(/\s+/g, '_'));
    attempts.push(field.replace(/\s+/g, ''));
    attempts.push(field.replace(/\s+/g, '_'));

    for (const k of attempts) {
      if (k in address && address[k] !== undefined && address[k] !== null) return address[k];
    }

    return '';
  };

  // Toggle select all/none for display preferences
  const handleSelectAllFields = (checked) => {
    if (checked) {
      setCheckedFields(sanitizeFields([...addressFields]));
    } else {
      setCheckedFields([]);
    }
  };

  useEffect(() => {
    fetchAddresses();
  }, [page, limit]);

  // Debounced search effect for title filter
  useEffect(() => {
    const handler = setTimeout(() => {
      if (page === 0) fetchAddresses();
      else setPage(0);
    }, 500);
    
    return () => clearTimeout(handler);
  }, [filters.title]);

  // Get user addresses from users endpoint
  const [apiEndpoint, setApiEndpoint] = useState(`${BASE_URL}/api/users`);
  const [errorMessage, setErrorMessage] = useState('');
  
  const fetchAddresses = async () => {
    setLoading(true);
    setErrorMessage('');
    try {
      console.log("Fetching users with addresses from:", apiEndpoint);
      
      // Fetch from users endpoint to get all users
      const res = await axios.get(apiEndpoint, {
        params: {
          page: page + 1,
          limit: 100, // Get more users to filter from
          filter: filters.title,
        },
      });
      console.log("API Response:", res);
      
      // Extract users data
      let usersData = [];
      if (res.data && res.data.data) {
        usersData = res.data.data;
      } else if (Array.isArray(res.data)) {
        usersData = res.data;
      } else if (typeof res.data === 'object') {
        usersData = res.data.users || res.data.items || [];
      }
      
      console.log("Users data:", usersData);
      
      // Extract only users with address information
      const addressData = [];
      
      usersData.forEach(user => {
        // Check if user has address information
        const hasAddress = user && (
          (user.address1 || user.Address1) ||
          (user.address2 || user.Address2) ||
          (user.address3 || user.Address3) ||
          (user.city || user.City)
        );
        
        if (hasAddress) {
          // Create address entry from user data
          const addressEntry = {
            // User information
            user: {
              id: user.ID || user.id,
              code: user.UserCode || user.Usercode || user.usercode || '',
              firstname: user.FirstName || user.Firstname || user.firstname || '',
              lastname: user.LastName || user.Lastname || user.lastname || ''
            },
            // Address information from user object
            AddressTitle: "Primary Address",
            AddressType: "User Address",
            AddressLine1: user.address1 || user.Address1 || '',
            AddressLine2: user.address2 || user.Address2 || '',
            AddressLine3: user.address3 || user.Address3 || '',
            City: user.city || user.City || '',
            District: user.district || user.District || '',
            State: user.state || user.State || '',
            Country: user.country || user.Country || '',
            CountryCode: user.country_code || user.CountryCode || user.countrycode || '',
            Pincode: user.pincode || user.Pincode || '',
            // Include the original user object for reference
            originalUser: user
          };
          
          addressData.push(addressEntry);
          
          // If the filter is applied, check if the address matches
          if (filters.title && !Object.values(addressEntry).some(val => 
            typeof val === 'string' && val.toLowerCase().includes(filters.title.toLowerCase())
          )) {
            return; // Skip this address if it doesn't match the filter
          }
        }
      });
      
      console.log("Processed address data:", addressData);
      
      // Set the addresses data
      setAddresses(addressData);
      
      // Update total items count
      setTotalItems(addressData.length);
      console.log("Total items set to:", addressData.length);
    } catch (err) {
      console.error("Error fetching users with addresses:", err);
      setErrorMessage(`Failed to load users with addresses: ${err.message}`);
      setAddresses([]);
      setTotalItems(0);
    } finally {
      setLoading(false);
    }
  };
  
  const handleSearch = () => {
    setPage(0);
    fetchAddresses();
  };

  // Selection removed: no row checkboxes

  // Helper to produce a stable unique key for each row for our user-derived addresses
  const getRowKey = (address, index) => {
    // First try to get user ID from our constructed user object
    const userObj = address && (address.user || address.User);
    const userId = userObj && userObj.id;
    
    if (userId) {
      return `user-${userId}`;
    }
    
    // Try from original user data
    const originalUser = address && address.originalUser;
    if (originalUser && (originalUser.ID || originalUser.id)) {
      return `user-${originalUser.ID || originalUser.id}`;
    }
    
    // Create a composite key based on user code and address details
    const userCode = userObj ? userObj.code : '';
    
    if (userCode) {
      return `user-code-${userCode}`;
    }
    
    // As a last resort, use the index
    return `row-${index}`;
  };
  // selection handlers removed
  
  // Action handlers removed because actions column is hidden

  return (
    <Box mt={6} p={3}>
      <Grid container justifyContent="space-between" alignItems="center" mb={2}>
        <Grid item>
          <Typography variant="h5">User Addresses</Typography>
        </Grid>
      </Grid>

      <Paper sx={{ p: 2, mb: 3 }}>
        {/* Filters */}
        <Grid container spacing={2} alignItems="center" mb={2}>
          <Grid item xs={12} sm={4}>
            <TextField
              label="Search by User Name or Address"
              variant="outlined"
              size="small"
              fullWidth
              value={filters.title}
              onChange={(e) => setFilters({ ...filters, title: e.target.value })}
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
            />
          </Grid>
          <Grid item xs={12} sm={8} container justifyContent="flex-end" spacing={1}>
            <Grid item>
              <Tooltip title="Display Preferences">
                <IconButton onClick={handleDisplayPrefOpen}>
                  <SettingsIcon />
                </IconButton>
              </Tooltip>
            </Grid>
          </Grid>
        </Grid>

        {/* Table */}
        <TableContainer component={Paper} elevation={0}>
          <Table sx={{ minWidth: 650 }} size="small">
            <TableHead>
              <TableRow>
                  <TableCell>Sl No.</TableCell>
                {checkedFields.map((field) => (
                  <TableCell key={field}>{field}</TableCell>
                ))}
                {/* Actions column removed intentionally */}
              </TableRow>
            </TableHead>
            <TableBody>
                {loading ? (
                <TableRow>
                  <TableCell colSpan={checkedFields.length + 1} align="center">
                    <CircularProgress size={24} />
                  </TableCell>
                </TableRow>
              ) : addresses.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={checkedFields.length + 1} align="center">
                    No addresses found.
                  </TableCell>
                </TableRow>
              ) : (
                addresses.map((address, index) => (
                  <TableRow
                    key={getRowKey(address, index)}
                    hover
                  >
                    <TableCell>{page * limit + index + 1}</TableCell>
                    {checkedFields.map((field) => (
                      <TableCell key={field}>
                        {getFieldValue(address, field) || ''}
                      </TableCell>
                    ))}
                    {/* Action buttons removed */}
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
        
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
        />
      </Paper>
      
      {/* Display Preferences Dialog */}
      <Dialog open={displayPrefOpen} onClose={handleDisplayPrefClose}>
        <DialogTitle>Display Preferences</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 1 }}>
            <FormControlLabel
              control={
                <Checkbox
                  indeterminate={checkedFields.length > 0 && checkedFields.length < addressFields.length}
                  checked={checkedFields.length === addressFields.length}
                  onChange={(e) => handleSelectAllFields(e.target.checked)}
                />
              }
              label="Select All"
            />

            {addressFields.map((field) => (
              <FormControlLabel
                key={field}
                control={
                  <Checkbox
                    checked={checkedFields.includes(field)}
                    onChange={() => handleFieldToggle(field)}
                  />
                }
                label={field}
              />
            ))}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleDisplayPrefClose}>Close</Button>
        </DialogActions>
      </Dialog>
      
      {/* View dialog removed alongside action buttons */}
    </Box>
  );
}