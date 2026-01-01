// EmployeeListPage.jsx
import React, { useState, useEffect, useCallback, memo, useRef } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Button,
  TextField,
  Box,
  Typography,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Snackbar,
  Alert,
  TablePagination,
  Chip,
  InputAdornment,
  Tooltip,
  Checkbox,
  CircularProgress,
  Grid,
  Avatar,
} from "@mui/material";
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import ListItemText from '@mui/material/ListItemText';
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  Visibility as VisibilityIcon,
  VisibilityOff as VisibilityOffIcon,
  Search as SearchIcon,
  Add as AddIcon,
  TableView,
  FileUpload,
  Clear as ClearIcon,
  OpenInNew as OpenInNewIcon,
  Download as DownloadIcon,
  GetApp,
} from "@mui/icons-material";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { BASE_URL } from "../../config/Config";
import countries from "../../User/utils/countries.js";
import citiesList from "../../User/utils/cities-name-list.json";
import stateListData from "../../User/utils/state_list.json";
import * as XLSX from 'xlsx';
import ExcelJS from 'exceljs';
import "./employee_list_page.scss";

// Build import-friendly country strings from countries data
const IMPORT_COUNTRY_OPTIONS = Array.isArray(countries)
  ? countries.map(c => `${c.name} (${c.code})`)
  : [];

// Indian states list - extract values from state_list.json
const IMPORT_STATE_OPTIONS = stateListData && typeof stateListData === 'object' 
  ? Object.values(stateListData)
  : [];

// Simple editable cell component for employee import preview
const SimpleEditableCell = ({ value, rowIndex, columnKey, onUpdate, error = false, errorMessages = [], cellSx = {} }) => {
  const [editing, setEditing] = useState(false);
  const [editValue, setEditValue] = useState(value);

  useEffect(() => {
    setEditValue(value);
  }, [value]);

  const getDropdownOptions = (key) => {
    const cleanKey = String(key).replace(/\s*\*\s*$/g, '');
    const normalizedKey = cleanKey.toLowerCase().replace(/[^a-z0-9]/g, '');
    if (normalizedKey === 'salutation') return { options: ['Mr','Mrs','Ms','Miss','Dr','Prof','Mx'], multiple: false };
    if (normalizedKey === 'gender') return { options: ['Male','Female','Other','Prefer not to say'], multiple: false };
    if (normalizedKey === 'active') return { options: ['Yes','No'], multiple: false };
    if (normalizedKey.includes('country')) return { options: IMPORT_COUNTRY_OPTIONS, multiple: false };
    if (normalizedKey === 'city') return { options: citiesList, multiple: false };
    if (normalizedKey === 'state') return { options: IMPORT_STATE_OPTIONS, multiple: false };
    return null;
  };

  const optsObj = getDropdownOptions(columnKey);
  const options = optsObj ? optsObj.options : null;
  const isMultiple = optsObj ? optsObj.multiple : false;

  const baseSx = {
    cursor: !editing ? 'pointer' : 'default',
    padding: editing ? '4px' : undefined,
    borderLeft: error ? '4px solid rgba(244,67,54,0.6)' : undefined,
    backgroundColor: error ? 'rgba(255,235,238,0.6)' : undefined,
    '&:hover': !editing ? { backgroundColor: error ? 'rgba(255, 205, 210, 0.6)' : 'rgba(0, 0, 0, 0.04)' } : {}
  };

  const handleSave = () => {
    onUpdate(rowIndex, columnKey, editValue);
    setEditing(false);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') handleSave();
    else if (e.key === 'Escape') { setEditValue(value); setEditing(false); }
  };

  return (
    <TableCell onClick={() => !editing && setEditing(true)} sx={{ ...baseSx, ...cellSx }}>
      {editing ? (
        options ? (
          <Select
            autoFocus
            fullWidth
            size="small"
            value={editValue || ""}
            onChange={(e) => setEditValue(e.target.value)}
            onBlur={() => { onUpdate(rowIndex, columnKey, editValue); setEditing(false); }}
            sx={{ margin: '-8px 0' }}
          >
            {options.map((opt) => (
              <MenuItem key={opt} value={opt}>
                {opt}
              </MenuItem>
            ))}
          </Select>
        ) : (
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
        )
      ) : (
        String(value || '')
      )}
    </TableCell>
  );
};


export default function EmployeeListPage() {
  const navigate = useNavigate();
  const [employees, setEmployees] = useState([]);
  const [filters, setFilters] = useState({ search: "" });
  const [page, setPage] = useState(0);
  const [limit, setLimit] = useState(10);
  const [totalItems, setTotalItems] = useState(0);
  const [loading, setLoading] = useState(false);

  // Display Preferences dialog state
  const [displayPrefOpen, setDisplayPrefOpen] = useState(false);
  // Employee struct fields
  const employeeFields = [
    "Photo",
    "Employee Code",
    "Name",
    "DOB",
    "Gender",
    "Country",
    "MobileNumber",
    "Email",
    "Aadhaar",
    "PAN",
    "Address 1",
    "Address 2",
    "Address 3",
    "City",
    "State",
    "Add. Country",
    "Pincode",
    "Bank Info",
    "Documents",
    "Status",
  ];
  // Helper to provide sensible min-widths per column
  const getMinWidth = (field) => {
    switch (field) {
      case 'Photo':
        return 80;
      case 'Employee Code':
        return 150;
      case 'Name':
        return 200;
      case 'DOB':
        return 120;
      case 'Gender':
        return 100;
      case 'Country':
        return 160;
      case 'MobileNumber':
        return 140;
      case 'Email':
        return 220;
      case 'Aadhaar':
        return 150;
      case 'PAN':
        return 120;
      case 'Address 1':
        return 150;
      case 'Address 2':
        return 150;
      case 'Address 3':
        return 150;
      case 'City':
        return 120;
      case 'State':
        return 120;
      case 'Add. Country':
        return 120;
      case 'Pincode':
        return 100;
      case 'Bank Info':
        return 260;
      case 'Documents':
        return 300;
      case 'Status':
        return 120;
      case 'Actions':
        return 180;
      default:
        return 150;
    }
  };
  const [checkedFields, setCheckedFields] = useState(() => {
    const stored = localStorage.getItem('employeeListCheckedFields');
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        // Preserve the canonical order from employeeFields while keeping only known fields
        const ordered = employeeFields.filter((f) => parsed.includes(f));
        return ordered.length > 0 ? ordered : employeeFields;
      } catch (e) {
        return employeeFields;
      }
    }
    return employeeFields;
  });

  // Delete confirmation state
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
  const [employeeToDelete, setEmployeeToDelete] = useState(null);

  // Snackbar state
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");
  const [snackbarSeverity, setSnackbarSeverity] = useState("info");

  // View dialog state
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [showPassword, setShowPassword] = useState(false);

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

  // Map of rowIndex -> { columnKey: [error messages] }
  const [importFieldErrors, setImportFieldErrors] = useState({});

  const handleDisplayPrefOpen = () => setDisplayPrefOpen(true);
  const handleDisplayPrefClose = () => setDisplayPrefOpen(false);

  // Save checkedFields to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('employeeListCheckedFields', JSON.stringify(checkedFields));
  }, [checkedFields]);
  const handleFieldToggle = (field) => {
    setCheckedFields((prev) => {
      let updated;
      if (prev.includes(field)) {
        updated = prev.filter((f) => f !== field);
      } else {
        const added = new Set(prev);
        added.add(field);
        // Preserve the canonical order defined in employeeFields
        updated = employeeFields.filter((f) => added.has(f));
      }
      localStorage.setItem('employeeListCheckedFields', JSON.stringify(updated));
      return updated;
    });
  };

  // If user unselects all display preferences, still show a minimum set of columns
  const displayedFields = (checkedFields && checkedFields.length > 0) ? checkedFields : ['Name'];
  // If user has explicitly unselected all fields (checkedFields.length === 0),
  // we still show a minimal column set for readability. Actions remain visible.

  useEffect(() => {
    fetchEmployees();
  }, [page, limit]);

  // Debounced search effect
  useEffect(() => {
    const handler = setTimeout(() => {
      setPage(0);
      fetchEmployees();
    }, 300);
    return () => clearTimeout(handler);
  }, [filters.search]);

  const fetchEmployees = async () => {
    setLoading(true);
    try {
      const params = {
        page: page + 1,
        limit,
        search: filters.search,
      };
      const response = await axios.get(`${BASE_URL}/api/employees`, { params });
      const employeesPayload = response.data.employees || response.data;
      const safeEmployees = Array.isArray(employeesPayload) ? employeesPayload : [];
      setEmployees(safeEmployees);
      setTotalItems(response.data.total || safeEmployees.length);
    } catch (error) {
      console.error("Error fetching employees:", error);
      showSnackbar("Error fetching employees", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleToggleSelectAll = (e) => {
    const checked = e.target.checked;
    if (checked) setSelectedIds(employees.map(emp => emp.id));
    else setSelectedIds([]);
  };

  const handleToggleSelect = (id) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  };

  // Export functionality
  const handleExport = async () => {
    setLoading(true);
    try {
      const exportSource = selectedIds.length > 0 ? employees.filter(emp => selectedIds.includes(emp.id)) : employees;

      const data = exportSource.map(employee => {
        const obj = {};
        checkedFields.forEach(field => {
          obj[field] = getExportValue(employee, field);
        });
        return obj;
      });

      const ws = XLSX.utils.json_to_sheet(data);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Employees');
      XLSX.writeFile(wb, `employees_export${selectedIds.length > 0 ? '_selected' : ''}.xlsx`);
    } catch (err) {
      console.error('Export failed', err);
      showSnackbar('Export failed', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Download template Excel for employee import
  const downloadTemplateCSV = async () => {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Employee Import Template');

    // New header order requested by user (includes Employee Code)
    const headersArr = [
      'Employee Code',
      'Salutation *',
      'First Name *',
      'Last Name',
      'Date of Birth',
      'Gender *',
      'Country *',
      'Mobile Number *',
      'Email *',
      'Aadhaar',
      'PAN',
      'Address 1',
      'Address 2',
      'Address 3',
      'City',
      'State',
      'Add. Country',
      'Pincode',
      'Bank Name',
      'Branch Name',
      'Branch Address',
      'Account Number',
      'IFSC Code',
      'Active *'
    ];

    // Add headers
    worksheet.addRow(headersArr);

    // Example row using the new order
    const exampleRowArr = [
      'EMP001',
      'Mr',
      'John',
      'Doe',
      '1990-01-15',
      'Male',
      'India (+91)',
      '9876543210',
      'john.doe@example.com',
      '123456789012',
      'ABCDE1234F',
      '123 Main St',
      'Suite 4B',
      '',
      'Mumbai',
      'Maharashtra',
      'India',
      '400001',
      'Example Bank',
      'Main Branch',
      '1 Bank Plaza',
      '1234567890',
      'IFSC0001234',
      'Yes'
    ];

    worksheet.addRow(exampleRowArr);

    // Add 10 empty rows for user input
    for (let i = 0; i < 10; i++) {
      worksheet.addRow(new Array(headersArr.length).fill(''));
    }

    // Create a hidden sheet to host list values
    const listsSheet = workbook.addWorksheet('Lists');

    const salutations = ['Mr','Mrs','Ms','Miss','Dr','Prof','Mx'];
    const genders = ['Male','Female','Other','Prefer not to say'];
    const activeOptions = ['Yes','No'];

    // Countries (name and code). Keep a combined "Name (Code)" list for the Country column and a separate name list.
    const countryWithCode = countries.map(c => `${c.name} (${c.code})`);
    const countryNames = countries.map(c => c.name);

    // Indian states list
    const stateList = ['Andaman and Nicobar','Andhra Pradesh','Arunachal Pradesh','Assam','Bihar','Chandigarh','Chhattisgarh','Dādra and Nagar Haveli and Damān and Diu','Delhi','Goa','Gujarat','Himachal Pradesh','Haryana','Jharkhand','Jammu and Kashmir','Karnataka','Kerala','Ladakh','Lakshadweep','Maharashtra','Meghalaya','Manipur','Madhya Pradesh','Mizoram','Nagaland','Orissa','Punjab','Puducherry','Rajasthan','Sikkim','Telangana','Tamil Nadu','Tripura','Uttar Pradesh','Uttaranchal','West Bengal'];

    // Cities list (full list)
    const cities = citiesList;

    // Write lists into the Lists sheet: columns A..G
    // A: salutations, B: genders, C: active, D: countryWithCode, E: countryNames, F: stateList, G: cities
    const lists = [salutations, genders, activeOptions, countryWithCode, countryNames, stateList, cities];
    lists.forEach((arr, colIdx) => {
      for (let i = 0; i < arr.length; i++) {
        listsSheet.getCell(i + 1, colIdx + 1).value = arr[i];
      }
    });

    // Hide the Lists sheet
    listsSheet.state = 'veryHidden';

    // Apply data validation for select columns:
    // Columns (1-based): 2=Salutation, 6=Gender, 7=Country(Name+Code), 15=City, 16=State, 17=Country(Name), 24=Active
    const validationMap = {
      2: { sheetCol: 'A', length: salutations.length }, // Salutation
      6: { sheetCol: 'B', length: genders.length }, // Gender
      7: { sheetCol: 'D', length: countryWithCode.length }, // Country (Name + Code)
      15: { sheetCol: 'G', length: cities.length }, // City
      16: { sheetCol: 'F', length: stateList.length }, // State
      17: { sheetCol: 'E', length: countryNames.length }, // Country (name)
      24: { sheetCol: 'C', length: activeOptions.length } // Active
    };

    Object.keys(validationMap).forEach(targetColStr => {
      const targetCol = parseInt(targetColStr, 10);
      const { sheetCol, length } = validationMap[targetCol];
      const rangeRef = `=Lists!$${sheetCol}$1:$${sheetCol}$${length}`;
      worksheet.getColumn(targetCol).eachCell((cell, rowNumber) => {
        if (rowNumber > 1) {
          cell.dataValidation = {
            type: 'list',
            allowBlank: true,
            showInputMessage: true,
            formulae: [rangeRef]
          };
        }
      });
    });

    // Generate buffer and trigger download
    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', 'employee_import_template.xlsx');
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Handle Excel import
  const handleImport = async () => {
    if (!importFile) {
      alert('Please select a file to import.');
      return;
    }

    setImportLoading(true);
    try {
      const reader = new FileReader();
      reader.onload = async (e) => {
        try {
          const name = (importFile && importFile.name) ? importFile.name.toLowerCase() : '';
          // If CSV, parse as text
          if (name.endsWith('.csv')) {
            const text = e.target.result;

            const parseLine = (line) => {
              const fields = [];
              let field = '';
              let inQuotes = false;
              for (let i = 0; i < line.length; i++) {
                const ch = line[i];
                if (inQuotes) {
                  if (ch === '"') {
                    if (line[i + 1] === '"') { field += '"'; i++; } else { inQuotes = false; }
                  } else {
                    field += ch;
                  }
                } else {
                  if (ch === '"') { inQuotes = true; }
                  else if (ch === ',') { fields.push(field); field = ''; }
                  else { field += ch; }
                }
              }
              fields.push(field);
              return fields;
            };

            const lines = String(text).split(/\r?\n/).filter(l => l.trim() !== '');
            if (lines.length === 0) {
              alert('No valid data found in the file.');
              setImportLoading(false);
              return;
            }
            const headers = parseLine(lines[0]).map(h => String(h || '').replace(/\s*\*\s*$/g, '').trim());
            const rows = [];
            for (let i = 1; i < lines.length; i++) {
              const cols = parseLine(lines[i]);
              // Skip completely empty rows
              if (cols.every(c => String(c || '').trim() === '')) continue;
              const obj = {};
              for (let j = 0; j < headers.length; j++) {
                obj[headers[j]] = cols[j] !== undefined ? cols[j] : '';
              }
              rows.push(obj);
            }

            const filteredData = rows.filter(row => Object.values(row).some(v => String(v || '').trim() !== ''));
            if (filteredData.length === 0) {
              alert('No valid data found in the file.');
              setImportLoading(false);
              return;
            }

            setImportedData(filteredData);
            setImportSelectedRows(new Set(filteredData.map((_, i) => i)));
            setImportDialogOpen(false);
            setImportPreviewOpen(true);
            setImportLoading(false);
            return;
          }

          // Else try Excel parsing
          const data = new Uint8Array(e.target.result);
          const workbook = new ExcelJS.Workbook();
          await workbook.xlsx.load(data);

          const worksheet = workbook.getWorksheet(1);
          const rows = [];

          worksheet.eachRow((row, rowNumber) => {
            if (rowNumber > 1) { // Skip header
              const rowData = {};
              row.eachCell((cell, colNumber) => {
                const headerRaw = worksheet.getCell(1, colNumber).value;
                  const header = String(headerRaw || '').replace(/\s*\*\s*$/g, '').trim();
                  rowData[header] = cell.value;
              });
              rows.push(rowData);
            }
          });

          // Filter out empty rows
          const filteredData = rows.filter(row => 
            Object.values(row).some(value => value && String(value).trim() !== '')
          );

          if (filteredData.length === 0) {
            alert('No valid data found in the file.');
            setImportLoading(false);
            return;
          }

          setImportedData(filteredData);
          setImportSelectedRows(new Set(filteredData.map((_, i) => i)));
          setImportDialogOpen(false);
          setImportPreviewOpen(true);
          setImportLoading(false);
        } catch (error) {
          console.error('Error parsing file:', error);
          alert('Failed to parse the file. Please ensure it\'s a valid Excel or CSV file.');
          setImportLoading(false);
        }
      };

      // Read as text for CSV, array buffer for Excel. We'll attempt text first to support CSV directly.
      const name = (importFile && importFile.name) ? importFile.name.toLowerCase() : '';
      if (name.endsWith('.csv')) reader.readAsText(importFile);
      else reader.readAsArrayBuffer(importFile);
    } catch (error) {
      console.error('Error reading file:', error);
      alert('Failed to read the selected file.');
      setImportLoading(false);
    }
  };

  // Validate import data
  const validateImportData = (data) => {
    const errors = [];
    data.forEach((row, index) => {
      const rowErrors = {};

      // Required fields validation (match new header names)
      if (!row['First Name'] || String(row['First Name']).trim() === '') {
        rowErrors['First Name'] = ['First name is required'];
      }
      if (!row['Mobile Number'] || String(row['Mobile Number']).trim() === '') {
        rowErrors['Mobile Number'] = ['Mobile number is required'];
      }
      if (!row['Email'] || String(row['Email']).trim() === '') {
        rowErrors['Email'] = ['Email is required'];
      }
      if (!row['Gender'] || String(row['Gender']).trim() === '') {
        rowErrors['Gender'] = ['Gender is required'];
      }
      if (!row['Active'] || String(row['Active']).trim() === '') {
        rowErrors['Active'] = ['Active status is required'];
      }

      if (Object.keys(rowErrors).length > 0) {
        errors.push({ rowIndex: index, errors: rowErrors });
      }
    });
    return errors;
  };

  // Handle final import
  const handleFinalImport = async () => {
    const selectedData = importedData.filter((_, index) => importSelectedRows.has(index));
    
    if (selectedData.length === 0) {
      alert('Please select at least one row to import.');
      return;
    }

    // Run client-side validation before attempting server import
    const validationErrors = validateImportData(selectedData);
    if (validationErrors.length > 0) {
      // Highlight cells in preview
      setImportFieldErrors(buildFieldErrorMapFromErrors(validationErrors, selectedData));

      // Build report format similar to user import
      const reportErrors = validationErrors.map(({ rowIndex, errors }) => {
        const msgs = [];
        Object.entries(errors).forEach(([col, arr]) => {
          if (Array.isArray(arr)) msgs.push(...arr);
          else msgs.push(String(arr));
        });
        const idx = rowIndex;
        return {
          row: idx + 1,
          employeeName: selectedData[idx]?.['Name'] || (selectedData[idx]?.['First Name'] ? (String(selectedData[idx]['First Name'] || '') + ' ' + String(selectedData[idx]['Last Name'] || '')) : 'N/A'),
          employeeCode: selectedData[idx]?.['Employee Code'] || 'N/A',
          errors: msgs,
          data: selectedData[idx]
        };
      });

      setImportReport({
        type: 'validation_error',
        totalRows: selectedData.length,
        successCount: 0,
        errorCount: validationErrors.length,
        skipped: 0,
        errors: reportErrors
      });

      setImportReportOpen(true);
      // keep preview open for editing
      setImportLoading(false);
      return;
    }

      // Check for duplicate emails or mobile numbers within the selected rows
      const emailMap = {};
      const mobileMap = {};
      const duplicateErrors = [];
      selectedData.forEach((row, idx) => {
        const email = String(row['Email'] || '').trim().toLowerCase();
        const mobile = String(row['Mobile Number'] || '').trim();
        if (email) {
          if (emailMap[email] !== undefined) {
            duplicateErrors.push({ rowIndex: idx, errors: { 'Email': ['Duplicate email in selected rows'] } });
          } else {
            emailMap[email] = idx;
          }
        }
        if (mobile) {
          if (mobileMap[mobile] !== undefined) {
            duplicateErrors.push({ rowIndex: idx, errors: { 'Mobile Number': ['Duplicate mobile number in selected rows'] } });
          } else {
            mobileMap[mobile] = idx;
          }
        }
      });

      if (duplicateErrors.length > 0) {
        setImportFieldErrors(buildFieldErrorMapFromErrors(duplicateErrors, selectedData));
        const reportErrors = duplicateErrors.map(({ rowIndex, errors }) => {
          const msgs = [];
          Object.entries(errors).forEach(([col, arr]) => {
            if (Array.isArray(arr)) msgs.push(...arr);
            else msgs.push(String(arr));
          });
          return {
            row: rowIndex + 1,
            employeeName: selectedData[rowIndex]?.['Name'] || (selectedData[rowIndex]?.['First Name'] ? (String(selectedData[rowIndex]['First Name'] || '') + ' ' + String(selectedData[rowIndex]['Last Name'] || '')) : 'N/A'),
            employeeCode: selectedData[rowIndex]?.['Employee Code'] || 'N/A',
            errors: msgs,
            data: selectedData[rowIndex]
          };
        });

        setImportReport({
          type: 'validation_error',
          totalRows: selectedData.length,
          successCount: 0,
          errorCount: duplicateErrors.length,
          skipped: 0,
          errors: reportErrors
        });
        setImportReportOpen(true);
        setImportLoading(false);
        return;
      }

    setImportLoading(true);
    try {
      const importPromises = selectedData.map(async (employee) => {
        // Parse combined country field if provided e.g. "India (+91)"
        const countryCombined = employee['Country'] || '';
        let country_name = '';
        let country_code = '';
        if (countryCombined && String(countryCombined).includes('(')) {
          const m = String(countryCombined).match(/^\s*(.*?)\s*\(([^)]+)\)\s*$/);
          if (m) {
            country_name = m[1] || '';
            country_code = m[2] || '';
          } else {
            country_name = String(countryCombined);
          }
        } else {
          country_name = countryCombined || employee['Country'] || '';
        }

        const addresses = [];
        const hasAnyAddress = (employee['Address 1'] || employee['Address 2'] || employee['Address 3'] || employee['City'] || employee['State'] || employee['Country'] || employee['Pincode']);
        if (hasAnyAddress) {
          addresses.push({
            address1: employee['Address 1'] || '',
            address2: employee['Address 2'] || '',
            address3: employee['Address 3'] || '',
            city: employee['City'] || '',
            state: employee['State'] || '',
            country: employee['Country'] || country_name || '',
            pincode: employee['Pincode'] || ''
          });
        }

        const bank_accounts = [];
        if (employee['Bank Name'] || employee['Account Number']) {
          bank_accounts.push({
            bank_name: employee['Bank Name'] || '',
            branch_name: employee['Branch Name'] || '',
            branch_address: employee['Branch Address'] || '',
            account_number: employee['Account Number'] || '',
            ifsc_code: employee['IFSC Code'] || ''
          });
        }

        const employeeData = {
          salutation: employee['Salutation'] || null,
          firstname: employee['First Name'],
          lastname: employee['Last Name'] || '',
          dob: parseDateToIso(employee['Date of Birth']),
          gender: employee['Gender'],
          country: country_name || null,
          country_code: country_code || null,
          mobile_number: employee['Mobile Number'],
          email: employee['Email'],
          aadhar_number: employee['Aadhaar'] || '',
          pan_number: employee['PAN'] || '',
          // Keep arrays for compatibility, but backend create handler expects
          // top-level primary/permanent fields. We'll include both.
          addresses,
          bank_accounts,
          active: String(employee['Active'] || '').toLowerCase() === 'yes'
        };

        // Only include empcode when provided (do not send null/empty so backend can generate one)
        if (employee['Employee Code'] && String(employee['Employee Code']).trim() !== '') {
          employeeData.empcode = employee['Employee Code'];
        }

        // Map first address to the backend's expected permanent address fields
        if (addresses && addresses.length > 0) {
          const a = addresses[0];
          if (a.address1) employeeData.permanent_address1 = a.address1;
          if (a.address2) employeeData.permanent_address2 = a.address2;
          if (a.address3) employeeData.permanent_address3 = a.address3;
          if (a.city) employeeData.permanent_city = a.city;
          if (a.state) employeeData.permanent_state = a.state;
          if (a.country) employeeData.permanent_country = a.country;
          if (a.pincode) employeeData.permanent_pincode = a.pincode;
        }

        // Map first bank account to the backend's expected primary bank fields
        if (bank_accounts && bank_accounts.length > 0) {
          const b = bank_accounts[0];
          if (b.bank_name) employeeData.primary_bank_name = b.bank_name;
          if (b.branch_name) employeeData.primary_branch_name = b.branch_name;
          if (b.branch_address) employeeData.primary_branch_address = b.branch_address;
          if (b.account_number) employeeData.primary_account_number = b.account_number;
          if (b.ifsc_code) employeeData.primary_ifsc_code = b.ifsc_code;
        }

        const response = await axios.post(`${BASE_URL}/api/employees`, employeeData);
        return response.data;
      });

      const results = await Promise.allSettled(importPromises);
      
      const successful = results.filter(r => r.status === 'fulfilled').length;
      const failed = results.filter(r => r.status === 'rejected').length;

      // Build detailed error report
      const errorDetails = results.map((result, idx) => {
        if (result.status === 'rejected') {
          // Try to extract meaningful error messages from the axios rejection
          let errMsgs = [];
          const resp = result.reason?.response?.data;
          if (resp) {
            if (Array.isArray(resp.errors)) errMsgs = resp.errors;
            else if (typeof resp.error === 'string') errMsgs = [resp.error];
            else if (typeof resp.details === 'string') errMsgs = [resp.details];
            else if (typeof resp.message === 'string') errMsgs = [resp.message];
          }
          if (errMsgs.length === 0) errMsgs = [result.reason?.message || 'Unknown error'];

          return {
            row: idx + 1, // 1-based row number
            employeeName: selectedData[idx]?.['Name'] || (selectedData[idx]?.['First Name'] ? selectedData[idx]['First Name'] + ' ' + selectedData[idx]['Last Name'] : 'N/A'),
            employeeCode: selectedData[idx]?.['Employee Code'] || 'N/A',
            errors: errMsgs,
            data: selectedData[idx]
          };
        }
        return null;
      }).filter(Boolean);

      setImportReport({
        type: failed > 0 ? 'import_failed' : 'import_complete',
        totalRows: selectedData.length,
        successCount: successful,
        errorCount: failed,
        skipped: 0,
        errors: errorDetails
      });

      setImportReportOpen(true);
      setImportPreviewOpen(false);
      
      // Refresh the employee list
      if (successful > 0) {
        fetchEmployees();
      }
      
    } catch (error) {
      console.error('Import failed:', error);
      alert('Import failed: ' + error.message);
    } finally {
      setImportLoading(false);
    }
  };

  // Helper functions for import
  const _normalizeKey = (k) => String(k || '').toLowerCase().replace(/[^a-z0-9]/g, '');

  const buildFieldErrorMapFromErrors = (errorsArr = [], dataArray = []) => {
    const errorMap = {};
    errorsArr.forEach(({ rowIndex, errors }) => {
      errorMap[rowIndex] = errors;
    });
    return errorMap;
  };

  // Parse various incoming date representations (ExcelJS Date, JS Date, numbers, or common strings)
  const parseDateToIso = (val) => {
    if (val === null || val === undefined || val === '') return null;
    // Date object
    if (val instanceof Date) {
      return isNaN(val.getTime()) ? null : val.toISOString();
    }
    // Number - could be timestamp (ms) or Excel serial
    if (typeof val === 'number') {
      const asDate = new Date(val);
      if (!isNaN(asDate.getTime())) return asDate.toISOString();
      // Try Excel serial (days since 1899-12-31)
      const excelDate = new Date(Math.round((val - 25569) * 86400 * 1000));
      return !isNaN(excelDate.getTime()) ? excelDate.toISOString() : null;
    }
    // String
    if (typeof val === 'string') {
      const s = val.trim();
      if (s === '') return null;
      // Try native parse (ISO, RFC etc.)
      const direct = new Date(s);
      if (!isNaN(direct.getTime())) return direct.toISOString();
      // dd/mm/yyyy or dd-mm-yyyy
      let m = s.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/);
      if (m) {
        const day = parseInt(m[1], 10), month = parseInt(m[2], 10) - 1, year = parseInt(m[3], 10);
        const dt = new Date(year, month, day);
        if (!isNaN(dt.getTime())) return dt.toISOString();
      }
      // yyyy/mm/dd or yyyy-mm-dd
      m = s.match(/^(\d{4})[\/\-](\d{1,2})[\/\-](\d{1,2})$/);
      if (m) {
        const year = parseInt(m[1], 10), month = parseInt(m[2], 10) - 1, day = parseInt(m[3], 10);
        const dt = new Date(year, month, day);
        if (!isNaN(dt.getTime())) return dt.toISOString();
      }
      // Numeric string - try as ms timestamp or excel serial
      if (!isNaN(Number(s))) {
        const num = Number(s);
        const asDate2 = new Date(num);
        if (!isNaN(asDate2.getTime())) return asDate2.toISOString();
        const excelDate2 = new Date(Math.round((num - 25569) * 86400 * 1000));
        if (!isNaN(excelDate2.getTime())) return excelDate2.toISOString();
      }
      return null;
    }
    return null;
  };

  // Helper: produce a string value for export
  const getExportValue = (employee, field) => {
    if (!employee) return '';
    try {
      if (field === 'Employee Code') return employee.usercode || '';
      if (field === 'Name') return [employee.salutation, employee.firstname, employee.lastname].filter(Boolean).join(' ') || '';
      if (field === 'DOB') return employee.dob ? new Date(employee.dob).toLocaleDateString() : '';
      if (field === 'Gender') return employee.gender || '';
      if (field === 'Country') {
        const name = employee.country || '';
        const code = employee.country_code || '';
        if (name && code) return `${name} (${code})`;
        return name || code || '';
      }
      if (field === 'MobileNumber') return employee.mobile_number || '';
      if (field === 'Email') return employee.email || '';
      if (field === 'Aadhaar') return employee.aadhar_number || '';
      if (field === 'PAN') return employee.pan_number || '';
      if (field === 'Address 1') return employee.addresses && employee.addresses[0] ? employee.addresses[0].address1 || '' : '';
      if (field === 'Address 2') return employee.addresses && employee.addresses[0] ? employee.addresses[0].address2 || '' : '';
      if (field === 'Address 3') return employee.addresses && employee.addresses[0] ? employee.addresses[0].address3 || '' : '';
      if (field === 'City') return employee.addresses && employee.addresses[0] ? employee.addresses[0].city || '' : '';
      if (field === 'State') return employee.addresses && employee.addresses[0] ? employee.addresses[0].state || '' : '';
      if (field === 'Address Country') return employee.addresses && employee.addresses[0] ? employee.addresses[0].country || '' : '';
      if (field === 'Pincode') return employee.addresses && employee.addresses[0] ? employee.addresses[0].pincode || '' : '';
      if (field === 'Bank Info') {
        if (!Array.isArray(employee.bank_accounts) || employee.bank_accounts.length === 0) return '';
        return employee.bank_accounts.map(bank => {
          const parts = [];
          if (bank.bank_name) parts.push(`Bank: ${bank.bank_name}`);
          if (bank.branch_name) parts.push(`Branch: ${bank.branch_name}`);
          if (bank.branch_address) parts.push(`Address: ${bank.branch_address}`);
          if (bank.account_number) parts.push(`Account: ${bank.account_number}`);
          if (bank.ifsc_code) parts.push(`IFSC: ${bank.ifsc_code}`);
          return parts.join(' | ');
        }).join(' \n ');
      }
      if (field === 'Documents') {
        if (!Array.isArray(employee.documents) || employee.documents.length === 0) return '';
        return employee.documents.map(d => {
          const type = d.doc_type || d.type || d.document_type || d.name || '';
          const docNo = d.doc_number || d.number || d.doc_no || d.document_number || '';
          // Only include type and number for export
          return `${type}${docNo ? ' No:' + docNo : ''}`.trim();
        }).join(' | ');
      }
      if (field === 'Status') {
        const val = (employee.is_active !== undefined) ? employee.is_active : (employee.active !== undefined ? employee.active : (employee.status !== undefined ? employee.status : employee.isActive));
        if (typeof val === 'boolean') return val ? 'Active' : 'Inactive';
        if (typeof val === 'string') return val;
        return '';
      }
      return '';
    } catch (err) {
      return '';
    }
  };

  const handlePageChange = (event, newPage) => {
    setPage(newPage);
  };

  const handleLimitChange = (event) => {
    setLimit(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleAddEmployee = () => {
    navigate("/employeemaster");
  };

  const handleEditEmployee = (employee) => {
    navigate(`/employeemaster/${employee.id}`);
  };

  const handleViewEmployee = (employee) => {
    setSelectedEmployee(employee);
    setViewDialogOpen(true);
  };

  const handleDeleteEmployee = (employee) => {
    setEmployeeToDelete(employee);
    setConfirmDeleteOpen(true);
  };

  const confirmDelete = async () => {
    if (!employeeToDelete) return;

    try {
      await axios.delete(`${BASE_URL}/api/employees/${employeeToDelete.id}`);
      showSnackbar("Employee deleted successfully", "success");
      fetchEmployees();
    } catch (error) {
      console.error("Error deleting employee:", error);
      showSnackbar("Error deleting employee", "error");
    } finally {
      setConfirmDeleteOpen(false);
      setEmployeeToDelete(null);
    }
  };

  const showSnackbar = (message, severity) => {
    setSnackbarMessage(message);
    setSnackbarSeverity(severity);
    setSnackbarOpen(true);
  };

  const handleSnackbarClose = () => {
    setSnackbarOpen(false);
  };

  const formatDate = (dateString) => {
    if (!dateString) return "";
    return new Date(dateString).toLocaleDateString();
  };

  const formatCountry = (employee) => {
    if (!employee) return "";
    // Prefer top-level country fields, but fall back to the first address's country
    const name = employee.country || (Array.isArray(employee.addresses) && employee.addresses[0] && (employee.addresses[0].country || '')) || "";
    const code = employee.country_code || (Array.isArray(employee.addresses) && employee.addresses[0] && (employee.addresses[0].country_code || '')) || "";
    if (name && code) return `${name} (${code})`;
    return name || code || "";
  };

  // Helper to escape regex special characters
  const escapeRegExp = (string) => {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  };

  // Highlight occurrences of the current search query inside a string.
  // If value is not a string (JSX or element), return it unchanged.
  const renderHighlighted = (value) => {
    const q = (filters.search || '').trim();
    if (!q || typeof value !== 'string') return value;
    const regex = new RegExp(`(${escapeRegExp(q)})`, 'gi');
    const parts = value.split(regex);
    return parts.map((part, index) =>
      regex.test(part) ? <mark key={index} style={{ backgroundColor: '#ffff00', padding: '0 2px' }}>{part}</mark> : part
    );
  };

  // Build a document URL for viewing/downloading (handles relative backend paths)
  const buildDocUrl = (doc) => {
    if (!doc) return null;
    const file = doc.file_url || doc.file_name || doc.url || doc.path || '';
    if (!file) return null;
    const fileStr = String(file);
    if (/^https?:\/\//i.test(fileStr)) return fileStr;
    try {
      const base = String(BASE_URL || '').replace(/\/$/, '');
      const path = fileStr.replace(/^\.\//, '').replace(/^\/+/, '');
      return `${base}/${path}`;
    } catch (e) {
      return fileStr;
    }
  };

  const handleViewDoc = (doc) => {
    const url = buildDocUrl(doc);
    if (!url) return showSnackbar('No file available to view', 'warning');
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const handleDownloadDoc = async (doc) => {
    try {
      const url = buildDocUrl(doc);
      if (!url) return showSnackbar('No file available to download', 'warning');

      // Simple anchor download - works for same-origin or when CORS allows
      const a = document.createElement('a');
      a.href = url;
      a.download = doc.file_name || url.split('/').pop() || 'document';
      document.body.appendChild(a);
      a.click();
      a.remove();
    } catch (err) {
      console.error('Download failed', err);
      showSnackbar('Download failed', 'error');
    }
  };

  return (
    <section className="right-content">
      <Box sx={{ p: 1, mt: 1 }}>
        <Typography variant="h5" gutterBottom>All Employees List</Typography>
        {/* Filters */}
        <Paper sx={{ p: 2, mb: 2 }}>
          <Box display="flex" alignItems="center" width="100%" className="list-toolbar">
            <Box display="flex" alignItems="center">
              <div className="search-wrap" style={{ marginRight: 16 }}>
                <div className="search-input">
                  <input
                    type="text"
                    placeholder="Search here..."
                    value={filters.search}
                    onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                    aria-label="Search"
                  />
                  {filters.search ? (
                    <button type="button" className="search-clear" onClick={() => setFilters({ ...filters, search: "" })} aria-label="clear-search">✖</button>
                  ) : (
                    <button type="button" className="search-btn" aria-label="search">🔍</button>
                  )}
                </div>
              </div>

              <div className="toolbar-actions">
                <button type="button" className="plain-action" onClick={handleDisplayPrefOpen} title="Display Preferences">
                  <TableView />
                  <span className="action-label">Display</span>
                </button>

                <button type="button" className="plain-action" onClick={() => setImportDialogOpen(true)} title="Import">
                  <GetApp />
                  <span className="action-label">Import</span>
                </button>

                <button type="button" className="plain-action" onClick={handleExport} title="Export">
                  <FileUpload />
                  <span className="action-label">Export</span>
                </button>
              </div>
            </Box>

            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={handleAddEmployee}
              sx={{ ml: 'auto' }}
            >
              Add Employee
            </Button>
          </Box>
        </Paper>

        {/* Table */}
        <TableContainer component={Paper}>
          <Table sx={{ width: '100%', tableLayout: 'auto' }}>
            <TableHead>
              <TableRow>
                <TableCell padding="checkbox" sx={{ minWidth: 56 }}>
                  <Checkbox
                    checked={employees.length > 0 && selectedIds.length === employees.length}
                    indeterminate={selectedIds.length > 0 && selectedIds.length < employees.length}
                    onChange={handleToggleSelectAll}
                    size="small"
                  />
                </TableCell>
                <TableCell sx={{ minWidth: 80 }}>S.No</TableCell>
                {displayedFields.map((field) => (
                  <TableCell key={field} sx={{ minWidth: getMinWidth(field) }}>{field}</TableCell>
                ))}
                <TableCell sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={displayedFields.length + 3} align="center">
                    <CircularProgress />
                  </TableCell>
                </TableRow>
              ) : employees.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={displayedFields.length + 3} align="center">
                    No employees found
                  </TableCell>
                </TableRow>
              ) : (
                employees.map((employee, index) => (
                  <TableRow
                    key={employee.id}
                    selected={selectedIds.includes(employee.id)}
                    hover
                    sx={{ cursor: 'pointer', '& td': { borderBottom: '1px solid rgba(224,224,224,1)', verticalAlign: 'middle' } }}
                    onClick={() => { setSelectedEmployee(employee); setViewDialogOpen(true); }}
                  >
                    <TableCell padding="checkbox" sx={{ minWidth: 56 }}>
                      <Checkbox
                        checked={selectedIds.includes(employee.id)}
                        onChange={() => handleToggleSelect(employee.id)}
                        onClick={(e) => e.stopPropagation()}
                        size="small"
                      />
                    </TableCell>
                    <TableCell sx={{ minWidth: 80 }}>{page * limit + index + 1}</TableCell>
                    {displayedFields.map((field) => (
                      <TableCell key={field} sx={{ minWidth: getMinWidth(field), whiteSpace: 'normal', wordBreak: 'break-word' }}>
                        {field === 'Photo' && (() => {
                          const photoDoc = employee.documents?.find(d => 
                            d.doc_type?.toLowerCase() === 'photo' || 
                            d.doc_type?.toLowerCase() === 'employee photo' || 
                            d.doc_type?.toLowerCase() === 'profile'
                          );
                          const photoUrl = employee.photo || employee.profile_picture || (photoDoc ? buildDocUrl(photoDoc) : null);
                          return (
                            <Avatar
                              src={photoUrl}
                              alt="Photo"
                              variant="square"
                              sx={{ width: 80, height: 80, cursor: photoUrl ? 'pointer' : 'default' }}
                              onClick={(e) => {
                                e.stopPropagation();
                                if (photoUrl && photoDoc) {
                                  handleViewDoc(photoDoc);
                                } else if (photoUrl) {
                                  window.open(photoUrl, '_blank', 'noopener,noreferrer');
                                }
                              }}
                            >
                              {[employee.firstname, employee.lastname].filter(Boolean).join(' ').charAt(0).toUpperCase()}
                            </Avatar>
                          );
                        })()}
                        {field === 'Employee Code' && renderHighlighted(employee.usercode)}
                        {field === 'Name' && renderHighlighted(
                          [employee.salutation, employee.firstname, employee.lastname].filter(Boolean).join(' ')
                        )}
                        {field === 'DOB' && formatDate(employee.dob)}
                        {field === 'Gender' && renderHighlighted(employee.gender)}
                        {field === 'Country' && renderHighlighted(formatCountry(employee))}
                        {field === 'MobileNumber' && renderHighlighted(employee.mobile_number)}
                        {field === 'Email' && renderHighlighted(employee.email)}
                        {field === 'Aadhaar' && renderHighlighted(employee.aadhar_number)}
                        {field === 'PAN' && renderHighlighted(employee.pan_number)}
                        {field === 'Address 1' && renderHighlighted(employee.addresses && employee.addresses[0] ? employee.addresses[0].address1 || '' : '')}
                        {field === 'Address 2' && renderHighlighted(employee.addresses && employee.addresses[0] ? employee.addresses[0].address2 || '' : '')}
                        {field === 'Address 3' && renderHighlighted(employee.addresses && employee.addresses[0] ? employee.addresses[0].address3 || '' : '')}
                        {field === 'City' && renderHighlighted(employee.addresses && employee.addresses[0] ? employee.addresses[0].city || '' : '')}
                        {field === 'State' && renderHighlighted(employee.addresses && employee.addresses[0] ? employee.addresses[0].state || '' : '')}
                        {field === 'Add. Country' && renderHighlighted(employee.addresses && employee.addresses[0] ? (employee.addresses[0].country && employee.addresses[0].country_code ? `${employee.addresses[0].country} (${employee.addresses[0].country_code})` : (employee.addresses[0].country || employee.addresses[0].country_code || '')) : '')}
                        {field === 'Pincode' && renderHighlighted(employee.addresses && employee.addresses[0] ? employee.addresses[0].pincode || '' : '')}
                        {field === 'Bank Info' && (
                          Array.isArray(employee.bank_accounts) && employee.bank_accounts.length > 0 ? (
                            employee.bank_accounts.map((bank, idx) => (
                              <div key={idx} style={{ marginBottom: 8 }}>
                                {bank.bank_name && <div><b>Bank:</b> {bank.bank_name}</div>}
                                {bank.branch_name && <div><b>Branch:</b> {bank.branch_name}</div>}
                                {bank.branch_address && <div><b>Address:</b> {bank.branch_address}</div>}
                                {bank.account_number && <div><b>Account:</b> {bank.account_number}</div>}
                                {bank.ifsc_code && <div><b>IFSC:</b> {bank.ifsc_code}</div>}
                              </div>
                            ))
                          ) : ''
                        )}
                        {field === 'Documents' && (
                          Array.isArray(employee.documents) && employee.documents.length > 0 ? (
                            employee.documents.map((d, idx) => (
                              <div key={idx} style={{ marginBottom: 8 }}>
                                <div><b>Type:</b> {d.doc_type || d.type}</div>
                                {d.doc_number && <div><b>No:</b> {d.doc_number}</div>}
                                <div>{d.file_name || d.file_url}</div>
                              </div>
                            ))
                          ) : ''
                        )}
                        {field === 'Status' && (
                          (() => {
                            const val = (employee.is_active !== undefined) ? employee.is_active : (employee.active !== undefined ? employee.active : (employee.status !== undefined ? employee.status : employee.isActive));
                            const isActive = (typeof val === 'boolean') ? val : (typeof val === 'string' ? (val.toLowerCase() === 'active' || val.toLowerCase() === 'true') : !!val);
                            return (
                              <Chip
                                label={isActive ? 'Active' : 'Inactive'}
                                color={isActive ? 'success' : 'default'}
                                size="small"
                              />
                            );
                          })()
                        )}
                      </TableCell>
                    ))}
                    <TableCell sx={{ minWidth: 220, verticalAlign: 'middle', textAlign: 'center', py: 1.25 }}>
                      <Box sx={{ display: 'inline-flex', gap: 1, alignItems: 'center', justifyContent: 'center' }}>
                        <Tooltip title="View">
                          <IconButton size="small" onClick={(e) => { e.stopPropagation(); handleViewEmployee(employee); }} sx={{ p: 0.5 }}>
                            <VisibilityIcon />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Edit">
                          <IconButton size="small" onClick={(e) => { e.stopPropagation(); handleEditEmployee(employee); }} sx={{ p: 0.5 }}>
                            <EditIcon />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Delete">
                          <IconButton size="small" onClick={(e) => { e.stopPropagation(); handleDeleteEmployee(employee); }} sx={{ p: 0.5 }}>
                            <DeleteIcon />
                          </IconButton>
                        </Tooltip>
                      </Box>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>

        {/* Pagination */}
        <TablePagination
          component="div"
          count={totalItems}
          page={page}
          onPageChange={handlePageChange}
          rowsPerPage={limit}
          onRowsPerPageChange={handleLimitChange}
          rowsPerPageOptions={[5, 10, 25, 50]}
        />

        {/* Delete Confirmation Dialog */}
        <Dialog open={confirmDeleteOpen} onClose={() => setConfirmDeleteOpen(false)}>
          <DialogTitle>Confirm Delete</DialogTitle>
          <DialogContent>
            Are you sure you want to delete this employee? This action cannot be undone.
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setConfirmDeleteOpen(false)}>Cancel</Button>
            <Button onClick={confirmDelete} color="error">
              Delete
            </Button>
          </DialogActions>
        </Dialog>

        {/* Snackbar */}
        <Snackbar
          open={snackbarOpen}
          autoHideDuration={6000}
          onClose={handleSnackbarClose}
        >
          <Alert onClose={handleSnackbarClose} severity={snackbarSeverity}>
            {snackbarMessage}
          </Alert>
        </Snackbar>

        {/* Display Preferences Dialog */}
        <Dialog open={displayPrefOpen} onClose={handleDisplayPrefClose} maxWidth="lg" fullWidth sx={{ '& .MuiDialog-paper': { width: '90%', maxWidth: 1200 } }}>
          <DialogTitle>Display Preferences</DialogTitle>
          <DialogContent>
            <Box display="flex" alignItems="center" mb={2}>
              <Checkbox
                checked={checkedFields.length === employeeFields.length}
                indeterminate={checkedFields.length > 0 && checkedFields.length < employeeFields.length}
                onChange={e => {
                  if (e.target.checked) {
                    setCheckedFields(employeeFields);
                    localStorage.setItem('employeeListCheckedFields', JSON.stringify(employeeFields));
                  } else {
                    setCheckedFields([]);
                    localStorage.setItem('employeeListCheckedFields', JSON.stringify([]));
                  }
                }}
                size="small"
                sx={{ p: 0.5, mr: 1 }}
              />
              <span style={{ fontWeight: 500, fontSize: 15 }}>Select All</span>
            </Box>
            <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(6, minmax(0, 1fr))', gap: 2 }}>
              {employeeFields.map((field) => (
                <Box key={field} sx={{ display: 'flex', alignItems: 'center', minHeight: 20 }}>
                  <Checkbox
                    checked={checkedFields.includes(field)}
                    onChange={() => handleFieldToggle(field)}
                    size="small"
                    sx={{ p: 0.5, mr: 1 }}
                  />
                  <span style={{ fontSize: 14 }}>{field}</span>
                </Box>
              ))}
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleDisplayPrefClose}>Close</Button>
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
          <DialogTitle>Import Employees</DialogTitle>
          <DialogContent>
            <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
              Import employees from a CSV file. Make sure you have downloaded the template and filled it correctly.
            </Typography>
            <Box sx={{ mb: 2, p: 2, bgcolor: 'info.lighter', borderRadius: 1 }}>
              <Typography variant="body2" sx={{ mb: 1 }}>
                <strong>Instructions:</strong>
              </Typography>
              <Typography variant="body2" component="ul" sx={{ pl: 2, mb: 0 }}>
                <li>Download the template Excel file below</li>
                <li>Fill in your employee data following the template format</li>
                <li>Required fields are marked with asterisk (*)</li>
                <li>You can edit the info after upload the CSV file</li>
                <li style={{ color: 'red' }}>Upload the completed CSV file</li>
              </Typography>
            </Box>
            <Box sx={{ mb: 2 }}>
              <Button
                variant="outlined"
                color="primary"
                onClick={downloadTemplateCSV}
                startIcon={<DownloadIcon />}
              >
                Download Template Excel
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
            if (reason === 'backdropClick' || reason === 'escapeKeyDown') return;
            setImportPreviewOpen(false);
          }}
          maxWidth="lg"
          fullWidth
        >
          <DialogTitle>Import Preview</DialogTitle>
          <DialogContent>
            <Typography variant="body2" sx={{ mb: 2 }}>
              Review the data before importing. Select the rows you want to import.
            </Typography>
            {/* Ensure Employee Code column is always present and shown first in preview */}
            {(() => {
              const cols = [];
              cols.push('Employee Code');
              if (importedData && importedData[0]) {
                Object.keys(importedData[0]).forEach(k => {
                  if (String(k).trim() === '') return;
                  if (k === 'Employee Code') return; // already added
                  cols.push(k);
                });
              }
              var previewColumns = cols;
              return (
                <TableContainer component={Paper} sx={{ maxHeight: 400 }}>
                  <Table stickyHeader>
                    <TableHead>
                      <TableRow>
                        <TableCell padding="checkbox">
                          <Checkbox
                            checked={importSelectedRows.size === importedData.length}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setImportSelectedRows(new Set(importedData.map((_, i) => i)));
                              } else {
                                setImportSelectedRows(new Set());
                              }
                            }}
                          />
                        </TableCell>
                        {previewColumns.map((key) => {
                          const requiredSet = new Set(['salutation','firstname','gender','countrynamecode','mobilenumber','email','active']);
                          const normalized = String(key || '').toLowerCase().replace(/[^a-z0-9]/g, '');
                          const isRequired = requiredSet.has(normalized);
                          return (
                            <TableCell key={key} sx={{ fontWeight: 600 }}>
                              {key}{isRequired ? <span style={{ color: 'red', marginLeft: 6 }}>*</span> : null}
                            </TableCell>
                          );
                        })}
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {importedData.map((row, index) => (
                        <TableRow key={index}>
                          <TableCell padding="checkbox">
                            <Checkbox
                              checked={importSelectedRows.has(index)}
                              onChange={(e) => {
                                const newSelected = new Set(importSelectedRows);
                                if (e.target.checked) {
                                  newSelected.add(index);
                                } else {
                                  newSelected.delete(index);
                                }
                                setImportSelectedRows(newSelected);
                              }}
                            />
                          </TableCell>
                          {previewColumns.map((key, colIndex) => {
                            const value = row && Object.prototype.hasOwnProperty.call(row, key) ? row[key] : '';
                            const cellError = importFieldErrors[index] && importFieldErrors[index][key];
                            return (
                              <SimpleEditableCell
                                key={colIndex}
                                value={value}
                                rowIndex={index}
                                columnKey={key}
                                onUpdate={(rIdx, cKey, newVal) => {
                                  setImportedData(prev => {
                                    const copy = [...prev];
                                    copy[rIdx] = { ...copy[rIdx], [cKey]: newVal };
                                    return copy;
                                  });
                                  setImportFieldErrors(prev => {
                                    if (!prev || !prev[rIdx] || !prev[rIdx][cKey]) return prev;
                                    const next = { ...prev };
                                    const rowErrs = { ...next[rIdx] };
                                    delete rowErrs[cKey];
                                    if (Object.keys(rowErrs).length === 0) delete next[rIdx];
                                    else next[rIdx] = rowErrs;
                                    return next;
                                  });
                                }}
                                error={!!cellError}
                                errorMessages={cellError || []}
                                cellSx={{ backgroundColor: cellError ? 'rgba(244, 67, 54, 0.05)' : 'inherit' }}
                              />
                            );
                          })}
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              );
            })()}
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setImportPreviewOpen(false)}>Cancel</Button>
            <Button 
              onClick={handleFinalImport} 
              variant="contained" 
              disabled={importSelectedRows.size === 0 || importLoading}
            >
              {importLoading ? <CircularProgress size={20} /> : `Import ${importSelectedRows.size} Employees`}
            </Button>
          </DialogActions>
        </Dialog>

        {/* Import Report Dialog */}
        <Dialog
          open={importReportOpen}
          onClose={(event, reason) => {
            if (reason === 'backdropClick' || reason === 'escapeKeyDown') return;
            setImportReportOpen(false);
          }}
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
                  <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                    <Box sx={{ flex: '1 1 25%' }}>
                      <Typography variant="body2" color="textSecondary">Total Rows:</Typography>
                      <Typography variant="h6">{importReport.totalRows}</Typography>
                    </Box>
                    <Box sx={{ flex: '1 1 25%' }}>
                      <Typography variant="body2" color="success.main">Successful:</Typography>
                      <Typography variant="h6" color="success.main">{importReport.successCount}</Typography>
                    </Box>
                    <Box sx={{ flex: '1 1 25%' }}>
                      <Typography variant="body2" color="error.main">Errors:</Typography>
                      <Typography variant="h6" color="error.main">{importReport.errorCount}</Typography>
                    </Box>
                    {importReport.skipped > 0 && (
                      <Box sx={{ flex: '1 1 25%' }}>
                        <Typography variant="body2" color="warning.main">Skipped:</Typography>
                        <Typography variant="h6" color="warning.main">{importReport.skipped}</Typography>
                      </Box>
                    )}
                  </Box>
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
                            <TableCell sx={{ fontWeight: 'bold' }}>Employee Name</TableCell>
                            <TableCell sx={{ fontWeight: 'bold' }}>Employee Code</TableCell>
                            <TableCell sx={{ fontWeight: 'bold' }}>Error Details</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {importReport.errors.map((error, index) => (
                            <TableRow key={index}>
                              <TableCell>{error.row || 'N/A'}</TableCell>
                              <TableCell>{error.employeeName || 'N/A'}</TableCell>
                              <TableCell>{error.employeeCode || 'N/A'}</TableCell>
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
                      ✓ Successfully imported {importReport.successCount} employee{importReport.successCount > 1 ? 's' : ''}
                    </Typography>
                  </Box>
                )}
              </Box>
            )}
          </DialogContent>
          <DialogActions>
            <Button
              onClick={() => {
                // Close report and go back to preview for editing
                setImportReportOpen(false);
                // If there are errors, ensure those rows are selected for easier editing
                if (importReport?.errors && Array.isArray(importReport.errors)) {
                  const s = new Set(importSelectedRows);
                  importReport.errors.forEach(err => {
                    const r = err?.row;
                    if (typeof r === 'number' && r > 0) s.add(r - 1);
                  });
                  setImportSelectedRows(s);
                }
                setImportPreviewOpen(true);
              }}
              variant="outlined"
            >
              Edit
            </Button>

            <Button 
              onClick={() => {
                setImportReportOpen(false);
                if (importReport?.successCount > 0) {
                  fetchEmployees();
                }
              }} 
              variant="contained" 
              color="primary"
            >
              Close
            </Button>
          </DialogActions>
        </Dialog>

        {/* View Employee Dialog */}
        {/* Employee View Dialog */}
        <div className={`employee-view-dialog ${viewDialogOpen ? 'open' : ''}`}>
          <div className="employee-view-dialog-content">
            <div className="employee-view-dialog-header">
              <div className="employee-view-dialog-title-section">
                <h2 className="employee-view-dialog-title">Employee Details</h2>
                {selectedEmployee && (
                  <p className="employee-view-dialog-subtitle">
                    {[selectedEmployee.salutation, selectedEmployee.firstname, selectedEmployee.lastname].filter(Boolean).join(' ')}
                  </p>
                )}
              </div>
              <div>
                {selectedEmployee && (() => {
                  const val = (selectedEmployee.is_active !== undefined) ? selectedEmployee.is_active : (selectedEmployee.active !== undefined ? selectedEmployee.active : (selectedEmployee.status !== undefined ? selectedEmployee.status : selectedEmployee.isActive));
                  const isActive = (typeof val === 'boolean') ? val : (typeof val === 'string' ? (val.toLowerCase() === 'active' || val.toLowerCase() === 'true') : !!val);
                  return (
                    <div className={`employee-view-dialog-status ${isActive ? 'active' : 'inactive'}`}>
                      {isActive ? 'Active' : 'Inactive'}
                    </div>
                  );
                })()}
              </div>
            </div>
            <div className="employee-view-dialog-body">
              {selectedEmployee ? (
                <div>
                  {/* Employee Information */}
                  <div className="employee-details-section">
                    <h3 className="section-title">Employee Information</h3>
                    <div className="form-grid col-12">
                      <div className="form-field">
                        <label>Employee Code</label>
                        <input type="text" value={selectedEmployee.usercode || ""} disabled />
                      </div>
                      <div className="form-field">
                        <label>Name</label>
                        <input type="text" value={[selectedEmployee.salutation, selectedEmployee.firstname, selectedEmployee.lastname].filter(Boolean).join(' ')} disabled />
                      </div>
                      <div className="form-field">
                        <label>DOB</label>
                        <input type="text" value={selectedEmployee.dob ? new Date(selectedEmployee.dob).toLocaleDateString() : ""} disabled />
                      </div>
                      <div className="form-field">
                        <label>Gender</label>
                        <input type="text" value={selectedEmployee.gender || ""} disabled />
                      </div>
                      <div className="form-field">
                        <label>Country</label>
                        <input type="text" value={formatCountry(selectedEmployee)} disabled />
                      </div>
                      <div className="form-field">
                        <label>Mobile Number</label>
                        <input type="text" value={selectedEmployee.mobile_number || ""} disabled />
                      </div>
                      <div className="form-field" style={{ gridColumn: '1 / 3' }}>
                        <label>Email</label>
                        <input type="text" value={selectedEmployee.email || ""} disabled />
                      </div>
                    </div>
                  </div>

                  {/* Address Information */}
                  <div className="employee-details-section">
                    <h3 className="section-title">Address Information</h3>
                    {Array.isArray(selectedEmployee.addresses) && selectedEmployee.addresses.length > 0 ? (
                      <div>
                        {selectedEmployee.addresses.map((addr, idx) => (
                          <div key={idx} className="address-block">
                            <h4 className="address-title">
                              {addr.title || `Address ${idx + 1}`}
                            </h4>
                            <div className="form-grid col-12">
                              <div className="form-field">
                                <label>Address 1</label>
                                <input type="text" value={addr.address1 || ""} disabled />
                              </div>
                              <div className="form-field">
                                <label>Address 2</label>
                                <input type="text" value={addr.address2 || ""} disabled />
                              </div>
                              <div className="form-field">
                                <label>Address 3</label>
                                <input type="text" value={addr.address3 || ""} disabled />
                              </div>
                              <div className="form-field">
                                <label>City</label>
                                <input type="text" value={addr.city || ""} disabled />
                              </div>
                              <div className="form-field">
                                <label>State</label>
                                <input type="text" value={addr.state || ""} disabled />
                              </div>
                              <div className="form-field">
                                <label>Country</label>
                                <input type="text" value={
                                  addr.country && addr.country_code 
                                    ? `${addr.country} (${addr.country_code})` 
                                    : (addr.country || addr.country_code || "")
                                } disabled />
                              </div>
                              <div className="form-field">
                                <label>Pincode</label>
                                <input type="text" value={addr.pincode || ""} disabled />
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="no-data-message">No addresses available</p>
                    )}
                  </div>

                  {/* Bank Information */}
                  <div className="employee-details-section">
                    <h3 className="section-title">Bank Information</h3>
                    {Array.isArray(selectedEmployee.bank_accounts) && selectedEmployee.bank_accounts.length > 0 ? (
                      <div>
                        {selectedEmployee.bank_accounts.map((bank, idx) => (
                          <div key={idx} className="bank-block">
                            <h4 className="bank-title">
                              Bank Account {idx + 1}
                            </h4>
                            <div className="form-grid col-12">
                              <div className="form-field">
                                <label>Bank Name</label>
                                <input type="text" value={bank.bank_name || ""} disabled />
                              </div>
                              <div className="form-field">
                                <label>Branch Name</label>
                                <input type="text" value={bank.branch_name || ""} disabled />
                              </div>
                              <div className="form-field">
                                <label>Branch Address</label>
                                <input type="text" value={bank.branch_address || ""} disabled />
                              </div>
                              <div className="form-field">
                                <label>Account Number</label>
                                <input type="text" value={bank.account_number || ""} disabled />
                              </div>
                              <div className="form-field">
                                <label>IFSC Code</label>
                                <input type="text" value={bank.ifsc_code || ""} disabled />
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="no-data-message">No bank information available</p>
                    )}
                  </div>

                  {/* Documents */}
                  <div className="employee-details-section">
                    <h3 className="section-title">Documents</h3>
                    {Array.isArray(selectedEmployee.documents) && selectedEmployee.documents.length > 0 ? (
                      <div className="documents-grid">
                        {selectedEmployee.documents.map((doc, idx) => {
                          const docType = doc.doc_type || doc.type || 'Document';
                          const docNumber = doc.doc_number || doc.number || '';
                          const fileName = doc.file_name || doc.file_url || doc.url || '';
                          const fileUrl = buildDocUrl(doc);
                          const isImage = /\.(jpg|jpeg|png|gif|bmp|webp)$/i.test(fileName || '');
                          
                          return (
                            <div key={idx} className="document-card">
                              {isImage && fileUrl ? (
                                <div className="document-preview-container">
                                  <img 
                                    src={fileUrl} 
                                    alt={docType} 
                                    className="document-preview-image"
                                  />
                                </div>
                              ) : (
                                <div className="document-preview-placeholder">
                                  <div className="document-icon">📄</div>
                                  <span className="document-placeholder-text">Non-image document</span>
                                </div>
                              )}
                              
                              <div className="document-info">
                                <h4 className="document-type">{docType}</h4>
                                {docNumber && <p className="document-number">No: {docNumber}</p>}
                                {fileName && <p className="document-filename">{fileName}</p>}
                              </div>
                              
                              <div className="document-actions">
                                <button 
                                  type="button"
                                  className="doc-action-btn"
                                  onClick={() => handleViewDoc(doc)}
                                  title="View"
                                >
                                  👁️ View
                                </button>
                                <button 
                                  type="button"
                                  className="doc-action-btn"
                                  onClick={() => handleDownloadDoc(doc)}
                                  title="Download"
                                >
                                  ⬇️ Download
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <p className="no-data-message">No documents available</p>
                    )}
                  </div>

                  {/* Legal Information */}
                  <div className="employee-details-section">
                    <h3 className="section-title">Legal Information</h3>
                    <div className="form-grid col-12">
                      <div className="form-field">
                        <label>Aadhaar</label>
                        <input type="text" value={selectedEmployee.aadhar_number || ""} disabled />
                      </div>
                      <div className="form-field">
                        <label>PAN</label>
                        <input type="text" value={selectedEmployee.pan_number || ""} disabled />
                      </div>

                    </div>
                  </div>

                  {/* Authentication */}
                  <div className="employee-details-section">
                    <h3 className="section-title">Authentication</h3>
                    <div className="form-grid col-12">
                      <div className="form-field">
                        <label>Username</label>
                        <input type="text" value={selectedEmployee.username || ""} disabled />
                      </div>
                      <div className="form-field password-input-container">
                        <label>Password</label>
                        <input 
                          type={showPassword ? "text" : "password"} 
                          value={selectedEmployee.plain_password || selectedEmployee.plainPassword || selectedEmployee.password || ""} 
                          disabled 
                        />
                        {(selectedEmployee.plain_password || selectedEmployee.plainPassword || selectedEmployee.password) && (
                          <button
                            type="button"
                            className="password-toggle"
                            onClick={() => setShowPassword(!showPassword)}
                            title={showPassword ? "Hide password" : "Show password"}
                          >
                            {showPassword ? '🙈' : '👁️'}
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <p>No employee selected.</p>
              )}
            </div>
            <div className="employee-view-dialog-footer">
              <button className="btn btn-secondary" onClick={() => setViewDialogOpen(false)}>Close</button>
              <button 
                className="btn btn-outline" 
                onClick={() => {
                  setViewDialogOpen(false);
                  navigate(`/employeemaster/${selectedEmployee.id}`);
                }}
              >
                Edit Employee
              </button>
            </div>
          </div>
        </div>

        {/* Overlay backdrop click handler */}
        {viewDialogOpen && (
          <div 
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              zIndex: 1299
            }}
            onClick={() => setViewDialogOpen(false)}
          />
        )}
      </Box>
    </section>
  );
}