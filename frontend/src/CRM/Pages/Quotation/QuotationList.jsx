import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { BASE_URL, getAuthHeaders } from "../../../config/Config";
import PrintSettingsDialog from "../../../PrintSettings/Print.jsx";
import { debounce } from "lodash";
import * as XLSX from 'xlsx';
import "./quotationlist.scss";
import Pagination from "../../../CommonComponents/Pagination";
import { getProductImage, normalizeImageUrl, normalizeQuotationNumber } from "./utils";
import { exportQuotationToExcelStyled } from "./quotationExcelExport";

import { FaSearch, FaCog, FaTh, FaChartBar, FaFilter, FaWrench, FaDownload, FaBars, FaFileExport, FaFileExcel, FaPrint, FaTrash, FaEdit, FaStar, FaChevronDown, FaCopy, FaCheckCircle, FaRedo, FaExchangeAlt, FaTimes } from 'react-icons/fa';
import {useAuth} from "../../../context/AuthContext";
import { useLocation } from "react-router-dom";


const QuotationList = () => {
  const navigate = useNavigate();
  const { getPermissions } = useAuth();
  const location = useLocation();
  const perms = getPermissions(location.pathname);
  const [quotations, setQuotations] = useState([]);
  const [displayedQuotations, setDisplayedQuotations] = useState([]);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  
  const [searchTerm, setSearchTerm] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [typeFilter, setTypeFilter] = useState("All");
  const [monthFilter, setMonthFilter] = useState("This Month");
  const [statusFilter, setStatusFilter] = useState("All");
  const [branchFilter, setBranchFilter] = useState("All Branches");
  const [executiveFilter, setExecutiveFilter] = useState("All Executives");
  const [branches, setBranches] = useState([]);
  const [executives, setExecutives] = useState([]);
  const [showDisplayPrefs, setShowDisplayPrefs] = useState(false);
  const [tempVisibleColumns, setTempVisibleColumns] = useState([]);
  const [showPrintSettings, setShowPrintSettings] = useState(false);
  const [selectedQuotation, setSelectedQuotation] = useState(null);
  const [showQuotationDetail, setShowQuotationDetail] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [showConvertModal, setShowConvertModal] = useState(false);
  const [printerHeader, setPrinterHeader] = useState(null);
  const [digitalSignature, setDigitalSignature] = useState(null);
  const [detailInteractions, setDetailInteractions] = useState([]);
  const [detailNextActions, setDetailNextActions] = useState([]);
  const [activityLoading, setActivityLoading] = useState(false);
  const [showActivityModal, setShowActivityModal] = useState(false);
  const [activityMode, setActivityMode] = useState('interaction');
  const [activitySaving, setActivitySaving] = useState(false);
  const [activityForm, setActivityForm] = useState({
    date: new Date().toISOString().slice(0, 10),
    time: new Date().toTimeString().slice(0, 5),
    type: 'General',
    note: '',
  });
  const [pendingCompleteNextAction, setPendingCompleteNextAction] = useState(null);

  const getQuotationNumber = (quotation) => normalizeQuotationNumber(quotation?.quotation_number || quotation?.references || '');

  const getHeaderLogoList = (header) => {
    if (!header) return [];
    const list = [];
    const raw = header.logos_data ?? header.LogosData;
    if (Array.isArray(raw)) {
      raw.forEach((v) => {
        if (typeof v === 'string' && v.trim()) list.push({ name: '', data: v.trim() });
        else if (v && typeof v === 'object' && typeof v.data === 'string' && v.data.trim())
          list.push({ name: String(v.name || '').trim(), data: v.data.trim() });
      });
    } else if (typeof raw === 'string') {
      try {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          parsed.forEach((v) => {
            if (typeof v === 'string' && v.trim()) list.push({ name: '', data: v.trim() });
            else if (v && typeof v === 'object' && typeof v.data === 'string' && v.data.trim())
              list.push({ name: String(v.name || '').trim(), data: v.data.trim() });
          });
        }
      } catch (e) {
        // ignore malformed legacy value
      }
    }
    const fallback = header.logo_data || header.LogoData;
    if (fallback) list.push({ name: '', data: fallback });

    // Deduplicate while preferring named entries
    const map = new Map();
    for (const item of list) {
      if (!item || !item.data) continue;
      const data = item.data;
      const name = String(item.name || '').trim();
      const existing = map.get(data);
      if (!existing) map.set(data, { name, data });
      else if (!existing.name && name) map.set(data, { name, data });
    }
    return Array.from(map.values());
  };

  const getDefaultPrintConfig = (type = 'All') => ({
    header: true,
    footer: false,
    digitalSignature: false,
    orgDupTrip: false,
    partyInformation: true,
    gstin: true,
    gstSummary: true,
    branch: true,
    bankDetails: type === 'Invoice',
    disclaimer: false,
    totalQuantity: true,
    validTill: type === 'Quotation',
    mobile: true,
    email: true,
    contactPersonName: true,
    companyBeforePOC: false,
    totalBeforeRoundOff: false,
    itemCode: true,
    notes: false,
    discountRate: true,
    discountAmt: true,
    taxableAmt: true,
    hsnSac: true,
    gstAmounts: true,
    leadTime: false,
    qtyInServices: false,
    itemFixedRate: false,
    itemRate: true,
    nonStockItemCode: false,
    autoPadSmallDocs: false,
    headerImageIndex: 0,
  });

  const [printConfig, setPrintConfig] = useState(() => {
    try {
      const saved = localStorage.getItem('printConfig_All');
      return saved ? JSON.parse(saved) : getDefaultPrintConfig('All');
    } catch (e) {
      return getDefaultPrintConfig('All');
    }
  });

  // derive a user-facing document type from a quotation object
  const getDocType = (q) => {
    if (!q) return 'Quotation';
    const pick = (v) => (v === undefined || v === null) ? null : String(v).trim();
    const candidates = [
      pick(q.document_type),
      pick(q.type),
      pick(q.doc_type),
      pick(q.docType),
      pick(q.DocumentType),
      pick(q.documentType),
      pick(q.quotation_type),
      pick(q.quotationType),
      pick(q.document),
    ].filter(Boolean);

    for (const c of candidates) {
      const lc = c.toLowerCase();
      if (lc.includes('proforma')) return 'Proforma Invoice';
      if (lc.includes('sales order')) return 'Sales Order';
      if (lc.includes('transfer order')) return 'Transfer Order';
      if (lc.includes('purchase order') || lc.includes('purchase')) return 'Purchase Order';
      // otherwise return as-is (preserve casing from source)
      return c;
    }

    if (q.series && (q.series.document_type || q.series.DocumentType)) {
      const sdt = pick(q.series.document_type) || pick(q.series.DocumentType);
      if (sdt) return sdt;
    }

    if (q.is_proforma) return 'Proforma Invoice';
    return 'Quotation';
  };

  // Determine which document type the print dialog should use.
  // Priority: selectedQuotation (if open) -> typeFilter from header -> default 'Quotation'
  // If a specific document type is selected in the header filter show that doc's settings;
  // when the filter is "All" show the common settings saved under the 'All' key.
  const currentPrintDocType = selectedQuotation ? getDocType(selectedQuotation) : (typeFilter && typeFilter !== 'All' ? typeFilter : 'All');

  // Load per-document-type print config when the relevant doc type source changes
  useEffect(() => {
    const key = `printConfig_${currentPrintDocType}`;
    try {
      const saved = localStorage.getItem(key);
      if (saved) setPrintConfig(JSON.parse(saved));
      else setPrintConfig(getDefaultPrintConfig(currentPrintDocType));
    } catch (e) {
      setPrintConfig(getDefaultPrintConfig(currentPrintDocType));
    }
  }, [selectedQuotation, typeFilter]);

  const handleSavePrintConfig = (newCfg) => {
    const type = currentPrintDocType;
    const key = `printConfig_${type}`;
    localStorage.setItem(key, JSON.stringify(newCfg));
    setPrintConfig(newCfg);
    setShowPrintSettings(false);
  };

  const fetchDigitalSignature = async () => {
    try {
      const res = await axios.get(`${BASE_URL}/api/integrations`, {
        params: { type: 'digital_signature', provider: 'custom' },
      });
      const payload = Array.isArray(res.data)
        ? res.data[0]
        : Array.isArray(res.data?.data)
          ? res.data.data[0]
          : res.data;
      const config = payload?.config || {};
      const signatureImage = normalizeImageUrl(config.dataUrl || config.image || null) || null;
      setDigitalSignature(signatureImage);
      return signatureImage;
    } catch (e) {
      console.error('Failed to fetch digital signature', e);
      setDigitalSignature(null);
      return null;
    }
  };

  const getDiscountPercentage = (item) => {
    const pct = item.discount_percentage ?? item.discountPercent ?? item.discount_percent ?? item.discountRate ?? item.discount_rate ?? 0;
    return Number(pct) || 0;
  };

  // initialize visible columns from localStorage or defaults
  const columnOptions = [
    { key: 'customer', label: 'Customer' },
    { key: 'status', label: 'Status' },
    { key: 'amount', label: 'Amount (₹)' },
    { key: 'valid_till', label: 'Valid Till' },
    { key: 'issued_on', label: 'Issued On' },
    { key: 'issued_by', label: 'Issued by' },
    { key: 'type', label: 'Type' },
    { key: 'executive', label: 'Executive' },
    // Response column hidden per request
    // { key: 'response', label: 'Response' },
    { key: 'last_interaction', label: 'Last Interaction' },
    { key: 'next_action', label: 'Next Action' },
  ];

  const lockedKeys = ['quote_no', 'actions'];

  const defaults = Array.from(new Set([...(lockedKeys || []), ...columnOptions.map((c) => c.key)]));
  const [visibleColumns, setVisibleColumns] = useState(defaults);
  const [selectedOtherMonth, setSelectedOtherMonth] = useState("");
  const [selectedOtherYear, setSelectedOtherYear] = useState(new Date().getFullYear());
  const [showMonthSelector, setShowMonthSelector] = useState(false);
  const [showYearSelector, setShowYearSelector] = useState(false);
  const [selectedFinancialYear, setSelectedFinancialYear] = useState(new Date().getFullYear());

  useEffect(() => {
    fetchQuotations();
  }, [page]);

  useEffect(() => {
    try {
      const v = JSON.parse(localStorage.getItem('quotation_visible_columns'));
      if (Array.isArray(v) && v.length) {
        setVisibleColumns(v);
      }
    } catch (e) {
      // keep defaults
    }
  }, []);

  

  // ensure locked columns are always present in visibleColumns
  useEffect(() => {
    if (!visibleColumns) return;
    const missing = lockedKeys.filter((k) => !visibleColumns.includes(k));
    if (missing.length) {
      setVisibleColumns(Array.from(new Set([...(visibleColumns || []), ...missing])));
    }
  }, [visibleColumns]);

  const toggleSelectAll = () => {
    const keys = columnOptions.map((c) => c.key);
    const nonLocked = keys.filter((k) => !lockedKeys.includes(k));
    const allSelected = nonLocked.every((k) => tempVisibleColumns.includes(k));
    // if all non-locked selected -> unselect all non-locked (but keep locked)
    setTempVisibleColumns(allSelected ? [...lockedKeys] : [...lockedKeys, ...nonLocked]);
  };

  // Refetch quotations when component mounts or when returning from edit/create
  useEffect(() => {
    setPage(1); // Reset to first page
    fetchQuotations();
  }, []);

  const fetchQuotations = async () => {
    try {
      const res = await axios.get(`${BASE_URL}/api/quotations`, {
        params: { page, limit },
      });
      const rows = res.data.data || [];
      setQuotations(rows);
      // initialize displayed list when new page data arrives
      setDisplayedQuotations(rows);
      // populate latest activity previews for table (non-blocking)
      populateLatestActivities(rows);
    } catch (error) {
      console.error("Failed to fetch quotations", error);
    }
  };

  const populateLatestActivities = async (rows = []) => {
    if (!Array.isArray(rows) || rows.length === 0) return;
    try {
      const updated = await Promise.all(rows.map(async (q) => {
        try {
          const meta = getDocumentActivityMeta(q);
          if (!meta) return { ...q, _last_interaction_preview: q.last_interaction || '-', _next_action_preview: q.next_action || '-' };

          const { interactions, nextActions } = await fetchDocumentActivities(meta);

          // latest interaction
          let latestInt = null;
          if (interactions.length) {
            latestInt = [...interactions].sort((a,b) => new Date(b.interaction_on || b.created_at || 0).getTime() - new Date(a.interaction_on || a.created_at || 0).getTime())[0];
          }

          // next upcoming followup (not done/cancelled)
          let nextFup = null;
          const validFups = (nextActions || []).filter(f => { const s = String(f.status||'').toLowerCase(); return s !== 'done' && s !== 'cancelled'; });
          if (validFups.length) {
            nextFup = [...validFups].sort((a,b) => new Date(a.action_on || a.created_at || 0).getTime() - new Date(b.action_on || b.created_at || 0).getTime())[0];
          }

          // only show date in table preview (user requested)
          const lastInteractionDate = latestInt ? formatActivityDate(latestInt.interaction_on || latestInt.created_at) : (q.last_interaction ? formatActivityDate(q.last_interaction) : '-');
          const nextActionDate = nextFup ? formatActivityDate(nextFup.action_on || nextFup.created_at) : (q.next_action ? formatActivityDate(q.next_action) : '-');

          const lastInteractionText = lastInteractionDate;
          const nextActionText = nextActionDate;

          return { ...q, _last_interaction_preview: lastInteractionText, _next_action_preview: nextActionText };
        } catch (e) {
          return { ...q, _last_interaction_preview: q.last_interaction || '-', _next_action_preview: q.next_action || '-' };
        }
      }));

      // merge into displayedQuotations if still showing same page
      setDisplayedQuotations((prev) => prev.map((p) => {
        const found = updated.find(u => (u.quotation_id || u.id || u.quotationId) === (p.quotation_id || p.id || p.quotationId));
        return found || p;
      }));
    } catch (err) {
      console.error('Failed to populate latest activities', err);
    }
  };

  // Fetch branches and non-head employees for the filters
  useEffect(() => {
    const fetchOptions = async () => {
      try {
        // branches
        try {
          const bRes = await axios.get(`${BASE_URL}/api/company-branches?limit=1000`);
          const bData = bRes.data && bRes.data.data ? bRes.data.data : bRes.data || [];
          const mapped = Array.isArray(bData)
            ? bData.map((b) => ({ id: b.id || b.ID || b.IDs, name: b.name || b.Name || b.company_branch_name || b.company_branch || '' }))
            : [];
          setBranches(mapped);
        } catch (e) {
          console.error('Failed to fetch branches', e);
          setBranches([]);
        }

        // executives (non-head employees)
        try {
          const eRes = await axios.get(`${BASE_URL}/api/employees/non-heads`);
          const eData = eRes.data && eRes.data.data ? eRes.data.data : eRes.data || [];
          setExecutives(Array.isArray(eData) ? eData : []);
        } catch (e) {
          // fallback to users endpoint filtered by employee
          try {
            const fu = await axios.get(`${BASE_URL}/api/users`, { params: { page: 1, limit: 1000, user_type: 'employee' } });
            const ud = fu.data && fu.data.data ? fu.data.data : fu.data || [];
            setExecutives(Array.isArray(ud) ? ud : []);
          } catch (err) {
            console.error('Failed to fetch executives', err);
            setExecutives([]);
          }
        }

        // Fetch printer headers
        try {
          const phRes = await axios.get(`${BASE_URL}/api/printer-headers`);
          const phData = phRes.data;
          if (Array.isArray(phData) && phData.length > 0) {
            setPrinterHeader(phData[0]);
          } else if (phData && !Array.isArray(phData)) {
            setPrinterHeader(phData);
          }
        } catch (e) {
          console.error('Failed to fetch printer headers', e);
        }

        await fetchDigitalSignature();
      } catch (err) {
        console.error('Failed to fetch filter options', err);
      }
    };

    fetchOptions();
  }, []);

  // update local header state when another component (PrintHeader) saves/updates it
  useEffect(() => {
    const onHeaderChanged = (ev) => {
      const payload = ev && ev.detail ? ev.detail : null;
      if (payload) setPrinterHeader(payload);
    };
    window.addEventListener('printerHeader:changed', onHeaderChanged);
    return () => window.removeEventListener('printerHeader:changed', onHeaderChanged);
  }, []);

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure to delete this quotation?")) {
      await axios.delete(`${BASE_URL}/api/quotations/${id}`);
      fetchQuotations();
    }
  };

  const handleOpenQuotationDetail = (quotation) => {
    setSelectedQuotation(quotation);
    setShowQuotationDetail(true);
    loadQuotationActivity(quotation);
  };

  useEffect(() => {
    if (!showQuotationDetail) {
      setDetailInteractions([]);
      setDetailNextActions([]);
      setShowActivityModal(false);
    }
  }, [showQuotationDetail]);

  const getCustomerPhone = (cust) => {
    if (!cust) return '';
    return (
      cust.mobile || cust.phone || cust.phone_number || cust.mobile_number || cust.contact_number || cust.telephone || cust.contact || ''
    );
  };

  const getCustomerEmail = (cust) => {
    if (!cust) return '';
    return cust.email || cust.email_address || cust.contact_email || '';
  };

  // Helper: return customer's legal GSTIN (check common top-level fields, legal object and documents)
  const getCustomerLegalGstin = (cust) => {
    if (!cust) return '';
    const top = cust.gst_in || cust.gstin || cust.GSTIN || cust.gst || cust.gstin_number || cust.gstinNumber || cust.tax_id || '';
    if (top && String(top).trim() !== '') return top;
    if (cust.legal && (cust.legal.gstin || cust.legal.gst)) return cust.legal.gstin || cust.legal.gst;
    if (Array.isArray(cust.documents)) {
      const doc = cust.documents.find(d => {
        const k = (d.type || d.name || d.doc_type || '').toString().toLowerCase();
        return k.includes('gst');
      });
      if (doc) return doc.doc_number || doc.number || doc.docNumber || '';
    }
    return '';
  };

  // Helper: determine which GST to display for an address — prefer address-level GST fields
  const gstForAddr = (addr) => {
    if (!addr) return '';
    return addr.gst_in || addr.gstin || addr.GSTIN || addr.gst || addr.gst_number || addr.gst_no || addr.gstNo || '';
  };

  const copyToClipboard = async (text) => {
    if (!text) return;
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(text);
      } else {
        const ta = document.createElement('textarea');
        ta.value = text;
        document.body.appendChild(ta);
        ta.select();
        document.execCommand('copy');
        document.body.removeChild(ta);
      }
      // lightweight feedback
      try { window.toastr && window.toastr.success && window.toastr.success('Copied to clipboard'); } catch (e) {}
    } catch (e) {
      console.error('Copy failed', e);
    }
  };

  const normalizeDocumentType = (value) => String(value || 'quotation').trim().toLowerCase().replace(/\s+/g, '_');

  const getDocumentActivityMeta = (quotation) => {
    const documentId = Number(quotation?.quotation_id || quotation?.id || quotation?.quotationId || 0);
    if (!documentId) return null;

    return {
      documentId,
      documentType: normalizeDocumentType(quotation?.document_type || quotation?.DocumentType || quotation?.type || quotation?.Type || 'quotation'),
    };
  };

  const formatActivityDate = (iso) => {
    if (!iso) return '-';
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return '-';
    const dd = String(d.getDate()).padStart(2, '0');
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const yyyy = d.getFullYear();
    return `${dd}-${mm}-${yyyy}`;
  };

  const formatActivityTime = (iso) => {
    if (!iso) return '-';
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return '-';
    let h = d.getHours();
    const m = String(d.getMinutes()).padStart(2, '0');
    const ampm = h >= 12 ? 'PM' : 'AM';
    h = h % 12 || 12;
    return `${h}:${m} ${ampm}`;
  };

  const hourOptions12 = ['12', '01', '02', '03', '04', '05', '06', '07', '08', '09', '10', '11'];
  const minuteOptions = Array.from({ length: 60 }, (_, i) => String(i).padStart(2, '0'));

  const get12HourParts = (time24) => {
    const [hourStr = '00', minuteStr = '00'] = String(time24 || '00:00').split(':');
    const hour24 = Number(hourStr);
    if (Number.isNaN(hour24)) {
      return { hour: '12', minute: '00', meridiem: 'AM' };
    }
    return {
      hour: String(hour24 % 12 || 12).padStart(2, '0'),
      minute: String(Number(minuteStr) || 0).padStart(2, '0'),
      meridiem: hour24 >= 12 ? 'PM' : 'AM',
    };
  };

  const get24HourTime = (hour12, minute, meridiem) => {
    let parsedHour = Number(hour12);
    if (Number.isNaN(parsedHour) || parsedHour < 1 || parsedHour > 12) parsedHour = 12;
    const safeMinute = String(Number(minute) || 0).padStart(2, '0');
    const normalizedMeridiem = meridiem === 'PM' ? 'PM' : 'AM';
    let hour24 = parsedHour % 12;
    if (normalizedMeridiem === 'PM') hour24 += 12;
    return `${String(hour24).padStart(2, '0')}:${safeMinute}`;
  };

  const fetchDocumentActivities = async (meta) => {
    const [interactionRes, actionRes] = await Promise.all([
      fetch(`${BASE_URL}/api/document-interactions?document_id=${meta.documentId}&document_type=${encodeURIComponent(meta.documentType)}`, { headers: getAuthHeaders() }),
      fetch(`${BASE_URL}/api/document-actions?document_id=${meta.documentId}&document_type=${encodeURIComponent(meta.documentType)}`, { headers: getAuthHeaders() }),
    ]);

    const interactionData = await interactionRes.json().catch(() => []);
    const actionData = await actionRes.json().catch(() => []);

    return {
      interactions: Array.isArray(interactionData) ? interactionData : (Array.isArray(interactionData?.data) ? interactionData.data : []),
      nextActions: Array.isArray(actionData) ? actionData : (Array.isArray(actionData?.data) ? actionData.data : []),
    };
  };

  const loadQuotationActivity = async (quotation) => {
    if (!quotation) return;
    setActivityLoading(true);
    try {
      const meta = getDocumentActivityMeta(quotation);
      if (!meta) {
        setDetailInteractions([]);
        setDetailNextActions([]);
        return;
      }

      const { interactions, nextActions: nextActionsRaw } = await fetchDocumentActivities(meta);

      const sortedInteractions = [...interactions].sort((a, b) => {
        const ad = new Date(a.interaction_on || a.created_at || 0).getTime();
        const bd = new Date(b.interaction_on || b.created_at || 0).getTime();
        return bd - ad;
      });

      const sortedNextActions = nextActionsRaw
        .filter((f) => {
          const status = String(f.status || '').toLowerCase();
          return status !== 'done' && status !== 'cancelled';
        })
        .sort((a, b) => {
          const ad = new Date(a.action_on || a.created_at || 0).getTime();
          const bd = new Date(b.action_on || b.created_at || 0).getTime();
          return ad - bd;
        });

      setDetailInteractions(sortedInteractions);
      setDetailNextActions(sortedNextActions);
    } catch (err) {
      console.error('Failed to load quotation activity', err);
      setDetailInteractions([]);
      setDetailNextActions([]);
    } finally {
      setActivityLoading(false);
    }
  };

  const openActivityCreateModal = (mode) => {
    setActivityMode(mode);
    const now = new Date();
    setActivityForm({
      date: now.toISOString().slice(0, 10),
      time: `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`,
      type: mode === 'next_action' ? 'Appointment' : 'General',
      note: '',
    });
    setShowActivityModal(true);
  };

  const saveActivityItem = async () => {
    const meta = getDocumentActivityMeta(selectedQuotation);
    if (!meta) {
      alert('Invalid document selected.');
      return;
    }

    if (!activityForm.date) {
      alert('Date is required.');
      return;
    }

    setActivitySaving(true);
    try {
      const activityDateTime = new Date(`${activityForm.date}T${activityForm.time || '00:00'}:00`).toISOString();

      if (activityMode === 'interaction' || activityMode === 'complete_next_action') {
        const payload = {
          document_id: meta.documentId,
          document_type: meta.documentType,
          type: activityForm.type || 'General',
          notes: activityForm.note || '',
          interaction_on: activityDateTime,
        };
        const res = await fetch(`${BASE_URL}/api/document-interactions`, {
          method: 'POST',
          headers: getAuthHeaders(),
          body: JSON.stringify(payload),
        });
        if (!res.ok) {
          const err = await res.json().catch(() => ({ error: 'Failed to save interaction' }));
          alert(err.error || 'Failed to save interaction');
          return;
        }

        // If this was completing a next-action, delete the original followup
        if (activityMode === 'complete_next_action' && pendingCompleteNextAction) {
          const nextActionId = pendingCompleteNextAction?.id || pendingCompleteNextAction?.ID;
          try {
            const delRes = await fetch(`${BASE_URL}/api/document-actions/${nextActionId}`, {
              method: 'PUT',
              headers: getAuthHeaders(),
              body: JSON.stringify({ status: 'done', completed_at: new Date().toISOString() }),
            });
            if (!delRes.ok) {
              const derr = await delRes.json().catch(() => ({ error: 'Failed to close next action' }));
              console.warn('Failed to complete document action', derr);
            }
          } catch (e) {
            console.warn('Error completing document action', e);
          }
        }
      } else {
        const payload = {
          document_id: meta.documentId,
          document_type: meta.documentType,
          title: activityForm.type || 'Appointment',
          notes: activityForm.note || '',
          action_on: activityDateTime,
        };

        const res = await fetch(`${BASE_URL}/api/document-actions`, {
          method: 'POST',
          headers: getAuthHeaders(),
          body: JSON.stringify(payload),
        });
        if (!res.ok) {
          const err = await res.json().catch(() => ({ error: 'Failed to save next action' }));
          alert(err.error || 'Failed to save next action');
          return;
        }
      }

      setShowActivityModal(false);
      await loadQuotationActivity(selectedQuotation);
      // Refresh the main quotation list so the table previews update instantly
      try { fetchQuotations(); } catch (e) { /* ignore */ }
      setPendingCompleteNextAction(null);
    } catch (err) {
      console.error('Failed to save activity item', err);
      alert('Failed to save activity details.');
    } finally {
      setActivitySaving(false);
    }
  };

  const deleteInteractionItem = async (interactionId) => {
    if (!interactionId) return;
    try {
      const res = await fetch(`${BASE_URL}/api/document-interactions/${interactionId}`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: 'Failed to delete interaction' }));
        alert(err.error || 'Failed to delete interaction');
        return;
      }
      await loadQuotationActivity(selectedQuotation);
      // Refresh the main quotation list so the table previews update instantly
      try { fetchQuotations(); } catch (e) { /* ignore */ }
    } catch (err) {
      console.error('Failed to delete interaction', err);
      alert('Failed to delete interaction');
    }
  };

  const cancelNextActionItem = async (nextActionId) => {
    if (!nextActionId) return;
    try {
      const res = await fetch(`${BASE_URL}/api/document-actions/${nextActionId}`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify({ status: 'cancelled' }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: 'Failed to cancel next action' }));
        alert(err.error || 'Failed to cancel next action');
        return;
      }
      await loadQuotationActivity(selectedQuotation);
      // Refresh the main quotation list so the table previews update instantly
      try { fetchQuotations(); } catch (e) { /* ignore */ }
    } catch (err) {
      console.error('Failed to cancel next action', err);
      alert('Failed to cancel next action');
    }
  };

  const completeNextActionItem = async (nextAction) => {
    const nextActionId = nextAction?.id || nextAction?.ID;
    const meta = getDocumentActivityMeta(selectedQuotation);
    if (!meta || !nextActionId) return;

    try {
      const now = new Date();
      const payload = {
        document_id: meta.documentId,
        document_type: meta.documentType,
        type: nextAction?.title || nextAction?.type || 'General',
        notes: nextAction?.notes || '',
        interaction_on: now.toISOString(),
      };

      const intRes = await fetch(`${BASE_URL}/api/document-interactions`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(payload),
      });
      if (!intRes.ok) {
        const err = await intRes.json().catch(() => ({ error: 'Failed to move next action to interaction' }));
        alert(err.error || 'Failed to mark next action done');
        return;
      }

      const delRes = await fetch(`${BASE_URL}/api/document-actions/${nextActionId}`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify({ status: 'done', completed_at: now.toISOString() }),
      });
      if (!delRes.ok) {
        const err = await delRes.json().catch(() => ({ error: 'Failed to update next action status' }));
        alert(err.error || 'Failed to update completed next action');
        return;
      }

      await loadQuotationActivity(selectedQuotation);
      // Refresh the main quotation list so the table previews update instantly
      try { fetchQuotations(); } catch (e) { /* ignore */ }
    } catch (err) {
      console.error('Failed to mark next action done', err);
      alert('Failed to mark next action done');
    }
  };

  // Share handlers for the detail modal
  const shareAsPDF = async (e) => {
    e.stopPropagation();

    const signatureImageUrl = printConfig.digitalSignature
      ? (digitalSignature || await fetchDigitalSignature())
      : null;
    if (!selectedQuotation) return;
    
    const q = selectedQuotation;
    const cust = q.customer || {};
    const branch = q.company_branch || {};
    const items = q.quotation_items || q.items || [];
    const company = q.company || {};
    
    const firstNonEmpty = (...vals) => {
      for (const v of vals) {
        if (v === undefined || v === null) continue;
        const s = String(v).trim();
        if (s) return s;
      }
      return '';
    };

    const customerFallbackName = `${cust.firstname || ''} ${cust.lastname || ''}`.replace(/\s+/g, ' ').trim();
    const customerName = firstNonEmpty(
      cust.company_name,
      cust.business_name,
      cust.customer_name,
      customerFallbackName,
      'Guest'
    );
    
    // billing address from the quotation's billing_address (preloaded)
    const formatAddressCountryName = (country) => {
      const raw = String(country || '').trim();
      if (!raw) return '';
      return raw
        .replace(/\s*\(\s*(?:\+|00)\d{1,4}\s*\)\s*/g, ' ')
        .replace(/\s+(?:\+|00)\d{1,4}\s*$/g, '')
        .trim();
    };

    const formatAddressPostalCode = (postalCode) => {
      const raw = String(postalCode || '').trim();
      if (!raw) return '';
      return raw.replace(/^\s*(?:\(\+\d{1,4}\)|\+\d{1,4}|00\d{1,4})\s*[-,:]?\s*/i, '');
    };

    const getCountryDialCode = (country) => {
      const c = String(country || '').trim().toLowerCase();
      if (!c || c === 'india') return '+91';
      if (c === 'united states' || c === 'usa' || c === 'us') return '+1';
      if (c === 'united kingdom' || c === 'uk') return '+44';
      if (c === 'united arab emirates' || c === 'uae') return '+971';
      return '+91';
    };

    const formatMobileWithCountryCode = (mobile, country) => {
      const raw = String(mobile || '').trim();
      if (!raw) return '';
      if (raw.startsWith('+')) return raw;
      if (raw.startsWith('00')) return `+${raw.slice(2)}`;
      const digitsOnly = raw.replace(/\D/g, '');
      if (!digitsOnly) return '';
      return `${getCountryDialCode(country)} ${digitsOnly}`;
    };

    const getCustomerMobileForAddr = (addr) => {
      const fromAddr = addr?.mobile || addr?.phone || addr?.phone_number || addr?.mobile_number || addr?.contact_number || addr?.telephone || addr?.contact || '';
      if (fromAddr && String(fromAddr).trim() !== '') return fromAddr;
      return getCustomerPhone(cust);
    };

    // billing address from the quotation's billing_address (preloaded)
    const bAddr = q.billing_address || {};
    const billingTitle = bAddr.title || customerName;
    const billingGSTIN = gstForAddr(bAddr) || getCustomerLegalGstin(cust) || '-';
    const billingAddress1 = bAddr.address1 || '';
    const billingAddress2 = bAddr.address2 || '';
    const billingAddress3 = bAddr.address3 || '';
    const billingCity = bAddr.city || '';
    const billingState = bAddr.state || '';
    const billingCountry = formatAddressCountryName(bAddr.country || 'India');
    const billingPincode = formatAddressPostalCode(bAddr.postal_code || bAddr.pincode || '');

    // shipping address from the quotation's shipping_address (preloaded)
    const sAddr = q.shipping_address || {};
    const shippingTitle = sAddr.title || customerName;
    const shippingGSTIN = gstForAddr(sAddr) || getCustomerLegalGstin(cust) || '-';
    const shippingAddress1 = sAddr.address1 || '';
    const shippingAddress2 = sAddr.address2 || '';
    const shippingAddress3 = sAddr.address3 || '';
    const shippingCity = sAddr.city || '';
    const shippingState = sAddr.state || '';
    const shippingCountry = formatAddressCountryName(sAddr.country || 'India');
    const shippingPincode = formatAddressPostalCode(sAddr.postal_code || sAddr.pincode || '');

    const formatAddressPersonName = (addr = {}) => {
      const salutation = firstNonEmpty(addr.salutation, cust.salutation, cust.title);
      const personFirst = firstNonEmpty(addr.firstname, addr.first_name, cust.firstname, cust.first_name);
      const personLast = firstNonEmpty(addr.lastname, addr.last_name, cust.lastname, cust.last_name);
      const fullName = [personFirst, personLast].filter(Boolean).join(' ').trim();
      if (fullName) return [salutation, fullName].filter(Boolean).join(' ').trim();

      const fallbackPerson = firstNonEmpty(
        addr.contact_person,
        addr.contactPerson,
        addr.contact_name,
        cust.contact_person,
        cust.contactPerson,
        cust.contact_name,
        cust.contact
      );
      if (!fallbackPerson) return '';

      const lower = fallbackPerson.toLowerCase();
      const salLower = (salutation || '').toLowerCase();
      if (salLower && (lower === salLower || lower.startsWith(`${salLower} `))) return fallbackPerson;
      return [salutation, fallbackPerson].filter(Boolean).join(' ').trim();
    };

    const billingCompanyName = firstNonEmpty(
      bAddr.company_name,
      bAddr.business_name,
      bAddr.customer_name,
      bAddr.name,
      customerName
    );
    const shippingCompanyName = firstNonEmpty(
      sAddr.company_name,
      sAddr.business_name,
      sAddr.customer_name,
      sAddr.name,
      customerName
    );
    const billingPersonName = formatAddressPersonName(bAddr);
    const shippingPersonName = formatAddressPersonName(sAddr);

    const billingPhone = formatMobileWithCountryCode(getCustomerMobileForAddr(bAddr), billingCountry || bAddr.country || 'India');
    const shippingPhone = formatMobileWithCountryCode(getCustomerMobileForAddr(sAddr), shippingCountry || sAddr.country || 'India');
    const custEmail = getCustomerEmail(cust);

    // Issued by (sales person on the quotation)
    const issuerObj = q.sales_credit_person || {};
    const issuerName = (issuerObj && ((issuerObj.firstname || issuerObj.first_name) ? `${issuerObj.firstname || issuerObj.first_name} ${issuerObj.lastname || issuerObj.last_name || ''}`.trim() : (issuerObj.name || issuerObj.Name || '')) ) || '';
    const issuerPhone = issuerObj.mobile || issuerObj.mobile_number || issuerObj.phone || issuerObj.contact || '';
    const issuerEmail = issuerObj.email || issuerObj.email_address || '';
    const issuedByLines = [issuerName, issuerPhone, issuerEmail]
      .map((v) => String(v || '').trim())
      .filter(Boolean);
    const issuedByHtml = issuedByLines.length ? issuedByLines.map((line) => `<div>${line}</div>`).join('') : '-';
    
    const companyName = printerHeader?.header_title || (branch.name || branch.company_name) || company.company_name || 'Canares Automation Pvt Ltd';
    const branchName = printerHeader?.header_subtitle || (branch.name || branch.branch_name || branch.company_branch_name || '');
    const branchGSTIN = printerHeader?.gstin || branch.gst_number || branch.gstin || company.gst_number || '';
    const branchAddress = printerHeader?.address || branch.address || branch.branch_address || company.address || '';
    const branchCity = printerHeader?.address ? '' : (branch.city || '');
    const branchState = printerHeader?.address ? '' : (branch.state || '');
    const branchPincode = printerHeader?.pin || branch.pincode || branch.zip || '';
    const companyPhone = printerHeader?.mobile || branch.phone || company.phone || '';
    const companyEmail = printerHeader?.email || branch.email || company.email || '';
    const companyWebsite = printerHeader?.website || company.website || '';
    const headerLogos = getHeaderLogoList(printerHeader);
    const selectedHeaderLogo = headerLogos[Number(printConfig?.headerImageIndex) || 0]?.data || printerHeader?.logo_data || null;
    const companyLogo = normalizeImageUrl(selectedHeaderLogo);
    const headerAlignment = printerHeader?.alignment || 'left';
    const safeSignatureImageUrl = signatureImageUrl ? String(signatureImageUrl).replace(/"/g, '&quot;') : '';
    const signatureImageHtml = safeSignatureImageUrl
      ? `<img class="signature-image" src="${safeSignatureImageUrl}" alt="Digital Signature" />`
      : '';
    
    // Bank details from quotaion's preloaded bank if available, else branch
    const bankB = q.company_branch_bank || branch.company_branch_bank || {};
    const bankName = bankB.bankName || bankB.bank_name || branch.bank_name || company.bank_name || '';
    const bankBranch = bankB.branch || bankB.branch_name || bankB.bankBranch || bankB.bank_branch || branch.bank_branch || company.bank_branch || '';
    const bankBranchAddress = branch.bank_branch_address || company.bank_branch_address || branchAddress || '';
    const accountNo = bankB.accountNo || bankB.account_number || branch.account_number || company.account_number || '';
    const ifscCode = bankB.ifsc || bankB.ifsc_code || branch.ifsc_code || company.ifsc_code || '';
    const swiftCode = bankB.swiftCode || bankB.swift_code || branch.swift_code || company.swift_code || '';
    
    const rawTerms = q.terms_and_conditions;
    let termsArr = [];
    if (Array.isArray(rawTerms)) {
      termsArr = rawTerms;
    } else if (typeof rawTerms === 'string') {
      try {
        const parsed = JSON.parse(rawTerms);
        if (Array.isArray(parsed)) termsArr = parsed;
        else termsArr = [rawTerms];
      } catch (e) {
        termsArr = [rawTerms];
      }
    }
    const termsAndConditionsHtml = termsArr.map((t, idx) => `<div>${idx + 1}. ${t.TandcName || t.name || t.term || (typeof t === 'string' ? t : '')}</div>`).join('');
    const notesHtml = q.note ? `<div style="margin-top: 10px;"><strong>Notes:</strong><br/>${q.note}</div>` : '';

    const subtotal = items.reduce((sum, item) => sum + ((item.quantity || 0) * (item.rate || 0)), 0);
    const totalDiscount = items.reduce((sum, item) => {
      const amt = (item.quantity || 0) * (item.rate || 0);
      const disc = getDiscountPercentage(item) / 100;
      return sum + (amt * disc);
    }, 0);
    const taxableAmount = subtotal - totalDiscount;
    const cgst = Number(q.cgst_amount || 0);
    const sgst = Number(q.sgst_amount || 0);
    const igst = Number(q.igst_amount || 0);
    const totalTax = Number(q.tax_amount || (cgst + sgst + igst));

    const getGstinStateCode = (gstin) => {
      const gstinStr = String(gstin || '').trim();
      const match = gstinStr.match(/^(\d{2})/);
      return match ? match[1] : '';
    };
    const normalizeState = (v) => String(v || '').trim().toLowerCase();
    const sellerStateCode = getGstinStateCode(branchGSTIN);
    const buyerStateCode = getGstinStateCode(shippingGSTIN || billingGSTIN);
    const isIntraStateByCode = !!(sellerStateCode && buyerStateCode && sellerStateCode === buyerStateCode);
    const isIntraStateByName = !!(normalizeState(branchState) && normalizeState(shippingState) && normalizeState(branchState) === normalizeState(shippingState));
    const inferredIntraState = isIntraStateByCode || (!sellerStateCode && !buyerStateCode && isIntraStateByName);

    let displayCgst = cgst;
    let displaySgst = sgst;
    let displayIgst = igst;
    if (totalTax > 0 && displayCgst === 0 && displaySgst === 0 && displayIgst === 0) {
      if (inferredIntraState) {
        displayCgst = totalTax / 2;
        displaySgst = totalTax / 2;
      } else {
        displayIgst = totalTax;
      }
    }

    const totalQuantity = items.reduce((sum, item) => sum + Number(item.quantity || item.qty || 0), 0);

    const extraChargesArr = Array.isArray(q.extra_charges) ? q.extra_charges : [];
    const discountsArr = Array.isArray(q.discounts) ? q.discounts : [];
    const toNumber = (v) => {
      const n = Number(v);
      return Number.isFinite(n) ? n : 0;
    };
    const summaryBaseTotal = toNumber(taxableAmount) + toNumber(totalTax);
    const extraChargesTotal = extraChargesArr.reduce((sum, c) => {
      const val = toNumber(c?.value);
      return sum + (c?.type === 'percent' ? (summaryBaseTotal * val / 100) : val);
    }, 0);
    const discountsTotal = discountsArr.reduce((sum, d) => {
      const val = toNumber(d?.value);
      return sum + (d?.type === 'percent' ? (summaryBaseTotal * val / 100) : val);
    }, 0);
    const roundOffAmount = toNumber(q.roundoff_amount);
    const computedGrandTotal = summaryBaseTotal + extraChargesTotal - discountsTotal + roundOffAmount;
    const storedGrandTotal = toNumber(q.grand_total);
    const grandTotal = Math.abs(storedGrandTotal - computedGrandTotal) < 0.01 ? storedGrandTotal : computedGrandTotal;

    const itemRows = items.map((item, idx) => {
      const quantity = item.quantity || 0;
      const rate = item.rate || 0;
      const itemTotal = quantity * rate;
      const discountPct = getDiscountPercentage(item);
      const discountAmt = itemTotal * (discountPct / 100);
      const taxable = itemTotal - discountAmt;
      const taxAmount = item.tax_amount || 0;
      const finalAmount = item.line_total || (taxable + taxAmount);
      const fixedRateValue = Number(
        item.fixedRate ??
        item.fixed_rate ??
        item.fixed_price ??
        item.fixedPrice ??
        item.FixedRate ??
        item.fixedrate ??
        item.rate ??
        item.unit_price ??
        item.product?.fixed_rate ??
        item.product?.FixedRate ??
        item.product?.PurchaseCost ??
        item.product?.StdSalesPrice ??
        0
      );
      
      const imgUrl = getProductImage(item.product);
      const imgHtml = imgUrl ? `<img src="${imgUrl}" style="max-width: 50px; max-height: 50px; object-fit: contain;" />` : '-';

      return `
        <tr>
          <td style="text-align: center;">${idx + 1}</td>
          <td style="text-align: center;">${imgHtml}</td>
          <td>${item.product_name || item.name || item.description || '-'}</td>
          ${printConfig.itemCode ? `<td>${item.product_code || item.item_code || '-'}</td>` : ''}
          ${printConfig.hsnSac ? `<td>${item.hsncode || item.hsn_code || item.hsn || '-'}</td>` : ''}
          <td style="text-align: center;">${quantity}</td>
          <td>${item.unit || 'Nos'}</td>
          ${printConfig.itemFixedRate ? `<td style="text-align: right;">${fixedRateValue.toLocaleString('en-IN', {minimumFractionDigits: 2})}</td>` : ''}
          ${printConfig.itemRate ? `<td style="text-align: right;">${rate.toLocaleString('en-IN', {minimumFractionDigits: 2})}</td>` : ''}
          ${printConfig.discountRate ? `<td style="text-align: right;">${Math.round(discountPct)}%</td>` : ''}
          ${printConfig.discountAmt ? `<td style="text-align: right;">${discountAmt.toLocaleString('en-IN', {minimumFractionDigits: 2})}</td>` : ''}
          ${printConfig.taxableAmt ? `<td style="text-align: right;">${taxable.toLocaleString('en-IN', {minimumFractionDigits: 2})}</td>` : ''}
          ${printConfig.gstAmounts ? `<td style="text-align: right;">${(item.gst || 0)}%</td>` : ''}
          ${printConfig.leadTime ? `<td>${item.lead_time || item.leadTime || '-'}</td>` : ''}
          <td style="text-align: right;"><strong>${finalAmount.toLocaleString('en-IN', {minimumFractionDigits: 2})}</strong></td>
        </tr>
      `;
    }).join('');
    
    // Count columns for the "No items" row
    const colCount = 5 + (printConfig.itemCode?1:0) + (printConfig.hsnSac?1:0) + (printConfig.itemRate?1:0) + (printConfig.itemFixedRate?1:0) + (printConfig.discountRate?1:0) + (printConfig.discountAmt?1:0) + (printConfig.taxableAmt?1:0) + (printConfig.gstAmounts?1:0) + (printConfig.leadTime?1:0);

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>${getDocType(q)} ${getQuotationNumber(q)}</title>
        <style>
          :root {
            --pdf-font-family: "Segoe UI", Tahoma, Geneva, Verdana, sans-serif;
            --pdf-text-color: #1f2937;
            --pdf-muted-color: #4b5563;
            --pdf-border-color: #babec5;
            --pdf-panel-bg: #f8fafc;
            --pdf-alt-row-bg: #f8fafc;
            --pdf-label-bg: #e2e8f0;
            --pdf-heading-color: #0f172a;
            --pdf-body-size: 12px;
            --pdf-small-size: 11px;
            --pdf-heading-size: 13px;
            --pdf-title-size: 24px;
            --pdf-summary-size: 13px;
            --pdf-logo-width: 240px;
            --pdf-logo-height: 110px;
          }
          * { margin: 0; padding: 0; box-sizing: border-box; }
          html, body { width: 99%; max-width: 99%; overflow-x: hidden; }
          body { font-family: var(--pdf-font-family); font-size: var(--pdf-body-size); line-height: 1.4; padding: 10px; color: var(--pdf-text-color); background: #fff; }
          .header { display: flex; justify-content: space-between; align-items: flex-start; padding-bottom: 10px; margin-bottom: 12px; gap: 12px; }
          .pdf-header-logo-wrap { flex: 0 1 var(--pdf-logo-width); width: min(100%, var(--pdf-logo-width)); max-width: 100%; height: var(--pdf-logo-height); overflow: hidden; display: flex; align-items: center; justify-content: center; margin: 0 auto; }
          .pdf-header-logo { width: 100%; height: 100%; max-width: 100%; max-height: 100%; object-fit: contain; object-position: center; display: block; }
          .branch-info { flex: 1 1 0; min-width: 0; max-width: none; }
          .branch-info h2 { font-size: 17px; color: var(--pdf-heading-color); margin-bottom: 6px; font-weight: 700; }
          .branch-info p { font-size: var(--pdf-body-size); line-height: 1.45; margin: 2px 0; color: var(--pdf-text-color); overflow-wrap: anywhere; }
          .doc-title { text-align: center; font-size: var(--pdf-title-size); font-weight: 700; margin: 10px 0; text-transform: uppercase; color: var(--pdf-heading-color); letter-spacing: 0.8px; }
          .quotation-details { min-width: 0; max-width: 100%; }
          .quotation-details table { width: 100%; font-size: var(--pdf-body-size); border-collapse: collapse; background: #fff; }
          .quotation-details td { padding: 6px 8px; border: 1px solid #9ca3af; color: var(--pdf-text-color); }
          .quotation-details td:first-child { font-weight: 600; background: var(--pdf-label-bg); white-space: nowrap; width: 45%; color: var(--pdf-heading-color); }
          .quotation-details td:last-child { color: var(--pdf-text-color); overflow-wrap: anywhere; }
          .addresses { display: flex; justify-content: space-between; margin: 8px 0 10px; gap: 0; border: 1px solid var(--pdf-border-color); background: var(--pdf-panel-bg); width: 100%; max-width: 100%; }
          .address-box { flex: 1; min-width: 0; border: 0; padding: 10px; background: transparent; }
          .address-box + .address-box { border-left: 1px solid var(--pdf-border-color); }
          .address-box h3 { font-size: var(--pdf-heading-size); font-weight: 700; margin-bottom: 6px; border-bottom: 1px solid var(--pdf-border-color); padding-bottom: 4px; text-transform: uppercase; color: var(--pdf-heading-color); }
          .address-box p { font-size: var(--pdf-body-size); line-height: 1.45; margin: 2px 0; color: var(--pdf-text-color); overflow-wrap: anywhere; }
          table.items { width: 100%; max-width: 100%; border-collapse: collapse; table-layout: fixed; margin: 10px 0; font-size: 11px; border: 1px solid var(--pdf-border-color); }
          table.items th, table.items td { border: 1px solid #9ca3af; padding: 5px 4px; overflow-wrap: anywhere; word-break: break-word; }
          table.items th { background: transparent; color: #111827; font-weight: 600; text-align: center; font-size: var(--pdf-small-size); }
          table.items tbody tr:nth-child(even) { background: var(--pdf-alt-row-bg); }
          table.items tbody tr:nth-child(odd) { background: #fff; }
          table.items td { vertical-align: middle; color: var(--pdf-text-color); }
          .three-col { display: flex; gap: 0; margin-top: 10px; border: 1px solid var(--pdf-border-color); background: #fff; width: 100%; max-width: 100%; }
          .three-col > div { flex: 1 1 0; min-width: 0; border: 0; padding: 10px; background: #fff; }
          .three-col > div + div { border-left: 1px solid var(--pdf-border-color); }
          .three-col h3 { font-size: var(--pdf-heading-size); font-weight: 700; margin-bottom: 6px; color: var(--pdf-heading-color); padding-bottom: 3px; text-transform: uppercase; }
          .bank-details { flex: 1; }
          .bank-details table { width: 100%; font-size: var(--pdf-body-size); margin-top: 4px; border-collapse: collapse; }
          .bank-details td { padding: 3px 0; }
          .bank-details td:first-child { font-weight: 700; color: var(--pdf-heading-color); width: 25%; padding-right: 6px; white-space: nowrap; }
          .bank-details td:last-child { padding-left: 2px; }
          .amount-words-box { flex: 1; display: flex; justify-content: flex-start; text-align: left; }
          .amount-words-box > div { padding: 0; }
          .amount-words-box strong { display: block; font-size: var(--pdf-body-size); color: var(--pdf-heading-color); margin-bottom: 6px; }
          .amount-words-box .amount-words-text { font-size: var(--pdf-summary-size); font-weight: 600; color: var(--pdf-heading-color); line-height: 1.45; }
          .summary { flex: 1; }
          .summary table { width: 100%; font-size: var(--pdf-body-size); border-collapse: collapse; margin-top: 4px; }
          .summary td { padding: 6px 8px; border: 1px solid #9ca3af; }
          .summary td:first-child { text-align: left; font-weight: 500; background: var(--pdf-panel-bg); color: var(--pdf-muted-color); }
          .summary td:last-child { text-align: right; font-weight: 600; color: var(--pdf-heading-color); }
          .summary .grand-total td { background: transparent; color: #111827; font-weight: 700; font-size: var(--pdf-summary-size); border-top: 1px solid var(--pdf-heading-color); }
          .bottom-layout { border: 1px solid var(--pdf-border-color); border-top: 0; }
          .bottom-row { display: flex; gap: 0; width: 100%; max-width: 100%; }
          .bottom-row + .bottom-row { border-top: 1px solid var(--pdf-border-color); }
          .bottom-cell { flex: 1 1 0; min-width: 0; border: 0; padding: 10px; background: #fff; }
          .bottom-cell + .bottom-cell { border-left: 1px solid var(--pdf-border-color); }
          .terms-box h3, .notes-box h3 { font-size: var(--pdf-heading-size); font-weight: 700; margin-bottom: 8px; text-transform: uppercase; color: var(--pdf-heading-color); }
          .terms-box p, .terms-box div, .notes-box p, .notes-box div { font-size: var(--pdf-body-size); line-height: 1.5; white-space: pre-line; color: var(--pdf-text-color); margin: 2px 0; }
          .terms-box { min-height: 90px; }
          .notes-box { min-height: 90px; }
          .bottom-row.signature-row .bottom-cell { min-height: 126px; }
          .footer-note { display: flex; align-items: flex-end; font-size: var(--pdf-body-size); color: var(--pdf-text-color); font-style: italic; min-height: 100%; padding-bottom: 4px; }
          .footer-note span { display: block; }
          .authorized-sign { min-height: 100%; display: flex; flex-direction: column; justify-content: flex-start; align-items: flex-end; text-align: center; }
          .authorized-sign > p:first-child { align-self: flex-end; font-size: var(--pdf-body-size); font-weight: 500; color: var(--pdf-text-color); margin-bottom: 10px; }
          .authorized-sign .signature-space { width: 180px; min-height: 58px; display: flex; align-items: flex-end; justify-content: center; margin-bottom: 10px; }
          .authorized-sign .signature-image { max-width: 170px; max-height: 54px; object-fit: contain; display: block; }
          .authorized-sign .sign-line { align-self: flex-end; padding-top: 6px; min-width: 180px; font-weight: 700; font-size: var(--pdf-body-size); color: var(--pdf-heading-color); border-top: 1px solid var(--pdf-border-color); text-align: center; }
          @media (max-width: 900px) {
            .pdf-header-logo-wrap { width: 180px; height: 84px; }
          }
          @media print {
            body { padding: 0; }
            @page { margin: 8mm; }
          }
        </style>
      </head>
      <body>
        ${printConfig.header ? `
        <div class="doc-title" style="margin-bottom:30px;">${getDocType(q).toUpperCase()}</div>

        <div style="display:flex; align-items:flex-start; gap:12px; margin-bottom:15px; border-bottom:1px solid var(--pdf-border-color); padding-bottom:12px;">
          <div class="branch-info" style="flex:1; min-width:0; text-align:left; padding:0 10px;">
            <h2 style="font-size: 18px; color: var(--pdf-heading-color); margin-bottom: 6px;">${branchName || companyName}</h2>
            <p style="font-size: var(--pdf-body-size); line-height: 1.6; margin: 2px 0;">${branchAddress}</p>
            <p style="font-size: var(--pdf-body-size); line-height: 1.6; margin: 2px 0;">${[branchCity, branchState, branchPincode].filter(Boolean).join(', ')}</p>
            ${branchGSTIN ? `<p style="font-size: var(--pdf-body-size); line-height: 1.6; margin: 2px 0;"><strong>GSTIN:</strong> ${branchGSTIN}</p>` : ''}
            ${companyPhone ? `<p style="font-size: var(--pdf-body-size); line-height: 1.6; margin: 2px 0;"><strong>Phone:</strong> ${companyPhone}</p>` : ''}
            ${companyEmail ? `<p style="font-size: var(--pdf-body-size); line-height: 1.6; margin: 2px 0;"><strong>Email:</strong> ${companyEmail}</p>` : ''}
            ${companyWebsite ? `<p style="font-size: var(--pdf-body-size); line-height: 1.6; margin: 2px 0;"><strong>Website:</strong> ${companyWebsite}</p>` : ''}
          </div>
          <div style="flex:1; min-width:0; display:flex; align-items:center; justify-content:center; align-self:center;">
            ${companyLogo ? `<div class="pdf-header-logo-wrap"><img src="${companyLogo}" alt="${companyName}" class="pdf-header-logo" width="240" height="110" /></div>` : ''}
          </div>
          <div style="flex:1; min-width:0; display:flex; justify-content:flex-end;">
            <div class="quotation-details" style="min-width:0; max-width:240px; width:100%;">
              <table>
                <tr><td>${getDocType(q)} No.</td><td>${getQuotationNumber(q) || '-'}</td></tr>
                <tr><td>Date</td><td>${q.quotation_date ? new Date(q.quotation_date).toLocaleDateString('en-IN') : new Date().toLocaleDateString('en-IN')}</td></tr>
                ${printConfig.validTill ? `<tr><td>Valid Till</td><td>${q.valid_until ? new Date(q.valid_until).toLocaleDateString('en-IN') : '-'}</td></tr>` : ''}
                <tr><td>Ref.</td><td>${q.references || '-'}</td></tr>
                <tr><td>Issued By</td><td>${issuedByHtml}</td></tr>
              </table>
            </div>
          </div>
        </div>
        ` : `
        <div class="doc-title">${getDocType(q).toUpperCase()}</div>
        <div style="display:flex; justify-content:flex-end; margin-bottom:15px;">
          <div class="quotation-details" style="min-width:0; max-width:240px; width:100%;">
            <table>
              <tr><td>${getDocType(q)} No.</td><td>${getQuotationNumber(q) || '-'}</td></tr>
              <tr><td>Date</td><td>${q.quotation_date ? new Date(q.quotation_date).toLocaleDateString('en-IN') : new Date().toLocaleDateString('en-IN')}</td></tr>
              ${printConfig.validTill ? `<tr><td>Valid Till</td><td>${q.valid_until ? new Date(q.valid_until).toLocaleDateString('en-IN') : '-'}</td></tr>` : ''}
              <tr><td>Ref.</td><td>${q.references || '-'}</td></tr>
              <tr><td>Issued By</td><td>${issuedByHtml}</td></tr>
            </table>
          </div>
        </div>
        `}

        ${printConfig.partyInformation ? `
        <div class="addresses">
          <div class="address-box">
            <h3>Billing Address</h3>
            ${billingCompanyName ? `<p style="font-weight:700; margin-bottom:6px;">${billingCompanyName}</p>` : ''}
            ${billingPersonName ? `<p style="margin-bottom:6px;">${billingPersonName}</p>` : ''}
            ${billingAddress1 ? `<p>${billingAddress1}</p>` : ''}
            ${billingAddress2 ? `<p>${billingAddress2}</p>` : ''}
            ${billingAddress3 ? `<p>${billingAddress3}</p>` : ''}
            <p>${[billingCity, billingState, [billingCountry, billingPincode].filter(Boolean).join(' - ')].filter(Boolean).join(', ')}</p>
            ${printConfig.mobile && billingPhone ? `<p><strong>Mobile:</strong> ${billingPhone}</p>` : ''}
            ${printConfig.email && custEmail ? `<p><strong>Email:</strong> ${custEmail}</p>` : ''}
            ${printConfig.gstin && billingGSTIN && billingGSTIN !== '-' ? `<p><strong>GSTIN:</strong> ${billingGSTIN}</p>` : ''}
          </div>
          <div class="address-box">
            <h3>Shipping Address</h3>
            ${shippingCompanyName ? `<p style="font-weight:700; margin-bottom:6px;">${shippingCompanyName}</p>` : ''}
            ${shippingPersonName ? `<p style="margin-bottom:6px;">${shippingPersonName}</p>` : ''}
            ${shippingAddress1 ? `<p>${shippingAddress1}</p>` : ''}
            ${shippingAddress2 ? `<p>${shippingAddress2}</p>` : ''}
            ${shippingAddress3 ? `<p>${shippingAddress3}</p>` : ''}
            <p>${[shippingCity, shippingState, [shippingCountry, shippingPincode].filter(Boolean).join(' - ')].filter(Boolean).join(', ')}</p>
            ${printConfig.mobile && shippingPhone ? `<p><strong>Mobile:</strong> ${shippingPhone}</p>` : ''}
            ${printConfig.email && custEmail ? `<p><strong>Email:</strong> ${custEmail}</p>` : ''}
            ${printConfig.gstin && shippingGSTIN && shippingGSTIN !== '-' ? `<p><strong>GSTIN:</strong> ${shippingGSTIN}</p>` : ''}
          </div>
        </div>
        ` : ''}

        <table class="items">
          <thead>
            <tr>
              <th>No.</th>
              <th>Image</th>
              <th>Item & Description</th>
              ${printConfig.itemCode ? `<th>Item Code</th>` : ''}
              ${printConfig.hsnSac ? `<th>HSN / SAC</th>` : ''}
              <th>Qty</th>
              <th>Unit</th>
              ${printConfig.itemFixedRate ? `<th>Fixed Rate (₹)</th>` : ''}
              ${printConfig.itemRate ? `<th>Rate (₹)</th>` : ''}
              ${printConfig.discountRate ? `<th>Discount %</th>` : ''}
              ${printConfig.discountAmt ? `<th>Discount (₹)</th>` : ''}
              ${printConfig.taxableAmt ? `<th>Taxable (₹)</th>` : ''}
              ${printConfig.gstAmounts ? `<th>GST %</th>` : ''}
              ${printConfig.leadTime ? `<th>Lead Time</th>` : ''}
              <th>Amount (₹)</th>
            </tr>
          </thead>
          <tbody>
            ${itemRows || `<tr><td colspan="${colCount}" style="text-align: center;">No items</td></tr>`}
          </tbody>
        </table>

        <div class="three-col">
          ${printConfig.bankDetails ? `
          <div class="bank-details">
            <h3>Bank Details</h3>
            <table>
              <tr><td>Bank Name</td><td>${bankName || '-'}</td></tr>
              <tr><td>Branch</td><td>${bankBranch || '-'}</td></tr>
              <tr><td>Account No.</td><td>${accountNo || '-'}</td></tr>
              ${ifscCode ? `<tr><td>IFSC Code</td><td>${ifscCode}</td></tr>` : ''}
              ${swiftCode ? `<tr><td>SWIFT Code</td><td>${swiftCode}</td></tr>` : ''}
            </table>
          </div>
          ` : `<div class="bank-details"><h3>Bank Details</h3><p style="text-align:center;color:#999;margin-top:20px;">Not Available</p></div>`}

          <div class="amount-words-box">
            <div style="padding: 0"><h3 style="margin: 0; text-align: left;">Amount in Words</h3><br><div class="amount-words-text">Rupees ${numberToWords(grandTotal)} only</div></div>
          </div>

          <div class="summary">
            <h3>Summary</h3>
            <table>
              <tr><td>Total Amount before Tax (₹)</td><td>${taxableAmount.toLocaleString('en-IN', {minimumFractionDigits: 2})}</td></tr>
              ${printConfig.totalQuantity ? `<tr><td>Total Quantity</td><td>${totalQuantity}</td></tr>` : ''}

              ${printConfig.gstSummary ? `
                ${displayIgst > 0 ? `<tr><td>IGST (₹)</td><td>${displayIgst.toLocaleString('en-IN', {minimumFractionDigits: 2})}</td></tr>` : ''}
                ${displayCgst > 0 ? `<tr><td>CGST (₹)</td><td>${displayCgst.toLocaleString('en-IN', {minimumFractionDigits: 2})}</td></tr>` : ''}
                ${displaySgst > 0 ? `<tr><td>SGST (₹)</td><td>${displaySgst.toLocaleString('en-IN', {minimumFractionDigits: 2})}</td></tr>` : ''}
              ` : ''}

              <tr style="border-top: 1px solid #000;"><td>Total (₹)</td><td>${summaryBaseTotal.toLocaleString('en-IN', {minimumFractionDigits: 2})}</td></tr>

              ${extraChargesArr.map(c => `
                <tr>
                  <td>${c.title} (${c.type === 'percent' ? `${c.value}%` : `₹${c.value}`})</td>
                  <td>₹ ${(c.type === 'percent' ? (summaryBaseTotal * toNumber(c.value) / 100) : toNumber(c.value)).toLocaleString('en-IN', {minimumFractionDigits: 2})}</td>
                </tr>
              `).join('')}

              ${discountsArr.map(d => `
                <tr>
                  <td>${d.title} (${d.type === 'percent' ? `${d.value}%` : `₹${d.value}`})</td>
                  <td>- ₹ ${(d.type === 'percent' ? (summaryBaseTotal * toNumber(d.value) / 100) : toNumber(d.value)).toLocaleString('en-IN', {minimumFractionDigits: 2})}</td>
                </tr>
              `).join('')}

              ${roundOffAmount ? `<tr><td>Round off (₹)</td><td>${roundOffAmount.toLocaleString('en-IN', {minimumFractionDigits: 2})}</td></tr>` : ''}

              <tr class="grand-total"><td>Grand Total (₹)</td><td>${grandTotal.toLocaleString('en-IN', {minimumFractionDigits: 2})}</td></tr>
            </table>
          </div>
        </div>

        <div class="bottom-layout">
          <div class="bottom-row">
            <div class="bottom-cell terms-box">
              <h3>Terms & Conditions</h3>
              ${termsAndConditionsHtml || '<p>-</p>'}
            </div>
            <div class="bottom-cell notes-box">
              <h3>Additional Notes</h3>
              ${printConfig.notes && (q.note || notesHtml) ? (q.note ? `<p>${q.note}</p>` : notesHtml.replace('<div style="margin-top: 10px;"><strong>Notes:</strong><br/>', '<p>').replace('</div>', '</p>')) : '<p style="color:#999;font-style:italic;">No additional notes</p>'}
            </div>
          </div>
          <div class="bottom-row signature-row">
            <div class="bottom-cell footer-note"><span>This is a computer-generated quotation. E. &amp; O. E.</span></div>
            <div class="bottom-cell authorized-sign">
              <p>For ${companyName}</p>
              <div class="signature-space">${signatureImageHtml}</div>
              <div class="sign-line">Authorised Signatory</div>
            </div>
          </div>
        </div>
      </body>
      </html>
    `;
    
    const w = window.open('', '_blank');
    if (!w) return;
    w.document.open();
    w.document.write(html);
    w.document.close();
    w.focus();
    setTimeout(() => { try { w.print(); } catch (err) {} }, 800);
  };
  
  // Helper function to convert number to words (simplified Indian numbering)
  const numberToWords = (num) => {
    if (!num || num === 0) return 'Zero';
    const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine'];
    const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
    const teens = ['Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
    
    const convertLessThanThousand = (n) => {
      if (n === 0) return '';
      if (n < 10) return ones[n];
      if (n < 20) return teens[n - 10];
      if (n < 100) return tens[Math.floor(n / 10)] + (n % 10 ? ' ' + ones[n % 10] : '');
      return ones[Math.floor(n / 100)] + ' Hundred' + (n % 100 ? ' and ' + convertLessThanThousand(n % 100) : '');
    };
    
    const crore = Math.floor(num / 10000000);
    const lakh = Math.floor((num % 10000000) / 100000);
    const thousand = Math.floor((num % 100000) / 1000);
    const remainder = Math.floor(num % 1000);
    
    let result = '';
    if (crore > 0) result += convertLessThanThousand(crore) + ' Crore ';
    if (lakh > 0) result += convertLessThanThousand(lakh) + ' Lakh ';
    if (thousand > 0) result += convertLessThanThousand(thousand) + ' Thousand ';
    if (remainder > 0) result += convertLessThanThousand(remainder);
    
    return result.trim() || 'Zero';
  };

  // highlight matched search term in a text
  const escapeRegExp = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const renderHighlighted = (text) => {
    if (text === null || text === undefined) return '-';
    const raw = String(text);
    const st = (searchTerm || '').trim();
    if (!st) return raw;
    try {
      const esc = escapeRegExp(st);
      const re = new RegExp(`(${esc})`, 'ig');
      const parts = raw.split(re);
      return parts.map((part, i) => (
        re.test(part) ? <mark key={i} style={{ background: '#eedd45ff' }}>{part}</mark> : <span key={i}>{part}</span>
      ));
    } catch (e) {
      return raw;
    }
  };

  const shareViaWhatsApp = (e) => {
    e.stopPropagation();
    if (!selectedQuotation) return;
    const rawPhone = getCustomerPhone(selectedQuotation.customer) || '';
    const customerName = selectedQuotation.customer?.company_name || selectedQuotation.customer?.firstname || 'Customer';
    if (!rawPhone) {
      alert('Customer phone number not available for WhatsApp');
      return;
    }
    // keep digits only
    let digits = String(rawPhone).replace(/\D/g, '');
    // handle common local formats: 10-digit Indian -> prepend 91, leading 0 -> drop and prepend 91
    if (digits.length === 10) {
      digits = '91' + digits;
    } else if (digits.length === 11 && digits.startsWith('0')) {
      digits = '91' + digits.slice(1);
    }
    if (digits.length < 8) {
      alert('Customer phone number appears invalid for WhatsApp');
      return;
    }

    const msg = `Quotation ${getQuotationNumber(selectedQuotation)}\nCustomer: ${customerName}\nAmount: ₹ ${calculateAmountForQuotation(selectedQuotation).toLocaleString('en-IN')}`;
    const url = `https://wa.me/${digits}?text=${encodeURIComponent(msg)}`;
    window.open(url, '_blank');
  };

  const shareViaEmail = (e) => {
    e.stopPropagation();
    if (!selectedQuotation) return;
    const to = selectedQuotation.customer?.email || '';
    const subject = `Quotation ${getQuotationNumber(selectedQuotation)}`;
    const body = `Quotation ${getQuotationNumber(selectedQuotation)}%0D%0ACustomer: ${selectedQuotation.customer?.company_name || ''}%0D%0AAmount: ₹ ${calculateAmountForQuotation(selectedQuotation).toLocaleString('en-IN')}`;
    const mailto = `mailto:${to}?subject=${encodeURIComponent(subject)}&body=${body}`;
    window.location.href = mailto;
  };

  const handleStatusChange = async (newStatus) => {
    if (!selectedQuotation) return;
    const prevStatus = selectedQuotation.status;
    const qid = selectedQuotation.quotation_id;

    // Optimistically update modal and lists
    setSelectedQuotation(prev => ({ ...(prev || {}), status: newStatus }));
    setDisplayedQuotations(prev => (prev || []).map(q => (String(q.quotation_id) === String(qid) ? { ...q, status: newStatus } : q)));
    setQuotations(prev => (prev || []).map(q => (String(q.quotation_id) === String(qid) ? { ...q, status: newStatus } : q)));

    try {
      // backend expects a PUT to /api/quotations/:id with payload { quotation: { ... } }
      await axios.put(`${BASE_URL}/api/quotations/${qid}`, { quotation: { status: newStatus } });
      try { window.toastr && window.toastr.success && window.toastr.success('Status updated'); } catch (e) {}
    } catch (err) {
      console.error('Failed to update status', err);
      // revert changes
      setSelectedQuotation(prev => ({ ...(prev || {}), status: prevStatus }));
      setDisplayedQuotations(prev => (prev || []).map(q => (String(q.quotation_id) === String(qid) ? { ...q, status: prevStatus } : q)));
      setQuotations(prev => (prev || []).map(q => (String(q.quotation_id) === String(qid) ? { ...q, status: prevStatus } : q)));
      try { window.toastr && window.toastr.error && window.toastr.error('Failed to update status'); } catch (e) {}
    }
  };

  const printQuotation = async (e) => {
    e.stopPropagation();
    await shareAsPDF(e);
  };

  const shareAsExcel = async (e) => {
    e.stopPropagation();
    if (!selectedQuotation) return;
    try {
      await exportQuotationToExcelStyled({
        q: selectedQuotation,
        printConfig,
        printerHeader,
        docType: getDocType(selectedQuotation),
        quotationDate: selectedQuotation.quotation_date,
        validTill: selectedQuotation.valid_until,
        references: selectedQuotation.references,
        note: selectedQuotation.note,
        tandcSelections: selectedQuotation.terms_and_conditions,
        extrcharges: selectedQuotation.extra_charges || [],
        additiondiscounts: selectedQuotation.discounts || [],
        tableItems: [],
        selectedBranch: selectedQuotation.company_branch,
        selectedBank: selectedQuotation.company_branch_bank,
        selectedEmployeeObj: selectedQuotation.sales_credit_person,
        selectedBillingAddress: selectedQuotation.billing_address,
        selectedShippingAddress: selectedQuotation.shipping_address,
        isSameAsBilling: false,
        isGSTStateMatch: true,
        qutationNo: "",
        selectedCustomer: selectedQuotation.customer,
        gstForAddr,
        getCustomerLegalGstin,
        normalizeQuotationNumber,
      });
    } catch (err) {
      console.error(err);
      alert("Failed to export Excel.");
    }
  };

  // Mark quotation as Converted and navigate to the create form with copy
  const handleConvert = async (qid, type) => {
    if (!qid) return;
    // optimistic update in UI
    setSelectedQuotation(prev => (prev && String(prev.quotation_id) === String(qid)) ? { ...prev, status: 'Converted' } : prev);
    setDisplayedQuotations(prev => (prev || []).map(q => (String(q.quotation_id) === String(qid) ? { ...q, status: 'Converted' } : q)));
    setQuotations(prev => (prev || []).map(q => (String(q.quotation_id) === String(qid) ? { ...q, status: 'Converted' } : q)));

    try {
      await axios.put(`${BASE_URL}/api/quotations/${qid}`, { quotation: { status: 'Converted' } });
      try { window.toastr && window.toastr.success && window.toastr.success('Quotation marked Converted'); } catch (e) {}
    } catch (err) {
      console.error('Failed to mark quotation as Converted', err);
      try { window.toastr && window.toastr.error && window.toastr.error('Failed to update quotation status'); } catch (e) {}
    } finally {
      setShowConvertModal(false);
      setShowQuotationDetail(false);
      navigate(`/quotation?type=${encodeURIComponent(type)}&copy_from=${qid}`);
    }
  };

  // Debounce the search input so we don't re-filter on every keystroke
  useEffect(() => {
    const handler = debounce(() => {
      setSearchTerm(searchInput);
    }, 400);
    handler();
    return () => handler.cancel && handler.cancel();
  }, [searchInput]);

  // Reset to first page when filters/search change
  useEffect(() => {
    setPage(1);
  }, [searchTerm, typeFilter, monthFilter, statusFilter, branchFilter, executiveFilter, selectedOtherMonth, selectedOtherYear, selectedFinancialYear]);

  // Reusable filter function (used by listing and export)
  const applyFiltersToList = (list) => {
    let filtered = (list || []).slice();
    const st = (searchTerm || '').trim().toLowerCase();

    if (st) {
      filtered = filtered.filter((q) => {
        const company = (q.customer?.company_name || '').toLowerCase();
        const person = (`${q.customer?.salutation || ''} ${q.customer?.firstname || ''} ${q.customer?.lastname || ''}`).toLowerCase();
        const number = getQuotationNumber(q).toLowerCase();
        const exec = (`${q.sales_credit_person?.firstname || ''} ${q.sales_credit_person?.lastname || ''}`).toLowerCase();
        return company.includes(st) || person.includes(st) || number.includes(st) || exec.includes(st);
      });
    }

    if (typeFilter && typeFilter !== 'All') {
      filtered = filtered.filter((q) => {
        const dt = getDocType(q);
        return dt === typeFilter;
      });
    }

    if (statusFilter && statusFilter !== 'All') {
      filtered = filtered.filter((q) => (q.status || '').toLowerCase() === statusFilter.toLowerCase());
    }

    if (monthFilter) {
      const now = new Date();
      filtered = filtered.filter((q) => {
        const d = q.quotation_date ? new Date(q.quotation_date) : null;
        if (!d) return false;
        if (monthFilter === 'Month') {
          return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
        } else if (monthFilter === 'Last Month') {
          const last = new Date(now.getFullYear(), now.getMonth() - 1, 1);
          return d.getMonth() === last.getMonth() && d.getFullYear() === last.getFullYear();
        } else if (monthFilter === 'Other Month') {
          if (!selectedOtherMonth) return false;
          const [year, month] = selectedOtherMonth.split('-').map(Number);
          return d.getMonth() === month - 1 && d.getFullYear() === year;
        } else if (monthFilter === 'Financial Year') {
          let fyStart, fyEnd;
          if (now.getMonth() >= 3) { // April is 3
            fyStart = new Date(now.getFullYear(), 3, 1);
            fyEnd = new Date(now.getFullYear() + 1, 2, 31);
          } else {
            fyStart = new Date(now.getFullYear() - 1, 3, 1);
            fyEnd = new Date(now.getFullYear(), 2, 31);
          }
          return d >= fyStart && d <= fyEnd;
        } else if (monthFilter === 'Other Financial Year') {
          const fyStart = new Date(selectedFinancialYear, 3, 1);
          const fyEnd = new Date(selectedFinancialYear + 1, 2, 31);
          return d >= fyStart && d <= fyEnd;
        }
        return true;
      });
    }

    if (branchFilter && branchFilter !== 'All Branches') {
      filtered = filtered.filter((q) => {
        const qBranchId = q.branch_id || q.company_branch_id || (q.branch && (q.branch.id || q.branch.ID));
        return String(qBranchId) === String(branchFilter);
      });
    }

    if (executiveFilter && executiveFilter !== 'All Executives') {
      filtered = filtered.filter((q) => {
        const qExecId = q.sales_credit_person_id || (q.sales_credit_person && (q.sales_credit_person.id || q.sales_credit_person.ID));
        return String(qExecId) === String(executiveFilter);
      });
    }

    return filtered;
  };

  useEffect(() => {
    setDisplayedQuotations(applyFiltersToList(quotations));
  }, [quotations, searchTerm, typeFilter, monthFilter, statusFilter, branchFilter, executiveFilter, selectedOtherMonth, selectedOtherYear, selectedFinancialYear]);

  const getCreateButtonText = () => {
    if (typeFilter === 'Quotation') return '+ Create Quotation';
    if (typeFilter === 'Proforma Invoice') return '+ Create Proforma Invoice';
    if (typeFilter === 'Sales Order') return '+ Create Sales Order';
    if (typeFilter === 'Transfer Order') return '+ Create Transfer Order';
    if (typeFilter === 'Purchase Order') return '+ Create Purchase Order';
    return '+ Create Quotation'; // default for All
  };

  const toNumber = (v) => {
    const n = Number(v);
    return Number.isFinite(n) ? n : 0;
  };

  // Compute pre-tax (product amount without tax) for a single quotation
  const calculatePreTaxForQuotation = (q) => {
    if (!q) return 0;
    const grand = toNumber(q.grand_total);

    // 1) explicit pre_tax_amount if provided
    if (q.pre_tax_amount !== undefined && q.pre_tax_amount !== null) {
      return Number(q.pre_tax_amount) || 0;
    }

    // 2) derive from line items if available
    const items = q.quotation_items || q.items || [];
    if (Array.isArray(items) && items.length) {
      const sum = items.reduce((s, item) => {
        const qty = Number(item.quantity) || 0;
        const rate = Number(item.rate) || 0;
        const discountPct = getDiscountPercentage(item);
        const line = qty * rate;
        const discount = line * (discountPct / 100);
        const taxable = line - discount;
        return s + taxable;
      }, 0);
      return sum;
    }

    // 3) subtract explicit tax amounts if present
    const taxes = (Number(q.cgst_amount) || 0) + (Number(q.sgst_amount) || 0) + (Number(q.igst_amount) || 0);
    if (taxes > 0) {
      return Math.max(0, grand - taxes);
    }

    // 4) if tax percentage is provided, derive pre-tax as grand / (1 + tax_percentage/100)
    if (q.tax_percentage !== undefined && q.tax_percentage !== null) {
      const tp = Number(q.tax_percentage) || 0;
      if (tp > 0) {
        return grand / (1 + tp / 100);
      }
    }

    // fallback: assume grand is pre-tax
    return grand;
  };

  // Compute final amount: pre-tax + tax + extra charges - discounts + round-off
  const calculateAmountForQuotation = (q) => {
    if (!q) return 0;

    const preTax = toNumber(calculatePreTaxForQuotation(q));

    let tax = toNumber(q.tax_amount);
    if (!tax) {
      const items = Array.isArray(q.quotation_items || q.items) ? (q.quotation_items || q.items) : [];
      if (items.length) {
        tax = items.reduce((s, item) => {
          return s + toNumber(item.tax_amount || (toNumber(item.cgst) + toNumber(item.sgst) + toNumber(item.igst)));
        }, 0);
      }
      if (!tax) {
        tax = toNumber(q.cgst_amount) + toNumber(q.sgst_amount) + toNumber(q.igst_amount);
      }
    }

    const baseTotal = preTax + tax;
    const extraChargesArr = Array.isArray(q.extra_charges) ? q.extra_charges : [];
    const discountsArr = Array.isArray(q.discounts) ? q.discounts : [];

    const extraChargesTotal = extraChargesArr.reduce((sum, c) => {
      const val = toNumber(c?.value);
      return sum + (c?.type === 'percent' ? (baseTotal * val / 100) : val);
    }, 0);

    const discountsTotal = discountsArr.reduce((sum, d) => {
      const val = toNumber(d?.value);
      return sum + (d?.type === 'percent' ? (baseTotal * val / 100) : val);
    }, 0);

    const roundOff = toNumber(q.roundoff_amount);
    const computed = Number((baseTotal + extraChargesTotal - discountsTotal + roundOff).toFixed(2));
    const stored = toNumber(q.grand_total);

    const hasCalculationInputs =
      q.pre_tax_amount !== undefined ||
      q.tax_amount !== undefined ||
      q.cgst_amount !== undefined ||
      q.sgst_amount !== undefined ||
      q.igst_amount !== undefined ||
      q.roundoff_amount !== undefined ||
      extraChargesArr.length > 0 ||
      discountsArr.length > 0 ||
      ((Array.isArray(q.quotation_items || q.items) ? (q.quotation_items || q.items) : []).length > 0);

    if (!hasCalculationInputs) return stored;
    if (Math.abs(stored - computed) < 0.01) return stored;
    return computed;
  };

  const calculateTotals = () => {
    const list = displayedQuotations.length ? displayedQuotations : quotations;

    const preTax = list.reduce((sum, q) => sum + (calculatePreTaxForQuotation(q) || 0), 0);
    const total = list.reduce((sum, q) => sum + (calculateAmountForQuotation(q) || 0), 0);

    return { preTax, total, count: list.length };
  };

  const handleExport = async () => {
    setExporting(true);
    try {
      // Fetch all quotations from server (no pagination) to ensure export includes all filtered rows
      const res = await axios.get(`${BASE_URL}/api/quotations`, { params: { page: 1, limit: 1000000 } });
      const all = res.data && res.data.data ? res.data.data : res.data || [];
      const filtered = applyFiltersToList(all);

      const data = filtered.map((q) => {
        const row = {};
        if (visibleColumns.includes('quote_no')) row['Quote No.'] = getQuotationNumber(q);
        if (visibleColumns.includes('customer')) row['Customer'] = q.customer?.company_name || `${q.customer?.salutation || ''} ${q.customer?.firstname || ''} ${q.customer?.lastname || ''}`.replace(/\s+/g, ' ').trim() || '';
        if (visibleColumns.includes('status')) row['Status'] = q.status || '';
        if (visibleColumns.includes('amount')) row['Amount (₹)'] = calculateAmountForQuotation(q);
        if (visibleColumns.includes('valid_till')) row['Valid Till'] = q.valid_until ? new Date(q.valid_until).toLocaleDateString('en-IN') : '';
        if (visibleColumns.includes('issued_on')) row['Issued On'] = q.quotation_date ? new Date(q.quotation_date).toLocaleDateString('en-IN') : '';
        if (visibleColumns.includes('issued_by')) row['Issued by'] = `${q.sales_credit_person?.firstname || ''} ${q.sales_credit_person?.lastname || ''}`.trim() || '';
        if (visibleColumns.includes('type')) row['Type'] = getDocType(q);
        if (visibleColumns.includes('executive')) row['Executive'] = `${q.sales_credit_person?.firstname || ''} ${q.sales_credit_person?.lastname || ''}`.trim() || '';
        if (visibleColumns.includes('response')) row['Response'] = '';
        if (visibleColumns.includes('last_interaction')) row['Last Interaction'] = q.last_interaction ? new Date(q.last_interaction).toLocaleDateString('en-IN') : '';
        if (visibleColumns.includes('next_action')) row['Next Action'] = q.next_action || '';
        return row;
      });

      const ws = XLSX.utils.json_to_sheet(data);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Quotations');
      const filename = `quotations_${new Date().toISOString().slice(0,10)}.xlsx`;
      XLSX.writeFile(wb, filename);
      try { window.toastr && window.toastr.success && window.toastr.success('Export completed'); } catch (e) {}
    } catch (err) {
      console.error('Failed to export quotations', err);
      // Fallback: export the currently displayed page
      try {
        const data = displayedQuotations.map((q) => {
          const row = {};
          if (visibleColumns.includes('quote_no')) row['Quote No.'] = getQuotationNumber(q);
          if (visibleColumns.includes('customer')) row['Customer'] = q.customer?.company_name || `${q.customer?.salutation || ''} ${q.customer?.firstname || ''} ${q.customer?.lastname || ''}`.replace(/\s+/g, ' ').trim() || '';
          if (visibleColumns.includes('status')) row['Status'] = q.status || '';
          if (visibleColumns.includes('amount')) row['Amount (₹)'] = q.grand_total || 0;
          if (visibleColumns.includes('valid_till')) row['Valid Till'] = q.valid_until ? new Date(q.valid_until).toLocaleDateString('en-IN') : '';
          if (visibleColumns.includes('issued_on')) row['Issued On'] = q.quotation_date ? new Date(q.quotation_date).toLocaleDateString('en-IN') : '';
          if (visibleColumns.includes('issued_by')) row['Issued by'] = `${q.sales_credit_person?.firstname || ''} ${q.sales_credit_person?.lastname || ''}`.trim() || '';
          if (visibleColumns.includes('type')) row['Type'] = getDocType(q);
          if (visibleColumns.includes('executive')) row['Executive'] = `${q.sales_credit_person?.firstname || ''} ${q.sales_credit_person?.lastname || ''}`.trim() || '';
          if (visibleColumns.includes('response')) row['Response'] = '';
          if (visibleColumns.includes('last_interaction')) row['Last Interaction'] = q.last_interaction ? new Date(q.last_interaction).toLocaleDateString('en-IN') : '';
          if (visibleColumns.includes('next_action')) row['Next Action'] = q.next_action || '';
          return row;
        });
        const ws = XLSX.utils.json_to_sheet(data);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Quotations');
        XLSX.writeFile(wb, 'quotations.xlsx');
        try { window.toastr && window.toastr.warning && window.toastr.warning('Exported visible page as fallback'); } catch (e) {}
      } catch (e) {
        console.error('Export fallback failed', e);
        try { window.toastr && window.toastr.error && window.toastr.error('Export failed'); } catch (e2) {}
      }
    } finally {
      setExporting(false);
    }
  };

  const { preTax, total, count } = calculateTotals();

  return (
    <div className="quotation-list">
      <div className="quotation-header">
        <h2>Quotations</h2>
        
        <div className="header-right">
          <div className="stats">
            <span className="stat-badge count">Count: {count}</span>
            <span className="stat-badge pretax">Pre-Tax: ₹ {preTax.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
            <span className="stat-badge total">Total: ₹ {total.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
          </div>
          
          <div className="header-actions">
              <div className="search-box">
                <input
                  type="text"
                  placeholder="Search"
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                />
                <span className="search-icon"><FaSearch /></span>
              </div>
            
            <button className="icon-btn square" title={exporting ? 'Exporting...' : 'Export to Excel'} onClick={handleExport} disabled={exporting}><FaFileExport /></button>
            <button
              className="icon-btn square"
              title="Print settings"
              onClick={() => {
                const type = selectedQuotation ? getDocType(selectedQuotation) : (typeFilter && typeFilter !== 'All' ? typeFilter : 'Quotation');
                try {
                  const saved = localStorage.getItem(`printConfig_${type}`);
                  setPrintConfig(saved ? JSON.parse(saved) : getDefaultPrintConfig(type));
                } catch (e) {
                  setPrintConfig(getDefaultPrintConfig(type));
                }
                setShowPrintSettings(true);
              }}
              aria-label="Open print settings"
            >
              <FaPrint />
            </button>
            <button className="icon-btn square" title="Display Preferences" onClick={() => { setTempVisibleColumns(visibleColumns); setShowDisplayPrefs(true); }}><FaBars /></button>
            <button className="icon-btn square" title="Items Summary" onClick={() => navigate('/quotation-item-summary')}><FaChartBar /></button>
            <button className="icon-btn square settings" title="Configuration" onClick={() => window.open(`${window.location.origin}/sales-configuration`, '_blank')}><FaCog /></button>
            
            
          </div>
        </div>
      </div>

      <div className="filters-row">
        <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)}>
          <option value="All">All Type</option>
          <option>Quotation</option>
          <option>Proforma Invoice</option>
          <option>Sales Order</option>
          <option>Transfer Order</option>
          <option>Purchase Order</option>
        </select>

        <select value={monthFilter} onChange={(e) => setMonthFilter(e.target.value)}>
          <option>Month</option>
          <option>Last Month</option>
          <option>Other Month</option>
          <option>Financial Year</option>
          <option>Other Financial Year</option>
        </select>

        {monthFilter === 'Other Month' && (
          <div style={{ display: 'flex', gap: '10px' }}>
            <select 
              value={selectedOtherMonth} 
              onChange={(e) => setSelectedOtherMonth(e.target.value)}
              style={{ minWidth: '150px' }}
            >
              <option value="">Select Month</option>
              {Array.from({ length: 12 }, (_, i) => {
                const monthDate = new Date(selectedOtherYear || new Date().getFullYear(), i, 1);
                const monthName = monthDate.toLocaleString('en-IN', { month: 'long', year: 'numeric' });
                const value = `${selectedOtherYear || new Date().getFullYear()}-${String(i + 1).padStart(2, '0')}`;
                return <option key={i} value={value}>{monthName}</option>;
              })}
            </select>
            <select 
              value={selectedOtherYear} 
              onChange={(e) => setSelectedOtherYear(Number(e.target.value))}
              style={{ minWidth: '100px' }}
            >
              {Array.from({ length: 10 }, (_, i) => new Date().getFullYear() - i).map((year) => (
                <option key={year} value={year}>{year}</option>
              ))}
            </select>
          </div>
        )}

        {monthFilter === 'Other Year' && (
          <select 
            value={selectedOtherYear} 
            onChange={(e) => setSelectedOtherYear(Number(e.target.value))}
            style={{ minWidth: '100px' }}
          >
            {Array.from({ length: 10 }, (_, i) => new Date().getFullYear() - i).map((year) => (
              <option key={year} value={year}>{year}</option>
            ))}
          </select>
        )}

        {monthFilter === 'Other Financial Year' && (
          <select 
            value={selectedFinancialYear} 
            onChange={(e) => setSelectedFinancialYear(Number(e.target.value))}
            style={{ minWidth: '120px' }}
          >
            {(() => {
              const now = new Date();
              const currentFYStart = (now.getMonth() >= 3) ? now.getFullYear() : now.getFullYear() - 1;
              return Array.from({ length: 10 }, (_, i) => currentFYStart - i).map((year) => (
                <option key={year} value={year}>{year}-{year + 1}</option>
              ));
            })()}
          </select>
        )}

        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
          <option>All</option>
          <option>Open</option>
          <option>Expired</option>
          <option>Rejected</option>
          <option>Converted</option>
          <option>Cancelled</option>
          <option>Replaced</option>
        </select>

        <select value={branchFilter} onChange={(e) => setBranchFilter(e.target.value)}>
          <option>All Branches</option>
          {branches && branches.map((b) => (
            <option key={b.id || b.name} value={b.id}>{b.name}{b.city ? ` - ${b.city}` : ''}</option>
          ))}
        </select>

        <select value={executiveFilter} onChange={(e) => setExecutiveFilter(e.target.value)}>
          <option>All Executives</option>
          {executives && executives.map((emp) => {
            const name = `${emp.firstname || emp.first_name || emp.FirstName || ''} ${emp.lastname || emp.last_name || emp.LastName || ''}`.trim();
            return <option key={emp.id || name} value={emp.id}>{name || (emp.username || emp.email || 'Unknown')}</option>;
          })}
        </select>
        <div className="filters-right">
          {perms?.can_create && (
          <button
            className="btn-create"
            onClick={() => window.open(`${window.location.origin}/quotation?type=${encodeURIComponent(typeFilter === 'All' ? 'Quotation' : typeFilter)}`, '_blank', 'noopener,noreferrer')}
          >
            {getCreateButtonText()}
          </button>
            )}
        </div>
      </div>

      <div className="table-container">
        <table className="quotation-table">
          <thead>
            <tr>
              {visibleColumns.includes('quote_no') && <th>Document No.</th>}
              {visibleColumns.includes('customer') && <th>Customer</th>}
              {visibleColumns.includes('amount') && <th>Amount (₹)</th>}
              {visibleColumns.includes('valid_till') && <th>Valid Till</th>}
              {visibleColumns.includes('issued_on') && <th>Issued On</th>}
              {visibleColumns.includes('issued_by') && <th>Issued by</th>}
              {visibleColumns.includes('type') && <th>Type</th>}
              {visibleColumns.includes('executive') && <th>Executive</th>}
              {visibleColumns.includes('status') && <th>Status</th>}
              {/* Response column hidden */}
              {visibleColumns.includes('last_interaction') && <th>Last Interaction</th>}
              {visibleColumns.includes('next_action') && <th>Next Action</th>}
              {visibleColumns.includes('actions') && <th>Actions</th>}
            </tr>
          </thead>
          <tbody>
            {displayedQuotations.map((quotation) => (
              <tr
                key={quotation.quotation_id}
                onClick={() => handleOpenQuotationDetail(quotation)}
                style={{ cursor: 'pointer' }}
              >
                {visibleColumns.includes('quote_no') && (
                  <td>
                    <span className="quote-no-cell">
                      {renderHighlighted(getQuotationNumber(quotation))}
                    </span>
                  </td>
                )}
                {visibleColumns.includes('customer') && <td>{renderHighlighted(quotation.customer?.company_name || `${quotation.customer?.salutation || ''} ${quotation.customer?.firstname || ''} ${quotation.customer?.lastname || ''}`.replace(/\s+/g, ' ').trim() || '-')}</td>}
                {visibleColumns.includes('amount') && <td>₹ {calculateAmountForQuotation(quotation).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>}
                {visibleColumns.includes('valid_till') && <td>{quotation.valid_until ? new Date(quotation.valid_until).toLocaleDateString('en-IN') : '-'}</td>}
                {visibleColumns.includes('issued_on') && <td>{quotation.quotation_date ? new Date(quotation.quotation_date).toLocaleDateString('en-IN') : '-'}</td>}
                {visibleColumns.includes('issued_by') && <td>{renderHighlighted(((quotation.sales_credit_person?.firstname || '') + ' ' + (quotation.sales_credit_person?.lastname || '')).trim() || '-')}</td>}
                {visibleColumns.includes('type') && <td>{renderHighlighted(getDocType(quotation))}</td>}
                {visibleColumns.includes('executive') && <td>{renderHighlighted(((quotation.sales_credit_person?.firstname || '') + ' ' + (quotation.sales_credit_person?.lastname || '')).trim() || '-')}</td>}
                {visibleColumns.includes('status') && <td>{renderHighlighted(quotation.status || '-')}</td>}
                {/* Response column hidden */}
                {visibleColumns.includes('last_interaction') && <td>{quotation._last_interaction_preview ? quotation._last_interaction_preview : (quotation.last_interaction ? new Date(quotation.last_interaction).toLocaleDateString('en-IN') : '-')}</td>}
                {visibleColumns.includes('next_action') && <td>{quotation._next_action_preview ? quotation._next_action_preview : (quotation.next_action || '-')}</td>}
                {visibleColumns.includes('actions') && <td onClick={(e) => e.stopPropagation()}>
                  {perms?.can_update && (
                  <FaEdit onClick={() => window.open(`${window.location.origin}/quotation/${quotation.quotation_id}`, '_blank')} style={{ cursor: 'pointer', marginRight: '10px' }} />
                    )}
                  {perms?.can_delete && (
                  <FaTrash onClick={() => handleDelete(quotation.quotation_id)} style={{ cursor: 'pointer' }} />
                    )}
                </td>}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showDisplayPrefs && (
        <div className="display-prefs-overlay">
          <div className="display-prefs-modal">
            <h3>Display Preferences</h3>
            <div className="prefs-list">
              <label className="pref-item pref-select-all" style={{ gridColumn: '1 / -1' }}>
                <input
                  type="checkbox"
                  checked={columnOptions.filter(c => !lockedKeys.includes(c.key)).every((c) => tempVisibleColumns.includes(c.key))}
                  onChange={toggleSelectAll}
                />
                <span style={{ fontWeight: 600 }}>Select All</span>
              </label>

              {columnOptions.map((c) => (
                <label key={c.key} className="pref-item">
                  <input
                    type="checkbox"
                    checked={lockedKeys.includes(c.key) ? true : tempVisibleColumns.includes(c.key)}
                    disabled={lockedKeys.includes(c.key)}
                    onChange={() => {
                      if (lockedKeys.includes(c.key)) return;
                      if (tempVisibleColumns.includes(c.key)) {
                        setTempVisibleColumns(tempVisibleColumns.filter((x) => x !== c.key));
                      } else {
                        setTempVisibleColumns([...tempVisibleColumns, c.key]);
                      }
                    }}
                  />
                  <span>{c.label}</span>
                </label>
              ))}
            </div>
            <div className="prefs-actions">
              <button className="btn secondary" onClick={() => setShowDisplayPrefs(false)}>Cancel</button>
              <button className="btn primary" onClick={() => {
                const final = Array.from(new Set([...(tempVisibleColumns || []), ...lockedKeys]));
                setVisibleColumns(final);
                try { localStorage.setItem('quotation_visible_columns', JSON.stringify(final)); } catch (e) {}
                setShowDisplayPrefs(false);
              }}>Save</button>
            </div>
          </div>
        </div>
      )}

      {showPrintSettings && (
        <PrintSettingsDialog 
          onClose={() => setShowPrintSettings(false)} 
          initialConfig={{
            ...printConfig,
            headerLogosSource: getHeaderLogoList(printerHeader),
            headerLogoFallback: printerHeader?.logo_data || null,
          }}
          onSave={handleSavePrintConfig}
          docType={currentPrintDocType}
        />
      )}

      {showQuotationDetail && selectedQuotation && (
        <div className="quotation-detail-overlay">
          <div className="quotation-detail-modal">
            <button className="close-btn" onClick={() => setShowQuotationDetail(false)}>
              <FaTimes />
            </button>
            
            <div className="detail-header">
              <div className="header-title">
                <h2>{selectedQuotation.customer?.company_name || `${selectedQuotation.customer?.salutation || ''} ${selectedQuotation.customer?.firstname || ''} ${selectedQuotation.customer?.lastname || ''}`.replace(/\s+/g, ' ').trim()}</h2>
                <span className="quote-number">
                  {getQuotationNumber(selectedQuotation)}
                </span>
              </div>
              <select
                className="status-badge-select"
                value={selectedQuotation.status || 'Not Expired'}
                onChange={(e) => handleStatusChange(e.target.value)}
                style={{ background: (selectedQuotation.status === 'Open') ? '#e8f5e9' : '#fff3e0', color: (selectedQuotation.status === 'Open') ? '#2e7d32' : '#e65100' }}
              >
                <option value="Open">Open</option>
                <option value="Expired">Expired</option>
                <option value="Rejected">Rejected</option>
                <option value="Converted">Converted</option>
                <option value="Cancelled">Cancelled</option>
                <option value="Replaced">Replaced</option>
              </select>
            </div>

            <div className="detail-meta">
              <span>{new Date().toLocaleDateString('en-IN')}</span>
              <span>•</span>
              <span>{selectedQuotation.sales_credit_person?.firstname} {selectedQuotation.sales_credit_person?.lastname || ''}</span>
            </div>

            <div className="detail-content">
              <div className="detail-left-column">
                <div className="section contact-details">
                  <h4>Contact Details</h4>
                  <div className="detail-row">
                    <span className="label">Phone:</span>
                    {
                      (() => {
                        const phone = getCustomerPhone(selectedQuotation.customer);
                        return (
                          <span className="value">
                            {phone || '-'}
                            {phone ? (
                              <FaCopy onClick={(e) => { e.stopPropagation(); copyToClipboard(phone); }} style={{ cursor: 'pointer', marginLeft: 8 }} title="Copy phone" />
                            ) : null}
                          </span>
                        );
                      })()
                    }
                  </div>
                  <div className="detail-row">
                    <span className="label">Email:</span>
                    {
                      (() => {
                        const email = getCustomerEmail(selectedQuotation.customer);
                        return (
                          <span className="value">
                            {email || '-'}
                            {email ? (
                              <FaCopy onClick={(e) => { e.stopPropagation(); copyToClipboard(email); }} style={{ cursor: 'pointer', marginLeft: 8 }} title="Copy email" />
                            ) : null}
                          </span>
                        );
                      })()
                    }
                  </div>
                </div>

                <div className="section financials">
                  <h4>Financials</h4>
                  <div className="detail-row">
                    <span className="label">Pre-Tax ₹:</span>
                    <span className="value">{(calculatePreTaxForQuotation(selectedQuotation) || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                  </div>
                  <div className="detail-row total">
                    <span className="label">Amount ₹:</span>
                    <span className="value">{calculateAmountForQuotation(selectedQuotation).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                  </div>
                </div>
              </div>

              <div className="detail-activity-column">
                <div className="section activity-box">
                  <div className="activity-header-row">
                    <h4>Next Actions</h4>
                    <button type="button" className="activity-add-btn" onClick={() => openActivityCreateModal('next_action')} disabled={activityLoading}>+ Add Next Action</button>
                  </div>

                  {activityLoading ? (
                    <div className="activity-empty">Loading...</div>
                  ) : (
                    detailNextActions.length > 0 ? (
                      <div className="activity-list">
                        {detailNextActions.map((na, idx) => {
                          const nextActionId = na.id || na.ID;
                          const nextDateTime = na.action_on || na.ActionOn || na.created_at;
                          const nextTypeRaw = (na.title || na.type || 'Appointment').toString().toLowerCase();
                          const nextType = nextTypeRaw.includes('appointment') ? 'Appointment' : 'General';
                          const nextNote = (na.notes || na.Notes || '').toString();
                          return (
                            <div className="activity-item" key={`na-${nextActionId || idx}`}>
                              <div className="activity-body">
                                <div className="activity-meta">
                                  <span>{formatActivityDate(nextDateTime)}</span>
                                  <span>{formatActivityTime(nextDateTime)}</span>
                                  <span className="activity-type">{nextType}</span>
                                </div>
                                <div className="activity-note">{nextNote || '-'}</div>
                              </div>
                              <div className="activity-actions-row">
                                <button type="button" className="activity-icon done" title="Mark As Done" onClick={(e) => {
                                  e.stopPropagation();
                                  // open modal to capture note before completing
                                  setPendingCompleteNextAction(na);
                                  setActivityMode('complete_next_action');
                                  setActivityForm({
                                    date: new Date(nextDateTime || Date.now()).toISOString().slice(0,10),
                                    time: new Date(nextDateTime || Date.now()).toTimeString().slice(0,5),
                                    type: nextType || 'Appointment',
                                    note: nextNote || '',
                                  });
                                  setShowActivityModal(true);
                                }}>
                                  <FaCheckCircle />
                                </button>
                                <button type="button" className="activity-icon cancel" title="Cancel" onClick={(e) => { e.stopPropagation(); cancelNextActionItem(nextActionId); }}>
                                  <FaTimes />
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="activity-empty">No next actions</div>
                    )
                  )}
                </div>
                <div className="section activity-box">
                  <div className="activity-header-row">
                    <h4>Interactions</h4>
                    <button type="button" className="activity-add-btn" onClick={() => openActivityCreateModal('interaction')} disabled={activityLoading}>+ Add Interaction</button>
                  </div>

                  {activityLoading ? (
                    <div className="activity-empty">Loading...</div>
                  ) : (
                    detailInteractions.length > 0 ? (
                      <div className="activity-list">
                        {detailInteractions.map((it, idx) => {
                          const interactionId = it.id || it.ID;
                          const interactionDateTime = it.interaction_on || it.InteractionOn || it.created_at || it.createdAt;
                          const interactionType = (it.type || it.Type || it.interaction_type || 'General').toString();
                          const interactionNote = (it.notes || it.Notes || it.summary || it.Summary || it.details || it.Details || '').toString();
                              return (
                                <div className="activity-item" key={`int-${interactionId || idx}`}>
                                  <div className="activity-body">
                                    <div className="activity-meta">
                                      <span>{formatActivityDate(interactionDateTime)}</span>
                                      <span>{formatActivityTime(interactionDateTime)}</span>
                                      <span className="activity-type">{interactionType}</span>
                                    </div>
                                    <div className="activity-note">{interactionNote || '-'}</div>
                                  </div>
                                  <div className="activity-actions-row">
                                    <button type="button" className="activity-icon delete" title="Delete" onClick={(e) => { e.stopPropagation(); deleteInteractionItem(interactionId); }}>
                                      <FaTrash />
                                    </button>
                                  </div>
                                </div>
                              );
                        })}
                      </div>
                    ) : (
                      <div className="activity-empty">No interactions</div>
                    )
                  )}
                </div>
              </div>
            </div>

            <div className="detail-actions">
              {perms?.can_update && (
              <button className="action-btn edit" onClick={() => { window.open(`${window.location.origin}/quotation/${selectedQuotation.quotation_id}`, '_blank'); setShowQuotationDetail(false); }} title="Edit">
                <FaEdit />
                <span>Edit</span>
              </button>
              )}

              {perms?.can_delete && (
              <button className="action-btn delete" onClick={() => { handleDelete(selectedQuotation.quotation_id); setShowQuotationDetail(false); }} title="Delete">
                <FaTrash />
                <span>Delete</span>
              </button>
              )}

              <button className="action-btn revise" title="Revise" onClick={() => { window.open(`${window.location.origin}/quotation/${selectedQuotation.quotation_id}?revise=1`, '_blank'); setShowQuotationDetail(false); }}>
                <FaRedo />
                <span>Revise</span>
              </button>

              <button className="action-btn convert" title="Convert" onClick={() => setShowConvertModal(true)}>
                <FaExchangeAlt />
                <span>Convert</span>
              </button>
            </div>

            <div className="detail-share">
              <span className="share-label">Share</span>
              <div className="share-buttons">
                <button className="share-btn pdf" onClick={(e) => shareAsPDF(e)}>PDF</button>
                <button className="share-btn whatsapp" onClick={(e) => shareViaWhatsApp(e)}>WhatsApp</button>
                <button className="share-btn email" onClick={(e) => shareViaEmail(e)}>Email</button>
                <button type="button" className="share-btn excel" onClick={(e) => shareAsExcel(e)} title="Export to Excel">
                  <FaFileExcel style={{ marginRight: 6, verticalAlign: "middle" }} />
                  Excel
                </button>
                <button className="share-btn print" onClick={(e) => printQuotation(e)}>Print</button>
              </div>
            </div>

            {showActivityModal && (
              <div className="activity-create-overlay" onClick={() => setShowActivityModal(false)}>
                <div className="activity-create-modal" onClick={(e) => e.stopPropagation()}>
                  <div className="activity-modal-title">{activityMode === 'interaction' ? 'Add Interaction' : (activityMode === 'complete_next_action' ? 'Complete Next Action' : 'Add Next Action')}</div>
                  {(() => {
                    const selectedTime = get12HourParts(activityForm.time);
                    return (
                  <div className="activity-form-grid">
                    <label>
                      Date
                      <input
                        type="date"
                        value={activityForm.date}
                        onChange={(e) => setActivityForm((prev) => ({ ...prev, date: e.target.value }))}
                      />
                    </label>
                    <label>
                      Time
                      <div className="time-picker-inline">
                        <select
                          value={selectedTime.hour}
                          onChange={(e) => setActivityForm((prev) => ({ ...prev, time: get24HourTime(e.target.value, selectedTime.minute, selectedTime.meridiem) }))}
                        >
                          {hourOptions12.map((hour) => (
                            <option key={`activity-hour-${hour}`} value={hour}>{hour}</option>
                          ))}
                        </select>
                        <span className="time-separator">:</span>
                        <select
                          value={selectedTime.minute}
                          onChange={(e) => setActivityForm((prev) => ({ ...prev, time: get24HourTime(selectedTime.hour, e.target.value, selectedTime.meridiem) }))}
                        >
                          {minuteOptions.map((minute) => (
                            <option key={`activity-minute-${minute}`} value={minute}>{minute}</option>
                          ))}
                        </select>
                        <select
                          value={selectedTime.meridiem}
                          onChange={(e) => setActivityForm((prev) => ({ ...prev, time: get24HourTime(selectedTime.hour, selectedTime.minute, e.target.value) }))}
                        >
                          <option value="AM">AM</option>
                          <option value="PM">PM</option>
                        </select>
                      </div>
                    </label>
                    <label>
                      Type
                      <select
                        value={activityForm.type}
                        onChange={(e) => setActivityForm((prev) => ({ ...prev, type: e.target.value }))}
                      >
                        <option value="Appointment">Appointment</option>
                        <option value="General">General</option>
                      </select>
                    </label>
                  </div>
                    );
                  })()}
                  <label className="activity-note-label">
                    Note
                    <textarea
                      value={activityForm.note}
                      onChange={(e) => setActivityForm((prev) => ({ ...prev, note: e.target.value }))}
                      placeholder="Enter note"
                    />
                  </label>
                  <div className="activity-modal-actions">
                    <button type="button" className="btn-cancel" onClick={() => { setShowActivityModal(false); setPendingCompleteNextAction(null); }} disabled={activitySaving}>Cancel</button>
                    <button type="button" className="btn-save" onClick={saveActivityItem} disabled={activitySaving}>{activitySaving ? 'Saving...' : 'Save'}</button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {showConvertModal && selectedQuotation && (
        <div className="convert-modal-overlay">
          <div className="convert-modal">
            <button className="close-btn" onClick={() => setShowConvertModal(false)}>
              <FaTimes />
            </button>
            <h3>Convert Quotation</h3>
            <p>Select the type of order to convert to:</p>
            <div className="convert-options">
              <button 
                className="convert-option" 
                onClick={() => handleConvert(selectedQuotation.quotation_id, 'Transfer Order')}
              >
                Transfer Order
              </button>
              <button 
                className="convert-option" 
                onClick={() => handleConvert(selectedQuotation.quotation_id, 'Sales Order')}
              >
                Sales Order
              </button>
              <button 
                className="convert-option" 
                onClick={() => handleConvert(selectedQuotation.quotation_id, 'Purchase Order')}
              >
                Purchase Order
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="pagination">
        <Pagination
          page={page}
          total={displayedQuotations.length}
          rowsPerPage={limit}
          isZeroBased={false}
          onPageChange={(newPage) => setPage(newPage)}
          onRowsPerPageChange={(newRowsPerPage) => { setLimit(newRowsPerPage); setPage(1); }}
        />
      </div>
    </div>
  );
};

export default QuotationList;
