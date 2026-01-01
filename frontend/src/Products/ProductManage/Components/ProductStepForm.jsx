import { useEffect, useState, useRef } from "react";
import { useForm } from "react-hook-form";
import CircularProgress from "@mui/material/CircularProgress";
import axios from "axios";
import { BASE_URL } from "../../../config/Config";
import "./productstepform.scss";

// Local multi-select dropdown for Tags (chips + dropdown)
function TagMultiSelect({ tags, selectedTagIDs, setValue, getValues }) {
  const wrapperRef = useRef(null);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const toggleOpen = () => setOpen(v => !v);

  const toggleTag = (tag) => {
    const actualId = tag.ID ?? tag.id;
    const current = getValues('tagIDs') || [];
    const included = current.map(String).includes(String(actualId));
    if (included) {
      const next = current.filter(v => String(v) !== String(actualId));
      setValue('tagIDs', next);
    } else {
      setValue('tagIDs', [...current, actualId]);
    }
  };

  const removeTag = (id) => {
    const current = getValues('tagIDs') || [];
    setValue('tagIDs', current.filter(v => String(v) !== String(id)));
  };

  const selectedObjects = (selectedTagIDs || []).map(id => tags.find(t => String(t.ID ?? t.id) === String(id))).filter(Boolean);

  return (
    <div className="autocomplete-wrapper" ref={wrapperRef}>
      <div className="selected-items" onClick={toggleOpen} role="button" tabIndex={0}>
        {selectedObjects.length === 0 ? (
          <div className="placeholder">Select tags</div>
        ) : (
          selectedObjects.map(t => (
            <div className="chip" key={t.ID ?? t.id}>
              <span>{t.Name ?? t.name}</span>
              <button type="button" className="remove-btn" onClick={(e) => { e.stopPropagation(); removeTag(t.ID ?? t.id); }}>×</button>
            </div>
          ))
        )}
      </div>

      <div className="dropdown-menu" style={{ display: open ? 'block' : 'none' }}>
        {tags.length > 0 ? (
          tags.map(tag => {
            const id = tag.ID ?? tag.id;
            const selected = (selectedTagIDs || []).map(String).includes(String(id));
            return (
              <div key={id} className={`dropdown-item ${selected ? 'selected' : ''}`} onClick={() => toggleTag(tag)}>
                {tag.Name ?? tag.name}
              </div>
            );
          })
        ) : (
          <div className="dropdown-item disabled">No Tags Available</div>
        )}
      </div>
    </div>
  );
}

// Local autocomplete input for name and code
function AutocompleteInput({ options, value, onChange, onSelect, placeholder }) {
  const wrapperRef = useRef(null);
  const [open, setOpen] = useState(false);
  const [filtered, setFiltered] = useState([]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleInputChange = (e) => {
    const val = e.target.value;
    onChange(val);
    const filt = options.filter(opt => opt.toLowerCase().includes(val.toLowerCase()));
    setFiltered(filt);
    setOpen(filt.length > 0 && val !== '');
  };

  const handleSelect = (item) => {
    onChange(item);
    setOpen(false);
    if (onSelect) onSelect(item);
  };

  const handleFocus = () => {
    setFiltered(options);
    setOpen(options.length > 0);
  };

  return (
    <div className="autocomplete-wrapper" ref={wrapperRef}>
      <input
        type="text"
        value={value}
        onChange={handleInputChange}
        onFocus={handleFocus}
        placeholder={placeholder}
      />
      <div className="dropdown-menu" style={{ display: open ? 'block' : 'none' }}>
        {filtered.map(item => (
          <div key={item} className="dropdown-item" onClick={() => handleSelect(item)}>
            {item}
          </div>
        ))}
      </div>
    </div>
  );
}

export default function ProductStepForm({ defaultValues, onNext, resetForm }) {
  const { register, handleSubmit, watch, setValue, reset, getValues } = useForm({});

  // ensure tagID is registered since we'll control it via setValue
  useEffect(() => {
    register('tagIDs');
  }, [register]);

  // State for dropdown options and loading
  const [categories, setCategories] = useState([]);
  const [subcategories, setSubcategories] = useState([]);
  const [units, setUnits] = useState([]);
  const [stores, setStores] = useState([]);
  const [taxes, setTaxes] = useState([]);
  const [tags, setTags] = useState([]);
  const [hsnCodes, setHsnCodes] = useState([]); // NEW: HSN codes list
  const [isLoading, setIsLoading] = useState(true);
  const [productCodes, setProductCodes] = useState([]); // For code uniqueness check
  const [productsList, setProductsList] = useState([]); // full product objects for dropdowns
  const [formError, setFormError] = useState(""); // For user-friendly error

  // Always reset form when defaultValues change (for stepper back/forward)
  useEffect(() => {
    if (defaultValues) {
      reset({
        name: defaultValues.name || defaultValues.Name || '',
        code: defaultValues.code || defaultValues.Code || '',
        hsnID: defaultValues.hsnID || defaultValues.HsnID || '', // NEW: selected HSN id
        hsnSacCode: defaultValues.hsnSacCode || defaultValues.HsnSacCode || '', // keep legacy text if needed
        importance: defaultValues.importance || defaultValues.Importance || 'Normal',
        productType: defaultValues.productType || defaultValues.ProductType || 'All',
        minimumStock: defaultValues.minimumStock || defaultValues.MinimumStock || '',
        categoryID: defaultValues.categoryID || defaultValues.CategoryID || '',
        subcategoryID: defaultValues.subcategoryID || defaultValues.SubcategoryID || '',
        unitID: defaultValues.unitID || defaultValues.UnitID || '',
  product_mode: defaultValues.product_mode || defaultValues.ProductMode || '',
        storeID: defaultValues.storeID || defaultValues.StoreID || '',
        // Normalize tagID to an array so multi-select works; accept single id or array
        // normalize to `tagIDs` (plural) because ReviewStep/backend expect tagIDs
        tagIDs: (() => {
          const dvTag = defaultValues.tagIDs ?? defaultValues.TagIDs ?? defaultValues.tagID ?? defaultValues.TagID;
          if (dvTag === undefined || dvTag === null || dvTag === '') return [];
          return Array.isArray(dvTag) ? dvTag : [dvTag];
        })(),
        taxID: defaultValues.taxID || defaultValues.TaxID || '',
        gstPercent: defaultValues.gstPercent || defaultValues.GstPercent || '',
        description: defaultValues.description || defaultValues.Description || '',
        internalNotes: defaultValues.internalNotes || defaultValues.InternalNotes || '',
        isActive: typeof defaultValues.isActive !== 'undefined' ? defaultValues.isActive : true,
        moq: defaultValues.moq || defaultValues.MOQ || '', // Added for MOQ
      });
    } else {
      reset({
        name: '', code: '', hsnID: '', hsnSacCode: '', importance: 'Normal', productType: 'All', minimumStock: '',
        categoryID: '', subcategoryID: '', unitID: '', product_mode: '',
  storeID: '', tagIDs: [], taxID: '', gstPercent: '', description: '', internalNotes: '',
        isActive: true, moq: '', // Added for MOQ
      });
    }
  }, [defaultValues, reset]);

  const selectedCategoryID = watch("categoryID");
  const selectedTaxID = watch("taxID");
  const selectedHsnID = watch("hsnID");
  const nameValue = watch('name');
  const codeValue = watch('code');
  const selectedTagIDs = watch('tagIDs');

  // Fetch all dropdown data on mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [catRes, unitRes, storeRes, taxRes, prodRes, hsnRes, tagRes] = await Promise.all([
          axios.get(`${BASE_URL}/api/categories`, { params: { page: 1, limit: 1000 } }),
          axios.get(`${BASE_URL}/api/units`, { params: { page: 1, limit: 1000 } }),
          axios.get(`${BASE_URL}/api/stores`, { params: { page: 1, limit: 1000 } }),
          axios.get(`${BASE_URL}/api/taxes`, { params: { page: 1, limit: 1000 } }),
          axios.get(`${BASE_URL}/api/products`, { params: { page: 1, limit: 10000 } }),
          axios.get(`${BASE_URL}/api/hsncode`, { params: { page: 1, limit: 1000 } }),
          axios.get(`${BASE_URL}/api/tags`, { params: { page: 1, limit: 1000 } }),
        ]);

        setCategories(catRes.data.data || []);
        setUnits(unitRes.data.data || []);
        setStores(storeRes.data.data || []);
        setTaxes(taxRes.data.data || []);
  const prods = prodRes.data.data || [];
  setProductsList(prods);
  setProductCodes(prods.map(p => p.code || p.Code));
        setHsnCodes(hsnRes.data.data || []);
        setTags(tagRes.data.data || []);
      } catch (error) {
        console.error("Error loading dropdowns/products", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  // Compute unique names and codes for autocomplete
  const uniqueNames = [...new Set(productsList.map(p => p.name || p.Name).filter(n => n))];
  const uniqueCodes = [...new Set(productsList.map(p => p.code || p.Code).filter(c => c))];

  // Fetch subcategories when category changes
  useEffect(() => {
    if (selectedCategoryID) {
      axios
        .get(`${BASE_URL}/api/subcategories`, { params: { category_id: selectedCategoryID, page: 1, limit: 1000 } })
        .then((res) => setSubcategories(res.data.data || []))
        .catch(() => setSubcategories([]));
    } else {
      setSubcategories([]);
    }
  }, [selectedCategoryID]);

  // Update GST percentage when tax is selected (manual tax change)
  useEffect(() => {
    if (selectedTaxID) {
      const selectedTax = taxes.find((t) => String(t.ID || t.id) === String(selectedTaxID));
      if (selectedTax) {
        setValue("gstPercent", selectedTax.Percentage ?? selectedTax.percentage ?? '');
      }
    } else {
      setValue("gstPercent", "");
    }
  }, [selectedTaxID, taxes, setValue]);

  // When HSN selected, auto-populate tax + gst
  useEffect(() => {
    if (!selectedHsnID) return;
    const selHsn = hsnCodes.find(h => String(h.id || h.ID) === String(selectedHsnID));
    if (selHsn) {
    // Find tax either embedded or via tax_id
    let taxObj = null;
    if (selHsn.tax) taxObj = selHsn.tax; else if (selHsn.tax_id) taxObj = taxes.find(t => String(t.ID || t.id) === String(selHsn.tax_id));
      if (taxObj) {
        const taxId = taxObj.ID || taxObj.id;
        setValue('taxID', taxId, { shouldValidate: true });
        setValue('gstPercent', taxObj.Percentage ?? taxObj.percentage ?? '', { shouldValidate: true });
      }
      // For compatibility also store code into legacy hsnSacCode if backend expects string
      if (selHsn.code) setValue('hsnSacCode', selHsn.code);
    }
  }, [selectedHsnID, hsnCodes, taxes, setValue]);

  // Live-validate name/code against existing products and show message inline
  useEffect(() => {
    if (!productsList || productsList.length === 0) {
      setFormError("");
      return;
    }

    const norm = (s) => (s || "").toString().trim().toLowerCase();
    const enteredName = norm(nameValue);
    const enteredCode = norm(codeValue);

    const nameExists = enteredName !== '' && productsList.some(p => norm(p.name || p.Name) === enteredName);
    const codeExists = enteredCode !== '' && productsList.some(p => norm(p.code || p.Code) === enteredCode);

    if (nameExists && codeExists) {
      setFormError('A product with this name and code already exists. Please use unique values.');
    } else if (nameExists) {
      setFormError('A product with this name already exists.');
    } else if (codeExists) {
      setFormError('A product with this code already exists.');
    } else {
      setFormError('');
    }
  }, [nameValue, codeValue, productsList]);

  if (isLoading) {
    return (
      <div className="loading-wrapper">
        <div className="spinner">
          <CircularProgress />
          <div className="loading-text">Loading form data...</div>
        </div>
      </div>
    );
  }

  // Custom submit handler to check code uniqueness
  const handleFormSubmit = (data) => {
    setFormError("");
    const norm = (s) => (s || "").toString().trim().toLowerCase();
    const enteredName = norm(data.name);
    const enteredCode = norm(data.code);

    const nameExists = enteredName !== '' && productsList.some(p => norm(p.name || p.Name) === enteredName);
    const codeExists = enteredCode !== '' && productsList.some(p => norm(p.code || p.Code) === enteredCode);

    if (nameExists && codeExists) {
      setFormError('A product with this name and code already exists. Please use unique values.');
      return;
    }
    if (nameExists) {
      setFormError('A product with this name already exists.');
      return;
    }
    if (codeExists) {
      setFormError('A product with this code already exists.');
      return;
    }

    onNext(data);
  };

  return (
    <div className="product-step-form">
      {formError && (
        <div className="form-error">{formError}</div>
      )}
      <form onSubmit={handleSubmit(handleFormSubmit)}>
        <div className="form-grid">
          {/* Product Name */}
          <div className="form-field">
            <label className="field-label">Product Name</label>
            <AutocompleteInput
              options={uniqueNames}
              value={getValues('name') || ''}
              onChange={(val) => setValue('name', val)}
              onSelect={(selectedName) => {
                const found = productsList.find(p => (p.name || p.Name) === selectedName);
                if (found) {
                  setValue('code', found.code || found.Code || '');
                }
              }}
              placeholder="Enter product name"
            />
          </div>
          {/* Code */}
          <div className="form-field">
            <label className="field-label">Code</label>
            <AutocompleteInput
              options={uniqueCodes}
              value={getValues('code') || ''}
              onChange={(val) => setValue('code', val)}
              onSelect={(selectedCode) => {
                const found = productsList.find(p => (p.code || p.Code) === selectedCode);
                if (found) {
                  setValue('name', found.name || found.Name || '');
                }
              }}
              placeholder="Enter product code"
            />
          </div>
          {/* HSN Dropdown */}
          <div className="form-field">
            <label className="field-label">HSN Code</label>
            <select 
              value={watch('hsnID') || ''}
              {...register('hsnID')}
              onChange={(e) => setValue('hsnID', e.target.value)}
            >
              <option value="">Select HSN Code</option>
              {hsnCodes.map(h => (
                <option key={h.id || h.ID} value={h.id || h.ID}>
                  {h.code}
                </option>
              ))}
            </select>
          </div>
          {/* Importance */}
          <div className="form-field">
            <label className="field-label">Importance</label>
            <select {...register("importance", { required: true })} defaultValue="Normal">
              {['Normal','High','Critical'].map(level => <option key={level} value={level}>{level}</option>)}
            </select>
          </div>
          {/* Product Type */}
          <div className="form-field">
            <label className="field-label">Product Type</label>
            <select {...register("productType", { required: true })} defaultValue="All">
              {['All','Finished Goods','Semi-Finished Goods','Raw Materials'].map(type => <option key={type} value={type}>{type}</option>)}
            </select>
          </div>
          {/* Minimum Stock */}
          <div className="form-field">
            <label className="field-label">Minimum Stock</label>
            <input type="number" placeholder="0" {...register("minimumStock", { valueAsNumber: true })} />
          </div>
          {/* Category */}
          <div className="form-field">
            <label className="field-label required">Category</label>
            <select value={watch("categoryID") || ''} {...register("categoryID", { required: true })}>
              <option value="">Select Category</option>
              {categories.map(cat => <option key={cat.ID || cat.id} value={cat.ID || cat.id}>{cat.Name || cat.name}</option>)}
            </select>
          </div>
          {/* Subcategory */}
          <div className="form-field">
            <label className="field-label">Subcategory</label>
            <select value={watch("subcategoryID") || ''} {...register("subcategoryID")}>
              <option value="">Select Subcategory</option>
              {subcategories.length > 0 ? (
                subcategories.map(sub => <option key={sub.ID || sub.id} value={sub.ID || sub.id}>{sub.Name || sub.name}</option>)
              ) : (
                <option disabled>No Subcategories Available</option>
              )}
            </select>
          </div>
          {/* Unit */}
          <div className="form-field">
            <label className="field-label">Unit</label>
            <select value={watch("unitID") || ''} {...register("unitID")}>
              <option value="">Select Unit</option>
              {units.map(unit => <option key={unit.ID || unit.id} value={unit.ID || unit.id}>{unit.Name || unit.name}</option>)}
            </select>
          </div>
          {/* Product Mode */}
          <div className="form-field">
            <label className="field-label">Product Mode</label>
            <select value={watch('product_mode') || ''} {...register("product_mode")} onChange={(e) => setValue('product_mode', e.target.value)}>
              <option value="">Select Mode</option>
              <option value="Purchase">Purchase</option>
              <option value="Internal Manufacturing">Internal Manufacturing</option>
              <option value="Both">Both</option>
            </select>
          </div>
          {/* MOQ */}
          <div className="form-field">
            <label className="field-label">MOQ</label>
            <input type="number" placeholder="0" {...register("moq", { valueAsNumber: true })} />
          </div>
          {/* Store */}
          <div className="form-field">
            <label className="field-label">Store</label>
            <select value={watch("storeID") || ''} {...register("storeID")}>
              <option value="">Select Store</option>
              {stores.map(store => <option key={store.ID || store.id} value={store.ID || store.id}>{store.Name || store.name}</option>)}
            </select>
          </div>
          {/* Tax */}
          <div className="form-field">
            <label className="field-label">Tax</label>
            <select value={watch("taxID") || ''} {...register("taxID")}>
              <option value="">Select Tax</option>
              {taxes.map(tax => <option key={tax.ID || tax.id} value={tax.ID || tax.id}>{tax.Name || tax.name}</option>)}
            </select>
          </div>
          {/* GST % */}
          <div className="form-field">
            <label className="field-label">GST %</label>
            <input type="number" readOnly {...register("gstPercent")} />
          </div>
          {/* Tag (custom multi-select dropdown with chips) */}
          <div className="form-field">
            <label className="field-label">Tag</label>
            <TagMultiSelect
              tags={tags}
              selectedTagIDs={watch('tagIDs') || []}
              setValue={setValue}
              getValues={getValues}
            />
          </div>
          {/* Description */}
          <div className="form-field">
            <label className="field-label">Description</label>
            <textarea placeholder="Enter product description" {...register("description")} />
          </div>
          {/* Internal Notes */}
          <div className="form-field">
            <label className="field-label">Internal Notes</label>
            <textarea placeholder="Enter internal notes" {...register("internalNotes")} />
          </div>
          {/* Active */}
          <div className="form-field">
            <div className="checkbox-wrapper">
              <input type="checkbox" id="isActive" defaultChecked {...register("isActive")} />
              <label htmlFor="isActive">Is Active</label>
            </div>
          </div>
        </div>

        <div className="form-actions">
          <button type="submit" className="btn-primary">Next</button>
        </div>
      </form>
    </div>
  );
}