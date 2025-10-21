import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { 
  Button, 
  Grid, 
  MenuItem, 
  TextField,
  Autocomplete,
  FormControl,
  InputLabel,
  Select,
  CircularProgress,
  Checkbox,
  ListItemText,
  FormControlLabel
} from "@mui/material";
import axios from "axios";
import { BASE_URL } from "../../../Config";

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
      const selectedTax = taxes.find((t) => (t.ID || t.id) === selectedTaxID);
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
    const selHsn = hsnCodes.find(h => (h.id || h.ID) === selectedHsnID);
    if (selHsn) {
      // Find tax either embedded or via tax_id
      let taxObj = null;
      if (selHsn.tax) taxObj = selHsn.tax; else if (selHsn.tax_id) taxObj = taxes.find(t => (t.ID || t.id) === selHsn.tax_id);
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
      <div style={{ display: 'flex', justifyContent: 'center', padding: '20px' }}>
        <CircularProgress />
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
    <>
      {formError && (
        <div style={{ color: 'red', marginBottom: 10 }}>{formError}</div>
      )}
      <form onSubmit={handleSubmit(handleFormSubmit)}>
        <Grid container spacing={2}>
          {/* Product Name (Autocomplete) */}
          <Grid item xs={12} md={4}>
            <Autocomplete
              freeSolo
              options={productsList}
              getOptionLabel={(option) => (typeof option === 'string' ? option : option.name || option.Name || option.code || option.Code || '')}
              value={(() => {
                const val = getValues('name');
                // find object for current name if exists
                const found = productsList.find(p => (p.name || p.Name) === val || (p.code || p.Code) === val);
                return found || (val ? val : null);
              })()}
              onChange={(event, newValue) => {
                if (!newValue) {
                  setValue('name', '');
                  setValue('code', '');
                  return;
                }
                if (typeof newValue === 'string') {
                  setValue('name', newValue);
                } else {
                  const name = newValue.name || newValue.Name || '';
                  const code = newValue.code || newValue.Code || '';
                  setValue('name', name);
                  setValue('code', code);
                }
              }}
              onInputChange={(e, newInput) => {
                // keep form value in sync when user types
                setValue('name', newInput);
              }}
              renderInput={(params) => (
                <TextField {...params} label="Product Name" size="small" sx={{ width: '260px' }} />
              )}
            />
          </Grid>
          {/* Code (Autocomplete) */}
          <Grid item xs={12} md={4}>
            <Autocomplete
              freeSolo
              options={productsList}
              getOptionLabel={(option) => (typeof option === 'string' ? option : option.code || option.Code || option.name || option.Name || '')}
              value={(() => {
                const val = getValues('code');
                const found = productsList.find(p => (p.code || p.Code) === val || (p.name || p.Name) === val);
                return found || (val ? val : null);
              })()}
              onChange={(event, newValue) => {
                if (!newValue) {
                  setValue('code', '');
                  setValue('name', '');
                  return;
                }
                if (typeof newValue === 'string') {
                  setValue('code', newValue);
                } else {
                  const name = newValue.name || newValue.Name || '';
                  const code = newValue.code || newValue.Code || '';
                  setValue('name', name);
                  setValue('code', code);
                }
              }}
              onInputChange={(e, newInput) => {
                setValue('code', newInput);
              }}
              renderInput={(params) => (
                <TextField {...params} label="Code" size="small" sx={{ width: '260px' }} />
              )}
            />
          </Grid>
          {/* HSN Dropdown */}
          <Grid item xs={12} md={4}>
            <FormControl size="small" InputLabelProps={{ shrink: true }}>
              <InputLabel>HSN Code</InputLabel>
              <Select
                label="HSN Code"
                value={watch('hsnID') || ''}
                {...register('hsnID')}
                onChange={(e) => setValue('hsnID', e.target.value)}
                sx={{ width: '260px' }}
              >
                {hsnCodes.map(h => (
                  <MenuItem key={h.id || h.ID} value={h.id || h.ID}>
                    {h.code}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          {/* Importance */}
          <Grid item xs={12} md={4}>
            <FormControl size="small" InputLabelProps={{ shrink: true }}>
              <InputLabel>Importance</InputLabel>
              <Select label="Importance" defaultValue="Normal" {...register("importance", { required: true })} sx={{ width: '260px' }}>
                {['Normal','High','Critical'].map(level => <MenuItem key={level} value={level}>{level}</MenuItem>)}
              </Select>
            </FormControl>
          </Grid>
          {/* Product Type */}
          <Grid item xs={12} md={4}>
            <FormControl size="small" InputLabelProps={{ shrink: true }}>
              <InputLabel>Product Type</InputLabel>
              <Select label="Product Type" defaultValue="All" {...register("productType", { required: true })} sx={{ width: '260px' }}>
                {['All','Finished Goods','Semi-Finished Goods','Raw Materials'].map(type => <MenuItem key={type} value={type}>{type}</MenuItem>)}
              </Select>
            </FormControl>
          </Grid>
          {/* Minimum Stock */}
          <Grid item xs={12} md={4}>
            <TextField label="Minimum Stock" type="number" size="small" sx={{ width: '260px' }} {...register("minimumStock", { valueAsNumber: true })} />
          </Grid>
          {/* Category */}
          <Grid item xs={12} md={4}>
            <FormControl size="small" InputLabelProps={{ shrink: true }}>
              <InputLabel>Category *</InputLabel>
              <Select label="Category *" value={watch("categoryID") || ''} {...register("categoryID", { required: true })} sx={{ width: '260px' }}>
                {categories.map(cat => <MenuItem key={cat.ID || cat.id} value={cat.ID || cat.id}>{cat.Name || cat.name}</MenuItem>)}
              </Select>
            </FormControl>
          </Grid>
          {/* Subcategory */}
            <Grid item xs={12} md={4}>
              <FormControl size="small" InputLabelProps={{ shrink: true }}>
                <InputLabel>Subcategory</InputLabel>
                <Select label="Subcategory" value={watch("subcategoryID") || ''} {...register("subcategoryID")} sx={{ width: '260px' }}> 
                  {subcategories.length > 0 ? (
                    subcategories.map(sub => <MenuItem key={sub.ID || sub.id} value={sub.ID || sub.id}>{sub.Name || sub.name}</MenuItem>)
                  ) : (
                    <MenuItem disabled value="">No Subcategories Available</MenuItem>
                  )}
                </Select>
              </FormControl>
            </Grid>
          {/* Unit */}
          <Grid item xs={12} md={4}>
            <FormControl size="small" InputLabelProps={{ shrink: true }}>
              <InputLabel>Unit</InputLabel>
              <Select label="Unit" value={watch("unitID") || ''} {...register("unitID")} sx={{ width: '260px' }}> 
                {units.map(unit => <MenuItem key={unit.ID || unit.id} value={unit.ID || unit.id}>{unit.Name || unit.name}</MenuItem>)}
              </Select>
            </FormControl>
          </Grid>
          {/* Product Mode */}
          <Grid item xs={12} md={4}>
            <FormControl size="small" InputLabelProps={{ shrink: true }}>
              <InputLabel>Product Mode</InputLabel>
              <Select label="Product Mode" value={watch('product_mode') || ''} {...register("product_mode")} sx={{ width: '260px' }} onChange={(e) => setValue('product_mode', e.target.value)}>
                <MenuItem value="purchase">Purchase</MenuItem>
                <MenuItem value="internal manufacture">Internal Manufacture</MenuItem>
                <MenuItem value="purchase & internal manufacture">Purchase & Internal Manufacture</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          {/* MOQ (added after Product Mode) */}
          <Grid item xs={12} md={4}>
            <TextField 
              label="MOQ" 
              type="number" 
              size="small" 
              sx={{ 
                width: '260px',
                '& input[type=number]::-webkit-outer-spin-button, & input[type=number]::-webkit-inner-spin-button': { display: 'none' },
                '& input[type=number]': { '-moz-appearance': 'textfield' }
              }} 
              {...register("moq", { valueAsNumber: true })} 
            />
          </Grid>
          {/* Store */}
          <Grid item xs={12} md={4}>
            <FormControl size="small" InputLabelProps={{ shrink: true }}>
              <InputLabel>Store</InputLabel>
              <Select label="Store" value={watch("storeID") || ''} {...register("storeID")} sx={{ width: '260px' }}> 
                {stores.map(store => <MenuItem key={store.ID || store.id} value={store.ID || store.id}>{store.Name || store.name}</MenuItem>)}
              </Select>
            </FormControl>
          </Grid>
          {/* Tag (after Store) */}
          <Grid item xs={12} md={4}>
            <FormControl size="small" InputLabelProps={{ shrink: true }}>
              <InputLabel>Tag</InputLabel>
              <Select
                label="Tag"
                multiple
                value={watch('tagIDs') || []}
                onChange={(e) => setValue('tagIDs', e.target.value)}
                renderValue={(selected) => {
                  if (!selected || selected.length === 0) return '';
                  const names = tags.filter(t => (selected || []).includes(t.ID || t.id)).map(t => t.Name || t.name);
                  return names.join(', ');
                }}
                sx={{ width: '260px' }}
              >
                {tags.length > 0 ? (
                  tags.map(tag => (
                    <MenuItem key={tag.ID || tag.id} value={tag.ID || tag.id}>
                      <ListItemText primary={tag.Name || tag.name} />
                    </MenuItem>
                  ))
                ) : (
                  <MenuItem disabled value="">No Tags Available</MenuItem>
                )}
              </Select>
            </FormControl>
          </Grid>
          {/* Tax */}
          <Grid item xs={12} md={4}>
            <FormControl size="small" InputLabelProps={{ shrink: true }}>
              <InputLabel>Tax</InputLabel>
              <Select label="Tax" value={watch("taxID") || ''} {...register("taxID")} sx={{ width: '260px' }}> 
                {taxes.map(tax => <MenuItem key={tax.ID || tax.id} value={tax.ID || tax.id}>{tax.Name || tax.name}</MenuItem>)}
              </Select>
            </FormControl>
          </Grid>
          {/* GST % */}
          <Grid item xs={12} md={4}>
            <TextField label="GST %" size="small" InputProps={{ readOnly: true }} InputLabelProps={{ shrink: true }} sx={{ width: '260px' }} {...register("gstPercent", { valueAsNumber: true })} />
          </Grid>
          {/* Description */}
          <Grid item xs={12} md={4}>
            <TextField label="Description" multiline rows={2} size="small" sx={{ width: '260px' }} {...register("description")} />
          </Grid>
          {/* Internal Notes */}
          <Grid item xs={12} md={4}>
            <TextField label="Internal Notes" multiline rows={2} size="small" sx={{ width: '260px' }} {...register("internalNotes")} />
          </Grid>
          {/* Active */}
          <Grid item xs={12} md={4}>
            <FormControlLabel control={<Checkbox defaultChecked {...register("isActive")} />} label="Is Active" />
          </Grid>
        </Grid>
        <Button type="submit" variant="contained" sx={{ mt: 2 }}>Next</Button>
      </form>
    </>
  );
}