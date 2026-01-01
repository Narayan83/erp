import React, { useState } from 'react';
import './erpreport.scss';

const AddressBlock = ({ prefix, values, onChange }) => (
  <div className="address-block">
    <div className="address-line">
      <label>{prefix} Address 1</label>
      <input name="add1" value={values.add1} onChange={onChange} />
    </div>
    <div className="address-line">
      <label>{prefix} Address 2</label>
      <input name="add2" value={values.add2} onChange={onChange} />
    </div>
    <div className="address-line">
      <label>{prefix} Address 3</label>
      <input name="add3" value={values.add3} onChange={onChange} />
    </div>
    <div className="address-line">
      <label>{prefix} Address 4</label>
      <input name="add4" value={values.add4} onChange={onChange} />
    </div>
    <div className="address-line">
      <label>{prefix} Address 5</label>
      <input name="add5" value={values.add5} onChange={onChange} />
    </div>
  </div>
);

const ERPreport = () => {
  const [form, setForm] = useState({
    id: '',
    type: '',
    acno: '',
    // English column
    name: '',
    businessName: '',
    address: { add1: '', add2: '', add3: '', add4: '', add5: '' },
    phones: { phone: '', mobile: '' },
    description: '',
    // Kannada column
    kname: '',
    businessKName: '',
    kannadaAddress: { add1: '', add2: '', add3: '', add4: '', add5: '' },
    kannadaPhones: { phone: '', mobile: '' },
    kannadaDescription: '',
    // common footer
    categories: [],
    files: []
  });

  const categoryOptions = [
    { id: 1, label: 'Supplier' },
    { id: 2, label: 'Distributor' },
    { id: 3, label: 'Dealer' },
    { id: 4, label: 'Retailer' },
    { id: 5, label: 'Manufacturer' },
    { id: 6, label: 'Service Provider' }
  ];

  const [categorySearch, setCategorySearch] = useState('');
  const filteredCategories = categoryOptions.filter((c) =>
    c.label.toLowerCase().includes(categorySearch.toLowerCase())
  );

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((s) => ({ ...s, [name]: value }));
  };

  const handleCategoryToggle = (categoryId) => {
    setForm((s) => ({
      ...s,
      categories: s.categories.includes(categoryId)
        ? s.categories.filter((id) => id !== categoryId)
        : [...s.categories, categoryId]
    }));
  };

  const handleAddressChange = (which) => (e) => {
    const { name, value } = e.target;
    setForm((s) => ({ ...s, [which]: { ...s[which], [name]: value } }));
  };

  const handlePhoneChange = (which, key) => (e) => {
    const { value } = e.target;
    setForm((s) => ({ ...s, [which]: { ...s[which], [key]: value } }));
  };

  const handleFiles = (e) => {
    const picked = Array.from(e.target.files);
    setForm((s) => ({ ...s, files: [...s.files, ...picked] }));
  };

  const removeFile = (index) => {
    setForm((s) => ({ ...s, files: s.files.filter((_, i) => i !== index) }));
  };

  const reset = () => {
    setForm({
      id: '',
      type: '',
      acno: '',
      name: '',
      businessName: '',
      address: { add1: '', add2: '', add3: '', add4: '', add5: '' },
      phones: { phone: '', mobile: '' },
      description: '',
      kname: '',
      businessKName: '',
      kannadaAddress: { add1: '', add2: '', add3: '', add4: '', add5: '' },
      kannadaPhones: { phone: '', mobile: '' },
      kannadaDescription: '',
      categories: [],
      files: []
    });
  };

  const submit = (e) => {
    e.preventDefault();
    const payload = { ...form };
    console.log('Submitting form:', payload);
    alert('Form data logged to console');
  };

  return (
    <div className="erp-report-wrap">
      <div className="erp-header">
        <h1>Contact Entry Menu</h1>
      </div>

      <form className="erp-form" onSubmit={submit}>
        <div className="form-header">
          <div className="field">
            <label>ID</label>
            <input name="id" value={form.id} onChange={handleChange} />
          </div>
          <div className="field">
            <label>Type</label>
            <input name="type" value={form.type} onChange={handleChange} />
          </div>
          <div className="field">
            <label>Account No</label>
            <input name="acno" value={form.acno} onChange={handleChange} />
          </div>
        </div>

        <div className="two-columns">
          <div className="column">
            <div className="column-title">English</div>
            <div className="address-line">
              <label>Name</label>
              <input name="name" value={form.name} onChange={handleChange} />
            </div>
            <div className="address-line">
              <label>Business</label>
              <input name="businessName" value={form.businessName} onChange={handleChange} />
            </div>
            <div className="section-title small">Address</div>
            <AddressBlock prefix="" values={form.address} onChange={handleAddressChange('address')} />
            <div className="section-title small">Phone / Mobile</div>
            <div className="phones-col">
              <div className="phone-input">
                <label>Phone</label>
                <input value={form.phones.phone} onChange={handlePhoneChange('phones', 'phone')} />
              </div>
              <div className="phone-input">
                <label>Mobile</label>
                <input value={form.phones.mobile} onChange={handlePhoneChange('phones', 'mobile')} />
              </div>
            </div>
            <div className="section-title small">Description</div>
            <div className="row">
              <label></label>
              <input value={form.description} onChange={(e) => setForm(s => ({ ...s, description: e.target.value }))} />
            </div>
          </div>

          <div className="column">
            <div className="column-title">Kannada</div>
            <div className="address-line">
              <label>Name</label>
              <input name="kname" value={form.kname} onChange={handleChange} />
            </div>
            <div className="address-line">
              <label>Business</label>
              <input name="businessKName" value={form.businessKName} onChange={handleChange} />
            </div>
            <div className="section-title small">Address</div>
            <AddressBlock prefix="" values={form.kannadaAddress} onChange={handleAddressChange('kannadaAddress')} />
            <div className="section-title small">Phone / Mobile</div>
            <div className="phones-col">
              <div className="phone-input">
                <label>Phone</label>
                <input value={form.kannadaPhones.phone} onChange={handlePhoneChange('kannadaPhones', 'phone')} />
              </div>
              <div className="phone-input">
                <label>Mobile</label>
                <input value={form.kannadaPhones.mobile} onChange={handlePhoneChange('kannadaPhones', 'mobile')} />
              </div>
            </div>
            <div className="section-title small">Description</div>
            <div className="row">
              <label></label>
              <input value={form.kannadaDescription} onChange={(e) => setForm(s => ({ ...s, kannadaDescription: e.target.value }))} />
            </div>
          </div>
        </div>

        <div className="form-footer">
          <div className="footer-left">
            <label>Categories</label>
            <input
              className="category-search"
              placeholder="Search categories..."
              value={categorySearch}
              onChange={(e) => setCategorySearch(e.target.value)}
            />
            <div className="category-grid">
              {filteredCategories.map((category) => (
                <label key={category.id} className="category-checkbox">
                  <input
                    type="checkbox"
                    checked={form.categories.includes(category.id)}
                    onChange={() => handleCategoryToggle(category.id)}
                  />
                  <span>{category.label}</span>
                </label>
              ))}
            </div>
            {form.categories.length > 0 && (
              <div className="selected-categories">
                <strong>Selected:</strong> {categoryOptions
                  .filter((c) => form.categories.includes(c.id))
                  .map((c) => c.label)
                  .join(', ')}
              </div>
            )}
          </div>
          <div className="footer-right">
            <label>Documents / Uploads</label>
            <div className="file-upload">
              <input type="file" id="file" multiple onChange={handleFiles} />
              <div className="file-list">
                {form.files.map((f, i) => (
                  <div className="file-item" key={i}>
                    <span className="file-name">{f.name}</span>
                    <button type="button" className="btn-link" onClick={() => removeFile(i)}>Remove</button>
                  </div>
                ))}
                {form.files.length === 0 && <div className="file-hint">No documents uploaded</div>}
              </div>
            </div>
          </div>
        </div>

        <div className="form-actions">
          <button type="submit" className="btn primary">Save</button>
          <button type="button" className="btn" onClick={reset}>Reset</button>
        </div>
      </form>
    </div>
  );
};

export default ERPreport;
