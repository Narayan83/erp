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

  // Fetch subcategories when category changes
  useEffect(() => {
    const categoryID = watch("categoryID");
    if (!categoryID) {
      setSubcategories([]);
      setValue("subcategoryID", "");
      return;
    }
    axios
      .get(`${BASE_URL}/api/subcategories`, { params: { category_id: categoryID } })
      .then((res) => {
        setSubcategories(res.data.data);
        setValue("subcategoryID", ""); // Reset subcategory selection
      })
      .catch(() => {
        setSubcategories([]);
        setValue("subcategoryID", "");
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [watch("categoryID")]);

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
          axios.get(`${BASE_URL}/api/hsn`).catch(() => ({ data: { data: [] } })),
        ]);
        setCategories(cat.data.data);
        setSubcategories(sub.data.data);
        setUnits(unit.data.data);
        setStores(store.data.data);
        setTaxes(tax.data.data);
        setHsnCodes(hsn.data.data);
      } catch (err) {
        // If any other API fails, still try to set what we can
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
        name: product.Name,
        code: product.Code,
        hsnSacCode: product.HsnSacCode,
        importance: product.Importance || "Normal",
        gstPercent: product.GstPercent,
        categoryID: product.CategoryID != null ? String(product.CategoryID) : '',
        subcategoryID: product.SubcategoryID != null ? String(product.SubcategoryID) : '',
        unitID: product.UnitID != null ? String(product.UnitID) : '',
        storeID: product.StoreID != null ? String(product.StoreID) : '',
        taxID: product.TaxID != null ? String(product.TaxID) : '',
        product_mode: product.ProductMode || "Purchase",
        description: product.Description,
        internalNotes: product.InternalNotes,
        minimumStock: product.MinimumStock,
        isActive: typeof product.isActive !== 'undefined' ? product.isActive : true,
      });
    });
  }, [product, reset]);

  console.log('categories', categories, 'subcategories', subcategories, 'units', units, 'stores', stores, 'taxes', taxes, 'hsnCodes', hsnCodes);
  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <Typography variant="h6" gutterBottom>
        {" "}
        Edit Product Info{" "}
      </Typography>
      <Grid container spacing={2}>
        <Grid size={{ xs: 12, md: 4 }}>
          <TextField
            label="Product Name"
            fullWidth
            size="small"
            {...register("name", { required: true })}
          />
        </Grid>
        <Grid size={{ xs: 12, md: 4 }}>
          <TextField
            label="Code"
            fullWidth
            size="small"
            {...register("code", { required: true })}
          />
        </Grid>

        <Grid size={{ xs: 12, md: 4 }}>
          <FormControl fullWidth size="small">
            <InputLabel>HSN/SAC Code</InputLabel>
            <Select
              label="HSN/SAC Code"
              value={watch("hsnSacCode") || ''}
              {...register("hsnSacCode")}
            >
              {hsnCodes.length > 0 ? (
                hsnCodes.map((hsn) => (
                  <MenuItem key={hsn.id || hsn.ID || hsn.code} value={hsn.code}>
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

        <Grid size={{ xs: 12, md: 4 }}>
          <FormControl fullWidth size="small">
            <InputLabel>Importance</InputLabel>
            <Select
              label="Importance"
              defaultValue="Normal"
              {...register("importance", { required: true })}
            >
              {["Normal", "High", "Critical"].map((level) => (
                <MenuItem key={level} value={level}>
                  {level}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>

        <Grid size={{ xs: 12, md: 4 }}>
          <TextField
            label="Minimum Stock"
            type="number"
            fullWidth
            size="small"
            {...register("minimumStock", { valueAsNumber: true })}
          />
        </Grid>

        {/* Dynamic Dropdowns */}
        {/* Category Dropdown */}
        <Grid size={{ xs: 12, md: 4 }}>
          <Controller
            name="categoryID"
            control={control}
            rules={{ required: true }}
            render={({ field }) => {
              const labelId = "category-label";
              const selectId = "category-select";
              return (
                <FormControl fullWidth size="small">
                  <InputLabel id={labelId}>Category *</InputLabel>
                  <Select
                    labelId={labelId}
                    id={selectId}
                    label="Category *"
                    value={field.value || ''}
                    onChange={e => field.onChange(e.target.value)}
                  >
                    {categories.map((cat) => (
                      <MenuItem key={cat.ID} value={String(cat.ID)}>
                      {cat.Name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              );
            }}
          />
        </Grid>

        {/* Subcategory Dropdown */}
        <Grid size={{ xs: 12, md: 4 }}>
          <Controller
            name="subcategoryID"
            control={control}
            render={({ field }) => (
              <FormControl fullWidth size="small">
                <InputLabel>Subcategory</InputLabel>
                <Select label="Subcategory" value={field.value || ''} onChange={e => field.onChange(e.target.value)}>
                  {subcategories.length > 0 ? (
                    subcategories.map((sub) => (
                      <MenuItem key={sub.ID} value={String(sub.ID)}>
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

        {/* Unit and Product Mode */}
        <Grid size={{ xs: 12, md: 4 }}>
          <Controller
            name="unitID"
            control={control}
            render={({ field }) => (
              <FormControl fullWidth size="small">
                <InputLabel>Unit</InputLabel>
                <Select label="Unit" value={field.value || ''} onChange={e => field.onChange(e.target.value)}>
                  {units.map((unit) => (
                    <MenuItem key={unit.ID} value={String(unit.ID)}>
                      {unit.Name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            )}
          />
        </Grid>

        <Grid size={{ xs: 12, md: 4 }}>
          <FormControl fullWidth size="small">
            <InputLabel>Product Mode</InputLabel>
            <Select
              label="Product Mode"
              defaultValue="Purchase"
              {...register("product_mode", { required: true })}
            >
              {["Purchase", "Internal Manufacturing"].map((level) => (
                <MenuItem key={level} value={level}>
                  {level}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>

        {/* Store Dropdown */}
        <Grid size={{ xs: 12, md: 4 }}>
          <Controller
            name="storeID"
            control={control}
            render={({ field }) => (
              <FormControl fullWidth size="small">
                <InputLabel>Store</InputLabel>
                <Select label="Store" value={field.value || ''} onChange={e => field.onChange(e.target.value)}>
                  {stores.map((store) => (
                    <MenuItem key={store.ID} value={String(store.ID)}>
                      {store.Name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            )}
          />
        </Grid>

        {/* Tax Dropdown */}
        <Grid size={{ xs: 12, md: 4 }}>
          <Controller
            name="taxID"
            control={control}
            render={({ field }) => (
              <FormControl fullWidth size="small">
                <InputLabel>Tax</InputLabel>
                <Select label="Tax" value={field.value || ''} onChange={e => field.onChange(e.target.value)}>
                  {taxes.map((tax) => (
                    <MenuItem key={tax.ID} value={String(tax.ID)}>
                      {`${tax.Name} (${tax.Percentage}%)`}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            )}
          />
        </Grid>

        <Grid size={{ xs: 12, md: 4 }}>
          <TextField
            label="GST %"
            fullWidth
            size="small"
            InputProps={{ readOnly: true }}
            InputLabelProps={{ shrink: true }}
            {...register("gstPercent", { valueAsNumber: true })}
          />
        </Grid>

        <Grid size={{ xs: 12, md: 4 }}>
          <TextField
            label="Description"
            multiline
            rows={2}
            fullWidth
            size="small"
            {...register("description")}
          />
        </Grid>
        <Grid size={{ xs: 12, md: 4 }}>
          <TextField
            label="Internal Notes"
            multiline
            rows={2}
            fullWidth
            size="small"
            {...register("internalNotes")}
          />
        </Grid>
        <Grid size={{ xs: 12, md: 4 }}>
          <FormControlLabel
            control={
              <Checkbox
                defaultChecked
                {...register("isActive")}
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
