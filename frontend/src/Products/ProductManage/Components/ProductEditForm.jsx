import React, { useEffect, useState } from "react";
import {
  Grid,
  TextField,
  Button,
  MenuItem,
  Typography,
  Box,
  FormControl,
  InputLabel,
  Select,
  Checkbox,
  FormControlLabel,
} from "@mui/material";
import { useForm, Controller } from "react-hook-form";
import axios from "axios";
import { BASE_URL } from "../../../Config";
import { useNavigate } from "react-router-dom";

export default function ProductEditForm({ product, onSubmit }) {
  const { register, handleSubmit, watch, setValue, reset, control } = useForm();

  const [categories, setCategories] = useState([]);
  const [subcategories, setSubcategories] = useState([]);
  const [units, setUnits] = useState([]);
  const [stores, setStores] = useState([]);
  const [taxes, setTaxes] = useState([]);
  const [hsnCodes, setHsnCodes] = useState([]);

  const navigate = useNavigate();
  
  // Watch for HSN code changes
  const selectedHsnID = watch("HsnID");
  const selectedCategoryID = watch("CategoryID");

  // Add effect to update tax and GST when HSN is selected
  useEffect(() => {
    if (!selectedHsnID) return;
    const selHsn = hsnCodes.find(h => (h.id || h.ID) === selectedHsnID);
    if (selHsn) {
      // Find tax either embedded or via tax_id
      let taxObj = null;
      if (selHsn.tax) taxObj = selHsn.tax;
      else if (selHsn.tax_id) taxObj = taxes.find(t => (t.ID || t.id) === selHsn.tax_id);
      
      if (taxObj) {
        const taxId = taxObj.ID || taxObj.id;
        setValue('TaxID', taxId, { shouldValidate: true });
        setValue('GstPercent', taxObj.Percentage ?? taxObj.percentage ?? '', { shouldValidate: true });
      }
      
      // For compatibility also store code into legacy HsnSacCode if backend expects string
      if (selHsn.code) setValue('HsnSacCode', selHsn.code);
    }
  }, [selectedHsnID, hsnCodes, taxes, setValue]);

  // Fetch subcategories when category changes
  useEffect(() => {
    if (!selectedCategoryID) {
      setSubcategories([]);
      setValue("SubcategoryID", "");
      return;
    }
    axios
      .get(`${BASE_URL}/api/subcategories`, { params: { category_id: selectedCategoryID } })
      .then((res) => {
        setSubcategories(res.data.data);
        setValue("SubcategoryID", ""); // Reset subcategory selection
      })
      .catch(() => {
        setSubcategories([]);
        setValue("SubcategoryID", "");
      });
  }, [selectedCategoryID, setValue]);

  useEffect(() => {
    const loadOptions = async () => {
      try {
        const [cat, sub, unit, store, tax, hsn] = await Promise.all([
          axios.get(`${BASE_URL}/api/categories`),
          axios.get(`${BASE_URL}/api/subcategories`, {
            params: { category_id: product.CategoryID },
          }),
          axios.get(`${BASE_URL}/api/units`),
          axios.get(`${BASE_URL}/api/stores`),
          axios.get(`${BASE_URL}/api/taxes`),
          axios.get(`${BASE_URL}/api/hsncode`).catch(() => ({ data: { data: [] } })),
        ]);
        setCategories(cat.data.data);
        setSubcategories(sub.data.data);
        setUnits(unit.data.data);
        setStores(store.data.data);
        setTaxes(tax.data.data);
        setHsnCodes(hsn.data.data);
      } catch (err) {
        console.error("Error loading options:", err);
        setCategories([]);
        setSubcategories([]);
        setUnits([]);
        setStores([]);
        setTaxes([]);
        setHsnCodes([]);
      }
    };

    loadOptions().then(() => {
      // Pre-fill form only after options are loaded
      reset({
        Name: product.Name,
        Code: product.Code, 
        HsnID: product.HsnID || '', // Use HsnID for consistency
        HsnSacCode: product.HsnSacCode || '',
        Importance: product.Importance || "Normal",
        GstPercent: product.GstPercent,
        CategoryID: product.CategoryID, // Don't convert to string - keep original format
        SubcategoryID: product.SubcategoryID,
        UnitID: product.UnitID,
        StoreID: product.StoreID,
        TaxID: product.TaxID,
        ProductMode: product.ProductMode || "Purchase",
        Description: product.Description || '',
        InternalNotes: product.InternalNotes || '',
        MinimumStock: product.MinimumStock || 0,
        IsActive: typeof product.IsActive !== 'undefined' ? product.IsActive : true,
        ProductType: product.ProductType || 'All',
        moq: product.moq || product.MOQ || '', // Added for MOQ
      });
    });
  }, [product, reset]);

  const handleFormSubmit = (data) => {
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
      ID: product.ID // Make sure we include the product ID
    };
    
    onSubmit(formattedData);
  };

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)}>
      <Typography variant="h6" gutterBottom>
        Edit Product Info
      </Typography>
      <Grid container spacing={2}>
        <Grid item xs={12} md={4}>
          <TextField
            label="Product Name"
            size="small"
            sx={{ width: '260px' }}
            {...register("Name", { required: true })}
          />
        </Grid>
        <Grid item xs={12} md={4}>
          <TextField
            label="Code"
            size="small"
            sx={{ width: '260px' }}
            {...register("Code", { required: true })}
          />
        </Grid>

        <Grid item xs={12} md={4}>
          <FormControl size="small">
            <InputLabel>HSN Code</InputLabel>
            <Select
              label="HSN Code"
              value={watch("HsnID") || ''}
              {...register("HsnID")}
              sx={{ width: '260px' }}
            >
              {hsnCodes.length > 0 ? (
                hsnCodes.map((hsn) => (
                  <MenuItem key={hsn.id || hsn.ID} value={hsn.id || hsn.ID}>
                    {hsn.code}
                  </MenuItem>
                ))
              ) : (
                <MenuItem disabled value="">
                  No HSN Codes Available
                </MenuItem>
              )}
            </Select>
          </FormControl>
        </Grid>

        <Grid item xs={12} md={4}>
          <FormControl size="small">
            <InputLabel>Importance</InputLabel>
            <Select
              label="Importance"
              {...register("Importance", { required: true })}
              sx={{ width: '260px' }}
            >
              {["Normal", "High", "Critical"].map((level) => (
                <MenuItem key={level} value={level}>
                  {level}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>

        <Grid item xs={12} md={4}>
          <FormControl size="small">
            <InputLabel>Product Type</InputLabel>
            <Select
              label="Product Type"
              {...register("ProductType", { required: true })}
              sx={{ width: '260px' }}
            >
              {['All','Finished Goods','Semi-Finished Goods','Raw Materials'].map((type) => (
                <MenuItem key={type} value={type}>
                  {type}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>

        <Grid item xs={12} md={4}>
          <TextField
            label="Minimum Stock"
            type="number"
            size="small"
            sx={{ width: '260px' }}
            {...register("MinimumStock", { valueAsNumber: true })}
          />
        </Grid>

        {/* Category Dropdown */}
        <Grid item xs={12} md={4}>
          <Controller
            name="CategoryID"
            control={control}
            rules={{ required: true }}
            render={({ field }) => (
              <FormControl size="small">
                <InputLabel>Category *</InputLabel>
                <Select
                  label="Category *"
                  value={field.value || ''}
                  onChange={e => field.onChange(e.target.value)}
                  sx={{ width: '260px' }}
                >
                  {categories.map((cat) => (
                    <MenuItem key={cat.ID} value={cat.ID}>
                      {cat.Name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            )}
          />
        </Grid>

        {/* Subcategory Dropdown */}
        <Grid item xs={12} md={4}>
          <Controller
            name="SubcategoryID"
            control={control}
            render={({ field }) => (
              <FormControl size="small">
                <InputLabel>Subcategory</InputLabel>
                <Select 
                  label="Subcategory" 
                  value={field.value || ''} 
                  onChange={e => field.onChange(e.target.value)}
                  sx={{ width: '260px' }}
                >
                  {subcategories.length > 0 ? (
                    subcategories.map((sub) => (
                      <MenuItem key={sub.ID} value={sub.ID}>
                        {sub.Name}
                      </MenuItem>
                    ))
                  ) : (
                    <MenuItem disabled value="">
                      No Subcategories Available
                    </MenuItem>
                  )}
                </Select>
              </FormControl>
            )}
          />
        </Grid>

        {/* Unit */}
        <Grid item xs={12} md={4}>
          <Controller
            name="UnitID"
            control={control}
            render={({ field }) => (
              <FormControl size="small">
                <InputLabel>Unit</InputLabel>
                <Select 
                  label="Unit" 
                  value={field.value || ''} 
                  onChange={e => field.onChange(e.target.value)}
                  sx={{ width: '260px' }}
                >
                  {units.map((unit) => (
                    <MenuItem key={unit.ID} value={unit.ID}>
                      {unit.Name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            )}
          />
        </Grid>

        <Grid item xs={12} md={4}>
          <FormControl size="small">
            <InputLabel>Product Mode</InputLabel>
            <Select
              label="Product Mode"
              {...register("ProductMode", { required: true })}
              sx={{ width: '260px' }}
            >
              {["Purchase", "Internal Manufacturing"].map((level) => (
                <MenuItem key={level} value={level}>
                  {level}
                </MenuItem>
              ))}
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
        {/* Store Dropdown */}
        <Grid item xs={12} md={4}>
          <Controller
            name="StoreID"
            control={control}
            render={({ field }) => (
              <FormControl size="small">
                <InputLabel>Store</InputLabel>
                <Select 
                  label="Store" 
                  value={field.value || ''} 
                  onChange={e => field.onChange(e.target.value)}
                  sx={{ width: '260px' }}
                >
                  {stores.map((store) => (
                    <MenuItem key={store.ID} value={store.ID}>
                      {store.Name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            )}
          />
        </Grid>

        {/* Tax Dropdown */}
        <Grid item xs={12} md={4}>
          <Controller
            name="TaxID"
            control={control}
            render={({ field }) => (
              <FormControl size="small">
                <InputLabel>Tax</InputLabel>
                <Select 
                  label="Tax" 
                  value={field.value || ''} 
                  onChange={e => field.onChange(e.target.value)}
                  sx={{ width: '260px' }}
                >
                  {taxes.map((tax) => (
                    <MenuItem key={tax.ID} value={tax.ID}>
                      {`${tax.Name} (${tax.Percentage}%)`}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            )}
          />
        </Grid>

        <Grid item xs={12} md={4}>
          <TextField
            label="GST %"
            size="small"
            InputProps={{ readOnly: true }}
            InputLabelProps={{ shrink: true }}
            sx={{ width: '260px' }}
            {...register("GstPercent", { valueAsNumber: true })}
          />
        </Grid>

        <Grid item xs={12} md={4}>
          <TextField
            label="Description"
            multiline
            rows={2}
            size="small"
            sx={{ width: '260px' }}
            {...register("Description")}
          />
        </Grid>
        <Grid item xs={12} md={4}>
          <TextField
            label="Internal Notes"
            multiline
            rows={2}
            size="small"
            sx={{ width: '260px' }}
            {...register("InternalNotes")}
          />
        </Grid>
        <Grid item xs={12} md={4}>
          <FormControlLabel
            control={
              <Checkbox
                {...register("IsActive")}
              />
            }
            label="Is Active"
          />
        </Grid>
      </Grid>

      <Box mt={2} display="flex" justifyContent="space-between" gap={2}>
        <Button type="submit" variant="contained">
          Update Product
        </Button>

        <Button
          variant="outlined"
          color="secondary"
          onClick={() => navigate(`/products/${product.ID}/variants`)}
        >
          Update Product Variants
        </Button>
      </Box>
    </form>
  );
}
