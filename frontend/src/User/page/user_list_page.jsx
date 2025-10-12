// UserListPage.jsx
import React, { useEffect, useState, useCallback, memo, useRef } from "react";
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
  Popover,
  Autocomplete,
  Divider,
} from "@mui/material";
import { Edit, Visibility, Search, TableView, WhatsApp, Mail, FileUpload, FileDownload, GetApp, Publish } from "@mui/icons-material";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { debounce } from "lodash";
import { BASE_URL } from "../../Config";
import * as XLSX from 'xlsx';
import EnhancedEditableCell from "../../Products/ProductManage/Components/EnhancedEditableCell";

// Simple editable cell component for user import
const SimpleEditableCell = ({ value, rowIndex, columnKey, onUpdate }) => {
  const [editing, setEditing] = useState(false);
  const [editValue, setEditValue] = useState(value);

  useEffect(() => {
    setEditValue(value);
  }, [value]);

  const handleSave = () => {
    onUpdate(rowIndex, columnKey, editValue);
    setEditing(false);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      handleSave();
    } else if (e.key === 'Escape') {
      setEditValue(value);
      setEditing(false);
    }
  };

  return (
    <TableCell 
      onClick={() => !editing && setEditing(true)}
      sx={{ 
        cursor: !editing ? 'pointer' : 'default',
        padding: editing ? '4px' : undefined,
        '&:hover': !editing ? { 
          backgroundColor: 'rgba(0, 0, 0, 0.04)',
        } : {}
      }}
    >
      {editing ? (
        <TextField
          autoFocus
          fullWidth
          size="small"
          variant="outlined"
          value={editValue || ""}
          onChange={(e) => setEditValue(e.target.value)}
          onKeyDown={handleKeyDown}
          onBlur={handleSave}
          sx={{ margin: '-8px 0' }}
        />
      ) : (
        value
      )}
    </TableCell>
  );
};

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
    "User Code",
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
  "City",
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

  // Import functionality state
  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const [importFile, setImportFile] = useState(null);
  const [importLoading, setImportLoading] = useState(false);
  const [importedData, setImportedData] = useState([]);
  const [importPreviewOpen, setImportPreviewOpen] = useState(false);
  const [importSelectedRows, setImportSelectedRows] = useState(new Set());
  const [importReportOpen, setImportReportOpen] = useState(false);
  const [importReport, setImportReport] = useState(null);

  const handleToggleSelectAll = (e) => {
    const checked = e.target.checked;
    if (checked) setSelectedIds(users.map(u => u.id));
    else setSelectedIds([]);
  };

  const handleToggleSelect = (id) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  };

  // Download template CSV for user import
  const downloadTemplateCSV = () => {
    // Define headers for user import template with required fields marked
    const headersArr = [
      'User Code *', 'Salutation', 'First Name *', 'Last Name *', 'DOB', 'Gender', 
      'Country Code', 'Mobile Number *', 'Emergency Number', 'Alternate Number', 
      'Whatsapp Number', 'Email *', 'Website', 'Business Name', 'Title', 
      'Company Name', 'Designation', 'Industry Segment', 'Address1', 'Address2', 
      'Address3', 'City', 'State', 'Country', 'Pincode', 'Aadhar Number', 
      'PAN Number', 'GSTIN', 'MSME No', 'Bank Name', 'Branch Name', 
      'Branch Address', 'Account Number', 'IFSC Code', 'Active *', 'IsUser', 
      'IsCustomer', 'IsSupplier', 'IsEmployee', 'IsDealer', 'IsDistributor', 'Role ID'
    ];
    
    // Join headers for CSV
    const headers = headersArr.join(',');
    
    // Create template data row with example values
    const exampleRow = [
      'USR001', 'Mr', 'John', 'Doe', '1990-01-15', 'Male',
      '+91', '9876543210', '9876543211', '9876543212',
      '9876543210', 'john.doe@example.com', 'www.example.com', 'ABC Corp', 'Manager',
      'XYZ Company', 'Senior Manager', 'IT', '123 Main St', 'Apt 4B',
      'Near Park', 'Mumbai', 'Maharashtra', 'India', '400001', '123456789012',
      'ABCDE1234F', '27ABCDE1234F1Z5', 'MSME12345', 'HDFC Bank', 'Andheri Branch',
      'Andheri West, Mumbai', '1234567890', 'HDFC0001234', 'Active', 'true',
      'false', 'false', 'true', 'false', 'false', '1'
    ].join(',');
    
    // Combine headers and example row
    const csvContent = `${headers}\n${exampleRow}`;
    
    // Create blob and download link
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', 'user_import_template.csv');
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Handle CSV import
  const handleImport = async () => {
    if (!importFile) {
      alert('Please select a file to import.');
      return;
    }

    setImportLoading(true);
    try {
      // Read the CSV file
      const reader = new FileReader();
      reader.onload = async (e) => {
        try {
          const csvText = e.target.result;
          console.log('Raw CSV data:', csvText);

          if (!csvText.trim()) {
            alert('The CSV file appears to be empty.');
            setImportLoading(false);
            return;
          }

          // Parse CSV
          let lines = csvText.split('\n').filter(line => line.trim());
          if (lines.length === 0) {
            alert('The CSV file appears to be empty.');
            setImportLoading(false);
            return;
          }

          // Handle different line endings
          if (lines.length === 1 && lines[0].includes('\r')) {
            lines = csvText.split('\r').filter(line => line.trim());
          }

          // Parse headers
          const delimiter = lines[0].includes(';') ? ';' : ',';
          const headers = lines[0].split(delimiter).map(h => h.trim().replace(/^"|"$/g, '').replace(/""/g, '"'));
          const dataRows = lines.slice(1);

          console.log('Headers:', headers);
          console.log('Data rows:', dataRows.length);

          // Validate required headers
          const headersNormalized = headers.map(h => String(h).toLowerCase().replace(/[^a-z0-9]/g, ''));
          const requiredNormalized = ['usercode', 'firstname', 'lastname', 'mobilenumber', 'email', 'active'];
          const missingNormalized = requiredNormalized.filter(r => !headersNormalized.includes(r));

          if (missingNormalized.length > 0) {
            const missingHuman = missingNormalized.map(m => m.charAt(0).toUpperCase() + m.slice(1).replace(/([A-Z])/g, ' $1').trim());
            alert(`Missing required headers: ${missingHuman.join(', ')}. Please check your CSV file format.`);
            setImportLoading(false);
            return;
          }

          const objectData = dataRows.map(row => {
            let values = [];
            let inQuote = false;
            let currentValue = '';
            
            if (delimiter === ';') {
              values = row.split(delimiter).map(v => v.trim().replace(/^"|"$/g, '').replace(/""/g, '"'));
            } else {
              for (let i = 0; i < row.length; i++) {
                const char = row[i];
                
                if (char === '"' && (i === 0 || row[i-1] !== '\\')) {
                  inQuote = !inQuote;
                } else if (char === delimiter && !inQuote) {
                  values.push(currentValue.trim().replace(/^"|"$/g, '').replace(/""/g, '"'));
                  currentValue = '';
                } else {
                  currentValue += char;
                }
              }
              values.push(currentValue.trim().replace(/^"|"$/g, '').replace(/""/g, '"'));
            }
            
            const obj = {};
            headers.forEach((header, index) => {
              obj[header] = values[index] || '';
            });
            return obj;
          });

          console.log('Converted object data:', objectData);

          if (objectData.length === 0) {
            alert('The CSV file has headers but no data rows.');
            setImportLoading(false);
            return;
          }

          // Store the parsed data, select all rows by default, and open the preview dialog
          setImportedData(objectData);
          const allIdx = new Set(objectData.map((_, i) => i));
          setImportSelectedRows(allIdx);
          setImportDialogOpen(false);
          setImportPreviewOpen(true);
          setImportLoading(false);
        } catch (error) {
          console.error('Error importing users:', error);
          alert(`Failed to import users: ${error.message}`);
          setImportLoading(false);
        }
      };

      reader.readAsText(importFile);
    } catch (error) {
      console.error('Error reading file:', error);
      alert('Failed to read the selected file.');
      setImportLoading(false);
    }
  };

  // Validate import data
  const validateImportData = (data) => {
    const errors = [];
    const requiredFields = ['User Code', 'First Name', 'Last Name', 'Mobile Number', 'Email', 'Active'];
    
    data.forEach((row, index) => {
      const rowErrors = [];
      
      const getFieldValue = (fieldName) => {
        if (row[fieldName] !== undefined) return row[fieldName];
        if (row[`${fieldName} *`] !== undefined) return row[`${fieldName} *`];
        const normalizedField = fieldName.toLowerCase().replace(/\s+/g, '').replace(/\*/g, '');
        for (const key in row) {
          const normalizedKey = key.toLowerCase().replace(/\s+/g, '').replace(/\*/g, '');
          if (normalizedKey === normalizedField) {
            return row[key];
          }
        }
        return undefined;
      };
      
      // Check required fields
      requiredFields.forEach(field => {
        const value = getFieldValue(field);
        if (!value || value.toString().trim() === '') {
          rowErrors.push(`${field} is mandatory and cannot be empty`);
        }
      });

      // Validate email format
      const emailValue = getFieldValue('Email');
      if (emailValue && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailValue)) {
        rowErrors.push('Email must be in valid format');
      }

      // Validate mobile number (should be digits)
      const mobileValue = getFieldValue('Mobile Number');
      if (mobileValue && !/^\d{10}$/.test(mobileValue.replace(/\D/g, ''))) {
        rowErrors.push('Mobile Number must be a valid 10-digit number');
      }

      // Validate Active field
      const activeValue = getFieldValue('Active');
      if (activeValue && !['Active', 'Inactive', 'true', 'false'].includes(activeValue)) {
        rowErrors.push('Active must be "Active", "Inactive", "true", or "false"');
      }

      // Validate boolean fields
      const booleanFields = ['IsUser', 'IsCustomer', 'IsSupplier', 'IsEmployee', 'IsDealer', 'IsDistributor'];
      booleanFields.forEach(field => {
        const value = getFieldValue(field);
        if (value && value.toString().trim() !== '' && !['true', 'false', 'yes', 'no', '1', '0'].includes(value.toLowerCase())) {
          rowErrors.push(`${field} must be "true", "false", "yes", "no", "1", or "0"`);
        }
      });

      if (rowErrors.length > 0) {
        errors.push({
          row: index + 1,
          data: row,
          errors: rowErrors
        });
      }
    });
    
    return errors;
  };

  // Handle final import
  const handleFinalImport = async () => {
    setImportLoading(true);
    try {
      const selectedArray = importedData.filter((_, idx) => importSelectedRows.has(idx));
      if (selectedArray.length === 0) {
        alert('No rows selected for import. Please select at least one row.');
        setImportLoading(false);
        return;
      }

      // Validate data before sending
      const validationErrors = validateImportData(selectedArray);
      if (validationErrors.length > 0) {
        setImportReport({
          type: 'validation_error',
          totalRows: selectedArray.length,
          successCount: 0,
          errorCount: validationErrors.length,
          errors: validationErrors,
          successes: []
        });
        setImportReportOpen(true);
        setImportLoading(false);
        return;
      }

      // Normalize field names
      const normalizedArray = selectedArray.map(row => {
        const normalizedRow = {};
        Object.keys(row).forEach(key => {
          const normalizedKey = key.replace(/\s*\*\s*/g, '').trim();
          normalizedRow[normalizedKey] = row[key];
        });
        return normalizedRow;
      });

      console.log('Sending import data:', normalizedArray);

      const response = await axios.post(`${BASE_URL}/api/users/import`, normalizedArray, {
        headers: {
          'Content-Type': 'application/json',
        },
      });

      console.log('Import response:', response.data);

      // Parse backend errors
      const parsedErrors = [];
      if (response.data.errors && Array.isArray(response.data.errors)) {
        response.data.errors.forEach(errorStr => {
          const match = errorStr.match(/^Row (\d+):\s*(.+)$/);
          if (match) {
            const rowNum = parseInt(match[1], 10);
            const errorMessage = match[2];
            const rowIndex = rowNum - 1;
            const rowData = normalizedArray[rowIndex] || {};
            
            parsedErrors.push({
              row: rowNum,
              data: rowData,
              userName: rowData['First Name'] + ' ' + rowData['Last Name'] || 'N/A',
              userCode: rowData['User Code'] || 'N/A',
              errors: [errorMessage]
            });
          } else {
            parsedErrors.push({
              row: 'N/A',
              data: {},
              userName: 'N/A',
              userCode: 'N/A',
              errors: [errorStr]
            });
          }
        });
      }

      // Prepare import report
      const report = {
        type: 'import_complete',
        totalRows: selectedArray.length,
        successCount: response.data.imported || 0,
        errorCount: parsedErrors.length,
        errors: parsedErrors,
        successes: response.data.successes || [],
        skipped: response.data.skipped || 0
      };

      setImportPreviewOpen(false);

      if (parsedErrors.length === 0) {
        setImportFile(null);
        setImportedData([]);
        setImportSelectedRows(new Set());
      }

      setImportReport(report);
      setImportReportOpen(true);

      if (response.data.imported > 0) {
        setPage(0);
        setFilters({ name: "", roleID: '', deptHead: '', userType: '' });
        setTimeout(() => {
          fetchUsers();
        }, 300);
      }
    } catch (error) {
      console.error('Error importing users:', error);
      
      let errorMessage = 'Unknown server error';
      let detailedErrors = [];
      
      if (error.response?.data) {
        if (error.response.data.error) {
          errorMessage = error.response.data.error;
        } else if (error.response.data.message) {
          errorMessage = error.response.data.message;
        }
        
        if (error.response.data.errors && Array.isArray(error.response.data.errors)) {
          error.response.data.errors.forEach(errorStr => {
            const match = errorStr.match(/^Row (\d+):\s*(.+)$/);
            if (match) {
              const rowNum = parseInt(match[1], 10);
              const errorDetails = match[2];
              detailedErrors.push({
                row: rowNum,
                userName: 'N/A',
                userCode: 'N/A',
                errors: [errorDetails]
              });
            } else {
              detailedErrors.push({
                row: 'N/A',
                userName: 'N/A',
                userCode: 'N/A',
                errors: [errorStr]
              });
            }
          });
        }
      } else if (error.message) {
        errorMessage = error.message;
      }

      setImportReport({
        type: 'import_failed',
        totalRows: importedData.filter((_, idx) => importSelectedRows.has(idx)).length,
        successCount: 0,
        errorCount: detailedErrors.length > 0 ? detailedErrors.length : 1,
        errors: detailedErrors.length > 0 ? detailedErrors : [{ 
          row: 'Server Error',
          userName: 'N/A',
          userCode: 'N/A',
          errors: [errorMessage]
        }],
        successes: []
      });
      setImportReportOpen(true);
    } finally {
      setImportLoading(false);
    }
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
            <IconButton sx={{ mx: 2 }} aria-label="import" onClick={() => setImportDialogOpen(true)}>
              <GetApp />
            </IconButton>
          </Tooltip>
          <Tooltip title="Export">
            <IconButton sx={{ mx: 2 }} aria-label="export" onClick={() => {
              // Export only selected users if any are selected; otherwise export current page users
              const exportSource = selectedIds.length > 0 ? users.filter(u => selectedIds.includes(u.id)) : users;
              const data = exportSource.map(user => {
                const obj = {};
                checkedFields.forEach(field => {
                  obj[field] = field === "User Code"
                    ? (user.usercode || user.username || "")
                    : field === "Name"
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
                    : field === "City"
                    ? user.city
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
                        {field === "User Code"
                          ? (user.usercode || user.username || "")
                          : field === "Name"
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
                          : field === "City"
                          ? user.city
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
                            onClick={async () => {
                              setViewDialogOpen(true);
                              try {
                                const res = await axios.get(`${BASE_URL}/api/users/${user.id}`);
                                setSelectedUser(res.data);
                              } catch (err) {
                                console.error('Failed to fetch user details, falling back to list item:', err);
                                setSelectedUser(user);
                              }
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
                  {[1, 2, 3].map(n => (
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
                      label="City"
                      value={selectedUser.city || selectedUser.City || ""}
                      fullWidth
                      InputProps={{ readOnly: true }}
                      variant="outlined"
                      size="small"
                    />
                  </Grid>
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
                  {/* Show User Code after Authentication fields */}
                  <Grid item xs={12} md={6}>
                    <TextField
                      label="User Code"
                      value={selectedUser.usercode || ""}
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

      {/* Import Dialog */}
      <Dialog 
        open={importDialogOpen} 
        onClose={() => {
          setImportDialogOpen(false);
          setImportFile(null);
          setImportLoading(false);
        }} 
        maxWidth="md" 
        fullWidth
      >
        <DialogTitle>Import Users</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
            Import users from a CSV file. Make sure you have downloaded the template and filled it correctly.
          </Typography>
          <Box sx={{ mb: 2, p: 2, bgcolor: 'info.lighter', borderRadius: 1 }}>
            <Typography variant="body2" sx={{ mb: 1 }}>
              <strong>Instructions:</strong>
            </Typography>
            <Typography variant="body2" component="ul" sx={{ pl: 2, mb: 0 }}>
              <li>Download the template CSV file below</li>
              <li>Fill in your user data following the template format</li>
              <li>Required fields are marked with asterisk (*)</li>
              <li>Active field should be "Active" or "Inactive"</li>
              <li>Boolean fields (IsUser, IsCustomer, etc.) should be "true" or "false"</li>
              <li>Upload the completed CSV file</li>
            </Typography>
          </Box>
          <Box sx={{ mb: 2 }}>
            <Button 
              variant="outlined" 
              color="primary" 
              onClick={downloadTemplateCSV}
              startIcon={<FileDownload />}
            >
              Download Template CSV
            </Button>
          </Box>
          <input
            type="file"
            accept=".csv"
            onChange={(e) => setImportFile(e.target.files[0])}
            style={{ marginBottom: '16px' }}
          />
          {importFile && (
            <Typography variant="body2" sx={{ mb: 2 }}>
              Selected file: <strong>{importFile.name}</strong>
            </Typography>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setImportDialogOpen(false)}>Cancel</Button>
          <Button
            variant="contained"
            color="primary"
            onClick={handleImport}
            disabled={!importFile || importLoading}
          >
            {importLoading ? <CircularProgress size={20} /> : 'Upload & Preview'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Import Preview Dialog */}
      <Dialog 
        open={importPreviewOpen} 
        onClose={(event, reason) => {
          if (reason === 'backdropClick' || reason === 'escapeKeyDown') {
            return;
          }
          setImportPreviewOpen(false);
        }}
        maxWidth="xl" 
        fullWidth
      >
        <DialogTitle>
          <Box display="flex" justifyContent="space-between" alignItems="center">
            <Typography variant="h6">Preview and Edit Import Data</Typography>
            <Typography variant="subtitle2" color="textSecondary">
              {importedData.length} records to import
            </Typography>
          </Box>
        </DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
            Review and edit the data before finalizing the import. Click on any cell to edit directly in the table.
          </Typography>
          
          <TableContainer component={Paper} sx={{ maxHeight: 600 }}>
            <Table stickyHeader size="small">
              <TableHead>
                <TableRow>
                  <TableCell sx={{ width: 60 }}>
                    <Checkbox
                      size="small"
                      checked={importedData.length > 0 && importSelectedRows.size === importedData.length}
                      indeterminate={importSelectedRows.size > 0 && importSelectedRows.size < importedData.length}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setImportSelectedRows(new Set(importedData.map((_, i) => i)));
                        } else {
                          setImportSelectedRows(new Set());
                        }
                      }}
                    />
                  </TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>No.</TableCell>
                  {importedData.length > 0 && Object.keys(importedData[0]).map((header) => {
                    const cleanHeader = String(header).replace(/\s*\*\s*$/g, '');
                    const normalizedHeader = cleanHeader.toLowerCase();
                    const requiredFields = ['user code', 'first name', 'last name', 'mobile number', 'email', 'active'];
                    const isRequired = requiredFields.includes(normalizedHeader);
                    const displayHeader = isRequired ? `${cleanHeader} *` : cleanHeader;
                    
                    return (
                      <TableCell key={header} sx={{ fontWeight: 'bold' }}>
                        {displayHeader}
                      </TableCell>
                    );
                  })}
                </TableRow>
              </TableHead>
              <TableBody>
                {importedData.map((row, rowIndex) => (
                  <TableRow key={rowIndex} hover>
                    <TableCell>
                      <Checkbox
                        size="small"
                        checked={importSelectedRows.has(rowIndex)}
                        onChange={(e) => {
                          setImportSelectedRows(prev => {
                            const s = new Set(prev);
                            if (e.target.checked) s.add(rowIndex); else s.delete(rowIndex);
                            return s;
                          });
                        }}
                      />
                    </TableCell>
                    <TableCell>{rowIndex + 1}</TableCell>
                    {Object.keys(row).map((key, cellIndex) => (
                      <SimpleEditableCell
                        key={`${rowIndex}-${cellIndex}`}
                        value={row[key]}
                        rowIndex={rowIndex}
                        columnKey={key}
                        onUpdate={(rowIdx, colKey, newValue) => {
                          const updatedData = [...importedData];
                          updatedData[rowIdx] = { ...updatedData[rowIdx], [colKey]: newValue };
                          setImportedData(updatedData);
                        }}
                      />
                    ))}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </DialogContent>
        <DialogActions>
          <Button 
            onClick={() => {
              setImportPreviewOpen(false);
              setImportedData([]);
            }}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            color="primary"
            onClick={handleFinalImport}
            disabled={importLoading}
          >
            {importLoading ? <CircularProgress size={20} /> : 'Finalize Import'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Import Report Dialog */}
      <Dialog 
        open={importReportOpen} 
        onClose={() => setImportReportOpen(false)} 
        maxWidth="md" 
        fullWidth
      >
        <DialogTitle>
          <Box display="flex" justifyContent="space-between" alignItems="center">
            <Typography variant="h6">
              {importReport?.type === 'validation_error' ? 'Validation Errors' : 
               importReport?.type === 'import_failed' ? 'Import Failed' : 'Import Report'}
            </Typography>
            <Box display="flex" gap={2}>
              {importReport?.type === 'import_complete' && (
                <>
                  <Typography variant="body2" color="success.main">
                    ✓ {importReport.successCount} Imported
                  </Typography>
                  {importReport.errorCount > 0 && (
                    <Typography variant="body2" color="error.main">
                      ✗ {importReport.errorCount} Errors
                    </Typography>
                  )}
                  {importReport.skipped > 0 && (
                    <Typography variant="body2" color="warning.main">
                      ⚠ {importReport.skipped} Skipped
                    </Typography>
                  )}
                </>
              )}
            </Box>
          </Box>
        </DialogTitle>
        <DialogContent>
          {importReport && (
            <Box>
              {/* Summary */}
              <Box sx={{ mb: 3, p: 2, bgcolor: 'background.paper', borderRadius: 1, border: '1px solid', borderColor: 'divider' }}>
                <Typography variant="subtitle2" gutterBottom>Summary</Typography>
                <Grid container spacing={2}>
                  <Grid item xs={3}>
                    <Typography variant="body2" color="textSecondary">Total Rows:</Typography>
                    <Typography variant="h6">{importReport.totalRows}</Typography>
                  </Grid>
                  <Grid item xs={3}>
                    <Typography variant="body2" color="success.main">Successful:</Typography>
                    <Typography variant="h6" color="success.main">{importReport.successCount}</Typography>
                  </Grid>
                  <Grid item xs={3}>
                    <Typography variant="body2" color="error.main">Errors:</Typography>
                    <Typography variant="h6" color="error.main">{importReport.errorCount}</Typography>
                  </Grid>
                  {importReport.skipped > 0 && (
                    <Grid item xs={3}>
                      <Typography variant="body2" color="warning.main">Skipped:</Typography>
                      <Typography variant="h6" color="warning.main">{importReport.skipped}</Typography>
                    </Grid>
                  )}
                </Grid>
              </Box>

              {/* Errors Section */}
              {importReport.errors && importReport.errors.length > 0 && (
                <Box sx={{ mb: 3 }}>
                  <Typography variant="subtitle2" color="error.main" gutterBottom>
                    Errors ({importReport.errors.length})
                  </Typography>
                  <TableContainer component={Paper} sx={{ maxHeight: 300 }}>
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell sx={{ fontWeight: 'bold' }}>Row</TableCell>
                          <TableCell sx={{ fontWeight: 'bold' }}>User Name</TableCell>
                          <TableCell sx={{ fontWeight: 'bold' }}>User Code</TableCell>
                          <TableCell sx={{ fontWeight: 'bold' }}>Error Details</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {importReport.errors.map((error, index) => (
                          <TableRow key={index}>
                            <TableCell>{error.row || 'N/A'}</TableCell>
                            <TableCell>{error.userName || error.data?.['First Name'] + ' ' + error.data?.['Last Name'] || 'N/A'}</TableCell>
                            <TableCell>{error.userCode || error.data?.['User Code'] || 'N/A'}</TableCell>
                            <TableCell>
                              <Box>
                                {Array.isArray(error.errors) ? error.errors.map((err, i) => (
                                  <Typography 
                                    key={i} 
                                    variant="body2" 
                                    color="error.main"
                                    sx={{ mb: 0.5 }}
                                  >
                                    • {err}
                                  </Typography>
                                )) : (
                                  <Typography variant="body2" color="error.main">
                                    {error.errors || 'Unknown error'}
                                  </Typography>
                                )}
                              </Box>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </Box>
              )}

              {/* Success Message */}
              {importReport.successCount > 0 && (
                <Box sx={{ p: 2, bgcolor: 'success.lighter', borderRadius: 1 }}>
                  <Typography variant="body2" color="success.main">
                    ✓ Successfully imported {importReport.successCount} user{importReport.successCount > 1 ? 's' : ''}
                  </Typography>
                </Box>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button 
            onClick={() => {
              setImportReportOpen(false);
              if (importReport?.successCount > 0) {
                fetchUsers();
              }
            }} 
            variant="contained" 
            color="primary"
          >
            Close
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}