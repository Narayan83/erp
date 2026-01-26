import React, { useState, useEffect,useMemo } from "react";
// removed CiSearch import (search button removed)
import { IoMdPrint, IoIosSearch } from "react-icons/io";
import { IoDocumentText } from "react-icons/io5";
import { FaYoutube } from "react-icons/fa";
import { MdEdit, MdModelTraining } from "react-icons/md";
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
import { useNavigate, useLocation } from "react-router-dom";

import { BASE_URL } from "../../../config/Config";
import TermsConditionSelector from "./TermsConditionModal";
import PrintSettingsDialog from "../../../PrintSettings/Print";
import SavedTemplate from "../../../Admin Master/page/SavedTemplate/SavedTemplate";
import { useParams } from "react-router-dom"; 
import {
  TextField,
  SearchableSelect,
  getProductImage,
  normalizeImageUrl,
  splitQuotationNumber,
  doGSTsMatchState
} from "./utils";




const AddQutation = () => {
  const [open, setOpen] = useState(false);
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
      const cand = String(emp?.id || emp?.ID || emp?.user_id || "");
      return cand === idStr;
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


  const [openProdTable, setOpenProdTable] = useState(false); // modal state
  const [prodsearch, setProdSearch] = useState(""); // search text
  const [products, setProducts] = useState([]); // fetched products
  const [barcodeSuggestions, setBarcodeSuggestions] = useState([]);
  const [productLayout, setProductLayout] = useState('list'); // 'list' | 'grid'
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState('');
  const [selectedSubcategoryFilter, setSelectedSubcategoryFilter] = useState('');
  const [tableItems, setTableItems] = useState([]); // items in main table
  const [grandTotal , setGrandTotal] = useState(0);

  const [isGSTStateMatch, setIsGSTStateMatch]  = useState(true);
  const [branchGstNumber,setBranchGstNumber]  = useState("");
  const [custAddressGst,setCustAddressGst]  = useState("");

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
    const [addServiceValues, setAddServiceValues] = useState({
      name: '',
      description: '',
      qty: 1,
      rate: 0,
      unit: 'no.s',
      hsn: '',
      gst: 0,
    });

    const handleSaveAddService = () => {
      if (!addServiceValues || !addServiceValues.name) {
        alert('Please provide a service name.');
        return;
      }

      const qty = Number(addServiceValues.qty) || 0;
      const rate = Number(addServiceValues.rate) || 0;
      const gstPercent = Number(addServiceValues.gst) || 0;

      const taxable = qty * rate;
      const sellerGSTIN = selectedBranch?.gst || selectedBranch?.GST || '';
      const buyerGSTIN = gstForAddr(selectedShippingAddress) || gstForAddr(selectedBillingAddress) || '';
      const taxRes = gstCalculation(taxable, gstPercent, sellerGSTIN, buyerGSTIN);

      const newItem = {
        id: `service-${Date.now()}`,
        name: addServiceValues.name,
        description: addServiceValues.description || '',
        qty,
        unit: addServiceValues.unit || 'no.s',
        hsn: addServiceValues.hsn || '',
        rate,
        gst: gstPercent,
        taxable: taxRes.amount,
        cgst: taxRes.cgst,
        sgst: taxRes.sgst,
        igst: taxRes.igst,
        amount: taxRes.grandTotal,
        variantId: null,
          _isService: true,
          _rowId: `${Date.now()}-${Math.random().toString(36).slice(2,8)}`,
      }; 

      setTableItems((prev) => {
        const next = [...prev, newItem];
        const total = next.reduce((s, it) => s + (Number(it.amount) || 0), 0);
        setGrandTotal(+total.toFixed(2));
        return next;
      });

      setAddServiceValues({ name: '', description: '', qty: 1, rate: 0, unit: 'no.s', hsn: '', gst: 0 });
      setOpenAddServiceModal(false);
    };

const [tandc,setTandc]=useState([]);
const [openTandCModal, setOpenTandCModal] = useState(false);
const [tandcSearch, setTandcSearch] = useState('');
const [tandcSelections, setTandcSelections] = useState([]); 
const [qutationNo,setQutationNo] = useState('');
const [prevQutationNo, setPrevQutationNo] = useState('');
// Editable middle sequence and year-range parts
const [seqNumber, setSeqNumber] = useState('');
const [yearRange, setYearRange] = useState('');
const [currentScpCount,setCurrentScpCount] = useState({});




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
const [templateName, setTemplateName] = useState("");
const [showTemplateModal, setShowTemplateModal] = useState(false);
const [showSavedTemplates, setShowSavedTemplates] = useState(false);

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
  const handleSavePrintConfig = (newCfg) => {
    try {
      const cfg = newCfg || printConfig;
      const key = `printConfig_${docType}`;
      localStorage.setItem(key, JSON.stringify(cfg));
      setPrintConfig(cfg);
    } catch (e) {
      console.warn('Failed to save print config', e);
    }
    setOpenPrintConfig(false);
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
        const res = await fetch(`${BASE_URL}/api/employees/non-heads`);
        if (res.ok) {
          data = await res.json();
          setEmployees(Array.isArray(data.data) ? data.data : (Array.isArray(data) ? data : []));
          return;
        }
      } catch (e) {
        // ignore and fallback
      }

      const res2 = await fetch(`${BASE_URL}/api/users?page=1&limit=50&user_type=employee`);
      const data2 = await res2.json();
      setEmployees(data2.data || data2 || []);
    } catch (err) {
      console.error("Error fetching employees:", err);
    }
  };


  // Fetch products from API
  const fetchProducts = async (query = "") => {
    try {
      // Prefer server-side filter if supported by backend (uses `filter` like other endpoints).
      const res = await fetch(`${BASE_URL}/api/products?page=1&limit=50&filter=${encodeURIComponent(query)}`);
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
      const res = await fetch(`${BASE_URL}/api/tandc`);
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
      const res = await fetch(`${BASE_URL}/api/company-branches?limit=1000`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to fetch branches');
      const raw = Array.isArray(data.data) ? data.data : data;
      const list = Array.isArray(raw) ? raw.map(b => ({ id: b.id || b.ID, name: b.name || b.Name, city: b.city || b.City, state: b.state || b.State })) : [];
      setBranches(list);
    } catch (err) {
      console.error("Error fetching branches:", err);
    }
  };

  // Fetch series for quotations (used to populate Series dropdown)
  const fetchSeries = async () => {
    try {
      const res = await fetch(`${BASE_URL}/api/series?limit=1000`);
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
      const res = await fetch(`${BASE_URL}/api/company-branch-banks`);
      const data = await res.json();
      const raw = Array.isArray(data.data) ? data.data : (Array.isArray(data) ? data : []);
      const list = Array.isArray(raw) ? raw.map(b => ({
        id: b.id || b.ID,
        bankName: b.bank_name || b.bankName || b.bank || '',
        accountNo: b.account_number || b.accountNo || b.account || '',
        branch: b.branch_name || b.branch || '',
        ifsc: b.ifsc_code || b.ifsc || '' ,
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
      const res = await fetch(`${BASE_URL}/api/products?page=1&limit=20&filter=${encodeURIComponent(q)}`);
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

  useEffect(() => {
    fetchCustomers();
    fetchEmployees();
    fetchProducts();
    fetchTandC();
    fetchBranches();
    fetchSeries();
    fetchBankDetails();
  }, []);

    useEffect(() => {
      console.log(selectedCustomer);
      console.log(products);
      // Reset address selections only when customer actually changes (not during edit prefill)
      // If in edit mode and the selected customer matches the quotation's customer, keep prefilled addresses.
      const prefilledCustomerId = quotationData?.customer?.id || quotationData?.customer?.ID;
      const currentCustomerId = selectedCustomer?.id || selectedCustomer?.ID;

      const isPrefilledCustomer = isEditMode && quotationData && prefilledCustomerId && currentCustomerId && String(prefilledCustomerId) === String(currentCustomerId);

      if (isPrefilledCustomer) {
        return;
      }
      
      // Otherwise, clear addresses when customer changes (new selection or cleared)
      setSelectedBillingAddressId(null);
      setSelectedBillingAddress(null);
      setSelectedShippingAddressId(null);
      setSelectedShippingAddress(null);
      setIsSameAsBilling(true); 
    }, [selectedCustomer, isEditMode, quotationData]);

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
      const res = await fetch(`${BASE_URL}/api/products?page=1&limit=50&filter=${encodeURIComponent(query)}`);
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

   useEffect(()=>{
     const grandTotal = tableItems.reduce((sum, item) => sum + item.amount, 0);
     setGrandTotal(grandTotal);
   },[tableItems])

  // When document type (or branch/address) changes we need to refresh rates/fixedRates and recompute taxes
  useEffect(() => {
    if (!tableItems || tableItems.length === 0) return;

    setTableItems(prev => prev.map((item) => {
      // skip services/non-product rows
      if (item._isService) return item;

      // try to resolve product/variant from current state or the item itself
      const prodFromList = products.find(p => String(p.ID) === String(item.id)) || item.product || null;
      const variantFromList = prodFromList?.Variants ? (prodFromList.Variants.find(v => String(v.ID) === String(item.variantId)) || prodFromList.Variants[0]) : null;

      // If we can't find product/variant, leave the row as-is
      if (!prodFromList && !variantFromList) return item;

      const purchaseCost = Number(variantFromList?.PurchaseCost ?? prodFromList?.PurchaseCost ?? prodFromList?.Purchase_Cost ?? 0);
      const salesPrice = Number(variantFromList?.StdSalesPrice ?? variantFromList?.SalePrice ?? variantFromList?.SellingPrice ?? prodFromList?.StdSalesPrice ?? prodFromList?.SalePrice ?? 0);

      const newRate = docType === 'Purchase Order' ? purchaseCost : (salesPrice || Number(item.rate || 0));
      const qty = Number(item.qty) || 0;
      const discountAmount = Number(item.discount || 0);
      const gstPercent = Number(item.gst ?? item.gst_percent ?? item.gstPercent ?? (prodFromList?.Tax?.Percentage ?? 0)) || 0;
      const sellerGSTIN = selectedBranch?.gst || selectedBranch?.GST || '';
      const buyerGSTIN = gstForAddr(selectedShippingAddress) || gstForAddr(selectedBillingAddress) || '';

      const taxable = (newRate * qty) - discountAmount;
      const taxRes = gstCalculation(taxable, gstPercent, sellerGSTIN, buyerGSTIN);

      return {
        ...item,
        rate: Number(newRate),
        fixedRate: Number(newRate),
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

  }, [docType, selectedBranch, selectedShippingAddress, selectedBillingAddress]);

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
        const sellerGSTIN = selectedBranch?.gst || selectedBranch?.GST || '';
        const buyerGSTIN = gstForAddr(selectedShippingAddress) || gstForAddr(selectedBillingAddress) || '';
        const taxRes = gstCalculation(taxable, gstPercent, sellerGSTIN, buyerGSTIN);
        copy[existingIndex] = { ...existing, qty: newQty, rate, fixedRate: (existing.fixedRate !== undefined ? existing.fixedRate : rate), taxable, cgst: taxRes.cgst, sgst: taxRes.sgst, igst: taxRes.igst, amount: taxRes.grandTotal, gst: gstPercent };
      } else { 
        // either not found or forced new row -> push a new line
        const taxable = rate * qtyToAdd - discount;
        const gstPercent = prod.Tax?.Percentage || 0;
        const sellerGSTIN = selectedBranch?.gst || selectedBranch?.GST || '';
        const buyerGSTIN = gstForAddr(selectedShippingAddress) || gstForAddr(selectedBillingAddress) || '';
        const taxRes = gstCalculation(taxable, gstPercent, sellerGSTIN, buyerGSTIN);

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
    const sellerGSTIN = selectedBranch?.gst || selectedBranch?.GST || '';
    const buyerGSTIN = gstForAddr(selectedShippingAddress) || gstForAddr(selectedBillingAddress) || '';
    const taxRes = gstCalculation(taxable, gstPercent, sellerGSTIN, buyerGSTIN);
    const cgst = taxRes.cgst;
    const sgst = taxRes.sgst;
    const igst = taxRes.igst;
    const amount = taxRes.grandTotal;

    const newItem = {
      _rowId: `${Date.now()}-${Math.random().toString(36).slice(2,8)}`,
      id: billingModalProduct.ID,
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
    return addr.gst_in || addr.gstin || addr.GSTIN || addr.gst || '';
  };

  // GST calculation helper: returns cgst, sgst, igst, totalTax and grandTotal (rounded to 2 decimals)
  const gstCalculation = (amount, gstPercent = 0, sellerGSTIN = '', buyerGSTIN = '') => {
    const sellerState = (sellerGSTIN || '').toString().slice(0, 2);
    const buyerStateRaw = (buyerGSTIN || '').toString();
    const buyerState = (buyerStateRaw && buyerStateRaw.trim().length >= 2) ? buyerStateRaw.slice(0,2) : sellerState;
    const pct = Number(gstPercent) || 0;
    let cgst = 0, sgst = 0, igst = 0;

    // If buyer GSTIN missing or empty, treat as same state
    if (!buyerStateRaw || buyerStateRaw.trim() === '' || sellerState === buyerState) {
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

  const payload = {
    quotation: {
      series_id: selectedSeries ? Number(selectedSeries) : null,
      company_branch_id: selectedBranch && (selectedBranch.id || selectedBranch.ID) ? Number(selectedBranch.id || selectedBranch.ID) : 0,
      company_id: selectedBranch && (selectedBranch.company_id || selectedBranch.companyID) ? Number(selectedBranch.company_id || selectedBranch.companyID) : 0,
      company_branch_bank_id: selectedBankId ? Number(selectedBankId) : null,
      quotation_number: isEditMode ? (qutationNo || quotationData?.quotation_number || '') : (qutationNo && qutationNo.toString().trim() !== '' ? qutationNo : null),
      quotation_date: new Date(quotationDate).toISOString(),
      customer_id: Number(selectedCustomer.id),
      sales_credit_person_id: selectedEmployee ? Number(selectedEmployee) : 0,
      quotation_scp_count: isEditMode 
        ? Number(currentScpCount?.max_quotation_scp_count || 0) 
        : Number(currentScpCount?.max_quotation_scp_count || 0) + 1,
      valid_until: new Date(validTill).toISOString(),
      contact_person: contactPerson,
      total_amount: Number(grandTotal) || 0,
      tax_amount: Number(computedTaxAmount.toFixed(2)) || 0,
      roundoff_amount: roundoffAmount,
      grand_total: Number(grandTotalToSend.toFixed(2)) || 0,
      extra_charges: extrcharges,
      discounts: additiondiscounts,
      document_type: docType || null,
      type: docType || null,
      is_proforma: (docType && String(docType).toLowerCase().includes('proforma')) || false,
      status: isEditMode ? (quotationData?.status || "Open") : "Open",
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

  try {
    setSaving(true);
    if (!selectedFile) {
      if (isEditMode && id) {
        await axios.put(`${BASE_URL}/api/quotations/${id}`, payload);
        alert("Quotation updated successfully.");
      } else {
        await axios.post(`${BASE_URL}/api/quotations`, payload);
        alert("Quotation saved successfully.");
      }
    } else {
      const formData = new FormData();
      formData.append("quotation", JSON.stringify(payload.quotation));
      formData.append("quotation_items", JSON.stringify(payload.quotation_items));
      formData.append("attachment", selectedFile);

      if (isEditMode && id) {
        await axios.put(`${BASE_URL}/api/quotations/${id}`, formData);
        alert("Quotation updated successfully.");
      } else {
        await axios.post(`${BASE_URL}/api/quotations`, formData);
        alert("Quotation saved successfully.");
      }
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
    alert(`Failed to ${isEditMode ? 'update' : 'save'} quotation.`);
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
    alert("Failed to save template.");
  } finally {
    setSaving(false);
  }
};


const onSelectTemplate = (template) => {
  if (template && template.qutation_table) {
    prefillFormData(template.qutation_table);
    setShowSavedTemplates(false);
  }
};


  // Handle open/close modal
  const handleOpen = () => setOpen(true);
  const handleClose = () => setOpen(false);

  // Handle search
  const handleSearch = (e) => {
    console.log("search cliked");
    const value = e.target.value;
    setSearch(value);
    fetchCustomers(value);
  };

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
    fetchCustomers();
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

  useEffect(()=>{
    console.log(qutationNo);
  },[qutationNo])

  // generate next sequence and quotation number for a given series id
  const generateSequenceForSeries = async (seriesId) => {
    // When editing an existing quotation, do NOT auto-generate or overwrite the existing
    // quotation number. Preserve the original `qutationNo` unless the user explicitly
    // chooses to change it via the UI.
    if (isEditMode) return;

    if (!seriesId) {
      // When no series is selected, show only the normal number (seqNumber)
      setQutationNo(seqNumber || '');
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

      // Generate next number (editable middle part)
      const nextNumber = Number(maxCount) + 1;
      const prevNumber = Number(maxCount);
      setSeqNumber(String(nextNumber));

      // Build full quotation string and previous
      const qtno = `${seriesPrefix}/${seriesPrefixNumber}/${nextNumber}/${yrRange}`;
      setQutationNo(qtno);

      if (prevNumber > 0) {
        const prevQtno = `${seriesPrefix}/${seriesPrefixNumber}/${prevNumber}/${yrRange}`;
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
    if (!selectedSeries) {
      // reset when no series
      setQutationNo(seqNumber || '');
      setPrevQutationNo('');
      return;
    }

    // generate sequence for the newly selected series
    generateSequenceForSeries(selectedSeries);
  }, [selectedSeries]);

  const handleOnchabgeSalesCredit = async (e) => {
    setSelectedEmployee(e.target.value);
    console.log(e.target.value);
  }


  useEffect(() => {
  // compute subtotal and tax amount same way as the UI display
  const subtotal = tableItems.reduce((s, it) => s + (Number(it.taxable) || 0), 0);
  const taxAmount = tableItems.reduce((sum, item) => {
    if (isGSTStateMatch) return sum + (Number(item.cgst) || 0) + (Number(item.sgst) || 0);
    const taxable = Number(item.taxable) || 0;
    const pctRaw = Number(item.gst) || (taxable > 0 ? ((Number(item.igst) || 0) / taxable) * 100 : 0);
    const pct = Math.round(pctRaw);
    const igstVal = +(taxable * (pct / 100));
    return sum + igstVal;
  }, 0);

  // base amount (subtotal + tax)
  const base = subtotal + taxAmount;

  // sum percent and fixed charges/discounts on the SAME base to avoid compounding
  const percentCharges = extrcharges.reduce((s, ch) => s + (ch.type === 'percent' ? Number(ch.value) : 0), 0);
  const fixedCharges = extrcharges.reduce((s, ch) => s + (ch.type === 'percent' ? 0 : Number(ch.value) || 0), 0);
  const percentDiscounts = additiondiscounts.reduce((s, ds) => s + (ds.type === 'percent' ? Number(ds.value) : 0), 0);
  const fixedDiscounts = additiondiscounts.reduce((s, ds) => s + (ds.type === 'percent' ? 0 : Number(ds.value) || 0), 0);

  let total = base + (base * (percentCharges / 100)) + fixedCharges - (base * (percentDiscounts / 100)) - fixedDiscounts;

  if (includeRoundOff) {
    // Round to nearest unit (e.g., nearest rupee)
    setFinalTotal(Math.round(Number(total)));
  } else {
    // keep two decimals for display
    setFinalTotal(Number(total.toFixed(2)));
  }
}, [tableItems, isGSTStateMatch, extrcharges, additiondiscounts, includeRoundOff]);


// edit mode


  useEffect(() => {
    const isValidId = /^\d+$/.test(String(id || ""));
    // detect revise param (e.g. ?revise=1)
    try {
      const params = new URLSearchParams(location.search || "");
      const revise = params.get('revise');
      setIsReviseMode(Boolean(revise && String(revise) !== '0' && String(revise).toLowerCase() !== 'false'));
    } catch (err) {
      setIsReviseMode(false);
    }

    if (isValidId) {
      setIsEditMode(true);
      fetchQuotationData();
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
              // prefill but keep it as a new document
              await prefillFormData(data);
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
      const sellerGST = selectedBranch?.gst || selectedBranch?.GST || selectedBranch?.gst_number || selectedBranch?.gstin || '';
      const custGst = gstForAddr(selectedBillingAddress);
      if (custGst && custGst.toString().trim() !== '') {
        const match = doGSTsMatchState(custGst, sellerGST);
        setIsGSTStateMatch(match);
      } else {
        setIsGSTStateMatch(true);
      }
      setBranchGstNumber(sellerGST);
      setCustAddressGst(custGst);
    }
  }, [selectedBillingAddress, selectedBranch]);


const fetchQuotationData = async () => {
    try {
      const response = await axios.get(`${BASE_URL}/api/quotations/${id}`);
      const data = response.data;
      setQuotationData(data);
      
      // Pre-fill all the form data
      console.log('Fetched quotation data:', data);
      prefillFormData(data);
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




const  prefillFormData = async (data) => {
  console.log('Prefilling form with data:', data);
  // Ensure docType is set from saved data so UI matches saved document type
  const incomingDocType = data.document_type || data.type || (data.is_proforma ? 'Proforma Invoice' : 'Quotation');
  setDocType(incomingDocType);
  
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
      gst: data.company_branch.GST || data.company_branch.gst || ''
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
    setQutationNo(data.quotation_number);
  }

  // If we have a quotation_number and series, try to parse seq and year for display
  if (data.quotation_number && data.series_id) {
    try {
      const parts = String(data.quotation_number).split('/');
      // Expecting format: PREFIX / PREFIX_NUMBER / SEQ / YEAR_RANGE
      if (parts.length >= 3) {
        const seq = parts[2] || '';
        setSeqNumber(String(seq));
        if (parts.length >= 4) setYearRange(parts[3]);
        const seqNum = parseInt(seq, 10);
        if (!isNaN(seqNum) && seqNum > 0) {
          const prev = seqNum - 1;
          const s = seriesList.find(x => String(x.id) === String(data.series_id));
          const p = s?.prefix || parts[0] || '';
          const pn = s?.prefix_number || parts[1] || '';
          const yr = parts[3] || '';
          setPrevQutationNo(`${p}/${pn}/${prev}/${yr}`);
        }
      }
    } catch (e) {
      console.warn('Failed to parse quotation_number for seq/year:', e);
    }
  }

  if(data.note){
    setNote(data.note);
  }

  if(data.references){
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

  // Pre-fill round off flag: if server sent non-zero roundoff_amount or explicit flags
  if (data.roundoff_amount !== undefined && data.roundoff_amount !== null) {
    try {
      const rn = Number(data.roundoff_amount) || 0;
      setIncludeRoundOff(Boolean(rn !== 0));
    } catch (e) {
      // ignore
    }
  } else if (data.include_roundoff === true || data.includeRoundOff === true || data.include_round_off === true || data.total_before_roundoff === true) {
    setIncludeRoundOff(true);
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

      // Compute CGST/SGST amounts from taxable and gstPercent when tax_amount not provided
      const computedTaxTotal = Number(((taxable * (gstPercent || 0)) / 100).toFixed(2));
      const cgstAmt = (taxAmount ? Number((taxAmount / 2).toFixed(2)) : Number((computedTaxTotal / 2).toFixed(2)));
      const sgstAmt = (taxAmount ? Number((taxAmount / 2).toFixed(2)) : Number((computedTaxTotal / 2).toFixed(2)));

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
        igst: 0,
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
  const formTitle = isEditMode ? (isReviseMode ? `Revise ${titleBase}` : `Edit ${titleBase}`) : `Create ${titleBase}`;

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
    if (isEditMode) return; // don't overwrite existing selection in edit
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
  }, [filteredSeries, isEditMode]);

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
            disabled={isEditMode}
            title={isEditMode ? 'Document type cannot be changed in edit mode' : 'Document type'}
            style={{ cursor: isEditMode ? 'not-allowed' : 'pointer' }}
          >
            {docTypes.map(dt => (
              <option key={dt} value={dt}>{dt}</option>
            ))}
          </select>

          <button className="btn btn--print" onClick={handleOpenPrintConfig}>
            <span><IoMdPrint /></span>
            Print Settings
          </button>
          {/* <button className="btn btn--back" onClick={() => navigate(-1)}>
            <span><FaLongArrowAltLeft /></span>
            Back
          </button> */}
          {isEditMode && (
            <button className="btn btn--save" onClick={() => handleSaveQuotation()} disabled={saving}>
              <MdEdit /> Update
            </button>
          )}
          <button className="btn btn--save" onClick={() => handleSaveQuotation()} disabled={saving}>
            <FaCheck /> Save
          </button>
        </div>
      </div>
      <div className={`section-card basic-info-card ${isEditMode && !isReviseMode ? 'edit-disabled' : ''}`}>
        <h6 className="section-title">Basic Information</h6>
        <div className="form-row">
          <div className="form-group">
            <label htmlFor="customer">Customer :</label>
            <div className="input-with-actions">
              <input
                id="customer"
                type="text"
                className="form-control"
                value={
                  selectedCustomer
                    ? (selectedCustomer.company_name || "")
                    : ""
                }
                onClick={() => openSearch()}
                readOnly
              />
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
                  {b.name}{b.city ? ` - ${b.city}` : ''}{b.state ? ` (${b.state})` : ''}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label htmlFor="copyFrom">Copy from :</label>
            {isEditMode ? (
              <div className="form-control" style={{ background: '#f5f5f5', cursor: 'not-allowed' }}>
                None
              </div>
            ) : (
              <select
                id="copyFrom"
                className="form-control"
                onChange={(e) => {
                  if (e.target.value === "templates") {
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
              disabled={isEditMode}
              title={isEditMode ? 'Series cannot be changed in edit mode' : ''}
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

      <div className={`section-card party-details-wrapper ${isEditMode && !isReviseMode ? 'edit-disabled' : ''}`}>
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
                    const id = emp.id || emp.ID || emp.user_id || emp.id_user;
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
                          return (
                            <option key={addr.id} value={addr.id}>
                              {(addr.title ? addr.title : (addr.address1 || ''))}{gst ? ' - ' + gst : ''}
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
                      <h6 className="address-title">{(selectedBillingAddress.title || selectedBillingAddress.address1 || 'Address')}{gstForAddr(selectedBillingAddress) ? ' - ' + gstForAddr(selectedBillingAddress) : ''}</h6>
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
                          {selectedBillingAddress.country && <span>{selectedBillingAddress.country ? (selectedBillingAddress.city || selectedBillingAddress.state ? ', ' : '') + selectedBillingAddress.country : ''}</span>}
                          {selectedBillingAddress.postal_code && <span>{selectedBillingAddress.postal_code ? ' - ' + selectedBillingAddress.postal_code : ''}</span>}
                        </div>
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
                          return (
                            <option key={addr.id} value={addr.id}>
                              {(addr.title ? addr.title : (addr.address1 || ''))}{gst ? ' - ' + gst : ''}
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
                  <div className="address-display-box" style={{ marginLeft: '120px', width: 'calc(100% - 120px)' }}>
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
                          {selectedShippingAddress.country && <span>{selectedShippingAddress.country ? (selectedShippingAddress.city || selectedShippingAddress.state ? ', ' : '') + selectedShippingAddress.country : ''}</span>}
                          {selectedShippingAddress.postal_code && <span>{selectedShippingAddress.postal_code ? ' - ' + selectedShippingAddress.postal_code : ''}</span>}
                        </div>
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

          <div className="document-details-box">
            <h6 className="section-title">Document Details</h6>
            
            <div className="form-field-vertical">
              <label>{`${titleBase} No. :`}</label>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  {!isEditMode && selectedSeries && (
                    <div style={{ color: '#333', fontSize: '14px' }}>
                      {(() => {
                        const s = seriesList.find(x => String(x.id) === String(selectedSeries));
                        const p = s?.prefix || 'QTN';
                        const pn = s?.prefix_number || '';
                        return `${p}${pn}/`;
                      })()}
                    </div>
                  )}

                  {isEditMode ? (
                    <div className="form-control" style={{ background: '#f8f9fa', height: 'auto', minHeight: '34px', display: 'flex', alignItems: 'center'}}>
                      {qutationNo || quotationData?.quotation_number || ''}
                    </div>
                  ) : (
                    selectedSeries ? (
                      <>
                        <input
                          id="quotationSeq"
                          type="text"
                          className="form-control"
                          style={{ width: '60px' }}
                          value={seqNumber}
                          onChange={(e) => {
                            const v = e.target.value.replace(/[^0-9]/g, '');
                            setSeqNumber(v);
                            const s = seriesList.find(x => String(x.id) === String(selectedSeries));
                            const p = s?.prefix || 'QTN';
                            const pn = s?.prefix_number || '';
                            const yr = yearRange || (() => {
                              const d = new Date(); const y = d.getFullYear(); return `${String(y).slice(-2)}-${String(y+1).slice(-2)}`;
                            })();
                            setQutationNo(`${p}/${pn}/${v || ''}/${yr}`);
                          }}
                        />
                        <div style={{margin: '0 4px'}}>/</div>
                        <div style={{ color: '#333', fontSize: '14px' }}>{yearRange || (() => { const d=new Date(); const y=d.getFullYear(); return `${String(y).slice(-2)}-${String(y+1).slice(-2)}` })()}</div>
                      </>
                    ) : (
                      <input
                        id="quotationSeq"
                        type="text"
                        className="form-control"
                        value={seqNumber}
                        onChange={(e) => {
                          const v = e.target.value;
                          setSeqNumber(v);
                          setQutationNo(v);
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
                onChange={(e) => setQuotationDate(e.target.value)}
                readOnly={true}
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
        <div className="container">
          <h5>Items list.</h5>
          <div className="row">
            <div className="col-md-12">
              <table className="table table-bordered">
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
                const taxRes = gstCalculation(taxable, gstPercent, sellerGSTIN, buyerGSTIN);
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
                const taxRes = gstCalculation(taxable, gstPercent, sellerGSTIN, buyerGSTIN);
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
                const taxRes = gstCalculation(taxable, gstPercent, sellerGSTIN, buyerGSTIN);
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
              const taxRes = gstCalculation(taxable, gstPercent, sellerGSTIN, buyerGSTIN);
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
              const taxRes = gstCalculation(taxable, gstPercent, sellerGSTIN, buyerGSTIN);
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
            </div>
            <div className="col-md-12 item-list-footer">
              <div className="left">
                <button className="btn btn-success add-another" onClick={handleProdOpen}>
                  + Add Another Item
                </button>
              </div>

              <div className="center">
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, width: '100%' }}>
                  <label className="barcode-label" style={{ margin: 0 }}>Search Using Barcode :</label>
                  <div className="barcode-search" style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, width: '100%' }}>
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
                        style={{ flex: 1 }}
                      />
                      <button className="btn btn-success go-btn" onClick={() => handleBarcodeSearch()}>
                        ➜
                      </button>

                    {prodsearch && barcodeSuggestions.length > 0 && (
                      <div className="searchable-select-dropdown" style={{ position: 'absolute', zIndex: 40, left: 0, right: 0, maxHeight: 280, overflowY: 'auto' }}>
                        {barcodeSuggestions.map((p) => (
                          <div key={p.ID || p.id || (p.Code || p.code)} className="searchable-select-option" onMouseDown={() => { handleSelectProduct(p); setBarcodeSuggestions([]); setProdSearch(''); }}>
                             <div style={{ fontWeight: 600 }}>{p.Code || p.code || p.Sku || p.SKU || ''}</div>
                             <div style={{ fontSize: 12 }}>{p.Name || p.name}</div>
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
      </div>
      </div>

      <div className="container">
        <div className="row">
          <div className="col-md-8">

             <TermsConditionSelector 
              open={openTandCModal} 
              handleClose={(p,ec,ed) => { setTandcSelections(p);setEndCustomer(ec),setEndDealer(ed) }} 
              initialSelections={isEditMode ? tandcSelections : []}
              end_customer_name = {isEditMode?endcustomer:''} 
              end_dealer_name = {isEditMode?enddealer:''} 
            /> 
          </div>
          <div className="col-md-4">
           <div className="customer-info-container flex-column">
            {tableItems.length === 0 ? (
              <>
                <div className="row mb-2">
                  <div className="col-12 d-flex justify-content-between">
                    <strong>Total</strong> <strong>  ₹ {grandTotal.toFixed(2)}</strong>
                  </div>
                </div>

                <div className="row mb-2">
                  <div className="col-12 d-flex justify-content-between align-items-center">
                    
                    <div style={{ minWidth: '90px' }} />
                  </div>
                </div>

                <div className="row border-top pt-2">
                  <div className="col-12 d-flex justify-content-between">
                    <strong>Grand Total</strong> <strong>₹ {finalTotal.toFixed(2)}</strong>
                  </div>
                </div>
              </>
            ) : (
              <>
                <div className="row mb-2">
                  <div className="col-12 d-flex justify-content-between">
                    <strong>Total Amount before Tax</strong> <strong>  ₹ {(() => {
                      const subtotal = tableItems.reduce((s, it) => s + (Number(it.taxable) || 0), 0);
                      return subtotal.toFixed(2);
                    })()}</strong>
                  </div>
                </div>

                {isGSTStateMatch ? (
                  <>
                    <div className="row mb-2 border-top pt-2">
                      <div className="col-12 d-flex justify-content-between">
                        <strong>CGST {(() => {
                          const pcts = tableItems.map(it => {
                            const taxable = Number(it.taxable) || 0;
                            const gstRaw = Number(it.gst) || (taxable > 0 ? (((Number(it.cgst)||0) + (Number(it.sgst)||0)) / taxable) * 100 : 0);
                            return Math.round(gstRaw / 2);
                          }).filter(p => p && !isNaN(p));
                          const uniq = Array.from(new Set(pcts));
                          if (uniq.length === 1) return `(${uniq[0]}%)`;
                          if (uniq.length === 0) return "";
                          return "(mixed)";
                        })()}</strong>
                        <strong>₹ {(() => {
                          const cgstSum = tableItems.reduce((s, it) => {
                            const taxable = Number(it.taxable) || 0;
                            const gstRaw = Number(it.gst) || (taxable > 0 ? (((Number(it.cgst)||0) + (Number(it.sgst)||0)) / taxable) * 100 : 0);
                            const cgstPct = Math.round(gstRaw / 2);
                            const cgstVal = (Number(it.cgst) && Number(it.cgst) > 0) ? Number(it.cgst) : +(taxable * (cgstPct / 100));
                            return s + cgstVal;
                          }, 0);
                          return cgstSum.toFixed(2);
                        })()}</strong>
                      </div>
                    </div>

                    <div className="row mb-2">
                      <div className="col-12 d-flex justify-content-between">
                        <strong>SGST {(() => {
                          const pcts = tableItems.map(it => {
                            const taxable = Number(it.taxable) || 0;
                            const gstRaw = Number(it.gst) || (taxable > 0 ? (((Number(it.cgst)||0) + (Number(it.sgst)||0)) / taxable) * 100 : 0);
                            return Math.round(gstRaw / 2);
                          }).filter(p => p && !isNaN(p));
                          const uniq = Array.from(new Set(pcts));
                          if (uniq.length === 1) return `(${uniq[0]}%)`;
                          if (uniq.length === 0) return "";
                          return "(mixed)";
                        })()}</strong>
                        <strong>₹ {(() => {
                          const sgstSum = tableItems.reduce((s, it) => {
                            const taxable = Number(it.taxable) || 0;
                            const gstRaw = Number(it.gst) || (taxable > 0 ? (((Number(it.cgst)||0) + (Number(it.sgst)||0)) / taxable) * 100 : 0);
                            const sgstPct = Math.round(gstRaw / 2);
                            const sgstVal = (Number(it.sgst) && Number(it.sgst) > 0) ? Number(it.sgst) : +(taxable * (sgstPct / 100));
                            return s + sgstVal;
                          }, 0);
                          return sgstSum.toFixed(2);
                        })()}</strong>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="row mb-2 border-top pt-2">
                    <div className="col-12 d-flex justify-content-between">
                      <strong>iGST {(() => {
                        const pcts = tableItems.map(it => {
                          const taxable = Number(it.taxable) || 0;
                          const pctRaw = Number(it.gst) || (taxable > 0 ? ((Number(it.igst) || 0) / taxable) * 100 : 0);
                          return Math.round(pctRaw);
                        }).filter(p => p && !isNaN(p));
                        const uniq = Array.from(new Set(pcts));
                        if (uniq.length === 1) return `(${uniq[0]}%)`;
                        if (uniq.length === 0) return "";
                        return "(mixed)";
                      })()}</strong>
                      <strong>₹ {(() => {
                        const igstSum = tableItems.reduce((s, it) => {
                          const taxable = Number(it.taxable) || 0;
                          const pctRaw = Number(it.gst) || (taxable > 0 ? ((Number(it.igst) || 0) / taxable) * 100 : 0);
                          const pct = Math.round(pctRaw);
                          const igstVal = (Number(it.igst) && Number(it.igst) > 0) ? Number(it.igst) : +(taxable * (pct / 100));
                          return s + igstVal;
                        }, 0);
                        return igstSum.toFixed(2);
                      })()}</strong>
                    </div>
                  </div>
                )}

                <div className="row mb-2">
                  <div className="col-12 d-flex justify-content-between">
                    <strong>Total Tax Amount</strong> <strong>  ₹ {(() => {
                      const taxAmount = tableItems.reduce((sum, item) => {
                        if (isGSTStateMatch) {
                          const taxable = Number(item.taxable) || 0;
                          const gstRaw = Number(item.gst) || (taxable > 0 ? (((Number(item.cgst)||0) + (Number(item.sgst)||0)) / taxable) * 100 : 0);
                          const pctHalf = Math.round(gstRaw / 2);
                          const cgstVal = (Number(item.cgst) && Number(item.cgst) > 0) ? Number(item.cgst) : +(taxable * (pctHalf / 100));
                          const sgstVal = (Number(item.sgst) && Number(item.sgst) > 0) ? Number(item.sgst) : +(taxable * (pctHalf / 100));
                          return sum + cgstVal + sgstVal;
                        }
                        const taxable = Number(item.taxable) || 0;
                        const pctRaw = Number(item.gst) || (taxable > 0 ? ((Number(item.igst) || 0) / taxable) * 100 : 0);
                        const pct = Math.round(pctRaw);
                        const igstVal = +(taxable * (pct / 100));
                        return sum + igstVal;
                      }, 0);
                      return taxAmount.toFixed(2);
                    })()}</strong>
                  </div>
                </div>

                <div className="row mb-2">
                  <div className="col-12 d-flex justify-content-between">
                    <strong>Total</strong> <strong>₹ {(() => {
                      const subtotal = tableItems.reduce((s, it) => s + (Number(it.taxable) || 0), 0);
                      const taxAmount = tableItems.reduce((sum, item) => {
                        if (isGSTStateMatch) return sum + (Number(item.cgst) || 0) + (Number(item.sgst) || 0);
                        const taxable = Number(item.taxable) || 0;
                        const pctRaw = Number(item.gst) || (taxable > 0 ? ((Number(item.igst) || 0) / taxable) * 100 : 0);
                        const pct = Math.round(pctRaw);
                        const igstVal = +(taxable * (pct / 100));
                        return sum + igstVal;
                      }, 0);
                      return (subtotal + taxAmount).toFixed(2);
                    })()}</strong>
                  </div>
                </div>

                {extrcharges.length > 0 && (
                  <div className="mb-2">
                    {extrcharges.map((c, i) => (
                      <div key={i} className="d-flex justify-content-between align-items-center">
                        <div style={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                          <button className="btn-action btn-edit" title="Edit charge" onClick={() => { setEditingChargeIndex(i); setOpenChargeDialog(true); }}>
                            ✎
                          </button>
                          <button className="btn-action btn-delete" title="Delete charge" onClick={() => setExtraCharges((prev) => prev.filter((_, idx) => idx !== i))}>
                            🗑
                          </button>
                          <span>{c.title} ({c.type === "percent" ? `${Math.round(Number(c.value) || 0)}%` : `₹${Number(c.value) || 0}`})</span>
                        </div>
                        <span>
                          ₹{" "}
                          {c.type === "percent"
                            ? ((grandTotal * (Number(c.value) || 0)) / 100).toFixed(2)
                            : (Number(c.value) || 0).toFixed(2)}
                        </span>
                      </div>
                    ))}
                  </div>
                )}

                {additiondiscounts.length > 0 && (
                  <div className="mb-2">
                    {additiondiscounts.map((d, i) => (
                      <div key={i} className="d-flex justify-content-between align-items-center">
                        <div style={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                          <button className="btn-action btn-edit" title="Edit discount" onClick={() => { setEditingDiscountIndex(i); setOpenDiscountDialog(true); }}>
                            ✎
                          </button>
                          <button className="btn-action btn-delete" title="Delete discount" onClick={() => setAdditiondiscounts((prev) => prev.filter((_, idx) => idx !== i))}>
                            🗑
                          </button>
                          <span>{d.title} ({d.type === "percent" ? `${Math.round(Number(d.value) || 0)}%` : `₹${Number(d.value) || 0}`})</span>
                        </div>
                        <span>
                          - ₹{" "}
                          {d.type === "percent"
                            ? ((grandTotal * (Number(d.value) || 0)) / 100).toFixed(2)
                            : (Number(d.value) || 0).toFixed(2)}
                        </span>
                      </div>
                    ))}
                  </div>
                )}

                <div className="row border-top pt-2">
                  <div className="form-check">
                      <input id="roundOffCheck2" className="form-check-input" type="checkbox" checked={includeRoundOff} onChange={() => setIncludeRoundOff(!includeRoundOff)} />
                      <label htmlFor="roundOffCheck2">Include Round off</label>
                    </div>
                  <div className="col-12 d-flex justify-content-between">
                    <strong>Grand Total</strong> <strong>₹ {finalTotal.toFixed(2)}</strong>
                  </div>
                </div>
              </>
            )}

            <div style={{ display: 'flex', justifyContent: 'space-between', gap: '10px', marginTop: '8px' }}>
              <button className="btn btn-warning rounded-0" 
                    onClick={() => setOpenChargeDialog(true)}
                    >
                + Add Charge
              </button>
              <button className="btn btn-warning rounded-0" onClick={() => setOpenDiscountDialog(true)}>
                + Add Discount
              </button>
            </div>
          </div>

          </div>
        </div>
      </div>

      <div className="container">
          <div className="row">
              <div className="customer-info-container">
                <div className="col-md-3">

                  <h5>Notes</h5>

                  <textarea cols={50}
                   value={note}
                   onChange={(e)=>setNote(e.target.value)}
                  
                  >

                  </textarea>




                </div>

                <div className="col-md-4">
                  <h5>Bank Details</h5>
                  <div style={{ display: 'flex', gap: '8px', marginBottom: '12px', alignItems: 'center' }}>
                    <select 
                      className="form-control"
                      style={{ flex: 1 }}
                      value={selectedBankId || ''}
                      onChange={(e) => setSelectedBankId(e.target.value ? Number(e.target.value) : null)}
                    >
                      <option value="">-- Select Bank Account --</option>
                      {bankDetails && bankDetails.length > 0 ? (
                        bankDetails.map((bank) => (
                          <option key={bank.id} value={bank.id}>
                            {`${bank.branch ? '  ' + bank.branch : ''}${bank.accountNo ? ' - ' + bank.accountNo : ''}`}
                          </option>
                        ))
                      ) : null}
                    </select>
                    <button 
                      type="button"
                      className="btn btn-sm"
                      style={{
                        background: '#1e7b5a',
                        color: '#fff',
                        border: 'none',
                        borderRadius: '4px',
                        padding: '6px 10px',
                        cursor: 'pointer',
                        fontSize: '18px',
                        lineHeight: 1,
                        flexShrink: 0,
                      }}
                      onClick={handleOpenBankModal}
                      title="Add new bank account"
                    >
                      +
                    </button>
                  </div>
                  <div style={{ maxHeight: '200px', overflowY: 'auto' }}>
                    {selectedBankId ? (
                      selectedBank ? (
                        <div key={selectedBank.id} style={{
                          padding: '10px',
                          marginBottom: '8px',
                          background: '#f0f8f5',
                          border: '1px solid #c8e6c9',
                          borderRadius: '4px',
                          fontSize: '12px',
                          position: 'relative',
                        }}>
                          <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start'}}>
                            <div>
                              <div>Bank Name : {selectedBank.bankName}</div>
                              <div>Account No : {selectedBank.accountNo}</div>
                              {selectedBank.branch && <div>Branch: {selectedBank.branch}</div>}
                              {selectedBank.ifsc && <div>IFSC: {selectedBank.ifsc}</div>}
                              {selectedBank.swiftCode && <div>SWIFT Code: {selectedBank.swiftCode}</div>}
                            </div>
                            <div style={{marginLeft: '8px', display: 'flex', gap: '6px'}}>
                              <button
                                type="button"
                                title="Edit bank details"
                                onClick={() => handleOpenBankModal(selectedBank)}
                                style={{
                                  border: 'none',
                                  background: 'transparent',
                                  cursor: 'pointer',
                                  padding: '4px',
                                  color: '#1976d2',
                                  fontSize: '16px'
                                }}
                              >
                                ✎
                              </button>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div style={{ color: '#999', fontSize: '12px', fontStyle: 'italic' }}>
                          No bank details added for selected account
                        </div>
                      )
                    ) : null}
                  </div>
                </div>
              </div>
          </div>
          <div className="row">
            <div className="col-md-12">
              <label>Upload File :</label>
              {attachmentPath && (
                <div style={{ marginBottom: '8px', padding: '8px', backgroundColor: '#f0f0f0', borderRadius: '4px' }}>
                  <span style={{ marginRight: '10px' }}>Current file:</span>
                  <a 
                    href={`${BASE_URL}/${attachmentPath}`} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    style={{ color: '#1976d2', textDecoration: 'none' }}
                  >
                    {attachmentPath.split('/').pop()}
                  </a>
                  <span style={{ marginLeft: '10px', fontSize: '12px', color: '#666' }}>
                    (Upload new file to replace)
                  </span>
                </div>
              )}
              <input
                type="file"
                accept=".pdf,.doc,.docx"
                onChange={(e) => setSelectedFile(e.target.files[0])}
              />
              {selectedFile && (
                <div style={{ marginTop: '8px', fontSize: '12px', color: '#28a745' }}>
                  New file selected: {selectedFile.name}
                  <button
                    type="button"
                    onClick={() => setSelectedFile(null)}
                    style={{
                      marginLeft: '10px',
                      fontSize: '12px',
                      padding: '2px 6px',
                      backgroundColor: '#dc3545',
                      color: '#fff',
                      border: 'none',
                      borderRadius: '3px',
                      cursor: 'pointer'
                    }}
                  >
                    Clear
                  </button>
                </div>
              )}
            </div>
          </div>

          <div className="row">
            <div className="customer-info-container">
              <h5>Next Actions</h5>
              <div className="col-md-12">
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
                  <input className="form-check-input" type="checkbox" value="" id="2" />
                <label className="form-check-label" htmlFor="2">
                  Share By Email
                </label>
              </div>


              <div className="form-check">
                  <input className="form-check-input" type="checkbox" value="" id="3" />
                <label className="form-check-label" htmlFor="3">
                  Share By Whats App
                </label>
              </div>


              <div className="form-check">
                  <input className="form-check-input" type="checkbox" value="" id="4" />
                <label className="form-check-label" htmlFor="4">
                  Print Document After save
                </label>
              </div>



              <div className="form-check">
                  <input className="form-check-input" type="checkbox" value="" id="5" />
                <label className="form-check-label" htmlFor="5">
                  Alert me on Openning
                </label>
              </div>
              </div>
            </div>
<div className="footer-button">
                {isEditMode && (
                  <button className="btn btn--save ml-4" onClick={handleSaveQuotation} disabled={saving}>
                    <MdEdit /> Update
                  </button>
                )}

                <button className="btn btn--save ml-4" onClick={handleSaveQuotation} disabled={saving}>
                  <FaCheck /> Save
                </button>

                <button className="btn btn--save ml-4" onClick={async ()=>{
                  await handleSaveQuotation();
                  // reset form for new quotation
                  setSelectedCustomer(null);
                  setTableItems([]);
                  setGrandTotal(0);
                }} disabled={saving}>
                  <FaCheck /> Save & Add New
                </button>
              </div>
          </div>
        </div>



      

      {/* Address Add Modal */}
      {addressModalOpen && (
        <div className="custom-modal" onClick={() => setAddressModalOpen(false)}>
          <div className="modal-box address-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h6>Add Address</h6>
              <button className="btn" onClick={() => setAddressModalOpen(false)}>✕</button>
            </div>

            <div className="modal-body">
              <div className="mb-8">
                <label>Title</label>
                <input className="form-control" value={addressForm.title} onChange={(e) => setAddressForm(prev => ({ ...prev, title: e.target.value }))} />
                <div style={{ marginTop: 8 }}>
                  <label style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                    <input
                      type="checkbox"
                      checked={!!addressForm.show_title_on_print}
                      onChange={(e) => setAddressForm(prev => ({ ...prev, show_title_on_print: e.target.checked }))}
                    />
                    <span>show title on print</span>
                  </label>
                </div>
              </div> 

              <div className="mb-8">
                <label>Address</label>
                <input className="form-control" placeholder="Line1" value={addressForm.address1} onChange={(e) => setAddressForm(prev => ({ ...prev, address1: e.target.value }))} />
                <input className="form-control mb-8" placeholder="Line2" value={addressForm.address2} onChange={(e) => setAddressForm(prev => ({ ...prev, address2: e.target.value }))} />
              </div>

              <div className="mb-8">
                <label>City</label>
                <input className="form-control" value={addressForm.city} onChange={(e) => setAddressForm(prev => ({ ...prev, city: e.target.value }))} />
              </div>

              <div className="grid-2">
                <div>
                  <label>Country</label>
                  <SearchableSelect
                    options={countries}
                    value={addressForm.country}
                    onChange={(val) => setAddressForm(prev => ({ ...prev, country: val }))}
                    placeholder="Select country"
                  />
                </div>
                <div>
                  <label>State</label>
                  {addressForm.country === 'India' ? (
                    <SearchableSelect
                      options={indianStates}
                      value={addressForm.state}
                      onChange={(val) => setAddressForm(prev => ({ ...prev, state: val }))}
                      placeholder="Select state"
                    />
                  ) : (
                    <SearchableSelect
                      options={[]}
                      value={addressForm.state}
                      onChange={(val) => setAddressForm(prev => ({ ...prev, state: val }))}
                      placeholder="Type state"
                      allowCustom={true}
                    />
                  )}
                </div>
              </div>

              <div className="grid-2">
                <div>
                  <label>Pincode</label>
                  <input className="form-control" value={addressForm.postal_code} onChange={(e) => setAddressForm(prev => ({ ...prev, postal_code: e.target.value }))} />
                </div>
                <div>
                  <label>GSTIN</label>
                  <input className="form-control" value={addressForm.gst_in} onChange={(e) => setAddressForm(prev => ({ ...prev, gst_in: e.target.value }))} />
                </div>
              </div>

              <div className="mb-8">
                <label>Extra Field (e.g. Mobile: 9000012345)</label>
                <div className="grid-extra">
                  <input className="form-control" placeholder="Key" value={addressForm.extra_key} onChange={(e) => setAddressForm(prev => ({ ...prev, extra_key: e.target.value }))} />
                  <input className="form-control" placeholder="Value" value={addressForm.extra_value} onChange={(e) => setAddressForm(prev => ({ ...prev, extra_value: e.target.value }))} />
                </div>
              </div>
            </div>

            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setAddressModalOpen(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={saveAddressModal}>Save</button>
            </div>
          </div>
        </div>
      )}
      {/* modal  */}

      {openPrintConfig && (
        <PrintSettingsDialog
          onClose={handleClosePrintConfig}
          initialConfig={printConfig}
          onSave={handleSavePrintConfig}
          docType={docType}
        />
      )}

      {/* Modal for search + table */}
      {open && (
        <div className="custom-modal" onClick={handleClose}>
          <div className="modal-box modal-width-500 customer-modal-box" onClick={(e) => e.stopPropagation()}>
            <div className="customer-modal-header">
              <h5 className="modal-title">Select Customer</h5>
              <button className="modal-close-btn" onClick={handleClose}>✕</button>
            </div>

            <input
              type="text"
              className="form-control customer-search-input"
              placeholder="Search"
              value={search}
              onChange={handleSearch}
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
      )}



    




      {/* Product Modal */}
      {openProdTable && (
        <div className="custom-modal" onClick={handleProdClose}>
          <div className="modal-box modal-width-800 modal-scroll" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h5 style={{ margin: 0 }}>Select Item</h5>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <button
                    type="button"
                    className="btn btn--print"
                    onClick={() => setProductLayout((p) => (p === 'list' ? 'grid' : 'list'))}
                  >
                    Change Layout
                  </button>
                  <button className="btn" onClick={handleProdClose}>✕</button>
                </div>
            </div>
            <input
              type="text"
              className="form-control"
              placeholder="Search Products"
              value={prodsearch}
              onChange={handleProductSearch}
            />

            {/* Layout: list (default) or grid */}
            {productLayout === 'list' ? (
              products.map((prod) => (
                <div
                  key={prod.ID}
                  className="product-row"
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <input
                      type="checkbox"
                      checked={selectedProductIds.includes(prod.ID)}
                      onChange={() => toggleProductSelection(prod.ID)}
                      onClick={(e) => e.stopPropagation()}
                    />
                    <div style={{ flex: 1, cursor: 'pointer' }} onClick={() => openBillingModalForProduct(prod)}>
                      <div style={{ fontWeight: 600 }}>{prod.Code ? prod.Code : ""}</div>
                      <div>{prod.Name || ''}</div>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div>
                <div className="filters-row" style={{ display: 'flex', gap: 8, margin: '8px 0' }}>
                  <div style={{ flex: 1 }}>
                    <SearchableSelect
                      options={Array.from(new Set(products.map(p => (p.Category?.Name || p.CategoryName || p.Category || '').toString()).filter(Boolean)))}
                      value={selectedCategoryFilter}
                      onChange={(v) => { setSelectedCategoryFilter(v); setSelectedSubcategoryFilter(''); }}
                      placeholder="Category"
                    />
                  </div>
                  <div style={{ flex: 1 }}>
                    <SearchableSelect
                      options={Array.from(new Set(products
                        .filter(p => !selectedCategoryFilter || ((p.Category?.Name || p.CategoryName || p.Category || '').toString() === selectedCategoryFilter))
                        .map(p => (p.SubCategory?.Name || p.SubCategoryName || p.SubCategory || '').toString()).filter(Boolean)
                      ))}
                      value={selectedSubcategoryFilter}
                      onChange={(v) => setSelectedSubcategoryFilter(v)}
                      placeholder="Sub Category"
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
                        <div style={{ display: 'flex', alignItems: 'center', width: '100%', gap: 8 }}>
                          <input
                            type="checkbox"
                            checked={selectedProductIds.includes(prod.ID)}
                            onChange={() => toggleProductSelection(prod.ID)}
                            onClick={(e) => e.stopPropagation()}
                          />
                          <div style={{ flex: 1, cursor: 'pointer' }} onClick={() => openBillingModalForProduct(prod)}>
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

            <div className="mt-12">
              <button
                type="button"
                className="btn btn-success add-another"
                onClick={() => {
                  handleProdClose();
                  window.open(`${window.location.origin}/ManageProduct?productType=Stock`, '_blank');
                }}
              >
                + Add Stock Item
              </button>
              <button
                type="button"
                className="btn btn-primary add-another ml-8"
                onClick={addSelectedProducts}
                disabled={selectedProductIds.length === 0}
                style={{ marginLeft: 8 }}
              >
                Add Selected ({selectedProductIds.length})
              </button>
              <button
                type="button"
                className="btn btn-success add-another ml-8"
                onClick={() => {
                  handleProdClose();
                  setOpenAddServiceModal(true);
                }}
              >
                + Add Service / Non-Stock Item
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Billing Item Modal (open when selecting a product) */}
      {billingModalOpen && billingModalProduct && (
        <div className="custom-modal" onClick={() => setBillingModalOpen(false)}>
          <div className="modal-box modal-width-520 modal-scroll" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h5>Update Billing Item</h5>
              <button className="btn" onClick={() => setBillingModalOpen(false)}>✕</button>
            </div>

            <div className="mt-8">
              <div className="mb-8">
                <label>Item</label>
                <input className="form-control" value={billingModalProduct.Name} readOnly />
              </div>

              <div className="mb-8">
                <label>Description</label>
                <textarea className="form-control" rows={3} value={billingModalValues.desc} onChange={(e) => setBillingModalValues(prev => ({ ...prev, desc: e.target.value }))} />
              </div>

              <div className="grid-3">
                <div>
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
                <div>
                  <label>Unit</label>
                  <input className="form-control" value={billingModalValues.unit} readOnly />
                </div>
                <div>
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
                <div>
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
                <div>
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
                <div>
                  <label>Lead Time</label>
                  <input className="form-control" value={billingModalValues.leadTime} onChange={(e) => setBillingModalValues(prev => ({ ...prev, leadTime: e.target.value }))} />
                </div>
              </div>

              <div className="grid-2">
                <div>
                  <label>HSN/SAC</label>
                  <input className="form-control" value={billingModalValues.hsn} readOnly />
                </div>
                <div>
                  <label>GST (%)</label>
                  <input type="text" className="form-control" value={billingModalValues.gst} readOnly />
                </div>
              </div>

              <div className="flex-center-gap-12">
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
                    const taxRes = gstCalculation(taxable, gstPercent, sellerGSTIN, buyerGSTIN);
                    return taxRes.grandTotal.toFixed(2);
                  })()}</div>
              </div>
            </div>

            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setBillingModalOpen(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={handleBillingModalSave}>Update</button>
            </div>
          </div>
        </div>
      )}

        {/* Add Service / Non-Stock Item Modal */}
        {openAddServiceModal && (
          <div className="custom-modal" onClick={() => setOpenAddServiceModal(false)}>
            <div className="modal-box modal-width-450 modal-scroll" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h5>Add Item</h5>
                <button className="btn" onClick={() => setOpenAddServiceModal(false)}>✕</button>
              </div>

              <div className="modal-body">
                <div className="mb-8">
                  <label>Item Name*</label>
                  <input className="form-control" value={addServiceValues.name} onChange={(e) => setAddServiceValues(prev => ({ ...prev, name: e.target.value }))} />
                </div>

                <div className="mb-8">
                  <label>Description</label>
                  <textarea className="form-control" rows={4} value={addServiceValues.description} onChange={(e) => setAddServiceValues(prev => ({ ...prev, description: e.target.value }))} />
                </div>

                <div className="grid-3">
                  <div>
                    <label>Rate*</label>
                    <input type="text" className="form-control" value={addServiceValues.rate} onChange={(e) => setAddServiceValues(prev => ({ ...prev, rate: e.target.value }))} />
                  </div>
                  <div>
                    <label>Unit</label>
                    <input className="form-control" value={addServiceValues.unit} onChange={(e) => setAddServiceValues(prev => ({ ...prev, unit: e.target.value }))} />
                  </div>
                  <div>
                    <label>Qty</label>
                    <input type="text" className="form-control" value={addServiceValues.qty} onChange={(e) => setAddServiceValues(prev => ({ ...prev, qty: e.target.value }))} />
                  </div>
                </div>

                <div className="grid-2 mt-8">
                  <div>
                    <label>HSN/SAC</label>
                    <input className="form-control" value={addServiceValues.hsn} onChange={(e) => setAddServiceValues(prev => ({ ...prev, hsn: e.target.value }))} />
                  </div>
                  <div>
                    <label>GST (%)</label>
                    <input type="text" className="form-control" value={addServiceValues.gst} onChange={(e) => setAddServiceValues(prev => ({ ...prev, gst: e.target.value }))} />
                  </div>
                </div>
              </div>

              <div className="modal-footer">
                <button className="btn btn-secondary" onClick={() => setOpenAddServiceModal(false)}>Cancel</button>
                <button className="btn btn-primary" onClick={handleSaveAddService}>Save</button>
              </div>
            </div>
          </div>
        )}

{/* Charges Dialog */}
{openChargeDialog && (
  <div className="custom-modal" onClick={() => setOpenChargeDialog(false)}>
    <div className="modal-box modal-width-450 modal-scroll" onClick={(e) => e.stopPropagation()}>
      <h6>Add Extra Charges</h6>

      {extrcharges.map((ch, i) => (
        <div key={i} className="flex-gap-8">
          <input className="form-control" placeholder="Title" value={ch.title} onChange={(e) => setExtraCharges((prev) => prev.map((c, idx) => idx === i ? { ...c, title: e.target.value } : c))} />
          <select className="form-control select-width-120" value={ch.type} onChange={(e) => setExtraCharges((prev) => prev.map((c, idx) => idx === i ? { ...c, type: e.target.value } : c))}>
            <option value="percent">%</option>
            <option value="item">₹</option>
          </select>
          <input className="form-control" type="number" placeholder="Amount" value={ch.value} onChange={(e) => setExtraCharges((prev) => prev.map((c, idx) => idx === i ? { ...c, value: Number(e.target.value) } : c))} />
          <button className="btn btn-danger" onClick={() => setExtraCharges((prev) => prev.filter((_, idx) => idx !== i))}>×</button>
        </div>
      ))}
      <div className="mb-8">
        <button className="btn btn-outline-secondary" onClick={() => setExtraCharges((prev) => [...prev, { title: "", type: "percent", value: '' }])}>+ Add Row</button>
      </div>

      <div className="text-right mt-8">
        <button className="btn btn-primary" onClick={() => setOpenChargeDialog(false)}>Done</button>
      </div>
    </div>
  </div>
)}

{/* Discounts Dialog */}
{openDiscountDialog && (
  <div className="custom-modal" onClick={() => setOpenDiscountDialog(false)}>
    <div className="modal-box modal-width-450 modal-scroll" onClick={(e) => e.stopPropagation()}>
      <h6>Add Discounts</h6>

      {additiondiscounts.map((ds, i) => (
        <div key={i} className="flex-gap-8">
          <input className="form-control" placeholder="Title" value={ds.title} onChange={(e) => setAdditiondiscounts((prev) => prev.map((d, idx) => idx === i ? { ...d, title: e.target.value } : d))} />
          <select className="form-control select-width-120" value={ds.type} onChange={(e) => setAdditiondiscounts((prev) => prev.map((d, idx) => idx === i ? { ...d, type: e.target.value, value: sanitizeNumericValue(d.value) } : d))}>
            <option value="percent">%</option>
            <option value="item">₹</option>
          </select>
          <input className="form-control" type="number" placeholder="Amount" value={ds.value} onChange={(e) => setAdditiondiscounts((prev) => prev.map((d, idx) => idx === i ? { ...d, value: e.target.value === '' ? '' : Number(e.target.value) } : d))} />
          <button className="btn btn-danger" onClick={() => setAdditiondiscounts((prev) => prev.filter((_, idx) => idx !== i))}>×</button>
        </div>
      ))}
      <div className="mb-8">
        <button className="btn btn-outline-secondary" onClick={() => setAdditiondiscounts((prev) => [...prev, { title: "", type: "percent", value: '' }])}>+ Add Row</button>
      </div>

      <div className="text-right mt-8">
        <button className="btn btn-primary" onClick={() => setOpenDiscountDialog(false)}>Done</button>
      </div>
    </div>
  </div>
)}

{/* Bank Details Modal */}
{openBankModal && (
  <div className="custom-modal">
    <div className="modal-box address-modal">
      <div className="modal-header">
        <h5>Add a Bank Detail</h5>
        <button 
          type="button" 
          style={{
            background: 'none',
            border: 'none',
            fontSize: '24px',
            cursor: 'pointer',
            color: '#999',
          }}
          onClick={handleCloseBankModal}
        >
          ×
        </button>
      </div>

      <div className="modal-body">
        <div className="form-group">
          <label>Title</label>
          <input
            className="form-control"
            type="text"
            placeholder="Enter title (e.g., Primary, Secondary)"
            value={bankFormValues.title}
            onChange={(e) => setBankFormValues({ ...bankFormValues, title: e.target.value })}
          />
        </div>

        <div className="form-group">
          <label>Bank Name</label>
          <input
            className="form-control"
            type="text"
            placeholder="Enter bank name"
            value={bankFormValues.bankName}
            onChange={(e) => setBankFormValues({ ...bankFormValues, bankName: e.target.value })}
          />
        </div>

        <div className="form-group">
          <label>Account No.</label>
          <input
            className="form-control"
            type="text"
            placeholder="Enter account number"
            value={bankFormValues.accountNo}
            onChange={(e) => setBankFormValues({ ...bankFormValues, accountNo: e.target.value })}
          />
        </div>

        <div className="form-group">
          <label>Branch</label>
          <input
            className="form-control"
            type="text"
            placeholder="Enter branch"
            value={bankFormValues.branch}
            onChange={(e) => setBankFormValues({ ...bankFormValues, branch: e.target.value })}
          />
        </div>

        <div className="form-group">
          <label>IFSC</label>
          <input
            className="form-control"
            type="text"
            placeholder="Enter IFSC code"
            value={bankFormValues.ifsc}
            onChange={(e) => setBankFormValues({ ...bankFormValues, ifsc: e.target.value })}
          />
        </div>

        <div className="form-group">
          <label>SWIFT Code</label>
          <input
            className="form-control"
            type="text"
            placeholder="Enter SWIFT code"
            value={bankFormValues.swiftCode}
            onChange={(e) => setBankFormValues({ ...bankFormValues, swiftCode: e.target.value })}
          />
        </div>
      </div>

      <div className="modal-footer">
        <button 
          className="btn btn-secondary" 
          onClick={handleCloseBankModal}
          style={{
            background: '#f8f9fa',
            color: '#333',
            border: '1px solid #e6e9ef',
            padding: '8px 16px',
            borderRadius: '4px',
            cursor: 'pointer',
          }}
        >
          Cancel
        </button>
        <button 
          className="btn btn-success" 
          onClick={handleSaveBankDetails}
          style={{
            background: '#28a745',
            color: '#fff',
            border: 'none',
            padding: '8px 16px',
            borderRadius: '4px',
            cursor: 'pointer',
          }}
        >
          Save
        </button>
      </div>
    </div>
  </div>
)}

{showTemplateModal && (
  <div className="modal-overlay">
    <div className="modal-content" style={{ width: '400px' }}>
      <div className="modal-header">
        <h3>Save as Template</h3>
        <button onClick={() => setShowTemplateModal(false)} className="close-btn">&times;</button>
      </div>
      <div className="modal-body">
        <div className="form-group">
          <label>Template Name:</label>
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
        <button className="btn btn--back" onClick={() => setShowTemplateModal(false)}>Cancel</button>
        <button className="btn btn--save ml-2" onClick={handleSaveAsTemplate} disabled={saving}>
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

    </section>

  );
};

export default AddQutation;