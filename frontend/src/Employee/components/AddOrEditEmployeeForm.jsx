import React, { useEffect, Fragment } from "react";
import { useForm, Controller, useWatch } from "react-hook-form";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { BASE_URL } from "../../config/Config" // adjust if needed
import Cropper from 'react-easy-crop';
import './addeditemployee.scss';
import industries from "../../User/industries.json";
import countries from "../../User/utils/countries";
import stateList from "../../User/utils/state_list.json";
import citiesList from "../../User/utils/cities-name-list.json";

const salutations = ["Mr", "Mrs", "Miss", "Dr", "Prof"];

const documentTypes = [
  "Employee Photo",
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

// Indian states list (used when country is India)
const indiaStates = Object.values(stateList);

// Add account types array for the dropdown
const accountTypes = [
  { label: "Employee", value: "is_employee" },
];

// TabPanel component - moved outside to prevent re-creation on each render
function TabPanel({ children, value, index }) {
  return value === index ? <div className="tab-content active" style={{ paddingTop: '16px' }}>{children}</div> : null;
}

const AddOrEditEmployeeForm = ({ defaultValues = null, onSubmitUser }) => {
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
    formState: { isDirty, errors },
  } = useForm({
    mode: 'onChange',
    defaultValues: {
      active: true,
      salutation: "",
      gender: "",
      username: "",
      usercode: "",
      aadhar_number: "",
      pan_number: "",
  }
  ,
  // Keep fields registered even when inputs unmount (e.g., tab panels)
  shouldUnregister: false,
});

  // Ref to the form so we can programmatically disable browser autocomplete/ autofill
  const formRef = React.useRef(null);

  // When mounted, enforce autocomplete/off and add hidden dummy username/password inputs
  React.useEffect(() => {
    const form = formRef.current;
    if (!form) return;

    const createDummy = (type, name, ac) => {
      const el = document.createElement('input');
      el.type = type;
      el.name = name;
      el.autocomplete = ac;
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

    try {
      form.prepend(passwordDummy);
      form.prepend(usernameDummy);
    } catch (e) {
      // ignore
    }

    const elems = form.querySelectorAll('input, textarea, select');
    elems.forEach((el) => {
      try {
        el.setAttribute('autocomplete', 'off');
        el.setAttribute('autocorrect', 'off');
        el.setAttribute('autocapitalize', 'off');
        el.setAttribute('spellcheck', 'false');
      } catch (e) {
        // ignore
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
  // Documents state
  const [uploadedDocuments, setUploadedDocuments] = React.useState([]);
  const [documentDialogOpen, setDocumentDialogOpen] = React.useState(false);
  const [currentDocument, setCurrentDocument] = React.useState(null);
  const [croppedImage, setCroppedImage] = React.useState(null);

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
  };

  const handleRemoveAdditionalAccountType = (idx) => {
    const removedType = additionalAccountTypes[idx];
    setAdditionalAccountTypes(additionalAccountTypes.filter((_, i) => i !== idx));
    
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
  };
    
  const isUser = watch("is_user", false); // default to false
  const watchedAccountTypesLocal = watch("account_types", "");
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

  // Fetch distributors when customer is selected
  useEffect(() => {
    let cancelled = false;
    const fetchDistributors = async () => {
      setIsLoadingDistributors(true);
      try {
        const resp = await axios.get(`${BASE_URL}/api/users`, { params: { user_type: 'distributor', limit: 1000 } });
        if (!cancelled) {
          // expect backend returns { data: users, total, ... } per GetAllUsers
          const users = Array.isArray(resp.data.data) ? resp.data.data : resp.data;
          setDistributors(users || []);
          // also update underOptions if underType === 'distributor'
          if (underType === 'distributor') setUnderOptions(users || []);
        }
      } catch (err) {
        console.error('Failed to fetch distributors', err);
        setDistributors([]);
      } finally {
        if (!cancelled) {
          setIsLoadingDistributors(false);
        }
      }
    };

    // fetch when dealer or customer is selected
    if (isDealerSelected || isCustomerSelected) fetchDistributors();

    return () => { cancelled = true; };
  }, [isDealerSelected, isCustomerSelected]);
  
  // Fetch suppliers when dealer or customer is selected
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

    if (isDealerSelected || isCustomerSelected) fetchSuppliers();

    return () => { cancelled = true; };
  }, [isDealerSelected, isCustomerSelected, underType]);
  
  // Fetch dealers when distributor or customer is selected
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

    if (isDistributorSelected || isCustomerSelected) fetchDealers();

    return () => { cancelled = true; };
  }, [isDistributorSelected, isCustomerSelected, underType]);

  // Fetch suppliers when requested (and when customer selected)
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

    if (isDealerSelected && underType === 'supplier') fetchSuppliers();

    return () => { cancelled = true; };
  }, [underType, isDealerSelected]);

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


  // Watch permanent address fields
    const permanentAddress = useWatch({
      control,
      name: [
        "address1", "address2", "address3", "city",
        "state", "permanent_country", "pincode"
      ],
    });


    // Debug logging for defaultValues
    // useEffect(() => {
    //   console.log("defaultValues:", defaultValues);
    // }, [defaultValues]);

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

      // Helper: extract country name from string or object
      const getCountryName = (country) => {
        if (!country) return "";
        if (typeof country === 'string') return country;
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
        username: defaultValues.username || defaultValues.user_name || "",
        usercode: defaultValues.usercode || "",
        password: defaultValues.plain_password || defaultValues.plainPassword || defaultValues.password || "",
        confirmPassword: defaultValues.plain_password || defaultValues.plainPassword || defaultValues.password || "",
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
        permanent_country_code: getCountryCode(permanentAddr?.country_code || permanentAddr?.country || defaultValues.permanent_country_code),
        permanent_gstin: permanentAddr?.gstin || permanentAddr?.gstin_number || defaultValues.permanent_gstin || "",
        // Contact country - fallback to permanent if not at top level, extract name and code
        country: getCountryName(defaultValues.country || defaultValues.permanent_country || permanentAddr?.country),
        country_code: getCountryCode(defaultValues.country_code || defaultValues.country || defaultValues.permanent_country_code || permanentAddr?.country_code || permanentAddr?.country),
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
                country: getCountryName(addr.country),
                // preserve country code if backend provides it under different keys
                country_code: getCountryCode(addr.country_code || addr.country),
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
              
              // Build preview URL for existing documents
              const previewUrl = doc.file_url ? (() => {
                try {
                  const base = String(BASE_URL || '').replace(/\/$/, '');
                  const path = String(doc.file_url).replace(/^\.\//, '').replace(/^\/+/, '');
                  return `${base}/${path}`;
                } catch (e) {
                  return doc.file_url;
                }
              })() : '';
              
              return {
                id: doc.id,
                document_type: doc.doc_type || "",
                document_number: doc.doc_number || "",
                file_url: doc.file_url || "",
                preview: previewUrl,
                type: inferredType,
                name: doc.doc_type || 'Document',
                // Don't include file object for existing documents
              };
            })
          : []
      );
  // Initialize account_types based on existing booleans (pick first one if multiple present)
  const selectedTypes = [];
  if (defaultValues.is_user) selectedTypes.push("is_user");
  if (defaultValues.is_customer) selectedTypes.push("is_customer");
  if (defaultValues.is_supplier) selectedTypes.push("is_supplier");
  if (defaultValues.is_employee) selectedTypes.push("is_employee");
  if (defaultValues.is_dealer) selectedTypes.push("is_dealer");
  if (defaultValues.is_distributor) selectedTypes.push("is_distributor");
  // For single-select UI, pick the first selected type or empty string
      setValue("account_types", selectedTypes.length ? selectedTypes[0] : "");
      // also initialize under_type / related ids if present in defaultValues
      if (defaultValues.distributor_id) {
        setValue('under_type', 'distributor');
        setValue('distributor_id', defaultValues.distributor_id);
      } else if (defaultValues.dealer_id) {
        setValue('under_type', 'dealer');
        setValue('dealer_id', defaultValues.dealer_id);
      } else if (defaultValues.supplier_id) {
        setValue('under_type', 'supplier');
        setValue('supplier_id', defaultValues.supplier_id);
      } else {
        setValue('under_type', '');
      }
      // set distributor and dealer selection if present in default values
      if (defaultValues.distributor_id) {
        setValue('distributor_id', defaultValues.distributor_id);
      }
      if (defaultValues.dealer_id) {
        setValue('dealer_id', defaultValues.dealer_id);
      }
    }
  }, [defaultValues, reset, setValue]);

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
        empcode: data.usercode || undefined,
        username: data.username || undefined,
        salutation: data.salutation || undefined,
        firstname: data.firstname || "",
        lastname: data.lastname || "",
        dob: formattedDob,
        gender: data.gender || "",
        country: data.country || undefined,
        country_code: data.country_code || "",
        mobile_number: data.mobile_number || "",
        email: data.email || "",
        aadhar_number: data.aadhar_number || undefined,
        pan_number: data.pan_number || undefined,
        password: data.password || undefined,
        // Permanent address fields
        permanent_address1: data.address1 || undefined,
        permanent_address2: data.address2 || undefined,
        permanent_address3: data.address3 || undefined,
        permanent_city: data.city || undefined,
        permanent_state: data.state || undefined,
        permanent_country: data.permanent_country || undefined,
        permanent_pincode: data.pincode || undefined,
  // Permanent GSTIN (separate from legal/ document GSTIN)
  permanent_gstin: data.permanent_gstin || undefined,
        // Primary bank information
        primary_bank_name: data.bank_name || undefined,
        primary_branch_name: data.branch_name || undefined,
        primary_branch_address: data.branch_address || undefined,
        primary_account_number: data.account_number || undefined,
        primary_ifsc_code: data.ifsc_code || undefined,
        // Include active/status flags so backend can persist user status
        active: (data.active === undefined) ? undefined : data.active,
        is_active: (data.active === undefined) ? undefined : data.active,
        status: (typeof data.active === 'boolean') ? (data.active ? 'active' : 'inactive') : undefined,
      };

      // Check required fields before sending - validate only the fields requested by UX
      const requiredFields = [
        { field: "salutation", label: "Salutation" },
        { field: "firstname", label: "First name" },
        { field: "gender", label: "Gender" },
        { field: "country", label: "Country" },
        { field: "mobile_number", label: "Mobile number" },
        { field: "email", label: "Email" },
        { field: "username", label: "User Name" },
        { field: "usercode", label: "Employee Code" },
      ];

      // Password and confirmPassword required only for new users
      if (!defaultValues?.id) {
        requiredFields.push({ field: "password", label: "Password" });
        requiredFields.push({ field: "confirmPassword", label: "Confirm Password" });
      }

      for (const { field, label } of requiredFields) {
        if (field === 'country') {
          const hasCountry = data.country || data.country_code;
          if (!hasCountry) {
            if (!continueNext) alert('Country is required.');
            return false;
          }
          continue;
        }

        if (!data[field]) {
          if (!continueNext) alert(`${label} is required.`);
          return false;
        }
      }

      // Ensure every document has a selected document type before saving
      if (uploadedDocuments && uploadedDocuments.length > 0) {
        const missingType = uploadedDocuments.filter(doc => !String(doc.document_type || '').trim());
        if (missingType.length > 0) {
          if (!continueNext) alert('Please select a Document Type for all documents before saving.');
          return false;
        }
      }

      // Ensure password and confirmPassword match for new users
      if (!defaultValues?.id) {
        if (data.password !== data.confirmPassword) {
          if (!continueNext) alert('Passwords do not match.');
          return false;
        }
      }

      let created;
      if (defaultValues?.id) {
        // Update employee
        console.log('Updating employee with payload:', payload);
        const response = await axios.put(`${BASE_URL}/api/employees/${defaultValues.id}`, payload);
        created = response.data;
      } else {
        // Add new employee
        console.log('Creating new employee with payload:', payload);
        const response = await axios.post(`${BASE_URL}/api/employees`, payload);
        created = response.data;
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

      if (!continueNext) {
        // Show confirmation dialog with returned user
        setCreatedUser(created);
        setUsercode(created.usercode || created.username || "");
        setDialogOpen(true);
      }
      onSubmitUser && onSubmitUser(created);

      return true;
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

  const handleEditDocument = (doc) => {
    // Only allow editing (crop/preview) for image documents
    const isImage = doc.type && doc.type.startsWith('image/');
    if (!isImage) {
      alert('Edit is only available for image documents');
      return;
    }
    
    // Ensure document has a preview URL (build it if missing for DB documents)
    const docWithPreview = {
      ...doc,
      preview: doc.preview || buildDocUrl(doc)
    };
    setCurrentDocument(docWithPreview);
    // Reset crop/zoom for new document
    setCrop({ x: 0, y: 0 });
    setZoom(1);
    setDocumentDialogOpen(true);
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

  const [crop, setCrop] = React.useState({ x: 0, y: 0 });
  const [zoom, setZoom] = React.useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = React.useState(null);

  const onCropComplete = React.useCallback((croppedArea, croppedAreaPixels) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);

  const createImage = (url) =>
    new Promise((resolve, reject) => {
      const image = new Image();
      image.addEventListener('load', () => resolve(image));
      image.addEventListener('error', (error) => reject(error));
      image.src = url;
    });

  const getCroppedImg = async (imageSrc, pixelCrop) => {
    const image = await createImage(imageSrc);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    canvas.width = pixelCrop.width;
    canvas.height = pixelCrop.height;

    ctx.drawImage(
      image,
      pixelCrop.x,
      pixelCrop.y,
      pixelCrop.width,
      pixelCrop.height,
      0,
      0,
      pixelCrop.width,
      pixelCrop.height
    );

    return new Promise((resolve) => {
      canvas.toBlob((blob) => {
        resolve(blob);
      }, 'image/jpeg');
    });
  };

  const handleSaveDocumentChanges = async () => {
    if (!currentDocument) return;

    // Validate that document type is selected
    if (!(currentDocument.document_type || currentDocument.name) || String(currentDocument.document_type || currentDocument.name).trim() === '') {
      alert('Please select a document type.');
      return;
    }

    try {
  let updatedDoc = { ...currentDocument };

      // Handle image cropping if it's an image
    if (currentDocument?.type?.startsWith?.('image/')) {
        const croppedImageBlob = await getCroppedImg(currentDocument.preview, croppedAreaPixels);
        const croppedImageUrl = URL.createObjectURL(croppedImageBlob);
        
        // Create a new file from the blob
        const croppedFile = new File([croppedImageBlob], currentDocument.name, {
          type: currentDocument.type,
        });

        updatedDoc = {
          ...updatedDoc,
          file: croppedFile,
          preview: croppedImageUrl
        };

        // Clean up old preview
        if (currentDocument.preview) {
          URL.revokeObjectURL(currentDocument.preview);
        }
      }

      // Update the document in state
      // Normalize document type/number fields for backend
      updatedDoc = {
        ...updatedDoc,
        document_type: updatedDoc.name || updatedDoc.document_type || '',
        document_number: updatedDoc.documentNumber || updatedDoc.document_number || ''
      };

      // Also keep legacy keys used in dialog
      if (updatedDoc.documentNumber === undefined) updatedDoc.documentNumber = updatedDoc.document_number || '';

      setUploadedDocuments(prev => prev.map(doc => 
        doc.id === currentDocument.id ? updatedDoc : doc
      ));

      setDocumentDialogOpen(false);
      setCurrentDocument(null);
      setCrop({ x: 0, y: 0 });
      setZoom(1);
    } catch (e) {
      console.error('Error saving document changes:', e);
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
    // Reset dialog state and navigate to employee list
    setDialogOpen(false);
    setCreatedUser(null);
    setUsercode("");
    navigate('/employeemanagement');
  };


  const handleDialogClose = () => {
    setDialogOpen(false);
    setCreatedUser(null);
    setUsercode("");
  };

  const handleDialogSubmit = async () => {
    if (!createdUser) {
      handleDialogClose();
      navigate('/employeemanagement');
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
    navigate('/employeemanagement');
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
        active: true,
        salutation: "",
        firstname: "",
        lastname: "",
        dob: "",
        gender: "",
        country: "",
        country_code: "",
        mobile_number: "",
        email: "",
        username: "",
        password: "",
        confirmPassword: "",
        usercode: "",
      };
      Object.entries(fields).forEach(([k, v]) => setValue(k, v, { shouldDirty: true }));
      fieldsToClear = Object.keys(fields);
    };

    const resetAddressesBankDocs = () => {
      const fields = {
        active: true,
        address1: "",
        address2: "",
        address3: "",
        city: "",
        state: "",
        permanent_country: "",
        permanent_country_code: "",
        pincode: "",
        bank_name: "",
        branch_name: "",
        branch_address: "",
        account_number: "",
        ifsc_code: "",
      };
      Object.entries(fields).forEach(([k, v]) => setValue(k, v, { shouldDirty: true }));

      // Revoke any object URLs created for previews to avoid memory leaks
      if (Array.isArray(uploadedDocuments) && uploadedDocuments.length) {
        uploadedDocuments.forEach(doc => {
          if (doc && doc.preview) {
            try { URL.revokeObjectURL(doc.preview); } catch (e) { /* ignore */ }
          }
        });
      }

      setUploadedDocuments([]);
      fieldsToClear = Object.keys(fields);
    };

    // Decide which tab to reset
    if (tabIndex === 0) {
      resetPersonal();
    } else if (tabIndex === 1) {
      resetAddressesBankDocs();
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

  const handleNext = async () => {
    // Validate required fields for the current tab before advancing
    const fields = tabRequiredFields[tabIndex] || [];
    if (fields.length) {
      const ok = await trigger(fields);
      if (!ok) return; // show validation errors and stay on current tab
    }
    setTabIndex((prev) => Math.min(prev + 1, 1));
  };
  const handleBack = () => {
    setTabIndex((prev) => Math.max(prev - 1, 0));
  }

  // Fields to validate per tab before allowing save-and-continue
  const tabRequiredFields = {
    0: ["salutation", "firstname", "gender", "mobile_number", "email", "country", "username", "password", "confirmPassword", "usercode"],
    1: [],
  };

  const handleSaveAndNext = async () => {
    const fields = tabRequiredFields[tabIndex] || [];
    let ok = true;
    if (fields.length) {
      ok = await trigger(fields);
    }
    if (!ok) return;

    const data = getValues();

    if (tabIndex < 1) {
      // Save data for the current tab only and remain on the same tab.
      await performSave(data, true);
      // Do not auto-advance; user can use "Next" to move tabs explicitly.
    } else {
      // last tab: perform full submit which will show dialog
      await handleSubmit(onSubmit)();
    }
  };

  return (
    <>
      <form
        ref={formRef}
        onSubmitCapture={(e) => { e.preventDefault(); handleSubmit(onSubmit)(); }}
        onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); } }}
      >
      {/* Header: title + status chip + view button */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
        <h5 style={{ margin: 0 }}>
          {defaultValues ? "Edit Employee" : "Add Employee"}
        </h5>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {/* status switch placed to the left of the View button; clearly editable */}
          <div className="toggle-switch">
            <input
              type="checkbox"
              checked={activeStatus}
              onChange={(e) => setValue("active", e.target.checked, { shouldDirty: true, shouldTouch: true })}
              id="active-switch"
            />
            <label htmlFor="active-switch">{activeStatus ? "Active" : "Inactive"}</label>
          </div>
          <button type="button" className="btn btn-outline" onClick={() => navigate(`/employeemanagement`)}>View</button>
        </div>
      </div>
      
      {/* Form organized into 2 tabs */}
      <div className="form-tabs">
        <button
          type="button"
          className={`form-tab ${tabIndex === 0 ? 'active' : ''}`}
          onClick={() => setTabIndex(0)}
        >
          Personal
        </button>
        <button
          type="button"
          className={`form-tab ${tabIndex === 1 ? 'active' : ''}`}
          onClick={() => setTabIndex(1)}
        >
          Addresses / Bank / Docs
        </button>
      </div>

      <TabPanel value={tabIndex} index={0}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
          <div style={{ gridColumn: '1 / -1' }}>
            <h6 style={{ marginTop: 0 }}>Personal Information</h6>
          </div>

          {/* Salutation */}
          <div className="form-field">
            <label htmlFor="salutation" className="required">Salutation</label>
            <div className="form-select-wrapper">
              <Controller
                name="salutation"
                control={control}
                rules={{ required: "Salutation is required" }}
                render={({ field }) => (
                  <select
                    {...field}
                    id="salutation"
                    className={errors.salutation ? 'error' : ''}
                  >
                    <option value="">Select Salutation</option>
                    {salutations.map((salute) => (
                      <option key={salute} value={salute}>
                        {salute}
                      </option>
                    ))}
                  </select>
                )}
              />
            </div>
            {errors.salutation && <div className="error-message">{errors.salutation.message}</div>}
          </div>

          {/* First Name */}
          <div className="form-field">
            <label htmlFor="firstname" className="required">First Name</label>
            <input
              id="firstname"
              type="text"
              {...register("firstname", { required: "First name is required" })}
              className={errors.firstname ? 'error' : ''}
            />
            {errors.firstname && <div className="error-message">{errors.firstname.message}</div>}
          </div>

          {/* Last Name */}
          <div className="form-field">
            <label htmlFor="lastname">Last Name</label>
            <input
              id="lastname"
              type="text"
              {...register("lastname")}
              className={errors.lastname ? 'error' : ''}
            />
            {errors.lastname && <div className="error-message">{errors.lastname.message}</div>}
          </div>

          {/* Date of Birth */}
          <div className="form-field">
            <label htmlFor="dob">Date of Birth</label>
            <input
              id="dob"
              type="date"
              {...register("dob")}
              className={errors.dob ? 'error' : ''}
            />
            {errors.dob && <div className="error-message">{errors.dob.message}</div>}
          </div>

          {/* Gender */}
          <div className="form-field">
            <label htmlFor="gender" className="required">Gender</label>
            <div className="form-select-wrapper">
              <Controller
                name="gender"
                control={control}
                rules={{ required: "Gender is required" }}
                render={({ field }) => (
                  <select
                    {...field}
                    id="gender"
                    className={errors.gender ? 'error' : ''}
                  >
                    <option value="">Select Gender</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                )}
              />
            </div>
            {errors.gender && <div className="error-message">{errors.gender.message}</div>}
          </div>

          <div style={{ gridColumn: '1 / -1' }}>
            <h6>Contact Information</h6>
          </div>

          {/* Country */}
          <div className="form-field">
            <label htmlFor="country" className="required">Country</label>
            <Controller
              name="country"
              control={control}
              rules={{ required: "Country is required" }}
              render={({ field }) => (
                <div className="form-select-wrapper">
                  <select
                    id="country"
                    {...field}
                    value={field.value || ""}
                    onChange={(e) => {
                      const val = e.target.value;
                      field.onChange(val);
                      const selected = countries.find(c => c.name === val);
                      setValue("country_code", selected?.code || "");
                    }}
                    className={errors.country ? 'error' : ''}
                  >
                    <option value="">Select Country</option>
                    {countries.map((c, idx) => (
                      <option key={`${c.name}-${idx}`} value={c.name}>
                        {c.name} ({c.code})
                      </option>
                    ))}
                  </select>
                </div>
              )}
            />
            {errors.country && <div className="error-message">{errors.country.message}</div>}
          </div>
          <Controller
            name="country_code"
            control={control}
            render={({ field }) => <input type="hidden" {...field} />}
          />

          {/* Mobile Number */}
          <div className="form-field">
            <label htmlFor="mobile_number" className="required">Mobile Number</label>
            <input
              id="mobile_number"
              type="tel"
              {...register("mobile_number", { required: "Mobile number is required", pattern: { value: /^\d{10}$/, message: "Mobile number must be 10 digits" } })}
              placeholder="10 digit number"
              className={errors.mobile_number ? 'error' : ''}
            />
            {errors.mobile_number && <div className="error-message">{errors.mobile_number.message}</div>}
          </div>

          {/* Email */}
          <div className="form-field">
            <label htmlFor="email" className="required">Email</label>
            <input
              id="email"
              type="email"
              {...register("email", { required: "Email is required", pattern: { value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, message: "Invalid email format" } })}
              className={errors.email ? 'error' : ''}
            />
            {errors.email && <div className="error-message">{errors.email.message}</div>}
          </div>

          <div style={{ gridColumn: '1 / -1' }}>
            <h6>Legal Information</h6>
          </div>

          {/* Aadhaar Number */}
          <div className="form-field">
            <label htmlFor="aadhar_number">Aadhaar Number</label>
            <input
              id="aadhar_number"
              type="text"
              {...register("aadhar_number")}
              className={errors.aadhar_number ? 'error' : ''}
            />
            {errors.aadhar_number && <div className="error-message">{errors.aadhar_number.message}</div>}
          </div>

          {/* PAN Number */}
          <div className="form-field">
            <label htmlFor="pan_number">PAN Number</label>
            <input
              id="pan_number"
              type="text"
              {...register("pan_number")}
              className={errors.pan_number ? 'error' : ''}
            />
            {errors.pan_number && <div className="error-message">{errors.pan_number.message}</div>}
          </div>

          <div style={{ gridColumn: '1 / -1' }}>
            <h6>Authentication</h6>
          </div>

          {/* Username */}
          <div className="form-field">
            <label htmlFor="username" className="required">User Name</label>
            <Controller
              name="username"
              control={control}
              rules={{ required: "Username is required" }}
              render={({ field }) => (
                <input
                  id="username"
                  type="text"
                  {...field}
                  className={errors.username ? 'error' : ''}
                />
              )}
            />
            {errors.username && <div className="error-message">{errors.username.message}</div>}
          </div>

          {/* Password */}
          <div className="form-field password-input-container">
            <label htmlFor="password" className={!defaultValues?.id ? 'required' : ''}>
              {defaultValues?.id ? "Password" : "Password *"}
            </label>
            <Controller
              name="password"
              control={control}
              rules={(() => {
                const basePattern = {
                  pattern: {
                    value: /^(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]).{8,}$/,
                    message: "Password must be at least 8 characters, include an uppercase letter, a number, and a special character."
                  }
                };
                if (!defaultValues?.id) {
                  return { required: "Password is required", ...basePattern };
                }
                return basePattern;
              })()}
              render={({ field }) => (
                <div style={{ position: 'relative' }}>
                  <input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    {...field}
                    className={errors.password ? 'error' : ''}
                  />
                  <button
                    type="button"
                    className="password-toggle-btn"
                    onClick={handleClickShowPassword}
                    onMouseDown={handleMouseDownPassword}
                  >
                    {showPassword ? '👁' : '👁‍🗨'}
                  </button>
                </div>
              )}
            />
            {errors.password && <div className="error-message">{errors.password.message}</div>}
          </div>

          {/* Confirm Password */}
          <div className="form-field password-input-container">
            <label htmlFor="confirmPassword" className={!defaultValues?.id ? 'required' : ''}>
              {defaultValues?.id ? "Confirm Password" : "Confirm Password *"}
            </label>
            <Controller
              name="confirmPassword"
              control={control}
              rules={(() => {
                return {
                  validate: (value) => {
                    const pwd = getValues("password");
                    if (!defaultValues?.id) {
                      if (!value) return "Confirm password is required";
                      if (value !== pwd) return "Passwords do not match";
                      return true;
                    }
                    if (pwd) {
                      if (!value) return "Confirm password is required when changing password";
                      if (value !== pwd) return "Passwords do not match";
                    }
                    return true;
                  }
                };
              })()}
              render={({ field }) => (
                <div style={{ position: 'relative' }}>
                  <input
                    id="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    {...field}
                    className={errors.confirmPassword ? 'error' : ''}
                  />
                  <button
                    type="button"
                    className="password-toggle-btn"
                    onClick={handleClickShowConfirmPassword}
                    onMouseDown={handleMouseDownPassword}
                  >
                    {showConfirmPassword ? '👁' : '👁‍🗨'}
                  </button>
                </div>
              )}
            />
            {errors.confirmPassword && <div className="error-message">{errors.confirmPassword.message}</div>}
          </div>

          {/* Primary Key & Employee Code */}
          {defaultValues?.id && (
            <div className="form-field">
              <label htmlFor="primarykey">Primary Key (ID)</label>
              <input
                id="primarykey"
                type="text"
                value={defaultValues?.id || ''}
                readOnly
              />
            </div>
          )}

          <div className="form-field">
            <label htmlFor="usercode" className="required">Employee Code</label>
            <Controller
              name="usercode"
              control={control}
              rules={{ required: "Employee code is required" }}
              render={({ field }) => (
                <input
                  id="usercode"
                  type="text"
                  {...field}
                  className={errors.usercode ? 'error' : ''}
                />
              )}
            />
            {errors.usercode && <div className="error-message">{errors.usercode.message}</div>}
          </div>
        </div>
      </TabPanel>

      <TabPanel value={tabIndex} index={1}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
          <div style={{ gridColumn: '1 / -1' }}>
            <h6 style={{ marginTop: 0 }}>Employee Address</h6>
          </div>

          {/* Address 1 */}
          <div className="form-field">
            <label htmlFor="address1">Address 1</label>
            <input id="address1" type="text" {...register("address1")} />
          </div>

          {/* Address 2 */}
          <div className="form-field">
            <label htmlFor="address2">Address 2</label>
            <input id="address2" type="text" {...register("address2")} />
          </div>

          {/* Address 3 */}
          <div className="form-field">
            <label htmlFor="address3">Address 3</label>
            <input id="address3" type="text" {...register("address3")} />
          </div>

          {/* City */}
          <div className="form-field">
            <label htmlFor="city">City</label>
            {String(permanentCountry || "").toLowerCase() === "india" ? (
              <div className="form-select-wrapper">
                <Controller
                  name="city"
                  control={control}
                  render={({ field }) => (
                    <select
                      {...field}
                      id="city"
                      className={errors.city ? 'error' : ''}
                    >
                      <option value="">Select City</option>
                      {citiesList.map((c) => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      ))}
                    </select>
                  )}
                />
              </div>
            ) : (
              <input id="city" type="text" {...register("city")} />
            )}
            {errors.city && <div className="error-message">{errors.city.message}</div>}
          </div>

          {/* State */}
          <div className="form-field">
            <label htmlFor="state">State</label>
            {String(permanentCountry || "").toLowerCase() === "india" ? (
              <div className="form-select-wrapper">
                <Controller
                  name="state"
                  control={control}
                  render={({ field }) => (
                    <select
                      {...field}
                      id="state"
                      className={errors.state ? 'error' : ''}
                    >
                      <option value="">Select State</option>
                      {indiaStates.map((s) => (
                        <option key={s} value={s}>
                          {s}
                        </option>
                      ))}
                    </select>
                  )}
                />
              </div>
            ) : (
              <input id="state" type="text" {...register("state")} />
            )}
            {errors.state && <div className="error-message">{errors.state.message}</div>}
          </div>

          {/* Permanent Country */}
          <div className="form-field">
            <label htmlFor="permanent_country">Country</label>
            <Controller
              name="permanent_country"
              control={control}
              render={({ field }) => (
                <div className="form-select-wrapper">
                  <select
                    id="permanent_country"
                    {...field}
                    value={field.value || ""}
                    onChange={(e) => {
                      const val = e.target.value;
                      field.onChange(val);
                      const selected = countries.find(c => c.name === val);
                      setValue("permanent_country_code", selected?.code || "");
                    }}
                  >
                    <option value="">Select Country</option>
                    {countries.map((c, idx) => (
                      <option key={`${c.name}-perm-${idx}`} value={c.name}>
                        {c.name} ({c.code})
                      </option>
                    ))}
                  </select>
                </div>
              )}
            />
            
            <Controller name="permanent_country_code" control={control} render={({ field }) => <input type="hidden" {...field} />} />
          </div>

          {/* Pincode */}
          <div className="form-field">
            <label htmlFor="pincode">Pincode</label>
            <input id="pincode" type="text" {...register("pincode")} />
          </div>

          <div style={{ gridColumn: '1 / -1' }}>
            <h6>Bank Information</h6>
          </div>

          {/* Bank Name */}
          <div className="form-field">
            <label htmlFor="bank_name">Bank Name</label>
            <input id="bank_name" type="text" {...register("bank_name")} />
          </div>

          {/* Branch Name */}
          <div className="form-field">
            <label htmlFor="branch_name">Branch Name</label>
            <input id="branch_name" type="text" {...register("branch_name")} />
          </div>

          {/* Branch Address */}
          <div className="form-field">
            <label htmlFor="branch_address">Branch Address</label>
            <input id="branch_address" type="text" {...register("branch_address")} />
          </div>

          {/* Account Number */}
          <div className="form-field">
            <label htmlFor="account_number">Account Number</label>
            <input id="account_number" type="text" {...register("account_number")} />
          </div>

          {/* IFSC Code */}
          <div className="form-field">
            <label htmlFor="ifsc_code">IFSC Code</label>
            <input id="ifsc_code" type="text" {...register("ifsc_code")} />
          </div>

          <div style={{ gridColumn: '1 / -1' }}>
            <h6>Documents</h6>
          </div>

          <div style={{ gridColumn: '1 / -1' }}>
            <label htmlFor="doc-upload" className="btn btn-primary" style={{ display: 'inline-block', marginBottom: '16px' }}>
              📤 Upload Documents
            </label>
            <input
              id="doc-upload"
              type="file"
              multiple
              hidden
              accept="image/*,.pdf,.doc,.docx"
              onChange={handleDocumentUpload}
            />

            {/* Document Preview Grid */}
            <div className="document-grid">
              {uploadedDocuments.map((doc) => {
                // Determine if document is an image by type or file extension
                const isImage = doc.type?.startsWith?.('image/') || 
                                (doc.file_url && /\.(jpg|jpeg|png|gif|webp)$/i.test(doc.file_url)) ||
                                (doc.name && /\.(jpg|jpeg|png|gif|webp)$/i.test(doc.name));
                
                const imageUrl = doc.preview || (doc.file_url ? (doc.file_url.startsWith('http') ? doc.file_url : BASE_URL + doc.file_url) : '');
                
                return (
                  <div key={doc.id} className="document-card">
                    <div className="document-preview">
                      {isImage && imageUrl ? (
                        <img
                          src={imageUrl}
                          alt={doc.name || doc.document_type || 'Document'}
                          onError={(e) => { e.target.style.display = 'none'; }}
                        />
                      ) : (
                        <div className="file-type">
                          {doc.name ? doc.name.split('.').pop().toUpperCase() : (doc.document_type || 'DOC')}
                        </div>
                      )}
                    </div>

                    <div className="document-info">
                      {/* Document Type selector on the card */}
                      <select
                        value={doc.document_type || doc.name || ''}
                        onChange={(e) => {
                          const val = e.target.value;
                          setUploadedDocuments(prev => prev.map(d => d.id === doc.id ? { ...d, document_type: val || '', name: val || d.name } : d));
                        }}
                        style={{ marginBottom: '8px' }}
                        required
                      >
                        <option value="">Select Document Type</option>
                        {documentTypes.map((type) => (
                          <option key={type} value={type}>{type}</option>
                        ))}
                      </select>

                      {/* Document Number input on the card */}
                      <input
                        type="text"
                        placeholder="Document Number"
                        value={doc.document_number || doc.documentNumber || ''}
                        onChange={(e) => {
                          const val = e.target.value;
                          setUploadedDocuments(prev => prev.map(d => d.id === doc.id ? { ...d, document_number: val, documentNumber: val } : d));
                        }}
                      />
                    </div>

                    <div className="document-actions">
                      <button
                        type="button"
                        onClick={() => handleViewDocument(doc)}
                        title="View"
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
                      >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path d="M21 15V19C21 19.5304 20.7893 20.0391 20.4142 20.4142C20.0391 20.7893 19.5304 21 19 21H5C4.46957 21 3.96086 20.7893 3.58579 20.4142C3.21071 20.0391 3 19.5304 3 19V15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                          <polyline points="7,10 12,15 17,10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                          <line x1="12" y1="15" x2="12" y2="3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleEditDocument(doc)}
                        title="Edit/Crop"
                      >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path d="M11 4H4C3.46957 4 2.96086 4.21071 2.58579 4.58579C2.21071 4.96086 2 5.46957 2 6V20C2 20.5304 2.21071 20.9609 2.58579 21.3359C2.96086 21.711 3.46957 21.9217 4 21.9217H18C18.5304 21.9217 19.0391 21.711 19.4142 21.3359C19.7893 20.9609 20 20.5304 20 20V13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                          <path d="M18.5 2.5C18.8978 2.10217 19.4374 1.87868 20 1.87868C20.5626 1.87868 21.1022 2.10217 21.5 2.5C21.8978 2.89782 22.1213 3.43739 22.1213 4C22.1213 4.56261 21.8978 5.10218 21.5 5.5L12 15L8 16L9 12L18.5 2.5Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteDocument(doc.id)}
                        title="Delete"
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
                );
              })}
            </div>
          </div>
        </div>
      </TabPanel>

      <div style={{ marginTop: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center' }}>
          {/* Left: Reset */}
          <div>
            <button type="button" className="btn btn-outline" onClick={handleResetForm}>
              Reset
            </button>
          </div>

          {/* Right: Back + Next/Submit */}
          <div style={{ marginLeft: 'auto', display: 'flex', gap: '8px' }}>
            <button
              type="button"
              className="btn btn-primary"
              onClick={(e) => { e.preventDefault(); handleBack(); }}
              disabled={tabIndex === 0}
            >
              Back
            </button>
            {tabIndex === 1 ? (
              <button type="submit" className="btn btn-primary">
                Submit
              </button>
            ) : (
              <button
                type="button"
                className="btn btn-primary"
                onClick={(e) => { e.preventDefault(); handleNext(); }}
                disabled={tabIndex === 1}
              >
                Next
              </button>
            )}
          </div>
        </div>
      </div>
      </form>

      {/* Dialog for Employee Created/Updated */}
      {dialogOpen && createdUser && (
      <div className="dialog-overlay open" onClick={handleDialogClose}>
        <div className="dialog-content sm" onClick={(e) => e.stopPropagation()}>
          <div className="dialog-header">
            {defaultValues ? 'Employee Updated' : 'Employee Created'}
          </div>
          <div className="dialog-body">
            <div className="form-field">
              <label htmlFor="dialog-id">Primary Key (ID)</label>
              <input
                id="dialog-id"
                type="text"
                value={createdUser?.id ?? ''}
                readOnly
              />
            </div>
            <div className="form-field" style={{ marginTop: '16px' }}>
              <label htmlFor="dialog-usercode">Employee Code</label>
              <input
                id="dialog-usercode"
                type="text"
                value={usercode}
                onChange={(e) => setUsercode(e.target.value)}
              />
              <p className="helper-text">Edit employee code if you want to change it. Ex : EMP - 0001</p>
            </div>
          </div>
          <div className="dialog-footer">
            <button type="button" className="btn btn-outline" onClick={handleDialogClose}>Cancel</button>
            <button type="button" className="btn btn-primary" onClick={handleDialogSubmit}>Confirm</button>
          </div>
        </div>
      </div>
      )}

      {/* Document Edit Dialog */}
      {documentDialogOpen && currentDocument && (
      <div className="dialog-overlay open" onClick={() => { setDocumentDialogOpen(false); setCurrentDocument(null); }}>
        <div className="dialog-content lg" onClick={(e) => e.stopPropagation()}>
          <div className="dialog-header">Edit Document</div>
          <div className="dialog-body">
            {/* Document type/number are edited on the document card now. Dialog only offers preview/crop. */}
            <h6 style={{ marginTop: 0 }}>Preview / Crop</h6>
            {currentDocument && (
              <>
                {currentDocument?.type?.startsWith?.('image/') || currentDocument?.file_url ? (
                  <>
                    <div className="cropper-wrapper">
                      <Cropper
                        image={currentDocument.preview || buildDocUrl(currentDocument)}
                        crop={crop}
                        zoom={zoom}
                        aspect={4 / 3}
                        onCropChange={setCrop}
                        onZoomChange={setZoom}
                        onCropComplete={onCropComplete}
                      />
                    </div>
                    <div className="slider-wrapper">
                      <label>Zoom</label>
                      <input
                        type="range"
                        min="1"
                        max="3"
                        step="0.1"
                        value={zoom}
                        onChange={(e) => setZoom(Number(e.target.value))}
                      />
                    </div>
                  </>
                ) : (
                  <div style={{ padding: '16px', backgroundColor: '#f5f5f5', textAlign: 'center', borderRadius: '4px' }}>
                    <p style={{ color: '#999', margin: 0 }}>
                      This document type cannot be cropped. View or download to see the full document.
                    </p>
                  </div>
                )}
              </>
            )}
          </div>
          <div className="dialog-footer">
            <button type="button" className="btn btn-outline" onClick={() => { setDocumentDialogOpen(false); setCurrentDocument(null); }}>Cancel</button>
            <button type="button" className="btn btn-primary" onClick={handleSaveDocumentChanges}>Save</button>
          </div>
        </div>
      </div>
      )}
    </>
  );
};


export default AddOrEditEmployeeForm;

