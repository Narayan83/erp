import React, { useState, useEffect, useMemo, useRef, useLayoutEffect } from "react";
// removed CiSearch import (search button removed)
import { IoMdPrint, IoIosSearch } from "react-icons/io";
import { IoDocumentText } from "react-icons/io5";
import { FaYoutube, FaFileExcel } from "react-icons/fa";
import { MdEdit, MdModelTraining, MdNoteAdd } from "react-icons/md";
import { CgMenuGridO } from "react-icons/cg";
import { IoSettingsSharp } from "react-icons/io5";
import { MdSummarize } from "react-icons/md";
import { FaLongArrowAltLeft } from "react-icons/fa";
import { FaSave, FaCheck } from "react-icons/fa";
import { IoMdAdd } from "react-icons/io";
import { useForm, Controller } from "react-hook-form";
import { debounce } from "lodash";
import { MdDeleteOutline } from "react-icons/md";
import './add_quotation.scss';
// Replaced MUI components with native HTML elements and small helpers
import axios from "axios";
import { exportQuotationToExcelStyled } from "./quotationExcelExport";
import { useNavigate, useLocation } from "react-router-dom";

import { BASE_URL, getAuthHeaders } from "../../../config/Config";
import TermsConditionSelector from "./TermsConditionModal";
import PrintSettingsDialog from "../../../PrintSettings/Print";
import SavedTemplate from "../../../Admin Master/page/SavedTemplate/SavedTemplate";
import { useParams } from "react-router-dom"; 
import AddNonStockModal from "../../../Admin Master/page/NonStock/AddNonStockModal";
import CopyFromQuotationModal from "./CopyFromQuotationModal";
import {
  TextField,
  SearchableSelect,
  buildQuotationNumber,
  getProductImage,
  normalizeImageUrl,
  normalizeQuotationNumber,
  splitQuotationNumber,
  doGSTsMatchState
} from "./utils";




const AddQutation = () => {
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
        // ignore malformed value
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

  const getNextRevisionLetter = (currentLetter) => {
    const normalized = String(currentLetter || '').trim().toUpperCase();
    if (!normalized || normalized === 'R') return 'A';

    const code = normalized.charCodeAt(0);
    if (Number.isNaN(code) || code < 65 || code > 90) return 'A';
    if (code >= 90) return 'Z';
    return String.fromCharCode(code + 1);
  };

  const parseSequenceParts = (sequenceValue) => {
    const clean = String(sequenceValue || '').trim();
    const match = clean.match(/^(\d+)([a-zA-Z]?)$/);
    if (!match) {
      return {
        numberPart: clean.replace(/[^0-9]/g, ''),
        letterPart: '',
      };
    }

    return {
      numberPart: match[1] || '',
      letterPart: (match[2] || '').toUpperCase(),
    };
  };

  const [open, setOpen] = useState(false);
  /** Remount customer modal search when opening (stable <input> identity triggers Edge/Chrome "Saved info"). */
  const [customerSearchInputMountKey, setCustomerSearchInputMountKey] = useState(0);
  const customerSearchEditableRef = useRef(null);
  const [customers, setCustomers] = useState([]);
  const [search, setSearch] = useState("");
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [employees, setEmployees] = useState([]);
  const [selectedEmployee, setSelectedEmployee] = useState("");
  const navigate = useNavigate();
  // Derived selected employee object for display in Document Details
  const selectedEmployeeObj = useMemo(() => {
    if (!selectedEmployee) return null;
    const idStr = String(selectedEmployee);
    return (employees || []).find((emp) => {
      const candidates = [
        emp?.user_id,
        emp?.id,
        emp?.ID,
        emp?.id_user,
      ]
        .filter((v) => v !== undefined && v !== null)
        .map((v) => String(v));
      return candidates.includes(idStr);
    }) || null;
  }, [employees, selectedEmployee]);
  const today = new Date().toISOString().split("T")[0]; // "YYYY-MM-DD"

  const [saving, setSaving] = useState(false);
  const [quotationDate, setQuotationDate] = useState(today);
  const [validTill, setValidTill] = useState(today);
  const [note,setNote]=useState("");
  const [contactPerson,setContactPerson] = useState("");
  const [selectedBillingAddressId, setSelectedBillingAddressId] = useState(null);
  const [selectedBillingAddress, setSelectedBillingAddress] = useState(null);
  const [selectedShippingAddressId, setSelectedShippingAddressId] = useState(null);
  const [selectedShippingAddress, setSelectedShippingAddress] = useState(null);
  const [isSameAsBilling, setIsSameAsBilling] = useState(true);
  const [editingBillingAddress, setEditingBillingAddress] = useState(false);
  const [editingShippingAddress, setEditingShippingAddress] = useState(false);
  const [editingAddressId, setEditingAddressId] = useState(null);
  const [references,setReferences]=useState("");
  const [endcustomer,setEndCustomer]=useState("");
  const [enddealer,setEndDealer]=useState("");
  const [branches, setBranches] = useState([]);
  const [seriesList, setSeriesList] = useState([]);
  const [selectedSeries, setSelectedSeries] = useState("");
  const [selectedBranch, setSelectedBranch] = useState(null);


  const [nonStockItems, setNonStockItems] = useState([]);
  const [nonStockSearch, setNonStockSearch] = useState("");
  const [selectedNonStockIds, setSelectedNonStockIds] = useState([]);

  const toggleNonStockSelection = (id) => {
    setSelectedNonStockIds(prev => {
      const exists = prev.includes(id);
      if (exists) return prev.filter(x => x !== id);
      return [...prev, id];
    });
  };

  const clearNonStockSelections = () => setSelectedNonStockIds([]);

  const addSelectedNonStockItems = () => {
    if (!nonStockItems || nonStockItems.length === 0) return;
    const toAdd = nonStockItems.filter(p => selectedNonStockIds.includes(p.id || p.ID));
    toAdd.forEach(p => {
      try {
        handleSelectNonStockItem(p);
      } catch (e) {
        console.error('Failed to add selected non-stock item', e);
      }
    });
    clearNonStockSelections();
    setOpenAddServiceModal(false);
  };

  const handleSelectNonStockItem = (item) => {
    const qty = 1;
    const rate = Number(item.rate) || 0;
    const gstPercent = Number(item.gst) || 0;

    const taxable = qty * rate;
    const sellerGSTIN = selectedBranch?.gst_number || selectedBranch?.gst || selectedBranch?.GST || '';
    const buyerGSTIN = gstForAddr(selectedShippingAddress) || gstForAddr(selectedBillingAddress) || '';
    const taxRes = gstCalculation(taxable, gstPercent, sellerGSTIN, buyerGSTIN, isGSTStateMatch);

    const newItem = {
      id: `service-${item.id || item.ID}-${Date.now()}`,
      name: item.item_name || item.ItemName || '',
      description: item.description || item.Description || '',
      qty,
      unit: item.unit || item.Unit || 'no.s',
      hsn: item.hsn_sac || item.HSNSAC || '',
      rate,
      gst: gstPercent,
      taxable: taxRes.amount,
      cgst: taxRes.cgst,
      sgst: taxRes.sgst,
      igst: taxRes.igst,
      amount: taxRes.grandTotal,
      variantId: null,
      _isService: true,
      _rowId: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    };

    setTableItems((prev) => {
      const next = [...prev, newItem];
      const total = next.reduce((s, it) => s + (Number(it.amount) || 0), 0);
      setGrandTotal(+total.toFixed(2));
      return next;
    });
  };

  const [openProdTable, setOpenProdTable] = useState(false); // modal state
  const [prodsearch, setProdSearch] = useState(""); // search text
  const [products, setProducts] = useState([]); // fetched products
  const [barcodeSuggestions, setBarcodeSuggestions] = useState([]);
  const [productLayout, setProductLayout] = useState('list'); // 'list' | 'grid'
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState('');
  const [selectedSubcategoryFilter, setSelectedSubcategoryFilter] = useState('');
  const [tableItems, setTableItems] = useState([]); // items in main table
  const [grandTotal , setGrandTotal] = useState(0);
  const [totalTaxable, setTotalTaxable] = useState(0);
  const [totalTaxAmount, setTotalTaxAmount] = useState(0);
  const [printerHeader, setPrinterHeader] = useState(null);
  const [digitalSignature, setDigitalSignature] = useState(null);

  const [isGSTStateMatch, setIsGSTStateMatch]  = useState(true);
  const [branchGstNumber,setBranchGstNumber]  = useState("");
  const [custAddressGst,setCustAddressGst]  = useState("");

  const normalizeEmployeeOption = (emp = {}) => {
    const userObj = emp.user || emp.User || {};
    const userIdRaw =
      emp.user_id ??
      emp.userId ??
      userObj.id ??
      userObj.ID ??
      emp.id_user ??
      emp.id ??
      emp.ID;

    const employeeIdRaw = emp.id ?? emp.ID ?? null;

    const mobileRaw =
      emp.mobile_number ??
      emp.mobile ??
      emp.phone ??
      emp.contact ??
      userObj.mobile_number ??
      userObj.mobile ??
      userObj.phone ??
      userObj.contact ??
      '';

    const emailRaw =
      emp.email ??
      emp.work_email ??
      userObj.email ??
      '';

    const salutation = emp.salutation || userObj.salutation || '';
    const first = emp.firstname || emp.first_name || emp.firstName || userObj.firstname || userObj.first_name || userObj.firstName || emp.name || emp.Name || '';
    const last = emp.lastname || emp.last_name || emp.lastName || userObj.lastname || userObj.last_name || userObj.lastName || '';
    const fullName = `${salutation} ${first} ${last}`.trim();

    return {
      ...emp,
      id: userIdRaw,
      user_id: userIdRaw,
      employee_id: employeeIdRaw,
      mobile_number: mobileRaw,
      email: emailRaw,
      display_name: fullName || emailRaw || 'Unnamed',
    };
  };

const [productSelections, setProductSelections] = useState({});
  // IDs of products checked in the product selection modal
  const [selectedProductIds, setSelectedProductIds] = useState([]);

  const toggleProductSelection = (id) => {
    setSelectedProductIds(prev => {
      const exists = prev.includes(id);
      if (exists) return prev.filter(x => x !== id);
      return [...prev, id];
    });
  };

  const clearProductSelections = () => setSelectedProductIds([]);

  const addSelectedProducts = () => {
    if (!products || products.length === 0) return;
    const toAdd = products.filter(p => selectedProductIds.includes(p.ID));
    toAdd.forEach(p => {
      try {
        // when adding from the product modal, allow multiple rows even for same product
        handleSelectProduct(p, true);
      } catch (e) {
        console.error('Failed to add selected product', e);
      }
    });
    clearProductSelections();
    setOpenProdTable(false);
  };
    // Billing item modal state (open when selecting a product)
    const [billingModalOpen, setBillingModalOpen] = useState(false);
    const [billingModalProduct, setBillingModalProduct] = useState(null);
    const [billingModalValues, setBillingModalValues] = useState({
      qty: 1,
      rate: 0,
      discount: 0,
      discountPercent: 0,
      hsn: '',
      gst: 0,
      unit: '',
      leadTime: '',
      desc: '',
      variantId: null,
    });
    const [billingEditIndex, setBillingEditIndex] = useState(null);

    // Add Service modal state
    const [openAddServiceModal, setOpenAddServiceModal] = useState(false);
    const [showCreateNonStockModal, setShowCreateNonStockModal] = useState(false);

const [tandc,setTandc]=useState([]);
const [openTandCModal, setOpenTandCModal] = useState(false);
const [tandcSearch, setTandcSearch] = useState('');
const [tandcSelections, setTandcSelections] = useState([]); 
const [qutationNo,setQutationNo] = useState('');
const [prevQutationNo, setPrevQutationNo] = useState('');
// Editable middle sequence and year-range parts
const [seqNumber, setSeqNumber] = useState('');
const [yearRange, setYearRange] = useState('');
const [revisionLetter, setRevisionLetter] = useState(''); // Revision letter for revise mode
const [currentScpCount,setCurrentScpCount] = useState({});
const [docTypeScpCounts, setDocTypeScpCounts] = useState({});




const [openChargeDialog, setOpenChargeDialog] = useState(false);
const [openDiscountDialog, setOpenDiscountDialog] = useState(false);
const [chargeType, setChargeType] = useState("percent"); 
const [chargeValue, setChargeValue] = useState(0);
  const [editingChargeIndex, setEditingChargeIndex] = useState(null);
  const [editingDiscountIndex, setEditingDiscountIndex] = useState(null);
const [discountType, setDiscountType] = useState("percent");
const [discountValue, setDiscountValue] = useState(0);
const [finalTotal, setFinalTotal] = useState(0);
const [includeRoundOff, setIncludeRoundOff] = useState(false);

// charges and discounts arrays
const [extrcharges, setExtraCharges] = useState([]); 
const [additiondiscounts, setAdditiondiscounts] = useState([]); 

const [selectedFile, setSelectedFile]  = useState(null); 
const [attachmentPath, setAttachmentPath] = useState(null);

// Template State
const [saveAsTemplate, setSaveAsTemplate] = useState(false);
const [printAfterSave, setPrintAfterSave] = useState(false);
const [templateName, setTemplateName] = useState("");
const [showTemplateModal, setShowTemplateModal] = useState(false);
const [showSavedTemplates, setShowSavedTemplates] = useState(false);

// Copy From Earlier Quotation Modal state
const [showCopyFromModal, setShowCopyFromModal] = useState(false);
// docType to use inside CopyFrom modal (allow showing all docs)
const [copyFromDocType, setCopyFromDocType] = useState('All');

// Bank Details Modal state
const [openBankModal, setOpenBankModal] = useState(false);
const [bankDetails, setBankDetails] = useState([]);
const [bankFormValues, setBankFormValues] = useState({
  title: '',
  bankName: '',
  accountNo: '',
  branch: '',
  ifsc: '',
  swiftCode: '',
});
const [editingBankId, setEditingBankId] = useState(null);
const [selectedBankId, setSelectedBankId] = useState(null);

// derived selected bank object (only when an option is chosen)
const selectedBank = selectedBankId ? bankDetails.find(b => String(b.id) === String(selectedBankId)) : null;

  // Print Configuration modal state and options (per-document-type)
  const [openPrintConfig, setOpenPrintConfig] = useState(false);

  // helper: default settings per doc type (tweak as needed)
  const getDefaultPrintConfig = (type = 'Quotation') => ({
    // Basic Elements
    header: true,
    footer: false,
    digitalSignature: false,
    orgDupTrip: false,
    partyInformation: true,
    gstin: true,
    gstSummary: type === 'Invoice' ? true : true,
    branch: true,
    bankDetails: type === 'Invoice',
    disclaimer: false,
    totalQuantity: true,
    validTill: type === 'Quotation',
    // Party Information
    mobile: true,
    email: true,
    contactPersonName: true,
    companyBeforePOC: false,
    totalBeforeRoundOff: false,
    // Item List
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
    image: true,
  });

  // determine initial doc type from URL (so we can load correct stored settings)
  const initialDocType = (() => {
    try {
      const params = new URLSearchParams(window.location.search || '');
      const t = params.get('type');
      return t ? t : 'Quotation';
    } catch (e) {
      return 'Quotation';
    }
  })();

  const [printConfig, setPrintConfig] = useState(() => {
    try {
      const key = `printConfig_${initialDocType}`;
      const saved = localStorage.getItem(key);
      return saved ? JSON.parse(saved) : getDefaultPrintConfig(initialDocType);
    } catch (e) {
      return getDefaultPrintConfig();
    }
  });

  useEffect(()=>{console.log(seqNumber)},[seqNumber]);

  const handleOpenPrintConfig = () => setOpenPrintConfig(true);
  const handleClosePrintConfig = () => setOpenPrintConfig(false);
  const togglePrintOption = (key) => setPrintConfig(prev => ({ ...prev, [key]: !prev[key] }));
  const handleSavePrintConfig = (newCfg, selectedDocType = null) => {
    try {
      const cfg = newCfg || printConfig;
      // Use the selected doc type from the dialog if provided, otherwise use the current context
      const type = selectedDocType || docType;
      const key = `printConfig_${type}`;
      localStorage.setItem(key, JSON.stringify(cfg));
      
      // If saving for the currently displayed type, update the state
      if (type === docType) {
        setPrintConfig(cfg);
      }
    } catch (e) {
      console.warn('Failed to save print config', e);
    }
    setOpenPrintConfig(false);
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

  const { id } = useParams(); 
  const location = useLocation();

  // derive document type from query param (default to Quotation)
  const urlType = (() => {
    try {
      const params = new URLSearchParams(location?.search || '');
      const t = params.get('type');
      return t ? t : '';
    } catch (e) {
      return '';
    }
  })();
  // local state for UI-selected document type (initialized from query param)
  const [docType, setDocType] = useState(urlType || 'Quotation');

  // When the document type changes, load the per-doc-type print config (or use defaults)
  useEffect(() => {
    try {
      const key = `printConfig_${docType}`;
      const saved = localStorage.getItem(key);
      if (saved) setPrintConfig(JSON.parse(saved));
      else setPrintConfig(getDefaultPrintConfig(docType));
    } catch (e) {
      setPrintConfig(getDefaultPrintConfig(docType));
    }
  }, [docType]);

  const [isEditMode, setIsEditMode] = useState(false);
  const [isReviseMode, setIsReviseMode] = useState(false);
  const canRegenerateDocumentNumber = !isEditMode || isReviseMode;
  const [quotationData, setQuotationData] = useState(null);

useEffect(()=>{
  console.log('selectedEmployee ID:', selectedEmployee);
  console.log('selectedEmployeeObj:', selectedEmployeeObj);
},[selectedEmployee, selectedEmployeeObj])


useEffect(()=>{
  console.log(tandcSelections)
},[tandcSelections])


  useEffect(() => {
    console.log(quotationData);
  if (isEditMode && quotationData) {
    console.log('Edit Mode - Loaded Data:', quotationData);
    console.log('Extra Charges:', quotationData.ExtraCharges);
    console.log('Discounts:', quotationData.Discounts);
    console.log('Terms & Conditions:', quotationData.terms_and_conditions);
  }
}, [quotationData, isEditMode]);


useEffect(()=>{console.log(customers)},[customers]);

// useEffect(() => {
//   setOpenTandCModal(open);
// }, [open]);

// Reset revisionLetter when exiting revise mode
useEffect(() => {
  if (!isReviseMode) {
    setRevisionLetter('');
  }
}, [isReviseMode]);

  // Fetch customers from API (use user_type filter supported by backend)
  const fetchCustomers = async (query = "") => {
    try {
      const response = await fetch(
        `${BASE_URL}/api/users?page=1&limit=10&filter=${encodeURIComponent(query)}`
      );
      const data = await response.json();
      console.log(data);
      // backend returns { data: [...], total, page, limit }
      setCustomers(data.data || []);
    } catch (err) {
      console.error("Error fetching customers:", err);
    }
  };


  // Fetch employees from API (use user_type filter)
  const fetchEmployees = async () => {
    try {
      // Prefer an endpoint that returns non-head employees directly
      // fallback to users endpoint if non-heads endpoint is not available
      let data = null;
      try {
        const res = await fetch(`${BASE_URL}/api/employees/non-heads`, { headers: getAuthHeaders() });
        if (res.ok) {
          data = await res.json();
          const list = Array.isArray(data.data) ? data.data : (Array.isArray(data) ? data : []);
          setEmployees((list || []).map(normalizeEmployeeOption));
          return;
        }
      } catch (e) {
        // ignore and fallback
      }

      const res2 = await fetch(`${BASE_URL}/api/users?page=1&limit=50&user_type=employee`, { headers: getAuthHeaders() });
      const data2 = await res2.json();
      const list2 = data2.data || data2 || [];
      setEmployees((Array.isArray(list2) ? list2 : []).map(normalizeEmployeeOption));
    } catch (err) {
      console.error("Error fetching employees:", err);
    }
  };


  // Fetch non-stock items from API
  const fetchNonStockItems = async () => {
    try {
      const res = await fetch(`${BASE_URL}/api/service-items`, { headers: getAuthHeaders() });
      const data = await res.json();
      setNonStockItems(Array.isArray(data) ? data : (data.data || []));
    } catch (err) {
      console.error("Error fetching non-stock items:", err);
    }
  };


  // Fetch products from API
  const fetchProducts = async (query = "") => {
    try {
      // Prefer server-side filter if supported by backend (uses `filter` like other endpoints).
      const res = await fetch(`${BASE_URL}/api/products?page=1&limit=50&filter=${encodeURIComponent(query)}`, { headers: getAuthHeaders() });
     const data = await res.json();
     console.log(data);
      let items = data.data || [];
      // Client-side fallback: if a query is provided, match against Name and Code/Sku fields
      if (query && items.length > 0) {
        const q = query.toString().toLowerCase();
        items = items.filter((p) => {
          const name = (p.Name || p.name || "").toString().toLowerCase();
          const code = (p.Code || p.code || p.Sku || p.SKU || "").toString().toLowerCase();
          return name.includes(q) || code.includes(q);
        });
      }
      setProducts(items);
    } catch (err) {
      console.error("Error fetching products:", err);
    }
  };




  // Fetch tandc from API
  const fetchTandC = async (query = "") => {
    try {
      const res = await fetch(`${BASE_URL}/api/tandc`, { headers: getAuthHeaders() });
     const data = await res.json();
     console.log(data);
      setTandc(data.data || []);
    } catch (err) {
      console.error("Error fetching TandC:", err);
    }
  };

  // Fetch branches from API
  const fetchBranches = async () => {
    try {
      // backend uses company-branches endpoint for branches
      const res = await fetch(`${BASE_URL}/api/company-branches?limit=1000`, { headers: getAuthHeaders() });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to fetch branches');
      const raw = Array.isArray(data.data) ? data.data : data;
      const list = Array.isArray(raw) ? raw.map(b => ({
        id: b.id || b.ID,
        name: b.name || b.Name,
        city: b.city || b.City,
        state: b.state || b.State,
        // normalize GST fields (various APIs use different keys)
        gst_number: b.gst_number || b.GSTNumber || b.gstin || b.GST || b.gst || b.GSTIN || ''
      })) : [];
      setBranches(list);
    } catch (err) {
      console.error("Error fetching branches:", err);
    }
  };

  // Fetch series for quotations (used to populate Series dropdown)
  const fetchSeries = async () => {
    try {
      const res = await fetch(`${BASE_URL}/api/series?limit=1000`, { headers: getAuthHeaders() });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to fetch series');
      const raw = Array.isArray(data.data) ? data.data : data;
      const list = Array.isArray(raw) ? raw.map(s => ({
        id: s.id || s.ID,
        name: s.name || s.Name || '',
        prefix: s.prefix || s.Prefix || '',
        prefix_number: s.prefix_number || s.prefixNumber || s.prefix_number || '',
        // preserve document_type and branch restrictions so UI can filter
        document_type: s.document_type || s.DocumentType || s.type || '',
        // company_branch_ids may be stored as JSON string or an array
        company_branch_ids: (() => {
          try {
            if (!s.company_branch_ids && s.company_branch_id) return [s.company_branch_id];
            if (!s.company_branch_ids) return [];
            if (typeof s.company_branch_ids === 'string') return JSON.parse(s.company_branch_ids || '[]');
            if (Array.isArray(s.company_branch_ids)) return s.company_branch_ids;
            return [];
          } catch (e) {
            return [];
          }
        })(),
      })) : [];
      setSeriesList(list);
    } catch (err) {
      console.error('Error fetching series:', err);
      setSeriesList([]);
    }
  };

  // Fetch bank details (company branch banks) for dropdown
  const fetchBankDetails = async () => {
    try {
      const res = await fetch(`${BASE_URL}/api/company-branch-banks`, { headers: getAuthHeaders() });
      const data = await res.json();
      const raw = Array.isArray(data.data) ? data.data : (Array.isArray(data) ? data : []);
      const list = Array.isArray(raw) ? raw.map(b => ({
        id: b.id || b.ID,
        bankName: b.bank_name || b.bankName || b.bank || '',
        accountNo: b.account_number || b.accountNo || b.account || '',
        branch: b.branch_name || b.branch || '',
        ifsc: b.ifsc_code || b.ifsc || '' ,
        // include SWIFT in whatever form the API provides and keep a canonical key `swiftCode`
        swift: b.swift_code || b.swiftCode || b.swift || '',
        swiftCode: b.swift_code || b.swiftCode || b.swift || '',
        title: b.title || (b.bank_name || b.bankName || b.bank || '')
      })) : [];
      setBankDetails(list);
    } catch (err) {
      console.error('Error fetching bank details:', err);
      setBankDetails([]);
    }
  };

  
  useEffect(()=>{
    console.log(tandc);
  },[tandc])






  // Debounced fetch for smoother typing
  const debouncedFetch = useMemo(() => debounce(fetchProducts, 500), []);

  // Debounced fetch for barcode suggestions (used by the scan input dropdown)
  const debouncedBarcodeFetch = useMemo(() => debounce(async (q) => {
    if (!q || !q.trim()) { setBarcodeSuggestions([]); return; }
    try {
      const res = await fetch(`${BASE_URL}/api/products?page=1&limit=20&filter=${encodeURIComponent(q)}`, { headers: getAuthHeaders() });
      const data = await res.json();
      let items = data.data || [];
      const qLower = q.toString().toLowerCase();
      items = items.filter((p) => {
        const name = (p.Name || p.name || "").toString().toLowerCase();
        const code = (p.Code || p.code || p.Sku || p.SKU || "").toString().toLowerCase();
        return name.includes(qLower) || code.includes(qLower);
      });
      setBarcodeSuggestions(items.slice(0, 10));
    } catch (err) {
      console.error('Error fetching barcode suggestions', err);
      setBarcodeSuggestions([]);
    }
  }, 400), []);

  useEffect(() => {
    return () => {
      try { debouncedBarcodeFetch.cancel(); } catch (e) {}
    };
  }, [debouncedBarcodeFetch]);

  // Ensure all fetch() calls from this component include the auth token
  useEffect(() => {
    const originalFetch = window.fetch;
    // wrapper that injects Authorization header from localStorage
    window.fetch = (input, init = {}) => {
      try {
        const token = localStorage.getItem('token');
        const existingHeaders = (init && init.headers) ? { ...init.headers } : {};
        const authHeader = token ? { Authorization: `Bearer ${token}` } : {};
        const headers = { ...existingHeaders, ...authHeader };
        return originalFetch(input, { ...init, headers });
      } catch (e) {
        return originalFetch(input, init);
      }
    };
    return () => { window.fetch = originalFetch; };
  }, []);

  useEffect(() => {
    fetchCustomers();
    fetchEmployees();
    fetchProducts();
    fetchNonStockItems();
    fetchTandC();
    fetchBranches();
    fetchSeries();
    fetchBankDetails();
  }, []);

    useEffect(() => {
      console.log(selectedCustomer);
      console.log(products);
      // Reset address selections only when customer actually changes (not during edit or copy/template prefill)
      // If the selected customer matches the prefilled customer (from edit or copy), keep the addresses.
      const prefilledCustomerId = quotationData?.customer?.id || quotationData?.customer?.ID;
      const currentCustomerId = selectedCustomer?.id || selectedCustomer?.ID;

      // In edit mode, if customer matches, don't clear (important for initialization)
      if (isEditMode && quotationData && String(prefilledCustomerId) === String(currentCustomerId)) {
        return;
      }
      
      // For new quotations (including Copy From/Template), if we have a customer, 
      // we trust handleSelectCustomer or prefillFormData to set/reset addresses.
      // We only clear everything if the customer is completely removed.
      if (!selectedCustomer) {
        setSelectedBillingAddressId(null);
        setSelectedBillingAddress(null);
        setSelectedShippingAddressId(null);
        setSelectedShippingAddress(null);
        setIsSameAsBilling(true);
      }
    }, [selectedCustomer, isEditMode, quotationData]);

  // Fetch printer headers
  const fetchPrinterHeaders = async () => {
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
  };

  useEffect(() => {
    fetchPrinterHeaders();
    fetchDigitalSignature();
  }, []);

  // listen for print-header updates so the editor/print preview reflects saved changes immediately
  useEffect(() => {
    const onHeaderChanged = (ev) => {
      const payload = ev && ev.detail ? ev.detail : null;
      if (payload) setPrinterHeader(payload);
    };
    window.addEventListener('printerHeader:changed', onHeaderChanged);
    return () => window.removeEventListener('printerHeader:changed', onHeaderChanged);
  }, []);

  const handleProductSearch = (e) => {
    const value = e.target.value;
    setProdSearch(value);
    // Trigger a debounced server fetch for up-to-date results
    debouncedFetch(value);

    // Provide an instant client-side filter from already-fetched products for snappy UX
    if (value && value.trim()) {
      const q = value.toString().toLowerCase();
      setProducts((prev = []) => (
        (prev || []).filter((p) => {
          const name = (p.Name || p.name || "").toString().toLowerCase();
          const code = (p.Code || p.code || p.Sku || p.SKU || "").toString().toLowerCase();
          return name.includes(q) || code.includes(q);
        })
      ));
    } else {
      // empty query -> refresh list
      fetchProducts();
    }
  };

  // Search by barcode/code and add product directly if single match.
  const handleBarcodeSearch = async (value) => {
    const query = (typeof value === 'string' && value.trim()) ? value.trim() : (prodsearch || '').trim();
    if (!query) return;

    try {
      const res = await fetch(`${BASE_URL}/api/products?page=1&limit=50&filter=${encodeURIComponent(query)}`, { headers: getAuthHeaders() });
      const data = await res.json();
      let items = data.data || [];

      // fallback client-side matching to prefer exact code/barcode matches
      const qLower = query.toString().toLowerCase();
      const match = items.find((p) => {
        const candidates = [p.Code, p.code, p.Sku, p.SKU, p.Barcode, p.barcode, p.bar_code, p.Bar_code, p.BarcodeNumber, p.barcode_number];
        return candidates.some((c) => c !== undefined && c !== null && c.toString().toLowerCase() === qLower);
      });

      if (match) {
        // add immediately
        handleSelectProduct(match);
        setProdSearch('');
        return;
      }

      // If only one product returned by server, add it
      if (items.length === 1) {
        handleSelectProduct(items[0]);
        setProdSearch('');
        return;
      }

      // Multiple or zero matches: if multiple, open product modal for user to choose
      if (items.length > 1) {
        setProducts(items);
        setOpenProdTable(true);
        return;
      }

      // No results
      alert('No product found for scanned barcode/code: ' + query);
    } catch (err) {
      console.error('Barcode search failed', err);
      alert('Failed to search product by barcode. See console for details.');
    }
  };

  // Open modal and fetch products initially
  const handleProdOpen = () => {
    setOpenProdTable(true);
    fetchProducts();
  };


  const handleProdClose = () => setOpenProdTable(false);

  const handleTandCOpen = () => setOpenTandCModal(true);
const handleTandCClose = () => setOpenTandCModal(false);

  // When document type (or branch/address) changes we need to refresh rates/fixedRates and recompute taxes
  useEffect(() => {
    if (!tableItems || tableItems.length === 0) return;

    setTableItems(prev => prev.map((item) => {
      // if it's a service item, we only need to recompute taxes (rates don't depend on branch/docType usually, 
      // or if they do, they are already set in the item)
      if (item._isService) {
        const qty = Number(item.qty) || 0;
        const rate = Number(item.rate) || 0;
        const discountPercent = Number(item.discountPercent) || 0;
        const discountAmount = ((rate * qty) * discountPercent) / 100;
        const gstPercent = Number(item.gst) || 0;
        const sellerGSTIN = selectedBranch?.gst_number || selectedBranch?.gst || selectedBranch?.GST || '';
        const buyerGSTIN = gstForAddr(selectedShippingAddress) || gstForAddr(selectedBillingAddress) || '';

        const taxable = (rate * qty) - discountAmount;
        const taxRes = gstCalculation(taxable, gstPercent, sellerGSTIN, buyerGSTIN, isGSTStateMatch);

        return {
          ...item,
          discount: discountAmount,
          taxable: taxRes.amount,
          cgst: taxRes.cgst,
          sgst: taxRes.sgst,
          igst: taxRes.igst,
          amount: taxRes.grandTotal,
          gst: gstPercent,
        };
      }

      // try to resolve product/variant from current state or the item itself
      const prodFromList = products.find(p => String(p.ID) === String(item.id)) || item.product || null;
      const variantFromList = prodFromList?.Variants ? (prodFromList.Variants.find(v => String(v.ID) === String(item.variantId)) || prodFromList.Variants[0]) : null;

      // If we can't find product/variant, leave the row as-is
      if (!prodFromList && !variantFromList) return item;

      const purchaseCost = Number(variantFromList?.PurchaseCost ?? prodFromList?.PurchaseCost ?? prodFromList?.Purchase_Cost ?? 0);
      const salesPrice = Number(variantFromList?.StdSalesPrice ?? variantFromList?.SalePrice ?? variantFromList?.SellingPrice ?? prodFromList?.StdSalesPrice ?? prodFromList?.SalePrice ?? 0);

      const newRate = docType === 'Purchase Order' ? purchaseCost : (salesPrice || Number(item.rate || 0));
      const qty = Number(item.qty) || 0;
      const discountPercent = Number(item.discountPercent) || 0;
      const discountAmount = ((newRate * qty) * discountPercent) / 100;
      const gstPercent = Number(item.gst ?? item.gst_percent ?? item.gstPercent ?? (prodFromList?.Tax?.Percentage ?? 0)) || 0;
      const sellerGSTIN = selectedBranch?.gst_number || selectedBranch?.gst || selectedBranch?.GST || '';
      const buyerGSTIN = gstForAddr(selectedShippingAddress) || gstForAddr(selectedBillingAddress) || '';

      const taxable = (newRate * qty) - discountAmount;
      const taxRes = gstCalculation(taxable, gstPercent, sellerGSTIN, buyerGSTIN, isGSTStateMatch);

      return {
        ...item,
        rate: Number(newRate),
        fixedRate: Number(newRate),
        discount: discountAmount,
        taxable: taxRes.amount,
        cgst: taxRes.cgst,
        sgst: taxRes.sgst,
        igst: taxRes.igst,
        amount: taxRes.grandTotal,
        gst: gstPercent,
      };
    }));

    // also update the billing modal values (if open) so user sees the change immediately when editing an item
    if (billingModalOpen && billingModalProduct) {
      const prodFromList = products.find(p => String(p.ID) === String(billingModalProduct.ID)) || billingModalProduct;
      const variantFromList = prodFromList?.Variants?.[0] || null;
      const purchaseCost = Number(variantFromList?.PurchaseCost ?? prodFromList?.PurchaseCost ?? 0);
      const salesPrice = Number(variantFromList?.StdSalesPrice ?? variantFromList?.SalePrice ?? prodFromList?.StdSalesPrice ?? 0);
      const newRate = docType === 'Purchase Order' ? purchaseCost : (salesPrice || Number(billingModalValues.rate || 0));
      setBillingModalValues(prev => ({ ...prev, rate: Number(newRate), fixedRate: Number(newRate) }));
    }

  }, [docType, selectedBranch, selectedShippingAddress, selectedBillingAddress, isGSTStateMatch]);

  // Add product to table with calculations
  const handleSelectProduct = (prod, forceNewRow = false) => {
    const qtyToAdd = 1; // default quantity when selecting
    const selectedVariant = prod.Variants?.[0] || null;
    // Prefer purchase cost for Purchase Orders; otherwise prefer variant sales price (StdSalesPrice) or other sale fields
    const rate = Number(docType === 'Purchase Order' ? (selectedVariant?.PurchaseCost ?? prod.PurchaseCost ?? selectedVariant?.StdSalesPrice ?? 0) : ((selectedVariant?.StdSalesPrice ?? selectedVariant?.SalePrice ?? selectedVariant?.SellingPrice ?? selectedVariant?.PurchaseCost) ?? 0));
    const discount = 0;

    setTableItems((prev) => {
      const copy = Array.isArray(prev) ? [...prev] : [];

      // Try to find existing item by product id and variant (if variant available)
      const existingIndex = copy.findIndex((it) => {
        const sameId = String(it.id) === String(prod.ID);
        if (!sameId) return false;
        // If variant exists on product, require same variant match; otherwise match by id only
        if (selectedVariant && selectedVariant.ID) {
          return String(it.variantId || '') === String(selectedVariant.ID);
        }
        return true;
      });

      // If we found an existing item and caller doesn't force a new row, increment qty
      if (existingIndex >= 0 && !forceNewRow) {
        const existing = { ...copy[existingIndex] };
        const newQty = (Number(existing.qty) || 0) + qtyToAdd;
        const taxable = (rate * newQty) - (existing.discount || 0);
        const gstPercent = prod.Tax?.Percentage || existing.gst || 0;
        const sellerGSTIN = selectedBranch?.gst_number || selectedBranch?.gst || selectedBranch?.GST || '';
        const buyerGSTIN = gstForAddr(selectedShippingAddress) || gstForAddr(selectedBillingAddress) || '';
        const taxRes = gstCalculation(taxable, gstPercent, sellerGSTIN, buyerGSTIN, isGSTStateMatch);
        copy[existingIndex] = { ...existing, qty: newQty, rate, fixedRate: (existing.fixedRate !== undefined ? existing.fixedRate : rate), taxable, cgst: taxRes.cgst, sgst: taxRes.sgst, igst: taxRes.igst, amount: taxRes.grandTotal, gst: gstPercent };
      } else { 
        // either not found or forced new row -> push a new line
        const taxable = rate * qtyToAdd - discount;
        const gstPercent = prod.Tax?.Percentage || 0;
        const sellerGSTIN = selectedBranch?.gst_number || selectedBranch?.gst || selectedBranch?.GST || '';
        const buyerGSTIN = gstForAddr(selectedShippingAddress) || gstForAddr(selectedBillingAddress) || '';
        const taxRes = gstCalculation(taxable, gstPercent, sellerGSTIN, buyerGSTIN, isGSTStateMatch);

        copy.push({
          _rowId: `${Date.now()}-${Math.random().toString(36).slice(2,8)}`,
          id: prod.ID,
          name: prod.Name,
          image: getProductImage(prod),
          hsn: prod.HsnSacCode,
          unit: prod.Unit?.name,
          // normalize product code/sku for display in table
          code: prod.Code || prod.code || prod.Sku || prod.SKU || '',
          Code: prod.Code || prod.code || prod.Sku || prod.SKU || '',
          sku: prod.Sku || prod.SKU || prod.Code || prod.code || '',
          variantId: selectedVariant?.ID || null,
          qty: qtyToAdd,
          rate,
          fixedRate: rate,
          discount: discount,
          discountPercent: 0,
          taxable: taxRes.amount,
          cgst: taxRes.cgst,
          sgst: taxRes.sgst,
          igst: taxRes.igst,
          amount: taxRes.grandTotal,
          gst: gstPercent,
          desc: '',
          leadTime: prod.LeadTime,
        });
      }

      return copy;
    });

    setOpenProdTable(false);
  };

  // Open billing-item modal prefilled for the given product
  const openBillingModalForProduct = (prod, editIndex = null) => {
    // If the passed object looks like an existing table item, use its fields
    setBillingEditIndex(editIndex);
    if (prod && (prod.qty !== undefined || prod.rate !== undefined || prod.amount !== undefined)) {
      const qty = Number(prod.qty) || 1;
      const rate = Number(prod.rate) || 0;
      const discount = Number(prod.discount) || 0;
      const discountPercent = (qty * rate) > 0 ? (discount / (qty * rate)) * 100 : 0;
      const taxable = prod.taxable !== undefined ? Number(prod.taxable) : (qty * rate - discount);
      const gstAmount = (Number(prod.cgst) || 0) + (Number(prod.sgst) || 0) + (Number(prod.igst) || 0);
      const gstPercent = taxable > 0 ? (gstAmount / taxable) * 100 : (prod.gst || prod.Tax?.Percentage || 0);

      // create a minimal product-like object for display
      const billingProd = {
        Name: prod.name || prod.desc || '',
        Code: prod.sku || prod.Code || '',
        ID: prod.id || prod.product_id || null,
        _isService: !!prod._isService,
      };

      setBillingModalProduct(billingProd);
      setBillingModalValues({
        qty,
        rate,
        fixedRate: Number(docType === 'Purchase Order' ? (prod.fixedRate ?? prod.fixed_rate ?? prod.fixed_price ?? prod.fixedPrice ?? prod.PurchaseCost ?? prod.Purchase_Cost ?? rate) : (prod.fixedRate ?? prod.fixed_rate ?? prod.fixed_price ?? prod.fixedPrice ?? rate)),
        discount,
        discountPercent: Math.round(discountPercent * 100) / 100,
        hsn: prod.hsn || prod.HsnSacCode || "",
        gst: Math.round(gstPercent * 100) / 100,
        unit: prod.unit || "",
        leadTime: prod.leadTime || prod.lead_time || "",
        desc: prod.desc || prod.description || prod.name || '',
        variantId: prod.variantId || prod.variant_id || null,
      });

      setBillingModalOpen(true);
      return;
    }

    // Fallback: product object from API
    const selectedVariant = prod.Variants?.[0] || null;
    setBillingModalProduct(prod);
    setBillingModalValues({
      qty: 1,
      // default billing modal rate: use PurchaseCost for Purchase Orders, otherwise sales price
      rate: Number(docType === 'Purchase Order' ? (selectedVariant?.PurchaseCost ?? prod.PurchaseCost ?? (selectedVariant?.StdSalesPrice ?? 0)) : ((selectedVariant?.StdSalesPrice ?? selectedVariant?.SalePrice ?? selectedVariant?.SellingPrice ?? selectedVariant?.PurchaseCost) ?? 0)),
      discount: 0,
      discountPercent: 0,
      hsn: prod.HsnSacCode || "",
      gst: prod.Tax?.Percentage || 0,
      unit: prod.Unit?.name || "",
      leadTime: prod.LeadTime || "",
      desc: prod.Name || "",
      variantId: selectedVariant?.ID || null,
    });
    setBillingModalOpen(true);
  };

  const handleBillingModalSave = () => {
    if (!billingModalProduct) return;

    const vals = billingModalValues;
    const qty = Number(vals.qty) || 0;
    const rate = Number(vals.rate) || 0;
    // Determine discount amount: if discountPercent provided use it, else use discount
    let discountAmount = Number(vals.discount) || 0;
    if (Number(vals.discountPercent) > 0) {
      discountAmount = (rate * qty) * (Number(vals.discountPercent) / 100);
    }

    const taxable = rate * qty - discountAmount;
    const gstPercent = Number(vals.gst) || 0;
    const sellerGSTIN = selectedBranch?.gst_number || selectedBranch?.gst || selectedBranch?.GST || '';
    const buyerGSTIN = gstForAddr(selectedShippingAddress) || gstForAddr(selectedBillingAddress) || '';
    const taxRes = gstCalculation(taxable, gstPercent, sellerGSTIN, buyerGSTIN, isGSTStateMatch);
    const cgst = taxRes.cgst;
    const sgst = taxRes.sgst;
    const igst = taxRes.igst;
    const amount = taxRes.grandTotal;

    const newItem = {
      _rowId: `${Date.now()}-${Math.random().toString(36).slice(2,8)}`,
      id: billingModalProduct.ID,
      _isService: !!billingModalProduct._isService,
      name: vals.desc || billingModalProduct.Name,
      hsn: vals.hsn,
      unit: vals.unit,
      variantId: vals.variantId,
      qty,
      rate,
      fixedRate: Number(vals.fixedRate ?? vals.fixed_rate ?? rate),
      discount: discountAmount,
      discountPercent: Number(vals.discountPercent) || 0,
      taxable,
      cgst,
      sgst,
      igst,
      gst: gstPercent,
      amount,
      desc: vals.desc || billingModalProduct.Name,
      leadTime: vals.leadTime,
      image: getProductImage(billingModalProduct) || billingModalProduct.image || billingModalProduct.thumbnail || (billingEditIndex !== null ? (tableItems?.[billingEditIndex]?.image || null) : null),
      // Ensure both `sku` and `code` keys are present so table column can render product code
      sku: billingModalProduct.Sku || billingModalProduct.SKU || billingModalProduct.Code || billingModalProduct.code || '',
      code: billingModalProduct.Code || billingModalProduct.code || billingModalProduct.Sku || billingModalProduct.SKU || '',
      Code: billingModalProduct.Code || billingModalProduct.code || billingModalProduct.Sku || billingModalProduct.SKU || '',
    };

    setTableItems((prev) => {
      const copy = [...prev];
      if (billingEditIndex !== null && copy[billingEditIndex]) {
        // editing existing row: preserve original _rowId
        const preservedId = copy[billingEditIndex]._rowId || newItem._rowId;
        copy[billingEditIndex] = { ...copy[billingEditIndex], ...newItem, _rowId: preservedId };
      } else {
        // when adding from billing modal (not editing), always add a new row
        copy.push(newItem);
      }
      return copy;
    });

    setBillingModalOpen(false);
    setOpenProdTable(false);
  };

  // Handle billing address selection
  const handleBillingAddressChange = (e) => {
    const addressId = e.target.value ? Number(e.target.value) : null;
    setSelectedBillingAddressId(addressId);
    
    if (addressId && selectedCustomer) {
        const address = (selectedCustomer.addresses || []).find(addr => (addr.id || addr.ID) == addressId);
        setSelectedBillingAddress(normalizeAddress(address) || null);
    } else {
      setSelectedBillingAddress(null);
    }
  };

  // Handle shipping address selection
  const handleShippingAddressChange = (e) => {
    const val = e.target.value;

    // If user explicitly selected 'none', treat it as "use billing address"
    if (val === 'none') {
      setIsSameAsBilling(true);
      setSelectedShippingAddressId(null);
      setSelectedShippingAddress(null);
      return;
    }

    const addressId = val ? Number(val) : null;
    setSelectedShippingAddressId(addressId);

    if (addressId && selectedCustomer) {
      const address = (selectedCustomer.addresses || []).find(addr => (addr.id || addr.ID) == addressId);
      setSelectedShippingAddress(normalizeAddress(address) || null);
    } else {
      setSelectedShippingAddress(null);
    }
  };

  // Address modal state and form data
  const [addressModalOpen, setAddressModalOpen] = useState(false);
  const [addressModalType, setAddressModalType] = useState("billing");
  const [addressForm, setAddressForm] = useState({
    title: "",
    show_title_in_shipping: false,
    // whether to show this address title on printed documents
    show_title_on_print: false,
    address1: "",
    address2: "",
    city: "",
    country: "India",
    state: "",
    postal_code: "",
    gst_in: "",
    is_sez: false,
    extra_key: "",
    extra_value: "",
  });

  // Normalize address fields coming from API (different APIs may use different keys)
  const normalizeAddress = (addr) => {
    if (!addr) return null;
    const normalized = { ...addr };
    // Normalize ID
    if (addr.ID && !addr.id) normalized.id = addr.ID;
    // Normalize address fields
    normalized.title = addr.title || addr.Title || '';
    normalized.address1 = addr.address1 || addr.Address1 || '';
    normalized.address2 = addr.address2 || addr.Address2 || '';
    normalized.city = addr.city || addr.City || '';
    normalized.state = addr.state || addr.State || '';
    normalized.country = addr.country || addr.Country || 'India';
    normalized.postal_code = addr.postal_code || addr.pincode || addr.Pincode || addr.pin || addr.zipcode || addr.ZipCode || '';
    normalized.gst_in = addr.gst_in || addr.gstin || addr.GSTIN || addr.gst || '';
    normalized.is_sez = addr.is_sez || false;
    // persistent flag: whether to show title when printing documents
    normalized.show_title_on_print = addr.show_title_on_print || false;
    return normalized;
  };

  // Helper: return customer's legal GSTIN (check common top-level fields, legal object and documents)
  const getCustomerLegalGstin = (cust) => {
    if (!cust) return '';
    // Check common top-level fields
    const top = cust.gst_in || cust.gstin || cust.GSTIN || cust.gst || cust.gstin_number || cust.gstinNumber || cust.tax_id || '';
    if (top && String(top).trim() !== '') return top;
    // Check legal object
    if (cust.legal && (cust.legal.gstin || cust.legal.gst)) return cust.legal.gstin || cust.legal.gst;
    // Check documents array for a GST document
    if (Array.isArray(cust.documents)) {
      const doc = cust.documents.find(d => {
        const k = (d.type || d.name || d.doc_type || '').toString().toLowerCase();
        return k.includes('gst');
      });
      if (doc) return doc.doc_number || doc.number || doc.docNumber || '';
    }
    return '';
  };

  // Helper: determine which GST to display for an address — use customer's legal GST for "permanent" addresses
  const gstForAddr = (addr) => {
    if (!addr) return '';
    if (addr.title && /perman/i.test(String(addr.title))) {
      return getCustomerLegalGstin(selectedCustomer);
    }
    return addr.gst_in || addr.gstin || addr.GSTIN || addr.gst || addr.gst_number || addr.gst_no || addr.gstNo || '';
  };

  // Helper: resolve customer contact values (address-level first, then customer-level fallback)
  const getCustomerMobileForAddr = (addr) => {
    const fromAddr = addr?.mobile || addr?.phone || addr?.phone_number || addr?.mobile_number || addr?.contact_number || addr?.telephone || addr?.contact || '';
    if (fromAddr && String(fromAddr).trim() !== '') return fromAddr;
    const cust = selectedCustomer || {};
    return cust.mobile || cust.phone || cust.phone_number || cust.mobile_number || cust.contact_number || cust.telephone || cust.contact || '';
  };

  const getCustomerEmailForAddr = (addr) => {
    const fromAddr = addr?.email || addr?.email_address || addr?.contact_email || '';
    if (fromAddr && String(fromAddr).trim() !== '') return fromAddr;
    const cust = selectedCustomer || {};
    return cust.email || cust.email_address || cust.contact_email || '';
  };

  const formatAddressCountryName = (country) => {
    const raw = String(country || '').trim();
    if (!raw) return '';
    // Convert values like "India (+91)" or "India +91" to "India".
    return raw
      .replace(/\s*\(\s*(?:\+|00)\d{1,4}\s*\)\s*/g, ' ')
      .replace(/\s+(?:\+|00)\d{1,4}\s*$/g, '')
      .trim();
  };

  const formatAddressPostalCode = (postalCode) => {
    const raw = String(postalCode || '').trim();
    if (!raw) return '';
    // Remove embedded country code prefix like (+91) before pincode.
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

  // GST calculation helper: returns cgst, sgst, igst, totalTax and grandTotal (rounded to 2 decimals)
  const gstCalculation = (amount, gstPercent = 0, sellerGSTIN = '', buyerGSTIN = '', isMatch = null) => {
    const pct = Number(gstPercent) || 0;
    let cgst = 0, sgst = 0, igst = 0;

    let isSameState = true;
    if (isMatch !== null) {
      isSameState = isMatch;
    } else {
      const sellerState = (sellerGSTIN || '').toString().slice(0, 2);
      const buyerStateRaw = (buyerGSTIN || '').toString();
      const buyerState = (buyerStateRaw && buyerStateRaw.trim().length >= 2) ? buyerStateRaw.slice(0, 2) : sellerState;
      isSameState = (!buyerStateRaw || buyerStateRaw.trim() === '' || sellerState === buyerState);
    }

    if (isSameState) {
      cgst = (amount * pct) / 100 / 2;
      sgst = (amount * pct) / 100 / 2;
    } else {
      igst = (amount * pct) / 100;
    }

    cgst = Number(cgst.toFixed(2));
    sgst = Number(sgst.toFixed(2));
    igst = Number(igst.toFixed(2));
    const totalTax = Number((cgst + sgst + igst).toFixed(2));
    const grandTotal = Number((amount + totalTax).toFixed(2));

    return { amount: Number((amount||0).toFixed(2)), cgst, sgst, igst, totalTax, grandTotal };
  };

  // Helper to sanitize numeric values (strip non-numeric chars and return number or empty string)
  const sanitizeNumericValue = (v) => {
    if (v === '' || v === null || v === undefined) return '';
    const s = String(v).replace(/[^0-9\.\-]/g, '');
    const n = parseFloat(s);
    return isNaN(n) ? '' : n;
  };

  // Extract a meaningful API/server validation message for user-facing alerts.
  const getApiErrorMessage = (err, fallback = 'Something went wrong.') => {
    const data = err?.response?.data;

    if (typeof data === 'string' && data.trim()) {
      return data.trim();
    }

    const direct = [data?.message, data?.error, data?.detail, data?.title, err?.message]
      .find((v) => typeof v === 'string' && v.trim());
    if (direct) return direct.trim();

    if (Array.isArray(data?.errors) && data.errors.length > 0) {
      const items = data.errors
        .map((e) => {
          if (typeof e === 'string') return e.trim();
          if (e && typeof e === 'object') {
            return (e.message || e.error || e.detail || e.msg || '').toString().trim();
          }
          return '';
        })
        .filter(Boolean);
      if (items.length > 0) return items.join('\n');
    }

    if (data?.errors && typeof data.errors === 'object') {
      const fieldErrors = Object.entries(data.errors)
        .map(([field, value]) => {
          if (Array.isArray(value)) {
            return `${field}: ${value.join(', ')}`;
          }
          if (typeof value === 'string') {
            return `${field}: ${value}`;
          }
          return `${field}: ${JSON.stringify(value)}`;
        })
        .filter(Boolean);
      if (fieldErrors.length > 0) return fieldErrors.join('\n');
    }

    return fallback;
  };

  // Country list and Indian states for the address modal
  const countries = [
    "Afghanistan","Albania","Algeria","Andorra","Angola","Antigua and Barbuda","Argentina","Armenia","Australia","Austria","Azerbaijan",
    "Bahamas","Bahrain","Bangladesh","Barbados","Belarus","Belgium","Belize","Benin","Bhutan","Bolivia","Bosnia and Herzegovina","Botswana","Brazil","Brunei","Bulgaria","Burkina Faso","Burundi",
    "Côte d'Ivoire","Cabo Verde","Cambodia","Cameroon","Canada","Central African Republic","Chad","Chile","China","Colombia","Comoros","Costa Rica","Croatia","Cuba","Cyprus","Czech Republic",
    "Democratic Republic of the Congo","Denmark","Djibouti","Dominica","Dominican Republic","Ecuador","Egypt","El Salvador","Equatorial Guinea","Eritrea","Estonia","Eswatini","Ethiopia",
    "Fiji","Finland","France","Gabon","Gambia","Georgia","Germany","Ghana","Greece","Grenada","Guatemala","Guinea","Guinea-Bissau","Guyana",
    "Haiti","Honduras","Hungary","Iceland","India","Indonesia","Iran","Iraq","Ireland","Israel","Italy",
    "Jamaica","Japan","Jordan",
    "Kazakhstan","Kenya","Kiribati","Kosovo","Kuwait","Kyrgyzstan",
    "Laos","Latvia","Lebanon","Lesotho","Liberia","Libya","Liechtenstein","Lithuania","Luxembourg",
    "Madagascar","Malawi","Malaysia","Maldives","Mali","Malta","Marshall Islands","Mauritania","Mauritius","Mexico","Micronesia","Moldova","Monaco","Mongolia","Montenegro","Morocco","Mozambique","Myanmar",
    "Namibia","Nauru","Nepal","Netherlands","New Zealand","Nicaragua","Niger","Nigeria","North Korea","North Macedonia","Norway",
    "Oman",
    "Pakistan","Palau","Panama","Papua New Guinea","Paraguay","Peru","Philippines","Poland","Portugal",
    "Qatar",
    "Republic of the Congo","Romania","Russia","Rwanda",
    "Saint Kitts and Nevis","Saint Lucia","Saint Vincent and the Grenadines","Samoa","San Marino","Sao Tome and Principe","Saudi Arabia","Senegal","Serbia","Seychelles","Sierra Leone","Singapore","Slovakia","Slovenia","Solomon Islands","Somalia","South Africa","South Korea","South Sudan","Spain","Sri Lanka","Sudan","Suriname","Sweden","Switzerland","Syria",
    "Taiwan","Tajikistan","Tanzania","Thailand","Timor-Leste","Togo","Tonga","Trinidad and Tobago","Tunisia","Turkey","Turkmenistan","Tuvalu",
    "Uganda","Ukraine","United Arab Emirates","United Kingdom","United States","Uruguay","Uzbekistan",
    "Vanuatu","Vatican City","Venezuela","Vietnam",
    "Yemen","Zambia","Zimbabwe"
  ];

  const indianStates = [
    "Andhra Pradesh","Arunachal Pradesh","Assam","Bihar","Chhattisgarh","Goa","Gujarat","Haryana","Himachal Pradesh","Jharkhand","Karnataka","Kerala","Madhya Pradesh","Maharashtra","Manipur","Meghalaya","Mizoram","Nagaland","Odisha","Punjab","Rajasthan","Sikkim","Tamil Nadu","Telangana","Tripura","Uttar Pradesh","Uttarakhand","West Bengal","Delhi","Puducherry","Ladakh","Jammu and Kashmir","Andaman and Nicobar Islands","Chandigarh","Dadra and Nagar Haveli and Daman and Diu"
  ];

  // Open address modal (used by + buttons)
  const handleAddAddress = (type = 'billing') => {
    if (!selectedCustomer) {
      alert('Please select a customer first.');
      return;
    }
    setAddressModalType(type);
    setAddressForm({
      title: "",
      show_title_in_shipping: false,
      address1: "",
      address2: "",
      city: "",
      country: "India",
      state: "",
      postal_code: "",
      gst_in: "",
      extra_key: "",
      extra_value: "",
    });
    setAddressModalOpen(true);
  };

  // Open address modal for editing an existing address
  const handleEditAddress = (type = 'billing') => {
    if (!selectedCustomer) {
      alert('Please select a customer first.');
      return;
    }
    setAddressModalType(type);
    const addr = type === 'billing' ? selectedBillingAddress : selectedShippingAddress;
    if (!addr) {
      alert('No address selected to edit.');
      return;
    }
    setEditingAddressId(addr.id || addr.ID || null);
    setAddressForm({
      title: addr.title || "",
      show_title_in_shipping: addr.show_title_in_shipping || false,
      // support existing saved flag if present
      show_title_on_print: addr.show_title_on_print || false,
      address1: addr.address1 || "",
      address2: addr.address2 || "",
      city: addr.city || "",
      country: addr.country || "India",
      state: addr.state || "",
      postal_code: addr.postal_code || addr.pincode || addr.pin || addr.zipcode || "",
      gst_in: addr.gst_in || addr.gstin || addr.gst || "",
      extra_key: (addr.extra && typeof addr.extra === 'object') ? Object.keys(addr.extra)[0] : (addr.extra && typeof addr.extra === 'string' ? 'extra' : ""),
      extra_value: (addr.extra && typeof addr.extra === 'object') ? Object.values(addr.extra)[0] : (addr.extra && typeof addr.extra === 'string' ? addr.extra : ""),
    });
    setAddressModalOpen(true);
  };

  // Save address from modal (local only). Adds to selectedCustomer.addresses
  const saveAddressModal = () => {
    // minimal validation
    if (!addressForm.title || !addressForm.address1) {
      alert('Please provide Title and Address Line 1.');
      return;
    }

    const extraObj = (addressForm.extra_key && addressForm.extra_key.trim()) ? { [addressForm.extra_key.trim()]: addressForm.extra_value } : (addressForm.extra_value && addressForm.extra_value.trim() ? { extra: addressForm.extra_value } : null);

    const payloadAddr = {
      title: addressForm.title,
      address1: addressForm.address1,
      address2: addressForm.address2,
      city: addressForm.city,
      state: addressForm.state,
      country: addressForm.country,
      postal_code: addressForm.postal_code,
      gst_in: addressForm.gst_in,
      show_title_on_print: !!addressForm.show_title_on_print,
      extra: extraObj,
    };

    // If editing an existing address, replace it; otherwise append a new address
    if (editingAddressId) {
      const updatedAddresses = (selectedCustomer.addresses || []).map(a => {
        if ((a.id || a.ID) == editingAddressId) {
          return { ...a, ...payloadAddr };
        }
        return a;
      });

      const updatedCustomer = { ...selectedCustomer, addresses: updatedAddresses };
      setSelectedCustomer(updatedCustomer);
      setCustomers(prev => prev.map(c => ((c.id == updatedCustomer.id || c.ID == updatedCustomer.id || c.id == updatedCustomer.ID || c.ID == updatedCustomer.ID) ? updatedCustomer : c)));

      // Update the selected address references if needed
      if (addressModalType === 'billing') {
        const updated = updatedAddresses.find(a => (a.id || a.ID) == editingAddressId);
        setSelectedBillingAddressId(editingAddressId);
        setSelectedBillingAddress(normalizeAddress(updated) || null);
        if (isSameAsBilling) {
          setSelectedShippingAddressId(editingAddressId);
          setSelectedShippingAddress(normalizeAddress(updated) || null);
        }
      } else {
        const updated = updatedAddresses.find(a => (a.id || a.ID) == editingAddressId);
        setSelectedShippingAddressId(editingAddressId);
        setSelectedShippingAddress(normalizeAddress(updated) || null);
      }

      setEditingAddressId(null);
      setAddressModalOpen(false);
      return;
    }

    // New address path
    const newAddr = {
      id: Date.now(),
      ...payloadAddr,
    };

    const updatedCustomer = {
      ...selectedCustomer,
      addresses: [ ...(selectedCustomer.addresses || []), newAddr ]
    };

    setSelectedCustomer(updatedCustomer);
    setCustomers(prev => prev.map(c => ((c.id == updatedCustomer.id || c.ID == updatedCustomer.id || c.id == updatedCustomer.ID || c.ID == updatedCustomer.ID) ? updatedCustomer : c)));

    if (addressModalType === 'billing') {
      setSelectedBillingAddressId(newAddr.id);
      setSelectedBillingAddress(normalizeAddress(newAddr));
      if (isSameAsBilling) {
        setSelectedShippingAddressId(newAddr.id);
        setSelectedShippingAddress(normalizeAddress(newAddr));
      }
    } else {
      setSelectedShippingAddressId(newAddr.id);
      setSelectedShippingAddress(normalizeAddress(newAddr));
    }

    setAddressModalOpen(false);
  };

  // Helper function to convert number to words (simplified Indian numbering)
  const numberToWords = (num, includePaisa = false) => {
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
    
    // Separate rupees and paisa
    const rupees = Math.floor(num);
    const paisa = Math.round((num - rupees) * 100);
    
    // Convert rupees part
    const crore = Math.floor(rupees / 10000000);
    const lakh = Math.floor((rupees % 10000000) / 100000);
    const thousand = Math.floor((rupees % 100000) / 1000);
    const remainder = Math.floor(rupees % 1000);
    
    let result = '';
    if (crore > 0) result += convertLessThanThousand(crore) + ' Crore ';
    if (lakh > 0) result += convertLessThanThousand(lakh) + ' Lakh ';
    if (thousand > 0) result += convertLessThanThousand(thousand) + ' Thousand ';
    if (remainder > 0) result += convertLessThanThousand(remainder);
    
    result = result.trim() || 'Zero';
    
    // Add paisa part if includePaisa is true and paisa is not zero
    if (includePaisa && paisa > 0) {
      const paisaWords = convertLessThanThousand(paisa);
      result += ' and ' + paisaWords + ' Paisa';
    }
    
    return result;
  };

  const generatePDF = async (quotationDataFromSave = null) => {
    // If we have quotationDataFromSave, use it, else try to use current state
    const q = quotationDataFromSave || {};
    const signatureImageUrl = printConfig.digitalSignature
      ? (digitalSignature || await fetchDigitalSignature())
      : null;
    const quotationNumber = normalizeQuotationNumber(q.quotation_number || qutationNo || '');
    const cust = q.customer || selectedCustomer || {};
    const branch = q.company_branch || selectedBranch || {};
    const items = q.quotation_items || q.items || tableItems || [];
    const company = q.company || branch.company || {};
    
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
    
    // addresses
    const bAddr = q.billing_address || selectedBillingAddress || {};
    const billingTitle = bAddr.title || customerName;
    const billingGSTIN = gstForAddr(bAddr) || getCustomerLegalGstin(cust) || '-';
    const billingAddress1 = bAddr.address1 || '';
    const billingAddress2 = bAddr.address2 || '';
    const billingAddress3 = bAddr.address3 || '';
    const billingCity = bAddr.city || '';
    const billingState = bAddr.state || '';
    const billingCountry = formatAddressCountryName(bAddr.country || 'India');
    const billingPincode = formatAddressPostalCode(bAddr.postal_code || bAddr.pincode || '');

    const sAddr = isSameAsBilling ? bAddr : (q.shipping_address || selectedShippingAddress || {});
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
    const custEmail = cust.email || cust.email_address || cust.contact_email || '';

    // Issued by (use sales_credit_person from saved quotation or selected employee in form)
    const issuerObj = q.sales_credit_person || selectedEmployeeObj || {};
    const issuerName = (issuerObj && ((issuerObj.firstname || issuerObj.first_name) ? `${issuerObj.firstname || issuerObj.first_name} ${issuerObj.lastname || issuerObj.last_name || ''}`.trim() : (issuerObj.name || issuerObj.Name || '')) ) || '';
    const issuerPhone = issuerObj.mobile || issuerObj.mobile_number || issuerObj.phone || issuerObj.contact || '';
    const issuerEmail = issuerObj.email || issuerObj.email_address || '';
    const issuedByLines = [issuerName, issuerPhone, issuerEmail]
      .map((v) => String(v || '').trim())
      .filter(Boolean);
    const issuedByHtml = issuedByLines.length ? issuedByLines.map((line) => `<div>${line}</div>`).join('') : '-';
    
    const companyName = printerHeader?.header_title || (branch.name || branch.company_name) || company.company_name || 'Canares Automation Pvt Ltd';
    const branchName = printerHeader?.header_subtitle || (branch.name || branch.branch_name || '');
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
    
    // Bank details
    const bankB = q.company_branch_bank || branch.company_branch_bank || selectedBank || {};
    const bankName = bankB.bankName || bankB.bank_name || branch.bank_name || company.bank_name || '';
    const bankBranch = bankB.branch || bankB.branch_name || bankB.bankBranch || bankB.bank_branch || branch.bank_branch || company.bank_branch || '';
    const bankBranchAddress = branch.bank_branch_address || company.bank_branch_address || branchAddress || '';
    const accountNo = bankB.accountNo || bankB.account_number || branch.account_number || company.account_number || '';
    const ifscCode = bankB.ifsc || bankB.ifsc_code || branch.ifsc_code || company.ifsc_code || '';
    const swiftCode = bankB.swiftCode || bankB.swift_code || branch.swift_code || company.swift_code || '';
    
    const rawTerms = q.terms_and_conditions || tandcSelections;
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
    const notesHtml = (q.note || note) ? `<div style="margin-top: 10px;"><strong>Notes:</strong><br/>${q.note || note}</div>` : '';

    // Calculate summary components
    let subtotalVal = 0;
    items.forEach(item => {
        const qty = Number(item.quantity || item.qty || 0);
        const rate = Number(item.rate || 0);
        const itemTotal = qty * rate;
        const discAmt = Number(item.discount_amount || item.discount || 0);
        const discPct = Number(item.discount_percentage || item.discountPercent || 0);
        let itemDisc = discAmt > 0 ? discAmt : (itemTotal * discPct / 100);
        subtotalVal += (itemTotal - itemDisc);
    });

    const taxableAmount = subtotalVal;
    const totalTax = Number(q.tax_amount || items.reduce((s, it) => s + (Number(it.tax_amount) || (Number(it.cgst || 0) + Number(it.sgst || 0) + Number(it.igst || 0))), 0));

    let cgst = Number(q.cgst_amount || 0);
    let sgst = Number(q.sgst_amount || 0);
    let igst = Number(q.igst_amount || 0);

    if (cgst === 0 && sgst === 0 && igst === 0) {
      cgst = items.reduce((s, it) => s + Number(it.cgst || 0), 0);
      sgst = items.reduce((s, it) => s + Number(it.sgst || 0), 0);
      igst = items.reduce((s, it) => s + Number(it.igst || 0), 0);
    }

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
    const inferredIntraState = isIntraStateByCode || (!sellerStateCode && !buyerStateCode && isIntraStateByName) || !!isGSTStateMatch;

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

    const extraChargesArr = Array.isArray(q.extra_charges || extrcharges) ? (q.extra_charges || extrcharges) : [];
    const discountsArr = Array.isArray(q.discounts || additiondiscounts) ? (q.discounts || additiondiscounts) : [];
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
    const grandTotalVal = Math.abs(storedGrandTotal - computedGrandTotal) < 0.01 ? storedGrandTotal : computedGrandTotal;

    const itemRows = items.map((item, idx) => {
      const quantity = Number(item.quantity || item.qty) || 0;
      const rate = Number(item.rate) || 0;
      const itemTotal = quantity * rate;
      const discountPct = Number(item.discount_percentage || item.discountPercent || 0);
      const discountPerUnit = rate * (discountPct / 100);
      const discountAmt = itemTotal * (discountPct / 100);
      const taxable = itemTotal - discountAmt;
      const taxAmount = Number(item.tax_amount || (Number(item.cgst||0) + Number(item.sgst||0) + Number(item.igst||0)));
      const finalAmount = Number(item.line_total || item.amount || (taxable + taxAmount));
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
      
      const imgUrl = getProductImage(item.product || item);
      const imgHtml = imgUrl ? `<img src="${imgUrl}" style="width: 25px; height: 25px; max-width: 25px; max-height: 25px; object-fit: contain; display: block; margin: 0 auto;" />` : '-';

      return `
        <tr>
          <td style="text-align: center;">${idx + 1}</td>
          ${printConfig.image ? `<td style="text-align: center; padding: 2px; vertical-align: middle;">${imgHtml}</td>` : ''}
          <td>${item.product_name || item.name || item.description || item.desc || '-'}</td>
          ${printConfig.itemCode ? `<td class="col-item-code" style="text-align: center;">${item.product_code || item.item_code || item.sku || '-'}</td>` : ''}
          ${printConfig.hsnSac ? `<td class="col-hsn" style="text-align: center;">${item.hsncode || item.hsn_code || item.hsn || '-'}</td>` : ''}
          <td class="col-qty" style="text-align: center;">${quantity}</td>
          <td class="col-unit" style="text-align: center;">${item.unit || 'Nos'}</td>
          ${printConfig.itemFixedRate ? `<td class="col-fixed-rate" style="text-align: center;">${fixedRateValue.toLocaleString('en-IN', {minimumFractionDigits: 2})}</td>` : ''}
          ${printConfig.itemRate ? `<td class="col-rate" style="text-align: center;">${rate.toLocaleString('en-IN', {minimumFractionDigits: 2})}</td>` : ''}
          ${printConfig.discountRate ? `<td class="col-disc-pct" style="text-align: center;">${Math.round(discountPct)}%</td>` : ''}
          ${printConfig.discountAmt ? `<td class="col-disc-amt" style="text-align: center;">${discountPerUnit.toLocaleString('en-IN', {minimumFractionDigits: 2})}</td>` : ''}
          ${printConfig.taxableAmt ? `<td class="col-taxable" style="text-align: center;">${taxable.toLocaleString('en-IN', {minimumFractionDigits: 2})}</td>` : ''}
          ${printConfig.gstAmounts ? `<td class="col-gst" style="text-align: center;">${(item.gst || 0)}%</td>` : ''}
          ${printConfig.leadTime ? `<td class="col-lead-time" style="text-align: center;">${item.lead_time || item.leadTime || '-'}</td>` : ''}
          <td class="col-amount" style="text-align: center;">${finalAmount.toLocaleString('en-IN', {minimumFractionDigits: 2})}</td>
        </tr>
      `;
    }).join('');
    
    // Count columns for the "No items" row
    const colCount = 4 + (printConfig.image?1:0) + (printConfig.itemCode?1:0) + (printConfig.hsnSac?1:0) + (printConfig.itemRate?1:0) + (printConfig.itemFixedRate?1:0) + (printConfig.discountRate?1:0) + (printConfig.discountAmt?1:0) + (printConfig.taxableAmt?1:0) + (printConfig.gstAmounts?1:0) + (printConfig.leadTime?1:0);

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>${docType} ${quotationNumber}</title>
          <style>
          :root {
            --pdf-font-family: "Segoe UI", Tahoma, Geneva, Verdana, sans-serif;
            --pdf-text-color: #1f2937;
            --pdf-muted-color: #6b7280;
            --pdf-border-color: #a0a2a5;
            --pdf-panel-bg: #f9fafb;
            --pdf-alt-row-bg: #f9fafb;
            --pdf-label-bg: #e5e7eb;
            --pdf-heading-color: #111827;
            --pdf-body-size: 10px;
            --pdf-small-size: 9px;
            --pdf-heading-size: 11px;
            --pdf-title-size: 20px;
            --pdf-summary-size: 10px;
            --pdf-logo-width: 200px;
            --pdf-logo-height: 90px;
          }
          * { margin: 0; padding: 0; box-sizing: border-box; }
          html, body { width: 99%; max-width: 99%; overflow-x: hidden; }
          body { font-family: var(--pdf-font-family); font-size: var(--pdf-body-size); line-height: 1.3; padding: 8px; color: var(--pdf-text-color); background: #fff; }
          
          /* Header Logo - positioned at top with 0 space */
          .pdf-header-logo-wrap { 
            width: var(--pdf-logo-width); 
            height: var(--pdf-logo-height); 
            overflow: hidden; 
            display: flex; 
            align-items: flex-start; 
            justify-content: center; 
            margin: 0; 
            padding: 0;
          }
          .pdf-header-logo { 
            width: 100%; 
            height: 100%; 
            max-width: 100%; 
            max-height: 100%; 
            object-fit: contain; 
            object-position: top center; 
            display: block; 
          }
          
          /* Company Info - compact and single line where possible */
          .branch-info { flex: 1 1 0; min-width: 0; max-width: none; }
          .branch-info h2 { 
            font-size: 12px; 
            color: var(--pdf-heading-color); 
            margin-bottom: 3px; 
            font-weight: 700; 
            line-height: 1.2;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
          }
          .branch-info p { 
            font-size: 9px; 
            line-height: 1.35; 
            margin: 1px 0; 
            color: var(--pdf-text-color); 
            font-weight: 400;
          }
          
          /* Document Title */
          .doc-title { 
            text-align: center;
            font-size: var(--pdf-title-size); 
            font-weight: 700; 
            margin: 8px 0 20px 0; 
            text-transform: uppercase; 
            color: var(--pdf-heading-color); 
            letter-spacing: 1px; 
          }
          
          /* Top Right Table - smaller */
          .quotation-details { 
            min-width: 0; 
            max-width: 200px; 
            border: 1px solid var(--pdf-border-color); 
          }
          .quotation-details table { 
            width: 100%; 
            font-size: 9px; 
            border-collapse: collapse; 
            background: #fff; 
          }
          .quotation-details td { 
            padding: 4px 6px; 
            border: 1px solid var(--pdf-border-color); 
            color: var(--pdf-text-color); 
            font-weight: 400;
          }
          .quotation-details td:first-child { 
            background: var(--pdf-label-bg); 
            white-space: nowrap; 
            width: 40%; 
            color: var(--pdf-heading-color); 
            font-weight: 400;
          }
          .quotation-details td:last-child { 
            color: var(--pdf-text-color); 
            overflow-wrap: anywhere; 
            font-weight: 400;
          }
          
          /* Addresses - smaller */
          .addresses { 
            display: flex; 
            justify-content: space-between; 
            margin: 6px 0 8px; 
            gap: 0; 
            border: 1px solid var(--pdf-border-color); 
            background: var(--pdf-panel-bg); 
            width: 100%; 
            max-width: 100%; 
          }
          .address-box { 
            flex: 1; 
            min-width: 0; 
            border: 0; 
            padding: 8px; 
            background: transparent; 
          }
          .address-box + .address-box { border-left: 1px solid var(--pdf-border-color); }
          .address-box h3 { 
            font-size: var(--pdf-heading-size); 
            font-weight: 700; 
            margin-bottom: 4px; 
            border-bottom: 1px solid var(--pdf-border-color); 
            padding-bottom: 3px; 
            text-transform: uppercase; 
            color: var(--pdf-heading-color); 
          }
          .address-box p { 
            font-size: 9px; 
            line-height: 1.35; 
            margin: 1px 0; 
            color: var(--pdf-text-color); 
            overflow-wrap: anywhere; 
            font-weight: 400;
          }
          
          /* Items Table - fixed image size and column widths */
          table.items { 
            width: 100%; 
            max-width: 100%; 
            border-collapse: collapse; 
            margin: 8px 0; 
            font-size: 9px; 
            border: 1px solid var(--pdf-border-color); 
          }
          table.items th, table.items td { 
            border: 1px solid var(--pdf-border-color); 
            padding: 4px 3px; 
            white-space: normal; 
            word-wrap: break-word; 
            font-weight: 400;
          }
          table.items th { 
            background: var(--pdf-label-bg); 
            color: var(--pdf-heading-color); 
            font-weight: 700; 
            text-align: center; 
            font-size: 9px; 
          }
          /* Flexible column widths for responsive layout */
          table.items th:nth-child(1), table.items td:nth-child(1) { width: 24px; min-width: 24px; max-width: 24px; } /* No. */
          ${printConfig.image ? `table.items th:nth-child(2), table.items td:nth-child(2) { width: 44px; min-width: 44px; max-width: 44px; padding: 6px !important; vertical-align: middle !important; } /* Image */` : ''}
          table.items th:nth-child(${printConfig.image ? '3' : '2'}), table.items td:nth-child(${printConfig.image ? '3' : '2'}) { min-width: 50px; max-width: 200px; text-align: left; } /* Item & Description - flexible */
          table.items .col-item-code { min-width: 50px; max-width: 90px; }
          table.items .col-hsn { min-width: 50px; max-width: 90px; }
          table.items .col-qty { min-width: 30px; max-width: 50px; }
          table.items .col-unit { min-width: 34px; max-width: 60px; }
          table.items .col-fixed-rate { min-width: 60px; max-width: 100px; }
          table.items .col-rate { min-width: 48px; max-width: 80px; }
          table.items .col-disc-pct { min-width: 50px; max-width: 80px; }
          table.items .col-disc-amt { min-width: 55px; max-width: 90px; }
          table.items .col-taxable { min-width: 55px; max-width: 90px; }
          table.items .col-gst { min-width: 36px; max-width: 60px; }
          table.items .col-lead-time { min-width: 55px; max-width: 90px; }
          table.items .col-amount { min-width: 60px; max-width: 100px; }
          
          table.items tbody tr:nth-child(even) { background: var(--pdf-alt-row-bg); }
          table.items tbody tr:nth-child(odd) { background: #fff; }
          table.items td { vertical-align: middle; color: var(--pdf-text-color); }
          
          /* Fixed image size - fits within the 44px column with padding for spacing */
          table.items img { 
            width: 32px !important; 
            height: 32px !important; 
            max-width: 32px !important; 
            max-height: 32px !important; 
            object-fit: contain !important; 
            display: block !important; 
            margin: 0 auto !important;
          }
          
          /* Three Column Section */
          .three-col { 
            display: flex; 
            gap: 0; 
            margin-top: 8px; 
            border: 1px solid var(--pdf-border-color); 
            background: #fff; 
            width: 100%; 
            max-width: 100%; 
          }
          .three-col > div { 
            flex: 1 1 0; 
            min-width: 0; 
            border: 0; 
            padding: 8px; 
            background: #fff; 
          }
          .three-col > div + div { border-left: 1px solid var(--pdf-border-color); }
          .three-col h3 { 
            font-size: var(--pdf-heading-size); 
            font-weight: 700; 
            margin-bottom: 4px; 
            color: var(--pdf-heading-color); 
            padding-bottom: 2px; 
            text-transform: uppercase; 
          }
          
          /* Bank Details - single line per row */
          .bank-details { flex: 1; }
          .bank-details p { 
            font-size: 9px; 
            line-height: 1.4; 
            margin: 2px 0; 
            color: var(--pdf-text-color); 
            font-weight: 400;
          }
          .bank-details p span { 
            display: inline; 
            font-weight: 400; 
          }
          
          /* Amount in Words */
          .amount-words-box { flex: 1; display: flex; justify-content: flex-start; text-align: left; }
          .amount-words-box > div { padding: 0; }
          .amount-words-box h3 { 
            font-size: var(--pdf-heading-size); 
            font-weight: 700; 
            color: var(--pdf-heading-color); 
            margin-bottom: 4px; 
          }
          .amount-words-box .amount-words-text { 
            font-size: 10px; 
            color: var(--pdf-text-color); 
            line-height: 1.4; 
            font-weight: 400;
          }
          
          /* Summary */
          .summary { flex: 1; }
          .summary table { 
            width: 100%; 
            font-size: 9px; 
            border-collapse: collapse; 
            margin-top: 4px; 
          }
          .summary td { 
            padding: 4px 6px; 
            border: 1px solid var(--pdf-border-color); 
            font-weight: 400;
          }
          .summary td:first-child { 
            text-align: left; 
            background: var(--pdf-panel-bg); 
            color: var(--pdf-text-color); 
          }
          .summary td:last-child { 
            text-align: right; 
            color: var(--pdf-heading-color); 
          }
          .summary .grand-total td { 
            background: var(--pdf-label-bg); 
            color: var(--pdf-heading-color); 
            font-size: 10px; 
            border-top: 2px solid var(--pdf-heading-color); 
            font-weight: 600;
          }
          
          /* Bottom Layout */
          .bottom-layout { border: 1px solid var(--pdf-border-color); border-top: 0; }
          .bottom-row { display: flex; gap: 0; width: 100%; max-width: 100%; }
          .bottom-row + .bottom-row { border-top: 1px solid var(--pdf-border-color); }
          .bottom-cell { flex: 1 1 0; min-width: 0; border: 0; padding: 8px; background: #fff; }
          .bottom-cell + .bottom-cell { border-left: 1px solid var(--pdf-border-color); }
          .terms-box h3, .notes-box h3 { 
            font-size: var(--pdf-heading-size); 
            font-weight: 700; 
            margin-bottom: 6px; 
            text-transform: uppercase; 
            color: var(--pdf-heading-color); 
          }
          .terms-box p, .terms-box div, .notes-box p, .notes-box div { 
            font-size: 9px; 
            line-height: 1.4; 
            white-space: pre-line; 
            color: var(--pdf-text-color); 
            margin: 1px 0; 
            font-weight: 400;
          }
          .terms-box { min-height: 80px; }
          .notes-box { min-height: 80px; }
          .bottom-row.signature-row .bottom-cell { min-height: 110px; }
          .footer-note { 
            display: flex; 
            align-items: flex-end; 
            font-size: 9px; 
            color: var(--pdf-muted-color); 
            font-style: italic; 
            min-height: 100%; 
            padding-bottom: 4px; 
            font-weight: 400;
          }
          .footer-note span { display: block; font-weight: 400; }
          .authorized-sign { 
            min-height: 100%; 
            display: flex; 
            flex-direction: column; 
            justify-content: flex-start; 
            align-items: flex-end; 
            text-align: center; 
          }
          .authorized-sign > p:first-child { 
            align-self: flex-end; 
            font-size: 9px; 
            color: var(--pdf-text-color); 
            margin-bottom: 8px; 
            font-weight: 400;
          }
          .authorized-sign .signature-space { 
            width: 150px; 
            min-height: 50px; 
            display: flex; 
            align-items: flex-end; 
            justify-content: center; 
            margin-bottom: 8px; 
          }
          .authorized-sign .signature-image { 
            max-width: 140px; 
            max-height: 46px; 
            object-fit: contain; 
            display: block; 
          }
          .authorized-sign .sign-line { 
            align-self: flex-end; 
            padding-top: 4px; 
            min-width: 150px; 
            font-size: 9px; 
            color: var(--pdf-heading-color); 
            border-top: 1px solid var(--pdf-border-color); 
            text-align: center; 
            font-weight: 400;
          }
          @media (max-width: 900px) {
            .pdf-header-logo-wrap { width: 150px; height: 70px; }
          }
          @media print {
            body { padding: 0; }
            @page { margin: 8mm; }
          }
        </style>
      </head>
      <body>
        ${printConfig.header ? `
        <div class="doc-title">${docType.toUpperCase()}</div>

        <div style="display:flex; align-items:flex-start; gap:10px; margin-bottom:10px; border-bottom:1px solid var(--pdf-border-color); padding-bottom:10px;">
          <div class="branch-info" style="flex:1; min-width:0; text-align:left;">
            <h2>${branchName || companyName}</h2>
            <p>${branchAddress}${[branchCity, branchState, branchPincode].filter(Boolean).length ? ', ' + [branchCity, branchState, branchPincode].filter(Boolean).join(', ') : ''}</p>
            ${branchGSTIN ? `<p>GSTIN: ${branchGSTIN}</p>` : ''}
            ${companyPhone ? `<p>Phone: ${companyPhone}</p>` : ''}
            ${companyEmail ? `<p>Email: ${companyEmail}</p>` : ''}
            ${companyWebsite ? `<p>Website: ${companyWebsite}</p>` : ''}
          </div>
          <div style="flex:1; display:flex; align-items:flex-start; justify-content:center;">
            ${companyLogo ? `<div class="pdf-header-logo-wrap"><img src="${companyLogo}" alt="${companyName}" class="pdf-header-logo" width="200" height="90" /></div>` : ''}
          </div>
          <div style="flex:1; display:flex; justify-content:flex-end;">
            <div class="quotation-details">
              <table>
                <tr><td>${docType} No.</td><td>${quotationNumber || '-'}</td></tr>
                <tr><td>Date</td><td>${quotationDate ? new Date(quotationDate).toLocaleDateString('en-IN') : new Date().toLocaleDateString('en-IN')}</td></tr>
                ${printConfig.validTill ? `<tr><td>Valid Till</td><td>${validTill ? new Date(validTill).toLocaleDateString('en-IN') : '-'}</td></tr>` : ''}
                <tr><td>Ref.</td><td>${references || q.references || '-'}</td></tr>
                <tr><td>Issued By</td><td>${issuedByHtml}</td></tr>
              </table>
            </div>
          </div>
        </div>
        ` : `
        <div class="doc-title">${docType.toUpperCase()}</div>
        <div style="display:flex; justify-content:flex-end; margin-bottom:10px;">
          <div class="quotation-details">
            <table>
              <tr><td>${docType} No.</td><td>${quotationNumber || '-'}</td></tr>
              <tr><td>Date</td><td>${quotationDate ? new Date(quotationDate).toLocaleDateString('en-IN') : new Date().toLocaleDateString('en-IN')}</td></tr>
              ${printConfig.validTill ? `<tr><td>Valid Till</td><td>${validTill ? new Date(validTill).toLocaleDateString('en-IN') : '-'}</td></tr>` : ''}
              <tr><td>Ref.</td><td>${references || q.references || '-'}</td></tr>
              <tr><td>Issued By</td><td>${issuedByHtml}</td></tr>
            </table>
          </div>
        </div>
        `}

        ${printConfig.partyInformation ? `
        <div class="addresses">
          <div class="address-box">
            <h3>Billing Address</h3>
            ${billingCompanyName ? `<p style="font-weight:600; margin-bottom:4px;">${billingCompanyName}</p>` : ''}
            ${billingPersonName ? `<p style="margin-bottom:4px;">${billingPersonName}</p>` : ''}
            ${billingAddress1 ? `<p>${billingAddress1}</p>` : ''}
            ${billingAddress2 ? `<p>${billingAddress2}</p>` : ''}
            ${billingAddress3 ? `<p>${billingAddress3}</p>` : ''}
            <p>${[billingCity, billingState, [billingCountry, billingPincode].filter(Boolean).join(' - ')].filter(Boolean).join(', ')}</p>
            ${printConfig.mobile && billingPhone ? `<p>Mobile: ${billingPhone}</p>` : ''}
            ${printConfig.email && custEmail ? `<p>Email: ${custEmail}</p>` : ''}
            ${printConfig.gstin && billingGSTIN && billingGSTIN !== '-' ? `<p>GSTIN: ${billingGSTIN}</p>` : ''}
          </div>
          <div class="address-box">
            <h3>Shipping Address</h3>
            ${shippingCompanyName ? `<p style="font-weight:600; margin-bottom:4px;">${shippingCompanyName}</p>` : ''}
            ${shippingPersonName ? `<p style="margin-bottom:4px;">${shippingPersonName}</p>` : ''}
            ${shippingAddress1 ? `<p>${shippingAddress1}</p>` : ''}
            ${shippingAddress2 ? `<p>${shippingAddress2}</p>` : ''}
            ${shippingAddress3 ? `<p>${shippingAddress3}</p>` : ''}
            <p>${[shippingCity, shippingState, [shippingCountry, shippingPincode].filter(Boolean).join(' - ')].filter(Boolean).join(', ')}</p>
            ${printConfig.mobile && shippingPhone ? `<p>Mobile: ${shippingPhone}</p>` : ''}
            ${printConfig.email && custEmail ? `<p>Email: ${custEmail}</p>` : ''}
            ${printConfig.gstin && shippingGSTIN && shippingGSTIN !== '-' ? `<p>GSTIN: ${shippingGSTIN}</p>` : ''}
          </div>
        </div>
        ` : ''}

        <table class="items">
          <thead>
            <tr>
              <th>No.</th>
              ${printConfig.image ? `<th>Image</th>` : ''}
              <th>Item & Description</th>
              ${printConfig.itemCode ? `<th class="col-item-code">Item Code</th>` : ''}
              ${printConfig.hsnSac ? `<th class="col-hsn">HSN / SAC</th>` : ''}
              <th class="col-qty">Qty</th>
              <th class="col-unit">Unit</th>
              ${printConfig.itemFixedRate ? `<th class="col-fixed-rate">Fixed Rate (₹)</th>` : ''}
              ${printConfig.itemRate ? `<th class="col-rate">Rate (₹)</th>` : ''}
              ${printConfig.discountRate ? `<th class="col-disc-pct">Discount %</th>` : ''}
              ${printConfig.discountAmt ? `<th class="col-disc-amt">Discounted (₹)</th>` : ''}
              ${printConfig.taxableAmt ? `<th class="col-taxable">Taxable (₹)</th>` : ''}
              ${printConfig.gstAmounts ? `<th class="col-gst">GST %</th>` : ''}
              ${printConfig.leadTime ? `<th class="col-lead-time">Lead Time</th>` : ''}
              <th class="col-amount">Amount (₹)</th>
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
            ${bankName ? `<p>Bank Name: ${bankName}</p>` : ''}
            ${bankBranch ? `<p>Branch: ${bankBranch}</p>` : ''}
            ${accountNo ? `<p>Account No.: ${accountNo}</p>` : ''}
            ${ifscCode ? `<p>IFSC Code: ${ifscCode}</p>` : ''}
            ${swiftCode ? `<p>SWIFT Code: ${swiftCode}</p>` : ''}
            ${!bankName && !bankBranch && !accountNo && !ifscCode && !swiftCode ? `<p style="text-align:center;color:#999;margin-top:20px;">Not Available</p>` : ''}
          </div>
          ` : `<div class="bank-details"><h3>Bank Details</h3><p style="text-align:center;color:#999;margin-top:20px;">Not Available</p></div>`}

          <div class="amount-words-box">
             <div style="padding: 0"><h3>Amount in Words</h3><div class="amount-words-text">Rupees ${numberToWords(grandTotalVal, roundOffAmount === 0)} only</div></div>
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

              <tr class="grand-total"><td>Grand Total (₹)</td><td>${grandTotalVal.toLocaleString('en-IN', {minimumFractionDigits: 2})}</td></tr>
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
              ${printConfig.notes && (q.note || note || notesHtml) ? ((q.note || note) ? `<p>${q.note || note}</p>` : notesHtml.replace('<div style="margin-top: 10px;"><strong>Notes:</strong><br/>', '<p>').replace('</div>', '</p>')) : '<p style="color:#999;font-style:italic;">No additional notes</p>'}
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

  /** Excel export — implementation in {@link ./quotationExcelExport}. */
  const exportQuotationToExcel = async (quotationDataFromSave = null) => {
    return exportQuotationToExcelStyled({
      q: quotationDataFromSave || {},
      printConfig,
      printerHeader,
      docType,
      quotationDate,
      validTill,
      references,
      note,
      tandcSelections,
      extrcharges,
      additiondiscounts,
      tableItems,
      selectedBranch,
      selectedBank,
      selectedEmployeeObj,
      selectedBillingAddress,
      selectedShippingAddress,
      isSameAsBilling,
      isGSTStateMatch,
      qutationNo,
      selectedCustomer,
      gstForAddr,
      getCustomerLegalGstin,
      normalizeQuotationNumber,
    });
  };

const handleSaveQuotation = async () => {
  if (!selectedCustomer) return alert("Select a customer.");
  if (!selectedEmployee) return alert("Select a sales credit.");
  if (!tableItems.length) return alert("Add at least one item.");

  // compute total in same manner as the finalTotal effect so roundoff_amount and grand_total are correct
  const base = Number(grandTotal) || 0; // grandTotal already includes tax from table items
  const percentCharges = extrcharges.reduce((s, ch) => s + (ch.type === 'percent' ? Number(ch.value) : 0), 0);
  const fixedCharges = extrcharges.reduce((s, ch) => s + (ch.type === 'percent' ? 0 : Number(ch.value) || 0), 0);
  const percentDiscounts = additiondiscounts.reduce((s, ds) => s + (ds.type === 'percent' ? Number(ds.value) : 0), 0);
  const fixedDiscounts = additiondiscounts.reduce((s, ds) => s + (ds.type === 'percent' ? 0 : Number(ds.value) || 0), 0);

  let computedTotal = base + (base * (percentCharges / 100)) + fixedCharges - (base * (percentDiscounts / 100)) - fixedDiscounts;

  const totalBeforeRound = computedTotal;
  const roundoffAmount = includeRoundOff ? Number((Math.round(totalBeforeRound) - totalBeforeRound).toFixed(2)) : 0;
  const grandTotalToSend = includeRoundOff ? Number(Math.round(totalBeforeRound)) : Number(Number(totalBeforeRound).toFixed(2));
  const computedTaxAmount = tableItems.reduce((s, it) => s + (Number(it.cgst || 0) + Number(it.sgst || 0) + Number(it.igst || 0)), 0);
  const savingAsRevise = isEditMode && isReviseMode;

  const normalizedQuotationNumber = (() => {
    const currentNumber = isEditMode
      ? (qutationNo || quotationData?.quotation_number || '')
      : (qutationNo && qutationNo.toString().trim() !== '' ? qutationNo : '');

    if (!currentNumber) return null;

    if (isEditMode || selectedSeries) {
      return normalizeQuotationNumber(currentNumber);
    }

    return buildDocumentTypeQuotationNumber(docType, seqNumber || currentNumber);
  })();

  const quoteLifecycleStatus = savingAsRevise ? 'R' : isEditMode ? 'M' : 'C';

  const payload = {
    quotation: {
      series_id: selectedSeries ? Number(selectedSeries) : null,
      company_branch_id: selectedBranch && (selectedBranch.id || selectedBranch.ID) ? Number(selectedBranch.id || selectedBranch.ID) : 0,
      company_id: selectedBranch && (selectedBranch.company_id || selectedBranch.companyID) ? Number(selectedBranch.company_id || selectedBranch.companyID) : 0,
      company_branch_bank_id: selectedBankId ? Number(selectedBankId) : null,
      quotation_number: normalizedQuotationNumber,
      quotation_date: new Date(quotationDate).toISOString(),
      customer_id: Number(selectedCustomer.id),
      sales_credit_person_id: selectedEmployee ? Number(selectedEmployee) : 0,
      quotation_scp_count: isEditMode && !savingAsRevise
        ? Number(currentScpCount?.max_quotation_scp_count || 0)
        : Number(currentScpCount?.max_quotation_scp_count || 0) + 1,
      valid_until: new Date(validTill).toISOString(),
      contact_person: contactPerson,
      total_amount: Number(grandTotal) || 0,
      tax_amount: Number(computedTaxAmount.toFixed(2)) || 0,
      include_roundoff: includeRoundOff,
      roundoff_amount: roundoffAmount,
      grand_total: Number(grandTotalToSend.toFixed(2)) || 0,
      extra_charges: extrcharges,
      discounts: additiondiscounts,
      document_type: docType || null,
      type: docType || null,
      is_proforma: (docType && String(docType).toLowerCase().includes('proforma')) || false,
      status: isEditMode && !savingAsRevise ? (quotationData?.status || "Open") : "Open",
      quote_status: quoteLifecycleStatus,
      created_by: Number(selectedEmployee),
      billing_address_id: selectedBillingAddressId ? Number(selectedBillingAddressId) : 0,
      shipping_address_id: isSameAsBilling ? (selectedBillingAddressId ? Number(selectedBillingAddressId) : 0) : (selectedShippingAddressId ? Number(selectedShippingAddressId) : 0),
      terms_and_conditions: tandcSelections,
      note: note,
      references: references,
      end_customer_name: endcustomer,
      end_dealer_name: enddealer,
    },
    quotation_items: tableItems.map((it) => {
      const pid = Number(it.id);
      const product_id = (Number.isFinite(pid) && pid > 0) ? pid : null;
      return {
        product_id,
        product_code: it.sku || '',
        description: it.desc || it.name || '',
        quantity: Number(it.qty) || 0,
        unit: it.unit || '',
        rate: Number(it.rate) || 0,
        lead_time: String(it.leadTime || ''),
        hsncode: it.hsn || '',
        discount_percentage: Number(it.discountPercent) || 0,
        discount_amount: Number(it.discount) || 0,
        gst: Number(it.gst || 0),
        tax_amount: Number((it.cgst || 0) + (it.sgst || 0) + (it.igst || 0)) || 0,
        line_total: Number(it.amount) || 0,
        is_service: !!it._isService,
      };
    }),
  };

  console.log('Saving quotation with T&C:', payload.quotation.terms_and_conditions);

  try {
    setSaving(true);
    let savedQuotation = null;
    if (!selectedFile) {
      if (isEditMode && id && !savingAsRevise) {
        const res = await axios.put(`${BASE_URL}/api/quotations/${id}`, payload);
        savedQuotation = res.data?.data || res.data;
        alert(`${docType} updated successfully.`);
      } else {
        const res = await axios.post(`${BASE_URL}/api/quotations`, payload);
        savedQuotation = res.data?.quotation || res.data?.data || res.data;
        alert(savingAsRevise ? `Revised ${docType} saved as a new document.` : `${docType} saved successfully.`);
      }
    } else {
      const formData = new FormData();
      formData.append("quotation", JSON.stringify(payload.quotation));
      formData.append("quotation_items", JSON.stringify(payload.quotation_items));
      formData.append("attachment", selectedFile);

      if (isEditMode && id && !savingAsRevise) {
        const res = await axios.put(`${BASE_URL}/api/quotations/${id}`, formData);
        savedQuotation = res.data?.data || res.data;
        alert(`${docType} updated successfully.`);
      } else {
        const res = await axios.post(`${BASE_URL}/api/quotations`, formData);
        savedQuotation = res.data?.quotation || res.data?.data || res.data;
        alert(savingAsRevise ? `Revised ${docType} saved as a new document.` : `${docType} saved successfully.`);
      }
    }

    if (printAfterSave) {
      await generatePDF(savedQuotation);
    }

    if (saveAsTemplate) {
      const tName = templateName || (payload.quotation.quotation_number || `Template_${Date.now()}`);
      const tPayload = {
        template_name: tName,
        quotation: payload.quotation,
        quotation_items: payload.quotation_items
      };
      try {
        await axios.post(`${BASE_URL}/api/quotation-templates`, tPayload);
      } catch (tErr) {
        console.error("Failed to save template via Next Action", tErr);
      }
    }

    navigate("/quotation-list");
  } catch (err) {
    console.error(err?.response?.data || err);
    const fallback = `Failed to ${isEditMode && !savingAsRevise ? 'update' : 'save'} quotation.`;
    alert(getApiErrorMessage(err, fallback));
  } finally {
    setSaving(false);
  }
};

const handleSaveAsTemplate = async () => {
  if (!templateName) return alert("Please enter a template name.");
  if (!selectedCustomer) return alert("Select a customer.");
  if (!tableItems.length) return alert("Add at least one item.");

  const base = Number(grandTotal) || 0;
  const percentCharges = extrcharges.reduce((s, ch) => s + (ch.type === 'percent' ? Number(ch.value) : 0), 0);
  const fixedCharges = extrcharges.reduce((s, ch) => s + (ch.type === 'percent' ? 0 : Number(ch.value) || 0), 0);
  const percentDiscounts = additiondiscounts.reduce((s, ds) => s + (ds.type === 'percent' ? Number(ds.value) : 0), 0);
  const fixedDiscounts = additiondiscounts.reduce((s, ds) => s + (ds.type === 'percent' ? 0 : Number(ds.value) || 0), 0);

  let computedTotal = base + (base * (percentCharges / 100)) + fixedCharges - (base * (percentDiscounts / 100)) - fixedDiscounts;

  const totalBeforeRound = computedTotal;
  const roundoffAmount = includeRoundOff ? Number((Math.round(totalBeforeRound) - totalBeforeRound).toFixed(2)) : 0;
  const grandTotalToSend = includeRoundOff ? Number(Math.round(totalBeforeRound)) : Number(Number(totalBeforeRound).toFixed(2));
  const computedTaxAmount = tableItems.reduce((s, it) => s + (Number(it.cgst || 0) + Number(it.sgst || 0) + Number(it.igst || 0)), 0);

  const payload = {
    template_name: templateName,
    quotation: {
      series_id: selectedSeries ? Number(selectedSeries) : null,
      company_branch_id: selectedBranch && (selectedBranch.id || selectedBranch.ID) ? Number(selectedBranch.id || selectedBranch.ID) : null,
      company_id: selectedBranch && (selectedBranch.company_id || selectedBranch.companyID) ? Number(selectedBranch.company_id || selectedBranch.companyID) : null,
      company_branch_bank_id: selectedBankId,
      quotation_date: new Date(quotationDate).toISOString(),
      customer_id: Number(selectedCustomer.id),
      sales_credit_person_id: selectedEmployee ? Number(selectedEmployee) : null,
      quotation_scp_count: 0, // Placeholder for templates
      valid_until: new Date(validTill).toISOString(),
      contact_person: contactPerson,
      total_amount: Number(grandTotal) || 0,
      tax_amount: Number(computedTaxAmount.toFixed(2)) || 0,
      include_roundoff: includeRoundOff,
      roundoff_amount: roundoffAmount,
      grand_total: Number(grandTotalToSend.toFixed(2)) || 0,
      extra_charges: extrcharges,
      discounts: additiondiscounts,
      document_type: docType || null,
      type: docType || null,
      is_proforma: (docType && String(docType).toLowerCase().includes('proforma')) || false,
      status: "draft",
      created_by: Number(selectedEmployee),
      billing_address_id: selectedBillingAddressId ? Number(selectedBillingAddressId) : null,
      shipping_address_id: isSameAsBilling ? (selectedBillingAddressId ? Number(selectedBillingAddressId) : null) : (selectedShippingAddressId ? Number(selectedShippingAddressId) : null),
      terms_and_conditions: tandcSelections,
      note: note,
      references: references,
      end_customer_name: endcustomer,
      end_dealer_name: enddealer,
    },
    quotation_items: tableItems.map((it) => {
      const pid = Number(it.id);
      const product_id = (Number.isFinite(pid) && pid > 0) ? pid : null;
      return {
        product_id,
        product_code: it.sku || '',
        description: it.desc || it.name || '',
        quantity: Number(it.qty) || 0,
        unit: it.unit || '',
        rate: Number(it.rate) || 0,
        lead_time: String(it.leadTime || ''),
        hsncode: it.hsn || '',
        discount_percentage: Number(it.discountPercent) || 0,
        discount_amount: Number(it.discount) || 0,
        gst: Number(it.gst || 0),
        tax_amount: Number((it.cgst || 0) + (it.sgst || 0) + (it.igst || 0)) || 0,
        line_total: Number(it.amount) || 0,
        is_service: !!it._isService,
      };
    }),
  };

  try {
    setSaving(true);
    await axios.post(`${BASE_URL}/api/quotation-templates`, payload);
    alert("Template saved successfully.");
    setShowTemplateModal(false);
    setTemplateName("");
  } catch (err) {
    console.error(err?.response?.data || err);
    alert(getApiErrorMessage(err, "Failed to save template."));
  } finally {
    setSaving(false);
  }
};


const onSelectTemplate = (template) => {
  if (template && template.qutation_table) {
    prefillFormData(template.qutation_table, false);
    setShowSavedTemplates(false);
  }
};


  const dismissNativeFieldFocus = () => {
    const el = document.activeElement;
    if (el && typeof el.blur === "function" && el !== document.body) {
      el.blur();
    }
  };

  // Handle open/close modal
  const handleOpen = () => {
    dismissNativeFieldFocus();
    setCustomerSearchInputMountKey((k) => k + 1);
    setOpen(true);
  };
  const handleClose = () => setOpen(false);

  // Customer modal filter (contenteditable — not a native <input>, so Edge/Chrome do not offer "Saved info" on it)
  const applyCustomerModalFilter = (value) => {
    const v = value ?? "";
    setSearch(v);
    fetchCustomers(v);
  };

  useLayoutEffect(() => {
    if (!open) return;
    const el = customerSearchEditableRef.current;
    if (!el) return;
    el.textContent = search;
    // Intentionally omit `search`: only sync when the modal opens / remounts, not on each keystroke.
  }, [open, customerSearchInputMountKey]);

  /** Move focus into the modal search so Edge/Chrome "Saved info" is not anchored to the page customer control. */
  useEffect(() => {
    if (!open) return;
    const raf = requestAnimationFrame(() => {
      customerSearchEditableRef.current?.focus({ preventScroll: true });
    });
    return () => cancelAnimationFrame(raf);
  }, [open, customerSearchInputMountKey]);

  // Handle select customer
  const handleSelectCustomer = (cust) => {
    setSelectedCustomer(cust);
    // Auto-fill contact person
    const cp = `${cust.firstname || ""} ${cust.lastname || ""}`.trim();
    setContactPerson(cp);

    // If customer has addresses from API, select the first address by default
    if (cust.addresses && Array.isArray(cust.addresses) && cust.addresses.length > 0) {
      const firstAddrId = cust.addresses[0].id || cust.addresses[0].ID || null;
      setSelectedBillingAddressId(firstAddrId);
      if (isSameAsBilling) setSelectedShippingAddressId(firstAddrId);
    } else {
      setSelectedBillingAddressId(null);
      if (isSameAsBilling) setSelectedShippingAddressId(null);
    }

    handleClose();
  };

  //go to add user

  const addUserNavigate = () => {
    try {
      const url = `${window.location.origin}/users/add`;
      window.open(url, '_blank', 'noopener,noreferrer');
    } catch (err) {
      // fallback to in-app navigation if window.open fails
      navigate("/users/add");
    }
  };

  const openSearch = () => {
    dismissNativeFieldFocus();
    fetchCustomers();
    setCustomerSearchInputMountKey((k) => k + 1);
    setOpen(true);
  };

  // Bank Details Modal Handlers
  const handleOpenBankModal = (bank = null) => {
    if (bank) {
      setBankFormValues({
        bankName: bank.bankName || '',
        accountNo: bank.accountNo || '',
        branch: bank.branch || '',
        ifsc: bank.ifsc || '',
        swiftCode: bank.swiftCode || '',
        title: bank.title || '',
      });
      setEditingBankId(bank.id || null);
    } else {
      setBankFormValues({
        bankName: '',
        accountNo: '',
        branch: '',
        ifsc: '',
        swiftCode: '',
        title: '',
      });
      setEditingBankId(null);
    }
    setOpenBankModal(true);
  };

  const handleCloseBankModal = () => {
    setOpenBankModal(false);
    setBankFormValues({
      bankName: '',
      accountNo: '',
      branch: '',
      ifsc: '',
      swiftCode: '',
    });
    setEditingBankId(null);
  };

  const handleSaveBankDetails = () => {
    if (!bankFormValues.bankName.trim()) {
      alert('Please enter Bank Name');
      return;
    }
    if (!bankFormValues.accountNo.trim()) {
      alert('Please enter Account No.');
      return;
    }

    if (editingBankId) {
      // update existing
      setBankDetails(prev => prev.map(b => b.id === editingBankId ? {
        ...b,
        bankName: bankFormValues.bankName,
        accountNo: bankFormValues.accountNo,
        branch: bankFormValues.branch,
        ifsc: bankFormValues.ifsc,
        swiftCode: bankFormValues.swiftCode,
        title: bankFormValues.title,
      } : b));
      // keep selection if it was the edited bank
      setSelectedBankId(prev => prev === editingBankId ? editingBankId : prev);
    } else {
      const newBank = {
        id: Date.now(),
        bankName: bankFormValues.bankName,
        accountNo: bankFormValues.accountNo,
        branch: bankFormValues.branch,
        ifsc: bankFormValues.ifsc,
        swiftCode: bankFormValues.swiftCode,
        title: bankFormValues.title,
      };
      setBankDetails(prev => [...prev, newBank]);
      setSelectedBankId(newBank.id);
    }
    handleCloseBankModal();
  };

  const buildDocumentTypeQuotationNumber = (documentType, sequenceValue) => {
    const resolvedDocType = (documentType || 'Quotation').toString().trim() || 'Quotation';
    const resolvedSequence = sequenceValue === undefined || sequenceValue === null
      ? ''
      : String(sequenceValue).trim();

    return buildQuotationNumber(resolvedDocType, resolvedSequence);
  };

  const generateSequenceForDocumentType = async (documentType, groupedCounts = null) => {
    if (!canRegenerateDocumentNumber || selectedSeries) return;

    const resolvedDocType = (documentType || 'Quotation').toString().trim();
    if (!resolvedDocType) return;

    try {
      let maxCount;

      if (
        groupedCounts &&
        Object.prototype.hasOwnProperty.call(groupedCounts, resolvedDocType)
      ) {
        maxCount = Number(groupedCounts[resolvedDocType] || 0);
      } else {
        const res = await axios.get(
          `${BASE_URL}/api/quotations/max-scp-count/doc-type/${encodeURIComponent(resolvedDocType)}`
        );
        maxCount = Number(res?.data?.max_quotation_scp_count || 0);
      }

      const nextNumber = maxCount + 1;
      setCurrentScpCount({
        document_type: resolvedDocType,
        max_quotation_scp_count: maxCount,
      });

      if (isEditMode && isReviseMode) {
        return;
      }

      setSeqNumber(String(nextNumber));
      setQutationNo(buildDocumentTypeQuotationNumber(resolvedDocType, nextNumber));
      setPrevQutationNo(maxCount > 0 ? buildDocumentTypeQuotationNumber(resolvedDocType, maxCount) : '');
    } catch (error) {
      console.error('Failed to generate quotation number by document type:', error);
    }
  };

  useEffect(() => {
    if (!canRegenerateDocumentNumber) return;

    const fetchGroupedScpCountsByDocumentType = async () => {
      try {
        const res = await axios.get(`${BASE_URL}/api/quotations/max-scp-count/grouped-by-doc-type`);
        const grouped = (res?.data?.data || []).reduce((acc, item) => {
          const key = (item?.document_type || 'Quotation').toString().trim();
          if (!key) return acc;
          acc[key] = Number(item?.max_quotation_scp_count || 0);
          return acc;
        }, {});
        setDocTypeScpCounts(grouped);
      } catch (error) {
        console.error('Failed to fetch grouped SCP counts by document type:', error);
      }
    };

    fetchGroupedScpCountsByDocumentType();
  }, [canRegenerateDocumentNumber]);

  // generate next sequence and quotation number for a given series id
  const generateSequenceForSeries = async (seriesId) => {
    if (!canRegenerateDocumentNumber) return;

    if (!seriesId) {
      setQutationNo(buildDocumentTypeQuotationNumber(docType, seqNumber || ''));
      setPrevQutationNo('');
      return;
    }

    // Find the selected series object to get its prefix and prefix_number
    const selectedSeriesObj = seriesList.find(s => String(s.id) === String(seriesId));
    const seriesPrefix = selectedSeriesObj?.prefix || 'QTN';
    const seriesPrefixNumber = selectedSeriesObj?.prefix_number || '';

    try {
      // Use seriesId to get max scp count for the selected series
      let maxCount = 0;
      const res = await axios.get(`${BASE_URL}/api/quotations/count-scp/${seriesId}`);
      let result = res.data;
      setCurrentScpCount(result || {});
      maxCount = (result && (result.max_quotation_scp_count || 0)) || 0;

      const currentDate = new Date();
      const currentYear = currentDate.getFullYear();
      const nextYear = currentYear + 1;
      const yrRange = `${String(currentYear).slice(-2)}-${String(nextYear).slice(-2)}`;
      setYearRange(yrRange);

      if (isEditMode && isReviseMode) {
        const existingSequence = `${seqNumber || ''}${revisionLetter || ''}`;
        if (existingSequence) {
          setQutationNo(buildQuotationNumber(seriesPrefix, seriesPrefixNumber, existingSequence, yrRange));
        }
        setPrevQutationNo(maxCount > 0 ? buildQuotationNumber(seriesPrefix, seriesPrefixNumber, maxCount, yrRange) : '');
        return;
      }

      // Generate next number (editable middle part)
      const nextNumber = Number(maxCount) + 1;
      const prevNumber = Number(maxCount);
      setSeqNumber(String(nextNumber));

      // Build full quotation string and previous
      const qtno = buildQuotationNumber(seriesPrefix, seriesPrefixNumber, nextNumber, yrRange);
      setQutationNo(qtno);

      if (prevNumber > 0) {
        const prevQtno = buildQuotationNumber(seriesPrefix, seriesPrefixNumber, prevNumber, yrRange);
        setPrevQutationNo(prevQtno);
      } else {
        setPrevQutationNo('');
      }
    } catch (error) {
      console.error('Failed to generate quotation number:', error);
    }
  };

  const handleOnChangeSeriesSelect = (e) => {
    const seriesId = e.target.value;
    setSelectedSeries(seriesId);
  };

  // whenever selectedSeries changes (programmatic or user selection), compute sequence
  useEffect(() => {
    if (!canRegenerateDocumentNumber) return;

    if (!selectedSeries) {
      generateSequenceForDocumentType(docType, docTypeScpCounts);
      return;
    }

    generateSequenceForSeries(selectedSeries);
  }, [selectedSeries, docType, docTypeScpCounts, canRegenerateDocumentNumber]);

  const handleOnchabgeSalesCredit = async (e) => {
    setSelectedEmployee(e.target.value);
    console.log(e.target.value);
  }


  useEffect(() => {
    // 1. Calculate base components from table items
    const taxable = tableItems.reduce((s, it) => s + (Number(it.taxable) || 0), 0);
    const tax = tableItems.reduce((sum, item) => {
      if (isGSTStateMatch) {
        return sum + (Number(item.cgst) || 0) + (Number(item.sgst) || 0);
      }
      return sum + (Number(item.igst) || 0);
    }, 0);

    const base = taxable + tax;
    
    setTotalTaxable(taxable);
    setTotalTaxAmount(tax);
    setGrandTotal(base);

    // 2. Calculate sum of additional charges
    const extraChargesAmt = extrcharges.reduce((s, ch) => {
      const val = Number(ch.value) || 0;
      return s + (ch.type === 'percent' ? (base * val / 100) : val);
    }, 0);

    // 3. Calculate sum of additional discounts
    const additionalDiscountsAmt = additiondiscounts.reduce((s, ds) => {
      const val = Number(ds.value) || 0;
      return s + (ds.type === 'percent' ? (base * val / 100) : val);
    }, 0);

    // 4. Calculate Final Grand Total
    let total = base + extraChargesAmt - additionalDiscountsAmt;

    if (includeRoundOff) {
      setFinalTotal(Math.round(total));
    } else {
      setFinalTotal(Number(total.toFixed(2)));
    }
  }, [tableItems, isGSTStateMatch, extrcharges, additiondiscounts, includeRoundOff]);


// edit mode


  useEffect(() => {
    const isValidId = /^\d+$/.test(String(id || ""));
    // detect revise param (e.g. ?revise=1)
    let reviseModeFromQuery = false;
    try {
      const params = new URLSearchParams(location.search || "");
      const revise = params.get('revise');
      reviseModeFromQuery = Boolean(revise && String(revise) !== '0' && String(revise).toLowerCase() !== 'false');
      setIsReviseMode(reviseModeFromQuery);
    } catch (err) {
      reviseModeFromQuery = false;
      setIsReviseMode(false);
    }

    if (isValidId) {
      setIsEditMode(true);
      fetchQuotationData(reviseModeFromQuery);
    } else if (id) {
      console.warn("Invalid quotation id param:", id);
      alert("Invalid quotation ID in URL. Returning to list.");
      navigate('/quotation-list');
    }
  }, [id, location.search]);

  // If ?copy_from=<quotation_id> is present, fetch that quotation and prefill the form (create mode)
  useEffect(() => {
    try {
      const params = new URLSearchParams(location.search || "");
      const copyFrom = params.get('copy_from');
      if (copyFrom && !/\d+/.test(String(id || ""))) {
        // only treat as a copy when we're NOT in edit mode (no path id)
        (async () => {
          try {
            const resp = await axios.get(`${BASE_URL}/api/quotations/${copyFrom}`);
            const data = resp.data;
            if (data) {
              // prefill but keep it as a new document (don't change docType, keep current form's type)
              await prefillFormData(data, false);
              setIsEditMode(false);
              setIsReviseMode(false);
              // ensure sequence/number fields are cleared so a new number is generated
              setQutationNo('');
              setPrevQutationNo('');
              setSeqNumber('');
            }
          } catch (err) {
            console.error("Failed to fetch quotation for copy:", err);
            // Don't block the user; show a warning
            alert('Could not load the quotation to copy.');
          }
        })();
      }
    } catch (err) {
      // ignore
    }

    // If ?lead_id=<lead_id> is present, fetch the lead and prefill customer, contact and product fields
    try {
      const params = new URLSearchParams(location.search || "");
      const leadId = params.get('lead_id') || params.get('from_lead');
      if (leadId && !isEditMode) {
        (async () => {
          try {
            const resp = await axios.get(`${BASE_URL}/api/leads/${leadId}`);
            const lead = resp.data;
            if (lead) {
              // Do not prefill addresses from lead — users requested addresses NOT to be prefilled
              setContactPerson(lead.contact || `${lead.firstName || ''} ${lead.lastName || ''}`.trim() || '');
              setNote(lead.requirement || lead.requirements || lead.notes || '');

              // Try to match an existing customer (by email / mobile / company) so saving the form will work
              let foundUser = null;
              try {
                const q = lead.email || lead.mobile || lead.business || lead.contact || '';
                if (q) {
                  const uResp = await axios.get(`${BASE_URL}/api/users?page=1&limit=10&filter=${encodeURIComponent(q)}`);
                  const users = (uResp.data && (uResp.data.data || uResp.data)) || [];
                  if (Array.isArray(users) && users.length > 0) {
                    // prefer exact matches on email/mobile
                    foundUser = users.find(u => (lead.email && ((u.email || '').toString().toLowerCase() === (lead.email || '').toString().toLowerCase())) || (lead.mobile && ((u.mobile || '').toString() === (lead.mobile || '').toString())) );
                    if (!foundUser) foundUser = users[0];
                  }
                }
              } catch (e) {
                console.error('Customer lookup failed for lead prefill', e);
              }

              // If no existing user found, try to create a minimal customer record so the quotation can be saved
              if (!foundUser) {
                try {
                  const createPayload = {
                    business: lead.business || lead.businessName || '',
                    firstname: lead.firstName || lead.first_name || lead.contact || '',
                    lastname: lead.lastName || lead.last_name || '',
                    email: lead.email || '',
                    mobile: lead.mobile || '',
                    user_type: 'customer'
                  };
                  const cResp = await axios.post(`${BASE_URL}/api/users`, createPayload);
                  foundUser = cResp.data;
                } catch (e) {
                  // If create failed, fall back to a display-only prefill (no id) and notify in console
                  console.error('Failed to create customer from lead', e);
                }
              }

              if (foundUser) {
                setSelectedCustomer(foundUser);
                // ensure customers list includes the created/found user
                try { setCustomers(prev => { const cur = Array.isArray(prev) ? prev.slice() : []; if (!cur.find(c => String(c.id || c.ID) === String(foundUser.id || foundUser.ID))) cur.unshift(foundUser); return cur; }); } catch(e){}
              } else {
                // keep selectedCustomer minimal (no id) so user can choose/create a real customer manually
                setSelectedCustomer({ company_name: lead.business || '', firstname: lead.firstName || '', lastname: lead.lastName || '' });
              }

              // Prefill product if provided — but avoid adding the same product twice
              const productHint = params.get('lead_product') || lead.productName || lead.product || '';
              if (productHint) {
                try {
                  const pResp = await axios.get(`${BASE_URL}/api/products`, { params: { search: productHint, page: 1, limit: 10 } });
                  const prods = (pResp.data && (pResp.data.data || pResp.data)) || [];
                  // find the best match
                  let match = null;
                  if (prods.length === 1) match = prods[0];
                  else match = prods.find(p => (p.Name || p.name || '').toLowerCase().includes(String(productHint).toLowerCase()));
                  if (match) {
                    // prevent duplicate add (check id or sku/code)
                    const exists = (tableItems || []).some(it => {
                      const sameId = (it.id || it.ID) && (match.id || match.ID) && String(it.id || it.ID) === String(match.id || match.ID);
                      const sameSku = (it.sku || it.Code || it.code || '').toString().trim() !== '' && ((match.Sku || match.SKU || match.Code || match.code || '') && String(it.sku || it.Code || it.code).toString().trim() === String(match.Sku || match.SKU || match.Code || match.code).toString().trim());
                      return sameId || sameSku;
                    });
                    if (!exists) {
                      handleSelectProduct(match, true);
                    }
                  }
                } catch (err) {
                  console.error('Failed to lookup product for lead prefill', err);
                }
              }
            }
          } catch (err) {
            console.error('Failed to load lead for prefill:', err);
          }
        })();
      }
    } catch (err) {
      // ignore
    }
  }, [location.search]);

  // Set branch when branches are loaded and we have quotation data with branch_id
  useEffect(() => {

    if(isEditMode){
    //   console.log(quotationData);
    //   if(quotationData?.company_branch){ 
    //     console.log(" insiude if ISEditable fired");
    //       setSelectedBranch(quotationData?.company_branch); 
    //   } 
      
      
    //   console.log("ISEditable fired");

    //   if(quotationData?.billing_address){
    //     setSelectedBillingAddressId(quotationData?.billing_address.id);
    //   }


    }
    // if (isEditMode && quotationData?.branch_id && branches.length > 0 && !selectedBranch) {
    //   const foundBranch = branches.find(b => b.id == quotationData.branch_id);
    //   if (foundBranch) {
    //     console.log("branch hasid")
    //     setSelectedBranch(foundBranch);
    //   }
    // }
    
  }, [branches, quotationData, isEditMode, selectedBranch]);


  

  // Prefill selected bank when in edit mode and bank details have been loaded
  useEffect(() => {
    if (!isEditMode || !quotationData) return;
    // try common keys for bank id
    const possibleBankId = quotationData.company_branch_bank_id || quotationData.company_bank_id || quotationData.bank_id || quotationData.bank?.id || quotationData.bank?.ID;
    if (possibleBankId && bankDetails.length > 0 && !selectedBankId) {
      const found = bankDetails.find(b => String(b.id) === String(possibleBankId) || String(b.id) === String(quotationData.bank_id));
      if (found) {
        setSelectedBankId(found.id);
        return;
      }
    }

    // fallback: match by account number if bank object available
    if (quotationData.bank && bankDetails.length > 0 && !selectedBankId) {
      const acct = quotationData.bank.accountNo || quotationData.bank.account_number || quotationData.bank.account;
      if (acct) {
        const foundByAcct = bankDetails.find(b => String(b.accountNo) === String(acct));
        if (foundByAcct) setSelectedBankId(foundByAcct.id);
      }
    }
  }, [bankDetails, quotationData, isEditMode, selectedBankId]);

  // Keep shipping address in sync when "Same as Billing" checkbox is toggled
  useEffect(() => {
    if (isSameAsBilling) {
      setSelectedShippingAddressId(selectedBillingAddressId);
    }
  }, [isSameAsBilling, selectedBillingAddressId]);

  // Sync selectedBillingAddress object when its ID or customer changes
  useEffect(() => {
    if (selectedCustomer && selectedBillingAddressId) {
      const addr = (selectedCustomer.addresses || []).find(a => (a.id || a.ID) == selectedBillingAddressId);
      setSelectedBillingAddress(normalizeAddress(addr) || null);
    } else {
      setSelectedBillingAddress(null);
    }
  }, [selectedBillingAddressId, selectedCustomer]);

  // Sync selectedShippingAddress object when its ID or customer changes
  useEffect(() => {
    if (selectedCustomer && selectedShippingAddressId) {
      const addr = (selectedCustomer.addresses || []).find(a => (a.id || a.ID) == selectedShippingAddressId);
      setSelectedShippingAddress(normalizeAddress(addr) || null);
    } else {
      setSelectedShippingAddress(null);
    }
  }, [selectedShippingAddressId, selectedCustomer]);

  // GST state comparing: update match when billing address or branch changes
  useEffect(()=>{
    if (selectedBillingAddress && selectedBranch) {
      const sellerGST = selectedBranch?.gst_number || selectedBranch?.gst || selectedBranch?.GST || selectedBranch?.gstin || '';
      const custGst = gstForAddr(selectedBillingAddress);

      if (custGst && custGst.toString().trim().length >= 2 && sellerGST && sellerGST.toString().trim().length >= 2) {
        const match = doGSTsMatchState(custGst, sellerGST);
        setIsGSTStateMatch(match);
      } else {
        // fallback to state matching if GSTINs are not fully available
        const sState = (selectedBranch?.state || '').toString().toLowerCase().trim();
        const bState = (selectedBillingAddress?.state || '').toString().toLowerCase().trim();
        if (sState && bState) {
          setIsGSTStateMatch(sState === bState);
        } else {
          // default to true (Intra-state)
          setIsGSTStateMatch(true);
        }
      }
      setBranchGstNumber(sellerGST);
      setCustAddressGst(custGst);
    }
  }, [selectedBillingAddress, selectedBranch]);


const fetchQuotationData = async (reviseMode = false) => {
    try {
      const response = await axios.get(`${BASE_URL}/api/quotations/${id}`);
      const data = response.data;
      setQuotationData(data);
      
      // Pre-fill all the form data
      console.log('Fetched quotation data:', data);
      prefillFormData(data, true, reviseMode);
    } catch (error) {
      console.error("Error fetching quotation data:", error);
      if (error.response?.status === 404) {
        alert(`Quotation with ID ${id} not found. It may have been deleted or doesn't exist.`);
        navigate('/quotation-list');
      } else {
        alert("Failed to load quotation data. Please check your connection and try again.");
      }
    }
  };




const  prefillFormData = async (data, shouldUpdateDocType = true, reviseMode = isReviseMode) => {
  console.log('Prefilling form with data:', data);
  // Ensure docType is set from saved data so UI matches saved document type (only in edit mode)
  if (shouldUpdateDocType) {
    const incomingDocType = data.document_type || data.type || (data.is_proforma ? 'Proforma Invoice' : 'Quotation');
    setDocType(incomingDocType);
  }
  
  // Pre-fill customer
  if (data.customer) {
     const customerId = data.customer.id || data.customer.ID;
     setSelectedCustomer(data.customer);
     if (customerId) {
        const response = await axios.get(`${BASE_URL}/api/users/${customerId}`);
        console.log("this is customer", response.data);
        handleSelectCustomer(response.data.user);
     }
  }

  if(data.contact_person){
    setContactPerson(data.contact_person);
  }






//  Pre-fill branch - use the preloaded branch object
  if (data.company_branch && (data.company_branch.ID || data.company_branch.id)) {
    const normalizedBranch = {
      id: data.company_branch.ID || data.company_branch.id,
      name: data.company_branch.Name || data.company_branch.name || '',
      state: data.company_branch.State || data.company_branch.state || '',
      gst_number: data.company_branch.GSTNumber || data.company_branch.gst_number || data.company_branch.GST || data.company_branch.gst || ''
    };
    console.log('Setting branch:', normalizedBranch);
    setSelectedBranch(normalizedBranch);
  } else if (data.branch_id) {
    // Fallback: if only branch_id is available, find from loaded branches
    const foundBranch = branches.find(b => (b.id || b.ID) == data.branch_id);
    if (foundBranch) {
      setSelectedBranch(foundBranch);
    }
  }

  // Pre-fill bank details
  const possibleBankId = data.company_branch_bank_id || data.company_bank_id || data.bank_id || data.bank?.id || data.bank?.ID;
  if (possibleBankId) {
    setSelectedBankId(possibleBankId.toString());
  }



  // Pre-fill series
  const seriesId = data.series_id || data.SeriesID || data.seriesID;
  if (seriesId) {
    setSelectedSeries(seriesId.toString());
    if (data.quotation_number && data.series) {
      const split = splitQuotationNumber(data.quotation_number, data.series.prefix, data.series.postfix);
      setSeqNumber(String(split.number));
    }
  }

  // Pre-fill billing address - use the preloaded billing address object
  if (data.billing_address && (data.billing_address.id || data.billing_address.ID)) {
    const billingAddrId = data.billing_address.id || data.billing_address.ID;
    console.log('Setting billing address:', data.billing_address, 'ID:', billingAddrId);
    setSelectedBillingAddressId(billingAddrId);
    setSelectedBillingAddress(normalizeAddress(data.billing_address));
  } else if (data.billing_address_id) {
    // Fallback: if only billing_address_id is available, find from customer addresses
    setSelectedBillingAddressId(data.billing_address_id);
    if (data.customer?.addresses) {
      const addr = data.customer.addresses.find(a => (a.id || a.ID) == data.billing_address_id);
      if (addr) setSelectedBillingAddress(normalizeAddress(addr));
    }
  }

  // Pre-fill shipping address - use the preloaded shipping address object
  if (data.shipping_address && (data.shipping_address.id || data.shipping_address.ID)) {
    const shippingAddrId = data.shipping_address.id || data.shipping_address.ID;
    const billingAddrId = data.billing_address?.id || data.billing_address?.ID;
    console.log('Setting shipping address:', data.shipping_address, 'ID:', shippingAddrId);
    setSelectedShippingAddressId(shippingAddrId);
    setSelectedShippingAddress(normalizeAddress(data.shipping_address));
    setIsSameAsBilling(shippingAddrId === billingAddrId);
  } else if (data.shipping_address_id) {
    // Fallback: if only shipping_address_id is available, find from customer addresses
    setSelectedShippingAddressId(data.shipping_address_id);
    if (data.customer?.addresses) {
      const addr = data.customer.addresses.find(a => (a.id || a.ID) == data.shipping_address_id);
      if (addr) setSelectedShippingAddress(normalizeAddress(addr));
    }
    setIsSameAsBilling(data.shipping_address_id === data.billing_address_id);
  } else {
    setIsSameAsBilling(true);
  }

  // Pre-fill employee/sales credit
  const employeeId = data.sales_credit_person_id || data.SalesCreditPersonID || data.employee_id;
  if (employeeId) {
    setSelectedEmployee(employeeId.toString());
  }

  // Pre-fill dates
  if (data.quotation_date) {
    setQuotationDate(data.quotation_date.split('T')[0]);
  }
  if (data.valid_until) {
    setValidTill(data.valid_until.split('T')[0]);
  }

  // Pre-fill quotation number
  if (data.quotation_number) {
    setQutationNo(normalizeQuotationNumber(data.quotation_number));

    if (!(data.series_id || data.SeriesID || data.seriesID)) {
      const parts = normalizeQuotationNumber(data.quotation_number).split('/').filter(Boolean);
      if (parts.length > 0) {
        setSeqNumber(String(parts[parts.length - 1] || ''));
      }
    }
  }

  // If we have a quotation_number and series, try to parse seq and year for display
  if (data.quotation_number && data.series_id) {
    try {
      const parts = normalizeQuotationNumber(data.quotation_number).split('/').filter(Boolean);
      if (parts.length >= 2) {
        const seq = parts[parts.length - 2] || '';
        const yr = parts[parts.length - 1] || '';
        
        // Extract revision letter from sequence if it exists (e.g., "1A" -> seq="1", revLetter="A")
        const seqMatch = seq.match(/^(\d+)([a-zA-Z]?)$/);
        if (seqMatch) {
          const numericSeq = seqMatch[1];
          const revLetter = seqMatch[2] || '';
          setSeqNumber(String(numericSeq));
          setRevisionLetter(revLetter);
          
          if (yr) setYearRange(yr);
          
          // Calculate previous for display
          const seqNum = parseInt(numericSeq, 10);
          if (!isNaN(seqNum) && seqNum > 0) {
            const prev = seqNum - 1;
            const s = seriesList.find(x => String(x.id) === String(data.series_id));
            const p = s?.prefix || parts[0] || '';
            const fallbackPrefixNumber = parts.length > 3 ? parts.slice(1, -2).join('/') : '';
            const pn = s?.prefix_number || fallbackPrefixNumber;
            setPrevQutationNo(buildQuotationNumber(p, pn, prev, yr));
          }
        } else {
          setSeqNumber(String(seq));
          setRevisionLetter('');
          if (yr) setYearRange(yr);
        }
      }
    } catch (e) {
      console.warn('Failed to parse quotation_number for seq/year:', e);
    }
  }

  if(data.note){
    setNote(data.note);
  }

  if (reviseMode) {
    const originalDocNumber = normalizeQuotationNumber(data.references || data.quotation_number || '');
    setReferences(originalDocNumber);

    const originalParts = originalDocNumber.split('/').filter(Boolean);
    if (originalParts.length >= 2) {
      const originalSequence = originalParts[originalParts.length - 2] || '';
      const originalYearRange = originalParts[originalParts.length - 1] || '';
      const prefixParts = originalParts.slice(0, -2);

      const { numberPart, letterPart } = parseSequenceParts(originalSequence);
      const nextRevisionLetter = getNextRevisionLetter(letterPart);
      const revisedSequence = `${numberPart}${nextRevisionLetter}`;

      setSeqNumber(numberPart);
      setRevisionLetter(nextRevisionLetter);
      if (originalYearRange) setYearRange(originalYearRange);

      if (prefixParts.length > 0 && revisedSequence) {
        setQutationNo(buildQuotationNumber(...prefixParts, revisedSequence, originalYearRange));
      }
    }
  } else if (data.references) {
    setReferences(data.references);
  }

  if(data.end_customer_name){
    setEndCustomer(data.end_customer_name);
  }

  if(data.end_dealer_name){
    setEndDealer(data.end_dealer_name);
  }

  // Pre-fill uploaded document/attachment
  if (data.attachment_path) {
    console.log('Attachment path:', data.attachment_path);
    setAttachmentPath(data.attachment_path);
  }

  // Pre-fill round off flag: read from explicit include_roundoff field
  if (data.include_roundoff !== undefined && data.include_roundoff !== null) {
    setIncludeRoundOff(Boolean(data.include_roundoff));
  } else if (data.includeRoundOff !== undefined && data.includeRoundOff !== null) {
    setIncludeRoundOff(Boolean(data.includeRoundOff));
  } else if (data.roundoff_amount !== undefined && data.roundoff_amount !== null) {
    // Fallback for old quotations without the explicit flag
    try {
      const rn = Number(data.roundoff_amount) || 0;
      setIncludeRoundOff(Boolean(rn !== 0));
    } catch (e) {
      // ignore
    }
  }

  // Pre-fill table items with ALL fields from QuotationTableItems
  if (data.quotation_items && data.quotation_items.length > 0) {
    const items = data.quotation_items.map(item => {
      // Debug: Log what product data we're receiving
      console.log('Prefill item:', {
        item_id: item.id,
        product_id: item.product_id,
        has_product: !!item.product,
        product_variants: item.product?.Variants?.length || 0,
        product_image: item.product?.image || item.product?.Image,
        first_variant: item.product?.Variants?.[0],
      });

      // Extract product image from various possible sources
      let productImage = null;
      
      // Use helper to pick a normalized product image (handles variants too)
      if (item.product) {
        productImage = getProductImage(item.product);
      }

      // If helper didn't find a URL but variant has an image object/string, try that (normalizeImageUrl will handle objects)
      if (!productImage && item.product?.Variants && item.product.Variants.length > 0) {
        const variant = item.product.Variants[0];
        if (variant?.Images && variant.Images.length > 0) {
          productImage = variant.Images[0];
        }
      }

      // Calculate discount: taxable amount = rate * qty - discount
      // We have: line_total = taxable + tax_amount
      // So: taxable = line_total - tax_amount
      // And: discount = (rate * qty) - taxable
        const qty = item.quantity || 0;
      const rate = item.rate || 0;
      const lineTotal = item.line_total || item.amount || 0;
      const taxAmount = item.tax_amount || item.tax || 0;
      const taxable = lineTotal - taxAmount;
      const discount = (rate * qty) - taxable;

      // Robust product image extraction from multiple possible locations
      let resolvedImage = productImage || item.image || item.product_image || item.product_image_url || item.image_url || item.product?.image || item.product?.Image || null;
      if (!resolvedImage && item.product?.Images && item.product.Images.length) resolvedImage = item.product.Images[0];
      if (!resolvedImage && item.product?.Variants && item.product.Variants.length && item.product.Variants[0].Images && item.product.Variants[0].Images.length) resolvedImage = item.product.Variants[0].Images[0];
      if (!resolvedImage && item.variant && (item.variant.Images || item.variant.Image)) resolvedImage = (item.variant.Images && item.variant.Images[0]) || item.variant.Image || null;

      // Variant id could be present on item or nested inside product/variant
      const resolvedVariantId = item.variant_id || item.variant?.id || item.product?.Variants?.[0]?.ID || null;

      // Determine GST percent: direct fields or derived from taxAmount/taxable
      let gstPercent = 0;
      if (item.gst_percent || item.gst) gstPercent = Number(item.gst_percent ?? item.gst);
      else if (item.tax_percentage) gstPercent = Number(item.tax_percentage);
      else if (item.Tax && item.Tax.Percentage) gstPercent = Number(item.Tax.Percentage);
      else if (item.product && item.product.Tax && item.product.Tax.Percentage) gstPercent = Number(item.product.Tax.Percentage);
      else if (taxable && taxAmount) gstPercent = Number(((taxAmount / taxable) * 100).toFixed(2));

      const savedCgst = Number(item.cgst ?? item.cgst_amount ?? 0);
      const savedSgst = Number(item.sgst ?? item.sgst_amount ?? 0);
      const savedIgst = Number(item.igst ?? item.igst_amount ?? 0);
      const computedTaxTotal = Number((taxAmount || ((taxable * (gstPercent || 0)) / 100)).toFixed(2));

      let cgstAmt = 0;
      let sgstAmt = 0;
      let igstAmt = 0;

      if (savedCgst > 0 || savedSgst > 0 || savedIgst > 0) {
        cgstAmt = Number(savedCgst.toFixed(2));
        sgstAmt = Number(savedSgst.toFixed(2));
        igstAmt = Number(savedIgst.toFixed(2));
      } else if (isGSTStateMatch) {
        cgstAmt = Number((computedTaxTotal / 2).toFixed(2));
        sgstAmt = Number((computedTaxTotal / 2).toFixed(2));
      } else {
        igstAmt = Number(computedTaxTotal.toFixed(2));
      }

      // Normalize image into a URL string when possible (handles object shapes)
      let normalizedImage = null;
      if (typeof resolvedImage === 'string') {
        normalizedImage = normalizeImageUrl(resolvedImage) || resolvedImage;
      } else if (resolvedImage && typeof resolvedImage === 'object') {
        const candidate = resolvedImage.url || resolvedImage.path || resolvedImage.src || resolvedImage.thumbnail || resolvedImage.image;
        normalizedImage = candidate ? (normalizeImageUrl(candidate) || candidate) : null;
      }

      // Determine fixedRate (use stored fixed rate if present, otherwise prefer purchase cost for Purchase Orders or sales price for others)
      const resolvedFixedRate = Number(item.fixed_rate ?? item.fixedRate ?? item.fixed_price ?? item.fixedPrice ?? item.rate ?? (docType === 'Purchase Order' ? (item.product?.Variants?.[0]?.PurchaseCost ?? item.product?.PurchaseCost ?? 0) : (item.product?.Variants?.[0]?.StdSalesPrice ?? item.product?.StdSalesPrice ?? 0)) );

      // Derive discount percent if not directly stored
      const baseLine = Number((rate * qty) || 0);
      const computedDiscount = discount > 0 ? discount : 0;
      const computedDiscountPercent = baseLine > 0 ? Number(Math.max(0, Math.min(100, ((computedDiscount / baseLine) * 100))).toFixed(4)) : 0;

      return {
        _rowId: `${Date.now()}-${Math.random().toString(36).slice(2,8)}`,
        id: item.product_id || item.product?.ID || item.product?.id || null,
        name: item.description || item.product?.Name || item.product?.name || '',
        image: normalizedImage,
        hsn: item.hsncode || item.hsn || item.hsn_code || item.product?.HsnSacCode || item.product?.hsn_sac_code || '',
        unit: item.unit || item.product?.Unit?.name || item.product?.unit?.name || '',
        variantId: resolvedVariantId,
        qty: item.quantity || 0,
        rate: Number(item.rate ?? (docType === 'Purchase Order' ? (item.product?.Variants?.[0]?.PurchaseCost ?? item.product?.PurchaseCost ?? 0) : (item.product?.Variants?.[0]?.StdSalesPrice ?? item.product?.StdSalesPrice ?? 0))),
        fixedRate: resolvedFixedRate,
        gst: gstPercent || 0,
        discount: computedDiscount,
        discountPercent: Number(item.discount_percent ?? item.discountPercent ?? computedDiscountPercent) || 0,
        taxable: Number((taxable || 0).toFixed(2)),
        cgst: cgstAmt,
        sgst: sgstAmt,
        igst: igstAmt,
        amount: lineTotal || 0,
        desc: item.description || item.product?.Name || item.product?.name || '',
        leadTime: item.lead_time || item.product?.LeadTime || item.product?.lead_time || '',
        // keep both `sku` and `code`/`Code` normalized for downstream UI and payloads
        sku: item.product_code || item.product?.Sku || item.product?.SKU || item.product?.Code || item.product?.code || '',
        code: item.product_code || item.product?.Code || item.product?.code || item.product?.Sku || item.product?.SKU || '',
        Code: item.product_code || item.product?.Code || item.product?.code || item.product?.Sku || item.product?.SKU || '',
      };
    });
    setTableItems(items);
  }

  // Pre-fill terms and conditions
  if (data.terms_and_conditions) {
    console.log('Prefilling T&C:', data.terms_and_conditions);
    if (Array.isArray(data.terms_and_conditions)) {
      // normalize: convert primitive IDs to objects { ID: value }
      const normalized = data.terms_and_conditions.map(v => (v && typeof v === 'object') ? v : { ID: v });
      setTandcSelections(normalized);
    } else if (typeof data.terms_and_conditions === 'string') {
      try {
        const parsed = JSON.parse(data.terms_and_conditions);
        if (Array.isArray(parsed)) {
          const normalized = parsed.map(v => (v && typeof v === 'object') ? v : { ID: v });
          setTandcSelections(normalized);
        }
      } catch (e) {
        // If it's a plain string, wrap it in an array of objects
        setTandcSelections([{ ID: data.terms_and_conditions }]);
      }
    }
  } else {
    console.log('No T&C data found in quotation');
  }

  // Pre-fill charges and discounts
  if (data.extra_charges || data.ExtraCharges) {
    const charges = data.extra_charges || data.ExtraCharges;
    if (Array.isArray(charges)) {
      setExtraCharges(charges.map(c => ({
        title: c.title || c.name || '',
        type: (c.type || c.Type || (String(c.value||'').includes('%') ? 'percent' : 'item')).toString().toLowerCase() === 'percent' ? 'percent' : 'item',
        value: sanitizeNumericValue(c.value ?? c.Value ?? '')
      })));
    } else if (typeof charges === 'string') {
      try {
        const parsed = JSON.parse(charges);
        if (Array.isArray(parsed)) {
          setExtraCharges(parsed.map(c => ({
            title: c.title || c.name || '',
            type: (c.type || c.Type || (String(c.value||'').includes('%') ? 'percent' : 'item')).toString().toLowerCase() === 'percent' ? 'percent' : 'item',
            value: sanitizeNumericValue(c.value ?? c.Value ?? '')
          })));
        }
      } catch (e) {
        console.error('Failed to parse extra charges:', e);
      }
    }
  }

  if (data.discounts || data.Discounts) {
    const discounts = data.discounts || data.Discounts;
    if (Array.isArray(discounts)) {
      setAdditiondiscounts(discounts.map(d => ({
        title: d.title || d.name || '',
        type: (d.type || d.Type || (String(d.value||'').includes('%') ? 'percent' : 'item')).toString().toLowerCase() === 'percent' ? 'percent' : 'item',
        value: sanitizeNumericValue(d.value ?? d.Value ?? '')
      })));
    } else if (typeof discounts === 'string') {
      try {
        const parsed = JSON.parse(discounts);
        if (Array.isArray(parsed)) {
          setAdditiondiscounts(parsed.map(d => ({
            title: d.title || d.name || '',
            type: (d.type || d.Type || (String(d.value||'').includes('%') ? 'percent' : 'item')).toString().toLowerCase() === 'percent' ? 'percent' : 'item',
            value: sanitizeNumericValue(d.value ?? d.Value ?? '')
          })));
        }
      } catch (e) {
        console.error('Failed to parse discounts:', e);
      }
    }
  }

  // Pre-fill totals
  if (data.total_amount) {
    setGrandTotal(parseFloat(data.total_amount));
  }
  if (data.grand_total) {
    setFinalTotal(parseFloat(data.grand_total));
  }

  // Pre-fill SCP count
  if (data.quotation_scp_count) {
    setCurrentScpCount({
      max_quotation_scp_count: data.quotation_scp_count - 1
    });
  }
};




  const titleBase = (docType === 'All' || docType === 'All Type' || !docType) ? 'Quotation' : docType;
  const isRestrictedEditMode = isEditMode && !isReviseMode;
  const formTitle = isEditMode ? (isReviseMode ? `Revise ${titleBase}` : `Edit ${titleBase}`) : `Create ${titleBase}`;
  const actionDocLabel = titleBase;
  const primaryActionLabel = isEditMode ? `Update ${actionDocLabel}` : `Save ${actionDocLabel}`;
  const primaryActionBusyLabel = isEditMode ? `Updating ${actionDocLabel}...` : `Saving ${actionDocLabel}...`;

  const handleDocTypeChange = (value) => {
    setDocType(value);
    try {
      const params = new URLSearchParams(location.search);
      if (value && value !== 'Quotation') params.set('type', value);
      else params.delete('type');
      const qs = params.toString();
      navigate(`${location.pathname}${qs ? `?${qs}` : ''}`, { replace: true });
    } catch (e) {
      // ignore
    }
  };

  // derive a small list of document types (static + any discovered from series)
  const docTypes = useMemo(() => {
    const base = ['Quotation', 'Proforma Invoice', 'Sales Order', 'Transfer Order', 'Purchase Order'];
    try {
      const s = new Set(base);
      (seriesList || []).forEach(sr => {
        if (sr && sr.document_type) s.add(sr.document_type);
      });
      return Array.from(s);
    } catch (e) {
      return base;
    }
  }, [seriesList]);

  // derive filtered series list based on document type and selected branch
  const filteredSeries = useMemo(() => {
    const t = (docType || '').toString().trim();
    const tLow = t.toLowerCase();
    const branchId = selectedBranch && (selectedBranch.id || selectedBranch);

    return (seriesList || []).filter(s => {
      const dt = (s.document_type || '').toString().toLowerCase();
      // match document type: allow series with empty document_type (global) or matching type
      let typeMatch = false;
      if (!t || tLow === 'all' || tLow === 'all type') {
        typeMatch = true;
      } else if (tLow === 'proforma') {
        typeMatch = dt.includes('proforma') || dt === 'proforma invoice';
      } else {
        typeMatch = dt === tLow || dt === '';
      }

      if (!typeMatch) return false;

      // match branch: if branch is selected then series must be global (no branch restrictions)
      // or include the selected branch id. If no branch selected, accept all.
      if (!branchId) return true;
      const ids = Array.isArray(s.company_branch_ids) ? s.company_branch_ids.map(String) : [];
      if (ids.length === 0) return true; // global series
      return ids.includes(String(branchId));
    });
  }, [seriesList, docType, selectedBranch]);

  // auto-select series when single match and not in edit mode
  useEffect(() => {
    if (!canRegenerateDocumentNumber) return; // keep existing selection in restricted edit mode
    try {
      if ((!selectedSeries || selectedSeries === '') && filteredSeries && filteredSeries.length === 1) {
        setSelectedSeries(String(filteredSeries[0].id));
      }
      // if current selectedSeries no longer exists in filtered list, reset it
      if (selectedSeries && filteredSeries && !filteredSeries.find(s => String(s.id) === String(selectedSeries))) {
        setSelectedSeries('');
      }
    } catch (e) {
      console.warn('Failed to auto-select series', e);
    }
  }, [filteredSeries, canRegenerateDocumentNumber]);

  return (
    <section className="right-content create-quotation">
      <div className="top-bar">
        <div className="title">{formTitle}</div>
        <div className="actions">
          <select
            className="form-control doc-type-select select-width-160"
            value={docType}
            onChange={(e) => handleDocTypeChange(e.target.value)}
            aria-label="Document type"
            disabled={isRestrictedEditMode}
            title={isRestrictedEditMode ? 'Document type cannot be changed in edit mode' : 'Document type'}
          >
            {docTypes.map(dt => (
              <option key={dt} value={dt}>{dt}</option>
            ))}
          </select>

          <button
            type="button"
            className="btn btn--excel"
            onClick={() => exportQuotationToExcel()}
            title="Download current document as Excel (respects Print Settings)"
          >
            <span><FaFileExcel /></span>
            Export Excel
          </button>
          <button className="btn btn--print" onClick={handleOpenPrintConfig}>
            <span><IoMdPrint /></span>
            Print Settings
          </button>
          {/* <button className="btn btn--back" onClick={() => navigate(-1)}>
            <span><FaLongArrowAltLeft /></span>
            Back
          </button> */}
          <button className="btn btn--save" onClick={() => handleSaveQuotation()} disabled={saving}>
            {isEditMode ? <><MdEdit /> {saving ? primaryActionBusyLabel : primaryActionLabel}</> : <><FaCheck /> {saving ? primaryActionBusyLabel : primaryActionLabel}</>}
          </button>
        </div>
      </div>
      <div className={`section-card basic-info-card ${isRestrictedEditMode ? 'edit-disabled' : ''}`}>
        <h6 className="section-title">Basic Information</h6>
        <div className="form-row">
          <div className="form-group">
            <label htmlFor="customer">Customer :</label>
            <div className="input-with-actions">
              <button
                type="button"
                id="customer"
                className="form-control customer-select-trigger"
                onClick={openSearch}
                disabled={isRestrictedEditMode}
                aria-haspopup="dialog"
                aria-expanded={open}
                title={isRestrictedEditMode ? "Customer cannot be changed in this mode" : "Select customer"}
              >
                {selectedCustomer ? (
                  (selectedCustomer.company_name || selectedCustomer.company || "").trim() || "\u00A0"
                ) : (
                  <span className="customer-select-trigger-placeholder">Click to select customer</span>
                )}
              </button>
              <button
                type="button"
                className="btn-customer-action btn-customer-add"
                title="Create Customer"
                onClick={addUserNavigate}
              >
                <IoMdAdd />
              </button>
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="branchSelect">Branch :</label>
            <select
              id="branchSelect"
              className="form-control"
              value={selectedBranch?.id || ''}
              onChange={(e) => {
                const branchId = e.target.value;
                const branch = branches.find(b => b.id == branchId);
                setSelectedBranch(branch || null);
              }}
            >
              <option value="">-- Select --</option>
              {branches.map(b => (
                <option key={b.id} value={b.id}>
                  {b.name} - {b.state ? ` ${b.state}` : ''} ({(b.gst_number || b.gst || b.GST || b.gstin) ? ` ${(b.gst_number || b.gst || b.GST || b.gstin)}` : ''})
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label htmlFor="copyFrom">Copy from :</label>
            {isEditMode ? (
              <div className="form-control readonly-bg">
                None
              </div>
            ) : (
              <select
                id="copyFrom"
                className="form-control"
                onChange={(e) => {
                  if (e.target.value === "earlier") {
                    if (!selectedCustomer || !selectedCustomer.id) {
                      alert("Please select a customer first to copy from earlier quotations.");
                    } else {
                      // show all document types created for this customer
                      setCopyFromDocType('All');
                      setShowCopyFromModal(true);
                    }
                  } else if (e.target.value === "templates") {
                    setShowSavedTemplates(true);
                  }
                  e.target.value = "none";
                }}
              >
                <option value="none">None</option>
                <option value="earlier">Earlier Quotations</option>
                <option value="templates">Saved Templates</option>
              </select>
            )}
          </div>

          <div className="form-group">
            <label htmlFor="series">Series :</label>
            <select
              id="series"
              className="form-control"
              value={selectedSeries}
              onChange={(e) => handleOnChangeSeriesSelect(e)}
              disabled={isRestrictedEditMode}
              title={isRestrictedEditMode ? 'Series cannot be changed in edit mode' : ''}
            >
              <option value="">Select</option>
              {filteredSeries && filteredSeries.length > 0 ? (
                filteredSeries.map(s => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))
              ) : (
                <option value="" disabled>No series available</option>
              )}
            </select>
          </div>
        </div>
      </div>

      <div className="section-card party-details-wrapper">
        <div className="party-details-container">
          <div className="party-details-left">
            <h6 className="section-title">Party Details</h6>
            
            {/* Row 1: Contact Person & Sales Credit */}
            <div className="form-row">
              <div className="form-field">
                <label htmlFor="contactPerson">Contact Person:</label>
                <input
                  id="contactPerson"
                  type="text"
                  className="form-control"
                  value={contactPerson}
                  onChange={(e) => setContactPerson(e.target.value)}
                  placeholder="Enter contact person name"
                />
              </div>

              <div className="form-field">
                <label htmlFor="salesCredit">Sales Credit :</label>
                <select
                  id="salesCredit"
                  className="form-control"
                  value={selectedEmployee}
                  onChange={(e) => handleOnchabgeSalesCredit(e)}
                >
                  <option value="">None</option>
                  {employees.map((emp) => {
                    const id = emp.user_id || emp.id || emp.ID || emp.id_user;
                    const salutation = emp.salutation || '';
                    const first = emp.firstname || emp.first_name || emp.firstName || emp.name || emp.Name || '';
                    const last = emp.lastname || emp.last_name || emp.lastName || '';
                    const fullName = (salutation + ' ' + first + ' ' + last).trim();
                    return (
                      <option key={id} value={id}>
                        {fullName || (emp.email || emp.Email || 'Unnamed')}
                      </option>
                    );
                  })}
                </select>
              </div>
            </div>

            {/* Row 2: Billing Address & Shipping Address */}
            <div className="form-row row-address">
              {/* Billing Address Column */}
              <div className="form-field field-with-address">
                <div className="field-inline">
                  <label htmlFor="address">Address :</label>
                  {selectedCustomer && (selectedCustomer.addresses || []).length > 0 ? (
                    <>
                      <select
                        id="address"
                        className="form-control"
                        value={selectedBillingAddressId || ""}
                        onChange={handleBillingAddressChange}
                      >
                        <option value="">--Select--</option>
                        {(selectedCustomer.addresses || []).map((addr) => {
                          const gst = gstForAddr(addr);
                          const stateName = addr.state || addr.State || addr.state_name || addr.StateName || '';
                          return (
                            <option key={addr.id} value={addr.id}>
                              {(addr.title ? addr.title : (addr.address1 || ''))}{stateName ? ` - ${stateName}` : ''}{gst ? ' - ' + gst : ''}
                            </option>
                          );
                        })}
                      </select>
                      <button
                        type="button"
                        className="btn-customer-action btn-customer-add"
                        onClick={() => handleAddAddress('billing')}
                        title="Add address"
                      >
                        <IoMdAdd />
                      </button>
                    </>
                  ) : (
                    <button className="btn-add-address" onClick={() => handleAddAddress('billing')}>
                      + Click here to add an address.
                    </button>
                  )}
                </div>

                {/* Display selected billing address details */}
                {selectedBillingAddress && (
                  <div className="address-display-box">
                    <div className="address-display-header">
                      <h6 className="address-title">{(selectedBillingAddress.title || selectedBillingAddress.address1 || 'Address')}</h6>
                      <button
                        type="button"
                        className="btn-edit-address"
                        onClick={() => handleEditAddress('billing')}
                        title="Edit address"
                      >
                        ✎
                      </button>
                    </div>
                    <div className="address-content">
                      {selectedBillingAddress.address1 && <div>{selectedBillingAddress.address1}</div>}
                      {selectedBillingAddress.address2 && <div>{selectedBillingAddress.address2}</div>}
                      {selectedBillingAddress.address3 && <div>{selectedBillingAddress.address3}</div>}
                      {(selectedBillingAddress.city || selectedBillingAddress.state || selectedBillingAddress.country || selectedBillingAddress.postal_code) && (
                        <div>
                          {selectedBillingAddress.city && <span>{selectedBillingAddress.city}</span>}
                          {selectedBillingAddress.state && <span>{selectedBillingAddress.state ? (selectedBillingAddress.city ? ', ' : '') + selectedBillingAddress.state : ''}</span>}
                          {formatAddressCountryName(selectedBillingAddress.country) && <span>{(selectedBillingAddress.city || selectedBillingAddress.state ? ', ' : '') + formatAddressCountryName(selectedBillingAddress.country)}</span>}
                          {formatAddressPostalCode(selectedBillingAddress.postal_code) && <span>{' - ' + formatAddressPostalCode(selectedBillingAddress.postal_code)}</span>}
                        </div>
                      )}
                      {formatMobileWithCountryCode(getCustomerMobileForAddr(selectedBillingAddress), selectedBillingAddress.country) && (
                        <div><strong>Mobile :</strong> {formatMobileWithCountryCode(getCustomerMobileForAddr(selectedBillingAddress), selectedBillingAddress.country)}</div>
                      )}
                      {getCustomerEmailForAddr(selectedBillingAddress) && (
                        <div><strong>Email :</strong> {getCustomerEmailForAddr(selectedBillingAddress)}</div>
                      )}
                      {gstForAddr(selectedBillingAddress) && (
                        <div><strong>GSTIN :</strong> {gstForAddr(selectedBillingAddress)}</div>
                      )}
                      {selectedBillingAddress.extra && (
                         typeof selectedBillingAddress.extra === 'object' ? (
                          Object.entries(selectedBillingAddress.extra).map(([k, v]) => (
                            <div key={k}><strong>{k} :</strong> {v}</div>
                          ))
                        ) : (
                          <div><strong>Extra:</strong> {selectedBillingAddress.extra}</div>
                        )
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Shipping Address Column */}
              <div className="form-field field-with-address">
                <div className="shipping-header-row">
                  <label htmlFor="shippingAddress">Shipping Address :</label>
                  <div className="checkbox-field">
                    <input
                      className="form-check-input"
                      type="checkbox"
                      id="checkDefault"
                      checked={isSameAsBilling}
                      onChange={() => setIsSameAsBilling((prev) => !prev)}
                    />
                    {isSameAsBilling && (
                      <label className="form-check-label" htmlFor="checkDefault">
                        Same as Billing address
                      </label>
                    )}
                  </div>

                  {!isSameAsBilling && selectedCustomer && (
                    <div className="field-inline-nested">
                      <select
                        id="shippingAddressSelect"
                        className="form-control"
                        value={selectedShippingAddressId || ""}
                        onChange={handleShippingAddressChange}
                      >
                        <option value="">--Select--</option>
                        <option value="none">None</option>
                        {(selectedCustomer.addresses || []).map((addr) => {
                          const gst = gstForAddr(addr);
                          const stateName = addr.state || addr.State || addr.state_name || addr.StateName || '';
                          return (
                            <option key={addr.id} value={addr.id}>
                              {(addr.title ? addr.title : (addr.address1 || ''))}{stateName ? ` - ${stateName}` : ''}{gst ? ' - ' + gst : ''}
                            </option>
                          );
                        })}
                      </select>
                      <button
                        type="button"
                        className="btn-customer-action btn-customer-add"
                        onClick={() => handleAddAddress('shipping')}
                        title="Add shipping address"
                      >
                        <IoMdAdd />
                      </button>
                    </div>
                  )}
                </div>

                {/* Display selected shipping address details */}
                {!isSameAsBilling && selectedShippingAddress && (
                  <div className="address-display-box shipping-offset">
                    <div className="address-display-header">
                      <h6 className="address-title">{(selectedShippingAddress.title || selectedShippingAddress.address1 || 'Address')}{gstForAddr(selectedShippingAddress) ? ' - ' + gstForAddr(selectedShippingAddress) : ''}</h6>
                      <button
                        type="button"
                        className="btn-edit-address"
                        onClick={() => handleEditAddress('shipping')}
                        title="Edit address"
                      >
                        ✎
                      </button>
                    </div>
                    <div className="address-content">
                      {selectedShippingAddress.address1 && <div>{selectedShippingAddress.address1}</div>}
                      {selectedShippingAddress.address2 && <div>{selectedShippingAddress.address2}</div>}
                      {selectedShippingAddress.address3 && <div>{selectedShippingAddress.address3}</div>}
                      {(selectedShippingAddress.city || selectedShippingAddress.state || selectedShippingAddress.country || selectedShippingAddress.postal_code) && (
                        <div>
                          {selectedShippingAddress.city && <span>{selectedShippingAddress.city}</span>}
                          {selectedShippingAddress.state && <span>{selectedShippingAddress.state ? (selectedShippingAddress.city ? ', ' : '') + selectedShippingAddress.state : ''}</span>}
                          {formatAddressCountryName(selectedShippingAddress.country) && <span>{(selectedShippingAddress.city || selectedShippingAddress.state ? ', ' : '') + formatAddressCountryName(selectedShippingAddress.country)}</span>}
                          {formatAddressPostalCode(selectedShippingAddress.postal_code) && <span>{' - ' + formatAddressPostalCode(selectedShippingAddress.postal_code)}</span>}
                        </div>
                      )}
                      {formatMobileWithCountryCode(getCustomerMobileForAddr(selectedShippingAddress), selectedShippingAddress.country) && (
                        <div><strong>Mobile :</strong> {formatMobileWithCountryCode(getCustomerMobileForAddr(selectedShippingAddress), selectedShippingAddress.country)}</div>
                      )}
                      {getCustomerEmailForAddr(selectedShippingAddress) && (
                        <div><strong>Email :</strong> {getCustomerEmailForAddr(selectedShippingAddress)}</div>
                      )}
                      {gstForAddr(selectedShippingAddress) && (
                        <div><strong>GSTIN :</strong> {gstForAddr(selectedShippingAddress)}</div>
                      )}
                      {selectedShippingAddress.extra && (
                         typeof selectedShippingAddress.extra === 'object' ? (
                          Object.entries(selectedShippingAddress.extra).map(([k, v]) => (
                            <div key={k}><strong>{k} :</strong> {v}</div>
                          ))
                        ) : (
                          <div><strong>Extra:</strong> {selectedShippingAddress.extra}</div>
                        )
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className={`document-details-box ${isRestrictedEditMode ? 'edit-disabled' : ''}`}>
            <h6 className="section-title">Document Details</h6>
            
            <div className="form-field-vertical">
              <label>{`${titleBase} No. :`}</label>
              <div className="field-column">
                <div className="input-inline-group">
                  {canRegenerateDocumentNumber && selectedSeries && (
                    <div className="seq-prefix">
                      {(() => {
                        const s = seriesList.find(x => String(x.id) === String(selectedSeries));
                        const p = s?.prefix || 'QTN';
                        const pn = s?.prefix_number || '';
                        return `${p}${pn}/`;
                      })()}
                    </div>
                  )}

                  {!canRegenerateDocumentNumber ? (
                    <div className="form-control edit-mode-display">
                      {qutationNo || quotationData?.quotation_number || ''}
                    </div>
                  ) : (
                    selectedSeries ? (
                      <>
                        <input
                          id="quotationSeq"
                          type="text"
                          className="form-control seq-input"
                          value={isReviseMode ? `${seqNumber || ''}${revisionLetter || ''}` : seqNumber}
                          onChange={(e) => {
                            const rawValue = e.target.value || '';
                            let nextSeq = rawValue;
                            let nextRevision = revisionLetter;

                            if (isReviseMode) {
                              const sanitized = rawValue.toUpperCase().replace(/[^0-9A-Z]/g, '');
                              const match = sanitized.match(/^(\d*)([A-Z]?).*$/);
                              nextSeq = match?.[1] || '';
                              nextRevision = match?.[2] || '';
                              setRevisionLetter(nextRevision);
                            } else {
                              nextSeq = rawValue.replace(/[^0-9]/g, '');
                            }

                            setSeqNumber(nextSeq);
                            const s = seriesList.find(x => String(x.id) === String(selectedSeries));
                            const p = s?.prefix || 'QTN';
                            const pn = s?.prefix_number || '';
                            const yr = yearRange || (() => {
                              const d = new Date(); const y = d.getFullYear(); return `${String(y).slice(-2)}-${String(y+1).slice(-2)}`;
                            })();
                            const sequenceWithRevision = isReviseMode
                              ? `${nextSeq}${nextRevision}`
                              : (nextRevision ? `${nextSeq}${nextRevision}` : nextSeq || '');
                            setQutationNo(buildQuotationNumber(p, pn, sequenceWithRevision, yr));
                          }}
                        />
                        <div className="seq-divider">/</div>
                        <div className="seq-suffix">{yearRange || (() => { const d=new Date(); const y=d.getFullYear(); return `${String(y).slice(-2)}-${String(y+1).slice(-2)}` })()}</div>
                      </>
                    ) : (
                      <input
                        id="quotationSeq"
                        type="text"
                        className="form-control"
                        value={isReviseMode ? `${seqNumber || ''}${revisionLetter || ''}` : seqNumber}
                        onChange={(e) => {
                          const rawValue = e.target.value || '';
                          if (isReviseMode) {
                            const sanitized = rawValue.toUpperCase().replace(/[^0-9A-Z]/g, '');
                            const match = sanitized.match(/^(\d*)([A-Z]?).*$/);
                            const nextSeq = match?.[1] || '';
                            const nextRevision = match?.[2] || '';
                            setSeqNumber(nextSeq);
                            setRevisionLetter(nextRevision);
                            setQutationNo(buildDocumentTypeQuotationNumber(docType, `${nextSeq}${nextRevision}`));
                            return;
                          }

                          const v = rawValue;
                          setSeqNumber(v);
                          setQutationNo(buildDocumentTypeQuotationNumber(docType, v));
                        }}
                        placeholder={`${titleBase} No.`}
                      />
                    )
                  )}
                </div>
              </div>
            </div>

            <div className="form-field-vertical">
              <label htmlFor="reference">Reference :</label>
              <input
                id="reference"
                type="text"
                className="form-control"
                value={references ? references : ""}
                onChange={(e) => setReferences(e.target.value)}
              />
            </div>

            <div className="form-field-vertical">
              <label htmlFor="quotationDate">{`${titleBase} Date :`}</label>
              <input
                id="quotationDate"
                type="date"
                className="form-control"
                value={quotationDate}
                readOnly
                onKeyDown={(e) => e.preventDefault()}
                onMouseDown={(e) => e.preventDefault()}
                style={{ pointerEvents: 'none', backgroundColor: '#f5f5f5' }}
              />
            </div>

            <div className="form-field-vertical">
              <label htmlFor="validTill">Valid till :</label>
              <input
                id="validTill"
                type="date"
                className="form-control"
                value={validTill}
                onChange={(e) => setValidTill(e.target.value)}
              />
            </div>
            {/* Issued by - show selected Sales Credit employee details */}
            <div className="form-field-vertical">
              <label>Issued by :</label>
              {selectedEmployeeObj ? (
                <div className="issued-by-box">
                  <div className="issued-by-name">
                    {(() => {
                      const salutation = selectedEmployeeObj.salutation || '';
                      const first = selectedEmployeeObj.firstname || selectedEmployeeObj.first_name || selectedEmployeeObj.firstName || '';
                      const last = selectedEmployeeObj.lastname || selectedEmployeeObj.last_name || selectedEmployeeObj.lastName || '';
                      const fullName = (salutation + ' ' + first + ' ' + last).trim();
                      return fullName || selectedEmployeeObj.name || selectedEmployeeObj.Name || 'N/A';
                    })()}
                  </div>
                  <div className="issued-by-details">
                    <div className="issued-by-phone">
                      {selectedEmployeeObj.mobile_number || selectedEmployeeObj.phone || selectedEmployeeObj.mobile || 'N/A'}
                    </div>
                    <div className="issued-by-email">
                      {selectedEmployeeObj.email || 'N/A'}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="issued-by-box">
                  <div className="muted-sm">No sales credit selected</div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

     <div className="customer-info-container">
          <h5>Items list.</h5>
          <table className="professional-table">
            <thead>
              <tr>
                <th>No</th>
                <th>Image</th>
                <th>Items Description</th>
                <th>Code</th>
                <th>HSN/SAC</th>
                <th>Qty</th>
                <th>Unit</th>
                <th>Fixed Rate</th>
                <th>Rate</th>
                <th>Discount %</th>
                <th>Taxable</th>
                {isGSTStateMatch ? (
                  <>
                    <th>CGST %</th>
                    <th>CGST</th>
                    <th>SGST %</th>
                    <th>SGST</th>
                  </>
                ) : (
                  <>
                    <th>IGST %</th>
                    <th>IGST</th>
                  </>
                )}
                <th>Amount</th>
                <th>Lead Time</th>
                 <th>Actions</th> 
              </tr>
            </thead>
           <tbody>
  {tableItems.map((item, index) => (
    <tr key={item._rowId || index}>
      <td>{index + 1}</td>
      <td className="cell-image">
        { (normalizeImageUrl(item.image) || normalizeImageUrl(item.thumbnail) || item.image || item.thumbnail) ? (
          <img src={normalizeImageUrl(item.image) || normalizeImageUrl(item.thumbnail) || item.image || item.thumbnail} alt={item.name} className="item-thumb" />
        ) : (
          <div className="item-thumb placeholder">No Image</div>
        )}
      </td>
      <td>{item.name}</td>
      <td>{item.code || item.Code || ''}</td>
      <td>{item.hsn}</td>
      <td>
        <div className="qty-control">
          <button
            type="button"
            className="btn-qty"
            onClick={() =>
              setTableItems((prev) => prev.map((it, i) => {
                if (i !== index) return it;
                const qty = Math.max(0, (Number(it.qty) || 0) - 1);
                const total = (it.rate || 0) * qty;
                const prevTotal = (it.rate || 0) * (Number(it.qty) || 0);
                const discPct = Number(it.discountPercent) || (prevTotal > 0 ? ((it.discount || 0) / prevTotal) * 100 : 0);
                const discountAmt = (discPct / 100) * total;
                const taxable = total - discountAmt;
                const gstPercent = it.gst || (taxable > 0 ? (((it.cgst || 0) + (it.sgst || 0) + (it.igst || 0)) / taxable) * 100 : 0);
                const sellerGSTIN = selectedBranch?.gst || selectedBranch?.GST || '';
                const buyerGSTIN = gstForAddr(selectedShippingAddress) || gstForAddr(selectedBillingAddress) || '';
                const taxRes = gstCalculation(taxable, gstPercent, sellerGSTIN, buyerGSTIN, isGSTStateMatch);
                return { ...it, qty, taxable, discount: discountAmt, discountPercent: discPct, cgst: taxRes.cgst, sgst: taxRes.sgst, igst: taxRes.igst, amount: taxRes.grandTotal, gst: gstPercent };
              }))
            }
          >
            −
          </button>

          <input
            type="text"
            className="form-control input-small qty-input"
            value={item.qty}
            onChange={(e) => {
              const newQty = Number(e.target.value) || 0;
              setTableItems((prev) => prev.map((it, i) => {
                if (i !== index) return it;
                const qty = newQty;
                const total = (it.rate || 0) * qty;
                const prevTotal = (it.rate || 0) * (Number(it.qty) || 0);
                const discPct = Number(it.discountPercent) || (prevTotal > 0 ? ((it.discount || 0) / prevTotal) * 100 : 0);
                const discountAmt = (discPct / 100) * total;
                const taxable = total - discountAmt;
                const gstPercent = it.gst || (taxable > 0 ? (((it.cgst || 0) + (it.sgst || 0) + (it.igst || 0)) / taxable) * 100 : 0);
                const sellerGSTIN = selectedBranch?.gst || selectedBranch?.GST || '';
                const buyerGSTIN = gstForAddr(selectedShippingAddress) || gstForAddr(selectedBillingAddress) || '';
                const taxRes = gstCalculation(taxable, gstPercent, sellerGSTIN, buyerGSTIN, isGSTStateMatch);
                return { ...it, qty, taxable, discount: discountAmt, discountPercent: discPct, cgst: taxRes.cgst, sgst: taxRes.sgst, igst: taxRes.igst, amount: taxRes.grandTotal, gst: gstPercent }; 
              }));
            }}
          />

          <button
            type="button"
            className="btn-qty"
            onClick={() =>
              setTableItems((prev) => prev.map((it, i) => {
                if (i !== index) return it;
                const qty = (Number(it.qty) || 0) + 1;
                const total = (it.rate || 0) * qty;
                const prevTotal = (it.rate || 0) * (Number(it.qty) || 0);
                const discPct = Number(it.discountPercent) || (prevTotal > 0 ? ((it.discount || 0) / prevTotal) * 100 : 0);
                const discountAmt = (discPct / 100) * total;
                const taxable = total - discountAmt;
                const gstPercent = it.gst || (taxable > 0 ? (((it.cgst || 0) + (it.sgst || 0) + (it.igst || 0)) / taxable) * 100 : 0);
                const sellerGSTIN = selectedBranch?.gst || selectedBranch?.GST || '';
                const buyerGSTIN = gstForAddr(selectedShippingAddress) || gstForAddr(selectedBillingAddress) || '';
                const taxRes = gstCalculation(taxable, gstPercent, sellerGSTIN, buyerGSTIN, isGSTStateMatch);
                return { ...it, qty, taxable, discount: discountAmt, discountPercent: discPct, cgst: taxRes.cgst, sgst: taxRes.sgst, igst: taxRes.igst, amount: taxRes.grandTotal, gst: gstPercent }; 
              }))
            }
          >
            +
          </button>
        </div>
      </td>
      <td>
        <span>{item.unit || '-'}</span>
      </td>
      <td>
        <span>{item.fixedRate !== undefined ? Number(item.fixedRate).toFixed(2) : '-'}</span>
      </td>

      <td>
        <input
          type="text"
          className="form-control input-small"
          value={item.rate}
          onChange={(e) =>
            setTableItems((prev) => {
              const newItems = [...prev];
              newItems[index].rate = Number(e.target.value);
              const total = newItems[index].rate * newItems[index].qty;
              const prevTotal = (Number(e.target.value) * newItems[index].qty) || ((newItems[index].rate || 0) * (newItems[index].qty || 0));
              const discPct = Number(newItems[index].discountPercent) || (prevTotal > 0 ? ((newItems[index].discount || 0) / prevTotal) * 100 : 0);
              const discountAmt = (discPct / 100) * total;
              const taxable = total - discountAmt;
              const gstPercent = newItems[index].gst || (taxable > 0 ? (((newItems[index].cgst || 0) + (newItems[index].sgst || 0) + (newItems[index].igst || 0)) / taxable) * 100 : 0);
              const sellerGSTIN = selectedBranch?.gst || selectedBranch?.GST || '';
              const buyerGSTIN = gstForAddr(selectedShippingAddress) || gstForAddr(selectedBillingAddress) || '';
              const taxRes = gstCalculation(taxable, gstPercent, sellerGSTIN, buyerGSTIN, isGSTStateMatch);
              newItems[index].taxable = taxRes.amount;
              newItems[index].cgst = taxRes.cgst;
              newItems[index].sgst = taxRes.sgst;
              newItems[index].igst = taxRes.igst;
              newItems[index].amount = taxRes.grandTotal;
              newItems[index].gst = gstPercent;
              newItems[index].discount = discountAmt;
              newItems[index].discountPercent = discPct;
              return newItems;
            })
          }
        />
      </td>
      <td>
        <input
          type="text"
          className="form-control input-small"
          value={item.discountPercent !== undefined ? item.discountPercent : ''}
          onChange={(e) =>
            setTableItems((prev) => {
              const newItems = [...prev];
              let pct = Number(e.target.value) || 0;
              pct = Math.max(0, Math.min(100, pct));
              newItems[index].discountPercent = pct;
              const total = newItems[index].rate * newItems[index].qty;
              const discountAmt = (pct / 100) * total;
              newItems[index].discount = discountAmt;
              const taxable = total - discountAmt;
              const gstPercent = newItems[index].gst || (taxable > 0 ? (((newItems[index].cgst || 0) + (newItems[index].sgst || 0) + (newItems[index].igst || 0)) / taxable) * 100 : 0);
              const sellerGSTIN = selectedBranch?.gst || selectedBranch?.GST || '';
              const buyerGSTIN = gstForAddr(selectedShippingAddress) || gstForAddr(selectedBillingAddress) || '';
              const taxRes = gstCalculation(taxable, gstPercent, sellerGSTIN, buyerGSTIN, isGSTStateMatch);
              newItems[index].taxable = taxRes.amount;
              newItems[index].cgst = taxRes.cgst;
              newItems[index].sgst = taxRes.sgst;
              newItems[index].igst = taxRes.igst;
              newItems[index].amount = taxRes.grandTotal;
              newItems[index].gst = gstPercent;
              return newItems;
            })
          }
        />
      </td>
      <td>{(Number(item.taxable) || 0).toFixed(2)}</td>
      {isGSTStateMatch ? (
        <>
          <td>{(() => {
            const taxable = Number(item.taxable) || 0;
            const gstRaw = Number(item.gst) || (taxable > 0 ? (((Number(item.cgst)||0) + (Number(item.sgst)||0)) / taxable) * 100 : 0);
            const cgstPct = Math.round(gstRaw / 2);
            return `${cgstPct}%`;
          })()}</td>
          <td>{(() => {
            const taxable = Number(item.taxable) || 0;
            const gstRaw = Number(item.gst) || (taxable > 0 ? (((Number(item.cgst)||0) + (Number(item.sgst)||0)) / taxable) * 100 : 0);
            const cgstPct = Math.round(gstRaw / 2);
            const cgstVal = (Number(item.cgst) && Number(item.cgst) > 0) ? Number(item.cgst) : +(taxable * (cgstPct / 100));
            return cgstVal.toFixed(2);
          })()}</td>

          <td>{(() => {
            const taxable = Number(item.taxable) || 0;
            const gstRaw = Number(item.gst) || (taxable > 0 ? (((Number(item.cgst)||0) + (Number(item.sgst)||0)) / taxable) * 100 : 0);
            const sgstPct = Math.round(gstRaw / 2);
            return `${sgstPct}%`;
          })()}</td>

          <td>{(() => {
            const taxable = Number(item.taxable) || 0;
            const gstRaw = Number(item.gst) || (taxable > 0 ? (((Number(item.cgst)||0) + (Number(item.sgst)||0)) / taxable) * 100 : 0);
            const sgstPct = Math.round(gstRaw / 2);
            const sgstVal = (Number(item.sgst) && Number(item.sgst) > 0) ? Number(item.sgst) : +(taxable * (sgstPct / 100));
            return sgstVal.toFixed(2);
          })()}</td>
        </>
      ) : (
        <>
          <td>{(() => {
            const taxable = Number(item.taxable) || 0;
            const pctRaw = Number(item.gst) || (taxable > 0 ? ((Number(item.igst) || 0) / taxable) * 100 : 0);
            const pct = Math.round(pctRaw);
            return `${pct}%`;
          })()}</td>
          <td>{(() => {
            const taxable = Number(item.taxable) || 0;
            const pctRaw = Number(item.gst) || (taxable > 0 ? ((Number(item.igst) || 0) / taxable) * 100 : 0);
            const pct = Math.round(pctRaw);
            const igstVal = +(taxable * (pct / 100));
            return igstVal.toFixed(2);
          })()}</td>
        </>
      )}
      <td>{(Number(item.amount) || 0).toFixed(2)}</td>
      <td>{item.leadTime}</td>
      <td>
        <button
          className="btn-action btn-edit"
          onClick={() => openBillingModalForProduct(item, index)}
          title="Edit item"
        >
          <MdEdit />
        </button>
        <button
          className="btn-action btn-delete"
          onClick={() => setTableItems((prev) => prev.filter((_, i) => i !== index))}
          title="Delete item"
        >
          <MdDeleteOutline />
        </button>
      </td>
    </tr>
  ))}
</tbody>
          </table>

          <div className="item-list-footer">
            <div className="left">
              <button className="add-another" onClick={handleProdOpen}>
                + Add Another Item
              </button>
            </div>

            <div className="center">
              <div className="barcode-search-container">
                <label className="barcode-label">Search Using Barcode :</label>
                <div className="barcode-search">
                  <div className="barcode-input-group">
                    <input
                      type="text"
                      className="form-control"
                      placeholder="Scan Barcode"
                      value={prodsearch}
                      onChange={(e) => { setProdSearch(e.target.value); debouncedBarcodeFetch(e.target.value); }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleBarcodeSearch();
                        }
                      }}
                    />
                    <button className="btn-success go-btn" onClick={() => handleBarcodeSearch()}>
                      ➜
                    </button>

                    {prodsearch && barcodeSuggestions.length > 0 && (
                      <div className="searchable-select-dropdown">
                        {barcodeSuggestions.map((p) => (
                          <div key={p.ID || p.id || (p.Code || p.code)} className="searchable-select-option" onMouseDown={() => { handleSelectProduct(p); setBarcodeSuggestions([]); setProdSearch(''); }}>
                             <div className="option-code">{p.Code || p.code || p.Sku || p.SKU || ''}</div>
                             <div className="option-name">{p.Name || p.name}</div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

      <div className={`quotation-summary-layout ${isRestrictedEditMode ? 'edit-disabled' : ''}`}>
        <div className="summary-left-side">
          {/* Terms & Conditions Section */}
          <div className="summary-card tandc-card">
             <TermsConditionSelector 
              open={openTandCModal} 
              handleClose={(p,ec,ed) => { setTandcSelections(p); setEndCustomer(ec); setEndDealer(ed); }} 
              initialSelections={tandcSelections}
              end_customer_name = {endcustomer} 
              end_dealer_name = {enddealer} 
            /> 
          </div>

          <div className="summary-row-inline">
            {/* Notes Section */}
            <div className="summary-card notes-card">
              <h5>Notes</h5>
              <textarea 
                placeholder="Enter internal notes, special instructions, or payment terms..."
                value={note}
                onChange={(e)=>setNote(e.target.value)}
              />
            </div>

            {/* Bank Details Section moved here */}
            <div className="summary-card bank-card">
              <h5>Bank Details</h5>
              <div className="bank-selection-row">
                <select 
                  value={selectedBankId || ''}
                  onChange={(e) => setSelectedBankId(e.target.value ? Number(e.target.value) : null)}
                >
                  <option value="">-- Select Bank Account --</option>
                  {bankDetails && bankDetails.length > 0 ? (
                    bankDetails.map((bank) => (
                      <option key={bank.id} value={bank.id}>
                        {bank.bankName} ({bank.accountNo})
                      </option>
                    ))
                  ) : null}
                </select>
                <button 
                  type="button"
                  className="btn-customer-action btn-customer-add"
                  onClick={() => handleOpenBankModal()}
                  title="Add new bank account"
                >
                   <IoMdAdd />
                </button>
              </div>

              <div className="bank-display-box-container">
                {selectedBankId && selectedBank && (
                  <div className="bank-display-box">
                    <div className="bank-info-header">
                      <div className="bank-name">{selectedBank.bankName}</div>
                      <button
                        type="button"
                        className="btn-action"
                        title="Edit bank details"
                        onClick={() => handleOpenBankModal(selectedBank)}
                      >
                        ✎
                      </button>
                    </div>
                    <div className="bank-details-grid">
                      {selectedBank.branch && <div className="bank-item"><strong>BRANCH</strong> <span>{selectedBank.branch}</span></div>}
                      {selectedBank.accountNo && <div className="bank-item"><strong>ACC NO</strong> <span>{selectedBank.accountNo}</span></div>}
                      {selectedBank.ifsc && <div className="bank-item"><strong>IFSC</strong> <span>{selectedBank.ifsc}</span></div>}
                      {(selectedBank.swiftCode || selectedBank.swift || selectedBank.swift_code) && (
                        <div className="bank-item"><strong>SWIFT</strong> <span>{selectedBank.swiftCode || selectedBank.swift || selectedBank.swift_code}</span></div>
                      )}

                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Upload Section moved here */}
          <div className="summary-card upload-card wide-upload-card">
            <div className="upload-section-content">
              <div className="upload-field-row">
                <span className="upload-label">Upload File :</span>
                <div className="upload-button-wrapper">
                  <label htmlFor="file-upload" className="btn-upload-label">
                    <MdNoteAdd className="icon" /> Upload File
                  </label>
                  <input
                    id="file-upload"
                    type="file"
                    accept=".pdf,.doc,.docx"
                    onChange={(e) => setSelectedFile(e.target.files[0])}
                    style={{ display: 'none' }}
                  />
                </div>

                {selectedFile && (
                  <div className="selected-file-pill">
                    <span>✓ {selectedFile.name}</span>
                    <button
                      type="button"
                      onClick={() => setSelectedFile(null)}
                      className="btn-clear"
                    >
                      ×
                    </button>
                  </div>
                )}

                {attachmentPath && !selectedFile && (
                  <div className="current-attachment-pill">
                    <span className="label">Current: </span>
                    <a 
                      href={`${BASE_URL}/${attachmentPath}`} 
                      target="_blank" 
                      rel="noopener noreferrer"
                    >
                      {attachmentPath.split('/').pop()}
                    </a>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="summary-right-side">
          {/* Totals Section */}
          <div className="totals-box-container">
            {tableItems.length === 0 ? (
              <div className="totals-content">
                <div className="total-row">
                  <span>Total Quantity:</span>
                  <strong>0</strong>
                </div>
                <div className="total-row">
                  <span>Total Amount before Taxes:</span>
                  <strong>₹ 0.00</strong>
                </div>
                {isGSTStateMatch ? (
                  <>
                    <div className="total-row">
                      <span>CGST:</span>
                      <strong>₹ 0.00</strong>
                    </div>
                    <div className="total-row">
                      <span>SGST:</span>
                      <strong>₹ 0.00</strong>
                    </div>
                  </>
                ) : (
                  <div className="total-row">
                    <span>IGST:</span>
                    <strong>₹ 0.00</strong>
                  </div>
                )}

                <div className="total-row">
                  <span>Total Tax :</span>
                  <strong>₹ 0.00</strong>
                </div>

                <div className="total-row total-amount-line">
                  <span>Total Amount :</span>
                  <strong>₹ 0.00</strong>
                </div>

                {(extrcharges.length > 0 || additiondiscounts.length > 0) && (
                  <div className="charge-discount-list">
                    {extrcharges.map((c, i) => (
                      <div key={i} className="item-line">
                        <div className="item-info">
                          <button className="btn-action" title="Edit charge" onClick={() => { setEditingChargeIndex(i); setOpenChargeDialog(true); }}>
                            ✎
                          </button>
                          <button className="btn-action btn-delete" title="Delete charge" onClick={() => setExtraCharges((prev) => prev.filter((_, idx) => idx !== i))}>
                            🗑
                          </button>
                          <span>{c.title} ({c.type === "percent" ? `${Math.round(Number(c.value) || 0)}%` : `₹${Number(c.value) || 0}`})</span>
                        </div>
                        <span className="amount">
                          ₹ {c.type === "percent"
                            ? ((grandTotal * (Number(c.value) || 0)) / 100).toFixed(2)
                            : (Number(c.value) || 0).toFixed(2)}
                        </span>
                      </div>
                    ))}
                    {additiondiscounts.map((d, i) => (
                      <div key={i} className="item-line">
                        <div className="item-info">
                          <button className="btn-action" title="Edit discount" onClick={() => { setEditingDiscountIndex(i); setOpenDiscountDialog(true); }}>
                            ✎
                          </button>
                          <button className="btn-action btn-delete" title="Delete discount" onClick={() => setAdditiondiscounts((prev) => prev.filter((_, idx) => idx !== i))}>
                            🗑
                          </button>
                          <span>{d.title} ({d.type === "percent" ? `${Math.round(Number(d.value) || 0)}%` : `₹${Number(d.value) || 0}`})</span>
                        </div>
                        <span className="amount">
                          - ₹ {d.type === "percent"
                            ? ((grandTotal * (Number(d.value) || 0)) / 100).toFixed(2)
                            : (Number(d.value) || 0).toFixed(2)}
                        </span>
                      </div>
                    ))}
                  </div>
                )}

                <div className="total-row grand-total">
                  <span>Grand Total</span>
                  <span>₹ {finalTotal.toFixed(2)}</span>
                </div>
              </div>
            ) : (
              <div className="totals-content">
                <div className="total-row">
                  <span>Total Quantity:</span>
                  <strong>{tableItems.reduce((sum, item) => sum + (Number(item.qty) || 0), 0)}</strong>
                </div>
                <div className="total-row">
                  <span>Total Amount before Tax :</span>
                  <strong>₹ {totalTaxable.toFixed(2)}</strong>
                </div>

                {isGSTStateMatch ? (
                  <>
                    <div className="total-row">
                      <span>CGST :</span>
                      <strong>₹ {tableItems.reduce((sum, item) => sum + (Number(item.cgst) || 0), 0).toFixed(2)}</strong>
                    </div>
                    <div className="total-row">
                      <span>SGST :</span>
                      <strong>₹ {tableItems.reduce((sum, item) => sum + (Number(item.sgst) || 0), 0).toFixed(2)}</strong>
                    </div>
                  </>
                ) : (
                  <div className="total-row">
                    <span>IGST :</span>
                    <strong>₹ {tableItems.reduce((sum, item) => sum + (Number(item.igst) || 0), 0).toFixed(2)}</strong>
                  </div>
                )}

                <div className="total-row">
                  <span>Total Tax :</span>
                  <strong>₹ {totalTaxAmount.toFixed(2)}</strong>
                </div>

                <div className="total-row total-amount-line">
                  <span>Total :</span>
                  <strong>₹ {grandTotal.toFixed(2)}</strong>
                </div>

                {(extrcharges.length > 0 || additiondiscounts.length > 0) && (
                  <div className="charge-discount-list">
                    {extrcharges.map((c, i) => (
                      <div key={i} className="item-line">
                        <div className="item-info">
                          <button className="btn-action" title="Edit charge" onClick={() => { setEditingChargeIndex(i); setOpenChargeDialog(true); }}>
                            ✎
                          </button>
                          <button className="btn-action btn-delete" title="Delete charge" onClick={() => setExtraCharges((prev) => prev.filter((_, idx) => idx !== i))}>
                            🗑
                          </button>
                          <span>{c.title} ({c.type === "percent" ? `${Math.round(Number(c.value) || 0)}%` : `₹${Number(c.value) || 0}`})</span>
                        </div>
                        <span className="amount">
                          ₹ {c.type === "percent"
                            ? ((grandTotal * (Number(c.value) || 0)) / 100).toFixed(2)
                            : (Number(c.value) || 0).toFixed(2)}
                        </span>
                      </div>
                    ))}
                    {additiondiscounts.map((d, i) => (
                      <div key={i} className="item-line">
                        <div className="item-info">
                          <button className="btn-action" title="Edit discount" onClick={() => { setEditingDiscountIndex(i); setOpenDiscountDialog(true); }}>
                            ✎
                          </button>
                          <button className="btn-action btn-delete" title="Delete discount" onClick={() => setAdditiondiscounts((prev) => prev.filter((_, idx) => idx !== i))}>
                            🗑
                          </button>
                          <span>{d.title} ({d.type === "percent" ? `${Math.round(Number(d.value) || 0)}%` : `₹${Number(d.value) || 0}`})</span>
                        </div>
                        <span className="amount">
                          - ₹ {d.type === "percent"
                            ? ((grandTotal * (Number(d.value) || 0)) / 100).toFixed(2)
                            : (Number(d.value) || 0).toFixed(2)}
                        </span>
                      </div>
                    ))}
                  </div>
                )}

                <div className="form-check round-off-check">
                  <input id="roundOffCheck2" className="form-check-input" type="checkbox" checked={includeRoundOff} onChange={() => setIncludeRoundOff(!includeRoundOff)} />
                  <label htmlFor="roundOffCheck2">Include Round off</label>
                </div>

                <div className="total-row grand-total">
                  <span>Grand Total</span>
                  <span>₹ {finalTotal.toFixed(2)}</span>
                </div>
              </div>
            )}

            <div className="totals-box">
              <button className="btn-add-aux" onClick={() => setOpenChargeDialog(true)}>
                + Add Charge
              </button>
              <button className="btn-add-aux" onClick={() => setOpenDiscountDialog(true)}>
                + Add Discount
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className={`summary-full-width ${isRestrictedEditMode ? 'edit-disabled' : ''}`}>
        <div className="summary-card next-actions-card">
          <h5>Next Actions</h5>
          <div className="actions-list">
            <div className="form-check">
              <input 
                className="form-check-input" 
                type="checkbox" 
                id="saveAsTemplateCheck" 
                checked={saveAsTemplate}
                onChange={(e) => setSaveAsTemplate(e.target.checked)}
              />
              <label className="form-check-label" htmlFor="saveAsTemplateCheck">
                Save as Template
              </label>
            </div>

            <div className="form-check">
              <input className="form-check-input" type="checkbox" id="emailCheck" />
              <label className="form-check-label" htmlFor="emailCheck">
                Share By Email
              </label>
            </div>

            <div className="form-check">
              <input className="form-check-input" type="checkbox" id="whatsappCheck" />
              <label className="form-check-label" htmlFor="whatsappCheck">
                Share By WhatsApp
              </label>
            </div>

            <div className="form-check">
              <input 
                className="form-check-input" 
                type="checkbox" 
                id="printAfterSaveCheck" 
                checked={printAfterSave}
                onChange={(e) => setPrintAfterSave(e.target.checked)}
              />
              <label className="form-check-label" htmlFor="printAfterSaveCheck">
                Print Document After save
              </label>
            </div>
          </div>

          <div className="final-actions-footer">
            <button className="btn btn--save" onClick={handleSaveQuotation} disabled={saving}>
              {isEditMode ? <><MdEdit /> {saving ? primaryActionBusyLabel : primaryActionLabel}</> : <><FaCheck /> {saving ? primaryActionBusyLabel : primaryActionLabel}</>}
            </button>

            {!isEditMode && (
              <button className="btn btn--secondary" onClick={async ()=>{
                await handleSaveQuotation();
                setSelectedCustomer(null);
                setTableItems([]);
                setGrandTotal(0);
                alert("Saved successfully!");
              }} disabled={saving}>
                {`Save ${actionDocLabel} & Create New`}
              </button>
            )}
          </div>
        </div>
      </div>
      

      {/* Address Add Modal */}
      {addressModalOpen && (
        <div className="custom-modal" onClick={() => setAddressModalOpen(false)}>
          <div className="address-modal-v2" onClick={(e) => e.stopPropagation()}>
            <div className="address-modal-header">
              <h5>ADD ADDRESS</h5>
              <button className="close-btn" onClick={() => setAddressModalOpen(false)}>❌</button>
            </div>

            <div className="address-modal-body">
              <div className="address-form-group">
                <label>Title</label>
                <input 
                  type="text"
                  className="address-input" 
                  value={addressForm.title} 
                  placeholder="Title"
                  onChange={(e) => setAddressForm(prev => ({ ...prev, title: e.target.value }))} 
                />
              </div>

              <div className="address-checkbox-group">
                <label className="address-checkbox-label">
                  <input
                    type="checkbox"
                    checked={!!addressForm.show_title_in_shipping}
                    onChange={(e) => setAddressForm(prev => ({ ...prev, show_title_in_shipping: e.target.checked }))}
                  />
                  <span>Show title instead of business name in shipping address</span>
                </label>
              </div>

              <div className="address-form-group mt-10">
                <label>Address</label>
                <div className="address-vertical-stack">
                  <input 
                    type="text"
                    className="address-input" 
                    placeholder="Line1" 
                    value={addressForm.address1} 
                    onChange={(e) => setAddressForm(prev => ({ ...prev, address1: e.target.value }))} 
                  />
                  <input 
                    type="text"
                    className="address-input" 
                    placeholder="Line2" 
                    value={addressForm.address2} 
                    onChange={(e) => setAddressForm(prev => ({ ...prev, address2: e.target.value }))} 
                  />
                </div>
              </div>

              <div className="address-form-group">
                <label>City</label>
                <input 
                  type="text"
                  className="address-input address-input-half" 
                  value={addressForm.city} 
                  onChange={(e) => setAddressForm(prev => ({ ...prev, city: e.target.value }))} 
                />
              </div>

              <div className="address-grid-2">
                <div className="address-form-group">
                  <label>Country</label>
                  <select
                    className="address-select"
                    value={addressForm.country}
                    onChange={(e) => setAddressForm(prev => ({ ...prev, country: e.target.value }))}
                  >
                    {countries.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div className="address-form-group">
                  <label>State</label>
                  <select
                    className="address-select"
                    value={addressForm.state}
                    onChange={(e) => setAddressForm(prev => ({ ...prev, state: e.target.value }))}
                  >
                    <option value="">Select State</option>
                    {indianStates.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
              </div>

              <div className="address-grid-2 mt-10">
                <div className="address-form-group">
                  <label>Pincode</label>
                  <input 
                    type="text"
                    className="address-input" 
                    value={addressForm.postal_code} 
                    onChange={(e) => setAddressForm(prev => ({ ...prev, postal_code: e.target.value }))} 
                  />
                </div>
                <div className="address-form-group">
                  <div className="address-label-row">
                    <label>GSTIN</label>
                    <label className="address-sez-label">
                    </label>
                  </div>
                  <input 
                    type="text"
                    className="address-input" 
                    value={addressForm.gst_in} 
                    onChange={(e) => setAddressForm(prev => ({ ...prev, gst_in: e.target.value }))} 
                  />
                </div>
              </div>

              <div className="address-form-group mt-10">
                <label>Extra Field (e.g. Mobile: 9000012345)</label>
                <div className="address-extra-field">
                  <input 
                    type="text"
                    className="address-input address-key" 
                    placeholder="Key" 
                    value={addressForm.extra_key} 
                    onChange={(e) => setAddressForm(prev => ({ ...prev, extra_key: e.target.value }))} 
                  />
                  <span className="address-separator">:</span>
                  <input 
                    type="text"
                    className="address-input address-value" 
                    placeholder="Value" 
                    value={addressForm.extra_value} 
                    onChange={(e) => setAddressForm(prev => ({ ...prev, extra_value: e.target.value }))} 
                  />
                </div>
              </div>
            </div>

            <div className="address-modal-footer">
              <button className="address-btn-save" onClick={saveAddressModal}>
                <FaCheck /> Save
              </button>
            </div>
          </div>
        </div>
      )}
      {/* modal  */}

      {openPrintConfig && (
        <PrintSettingsDialog
          onClose={handleClosePrintConfig}
          initialConfig={{
            ...printConfig,
            headerLogosSource: getHeaderLogoList(printerHeader),
            headerLogoFallback: printerHeader?.logo_data || null,
          }}
          onSave={handleSavePrintConfig}
          docType={docType}
        />
      )}

      {/* Modal for search + table */}
      {open && (
        <div className="custom-modal" onClick={handleClose}>
          <div className="professional-modal select-customer-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h5>Select Customer</h5>
              <button className="close-btn" onClick={handleClose}>❌</button>
            </div>

            <div className="modal-body">
              <div
                key={`customer-search-editable-${customerSearchInputMountKey}`}
                ref={customerSearchEditableRef}
                className="form-control search-input customer-search-fake-input"
                contentEditable="plaintext-only"
                suppressContentEditableWarning
                role="searchbox"
                aria-label="Search customers"
                data-placeholder="Search customers..."
                tabIndex={0}
                onInput={(e) => {
                  const el = e.currentTarget;
                  let raw = el.textContent ?? "";
                  raw = raw.replace(/\r?\n/g, " ");
                  if (raw !== el.textContent) {
                    el.textContent = raw;
                    const range = document.createRange();
                    range.selectNodeContents(el);
                    range.collapse(false);
                    const sel = window.getSelection();
                    sel.removeAllRanges();
                    sel.addRange(range);
                  }
                  applyCustomerModalFilter(raw);
                }}
                onPaste={(e) => {
                  e.preventDefault();
                  const text = (e.clipboardData.getData("text/plain") || "").replace(/\r?\n/g, " ");
                  const el = e.currentTarget;
                  el.focus();
                  if (document.queryCommandSupported?.("insertText")) {
                    document.execCommand("insertText", false, text);
                  } else {
                    const sel = window.getSelection();
                    if (!sel?.rangeCount) {
                      el.appendChild(document.createTextNode(text));
                    } else {
                      const range = sel.getRangeAt(0);
                      range.deleteContents();
                      const tn = document.createTextNode(text);
                      range.insertNode(tn);
                      range.setStartAfter(tn);
                      range.collapse(true);
                      sel.removeAllRanges();
                      sel.addRange(range);
                    }
                  }
                  applyCustomerModalFilter(el.textContent ?? "");
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter") e.preventDefault();
                }}
              />

              <div className="customer-list-container">
                {customers.map((cust) => (
                  <div key={cust.id} className="customer-list-item" onClick={() => handleSelectCustomer(cust)}>
                    <div className="customer-item-content">
                      <div className="customer-company-name">{cust.company_name || cust.company || ""}</div>
                      <div className="customer-contact-name">
                        {`${cust.firstname || ''} ${cust.lastname || ''}`.trim()}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}



    




      {/* Product Modal */}
      {openProdTable && (
        <div className="custom-modal" onClick={handleProdClose}>
          <div className="professional-modal product-selection-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h5>Select Item</h5>
              <div className="flex-center-gap-12">
                <button
                  type="button"
                  className="btn-layout"
                  onClick={() => setProductLayout((p) => (p === 'list' ? 'grid' : 'list'))}
                >
                  Change Layout
                </button>
                <button className="close-btn" onClick={handleProdClose}>❌</button>
              </div>
            </div>

            <div className="modal-body">
              <input
                type="text"
                className="form-control search-input"
                placeholder="Search products by name or code..."
                value={prodsearch}
                onChange={handleProductSearch}
              />

              {/* Layout: list (default) or grid */}
              {productLayout === 'list' ? (
                <div className="product-list-container">
                  {products.map((prod) => (
                    <div
                      key={prod.ID}
                      className="product-row"
                    >
                      <input
                        type="checkbox"
                        checked={selectedProductIds.includes(prod.ID)}
                        onChange={() => toggleProductSelection(prod.ID)}
                        onClick={(e) => e.stopPropagation()}
                      />
                      <div className="product-info" onClick={() => openBillingModalForProduct(prod)}>
                        <div className="code">{prod.Code ? prod.Code : ""}</div>
                        <div className="name">{prod.Name || ''}</div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="grid-container">
                  <div className="filters-row">
                    <div className="filter-col">
                      <SearchableSelect
                        options={Array.from(new Set(products.map(p => (p.Category?.Name || p.CategoryName || p.Category || '').toString()).filter(Boolean)))}
                        value={selectedCategoryFilter}
                        onChange={(v) => { setSelectedCategoryFilter(v); setSelectedSubcategoryFilter(''); }}
                        placeholder="Filter by Category"
                      />
                    </div>
                    <div className="filter-col">
                      <SearchableSelect
                        options={Array.from(new Set(products
                          .filter(p => !selectedCategoryFilter || ((p.Category?.Name || p.CategoryName || p.Category || '').toString() === selectedCategoryFilter))
                          .map(p => (p.SubCategory?.Name || p.SubCategoryName || p.SubCategory || '').toString()).filter(Boolean)
                        ))}
                        value={selectedSubcategoryFilter}
                        onChange={(v) => setSelectedSubcategoryFilter(v)}
                        placeholder="Filter by Sub Category"
                      />
                    </div>
                  </div>

                  <div className="products-grid">
                    {products
                      .filter(p => {
                        // text search + category + subcategory filters
                        const q = prodsearch.trim().toLowerCase();
                        if (q && !((p.Name || '').toString().toLowerCase().includes(q) || (p.Code || '').toString().toLowerCase().includes(q))) return false;
                        if (selectedCategoryFilter) {
                          const cat = (p.Category?.Name || p.CategoryName || p.Category || '').toString();
                          if (cat !== selectedCategoryFilter) return false;
                        }
                        if (selectedSubcategoryFilter) {
                          const sub = (p.SubCategory?.Name || p.SubCategoryName || p.SubCategory || '').toString();
                          if (sub !== selectedSubcategoryFilter) return false;
                        }
                        return true;
                      })
                        .map((prod) => (
                        <div key={prod.ID} className="product-card">
                          <div className="product-card-inner">
                            <input
                              type="checkbox"
                              checked={selectedProductIds.includes(prod.ID)}
                              onChange={() => toggleProductSelection(prod.ID)}
                              onClick={(e) => e.stopPropagation()}
                            />
                            <div className="product-card-content" onClick={() => openBillingModalForProduct(prod)}>
                              <div className="product-thumb-wrap">
                                { getProductImage(prod) ? (
                                  <img src={getProductImage(prod)} alt={prod.Name} className="product-thumb" />
                                ) : (
                                  <div className="product-thumb placeholder">No Image</div>
                                ) }
                              </div>
                              <div className="product-name">{prod.Name}</div>
                            </div>
                          </div>
                        </div>
                      ))}
                  </div>
                </div>
              )}
            </div>

            <div className="modal-footer">
              <button
                type="button"
                className="btn--secondary mr-auto"
                onClick={() => {
                  handleProdClose();
                  window.open(`${window.location.origin}/ManageProduct?productType=Stock`, '_blank');
                }}
              >
                + Create New Product
              </button>
              
              <button
                type="button"
                className="btn--secondary"
                onClick={() => {
                  handleProdClose();
                  setSelectedNonStockIds([]);
                  setNonStockSearch("");
                  setOpenAddServiceModal(true);
                }}
              >
                + Service / Non-Stock Item
              </button>

              <button
                type="button"
                className="btn--primary"
                onClick={addSelectedProducts}
                disabled={selectedProductIds.length === 0}
              >
                Add Selected ({selectedProductIds.length})
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Billing Item Modal (open when selecting a product) */}
      {billingModalOpen && billingModalProduct && (
        <div className="custom-modal" onClick={() => setBillingModalOpen(false)}>
          <div className="professional-modal billing-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h5>{billingEditIndex !== null ? 'Update Item' : 'Add Item'}</h5>
              <button className="close-btn" onClick={() => setBillingModalOpen(false)}>❌</button>
            </div>

            <div className="modal-body">
              <div className="form-group">
                <label>Item</label>
                <input className="form-control" value={billingModalProduct.Name} readOnly />
              </div>

              <div className="form-group">
                <label>Description</label>
                <textarea className="form-control" rows={3} value={billingModalValues.desc} onChange={(e) => setBillingModalValues(prev => ({ ...prev, desc: e.target.value }))} />
              </div>

              <div className="grid-3">
                <div className="form-group">
                  <label>Qty</label>
                  <input type="text" className="form-control" value={billingModalValues.qty} onChange={(e) => setBillingModalValues(prev => {
                    const qty = Number(e.target.value) || 0;
                    const rate = Number(prev.rate) || 0;
                    const total = rate * qty;
                    const prevTotal = (Number(prev.rate) || 0) * (Number(prev.qty) || 0);
                    const prevDiscount = Number(prev.discount) || 0;
                    const prevPct = Number(prev.discountPercent);
                    const pct = (Number.isFinite(prevPct) && prevPct > 0) ? prevPct : (prevTotal > 0 ? (prevDiscount / prevTotal) * 100 : 0);
                    const discountAmt = (pct / 100) * total;
                    return { ...prev, qty, discount: Number(discountAmt.toFixed(2)), discountPercent: Number(((total > 0) ? (discountAmt / total) * 100 : 0).toFixed(2)) };
                  })} />
                </div>
                <div className="form-group">
                  <label>Unit</label>
                  <input className="form-control" value={billingModalValues.unit} readOnly />
                </div>
                <div className="form-group">
                  <label>Rate</label>
                  <input type="text" className="form-control" value={billingModalValues.rate} onChange={(e) => setBillingModalValues(prev => {
                    const rate = Number(e.target.value) || 0;
                    const qty = Number(prev.qty) || 0;
                    const total = rate * qty;
                    const prevTotal = (Number(prev.rate) || 0) * (Number(prev.qty) || 0);
                    const prevDiscount = Number(prev.discount) || 0;
                    const prevPct = Number(prev.discountPercent);
                    const pct = (Number.isFinite(prevPct) && prevPct > 0) ? prevPct : (prevTotal > 0 ? (prevDiscount / prevTotal) * 100 : 0);
                    const discountAmt = (pct / 100) * total;
                    return { ...prev, rate, discount: Number(discountAmt.toFixed(2)), discountPercent: Number(((total > 0) ? (discountAmt / total) * 100 : 0).toFixed(2)) };
                  })} />
                </div>
              </div>

              <div className="grid-3">
                <div className="form-group">
                  <label>Discount (₹)</label>
                  <input type="text" className="form-control" value={billingModalValues.discount} onChange={(e) => {
                    let val = Number(e.target.value) || 0;
                    setBillingModalValues(prev => {
                      const total = (Number(prev.rate) || 0) * (Number(prev.qty) || 0);
                      if (val < 0) val = 0;
                      if (val > total) val = total;
                      const pct = total > 0 ? Number(((val / total) * 100).toFixed(2)) : 0;
                      return { ...prev, discount: val, discountPercent: pct };
                    });
                  }} />
                </div>
                <div className="form-group">
                  <label>Discount (%)</label>
                  <input type="text" className="form-control" value={billingModalValues.discountPercent} onChange={(e) => {
                    let pct = Number(e.target.value) || 0;
                    pct = Math.max(0, Math.min(100, pct));
                    setBillingModalValues(prev => {
                      const total = (Number(prev.rate) || 0) * (Number(prev.qty) || 0);
                      const discountAmt = (pct / 100) * total;
                      return { ...prev, discountPercent: pct, discount: Number(discountAmt.toFixed(2)) };
                    });
                  }} />
                </div>
                <div className="form-group">
                  <label>Lead Time</label>
                  <input className="form-control" value={billingModalValues.leadTime} onChange={(e) => setBillingModalValues(prev => ({ ...prev, leadTime: e.target.value }))} />
                </div>
              </div>

              <div className="grid-2">
                <div className="form-group">
                  <label>HSN/SAC</label>
                  <input className="form-control" value={billingModalValues.hsn} readOnly />
                </div>
                <div className="form-group">
                  <label>GST (%)</label>
                  <input type="text" className="form-control" value={billingModalValues.gst} readOnly />
                </div>
              </div>

              <div className="flex-center-gap-12 mt-0">
                <div className="highlight-box">
                  <strong>Taxable :</strong> ₹ {( (billingModalValues.rate * billingModalValues.qty) - (billingModalValues.discountPercent > 0 ? ((billingModalValues.rate * billingModalValues.qty) * (billingModalValues.discountPercent/100)) : billingModalValues.discount) ).toFixed(2)}
                </div>
                <div className="highlight-box">
                  <strong>Amount :</strong> ₹ {(() => {
                    const qty = Number(billingModalValues.qty)||0;
                    const rate = Number(billingModalValues.rate)||0;
                    let disc = Number(billingModalValues.discount)||0;
                    if (Number(billingModalValues.discountPercent) > 0) disc = (qty*rate)*(Number(billingModalValues.discountPercent)/100);
                    const taxable = qty*rate - disc;
                    const gstPercent = Number(billingModalValues.gst) || 0;
                    const sellerGSTIN = selectedBranch?.gst || selectedBranch?.GST || '';
                    const buyerGSTIN = gstForAddr(selectedShippingAddress) || gstForAddr(selectedBillingAddress) || '';
                    const taxRes = gstCalculation(taxable, gstPercent, sellerGSTIN, buyerGSTIN, isGSTStateMatch);
                    return taxRes.grandTotal.toFixed(2);
                  })()}
                </div>
              </div>
            </div>

            <div className="modal-footer">
              <button className="btn--secondary" onClick={() => setBillingModalOpen(false)}>Cancel</button>
              <button className="btn--primary" onClick={handleBillingModalSave}>
                {billingEditIndex !== null ? 'Update Item' : 'Add Item'}
              </button>
            </div>
          </div>
        </div>
      )}

        {/* Add Service / Non-Stock Item Modal */}
        {openAddServiceModal && (
          <div className="custom-modal" onClick={() => setOpenAddServiceModal(false)}>
            <div className="professional-modal product-selection-modal" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h5>Select Service / Non-Stock Item</h5>
                <button className="close-btn" onClick={() => setOpenAddServiceModal(false)}>❌</button>
              </div>

              <div className="modal-body">
                <input
                  type="text"
                  className="form-control search-input"
                  placeholder="Search services by name..."
                  value={nonStockSearch}
                  onChange={(e) => setNonStockSearch(e.target.value)}
                />

                <div className="product-list-container" style={{maxHeight: '400px', overflowY: 'auto'}}>
                  {nonStockItems
                    .filter(item => (item.item_name || item.ItemName || "").toLowerCase().includes(nonStockSearch.toLowerCase()))
                    .map((item) => (
                    <div
                      key={item.id || item.ID}
                      className="product-row"
                    >
                      <input
                        type="checkbox"
                        checked={selectedNonStockIds.includes(item.id || item.ID)}
                        onChange={() => toggleNonStockSelection(item.id || item.ID)}
                        onClick={(e) => e.stopPropagation()}
                      />
                      <div className="product-info" onClick={() => {
                        handleSelectNonStockItem(item);
                        setOpenAddServiceModal(false);
                      }}>
                        <div className="code">{item.item_name || item.ItemName || ''}</div>
                        <div className="price" style={{marginLeft: 'auto', fontWeight: 'bold'}}>₹ {item.rate} / {item.unit}</div>
                      </div>
                    </div>
                  ))}
                  {nonStockItems.filter(item => (item.item_name || item.ItemName || "").toLowerCase().includes(nonStockSearch.toLowerCase())).length === 0 && (
                    <div className="muted text-center p-3">No service items found.</div>
                  )}
                </div>
              </div>

              <div className="modal-footer">
                <button
                  type="button"
                  className="btn--secondary mr-auto"
                  onClick={() => {
                    setOpenAddServiceModal(false);
                    setShowCreateNonStockModal(true);
                  }}
                >
                  + Create New Service
                </button>
                <button className="btn--secondary" onClick={() => setOpenAddServiceModal(false)}>Cancel</button>
                <button 
                  className="btn--primary" 
                  onClick={addSelectedNonStockItems}
                  disabled={selectedNonStockIds.length === 0}
                >
                  Add Selected ({selectedNonStockIds.length})
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Create New Non-Stock Item Modal */}
        <AddNonStockModal
          isOpen={showCreateNonStockModal}
          onClose={() => {
            setShowCreateNonStockModal(false);
            setOpenAddServiceModal(true);
          }}
          onSaved={(newItem) => {
            fetchNonStockItems();
            setShowCreateNonStockModal(false);
            setOpenAddServiceModal(true);
          }}
        />

{/* Charges Dialog */}
{openChargeDialog && (
  <div className="custom-modal" onClick={() => setOpenChargeDialog(false)}>
    <div className="professional-modal" onClick={(e) => e.stopPropagation()}>
      <div className="modal-header">
        <h5>Add Extra Charges</h5>
        <button className="close-btn" onClick={() => setOpenChargeDialog(false)}>❌</button>
      </div>

      <div className="modal-body">
        {extrcharges.map((ch, i) => (
          <div key={i} className="charge-row">
            <input 
              className="form-control"
              placeholder="Charge Title (e.g. Freight)" 
              value={ch.title} 
              onChange={(e) => setExtraCharges((prev) => prev.map((c, idx) => idx === i ? { ...c, title: e.target.value } : c))} 
            />
            <select 
              className="form-control"
              value={ch.type} 
              onChange={(e) => setExtraCharges((prev) => prev.map((c, idx) => idx === i ? { ...c, type: e.target.value } : c))}
            >
              <option value="percent">Percentage (%)</option>
              <option value="item">Fixed (₹)</option>
            </select>
            <input 
              className="form-control"
              type="number" 
              placeholder="Amount" 
              value={ch.value} 
              onChange={(e) => setExtraCharges((prev) => prev.map((c, idx) => idx === i ? { ...c, value: e.target.value === '' ? '' : Number(e.target.value) } : c))} 
            />
            <button className="btn-remove" title="Remove row" onClick={() => setExtraCharges((prev) => prev.filter((_, idx) => idx !== i))}>×</button>
          </div>
        ))}
        <button className="btn-add-row" onClick={() => setExtraCharges((prev) => [...prev, { title: "", type: "percent", value: '' }])}>
          + Add Charge Row
        </button>
      </div>

      <div className="modal-footer">
        <button className="btn--primary" onClick={() => setOpenChargeDialog(false)}>Apply Changes</button>
      </div>
    </div>
  </div>
)}

{/* Discounts Dialog */}
{openDiscountDialog && (
  <div className="custom-modal" onClick={() => setOpenDiscountDialog(false)}>
    <div className="professional-modal" onClick={(e) => e.stopPropagation()}>
      <div className="modal-header">
        <h5>Apply Additional Discounts</h5>
        <button className="close-btn" onClick={() => setOpenDiscountDialog(false)}>❌</button>
      </div>

      <div className="modal-body">
        {additiondiscounts.map((ds, i) => (
          <div key={i} className="charge-row">
            <input 
              placeholder="Discount Title (e.g. Deal Discount)" 
              value={ds.title} 
              onChange={(e) => setAdditiondiscounts((prev) => prev.map((d, idx) => idx === i ? { ...d, title: e.target.value } : d))} 
            />
            <select 
              value={ds.type} 
              onChange={(e) => setAdditiondiscounts((prev) => prev.map((d, idx) => idx === i ? { ...d, type: e.target.value } : d))}
            >
              <option value="percent">Percentage (%)</option>
              <option value="item">Fixed (₹)</option>
            </select>
            <input 
              type="number" 
              placeholder="Amount" 
              value={ds.value} 
              onChange={(e) => setAdditiondiscounts((prev) => prev.map((d, idx) => idx === i ? { ...d, value: e.target.value === '' ? '' : Number(e.target.value) } : d))} 
            />
            <button className="btn-remove" title="Remove row" onClick={() => setAdditiondiscounts((prev) => prev.filter((_, idx) => idx !== i))}>×</button>
          </div>
        ))}
        <button className="btn-add-row" onClick={() => setAdditiondiscounts((prev) => [...prev, { title: "", type: "percent", value: '' }])}>
          + Add Discount Row
        </button>
      </div>

      <div className="modal-footer">
        <button className="btn--primary" onClick={() => setOpenDiscountDialog(false)}>Apply Changes</button>
      </div>
    </div>
  </div>
)}

{/* Bank Details Modal */}
{openBankModal && (
  <div className="custom-modal" onClick={handleCloseBankModal}>
    <div className="professional-modal" onClick={(e) => e.stopPropagation()}>
      <div className="modal-header">
        <h5>Add a Bank Detail</h5>
        <button 
          type="button" 
          className="close-btn"
          onClick={handleCloseBankModal}
        >
          ❌
        </button>
      </div>

      <div className="modal-body">
        <div className="form-group">
          <label>Title</label>
          <input
            type="text"
            placeholder="Enter title (e.g., Primary, Secondary)"
            value={bankFormValues.title}
            onChange={(e) => setBankFormValues({ ...bankFormValues, title: e.target.value })}
          />
        </div>

        <div className="form-group">
          <label>Bank Name</label>
          <input
            type="text"
            placeholder="Enter bank name"
            value={bankFormValues.bankName}
            onChange={(e) => setBankFormValues({ ...bankFormValues, bankName: e.target.value })}
          />
        </div>

        <div className="form-group">
          <label>Account No.</label>
          <input
            type="text"
            placeholder="Enter account number"
            value={bankFormValues.accountNo}
            onChange={(e) => setBankFormValues({ ...bankFormValues, accountNo: e.target.value })}
          />
        </div>

        <div className="form-group">
          <label>Branch</label>
          <input
            type="text"
            placeholder="Enter branch"
            value={bankFormValues.branch}
            onChange={(e) => setBankFormValues({ ...bankFormValues, branch: e.target.value })}
          />
        </div>

        <div className="form-group">
          <label>IFSC</label>
          <input
            type="text"
            placeholder="Enter IFSC code"
            value={bankFormValues.ifsc}
            onChange={(e) => setBankFormValues({ ...bankFormValues, ifsc: e.target.value })}
          />
        </div>

        <div className="form-group">
          <label>SWIFT Code</label>
          <input
            type="text"
            placeholder="Enter SWIFT code"
            value={bankFormValues.swiftCode}
            onChange={(e) => setBankFormValues({ ...bankFormValues, swiftCode: e.target.value })}
          />
        </div>
      </div>

      <div className="modal-footer">
        <button 
          className="btn--secondary" 
          onClick={handleCloseBankModal}
        >
          Cancel
        </button>
        <button 
          className="btn--primary" 
          onClick={handleSaveBankDetails}
        >
          Save Details
        </button>
      </div>
    </div>
  </div>
)}

{showTemplateModal && (
  <div className="custom-modal" onClick={() => setShowTemplateModal(false)}>
    <div className="professional-modal" onClick={(e) => e.stopPropagation()}>
      <div className="modal-header">
        <h5>Save as Template</h5>
        <button onClick={() => setShowTemplateModal(false)} className="close-btn">❌</button>
      </div>
      <div className="modal-body">
        <div className="form-group">
          <label>Template Name</label>
          <input
            type="text"
            className="form-control"
            value={templateName}
            onChange={(e) => setTemplateName(e.target.value)}
            placeholder="Enter template name"
          />
        </div>
      </div>
      <div className="modal-footer">
        <button className="btn--secondary" onClick={() => setShowTemplateModal(false)}>Cancel</button>
        <button className="btn--primary" onClick={handleSaveAsTemplate} disabled={saving}>
          {saving ? 'Saving...' : 'Save Template'}
        </button>
      </div>
    </div>
  </div>
)}

{showSavedTemplates && (
  <SavedTemplate 
    onClose={() => setShowSavedTemplates(false)} 
    onSelect={onSelectTemplate}
    showAction={false}
  />
)}

{/* Copy From Earlier Quotation Modal */}
<CopyFromQuotationModal
  open={showCopyFromModal}
  onClose={() => setShowCopyFromModal(false)}
  customerId={selectedCustomer?.id || selectedCustomer?.ID}
  customerName={selectedCustomer?.company_name || selectedCustomer?.business || `${selectedCustomer?.firstname || ''} ${selectedCustomer?.lastname || ''}`.trim()}
  docType={copyFromDocType}
  onSelectQuotation={async (quotation) => {
    // Fetch full quotation data and prefill the form directly
    const qId = quotation.quotation_id || quotation.QuotationID || quotation.id;
    try {
      const resp = await axios.get(`${BASE_URL}/api/quotations/${qId}`);
      const data = resp.data;
      if (data) {
        await prefillFormData(data, false);
        // Clear quotation number fields so a new number is generated
        setQutationNo('');
        setPrevQutationNo('');
        setSeqNumber('');
        // Ensure we stay in create mode, not edit mode
        setIsEditMode(false);
        setIsReviseMode(false);
      }
    } catch (err) {
      console.error("Failed to fetch quotation for copy:", err);
      alert('Could not load the quotation to copy.');
    }
    setShowCopyFromModal(false);
  }}
/>

    </section>

  );
};

export default AddQutation;
