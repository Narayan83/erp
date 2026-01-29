// UserListPage.jsx
import React, { useEffect, useState, useCallback, memo, useRef } from "react";
import {
  Box,
  Button,
  Grid,
  TextField,
  Typography,
  Paper,
  IconButton,
  CircularProgress,
  
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
  Snackbar,
  Alert,
} from "@mui/material";
import { Edit, Visibility, TableView, WhatsApp, Mail, FileUpload, FileDownload, GetApp, Publish, VisibilityOff, Delete, AccountTree } from "@mui/icons-material";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { debounce } from "lodash";
import { BASE_URL } from "../../config/Config";
import ConfirmDialog from "../../CommonComponents/ConfirmDialog";
import ImportDialog from "../../CommonComponents/ImportDialog";
import dialCodeToCountry from "../utils/dialCodeToCountry";
import * as XLSX from 'xlsx';
import ExcelJS from 'exceljs';
import EnhancedEditableCell from "../../Products/ProductManage/Components/EnhancedEditableCell";
import Pagination from "../../CommonComponents/Pagination";
import ListItemText from '@mui/material/ListItemText';
import "./user_list_page.scss";
import countriesData from "../utils/countries";
import industriesData from "../industries.json";
import stateList from '../utils/state_list.json';
import citiesList from '../utils/cities-name-list.json';
// Build import-friendly country strings like "India (+91)" from countriesData
const IMPORT_COUNTRY_OPTIONS = Array.isArray(countriesData)
  ? countriesData.map(c => {
      const code = String(c.code || '').trim();
      const codeFormatted = code ? (code.startsWith('+') ? code : ('+' + code.replace(/^\+/, ''))) : '';
      return `${c.name} (${codeFormatted})`;
    })
  : [];
// Simple editable cell component for user import
const SimpleEditableCell = ({ value, rowIndex, columnKey, onUpdate, error, errorMessages, cellSx = {}, row }) => {
  const [editing, setEditing] = useState(false);
  const [editValue, setEditValue] = useState(value);
  useEffect(() => {
    // If this column supports multi-select and value is a comma-separated string,
    // initialize editValue as an array for the Select component.
    const opts = getDropdownOptions(columnKey);
    if (opts && opts.multiple) {
      if (typeof value === 'string' && value.trim() !== '') {
        const arr = value.split(',').map(s => s.trim()).filter(Boolean);
        setEditValue(arr);
      } else if (Array.isArray(value)) {
        setEditValue(value);
      } else {
        setEditValue([]);
      }
    } else {
      setEditValue(value);
    }
  }, [value]);


      // Map parsed backend errors to preview field errors so the preview highlights offending cells
      try {
        setImportFieldErrors(buildFieldErrorMapFromErrors(parsedErrors, normalizedArray));
      } catch (e) {
        console.warn('Failed to map parsed backend errors to fields', e);
      }


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

  const IMPORT_ACCOUNT_TYPES = ['Customer','Supplier','Dealer','Distributor'];

  const getDropdownOptions = (key, row = {}) => {
    const cleanKey = String(key).replace(/\s*\*\s*$/g, '');
    const normalizedKey = cleanKey.toLowerCase().replace(/[^a-z0-9]/g, '');
    if (normalizedKey === 'salutation') {
      return { options: ['Mr', 'Mrs', 'Ms', 'Dr', 'Prof', 'Sir', 'Madam'], multiple: false };
    } else if (normalizedKey === 'gender') {
      return { options: ['Male', 'Female', 'Other'], multiple: false };
    } else if (normalizedKey === 'active') {
      return { options: ['Yes', 'No'], multiple: false };
    } else if (normalizedKey === 'country' || normalizedKey === 'permanentcountry') {
      return { options: IMPORT_COUNTRY_OPTIONS, multiple: false };
    } else if (normalizedKey === 'state' && (row['Country'] === 'India (+91)' || row['Permanent Country'] === 'India (+91)')) {
      return { options: Object.values(stateList), multiple: false };
    } else if (normalizedKey === 'city' && (row['Country'] === 'India (+91)' || row['Permanent Country'] === 'India (+91)')) {
      return { options: citiesList, multiple: false };
    } else if (normalizedKey.includes('accounttype') || (normalizedKey.includes('account') && normalizedKey.includes('type'))) {
      return { options: IMPORT_ACCOUNT_TYPES, multiple: true };
    }
    return null;
  };

  const optsObj = getDropdownOptions(columnKey, row);
  const options = optsObj ? optsObj.options : null;
  const isMultiple = optsObj ? optsObj.multiple : false;

    const baseSx = {
      cursor: !editing ? 'pointer' : 'default',
      padding: editing ? '4px' : undefined,
      borderLeft: error ? '4px solid rgba(244,67,54,0.6)' : undefined,
      backgroundColor: error ? 'rgba(255,235,238,0.6)' : undefined,
      '&:hover': !editing ? {
        backgroundColor: error ? 'rgba(255, 205, 210, 0.6)' : 'rgba(0, 0, 0, 0.04)'
      } : {}
    };

    // Derive a safe column class from the columnKey to avoid undefined variable errors
    const columnClass = `col-${String(columnKey || '').toLowerCase().replace(/[^a-z0-9]/g, '')}`;

    return (
      <td
        className={`editable-cell ${columnClass} ${error ? 'has-error' : ''}`}
        onClick={() => !editing && setEditing(true)}
      >
        {editing ? (
          options ? (
            <Select
              autoFocus
              fullWidth
              size="small"
              multiple={isMultiple}
              value={editValue || (isMultiple ? [] : "")}
              onChange={(e) => setEditValue(e.target.value)}
              onBlur={() => {
                // For multiple, convert array to comma-separated string before saving
                if (isMultiple && Array.isArray(editValue)) {
                  onUpdate(rowIndex, columnKey, editValue.join(','));
                } else {
                  onUpdate(rowIndex, columnKey, editValue);
                }
                setEditing(false);
              }}
              renderValue={(selected) => {
                if (isMultiple && Array.isArray(selected)) return selected.join(', ');
                return selected;
              }}
              sx={{ margin: '-8px 0' }}
            >
              {options.map((option) => (
                <MenuItem key={option} value={option}>
                  {isMultiple ? (
                    <>
                      <Checkbox checked={Array.isArray(editValue) ? editValue.indexOf(option) > -1 : false} />
                      <ListItemText primary={option} />
                    </>
                  ) : (
                    option
                  )}
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
          value
        )}
      </td>
    );
};

export default function UserListPage() {
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [filters, setFilters] = useState({ name: "", deptHead: '', userType: '', executiveID: '' });
  const [page, setPage] = useState(0);
  const [limit, setRowsPerPage] = useState(10);
  const [totalItems, setTotalItems] = useState(0);
  const [loading, setLoading] = useState(false);
  const [deptHeadOptions, setDeptHeadOptions] = useState([]);
  const [executiveOptions, setExecutiveOptions] = useState([]);

  // Display Preferences dialog state
  const [displayPrefOpen, setDisplayPrefOpen] = useState(false);
  // User struct fields from user.go, customized for display
  const userFields = [
    // Sl No is handled separately in the table
    "User Code",
    "CompanyName",
    "Name", // Salutation + Firstname + Lastname
    "DOB",
    "Gender",
    // Contact Information
    "Country",
    "MobileNumber",
    "EmergencyNumber",
    "AlternateNumber",
    "WhatsappNumber",
    "Email",
    "Website",
  // Permanent Address
    // permanent GSTIN removed per request
    "Address1",
    "Address2",
    "Address3",
    "City",
    "State",
    "Permanent Country",
    "Pincode",
    // Business Information
    "BusinessName",
    "IndustrySegment",
    "Designation",
    "Title",
    // Bank Information
    "BankName",
    "BranchName",
    "BranchAddress",
    "AccountNumber",
    "IFSCCode",
    // Legal Information
    "AadharNumber",
    "PANNumber",
    "GSTIN",
    "MSMENo",
    // Additional Information
    "Additional Address",
    "Additional Bank Info",
    "Uploaded Documents",
    // User Status/Type
    "Active",
    "IsCustomer",
    "IsSupplier",
    "IsDealer",
    "IsDistributor"
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
    const accountTypeFields = ['IsCustomer', 'IsSupplier', 'IsDealer', 'IsDistributor'];
    if (field === 'Account Type') {
      setCheckedFields((prev) => {
        const hasAll = accountTypeFields.every(f => prev.includes(f));
        let updated;
        if (hasAll) {
          updated = prev.filter(f => !accountTypeFields.includes(f));
        } else {
          // add missing account type fields
          const toAdd = accountTypeFields.filter(f => !prev.includes(f));
          updated = [...prev, ...toAdd];
        }
        localStorage.setItem('userListCheckedFields', JSON.stringify(updated));
        return updated;
      });
      return;
    }

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

  // Load department heads on mount
  useEffect(() => {
    let cancelled = false;
    const loadDeptHeads = async () => {
      try {
        const res = await axios.get(`${BASE_URL}/api/departments`, { params: { limit: 1000 } });
        const payload = res.data && (res.data.departments !== undefined ? res.data.departments : res.data);
        const depts = Array.isArray(payload) ? payload : [];
        const headsMap = new Map();
        depts.forEach(d => {
          const head = d.head || d.Head || d.head_user || null;
          if (head && (head.id || head.ID)) {
            const id = head.id || head.ID;
            if (!headsMap.has(String(id))) {
              const code = head.usercode || head.user_code || head.code || '';
              const sal = head.salutation || head.Salutation || '';
              const first = head.firstname || head.Firstname || '';
              const last = head.lastname || head.Lastname || '';
              const name = `${first} ${last}`.trim();
              const label = `${code ? code + ' — ' : ''}${sal ? sal + ' ' : ''}${name || 'Unknown'}`;
              headsMap.set(String(id), { id, label, raw: head, deptId: d.id });
            }
          }
        });
        const heads = Array.from(headsMap.values());
        if (!cancelled) setDeptHeadOptions([{id: '', label: 'All'}, ...heads]);
      } catch (err) {
        console.error('Failed to load dept heads', err);
      }
    };
    loadDeptHeads();
    return () => { cancelled = true; };
  }, []);

  // Load executives when dept head changes
  useEffect(() => {
    let cancelled = false;
    const loadExecutives = async () => {
      if (!filters.deptHead) {
        setExecutiveOptions([]);
        return;
      }
      try {
        // Find the department ID for this head
        const headOption = deptHeadOptions.find(h => String(h.id) === String(filters.deptHead));
        if (!headOption?.deptId) {
          setExecutiveOptions([]);
          return;
        }
        
        // Fetch employees assigned to this department
        const res = await axios.get(`${BASE_URL}/api/departments/${headOption.deptId}/employees`);
        const data = res.data;
        const emps = Array.isArray(data)
          ? data
              .map((rel) => {
                const emp = rel.employee || rel.Employee;
                if (!emp) return null;
                const code = emp.usercode || emp.user_code || emp.code || '';
                const sal = emp.salutation || emp.Salutation || '';
                const first = emp.firstname || emp.Firstname || '';
                const last = emp.lastname || emp.Lastname || '';
                const name = `${first} ${last}`.trim();
                const label = `${code ? code + ' — ' : ''}${sal ? sal + ' ' : ''}${name || 'Unknown'}`;
                return { id: emp.id || emp.ID, label, raw: emp };
              })
              .filter(Boolean)
          : [];
        if (!cancelled) setExecutiveOptions([{id: '', label: 'All'}, ...emps]);
      } catch (err) {
        console.error('Failed to load executives', err);
        if (!cancelled) setExecutiveOptions([]);
      }
    };
    loadExecutives();
    return () => { cancelled = true; };
  }, [filters.deptHead, deptHeadOptions]);

  // Debounced search effect for all filters
  useEffect(() => {
    const handler = setTimeout(() => {
      setPage(0);
      fetchUsers();
    }, 300);
    return () => clearTimeout(handler);
  }, [filters.name, filters.deptHead, filters.userType, filters.executiveID]);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const params = {
        page: page + 1,
        limit,
        filter: filters.name,
        user_type: filters.userType,
      };

      // If executive is selected, filter by that specific executive
      if (filters.executiveID) {
        params.employee_id = filters.executiveID;
      } else if (filters.deptHead) {
        // If only dept head is selected, filter by all employees under that dept head
        params.dept_head = filters.deptHead;
      }

      const res = await axios.get(`${BASE_URL}/api/users`, { params });
      // Support both response shapes:
      // 1) { data: [...], total: N }  (paginated API)
      // 2) [...] (array returned directly)
      const usersPayload = res.data && (res.data.data !== undefined ? res.data.data : res.data);
      const safeUsers = Array.isArray(usersPayload) ? usersPayload : [];
      setUsers(safeUsers);

      // total may be provided by the API, otherwise fallback to length of returned array
      const totalFromApi = res.data && (res.data.total ?? res.data.totalItems ?? null);
      setTotalItems(totalFromApi !== null ? totalFromApi : safeUsers.length);
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

  // Helper: produce a string value for export for a given user and display field
  const getExportValue = (user, field) => {
    if (!user) return '';
    try {
      if (field === 'User Code') return (user.usercode || user.user_code || user.userCode || user.username || user.email || '') + '';
      if (field === 'CompanyName') return user.company_name || user.companyname || '';
      if (field === 'Name') return [user.salutation, user.firstname, user.lastname].filter(Boolean).join(' ')+'';
      if (field === 'DOB') return user.dob ? new Date(user.dob).toLocaleDateString() : '';
      if (field === 'Gender') return user.gender || '';
      if (field === 'Country') {
        const permAddr = user.addresses?.find(a => a.title === 'Permanent');
        // Prefer contact country; if absent, leave blank
        return formatCountryWithCode(user.country, user.country_code) || '';
      }
      if (field === 'MobileNumber') return user.mobile_number || '';
      if (field === 'EmergencyNumber') return user.emergency_number || '';
      if (field === 'AlternateNumber') return user.alternate_number || '';
      if (field === 'WhatsappNumber') return user.whatsapp_number || '';
      if (field === 'Email') return user.email || '';
      if (field === 'Website') return user.website || '';
      if (field === 'BusinessName') return user.business_name || '';
      if (field === 'Title') return user.title || '';
      if (field === 'Designation') return user.designation || '';
      if (field === 'IndustrySegment') return user.industry_segment || '';
      if (field === 'Address1') return (user.addresses?.find(a => a.title === 'Permanent')?.address1 || '') + '';
      if (field === 'Address2') return (user.addresses?.find(a => a.title === 'Permanent')?.address2 || '') + '';
      if (field === 'Address3') return (user.addresses?.find(a => a.title === 'Permanent')?.address3 || '') + '';
      if (field === 'City') return (user.addresses?.find(a => a.title === 'Permanent')?.city || '') + '';
      if (field === 'State') return (user.addresses?.find(a => a.title === 'Permanent')?.state || '') + '';
      if (field === 'Permanent Country') {
        const permAddr = user.addresses?.find(a => a.title === 'Permanent');
        return formatCountryWithCode(user.permanent_country || permAddr?.country, user.permanent_country_code || permAddr?.country_code) || '';
      }
      if (field === 'Pincode') return (user.addresses?.find(a => a.title === 'Permanent')?.pincode || '') + '';
      if (field === 'AadharNumber') return getLegalValue(user, ['aadhaar','aadhar','aadhaar card','aadhar card'], ['aadhar_number','aadhaar'], ['aadhar_number','doc_number']) + '';
      if (field === 'PANNumber') return getLegalValue(user, ['pan','pan card','permanent account number'], ['pan_number','pan'], ['pan_number','doc_number']) + '';
      if (field === 'GSTIN') return getLegalValue(user, ['gstin','gst','goods and services tax'], ['gstin_number','gstin'], ['gstin_number','doc_number']) + '';
      // Permanent GSTIN removed from export
      if (field === 'Uploaded Documents') {
        const docs = user.documents || user.uploaded_documents || [];
        if (!Array.isArray(docs) || docs.length === 0) return '';
        return docs.map(d => {
          const type = d.doc_type || d.type || '';
          const docNo = d.doc_number || d.number || d.doc_no || '';
          const file = d.file_name || d.file_url || d.url || d.file_path || '';
          return `${type}${docNo ? ' No:' + docNo : ''}: ${file}`.trim();
        }).join(' | ');
      }
      if (field === 'MSMENo') return getLegalValue(user, ['msme','micro small medium enterprise'], ['msme_no','msmeno'], ['msme_no','doc_number']) + '';
      if (field === 'BankName') return (user.bank_accounts?.[0]?.bank_name || '') + '';
      if (field === 'BranchName') return (user.bank_accounts?.[0]?.branch_name || '') + '';
      if (field === 'BranchAddress') return (user.bank_accounts?.[0]?.branch_address || '') + '';
      if (field === 'AccountNumber') return (user.bank_accounts?.[0]?.account_number || '') + '';
      if (field === 'IFSCCode') return (user.bank_accounts?.[0]?.ifsc_code || '') + '';
      if (field === 'Active') return user.active ? 'Yes' : 'No';
      if (field === 'Additional Address') {
        if (!Array.isArray(user.addresses) || user.addresses.length === 0) return '';
        return user.addresses.filter(addr => addr.title !== 'Permanent').map(addr => {
          const parts = [];
          if (addr.title) parts.push(`Title: ${addr.title}`);
          if (addr.gstin || addr.gstin_number) parts.push(`GSTIN: ${addr.gstin || addr.gstin_number}`);
          if (addr.address1) parts.push(`Address1: ${addr.address1}`);
          if (addr.address2) parts.push(`Address2: ${addr.address2}`);
          if (addr.address3) parts.push(`Address3: ${addr.address3}`);
          if (addr.city) parts.push(`City: ${addr.city}`);
          if (addr.state) parts.push(`State: ${addr.state}`);
          if (addr.country) parts.push(`Country: ${addr.country}`);
          if (addr.pincode) parts.push(`Pincode: ${addr.pincode}`);
          // additional key values
          const kvs = (addr.keyValues || addr.key_values || addr.key_value || addr.keyvalue) || [];
          if (Array.isArray(kvs) && kvs.length > 0) {
            parts.push('Additional: ' + kvs.map(kv => `${kv.key}:${kv.value}`).join('; '));
          }
          return parts.join(' | ');
        }).join(' \n ');
      }
      if (field === 'Additional Bank Info') {
        if (!Array.isArray(user.bank_accounts) || user.bank_accounts.length <= 1) return '';
        return user.bank_accounts.slice(1).map(bank => {
          const parts = [];
          if (bank.bank_name) parts.push(`Bank: ${bank.bank_name}`);
          if (bank.branch_name) parts.push(`Branch: ${bank.branch_name}`);
          if (bank.branch_address) parts.push(`Address: ${bank.branch_address}`);
          if (bank.account_number) parts.push(`Account: ${bank.account_number}`);
          if (bank.ifsc_code) parts.push(`IFSC: ${bank.ifsc_code}`);
          const kvs = (bank.keyValues || bank.key_values || bank.key_value || bank.keyvalue) || [];
          if (Array.isArray(kvs) && kvs.length > 0) parts.push('Additional: ' + kvs.map(kv => `${kv.key}:${kv.value}`).join('; '));
          return parts.join(' | ');
        }).join(' \n ');
      }
      return '';
    } catch (err) {
      return '';
    }
  };

  // Export users according to current filters, display preferences and selected rows
  const handleExport = async () => {
    setLoading(true);
    try {
      // Fetch all users matching current filters (use totalItems if available)
      const fetchLimit = (totalItems && totalItems > 0) ? totalItems : 10000;
      const res = await axios.get(`${BASE_URL}/api/users`, {
        params: {
          page: 1,
          limit: fetchLimit,
          filter: filters.name,
          dept_head: filters.deptHead,
          user_type: filters.userType,
        },
      });

      const usersPayload = res.data && (res.data.data !== undefined ? res.data.data : res.data);
      const allUsers = Array.isArray(usersPayload) ? usersPayload : [];

      // If rows are selected, limit to those ids; otherwise export all fetched users
      const exportSource = selectedIds.length > 0 ? allUsers.filter(u => selectedIds.includes(u.id)) : allUsers;

      // Build export rows using the same visible/displayed fields and order as the table.
      // The table groups the five account flags into a single "Account Type" column when any
      // of the account flags are visible. Mirror that behavior here so the exported file
      // contains a single "Account Type" column (instead of five separate boolean columns).
      const accountTypeFields = ['IsCustomer', 'IsSupplier', 'IsDealer', 'IsDistributor'];
      const visibleFields = userFields.filter(field => checkedFields.includes(field));
      const showAccountType = visibleFields.some(f => accountTypeFields.includes(f));
      const headerFields = visibleFields.filter(f => !accountTypeFields.includes(f));

      const data = exportSource.map(user => {
        const obj = {};
        // add non-account-type fields in the same order
        headerFields.forEach(field => {
          obj[field] = getExportValue(user, field);
        });

        // add Account Type column if table would show it
        if (showAccountType) {
          const types = [];
          if (user.is_customer || user.IsCustomer || user.isCustomer) types.push('Customer');
          if (user.is_supplier || user.IsSupplier || user.isSupplier) types.push('Supplier');
          if (user.is_dealer || user.IsDealer || user.isDealer) types.push('Dealer');
          if (user.is_distributor || user.IsDistributor || user.isDistributor) types.push('Distributor');
          obj['Account Type'] = types.length > 0 ? types.join(', ') : 'No';
        }

        return obj;
      });

      const ws = XLSX.utils.json_to_sheet(data);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Users');
      XLSX.writeFile(wb, `users_export${selectedIds.length>0? '_selected':''}.xlsx`);
    } catch (err) {
      console.error('Export failed', err);
      setSnackbarMessage('Export failed');
      setSnackbarSeverity('error');
      setSnackbarOpen(true);
    } finally {
      setLoading(false);
    }
  };

  // Helper to normalize various keyValues property names used in different payloads
  const normalizeKeyValues = (obj) => {
    if (!obj) return [];
    return obj.keyValues || obj.key_values || obj.key_value || obj.keyvalue || [];
  };

  // Helper: find a document by a list of type variants (case-insensitive, substring match)
  const findDocumentByTypes = (user, variants = []) => {
    if (!user) return null;
    const docs = user.documents || user.uploaded_documents || [];
    const lowerVariants = variants.map(v => String(v).toLowerCase());
    return docs.find(d => {
      const t = String(d?.doc_type || d?.type || '').toLowerCase();
      return lowerVariants.some(v => v && t.includes(v));
    }) || null;
  };

  // Helper: get a legal value (like aadhar/pan/gstin) preferring top-level fields then document properties
  const getLegalValue = (user, variants = [], topLevelProps = [], docProps = ['doc_number']) => {
    if (!user) return "";
    for (const p of topLevelProps) {
      if (user[p]) return user[p];
    }
    const doc = findDocumentByTypes(user, variants);
    if (doc) {
      for (const dp of docProps) {
        if (doc[dp]) return doc[dp];
      }
    }
    return "";
  };

// Helper: format country and country_code robustly.
// Accepts country which may be a string or an object, and country_code which may be a string or object.
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

  let finalName = name;
  if (!finalName && code) {
    const normalized = String(code).trim();
    // try with plus and without plus if a mapping exists
    if (typeof dialCodeToCountry !== 'undefined' && dialCodeToCountry) {
      finalName = dialCodeToCountry[normalized] || dialCodeToCountry[normalized.replace(/^\+/, '')];
    }
  }

  const codeStr = code ? String(code).trim() : '';
  const codeFormatted = codeStr ? (codeStr.startsWith('+') ? codeStr : ('+' + codeStr.replace(/^\+/, ''))) : '';

  if (finalName && codeFormatted) return `${finalName} ${codeFormatted}`;
  if (finalName) return finalName;
  if (codeFormatted) return codeFormatted;
  return '';
};

// Helper: produce a sensible display name for a user, trying multiple
// possible property names that different API versions might use.
const getUserDisplayName = (u) => {
  if (!u) return '';
  // For business users, prioritize company name
  if (u.company_name || u.companyname) {
    return u.company_name || u.companyname;
  }
  const salutation = u.salutation || u.Salutation || u.title || '';
  const first = u.firstname || u.first_name || u.Firstname || u.FirstName || u.name || u.fullname || u.full_name || '';
  const last = u.lastname || u.last_name || u.Lastname || u.LastName || '';
  const parts = [salutation, first, last].filter(Boolean);
  return parts.join(' ').trim();
};

  // Helper to escape regex special characters
  const escapeRegExp = (string) => {
    return String(string).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  };

  // Highlight occurrences of the current search query inside a string.
  // If value is not a string (JSX or element), return it unchanged.
  const renderHighlighted = (value) => {
    const q = (filters.name || '').trim();
    if (!q) return value;
    if (value === null || value === undefined) return '';
    if (typeof value !== 'string') return value; // don't try to highlight complex JSX

    const escaped = escapeRegExp(q);
    const regex = new RegExp(`(${escaped})`, 'ig');
    const parts = value.split(regex);
    return parts.map((part, i) => {
      if (part.toLowerCase() === q.toLowerCase()) {
        return (
          <span key={i} style={{ backgroundColor: '#fff59d', padding: '0 2px', borderRadius: 2 }}>
            {part}
          </span>
        );
      }
      return part;
    });
  };

  // Add state for view dialog and selected user
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  // Hierarchy dialog state
  const [hierarchyDialogOpen, setHierarchyDialogOpen] = useState(false);
  const [hierarchyParents, setHierarchyParents] = useState([]);
  const [hierarchyChildren, setHierarchyChildren] = useState([]);
  const [hierarchyLoading, setHierarchyLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Delete confirmation state
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState(null);

  const openConfirmDelete = (user) => {
    setUserToDelete(user);
    setConfirmDeleteOpen(true);
  };

  const handleDeleteConfirmed = async () => {
    if (!userToDelete) return;
    try {
      await axios.delete(`${BASE_URL}/api/users/${userToDelete.id}`);
      // Remove from local list to update UI
      setUsers(prev => prev.filter(u => u.id !== userToDelete.id));
      setTotalItems(prev => (typeof prev === 'number' ? Math.max(0, prev - 1) : prev));
      // show success message
      setSnackbarMessage('User deleted successfully');
      setSnackbarSeverity('success');
      setSnackbarOpen(true);
    } catch (err) {
      // Extract a useful error message from server response if present
      const serverMsg = err?.response?.data?.details || err?.response?.data?.error || err?.message || 'Failed to delete user';
      setSnackbarMessage(serverMsg);
      setSnackbarSeverity('error');
      setSnackbarOpen(true);
    } finally {
      setConfirmDeleteOpen(false);
      setUserToDelete(null);
    }
  };

  // Snackbar state for showing messages on-screen
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarSeverity, setSnackbarSeverity] = useState('info');

  const handleSnackbarClose = (event, reason) => {
    if (reason === 'clickaway') return;
    setSnackbarOpen(false);
  };

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

  const _normalizeKey = (k) => String(k || '').toLowerCase().replace(/[^a-z0-9]/g, '');

  const buildFieldErrorMapFromErrors = (errorsArr = [], dataArray = []) => {
    const map = {};
    if (!Array.isArray(errorsArr)) return map;
    errorsArr.forEach((errEntry) => {
      const rowNum = (typeof errEntry.row === 'number') ? (errEntry.row - 1) : null;
      const rowData = (rowNum !== null && Array.isArray(dataArray) && dataArray[rowNum]) ? dataArray[rowNum] : (errEntry.data || {});
      if (rowNum === null) return;
      map[rowNum] = map[rowNum] || {};

      const msgs = Array.isArray(errEntry.errors) ? errEntry.errors : [errEntry.errors].filter(Boolean);
      msgs.forEach((msgRaw) => {
        const msg = String(msgRaw || '');
        const msgL = msg.toLowerCase();
        let matched = false;

        // Try to match message text to any column header key present in the row
        Object.keys(rowData || {}).forEach((colKey) => {
          if (matched) return;
          const nk = _normalizeKey(colKey);
          if (nk && msgL.includes(nk)) {
            map[rowNum][colKey] = map[rowNum][colKey] || [];
            map[rowNum][colKey].push(msg);
            matched = true;
          }
        });

        if (matched) return;

        // Heuristics for common keywords -> column suggestions
        const heuristics = [
          ['bank', ['BankName','BranchName','BranchAddress','AccountNumber','IFSCCode']],
          ['account', ['AccountNumber']],
          ['ifsc', ['IFSCCode']],
          ['email', ['Email']],
          ['mobile', ['MobileNumber']],
          ['aadhar', ['AadharNumber']],
          ['pan', ['PANNumber']],
          ['gst', ['GSTIN']],
          ['name', ['FirstName','LastName','CompanyName']],
          ['country', ['Country','Permanent Country']],
          ['active', ['Active']]
        ];

        for (const [kw, cols] of heuristics) {
          if (msgL.includes(kw)) {
            cols.forEach((c) => {
              // pick the best matching actual key from rowData (case-insensitive)
              const foundKey = Object.keys(rowData || {}).find(rk => _normalizeKey(rk) === _normalizeKey(c))
                || Object.keys(rowData || {}).find(rk => _normalizeKey(rk).includes(_normalizeKey(c)));
              if (foundKey) {
                map[rowNum][foundKey] = map[rowNum][foundKey] || [];
                map[rowNum][foundKey].push(msg);
              }
            });
            matched = true;
            break;
          }
        }

        if (!matched) {
          // Fallback: assign the message to all columns in that row so user sees something highlighted
          Object.keys(rowData || {}).forEach((colKey) => {
            map[rowNum][colKey] = map[rowNum][colKey] || [];
            map[rowNum][colKey].push(msg);
          });
        }
      });
    });
    return map;
  };

  const handleToggleSelectAll = (e) => {
    const checked = e.target.checked;
    if (checked) setSelectedIds(users.map(u => u.id));
    else setSelectedIds([]);
  };

  const handleToggleSelect = (id) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  };

  // Download template Excel for user import
  const downloadTemplateCSV = async () => {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('User Import Template');

    // Use the exact field list requested by the user (order matters for import)
    const headersArr = [
      'User Code',
      'Salutation *',
      'FirstName *',
      'LastName',
      'DOB',
      'Gender *',
      'Country *',
      'MobileNumber *',
      'Email *',
      'EmergencyNumber',
      'AlternateNumber',
      'WhatsappNumber',
      'Website',
      'Address1',
      'Address2',
      'Address3',
      'City *',
      'State *',
      'Permanent Country *',
      'Pincode',
      'BusinessName',
      'CompanyName',
      'IndustrySegment',
      'Designation',
      'Title',
      'BankName',
      'BranchName',
      'BranchAddress',
      'AccountNumber',
      'IFSCCode',
      'AadharNumber',
      'PANNumber',
      'GSTIN',
      'MSMENo',
      'Additional Address',
      'Additional Bank Info',
      'Active *',
      'Account Type *'
    ];

    // Add headers
    worksheet.addRow(headersArr);

    // Example row (values are illustrative). Account Type may be a comma-separated list like "Customer,Dealer"
    const exampleRowArr = [
      'USR001',
      'Mr',
      'John',
      'Doe',
      '1990-01-15',
      'Male',
      'India (+91)',
      '9876543210',
      'john.doe@example.com',
      '9876543211',
      '',
      '9876543210',
      'https://example.com',
      '123 Main St',
      'Apt 4B',
      'Near Park',
      'Mumbai',
      'Maharashtra',
      'India (+91)',
      '400001',
      'Acme Trading',
      'Acme Pvt Ltd',
      'Manufacturing',
      'Manager',
      'Mr',
      'HDFC Bank',
      'Andheri Branch',
      'Andheri West',
      '1234567890',
      'HDFC0001234',
      '123456789012',
      'ABCDE1234F',
      '27ABCDE1234F1Z5',
      'MSME12345',
      'Title: Alt address title|GSTIN:XXXXX|Address1:Somewhere|Additional: CustomField:Value; AnotherField:AnotherValue',
      'Bank: ICICI|Branch: Andheri|Account: 0987654321|Additional: BankType:Savings; Priority:High',
      'Yes',
      'Customer,Dealer'
    ];

    // Add example row
    worksheet.addRow(exampleRowArr);

    // Add 10 empty rows for user input
    for (let i = 0; i < 10; i++) {
      worksheet.addRow(new Array(headersArr.length).fill(''));
    }

    // Create a hidden sheet to host list values and avoid long inline validation strings
    const listsSheet = workbook.addWorksheet('Lists');

    const salutations = ['Mr','Mrs','Ms','Miss','Dr','Prof','Mx'];
    const genders = ['Male','Female','Other','Prefer not to say'];
    const activeOptions = ['Yes','No'];
    const accountTypes = ['Customer','Supplier','Dealer','Distributor'];

    // Build countries list from imported countriesData if IMPORT_COUNTRY_OPTIONS isn't present
    const countries = (typeof IMPORT_COUNTRY_OPTIONS !== 'undefined' && Array.isArray(IMPORT_COUNTRY_OPTIONS) && IMPORT_COUNTRY_OPTIONS.length > 0)
      ? IMPORT_COUNTRY_OPTIONS
      : (Array.isArray(countriesData) ? countriesData.map(c => `${c.name} (${c.code})`) : []);

    // Write lists into the Lists sheet (each list in its own column)
    // For template download we do NOT include IndustrySegment dropdown (large list)
    const lists = [salutations, genders, countries, activeOptions, accountTypes];
    lists.forEach((arr, colIdx) => {
      for (let i = 0; i < arr.length; i++) {
        listsSheet.getCell(i + 1, colIdx + 1).value = arr[i];
      }
    });

    // Optionally hide the Lists sheet so end-users don't see it
    listsSheet.state = 'veryHidden';

    // Map which lists column corresponds to which data column in the template
    // Lists sheet columns for template: A=salutation, B=gender, C=country, D=active, E=accountTypes
    const validationMap = {
      2: { sheetCol: 'A', length: salutations.length },
      6: { sheetCol: 'B', length: genders.length },
      7: { sheetCol: 'C', length: countries.length },
      19: { sheetCol: 'C', length: countries.length },
      37: { sheetCol: 'D', length: activeOptions.length },
      38: { sheetCol: 'E', length: accountTypes.length }
    };

    // Apply data validation referring to the Lists sheet range for rows 2..1000
    Object.keys(validationMap).forEach(targetColStr => {
      const targetCol = parseInt(targetColStr, 10);
      const { sheetCol, length } = validationMap[targetCol];
      if (!sheetCol || !length) return;
      const rangeRef = `=Lists!$${sheetCol}$1:$${sheetCol}$${length}`;
      worksheet.getColumn(targetCol).eachCell((cell, rowNumber) => {
        if (rowNumber > 1) {
          cell.dataValidation = {
            type: 'list',
            allowBlank: true,
            showInputMessage: true,
            formulae: [rangeRef]
          };
          cell.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FFF7F7F7' }
          };
        }
      });
    });

    // Generate buffer
    const buffer = await workbook.xlsx.writeBuffer();

    // Create blob and download link
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', 'user_import_template.xlsx');
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

          // Parse headers (support comma or semicolon delimiters)
          const delimiter = lines[0].includes(';') ? ';' : ',';
          const headers = lines[0].split(delimiter).map(h => h.trim().replace(/^"|"$/g, '').replace(/""/g, '"'));
          const dataRows = lines.slice(1);

          console.log('Headers:', headers);
          console.log('Data rows:', dataRows.length);

          // Validate required headers (Name, MobileNumber, Email, Active required)
          const headersNormalized = headers.map(h => String(h).toLowerCase().replace(/[^a-z0-9]/g, ''));
          const requiredNormalized = ['firstname', 'lastname', 'mobilenumber', 'email', 'active'];
          const missingNormalized = requiredNormalized.filter(r => !headersNormalized.includes(r));

          if (missingNormalized.length > 0) {
            const missingHuman = missingNormalized.map(m => {
              // map back to friendly label
              if (m === 'firstname') return 'FirstName';
              if (m === 'lastname') return 'LastName';
              if (m === 'mobilenumber') return 'MobileNumber';
              if (m === 'msmeno') return 'MSMENo';
              return m.charAt(0).toUpperCase() + m.slice(1);
            });
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

          // Filter out completely empty rows
          const filteredObjectData = objectData.filter(row => {
            return Object.values(row).some(value => value && value.toString().trim() !== '');
          });

          if (filteredObjectData.length === 0) {
            alert('The CSV file has headers but no valid data rows.');
            setImportLoading(false);
            return;
          }

          // Ensure there is a Country column in the preview. If CSV didn't include it,
          // add a `Country` field (default to India) so preview and edit UI show it.
          const headersHaveCountry = headersNormalized.includes('country') || headersNormalized.includes('permanentcountry');
          if (!headersHaveCountry) {
            filteredObjectData.forEach(r => { r['Country'] = 'India (+91)'; });
          }

          // Ensure there is a distinct 'Permanent Country' column next to Pincode.
          const hasPermanentCountry = headersNormalized.includes('permanentcountry');
          if (!hasPermanentCountry) {
            filteredObjectData.forEach(r => {
              const newObj = {};
              const keys = Object.keys(r);
              let inserted = false;
              keys.forEach(k => {
                newObj[k] = r[k];
                const clean = String(k).replace(/\s*\*\s*$/g, '').toLowerCase();
                if (!inserted && clean === 'pincode') {
                  newObj['Permanent Country'] = r['Permanent Country'] || 'India (+91)';
                  inserted = true;
                }
              });
              if (!inserted) newObj['Permanent Country'] = r['Permanent Country'] || 'India (+91)';
              // replace original object's keys to preserve reference used elsewhere
              Object.keys(r).forEach(k => delete r[k]);
              Object.assign(r, newObj);
            });
          }

          // Store the parsed data, select all rows by default, and open the preview dialog
          setImportedData(filteredObjectData);
          const allIdx = new Set(filteredObjectData.map((_, i) => i));
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
    // User Code is optional; validate the essential fields only
    const requiredFields = ['Salutation', 'FirstName', 'Gender','Country', 'MobileNumber', 'Email', 'City', 'State', 'Active', 'Account Type'];

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
      if (emailValue && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(emailValue).trim())) {
        rowErrors.push('Email must be in valid format');
      }

      // Validate mobile number (allow digits, may include country code; require at least 7-15 digits)
      const mobileValue = getFieldValue('MobileNumber') || getFieldValue('Mobile Number') || getFieldValue('Mobile');
      if (mobileValue) {
        const digits = String(mobileValue).replace(/\D/g, '');
        if (digits.length < 7 || digits.length > 15) {
          rowErrors.push('MobileNumber must be a valid phone number (7-15 digits)');
        }
      }

      // Validate Active field (accept common variants: Active/Inactive, true/false, yes/no, 1/0)
      const activeValue = getFieldValue('Active');
      if (activeValue && String(activeValue).trim() !== '') {
        const av = String(activeValue).toLowerCase().trim();
        const allowed = ['yes', 'no', 'true', 'false', 'active', 'inactive', '1', '0'];
        if (!allowed.includes(av)) {
          rowErrors.push('Active must be one of: yes/no/true/false/active/inactive/1/0');
        }
      }

      // Validate Account Type if present (should be comma separated values from allowed set)
      const accountTypeVal = getFieldValue('Account Type') || getFieldValue('AccountType') || getFieldValue('Account');
      if (accountTypeVal && String(accountTypeVal).trim() !== '') {
        const types = String(accountTypeVal).split(',').map(t => t.trim().toLowerCase()).filter(Boolean);
        const allowedTypes = ['customer', 'supplier', 'dealer', 'distributor', 'user'];
        const invalid = types.filter(t => !allowedTypes.includes(t));
        if (invalid.length > 0) {
          rowErrors.push(`Account Type contains invalid values: ${invalid.join(', ')}`);
        }
      }

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
        // mark field-level errors for the preview table so cells are highlighted
        setImportFieldErrors(buildFieldErrorMapFromErrors(validationErrors, selectedArray));

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

      // Normalize field names and map to backend DTO keys
      const normalizedArray = selectedArray.map(row => {
        const normalizedRow = {};
        Object.keys(row).forEach(key => {
          const normalizedKey = key.replace(/\s*\*\s*/g, '').trim();
          normalizedRow[normalizedKey] = row[key];
        });
        // Normalize country code values (add + when reasonable)
        const ccKeys = ['Country', 'Permanent Country', 'Country Code', 'country_code'];
        for (const k of ccKeys) {
          if (normalizedRow[k] !== undefined && normalizedRow[k] !== null) {
            let cc = String(normalizedRow[k]).trim();
            if (cc !== '' && /^\d+$/.test(cc) && !cc.startsWith('+')) {
              normalizedRow[k] = '+' + cc;
            }
          }
        }
        return normalizedRow;
      });

      // Map human-friendly headers to backend expected keys
      const payloadArray = normalizedArray.map(row => {
        // Helper to read variants
        const get = (names) => {
          for (const n of names) {
            if (row[n] !== undefined && row[n] !== null) return String(row[n]).trim();
          }
          return undefined;
        };

        const payload = {};

        const userCode = get(['User Code', 'UserCode', 'user code', 'usercode', 'user_code']);
        if (userCode) { payload.usercode = userCode; payload.user_code = userCode; }

        const companyName = get(['CompanyName', 'Company Name', 'companyname']);
        if (companyName) payload.company_name = companyName;

        const salutation = get(['Salutation']);
        if (salutation) payload.salutation = salutation;

        const firstname = get(['FirstName', 'First Name']);
        if (firstname) payload.firstname = firstname;

        const lastname = get(['LastName', 'Last Name']);
        if (lastname) payload.lastname = lastname;

        const dob = get(['DOB', 'Date of Birth', 'dob']);
        if (dob) payload.dob = dob;
        const gender = get(['Gender']); if (gender) payload.gender = gender;

        const country = get(['Country']); if (country) payload.country = country;
        const mobile = get(['MobileNumber', 'Mobile Number', 'mobile', 'mobile_number']); if (mobile) payload.mobile_number = mobile;
        const emergency = get(['EmergencyNumber', 'Emergency Number']); if (emergency) payload.emergency_number = emergency;
        const alternate = get(['AlternateNumber', 'Alternate Number']); if (alternate) payload.alternate_number = alternate;
        const whatsapp = get(['WhatsappNumber', 'WhatsApp Number']); if (whatsapp) payload.whatsapp_number = whatsapp;
        const email = get(['Email']); if (email) payload.email = email;
        const website = get(['Website']); if (website) payload.website = website;

        // Permanent GSTIN removed from import payload
        const addr1 = get(['Address1', 'Address 1']); if (addr1) payload.permanent_address1 = addr1;
        const addr2 = get(['Address2', 'Address 2']); if (addr2) payload.permanent_address2 = addr2;
        const addr3 = get(['Address3', 'Address 3']); if (addr3) payload.permanent_address3 = addr3;
        const city = get(['City']); if (city) payload.permanent_city = city;
        const state = get(['State']); if (state) payload.permanent_state = state;
        const pCountry = get(['Permanent Country', 'PermanentCountry', 'Country']); if (pCountry) payload.permanent_country = pCountry;
        const pincode = get(['Pincode']); if (pincode) payload.permanent_pincode = pincode;

        const business = get(['BusinessName', 'Business Name']); if (business) payload.business_name = business;
        const industry = get(['IndustrySegment', 'Industry Segment']); if (industry) payload.industry_segment = industry;
        const designation = get(['Designation']); if (designation) payload.designation = designation;
        const title = get(['Title']); if (title) payload.title = title;

        // Bank info -> primary bank account
        const bankName = get(['BankName', 'Bank Name']); if (bankName) payload.primary_bank_name = bankName;
        const branchName = get(['BranchName', 'Branch Name']); if (branchName) payload.primary_branch_name = branchName;
        const branchAddr = get(['BranchAddress', 'Branch Address']); if (branchAddr) payload.primary_branch_address = branchAddr;
        const accNo = get(['AccountNumber', 'Account Number']); if (accNo) payload.primary_account_number = accNo;
        const ifsc = get(['IFSCCode', 'IFSC Code']); if (ifsc) payload.primary_ifsc_code = ifsc;

        const aadhar = get(['AadharNumber', 'Aadhar Number']); if (aadhar) payload.aadhar_number = aadhar;
        const pan = get(['PANNumber', 'PAN Number']); if (pan) payload.pan_number = pan;
        const gstin = get(['GSTIN']); if (gstin) payload.gstin_number = gstin;
        const msme = get(['MSMENo', 'MSME No']); if (msme) payload.msme_no = msme;

        // Handle Additional Address - parse and add to addresses array
        const additionalAddr = get(['Additional Address']);
        if (additionalAddr) {
          // Try to parse as JSON first, otherwise parse pipe-separated format from export
          try {
            const parsedAddr = JSON.parse(additionalAddr);
            if (Array.isArray(parsedAddr)) {
              payload.addresses = parsedAddr.map(addr => ({
                title: addr.title || addr.Title || 'Additional',
                address1: addr.address1 || addr.Address1,
                address2: addr.address2 || addr.Address2,
                address3: addr.address3 || addr.Address3,
                city: addr.city || addr.City,
                state: addr.state || addr.State,
                country: addr.country || addr.Country,
                pincode: addr.pincode || addr.Pincode,
                gstin: addr.gstin || addr.GSTIN
              }));
            } else {
              // Single address object
              payload.addresses = [{
                title: parsedAddr.title || parsedAddr.Title || 'Additional',
                address1: parsedAddr.address1 || parsedAddr.Address1,
                address2: parsedAddr.address2 || parsedAddr.Address2,
                address3: parsedAddr.address3 || parsedAddr.Address3,
                city: parsedAddr.city || parsedAddr.City,
                state: parsedAddr.state || parsedAddr.State,
                country: parsedAddr.country || parsedAddr.Country,
                pincode: parsedAddr.pincode || parsedAddr.Pincode,
                gstin: parsedAddr.gstin || parsedAddr.GSTIN
              }];
            }
          } catch (e) {
            // Parse pipe-separated format from export: "Title: value|GSTIN: value|Address1: value"
            // Multiple addresses separated by newlines
            const addressStrings = additionalAddr.split('\n').filter(s => s.trim());
            payload.addresses = addressStrings.map(addrStr => {
              const addrObj = {};
              const parts = addrStr.split('|').map(p => p.trim());
              parts.forEach(part => {
                if (part.includes(':')) {
                  const [key, ...valueParts] = part.split(':');
                  const value = valueParts.join(':').trim();
                  const normalizedKey = key.trim().toLowerCase();
                  if (normalizedKey === 'title') addrObj.title = value;
                  else if (normalizedKey === 'gstin') addrObj.gstin = value;
                  else if (normalizedKey === 'address1') addrObj.address1 = value;
                  else if (normalizedKey === 'address2') addrObj.address2 = value;
                  else if (normalizedKey === 'address3') addrObj.address3 = value;
                  else if (normalizedKey === 'city') addrObj.city = value;
                  else if (normalizedKey === 'state') addrObj.state = value;
                  else if (normalizedKey === 'country') addrObj.country = value;
                  else if (normalizedKey === 'pincode') addrObj.pincode = value;
                  else if (normalizedKey === 'additional') {
                    // Parse additional key-value pairs like "key1:value1; key2:value2"
                    const kvPairs = value.split(';').map(kv => kv.trim());
                    addrObj.keyValues = kvPairs.map(kv => {
                      const [k, ...vParts] = kv.split(':');
                      return { key: k.trim(), value: vParts.join(':').trim() };
                    }).filter(kv => kv.key);
                  }
                } else {
                  // If no ':', treat as title (for backward compatibility)
                  if (!addrObj.title) addrObj.title = part;
                }
              });
              // Set default title if not provided
              if (!addrObj.title) addrObj.title = 'Additional';
              return addrObj;
            });
          }
        }

        // Handle Additional Bank Info - parse and create additional bank accounts
        const additionalBank = get(['Additional Bank Info']);
        if (additionalBank) {
          // Parse pipe-separated format from export: "Bank: ICICI|Branch: Andheri|Account: 0987654321"
          // Multiple banks separated by newlines
          const bankStrings = additionalBank.split('\n').filter(s => s.trim());
          const additionalBanks = bankStrings.map(bankStr => {
            const bankObj = {};
            const parts = bankStr.split('|').map(p => p.trim());
            parts.forEach(part => {
              const [key, ...valueParts] = part.split(':');
              const value = valueParts.join(':').trim();
              const normalizedKey = key.trim().toLowerCase();
              if (normalizedKey === 'bank') bankObj.bank_name = value;
              else if (normalizedKey === 'branch') bankObj.branch_name = value;
              else if (normalizedKey === 'address') bankObj.branch_address = value;
              else if (normalizedKey === 'account') bankObj.account_number = value;
              else if (normalizedKey === 'ifsc') bankObj.ifsc_code = value;
              else if (normalizedKey === 'additional') {
                // Parse additional key-value pairs like "key1:value1; key2:value2"
                const kvPairs = value.split(';').map(kv => kv.trim());
                bankObj.keyValues = kvPairs.map(kv => {
                  const [k, ...vParts] = kv.split(':');
                  return { key: k.trim(), value: vParts.join(':').trim() };
                }).filter(kv => kv.key);
              }
            });
            return bankObj;
          }).filter(bank => Object.keys(bank).length > 0);

          if (additionalBanks.length > 0) {
            // Send as additional bank accounts
            payload.bank_accounts = additionalBanks;
          }
        }

        const activeRaw = get(['Active']);
        if (activeRaw !== undefined) {
          const av = String(activeRaw).toLowerCase().trim();
          payload.active = ['yes','true','active','1'].includes(av);
        }

        // Account Type can be comma-separated values; map to boolean flags
        const acctRaw = get(['Account Type', 'AccountType']);
        if (acctRaw) {
          const types = String(acctRaw).split(',').map(t => t.trim().toLowerCase());
          payload.is_customer = types.includes('customer');
          payload.is_supplier = types.includes('supplier');
          payload.is_dealer = types.includes('dealer');
          payload.is_distributor = types.includes('distributor');
        }

        return payload;
      });

      console.log('Sending import data:', payloadArray);

      const response = await axios.post(`${BASE_URL}/api/users/import`, payloadArray, {
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
              userName: rowData['Name'] || (rowData['First Name'] ? ((rowData['First Name'] || '') + ' ' + (rowData['Last Name'] || '')) : 'N/A'),
              userCode: rowData['User Code'] || rowData.usercode || 'N/A',
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
        setFilters({ name: "", deptHead: '', userType: '' });
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

      // Mark field-level errors for preview (if any)
      const selectedDataForPreview = importedData.filter((_, idx) => importSelectedRows.has(idx));
      setImportFieldErrors(buildFieldErrorMapFromErrors(detailedErrors, selectedDataForPreview));

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

  // Helper to provide sensible minimum widths for table columns so the table
  // reserves space and columns expand based on their content.
  const getMinWidth = (field) => {
    const wide = ['Uploaded Documents', 'Additional Address', 'Additional Bank Info'];
    const medium = ['Address1', 'Address2', 'Address3', 'BusinessName', 'CompanyName', 'Email', 'Website', 'Title', 'Designation', 'IndustrySegment'];
    const small = ['User Code', 'S.No', 'Name', 'DOB', 'Gender', 'Country', 'MobileNumber', 'EmergencyNumber', 'AlternateNumber', 'WhatsappNumber', 'Pincode', 'City', 'State'];
    if (wide.includes(field)) return 300;
    if (medium.includes(field)) return 200;
    if (small.includes(field)) return 120;
    return 160;
  };

  return (
    <Box p={1} mt={2}>
      <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
        <Typography variant="h5">User Master</Typography>
        <div className="header-search" style={{ width: 400 }}>
          <input
            className="search-input"
            type="text"
            placeholder="Search"
            value={filters.name}
            onChange={(e) => setFilters({ ...filters, name: e.target.value })}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            aria-label="Search"
          />
          <button className="search-btn" type="button" onClick={handleSearch} aria-label="search">
            🔍
          </button>
        </div>
      </Box>

      <Paper sx={{ p: 1, mb: 2 }}>
        <Box display="flex" alignItems="center" width="100%">
           
           {/* DEPT HEAD DROPDOWN */}
          {/* <Box flex={0.5} sx={{ mr: 1 }}>
            <Autocomplete
              size="small"
              options={deptHeadOptions}
              getOptionLabel={(option) => option.label || ''}
              value={deptHeadOptions.find(h => h.id === filters.deptHead) || null}
              onChange={(event, newValue) => {
                setFilters({ ...filters, deptHead: newValue ? newValue.id : '', executiveID: '' });
              }}
              renderInput={(params) => <TextField {...params} label="Dept Head" />}
              isOptionEqualToValue={(option, value) => option.id === value.id}
            />
          </Box> */}

           {/* SELECT EXECUTIVE DROPDOWN */}
          {/* <Box flex={0.4} sx={{ mr: 1 }}>
            <Autocomplete
              size="small"
              options={executiveOptions}
              getOptionLabel={(option) => option.label || ''}
              value={executiveOptions.find(ex => ex.id === filters.executiveID) || null}
              onChange={(event, newValue) => {
                setFilters({ ...filters, executiveID: newValue ? newValue.id : '' });
              }}
              renderInput={(params) => <TextField {...params} label="Select Executive" />}
              isOptionEqualToValue={(option, value) => option.id === value.id}
              disabled={!filters.deptHead}
            />
          </Box> */}

          {/* USER TYPE DROPDOWN */}
          <Box flex={0.3}>
            <FormControl fullWidth size="small">
              <InputLabel>Account Type</InputLabel>
              <Select
                value={filters.userType}
                label="Account Type"
                onChange={(e) => setFilters({ ...filters, userType: e.target.value })}
              >
                <MenuItem value="">All</MenuItem>
                <MenuItem value="customer">Customer</MenuItem>
                <MenuItem value="supplier">Supplier</MenuItem>
                <MenuItem value="dealer">Dealer</MenuItem>
                <MenuItem value="distributor">Distributor</MenuItem>
              </Select>
            </FormControl>
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
            <IconButton sx={{ mx: 2 }} aria-label="export" onClick={handleExport}>
              <FileUpload />
            </IconButton>
          </Tooltip>

          <button
            type="button"
            className="btn btn-primary"
            onClick={() => window.open(`${window.location.origin}/users/add`, '_blank', 'noopener,noreferrer')}
            style={{ marginLeft: 'auto' }}
            aria-label="Add User"
          >
            + Add User
          </button>
        </Box>
      </Paper>

      <Paper>
        {loading ? (
          <div className="loading-container">
            <CircularProgress size={40} />
          </div>
        ) : users.length === 0 ? (
          <div className="empty-container">
            <Typography variant="body1">No users found.</Typography>
          </div>
        ) : (
          <div className="user-table-wrapper">
            <table className="user-table">
              <thead>
                <tr>
                  <th className="checkbox-col">
                    <input
                      type="checkbox"
                      checked={users.length > 0 && selectedIds.length === users.length}
                      onChange={handleToggleSelectAll}
                      aria-label="Select all users"
                    />
                  </th>
                  <th className="sno-col">S.No</th>
                  {(() => {
                    const visibleFields = userFields.filter(field => checkedFields.includes(field));
                    const accountTypeFields = ['IsCustomer', 'IsSupplier', 'IsDealer', 'IsDistributor'];
                    const showAccountType = visibleFields.some(f => accountTypeFields.includes(f));
                    const headerFields = visibleFields.filter(f => !accountTypeFields.includes(f));
                    return (
                      <>
                        {headerFields.map((field) => {
                          const colClass = `col-${_normalizeKey(field)}`;
                          return <th key={field} className={`data-col ${colClass}`}>{field}</th>;
                        })}
                        {showAccountType && (
                          <th key="AccountType" className={`data-col col-accounttype`}>Account Type</th>
                        )} 
                      </>
                    );
                  })()}
                  {checkedFields.length > 0 && (
                    <th className="actions-col">Actions</th>
                  )}
                </tr>
              </thead>
              <tbody>
                {users.map((user, index) => (
                  <tr
                    key={user.id}
                    className={`user-row ${selectedIds.includes(user.id) ? 'selected' : ''}`}
                    onClick={() => { setSelectedUser(user); setViewDialogOpen(true); }}
                  >
                    <td className="checkbox-col">
                      <input
                        type="checkbox"
                        checked={selectedIds.includes(user.id)}
                        onChange={() => handleToggleSelect(user.id)}
                        onClick={(e) => e.stopPropagation()}
                        aria-label={`Select ${user.firstname}`}
                      />
                    </td>
                    <td className="sno-col">{page * limit + index + 1}</td>
                    {(() => {
                      const visibleFields = userFields.filter(field => checkedFields.includes(field));
                      const accountTypeFields = ['IsCustomer', 'IsSupplier', 'IsDealer', 'IsDistributor'];
                      const showAccountType = visibleFields.some(f => accountTypeFields.includes(f));
                      const headerFields = visibleFields.filter(f => !accountTypeFields.includes(f));
                      return (
                        <>
                          {headerFields.map((field, hfIndex) => (
                            <td
                              key={`${field}-${hfIndex}`}
                              className={`data-col col-${_normalizeKey(field)}`}
                            >
                              {renderHighlighted(
                                field === 'User Code'
                                ? (user.usercode || user.user_code || user.userCode || user.username || user.email || '')
                                : field === 'Name'
                                ? [user.salutation, user.firstname, user.lastname].filter(Boolean).join(' ')
                                : field === 'DOB'
                                ? user.dob ? new Date(user.dob).toLocaleDateString() : ''
                                : field === 'Gender'
                                ? user.gender
                                : field === 'Country'
                                ? (() => {
                                    // Contact country (top-level contact fields)
                                    return formatCountryWithCode(user.country, user.country_code) || '';
                                  })()
                                : field === 'MobileNumber'
                                ? user.mobile_number
                                : field === 'EmergencyNumber'
                                ? user.emergency_number
                                : field === 'AlternateNumber'
                                ? user.alternate_number
                                : field === 'WhatsappNumber'
                                ? user.whatsapp_number
                                : field === 'Email'
                                ? user.email
                                : field === 'Website'
                                ? user.website
                                : field === 'BusinessName'
                                ? user.business_name
                                : field === 'Title'
                                ? user.title
                                : field === 'CompanyName'
                                ? user.company_name
                                : field === 'Designation'
                                ? user.designation
                                : field === 'IndustrySegment'
                                ? user.industry_segment
                                : field === 'Address1'
                                ? (user.addresses?.find(a => a.title === 'Permanent')?.address1 || '')
                                : field === 'Address2'
                                ? (user.addresses?.find(a => a.title === 'Permanent')?.address2 || '')
                                : field === 'Address3'
                                ? (user.addresses?.find(a => a.title === 'Permanent')?.address3 || '')
                                : field === 'City'
                                ? (user.addresses?.find(a => a.title === 'Permanent')?.city || '')
                                : field === 'State'
                                ? (user.addresses?.find(a => a.title === 'Permanent')?.state || '')
                                : field === 'Permanent Country'
                                ? (() => {
                                    const permAddr = user.addresses?.find(a => a.title === 'Permanent');
                                    return formatCountryWithCode(user.permanent_country || permAddr?.country, user.permanent_country_code || permAddr?.country_code) || '';
                                  })()
                                : field === 'Pincode'
                                ? (user.addresses?.find(a => a.title === 'Permanent')?.pincode || '')
                                : field === 'AadharNumber'
                                ? getLegalValue(user, ['aadhaar','aadhar','aadhaar card','aadhar card'], ['aadhar_number','aadhaar'], ['aadhar_number','doc_number'])
                                : field === 'PANNumber'
                                ? getLegalValue(user, ['pan','pan card','permanent account number'], ['pan_number','pan'], ['pan_number','doc_number'])
                                : field === 'GSTIN'
                                ? getLegalValue(user, ['gstin','gst','goods and services tax'], ['gstin_number','gstin'], ['gstin_number','doc_number'])
                                : field === 'Uploaded Documents'
                                ? (() => {
                                    const docs = user.documents || user.uploaded_documents || [];
                                    if (!Array.isArray(docs) || docs.length === 0) return '';
                                    return docs.map((d, idx) => {
                                      const type = d.doc_type || d.type || '';
                                      const docNo = d.doc_number || d.number || d.doc_no || '';
                                      const rawUrl = d.file_url || d.url || d.file_path || d.file || d.filePath || d.path || null;
                                      const fileName = d.file_name || d.fileName || d.name || (rawUrl ? String(rawUrl).split('/').pop() : '');
                                      const url = rawUrl ? (String(rawUrl).startsWith('http') ? rawUrl : `${BASE_URL.replace(/\/$/, '')}/${String(rawUrl).replace(/^\.\//, '').replace(/^\/+/, '')}`) : null;
                                      return (
                                        <div key={idx} style={{ marginBottom: 8 }}>
                                          <div><b>Type:</b> {type}{docNo ? (<span style={{ marginLeft: 8 }}><b>No:</b> {docNo}</span>) : null}</div>
                                          <div>
                                            {url ? (
                                              <a
                                                href={url}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                onClick={(e) => { e.stopPropagation(); }}
                                                title="Open document in new tab"
                                              >
                                                {fileName || rawUrl}
                                              </a>
                                            ) : (
                                              <span style={{ whiteSpace: 'pre-wrap' }}>{fileName || rawUrl || ''}</span>
                                            )}
                                          </div>
                                        </div>
                                      );
                                    });
                                  })()
                                : field === 'MSMENo'
                                ? getLegalValue(user, ['msme','micro small medium enterprise'], ['msme_no','msmeno'], ['msme_no','doc_number'])
                                : field === 'BankName'
                                ? (user.bank_accounts?.[0]?.bank_name || '')
                                : field === 'BranchName'
                                ? (user.bank_accounts?.[0]?.branch_name || '')
                                : field === 'BranchAddress'
                                ? (user.bank_accounts?.[0]?.branch_address || '')
                                : field === 'AccountNumber'
                                ? (user.bank_accounts?.[0]?.account_number || '')
                                : field === 'IFSCCode'
                                ? (user.bank_accounts?.[0]?.ifsc_code || '')
                                : field === 'Active'
                                ? user.active ? 'Yes' : 'No'
                                : field === 'Additional Address'
                                ? (
                                    Array.isArray(user.addresses) && user.addresses.length > 0
                                      ? user.addresses.filter(addr => addr.title !== 'Permanent').map((addr, idx) => (
                                          <div key={idx} style={{ marginBottom: 8 }}>
                                            <div><b>Title:</b> {addr.title}</div>
                                            {(addr.gstin || addr.gstin_number) && <div><b>GSTIN:</b> {addr.gstin || addr.gstin_number}</div>}
                                            {addr.address1 && <div><b>Address1:</b> {addr.address1}</div>}
                                            {addr.address2 && <div><b>Address2:</b> {addr.address2}</div>}
                                            {addr.address3 && <div><b>Address3:</b> {addr.address3}</div>}
                                            {addr.city && <div><b>City:</b> {addr.city}</div>}
                                            {addr.state && <div><b>State:</b> {addr.state}</div>}
                                            {addr.country && <div><b>Country:</b> {addr.country}</div>}
                                            {addr.pincode && <div><b>Pincode:</b> {addr.pincode}</div>}
                                            {(Array.isArray(addr.keyValues || addr.key_values || addr.key_value || addr.keyvalue) && (addr.keyValues || addr.key_values || addr.key_value || addr.keyvalue).length > 0) && (
                                              <div style={{ marginTop: 6 }}>
                                                <b>Additional Info:</b>
                                                <div>
                                                  {(addr.keyValues || addr.key_values || addr.key_value || addr.keyvalue).map((kv, kidx) => (
                                                    <div key={kidx}><small>{kv.key}: {kv.value}</small></div>
                                                  ))}
                                                </div>
                                              </div>
                                            )}
                                          </div>
                                        ))
                                      : ''
                                  )
                                : field === 'Additional Bank Info'
                                ? (
                                    Array.isArray(user.bank_accounts) && user.bank_accounts.length > 1
                                      ? user.bank_accounts.slice(1).map((bank, idx) => (
                                          <div key={idx} style={{ marginBottom: 8 }}>
                                            {bank.bank_name && <div><b>Bank:</b> {bank.bank_name}</div>}
                                            {bank.branch_name && <div><b>Branch:</b> {bank.branch_name}</div>}
                                            {bank.branch_address && <div><b>Address:</b> {bank.branch_address}</div>}
                                            {bank.account_number && <div><b>Account:</b> {bank.account_number}</div>}
                                            {bank.ifsc_code && <div><b>IFSC:</b> {bank.ifsc_code}</div>}
                                            {(Array.isArray(bank.keyValues || bank.key_values || bank.key_value || bank.keyvalue) && (bank.keyValues || bank.key_values || bank.key_value || bank.keyvalue).length > 0) && (
                                              <div style={{ marginTop: 6 }}>
                                                <b>Additional:</b>
                                                <div>
                                                  {(bank.keyValues || bank.key_values || bank.key_value || bank.keyvalue).map((kv, kidx) => (
                                                    <div key={kidx}><small>{kv.key}: {kv.value}</small></div>
                                                  ))}
                                                </div>
                                              </div>
                                            )}
                                          </div>
                                        ))
                                      : ''
                                  )
                                : ''
                              )}
                            </td>
                          ))}
                          {showAccountType && (
                            <td className="data-col" style={{ minWidth: '160px' }}>
                              {(() => {
                                const types = [];
                                if (user.is_customer) types.push('Customer');
                                if (user.is_supplier) types.push('Supplier');
                                if (user.is_dealer) types.push('Dealer');
                                if (user.is_distributor) types.push('Distributor');
                                return types.length > 0 ? types.join(', ') : 'No';
                              })()}
                            </td>
                          )}
                          {checkedFields.length > 0 && (
                            <td className="actions-col">
                              <div className="action-buttons">
                              <Tooltip title="View">
                                <button
                                  type="button"
                                  className="action-btn view-btn"
                                  onClick={async (e) => {
                                    e.stopPropagation();
                                    setViewDialogOpen(true);
                                    try {
                                      const res = await axios.get(`${BASE_URL}/api/users/${user.id}`);
                                      // API returns { user: {...}, hierarchy: [...] }.
                                      // Make sure we set the actual user object on selection so the dialog
                                      // can read fields like firstname, email, addresses, etc.
                                      setSelectedUser(res.data?.user || res.data);
                                    } catch (err) {
                                      console.error('Failed to fetch user details, falling back to list item:', err);
                                      setSelectedUser(user);
                                    }
                                  }}
                                  aria-label="View user"
                                >
                                  <Visibility />
                                </button>
                              </Tooltip>
                              <Tooltip title="Edit"><button type="button" className="action-btn edit-btn" onClick={(e) => { e.stopPropagation(); navigate(`/users/${user.id}/edit`); }} aria-label="Edit user"><Edit /></button></Tooltip>
                              <Tooltip title="Delete"><button type="button" className="action-btn delete-btn" onClick={(e) => { e.stopPropagation(); openConfirmDelete(user); }} aria-label="Delete user"><Delete /></button></Tooltip>
                              {/* WhatsApp: prefer whatsapp_number, fallback to mobile_number. Use wa.me with digits-only number */}
                              {((user.whatsapp_number || user.mobile_number) && (user.whatsapp_number || user.mobile_number).toString().trim() !== '') ? (
                                <Tooltip title="WhatsApp">
                                  <a
                                    href={`https://wa.me/${String(user.whatsapp_number || user.mobile_number).replace(/\D/g, '')}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="action-btn whatsapp-btn"
                                  >
                                    <WhatsApp />
                                  </a>
                                </Tooltip>
                              ) : null}

                              {/* Mail: use mailto: if email exists */}
                              {user.email ? (
                                <Tooltip title="Mail">
                                  <a
                                    href={`mailto:${user.email}`}
                                    className="action-btn mail-btn"
                                  >
                                    <Mail />
                                  </a>
                                </Tooltip>
                              ) : null}
                              </div>
                            </td>
                          )}
                        </>
                      );
                    })()}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <div className="table-pagination">
          
          <Pagination
            page={page}
            total={totalItems}
            rowsPerPage={limit}
            onPageChange={(newPage) => setPage(newPage)}
            onRowsPerPageChange={(newRowsPerPage) => { setRowsPerPage(newRowsPerPage); setPage(0); }}
          />
        </div>
      </Paper>
    {/* Display Preferences Dialog */}
  <Dialog open={displayPrefOpen} onClose={handleDisplayPrefClose} maxWidth="lg" fullWidth sx={{ '& .MuiDialog-paper': { width: '90%', maxWidth: 1200 } }}>
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
          {/* 5-column grid for display preferences. The grouped 'Account Type' checkbox
              replaces the five individual account flags and supports indeterminate state. */}
          {(() => {
            const accountTypeFields = ['IsCustomer', 'IsSupplier', 'IsDealer', 'IsDistributor'];
            const displayFields = [];
            let accountInserted = false;
            for (const f of userFields) {
              if (accountTypeFields.includes(f)) {
                if (!accountInserted) {
                  displayFields.push('Account Type');
                  accountInserted = true;
                }
              } else {
                displayFields.push(f);
              }
            }

            

            return (
              <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(5, minmax(0, 1fr))', gap: 2 }}>
                {displayFields.map((field) => {
                  const isAccountGroup = field === 'Account Type';
                  const checked = isAccountGroup
                    ? accountTypeFields.every(a => checkedFields.includes(a))
                    : checkedFields.includes(field);
                  const indeterminate = isAccountGroup && accountTypeFields.some(a => checkedFields.includes(a)) && !accountTypeFields.every(a => checkedFields.includes(a));
                  return (
                    <Box key={field} sx={{ display: 'flex', alignItems: 'center', minHeight: 20 }}>
                      <Checkbox
                        checked={checked}
                        indeterminate={indeterminate}
                        onChange={() => handleFieldToggle(field)}
                        size="small"
                        sx={{ p: 0.5, mr: 1 }}
                      />
                      <span style={{ fontSize: 14 }}>{field}</span>
                    </Box>
                  );
                })}
              </Box>
            );
          })()}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleDisplayPrefClose}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* Hierarchy Dialog - shows parents (above) and children (below) for selected user */}
      <Dialog open={hierarchyDialogOpen} onClose={() => setHierarchyDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>Hierarchy for {selectedUser ? getUserDisplayName(selectedUser) : ''}</DialogTitle>
        <DialogContent dividers sx={{ maxHeight: '70vh', overflowY: 'auto' }}>
          {hierarchyLoading ? (
            <Box display="flex" justifyContent="center" alignItems="center" sx={{ py: 4 }}>
              <CircularProgress />
            </Box>
            ) : (
            <Grid container direction="column" spacing={2} sx={{ alignItems: 'stretch' }}>
              <Grid item sx={{ borderBottom: '1px solid rgba(0,0,0,0.12)', pb: 2 }}>
                <Typography variant="h6" sx={{ mb: 1 , display: 'flex', justifyContent: 'center' }}>Parent(s) (Above)</Typography>
                {hierarchyParents.length === 0 ? (
                  <Typography color="text.secondary" sx={{ display: 'flex', justifyContent: 'center' }}>No parent relations found.</Typography>
                ) : (
                  <Box sx={{ display: 'flex', flexDirection: 'row', gap: 2, flexWrap: 'wrap', justifyContent: 'center' }}>
                    {hierarchyParents.map((p) => (
                      <Paper key={p.id} sx={{ p: 0.5, mb: 1, flex: '0 0 auto' }} elevation={0}>
                        <Box display="flex" alignItems="center" sx={{ gap: 1 }}>
                          <Box sx={{ minWidth: 0, mr: 0.5 }}>
                            <Typography noWrap>{getUserDisplayName(p)}</Typography>
                            <Typography variant="caption" color="text.secondary">{(() => {
                              const types = [];
                              if (p.is_customer) types.push('Customer');
                              if (p.is_dealer) types.push('Dealer');
                              if (p.is_distributor) types.push('Distributor');
                              if (p.is_supplier) types.push('Supplier');
                              return types.length > 0 ? types.join(', ') : 'No account type';
                            })()}</Typography>
                          </Box>
                          <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            <Tooltip title="View">
                              <IconButton size="small" sx={{ p: 0.5 }} onClick={async () => {
                                try {
                                  setViewDialogOpen(true);
                                  const r = await axios.get(`${BASE_URL}/api/users/${p.id}`);
                                  setSelectedUser(r.data?.user || r.data);
                                  setHierarchyDialogOpen(false);
                                } catch (e) {
                                  console.error('Failed opening parent user', e);
                                }
                              }}>
                                <Visibility fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          </Box>
                        </Box>
                      </Paper>
                    ))}
                  </Box>
                )}
              </Grid>

              <Grid item>
                <Paper elevation={0} sx={{ py: 2, display: 'flex', justifyContent: 'center', alignItems: 'center', border: '2px solid', borderColor: 'primary.main', borderRadius: 1, mx: 'auto', px: 2 }}>
                  <Typography variant="h6" sx={{ fontWeight: 700, textAlign: 'center' }}>{selectedUser ? getUserDisplayName(selectedUser) : ''}</Typography>
                </Paper>
              </Grid>

              <Grid item sx={{ borderTop: '1px solid rgba(0,0,0,0.12)', pt: 2 }}>
                <Typography variant="h6" sx={{ mb: 1 , display: 'flex', justifyContent: 'center' }}>Child(ren) (Below)</Typography>
                {hierarchyChildren.length === 0 ? (
                  <Typography color="text.secondary" sx={{ display: 'flex', justifyContent: 'center' }}>No child relations found.</Typography>
                ) : (
                  <Box sx={{
                    display: 'grid',
                    gridTemplateColumns: {
                      xs: 'repeat(auto-fit, minmax(220px, 1fr))',
                      sm: 'repeat(auto-fit, minmax(220px, 1fr))',
                      md: 'repeat(auto-fit, minmax(220px, 1fr))'
                    },
                    gap: 2,
                    justifyContent: hierarchyChildren.length < 3 ? 'center' : 'stretch',
                    justifyItems: 'center',
                    textAlign: 'center',
                    maxWidth: hierarchyChildren.length < 3 ? '400px' : '100%',
                    mx: hierarchyChildren.length < 3 ? 'auto' : '0'
                  }}>
                    {hierarchyChildren.map((c) => (
                      <Paper key={c.id} sx={{ p: 0.5, mb: 1, width: '100%', display: 'flex', justifyContent: 'center' }} elevation={0}>
                        <Box display="flex" alignItems="center" sx={{ gap: 1, justifyContent: 'center', width: '100%' }}>
                          <Box sx={{ minWidth: 0, mr: 0.5 }}>
                            <Typography noWrap>{getUserDisplayName(c)}</Typography>
                            <Typography variant="caption" color="text.secondary">{(() => {
                              const types = [];
                              if (c.is_customer) types.push('Customer');
                              if (c.is_dealer) types.push('Dealer');
                              if (c.is_distributor) types.push('Distributor');
                              if (c.is_supplier) types.push('Supplier');
                              return types.length > 0 ? types.join(', ') : 'No account type';
                            })()}</Typography>
                          </Box>
                          <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            <Tooltip title="View">
                              <IconButton size="small" sx={{ p: 0.5 }} onClick={async () => {
                                try {
                                  setViewDialogOpen(true);
                                  const r = await axios.get(`${BASE_URL}/api/users/${c.id}`);
                                  setSelectedUser(r.data?.user || r.data);
                                  setHierarchyDialogOpen(false);
                                } catch (e) {
                                  console.error('Failed opening child user', e);
                                }
                              }}>
                                <Visibility fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          </Box>
                        </Box>
                      </Paper>
                    ))}
                  </Box>
                )}
              </Grid>
            </Grid>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setHierarchyDialogOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>
      {/* Confirm Delete Dialog */}
      <ConfirmDialog
        open={confirmDeleteOpen}
        title="Delete User"
        message={userToDelete ? `Are you sure you want to delete ${userToDelete.firstname || userToDelete.Firstname || userToDelete.name || ''}?` : 'Are you sure you want to delete this user?'}
        onCancel={() => { setConfirmDeleteOpen(false); setUserToDelete(null); }}
        onConfirm={handleDeleteConfirmed}
      />

      {/* Snackbar for showing success/error messages */}
      <Snackbar open={snackbarOpen} autoHideDuration={6000} onClose={handleSnackbarClose}>
        <Alert onClose={handleSnackbarClose} severity={snackbarSeverity} sx={{ width: '100%' }}>
          {snackbarMessage}
        </Alert>
      </Snackbar>

      {/* View User Dialog */}
      {/* User View Dialog */}
      <div className={`user-view-dialog ${viewDialogOpen ? 'open' : ''}`}>
        <div className="user-view-dialog-content">
          <div className="user-view-dialog-header">
            <div className="user-view-dialog-title-section">
              <h2 className="user-view-dialog-title">User Details</h2>
              {selectedUser && getUserDisplayName(selectedUser) && (
                <p className="user-view-dialog-subtitle">
                  {getUserDisplayName(selectedUser)}
                </p>
              )}
            </div>
            {selectedUser ? (
              <div className={`user-view-dialog-status ${selectedUser.active ? 'active' : 'inactive'}`}>
                {selectedUser.active ? 'Active' : 'Inactive'}
              </div>
            ) : null}
          </div>
          <div className="user-view-dialog-body">
            {selectedUser ? (
              <div>
                {/* User Type Information */}
                <div className="user-details-section">
                  <h3 className="section-title">Account Type</h3>
                  <div className="flex between center wrap gap-2">
                    <div className="account-types-container">
                      {/* Only show account types that are selected */}
                      {[
                        { value: "is_user", label: "User" },
                        { value: "is_customer", label: "Customer" },
                        { value: "is_supplier", label: "Supplier" },
                        { value: "is_dealer", label: "Dealer" },
                        { value: "is_distributor", label: "Distributor" }
                      ].filter(type => selectedUser[type.value]).map(type => (
                        <div key={type.value} className="account-type-badge">
                          {type.label}
                        </div>
                      ))}
                      {/* Show message if no account types are selected */}
                      {!selectedUser.is_user && 
                       !selectedUser.is_customer && 
                       !selectedUser.is_supplier && 
                       !selectedUser.is_dealer && 
                       !selectedUser.is_distributor && (
                        <p className="no-data-message">No account types assigned</p>
                      )}
                    </div>
                    {/* Right side: Hierarchy button for account type */}
                    <div>
                      <button
                        className="btn btn-outline btn-small"
                        onClick={async () => {
                          // Open a dialog that shows parents (above) and children (below) for this user
                          if (!selectedUser || !selectedUser.id) return;
                          setHierarchyDialogOpen(true);
                          setHierarchyLoading(true);
                          try {
                            // Fetch relations where this user is child -> gives parents
                            const parentsResp = await axios.get(`${BASE_URL}/api/hierarchical-users`, { params: { child_id: selectedUser.id } });
                            const parentsRels = Array.isArray(parentsResp.data) ? parentsResp.data : (parentsResp.data?.hierarchy || []);
                            const parentIds = [...new Set(parentsRels.map(r => r.parent_id).filter(Boolean))];
                            const parentUsers = await Promise.all(parentIds.map(async (pid) => {
                              try {
                                const r = await axios.get(`${BASE_URL}/api/users/${pid}`);
                                return r.data?.user || r.data;
                              } catch (e) {
                                return { id: pid, firstname: 'Unknown', lastname: '', fetchError: true };
                              }
                            }));
                            // Fetch relations where this user is parent -> gives children
                            const childrenResp = await axios.get(`${BASE_URL}/api/hierarchical-users`, { params: { parent_id: selectedUser.id } });
                            const childrenRels = Array.isArray(childrenResp.data) ? childrenResp.data : (childrenResp.data?.hierarchy || []);
                            const childIds = [...new Set(childrenRels.map(r => r.child_id).filter(Boolean))];
                            const childUsers = await Promise.all(childIds.map(async (cid) => {
                              try {
                                const r = await axios.get(`${BASE_URL}/api/users/${cid}`);
                                return r.data?.user || r.data;
                              } catch (e) {
                                return { id: cid, firstname: 'Unknown', lastname: '', fetchError: true };
                              }
                            }));

                            setHierarchyParents(parentUsers);
                            setHierarchyChildren(childUsers);
                          } catch (err) {
                            console.error('Failed to load hierarchy', err);
                            setHierarchyParents([]);
                            setHierarchyChildren([]);
                          } finally {
                            setHierarchyLoading(false);
                          }
                        }}
                        title="View user hierarchy"
                      >
                        📊 Hierarchy
                      </button>
                    </div>
                  </div>
                </div>

                {/* Personal Information */}
                <div className="user-details-section">
                  <h3 className="section-title">Personal Information</h3>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
                    <div className="form-field">
                      <label>Salutation</label>
                      <input type="text" value={selectedUser.salutation || selectedUser.Salutation || selectedUser.title || ""} disabled />
                    </div>
                    <div className="form-field">
                      <label>First Name</label>
                      <input type="text" value={
                        selectedUser.firstname
                        || selectedUser.first_name
                        || selectedUser.Firstname
                        || selectedUser.FirstName
                        || selectedUser.name
                        || selectedUser.fullname
                        || selectedUser.full_name
                        || ""
                      } disabled />
                    </div>
                    <div className="form-field">
                      <label>Last Name</label>
                      <input type="text" value={
                        selectedUser.lastname
                        || selectedUser.last_name
                        || selectedUser.Lastname
                        || selectedUser.LastName
                        || ""
                      } disabled />
                    </div>
                    <div className="form-field">
                      <label>Date of Birth</label>
                      <input type="text" value={selectedUser.dob ? new Date(selectedUser.dob).toLocaleDateString() : ""} disabled />
                    </div>
                    <div className="form-field">
                      <label>Gender</label>
                      <input type="text" value={selectedUser.gender || ""} disabled />
                    </div>
                  </div>
                </div>

                {/* Contact Information */}
                <div className="user-details-section">
                  <h3 className="section-title">Contact Information</h3>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
                    <div className="form-field">
                      <label>Country</label>
                      <input type="text" value={(() => {
                        // Prefer explicit contact country first; if absent, fall back to permanent address
                        const permAddr = Array.isArray(selectedUser.addresses) ? selectedUser.addresses.find(a => a.title === 'Permanent') : null;
                        const c = selectedUser.country || selectedUser.country_code ? (selectedUser.country || '') : (permAddr?.country || selectedUser.permanent_country || '');
                        const cc = selectedUser.country_code ? selectedUser.country_code : (permAddr?.country_code || selectedUser.permanent_country_code || '');
                        return formatCountryWithCode(c, cc);
                      })()} disabled />
                    </div>
                    <div className="form-field">
                      <label>Mobile Number</label>
                      <input type="text" value={selectedUser.mobile_number || ""} disabled />
                    </div>
                    <div className="form-field">
                      <label>Emergency Number</label>
                      <input type="text" value={selectedUser.emergency_number || ""} disabled />
                    </div>
                    <div className="form-field">
                      <label>Alternate Number</label>
                      <input type="text" value={selectedUser.alternate_number || ""} disabled />
                    </div>
                    <div className="form-field">
                      <label>WhatsApp Number</label>
                      <input type="text" value={selectedUser.whatsapp_number || ""} disabled />
                    </div>
                    <div className="form-field">
                      <label>Email</label>
                      <input type="text" value={selectedUser.email || ""} disabled />
                    </div>
                    <div className="form-field">
                      <label>Website</label>
                      <input type="text" value={selectedUser.website || ""} disabled />
                    </div>
                  </div>
                </div>
                
                {/* Business Information (shown only if user is not a pure User) */}
                {(selectedUser.is_customer || selectedUser.is_supplier || selectedUser.is_dealer || selectedUser.is_distributor) && (
                  <div className="user-details-section">
                    <h3 className="section-title">Business Information</h3>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
                      <div className="form-field">
                        <label>Business Name</label>
                        <input type="text" value={selectedUser.business_name || ""} disabled />
                      </div>
                      <div className="form-field">
                        <label>Company Name</label>
                        <input type="text" value={selectedUser.company_name || selectedUser.companyname || ""} disabled />
                      </div>
                      <div className="form-field">
                        <label>Industry Segment</label>
                        <input type="text" value={selectedUser.industry_segment || ""} disabled />
                      </div>
                      <div className="form-field">
                        <label>Designation</label>
                        <input type="text" value={selectedUser.designation || ""} disabled />
                      </div>
                      <div className="form-field">
                        <label>Title</label>
                        <input type="text" value={selectedUser.title || ""} disabled />
                      </div>
                    </div>
                  </div>
                )}

                {/* Permanent Address */}
                <div className="user-details-section">
                  <h3 className="section-title">Permanent Address</h3>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
                    <div className="form-field">
                      <label>GSTIN</label>
                      <input type="text" value={(() => {
                        const permAddr = Array.isArray(selectedUser.addresses) ? selectedUser.addresses.find(a => a.title === 'Permanent') : null;
                        return permAddr?.gstin || permAddr?.gstin_number || selectedUser.permanent_gstin || "";
                      })()} disabled />
                    </div>
                    {[1, 2, 3].map(n => (
                      <div className="form-field" key={`address${n}`}>
                        <label>Address {n}</label>
                        <input type="text" value={(() => {
                          const permAddr = Array.isArray(selectedUser.addresses) ? selectedUser.addresses.find(a => a.title === 'Permanent') : null;
                          return permAddr?.[`address${n}`] || selectedUser[`permanent_address${n}`] || selectedUser[`address${n}`] || "";
                        })()} disabled />
                      </div>
                    ))}
                    <div className="form-field">
                      <label>City</label>
                      <input type="text" value={(() => {
                        const permAddr = Array.isArray(selectedUser.addresses) ? selectedUser.addresses.find(a => a.title === 'Permanent') : null;
                        return permAddr?.city || selectedUser.permanent_city || selectedUser.city || selectedUser.City || "";
                      })()} disabled />
                    </div>
                    <div className="form-field">
                      <label>State</label>
                      <input type="text" value={(() => {
                        const permAddr = Array.isArray(selectedUser.addresses) ? selectedUser.addresses.find(a => a.title === 'Permanent') : null;
                        return permAddr?.state || selectedUser.permanent_state || selectedUser.state || "";
                      })()} disabled />
                    </div>
                    <div className="form-field">
                      <label>Country</label>
                      <input type="text" value={(() => {
                        const permAddr = Array.isArray(selectedUser.addresses) ? selectedUser.addresses.find(a => a.title === 'Permanent') : null;
                        const country = permAddr?.country || selectedUser.permanent_country || selectedUser.country || null;
                        const countryCode = permAddr?.country_code || selectedUser.permanent_country_code || selectedUser.country_code || null;
                        return formatCountryWithCode(country, countryCode);
                      })()} disabled />
                    </div>
                  </div>
                </div>

                {/* Additional Addresses */}
                <div className="user-details-section">
                  <h3 className="section-title">Additional Addresses</h3>
                  {Array.isArray(selectedUser.addresses) && selectedUser.addresses.filter(a => a.title !== 'Permanent').length > 0 ? (
                    <div className="addresses-horizontal-container">
                      {selectedUser.addresses.filter(a => a.title !== 'Permanent').map((addr, idx) => (
                        <div key={idx} className="address-block">
                        <h4 className="address-title">
                          Additional Address {String(idx + 1).padStart(2, '0')}
                        </h4>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
                          <div className="form-field">
                            <label>Title</label>
                            <input type="text" value={addr.title || ""} disabled />
                          </div>
                          <div className="form-field">
                            <label>GSTIN</label>
                            <input type="text" value={addr.gstin || addr.gstin_number || ""} disabled />
                          </div>
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
                            <input type="text" value={formatCountryWithCode(addr.country, addr.country_code)} disabled />
                          </div>
                          <div className="form-field">
                            <label>Pincode</label>
                            <input type="text" value={addr.pincode || ""} disabled />
                          </div>

                          {/* Key-Values section: render inline so keys appear next to Pincode */}
                          {(() => {
                            const kvs = normalizeKeyValues(addr);
                            return kvs.length > 0 ? (
                              kvs.map((kv, kvIdx) => (
                                <div className="form-field" key={kvIdx}>
                                  <label>{kv.key}</label>
                                  <input type="text" value={kv.value || ""} disabled />
                                </div>
                              ))
                            ) : null;
                          })()}
                        </div>
                      </div>
                      ))}
                    </div>
                  ) : (
                    <p className="no-data-message">No additional addresses</p>
                  )}
                </div>

                {/* Legal Information */}
                <div className="user-details-section">
                  <h3 className="section-title">Legal Information</h3>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
                    <div className="form-field">
                      <label>Aadhar Number</label>
                      <input type="text" value={getLegalValue(selectedUser, ['aadhaar','aadhar','aadhaar card','aadhar card'], ['aadhar_number','aadhaar'], ['aadhar_number','doc_number'])} disabled />
                    </div>
                    <div className="form-field">
                      <label>PAN Number</label>
                      <input type="text" value={getLegalValue(selectedUser, ['pan','pan card','permanent account number'], ['pan_number','pan'], ['pan_number','doc_number'])} disabled />
                    </div>
                    <div className="form-field">
                      <label>GSTIN</label>
                      <input type="text" value={getLegalValue(selectedUser, ['gstin','gst','goods and services tax'], ['gstin_number','gstin'], ['gstin_number','doc_number'])} disabled />
                    </div>
                    <div className="form-field">
                      <label>MSME No</label>
                      <input type="text" value={getLegalValue(selectedUser, ['msme','micro small medium enterprise'], ['msme_no','msmeno'], ['msme_no','doc_number'])} disabled />
                    </div>
                  </div>
                </div>

                {/* Bank Information */}
                <div className="user-details-section">
                  <h3 className="section-title">Bank Information</h3>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
                    <div className="form-field">
                      <label>Bank Name</label>
                      <input type="text" value={selectedUser.bank_accounts?.[0]?.bank_name || ""}
                      disabled />
                    </div>
                    <div className="form-field">
                      <label>Branch Name</label>
                      <input type="text" value={selectedUser.bank_accounts?.[0]?.branch_name || ""} disabled />
                    </div>
                    <div className="form-field">
                      <label>Branch Address</label>
                      <input type="text" value={selectedUser.bank_accounts?.[0]?.branch_address || ""} disabled />
                    </div>
                    <div className="form-field">
                      <label>Account Number</label>
                      <input type="text" value={selectedUser.bank_accounts?.[0]?.account_number || ""} disabled />
                    </div>
                    <div className="form-field">
                      <label>IFSC Code</label>
                      <input type="text" value={selectedUser.bank_accounts?.[0]?.ifsc_code || ""} disabled />
                    </div>
                  </div>
                </div>

                {/* Additional Bank Info */}
                <div className="user-details-section">
                  <h3 className="section-title">Additional Bank Information</h3>
                  {Array.isArray(selectedUser.bank_accounts) && selectedUser.bank_accounts.length > 1 ? (
                    selectedUser.bank_accounts.slice(1).map((bank, idx) => (
                      <div key={idx} className="bank-block">
                        <h4 className="bank-title">Bank Info {idx + 1}</h4>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
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
                          {/* Key-Values section: render inline so keys appear next to IFSC Code */}
                          {(() => {
                            const kvs = normalizeKeyValues(bank);
                            return kvs.length > 0 ? (
                              kvs.map((kv, kvIdx) => (
                                <div className="form-field" key={kvIdx}>
                                  <label>{kv.key}</label>
                                  <input type="text" value={kv.value || ""} disabled />
                                </div>
                              ))
                            ) : null;
                          })()}
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="no-data-message">No additional bank information</p>
                  )}
                </div>

                {/* Uploaded Documents */}
                <div className="user-details-section">
                  <h3 className="section-title">Uploaded Documents</h3>
                  {Array.isArray(selectedUser.documents) && selectedUser.documents.length > 0 ? (
                    <div className="documents-grid">
                      {selectedUser.documents.map((doc, idx) => {
                        const docType = doc.doc_type || doc.type || doc.document_type || 'Document';
                        const docNumber = doc.doc_number || doc.number || doc.docno || '';
                        const rawUrl = doc.file_url || doc.url || doc.file_path || doc.file || doc.filePath || doc.path || null;
                        const fileName = doc.file_name || doc.fileName || doc.name || (rawUrl ? rawUrl.split('/').pop() : '');
                        const url = rawUrl ? (String(rawUrl).startsWith('http') ? rawUrl : `${BASE_URL.replace(/\/$/, '')}/${String(rawUrl).replace(/^\.\//, '').replace(/^\/+/, '')}`) : null;
                        return (
                          <div key={idx} className="document-card">
                            <div>
                              <h4 className="document-type">{docType}</h4>
                              {docNumber && <p className="document-number">No: {docNumber}</p>}
                              {fileName && <p className="document-filename">{fileName}</p>}
                            </div>
                            <div className="document-actions">
                              {url ? (
                                <>
                                  <a href={url} target="_blank" rel="noreferrer" style={{ textDecoration: 'none' }}>
                                    <button type="button" title={`View ${docType}`}>
                                      <Visibility />
                                    </button>
                                  </a>
                                  <button type="button" title={`Download ${docType}`} onClick={(e) => {
                                    e.preventDefault();
                                    // trigger download via anchor to preserve filename
                                    const a = document.createElement('a');
                                    a.href = url;
                                    a.download = fileName || '';
                                    document.body.appendChild(a);
                                    a.click();
                                    a.remove();
                                  }}>
                                    <FileDownload />
                                  </button>
                                </>
                              ) : (
                                <button type="button" disabled title="No file available">
                                  <Visibility />
                                </button>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <p className="no-data-message">No uploaded documents</p>
                  )}
                </div>

                {/* Authentication Information */}
                <div className="user-details-section">
                  <h3 className="section-title">Authentication</h3>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
                    <div className="form-field">
                      <label>User Code</label>
                      <input type="text" value={selectedUser.usercode || selectedUser.user_code || selectedUser.userCode || ""} disabled />
                    </div>
                    <div className="form-field">
                      <label>Username</label>
                      <input type="text" value={selectedUser.username || ""} disabled />
                    </div>
                    <div className="form-field password-input-container">
                      <label>Password</label>
                      <input type={showPassword ? "text" : "password"} value={selectedUser.plain_password || ""} disabled />
                      {selectedUser.plain_password && (
                        <button
                          type="button"
                          className="password-toggle"
                          onClick={() => setShowPassword(!showPassword)}
                          title={showPassword ? "Hide password" : "Show password"}
                        >
                          {showPassword ? <VisibilityOff /> : <Visibility />}
                        </button>
                      )}
                      {!selectedUser.plain_password && (
                        <p className="helper-text">Password not available</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <p>No user selected.</p>
            )}
          </div>
          <div className="user-view-dialog-footer">
            <button className="btn btn-secondary" onClick={() => setViewDialogOpen(false)}>Close</button>
            <button 
              className="btn btn-outline" 
              onClick={() => {
                setViewDialogOpen(false);
                navigate(`/users/${selectedUser.id}/edit`);
              }}
            >
              Edit User
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

      {/* Import Dialog (reused) */}
      <ImportDialog
        open={importDialogOpen}
        onClose={() => { setImportDialogOpen(false); setImportFile(null); setImportLoading(false); }}
        title="Import Users"
        instructions={[
          'Download the template Excel file below',
          'Fill in your user data following the template format',
          'Required fields are marked with asterisk (*)',
          'You can edit the info after upload the CSV file',
          'Upload the completed CSV file'
        ]}
        importFile={importFile}
        setImportFile={setImportFile}
        importLoading={importLoading}
        onImport={handleImport}
        downloadTemplate={downloadTemplateCSV}
      />

      {/* Import Preview Dialog */}
      <Dialog 
        className="import-preview-dialog"
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
          
          <div className="import-preview-table-wrapper">
            <table className="import-preview-table">
              <thead>
                <tr>
                  <th style={{ width: '60px' }}>
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
                  </th>
                  <th style={{ fontWeight: 'bold' }}>No.</th>
                  {importedData.length > 0 && Object.keys(importedData[0]).map((header) => {
                    const cleanHeader = String(header).replace(/\s*\*\s*$/g, '');
                    const normalizedHeader = cleanHeader.toLowerCase().replace(/[^a-z0-9]/g, '');
                    // If the incoming header is 'Permanent Country', show it as 'Country' in the preview
                    const displayName = cleanHeader === 'Permanent Country' ? 'Country' : cleanHeader;
                    // Treat 'Permanent Country' as 'country' for required-field checks
                    const normalizedForCheck = (normalizedHeader === 'permanentcountry') ? 'country' : normalizedHeader;
                    // Mark required fields in preview (User Code is optional)
                    const requiredFields = ['salutation', 'firstname', 'gender', 'country', 'mobilenumber', 'email', 'city', 'state', 'active', 'accounttype'];
                    const isRequired = requiredFields.includes(normalizedForCheck);
                    const displayHeader = isRequired ? `${displayName} *` : displayName;

                    return (
                      <th key={header} className={`col-${_normalizeKey(displayName)}`}>
                        {displayHeader}
                      </th>
                    );
                  })}
                </tr>
              </thead>
              <tbody>
                {importedData.map((row, rowIndex) => (
                  <tr key={rowIndex} className="import-preview-row">
                    <td>
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
                    </td>
                    <td>{rowIndex + 1}</td>
                    {Object.keys(row).map((key, cellIndex) => {
                      const errMsgs = (importFieldErrors && importFieldErrors[rowIndex]) ? importFieldErrors[rowIndex][key] : undefined;
                      const fieldName = (key === 'Permanent Country') ? 'Country' : key;
                      const cleanFieldName = String(fieldName).replace(/\s*\*\s*$/g, '');
                      const columnClass = `col-${_normalizeKey(cleanFieldName)}`;
                      return (
                        <SimpleEditableCell
                          key={`${rowIndex}-${cellIndex}`}
                          value={row[key]}
                          rowIndex={rowIndex}
                          columnKey={key}
                          error={!!errMsgs}
                          errorMessages={errMsgs}
                          columnClass={columnClass}
                          row={row}
                          onUpdate={(rowIdx, colKey, newValue) => {
                            const updatedData = [...importedData];
                            updatedData[rowIdx] = { ...updatedData[rowIdx], [colKey]: newValue };
                            setImportedData(updatedData);
                            // clear errors for this field after user edits it
                            setImportFieldErrors(prev => {
                              if (!prev || !prev[rowIdx] || !prev[rowIdx][colKey]) return prev;
                              const copy = { ...prev };
                              const rowCopy = { ...copy[rowIdx] };
                              delete rowCopy[colKey];
                              copy[rowIdx] = rowCopy;
                              return copy;
                            });
                          }}
                        />
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </DialogContent>
        <DialogActions>
          <div className="dialog-actions import-preview-actions">
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => {
                setImportPreviewOpen(false);
                setImportedData([]);
              }}
            >
              Cancel
            </button>

            <button
              type="button"
              className="btn btn-primary"
              onClick={handleFinalImport}
              disabled={importLoading}
            >
              {importLoading ? <span className="spinner" aria-hidden="true"></span> : 'Finalize Import'}
            </button>
          </div>
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
                  <div className="import-errors-table-wrapper">
                    <table className="import-errors-table">
                      <thead>
                        <tr>
                          <th style={{ fontWeight: 'bold' }}>Row</th>
                          <th style={{ fontWeight: 'bold' }}>User Name</th>
                          <th style={{ fontWeight: 'bold' }}>User Code</th>
                          <th style={{ fontWeight: 'bold' }}>Error Details</th>
                        </tr>
                      </thead>
                      <tbody>
                        {importReport.errors.map((error, index) => (
                          <tr key={index}>
                            <td>{error.row || 'N/A'}</td>
                            <td>{
                              error.userName ||
                              error.data?.['Name'] ||
                              (error.data?.['First Name'] ? ((error.data['First Name'] || '') + ' ' + (error.data['Last Name'] || '')) : null) ||
                              'N/A'
                            }</td>
                            <td>{error.userCode || error.data?.['User Code'] || 'N/A'}</td>
                            <td>
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
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
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