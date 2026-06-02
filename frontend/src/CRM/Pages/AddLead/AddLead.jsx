import React, { useState, useEffect } from 'react';
import Select from 'react-select';
import axios from 'axios';
import { BASE_URL } from '../../../config/Config';
import countries from '../../../User/utils/countries.js';
import stateList from '../../../User/utils/state_list.json';
import cities from '../../../User/utils/cities-name-list.json';
import './_add_lead.scss';

const AddLead = ({ isOpen, onClose, onAddLeadSubmit, leadData, products: parentProducts = [], assignedToOptions: parentAssignedToOptions = [] }) => {
  const [formData, setFormData] = useState({
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
  });

  const [errors, setErrors] = useState({});
  const [leads, setLeads] = useState([]);
  const [products, setProducts] = useState([]);
  const [saveError, setSaveError] = useState('');
  const [isProductOthers, setIsProductOthers] = useState(false);
  const [sourceOptions, setSourceOptions] = useState([]);
  const [tagsOptions, setTagsOptions] = useState([]);
  const [assignedToOptions, setAssignedToOptions] = useState(Array.isArray(parentAssignedToOptions) && parentAssignedToOptions.length > 0 ? parentAssignedToOptions : []);

  // Helper function to normalize mobile number to 10 digits
  const normalizeMobile = (mobile) => {
    if (!mobile) return '';
    // Remove all non-digit characters
    const digits = mobile.replace(/[^0-9]/g, '');
    // Take last 10 digits (handles cases like +91 prefix, 0 prefix, etc.)
    return digits.slice(-10);
  };

  useEffect(() => {
    if (leadData) {
      // Try to split contact/name into prefix, firstName, lastName
      let prefix = 'Mr.';
      let firstName = '';
      let lastName = '';
      const nameSource = leadData.contact || leadData.name || '';
      if (nameSource) {
        const parts = nameSource.split(' ');
        if (['Mr.', 'Ms.', 'Mrs.'].includes(parts[0])) {
          prefix = parts[0];
          firstName = parts[1] || '';
          lastName = parts.slice(2).join(' ');
        } else {
          firstName = parts[0] || '';
          lastName = parts.slice(1).join(' ');
        }
      }
      
      // Map assignedTo (name, id, or object) to id
      let assignedToId = '';
      if (leadData.assignedTo) {
        if (typeof leadData.assignedTo === 'number') {
          assignedToId = leadData.assignedTo;
        } else if (typeof leadData.assignedTo === 'string') {
          // Try to match by ID first (if it's a numeric string)
          const asNum = Number(leadData.assignedTo);
          if (!isNaN(asNum)) {
            assignedToId = asNum;
          } else {
            // Try to match by name (case-insensitive)
            const found = assignedToOptions.find(opt => 
              opt.name && opt.name.toLowerCase() === leadData.assignedTo.toLowerCase()
            );
            assignedToId = found ? found.id : '';
          }
        } else if (typeof leadData.assignedTo === 'object' && leadData.assignedTo !== null) {
          assignedToId = leadData.assignedTo.id || '';
        }
      } else if (leadData.assigned_to_id) {
        assignedToId = leadData.assigned_to_id;
      }
      
      // Map product (id, name, or object) to id
      let productId = '';
      if (leadData.product) {
        if (typeof leadData.product === 'number' || typeof leadData.product === 'string') {
          // If it's a number or numeric string, try to find by ID
          const asNum = Number(leadData.product);
          if (!isNaN(asNum)) {
            const found = products.find(p => p.ID === asNum || p.id === asNum);
            productId = found ? (found.ID || found.id) : asNum;
          } else {
            // If it's a non-numeric string, try to find by name (case-insensitive)
            const found = products.find(
              p => (p.Name && p.Name.toLowerCase() === leadData.product.toLowerCase()) ||
                   (p.name && p.name.toLowerCase() === leadData.product.toLowerCase())
            );
            productId = found ? (found.ID || found.id) : leadData.product;
          }
        } else if (typeof leadData.product === 'object' && leadData.product !== null) {
          productId = leadData.product.ID || leadData.product.id || '';
        }
      } else if (leadData.product_id) {
        productId = leadData.product_id;
      }
      
      setFormData({
        business: leadData.business || '',
        prefix,
        firstName,
        lastName,
        designation: leadData.designation || '',
        mobile: normalizeMobile(leadData.mobile || ''),
        email: leadData.email || '',
        website: leadData.website || '',
        addressLine1: leadData.addressLine1 || leadData.AddressLine1 || leadData.addressLine1 || '',
        addressLine2: leadData.addressLine2 || leadData.AddressLine2 || leadData.addressLine2 || '',
        country: leadData.country || '',
        city: leadData.city || '',
        state: leadData.state || '',
        gstin: leadData.gstin || '',
        source: leadData.source || '',
        since: leadData.since || '',
        requirement: leadData.requirements || leadData.requirement || '',
        category: leadData.category || '',
        product: productId,
        potential: leadData.potential || '',
        assignedTo: assignedToId,
        stage: leadData.stage || '',
        notes: leadData.notes || '',
        tags: leadData.tags || leadData.Tags || ''
      });
    } else {
      setFormData({
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
      });
    }
  }, [leadData, isOpen, products, assignedToOptions]);

  const handleChange = (e) => {
    const { name, value } = e.target;
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
        if (/\S+@\S+\.\S+/.test(newValue)) delete next.email;
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
    
    if (!formData.firstName.trim()) {
      newErrors.name = 'First name is required';
    }
    
    if (!formData.mobile.trim()) {
      newErrors.mobile = 'Mobile number is required';
    } else if (!/^[0-9]{10}$/.test(formData.mobile)) {
      newErrors.mobile = 'Enter a valid 10-digit mobile number';
    }
    
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Enter a valid email address';
    }

    // Validate source (required)
    if (!formData.source || String(formData.source).trim() === '') {
      newErrors.source = 'Source is required';
    }

    // Validate since (required)
    if (!formData.since || String(formData.since).trim() === '') {
      newErrors.since = 'Since (date) is required';
    } else {
      const d = new Date(formData.since);
      if (isNaN(d)) {
        newErrors.since = 'Enter a valid date for Since';
      }
    }

    // Validate assignedTo (required). Allow matching by id or name (case-insensitive)
    if (!formData.assignedTo || !String(formData.assignedTo).trim()) {
      newErrors.assignedTo = 'Assignee is required';
    } else {
      const matchAssigned = assignedToOptions.some(opt =>
        String(opt.id) === String(formData.assignedTo) ||
        (opt.name && opt.name.toLowerCase() === String(formData.assignedTo).toLowerCase())
      );
      if (!matchAssigned) newErrors.assignedTo = 'Please select a valid assignee';
    }

    // Validate product (required). Allow matching by id or name (case-insensitive)
    // If "Others" is selected (isProductOthers), allow any non-empty custom product name
    if (!formData.product || !String(formData.product).trim()) {
      newErrors.product = 'Product is required';
    } else if (!isProductOthers) {
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
      const res = await axios.get(`${BASE_URL}/api/products`, { params: { page: 1, limit: 1000 } });
      const productList = res.data.data || res.data || [];
      setProducts(Array.isArray(productList) ? productList : []);
    } catch (err) {
      console.error('Error fetching products:', err);
      setProducts([]);
    }
  };

  useEffect(() => {
    fetchLeads();
    fetchProducts();
  }, []);

  // Add new lead to backend
  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaveError('');
    if (validateForm()) {
      try {
        // Normalize mobile number before saving
        const normalizedMobile = normalizeMobile(formData.mobile);
        
        const contact = `${formData.prefix} ${formData.firstName}${formData.lastName ? ' ' + formData.lastName : ''}`.trim();
        
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

        // Resolve product_id from numeric id or name
        // If "Others" is selected (isProductOthers), use the custom product name without resolving to an ID
        let product_id = undefined;
        let productName = '';
        if (formData.product && formData.product !== '') {
          if (isProductOthers) {
            // Custom product entered by user - no product_id, just use the name
            productName = formData.product;
            product_id = undefined;
          } else {
            const asNum = Number(formData.product);
            if (!isNaN(asNum)) {
              product_id = asNum;
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
                product_id = found.ID || found.id;
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
          designation: formData.designation,
          mobile: normalizedMobile,
          email: formData.email,
          city: formData.city,
          state: formData.state,
          country: formData.country,
          source: formData.source || 'Filling Form',
          stage: formData.stage,
          potential,
          since: formData.since ? new Date(formData.since).toISOString() : new Date().toISOString(),
          gstin: formData.gstin,
          website: formData.website,
          requirements: formData.requirement,
          notes: formData.notes,
          addressLine1: formData.addressLine1,
          addressLine2: formData.addressLine2,
          category: formData.category,
          tags: formData.tags
        };
        
        // Only add assigned_to_id if it's valid
        if (assigned_to_id !== undefined) {
          payload.assigned_to_id = assigned_to_id;
        }
        
        if (product_id !== undefined) {
          payload.product_id = product_id;
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
            setFormData({
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
            });
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
        setFormData({
          business: '',
          prefix: '',
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
        });
        setErrors({});
        setSaveError('');
        if (typeof onAddLeadSubmit === 'function') {
          onAddLeadSubmit(created || null);
        }
        onClose();
      } catch (err) {
        console.error('Error saving lead:', err);
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

  const prefixOptions = ['Mr.', 'Ms.', 'Mrs.'];
  const categoryOptions = ['Software', 'Hardware', 'Services', 'Consulting', 'Training'];
  const stageOptions = ['Discussion', 'Appointment', 'Demo', 'Proposal', 'Decided', 'Inactive'];

  // Fetch employees to populate the Assigned To dropdown.
  // Fetch from backend and use fetched employees as the authoritative list.
  const fetchEmployees = async () => {
    try {
      const res = await axios.get(`${BASE_URL}/api/employees`, { params: { page: 1, limit: 1000 } });
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
      const res = await axios.get(`${BASE_URL}/api/lead-sources`);
      const data = res.data;
      if (Array.isArray(data)) {
        setSourceOptions(data.map(s => s.name || s.Name));
      }
    } catch (err) {
      console.error('Error fetching sources:', err);
    }
  };

  const fetchTags = async () => {
    try {
      const res = await axios.get(`${BASE_URL}/api/crm-tags`);
      const data = res.data;
      if (Array.isArray(data)) {
        setTagsOptions(data.map(t => t.title || t.Title));
      }
    } catch (err) {
      console.error('Error fetching tags:', err);
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
      fetchTags();
    }
  }, [isOpen]);

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

  const assignedOptions = assignedToOptions.map(a => ({
    value: a.id,
    label: a.name || String(a.id)
  }));

  const selectedCountryOption = countryOptions.find(o => o.value === formData.country) || null;
  const selectedStateOption = stateOptions.find(o => o.value === formData.state) || null;
  const selectedCityOption = cityOptions.find(o => o.value === formData.city) || null;
  
  const selectedProductOption = formData.product 
    ? productOptions.find(o => {
        const oVal = Number(o.value) || String(o.value).toLowerCase();
        const fVal = Number(formData.product) || String(formData.product).toLowerCase();
        return oVal === fVal || String(oVal) === String(fVal);
      }) || null
    : null;
    
  const selectedAssignedOption = formData.assignedTo
    ? assignedOptions.find(o => {
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
            <form onSubmit={handleSubmit}>
              <div className="form-section">
                <h3>Core Data</h3>
                <div className="form-row">
                  <div className="form-group">
                    <label>Business <span className="required">*</span></label>
                    <input
                      type="text"
                      name="business"
                      value={formData.business}
                      onChange={handleChange}
                      className={errors.business ? 'error' : ''}
                      aria-invalid={errors.business ? 'true' : 'false'}
                    />
                    {errors.business && <span className="input-error-inside">{errors.business}</span>}
                  </div>
                  
                  <div className="form-group">
                    <label>Name <span className="required">*</span></label>
                    <div className="name-inputs">
                      <select 
                        name="prefix" 
                        value={formData.prefix} 
                        onChange={handleChange}
                      >
                        {prefixOptions.map(option => (
                          <option key={option} value={option}>{option}</option>
                        ))}
                      </select>
                      <input
                        type="text"
                        name="firstName"
                        placeholder="First Name"
                        value={formData.firstName}
                        onChange={handleChange}
                        className={errors.name ? 'error' : ''}
                        aria-invalid={errors.name ? 'true' : 'false'}
                      />
                      <input
                        type="text"
                        name="lastName"
                        placeholder="Last Name (Optional)"
                        value={formData.lastName}
                        onChange={handleChange}
                      />
                      {errors.name && <span className="input-error-inside">{errors.name}</span>}
                    </div>
                  </div>
                </div>
                
                <div className="form-row">
                  <div className="form-group">
                    <label>Designation</label>
                    <input
                      type="text"
                      name="designation"
                      value={formData.designation}
                      onChange={handleChange}
                    />
                  </div>
                  
                  <div className="form-group">
                    <label>Mobile <span className="required">*</span></label>
                    <div className="mobile-input">
                      <span className="prefix">+91</span>
                      <input
                        type="text"
                        name="mobile"
                        value={formData.mobile}
                        onChange={handleChange}
                        maxLength="10"
                        className={errors.mobile ? 'error' : ''}
                        aria-invalid={errors.mobile ? 'true' : 'false'}
                      />
                    </div>
                    {errors.mobile && <span className="input-error-inside">{errors.mobile}</span>}
                  </div>
                </div>
                
                <div className="form-row">
                  <div className="form-group">
                    <label>Email <span className="required">*</span></label>
                    <div className="email-input">
                      <input
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        className={errors.email ? 'error' : ''}
                        aria-invalid={errors.email ? 'true' : 'false'}
                      />
                    </div>
                    {errors.email && <span className="input-error-inside">{errors.email}</span>}
                  </div>
                  
                  <div className="form-group">
                    <label>Website</label>
                    <input
                      type="text"
                      name="website"
                      value={formData.website}
                      onChange={handleChange}
                    />
                  </div>
                </div>
                
                <div className="form-row">
                  <div className="form-group">
                    <label>Address Line 1</label>
                    <input
                      type="text"
                      name="addressLine1"
                      value={formData.addressLine1}
                      onChange={handleChange}
                    />
                  </div>
                  
                  <div className="form-group">
                    <label>Address Line 2</label>
                    <input
                      type="text"
                      name="addressLine2"
                      value={formData.addressLine2}
                      onChange={handleChange}
                    />
                  </div>
                </div>
                
                <div className="form-row">
                  <div className="form-group">
                    <label>Country</label>
                    <Select
                      options={countryOptions}
                      value={selectedCountryOption}
                      onChange={(opt) => setFormData(prev => ({ ...prev, country: opt ? opt.value : '' }))}
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
                    <label>City</label>
                    {formData.country === 'India' ? (
                      <Select
                        options={cityOptions}
                        value={selectedCityOption}
                        onChange={(opt) => setFormData(prev => ({ ...prev, city: opt ? opt.value : '' }))}
                        isSearchable
                        placeholder="Select city"
                        className="react-select-container"
                        classNamePrefix="react-select"
                        styles={{ menuPortal: base => ({ ...base, zIndex: 9999 }) }}
                        menuPortalTarget={document.body}
                        isClearable
                      />
                    ) : (
                      <input
                        type="text"
                        name="city"
                        value={formData.city}
                        onChange={handleChange}
                      />
                    )}
                  </div>
                </div>
                
                <div className="form-row">
                  <div className="form-group">
                    <label>State</label>
                    {formData.country === 'India' ? (
                      <Select
                        options={stateOptions}
                        value={selectedStateOption}
                        onChange={(opt) => setFormData(prev => ({ ...prev, state: opt ? opt.value : '' }))}
                        isSearchable
                        placeholder="Select state"
                        className="react-select-container"
                        classNamePrefix="react-select"
                        styles={{ menuPortal: base => ({ ...base, zIndex: 9999 }) }}
                        menuPortalTarget={document.body}
                        isClearable
                      />
                    ) : (
                      <input
                        type="text"
                        name="state"
                        value={formData.state}
                        onChange={handleChange}
                      />
                    )}
                  </div>
                  
                  <div className="form-group">
                    <label>GSTIN</label>
                    <input
                      type="text"
                      name="gstin"
                      value={formData.gstin}
                      onChange={handleChange}
                    />
                  </div>
                </div>

              </div>
              
              <div className="form-section">
                <h3>Business Opportunity</h3>
                <div className="form-row">
                  <div className="form-group">
                    <label>Source <span className="required">*</span></label>
                    <select name="source" value={formData.source} onChange={handleChange} className={errors.source ? 'error' : ''}>
                      <option value="">Select Source</option>
                      {sourceOptions.map(option => (
                        <option key={option} value={option}>{option}</option>
                      ))}
                    </select>
                    {errors.source && <span className="input-error-inside">{errors.source}</span>}
                  </div>
                  
                  <div className="form-group">
                    <label>Since <span className="required">*</span></label>
                    <input
                      type="date"
                      name="since"
                      value={formData.since ? formData.since.slice(0, 10) : ''}
                      onChange={handleChange}
                      className={errors.since ? 'error' : ''}
                    />
                    {errors.since && <span className="input-error-inside">{errors.since}</span>}
                  </div>
                </div>
                
                <div className="form-row">
                  <div className="form-group">
                    <label>Requirement</label>
                    <input
                      type="text"
                      name="requirement"
                      value={formData.requirement}
                      onChange={handleChange}
                    />
                  </div>
                  
                  <div className="form-group">
                    <label>Category</label>
                    <select
                      name="category"
                      value={formData.category}
                      onChange={handleChange}
                    >
                      <option value="">Select Category</option>
                      {categoryOptions.map(option => (
                        <option key={option} value={option}>{option}</option>
                      ))}
                    </select>
                  </div>
                </div>
                
                <div className="form-row">
                    <div className="form-group">
                      <label>Product <span className="required">*</span></label>
                        <div className="product-input">
                          {!isProductOthers ? (
                            <Select
                              options={productOptions}
                              value={selectedProductOption}
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
                              isClearable={false}
                            />
                          ) : (
                            <div style={{ display: 'flex', gap: '8px', alignItems: 'center', width: '100%' }}>
                              <input
                                type="text"
                                name="product"
                                placeholder="Enter product name"
                                value={formData.product}
                                onChange={handleChange}
                                className={errors.product ? 'error' : ''}
                                style={{ flex: 1 }}
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
                    <label>Potential (Rs.)</label>
                    <div className="potential-input">
                      <input
                        type="text"
                        name="potential"
                        value={formData.potential}
                        onChange={handleChange}
                      />
                    </div>
                  </div>
                </div>
                
                <div className="form-row">
                  <div className="form-group">
                    <label>Assigned To <span className="required">*</span></label>
                    <Select
                      options={assignedOptions}
                      value={selectedAssignedOption}
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
                      isClearable={false}
                    />
                    {errors.assignedTo && <span className="input-error-inside">{errors.assignedTo}</span>}
                  </div>
                  
                  <div className="form-group">
                    <label>Stage</label>
                    <select
                      name="stage"
                      value={formData.stage}
                      onChange={handleChange}
                    >
                      <option value="">Select Stage</option>
                      {stageOptions.map(option => (
                        <option key={option} value={option}>{option}</option>
                      ))}
                    </select>
                  </div>
                </div>
                
                <div className="form-row">
                  <div className="form-group">
                    <label>Tags</label>
                    <select name="tags" value={formData.tags} onChange={handleChange}>
                      <option value="">Select Tag</option>
                      {tagsOptions.map(option => (
                        <option key={option} value={option}>{option}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label>Notes</label>
                    <input
                        type="text"
                        name="notes"
                        value={formData.notes}
                        onChange={handleChange}
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