import React, { useState, useEffect } from 'react';
import { BASE_URL } from '../../../Config';
import './_add_lead.scss';

const AddLead = ({ isOpen, onClose, onAddLeadSubmit, leadData }) => {
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
      // Try to split contact into prefix, firstName, lastName
      let prefix = 'Mr.';
      let firstName = '';
      let lastName = '';
      if (leadData.contact) {
        const parts = leadData.contact.split(' ');
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
        addressLine1: leadData.addressLine1 || '',
        addressLine2: leadData.addressLine2 || '',
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
        tags: leadData.tags || ''
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
        country: 'India',
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
    if (name === 'mobile') {
      const numericValue = value.replace(/[^0-9]/g, '');
      setFormData({
        ...formData,
        [name]: numericValue.slice(0, 10)
      });
    } else {
      setFormData({
        ...formData,
        [name]: value      });
    }
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
    
    // Validate assignedTo if provided
    if (formData.assignedTo && 
        !assignedToOptions.some(opt => String(opt.id) === String(formData.assignedTo))) {
      newErrors.assignedTo = 'Please select a valid assignee';
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
    fetchProducts();
  }, []);

  // Add new lead to backend
  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaveError('');
    if (validateForm()) {
      try {
        const contact = `${formData.prefix} ${formData.firstName} ${formData.lastName}`.trim();
        
        // Only set assigned_to_id if valid - improved validation
        let assigned_to_id = undefined;
        if (formData.assignedTo && formData.assignedTo !== '') {
          const assignedToId = Number(formData.assignedTo);
          if (!isNaN(assignedToId) && 
              assignedToOptions.some(opt => Number(opt.id) === assignedToId)) {
            assigned_to_id = assignedToId;
          }
        }
        
        let product_id = formData.product ? Number(formData.product) : undefined;
        if (isNaN(product_id)) product_id = undefined;
        
        let potential = parseFloat(formData.potential);
        if (isNaN(potential)) potential = 0;

        let payload = {
          business: formData.business,
          contact,
          designation: formData.designation,
          mobile: formData.mobile,
          email: formData.email,
          city: formData.city,
          state: formData.state,
          country: formData.country,
          source: formData.source,
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
          // Imported lead: update in localStorage and local state via TopMenu
          if (typeof onAddLeadSubmit === 'function') {
            onAddLeadSubmit({ ...leadData, ...formData, ...payload, id: leadData.id });
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
          await fetchLeads();
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
            country: 'India',
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
            onAddLeadSubmit();
          }
          onClose();
        } else if (res && !res.ok) {
          const errorData = await res.json().catch(() => ({ error: 'Failed to save lead' }));
          const errorMessage = errorData.error || 'Failed to save lead';
          setSaveError(errorMessage.includes('foreign key constraint') ? 
            'Error: Invalid assignment. Please select a valid assignee.' : 
            errorMessage);
        }
      } catch (err) {
        console.error('Error saving lead:', err);
        setSaveError('Error saving lead. Please try again.');
      }
    }
  };

  const prefixOptions = ['Mr.', 'Ms.', 'Mrs.'];
  const stateOptions = ['Delhi', 'Maharashtra', 'Karnataka', 'Tamil Nadu', 'Uttar Pradesh', 'Gujarat'];
  const sourceOptions = ['Website', 'Referral', 'Social Media', 'Direct', 'Partner'];
  const categoryOptions = ['Software', 'Hardware', 'Services', 'Consulting', 'Training'];
  const stageOptions = ['Proposal', 'Discussion', 'Demo', 'Decided', 'Raw (Unqualified)', 'Inactive'];
  // Use the same assignedToOptions structure as TopMenu
  const assignedToOptions = [
    { id: 1, name: 'ABC' },
    { id: 2, name: 'XYZ' },
    { id: 3, name: '123' }
  ];

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
                    />
                    {errors.business && <span className="error-message">{errors.business}</span>}
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
                      />
                      <input
                        type="text"
                        name="lastName"
                        placeholder="Last Name"
                        value={formData.lastName}
                        onChange={handleChange}
                        className={errors.name ? 'error' : ''}
                      />
                    </div>
                    {errors.name && <span className="error-message">{errors.name}</span>}
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
                      />
                    </div>
                    {errors.mobile && <span className="error-message">{errors.mobile}</span>}
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
                      />
                    </div>
                    {errors.email && <span className="error-message">{errors.email}</span>}
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
                    <input
                      type="text"
                      name="country"
                      value={formData.country}
                      onChange={handleChange}
                    />
                  </div>
                  
                  <div className="form-group">
                    <label>City</label>
                    <input
                      type="text"
                      name="city"
                      value={formData.city}
                      onChange={handleChange}
                    />
                  </div>
                </div>
                
                <div className="form-row">
                  <div className="form-group">
                    <label>State</label>
                    <select
                      name="state"
                      value={formData.state}
                      onChange={handleChange}
                    >
                      <option value="">Select State</option>
                      {stateOptions.map(option => (
                        <option key={option} value={option}>{option}</option>
                      ))}
                    </select>
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
                    <label>Source</label>
                    <select
                      name="source"
                      value={formData.source}
                      onChange={handleChange}
                    >
                      <option value="">Select Source</option>
                      {sourceOptions.map(option => (
                        <option key={option} value={option}>{option}</option>
                      ))}
                    </select>
                  </div>
                  
                  <div className="form-group">
                    <label>Since</label>
                    <input
                      type="date"
                      name="since"
                      value={formData.since ? formData.since.slice(0, 10) : ''}
                      onChange={handleChange}
                    />
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
                    <label>Product</label>
                    <div className="product-input">
                      <select
                        name="product"
                        value={formData.product}
                        onChange={handleChange}
                      >
                        <option value="">Select Product</option>
                        {products.map((product) => (
                          <option key={product.ID || product.id} value={product.ID || product.id}>
                            {product.Name || product.name} {product.Code ? `(${product.Code})` : ''}
                          </option>
                        ))}
                      </select>
                    </div>
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
                    <label>Assigned To</label>
                    <select
                      name="assignedTo"
                      value={formData.assignedTo}
                      onChange={handleChange}
                      className={errors.assignedTo ? 'error' : ''}
                    >
                      <option value="">Select Assignee</option>
                      {assignedToOptions.map(option => (
                        <option key={option.id} value={option.id}>{option.name}</option>
                      ))}
                    </select>
                    {errors.assignedTo && <span className="error-message">{errors.assignedTo}</span>}
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
                    <div className="tags-input">
                      <input
                        type="text"
                        name="tags"
                        value={formData.tags}
                        onChange={handleChange}
                      />
                      <button type="button" className="add-button">+</button>
                    </div>
                  </div>

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