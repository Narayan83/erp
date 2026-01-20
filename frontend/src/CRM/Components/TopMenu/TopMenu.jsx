// Import dependencies
import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
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
import ImportLeadsDialog from './ImportLeadsDialog';
import LeadDetails from '../LeadDetails/LeadDetails';
import Pagination from '../../../CommonComponents/Pagination';

import {BASE_URL} from '../../../config/Config' 

// Assigned to options will be loaded from backend users
// (fallback to a small static list while loading)
const DEFAULT_ASSIGNED = [
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
  { key: 'gstin', label: 'GSTIN' },
  { key: 'source', label: 'Source' },
  { key: 'stage', label: 'Stage' },
  { key: 'potential', label: 'Potential (₹)' },
  { key: 'since', label: 'Since' },
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
  const [showImportDialog, setShowImportDialog] = useState(false);
  const [editLead, setEditLead] = useState(null);
  const [showLeadDetails, setShowLeadDetails] = useState(false);
  const [leadDetails, setLeadDetails] = useState(null);
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

  // Assigned to options (fetched from backend users)
  const [assignedToOptions, setAssignedToOptions] = useState(DEFAULT_ASSIGNED);

  // Interactions and followups for lookup maps
  const [interactions, setInteractions] = useState([]);
  const [followups, setFollowups] = useState([]);

  // -------------------- Effects --------------------
  // Fetch leads from backend
  useEffect(() => {
    fetchLeads();
  }, []);

  // Fetch interactions and followups to build lookup maps for lastTalk and nextTalk
  useEffect(() => {
    const loadInteractionsAndFollowups = async () => {
      try {
        const [interRes, followRes] = await Promise.all([
          fetch(`${BASE_URL}/api/lead-interactions`),
          fetch(`${BASE_URL}/api/lead-followups`)
        ]);
        const interData = await interRes.json();
        const followData = await followRes.json();
        const interArr = Array.isArray(interData) ? interData : (interData && interData.data ? interData.data : []);
        const followArr = Array.isArray(followData) ? followData : (followData && followData.data ? followData.data : []);
        console.log('Fetched interactions:', interArr);
        console.log('Fetched followups:', followArr);
        setInteractions(interArr);
        setFollowups(followArr);
      } catch (err) {
        console.error('Failed to load interactions or followups', err);
      }
    };
    loadInteractionsAndFollowups();
    const handler = () => { loadInteractionsAndFollowups(); };
    window.addEventListener('lead:interaction.saved', handler);
    return () => { window.removeEventListener('lead:interaction.saved', handler); };
  }, []);

  // Listen for leads import events (same-tab via CustomEvent and cross-tab via storage events)
  useEffect(() => {
    const onLeadsImported = (e) => {
      console.log('Detected leads:imported event', e && e.detail);
      fetchLeads();
    };
    const onStorage = (e) => {
      if (e.key === 'leads:imported') {
        console.log('Detected leads:imported via storage event', e.newValue);
        fetchLeads();
      }
    };
    window.addEventListener('leads:imported', onLeadsImported);
    window.addEventListener('storage', onStorage);
    return () => {
      window.removeEventListener('leads:imported', onLeadsImported);
      window.removeEventListener('storage', onStorage);
    };
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

  // Fetch employees to populate assignedToOptions
  useEffect(() => {
    const fetchEmployees = async () => {
      try {
        // try to fetch many employees; endpoint returns array
        const res = await fetch(`${BASE_URL}/api/employees?page=1&limit=1000`);
        const data = await res.json();
        // Data is an array
        const employeesList = Array.isArray(data) ? data : [];
        const opts = employeesList.map(u => ({ id: u.id, name: (u.firstname || u.Firstname || '') + (u.lastname ? (' ' + u.lastname) : '') || u.email || String(u.id) }));
        if (opts.length > 0) setAssignedToOptions(opts);
      } catch (err) {
        // keep default assignedToOptions
      }
    };
    fetchEmployees();
  }, []);

  // If assignedToOptions load later, update existing leads to show resolved assignedTo names
  useEffect(() => {
    if (!assignedToOptions || assignedToOptions.length === 0) return;
    setLeads(prev => prev.map(l => {
      const cur = l.assignedTo;
      // If it's a non-numeric string (already a name), keep it
      if (cur && typeof cur === 'string' && !/^\d+$/.test(cur.trim())) return l;
      // Determine candidate id from multiple possible fields
      let idCandidate;
      if (cur && (typeof cur === 'number' || (typeof cur === 'string' && /^\d+$/.test(cur.trim())))) {
        idCandidate = Number(cur);
      } else if (l.assigned_to_id !== undefined && l.assigned_to_id !== null && l.assigned_to_id !== '') {
        idCandidate = Number(l.assigned_to_id);
      } else if (l.assignedToId !== undefined && l.assignedToId !== null && l.assignedToId !== '') {
        idCandidate = Number(l.assignedToId);
      }
      if (idCandidate === undefined || isNaN(idCandidate)) return l;
      const found = assignedToOptions.find(opt => Number(opt.id) === idCandidate);
      const resolved = found ? found.name : String(idCandidate);
      if (String(resolved) === String(cur)) return l;
      return { ...l, assignedTo: resolved };
    }));
  }, [assignedToOptions]);

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

  // If navigated here from dashboard with state, apply requested filters
  const location = useLocation();
  useEffect(() => {
    if (location && location.state && location.state.statusFilter) {
      setActiveStatusFilter(location.state.statusFilter);
      // clear state so it doesn't reapply on history navigation
      try { window.history.replaceState({}, document.title, window.location.pathname + window.location.search); } catch (e) { /* ignore */ }
    }
  }, [location && location.state]);

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
      const backendLeads = (data.data || []).map(lead => {
        // Normalize assigned fields: id and display name from multiple possible backend shapes
        const assignedId = lead.assigned_to_id || lead.assignedToId || (lead.assignedTo && typeof lead.assignedTo === 'number' ? lead.assignedTo : undefined);
        let assignedName = '';
        if (lead.assignedTo && typeof lead.assignedTo === 'string') {
          assignedName = lead.assignedTo;
        } else if (lead.assignedTo && typeof lead.assignedTo === 'object') {
          assignedName = lead.assignedTo.name || lead.assignedTo.Name || '';
        } else if (lead.assignedToName) {
          assignedName = lead.assignedToName;
        } else if (lead.assigned_to_name) {
          assignedName = lead.assigned_to_name;
        } else if (assignedId !== undefined && assignedId !== null) {
          const found = assignedToOptions.find(opt => Number(opt.id) === Number(assignedId));
          assignedName = found ? found.name : String(assignedId);
        }

        return {
          ...lead,
          starred: !!starredMap[lead.id],
          product: lead.productName || '',
          assignedTo: assignedName,
          assigned_to_id: assignedId,
          // Normalize field names to match case-sensitive keys
          addressLine1: lead.addressLine1 || lead.addressline1 || lead.address_line1 || lead.formData?.addressLine1 || '',
          addressLine2: lead.addressLine2 || lead.addressline2 || lead.address_line2 || lead.formData?.addressLine2 || '',
          category: lead.category || lead.Category || lead.formData?.category || '',
          tags: lead.tags || lead.Tags || lead.formData?.tags || '',
          // Normalize timestamps from backend (created_at / createdAt / CreatedAt)
          createdAt: lead.createdAt || lead.CreatedAt || lead.created_at || lead.created_at_time || null,
          updatedAt: lead.updatedAt || lead.UpdatedAt || lead.updated_at || lead.updated_at_time || null
        };
      });

      // Get imported leads from localStorage (those without backend id)
      const importedLeadsRaw = (JSON.parse(localStorage.getItem('importedLeads') || '[]') || []);
      // Ensure imported leads have createdAt/updatedAt for display
      const importedLeads = importedLeadsRaw.map(l => ({
        ...l,
        createdAt: l.createdAt || l.CreatedAt || l.created_at || new Date().toISOString(),
        updatedAt: l.updatedAt || l.UpdatedAt || l.updated_at || l.createdAt || new Date().toISOString()
      }));

      // Merge backend and imported leads (backend first)
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
  const handleReportsClick = () => window.open(`${window.location.origin}/reports`, '_blank');
  const handleCustomizeClick = () => window.open(`${window.location.origin}/customize`, '_blank');
  // Navigate to Sales Configuration and request the CRM-only section
  const handleSalesConfigClick = () => window.open(`${window.location.origin}/sales-configuration?section=crm`, '_blank');
  // Open leads dashboard
  const handleDashboardClick = () => navigate('/leads-dashboard');

  // Lead actions
  const handleAddLeadSubmit = async (newLeadData) => {
    try {
      const contact = [newLeadData.prefix || '', newLeadData.firstName || '', newLeadData.lastName || ''].filter(Boolean).join(' ').trim();
      // Only include assigned_to_id if it's a valid known option; otherwise omit to avoid FK errors
      let assigned_to_id = undefined;
      if (newLeadData.assignedTo !== undefined && newLeadData.assignedTo !== null && newLeadData.assignedTo !== '') {
        const numericAssignee = Number(newLeadData.assignedTo);
        if (!isNaN(numericAssignee) && assignedToOptions.some(opt => Number(opt.id) === numericAssignee)) {
          assigned_to_id = numericAssignee;
        } else {
          const assignedToObj = assignedToOptions.find(opt => opt.name === newLeadData.assignedTo);
          if (assignedToObj) assigned_to_id = assignedToObj.id;
        }
      }
      // Resolve product to a valid numeric product_id when possible to avoid FK errors
      let product_id = undefined;
      let productNameForPayload = newLeadData.product;
      if (newLeadData.product) {
        // If product is an object, extract ID and Name
        if (typeof newLeadData.product === 'object' && newLeadData.product !== null) {
          product_id = newLeadData.product.ID || newLeadData.product.id;
          productNameForPayload = newLeadData.product.Name || newLeadData.product.name || newLeadData.product.Code || '';
        } else {
          // Try to parse as number first
          const numProduct = Number(newLeadData.product);
          if (!isNaN(numProduct) && numProduct !== 0) {
            product_id = numProduct;
          } else {
            // try to find by product name in products list
            const foundProduct = products.find(p => (p.ID && String(p.ID) === String(newLeadData.product)) || (p.id && String(p.id) === String(newLeadData.product)) || (p.Name && p.Name === newLeadData.product) || (p.name && p.name === newLeadData.product));
            if (foundProduct) {
              product_id = foundProduct.ID || foundProduct.id;
              productNameForPayload = foundProduct.Name || foundProduct.name || foundProduct.Code || newLeadData.product;
            }
          }
        }
      }

      const payload = {
        business: newLeadData.business,
        contact: contact || newLeadData.name || newLeadData.contact,
        designation: newLeadData.designation,
        mobile: newLeadData.mobile,
        email: newLeadData.email,
        city: newLeadData.city,
        state: newLeadData.state,
        country: newLeadData.country,
        gstin: newLeadData.gstin,
        source: newLeadData.source,
        stage: newLeadData.stage,
        potential: parseFloat(newLeadData.potential) || 0,
        since: newLeadData.since || new Date().toISOString(),
        website: newLeadData.website,
        requirements: newLeadData.requirement,
        notes: newLeadData.notes,
        assigned_to_id,
        addressLine1: newLeadData.addressLine1,
        addressLine2: newLeadData.addressLine2,
        category: newLeadData.category,
        tags: newLeadData.tags,
        productName: productNameForPayload
      };

      if (product_id !== undefined) payload.product_id = product_id;
      if (assigned_to_id !== undefined) payload.assigned_to_id = assigned_to_id;
      // Only include productName in payload if we have a name text and no product_id
      if (!product_id && productNameForPayload) {
        payload.productName = productNameForPayload;
      }

      // Strip empty/undefined/null values to avoid backend parse/validation issues
      Object.keys(payload).forEach((k) => {
        if (payload[k] === '' || payload[k] === undefined || payload[k] === null) {
          delete payload[k];
        }
      });
      if (editLead && editLead.id) {
        // Backend lead: update via API
        const res = await fetch(`${BASE_URL}/api/leads/${editLead.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        const data = await res.json();
        if (res.ok) {
          // Update leads state immediately for instant UI
          setLeads(prev => prev.map(l => l.id === editLead.id ? { ...l, ...data, product: productNameForPayload, assignedTo: assignedToOptions.find(opt => opt.id === assigned_to_id)?.name || '' } : l));
        } else {
          console.error('Failed to update lead:', data);
        }
        await fetchLeads();
      } else if (editLead && (!editLead.id || typeof editLead.id !== 'number')) {
        // Imported lead: create on backend, then remove from local importedLeads
        try {
          // If editLead contains createdAt/updatedAt (imported), include them in payload
          if (editLead && editLead.createdAt) payload.created_at = editLead.createdAt;
          if (editLead && editLead.updatedAt) payload.updated_at = editLead.updatedAt;
          // include name as fallback
          payload.name = payload.name || payload.contact || editLead?.name || '';

          const res = await fetch(`${BASE_URL}/api/leads`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
          });
          if (res && res.ok) {
            const created = await res.json().catch(() => null);
            // transfer starred flag from imported to new backend id
            try {
              const starredMap = JSON.parse(localStorage.getItem('starredLeads') || '{}');
              if (starredMap && editLead.id && starredMap[editLead.id]) {
                if (created && created.id) {
                  starredMap[created.id] = true;
                }
                delete starredMap[editLead.id];
                localStorage.setItem('starredLeads', JSON.stringify(starredMap));
              }
            } catch (e) {}
            // remove from imported localStorage
            try {
              const imported = JSON.parse(localStorage.getItem('importedLeads') || '[]') || [];
              const updated = imported.filter(l => l.id !== editLead.id);
              localStorage.setItem('importedLeads', JSON.stringify(updated));
            } catch (e) {}
            await fetchLeads();
          } else {
            const err = await res.json().catch(() => ({ error: 'Failed to save imported lead' }));
            console.error('Failed saving imported lead:', err);
            alert(err.error || 'Failed to save imported lead');
          }
        } catch (err) {
          console.error('Failed to save imported lead to backend:', err);
        }
        setShowAddLead(false);
        setEditLead(null);
      } else {
        // New lead: add via API
        const res = await fetch(`${BASE_URL}/api/leads`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        const data = await res.json();
        if (res.ok) {
          // Update leads state immediately for instant UI
          setLeads(prev => {
            const newLead = { ...data, starred: false, product: productNameForPayload, assignedTo: assignedToOptions.find(opt => opt.id === assigned_to_id)?.name || '' };
            return [newLead, ...prev];
          });
        } else {
          console.error('Failed to add lead:', data);
        }
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

  const handleImportClick = () => setShowImportDialog(true);

  const handleDeleteRow = async (leadId) => {
    if (window.confirm('Are you sure you want to delete this lead?')) {
      try {
        // If leadId is not a number (imported/local lead), remove from localStorage instead of calling backend
        const idNum = Number(leadId);
        if (!idNum || isNaN(idNum)) {
          const importedLeads = JSON.parse(localStorage.getItem('importedLeads') || '[]') || [];
          const updated = importedLeads.filter(l => l.id !== leadId);
          localStorage.setItem('importedLeads', JSON.stringify(updated));
          setLeads(prev => prev.filter(l => l.id !== leadId));
          return;
        }

        const res = await fetch(`${BASE_URL}/api/leads/${leadId}`, { method: 'DELETE' });
        if (!res.ok) {
          const err = await res.json().catch(() => ({ error: 'Failed to delete lead' }));
          console.error('Delete failed:', err);
          alert(err.error || 'Failed to delete lead');
          return;
        }
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
    // Extract product name from object if needed
    let productName = lead.product;
    if (typeof productName === 'object' && productName !== null) {
      productName = productName.Name || productName.name || productName.Code || '';
    }
    setEditLead({
      ...lead,
      assignedTo: assignedToName,
      id: lead.id,
      addressLine1: lead.addressLine1 || '',
      addressLine2: lead.addressLine2 || '',
      category: lead.category || '',
      product: productName,
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
  // Get the most recent interaction timestamp for a lead
  const getLastTalkForLead = (leadId) => {
    const leadIdStr = String(leadId);
    const leadInteractions = interactions.filter(i => String(i.lead_id || i.LeadID || i.lead || '') === leadIdStr);
    if (leadInteractions.length === 0) return '';
    const mapped = leadInteractions.map(i => {
      const ts = i.timestamp || i.Timestamp || i.created_at || i.createdAt || '';
      return ts ? new Date(ts) : null;
    }).filter(d => d && !isNaN(d));
    if (mapped.length === 0) return '';
    mapped.sort((a, b) => b - a);
    return mapped[0].toISOString();
  };

  // Get the next pending followup date for a lead (nearest future or earliest overall)
  const getNextTalkForLead = (leadId) => {
    const leadIdStr = String(leadId);
    const leadFollowups = followups.filter(f => {
      const lid = String(f.lead_id || f.LeadID || (f.lead && f.lead.id) || f.lead || '');
      const status = (f.status || f.Status || '').toString().toLowerCase();
      return lid === leadIdStr && (status === 'pending' || status === '' || status === undefined);
    });
    if (leadFollowups.length === 0) return '';
    const mapped = leadFollowups.map(f => {
      const dt = f.followup_on || f.FollowUpOn || f.followupOn || '';
      return dt ? new Date(dt) : null;
    }).filter(d => d && !isNaN(d));
    if (mapped.length === 0) return '';
    const now = new Date();
    let candidates = mapped.filter(d => d >= now);
    if (candidates.length === 0) candidates = mapped;
    candidates.sort((a, b) => a - b);
    return candidates[0].toISOString();
  };

  // Strict date formatter: returns empty string for falsy, invalid or placeholder dates.
  // Optionally hides dates that are effectively 'now' (within 2 minutes) which often come from imported/default values.
  const formatDateStrict = (dateStr, { hideIfNow = false } = {}) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    if (isNaN(date)) return '';

    const year = date.getFullYear();
    const currentYear = new Date().getFullYear();
    // Hide clearly invalid or placeholder years (too old or far future)
    if (year < 1900 || year > currentYear + 5) return '';

    if (hideIfNow) {
      const now = Date.now();
      // if date is within 2 minutes of now, treat it as default and hide
      if (Math.abs(now - date.getTime()) < 2 * 60 * 1000) return '';
    }

    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    return `${day}-${month}-${year}`;
  }; 

  // Backwards-compatible alias for fields where we want to show recent dates as well
  const formatDate = (dateStr) => formatDateStrict(dateStr, { hideIfNow: false });

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
          const nowIso = new Date().toISOString();

          // Sanitize imported date values: return ISO string or empty to avoid bogus placeholder years
          const sanitizeImportDate = (val) => {
            if (!val) return '';
            const d = new Date(val);
            if (isNaN(d)) return '';
            const y = d.getFullYear();
            const currentYear = new Date().getFullYear();
            if (y < 1900 || y > currentYear + 5) return '';
            return d.toISOString();
          };

          const newLeads = jsonData.map((row, index) => ({
            // Remove id or use a string id to avoid collision with backend ids
            id: `imported_${Date.now()}_${index}`,
            business: row.Business || row.business || '',
            // Name/contact
            contact: row.Contact || row.contact || row.Name || row.name || '',
            name: row.Name || row.name || row.Contact || row.contact || '',
            designation: row.Designation || row.designation || '',
            mobile: row.Mobile || row.mobile || '',
            email: row.Email || row.email || '',
            // Address lines
            addressLine1: row['Address Line 1'] || row.AddressLine1 || row.addressLine1 || row.Address1 || row.address1 || '',
            addressLine2: row['Address Line 2'] || row.AddressLine2 || row.addressLine2 || row.Address2 || row.address2 || '',
            city: row.City || row.city || '',
            state: row.State || row.state || '',
            country: row.Country || row.country || '',
            gstin: row.GSTIN || row.gstin || '',
            source: row.Source || row.source || 'Import from CSV',
            stage: row.Stage || row.stage || '',
            potential: (row.Potential || row['Potential (₹)'] || row.potential || '0').toString().replace(/[^\d]/g, ''),
            since: sanitizeImportDate(row.Since || row.since || '') || nowIso,
            assignedTo: row['Assigned to'] || row['AssignedTo'] || row['Assigned To'] || '',
            product: row.Product || row.product || '',
            website: row.Website || row.website || '',
            lastTalk: sanitizeImportDate(row['Last Talk'] || row.LastTalk || ''),
            nextTalk: sanitizeImportDate(row['Next Talk'] || row.NextTalk || row.Next || ''),
            transferredOn: sanitizeImportDate(row['Transferred on'] || row['TransferredOn'] || row['Transfer Date'] || ''),
            // Category and tags
            category: row.Category || row.category || '',
            tags: row.Tags || row.tags || row.Tag || row.tag || '',
            requirements: row.Requirements || row.requirements || '',
            notes: row.Notes || row.notes || '',
            // timestamps for local display and later POSTing
            createdAt: nowIso,
            updatedAt: nowIso,
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
          // Attempt to persist imported leads to backend immediately
          persistImportedLeads(newLeads).then(({ successCount, failCount }) => {
            const msg = `Imported ${newLeads.length} row(s). Saved to database: ${successCount}. Failed: ${failCount}.`;
            alert(msg);
          });
        } catch (error) {
          alert('Error importing file. Please ensure the column names match exactly: "Assigned to" and "Transferred on"');
        }
      };
      reader.readAsArrayBuffer(file);
    }
  };

  // Persist a batch of imported leads to backend and update localStorage accordingly
  const persistImportedLeads = async (leadsBatch) => {
    let successCount = 0;
    let failCount = 0;
    const succeededIds = [];

    for (const l of leadsBatch) {
      try {
        // Resolve assigned_to_id only if valid in our limited options
        // Accept both `assignedTo` and `assignedToName` from imported objects
        let assigned_to_id;
        const assignedRaw = (l.assignedToName !== undefined && l.assignedToName !== null) ? l.assignedToName : l.assignedTo;
        if (assignedRaw !== undefined && assignedRaw !== null && assignedRaw !== '') {
          const num = Number(assignedRaw);
          if (!isNaN(num) && assignedToOptions.some(opt => Number(opt.id) === num)) {
            assigned_to_id = num;
          } else {
            const match = assignedToOptions.find(opt => opt.name === assignedRaw);
            if (match) assigned_to_id = match.id;
          }
        }

        // Resolve product id if possible (by id or by name from loaded products)
        // Accept both `product` and `productName` from imported objects
        let product_id;
        const productRaw = (l.productName !== undefined && l.productName !== null) ? l.productName : l.product;
        if (productRaw !== undefined && productRaw !== null && productRaw !== '') {
          const pnum = Number(productRaw);
          if (!isNaN(pnum)) {
            product_id = pnum;
          } else {
            const foundProduct = products.find(p => (p.ID && (String(p.ID) === String(productRaw) || p.Name === productRaw)) || (p.id && (String(p.id) === String(productRaw) || p.name === productRaw)));
            if (foundProduct) product_id = foundProduct.ID || foundProduct.id;
          }
        }

        // Build payload
        const payload = {
          business: l.business || l.SENDER_COMPANY || '',
          contact: l.contact || l.name || l.SENDER_NAME || [l.prefix, l.firstName, l.lastName].filter(Boolean).join(' '),
          designation: l.designation,
          mobile: l.mobile || l.SENDER_MOBILE || '',
          email: l.email || l.SENDER_EMAIL || '',
          city: l.city || l.SENDER_CITY || '',
          state: l.state || l.SENDER_STATE || '',
          country: l.country || l.buyer_country || '',
          gstin: l.gstin || '',
          source: l.source || l.enquiry_source || 'Import from CSV',
          stage: l.stage || l.lead_stage || l.STATUS || 'New',
          potential: parseFloat((l.potential || l.estimated_value || '0').toString()) || 0,
          since: (() => {
            const d = new Date(l.since || l.QUERY_TIME || l.enquiry_date || l.createdAt);
            return isNaN(d) ? new Date().toISOString() : d.toISOString();
          })(),
          website: l.website || '',
          requirements: l.requirements || l.requirement || l.QUERY_MESSAGE || l.buyer_requirement || '',
          notes: l.notes || l.remarks || '',
          addressLine1: l.addressLine1 || l.buyer_address || '',
          addressLine2: l.addressLine2 || '',
          category: l.category || l.lead_category || l.QUERY_CATEGORY_NAME || '',
          tags: l.tags || (Array.isArray(l.lead_tags) ? l.lead_tags.join(',') : ''),
        };

        if (product_id !== undefined) payload.product_id = product_id;
        if (assigned_to_id !== undefined) payload.assigned_to_id = assigned_to_id;
        // Also send textual values so backend can store exact CSV text when IDs are not resolvable
        const sendProductText = (l.productName !== undefined && l.productName !== null && l.productName !== '') ? l.productName : l.product;
        if (sendProductText !== undefined && sendProductText !== null && sendProductText !== '') payload.productName = sendProductText;
        const sendAssignedText = (l.assignedToName !== undefined && l.assignedToName !== null && l.assignedToName !== '') ? l.assignedToName : l.assignedTo;
        if (sendAssignedText !== undefined && sendAssignedText !== null && sendAssignedText !== '') payload.assignedToName = sendAssignedText;
        if (l.createdAt) payload.created_at = l.createdAt;
        if (l.updatedAt) payload.updated_at = l.updatedAt;
        // also include name explicitly for backend compatibility
        payload.name = payload.name || payload.contact;

        // Strip empty-like fields
        Object.keys(payload).forEach((k) => {
          if (payload[k] === '' || payload[k] === undefined || payload[k] === null) delete payload[k];
        });

        // Skip if required fields are missing
        if (!payload.business || !payload.contact || !payload.mobile || !payload.email) {
          console.warn('Skipping lead due to missing required fields:', payload);
          failCount += 1;
          continue;
        }

        console.log('Sending payload:', payload); // Debug log

        const res = await fetch(`${BASE_URL}/api/leads`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });

        if (res.ok) {
          successCount += 1;
          succeededIds.push(l.id);
        } else {
          failCount += 1;
          console.error(`Failed to save lead ${l.id}:`, res.status, await res.text()); // Debug log
        }
      } catch (err) {
        failCount += 1;
      }
    }

    // Remove succeeded from localStorage importedLeads
    try {
      const imported = JSON.parse(localStorage.getItem('importedLeads') || '[]') || [];
      const remaining = imported.filter(x => !succeededIds.includes(x.id));
      localStorage.setItem('importedLeads', JSON.stringify(remaining));
      // Refresh table to reflect backend + remaining imported
      await fetchLeads();
    } catch (e) {
      // ignore localStorage errors
    }

    return { successCount, failCount };
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
        } else if (field.key === 'since') {
          value = formatDate(lead.since);
        } else if (field.key === 'lastTalk' || field.key === 'nextTalk' || field.key === 'transferredOn') {
          value = formatDateStrict(lead[field.key], { hideIfNow: true });
        } else if (field.key === 'assignedTo') {
          value = lead.assignedToName || (typeof lead.assignedTo === 'object' && lead.assignedTo !== null
            ? (lead.assignedTo.Name || lead.assignedTo.name || lead.assignedTo.email || '')
            : (lead.assignedTo || ''));
        } else if (field.key === 'product') {
          value = lead.productName || (typeof lead.product === 'object' && lead.product !== null
            ? (lead.product.Name || lead.product.name || lead.product.Code || '')
            : (lead.product || ''));
        } else if (field.key === 'addressLine1') {
          value = lead.addressLine1 || lead.addressline1 || lead.address_line1 || lead.formData?.addressLine1 || '';
        } else if (field.key === 'addressLine2') {
          value = lead.addressLine2 || lead.addressline2 || lead.address_line2 || lead.formData?.addressLine2 || '';
        } else if (field.key === 'category') {
          value = lead.category || lead.Category || lead.formData?.category || '';
        } else if (field.key === 'tags') {
          value = lead.tags || lead.Tags || lead.formData?.tags || '';
        } else if (field.key === 'lastTalk') {
          const recentInteraction = getLastTalkForLead(lead.id);
          // Show very recent interactions immediately (don't hide 'now')
          value = formatDateStrict(recentInteraction || lead.lastTalk || lead.LastTalk || lead.last_talk || lead.lasttalk || lead.createdAt || '', { hideIfNow: false });
        } else if (field.key === 'nextTalk') {
          const nextFollowup = getNextTalkForLead(lead.id);
          value = formatDateStrict(nextFollowup || lead.nextTalk || lead.NextTalk || lead.next_talk || lead.nexttalk || '', { hideIfNow: true });
        } else if (field.key === 'transferredOn') {
          value = formatDateStrict(lead.transferredOn || lead.TransferredOn || lead.transferred_on || lead.transferredon || '', { hideIfNow: true });
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
    if (status === 'Appointment') return leads.filter(lead => lead.stage && lead.stage.toLowerCase() === 'appointment');
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

  // -------------------- Lead Stats --------------------
  const isSameDay = (d) => {
    if (!d) return false;
    const dt = new Date(d);
    if (isNaN(dt)) return false;
    const today = new Date();
    return dt.getFullYear() === today.getFullYear() && dt.getMonth() === today.getMonth() && dt.getDate() === today.getDate();
  };

  const totalLeads = leads.length;
  const todaysLeads = leads.filter(l => isSameDay(l.createdAt || l.created_at || l.CreatedAt)).length;
  const contactedCount = leads.filter(l => {
    const stage = (l.stage || l.Stage || '').toString().toLowerCase();
    if (['discussion', 'appointment', 'demo', 'proposal', 'decided', 'contacted'].includes(stage)) return true;
    if (l.lastTalk || l.last_talk || l.last_contacted) return true;
    return false;
  }).length;
  const pendingCount = leads.filter(l => {
    const stage = (l.stage || l.Stage || '').toString().toLowerCase();
    return stage === 'pending' || stage === 'new' || stage === '' || stage === 'open';
  }).length;
  const rejectedCount = leads.filter(l => {
    const stage = (l.stage || l.Stage || '').toString().toLowerCase();
    return ['rejected', 'inactive', 'lost', 'disqualified'].includes(stage);
  }).length;

  const convertedCount = leads.filter(l => {
    const stage = (l.stage || l.Stage || '').toString().toLowerCase();
    return ['decided', 'converted', 'won'].includes(stage);
  }).length;

  const isConverted = (lead) => {
    const stage = (lead.stage || lead.Stage || '').toString().toLowerCase();
    return ['decided', 'converted', 'won'].includes(stage);
  };

  const isRejected = (lead) => {
    const stage = (lead.stage || lead.Stage || '').toString().toLowerCase();
    return ['rejected', 'inactive', 'lost', 'disqualified'].includes(stage);
  }; 

  // Paginated leads for current page
  const paginatedLeads = displayedLeads.slice((pageNo - 1) * rowsPerPage, pageNo * rowsPerPage);

  // Force table re-render when interactions or followups data loads by depending on their length
  const [, forceUpdate] = React.useState();
  React.useEffect(() => {
    forceUpdate({});
  }, [interactions.length, followups.length]);

  // Pagination handlers
  const handlePrevPage = () => setPageNo(prev => Math.max(prev - 1, 1));
  const handleNextPage = () => setPageNo(prev => Math.min(prev + 1, totalPages));
  const handleRowsPerPageChange = (e) => {
    setRowsPerPage(Number(e.target.value));
    setPageNo(1); // Reset to first page
  };

  // Add this function before the return statement
  const handleAddLeadModalSubmit = async (leadOrNothing) => {
    // If leadOrNothing is an object and appears to be an imported lead, update local importedLeads
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
      // If parent passed the created backend lead object, prepend it to the leads list for immediacy
      if (leadOrNothing && leadOrNothing.id && typeof leadOrNothing.id === 'number') {
        const created = leadOrNothing;
        const assignedToName = assignedToOptions.find(opt => opt.id === created.assigned_to_id)?.name || created.assignedTo || '';
        
        // Extract product name properly
        let productName = '';
        if (created.productName) {
          productName = created.productName;
        } else if (created.product) {
          if (typeof created.product === 'object' && created.product !== null) {
            productName = created.product.Name || created.product.name || created.product.Code || '';
          } else if (typeof created.product === 'string' && created.product) {
            productName = created.product;
          }
        } else if (created.product_id) {
          // Try to find product name from products list
          const foundProduct = products.find(p => p.ID === created.product_id || p.id === created.product_id);
          productName = foundProduct ? (foundProduct.Name || foundProduct.name || '') : '';
        }
        
        const normalized = {
          ...created,
          starred: false,
          assignedTo: assignedToName,
          product: productName,
          addressLine1: created.addressLine1 || created.addressline1 || created.address_line1 || created.formData?.addressLine1 || '',
          addressLine2: created.addressLine2 || created.addressline2 || created.address_line2 || created.formData?.addressLine2 || '',
          category: created.category || created.Category || created.formData?.category || '',
          tags: created.tags || created.Tags || created.formData?.tags || '',
          createdAt: created.createdAt || created.created_at || new Date().toISOString(),
          updatedAt: created.updatedAt || created.updated_at || created.createdAt || new Date().toISOString()
        };
        setLeads(prev => {
          // remove any existing lead with same id (avoid duplicates from imported list)
          const filtered = prev.filter(l => !(l.id && l.id === normalized.id));
          return [normalized, ...filtered];
        });
      } else {
        await fetchLeads();
      }
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
                {['All Active Leads', 'Discussion','Appointment', 'Demo', 'Proposal', 'Decided', 'Inactive'].map((filter) => (
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
            <button className="icon-btn" title="Sales Configuration" onClick={handleSalesConfigClick}><FaCog /></button>
            <button className="icon-btn" title="Display Preferences" onClick={() => setShowDisplayPref(true)}><FaBars /></button>
            <button className="icon-btn" title="Export to Excel" onClick={handleExportToExcel}><FaFileExport /></button>
            <button className="icon-btn" title="Show Leads Dashboard" onClick={handleDashboardClick}><FaTh /></button>
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
            <div className="stat-box total">Total: {totalLeads}</div>
            <div className="stat-box today">Today: {todaysLeads}</div>
            <div className="stat-box contacted">Contacted: {contactedCount}</div>
            <div className="stat-box converted">Converted: {convertedCount}</div>
            <div className="stat-box pending">Pending: {pendingCount}</div>
            <div className="stat-box rejected">Rejected: {rejectedCount}</div>
            <div className="stat-box potential">Potential: {formatIndianRupees(leads.reduce((sum, lead) => sum + parseInt(lead.potential || "0"), 0))}</div> 
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
                <tr key={lead.id || index} className={isRejected(lead) ? 'rejected-row' : ''} onClick={() => { setLeadDetails(lead); setShowLeadDetails(true); }}>
                  <td className="checkbox-cell">
                    <input
                      type="checkbox"
                      onClick={e => e.stopPropagation()}
                      checked={!!lead.selected}
                      onChange={() => handleSelectRow(lead.id)}
                    />
                  </td>
                  <td className="serial-number">
                    <span
                      className={`star-icon ${lead.starred ? 'starred' : ''}`}
                      title={lead.starred ? 'Unmark as Star' : 'Mark as Star'}
                      onClick={(e) => { e.stopPropagation(); handleToggleStar(lead.id); }}
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
                        } else if (field.key === 'since') {
                          // 'since' can be shown even if it's today
                          value = formatDate(lead.since);
                        } else if (field.key === 'lastTalk') {
                          const recentInteraction = getLastTalkForLead(lead.id);
                          // Show very recent interactions immediately (don't hide 'now')
                          value = formatDateStrict(recentInteraction || lead.lastTalk || lead.LastTalk || lead.last_talk || lead.lasttalk || lead.createdAt || '', { hideIfNow: false });
                        } else if (field.key === 'nextTalk') {
                          const nextFollowup = getNextTalkForLead(lead.id);
                          value = formatDateStrict(nextFollowup || lead.nextTalk || lead.NextTalk || lead.next_talk || lead.nexttalk || '', { hideIfNow: true });
                        } else if (field.key === 'transferredOn') {
                          value = formatDateStrict(lead.transferredOn || lead.TransferredOn || lead.transferred_on || lead.transferredon || '', { hideIfNow: true });
                        } else if (field.key === 'assignedTo') {
                          // Resolve name even when stored as numeric id or numeric string
                          const cur = lead.assignedTo;
                          if (cur && typeof cur === 'string' && !/^\d+$/.test(cur.trim())) {
                            value = cur;
                          } else {
                            const idCandidate = (cur && !isNaN(Number(cur))) ? Number(cur) : (lead.assigned_to_id ? Number(lead.assigned_to_id) : undefined);
                            if (idCandidate !== undefined && !isNaN(idCandidate)) {
                              const found = assignedToOptions.find(opt => Number(opt.id) === idCandidate);
                              value = found ? found.name : String(idCandidate);
                            } else {
                              value = '';
                            }
                          }
                        } else if (field.key === 'product') {
                          value = lead.productName || (typeof lead.product === 'object' && lead.product !== null
                            ? (lead.product.Name || lead.product.name || lead.product.Code || JSON.stringify(lead.product))
                            : (lead.product || ''));
                        } else if (field.key === 'addressLine1') {
                          value = lead.addressLine1 || lead.addressline1 || lead.address_line1 || lead.formData?.addressLine1 || '';
                        } else if (field.key === 'addressLine2') {
                          value = lead.addressLine2 || lead.addressline2 || lead.address_line2 || lead.formData?.addressLine2 || '';
                        } else if (field.key === 'category') {
                          value = lead.category || lead.Category || lead.formData?.category || '';
                        } else if (field.key === 'tags') {
                          value = lead.tags || lead.Tags || lead.formData?.tags || '';
                        } else if (field.key === 'lastTalk') {
                          value = formatDateStrict(lead.lastTalk || lead.LastTalk || lead.last_talk || lead.lasttalk || lead.createdAt || '', { hideIfNow: true });
                        } else if (field.key === 'nextTalk') {
                          value = formatDateStrict(lead.nextTalk || lead.NextTalk || lead.next_talk || lead.nexttalk || '', { hideIfNow: true });
                        } else if (field.key === 'transferredOn') {
                          value = formatDateStrict(lead.transferredOn || lead.TransferredOn || lead.transferred_on || lead.transferredon || '', { hideIfNow: true });
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
        <Pagination
          page={pageNo}
          total={displayedLeads.length}
          rowsPerPage={rowsPerPage}
          isZeroBased={false}
          onPageChange={(newPage) => setPageNo(newPage)}
          onRowsPerPageChange={(newRowsPerPage) => { setRowsPerPage(newRowsPerPage); setPageNo(1); }}
        />
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
        assignedToOptions={assignedToOptions}
      />
      {/* Import Leads Dialog */}
      {showImportDialog && (
        <ImportLeadsDialog
          isOpen={showImportDialog}
          onClose={() => setShowImportDialog(false)}
          onExcelClick={() => { if (fileInputRef.current) fileInputRef.current.click(); }}
          onLeadsImport={async (importedLeads) => {
            console.log('Imported leads received:', importedLeads);
            if (importedLeads && importedLeads.length > 0) {
              try {
                // Filter out leads with missing required fields (now requiring Source, Since, Assigned To)
                const validLeads = importedLeads.filter(lead => {
                  const business = lead.company || lead.business || '';
                  const name = lead.name || lead.contact || '';
                  const email = lead.email || '';
                  const mobile = lead.phone || lead.mobile || '';
                  const source = lead.source || lead.Source || lead.enquiry_source || '';
                  const since = lead.since || lead.Since || lead.QUERY_TIME || lead.enquiry_date || '';
                  const assigned = lead.assignedTo || lead.assignedToName || lead.assigned_to || '';

                  if (!business || !name || !email || !mobile || !source || !since || !assigned) {
                    console.warn('Skipping lead with missing required fields:', {
                      business,
                      name,
                      email,
                      mobile,
                      source,
                      since,
                      assigned,
                      lead
                    });
                    return false;
                  }
                  return true;
                });

                if (validLeads.length === 0) {
                  alert('No valid leads to import. Make sure each lead has company, name, email, mobile, source, since, and assigned to.');
                  setShowImportDialog(false);
                  return;
                }

                // Prepare leads for backend import
                const leadsToImport = validLeads.map(lead => ({
                  business: lead.company || lead.business || '',
                  name: lead.name || lead.contact || 'Unknown',
                  email: lead.email || '',
                  mobile: lead.phone || lead.mobile || '',
                  product: lead.product || lead.productName || '',
                  requirements: lead.message || lead.requirement || lead.requirements || '',
                  source: lead.source || 'IndiaMART',
                  stage: lead.stage || 'New',
                  category: lead.category || '',
                  city: lead.city || '',
                  state: lead.state || '',
                  country: lead.country || '',
                  gstin: lead.gstin || '',
                  addressLine1: lead.addressLine1 || '',
                  addressLine2: lead.addressLine2 || '',
                  designation: lead.designation || '',
                  potential: parseInt(lead.estimatedValue || lead.potential || '0') || 0,
                  tags: lead.tags || ''
                }));

                // Call backend import endpoint with array directly
                console.log('Sending leads to backend import endpoint:', leadsToImport);
                const response = await fetch(`${BASE_URL}/api/leads/import`, {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify(leadsToImport)
                });

                if (response.ok) {
                  const result = await response.json();
                  console.log('Import successful:', result);
                  console.log('Import details - Created:', result.created, 'Failed:', result.failed);
                  if (result.errors && result.errors.length > 0) {
                    console.error('Import errors:', result.errors);
                  }
                  
                  alert(`Successfully imported ${result.created || validLeads.length} lead(s)${result.failed > 0 ? `, ${result.failed} failed` : ''}`);
                  
                  // Add small delay to ensure backend has committed the data
                  await new Promise(resolve => setTimeout(resolve, 500));
                  
                  // Refresh leads list after successful import and wait for it to complete
                  console.log('Refreshing leads list...');
                  await fetchLeads();
                  console.log('Leads list refreshed');

                  // Notify other components and tabs that leads were imported
                  try {
                    const importedCount = (result && (result.created || result.created === 0)) ? result.created : validLeads.length;
                    window.dispatchEvent(new CustomEvent('leads:imported', { detail: { count: importedCount } }));
                    // Use localStorage to trigger storage events across tabs
                    localStorage.setItem('leads:imported', JSON.stringify({ ts: Date.now(), count: importedCount }));
                  } catch (e) { /* ignore */ }
                  
                  // Close dialog after refresh is complete
                  setShowImportDialog(false);
                } else {
                  const error = await response.json();
                  console.error('Import failed:', error);
                  alert('Failed to import leads: ' + (error.error || 'Unknown error'));
                }
              } catch (err) {
                console.error('Error during import:', err);
                alert('Error importing leads: ' + err.message);
              }
            } else {
              setShowImportDialog(false);
            }
          }}
        />
      )}
      <input
        type="file"
        ref={fileInputRef}
        style={{ display: 'none' }}
        accept=".xlsx,.xls"
        onChange={handleFileUpload}
      />
      {/* Lead Details Modal */}
      {showLeadDetails && (
        <LeadDetails
          isOpen={showLeadDetails}
          lead={leadDetails}
          onClose={() => { setShowLeadDetails(false); setLeadDetails(null); }}
          onEdit={(lead) => { handleEditRow(lead); setShowLeadDetails(false); setLeadDetails(null); }}
          onStatusUpdate={fetchLeads}
        />
      )}
    </div>
  );
};

export default TopMenu;