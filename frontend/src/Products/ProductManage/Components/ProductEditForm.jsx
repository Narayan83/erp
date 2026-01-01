import React, { useEffect, useState, useRef } from "react";
import { useForm, Controller } from "react-hook-form";
import axios from "axios";
import { BASE_URL } from "../../../config/Config";
import { useNavigate } from "react-router-dom";
import "./producteditform.scss";

export default function ProductEditForm({ product, onSubmit, navigate }) {
  const { register, handleSubmit, watch, setValue, reset, control, formState: { errors } } = useForm({ mode: 'onTouched' });

  const [categories, setCategories] = useState([]);
  const [subcategories, setSubcategories] = useState([]);
  const [units, setUnits] = useState([]);
  const [stores, setStores] = useState([]);
  const [taxes, setTaxes] = useState([]);
  const [hsnCodes, setHsnCodes] = useState([]);
  const [tags, setTags] = useState([]);
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  // Tags dropdown state and outside-click handling
  const [tagsOpen, setTagsOpen] = useState(false);
  const tagsWrapperRef = useRef(null);

  useEffect(() => {
    const handleClickOutsideTags = (e) => {
      if (tagsWrapperRef.current && !tagsWrapperRef.current.contains(e.target)) {
        setTagsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutsideTags);
    return () => document.removeEventListener('mousedown', handleClickOutsideTags);
  }, []);

  const initialCategoryID = useRef(product.CategoryID ? String(product.CategoryID) : '');
  // Normalize ProductMode values from backend to match Select options
  const normalizeProductMode = (val) => {
    // Always return one of the exact Select option strings or empty string
    if (val === null || val === undefined) return '';
    const s = String(val).trim().toLowerCase();

    const mapping = new Map([
      // Purchase variants
      ['purchase', 'Purchase'],
      ['purchasing', 'Purchase'],
      ['buy', 'Purchase'],
      ['p', 'Purchase'],
      // Internal Manufacturing variants
      ['internal manufacturing', 'Internal Manufacturing'],
      ['internal_manufacturing', 'Internal Manufacturing'],
      ['internalmanufacturing', 'Internal Manufacturing'],
      ['internal', 'Internal Manufacturing'],
      ['manufacturing', 'Internal Manufacturing'],
      ['im', 'Internal Manufacturing'],
      // Combined / both
      ['purchase & internal manufacturing', 'Both'],
      ['purchase and internal manufacturing', 'Both'],
      ['purchasing & internal manufacturing', 'Both'],
      ['both', 'Both'],
      ['purchase & internal', 'Both'],
      ['purchase/internal', 'Both'],
    ]);

    if (mapping.has(s)) return mapping.get(s);

    // If the value already matches one of the Select labels (case-insensitive), return the canonical label
  const canonicalOptions = ['Purchase', 'Internal Manufacturing', 'Both'];
    for (const opt of canonicalOptions) {
      if (s === opt.toLowerCase()) return opt;
    }

    // As a last resort, return empty string so Select shows no selection instead of a mismatched value
    return '';
  };
  
  // Watch for HSN code changes
  const selectedHsnID = watch("HsnID");
  const selectedCategoryID = watch("CategoryID");

  // Add effect to update tax and GST when HSN is selected
  useEffect(() => {
    if (!selectedHsnID) return;
    const selHsn = hsnCodes.find(h => (h.id || h.ID) === (typeof selectedHsnID === 'string' ? Number(selectedHsnID) : selectedHsnID) || String(h.id || h.ID) === String(selectedHsnID));
    if (selHsn) {
      // Find tax either embedded or via tax_id
      let taxObj = null;
      if (selHsn.tax) taxObj = selHsn.tax;
      else if (selHsn.tax_id) taxObj = taxes.find(t => (t.ID || t.id) === selHsn.tax_id);
      
      if (taxObj) {
        const taxId = taxObj.ID || taxObj.id;
        setValue('TaxID', taxId != null ? String(taxId) : '', { shouldValidate: true });
        setValue('GstPercent', taxObj.Percentage ?? taxObj.percentage ?? '', { shouldValidate: true });
      }
      
      // For compatibility also store code into legacy HsnSacCode if backend expects string
      if (selHsn.code) setValue('HsnSacCode', selHsn.code);
    }
  }, [selectedHsnID, hsnCodes, taxes, setValue]);

  // Fetch subcategories when category changes (but not during initial load)
  useEffect(() => {
    // Skip this effect entirely during initial load
    if (isInitialLoad) {
      return;
    }

    if (!selectedCategoryID) {
      setSubcategories([]);
      setValue("SubcategoryID", "");
      return;
    }
    
    axios
      .get(`${BASE_URL}/api/subcategories`, { params: { category_id: selectedCategoryID } })
      .then((res) => {
        let newSubs = res.data.data;
        const currentSubID = watch("SubcategoryID");
        if (currentSubID) {
          const currentSub = subcategories.find(s => String(s.ID) === currentSubID);
          if (currentSub && !newSubs.some(s => String(s.ID) === currentSubID)) {
            newSubs = [...newSubs, currentSub];
          }
        }
        setSubcategories(newSubs);
        // Only reset subcategory if category actually changed (not initial set)
        if (selectedCategoryID !== initialCategoryID.current) {
          setValue("SubcategoryID", "");
        }
      })
      .catch(() => {
        setSubcategories([]);
        if (selectedCategoryID !== initialCategoryID.current) {
          setValue("SubcategoryID", "");
        }
      });
  }, [selectedCategoryID, setValue, isInitialLoad]);

  useEffect(() => {
    // Reset initial load flag when product changes (for editing different products)
    setIsInitialLoad(true);
    
    const loadOptions = async () => {
      try {
        const [cat, sub, unit, store, tax, hsn, tag] = await Promise.all([
          axios.get(`${BASE_URL}/api/categories`),
          axios.get(`${BASE_URL}/api/subcategories`, {
            params: product.CategoryID ? { category_id: product.CategoryID } : {},
          }),
          axios.get(`${BASE_URL}/api/units`).catch((err) => {
            console.error("Error loading units:", err);
            return { data: { data: [] } };
          }),
          axios.get(`${BASE_URL}/api/stores`),
          axios.get(`${BASE_URL}/api/taxes`),
          axios.get(`${BASE_URL}/api/hsncode`).catch(() => ({ data: { data: [] } })),
          axios.get(`${BASE_URL}/api/tags`).catch(() => ({ data: { data: [] } })),
        ]);
        
        console.log("Units API response:", unit.data);
        console.log("Tags API response:", tag.data);
        
        setCategories(cat.data.data);
        setSubcategories(sub.data.data);
        setUnits(unit.data.data);
        setStores(store.data.data);
        setTaxes(tax.data.data);
        setHsnCodes(hsn.data.data);
        setTags(tag.data.data || tag.data || []);
        
        console.log("Tags set to:", tag.data.data || tag.data || []);

        // Return the loaded data for prefilling
        return {
          categories: cat.data.data,
          subcategories: sub.data.data,
          units: unit.data.data,
          stores: store.data.data,
          taxes: tax.data.data,
          hsnCodes: hsn.data.data,
          tags: tag.data.data || tag.data || []
        };
      } catch (err) {
        console.error("Error loading options:", err);
        setCategories([]);
        setSubcategories([]);
        setUnits([]);
        setStores([]);
        setTaxes([]);
        setHsnCodes([]);
        setTags([]);
        return null;
      }
    };

    loadOptions().then((loadedData) => {
      if (!loadedData) return;

      console.log("=== Product Edit Form - Initial Load ===");
      console.log("Product CategoryID:", product.CategoryID);
      console.log("Product SubcategoryID:", product.SubcategoryID);
      console.log("Loaded subcategories:", loadedData.subcategories);

      // Find HsnID based on HsnSacCode if it exists
      let hsnID = '';
      if (product.HsnSacCode && loadedData.hsnCodes.length > 0) {
        const matchingHsn = loadedData.hsnCodes.find(hsn => hsn.code === product.HsnSacCode);
        if (matchingHsn) {
          hsnID = String(matchingHsn.id || matchingHsn.ID);
        }
      }
      
      console.log("Product data:", product);
      console.log("Units loaded:", loadedData.units);
      
      // Check if UnitID exists in the loaded data
      let unitID = '';
      if (product.UnitID && loadedData.units.length > 0) {
        // Ensure we're dealing with a number
        const unitIdNum = typeof product.UnitID === 'number' ? product.UnitID : Number(product.UnitID);
        // Check if unit with this ID exists in loaded data
        const unitExists = loadedData.units.some(unit => (unit.ID === unitIdNum || unit.id === unitIdNum));
        if (unitExists) {
          unitID = String(product.UnitID);
          console.log("Unit found and set:", unitID);
        } else {
          console.log("Unit not found in loaded data:", product.UnitID);
        }
      }

      // Extract tag IDs from product.Tags array
      let tagIDs = [];
      if (Array.isArray(product.Tags) && product.Tags.length > 0) {
        tagIDs = product.Tags.map(tag => String(tag.ID || tag.id)).filter(Boolean);
      }

      // Verify subcategory exists in loaded data
      const subcategoryID = product.SubcategoryID ? String(product.SubcategoryID) : (product.Subcategory ? String(product.Subcategory.ID) : '');
      if (subcategoryID) {
        const subExists = loadedData.subcategories.some(sub => String(sub.ID) === subcategoryID);
        console.log("Subcategory exists in loaded data:", subExists);
        if (!subExists) {
          console.warn("Subcategory ID", subcategoryID, "not found in loaded subcategories");
        }
      }

      // Pre-fill form only after options are loaded
      const formData = {
        Name: product.Name,
        Code: product.Code,
        HsnID: hsnID,
        HsnSacCode: product.HsnSacCode || '',
        Importance: product.Importance || "Normal",
        GstPercent: product.GstPercent,
        CategoryID: product.CategoryID ? String(product.CategoryID) : '',
        SubcategoryID: subcategoryID,
        UnitID: unitID,
        StoreID: product.StoreID ? String(product.StoreID) : '',
        TaxID: product.TaxID ? String(product.TaxID) : '',
        // Ensure ProductMode is one of the Select option labels
        ProductMode: normalizeProductMode(product.ProductMode ?? product.product_mode ?? product.productMode ?? ''),
        Description: product.Description || '',
        InternalNotes: product.InternalNotes || '',
        MinimumStock: product.MinimumStock ?? 0,
        IsActive: typeof product.IsActive !== 'undefined' ? product.IsActive : true,
        ProductType: product.ProductType || 'All',
        moq: (product.moq ?? product.MOQ ?? product.Moq ?? ''),
        TagIDs: tagIDs,
      };

      console.log("Form data to reset:", formData);
      reset(formData);
      
      // Mark that initial load is complete after a short delay to ensure form is populated
      setTimeout(() => {
        console.log("Initial load complete, enabling category change effect");
        setIsInitialLoad(false);
      }, 100);
    });
  }, [product, reset]);

  const handleFormSubmit = (data) => {
    console.log("Form data before formatting:", data);
    console.log("IsActive value:", data.IsActive);

    // Convert string IDs to numbers for the backend if needed
    const formattedData = {
      ...data,
      CategoryID: data.CategoryID ? Number(data.CategoryID) : null,
      SubcategoryID: data.SubcategoryID ? Number(data.SubcategoryID) : null,
      UnitID: data.UnitID ? Number(data.UnitID) : null,
      StoreID: data.StoreID ? Number(data.StoreID) : null,
      TaxID: data.TaxID ? Number(data.TaxID) : null,
      HsnID: data.HsnID ? Number(data.HsnID) : null,
      MinimumStock: data.MinimumStock ? Number(data.MinimumStock) : 0,
      GstPercent: data.GstPercent ? Number(data.GstPercent) : 0,
      moq: data.moq ? Number(data.moq) : 0, // Added for MOQ
      IsActive: Boolean(data.IsActive), // Backend expects boolean
      tagIDs: Array.isArray(data.TagIDs) ? data.TagIDs.map(id => Number(id)) : Array.isArray(data.tagIDs) ? data.tagids.map(id => Number(id)) : [], // Backend expects lowercase 'tagIDs'
      ID: product.ID // Make sure we include the product ID
    };

    // Remove any uppercase `TagIDs` coming from the form so backend only receives numeric `tagIDs`
    if (formattedData.TagIDs) delete formattedData.TagIDs;
    // Ensure tagIDs are numbers and filter out invalid entries
    formattedData.tagIDs = (Array.isArray(formattedData.tagIDs) ? formattedData.tagIDs : [])
      .map(id => Number(id))
      .filter(n => !Number.isNaN(n));

    // Ensure ProductMode is normalized to the expected labels
    if (typeof data.ProductMode !== 'undefined') {
      formattedData.ProductMode = normalizeProductMode(data.ProductMode);
    } else if (product.ProductMode || product.product_mode) {
      formattedData.ProductMode = normalizeProductMode(product.ProductMode ?? product.product_mode);
    }

    console.log("Formatted data being sent:", formattedData);
    console.log("IsActive in formatted data:", formattedData.IsActive);

    onSubmit(formattedData);
  };

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="product-edit-form">
      <h2 className="form-title">Edit Product Info</h2>
      <div className="form-grid">
        <div className="form-field col-33">
          <label className="field-label required">Product Name</label>
          <input
            type="text"
            {...register("Name", { required: true })}
          />
          {errors.Name && <span className="field-error">Product Name is required</span>}
        </div>
        <div className="form-field col-33">
          <label className="field-label required">Code</label>
          <input
            type="text"
            {...register("Code", { required: true })}
          />
          {errors.Code && <span className="field-error">Code is required</span>}
        </div>

        <div className="form-field col-33">
          <label className="field-label">HSN Code</label>
          <Controller
            name="HsnID"
            control={control}
            render={({ field }) => (
              <select
                value={field.value || ''}
                onChange={e => field.onChange(e.target.value)}
              >
                <option value="">Select HSN Code</option>
                {hsnCodes.length > 0 ? (
                  hsnCodes.map((hsn) => (
                    <option key={hsn.id || hsn.ID} value={String(hsn.id || hsn.ID)}>
                      {hsn.code}
                    </option>
                  ))
                ) : (
                  <option disabled value="">
                    No HSN Codes Available
                  </option>
                )}
              </select>
            )}
          />
          {errors.CategoryID && <span className="field-error">Category is required</span>}
        </div>

        <div className="form-field col-33">
          <label className="field-label required">Importance</label>
          <Controller
            name="Importance"
            control={control}
            rules={{ required: true }}
            render={({ field }) => (
              <select
                value={field.value || ''}
                onChange={e => field.onChange(e.target.value)}
              >
                {["Normal", "High", "Critical"].map((level) => (
                  <option key={level} value={level}>
                    {level}
                  </option>
                ))}
              </select>
            )}
          />
        </div>

        <div className="form-field col-33">
          <label className="field-label required">Product Type</label>
          <Controller
            name="ProductType"
            control={control}
            rules={{ required: true }}
            render={({ field }) => (
              <select
                value={field.value || ''}
                onChange={e => field.onChange(e.target.value)}
              >
                {['All','Finished Goods','Semi-Finished Goods','Raw Materials'].map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
            )}
          />
        </div>

        <div className="form-field col-33">
          <label className="field-label">Minimum Stock</label>
          <input
            type="number"
            {...register("MinimumStock", { valueAsNumber: true })}
          />
        </div>

        {/* Category Dropdown */}
        <div className="form-field col-33">
          <label className="field-label required">Category</label>
          <Controller
            name="CategoryID"
            control={control}
            rules={{ required: true }}
            render={({ field }) => (
              <select
                value={field.value || ''}
                onChange={e => field.onChange(e.target.value)}
              >
                <option value="">Select Category</option>
                {categories.map((cat) => (
                  <option key={cat.ID} value={String(cat.ID)}>
                    {cat.Name}
                  </option>
                ))}
              </select>
            )}
          />
        </div>

        {/* Subcategory Dropdown */}
        <div className="form-field col-33">
          <label className="field-label">Subcategory</label>
          <Controller
            name="SubcategoryID"
            control={control}
            render={({ field }) => {
              console.log("Subcategory field value:", field.value);
              console.log("Available subcategories:", subcategories);
              
              return (
                <select 
                  value={field.value || ''} 
                  onChange={e => field.onChange(e.target.value)}
                >
                  <option value="">Select Subcategory</option>
                  {subcategories.length > 0 ? (
                    subcategories.map((sub) => (
                      <option key={sub.ID} value={String(sub.ID)}>
                        {sub.Name}
                      </option>
                    ))
                  ) : (
                    <option disabled value="">
                      No Subcategories Available
                    </option>
                  )}
                </select>
              );
            }}
          />
          {errors.SubcategoryID && <span className="field-error">Invalid subcategory</span>}
        </div>

        {/* Unit */}
        <div className="form-field col-33">
          <label className="field-label">Unit</label>
          <Controller
            name="UnitID"
            control={control}
            render={({ field }) => {
              console.log("UnitID field value:", field.value);
              console.log("Available units:", units);
              
              return (
                <select 
                  value={field.value || ''} 
                  onChange={e => field.onChange(e.target.value)}
                >
                  <option value="">Select Unit</option>
                  {units.length > 0 ? (
                    units.map((unit) => (
                      <option key={unit.ID || unit.id} value={String(unit.ID || unit.id)}>
                        {unit.Name || unit.name}
                      </option>
                    ))
                  ) : (
                    <option disabled value="">
                      No Units Available
                    </option>
                  )}
                </select>
              );
            }}
          />
          {errors.UnitID && <span className="field-error">Invalid unit</span>}
        </div>

        <div className="form-field col-33">
          <label className="field-label required">Product Mode</label>
          <Controller
            name="ProductMode"
            control={control}
            render={({ field }) => (
              <select
                value={field.value || ''}
                onChange={e => field.onChange(e.target.value)}
              >
                <option value="">Select Product Mode</option>
                {["Purchase", "Internal Manufacturing", "Both"].map((level) => (
                  <option key={level} value={level}>
                    {level}
                  </option>
                ))}
              </select>
            )}
          />
        </div>

        {/* MOQ (added after Product Mode) */}
        <div className="form-field col-33">
          <label className="field-label">MOQ</label>
          <input
            type="number"
            {...register("moq", { valueAsNumber: true })}
          />
        </div>

        {/* Store Dropdown */}
        <div className="form-field col-33">
          <label className="field-label">Store</label>
          <Controller
            name="StoreID"
            control={control}
            render={({ field }) => (
              <select 
                value={field.value || ''} 
                onChange={e => field.onChange(e.target.value)}
              >
                <option value="">Select Store</option>
                {stores.map((store) => (
                  <option key={store.ID} value={String(store.ID)}>
                    {store.Name}
                  </option>
                ))}
              </select>
            )}
          />
        </div>

        {/* Tax Dropdown */}
        <div className="form-field col-33">
          <label className="field-label">Tax</label>
          <Controller
            name="TaxID"
            control={control}
            render={({ field }) => (
              <select 
                value={field.value || ''} 
                onChange={e => field.onChange(e.target.value)}
              >
                <option value="">Select Tax</option>
                {taxes.map((tax) => (
                  <option key={tax.ID} value={String(tax.ID)}>
                    {tax.Name}
                  </option>
                ))}
              </select>
            )}
          />
        </div>

        <div className="form-field col-33">
          <label className="field-label">GST %</label>
          <input
            type="number"
            readOnly
            {...register("GstPercent", { valueAsNumber: true })}
          />
        </div>

        <div className="form-field col-33">
          <label className="field-label">Tags</label>
          <Controller
            name="TagIDs"
            control={control}
            defaultValue={[]}
            render={({ field }) => {
              console.log("Rendering Tags field. Available tags:", tags);
              console.log("Current TagIDs value:", field.value);
              
              const selectedTags = tags.filter(tag => {
                const tagId = String(tag.ID || tag.id);
                return (field.value || []).includes(tagId);
              });
              
              return (
                <div className="multi-select-wrapper" ref={tagsWrapperRef}>
                  <div className="multi-select-input" onClick={() => setTagsOpen(true)}>
                    {selectedTags.map((tag) => (
                      <div key={tag.ID || tag.id} className="tag-chip">
                        {tag.Name || tag.name}
                        <span
                          className="chip-remove"
                          onClick={() => {
                            const newIds = (field.value || []).filter(
                              id => id !== String(tag.ID || tag.id)
                            );
                            field.onChange(newIds);
                          }}
                        />
                      </div>
                    ))}
                    <input
                      type="text"
                      placeholder="Select tags"
                      onFocus={() => setTagsOpen(true)}
                      onKeyDown={(e) => {
                        if (e.key === 'Backspace' && !(e.target.value)) {
                          const current = field.value || [];
                          const newIds = current.slice(0, -1);
                          field.onChange(newIds);
                        }
                      }}
                    />
                  </div>
                  {tagsOpen && (
                    <div className="tag-dropdown">
                      {tags.map((tag) => {
                        const tagId = String(tag.ID || tag.id);
                        const isSelected = (field.value || []).includes(tagId);
                        return (
                          <div
                            key={tagId}
                            className={`tag-option ${isSelected ? 'selected' : ''}`}
                            onClick={() => {
                              const currentIds = field.value || [];
                              let newIds;
                              if (isSelected) {
                                newIds = currentIds.filter(id => id !== tagId);
                              } else {
                                newIds = [...currentIds, tagId];
                              }
                              field.onChange(newIds);
                            }}
                          >
                            <input
                              type="checkbox"
                              checked={isSelected}
                              readOnly
                            />
                            <label>{tag.Name || tag.name}</label>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            }}
          />
        </div>

        <div className="form-field col-33">
          <label className="field-label">Description</label>
          <textarea
            {...register("Description")}
          />
        </div>

        <div className="form-field col-33">
          <label className="field-label">Internal Notes</label>
          <textarea
            {...register("InternalNotes")}
          />
        </div>

        <div className="form-field col-33">
          <div className="checkbox-wrapper">
            <Controller
              name="IsActive"
              control={control}
              render={({ field }) => (
                <>
                  <input
                    type="checkbox"
                    id="isActive"
                    checked={field.value || false}
                    onChange={(e) => field.onChange(e.target.checked)}
                  />
                  <label htmlFor="isActive">Is Active</label>
                </>
              )}
            />
          </div>
        </div>
      </div>

      <div className="form-actions">
        <button type="submit" className="btn-primary">
          Update Product
        </button>

        <button
          type="button"
          className="btn-secondary"
          onClick={() => navigate(`/products/${product.ID}/variants`)}
        >
          Update Product Variants
        </button>
      </div>
    </form>
  );
}
