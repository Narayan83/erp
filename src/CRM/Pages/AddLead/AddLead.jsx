import React, { useState, useEffect } from 'react';
import './_add_lead.scss';
import { addNewLead } from '../../Components/TopMenu/LeadsDAta';

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
    code: '',
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
        code: leadData.code || '',
        source: leadData.source || '',
        since: leadData.since || '',
        requirement: leadData.requirements || leadData.requirement || '',
        category: leadData.category || '',
        product: leadData.product || '',
        potential: leadData.potential || '',
        assignedTo: leadData.assignedTo || '',
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
        code: '',
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
  }, [leadData, isOpen]);

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
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (validateForm()) {
      if (onAddLeadSubmit) {
        onAddLeadSubmit(formData); // Pass the entire formData object directly
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
        code: '',
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
    }
  };

  const prefixOptions = ['Mr.', 'Ms.', 'Mrs.'];
  const stateOptions = ['Delhi', 'Maharashtra', 'Karnataka', 'Tamil Nadu', 'Uttar Pradesh', 'Gujarat'];
  const sourceOptions = ['Website', 'Referral', 'Social Media', 'Direct', 'Partner'];
  const categoryOptions = ['Software', 'Hardware', 'Services', 'Consulting', 'Training'];
  const stageOptions = ['Proposal', 'Discussion', 'Demo', 'Decided', 'Raw (Unqualified)', 'Inactive'];
  const assignedToOptions = ['ABC', 'XYZ', '123'];

  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="lead-modal">
        <div className="modal-header">
          <h2>Enter Lead</h2>
          <button className="close-button" onClick={onClose}>&times;</button>
        </div>
        
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
            
            <div className="form-row">
              <div className="form-group">
                <label>Code</label>
                <input
                  type="text"
                  name="code"
                  value={formData.code}
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
                  value={formData.since}
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
                  <input
                    type="text"
                    name="product"
                    value={formData.product}
                    onChange={handleChange}
                  />
                  <button type="button" className="add-button">+</button>
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
                >
                  <option value="">Select Assignee</option>
                  {assignedToOptions.map(option => (
                    <option key={option} value={option}>{option}</option>
                  ))}
                </select>
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
  );
};

export default AddLead;