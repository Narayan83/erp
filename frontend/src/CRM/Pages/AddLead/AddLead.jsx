import React, { useState, useEffect, useLayoutEffect, useMemo, useRef } from 'react';
import Select, { components as RsComponents } from 'react-select';
import axios from 'axios';
import { BASE_URL, getAuthHeaders } from '../../../config/Config';
import countries from '../../../User/utils/countries.js';
import stateList from '../../../User/utils/state_list.json';
import cities from '../../../User/utils/cities-name-list.json';
import './_add_lead.scss';

/** Opaque input names — Chrome maps name="business"/"email"/"tel" to "Saved info" / address autofill */
const LEAD_INPUT_NAMES = {
  business: 'fld_x9k2m',
  firstName: 'fld_x9k3m',
  lastName: 'fld_x9k4m',
  designation: 'fld_x9k5m',
  mobile: 'fld_x9k6m',
  email: 'fld_x9k7m',
  website: 'fld_x9k8m',
  addressLine1: 'fld_q2w8n1',
  addressLine2: 'fld_q2w8n2',
  city: 'fld_q2w8n3',
  state: 'fld_q2w8n4',
  gstin: 'fld_x9kdm',
  requirement: 'fld_x9kem',
  product: 'fld_x9kfm',
  potential: 'fld_x9kgm',
  notes: 'fld_x9khm',
};

const LEAD_NAME_BY_INPUT = Object.fromEntries(
  Object.entries(LEAD_INPUT_NAMES).map(([formKey, domName]) => [domName, formKey])
);

/** Standard tokens Chrome uses for "Saved info" — decoy fields absorb autofill before real inputs */
const CHROME_AUTOFILL_DECOY_TOKENS = [
  'email',
  'username',
  'name',
  'given-name',
  'family-name',
  'tel',
  'organization',
  'street-address',
  'address-line1',
  'address-line2',
  'address-level1',
  'address-level2',
  'postal-code',
  'country',
];

/**
 * Chrome "Saved info" targets <input>/<textarea>; a single-line contenteditable div avoids that
 * while staying keyboard-accessible and label-associated via id.
 */
function LeadPlainLineField({ id, value, onValueChange, className, ariaInvalid }) {
  const ref = useRef(null);
  useEffect(() => {
    const el = ref.current;
    if (!el || document.activeElement === el) return;
    const v = value == null ? '' : String(value);
    if (el.textContent !== v) el.textContent = v;
  }, [value]);

  return (
    <div
      ref={ref}
      id={id}
      role="textbox"
      tabIndex={0}
      contentEditable
      suppressContentEditableWarning
      className={className}
      aria-multiline="false"
      aria-invalid={ariaInvalid ? 'true' : 'false'}
      onInput={(e) => {
        const t = (e.currentTarget.textContent ?? '')
          .replace(/\r?\n/g, ' ')
          .replace(/\u00a0/g, ' ');
        onValueChange(t);
      }}
      onKeyDown={(e) => {
        if (e.key === 'Enter') e.preventDefault();
      }}
      onPaste={(e) => {
        e.preventDefault();
        const plain = (e.clipboardData.getData('text/plain') || '').replace(/\r?\n/g, ' ');
        const el = ref.current;
        if (!el) return;
        el.focus();
        if (typeof document.execCommand === 'function') {
          document.execCommand('insertText', false, plain);
        } else {
          const merged = `${el.textContent ?? ''}${plain}`;
          el.textContent = merged;
          onValueChange(merged.replace(/\u00a0/g, ' '));
        }
      }}
      data-lpignore="true"
      data-1p-ignore="true"
    />
  );
}

const DEFAULT_FORM_DATA = {
  business: '',
  prefix: 'Mr.',
  firstName: '',
  lastName: '',
  designation: '',
  mobile: '',
  email: '',
  website: '',
  addressLine1: '',
  addressLine2: '',
  country: '',
  city: '',
  state: '',
  gstin: '',
  source: '',
  since: '',
  requirement: '',
  category: '',
  product: '',
  potential: '',
  assignedTo: '',
  stage: '',
  notes: '',
  tags: ''
};

const PREFIX_OPTIONS = ['Mr.', 'Ms.', 'Mrs.'];
const DEFAULT_CATEGORY_OPTIONS = [];
const STAGE_OPTIONS = ['New', 'Discussion', 'Appointment', 'Demo', 'Proposal', 'Qualified', 'Unqualified', 'Decided', 'Inactive', 'Rejected'];

const normalizeWhitespace = (value) => String(value ?? '').replace(/\s+/g, ' ').trim();
const LEAD_EMAIL_PLACEHOLDER = 'NA';
const EMAIL_REGEX = /\S+@\S+\.\S+/;

const isLeadEmailValid = (value) => {
  const normalizedValue = normalizeWhitespace(value);

  if (!normalizedValue) return true;

  return normalizedValue.toUpperCase() === LEAD_EMAIL_PLACEHOLDER || EMAIL_REGEX.test(normalizedValue);
};

const buildLeadContactName = ({ prefix, firstName, lastName, business }) => {
  const normalizedFirstName = normalizeWhitespace(firstName);
  const normalizedLastName = normalizeWhitespace(lastName);
  const normalizedBusiness = normalizeWhitespace(business);
  const nameParts = [normalizedFirstName, normalizedLastName].filter(Boolean);

  if (nameParts.length === 0) return normalizedBusiness;

  return [normalizeWhitespace(prefix), ...nameParts].filter(Boolean).join(' ');
};

const COUNTRY_OPTION_VALUES = countries
  .map((country) => normalizeWhitespace(country?.name))
  .filter(Boolean);

const STATE_OPTION_VALUES = Object.values(stateList)
  .map((state) => normalizeWhitespace(state))
  .filter(Boolean);

const CITY_OPTION_VALUES = cities
  .map((city) => normalizeWhitespace(city))
  .filter(Boolean);

const createSelectLookup = (items = [], labelKeys = [], aliasKeys = []) => {
  const labels = [];
  const lookup = {};

  const register = (candidate, label) => {
    const normalizedCandidate = normalizeWhitespace(candidate);
    const normalizedLabel = normalizeWhitespace(label);

    if (!normalizedCandidate || !normalizedLabel) return;

    lookup[normalizedCandidate.toLowerCase()] = normalizedLabel;
  };

  items.forEach((item) => {
    const label = normalizeWhitespace(
      labelKeys.map((key) => item?.[key]).find((value) => normalizeWhitespace(value))
    );

    if (!label) return;

    labels.push(label);
    register(label, label);

    aliasKeys.forEach((key) => {
      register(item?.[key], label);
    });
  });

  return {
    options: Array.from(new Set(labels)),
    lookup
  };
};

const extractSelectCandidates = (value) => {
  if (value === undefined || value === null) return [];

  if (Array.isArray(value)) {
    return value.flatMap(extractSelectCandidates).filter(Boolean);
  }

  if (typeof value === 'object') {
    return [
      value.name,
      value.Name,
      value.title,
      value.Title,
      value.label,
      value.Label,
      value.value,
      value.Value,
      value.code,
      value.Code,
      value.id,
      value.ID
    ].flatMap(extractSelectCandidates).filter(Boolean);
  }

  const normalized = normalizeWhitespace(value);
  if (!normalized) return [];

  const parts = normalized.includes(',')
    ? normalized.split(',').map((part) => normalizeWhitespace(part)).filter(Boolean)
    : [];

  return [normalized, ...parts];
};

const normalizeSelectValue = (value, options = [], lookup = {}) => {
  const candidates = extractSelectCandidates(value);
  if (candidates.length === 0) return '';

  for (const candidate of candidates) {
    const mapped = lookup[normalizeWhitespace(candidate).toLowerCase()];
    if (mapped) return mapped;
  }

  const normalizedOptions = options.map((option) => normalizeWhitespace(option)).filter(Boolean);
  if (normalizedOptions.length === 0) return candidates[0];

  for (const candidate of candidates) {
    const match = normalizedOptions.find((option) => option.toLowerCase() === candidate.toLowerCase());
    if (match) return match;
  }

  return candidates[0];
};

const splitLeadName = (leadData) => {
  const resolveKnownPrefix = (value) => {
    const normalized = normalizeWhitespace(value).replace(/\./g, '').toLowerCase();
    if (!normalized) return '';

    if (normalized === 'mr') return 'Mr.';
    if (normalized === 'ms') return 'Ms.';
    if (normalized === 'mrs') return 'Mrs.';

    return '';
  };

  const splitFromSource = (source) => {
    const nameSource = normalizeWhitespace(source);
    if (!nameSource) return { parsedPrefix: '', parsedFirstName: '', parsedLastName: '' };

    const parts = nameSource.split(' ').filter(Boolean);
    if (parts.length === 0) return { parsedPrefix: '', parsedFirstName: '', parsedLastName: '' };

    const matchedPrefix = resolveKnownPrefix(parts[0]);
    if (matchedPrefix) {
      return {
        parsedPrefix: matchedPrefix,
        parsedFirstName: parts[1] || '',
        parsedLastName: parts.slice(2).join(' ')
      };
    }

    return {
      parsedPrefix: '',
      parsedFirstName: parts[0] || '',
      parsedLastName: parts.slice(1).join(' ')
    };
  };

  const explicitPrefix = resolveKnownPrefix(leadData?.prefix || leadData?.salutation);
  const sanitizeNamePart = (value) => {
    const normalized = normalizeWhitespace(value);
    if (!normalized) return '';

    const token = normalized.toLowerCase();
    if (token === 'na' || token === 'n/a' || token === '-') return '';

    return normalized;
  };

  let prefix = explicitPrefix || 'Mr.';
  let firstName = sanitizeNamePart(
    leadData?.firstName || leadData?.firstname || leadData?.first_name || leadData?.FirstName || ''
  );
  let lastName = sanitizeNamePart(
    leadData?.lastName || leadData?.lastname || leadData?.last_name || leadData?.LastName || ''
  );

  const { parsedPrefix, parsedFirstName, parsedLastName } = splitFromSource(
    leadData?.contact || leadData?.name || leadData?.Name
  );

  if (!firstName && !lastName) {
    if (parsedPrefix) prefix = parsedPrefix;
    firstName = parsedFirstName;
    lastName = parsedLastName;
  } else if (parsedFirstName) {
    const existingFull = normalizeWhitespace([firstName, lastName].filter(Boolean).join(' '));
    const parsedFull = normalizeWhitespace([parsedFirstName, parsedLastName].filter(Boolean).join(' '));

    // Repair cases where imported first/last is a suffix of the full contact name.
    if (!firstName || (parsedFull && existingFull && parsedFull.toLowerCase().endsWith(existingFull.toLowerCase()) && parsedFull.length > existingFull.length)) {
      if (parsedPrefix) prefix = parsedPrefix;
      firstName = parsedFirstName;
      lastName = parsedLastName;
    }
  }

  return { prefix, firstName, lastName };
};

const resolveInitialAssignedTo = (leadData) => {
  const rawValue =
    leadData?.assigned_to_id ??
    leadData?.assignedToId ??
    leadData?.AssignedToID ??
    leadData?.assignedTo ??
    leadData?.assignedToName ??
    leadData?.assigned_to_name;
  if (rawValue === undefined || rawValue === null) return '';

  if (typeof rawValue === 'object') {
    return rawValue.id || rawValue.ID || rawValue.value || rawValue.Value || rawValue.name || rawValue.Name || '';
  }

  return rawValue;
};

const resolveInitialProduct = (leadData) => {
  const productId = leadData?.product_id ?? leadData?.productId ?? leadData?.ProductID;
  if (productId !== undefined && productId !== null && productId !== '') return productId;

  const textValue =
    leadData?.productName ??
    leadData?.product_name ??
    leadData?.ProductName ??
    leadData?.productname;
  if (textValue !== undefined && textValue !== null && String(textValue).trim() !== '') {
    return textValue;
  }

  const productObj = leadData?.product;
  if (productObj && typeof productObj === 'object') {
    return productObj.ID || productObj.id || productObj.Name || productObj.name || productObj.Code || productObj.code || '';
  }

  const rawValue = leadData?.product;
  if (rawValue === undefined || rawValue === null) return '';
  return rawValue;
};

const buildInitialFormData = (leadData, sourceOptions = [], categoryOptions = [], tagsOptions = [], sourceLookup = {}, tagsLookup = {}) => {
  if (!leadData) {
    return { ...DEFAULT_FORM_DATA };
  }

  const { prefix, firstName, lastName } = splitLeadName(leadData);
  const normalizedCountry = normalizeSelectValue(
    leadData.country || leadData.Country,
    COUNTRY_OPTION_VALUES
  );
  const isIndiaSelected = normalizedCountry.toLowerCase() === 'india';

  return {
    business: leadData.business || leadData.Business || '',
    prefix: normalizeSelectValue(prefix, PREFIX_OPTIONS) || 'Mr.',
    firstName,
    lastName,
    designation: leadData.designation || leadData.Designation || '',
    mobile: leadData.mobile || leadData.Mobile || '',
    email: leadData.email || leadData.Email || '',
    website: leadData.website || leadData.Website || '',
    addressLine1: leadData.addressLine1 || leadData.AddressLine1 || leadData.addressline1 || '',
    addressLine2: leadData.addressLine2 || leadData.AddressLine2 || leadData.addressline2 || '',
    country: normalizedCountry,
    city: isIndiaSelected
      ? normalizeSelectValue(leadData.city || leadData.City, CITY_OPTION_VALUES)
      : leadData.city || leadData.City || '',
    state: isIndiaSelected
      ? normalizeSelectValue(leadData.state || leadData.State, STATE_OPTION_VALUES)
      : leadData.state || leadData.State || '',
    gstin: leadData.gstin || leadData.GSTIN || '',
    source: normalizeSelectValue(leadData.source || leadData.Source || leadData.enquiry_source, sourceOptions, sourceLookup),
    since: leadData.since || leadData.Since || '',
    requirement: leadData.requirements || leadData.requirement || '',
    category: normalizeSelectValue(leadData.category || leadData.Category || leadData.lead_category, categoryOptions),
    product: resolveInitialProduct(leadData),
    potential: leadData.potential || leadData.Potential || '',
    assignedTo: resolveInitialAssignedTo(leadData),
    stage: normalizeSelectValue(leadData.stage || leadData.Stage || leadData.lead_stage, STAGE_OPTIONS),
    notes: leadData.notes || leadData.Notes || '',
    tags: normalizeSelectValue(leadData.tags || leadData.Tags || leadData.lead_tags, tagsOptions, tagsLookup)
  };
};

const AddLead = ({ isOpen, onClose, onAddLeadSubmit, leadData, products: parentProducts = [], assignedToOptions: parentAssignedToOptions = [] }) => {
  const [formData, setFormData] = useState(DEFAULT_FORM_DATA);

  const [errors, setErrors] = useState({});
  const [leads, setLeads] = useState([]);
  const [products, setProducts] = useState([]);
  const [saveError, setSaveError] = useState('');
  const [isProductOthers, setIsProductOthers] = useState(false);
  const [sourceOptions, setSourceOptions] = useState([]);
  const [sourceLookup, setSourceLookup] = useState({});
  const [leadCategoryOptions, setLeadCategoryOptions] = useState([]);
  const [tagsOptions, setTagsOptions] = useState([]);
  const [tagsLookup, setTagsLookup] = useState({});
  const [assignedToOptions, setAssignedToOptions] = useState(Array.isArray(parentAssignedToOptions) && parentAssignedToOptions.length > 0 ? parentAssignedToOptions : []);

  const normalizeProductsList = (list) => {
    if (!Array.isArray(list)) return [];
    return list
      .map((p) => ({
        ID: p?.id ?? p?.ID,
        Name: p?.name ?? p?.Name,
        Code: p?.code ?? p?.Code,
      }))
      .filter((p) => p.ID || p.Name);
  };

  /**
   * Chrome ignores autocomplete=off for address-style fields; new-password suppresses Saved info.
   * type=search avoids email/tel-style heuristics on the filter box.
   */
  const selectAntiAutofillComponents = useMemo(
    () => ({
      Input: (props) => (
        <RsComponents.Input
          {...props}
          type="search"
          autoComplete="new-password"
          autoCorrect="off"
          autoCapitalize="off"
          spellCheck="false"
          data-lpignore="true"
          data-1p-ignore="true"
        />
      ),
    }),
    []
  );

  /**
   * New name/id on each modal open breaks Chrome's saved-field mapping; useLayoutEffect runs before paint.
   * Real fields use data-lead-field so handleChange does not depend on DOM name.
   */
  const [leadFieldInstanceId, setLeadFieldInstanceId] = useState('');
  useLayoutEffect(() => {
    if (!isOpen) {
      setLeadFieldInstanceId('');
      return;
    }
    setLeadFieldInstanceId(`ln_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 11)}`);
  }, [isOpen]);

  const leadDom = (key) => `${LEAD_INPUT_NAMES[key]}_${leadFieldInstanceId}`;

  // Helper function to normalize mobile number to 10 digits
  const normalizeMobile = (mobile) => {
    if (!mobile) return '';
    // Remove all non-digit characters
    const digits = mobile.replace(/[^0-9]/g, '');
    // Take last 10 digits (handles cases like +91 prefix, 0 prefix, etc.)
    return digits.slice(-10);
  };

  useEffect(() => {
    if (!isOpen) return;

    const nextFormData = buildInitialFormData(leadData, sourceOptions, leadCategoryOptions, tagsOptions, sourceLookup, tagsLookup);
    nextFormData.mobile = normalizeMobile(nextFormData.mobile);

    setFormData(nextFormData);
    setErrors({});
    setSaveError('');
    setIsProductOthers(false);
  }, [leadData, isOpen]);

  useEffect(() => {
    if (Array.isArray(parentAssignedToOptions) && parentAssignedToOptions.length > 0) {
      setAssignedToOptions(parentAssignedToOptions);
    }
  }, [parentAssignedToOptions]);

  useEffect(() => {
    if (!isOpen) return;

    setFormData((prev) => {
      const nextPrefix = normalizeSelectValue(prev.prefix, PREFIX_OPTIONS) || 'Mr.';
      const nextSource = normalizeSelectValue(prev.source, sourceOptions, sourceLookup);
      const nextCategory = normalizeSelectValue(prev.category, leadCategoryOptions);
      const nextStage = normalizeSelectValue(prev.stage, STAGE_OPTIONS);
      const nextTags = normalizeSelectValue(prev.tags, tagsOptions, tagsLookup);

      if (
        nextPrefix === prev.prefix &&
        nextSource === prev.source &&
        nextCategory === prev.category &&
        nextStage === prev.stage &&
        nextTags === prev.tags
      ) {
        return prev;
      }

      return {
        ...prev,
        prefix: nextPrefix,
        source: nextSource,
        category: nextCategory,
        stage: nextStage,
        tags: nextTags
      };
    });
  }, [isOpen, sourceOptions, sourceLookup, tagsOptions, tagsLookup]);

  const handlePlainLineChange = (fieldKey) => (text) => {
    setFormData((prev) => ({ ...prev, [fieldKey]: text }));
    setErrors((prev) => {
      if (!prev[fieldKey]) return prev;
      if (String(text).trim()) {
        const next = { ...prev };
        delete next[fieldKey];
        return next;
      }
      return prev;
    });
  };

  const handleCountrySelect = (option) => {
    const nextCountry = normalizeSelectValue(option?.value, COUNTRY_OPTION_VALUES);
    const isIndiaSelected = nextCountry.toLowerCase() === 'india';

    setFormData((prev) => ({
      ...prev,
      country: nextCountry,
      state: isIndiaSelected ? normalizeSelectValue(prev.state, STATE_OPTION_VALUES) : prev.state,
      city: isIndiaSelected ? normalizeSelectValue(prev.city, CITY_OPTION_VALUES) : prev.city
    }));
  };

  const updateSelectField = (fieldName, rawValue, options = [], lookup = {}, fallbackValue = '') => {
    const normalizedValue = normalizeSelectValue(rawValue, options, lookup) || fallbackValue;

    setFormData((prev) => ({
      ...prev,
      [fieldName]: normalizedValue
    }));

    setErrors((prev) => {
      if (!prev[fieldName]) return prev;

      if (normalizedValue && String(normalizedValue).trim()) {
        const next = { ...prev };
        delete next[fieldName];
        return next;
      }

      return prev;
    });
  };

  const handleChange = (e) => {
    const dataKey = e.target.getAttribute('data-lead-field');
    const rawName = e.target.name;
    const name = dataKey || LEAD_NAME_BY_INPUT[rawName] || rawName;
    const { value } = e.target;
    let newValue = value;
    if (name === 'mobile') {
      newValue = value.replace(/[^0-9]/g, '').slice(0, 10);
    }

    // Update form value
    setFormData(prev => ({ ...prev, [name]: newValue }));

    // Clear related error if the field becomes valid/fills
    setErrors(prev => {
      const next = { ...prev };
      // Name: only firstName is required
      if (name === 'firstName') {
        if (String(newValue).trim()) delete next.name;
        return next;
      }
      if (name === 'lastName') {
        // lastName is optional, no validation needed
        return next;
      }

      if (name === 'mobile') {
        if (/^[0-9]{10}$/.test(newValue)) delete next.mobile;
        return next;
      }

      if (name === 'email') {
        if (isLeadEmailValid(newValue)) delete next.email;
        return next;
      }

      // Required text fields: clear when non-empty
      if (name === 'business') {
        if (String(newValue).trim()) delete next.business;
        return next;
      }

      // Generic: if the field had an error and now has content, remove it
      if (next[name] && String(newValue).trim()) {
        delete next[name];
      }

      return next;
    });
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.business.trim()) {
      newErrors.business = 'Business is required';
    }
    
    if (!formData.mobile.trim()) {
      newErrors.mobile = 'Mobile number is required';
    } else if (!/^[0-9]{10}$/.test(formData.mobile)) {
      newErrors.mobile = 'Enter a valid 10-digit mobile number';
    }
    
    if (!isLeadEmailValid(formData.email)) {
      newErrors.email = 'Enter a valid email address';
    }

    // Validate source (required)
    if (!formData.source || String(formData.source).trim() === '') {
      newErrors.source = 'Source is required';
    }

    // Validate since only when provided
    if (formData.since && String(formData.since).trim() !== '') {
      const d = new Date(formData.since);
      if (isNaN(d)) {
        newErrors.since = 'Enter a valid date for Since';
      }
    }

    // Validate assignedTo only when provided. Allow matching by id or name (case-insensitive)
    if (formData.assignedTo && String(formData.assignedTo).trim()) {
      const matchAssigned = assignedToOptions.some(opt =>
        String(opt.id) === String(formData.assignedTo) ||
        (opt.name && opt.name.toLowerCase() === String(formData.assignedTo).toLowerCase())
      );
      if (!matchAssigned) newErrors.assignedTo = 'Please select a valid assignee';
    }

    // Validate product only when provided. Allow matching by id or name (case-insensitive)
    if (formData.product && String(formData.product).trim() && !isProductOthers) {
      const matchProduct = products.some(p =>
        String(p.ID) === String(formData.product) ||
        String(p.id) === String(formData.product) ||
        (p.Name && p.Name.toLowerCase() === String(formData.product).toLowerCase()) ||
        (p.name && p.name.toLowerCase() === String(formData.product).toLowerCase())
      );
      if (!matchProduct) newErrors.product = 'Please select a valid product';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Fetch all leads from backend
  const fetchLeads = async () => {
    try {
      const res = await axios.get(`${BASE_URL}/api/leads`);
      setLeads(res.data.data || res.data || []);
    } catch (err) {
      console.error('Error fetching leads:', err);
    }
  };

  // Fetch products from backend
  const fetchProducts = async () => {
    try {
      const res = await axios.get(`${BASE_URL}/api/lead-products`, {
        params: { active: true },
        headers: getAuthHeaders(),
      });
      const productList = res.data.data || res.data || [];
      const normalizedProducts = normalizeProductsList(productList);
      setProducts(normalizedProducts);
    } catch (err) {
      console.error('Error fetching products:', err);
      setProducts([]);
    }
  };

  useEffect(() => {
    fetchLeads();
  }, []);

  useEffect(() => {
    const normalizedParentProducts = normalizeProductsList(parentProducts);
    if (normalizedParentProducts.length > 0) {
      setProducts(normalizedParentProducts);
    }
  }, [parentProducts]);

  useEffect(() => {
    if (!isOpen) return;
    if (Array.isArray(parentProducts) && parentProducts.length > 0) return;
    fetchProducts();
  }, [isOpen, parentProducts]);

  // Add new lead to backend
  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaveError('');
    if (validateForm()) {
      try {
        const normalizedPrefix = normalizeSelectValue(formData.prefix, PREFIX_OPTIONS) || 'Mr.';
        const normalizedSource = normalizeSelectValue(formData.source, sourceOptions, sourceLookup);
        const normalizedCategory = normalizeSelectValue(formData.category, leadCategoryOptions);
        const normalizedStage = normalizeSelectValue(formData.stage, STAGE_OPTIONS);
        const normalizedTags = normalizeSelectValue(formData.tags, tagsOptions, tagsLookup);

        // Normalize mobile number before saving
        const normalizedMobile = normalizeMobile(formData.mobile);
        const contact = buildLeadContactName({
          prefix: normalizedPrefix,
          firstName: formData.firstName,
          lastName: formData.lastName,
          business: formData.business,
        });
        
        // Resolve assigned_to_id from numeric id or name
        let assigned_to_id = undefined;
        if (formData.assignedTo && formData.assignedTo !== '') {
          const asNum = Number(formData.assignedTo);
          if (!isNaN(asNum) && assignedToOptions.some(opt => Number(opt.id) === asNum)) {
            assigned_to_id = asNum;
          } else {
            const found = assignedToOptions.find(opt => opt.name && opt.name.toLowerCase() === String(formData.assignedTo).toLowerCase());
            if (found) assigned_to_id = found.id;
          }
        }

        // Resolve selected lead-product name
        let productName = '';
        if (formData.product && formData.product !== '') {
          if (isProductOthers) {
          // Custom product entered by user
            productName = formData.product;
          } else {
            const asNum = Number(formData.product);
            if (!isNaN(asNum)) {
              // Find product name by ID
              const foundProduct = products.find(p => (p.ID === asNum || p.id === asNum));
              productName = foundProduct ? (foundProduct.Name || foundProduct.name || '') : '';
            } else {
              const found = products.find(p =>
                String(p.ID) === String(formData.product) ||
                String(p.id) === String(formData.product) ||
                (p.Name && p.Name.toLowerCase() === String(formData.product).toLowerCase()) ||
                (p.name && p.name.toLowerCase() === String(formData.product).toLowerCase())
              );
              if (found) {
                productName = found.Name || found.name || '';
              }
            }
          }
        }
        
        let potential = parseFloat(formData.potential);
        if (isNaN(potential)) potential = 0;

        // Ensure manual submissions record their source
        let payload = {
          business: formData.business,
          contact,
          name: contact, // Include both for backend compatibility
          prefix: normalizedPrefix,
          salutation: normalizedPrefix,
          firstName: formData.firstName,
          lastName: formData.lastName,
          designation: formData.designation,
          mobile: normalizedMobile,
          email: formData.email,
          city: formData.city,
          state: formData.state,
          country: formData.country,
          source: normalizedSource || 'Filling Form',
          enquiry_source: normalizedSource || 'Filling Form',
          stage: normalizedStage,
          lead_stage: normalizedStage,
          potential,
          since: formData.since ? new Date(formData.since).toISOString() : new Date().toISOString(),
          gstin: formData.gstin,
          website: formData.website,
          requirements: formData.requirement,
          notes: formData.notes,
          addressLine1: formData.addressLine1,
          addressLine2: formData.addressLine2,
          category: normalizedCategory,
          lead_category: normalizedCategory,
          tags: normalizedTags,
          lead_tags: normalizedTags
        };
        
        // Only add assigned_to_id if it's valid
        if (assigned_to_id !== undefined) {
          payload.assigned_to_id = assigned_to_id;
        }
        
        // Include productName for display
        if (productName) {
          payload.productName = productName;
        }

        // Remove empty string, undefined, or null fields
        Object.keys(payload).forEach(key => {
          if (
            payload[key] === '' ||
            payload[key] === undefined ||
            payload[key] === null
          ) {
            delete payload[key];
          }
        });

        // Determine if imported lead (id is missing or is a string starting with 'imported_')
        const isImportedLead = leadData && (typeof leadData.id !== 'number' || String(leadData.id).startsWith('imported_'));

        if (isImportedLead) {
          // Imported lead: create on backend, then remove from local importedLeads and refresh
          try {
            // Preserve imported timestamps and name if available
            if (leadData.createdAt) payload.created_at = leadData.createdAt;
            if (leadData.updatedAt) payload.updated_at = leadData.updatedAt;
            // include name key as well (backend accepts both contact/name)
            payload.name = payload.name || payload.contact || `${formData.firstName} ${formData.lastName}`.trim();

            // Strip empty/undefined/null values again after enriching
            Object.keys(payload).forEach((key) => {
              if (payload[key] === '' || payload[key] === undefined || payload[key] === null) {
                delete payload[key];
              }
            });

            const res = await axios.post(`${BASE_URL}/api/leads`, payload);
            const created = res.data;
            // transfer starred flag from imported id to new backend id
            try {
              const starredMap = JSON.parse(localStorage.getItem('starredLeads') || '{}');
              if (starredMap && leadData.id && starredMap[leadData.id]) {
                if (created && created.id) {
                  starredMap[created.id] = true;
                }
                delete starredMap[leadData.id];
                localStorage.setItem('starredLeads', JSON.stringify(starredMap));
              }
            } catch (e) {}
            // remove the imported lead from localStorage if present
            try {
              const imported = JSON.parse(localStorage.getItem('importedLeads') || '[]') || [];
              const updated = imported.filter(l => l.id !== leadData.id);
              localStorage.setItem('importedLeads', JSON.stringify(updated));
            } catch (e) {
              // ignore localStorage errors
            }
            if (typeof onAddLeadSubmit === 'function') {
              // pass created lead back to parent so it can update its table immediately
              onAddLeadSubmit(created || null);
            }
            setFormData({ ...DEFAULT_FORM_DATA });
            setIsProductOthers(false);
            setErrors({});
            onClose();
            return;
          } catch (err) {
            console.error('Error saving imported lead to backend:', err);
            const errorMsg = err.response?.data?.error || err.response?.data?.message || 'Error saving imported lead to backend.';
            setSaveError(errorMsg);
            return;
          }
        }

        let res;
        if (leadData && leadData.id) {
          // Edit mode: send PUT request for backend leads only
          res = await axios.put(`${BASE_URL}/api/leads/${leadData.id}`, payload);
        }
        if (!leadData || !leadData.id) {
          // Add mode: send POST request
          res = await axios.post(`${BASE_URL}/api/leads`, payload);
        }
        
        const created = res.data;
        await fetchLeads();
        setFormData({ ...DEFAULT_FORM_DATA });
        setIsProductOthers(false);
        setErrors({});
        setSaveError('');
        if (typeof onAddLeadSubmit === 'function') {
          onAddLeadSubmit(created || null);
        }
        onClose();
      } catch (err) {
        console.error('Error saving lead:', err, err?.response?.data);
        const errorData = err.response?.data || {};
        const errorMessage = errorData.error || errorData.message || 'Failed to save lead';
        const detail = errorData.detail ? `: ${errorData.detail}` : '';
        const combined = errorMessage + detail;
        setSaveError(combined.includes('foreign key constraint') ?
          'Error: Invalid assignment. Please select a valid assignee.' :
          combined);
      }
    }
  };

  const prefixOptions = PREFIX_OPTIONS;
  const categoryOptions = leadCategoryOptions;
  const stageOptions = STAGE_OPTIONS;

  // Fetch employees to populate the Assigned To dropdown.
  // Fetch from backend and use fetched employees as the authoritative list.
  const fetchEmployees = async () => {
    try {
      const res = await axios.get(`${BASE_URL}/api/employees`, {
        params: { page: 1, limit: 1000 },
        headers: getAuthHeaders(),
      });
      const list = res.data.data || res.data || [];

      const mapped = (Array.isArray(list) ? list : [])
        .filter(u => u && u.id) // Only include valid employees with IDs
        .map(u => ({
          id: u.id,
          name: [u.salutation, u.firstname, u.lastname].filter(Boolean).join(' ').trim() || u.usercode || u.username || String(u.id)
        }))
        .filter(m => m.name && m.name.trim().length > 0); // Only include employees with valid names

      setAssignedToOptions(mapped);
    } catch (err) {
      console.error('Error fetching employees:', err);
      setAssignedToOptions([]);
    }
  };

  const fetchSources = async () => {
    try {
      const res = await axios.get(`${BASE_URL}/api/lead-sources`, { headers: getAuthHeaders() });
      const data = Array.isArray(res.data?.data) ? res.data.data : (Array.isArray(res.data) ? res.data : []);
      const normalized = createSelectLookup(
        data,
        ['name', 'Name', 'label', 'Label', 'value', 'Value'],
        ['id', 'ID', 'code', 'Code', 'description', 'Description']
      );
      setSourceOptions(normalized.options);
      setSourceLookup(normalized.lookup);
    } catch (err) {
      console.error('Error fetching sources:', err);
      setSourceOptions([]);
      setSourceLookup({});
    }
  };

  const fetchTags = async () => {
    try {
      const res = await axios.get(`${BASE_URL}/api/crm-tags`, { headers: getAuthHeaders() });
      const data = Array.isArray(res.data?.data) ? res.data.data : (Array.isArray(res.data) ? res.data : []);
      const normalized = createSelectLookup(
        data,
        ['title', 'Title', 'name', 'Name', 'label', 'Label', 'value', 'Value'],
        ['id', 'ID', 'code', 'Code']
      );
      setTagsOptions(normalized.options);
      setTagsLookup(normalized.lookup);
    } catch (err) {
      console.error('Error fetching tags:', err);
      setTagsOptions([]);
      setTagsLookup({});
    }
  };

  useEffect(() => {
    // Always fetch live employees from backend
    fetchEmployees();
  }, []);

  // Fetch sources and tags from backend on mount/open
  useEffect(() => {
    if (isOpen) {
      fetchSources();
      fetchLeadCategories();
      fetchTags();
    }
  }, [isOpen]);

  const fetchLeadCategories = async () => {
    try {
      const res = await axios.get(`${BASE_URL}/api/lead-categories`, { headers: getAuthHeaders() });
      const data = Array.isArray(res.data?.data) ? res.data.data : (Array.isArray(res.data) ? res.data : []);
      const normalized = createSelectLookup(
        data,
        ['name', 'Name', 'label', 'Label', 'value', 'Value'],
        ['id', 'ID', 'code', 'Code', 'description', 'Description']
      );
      setLeadCategoryOptions(normalized.options);
    } catch (err) {
      console.error('Error fetching lead categories:', err);
      setLeadCategoryOptions([]);
    }
  };

  // Prepare options for react-select
  const countryOptions = countries.map(c => ({ value: c.name, label: c.name }));
  const stateOptions = Object.entries(stateList).map(([code, name]) => ({ value: name, label: name }));
  const cityOptions = cities.map(city => ({ value: city, label: city }));

  const productOptions = [
    ...products.map(p => ({
      value: p.ID || p.id || (p.Name || p.name) || '',
      label: `${p.Name || p.name || p.ID || p.id}${p.Code ? ` (${p.Code})` : ''}`
    })),
    { value: 'others', label: 'Others' }
  ];

  const normalizedFormProduct = normalizeWhitespace(formData.product);
  const hasProductInOptions = !normalizedFormProduct
    ? true
    : productOptions.some((o) => {
        const optionVal = normalizeWhitespace(o.value);
        const optionLabel = normalizeWhitespace((o.label || '').replace(/\s*\([^)]*\)\s*$/, ''));
        return optionVal.toLowerCase() === normalizedFormProduct.toLowerCase() || optionLabel.toLowerCase() === normalizedFormProduct.toLowerCase();
      });

  const effectiveProductOptions = hasProductInOptions || !normalizedFormProduct
    ? productOptions
    : [{ value: normalizedFormProduct, label: normalizedFormProduct }, ...productOptions];

  const assignedOptions = assignedToOptions.map(a => ({
    value: a.id,
    label: a.name || String(a.id)
  }));

  const normalizedAssigned = normalizeWhitespace(formData.assignedTo);
  const hasAssignedInOptions = !normalizedAssigned
    ? true
    : assignedOptions.some((o) => {
        const ov = normalizeWhitespace(o.value);
        const ol = normalizeWhitespace(o.label);
        return ov.toLowerCase() === normalizedAssigned.toLowerCase() || ol.toLowerCase() === normalizedAssigned.toLowerCase();
      });

  const effectiveAssignedOptions = hasAssignedInOptions || !normalizedAssigned
    ? assignedOptions
    : [{ value: normalizedAssigned, label: normalizedAssigned }, ...assignedOptions];

  const selectedCountryValue = normalizeSelectValue(formData.country, COUNTRY_OPTION_VALUES);
  const isIndiaSelected = selectedCountryValue.toLowerCase() === 'india';
  const selectedStateValue = isIndiaSelected
    ? normalizeSelectValue(formData.state, STATE_OPTION_VALUES)
    : normalizeWhitespace(formData.state);
  const selectedCityValue = isIndiaSelected
    ? normalizeSelectValue(formData.city, CITY_OPTION_VALUES)
    : normalizeWhitespace(formData.city);
  const selectedCountryOption = countryOptions.find(o => o.value === selectedCountryValue) || null;
  const selectedStateOption = stateOptions.find(o => o.value === selectedStateValue) || null;
  const selectedCityOption = cityOptions.find(o => o.value === selectedCityValue) || null;
  const selectedPrefixValue = normalizeSelectValue(formData.prefix, prefixOptions) || 'Mr.';
  const selectedSourceValue = normalizeSelectValue(formData.source, sourceOptions, sourceLookup);
  const selectedCategoryValue = normalizeSelectValue(formData.category, categoryOptions);
  const selectedStageValue = normalizeSelectValue(formData.stage, stageOptions);
  const selectedTagsValue = normalizeSelectValue(formData.tags, tagsOptions, tagsLookup);

  const effectiveSourceOptions = Array.from(new Set([...(sourceOptions || []), ...(selectedSourceValue ? [selectedSourceValue] : [])]));
  const effectiveCategoryOptions = Array.from(new Set([...(categoryOptions || []), ...(selectedCategoryValue ? [selectedCategoryValue] : [])]));
  const effectiveStageOptions = Array.from(new Set([...(stageOptions || []), ...(selectedStageValue ? [selectedStageValue] : [])]));
  const effectiveTagOptions = Array.from(new Set([...(tagsOptions || []), ...(selectedTagsValue ? [selectedTagsValue] : [])]));
  
  const selectedProductOption = formData.product
    ? effectiveProductOptions.find((o) => {
        const formRaw = normalizeWhitespace(formData.product).toLowerCase();
        const optionValueRaw = normalizeWhitespace(o?.value).toLowerCase();
        const optionLabelRaw = normalizeWhitespace((o?.label || '').replace(/\s*\([^)]*\)\s*$/, '')).toLowerCase();

        // Numeric ID compare when both sides are numeric
        const optionAsNum = Number(o?.value);
        const formAsNum = Number(formData.product);
        if (!isNaN(optionAsNum) && !isNaN(formAsNum) && optionAsNum === formAsNum) {
          return true;
        }

        // Text compare by value or displayed label
        return optionValueRaw === formRaw || optionLabelRaw === formRaw;
      }) || null
    : null;
    
  const selectedAssignedOption = formData.assignedTo
    ? effectiveAssignedOptions.find(o => {
        const oVal = Number(o.value);
        const fVal = Number(formData.assignedTo);
        if (!isNaN(oVal) && !isNaN(fVal)) {
          return oVal === fVal;
        }
        return String(o.value).toLowerCase() === String(formData.assignedTo).toLowerCase();
      }) || null
    : null;

  if (!isOpen) return null;

  return (
    <>
      {isOpen && (
        <div className="modal-overlay">
          <div className="lead-modal">
            <div className="modal-header">
              <h2>Enter Lead</h2>
              <button className="close-button" onClick={onClose}>&times;</button>
            </div>
            {saveError && <div className="error-message" style={{color:'red',marginBottom:'8px'}}>{saveError}</div>}
            <form
              key={leadFieldInstanceId || 'lead-form'}
              autoComplete="off"
              data-lpignore="true"
              data-1p-ignore="true"
              data-form-type="other"
              onSubmit={handleSubmit}
            >
              <div className="lead-autofill-decoys" aria-hidden="true">
                {CHROME_AUTOFILL_DECOY_TOKENS.map((ac, i) => (
                  <input
                    key={`${ac}-${i}-${leadFieldInstanceId}`}
                    type="text"
                    tabIndex={-1}
                    autoComplete={ac}
                    name={`hp_${ac}_${leadFieldInstanceId}`}
                    defaultValue=""
                  />
                ))}
              </div>
              <div className="form-section">
                <h3>Core Data</h3>
                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor={leadDom('business')}>Business <span className="required">*</span></label>
                    <input
                      id={leadDom('business')}
                      type="search"
                      name={leadDom('business')}
                      data-lead-field="business"
                      value={formData.business}
                      onChange={handleChange}
                      className={`lead-field-no-autofill ${errors.business ? 'error' : ''}`}
                      aria-invalid={errors.business ? 'true' : 'false'}
                      autoComplete="new-password"
                      autoCorrect="off"
                      autoCapitalize="off"
                      spellCheck="false"
                      data-lpignore="true"
                      data-1p-ignore="true"
                    />
                    {errors.business && <span className="input-error-inside">{errors.business}</span>}
                  </div>
                  
                  <div className="form-group">
                    <label htmlFor={leadDom('firstName')}>Name</label>
                    <div className="name-inputs">
                      <select
                        name="prefix"
                        value={selectedPrefixValue}
                        onChange={(e) => updateSelectField('prefix', e.target.value, prefixOptions, {}, 'Mr.')}
                        autoComplete="off"
                      >
                        {prefixOptions.map(option => (
                          <option key={option} value={option}>{option}</option>
                        ))}
                      </select>
                      <input
                        type="search"
                        id={leadDom('firstName')}
                        name={leadDom('firstName')}
                        data-lead-field="firstName"
                        placeholder="First Name"
                        value={formData.firstName}
                        onChange={handleChange}
                        className="lead-field-no-autofill"
                        autoComplete="new-password"
                        autoCorrect="off"
                        autoCapitalize="off"
                        spellCheck="false"
                        data-lpignore="true"
                        data-1p-ignore="true"
                      />
                      <input
                        type="search"
                        id={leadDom('lastName')}
                        name={leadDom('lastName')}
                        data-lead-field="lastName"
                        placeholder="Last Name (Optional)"
                        value={formData.lastName}
                        onChange={handleChange}
                        className="lead-field-no-autofill"
                        autoComplete="new-password"
                        autoCorrect="off"
                        autoCapitalize="off"
                        spellCheck="false"
                        data-lpignore="true"
                        data-1p-ignore="true"
                      />
                    </div>
                  </div>
                </div>
                
                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor={leadDom('designation')}>Designation</label>
                    <input
                      id={leadDom('designation')}
                      type="search"
                      name={leadDom('designation')}
                      data-lead-field="designation"
                      value={formData.designation}
                      onChange={handleChange}
                      className="lead-field-no-autofill"
                      autoComplete="new-password"
                      autoCorrect="off"
                      autoCapitalize="off"
                      spellCheck="false"
                      data-lpignore="true"
                      data-1p-ignore="true"
                    />
                  </div>
                  
                  <div className="form-group">
                    <label htmlFor={leadDom('mobile')}>Mobile <span className="required">*</span></label>
                    <div className="mobile-input">
                      <span className="prefix">+91</span>
                      <input
                        id={leadDom('mobile')}
                        type="search"
                        name={leadDom('mobile')}
                        data-lead-field="mobile"
                        value={formData.mobile}
                        onChange={handleChange}
                        maxLength="10"
                        className={`lead-field-no-autofill ${errors.mobile ? 'error' : ''}`}
                        aria-invalid={errors.mobile ? 'true' : 'false'}
                        autoComplete="new-password"
                        autoCorrect="off"
                        inputMode="numeric"
                        data-lpignore="true"
                        data-1p-ignore="true"
                      />
                    </div>
                    {errors.mobile && <span className="input-error-inside">{errors.mobile}</span>}
                  </div>
                </div>
                
                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor={leadDom('email')}>Email</label>
                    <div className="email-input">
                      <input
                        id={leadDom('email')}
                        type="search"
                        name={leadDom('email')}
                        data-lead-field="email"
                        value={formData.email}
                        onChange={handleChange}
                        className={`lead-field-no-autofill ${errors.email ? 'error' : ''}`}
                        aria-invalid={errors.email ? 'true' : 'false'}
                        autoComplete="new-password"
                        autoCorrect="off"
                        autoCapitalize="off"
                        spellCheck="false"
                        inputMode="email"
                        data-lpignore="true"
                        data-1p-ignore="true"
                      />
                    </div>
                    {errors.email && <span className="input-error-inside">{errors.email}</span>}
                  </div>
                  
                  <div className="form-group">
                    <label htmlFor={leadDom('website')}>Website</label>
                    <input
                      id={leadDom('website')}
                      type="search"
                      name={leadDom('website')}
                      data-lead-field="website"
                      value={formData.website}
                      onChange={handleChange}
                      className="lead-field-no-autofill"
                      autoComplete="new-password"
                      autoCorrect="off"
                      autoCapitalize="off"
                      spellCheck="false"
                      data-lpignore="true"
                      data-1p-ignore="true"
                    />
                  </div>
                </div>
                
                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor={leadDom('addressLine1')}>Address Line 1</label>
                    <LeadPlainLineField
                      id={leadDom('addressLine1')}
                      value={formData.addressLine1}
                      onValueChange={handlePlainLineChange('addressLine1')}
                      className="lead-field-no-autofill lead-plain-editable"
                    />
                  </div>
                  
                  <div className="form-group">
                    <label htmlFor={leadDom('addressLine2')}>Address Line 2</label>
                    <LeadPlainLineField
                      id={leadDom('addressLine2')}
                      value={formData.addressLine2}
                      onValueChange={handlePlainLineChange('addressLine2')}
                      className="lead-field-no-autofill lead-plain-editable"
                    />
                  </div>
                </div>
                
                <div className="form-row">
                  <div className="form-group">
                    <label>Country</label>
                    <Select
                      options={countryOptions}
                      value={selectedCountryOption}
                      onChange={handleCountrySelect}
                      components={selectAntiAutofillComponents}
                      isSearchable
                      placeholder="Select country"
                      className="react-select-container"
                      classNamePrefix="react-select"
                      styles={{ menuPortal: base => ({ ...base, zIndex: 9999 }) }}
                      menuPortalTarget={document.body}
                      isClearable
                    />
                  </div>
                  
                  <div className="form-group">
                    {isIndiaSelected ? (
                      <label>City</label>
                    ) : (
                      <label htmlFor={leadDom('city')}>City</label>
                    )}
                    {isIndiaSelected ? (
                      <Select
                        options={cityOptions}
                        value={selectedCityOption}
                        onChange={(opt) => updateSelectField('city', opt?.value, CITY_OPTION_VALUES)}
                        components={selectAntiAutofillComponents}
                        isSearchable
                        placeholder="Select city"
                        className="react-select-container"
                        classNamePrefix="react-select"
                        styles={{ menuPortal: base => ({ ...base, zIndex: 9999 }) }}
                        menuPortalTarget={document.body}
                        isClearable
                      />
                    ) : (
                      <LeadPlainLineField
                        id={leadDom('city')}
                        value={formData.city}
                        onValueChange={handlePlainLineChange('city')}
                        className="lead-field-no-autofill lead-plain-editable"
                      />
                    )}
                  </div>
                </div>
                
                <div className="form-row">
                  <div className="form-group">
                    {isIndiaSelected ? (
                      <label>State</label>
                    ) : (
                      <label htmlFor={leadDom('state')}>State</label>
                    )}
                    {isIndiaSelected ? (
                      <Select
                        options={stateOptions}
                        value={selectedStateOption}
                        onChange={(opt) => updateSelectField('state', opt?.value, STATE_OPTION_VALUES)}
                        components={selectAntiAutofillComponents}
                        isSearchable
                        placeholder="Select state"
                        className="react-select-container"
                        classNamePrefix="react-select"
                        styles={{ menuPortal: base => ({ ...base, zIndex: 9999 }) }}
                        menuPortalTarget={document.body}
                        isClearable
                      />
                    ) : (
                      <LeadPlainLineField
                        id={leadDom('state')}
                        value={formData.state}
                        onValueChange={handlePlainLineChange('state')}
                        className="lead-field-no-autofill lead-plain-editable"
                      />
                    )}
                  </div>
                  
                  <div className="form-group">
                    <label htmlFor={leadDom('gstin')}>GSTIN</label>
                    <input
                      id={leadDom('gstin')}
                      type="search"
                      name={leadDom('gstin')}
                      data-lead-field="gstin"
                      value={formData.gstin}
                      onChange={handleChange}
                      className="lead-field-no-autofill"
                      autoComplete="new-password"
                      autoCorrect="off"
                      autoCapitalize="characters"
                      spellCheck="false"
                      data-lpignore="true"
                      data-1p-ignore="true"
                    />
                  </div>
                </div>

              </div>
              
              <div className="form-section">
                <h3>Business Opportunity</h3>
                <div className="form-row">
                  <div className="form-group">
                    <label>Source <span className="required">*</span></label>
                    <select
                      name="source"
                      value={selectedSourceValue}
                      onChange={(e) => updateSelectField('source', e.target.value, sourceOptions, sourceLookup)}
                      className={errors.source ? 'error' : ''}
                      autoComplete="off"
                    >
                      <option value="">Select Source</option>
                      {effectiveSourceOptions.map(option => (
                        <option key={option} value={option}>{option}</option>
                      ))}
                    </select>
                    {errors.source && <span className="input-error-inside">{errors.source}</span>}
                  </div>
                  
                  <div className="form-group">
                    <label>Since</label>
                    <input
                      type="date"
                      name="since"
                      value={formData.since ? formData.since.slice(0, 10) : ''}
                      onChange={handleChange}
                      className={errors.since ? 'error' : ''}
                      autoComplete="off"
                    />
                    {errors.since && <span className="input-error-inside">{errors.since}</span>}
                  </div>
                </div>
                
                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor={leadDom('requirement')}>Requirement</label>
                    <input
                      id={leadDom('requirement')}
                      type="search"
                      name={leadDom('requirement')}
                      data-lead-field="requirement"
                      value={formData.requirement}
                      onChange={handleChange}
                      className="lead-field-no-autofill"
                      autoComplete="new-password"
                      autoCorrect="off"
                      autoCapitalize="off"
                      spellCheck="false"
                      data-lpignore="true"
                      data-1p-ignore="true"
                    />
                  </div>
                  
                  <div className="form-group">
                    <label>Category</label>
                    <select
                      name="category"
                      value={selectedCategoryValue}
                      onChange={(e) => updateSelectField('category', e.target.value, categoryOptions)}
                      autoComplete="off"
                    >
                      <option value="">Select Category</option>
                      {effectiveCategoryOptions.map(option => (
                        <option key={option} value={option}>{option}</option>
                      ))}
                    </select>
                  </div>
                </div>
                
                <div className="form-row">
                    <div className="form-group">
                      <label>Product</label>
                        <div className="product-input">
                          {!isProductOthers ? (
                            <Select
                              options={effectiveProductOptions}
                              value={selectedProductOption}
                              components={selectAntiAutofillComponents}
                              onChange={(opt) => {
                                const val = opt ? opt.value : '';
                                if (val === 'others') {
                                  setIsProductOthers(true);
                                  setFormData(prev => ({ ...prev, product: '' }));
                                } else {
                                  setIsProductOthers(false);
                                  setFormData(prev => ({ ...prev, product: val }));
                                }
                                if (opt) setErrors(prev => { const n = { ...prev }; delete n.product; return n; });
                              }}
                              isSearchable
                              placeholder={"Search or select product"}
                              className={errors.product ? 'react-select-container error' : 'react-select-container'}
                              classNamePrefix={'react-select'}
                              styles={{
                                menuPortal: base => ({ ...base, zIndex: 9999 }),
                                placeholder: base => ({ ...base, color: errors.product ? '#d9534f' : base.color })
                              }}
                              menuPortalTarget={document.body}
                              menuPosition="fixed"
                              isClearable
                            />
                          ) : (
                            <div style={{ display: 'flex', gap: '8px', alignItems: 'center', width: '100%' }}>
                              <input
                                id={leadDom('product')}
                                type="search"
                                name={leadDom('product')}
                                data-lead-field="product"
                                placeholder="Enter product name"
                                value={formData.product}
                                onChange={handleChange}
                                className={`lead-field-no-autofill ${errors.product ? 'error' : ''}`}
                                style={{ flex: 1 }}
                                autoComplete="new-password"
                                autoCorrect="off"
                                autoCapitalize="off"
                                spellCheck="false"
                                data-lpignore="true"
                                data-1p-ignore="true"
                              />
                              <button
                                type="button"
                                onClick={() => {
                                  setIsProductOthers(false);
                                  setFormData(prev => ({ ...prev, product: '' }));
                                }}
                                style={{
                                  padding: '6px 12px',
                                  fontSize: '12px',
                                  cursor: 'pointer',
                                  whiteSpace: 'nowrap',
                                  backgroundColor: '#003366',
                                  color: 'white',
                                  border: '1px solid #003366',
                                  borderRadius: '4px'
                                }}
                              >
                                Back to Dropdown
                              </button>
                            </div>
                          )}
                        </div>
                      {errors.product && <span className="input-error-inside">{errors.product}</span>}
                    </div>
                  
                  <div className="form-group">
                    <label htmlFor={leadDom('potential')}>Potential (Rs.)</label>
                    <div className="potential-input">
                      <input
                        id={leadDom('potential')}
                        type="search"
                        name={leadDom('potential')}
                        data-lead-field="potential"
                        value={formData.potential}
                        onChange={handleChange}
                        className="lead-field-no-autofill"
                        autoComplete="new-password"
                        inputMode="decimal"
                        data-lpignore="true"
                        data-1p-ignore="true"
                      />
                    </div>
                  </div>
                </div>
                
                <div className="form-row">
                  <div className="form-group">
                    <label>Assigned To</label>
                    <Select
                      options={effectiveAssignedOptions}
                      value={selectedAssignedOption}
                      components={selectAntiAutofillComponents}
                      onChange={(opt) => {
                        setFormData(prev => ({ ...prev, assignedTo: opt ? opt.value : '' }));
                        if (opt) setErrors(prev => { const n = { ...prev }; delete n.assignedTo; return n; });
                      }}
                      isSearchable
                      placeholder={"Search or select assignee"}
                      className={errors.assignedTo ? 'react-select-container error' : 'react-select-container'}
                      classNamePrefix={'react-select'}
                      styles={{
                        menuPortal: base => ({ ...base, zIndex: 9999 }),
                        placeholder: base => ({ ...base, color: errors.assignedTo ? '#d9534f' : base.color })
                      }}
                      menuPortalTarget={document.body}
                      isClearable
                    />
                    {errors.assignedTo && <span className="input-error-inside">{errors.assignedTo}</span>}
                  </div>
                  
                  <div className="form-group">
                    <label>Stage</label>
                    <select
                      name="stage"
                      value={selectedStageValue}
                      onChange={(e) => updateSelectField('stage', e.target.value, stageOptions)}
                      autoComplete="off"
                    >
                      <option value="">Select Stage</option>
                      {effectiveStageOptions.map(option => (
                        <option key={option} value={option}>{option}</option>
                      ))}
                    </select>
                  </div>
                </div>
                
                <div className="form-row">
                  <div className="form-group">
                    <label>Tags</label>
                    <select
                      name="tags"
                      value={selectedTagsValue}
                      onChange={(e) => updateSelectField('tags', e.target.value, tagsOptions, tagsLookup)}
                      autoComplete="off"
                    >
                      <option value="">Select Tag</option>
                      {effectiveTagOptions.map(option => (
                        <option key={option} value={option}>{option}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor={leadDom('notes')}>Notes</label>
                    <input
                        id={leadDom('notes')}
                        type="search"
                        name={leadDom('notes')}
                        data-lead-field="notes"
                        value={formData.notes}
                        onChange={handleChange}
                        className="lead-field-no-autofill"
                        autoComplete="new-password"
                        autoCorrect="off"
                        autoCapitalize="off"
                        spellCheck="false"
                        data-lpignore="true"
                        data-1p-ignore="true"
                      />
                  </div>
                </div>
              </div>
              
              <div className="modal-footer">
                <button type="submit" className="save-button">
                  <span className="check-icon">✓</span> Save & Close
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
};

export default AddLead;