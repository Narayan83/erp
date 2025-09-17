import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { 
  Button, 
  Grid, 
  MenuItem, 
  TextField,
  FormControl,
  InputLabel,
  Select,
  CircularProgress,
  Checkbox,
  FormControlLabel
} from "@mui/material";
import axios from "axios";
import { BASE_URL } from "../../../Config";

export default function ProductStepForm({ defaultValues, onNext, resetForm }) {
  const { register, handleSubmit, watch, setValue, reset, getValues } = useForm({});

  // State for dropdown options and loading
  const [categories, setCategories] = useState([]);
  const [subcategories, setSubcategories] = useState([]);
  const [units, setUnits] = useState([]);
  const [stores, setStores] = useState([]);
  const [taxes, setTaxes] = useState([]);
  const [hsnCodes, setHsnCodes] = useState([]); // NEW: HSN codes list
  const [isLoading, setIsLoading] = useState(true);
  const [productCodes, setProductCodes] = useState([]); // For code uniqueness check
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
        product_mode: defaultValues.product_mode || defaultValues.ProductMode || 'Purchase',
        storeID: defaultValues.storeID || defaultValues.StoreID || '',
        taxID: defaultValues.taxID || defaultValues.TaxID || '',
        gstPercent: defaultValues.gstPercent || defaultValues.GstPercent || '',
        description: defaultValues.description || defaultValues.Description || '',
        internalNotes: defaultValues.internalNotes || defaultValues.InternalNotes || '',
        isActive: typeof defaultValues.isActive !== 'undefined' ? defaultValues.isActive : true,
      });
    } else {
      reset({
        name: '', code: '', hsnID: '', hsnSacCode: '', importance: 'Normal', productType: 'All', minimumStock: '',
        categoryID: '', subcategoryID: '', unitID: '', product_mode: 'Purchase',
        storeID: '', taxID: '', gstPercent: '', description: '', internalNotes: '',
        isActive: true
      });
    }
  }, [defaultValues, reset]);

  const selectedCategoryID = watch("categoryID");
  const selectedTaxID = watch("taxID");
  const selectedHsnID = watch("hsnID");

  // Fetch all dropdown data on mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [catRes, unitRes, storeRes, taxRes, prodRes, hsnRes] = await Promise.all([
          axios.get(`${BASE_URL}/api/categories`, { params: { page: 1, limit: 1000 } }),
          axios.get(`${BASE_URL}/api/units`, { params: { page: 1, limit: 1000 } }),
          axios.get(`${BASE_URL}/api/stores`, { params: { page: 1, limit: 1000 } }),
          axios.get(`${BASE_URL}/api/taxes`, { params: { page: 1, limit: 1000 } }),
          axios.get(`${BASE_URL}/api/products`, { params: { page: 1, limit: 10000 } }),
          axios.get(`${BASE_URL}/api/hsncode`, { params: { page: 1, limit: 1000 } }),
        ]);

        setCategories(catRes.data.data || []);
        setUnits(unitRes.data.data || []);
        setStores(storeRes.data.data || []);
        setTaxes(taxRes.data.data || []);
        setProductCodes((prodRes.data.data || []).map(p => p.code || p.Code));
        setHsnCodes(hsnRes.data.data || []);
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
    if (productCodes.includes(data.code)) {
      setFormError("A product with this code already exists. Please use a unique code.");
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
          {/* Product Name */}
          <Grid item xs={12} md={4}>
            <TextField label="Product Name" size="small" sx={{ width: '260px' }} {...register("name", { required: true })} />
          </Grid>
          {/* Code */}
          <Grid item xs={12} md={4}>
            <TextField label="Code" size="small" sx={{ width: '260px' }} {...register("code", { required: true })} />
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
              <Select label="Product Mode" defaultValue="Purchase" {...register("product_mode", { required: true })} sx={{ width: '260px' }}>
                {['Purchase','Internal Manufacturing'].map(level => <MenuItem key={level} value={level}>{level}</MenuItem>)}
              </Select>
            </FormControl>
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
          {/* Tax */}
          <Grid item xs={12} md={4}>
            <FormControl size="small" InputLabelProps={{ shrink: true }}>
              <InputLabel>Tax</InputLabel>
              <Select label="Tax" value={watch("taxID") || ''} {...register("taxID")} sx={{ width: '260px' }}> 
                {taxes.map(tax => <MenuItem key={tax.ID || tax.id} value={tax.ID || tax.id}>{`${tax.Name || tax.name} (${tax.Percentage ?? tax.percentage}%)`}</MenuItem>)}
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