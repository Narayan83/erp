import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  CircularProgress,
  Paper,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  TableContainer,
  Checkbox,
  TextField,
  Select,
  MenuItem,
  Grid,
} from '@mui/material';
import { BASE_URL } from '../../../config/Config';
import axios from 'axios';
import * as XLSX from 'xlsx';
import countries from '../../../User/utils/countries.js';
import stateList from '../../../User/utils/state_list.json';
import cities from '../../../User/utils/cities-name-list.json';

const LeadsCSVImport = ({ isOpen, onClose, onImportSuccess }) => {
  const [importFile, setImportFile] = useState(null);
  const [importLoading, setImportLoading] = useState(false);
  const [importedData, setImportedData] = useState([]);
  const [importPreviewOpen, setImportPreviewOpen] = useState(false);
  const [importSelectedRows, setImportSelectedRows] = useState(new Set());
  const [importReport, setImportReport] = useState(null);
  const [importReportOpen, setImportReportOpen] = useState(false);
  const [editingCell, setEditingCell] = useState(null);
  const [openDropdown, setOpenDropdown] = useState(null);
  const [productOptions, setProductOptions] = useState([]);
  const [assignedOptions, setAssignedOptions] = useState([]);
  // Source options (sync with AddLead - can be extended via localStorage 'leadSources')
  const [sourceOptions, setSourceOptions] = useState(['Website', 'Referral', 'Social Media', 'Direct', 'Partner']);

  // Required fields for import (now including Source, Since and Assigned To)
  const requiredFields = ['Business', 'Salutation', 'Name', 'Mobile', 'Email', 'Product', 'Source', 'Since', 'Assigned To'];

  // Dropdown options for preview table (product/assigned filled from backend)
  const dropdownFields = {
    'Salutation': ['Mr.', 'Ms.', 'Mrs.'],
    'Source': sourceOptions,
    'Stage': ['Discussion', 'Appointment', 'Demo', 'Decided', 'Inactive'],
    'Category': ['Software', 'Hardware', 'Services', 'Consulting', 'Training'],
    'Country': countries.map(c => c.name).slice(0, 50),
    'State': Object.values(stateList).slice(0, 36),
    'City': Array.isArray(cities) ? cities.slice(0, 100) : [],
    'Product': productOptions,
    'Product *': productOptions,
    'Assigned To': assignedOptions,
    'Assigned To *': assignedOptions,
  };

  // Column widths for preview table (label -> CSS width)
  const columnWidths = {
    'Business': '220px',
    'Salutation': '50px',
    'Name': '220px',
    'Designation': '150px',
    'Mobile': '120px',
    'Email': '240px',
    'Address Line 1': '220px',
    'Address Line 2': '200px',
    'City': '120px',
    'State': '120px',
    'Country': '120px',
    'GSTIN': '140px',
    'Source': '140px',
    'Stage': '120px',
    'Potential (₹)': '140px',
    'Since': '140px',
    'Requirement': '200px',
    'Category': '130px',
    'Product': '180px',
    'Website': '180px',
    'Notes': '200px',
    'Tags': '160px',
    'Assigned To': '180px'
  };

  // Fetch products and employees for dropdowns
  React.useEffect(() => {
    let mounted = true;
    const fetchLists = async () => {
      try {
        const prodRes = await axios.get(`${BASE_URL}/api/products?page=1&limit=1000`);
        const prodData = prodRes.data?.data || prodRes.data || [];
        const prodNames = prodData.map(p => p.Name || p.name || '').filter(Boolean);
        if (mounted) setProductOptions(prodNames);
      } catch (e) {
        console.warn('Failed to load products for import dropdown:', e.message || e);
      }

      try {
        const empRes = await axios.get(`${BASE_URL}/api/employees?page=1&limit=1000`);
        const empData = empRes.data?.data || empRes.data || [];
        const empNames = (Array.isArray(empData) ? empData : []).map(u => {
          const first = u.firstname || u.Firstname || u.firstName || u.first_name || '';
          const last = u.lastname || u.Lastname || u.lastName || u.last_name || '';
          const full = `${first}${last ? ' ' + last : ''}`.trim();
          return full || u.email || String(u.id || u.ID || '');
        }).filter(Boolean);
        if (mounted) setAssignedOptions(empNames);
      } catch (e) {
        // fallback to users endpoint if employees endpoint fails
        try {
          const userRes = await axios.get(`${BASE_URL}/api/users?page=1&limit=1000`);
          const userData = userRes.data?.data || userRes.data || [];
          const userNames = userData.map(u => u.name || u.Name || u.email || '').filter(Boolean);
          if (mounted) setAssignedOptions(userNames);
        } catch (err) {
          console.warn('Failed to load users/employees for import dropdown:', err.message || err);
        }
      }
    };
    fetchLists();

    // Also load any saved sources from localStorage (same as AddLead)
    try {
      const savedSources = JSON.parse(localStorage.getItem('leadSources') || '[]');
      if (Array.isArray(savedSources) && savedSources.length > 0) {
        setSourceOptions(savedSources.map(s => s.name));
      }
    } catch (e) { /* ignore */ }

    return () => { mounted = false; };
  }, []);

  // Handle cell edit
  const handleCellEdit = (rowIndex, fieldName, value) => {
    const newData = [...importedData];
    newData[rowIndex] = { ...newData[rowIndex], [fieldName]: value };
    setImportedData(newData);
  };

  // Helper: format various date strings to YYYY-MM-DD for date input
  const formatDateForInput = (val) => {
    if (!val) return '';
    if (typeof val !== 'string') val = String(val);
    // ISO-like
    const iso = val.match(/^(\d{4}-\d{2}-\d{2})/);
    if (iso) return iso[1];
    // D-M-Y or DD-MM-YYYY
    const dmy = val.match(/^(\d{2})-(\d{2})-(\d{4})$/);
    if (dmy) return `${dmy[3]}-${dmy[2]}-${dmy[1]}`;
    // Fallback to Date parse
    const dt = new Date(val);
    if (!isNaN(dt)) return dt.toISOString().slice(0,10);
    return '';
  };

  // Render editable cell
  const renderEditableCell = (rowIndex, fieldName, value) => {
    const lookupField = fieldName.replace(/\*/g, '').trim();
    const lookupLower = lookupField.toLowerCase();
    const isDropdownField = dropdownFields[lookupField];
    const isProductField = lookupField.toLowerCase() === 'product';
    const cellKey = `${rowIndex}-${lookupField}`;

    if (editingCell?.row === rowIndex && editingCell?.field === fieldName) {
      if (isDropdownField) {
        return (
          <Select
            value={value || ''}
            onChange={(e) => handleCellEdit(rowIndex, fieldName, e.target.value)}
            size="small"
            autoFocus
            open={openDropdown === cellKey}
            onOpen={() => setOpenDropdown(cellKey)}
            onClose={() => {
              setOpenDropdown(null);
              setEditingCell(null);
            }}
            sx={{ width: '100%' }}
          >
            {isDropdownField.map((option) => (
              <MenuItem key={option} value={option}>
                {option}
              </MenuItem>
            ))}
          </Select>
        );
      } else if (lookupLower === 'since') {
        // Render a native date picker for 'Since' field
        const dateVal = formatDateForInput(value);
        return (
          <TextField
            type="date"
            value={dateVal}
            onChange={(e) => handleCellEdit(rowIndex, fieldName, e.target.value)}
            size="small"
            autoFocus
            onBlur={() => setEditingCell(null)}
            inputProps={{ style: { padding: '8px 10px' } }}
            sx={{ width: '100%' }}
          />
        );
      } else {
        // For non-dropdown fields, allow text input
        return (
          <TextField
            value={value || ''}
            onChange={(e) => handleCellEdit(rowIndex, fieldName, e.target.value)}
            size="small"
            autoFocus
            onBlur={() => setEditingCell(null)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                setEditingCell(null);
              } else if (e.key === 'Escape') {
                setEditingCell(null);
              }
            }}
            sx={{ width: '100%' }}
          />
        );
      }
    }

    return (
      <Box
        onClick={() => {
          setEditingCell({ row: rowIndex, field: fieldName });
          if (isDropdownField) setOpenDropdown(cellKey);
        }}
        sx={{
          cursor: 'pointer',
          padding: '8px',
          borderRadius: '4px',
          minHeight: '36px',
          display: 'flex',
          alignItems: 'center',
          backgroundColor: isDropdownField ? '#cfdaf5ff' : 'transparent',
          border: isProductField && value && !isDropdownField?.includes(value) ? '2px solid #ff6b6b' : 'none',
        }}
        title={isProductField && value && !isDropdownField?.includes(value) ? 'Invalid product selection. Please select from dropdown.' : ''}
      >
        {value || ''}
      </Box>
    );
  };

  // Download template CSV
  const downloadTemplateCSV = async () => {
    const headersArr = [
      'Business *',
      'Salutation *',
      'Name *',
      'Designation',
      'Mobile *',
      'Email *',
      'Address Line 1',
      'Address Line 2',
      'City',
      'State',
      'Country',
      'GSTIN',
      'Source *',
      'Stage',
      'Potential (₹)',
      'Since *',
      'Requirement',
      'Category',
      'Product *',
      'Website',
      'Notes',
      'Tags',
      'Assigned To *'
    ];

    const exampleRow = [
      'ABC Corp',
      'Mr.',
      'John Doe',
      'Manager',
      '9876543210',
      'john@example.com',
      '123 Main Street',
      'Apt 4B',
      'Mumbai',
      'Maharashtra',
      'India',
      '27AABCT1234H1Z0',
      // Use first source option as example when available
      (sourceOptions && sourceOptions.length > 0) ? sourceOptions[0] : 'LinkedIn',
      'Negotiation',
      '50000',
      '2024-01-15',
      'Product A, Product B',
      'Electronics',
      'Sample Product',
      'www.example.com',
      'Internal notes here',
      'VIP, Follow-up',
      'User Name'
    ];

    // Dropdown options
    const salutationOptions = ['Mr.', 'Ms.', 'Mrs.'];
    const sourceOptions = ['Website', 'Referral', 'Social Media', 'Direct', 'Partner'];
    const stageOptions = ['Discussion','Appointment', 'Demo', 'Decided', 'Inactive'];
    const categoryOptions = ['Software', 'Hardware', 'Services', 'Consulting', 'Training'];
    const countryOptions = countries.map(c => c.name).slice(0, 50); // Top countries
    const stateOptions = Object.values(stateList).slice(0, 36); // All Indian states
    const cityOptions = Array.isArray(cities) ? cities.slice(0, 100) : []; // Top cities

    let ExcelJS;
    try {
      const mod = await import('exceljs');
      ExcelJS = mod.default || mod;
    } catch (err) {
      console.error('Failed to load exceljs:', err);
      ExcelJS = null;
    }

    if (ExcelJS) {
      const workbook = new ExcelJS.Workbook();
      const templateSheet = workbook.addWorksheet('Template');

      // Add headers
      templateSheet.addRow(headersArr);
      // Add example row
      templateSheet.addRow(exampleRow);

      // Mute the example row
      try {
        const sampleRow = templateSheet.getRow(2);
        const sampleColor = { argb: 'FF9E9E9E' };
        for (let c = 1; c <= headersArr.length; c++) {
          const cell = sampleRow.getCell(c);
          cell.font = { color: sampleColor, italic: true };
          cell.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FFF9F9F9' }
          };
        }
      } catch (err) {
        console.warn('Could not apply sample row styling:', err);
      }

      // Create a hidden sheet for dropdown lists
      const listsSheet = workbook.addWorksheet('Lists', { state: 'hidden' });

      // Add lists data to the hidden sheet
      const salutationRow = ['Salutation', ...salutationOptions];
      const sourceRow = ['Source', ...sourceOptions];
      const stageRow = ['Stage', ...stageOptions];
      const categoryRow = ['Category', ...categoryOptions];
      const countryRow = ['Country', ...countryOptions];
      const stateRow = ['State', ...stateOptions];
      const cityRow = ['City', ...cityOptions];

      listsSheet.addRow(salutationRow);
      listsSheet.addRow(sourceRow);
      listsSheet.addRow(stageRow);
      listsSheet.addRow(categoryRow);
      listsSheet.addRow(countryRow);
      listsSheet.addRow(stateRow);
      listsSheet.addRow(cityRow);

      // Helper to convert column number to letter (1 -> A)
      function columnNumberToName(num) {
        let s = '';
        while (num > 0) {
          const mod = (num - 1) % 26;
          s = String.fromCharCode(65 + mod) + s;
          num = Math.floor((num - 1) / 26);
        }
        return s;
      }

      // Helper to create data validation range
      const makeRange = (rowIndex, count) => {
        const startCol = 2; // B
        const endColIndex = startCol + count - 1;
        const endColLetter = columnNumberToName(endColIndex);
        return `Lists!$B$${rowIndex}:$${endColLetter}$${rowIndex}`;
      };

      // Create header to column index mapping
      const headerMap = {};
      headersArr.forEach((h, idx) => {
        const cleaned = h.replace(/\*/g, '').trim().toLowerCase().replace(/\s+/g, ' ');
        headerMap[cleaned] = idx + 1;
      });

      // Apply data validation to columns
      const applyValidationToColumn = (colIndex, formula) => {
        // Apply validation from row 3 to row 1000 (row 1 is header, row 2 is example)
        for (let r = 3; r <= 1000; r++) {
          const cell = templateSheet.getCell(r, colIndex);
          cell.dataValidation = {
            type: 'list',
            allowBlank: true,
            showErrorMessage: true,
            formulae: [formula]
          };
          // Highlight dropdown cells with light yellow
          cell.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FFF7F7E8' }
          };
        }
      };

      // Get column indices
      const salutationCol = headerMap['salutation'];
      const sourceCol = headerMap['source'];
      const stageCol = headerMap['stage'];
      const categoryCol = headerMap['category'];
      const countryCol = headerMap['country'];
      const stateCol = headerMap['state'];
      const cityCol = headerMap['city'];

      // Apply validations
      if (salutationCol) applyValidationToColumn(salutationCol, `=${makeRange(1, salutationOptions.length)}`);
      if (sourceCol) applyValidationToColumn(sourceCol, `=${makeRange(2, sourceOptions.length)}`);
      if (stageCol) applyValidationToColumn(stageCol, `=${makeRange(3, stageOptions.length)}`);
      if (categoryCol) applyValidationToColumn(categoryCol, `=${makeRange(4, categoryOptions.length)}`);
      if (countryCol) applyValidationToColumn(countryCol, `=${makeRange(5, countryOptions.length)}`);
      if (stateCol) applyValidationToColumn(stateCol, `=${makeRange(6, stateOptions.length)}`);
      if (cityCol) applyValidationToColumn(cityCol, `=${makeRange(7, cityOptions.length)}`);

      // Highlight header cells for dropdown columns
      const headerRow = templateSheet.getRow(1);
      [salutationCol, sourceCol, stageCol, categoryCol, countryCol, stateCol, cityCol].forEach((colIndex) => {
        if (!colIndex) return;
        const hdrCell = headerRow.getCell(colIndex);
        hdrCell.font = { bold: true };
        hdrCell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FFEEE8BF' }
        };
      });

      // Highlight required field columns with red
      const requiredFieldsMap = {
        'business': true,
        'salutation': true,
        'name': true,
        'mobile': true,
        'email': true,
        'product': true,
      'source': true,
      'since': true,
      'assigned to': true
      };
      for (let colIndex = 1; colIndex <= headersArr.length; colIndex++) {
        const headerText = headersArr[colIndex - 1].toLowerCase().replace(/\*/g, '').trim();
        if (requiredFieldsMap[headerText]) {
          const hdrCell = headerRow.getCell(colIndex);
          hdrCell.font = { bold: true, color: { argb: 'FFFF0000' } };
          hdrCell.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FFFFE6E6' }
          };
        } else {
          const hdrCell = headerRow.getCell(colIndex);
          hdrCell.font = { bold: true };
        }
      }

      // Add empty rows for data entry
      for (let i = 0; i < 10; i++) {
        templateSheet.addRow([]);
      }

      // Set column widths
      templateSheet.columns.forEach((column) => {
        column.width = 15;
      });

      // Generate file
      workbook.xlsx.writeBuffer().then((buffer) => {
        const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = 'leads_import_template.xlsx';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }).catch((err) => {
        console.error('Failed to generate XLSX template:', err);
      });
    } else {
      // Fallback to XLSX
      const ws = XLSX.utils.aoa_to_sheet([headersArr, exampleRow]);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Template');
      XLSX.writeFile(wb, 'leads_import_template.xlsx');
    }
  };

  // Handle CSV import
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
          let csvText = e.target.result;
          // Remove BOM if present
          if (csvText.charCodeAt(0) === 0xFEFF) csvText = csvText.slice(1);

          if (!csvText.trim()) {
            alert('The CSV file appears to be empty.');
            setImportLoading(false);
            return;
          }

          // Parse CSV
          const rawLines = csvText.split(/\r\n|\n|\r/);
          let lines = rawLines.filter(l => {
            if (!l) return false;
            const cleaned = l.replace(/[",;\s]/g, '');
            return cleaned.length > 0;
          });

          if (lines.length === 0) {
            alert('The CSV file appears to be empty.');
            setImportLoading(false);
            return;
          }

          // Parse headers
          const delimiter = lines[0].includes(';') ? ';' : ',';
          const headers = lines[0].split(delimiter).map(h => h.trim().replace(/^"|"$/g, '').replace(/""/g, '"'));
          const dataRows = lines.slice(1);

          const objectData = dataRows.map(row => {
            let values = [];
            let inQuote = false;
            let currentValue = '';

            if (delimiter === ';') {
              values = row.split(delimiter).map(v => v.trim().replace(/^"|"$/g, '').replace(/""/g, '"'));
            } else {
              for (let i = 0; i < row.length; i++) {
                const char = row[i];
                if (char === '"' && (i === 0 || row[i - 1] !== '\\')) {
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

          if (objectData.length === 0) {
            alert('The CSV file has headers but no data rows.');
            setImportLoading(false);
            return;
          }

          // Store the parsed data
          setImportedData(objectData);
          const allIdx = new Set(objectData.map((_, i) => i));
          setImportSelectedRows(allIdx);
          setImportLoading(false);
          setImportPreviewOpen(true);
        } catch (error) {
          console.error('Error importing leads:', error);
          alert(`Failed to import leads: ${error.message}`);
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

  // Validate required fields
  const validateRequiredFields = (row) => {
    const missingFields = [];
    const fieldMapping = {
      'Business': ['Business', 'Business *', 'business'],
      'Salutation': ['Salutation', 'Salutation *', 'salutation'],
      'Name': ['Name', 'Name *', 'name'],
      'Mobile': ['Mobile', 'Mobile *', 'mobile'],
      'Email': ['Email', 'Email *', 'email'],
      'Product': ['Product', 'Product *', 'product'],
      'Source': ['Source', 'Source *', 'source'],
      'Since': ['Since', 'Since *', 'since'],
      'Assigned To': ['Assigned To', 'Assigned To *', 'assignedTo', 'assignedToName']
    };

    Object.keys(fieldMapping).forEach(displayName => {
      const possibleKeys = fieldMapping[displayName];
      const found = possibleKeys.some(key => row[key] && String(row[key]).trim() !== '');
      if (!found) {
        missingFields.push(displayName);
      }
    });

    return missingFields;
  };

  // Validate product is from dropdown
  const validateProductDropdown = (row) => {
    const productKey = Object.keys(row).find(k => k.replace(/\*/g, '').trim().toLowerCase() === 'product');
    if (!productKey) return true; // no product field, skip validation
    
    const productValue = row[productKey]?.trim();
    if (!productValue) return true; // empty product is handled by required field validation
    
    // Check if product value exists in the dropdown options
    return productOptions.some(option => option.toLowerCase() === productValue.toLowerCase());
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

      // Validate required fields for all selected rows
      const validationErrors = [];
      selectedArray.forEach((row, idx) => {
        const errors = [];
        
        // Check required fields
        const missingFields = validateRequiredFields(row);
        if (missingFields.length > 0) {
          errors.push(`Missing required fields: ${missingFields.join(', ')}`);
        }
        
        // Validate product is from dropdown
        if (!validateProductDropdown(row)) {
          const productKey = Object.keys(row).find(k => k.replace(/\*/g, '').trim().toLowerCase() === 'product');
          const productValue = row[productKey];
          errors.push(`Product "${productValue}" is not in the available options. Please select from the dropdown list.`);
        }
        
        if (errors.length > 0) {
          validationErrors.push({
            row: idx + 1,
            leadName: row.Name || 'N/A',
            business: row.Business || 'N/A',
            errors
          });
        }
      });

      if (validationErrors.length > 0) {
        // Show validation errors in report dialog
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

      // Ensure required textual fields (Source / Assigned To) exist for selected rows
      const missingSpecial = [];
      selectedArray.forEach((row, idx) => {
        const sourceKey = Object.keys(row).find(k => k.replace(/\*/g, '').trim().toLowerCase() === 'source');
        const sinceKey = Object.keys(row).find(k => k.replace(/\*/g, '').trim().toLowerCase() === 'since');
        const assignedKey = Object.keys(row).find(k => k.replace(/\*/g, '').trim().toLowerCase() === 'assigned to');
        const sourceVal = sourceKey ? row[sourceKey] : '';
        const sinceVal = sinceKey ? row[sinceKey] : '';
        const assignedVal = assignedKey ? row[assignedKey] : '';
        if (!sourceVal || String(sourceVal).trim() === '') {
          missingSpecial.push({ row: idx + 1, field: 'Source' });
        }
        if (!sinceVal || String(sinceVal).trim() === '') {
          missingSpecial.push({ row: idx + 1, field: 'Since' });
        }
        if (!assignedVal || String(assignedVal).trim() === '') {
          missingSpecial.push({ row: idx + 1, field: 'Assigned To' });
        }
      });
      if (missingSpecial.length > 0) {
        const errors = missingSpecial.map(m => ({ row: m.row, leadName: selectedArray[m.row - 1].Name || 'N/A', business: selectedArray[m.row - 1].Business || 'N/A', errors: [`Missing required field: ${m.field}`] }));
        setImportReport({ type: 'validation_error', totalRows: selectedArray.length, successCount: 0, errorCount: errors.length, errors, successes: [] });
        setImportReportOpen(true);
        setImportLoading(false);
        return;
      }

      // Normalize field names before sending to backend
      const normalizedArray = selectedArray.map(row => {
        const normalizedRow = {};
        Object.keys(row).forEach(key => {
          const normalizedKey = key.replace(/\s*\*\s*/g, '').trim();
          const lowerKey = normalizedKey.toLowerCase();
          let apiKey = normalizedKey;
          let value = row[key];

          // Map display names to API field names
          if (lowerKey === 'address line 1') apiKey = 'addressLine1';
          else if (lowerKey === 'address line 2') apiKey = 'addressLine2';
          else if (lowerKey === 'potential (₹)' || lowerKey === 'potential (?)') apiKey = 'potential';
          else if (lowerKey === 'assigned to') apiKey = 'assignedToName';
          else if (lowerKey === 'notes') apiKey = 'notes';
          else if (lowerKey === 'tags') apiKey = 'tags';
          else if (lowerKey === 'requirement') apiKey = 'requirements';
          else if (lowerKey === 'salutation') apiKey = 'salutation'; // Keep as is, not used in Lead model but might be needed
          else if (lowerKey === 'product') apiKey = 'productName'; // Send product name as text
          else if (lowerKey === 'since') apiKey = 'since';
          else if (lowerKey === 'last talk') apiKey = 'lastTalk';
          else if (lowerKey === 'next talk') apiKey = 'nextTalk';
          else if (lowerKey === 'transferred on') apiKey = 'transferredOn';

          // Treat common placeholder values as empty - only for assignedToName and productName
          // Only filter if value exactly matches placeholder (not substring match)
          const placeholders = ['user name', 'sample product'];
          if (value && typeof value === 'string' && (apiKey === 'assignedToName' || apiKey === 'productName')) {
            const valueLower = value.toLowerCase().trim();
            if (placeholders.includes(valueLower)) {
              value = '';
            }
          }

          // Convert empty strings to null/empty for optional fields
          if (value === '' || value === null || value === undefined) {
            if (['potential', 'since', 'lastTalk', 'nextTalk', 'transferredOn'].includes(apiKey)) {
              value = null;
            } else {
              value = '';
            }
          }

          // Additional validation: ensure required 'since' is a date when provided
          if (apiKey === 'since' && value) {
            const dt = new Date(value);
            if (isNaN(dt)) {
              // keep raw value; validation will catch invalid/missing required fields later
            } else {
              // normalize to ISO date
              value = dt.toISOString();
            }
          }

          // Convert potential to number
          if (apiKey === 'potential' && value) {
            value = parseFloat(value) || 0;
          }

          normalizedRow[apiKey] = value;
        });
        return normalizedRow;
      });

      console.log('Sending import data:', JSON.stringify(normalizedArray, null, 2));

      const response = await axios.post(`${BASE_URL}/api/leads/import`, normalizedArray, {
        headers: {
          'Content-Type': 'application/json',
        },
      });

      console.log('Import response:', response.data);

      // Parse response and build detailed error list
      const parsedErrors = [];
      if (response.data.errors && Array.isArray(response.data.errors)) {
        response.data.errors.forEach((errorItem, idx) => {
          // Handle error object with detail property
          let errorDetails = 'Unknown error';
          if (typeof errorItem === 'string') {
            errorDetails = errorItem;
          } else if (errorItem.detail) {
            errorDetails = errorItem.detail;
          } else if (errorItem.error) {
            errorDetails = errorItem.error;
          }
          
          parsedErrors.push({
            row: errorItem.row || idx + 1,
            leadName: errorItem.lead || 'N/A',
            business: errorItem.business || 'N/A',
            errors: [errorDetails]
          });
        });
      }

      // Build success list
      const successList = [];
      if (response.data.created && response.data.created > 0) {
        // If we have created count but no detailed success info from backend
        // Map successful rows from the normalized data
        const errorRowsSet = new Set(parsedErrors.map(e => e.row - 1));
        normalizedArray.forEach((row, idx) => {
          if (!errorRowsSet.has(idx)) {
            successList.push({
              row: idx + 1,
              leadName: row.name || row.Name || 'N/A',
              business: row.business || row.Business || 'N/A',
              action: 'Imported'
            });
          }
        });
      }

      // Parse report
      const report = {
        type: 'import_complete',
        totalRows: selectedArray.length,
        successCount: response.data.created || 0,
        errorCount: parsedErrors.length,
        errors: parsedErrors,
        successes: successList,
        skipped: response.data.failed || 0
      };

      setImportReport(report);
      setImportReportOpen(true);
      setImportPreviewOpen(false);

      // Broadcast import success to other components/tabs
      try {
        const createdCount = response.data && (response.data.created || response.data.created === 0) ? response.data.created : 0;
        window.dispatchEvent(new CustomEvent('leads:imported', { detail: { count: createdCount } }));
        localStorage.setItem('leads:imported', JSON.stringify({ ts: Date.now(), count: createdCount }));
      } catch (e) { /* ignore */ }

      // Clear data if fully successful
      if (parsedErrors.length === 0) {
        setImportedData([]);
        setImportFile(null);
        setTimeout(() => {
          if (onImportSuccess) {
            onImportSuccess();
          }
        }, 1500);
      }

      setImportLoading(false);
    } catch (error) {
      console.error('Error finalizing import:', error);
      const errorMsg = error.response?.data?.error || error.response?.data?.detail || error.message || 'Unknown error';
      const detailMsg = error.response?.data?.detail || '';
      
      // Show error in report dialog
      const selectedArray = importedData.filter((_, idx) => importSelectedRows.has(idx));
      setImportReport({
        type: 'import_failed',
        totalRows: selectedArray.length,
        successCount: 0,
        errorCount: 1,
        errors: [{
          row: 'Server',
          leadName: 'N/A',
          business: 'N/A',
          errors: [errorMsg + (detailMsg ? ` - ${detailMsg}` : '')]
        }],
        successes: []
      });
      setImportReportOpen(true);
      setImportLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Import Dialog */}
      <Dialog 
        open={isOpen && !importPreviewOpen && !importReportOpen} 
        onClose={(event, reason) => { if (reason === 'backdropClick') return; onClose(); }} 
        maxWidth="md" 
        fullWidth
      >
        <DialogTitle>Import Leads from CSV</DialogTitle>
        <DialogContent>
          <Box sx={{ mb: 2 }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
              Instructions:
            </Typography>
            <ul style={{ marginTop: 0, marginBottom: 8, paddingLeft: '1.25rem' }}>
              <li>
                <Typography component="span" variant="body2">
                  Download the template Excel file below
                </Typography>
              </li>
              <li>
                <Typography component="span" variant="body2">
                  Fill in your lead data following the template format
                </Typography>
              </li>
              <li>
                <Typography component="span" variant="body2">
                  Required fields marked with ★ (Business, Salutation, Name, Mobile, Email, Product, Source, Since, Assigned To)
                </Typography>
              </li>
              <li>
                <Typography component="span" variant="body2">
                  Save the file as CSV format
                </Typography>
              </li>
              <li>
                <Typography component="span" variant="body2">
                  Upload the completed CSV file
                </Typography>
              </li>
            </ul>
          </Box>
          <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
            Import leads from a CSV file. Make sure you have downloaded the template and filled it correctly.
          </Typography>
          <input
            type="file"
            accept=".csv"
            onChange={(e) => setImportFile(e.target.files[0])}
            style={{ marginBottom: '16px' }}
          />
          {importFile && (
            <Typography variant="body2" sx={{ mb: 2 }}>
              Selected file: {importFile.name}
            </Typography>
          )}

          <Box sx={{ mb: 2 }}>
            <Typography
              variant="body2"
              color="primary"
              sx={{ cursor: 'pointer' }}
              onClick={downloadTemplateCSV}
            >
              ↓ Download template Excel file
            </Typography>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose}>Cancel</Button>
          <Button
            variant="contained"
            color="primary"
            onClick={handleImport}
            disabled={!importFile || importLoading}
          >
            {importLoading ? <CircularProgress size={20} /> : 'Next'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Import Preview Dialog */}
      <Dialog
        open={importPreviewOpen}
        onClose={(event, reason) => {
          if (reason === 'backdropClick') return;
          setImportPreviewOpen(false);
          setImportedData([]);
          setImportSelectedRows(new Set());
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
            Review and edit the data before finalizing the import. Click on any cell to edit.
          </Typography>

          <TableContainer component={Paper} sx={{ maxHeight: 600 }}>
            <Table stickyHeader size="small">
              <TableHead>
                <TableRow>
                  <TableCell sx={{ width: 60 }}>
                    <Checkbox
                      size="small"
                      checked={
                        importedData.length > 0 &&
                        importSelectedRows.size === importedData.length
                      }
                      indeterminate={
                        importSelectedRows.size > 0 &&
                        importSelectedRows.size < importedData.length
                      }
                      onChange={(e) => {
                        if (e.target.checked) {
                          setImportSelectedRows(
                            new Set(importedData.map((_, i) => i))
                          );
                        } else {
                          setImportSelectedRows(new Set());
                        }
                      }}
                    />
                  </TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>No.</TableCell>
                  {importedData.length > 0 &&
                    Object.keys(importedData[0]).map((header) => {
                      const cleanedHeader = header.replace(/\*/g, '').trim();
                      const isRequired = requiredFields.includes(cleanedHeader);
                      return (
                        <TableCell
                          key={header}
                          sx={{
                            fontWeight: 'bold',
                            color: isRequired ? '#d32f2f' : 'inherit',
                            backgroundColor: isRequired ? '#ffebee' : 'transparent',
                            padding: '12px 8px',
                            width: columnWidths[cleanedHeader] || 'auto',
                            minWidth: columnWidths[cleanedHeader] || '80px'
                          }}
                        >
                          {cleanedHeader}
                          {isRequired && <span style={{ color: '#d32f2f', marginLeft: '4px' }}>★</span>}
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
                          setImportSelectedRows((prev) => {
                            const s = new Set(prev);
                            if (e.target.checked) s.add(rowIndex);
                            else s.delete(rowIndex);
                            return s;
                          });
                        }}
                      />
                    </TableCell>
                    <TableCell>{rowIndex + 1}</TableCell>
                    {Object.keys(row).map((key, cellIndex) => {
                      const cleanedKey = key.replace(/\*/g, '').trim();
                      const isDropdown = !!dropdownFields[cleanedKey];
                      const colWidth = columnWidths[cleanedKey] || 'auto';
                      return (
                      <TableCell
                        key={`${rowIndex}-${cellIndex}`}
                        sx={{
                          width: colWidth,
                          minWidth: colWidth === 'auto' ? '80px' : colWidth,
                          padding: 0,
                          backgroundColor: isDropdown
                            ? '#fffef0'
                            : requiredFields.includes(cleanedKey)
                            ? '#ffebee'
                            : 'transparent',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap'
                        }}
                      >
                        {renderEditableCell(rowIndex, key, row[key])}
                      </TableCell>
                      );
                    })}
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
              setImportSelectedRows(new Set());
            }}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            color="primary"
            onClick={handleFinalImport}
            disabled={importLoading || importSelectedRows.size === 0}
          >
            {importLoading ? <CircularProgress size={20} /> : 'Import'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Import Report Dialog */}
      <Dialog
        open={importReportOpen}
        onClose={(event, reason) => {
          if (reason === 'backdropClick') return;
          setImportReportOpen(false);
          setImportReport(null);
          if (importReport?.errorCount === 0) {
            onClose();
          }
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
                  <Grid size={3}>
                    <Typography variant="body2" color="textSecondary">Total Rows:</Typography>
                    <Typography variant="h6">{importReport.totalRows}</Typography>
                  </Grid>
                  <Grid size={3}>
                    <Typography variant="body2" color="success.main">Successful:</Typography>
                    <Typography variant="h6" color="success.main">{importReport.successCount}</Typography>
                  </Grid>
                  <Grid size={3}>
                    <Typography variant="body2" color="error.main">Errors:</Typography>
                    <Typography variant="h6" color="error.main">{importReport.errorCount}</Typography>
                  </Grid>
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
                        <TableRow sx={{ backgroundColor: '#ffebee' }}>
                          <TableCell sx={{ fontWeight: 'bold' }}>Row</TableCell>
                          <TableCell sx={{ fontWeight: 'bold' }}>Business</TableCell>
                          <TableCell sx={{ fontWeight: 'bold' }}>Error Details</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {importReport.errors.map((error, index) => (
                          <TableRow key={index}>
                            <TableCell>{error.row || 'N/A'}</TableCell>
                            <TableCell>{error.business || 'N/A'}</TableCell>
                            <TableCell>
                              <Box>
                                {Array.isArray(error.errors) ? error.errors.map((err, i) => {
                                  const isMandatoryError = err.includes('mandatory') || err.includes('required') || err.includes('Missing');
                                  const isNotFoundError = err.includes('not found') || err.includes('does not exist');
                                  return (
                                    <Typography 
                                      key={i} 
                                      variant="body2" 
                                      color="error.main" 
                                      sx={{ 
                                        mb: 0.5,
                                        fontWeight: (isMandatoryError || isNotFoundError) ? 600 : 400,
                                        bgcolor: isMandatoryError ? 'rgba(255, 152, 0, 0.1)' : 
                                                isNotFoundError ? 'rgba(244, 67, 54, 0.1)' : 'transparent',
                                        px: (isMandatoryError || isNotFoundError) ? 1 : 0,
                                        py: (isMandatoryError || isNotFoundError) ? 0.5 : 0,
                                        borderRadius: (isMandatoryError || isNotFoundError) ? 1 : 0
                                      }}
                                    >
                                      {isMandatoryError ? '⚠ ' : isNotFoundError ? '❌ ' : '• '}{err}
                                    </Typography>
                                  );
                                }) : (
                                  <Typography variant="body2" color="error.main">
                                    {error.errors || error.message || 'Unknown error'}
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

              {/* Success Section */}
              {importReport.successes && importReport.successes.length > 0 && (
                <Box sx={{ mb: 3 }}>
                  <Typography variant="subtitle2" color="success.main" gutterBottom>
                    Successfully Imported ({importReport.successes.length})
                  </Typography>
                  <TableContainer component={Paper} sx={{ maxHeight: 200 }}>
                    <Table size="small">
                      <TableHead>
                        <TableRow sx={{ backgroundColor: '#e8f5e9' }}>
                          <TableCell sx={{ fontWeight: 'bold' }}>Row</TableCell>
                          <TableCell sx={{ fontWeight: 'bold' }}>Business</TableCell>
                          <TableCell sx={{ fontWeight: 'bold' }}>Status</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {importReport.successes.map((success, index) => (
                          <TableRow key={index}>
                            <TableCell>{success.row}</TableCell>
                            <TableCell>{success.leadName || 'N/A'}</TableCell>
                            <TableCell>{success.business || 'N/A'}</TableCell>
                            <TableCell>
                              <Typography variant="body2" color="success.main">
                                ✓ {success.action || 'Imported'}
                              </Typography>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </Box>
              )}

              {/* Recommendations for validation errors */}
              {importReport.type === 'validation_error' && (
                <Box sx={{ p: 2, bgcolor: 'warning.lighter', borderRadius: 1, border: '1px solid', borderColor: 'warning.main' }}>
                  <Typography variant="subtitle2" color="warning.dark" gutterBottom>
                    💡 How to Fix These Errors
                  </Typography>
                  <Typography variant="body2" color="warning.dark" sx={{ mb: 1 }}>
                    <strong>Required Fields (must be filled):</strong>
                  </Typography>
                  <Typography variant="body2" color="warning.dark" sx={{ mb: 1, ml: 2 }}>
                    • Business, Salutation, Name, Mobile, Email, Product, Source, Since, Assigned To
                  </Typography>
                  <Typography variant="body2" color="warning.dark">
                    <strong>How to proceed:</strong><br/>
                    • You can edit values directly in the preview table<br/>
                    • Make sure all required fields marked with ★ are filled<br/>
                    • Click "Back to Edit" to return to the preview and fix these errors
                  </Typography>
                </Box>
              )}

              {/* Recommendations for import errors */}
              {importReport.type === 'import_complete' && importReport.errorCount > 0 && (
                <Box sx={{ p: 2, bgcolor: 'error.lighter', borderRadius: 1, border: '1px solid', borderColor: 'error.main' }}>
                  <Typography variant="subtitle2" color="error.dark" gutterBottom>
                    💡 How to Fix Import Errors
                  </Typography>
                  <Typography variant="body2" color="error.dark" sx={{ mb: 1 }}>
                    Click the <strong>"Back to Edit"</strong> button below to return to the import preview where you can:
                  </Typography>
                  <Typography variant="body2" color="error.dark" sx={{ ml: 2 }}>
                    • Edit field values directly in the table<br/>
                    • Deselect rows with errors if you don't want to import them<br/>
                    • Use the dropdown fields to select valid values
                  </Typography>
                </Box>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          {importReport?.type === 'import_complete' && importReport?.errorCount > 0 && (
            <Button
              variant="outlined"
              color="primary"
              onClick={() => {
                setImportReportOpen(false);
                setImportReport(null);
                setImportPreviewOpen(true);
              }}
            >
              Back to Edit
            </Button>
          )}
          {importReport?.type === 'validation_error' && (
            <Button
              variant="outlined"
              color="primary"
              onClick={() => {
                setImportReportOpen(false);
                setImportReport(null);
                setImportPreviewOpen(true);
              }}
            >
              Back to Edit
            </Button>
          )}
          <Button
            variant="contained"
            onClick={() => {
              setImportReportOpen(false);
              setImportReport(null);
              if (importReport?.errorCount === 0) {
                onClose();
              }
            }}
          >
            {importReport?.errorCount === 0 ? 'Done' : 'Close'}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default LeadsCSVImport;
