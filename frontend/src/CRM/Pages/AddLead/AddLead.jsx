import React, { useState, useEffect } from 'react';
import Select from 'react-select';
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
          const found = assignedToOptions.find(opt => opt.name === leadData.assignedTo);
          assignedToId = found ? found.id : '';
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
          // If it's a number or string, check if it matches a product in the list
          const found = products.find(
            p => p.ID === leadData.product || p.id === leadData.product || p.Name === leadData.product || p.name === leadData.product
          );
          productId = found ? (found.ID || found.id) : leadData.product;
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
        mobile: leadData.mobile || '',
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
  }, [leadData, isOpen, products]);

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
      // Name uses two fields
      if (name === 'firstName' || name === 'lastName') {
        const first = name === 'firstName' ? newValue : formData.firstName;
        const last = name === 'lastName' ? newValue : formData.lastName;
        if (String(first).trim() && String(last).trim()) delete next.name;
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
    
    if (!formData.firstName.trim() || !formData.lastName.trim()) {
      newErrors.name = 'Full name is required';
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
    if (!formData.product || !String(formData.product).trim()) {
      newErrors.product = 'Product is required';
    } else {
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
      const res = await fetch(`${BASE_URL}/api/leads`);
      const data = await res.json();
      setLeads(data.data || []);
    } catch (err) {
      // handle error
    }
  };

  // Fetch products from backend
  const fetchProducts = async () => {
    try {
      const res = await fetch(`${BASE_URL}/api/products?page=1&limit=1000`);
      const data = await res.json();
      setProducts(data.data || []);
    } catch (err) {
      setProducts([]);
    }
  };

  useEffect(() => {
    fetchLeads();
    // Prefer products passed from parent; fallback to fetching if parentProducts empty
    if (Array.isArray(parentProducts) && parentProducts.length > 0) {
      setProducts(parentProducts);
    } else {
      fetchProducts();
    }
  }, []);

  // Add new lead to backend
  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaveError('');
    if (validateForm()) {
      try {
        const contact = `${formData.prefix} ${formData.firstName} ${formData.lastName}`.trim();
        
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
        let product_id = undefined;
        let productName = '';
        if (formData.product && formData.product !== '') {
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
        
        let potential = parseFloat(formData.potential);
        if (isNaN(potential)) potential = 0;

        // Ensure manual submissions record their source
        let payload = {
          business: formData.business,
          contact,
          name: contact, // Include both for backend compatibility
          designation: formData.designation,
          mobile: formData.mobile,
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

            const res = await fetch(`${BASE_URL}/api/leads`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(payload),
            });
            if (res && res.ok) {
              const created = await res.json().catch(() => null);
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
            } else {
              const err = await res.json().catch(() => ({ error: 'Failed to save imported lead' }));
              setSaveError(err.error || 'Failed to save imported lead');
              return;
            }
          } catch (err) {
            console.error('Error saving imported lead to backend:', err);
            setSaveError('Error saving imported lead to backend.');
            return;
          }
        }

        let res;
        if (leadData && leadData.id) {
          // Edit mode: send PUT request for backend leads only
          res = await fetch(`${BASE_URL}/api/leads/${leadData.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
          });
        }
        if (!leadData || !leadData.id) {
          // Add mode: send POST request
          res = await fetch(`${BASE_URL}/api/leads`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
          });
        }
        
        if (res && res.ok) {
          const created = await res.json().catch(() => null);
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
        } else if (res && !res.ok) {
          const errorData = await res.json().catch(() => ({ error: 'Failed to save lead' }));
          const errorMessage = errorData.error || 'Failed to save lead';
          const detail = errorData.detail ? `: ${errorData.detail}` : '';
          const combined = errorMessage + detail;
          setSaveError(combined.includes('foreign key constraint') ?
            'Error: Invalid assignment. Please select a valid assignee.' :
            combined);
        }
      } catch (err) {
        console.error('Error saving lead:', err);
        setSaveError('Error saving lead. Please try again.');
      }
    }
  };

  const prefixOptions = ['Mr.', 'Ms.', 'Mrs.'];
  const [sourceOptions, setSourceOptions] = useState(['Website', 'Referral', 'Social Media', 'Direct', 'Partner']);
  const [tagsOptions, setTagsOptions] = useState([]);
  const categoryOptions = ['Software', 'Hardware', 'Services', 'Consulting', 'Training'];
  const stageOptions = ['Discussion','Appointment', 'Demo', 'Decided', 'Inactive'];
  // Use assignedToOptions passed from parent (TopMenu) or fetch employees if not provided
  const [assignedToOptions, setAssignedToOptions] = useState(Array.isArray(parentAssignedToOptions) && parentAssignedToOptions.length > 0 ? parentAssignedToOptions : []);

  // Fetch employees to populate the Assigned To dropdown.
  // Always fetch from backend and merge any valid parent-provided options,
  // but filter out obvious sample/test placeholder entries.
  const fetchEmployees = async () => {
    try {
      const res = await fetch(`${BASE_URL}/api/employees?page=1&limit=1000`);
      const json = await res.json();
      const list = json.data || [];

      const mapped = list.map(u => ({
        id: u.id,
        name: [u.salutation, u.firstname, u.lastname].filter(Boolean).join(' ').trim() || u.usercode || u.username || String(u.id)
      }));

      // Merge parentProvided options if valid and not duplicates
      const finalMap = new Map();
      mapped.forEach(m => finalMap.set(String(m.id), m));

      if (Array.isArray(parentAssignedToOptions)) {
        parentAssignedToOptions.forEach(p => {
          const pid = String(p?.id || '');
          const pname = (p?.name || '').trim();
          // Accept parent-provided option only if it has a numeric id and non-empty name
          if (pid && !isNaN(Number(pid)) && pname) {
            if (!finalMap.has(pid)) finalMap.set(pid, { id: Number(pid), name: pname });
          }
        });
      }

      // Filter out placeholder/sample entries and obvious dummy values (abc, xyz, numeric-only like 123)
      const PLACEHOLDERS = new Set(['sample','test','example','abc','xyz','demo','123','000']);

      const filtered = Array.from(finalMap.values()).filter(item => {
        const name = (item.name || '').toLowerCase().trim();
        if (!name) return false;

        // Direct placeholder matches
        if (PLACEHOLDERS.has(name)) return false;

        // Numeric-only values (eg. "123")
        if (/^[0-9]+$/.test(name)) return false;

        // Common short placeholder patterns (e.g., 'abc', 'xyz') already covered above.
        // Also exclude gibberish single-letter or 2-letter uppercase tokens if needed
        // (but be conservative to avoid removing real short names):
        if (/^[a-z]{1,2}$/.test(name)) return false;

        return true;
      });

      setAssignedToOptions(filtered);
    } catch (err) {
      // fallback to empty
      setAssignedToOptions([]);
    }
  };

  useEffect(() => {
    // Always fetch live employees and merge / sanitize parent-provided options
    fetchEmployees();
  }, [parentAssignedToOptions]);

  // Load saved sources and tags from localStorage on mount/open
  useEffect(() => {
    try {
      const savedSources = JSON.parse(localStorage.getItem('leadSources') || '[]');
      if (Array.isArray(savedSources) && savedSources.length > 0) {
        // map to option labels
        setSourceOptions(savedSources.map(s => s.name));
      }
    } catch (e) {}
    try {
      const savedTags = JSON.parse(localStorage.getItem('leadTags') || '[]');
      if (Array.isArray(savedTags) && savedTags.length > 0) {
        setTagsOptions(savedTags.map(t => t.name));
      }
    } catch (e) {}
  }, [isOpen]);

  // Prepare options for react-select
  const countryOptions = countries.map(c => ({ value: c.name, label: c.name }));
  const stateOptions = Object.entries(stateList).map(([code, name]) => ({ value: name, label: name }));
  const cityOptions = cities.map(city => ({ value: city, label: city }));

  const productOptions = products.map(p => ({
    value: p.ID || p.id || (p.Name || p.name) || '',
    label: `${p.Name || p.name || p.ID || p.id}${p.Code ? ` (${p.Code})` : ''}`
  }));

  const assignedOptions = assignedToOptions.map(a => ({
    value: a.id,
    label: a.name || String(a.id)
  }));

  const selectedCountryOption = countryOptions.find(o => o.value === formData.country) || null;
  const selectedStateOption = stateOptions.find(o => o.value === formData.state) || null;
  const selectedCityOption = cityOptions.find(o => o.value === formData.city) || null;
  const selectedProductOption = productOptions.find(o => String(o.value) === String(formData.product)) || null;
  const selectedAssignedOption = assignedOptions.find(o => String(o.value) === String(formData.assignedTo) || String(o.label).toLowerCase() === String(formData.assignedTo).toLowerCase()) || null;

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
                        placeholder="Last Name"
                        value={formData.lastName}
                        onChange={handleChange}
                        className={errors.name ? 'error' : ''}
                        aria-invalid={errors.name ? 'true' : 'false'}
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
                          <Select
                            options={productOptions}
                            value={selectedProductOption}
                            onChange={(opt) => {
                              setFormData(prev => ({ ...prev, product: opt ? opt.value : '' }));
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
                            isClearable={false}
                          />
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

      {/* Leads Table */}
      <div className="leads-table-container">
        <h3>Leads</h3>
        <table className="leads-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Business</th>
              <th>Contact</th>
              <th>Mobile</th>
              <th>Email</th>
              <th>City</th>
              <th>Stage</th>
              <th>Potential</th>
              <th>Address Line 1</th>
              <th>Address Line 2</th>
              <th>Category</th>
              <th>Tags</th>
              {/* Add more columns as needed */}
            </tr>
          </thead>
          <tbody>
            {leads.map((lead) => (
              <tr key={lead.id}>
                <td>{lead.id}</td>
                <td>{lead.business}</td>
                <td>{lead.contact}</td>
                <td>{lead.mobile}</td>
                <td>{lead.email}</td>
                <td>{lead.city}</td>
                <td>{lead.stage}</td>
                <td>{lead.potential}</td>
                <td>{lead.addressLine1 || lead.addressline1 || lead.address_line1 || ''}</td>
                <td>{lead.addressLine2 || lead.addressline2 || lead.address_line2 || ''}</td>
                <td>{lead.category || lead.Category || ''}</td>
                <td>{lead.tags || lead.Tags || ''}</td>
                {/* Add more cells as needed */}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
};

export default AddLead;