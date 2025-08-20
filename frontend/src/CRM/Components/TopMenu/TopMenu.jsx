// Import dependencies
import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
// Import icons
import { 
  FaSearch, FaCog, FaTh, FaChartBar, 
  FaFilter, FaWrench, FaDownload, FaBars, FaFileExport,
  FaTrash, FaEdit, FaStar, FaChevronDown
} from 'react-icons/fa';
import * as XLSX from 'xlsx';
// Import styles
import './_top_menu.scss';
import DisplayPref from '../../Pages/DisplayPref/DisplayPref';
import AddLead from '../../Pages/AddLead/AddLead';


import {BASE_URL} from '../../../Config'

// Assigned to options
const assignedToOptions = [
  { id: 1, name: 'ABC' },
  { id: 2, name: 'XYZ' },
  { id: 3, name: '123' }
];

const FIELD_OPTIONS = [
  { key: 'business', label: 'Business' },
  { key: 'name', label: 'Name' },
  { key: 'designation', label: 'Designation' },
  { key: 'mobile', label: 'Mobile' },
  { key: 'email', label: 'Email' },
  { key: 'addressLine1', label: 'Address Line 1' },
  { key: 'addressLine2', label: 'Address Line 2' },
  { key: 'city', label: 'City' },
  { key: 'state', label: 'State' },
  { key: 'country', label: 'Country' },
  { key: 'source', label: 'Source' },
  { key: 'stage', label: 'Stage' },
  { key: 'potential', label: 'Potential (₹)' },
  { key: 'since', label: 'Since' },
  { key: 'gstin', label: 'GSTIN' },
  { key: 'category', label: 'Category' },
  { key: 'product', label: 'Product' },
  { key: 'website', label: 'Website' },
  { key: 'requirements', label: 'Requirements' },
  { key: 'notes', label: 'Notes' },
  { key: 'tags', label: 'Tags' },
  { key: 'lastTalk', label: 'LastTalk' },
  { key: 'nextTalk', label: 'NextTalk' },
  { key: 'transferredOn', label: 'TransferredOn' },
  { key: 'assignedTo', label: 'AssignedTo' },
  { key: 'createdAt', label: 'CreatedAt' },
  { key: 'updatedAt', label: 'UpdatedAt' },
  { key: 'code', label: 'Code' }
];

const LOCAL_STORAGE_KEY = 'displayPreferences';

const TopMenu = () => {
  // -------------------- State --------------------
  const navigate = useNavigate();
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(false);
  const [activeStatusFilter, setActiveStatusFilter] = useState('All Active Leads');
  const [activeViewFilter, setActiveViewFilter] = useState('Newest First');
  const [activeFiltersBtn, setActiveFiltersBtn] = useState(false);
  const [showDisplayPref, setShowDisplayPref] = useState(false);
  const [showAddLead, setShowAddLead] = useState(false);
  const [editLead, setEditLead] = useState(null);
  const [showStatusDropdown, setShowStatusDropdown] = useState(false);
  const [showViewDropdown, setShowViewDropdown] = useState(false);
  const fileInputRef = useRef(null);
  const statusDropdownRef = useRef(null);
  const viewDropdownRef = useRef(null);

  const [displayFields, setDisplayFields] = useState(() => {
    const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (saved) {
      const prefs = JSON.parse(saved);
      return FIELD_OPTIONS.filter(f => prefs[f.key]);
    }
    return FIELD_OPTIONS;
  });

  const [searchTerm, setSearchTerm] = useState('');

  // Add products state to TopMenu
  const [products, setProducts] = useState([]);

  // -------------------- Effects --------------------
  // Fetch leads from backend
  useEffect(() => {
    fetchLeads();
  }, []);

  // Fetch products on mount
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const res = await fetch(`${BASE_URL}/api/products?page=1&limit=1000`);
        const data = await res.json();
        setProducts(data.data || []);
      } catch (err) {
        setProducts([]);
      }
    };
    fetchProducts();
  }, []);

  // Collapse dropdowns when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (
        statusDropdownRef.current &&
        !statusDropdownRef.current.contains(event.target) &&
        showStatusDropdown
      ) {
        setShowStatusDropdown(false);
      }
      if (
        viewDropdownRef.current &&
        !viewDropdownRef.current.contains(event.target) &&
        showViewDropdown
      ) {
        setShowViewDropdown(false);
        setActiveFiltersBtn(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showStatusDropdown, showViewDropdown]);

  // Update displayFields when DisplayPref modal closes
  useEffect(() => {
    if (!showDisplayPref) {
      const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (saved) {
        const prefs = JSON.parse(saved);
        setDisplayFields(FIELD_OPTIONS.filter(f => prefs[f.key]));
      }
    }
  }, [showDisplayPref]);

  // -------------------- Data Fetch --------------------
  const fetchLeads = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${BASE_URL}/api/leads?page=1&limit=100`);
      const data = await res.json();

      const starredMap = JSON.parse(localStorage.getItem('starredLeads') || '{}');
      const backendLeads = (data.data || []).map(lead => ({
        ...lead,
        starred: !!starredMap[lead.id],
        assignedTo: assignedToOptions.find(opt => opt.id === lead.assigned_to_id)?.name || '',
        // Normalize field names to match case-sensitive keys
        addressLine1: lead.addressLine1 || lead.addressline1 || lead.address_line1 || lead.formData?.addressLine1 || '',
        addressLine2: lead.addressLine2 || lead.addressline2 || lead.address_line2 || lead.formData?.addressLine2 || '',
        category: lead.category || lead.Category || lead.formData?.category || '',
        tags: lead.tags || lead.Tags || lead.formData?.tags || ''
      }));

      // Get imported leads from localStorage (those without backend id)
      const importedLeads = (JSON.parse(localStorage.getItem('importedLeads') || '[]') || []);

      // Merge backend and imported leads
      setLeads([...backendLeads, ...importedLeads]);
    } catch (err) {
      console.error('Failed to fetch leads:', err);
    } finally {
      setLoading(false);
    }
  };

  // -------------------- Event Handlers --------------------
  // Dropdowns
  const handleLeadsFilterClick = () => setShowStatusDropdown(prev => !prev);
  const handleStatusDropdownSelect = (filter) => {
    setActiveStatusFilter(filter);
    setShowStatusDropdown(false);
  };
  const handleFiltersBtnClick = () => {
    setShowViewDropdown(prev => !prev);
    setActiveFiltersBtn(!activeFiltersBtn);
  };
  const handleViewDropdownSelect = (filter) => {
    setActiveViewFilter(filter);
    setShowViewDropdown(false);
    setActiveFiltersBtn(false);
  };

  // Navigation
  const handleReportsClick = () => navigate('/reports');
  const handleCustomizeClick = () => navigate('/customize');

  // Lead actions
  const handleAddLeadSubmit = async (newLeadData) => {
    try {
      const contact = [newLeadData.prefix || '', newLeadData.firstName || '', newLeadData.lastName || ''].filter(Boolean).join(' ').trim();
      const assignedToObj = assignedToOptions.find(opt => opt.name === newLeadData.assignedTo);
      const assigned_to_id = assignedToObj ? assignedToObj.id : 1;
      const payload = {
        business: newLeadData.business,
        contact,
        designation: newLeadData.designation,
        mobile: newLeadData.mobile,
        email: newLeadData.email,
        city: newLeadData.city,
        state: newLeadData.state,
        country: newLeadData.country,
        source: newLeadData.source,
        stage: newLeadData.stage,
        potential: parseFloat(newLeadData.potential) || 0,
        since: newLeadData.since || new Date().toISOString(),
        gstin: newLeadData.gstin,
        website: newLeadData.website,
        requirements: newLeadData.requirement,
        notes: newLeadData.notes,
        assigned_to_id,
        product: newLeadData.product,
        addressLine1: newLeadData.addressLine1,
        addressLine2: newLeadData.addressLine2,
        category: newLeadData.category,
        tags: newLeadData.tags
      };
      if (editLead && editLead.id) {
        // Backend lead: update via API
        await fetch(`${BASE_URL}/api/leads/${editLead.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        await fetchLeads();
      } else if (editLead && (!editLead.id || typeof editLead.id !== 'number')) {
        // Imported lead: update in localStorage and state

        // Get product name from products list
        let productName = newLeadData.product;
        const foundProduct = products.find(
          p => p.ID === newLeadData.product || p.id === newLeadData.product
        );
        productName = foundProduct ? (foundProduct.Name || foundProduct.name) : newLeadData.product;

        // Get assignedTo name from assignedToOptions
        let assignedToName = newLeadData.assignedTo;
        const foundAssignee = assignedToOptions.find(opt => opt.id === Number(newLeadData.assignedTo));
        assignedToName = foundAssignee ? foundAssignee.name : newLeadData.assignedTo;

        setLeads(prevLeads => {
          const importedLeads = (JSON.parse(localStorage.getItem('importedLeads') || '[]') || []);
          const updatedImportedLeads = importedLeads.map(lead =>
            lead.id === editLead.id
              ? {
                  ...lead,
                  ...newLeadData,
                  product: productName,
                  assignedTo: assignedToName
                }
              : lead
          );
          localStorage.setItem('importedLeads', JSON.stringify(updatedImportedLeads));
          const backendLeads = prevLeads.filter(l => l.id && typeof l.id === 'number');
          return [...backendLeads, ...updatedImportedLeads];
        });
        setShowAddLead(false);
        setEditLead(null);
      } else {
        // New lead: add via API
        await fetch(`${BASE_URL}/api/leads`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        await fetchLeads();
      }
      setShowAddLead(false);
      setEditLead(null);
    } catch (err) {
      console.error('Failed to add/update lead:', err);
    }
  };

  const handleSelectAll = () => {
    const allSelected = leads.length > 0 && leads.every(lead => lead.selected);
    setLeads(prevLeads =>
      prevLeads.map(lead => ({
        ...lead,
        selected: !allSelected
      }))
    );
  };

  const handleSelectRow = (leadId) => {
    setLeads(prevLeads =>
      prevLeads.map(lead =>
        lead.id === leadId
          ? { ...lead, selected: !lead.selected }
          : lead
      )
    );
  };

  const handleImportClick = () => fileInputRef.current.click();

  const handleDeleteRow = async (leadId) => {
    if (window.confirm('Are you sure you want to delete this lead?')) {
      try {
        await fetch(`${BASE_URL}/api/leads/${leadId}`, { method: 'DELETE' });
        await fetchLeads();
      } catch (err) {
        console.error('Failed to delete lead:', err);
      }
    }
  };

  const handleEditRow = (lead) => {
    let assignedToName = lead.assignedTo;
    if (typeof assignedToName === 'object' && assignedToName !== null) {
      assignedToName = assignedToName.Name || assignedToName.name || assignedToName.email || '';
    } else if (typeof assignedToName === 'number') {
      const found = assignedToOptions.find(opt => opt.id === assignedToName);
      assignedToName = found ? found.name : '';
    }
    setEditLead({
      ...lead,
      assignedTo: assignedToName,
      id: lead.id,
      addressLine1: lead.addressLine1 || '',
      addressLine2: lead.addressLine2 || '',
      category: lead.category || '',
      product: lead.product || '',
      tags: lead.tags || '',
      code: lead.code || '',
      requirement: lead.requirements || lead.requirement || '',
      prefix: lead.prefix || '',
      firstName: lead.firstName || '',
      lastName: lead.lastName || ''
    });
    setShowAddLead(true);
  };

  const handleToggleStar = (leadId) => {
    setLeads(prevLeads => {
      const updatedLeads = prevLeads.map(lead =>
        lead.id === leadId ? { ...lead, starred: !lead.starred } : lead
      );
      const starredMap = JSON.parse(localStorage.getItem('starredLeads') || '{}');
      const toggledLead = updatedLeads.find(lead => lead.id === leadId);
      if (toggledLead) {
        if (toggledLead.starred) {
          starredMap[leadId] = true;
        } else {
          delete starredMap[leadId];
        }
        localStorage.setItem('starredLeads', JSON.stringify(starredMap));
      }
      return updatedLeads;
    });
  };

  // Highlight helper
  const highlightText = (text, searchTerm) => {
    if (!searchTerm || typeof text !== 'string') return text;
    const escaped = searchTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(`(${escaped})`, 'gi');
    return text.split(regex).map((part, i) =>
      regex.test(part)
        ? <mark key={i} style={{ background: '#ffe066', padding: 0 }}>{part}</mark>
        : part
    );
  };

  // -------------------- Helpers --------------------
  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    if (isNaN(date)) return dateStr;
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}-${month}-${year}`;
  };

  const parseExcelDate = (value) => {
    if (!value) return '';
    if (/^\d{2}-\d{2}-\d{4}$/.test(value)) {
      const [day, month, year] = value.split('-');
      return `${year}-${month}-${day}`;
    }
    const date = new Date(value);
    if (!isNaN(date)) {
      return date.toISOString().split('T')[0];
    }
    return value;
  };

  const formatIndianRupees = (value) => {
    const number = parseInt(value || "0");
    return new Intl.NumberFormat('en-IN', {
      maximumSignificantDigits: 3,
      style: 'currency',
      currency: 'INR'
    }).format(number);
  };

  const formatDateTime = (dateStr) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    if (isNaN(date)) return dateStr;
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    const hours = String(date.getHours()).padStart(2, '0');
    const mins = String(date.getMinutes()).padStart(2, '0');
    return `${day}-${month}-${year} ${hours}:${mins}`;
  };

  // -------------------- Import/Export --------------------
  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = new Uint8Array(e.target.result);
          const workbook = XLSX.read(data, { type: 'array' });
          const sheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[sheetName];
          const jsonData = XLSX.utils.sheet_to_json(worksheet, { raw: false, defval: '' });
          const newLeads = jsonData.map((row, index) => ({
            // Remove id or use a string id to avoid collision with backend ids
            id: `imported_${Date.now()}_${index}`,
            business: row.Business || row.business || '',
            contact: row.Contact || row.contact || '',
            designation: row.Designation || row.designation || '',
            mobile: row.Mobile || row.mobile || '',
            email: row.Email || row.email || '',
            city: row.City || row.city || '',
            state: row.State || row.state || '',
            country: row.Country || row.country || '',
            source: row.Source || row.source || '',
            stage: row.Stage || row.stage || '',
            potential: (row.Potential || row['Potential (₹)'] || row.potential || '0').toString().replace(/[^\d]/g, ''),
            since: row.Since || row.since || new Date().toISOString().split('T')[0],
            assignedTo: row['Assigned to'] || row['AssignedTo'] || row['Assigned To'] || '',
            product: row.Product || row.product || '',
            gstin: row.GSTIN || row.gstin || '',
            website: row.Website || row.website || '',
            lastTalk: row['Last Talk'] || row.LastTalk || new Date().toISOString().split('T')[0],
            nextTalk: row['Next Talk'] || row.NextTalk || row.Next || '',
            transferredOn: row['Transferred on'] || row['TransferredOn'] || row['Transfer Date'] || new Date().toISOString().split('T')[0],
            requirements: row.Requirements || row.requirements || '',
            notes: row.Notes || row.notes || '',
            selected: false
          }));
          if (newLeads.length === 0) throw new Error('No valid data found in Excel file');
          // Save imported leads separately
          const prevImportedLeads = JSON.parse(localStorage.getItem('importedLeads') || '[]');
          const updatedImportedLeads = [...prevImportedLeads, ...newLeads];
          localStorage.setItem('importedLeads', JSON.stringify(updatedImportedLeads));
          // Merge backend and imported leads
          setLeads(prevLeads => {
            const backendLeads = prevLeads.filter(l => l.id && typeof l.id === 'number');
            return [...backendLeads, ...updatedImportedLeads];
          });
          if (fileInputRef.current) fileInputRef.current.value = '';
          alert(`Successfully imported ${newLeads.length} leads`);
        } catch (error) {
          alert('Error importing file. Please ensure the column names match exactly: "Assigned to" and "Transferred on"');
        }
      };
      reader.readAsArrayBuffer(file);
    }
  };

  const handleExportToExcel = () => {
    const wb = XLSX.utils.book_new();
    // Only export columns that are selected in displayFields
    const exportFields = displayFields.map(field => field.key);
    const exportHeaders = displayFields.map(field => field.label);

    // Check if any leads are selected
    const selectedLeads = leads.filter(lead => lead.selected);
    
    // Use selected leads if available, otherwise use filtered leads
    const leadsToExport = selectedLeads.length > 0 ? selectedLeads : displayedLeads;

    // Build export data using only selected fields
    const exportData = leadsToExport.map(lead => {
      const row = {};
      displayFields.forEach(field => {
        let value;
        if (field.key === 'name') {
          value = lead.name && lead.name.trim()
            ? lead.name
            : lead.contact && lead.contact.trim()
              ? lead.contact
              : [lead.prefix, lead.firstName, lead.lastName].filter(Boolean).join(' ');
        } else if (field.key === 'potential') {
          value = lead.potential || '';
        } else if (field.key === 'since' || field.key === 'lastTalk' || field.key === 'nextTalk' || field.key === 'transferredOn') {
          value = formatDate(lead[field.key]);
        } else if (field.key === 'assignedTo') {
          value = typeof lead.assignedTo === 'object' && lead.assignedTo !== null
            ? (lead.assignedTo.Name || lead.assignedTo.name || lead.assignedTo.email || JSON.stringify(lead.assignedTo))
            : (lead.assignedTo || '');
        } else if (field.key === 'product') {
          value = typeof lead.product === 'object' && lead.product !== null
            ? (lead.product.Name || lead.product.name || lead.product.Code || JSON.stringify(lead.product))
            : (lead.product || '');
        } else if (field.key === 'addressLine1') {
          value = lead.addressLine1 || lead.addressline1 || lead.address_line1 || lead.formData?.addressLine1 || '';
        } else if (field.key === 'addressLine2') {
          value = lead.addressLine2 || lead.addressline2 || lead.address_line2 || lead.formData?.addressLine2 || '';
        } else if (field.key === 'category') {
          value = lead.category || lead.Category || lead.formData?.category || '';
        } else if (field.key === 'tags') {
          value = lead.tags || lead.Tags || lead.formData?.tags || '';
        } else if (field.key === 'lastTalk') {
          value = formatDate(lead.lastTalk || lead.LastTalk || lead.last_talk || lead.lasttalk || lead.createdAt || '');
        } else if (field.key === 'nextTalk') {
          value = formatDate(lead.nextTalk || lead.NextTalk || lead.next_talk || lead.nexttalk || '');
        } else if (field.key === 'transferredOn') {
          value = formatDate(lead.transferredOn || lead.TransferredOn || lead.transferred_on || lead.transferredon || '');
        } else if (field.key === 'assignedToId') {
          value = lead.assigned_to_id || lead.assignedToId || lead.AssignedToID || '';
        } else if (field.key === 'productId') {
          value = lead.product_id || lead.productId || lead.ProductID || '';
        } else if (field.key === 'createdAt') {
          value = formatDateTime(lead.createdAt || lead.CreatedAt || '');
        } else if (field.key === 'updatedAt') {
          value = formatDateTime(lead.updatedAt || lead.UpdatedAt || '');
        } else {
          value = lead[field.key] || '';
        }
        row[field.label] = value;
      });
      return row;
    });

    // Generate filename based on selection and active filters
    let filename = "Leads_";
    
    // Add information about selected leads if any
    if (selectedLeads.length > 0) {
      filename += `Selected_${selectedLeads.length}_`;
    } else {
      // Add filter information only if not exporting selected leads
      if (activeStatusFilter !== 'All Active Leads') {
        filename += `${activeStatusFilter}_`;
      }
      if (activeViewFilter !== 'Newest First') {
        filename += `${activeViewFilter}_`;
      }
      if (searchTerm) {
        filename += `Search_${searchTerm.replace(/[^a-z0-9]/gi, '_').substring(0, 10)}_`;
      }
    }
    
    filename += "Exported.xlsx";

    const ws = XLSX.utils.json_to_sheet(exportData, { header: exportHeaders });
    XLSX.utils.book_append_sheet(wb, ws, "Leads");
    XLSX.writeFile(wb, filename);
  };

  // -------------------- Filtering --------------------
  const filterLeadsByStatus = (leads, status) => {
    if (status === 'All Active Leads') return leads;
    if (status === 'Discussion') return leads.filter(lead => lead.stage && lead.stage.toLowerCase() === 'discussion');
    if (status === 'Demo') return leads.filter(lead => lead.stage && lead.stage.toLowerCase() === 'demo');
    if (status === 'Proposal') return leads.filter(lead => lead.stage && lead.stage.toLowerCase() === 'proposal');
    if (status === 'Decided') return leads.filter(lead => lead.stage && lead.stage.toLowerCase() === 'decided');
    if (status === 'Inactive') return leads.filter(lead => lead.stage && lead.stage.toLowerCase() === 'inactive');
    return leads;
  };

  const filterLeadsByView = (leads, view) => {
    if (view === 'Newest First') return [...leads].sort((a, b) => new Date(b.since) - new Date(a.since));
    if (view === 'Oldest First') return [...leads].sort((a, b) => new Date(a.since) - new Date(b.since));
    if (view === 'Star Leads') return leads.filter(lead => lead.starred);
    return leads;
  };

  // -------------------- Derived Data --------------------
  // Filter leads by search term
  const filterLeadsBySearch = (leads, term) => {
    if (!term.trim()) return leads;
    const lowerTerm = term.toLowerCase();
    return leads.filter(lead =>
      Object.values(lead).some(val =>
        typeof val === 'string' && val.toLowerCase().includes(lowerTerm)
      )
    );
  };

  const displayedLeads = filterLeadsBySearch(
    filterLeadsByView(
      filterLeadsByStatus(leads, activeStatusFilter),
      activeViewFilter
    ),
    searchTerm
  );
  const selectedLeadsCount = leads.filter(lead => lead.selected).length;

  // -------------------- Pagination State --------------------
  const [pageNo, setPageNo] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  // Calculate total pages based on filtered leads
  const totalPages = Math.max(1, Math.ceil(displayedLeads.length / rowsPerPage));

  // Paginated leads for current page
  const paginatedLeads = displayedLeads.slice((pageNo - 1) * rowsPerPage, pageNo * rowsPerPage);

  // Pagination handlers
  const handlePrevPage = () => setPageNo(prev => Math.max(prev - 1, 1));
  const handleNextPage = () => setPageNo(prev => Math.min(prev + 1, totalPages));
  const handleRowsPerPageChange = (e) => {
    setRowsPerPage(Number(e.target.value));
    setPageNo(1); // Reset to first page
  };

  // Add this function before the return statement
  const handleAddLeadModalSubmit = (leadOrNothing) => {
    // If leadOrNothing is an object, it's an imported lead update
    if (leadOrNothing && (!leadOrNothing.id || typeof leadOrNothing.id !== 'number' || String(leadOrNothing.id).startsWith('imported_'))) {
      // Get product name from products list
      let productName = leadOrNothing.product;
      const foundProduct = products.find(
        p => p.ID === leadOrNothing.product || p.id === leadOrNothing.product
      );
      productName = foundProduct ? (foundProduct.Name || foundProduct.name) : leadOrNothing.product;

      // Get assignedTo name from assignedToOptions
      let assignedToName = leadOrNothing.assignedTo;
      const foundAssignee = assignedToOptions.find(opt => opt.id === Number(leadOrNothing.assignedTo));
      assignedToName = foundAssignee ? foundAssignee.name : leadOrNothing.assignedTo;

      setLeads(prevLeads => {
        const importedLeads = (JSON.parse(localStorage.getItem('importedLeads') || '[]') || []);
        const updatedImportedLeads = importedLeads.map(lead =>
          lead.id === leadOrNothing.id
            ? {
                ...lead,
                ...leadOrNothing,
                product: productName,
                assignedTo: assignedToName
              }
            : lead
        );
        localStorage.setItem('importedLeads', JSON.stringify(updatedImportedLeads));
        const backendLeads = prevLeads.filter(l => l.id && typeof l.id === 'number');
        return [...backendLeads, ...updatedImportedLeads];
      });
      setShowAddLead(false);
      setEditLead(null);
    } else {
      // For backend leads, just refresh from backend
      fetchLeads();
      setShowAddLead(false);
      setEditLead(null);
    }
  };

  // -------------------- Render --------------------
  return (
    <div className="top-menu">
      {/* Header Section */}
      <div className="header-section">
        <div className="header-title">Leads & Prospects</div>
        <div className="header-actions">
          {/* Status Dropdown */}
          <div style={{ position: 'relative' }} ref={statusDropdownRef}>
            <button
              className={`all-leads-btn ${showStatusDropdown ? 'active' : ''}`}
              onClick={handleLeadsFilterClick}
            >
              {activeStatusFilter}
              <FaChevronDown className="dropdown-arrow" />
            </button>
            {showStatusDropdown && (
              <div className="status-dropdown">
                {['All Active Leads', 'Discussion', 'Demo', 'Proposal', 'Decided', 'Inactive'].map((filter) => (
                  <div
                    key={filter}
                    className={`dropdown-item${activeStatusFilter === filter ? ' active' : ''}`}
                    onClick={() => handleStatusDropdownSelect(filter)}
                  >
                    {filter}
                  </div>
                ))}
              </div>
            )}
          </div>
          {/* View Dropdown */}
          <div style={{ position: 'relative', display: 'inline-block' }} ref={viewDropdownRef}>
            <button
              className={`filters-btn ${activeFiltersBtn ? 'active' : ''}`}
              onClick={handleFiltersBtnClick}
            >
              <FaFilter />
              Filters
              <FaChevronDown className="dropdown-arrow" />
            </button>
            {showViewDropdown && (
              <div className="view-dropdown">
                {['Newest First', 'Oldest First', 'Star Leads'].map((filter) => (
                  <div
                    key={filter}
                    className={`dropdown-item${activeViewFilter === filter ? ' active' : ''}`}
                    onClick={() => handleViewDropdownSelect(filter)}
                  >
                    {filter}
                  </div>
                ))}
              </div>
            )}
          </div>
          {/* Search Bar */}
          <div className="search-bar">
            <FaSearch className="search-icon" />
            <input
              type="text"
              placeholder="Search"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
          </div>
          {/* Utility Buttons */}
          <div className="utility-buttons">
            <button className="icon-btn" title="Sales Configuration"><FaCog /></button>
            <button className="icon-btn" title="Display Preferences" onClick={() => setShowDisplayPref(true)}><FaBars /></button>
            <button className="icon-btn" title="Export to Excel" onClick={handleExportToExcel}><FaFileExport /></button>
            <button className="icon-btn" title="Show Leads Dashboard"><FaTh /></button>
            <button className="icon-btn" title="Reports" onClick={handleReportsClick}><FaChartBar /></button>
          </div>
        </div>
      </div>

      {/* Filter Section */}
      <div className="filter-section">
        <div className="view-filters-container">
          {/* Left: Action buttons */}
          <div className="action-buttons-center">
            <div className="action-buttons">
              <button className="add-lead-btn" onClick={() => setShowAddLead(true)}>
                + Add Lead
              </button>
              <button className="import-btn" onClick={handleImportClick}>
                <FaDownload /> Import
              </button>
              <button className="customize-btn" onClick={handleCustomizeClick}>
                <FaWrench /> Customize
              </button>
            </div>
          </div>
          {/* Center: Selected count overlay */}
          <div className="selected-count-overlay-center">
            <div className={`selected-count-overlay ${selectedLeadsCount > 0 ? 'visible' : ''}`}>
              Selected: {selectedLeadsCount}
            </div>
          </div>
          {/* Right: Stats section */}
          <div className="stats-section">
            <div className="count">Count: {leads.length}</div>
            <div className="selected-count">Selected: {selectedLeadsCount}</div>
            <div className="potential">Potential: {formatIndianRupees(leads.reduce((sum, lead) => sum + parseInt(lead.potential || "0"), 0))}</div>
          </div>
        </div>
      </div>

      {/* Leads Table */}
      <div className="table-container">
        <table>
          <thead>
            <tr>
              <th className="checkbox-cell">
                <input
                  type="checkbox"
                  onChange={handleSelectAll}
                  checked={leads.length > 0 && leads.every(lead => lead.selected)}
                  disabled={leads.length === 0}
                />
              </th>
              <th className="serial-number">S.No</th>
              {/* Render only selected fields */}
              {displayFields.map(field => (
                <th key={field.key}>{field.label}</th>
              ))}
              <th className="action-column">Actions</th>
            </tr>
          </thead>
          <tbody>
            {/* If no displayFields, show "No items to display" */}
            {displayFields.length === 0 ? (
              <tr>
                <td colSpan={2 + 1 + 1} style={{ textAlign: 'center', color: '#888' }}>
                  No items to display
                </td>
              </tr>
            ) : (
              Array.isArray(paginatedLeads) && paginatedLeads.map((lead, index) => (
                <tr key={lead.id || index}>
                  <td className="checkbox-cell">
                    <input
                      type="checkbox"
                      checked={!!lead.selected}
                      onChange={() => handleSelectRow(lead.id)}
                    />
                  </td>
                  <td className="serial-number">
                    <span
                      className={`star-icon ${lead.starred ? 'starred' : ''}`}
                      title={lead.starred ? 'Unmark as Star' : 'Mark as Star'}
                      onClick={() => handleToggleStar(lead.id)}
                    >
                      <FaStar />
                    </span>
                    {(pageNo - 1) * rowsPerPage + index + 1}
                  </td>
                  {/* Render only selected fields */}
                  {displayFields.map(field => (
                    <td key={field.key}>
                      {/* Highlight searched characters for string fields */}
                      {(() => {
                        let value;
                        if (field.key === 'name') {
                          value = lead.name && lead.name.trim()
                            ? lead.name
                            : lead.contact && lead.contact.trim()
                              ? lead.contact
                              : [lead.prefix, lead.firstName, lead.lastName].filter(Boolean).join(' ');
                        } else if (field.key === 'potential') {
                          value = `₹${lead.potential || ''}`;
                        } else if (field.key === 'since' || field.key === 'lastTalk' || field.key === 'nextTalk' || field.key === 'transferredOn') {
                          value = formatDate(lead[field.key]);
                        } else if (field.key === 'assignedTo') {
                          value = typeof lead.assignedTo === 'object' && lead.assignedTo !== null
                            ? (lead.assignedTo.Name || lead.assignedTo.name || lead.assignedTo.email || JSON.stringify(lead.assignedTo))
                            : (lead.assignedTo || '');
                        } else if (field.key === 'product') {
                          value = typeof lead.product === 'object' && lead.product !== null
                            ? (lead.product.Name || lead.product.name || lead.product.Code || JSON.stringify(lead.product))
                            : (lead.product || '');
                        } else if (field.key === 'addressLine1') {
                          value = lead.addressLine1 || lead.addressline1 || lead.address_line1 || lead.formData?.addressLine1 || '';
                        } else if (field.key === 'addressLine2') {
                          value = lead.addressLine2 || lead.addressline2 || lead.address_line2 || lead.formData?.addressLine2 || '';
                        } else if (field.key === 'category') {
                          value = lead.category || lead.Category || lead.formData?.category || '';
                        } else if (field.key === 'tags') {
                          value = lead.tags || lead.Tags || lead.formData?.tags || '';
                        } else if (field.key === 'lastTalk') {
                          value = formatDate(lead.lastTalk || lead.LastTalk || lead.last_talk || lead.lasttalk || lead.createdAt || '');
                        } else if (field.key === 'nextTalk') {
                          value = formatDate(lead.nextTalk || lead.NextTalk || lead.next_talk || lead.nexttalk || '');
                        } else if (field.key === 'transferredOn') {
                          value = formatDate(lead.transferredOn || lead.TransferredOn || lead.transferred_on || lead.transferredon || '');
                        } else if (field.key === 'assignedToId') {
                          value = lead.assigned_to_id || lead.assignedToId || lead.AssignedToID || '';
                        } else if (field.key === 'productId') {
                          value = lead.product_id || lead.productId || lead.ProductID || '';
                        } else if (field.key === 'createdAt') {
                          value = formatDateTime(lead.createdAt || lead.CreatedAt || '');
                        } else if (field.key === 'updatedAt') {
                          value = formatDateTime(lead.updatedAt || lead.UpdatedAt || '');
                        } else {
                          value = lead[field.key] || '';
                        }
                        // Only highlight for string values and if searchTerm is present
                        return typeof value === 'string' && searchTerm
                          ? highlightText(value, searchTerm)
                          : value;
                      })()}
                    </td>
                  ))}
                  <td className="action-cell">
                    <button
                      className="edit-btn"
                      title="Edit Lead"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleEditRow(lead);
                      }}
                    >
                      <FaEdit />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteRow(lead.id);
                      }}
                      className="delete-btn"
                      title="Delete Lead"
                    >
                      <FaTrash />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Section */}
      <div className="pagination-section">
        <button onClick={handlePrevPage} disabled={pageNo === 1}>Previous</button>
        <span>Page {pageNo} of {totalPages}</span>
        <span>
          Rows per page:
          <select value={rowsPerPage} onChange={handleRowsPerPageChange}>
            {[5, 10, 25, 50].map(n => (
              <option key={n} value={n}>{n}</option>
            ))}
          </select>
        </span>
        <button onClick={handleNextPage} disabled={pageNo === totalPages}>Next</button>
      </div>

      {/* Display Preferences Modal */}
      {showDisplayPref && (
        <DisplayPref onClose={() => setShowDisplayPref(false)} />
      )}

      {/* Add Lead Modal */}
      <AddLead
        isOpen={showAddLead}
        onClose={() => { setShowAddLead(false); setEditLead(null); }}
        onAddLeadSubmit={handleAddLeadModalSubmit}
        leadData={editLead}
        products={products}
      />
      <input
        type="file"
        ref={fileInputRef}
        style={{ display: 'none' }}
        accept=".xlsx,.xls"
        onChange={handleFileUpload}
      />
    </div>
  );
};

export default TopMenu;