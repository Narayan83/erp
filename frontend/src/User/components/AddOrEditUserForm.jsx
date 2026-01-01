import React, { useEffect, Fragment } from "react";
import { useForm, Controller, useWatch } from "react-hook-form";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { BASE_URL } from "../../config/Config";
import industries from "../industries.json";
import dialCodeToCountry from "../utils/dialCodeToCountry";
import countries from "../utils/countries";
import citiesList from "../utils/cities-name-list.json";
import Cropper from "react-easy-crop";
import "./addoredituserform.scss";

const salutations = ["Mr", "Mrs", "Miss", "Dr", "Prof"];

const documentTypes = [
  "Passport",
  "Aadhaar Card",
  "PAN Card",
  "Driving License",
  "Voter ID",
  "Bank Statement",
  "Address Proof",
  "Photo",
  "Certificate",
  "Other"
];

// Add account types array for the dropdown
const accountTypes = [
  { label: "Customer", value: "is_customer" },
  { label: "Supplier", value: "is_supplier" },
  { label: "Dealer", value: "is_dealer" },
  { label: "Distributor", value: "is_distributor" },
];

const AddOrEditUserForm = ({ defaultValues = null, hierarchy = [], onSubmitUser }) => {
  const navigate = useNavigate();
  const {
  register,
  handleSubmit,
  control,
  reset,
  watch,
  getValues,
  trigger,
  setValue,
  clearErrors,
  setError,
    formState: { isDirty, errors },
  } = useForm({
    mode: 'onChange',
    defaultValues: {
      is_user: false,
      is_customer: false,
      is_supplier: false,
      is_employee: false,
      is_dealer: false,
      is_distributor: false,
      supplier_id: null,
      active: true,
      salutation: "",
      gender: "",
      username: "",
      usercode: "",
  account_types: "", // single-selection account type
  under_type: "", // none | distributor | dealer | supplier
      distributor_id: null, // For customer-distributor relationship
      dealer_id: null, // For distributor-dealer relationship
      permanent_country: "",
      permanent_country_code: "",
      permanent_gstin: "",
      country: "",
      country_code: "",
    gstin: "",
    // Legal information fields
    aadhar_number: "",
    pan_number: "",
    gstin_number: "",
    msme_no: "",
      // all your controlled values
  }
  ,
  // Keep fields registered even when inputs unmount (e.g., tab panels)
  shouldUnregister: false,
});

  // Ref to the form so we can programmatically disable browser autocomplete/ autofill
  const formRef = React.useRef(null);

  // When mounted, enforce autocomplete/off and related attributes on all inputs
  // and add hidden dummy username/password inputs to further reduce browser autofill.
  React.useEffect(() => {
    const form = formRef.current;
    if (!form) return;

    // Create hidden dummy fields (some browsers need visible-but-offscreen inputs)
    const createDummy = (type, name, ac) => {
      const el = document.createElement('input');
      el.type = type;
      el.name = name;
      el.autocomplete = ac;
      // place it off-screen but present in DOM
      el.style.position = 'absolute';
      el.style.left = '-9999px';
      el.style.top = '-9999px';
      el.style.width = '1px';
      el.style.height = '1px';
      el.style.opacity = '0';
      el.setAttribute('aria-hidden', 'true');
      return el;
    };

    const usernameDummy = createDummy('text', 'prevent_autofill_username', 'username');
    const passwordDummy = createDummy('password', 'prevent_autofill_password', 'new-password');

    // Prepend dummies so browser sees them first
    try {
      form.prepend(passwordDummy);
      form.prepend(usernameDummy);
    } catch (e) {
      // ignore
    }

    // Apply attributes to all interactive fields inside the form
    const elems = form.querySelectorAll('input, textarea, select');
    elems.forEach((el) => {
      try {
        el.setAttribute('autocomplete', 'off');
        el.setAttribute('autocorrect', 'off');
        el.setAttribute('autocapitalize', 'off');
        el.setAttribute('spellcheck', 'false');
      } catch (e) {
        // ignore immutable fields
      }
    });

    return () => {
      try { usernameDummy.remove(); } catch (e) {}
      try { passwordDummy.remove(); } catch (e) {}
    };
  }, []);


  // Additional addresses state and handlers
  const [additionalAddresses, setAdditionalAddresses] = React.useState(defaultValues?.additional_addresses || []);
  // Additional bank info state and handlers
  const [additionalBankInfos, setAdditionalBankInfos] = React.useState([]);
  // Additional account types state
  const [additionalAccountTypes, setAdditionalAccountTypes] = React.useState([]);
  // Per-additional-slot relations: store selected distributor/dealer ids for each extra slot
  const [additionalSlotDistributorIds, setAdditionalSlotDistributorIds] = React.useState([]);
  const [additionalSlotDealerIds, setAdditionalSlotDealerIds] = React.useState([]);
  // Documents state
  const [uploadedDocuments, setUploadedDocuments] = React.useState([]);
  
  // Image crop dialog state
  const [cropDialogOpen, setCropDialogOpen] = React.useState(false);
  const [cropImage, setCropImage] = React.useState(null);
  const [cropImageId, setCropImageId] = React.useState(null);
  const [crop, setCrop] = React.useState({ x: 0, y: 0 });
  const [zoom, setZoom] = React.useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = React.useState(null);
  const [imageLoaded, setImageLoaded] = React.useState(false);

  // Password visibility state
  const [showPassword, setShowPassword] = React.useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = React.useState(false);

  const handleClickShowPassword = () => setShowPassword((show) => !show);
  const handleClickShowConfirmPassword = () => setShowConfirmPassword((show) => !show);
  const handleMouseDownPassword = (event) => { event.preventDefault(); };

  const handleAddAdditionalAddress = () => {
    setAdditionalAddresses([...additionalAddresses, {}]);
  };

  const handleRemoveAdditionalAddress = (idx) => {
    setAdditionalAddresses(additionalAddresses.filter((_, i) => i !== idx));
  };

  const handleAdditionalAddressChange = (idx, field, value) => {
    setAdditionalAddresses(addresses => {
      const updated = [...addresses];
      updated[idx] = { ...updated[idx], [field]: value };
      return updated;
    });
  };

  const handleAddAdditionalAccountType = () => {
    // Get all selected account types (primary + additional)
    const selectedTypes = [watch("account_types"), ...additionalAccountTypes].filter(Boolean);
    // Check if there are available types to add
    const availableTypes = accountTypes.filter(type => !selectedTypes.includes(type.value));
    
    if (availableTypes.length === 0) {
      alert('All account types have already been selected.');
      return;
    }
    
    setAdditionalAccountTypes([...additionalAccountTypes, ""]);
    // keep per-slot arrays aligned
    setAdditionalSlotDistributorIds(prev => [...prev, null]);
    setAdditionalSlotDealerIds(prev => [...prev, null]);
  };

  const handleRemoveAdditionalAccountType = (idx) => {
    const removedType = additionalAccountTypes[idx];
    setAdditionalAccountTypes(additionalAccountTypes.filter((_, i) => i !== idx));
    // remove aligned per-slot selections
    setAdditionalSlotDistributorIds(prev => prev.filter((_, i) => i !== idx));
    setAdditionalSlotDealerIds(prev => prev.filter((_, i) => i !== idx));
    
    // Set the removed account type to false if it's not selected elsewhere
    if (removedType) {
      const primaryType = watch("account_types");
      const remainingAdditional = additionalAccountTypes.filter((_, i) => i !== idx);
      const isStillSelected = primaryType === removedType || remainingAdditional.includes(removedType);
      if (!isStillSelected) {
        setValue(removedType, false);
      }
    }
  };

  const handleAdditionalAccountTypeChange = (idx, value) => {
    const oldValue = additionalAccountTypes[idx];
    setAdditionalAccountTypes(types => {
      const updated = [...types];
      updated[idx] = value;
      return updated;
    });
    
    // Set the new account type to true
    if (value) {
      setValue(value, true);
    }
    
    // Set the old account type to false if it's not selected elsewhere
    if (oldValue && oldValue !== value) {
      const primaryType = watch("account_types");
      const otherAdditional = additionalAccountTypes.filter((_, i) => i !== idx);
      const isStillSelected = primaryType === oldValue || otherAdditional.includes(oldValue);
      if (!isStillSelected) {
        setValue(oldValue, false);
      }
    }
    // Reset any per-slot relation values when type changes
    if (value !== 'is_dealer') {
      setAdditionalSlotDistributorIds(prev => prev.map((v, i) => i === idx ? null : v));
    }
    if (value !== 'is_customer') {
      setAdditionalSlotDealerIds(prev => prev.map((v, i) => i === idx ? null : v));
    }
  };
    
  const isUser = watch("is_user", false); // default to false
  const watchedAccountTypesLocal = watch("account_types", "");
  // Keep the primary-derived booleans primary-only so the main (top) dependent
  // fields only respond to the primary account type. Additional slots will
  // render their own dependent selectors next to the slot.
  const isDealerSelected = String(watchedAccountTypesLocal) === "is_dealer";
  const isSupplierSelected = String(watchedAccountTypesLocal) === "is_supplier";
  const isDistributorSelected = String(watchedAccountTypesLocal) === "is_distributor";
  const isUserSelected = String(watchedAccountTypesLocal) === "is_user";
  const sameAsPermanent = watch("same_as_permanent");
  const activeStatus = watch("active", true);
  const permanentCountry = watch("permanent_country", "");

  // User lists state
  const [distributors, setDistributors] = React.useState([]);
  const [isLoadingDistributors, setIsLoadingDistributors] = React.useState(false);
  const [dealers, setDealers] = React.useState([]);
  const [isLoadingDealers, setIsLoadingDealers] = React.useState(false);
  const [suppliers, setSuppliers] = React.useState([]);
  const [isLoadingSuppliers, setIsLoadingSuppliers] = React.useState(false);
  const [underOptions, setUnderOptions] = React.useState([]);
  const [isLoadingUnderOptions, setIsLoadingUnderOptions] = React.useState(false);
  // Executives (non-head employees) used for "Assign to Executive" field
  const [executives, setExecutives] = React.useState([]);
  const [isLoadingExecutives, setIsLoadingExecutives] = React.useState(false);
  // Departments list fetched from backend and currently selected department
  const [departmentsList, setDepartmentsList] = React.useState([]);
  const assignedDepartment = watch("assigned_department_id", "");

  // Fetch departments (unpaginated) so dropdown shows saved departments
  React.useEffect(() => {
    let cancelled = false;
    const fetchDepartments = async () => {
      try {
        const params = { page: 1, limit: 1000 };
        const resp = await axios.get(`${BASE_URL}/departments`, { params });
        const payload = resp.data.departments || resp.data || [];
        const list = Array.isArray(payload) ? payload : [];
        if (!cancelled) setDepartmentsList(list);
      } catch (err) {
        console.warn('Failed to fetch departments for executive dropdown', err);
        if (!cancelled) setDepartmentsList([]);
      }
    };
    fetchDepartments();
    return () => { cancelled = true; };
  }, []);

  // Executive options depend on the current `executives` state which already
  // contains the head + department employees when a department is selected.
  const filteredExecutives = React.useMemo(() => executives || [], [executives]);
  

  // Watch customer selection and distributor selection for enabling dropdowns
  const isCustomerSelected = String(watchedAccountTypesLocal) === "is_customer";
  const underType = watch("under_type", "");
  const selectedDistributorId = watch("distributor_id", null);
  const hasSelectedDistributor = !!selectedDistributorId;
  const selectedDealerId = watch("dealer_id", null);
  const selectedSupplierId = watch("supplier_id", null);

  // If account type is not customer, ensure dealer selection is cleared
  useEffect(() => {
    if (!isCustomerSelected) {
      setValue('dealer_id', null);
      setValue('under_type', '');
    }
  }, [isCustomerSelected, setValue]);

  // Fetch distributors when customer/dealer (primary or additional) is selected
  useEffect(() => {
    let cancelled = false;
    const fetchDistributors = async () => {
      setIsLoadingDistributors(true);
      try {
        const resp = await axios.get(`${BASE_URL}/api/users`, { params: { user_type: 'distributor', limit: 1000 } });
        if (!cancelled) {
          // expect backend returns { data: users, total, ... } per GetAllUsers
          const users = Array.isArray(resp.data.data) ? resp.data.data : resp.data;
          // Add a "Direct Distributor" option at the top so dealers can be marked as direct even
          // when there are no existing distributors fetched from backend.
          const directOption = { id: 'direct', username: 'Direct Dealer' };
          const merged = [directOption].concat(users || []);
          setDistributors(merged);
          // also update underOptions if underType === 'distributor'
          if (underType === 'distributor') setUnderOptions(merged);
        }
      } catch (err) {
        console.error('Failed to fetch distributors', err);
        // On error, at least expose the Direct Distributor option so dealers can still be created
        setDistributors([{ id: 'direct', username: 'Direct Dealer' }]);
      } finally {
        if (!cancelled) {
          setIsLoadingDistributors(false);
        }
      }
    };

    // fetch when dealer or customer is selected either as primary or as an additional slot
    if (
      isDealerSelected ||
      isCustomerSelected ||
      additionalAccountTypes.includes('is_dealer') ||
      additionalAccountTypes.includes('is_customer')
    ) fetchDistributors();

    return () => { cancelled = true; };
  }, [isDealerSelected, isCustomerSelected, additionalAccountTypes, underType]);
  
  // Fetch suppliers when dealer or customer is selected (primary or additional)
  useEffect(() => {
    let cancelled = false;
    const fetchSuppliers = async () => {
      setIsLoadingSuppliers(true);
      try {
        const resp = await axios.get(`${BASE_URL}/api/users`, { params: { user_type: 'supplier', limit: 1000 } });
        const { data } = resp;
        const users = data?.data || data;
        if (!cancelled) {
          setSuppliers(users || []);
          if (underType === 'supplier') setUnderOptions(users || []);
        }
      } catch (err) {
        console.error('Failed to fetch suppliers', err);
        setSuppliers([]);
      } finally {
        if (!cancelled) setIsLoadingSuppliers(false);
      }
    };

    if (
      isDealerSelected ||
      isCustomerSelected ||
      additionalAccountTypes.includes('is_dealer') ||
      additionalAccountTypes.includes('is_customer')
    ) fetchSuppliers();

    return () => { cancelled = true; };
  }, [isDealerSelected, isCustomerSelected, additionalAccountTypes, underType]);
  
  // Fetch dealers when distributor or customer is selected (primary or additional)
  useEffect(() => {
    let cancelled = false;
    const fetchDealers = async () => {
      setIsLoadingDealers(true);
      try {
        const resp = await axios.get(`${BASE_URL}/api/users`, { params: { user_type: 'dealer', limit: 1000 } });
        if (!cancelled) {
          const users = Array.isArray(resp.data.data) ? resp.data.data : resp.data;
          setDealers(users || []);
          if (underType === 'dealer') setUnderOptions(users || []);
        }
      } catch (err) {
        console.error('Failed to fetch dealers', err);
        setDealers([]);
      } finally {
        if (!cancelled) {
          setIsLoadingDealers(false);
        }
      }
    };

    if (
      isDistributorSelected ||
      isCustomerSelected ||
      additionalAccountTypes.includes('is_distributor') ||
      additionalAccountTypes.includes('is_customer')
    ) fetchDealers();

    return () => { cancelled = true; };
  }, [isDistributorSelected, isCustomerSelected, additionalAccountTypes, underType]);

  // Fetch suppliers when requested (and when customer/ dealer selected in primary or additional slots)
  useEffect(() => {
    let cancelled = false;
    const fetchSuppliers = async () => {
      setIsLoadingSuppliers(true);
      try {
        const resp = await axios.get(`${BASE_URL}/api/users`, { params: { user_type: 'supplier', limit: 1000 } });
        if (!cancelled) {
          const users = Array.isArray(resp.data.data) ? resp.data.data : resp.data;
          setSuppliers(users || []);
          if (underType === 'supplier') setUnderOptions(users || []);
        }
      } catch (err) {
        console.error('Failed to fetch suppliers', err);
        setSuppliers([]);
      } finally {
        if (!cancelled) setIsLoadingSuppliers(false);
      }
    };

    if ((isDealerSelected || additionalAccountTypes.includes('is_dealer')) && underType === 'supplier') fetchSuppliers();

    return () => { cancelled = true; };
  }, [underType, isDealerSelected, additionalAccountTypes]);

  // Keep underOptions in sync when underType changes and pre-fetched lists exist
  useEffect(() => {
    if (!isCustomerSelected) {
      setUnderOptions([]);
      return;
    }
    if (underType === 'distributor') setUnderOptions(distributors || []);
    else if (underType === 'dealer') setUnderOptions(dealers || []);
    else if (underType === 'supplier') setUnderOptions(suppliers || []);
    else setUnderOptions([]);
  }, [underType, distributors, dealers, suppliers, isCustomerSelected]);

  // Also fetch appropriate list whenever underType changes (independent fetch)
  useEffect(() => {
    let cancelled = false;
    const fetchList = async () => {
      if (!underType) {
        setUnderOptions([]);
        return;
      }
      setIsLoadingUnderOptions(true);
      try {
        const resp = await axios.get(`${BASE_URL}/api/users`, { params: { user_type: underType, limit: 1000 } });
        if (!cancelled) {
          const users = Array.isArray(resp.data.data) ? resp.data.data : resp.data;
          setUnderOptions(users || []);
        }
      } catch (err) {
        console.error('Failed to fetch under-type users', err);
        if (!cancelled) setUnderOptions([]);
      } finally {
        if (!cancelled) setIsLoadingUnderOptions(false);
      }
    };

    fetchList();
    return () => { cancelled = true; };
  }, [underType]);

  // Fetch executives for the currently selected department (include head + assigned employees).
  // If no department selected, fall back to fetching non-head employees.
  useEffect(() => {
    let cancelled = false;
    const fetchForDepartment = async (deptId) => {
      setIsLoadingExecutives(true);
      try {
        // Try multiple endpoints to get employees for a department
        let employees = [];
        const tryEndpoints = [
          `${BASE_URL}/departments/${deptId}/employees`,
          `${BASE_URL}/api/employees`,
          `${BASE_URL}/employees`,
        ];

        for (const url of tryEndpoints) {
          try {
            const params = url.includes('/departments/') ? {} : { department_id: deptId, limit: 1000 };
            const resp = await axios.get(url, { params });
            const payload = resp.data?.employees || resp.data?.data || resp.data || [];
            employees = Array.isArray(payload) ? payload : [];
            if (employees.length) break;
          } catch (e) {
            // try next
          }
        }

        // Find department object to get head info
        const deptObj = (departmentsList || []).find(d => String(d.id) === String(deptId));
        let head = null;
        if (deptObj) {
          head = deptObj.head || deptObj.head_id || deptObj.headId || null;
        }

        const combined = [];

        // Normalize head id and head object
        let headId = null;
        if (head && typeof head === 'object' && head.id != null) {
          headId = head.id;
          combined.push(head);
        } else if (head) {
          headId = head;
        }

        // If head is an id and not present in employees, try to fetch head record
        if (headId && !(employees || []).some(e => String(e.id) === String(headId))) {
          const headEndpoints = [`${BASE_URL}/api/users/${headId}`, `${BASE_URL}/users/${headId}`, `${BASE_URL}/api/employees/${headId}`, `${BASE_URL}/api/employees/${headId}`];
          for (const hurl of headEndpoints) {
            try {
              const r = await axios.get(hurl);
              const p = r.data?.data || r.data;
              if (p && p.id != null) { combined.push(p); headId = p.id; break; }
            } catch (e) {
              // continue
            }
          }
        }

        // Now attempt to fetch employees assigned to the head (reporting to head)
        const assignedByHead = [];
        if (headId) {
          const managerParamNames = ['manager_id','reporting_to','reporting_to_id','supervisor_id','managerId','assigned_to','head_id'];
          const empEndpoints = [`${BASE_URL}/api/employees`, `${BASE_URL}/api/employees`];
          for (const url of empEndpoints) {
            for (const param of managerParamNames) {
              try {
                const params = { limit: 1000 };
                params[param] = headId;
                const r = await axios.get(url, { params });
                const payload = r.data?.employees || r.data?.data || r.data || [];
                const list = Array.isArray(payload) ? payload : [];
                if (list.length) {
                  list.forEach(i => { if (i && i.id != null) assignedByHead.push(i); });
                  // if we found anything by this param, move on to next endpoint
                  break;
                }
              } catch (e) {
                // try next param
              }
            }
          }
        }

        // Merge employees: head (if any) + assignedByHead + employees (department-level)
        const merged = [];
        const seen = new Set();

        const pushIfNew = (u) => {
          if (!u || u.id == null) return;
          const k = String(u.id);
          if (seen.has(k)) return;
          seen.add(k);
          merged.push(u);
        };

        // head first
        if (headId) {
          const headObj = combined.find(c => String(c.id) === String(headId));
          if (headObj) pushIfNew(headObj);
        }

        // assigned employees to head next
        (assignedByHead || []).forEach(pushIfNew);

        // then department employees
        (employees || []).forEach(pushIfNew);

        if (!cancelled) setExecutives(merged);
      } catch (err) {
        console.error('Failed to fetch executives for department', err);
        if (!cancelled) setExecutives([]);
      } finally {
        if (!cancelled) setIsLoadingExecutives(false);
      }
    };

    const fetchNonHeads = async () => {
      setIsLoadingExecutives(true);
      try {
        const resp = await axios.get(`${BASE_URL}/api/employees/non-heads`);
        const data = resp.data?.data || resp.data;
        if (!cancelled) setExecutives(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error('Failed to fetch executives (non-head employees)', err);
        if (!cancelled) setExecutives([]);
      } finally {
        if (!cancelled) setIsLoadingExecutives(false);
      }
    };

    if (assignedDepartment) {
      fetchForDepartment(assignedDepartment);
    } else {
      fetchNonHeads();
    }

    return () => { cancelled = true; };
  }, [assignedDepartment, departmentsList]);


  // Watch permanent address fields
    const permanentAddress = useWatch({
      control,
      name: [
        "address1", "address2", "address3", "city",
        "state", "permanent_country", "pincode"
      ],
    });


    useEffect(() => {
      console.log("defaultValues:", defaultValues);
    }, [defaultValues]);

  // Reset form with default values if editing
    useEffect(() => {
    if (defaultValues) {
      // Helper: find a document by a list of type variants (case-insensitive, substring match)
      const findDocumentByTypes = (variants = []) => {
        const docs = defaultValues.documents || defaultValues.uploaded_documents || [];
        const lowerVariants = variants.map(v => String(v).toLowerCase());
        return docs.find(d => {
          const t = String(d?.doc_type || d?.type || '').toLowerCase();
          return lowerVariants.some(v => v && t.includes(v));
        }) || null;
      };

      // Helper: get a legal value preferring top-level fields then document properties
      const getLegalFromDocs = (variants = [], topLevelProps = [], docProps = ['doc_number']) => {
        for (const p of topLevelProps) {
          if (defaultValues[p]) return defaultValues[p];
        }
        const doc = findDocumentByTypes(variants);
        if (doc) {
          for (const dp of docProps) {
            if (doc[dp]) return doc[dp];
          }
        }
        return "";
      };

      // Helper: extract country name from string or object.
      // If string contains a phone code in parentheses like "India (+91)", strip the parentheses.
      const getCountryName = (country) => {
        if (!country) return "";
        if (typeof country === 'string') {
          return String(country).replace(/\s*\([^)]*\)\s*$/, '').trim();
        }
        if (typeof country === 'object') return country.name || country.country || country.label || "";
        return "";
      };

      // Helper: extract country code from string or object
      const getCountryCode = (countryOrCode) => {
        if (!countryOrCode) return "";
        if (typeof countryOrCode === 'string') {
          // If it starts with + or is numeric, it's likely a code
          if (/^\+/.test(countryOrCode) || /^\d+$/.test(countryOrCode)) return countryOrCode;
          return "";
        }
        if (typeof countryOrCode === 'object') return countryOrCode.code || countryOrCode.dial_code || countryOrCode.dialCode || countryOrCode.country_code || "";
        return "";
      };

      // Helper: resolve a country NAME from either a name or a dial-code string/object.
      // If input is a dial code ("+91" or "91"), try mapping via dialCodeToCountry.
      const resolveCountryName = (countryOrCode) => {
        if (!countryOrCode) return "";
        // If it's an object, try to extract name first, then code and lookup
        if (typeof countryOrCode === 'object') {
          const name = getCountryName(countryOrCode);
          if (name) return name;
          const code = getCountryCode(countryOrCode);
          if (code) {
            const withPlus = code.startsWith('+') ? code : ('+' + code.replace(/^\+/, ''));
            return dialCodeToCountry[withPlus] || dialCodeToCountry[withPlus.replace(/^\+/, '')] || '';
          }
          return '';
        }
        // string
        const s = String(countryOrCode).trim();
        // If it looks like a dial code (starts with + or digits only or contains '-') try lookup
        if (/^\+?\d[\d-]*$/.test(s)) {
          const withPlus = s.startsWith('+') ? s : ('+' + s.replace(/^\+/, ''));
          return dialCodeToCountry[withPlus] || dialCodeToCountry[withPlus.replace(/^\+/, '')] || '';
        }
        // Otherwise assume it's already a country name
        return s;
      };

      // Helper: resolve a country CODE (dial code) from either a code or a name/object.
      const resolveCountryCode = (countryOrCode) => {
        if (!countryOrCode) return "";
        if (typeof countryOrCode === 'object') {
          const codeFromObj = getCountryCode(countryOrCode);
          if (codeFromObj) return codeFromObj.startsWith('+') ? codeFromObj : ('+' + codeFromObj.replace(/^\+/, ''));
          // attempt lookup by name
          const name = getCountryName(countryOrCode);
          if (name) {
            const found = countries.find(c => c.name.toLowerCase() === name.toLowerCase());
            if (found) return found.code || '';
          }
          return '';
        }
        const s = String(countryOrCode).trim();
        // If it's already a code-ish string, normalize to start with +
        if (/^\+?\d[\d-]*$/.test(s)) {
          return s.startsWith('+') ? s : ('+' + s.replace(/^\+/, ''));
        }
        // If it's a name, try find the code from the countries list
        const found = countries.find(c => c.name.toLowerCase() === s.toLowerCase());
        if (found) return found.code || '';
        // Fallback empty
        return '';
      };

      // Helper: format country name and dial code together.
      // Returns "Name +Code" when both available, or falls back to whichever exists.
      const formatCountryWithCode = (country, country_code) => {
        const nameFromCountry = getCountryName(country);
        let code = getCountryCode(country_code) || getCountryCode(country) || '';

        // Normalize code string
        let codeStr = String(code || '').trim();
        if (codeStr && !codeStr.startsWith('+')) codeStr = '+' + codeStr.replace(/^\+/, '');

        let finalName = nameFromCountry;

        // If name missing but code exists, try lookup from dialCodeToCountry
        if (!finalName && codeStr) {
          // Try both with and without +
          finalName = dialCodeToCountry[codeStr] || dialCodeToCountry[codeStr.replace(/^\+/, '')] || '';
        }

        if (finalName && codeStr) return `${finalName} ${codeStr}`;
        if (finalName) return finalName;
        if (codeStr) return codeStr;
        return '';
      };

      // Find permanent address from addresses array
      const permanentAddr = Array.isArray(defaultValues.addresses)
        ? defaultValues.addresses.find(addr => addr.title === "Permanent")
        : null;

      // Get primary bank account (first one) for primary bank fields
      const primaryBank = Array.isArray(defaultValues.bank_accounts) && defaultValues.bank_accounts.length > 0
        ? defaultValues.bank_accounts[0]
        : null;      reset({
        ...defaultValues,
        dob: defaultValues.dob ? defaultValues.dob.split("T")[0] : "", 
        is_user: !!defaultValues.is_user,
        is_customer: !!defaultValues.is_customer,
        is_supplier: !!defaultValues.is_supplier,
        is_employee: !!defaultValues.is_employee,
        is_dealer: !!defaultValues.is_dealer,
        is_distributor: !!defaultValues.is_distributor,
        active: typeof defaultValues.active === 'boolean' ? defaultValues.active : true,
        username: defaultValues.username || "",
        usercode: defaultValues.usercode || "",
        password: defaultValues.plain_password || "",
        confirmPassword: defaultValues.plain_password || "",
        distributor_id: defaultValues.distributor_id || null,
        dealer_id: defaultValues.dealer_id || null,
        // Business Information
        business_name: defaultValues.business_name || "",
        companyname: defaultValues.company_name || "",
        industry_segment: defaultValues.industry_segment || "",
        designation: defaultValues.designation || "",
        title: defaultValues.title || "",
  // Permanent address fields - use from addresses table if available, fallback to old fields
        address1: permanentAddr?.address1 || defaultValues.permanent_address1 || "",
        address2: permanentAddr?.address2 || defaultValues.permanent_address2 || "",
        address3: permanentAddr?.address3 || defaultValues.permanent_address3 || "",
        city: permanentAddr?.city || defaultValues.permanent_city || "",
        state: permanentAddr?.state || defaultValues.permanent_state || "",
        pincode: permanentAddr?.pincode || defaultValues.permanent_pincode || "",
  permanent_country: getCountryName(permanentAddr?.country || defaultValues.permanent_country),
  permanent_country_code: resolveCountryCode(permanentAddr?.country_code || permanentAddr?.country || defaultValues.permanent_country_code),
        permanent_gstin: permanentAddr?.gstin || permanentAddr?.gstin_number || defaultValues.permanent_gstin || "",
        // Contact country - fallback to permanent if not at top level, extract name and code
  // Contact country: prefer top-level country/name, then top-level country_code, then permanent address
  country: getCountryName(defaultValues.country || defaultValues.country_code || defaultValues.permanent_country || permanentAddr?.country),
  country_code: resolveCountryCode(defaultValues.country_code || defaultValues.country || defaultValues.permanent_country_code || permanentAddr?.country_code || permanentAddr?.country),
        // Legal fields - prefer top-level, then extract from documents
        aadhar_number: getLegalFromDocs(['aadhaar','aadhar','aadhaar card','aadhar card'], ['aadhar_number','aadhaar'], ['aadhar_number','doc_number']),
        pan_number: getLegalFromDocs(['pan','pan card','permanent account number'], ['pan_number','pan'], ['pan_number','doc_number']),
        gstin_number: getLegalFromDocs(['gstin','gst','goods and services tax'], ['gstin_number','gstin'], ['gstin_number','doc_number']),
        msme_no: getLegalFromDocs(['msme','micro small medium enterprise'], ['msme_no','msmeno'], ['msme_no','doc_number']),
        // Primary bank information from first bank account
        bank_name: primaryBank?.bank_name || "",
        branch_name: primaryBank?.branch_name || "",
        branch_address: primaryBank?.branch_address || "",
        account_number: primaryBank?.account_number || "",
        ifsc_code: primaryBank?.ifsc_code || "",
      });
      // Prefill additionalAddresses from backend addresses (excluding "Permanent")
      setAdditionalAddresses(
        Array.isArray(defaultValues.addresses)
          ? defaultValues.addresses
              .filter(addr => addr.title !== "Permanent")
              .map(addr => ({
                id: addr.id,
                // keep internal field name consistent with form handlers
                address_type: addr.title || "",
                address1: addr.address1 || "",
                address2: addr.address2 || "",
                address3: addr.address3 || "",
                city: addr.city || "",
                state: addr.state || "",
                country: resolveCountryName(addr.country),
                // preserve country code if backend provides it under different keys
                country_code: resolveCountryCode(addr.country_code || addr.country),
                pincode: addr.pincode || "",
                gstin: addr.gstin || addr.gstin_number || "",
                keyValues: addr.keyValues || addr.key_values || addr.key_value || [],
              }))
          : []
      );
      // Prefill additionalBankInfos from backend bank_accounts (excluding the first one which is primary)
      setAdditionalBankInfos(
        Array.isArray(defaultValues.bank_accounts) && defaultValues.bank_accounts.length > 1
          ? defaultValues.bank_accounts.slice(1).map(bank => ({
              id: bank.id,
              bank_name: bank.bank_name || "",
              branch_name: bank.branch_name || "",
              branch_address: bank.branch_address || "",
              account_number: bank.account_number || "",
              ifsc_code: bank.ifsc_code || "",
              keyValues: bank.keyValues || bank.key_values || bank.key_value || [],
            }))
          : []
      );
      
      // Prefill uploadedDocuments from backend documents
      setUploadedDocuments(
        Array.isArray(defaultValues.documents)
          ? defaultValues.documents.map(doc => {
              const ext = doc.file_url ? doc.file_url.split('.').pop().toLowerCase() : '';
              let inferredType = '';
              if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext)) {
                inferredType = 'image/' + (ext === 'jpg' ? 'jpeg' : ext);
              } else if (ext === 'pdf') {
                inferredType = 'application/pdf';
              } // add more extensions as needed
              return {
                id: doc.id,
                document_type: doc.doc_type || "",
                document_number: doc.doc_number || "",
                file_url: doc.file_url || "",
                type: inferredType,
                name: doc.doc_type || 'Document',
                // Provide a normalized preview URL so both the card and the edit dialog
                // can use the same source regardless of whether the file was newly
                // uploaded (object URL) or comes from backend (file_url).
                preview: buildDocUrl(doc),
                // Don't include file object for existing documents
              };
            })
          : []
      );
  // Initialize account_types based on existing booleans (pick first one if multiple present)
  const selectedTypes = [];
  if (defaultValues.is_customer) selectedTypes.push("is_customer");
  if (defaultValues.is_supplier) selectedTypes.push("is_supplier");
  if (defaultValues.is_dealer) selectedTypes.push("is_dealer");
  if (defaultValues.is_distributor) selectedTypes.push("is_distributor");
      // For single-select UI, pick the first selected type or empty string
      setValue("account_types", selectedTypes.length ? selectedTypes[0] : "");
      // Prefill any additional account types (all selected types except the primary)
      const extras = selectedTypes.length > 1 ? selectedTypes.slice(1) : [];
      if (extras.length) {
        setAdditionalAccountTypes(extras);
        // Initialize per-slot relation ids as empty - will be populated by hierarchy effect
        setAdditionalSlotDistributorIds(extras.map(() => null));
        setAdditionalSlotDealerIds(extras.map(() => null));
      } else {
        // ensure empty arrays when there are no extras
        setAdditionalAccountTypes([]);
        setAdditionalSlotDistributorIds([]);
        setAdditionalSlotDealerIds([]);
      }
      // Initialize under_type as empty - will be populated by hierarchy effect
      setValue('under_type', '');
      setValue('distributor_id', null);
      setValue('dealer_id', null);
    }
  }, [defaultValues, reset, setValue]);

  // Prefill dealer/distributor selections on edit by reading user hierarchy relations
  useEffect(() => {
    // Only for edit case with valid hierarchy data
    if (!defaultValues?.id || !hierarchy || hierarchy.length === 0) return;

    // Normalize fields case
    const norm = (r) => ({
      relationType: String(r.relation_type || r.RelationType || '').toLowerCase(),
      parentId: r.parent_id || r.ParentID || r.parentId || null,
      childId: r.child_id || r.ChildID || r.childId || null,
    });

    // Filter hierarchy to only child relations (where this user is the child)
    const childRelations = hierarchy
      .filter(r => {
        const normalized = norm(r);
        return normalized.childId === defaultValues.id;
      })
      .map(norm);

    // Collect all parent IDs by relation type
    const dealerParents = [];        // Dealer -> Customer
    const distributorToCustomerParents = [];   // Distributor -> Customer
    const distributorToDealerParents = []; // Distributor -> Dealer

    childRelations.forEach(r => {
      if (!r || !r.parentId) return;
      const relType = r.relationType;
      if (relType.includes('dealer-customer') || relType.includes('dealer_customer')) {
        dealerParents.push(r.parentId);
      }
      if (relType.includes('distributor-customer') || relType.includes('distributor_customer')) {
        distributorToCustomerParents.push(r.parentId);
      }
      if (relType.includes('distributor-dealer') || relType.includes('distributor_dealer')) {
        distributorToDealerParents.push(r.parentId);
      }
    });

    // Get all selected account types (primary + additional)
    const selectedTypes = [];
    if (defaultValues.is_user) selectedTypes.push("is_user");
    if (defaultValues.is_customer) selectedTypes.push("is_customer");
    if (defaultValues.is_supplier) selectedTypes.push("is_supplier");
    if (defaultValues.is_dealer) selectedTypes.push("is_dealer");
    if (defaultValues.is_distributor) selectedTypes.push("is_distributor");

    const primaryType = selectedTypes.length > 0 ? selectedTypes[0] : null;
    const extras = selectedTypes.length > 1 ? selectedTypes.slice(1) : [];

    // Prefill for primary account type selection
    if (primaryType === 'is_customer') {
      // For customer, prefer distributor over dealer
      if (distributorToCustomerParents.length > 0) {
        setValue('under_type', 'distributor', { shouldDirty: false });
        setValue('distributor_id', distributorToCustomerParents[0], { shouldDirty: false });
        setValue('dealer_id', null, { shouldDirty: false });
      } else if (dealerParents.length > 0) {
        setValue('under_type', 'dealer', { shouldDirty: false });
        setValue('dealer_id', dealerParents[0], { shouldDirty: false });
        setValue('distributor_id', null, { shouldDirty: false });
      }
    }

    if (primaryType === 'is_dealer') {
      if (distributorToDealerParents.length > 0) {
        setValue('under_type', 'distributor', { shouldDirty: false });
        setValue('distributor_id', distributorToDealerParents[0], { shouldDirty: false });
      }
    }

    // Prefill for additional account type slots
    if (extras.length > 0) {
      const newDistributorIds = [];
      const newDealerIds = [];
      
      // Track which parents have been used
      let dealerIdx = primaryType === 'is_customer' && dealerParents.length > 0 ? 1 : 0;
      let distToCustomerIdx = primaryType === 'is_customer' && distributorToCustomerParents.length > 0 ? 1 : 0;
      let distToDealerIdx = primaryType === 'is_dealer' && distributorToDealerParents.length > 0 ? 1 : 0;
      
      extras.forEach((t, idx) => {
        if (t === 'is_dealer') {
          // Assign next available distributor-dealer parent
          if (distToDealerIdx < distributorToDealerParents.length) {
            newDistributorIds[idx] = distributorToDealerParents[distToDealerIdx];
            distToDealerIdx++;
          } else {
            newDistributorIds[idx] = null;
          }
        } else {
          newDistributorIds[idx] = null;
        }
        
        if (t === 'is_customer') {
          // Prefer distributor, then dealer
          if (distToCustomerIdx < distributorToCustomerParents.length) {
            newDealerIds[idx] = 'distributor';
            // Store the actual distributor ID somewhere accessible if needed
            distToCustomerIdx++;
          } else if (dealerIdx < dealerParents.length) {
            newDealerIds[idx] = dealerParents[dealerIdx];
            dealerIdx++;
          } else {
            newDealerIds[idx] = null;
          }
        } else {
          newDealerIds[idx] = null;
        }
      });
      
      setAdditionalSlotDistributorIds(newDistributorIds);
      setAdditionalSlotDealerIds(newDealerIds);
    }
  }, [defaultValues?.id, hierarchy, setValue]);

  // Prefill assigned_executive_id when editing a user by checking employee-user mappings
  useEffect(() => {
    if (!defaultValues?.id) return;
    let cancelled = false;
    const fetchMapping = async () => {
      try {
        const resp = await axios.get(`${BASE_URL}/api/employee-user-mappings`);
        const rels = resp.data || [];
        if (cancelled) return;
        const found = Array.isArray(rels) ? rels.find(r => String(r.user_id) === String(defaultValues.id)) : null;
        if (found) {
          setValue('assigned_executive_id', found.employee_id, { shouldDirty: false });
        }
      } catch (err) {
        console.error('Failed to fetch employee-user mappings for prefill', err);
      }
    };
    fetchMapping();
    return () => { cancelled = true; };
  }, [defaultValues?.id, setValue]);

  // Validation function to check for duplicate email/mobile
  const validateUniqueFields = async (email, mobileNumber, userId = null) => {
    try {
      // Fetch all users to check for duplicates
      const response = await axios.get(`${BASE_URL}/api/users`);
      const users = Array.isArray(response.data) ? response.data : (response.data.data || []);
      
      // Filter out current user if editing
      const otherUsers = userId ? users.filter(u => u.id !== userId) : users;
      
      // Check email
      const emailExists = otherUsers.some(u => u.email && u.email.toLowerCase() === email.toLowerCase());
      if (emailExists) {
        return {
          isValid: false,
          field: 'email',
          message: 'A user with this email already exists. Please use a different email address.'
        };
      }
      
      // Check mobile number
      const mobileExists = otherUsers.some(u => u.mobile_number === mobileNumber);
      if (mobileExists) {
        return {
          isValid: false,
          field: 'mobile_number',
          message: 'A user with this mobile number already exists. Please use a different mobile number.'
        };
      }
      
      return { isValid: true };
    } catch (error) {
      console.error('Error validating unique fields:', error);
      // Continue with submission if validation check fails
      return { isValid: true };
    }
  };

  const onSubmit = async (data) => {
    // default submit via form (no continue)
    return await performSave(data, false);
  };

  // Centralized save logic; if continueNext is true, avoid opening confirmation dialog so flow continues
  const performSave = async (data, continueNext = false) => {
    try {
      // Validate unique fields before submitting (only when creating new user)
      if (!defaultValues?.id) {
        const validation = await validateUniqueFields(data.email, data.mobile_number);
        if (!validation.isValid) {
          alert(validation.message);
          return false;
        }
      }

      // Format DOB properly for backend
      let formattedDob = null;
      if (data.dob) {
        try {
          // If dob is already a date object or string, format it properly
          const dobDate = new Date(data.dob);
          if (!isNaN(dobDate.getTime())) {
            formattedDob = dobDate.toISOString().split('T')[0]; // YYYY-MM-DD format
          }
        } catch (e) {
          console.error('Error formatting DOB:', e);
        }
      }

      const payload = {
        usercode: data.usercode || undefined,
        salutation: data.salutation || undefined,
        firstname: data.firstname || "",
        lastname: data.lastname || "",
        dob: formattedDob,
        gender: data.gender || "",
        country: data.country || undefined,
        country_code: data.country_code || "",
        account_types: data.account_types || undefined,
        mobile_number: data.mobile_number || "",
        whatsapp_number: data.whatsapp_number || undefined,
        emergency_number: data.emergency_number || undefined,
        alternate_number: data.alternate_number || undefined,
        website: data.website || undefined,
        email: data.email || "",
        password: data.password || undefined,
        username: data.username || undefined,
        active: data.active !== undefined ? data.active : true,
        // Business Information
        business_name: data.business_name || undefined,
        company_name: data.companyname || undefined,
        industry_segment: data.industry_segment || undefined,
        designation: data.designation || undefined,
        title: data.title || undefined,
        // Account types
        is_user: data.is_user || false,
        is_customer: data.is_customer || false,
        is_supplier: data.is_supplier || false,
        is_employee: data.is_employee || false,
        is_dealer: data.is_dealer || false,
        is_distributor: data.is_distributor || false,
        // Permanent address fields
        permanent_address1: data.address1 || undefined,
        permanent_address2: data.address2 || undefined,
        permanent_address3: data.address3 || undefined,
        permanent_city: data.city || undefined,
        permanent_state: data.state || undefined,
        permanent_country: data.permanent_country || undefined,
        permanent_country_code: data.permanent_country_code || undefined,
        permanent_pincode: data.pincode || undefined,
  // Permanent GSTIN (separate from legal/ document GSTIN)
  permanent_gstin: data.permanent_gstin || undefined,
        // Primary bank information
        primary_bank_name: data.bank_name || undefined,
        primary_branch_name: data.branch_name || undefined,
        primary_branch_address: data.branch_address || undefined,
        primary_account_number: data.account_number || undefined,
        primary_ifsc_code: data.ifsc_code || undefined,
        // Legal/Document fields
        aadhar_number: data.aadhar_number || undefined,
        pan_number: data.pan_number || undefined,
        // Legal/Document GSTIN (kept as gstin_number for backend compatibility)
        gstin_number: data.gstin_number || data.gstin || undefined,
        msme_no: data.msme_no || undefined,
        // Assign to executive (employee id)
        assigned_executive_id: data.assigned_executive_id || undefined,
      };

      // Check required fields before sending
      const requiredFields = [
        { field: "salutation", label: "Salutation" },
        { field: "firstname", label: "First name" },
        { field: "gender", label: "Gender" },
        { field: "country", label: "Country" },
        { field: "account_types", label: "Account type" },
        { field: "country_code", label: "Country code" },
        { field: "mobile_number", label: "Mobile number" },
        { field: "email", label: "Email" },
      ];
      
      // Password is required only when creating a new user
      if (!defaultValues?.id) {
        requiredFields.push({ field: "password", label: "Password" });
      }

      for (const { field, label } of requiredFields) {
        if (!payload[field]) {
          if (!continueNext) {
            setError(field, { type: 'manual', message: `${label} is required.` });
            const targetTab = fieldToTab[field] ?? 0;
            setTabIndex(targetTab);
            alert(`${label} is required. Please fill it in the ${['Personal', 'User Type & Relation', 'Addresses / Bank / Docs', 'Authentication'][targetTab]} tab.`);
          }
          return false;
        }
      }

      // Enforce document type for all uploaded documents
      if (uploadedDocuments && uploadedDocuments.length > 0) {
        const missingType = uploadedDocuments.some(doc => !doc.document_type || String(doc.document_type).trim() === '');
        if (missingType) {
          // Mark documents as an error and navigate to Documents tab (tab index 2)
          if (!continueNext) {
            setError('documents', { type: 'manual', message: 'Please select a document type for all uploaded documents.' });
            setTabIndex(2);
            alert('Please select a document type for all uploaded documents.');
          }
          return false;
        }
      }

      let created;
      if (defaultValues?.id) {
        // Update user
        console.log('Updating user with payload:', payload);
        const response = await axios.put(`${BASE_URL}/api/users/${defaultValues.id}`, payload);
        created = response.data.user || response.data;
      } else {
        // Add new user
        console.log('Creating new user with payload:', payload);
        const response = await axios.post(`${BASE_URL}/api/users`, payload);
        created = response.data.user || response.data;
        // if(response.data.id){
        //   consthierarchy_payload = {
        //     child_id: response.data.id,
        //     relation_type: "User",
        //     parent_id:,
        //   };
        //   await axios.post(`${BASE_URL}/api/user-hierarchy`, consthierarchy_payload);
        //   }
        // });
      }

      // Sync employee-user mapping (assign/unassign) based on assigned_executive_id
      try {
        if (data.assigned_executive_id) {
          // Remove any existing mapping for this user first (backend supports deleting by user_id)
          try {
            await axios.delete(`${BASE_URL}/api/employees/remove-user`, { params: { user_id: created.id } });
          } catch (e) {
            // ignore non-fatal errors here
            console.debug('remove-user failed (may be none):', e?.response?.data || e.message || e);
          }

          // Assign to selected executive
          await axios.post(`${BASE_URL}/api/employees/assign-user`, {
            employee_id: Number(data.assigned_executive_id),
            user_id: created.id,
          });
        } else {
          // If no executive selected, ensure any existing mapping for this user is removed
          try {
            await axios.delete(`${BASE_URL}/api/employees/remove-user`, { params: { user_id: created.id } });
          } catch (e) {
            console.debug('remove-user failed when clearing mapping:', e?.response?.data || e.message || e);
          }
        }
      } catch (mapErr) {
        console.error('Failed to sync employee-user mapping:', mapErr);
      }

      // Save additional addresses if any
      if (additionalAddresses && additionalAddresses.length > 0) {
        try {
          for (const addr of additionalAddresses) {
            const addressPayload = {
              user_id: created.id,
              title: addr.address_type || "",
              address1: addr.address1 || "",
              address2: addr.address2 || "",
              address3: addr.address3 || "",
              city: addr.city || "",
              state: addr.state || "",
              country: addr.country || "",
              country_code: addr.country_code || "",
              pincode: addr.pincode || "",
              // support per-address GSTIN with multiple key fallbacks
              gstin: addr.gstin || addr.gstin_number || addr.gst || addr.gst_number || undefined,
              keyValues: addr.keyValues || [],
            };
            
            if (addr.id) {
              // Update existing address
              await axios.put(`${BASE_URL}/api/user-address/${addr.id}`, addressPayload);
            } else {
              // Create new address
              await axios.post(`${BASE_URL}/api/user-address`, addressPayload);
            }
          }
        } catch (addrErr) {
          console.error('Failed to save additional addresses:', addrErr);
        }
      }

      // Permanent address is handled by the backend during user create/update; no extra client call needed.

      // Save additional bank accounts if any
      if (additionalBankInfos && additionalBankInfos.length > 0) {
        try {
          for (const bank of additionalBankInfos) {
            const bankAccountPayload = {
              user_id: created.id,
              bank_name: bank.bank_name || "",
              branch_name: bank.branch_name || "",
              branch_address: bank.branch_address || "",
              account_number: bank.account_number || "",
              ifsc_code: bank.ifsc_code || "",
              keyValues: bank.keyValues || [],
            };
            
            if (bank.id) {
              // Update existing bank account
              await axios.put(`${BASE_URL}/api/user-bank/${bank.id}`, bankAccountPayload);
            } else {
              // Create new bank account
              await axios.post(`${BASE_URL}/api/user-bank`, bankAccountPayload);
            }
          }
        } catch (bankErr) {
          console.error('Failed to save additional bank accounts:', bankErr);
        }
      }

      // Save uploaded documents if any
      if (uploadedDocuments && uploadedDocuments.length > 0) {
        try {
          for (const doc of uploadedDocuments) {
            const formData = new FormData();
            formData.append('user_id', created.id);
            formData.append('doc_type', doc.document_type || doc.name || '');
            formData.append('doc_number', doc.document_number || doc.documentNumber || '');

            // Append file only if present (new uploads or replaced files)
            if (doc.file) {
              formData.append('file', doc.file);
            }

            // Determine if this is an existing DB record (ids from DB are small numbers)
            const isExistingDbRecord = doc.id && typeof doc.id === 'number' && doc.id < 1000000000000 && defaultValues?.id;

            try {
              if (isExistingDbRecord) {
                // Update existing document (metadata and/or file)
                await axios.put(`${BASE_URL}/api/document/${doc.id}`, formData, {
                  headers: { 'Content-Type': 'multipart/form-data' }
                });
              } else {
                // Creating new document requires a file and a document_type
                if (!doc.file) {
                  console.warn('Skipping creating document without file:', doc);
                  continue;
                }
                if (!doc.document_type && !doc.name) {
                  console.warn('Skipping document upload - missing document_type:', doc);
                  continue;
                }
                await axios.post(`${BASE_URL}/api/document`, formData, {
                  headers: { 'Content-Type': 'multipart/form-data' }
                });
              }
            } catch (singleDocErr) {
              console.error('Failed to save document:', doc.document_type || doc.name, singleDocErr.response?.data || singleDocErr.message);
              // Continue with other documents even if one fails
            }
          }
        } catch (docErr) {
          console.error('Failed to save user documents:', docErr);
        }
      }

      // Sync hierarchical relations (dealer/distributor) for this user
      try {
        const childId = created.id;
        // Build desired relations based on current selections
        const desired = [];
        const addRel = (type, parent) => {
          if (!parent) return;
          const pid = String(parent);
          if (pid === 'direct' || pid === 'none') return; // skip special sentinels
          const asNum = Number(parent);
          if (!isNaN(asNum) && asNum > 0) desired.push({ relation_type: type, parent_id: asNum, child_id: childId });
        };

        // Primary account type relations
        const primaryType = String(watchedAccountTypesLocal);
        const curUnderType = String(underType || '');
        if (primaryType === 'is_customer') {
          if (curUnderType === 'dealer' && selectedDealerId) addRel('Dealer-Customer', selectedDealerId);
          else if (curUnderType === 'distributor' && selectedDistributorId) addRel('Distributor-Customer', selectedDistributorId);
        }
        if (primaryType === 'is_dealer') {
          if (selectedDistributorId) addRel('Distributor-Dealer', selectedDistributorId);
        }

        // Additional account type relations
        if (Array.isArray(additionalAccountTypes) && additionalAccountTypes.length) {
          additionalAccountTypes.forEach((t, idx) => {
            if (t === 'is_dealer') {
              const pid = additionalSlotDistributorIds[idx];
              addRel('Distributor-Dealer', pid);
            }
            if (t === 'is_customer') {
              const sel = additionalSlotDealerIds[idx];
              if (sel === 'distributor') {
                // Fallback to the primary selected distributor (if any)
                if (selectedDistributorId) addRel('Distributor-Customer', selectedDistributorId);
              } else {
                addRel('Dealer-Customer', sel);
              }
            }
          });
        }

        // Fetch current relations for this child
        let existing = [];
        try {
          const r = await axios.get(`${BASE_URL}/api/hierarchical-users`, { params: { child_id: childId } });
          existing = Array.isArray(r.data) ? r.data : (r.data?.data || []);
        } catch (e) {
          existing = [];
        }

        // Delete all existing relations for this child to simplify reconciliation
        if (Array.isArray(existing) && existing.length) {
          for (const rel of existing) {
            if (!rel || !rel.id) continue;
            try { await axios.delete(`${BASE_URL}/api/hierarchical-users/${rel.id}`); } catch (e) { /* ignore */ }
          }
        }

        // Create desired relations
        for (const rel of desired) {
          try {
            await axios.post(`${BASE_URL}/api/hierarchical-users`, {
              parent_id: rel.parent_id,
              child_id: rel.child_id,
              relation_type: rel.relation_type,
            });
          } catch (e) {
            console.error('Failed creating relation', rel, e?.response?.data || e.message);
          }
        }
      } catch (relErr) {
        console.error('Failed to sync user relations', relErr);
      }

      if (!continueNext) {
        // Do not open any confirmation dialog after submit — keep created user state for any downstream use
        setCreatedUser(created);
        setUsercode(created.usercode || created.username || "");
      }
      onSubmitUser && onSubmitUser(created);

      // After successful submit (and not continuing to next), navigate to the users list
      if (!continueNext) {
        try { navigate('/users'); } catch (e) { /* ignore navigation errors */ }
      }

      return created;
    } catch (error) {
      // Log full axios error and server response if available
      console.error("Error submitting user form:", error);
      
      if (error?.response) {
        console.error('Server responded with:', error.response.status, error.response.data);
        
        const responseData = error.response.data;
        const status = error.response.status;
        
        // Handle 409 Conflict (duplicate entries)
        if (status === 409) {
          const errorMsg = responseData?.message || responseData?.error || 'This information already exists';
          const field = responseData?.field;
          
          if (field === 'email') {
            alert('A user with this email already exists. Please use a different email address.');
          } else if (field === 'mobile_number') {
            alert('A user with this mobile number already exists. Please use a different mobile number.');
          } else if (field === 'usercode') {
            alert('A user with this usercode already exists. Please use a different usercode.');
          } else {
            alert(errorMsg);
          }
        }
        // Handle validation errors (400)
        else if (status === 400) {
          const errorMsg = responseData?.message || responseData?.error || 'Invalid request. Please check your input.';
          const field = responseData?.field;
          const details = responseData?.details;
          
          let displayMsg = errorMsg;
          if (details) {
            displayMsg += `\nDetails: ${details}`;
          }
          alert(displayMsg);
        }
        // Handle other errors that might contain duplicate key information
        else if (status === 500) {
          const errorText = String(responseData?.error || responseData?.message || '').toLowerCase();
          
          if (errorText.includes('duplicate key') || errorText.includes('unique constraint')) {
            if (errorText.includes('email')) {
              alert('A user with this email already exists. Please use a different email address.');
            } else if (errorText.includes('mobile_number')) {
              alert('A user with this mobile number already exists. Please use a different mobile number.');
            } else if (errorText.includes('usercode')) {
              alert('A user with this usercode already exists. Please use a different usercode.');
            } else {
              alert('This information already exists for another user. Please check and try again with different values.');
            }
          } else {
            // For other server errors, show the actual error message
            const serverMsg = responseData?.details || responseData?.error || responseData?.message || JSON.stringify(responseData);
            alert(`Server error: ${serverMsg}`);
          }
        }
        // Handle other status codes
        else {
          const errorMsg = responseData?.message || responseData?.error || `Server error (${status})`;
          alert(errorMsg);
        }
      } else if (error?.request) {
        console.error('No response received, request was:', error.request);
        alert('No response received from server. Please check if the backend is running.');
      } else {
        alert(`Error: ${error.message || 'Something went wrong. Please try again.'}`);
      }
      return false;
    }
  };

  // Add support for key-value pairs in additional addresses
  const handleAddKeyValue = (idx) => {
    setAdditionalAddresses(addresses => {
      const updated = [...addresses];
      const prevKeyValues = Array.isArray(updated[idx].keyValues) ? updated[idx].keyValues : [];
      updated[idx] = {
        ...updated[idx],
        keyValues: [...prevKeyValues, { key: "", value: "" }]
      };
      return updated;
    });
  };

  const handleRemoveKeyValue = (addrIdx, kvIdx) => {
    setAdditionalAddresses(addresses => {
      const updated = [...addresses];
      updated[addrIdx].keyValues = (updated[addrIdx].keyValues || []).filter((_, i) => i !== kvIdx);
      return updated;
    });
  };

  const handleKeyValueChange = (addrIdx, kvIdx, field, value) => {
    setAdditionalAddresses(addresses => {
      const updated = [...addresses];
      if (!updated[addrIdx].keyValues) updated[addrIdx].keyValues = [];
      updated[addrIdx].keyValues[kvIdx] = {
        ...updated[addrIdx].keyValues[kvIdx],
        [field]: value
      };
      return updated;
    });
  };

  // --- Additional Bank Info handlers ---
  const handleAddAdditionalBankInfo = () => {
    setAdditionalBankInfos([...additionalBankInfos, {}]);
  };

  const handleRemoveAdditionalBankInfo = (idx) => {
    setAdditionalBankInfos(additionalBankInfos.filter((_, i) => i !== idx));
  };

  const handleAdditionalBankInfoChange = (idx, field, value) => {
    setAdditionalBankInfos(infos => {
      const updated = [...infos];
      updated[idx] = { ...updated[idx], [field]: value };
      return updated;
    });
  };

  const handleAddBankKeyValue = (idx) => {
    setAdditionalBankInfos(infos => {
      const updated = [...infos];
      const prevKeyValues = Array.isArray(updated[idx].keyValues) ? updated[idx].keyValues : [];
      updated[idx] = {
        ...updated[idx],
        keyValues: [...prevKeyValues, { key: "", value: "" }]
      };
      return updated;
    });
  };

  const handleRemoveBankKeyValue = (infoIdx, kvIdx) => {
    setAdditionalBankInfos(infos => {
      const updated = [...infos];
      updated[infoIdx].keyValues = (updated[infoIdx].keyValues || []).filter((_, i) => i !== kvIdx);
      return updated;
    });
  };

  const handleBankKeyValueChange = (infoIdx, kvIdx, field, value) => {
    setAdditionalBankInfos(infos => {
      const updated = [...infos];
      if (!updated[infoIdx].keyValues) updated[infoIdx].keyValues = [];
      updated[infoIdx].keyValues[kvIdx] = {
        ...updated[infoIdx].keyValues[kvIdx],
        [field]: value
      };
      return updated;
    });
  };

  // Document upload handlers
  const handleDocumentUpload = (event) => {
    const files = Array.from(event.target.files);
    const newDocs = files.map((file, idx) => ({
      id: Date.now() + idx,
      file: file,
      preview: URL.createObjectURL(file),
      name: file.name,
      type: file.type,
      documentNumber: '',
      // keep both naming variants for compatibility; performSave expects document_type/document_number
      document_type: '',
      document_number: '',
    }));
    setUploadedDocuments(prev => [...prev, ...newDocs]);
  };

  const handleDeleteDocument = (docId) => {
    const docToDelete = uploadedDocuments.find(doc => doc.id === docId);
    if (!docToDelete) return;

    // If this is an existing document stored in DB, try deleting on server
    const isExistingDbRecord = docToDelete.id && typeof docToDelete.id === 'number' && docToDelete.id < 1000000000000;
    if (isExistingDbRecord) {
      axios.delete(`${BASE_URL}/api/document/${docToDelete.id}`)
        .then(() => {
          setUploadedDocuments(prev => prev.filter(doc => doc.id !== docId));
        })
        .catch(err => {
          console.error('Failed to delete document on server:', err?.response?.data || err.message);
          // Still remove locally to reflect user's intent; server-side may be cleaned separately
          setUploadedDocuments(prev => prev.filter(doc => doc.id !== docId));
        });
    } else {
      // Local/unsaved document: revoke preview and remove
      if (docToDelete.preview) URL.revokeObjectURL(docToDelete.preview);
      setUploadedDocuments(prev => prev.filter(doc => doc.id !== docId));
    }
  };

  // Inline handlers to edit document metadata directly on the card (moved out of dialog)
  const handleInlineDocTypeChange = (docId, newType) => {
    setUploadedDocuments(prev => prev.map(d => d.id === docId ? { ...d, document_type: newType || '', name: newType || d.name } : d));
  };

  const handleInlineDocNumberChange = (docId, newNumber) => {
    setUploadedDocuments(prev => prev.map(d => d.id === docId ? { ...d, document_number: newNumber || '', documentNumber: newNumber || d.documentNumber } : d));
  };

  const handleEditDocument = (doc) => {
    // Open crop dialog for image editing
    const src = doc.preview || (doc.file_url ? BASE_URL + doc.file_url : null);
    if (!src) return;
    setImageLoaded(false);
    // Preload image to avoid cropper computing NaN sizes before image is ready
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      setCropImage(src);
      setCropImageId(doc.id);
      setCrop({ x: 0, y: 0 });
      setZoom(1);
      setCroppedAreaPixels(null);
      setImageLoaded(true);
      setCropDialogOpen(true);
      console.log('AddOrEditUserForm: crop dialog opening (onload) for doc id=', doc.id, 'src=', src);
    };
    img.onerror = () => {
      // fallback — still open dialog but mark as loaded so cropper can try
      setCropImage(src);
      setCropImageId(doc.id);
      setCrop({ x: 0, y: 0 });
      setZoom(1);
      setCroppedAreaPixels(null);
      setImageLoaded(true);
      setCropDialogOpen(true);
      console.log('AddOrEditUserForm: crop dialog opening (onerror) for doc id=', doc.id, 'src=', src);
    };
    img.src = src;
  };

  React.useEffect(() => {
    console.log('AddOrEditUserForm: cropDialogOpen=', cropDialogOpen, 'imageLoaded=', imageLoaded, 'cropImage=', !!cropImage);
  }, [cropDialogOpen, imageLoaded, cropImage]);

  const onCropComplete = (croppedArea, croppedAreaPixels) => {
    setCroppedAreaPixels(croppedAreaPixels);
  };

  const createImage = (url) => 
    new Promise((resolve, reject) => {
      const image = new Image();
      image.addEventListener('load', () => resolve(image));
      image.addEventListener('error', (err) => reject(err));
      image.setAttribute('crossOrigin', 'anonymous');
      image.src = url;
    });

  const getCroppedImg = async (imageSrc, pixelCrop) => {
    const image = await createImage(imageSrc);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    // Create a canvas exactly the size of the crop so the resulting blob
    // contains only the cropped pixels (no extra transparent padding).
    canvas.width = Math.max(1, Math.round(pixelCrop.width));
    canvas.height = Math.max(1, Math.round(pixelCrop.height));

    ctx.drawImage(
      image,
      Math.round(pixelCrop.x),
      Math.round(pixelCrop.y),
      Math.round(pixelCrop.width),
      Math.round(pixelCrop.height),
      0,
      0,
      canvas.width,
      canvas.height
    );

    return new Promise((resolve) => {
      canvas.toBlob((blob) => {
        resolve(blob);
      }, 'image/jpeg');
    });
  };

  const handleCropSave = async () => {
    if (!croppedAreaPixels || !cropImage) return;

    try {
      const croppedImage = await getCroppedImg(cropImage, croppedAreaPixels);
      
      // Update the document with the cropped image
      const croppedFile = new File([croppedImage], 'cropped-image.jpg', { type: 'image/jpeg' });
      const newPreview = URL.createObjectURL(croppedFile);

      setUploadedDocuments(prev => 
        prev.map(doc => 
          doc.id === cropImageId 
            ? { 
                ...doc, 
                file: croppedFile, 
                preview: newPreview, 
                name: 'cropped-image.jpg'
              }
            : doc
        )
      );

      setCropDialogOpen(false);
      setCropImage(null);
      setCropImageId(null);
    } catch (error) {
      console.error('Error cropping image:', error);
      alert('Failed to crop image. Please try again.');
    }
  };

  const handleCropCancel = () => {
    setCropDialogOpen(false);
    setCropImage(null);
    setCropImageId(null);
  };

  // Build a full URL to the document file (handles preview, relative paths saved by backend)
  const buildDocUrl = (doc) => {
    if (!doc) return null;
    if (doc.preview) return doc.preview;
    if (doc.file_url) {
      // Normalize BASE_URL and file_url to avoid double slashes
      try {
        const base = String(BASE_URL || '').replace(/\/$/, '');
        const path = String(doc.file_url).replace(/^\.\//, '').replace(/^\/+/, '');
        return `${base}/${path}`;
      } catch (e) {
        return doc.file_url;
      }
    }
    return null;
  };

  const handleViewDocument = (doc) => {
    const url = buildDocUrl(doc);
    if (!url) {
      alert('No file available to view');
      return;
    }
    // Open in new tab/window for browser to render (image/pdf etc.)
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const handleDownloadDocument = async (doc) => {
    try {
      // If it's a local File (new upload), create object URL and download
      if (doc.file instanceof File) {
        const objectUrl = URL.createObjectURL(doc.file);
        const a = document.createElement('a');
        a.href = objectUrl;
        a.download = doc.name || doc.file.name || 'document';
        document.body.appendChild(a);
        a.click();
        a.remove();
        URL.revokeObjectURL(objectUrl);
        return;
      }

      const url = buildDocUrl(doc);
      if (!url) {
        alert('No file available to download');
        return;
      }

      // Fetch the file as blob then trigger download so cross-origin and auth headers work consistently
      const resp = await fetch(url, { credentials: 'include' });
      if (!resp.ok) throw new Error('Failed to fetch file');
      const blob = await resp.blob();
      const objectUrl = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = objectUrl;
      // Derive filename from doc metadata or URL
      const filename = doc.name || doc.document_type || url.split('/').pop() || 'document';
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(objectUrl);
    } catch (e) {
      console.error('Download failed', e);
      alert('Failed to download file');
    }
  };

  

  // Extract industry segments array
  const industrySegments = industries["industry segments"] || [];

  // Keep individual boolean fields in sync with the account_types single-select
  const watchedAccountTypes = useWatch({ control, name: "account_types", defaultValue: "" });

  useEffect(() => {
    if (typeof watchedAccountTypes === 'string') {
      accountTypes.forEach(type => {
        // mark fields as touched/dirty when changed by selection
        setValue(type.value, watchedAccountTypes === type.value, { shouldDirty: true, shouldTouch: true });
      });
    }
  }, [watchedAccountTypes, setValue]);

  // Dialog state for showing created/updated user id and usercode
  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [createdUser, setCreatedUser] = React.useState(null);
  const [usercode, setUsercode] = React.useState("");
  
  const handleDialogConfirm = () => {
    // Navigate to users list only after user confirms in the dialog
    navigate('/users');
  };


  const handleDialogClose = () => setDialogOpen(false);

  const handleDialogSubmit = async () => {
    if (!createdUser) {
      handleDialogClose();
      navigate('/users');
      return;
    }

    try {
      // Update the usercode field on backend if it differs or is provided
      if (usercode && (createdUser.usercode !== usercode)) {
        const payload = { ...createdUser, usercode };
        await axios.put(`${BASE_URL}/api/users/${createdUser.id}`, payload);
      }
    } catch (err) {
      console.error('Failed to update usercode:', err);
    }

    handleDialogClose();
    navigate('/users');
  };

  // Tabs state for form sections
  const [tabIndex, setTabIndex] = React.useState(0);
  const handleTabChange = (event, newValue) => setTabIndex(newValue);

  // Reset handler used by the Reset button (clears fields and additional lists)
  const handleResetForm = () => {
    // We'll clear only the values and errors for the currently active tab.
    let fieldsToClear = [];

    const resetPersonal = () => {
      const fields = {
        salutation: "",
        firstname: "",
        lastname: "",
        dob: "",
        gender: "",
        mobile_number: "",
        email: "",
        country: "",
        country_code: "",
        website: "",
        address1: "",
        address2: "",
        address3: "",
        city: "",
        state: "",
        permanent_country: "",
        permanent_country_code: "",
        pincode: "",
        whatsapp_number: "",
        emergency_number: "",
        alternate_number: "",
      };
      Object.entries(fields).forEach(([k, v]) => setValue(k, v, { shouldDirty: true }));
      fieldsToClear = Object.keys(fields);
    };

    const resetUserType = () => {
      const fields = {
      account_types: "",
        is_user: false,
        is_customer: false,
        is_supplier: false,
        is_employee: false,
        is_dealer: false,
        is_distributor: false,
      supplier_id: null,
      under_type: "",
        distributor_id: null,
        dealer_id: null,
        // Business info fields
        business_name: "",
        companyname: "",
        designation: "",
        title: "",
        industry_segment: "",
      };
      Object.entries(fields).forEach(([k, v]) => setValue(k, v, { shouldDirty: true }));
      fieldsToClear = Object.keys(fields);
    };

    const resetAddressesBank = () => {
      const fields = {
        bank_name: "",
        branch_name: "",
        branch_address: "",
        account_number: "",
        ifsc_code: "",
        address1: "",
        address2: "",
        address3: "",
        city: "",
        state: "",
        permanent_country: "",
        permanent_country_code: "",
        pincode: "",
      };
      Object.entries(fields).forEach(([k, v]) => setValue(k, v, { shouldDirty: true }));
      setAdditionalAddresses([]);
      setAdditionalBankInfos([]);
      fieldsToClear = Object.keys(fields).concat(['additional_addresses', 'additionalBankInfos']);
      // reset file inputs are not handled here (browser managed)
    };

    const resetAuthentication = () => {
      const fields = {
        username: "",
        password: "",
        confirmPassword: "",
        usercode: "",
        // Clear legal info fields in authentication tab reset
        aadhar_number: "",
        pan_number: "",
        gstin_number: "",
        msme_no: "",
      };
      Object.entries(fields).forEach(([k, v]) => setValue(k, v, { shouldDirty: true }));
      fieldsToClear = Object.keys(fields);
    };

    // Decide which tab to reset
    if (tabIndex === 0) {
      resetPersonal();
    } else if (tabIndex === 1) {
      resetUserType();
    } else if (tabIndex === 2) {
      resetAddressesBank();
    } else if (tabIndex === 3) {
      resetAuthentication();
    }

    // Clear validation errors only for fields in the current tab
    try {
      if (fieldsToClear && fieldsToClear.length) {
        clearErrors(fieldsToClear);
      } else {
        // fallback: do not clear everything to avoid affecting other tabs
        // keep console debug for visibility
        console.debug('No specific fields to clear errors for; skipping clearErrors()');
      }
    } catch (err) {
      // clearErrors may not be available or may behave differently; ignore safely
      // eslint-disable-next-line no-console
      console.debug('clearErrors not available or failed', err);
    }

    // Do NOT change the active tab. Keep the user on the same tab after reset.
  };

  const handleNext = () => {
    setTabIndex((prev) => Math.min(prev + 1, 3));
  };
  const handleBack = () => {
    setTabIndex((prev) => Math.max(prev - 1, 0));
  }

  // Fields to validate per tab before allowing save-and-continue
  const tabRequiredFields = {
    0: ["salutation", "firstname", "gender", "mobile_number", "email", "country"],
    1: ["account_types"],
    2: [],
    3: ["password", "confirmPassword"],
  };

  // Mapping of fields to their tab index for navigation on errors
  const fieldToTab = {
    // Tab 0: Personal
    salutation: 0,
    firstname: 0,
    lastname: 0,
    dob: 0,
    gender: 0,
    country_code: 0,
    country: 0,
    mobile_number: 0,
    whatsapp_number: 0,
    emergency_number: 0,
    alternate_number: 0,
    website: 0,
    email: 0,
    business_name: 0,
    company_name: 0,
    industry_segment: 0,
    designation: 0,
    title: 0,
    // Tab 1: User Type & Relation
    is_user: 1,
    is_customer: 1,
    is_supplier: 1,
    is_employee: 1,
    is_dealer: 1,
    is_distributor: 1,
    account_types: 1,
    // Tab 2: Addresses / Bank / Docs
    address1: 2,
    address2: 2,
    address3: 2,
    city: 2,
    state: 2,
    permanent_country: 2,
    permanent_country_code: 2,
    pincode: 2,
    permanent_gstin: 2,
    bank_name: 2,
    branch_name: 2,
    branch_address: 2,
    account_number: 2,
    ifsc_code: 2,
    aadhar_number: 3,
    pan_number: 3,
    gstin_number: 3,
    msme_no: 3,
    // Tab 3: Authentication
    password: 3,
    confirmPassword: 3,
    username: 3,
  };

  const handleNextWithValidation = async () => {
    const fields = tabRequiredFields[tabIndex] || [];
    if (fields.length) {
      const ok = await trigger(fields);
      const values = getValues();
      // debug info to help trace why a tab may not advance
      console.debug('handleNextWithValidation', { tabIndex, fields, ok, values, errors });

      if (!ok) {
        // Ensure specific required fields show errors and navigate to first
        const requiredChecks = [
          { field: 'salutation', label: 'Salutation' },
          { field: 'gender', label: 'Gender' },
          { field: 'country', label: 'Country' },
          { field: 'account_types', label: 'Account type' },
        ];
        for (const { field, label } of requiredChecks) {
          if (fields.includes(field) && !values[field]) {
            // set inline error and navigate
            setError(field, { type: 'manual', message: `${label} is required` });
            const targetTab = fieldToTab[field] ?? tabIndex;
            setTabIndex(targetTab);
            break;
          }
        }
        return;
      }
      // If validation passed, clear any stale errors for these fields
      try {
        fields.forEach(f => {
          if (!errors[f]) return; // only clear if an error exists
          clearErrors(f);
        });
      } catch (e) {
        console.warn('Error clearing field errors', e);
      }
    }
    setTabIndex((prev) => Math.min(prev + 1, 3));
  };

  const handleFormSubmit = async () => {
    console.log('handleFormSubmit called');
    // Trigger validation for all fields
    const isValid = await trigger();
    if (!isValid) {
      // Ensure specific required fields show inline errors (some Controller components may not show immediately)
      const values = getValues();
      const requiredChecks = [
        { field: 'salutation', label: 'Salutation' },
        { field: 'gender', label: 'Gender' },
        { field: 'country', label: 'Country' },
        { field: 'account_types', label: 'Account type' },
      ];
      for (const { field, label } of requiredChecks) {
        if (!values[field]) {
          setError(field, { type: 'manual', message: `${label} is required` });
        }
      }

      // Find the first field with an error and navigate there
      const errorFields = Object.keys(errors);
      if (errorFields.length > 0) {
        const firstErrorField = errorFields[0];
        const targetTab = fieldToTab[firstErrorField] ?? 0;
        setTabIndex(targetTab);
        alert(`Please fill in the required fields. The first error is in the ${['Personal', 'User Type & Relation', 'Addresses / Bank / Docs', 'Authentication'][targetTab]} tab.`);
      }
      return;
    }
    // If valid, proceed with submit
    console.log('Form validation passed, calling handleSubmit');
    const result = await handleSubmit(onSubmit)();
    console.log('handleSubmit result:', result);
    // Defensive: if performSave returned created user object, ensure dialog opens
    if (result) {
      try {
        const created = result;
        console.log('Created user:', created);
        if (created && (created.id || created.usercode || created.username)) {
          setCreatedUser(created);
          setUsercode(created.usercode || created.username || '');
          // After successful submit, navigate to the users list
          navigate('/users');
        }
      } catch (e) {
        console.error('Error in dialog setup:', e);
      }
    }
  };

  const handleSaveAndNext = async () => {
    const fields = tabRequiredFields[tabIndex] || [];
    let ok = true;
    if (fields.length) {
      ok = await trigger(fields);
    }
    if (!ok) {
      // Navigate to the tab with the first error
      const errorFields = Object.keys(errors);
      if (errorFields.length > 0) {
        const firstErrorField = errorFields[0];
        const targetTab = fieldToTab[firstErrorField] ?? 0;
        setTabIndex(targetTab);
        alert(`Please fill in the required fields in the ${['Personal', 'User Type & Relation', 'Addresses / Bank / Docs', 'Authentication'][targetTab]} tab.`);
      }
      return;
    }

    const data = getValues();

    if (tabIndex < 3) {
      // Save data for the current tab only and remain on the same tab.
      await performSave(data, true);
      // Do not auto-advance; user can use "Next" to move tabs explicitly.
    } else {
      // last tab: perform full submit which will show dialog
      await handleFormSubmit();
    }
  };

  return (
    <>
      <div className="user-form-container">
        <form
          onSubmitCapture={(e) => { e.preventDefault(); handleFormSubmit(); }}
          onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); } }}
        >
          {/* Header: title + status + view button */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h2 style={{ margin: 0, fontSize: '24px', fontWeight: 600 }}>
              {defaultValues ? "Edit User" : "Add User"}
            </h2>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              {/* Status toggle */}
              <div className="form-switch">
                <input
                  type="checkbox"
                  id="status-toggle"
                  checked={activeStatus}
                  onChange={(e) => setValue("active", e.target.checked, { shouldDirty: true, shouldTouch: true })}
                />
                <label htmlFor="status-toggle">{activeStatus ? "Active" : "Inactive"}</label>
              </div>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => navigate(`/users`)}
              >
                View
              </button>
            </div>
          </div>

          {/* Tabs Navigation */}
          <div className="form-tabs-wrapper">
            <button
              type="button"
              className={`form-tab ${tabIndex === 0 ? 'active' : ''}`}
              onClick={() => setTabIndex(0)}
            >
              PERSONAL
            </button>
            <button
              type="button"
              className={`form-tab ${tabIndex === 1 ? 'active' : ''}`}
              onClick={() => setTabIndex(1)}
            >
              USER TYPE & RELATION
            </button>
            <button
              type="button"
              className={`form-tab ${tabIndex === 2 ? 'active' : ''}`}
              onClick={() => setTabIndex(2)}
            >
              ADDRESSES / BANK / DOCS
            </button>
            <button
              type="button"
              className={`form-tab ${tabIndex === 3 ? 'active' : ''}`}
              onClick={() => setTabIndex(3)}
            >
              AUTHENTICATION
            </button>
          </div>

      <div className="tab-content" style={{ display: tabIndex === 0 ? 'block' : 'none' }}>
        <div className="form-grid">
          <h3 className="subsection-header" style={{ gridColumn: 'span 12' }}>Personal Information</h3>

          {/* Salutation */}
          <div className="grid-col md-2 xs-12">
            <div className="form-field">
              <label className="form-label">Salutation <span className="required">*</span></label>
              <Controller
                name="salutation"
                control={control}
                rules={{ required: "Salutation is required" }}
                render={({ field }) => (
                  <>
                    <select {...field} className={`form-select ${errors.salutation ? 'error' : ''}`}>
                      <option value="">Select</option>
                      {salutations.map((salute) => (
                        <option key={salute} value={salute}>{salute}</option>
                      ))}
                    </select>
                    {errors.salutation && <span className="form-helper-text error">{errors.salutation.message}</span>}
                  </>
                )}
              />
            </div>
          </div>

          {/* First Name */}
          <div className="grid-col md-3 xs-12">
            <div className="form-field">
              <label className="form-label">First Name <span className="required">*</span></label>
              <input
                type="text"
                className={`form-input ${errors.firstname ? 'error' : ''}`}
                {...register("firstname", { required: "First name is required" })}
              />
              {errors.firstname && <span className="form-helper-text error">{errors.firstname.message}</span>}
            </div>
          </div>

          {/* Last Name */}
          <div className="grid-col md-3 xs-12">
            <div className="form-field">
              <label className="form-label">Last Name</label>
              <input
                type="text"
                className={`form-input ${errors.lastname ? 'error' : ''}`}
                {...register("lastname")}
              />
              {errors.lastname && <span className="form-helper-text error">{errors.lastname.message}</span>}
            </div>
          </div>

          {/* Date of Birth */}
          <div className="grid-col md-2 xs-12">
            <div className="form-field">
              <label className="form-label">Date of Birth</label>
              <input type="date" className="form-input" {...register("dob")} />
            </div>
          </div>

          {/* Gender */}
          <div className="grid-col md-2 xs-12">
            <div className="form-field">
              <label className="form-label">Gender <span className="required">*</span></label>
              <Controller
                name="gender"
                control={control}
                rules={{ required: "Gender is required" }}
                render={({ field }) => (
                  <>
                    <select {...field} className={`form-select ${errors.gender ? 'error' : ''}`}>
                      <option value="">Select</option>
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Other">Other</option>
                    </select>
                    {errors.gender && <span className="form-helper-text error">{errors.gender.message}</span>}
                  </>
                )}
              />
            </div>
          </div>

          <h3 className="subsection-header" style={{ gridColumn: 'span 12' }}>Contact Information</h3>

          {/* Country */}
          <div className="grid-col md-3 xs-12">
            <div className="form-field">
              <label className="form-label">Country <span className="required">*</span></label>
              <Controller
                name="country"
                control={control}
                rules={{ required: "Country is required" }}
                render={({ field }) => (
                  <>
                    <select
                      value={field.value || ''}
                      onChange={(e) => {
                        const val = e.target.value || '';
                        field.onChange(val);
                        const selected = countries.find(c => c.name === val);
                        // set country_code hidden field so required check passes
                        setValue('country_code', selected ? (selected.code || '') : '');
                      }}
                      className={`form-select ${errors.country ? 'error' : ''}`}
                    >
                      <option value="">Select Country</option>
                      {countries.map((c) => (
                        <option key={c.name} value={c.name}>{c.name} ({c.code})</option>
                      ))}
                    </select>
                    {errors.country && <span className="form-helper-text error">{errors.country.message}</span>}
                  </>
                )}
              />
              <Controller name="country_code" control={control} render={({ field }) => <input type="hidden" {...field} />} />
            </div>
          </div>

          {/* Mobile Number */}
          <div className="grid-col md-3 xs-12">
            <div className="form-field">
              <label className="form-label">Mobile Number <span className="required">*</span></label>
              <input
                type="tel"
                className={`form-input ${errors.mobile_number ? 'error' : ''}`}
                {...register("mobile_number", { required: "Mobile number is required" })}
              />
              {errors.mobile_number && <span className="form-helper-text error">{errors.mobile_number.message}</span>}
            </div>
          </div>

          {/* Email */}
          <div className="grid-col md-3 xs-12">
            <div className="form-field">
              <label className="form-label">Email <span className="required">*</span></label>
              <input
                type="email"
                className={`form-input ${errors.email ? 'error' : ''}`}
                {...register("email", { required: "Email is required" })}
              />
              {errors.email && <span className="form-helper-text error">{errors.email.message}</span>}
            </div>
          </div>

          {/* WhatsApp Number */}
          <div className="grid-col md-3 xs-12">
            <div className="form-field">
              <label className="form-label">WhatsApp Number</label>
              <input type="tel" className="form-input" {...register("whatsapp_number")} />
            </div>
          </div>

          {/* Emergency Contact */}
          <div className="grid-col md-3 xs-12">
            <div className="form-field">
              <label className="form-label">Emergency Number</label>
              <input type="tel" className="form-input" {...register("emergency_number")} />
            </div>
          </div>

          {/* Alternate Contact + Website - put on their own row */}
          <div style={{ gridColumn: '1 / -1', display: 'grid', gridTemplateColumns: 'repeat(12, 1fr)', gap: '16px' }}>
            <div className="grid-col md-3 xs-12" style={{ gridColumn: 'span 3' }}>
              <div className="form-field">
                <label className="form-label">Alternate Contact No</label>
                <input type="tel" className="form-input" {...register("alternate_number")} />
              </div>
            </div>
            <div className="grid-col md-3 xs-12" style={{ gridColumn: 'span 3' }}>
              <div className="form-field">
                <label className="form-label">Website</label>
                <input type="url" className="form-input" {...register("website")} />
              </div>
            </div>
          </div>

          <h3 className="subsection-header" style={{ gridColumn: 'span 12' }}>Permanent Address</h3>

          {/* GSTIN with Get button */}
          <div className="grid-col md-3 xs-12">
            <div className="form-field">
              <label className="form-label">GSTIN</label>
              <div className="input-with-action">
                <input type="text" className="form-input" style={{ flex: 1 }} {...register("permanent_gstin")} />
                <button type="button" className="btn btn-secondary btn-small input-action-btn">Get</button>
              </div>
            </div>
          </div>

          {/* Address 1 */}
          <div className="grid-col md-3 xs-12">
            <div className="form-field">
              <label className="form-label">Address 1</label>
              <input type="text" className="form-input" {...register("address1")} />
            </div>
          </div>

          {/* Address 2 */}
          <div className="grid-col md-3 xs-12">
            <div className="form-field">
              <label className="form-label">Address 2</label>
              <input type="text" className="form-input" {...register("address2")} />
            </div>
          </div>

          {/* Address 3 */}
          <div className="grid-col md-3 xs-12">
            <div className="form-field">
              <label className="form-label">Address 3</label>
              <input type="text" className="form-input" {...register("address3")} />
            </div>
          </div>

          {/* City */}
          <div className="grid-col md-3 xs-12">
            <div className="form-field">
              <label className="form-label">City</label>
              {String(permanentCountry || "").toLowerCase() === "india" ? (
                <Controller
                  name="city"
                  control={control}
                  render={({ field }) => (
                    <select {...field} className="form-select">
                      <option value="">Select City</option>
                      {citiesList.map((c) => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                  )}
                />
              ) : (
                <input type="text" className="form-input" {...register("city")} />
              )}
            </div>
          </div>

          {/* State / Country / Pincode - put on their own row and style like other fields */}
          <div style={{ gridColumn: '1 / -1', display: 'grid', gridTemplateColumns: 'repeat(12, 1fr)', gap: '16px' }}>
            <div className="grid-col md-3 xs-12" style={{ gridColumn: 'span 3' }}>
              <div className="form-field">
                <label className="form-label">State</label>
                {String(permanentCountry || "").toLowerCase() === "india" ? (
                  <Controller
                    name="state"
                    control={control}
                    render={({ field }) => (
                      <select {...field} className="form-select">
                        <option value="">Select State</option>
                        {indiaStates.map((s) => (
                          <option key={s} value={s}>{s}</option>
                        ))}
                      </select>
                    )}
                  />
                ) : (
                  <input type="text" className="form-input" {...register("state")} />
                )}
              </div>
            </div>

            <div className="grid-col md-3 xs-12" style={{ gridColumn: 'span 3' }}>
              <div className="form-field">
                <label className="form-label">Country</label>
                <Controller
                  name="permanent_country"
                  control={control}
                  render={({ field }) => (
                    <select {...field} className="form-select" onChange={(e) => {
                      field.onChange(e.target.value);
                      const selected = countries.find(c => c.name === e.target.value);
                      setValue("permanent_country_code", selected ? selected.code : "");
                    }}>
                      <option value="">Select Country</option>
                      {countries.map((c) => (
                        <option key={c.name} value={c.name}>{c.name} ({c.code})</option>
                      ))}
                    </select>
                  )}
                />
                <Controller name="permanent_country_code" control={control} render={({ field }) => <input type="hidden" {...field} />} />
              </div>
            </div>

            <div className="grid-col md-3 xs-12" style={{ gridColumn: 'span 3' }}>
              <div className="form-field">
                <label className="form-label">Pincode</label>
                <input type="text" className="form-input" {...register("pincode")} />
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="tab-content" style={{ display: tabIndex === 1 ? 'block' : 'none' }}>
        <div className="form-grid">
          <div className="grid-col md-2 xs-12">
            <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', height: '100%' }}>
              <h6 className="subsection-header" style={{ marginTop: 0 }}>Account Type</h6>
              <div className="form-field">
                <Controller
                  name="account_types"
                  control={control}
                  rules={{ validate: v => (typeof v === 'string' && v.length > 0) || 'Account type is required' }}
                  render={({ field }) => (
                    <>
                      <select
                        {...field}
                        className={`form-select ${errors.account_types ? 'error' : ''}`}
                        onChange={(e) => {
                          const selected = e.target.value;
                          field.onChange(selected);
                          // keep individual booleans in sync: only the selected type becomes true
                          accountTypes.forEach(type => {
                            setValue(type.value, selected === type.value);
                          });
                          // Remove the selected type from additional account types if it was there
                          setAdditionalAccountTypes(prev => prev.filter(type => type !== selected));
                          // Clear fields based on account type
                          if (selected === 'is_employee') {
                            // Clear non-employee fields
                            setValue('under_type', '');
                            setValue('under_entity', null);
                            setValue('distributor_id', null);
                            setValue('dealer_id', null);
                            setValue('supplier_id', null);
                          } 
                          else if (selected === 'is_dealer') {
                            setValue('distributor_id', null);
                          }
                          else if (selected === 'is_customer') {
                            if (!defaultValues?.id) {
                              setValue('dealer_id', null);
                              setValue('under_type', '', { shouldDirty: true, shouldTouch: true });
                            }
                          }
                        }}
                      >
                        <option value="">Select account type</option>
                        {accountTypes.map(type => (
                          <option key={type.value} value={type.value}>{type.label}</option>
                        ))}
                      </select>
                      {errors.account_types && <span className="form-helper-text error">{errors.account_types.message}</span>}
                    </>
                  )}
                />
                {/* moved: button now renders after any additional-account rows so
                    it appears below the last account type field */}
              </div>
            </div>
          </div>

          {/* When Account Type is Dealer show distributor dropdown to select existing distributor */}
          {isDealerSelected && (
            <div className="grid-col md-3 xs-12">
              <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', height: '100%' }}>
                <h6 className="subsection-header" style={{ marginTop: 0 }}>Select Distributor</h6>
                <div className="form-field">
                  <Controller
                    name="distributor_id"
                    control={control}
                    render={({ field }) => (
                      <>
                        <select
                          {...field}
                          className={`form-select ${errors.distributor_id ? 'error' : ''}`}
                          disabled={isLoadingDistributors}
                          onChange={(e) => {
                            field.onChange(e.target.value || null);
                            setValue('under_type', 'distributor', { shouldDirty: true, shouldTouch: true });
                          }}
                        >
                          
                          {Array.isArray(distributors) && distributors.map(d => (
                            <option key={d.id} value={d.id}>
                              {d.company_name || `${d.firstname || ''} ${d.lastname || ''}`.trim() || d.username || 'Distributor'}
                            </option>
                          ))}
                        </select>
                        {errors.distributor_id && <span className="form-helper-text error">{errors.distributor_id.message}</span>}
                        {isLoadingDistributors && <span className="form-helper-text">Loading distributors...</span>}
                        {!isLoadingDistributors && (!Array.isArray(distributors) || distributors.length === 0) && <span className="form-helper-text">No distributors found</span>}
                      </>
                    )}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Dealer select - visible only when Customer account type is selected */}
          {isCustomerSelected && (
            <div className="grid-col md-3 xs-12">
              <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', height: '100%' }}>
                <h6 className="subsection-header" style={{ marginTop: 0 }}>Select Dealer</h6>
                <div className="form-field">
                  <Controller
                    name="dealer_id"
                    control={control}
                    render={({ field }) => {
                      const dealerOptions = [
                        { id: 'none', username: 'Direct Customer' },
                        { id: 'distributor', username: 'Under Distributor' },
                      ];
                      const allOptions = Array.isArray(dealers) ? dealerOptions.concat(dealers) : dealerOptions;
                      return (
                        <>
                          <select
                            value={field.value || ''}
                            onChange={(e) => {
                              const id = e.target.value;
                              if (id === 'none') {
                                field.onChange(null);
                                setValue('under_type', '', { shouldDirty: true, shouldTouch: true });
                              } else if (id === 'distributor') {
                                field.onChange(null);
                                setValue('under_type', 'distributor', { shouldDirty: true, shouldTouch: true });
                              } else {
                                field.onChange(id);
                                setValue('under_type', 'dealer', { shouldDirty: true, shouldTouch: true });
                              }
                            }}
                            className={`form-select ${errors.dealer_id ? 'error' : ''}`}
                            disabled={isLoadingDealers}
                          >
                            
                            {allOptions.map(opt => (
                              <option key={opt.id} value={opt.id}>
                                {opt.id === 'none' ? 'Direct Customer' : opt.id === 'distributor' ? 'Under Distributor' : opt.company_name || `${opt.firstname || ''} ${opt.lastname || ''}`.trim() || opt.username || 'Dealer'}
                              </option>
                            ))}
                          </select>
                          {errors.dealer_id && <span className="form-helper-text error">{errors.dealer_id.message}</span>}
                          {isLoadingDealers && <span className="form-helper-text">Loading dealers...</span>}
                        </>
                      );
                    }}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Distributor select - shown when customer selects 'Under Distributor' for dealer */}
          {isCustomerSelected && underType === 'distributor' && (
            <div className="grid-col md-3 xs-12">
              <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', height: '100%' }}>
                <h6 className="subsection-header" style={{ marginTop: 0 }}>Select Distributor</h6>
                <div className="form-field">
                  <Controller
                    name="distributor_id"
                    control={control}
                    render={({ field }) => (
                      <>
                        <select
                          {...field}
                          className={`form-select ${errors.distributor_id ? 'error' : ''}`}
                          disabled={isLoadingDistributors}
                          onChange={(e) => {
                            field.onChange(e.target.value || null);
                            setValue('under_type', 'distributor', { shouldDirty: true, shouldTouch: true });
                          }}
                        >
                          
                          {Array.isArray(distributors) && distributors.map(d => (
                            <option key={d.id} value={d.id}>
                              {d.company_name || `${d.firstname || ''} ${d.lastname || ''}`.trim() || d.username || 'Distributor'}
                            </option>
                          ))}
                        </select>
                        {errors.distributor_id && <span className="form-helper-text error">{errors.distributor_id.message}</span>}
                        {isLoadingDistributors && <span className="form-helper-text">Loading distributors...</span>}
                        {!isLoadingDistributors && (!Array.isArray(distributors) || distributors.length === 0) && <span className="form-helper-text">No distributors found</span>}
                      </>
                    )}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Render any additional account type selects added by the user - each on its own row */}
          {additionalAccountTypes.map((atype, idx) => (
            <div key={`additional_account_${idx}`} className="additional-account-row">
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                {/* Account Type Select */}
                <div style={{ minWidth: '220px' }}>
                  <select
                    value={atype || ''}
                    onChange={(e) => handleAdditionalAccountTypeChange(idx, e.target.value)}
                    className="form-select"
                  >
                    <option value="">Select account type</option>
                    {accountTypes.map(type => (
                      <option
                        key={type.value}
                        value={type.value}
                        disabled={
                          (watch("account_types") === type.value) || additionalAccountTypes.some((t, i) => t === type.value && i !== idx)
                        }
                      >
                        {type.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Dependent selector for the slot */}
                {atype === 'is_dealer' && (
                  <div style={{ minWidth: '340px' }}>
                    <select
                      value={additionalSlotDistributorIds[idx] || ''}
                      onChange={(e) => {
                        const newValue = e.target.value || null;
                        setAdditionalSlotDistributorIds(prev => {
                          const copy = [...prev];
                          copy[idx] = newValue;
                          return copy;
                        });
                      }}
                      className="form-select"
                      disabled={isLoadingDistributors}
                    >
                      <option value="">Select distributor</option>
                      {Array.isArray(distributors) && distributors.map(d => (
                        <option key={d.id} value={d.id}>
                          {d.company_name || `${d.firstname || ''} ${d.lastname || ''}`.trim() || d.username || 'Distributor'}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {atype === 'is_customer' && (
                  <div style={{ minWidth: '300px' }}>
                    <select
                      value={additionalSlotDealerIds[idx] || ''}
                      onChange={(e) => {
                        const id = e.target.value;
                        if (id === 'none' || id === '') {
                          setAdditionalSlotDealerIds(prev => prev.map((v, i) => i === idx ? null : v));
                        } else if (id === 'distributor') {
                          setAdditionalSlotDealerIds(prev => prev.map((v, i) => i === idx ? 'distributor' : v));
                        } else {
                          setAdditionalSlotDealerIds(prev => {
                            const copy = [...prev];
                            copy[idx] = id;
                            return copy;
                          });
                        }
                      }}
                      className="form-select"
                      disabled={isLoadingDealers}
                    >
                      <option value="none">Direct Customer</option>
                      <option value="distributor">Under Distributor</option>
                      {Array.isArray(dealers) && dealers.map(d => (
                        <option key={d.id} value={d.id}>
                          {d.company_name || `${d.firstname || ''} ${d.lastname || ''}`.trim() || d.username || 'Dealer'}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {/* Delete button */}
                <button
                  type="button"
                  onClick={() => handleRemoveAdditionalAccountType(idx)}
                  className="btn btn-small btn-danger"
                  title="Remove account type"
                  style={{ padding: '0.5rem 1rem' }}
                >
                  🗑️
                </button>
              </div>
            </div>
          ))}

          {/* Add button after additional account rows so it sits below the last field */}
          <div style={{ gridColumn: '1 / -1' }}>
            <button
              type="button"
              onClick={handleAddAdditionalAccountType}
              className="btn btn-secondary btn-small"
            >
              + Add another account type
            </button>
          </div>

          

          {/* Business Info Section */}
          <h3 className="subsection-header" style={{ gridColumn: 'span 12' }}>Business Info</h3>
          <div className="grid-col md-4 xs-12">
              <div className="form-field">
                <label htmlFor="business_name">Business Name</label>
                <input
                  {...register("business_name")}
                  id="business_name"
                  type="text"
                  className="form-input"
                />
              </div>
            </div>
            <div className="grid-col md-4 xs-12">
              <div className="form-field">
                <label htmlFor="companyname">Company Name</label>
                <input
                  {...register("companyname")}
                  id="companyname"
                  type="text"
                  className="form-input"
                />
              </div>
            </div>
            <div className="grid-col md-4 xs-12">
              <div className="form-field">
                <label htmlFor="industry_segment">Industry Segment</label>
                <Controller
                  name="industry_segment"
                  control={control}
                  render={({ field: { onChange, value } }) => (
                    <select
                      value={value || ''}
                      onChange={(e) => onChange(e.target.value || "")}
                      className="form-select"
                      id="industry_segment"
                    >
                      <option value="">Select industry segment</option>
                      {industrySegments && industrySegments.map(seg => (
                        <option key={seg} value={seg}>{seg}</option>
                      ))}
                    </select>
                  )}
                />
              </div>
            </div>

            <div className="grid-col md-4 xs-12">
              <div className="form-field">
                <label htmlFor="designation">Designation</label>
                <input
                  {...register("designation")}
                  id="designation"
                  type="text"
                  className="form-input"
                />
              </div>
            </div>
            <div className="grid-col md-4 xs-12">
              <div className="form-field">
                <label htmlFor="title">Title</label>
                <input
                  {...register("title")}
                  id="title"
                  type="text"
                  className="form-input"
                />
              </div>
            </div>
          </div>
            {/* Assign to Executive section */}
            <h6 className="subsection-header">Assign to Executive</h6>

            <div style={{ gridColumn: '1 / -1' }} className="flex-row">
              <div style={{ flex: 1, minWidth: 200, marginRight: '1rem' }}>
                <div className="form-field">
                  <label htmlFor="assigned_department_id">Select Department</label>
                  <Controller
                    name="assigned_department_id"
                    control={control}
                    render={({ field: { onChange, value } }) => (
                      <select
                        value={value || ''}
                        onChange={(e) => onChange(e.target.value || null)}
                        className="form-select"
                        id="assigned_department_id"
                      >
                        <option value="">All departments</option>
                        {departmentsList && departmentsList.map(d => (
                          <option key={d.id} value={d.id}>{d.name || d.id}</option>
                        ))}
                      </select>
                    )}
                  />
                </div>
              </div>

              <div style={{ flex: 1, minWidth: 200 }}>
                <div className="form-field">
                  <label htmlFor="assigned_executive_id">Select Executive</label>
                  <Controller
                    name="assigned_executive_id"
                    control={control}
                    render={({ field: { onChange, value } }) => (
                      <select
                        value={value || ''}
                        onChange={(e) => onChange(e.target.value || null)}
                        className="form-select"
                        disabled={isLoadingExecutives}
                        id="assigned_executive_id"
                      >
                        <option value="">Select executive</option>
                        {filteredExecutives && filteredExecutives.map((emp) => {
                          const label = `${emp && emp.salutation ? emp.salutation + ' ' : ''}${emp?.firstname || ''}${emp?.lastname ? ' ' + emp.lastname : ''}${emp?.usercode ? ` (${emp.usercode})` : ''}`.trim();
                          if (!label) return null;
                          return (
                            <option key={emp.id ?? label} value={emp.id ?? ''}>
                              {label}
                            </option>
                          );
                        })}
                      </select>
                    )}
                  />
                </div>
              </div>
            </div>
            </div>

          <div className="tab-content" style={{ display: tabIndex === 2 ? 'block' : 'none' }}>
        <div className="form-grid">
          <h6 className="subsection-header" style={{ gridColumn: '1 / -1' }}>Additional Address</h6>

          <div style={{ gridColumn: '1 / -1' }}>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '2rem', marginBottom: '2rem' }}>
              {additionalAddresses.map((address, idx) => (
                <div key={idx} className="address-card" style={{ position: 'relative' }}>
                  <h6 className="subsection-header">Address {idx + 1}</h6>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '1rem' }}>
                    <div className="form-field">
                      <label>Title</label>
                      <input
                        type="text"
                        className="form-input"
                        value={address.address_type || ""}
                        onChange={e => handleAdditionalAddressChange(idx, "address_type", e.target.value)}
                      />
                    </div>
                    <div className="form-field">
                      <label>GSTIN</label>
                      <div className="input-with-action">
                        <input
                          type="text"
                          className="form-input"
                          style={{ flex: 1 }}
                          value={address.gstin || ""}
                          onChange={e => handleAdditionalAddressChange(idx, "gstin", e.target.value)}
                        />
                        <button type="button" className="btn btn-secondary btn-small input-action-btn">Get</button>
                      </div>
                    </div>
                    {[1, 2, 3].map((n) => (
                      <div className="form-field" key={`additional_${idx}_address${n}`}>
                        <label>Address {n}</label>
                        <input
                          type="text"
                          className="form-input"
                          value={address[`address${n}`] || ""}
                          onChange={e => handleAdditionalAddressChange(idx, `address${n}`, e.target.value)}
                        />
                      </div>
                    ))}
                    <div className="form-field">
                      <label>City</label>
                      {String(address.country || "").toLowerCase() === "india" ? (
                        <select
                          className="form-select"
                          value={address.city || ""}
                          onChange={e => handleAdditionalAddressChange(idx, "city", e.target.value)}
                        >
                          <option value="">Select City</option>
                          {citiesList.map((c) => (
                            <option key={c} value={c}>{c}</option>
                          ))}
                        </select>
                      ) : (
                        <input
                          type="text"
                          className="form-input"
                          value={address.city || ""}
                          onChange={e => handleAdditionalAddressChange(idx, "city", e.target.value)}
                        />
                      )}
                    </div>
                    <div className="form-field">
                      <label>State</label>
                      {String(address.country || "").toLowerCase() === "india" ? (
                        <select
                          className="form-select"
                          value={address.state || ""}
                          onChange={e => handleAdditionalAddressChange(idx, "state", e.target.value)}
                        >
                          <option value="">Select State</option>
                          {indiaStates.map((s) => (
                            <option key={s} value={s}>{s}</option>
                          ))}
                        </select>
                      ) : (
                        <input
                          type="text"
                          className="form-input"
                          value={address.state || ""}
                          onChange={e => handleAdditionalAddressChange(idx, "state", e.target.value)}
                        />
                      )}
                    </div>
                    <div className="form-field">
                      <label>Country</label>
                      <select
                        className="form-select"
                        value={address.country || ''}
                        onChange={(e) => {
                          const selected = countries.find(c => c.name === e.target.value);
                          handleAdditionalAddressChange(idx, "country", e.target.value);
                          handleAdditionalAddressChange(idx, "country_code", selected ? selected.code : "");
                        }}
                      >
                        <option value="">Select country</option>
                        {countries && countries.map(c => (
                          <option key={`${c.name}-${c.code}`} value={c.name}>{c.name} ({c.code})</option>
                        ))}
                      </select>
                    </div>
                    <div className="form-field">
                      <label>Pincode</label>
                      <input
                        type="text"
                        className="form-input"
                        value={address.pincode || ""}
                        onChange={e => handleAdditionalAddressChange(idx, "pincode", e.target.value)}
                      />
                    </div>
                  </div>

                  {/* Key-Value Pairs Section */}
                  <h6 className="subsection-header" style={{ marginTop: '2rem', marginBottom: '1rem' }}>Additional Fields</h6>
                  {Array.isArray(address.keyValues) && address.keyValues.map((kv, kvIdx) => (
                    <div key={kvIdx} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr auto', gap: '1rem', marginBottom: '1rem', alignItems: 'flex-end' }}>
                      <div className="form-field">
                        <label>Key</label>
                        <input
                          type="text"
                          className="form-input"
                          value={kv.key || ""}
                          onChange={e => handleKeyValueChange(idx, kvIdx, "key", e.target.value)}
                        />
                      </div>
                      <div className="form-field">
                        <label>Value</label>
                        <input
                          type="text"
                          className="form-input"
                          value={kv.value || ""}
                          onChange={e => handleKeyValueChange(idx, kvIdx, "value", e.target.value)}
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveKeyValue(idx, kvIdx)}
                        className="btn btn-danger btn-small"
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={() => handleAddKeyValue(idx)}
                    className="btn btn-secondary btn-small"
                    style={{ marginBottom: '2rem' }}
                  >
                    + Add Field
                  </button>

                  <button
                    type="button"
                    onClick={() => handleRemoveAdditionalAddress(idx)}
                    className="btn btn-danger btn-small"
                    style={{ position: 'absolute', top: '8px', right: '8px' }}
                  >
                    Remove
                  </button>
                </div>
              ))}
              <div
                className="address-card"
                style={{
                  cursor: 'pointer',
                  border: '2px dashed #ccc',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  minWidth: '250px',
                  padding: '2rem',
                  color: '#666',
                }}
                onClick={handleAddAdditionalAddress}
              >
                <span style={{ fontSize: '2rem', marginRight: '0.5rem', color: 'var(--primary-color, #007bff)' }}>+</span>
                <span style={{ color: 'var(--primary-color, #007bff)' }}>Add Address</span>
              </div>
            </div>
          </div>

          <h6 className="subsection-header" style={{ gridColumn: '1 / -1' }}>Bank Information</h6>

          <div className="grid-col md-4 xs-12">
            <div className="form-field">
              <label htmlFor="bank_name">Bank Name</label>
              <input {...register("bank_name")} id="bank_name" type="text" className="form-input" />
            </div>
          </div>
          <div className="grid-col md-4 xs-12">
            <div className="form-field">
              <label htmlFor="branch_name">Branch Name</label>
              <input {...register("branch_name")} id="branch_name" type="text" className="form-input" />
            </div>
          </div>
          <div className="grid-col md-4 xs-12">
            <div className="form-field">
              <label htmlFor="branch_address">Branch Address</label>
              <input {...register("branch_address")} id="branch_address" type="text" className="form-input" />
            </div>
          </div>

          <div className="grid-col md-4 xs-12">
            <div className="form-field">
              <label htmlFor="account_number">Account Number</label>
              <input {...register("account_number")} id="account_number" type="text" className="form-input" />
            </div>
          </div>
          <div className="grid-col md-4 xs-12">
            <div className="form-field">
              <label htmlFor="ifsc_code">IFSC Code</label>
              <input {...register("ifsc_code")} id="ifsc_code" type="text" className="form-input" />
            </div>
          </div>

          <h6 className="subsection-header" style={{ gridColumn: '1 / -1' }}>Additional Bank Info</h6>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '2rem', marginBottom: '2rem', gridColumn: '1 / -1' }}>
              {additionalBankInfos.map((info, idx) => (
                <div key={idx} className="bank-info-card" style={{ position: 'relative' }}>
                  <h6 className="subsection-header">Bank Info {idx + 1}</h6>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
                    <div className="form-field">
                      <label>Bank Name</label>
                      <input
                        type="text"
                        className="form-input"
                        value={info.bank_name || ""}
                        onChange={e => handleAdditionalBankInfoChange(idx, "bank_name", e.target.value)}
                      />
                    </div>
                    <div className="form-field">
                      <label>Branch Name</label>
                      <input
                        type="text"
                        className="form-input"
                        value={info.branch_name || ""}
                        onChange={e => handleAdditionalBankInfoChange(idx, "branch_name", e.target.value)}
                      />
                    </div>
                    <div className="form-field">
                      <label>Branch Address</label>
                      <input
                        type="text"
                        className="form-input"
                        value={info.branch_address || ""}
                        onChange={e => handleAdditionalBankInfoChange(idx, "branch_address", e.target.value)}
                      />
                    </div>
                    <div className="form-field">
                      <label>Account Number</label>
                      <input
                        type="text"
                        className="form-input"
                        value={info.account_number || ""}
                        onChange={e => handleAdditionalBankInfoChange(idx, "account_number", e.target.value)}
                      />
                    </div>
                    <div className="form-field">
                      <label>IFSC Code</label>
                      <input
                        type="text"
                        className="form-input"
                        value={info.ifsc_code || ""}
                        onChange={e => handleAdditionalBankInfoChange(idx, "ifsc_code", e.target.value)}
                      />
                    </div>
                  </div>

                  {/* Key-Value Pairs Section */}
                  <h6 className="subsection-header" style={{ marginTop: '2rem', marginBottom: '1rem', gridColumn: '1 / -1' }}>Additional Fields</h6>
                  {Array.isArray(info.keyValues) && info.keyValues.map((kv, kvIdx) => (
                    <div key={kvIdx} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr auto', gap: '1rem', marginBottom: '1rem', alignItems: 'flex-end', gridColumn: '1 / -1' }}>
                      <div className="form-field">
                        <label>Key</label>
                        <input
                          type="text"
                          className="form-input"
                          value={kv.key || ""}
                          onChange={e => handleBankKeyValueChange(idx, kvIdx, "key", e.target.value)}
                        />
                      </div>
                      <div className="form-field">
                        <label>Value</label>
                        <input
                          type="text"
                          className="form-input"
                          value={kv.value || ""}
                          onChange={e => handleBankKeyValueChange(idx, kvIdx, "value", e.target.value)}
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveBankKeyValue(idx, kvIdx)}
                        className="btn btn-danger btn-small"
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={() => handleAddBankKeyValue(idx)}
                    className="btn btn-secondary btn-small"
                    style={{ marginBottom: '2rem', gridColumn: '1 / -1' }}
                  >
                    + Add Field
                  </button>

                  <button
                    type="button"
                    onClick={() => handleRemoveAdditionalBankInfo(idx)}
                    className="btn btn-danger btn-small"
                    style={{ position: 'absolute', top: '8px', right: '8px' }}
                  >
                    Remove
                  </button>
                </div>
              ))}
              <div
                className="bank-info-card"
                style={{
                  cursor: 'pointer',
                  border: '2px dashed #ccc',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  minWidth: '250px',
                  padding: '2rem',
                  color: '#666',
                }}
                onClick={handleAddAdditionalBankInfo}
              >
                <span style={{ fontSize: '2rem', marginRight: '0.5rem', color: 'var(--primary-color, #007bff)' }}>+</span>
                <span style={{ color: 'var(--primary-color, #007bff)' }}>Add Bank Info</span>
              </div>
            </div>

          <div style={{ gridColumn: '1 / -1' }}>
            <h6 className="subsection-header">Documents</h6>
            <div style={{ marginTop: '2rem' }}>
              <label className="btn btn-primary" style={{ display: 'inline-block', cursor: 'pointer' }}>
                ☁️ Upload Documents
                <input
                  type="file"
                  multiple
                  hidden
                  accept="image/*,.pdf,.doc,.docx"
                  onChange={handleDocumentUpload}
                />
              </label>

              {/* Document Preview Grid */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '2rem', marginTop: '2rem' }}>
                {uploadedDocuments.map((doc) => (
                  <div key={doc.id} className="document-card">
                    {doc.type?.startsWith?.('image/') ? (
                      // Render image preview
                      <img
                        src={doc.preview || (doc.file_url ? BASE_URL + doc.file_url : '')}
                        alt={doc.name || doc.document_type || 'Document'}
                        style={{
                          width: '100%',
                          height: '140px',
                          backgroundColor: '#f5f5f5',
                          objectFit: 'cover'
                        }}
                      />
                    ) : (
                      // Non-image files: plain preview area with file type
                      <div
                        style={{
                          height: '140px',
                          backgroundColor: '#e0e0e0',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '1.2rem',
                          fontWeight: 'bold',
                          color: '#666'
                        }}
                      >
                        {doc.name ? doc.name.split('.').pop().toUpperCase() : (doc.document_type || 'DOC')}
                      </div>
                    )}
                    <div style={{ padding: '0.5rem' }}>
                      {/* Inline editable metadata */}
                      <div style={{ marginTop: '0.5rem', marginBottom: '0.5rem' }}>
                        <select
                          className="form-select"
                          value={doc.document_type || ''}
                          onChange={(e) => handleInlineDocTypeChange(doc.id, e.target.value)}
                          style={{ fontSize: '0.875rem' }}
                        >
                          <option value="">Document Type</option>
                          {documentTypes.map(dt => (
                            <option key={dt} value={dt}>{dt}</option>
                          ))}
                        </select>
                      </div>

                      <div style={{ marginTop: '0.5rem' }}>
                        <input
                          type="text"
                          className="form-input"
                          placeholder="Document Number"
                          value={doc.document_number || doc.documentNumber || ''}
                          onChange={(e) => handleInlineDocNumberChange(doc.id, e.target.value)}
                          style={{ fontSize: '0.875rem' }}
                        />
                      </div>
                    </div>

                    <div className="document-actions">
                      <button
                        type="button"
                        onClick={() => handleViewDocument(doc)}
                        title="View"
                        className="btn btn-small"
                        style={{ padding: '0.25rem 0.5rem', fontSize: '1rem' }}
                      >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path d="M1 12C1 12 5 4 12 4C19 4 23 12 23 12C23 12 19 20 12 20C5 20 1 12 1 12Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                          <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="2"/>
                        </svg>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDownloadDocument(doc)}
                        title="Download"
                        className="btn btn-small"
                        style={{ padding: '0.25rem 0.5rem', fontSize: '1rem' }}
                      >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path d="M21 15V19C21 19.5304 20.7893 20.0391 20.4142 20.4142C20.0391 20.7893 19.5304 21 19 21H5C4.46957 21 3.96086 20.7893 3.58579 20.4142C3.21071 20.0391 3 19.5304 3 19V15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                          <polyline points="7,10 12,15 17,10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                          <line x1="12" y1="15" x2="12" y2="3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      </button>
                      {(
                        (doc.document_type && String(doc.document_type).toLowerCase() === 'photo') ||
                        (doc.name && String(doc.name).match(/\.(jpg|jpeg|png|gif|bmp|webp)$/i))
                      ) && (
                        <button
                          type="button"
                          onClick={() => handleEditDocument(doc)}
                          title="Edit/Crop"
                          className="btn btn-small"
                          style={{ padding: '0.25rem 0.5rem', fontSize: '1rem' }}
                        >
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M11 4H4C3.46957 4 2.96086 4.21071 2.58579 4.58579C2.21071 4.96086 2 5.46957 2 6V20C2 20.5304 2.21071 20.9609 2.58579 21.3359C2.96086 21.711 3.46957 21.9217 4 21.9217H18C18.5304 21.9217 19.0391 21.711 19.4142 21.3359C19.7893 20.9609 20 20.5304 20 20V13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                            <path d="M18.5 2.5C18.8978 2.10217 19.4374 1.87868 20 1.87868C20.5626 1.87868 21.1022 2.10217 21.5 2.5C21.8978 2.89782 22.1213 3.43739 22.1213 4C22.1213 4.56261 21.8978 5.10218 21.5 5.5L12 15L8 16L9 12L18.5 2.5Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                          </svg>
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => handleDeleteDocument(doc.id)}
                        title="Delete"
                        className="btn btn-small btn-danger"
                        style={{ padding: '0.25rem 0.5rem', fontSize: '1rem' }}
                      >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path d="M3 6H5H21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                          <path d="M19 6V20C19 20.5304 18.7893 21.0391 18.4142 21.4142C18.0391 21.7893 17.5304 22 17 22H7C6.46957 22 5.96086 21.7893 5.58579 21.4142C5.21071 21.0391 5 20.5304 5 20V6M8 6V4C8 3.46957 8.21071 2.96086 8.58579 2.58579C8.96086 2.21071 9.46957 2 10 2H14C14.5304 2 15.0391 2.21071 15.4142 2.58579C15.7893 2.96086 16 3.46957 16 4V6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                          <path d="M10 11V17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                          <path d="M14 11V17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="tab-content" style={{ display: tabIndex === 3 ? 'block' : 'none' }}>

        <div className="form-grid">
          {/* Legal information block (Authentication tab) - moved above authentication fields */}
          <h6 className="subsection-header" style={{ gridColumn: '1 / -1' }}>Legal Information</h6>
          <div className="grid-col md-3 xs-12">
            <div className="form-field">
              <label htmlFor="aadhar_number">Aadhar Number</label>
              <input {...register("aadhar_number")} id="aadhar_number" type="text" className="form-input" />
            </div>
          </div>
          <div className="grid-col md-3 xs-12">
            <div className="form-field">
              <label htmlFor="pan_number">PAN Number</label>
              <input {...register("pan_number")} id="pan_number" type="text" className="form-input" />
            </div>
          </div>
          <div className="grid-col md-3 xs-12">
            <div className="form-field">
              <label htmlFor="gstin_number">GSTIN</label>
              <input {...register("gstin_number")} id="gstin_number" type="text" className="form-input" />
            </div>
          </div>
          <div className="grid-col md-3 xs-12">
            <div className="form-field">
              <label htmlFor="msme_no">MSME No</label>
              <input {...register("msme_no")} id="msme_no" type="text" className="form-input" />
            </div>
          </div>

          {/* Authentication section - placed below legal information */}
          <h6 className="subsection-header" style={{ gridColumn: '1 / -1' }}>Authentication</h6>
          <div className="grid-col md-2 xs-12">
            <div className="form-field">
              <label htmlFor="username">User Name *</label>
              <Controller
                name="username"
                control={control}
                rules={{ required: "Username is required" }}
                render={({ field }) => (
                  <>
                    <input {...field} id="username" type="text" className={`form-input ${errors.username ? 'error' : ''}`} />
                    {errors.username && <span className="form-helper-text error">{errors.username.message}</span>}
                  </>
                )}
              />
            </div>
          </div>
          <div className="grid-col md-3 xs-12">
            <div className="form-field">
              <label htmlFor="password">Password *</label>
              <Controller
                name="password"
                control={control}
                rules={{
                  required: "Password is required",
                  pattern: {
                    value: /^(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]).{8,}$/,
                    message: "Password must be at least 8 characters, include an uppercase letter, a number, and a special character."
                  }
                }}
                render={({ field }) => (
                  <>
                    <div className="password-wrapper" style={{ display: 'flex', alignItems: 'center' }}>
                      <input
                        {...field}
                        id="password"
                        type={showPassword ? "text" : "password"}
                        className={`form-input ${errors.password ? 'error' : ''}`}
                        style={{ flex: 1 }}
                      />
                      <button
                        type="button"
                        onClick={handleClickShowPassword}
                        onMouseDown={handleMouseDownPassword}
                        className="btn btn-small password-toggle"
                        title="Toggle password visibility"
                      >
                        {showPassword ? '👁️‍🗨️' : '👁️'}
                      </button>
                    </div>
                    {errors.password && <span className="form-helper-text error">{errors.password.message}</span>}
                  </>
                )}
              />
            </div>
          </div>
          <div className="grid-col md-3 xs-12">
            <div className="form-field">
              <label htmlFor="confirmPassword">Confirm Password *</label>
              <Controller
                name="confirmPassword"
                control={control}
                rules={{
                  validate: value => value === getValues("password") || "Passwords do not match"
                }}
                render={({ field }) => (
                  <>
                    <div className="password-wrapper" style={{ display: 'flex', alignItems: 'center' }}>
                      <input
                        {...field}
                        id="confirmPassword"
                        type={showConfirmPassword ? "text" : "password"}
                        className={`form-input ${errors.confirmPassword ? 'error' : ''}`}
                        style={{ flex: 1 }}
                      />
                      <button
                        type="button"
                        onClick={handleClickShowConfirmPassword}
                        onMouseDown={handleMouseDownPassword}
                        className="btn btn-small password-toggle"
                        title="Toggle password visibility"
                      >
                        {showConfirmPassword ? '👁️‍🗨️' : '👁️'}
                      </button>
                    </div>
                    {errors.confirmPassword && <span className="form-helper-text error">{errors.confirmPassword.message}</span>}
                  </>
                )}
              />
            </div>
          </div>

          {/* Primary Key & User Code */}
          {defaultValues?.id && (
            <div className="grid-col md-2 xs-12">
              <div className="form-field">
                <label htmlFor="primary_key">Primary Key (ID)</label>
                <input
                  id="primary_key"
                  type="text"
                  className="form-input"
                  value={defaultValues?.id || ''}
                  readOnly
                />
              </div>
            </div>
          )}
          <div className="grid-col md-2 xs-12">
            <div className="form-field">
              <label htmlFor="usercode">User Code *</label>
              <Controller
                name="usercode"
                control={control}
                rules={{ required: "User code is required" }}
                render={({ field }) => (
                  <>
                    <input {...field} id="usercode" type="text" className={`form-input ${errors.usercode ? 'error' : ''}`} />
                    {errors.usercode && <span className="form-helper-text error">{errors.usercode.message}</span>}
                  </>
                )}
              />
            </div>
          </div>
        </div>

        
      </div>

      <div style={{ marginTop: '2rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          {/* Left: Reset */}
          <div>
            <button type="button" className="btn btn-secondary" onClick={handleResetForm}>
              Reset
            </button>
          </div>

          {/* Right: Back + Next (moved to right end) */}
          <div style={{ display: 'flex', gap: '1rem' }}>
            <button type="button" className="btn btn-secondary" onClick={handleBack} disabled={tabIndex === 0}>
              Back
            </button>
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => { if (tabIndex < 3) { handleNextWithValidation(); } else { handleSaveAndNext(); } }}
            >
              {tabIndex < 3 ? 'Next' : 'Submit'}
            </button>
          </div>
        </div>

      </form></div>

      {/* User Confirmation Dialog */}
      <div className="modal-overlay" style={{ display: dialogOpen ? 'flex' : 'none' }}>
        <div className="modal">
          <div className="modal-header">
            <h5 className="modal-title">{defaultValues ? 'User Updated' : 'User Created'}</h5>
            <button type="button" className="btn btn-close" onClick={handleDialogClose}>×</button>
          </div>
          <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            <div className="form-field">
              <label htmlFor="created_user_id">Primary Key (ID)</label>
              <input
                id="created_user_id"
                type="text"
                className="form-input"
                value={createdUser?.id ?? ''}
                readOnly
              />
            </div>
            <div className="form-field">
              <label htmlFor="user_code_confirm">User Code</label>
              <input
                id="user_code_confirm"
                type="text"
                className="form-input"
                value={usercode}
                onChange={(e) => setUsercode(e.target.value)}
              />
              <small style={{ color: '#666' }}>Edit user code if you want to change it. Ex : USR - 0001</small>
            </div>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={handleDialogClose}>Cancel</button>
            <button type="button" className="btn btn-primary" onClick={handleDialogSubmit}>Confirm</button>
          </div>
        </div>

        </div>

      {/* Image Crop Dialog */}
      {cropDialogOpen && (
        <div className="modal-overlay" style={{ display: 'flex' }}>
          <div className="modal">
            <div className="modal-header">
              <h2 className="modal-title">Crop Image</h2>
              <button 
                type="button" 
                className="modal-close" 
                onClick={handleCropCancel}
              >
                ✕
              </button>
            </div>
            <div className="modal-content">
              <div className="cropper-wrapper">
                <div className="cropper-container">
                  {cropImage && imageLoaded && (
                    <Cropper
                      image={cropImage}
                      crop={crop}
                      zoom={zoom}
                      cropShape="rect"
                      showGrid={true}
                      onCropChange={setCrop}
                      onCropComplete={onCropComplete}
                      onZoomChange={setZoom}
                    />
                  )}
                </div>
              </div>
              <div className="zoom-slider-container" style={{ marginTop: '12px' }}>
                <label>Zoom: </label>
                <input
                  type="range"
                  value={zoom}
                  min={0.1}
                  max={3}
                  step={0.1}
                  aria-labelledby="Zoom"
                  onChange={(e) => setZoom(Number(e.target.value))}
                  className="zoom-slider"
                />
              </div>
            </div>
            <div className="modal-footer">
              <button 
                type="button" 
                className="btn btn-secondary" 
                onClick={handleCropCancel}
              >
                Cancel
              </button>
              <button 
                type="button" 
                className="btn btn-primary" 
                onClick={handleCropSave}
              >
                Save Crop
              </button>
            </div>
          </div>
        </div>
      )}
      
      </>
    );
}

  export default AddOrEditUserForm;

