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
} from "@mui/material";
import { useForm, Controller } from "react-hook-form";
import axios from "axios";
import { BASE_URL } from "../../../Config";
import { useNavigate } from "react-router-dom";

export default function ProductEditForm({ product, onSubmit }) {
  const { register, handleSubmit, watch, setValue, reset } = useForm();

  const [categories, setCategories] = useState([]);
  const [subcategories, setSubcategories] = useState([]);
  const [units, setUnits] = useState([]);
  const [stores, setStores] = useState([]);
  const [taxes, setTaxes] = useState([]);

  const navigate = useNavigate();

  useEffect(() => {
    const loadOptions = async () => {
      const [cat, sub, unit, store, tax] = await Promise.all([
        axios.get(`${BASE_URL}/api/categories`),
        axios.get(`${BASE_URL}/api/subcategories`, {
          params: { category_id: product.CategoryID },
        }),
        axios.get(`${BASE_URL}/api/units`),
        axios.get(`${BASE_URL}/api/stores`),
        axios.get(`${BASE_URL}/api/taxes`),
      ]);
      setCategories(cat.data.data);
      setSubcategories(sub.data.data);
      setUnits(unit.data.data);
      setStores(store.data.data);
      setTaxes(tax.data.data);
    };

    loadOptions();

    // Pre-fill form
    reset({
      name: product.Name,
      code: product.Code,
      hsnSacCode: product.HsnSacCode,
      importance: product.Importance || "Normal",
      gstPercent: product.GstPercent,
      categoryID: product.CategoryID,
      subcategoryID: product.SubcategoryID,
      unitID: product.UnitID,
      storeID: product.StoreID,
      taxID: product.TaxID,
      product_mode: product.ProductMode || "Purchase",
      description: product.Description,
      internalNotes: product.InternalNotes,
      minimumStock: product.MinimumStock,
    });
  }, [product, reset]);

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
          <TextField
            label="HSN/SAC Code"
            fullWidth
            size="small"
            {...register("hsnSacCode")}
          />
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
          <FormControl fullWidth size="small">
            <InputLabel>Category *</InputLabel>
            <Select
              label="Category *"
              value={watch("categoryID") || ""}
              {...register("categoryID", { required: true })}
            >
              {categories.map((cat) => (
                <MenuItem key={cat.ID} value={cat.ID}>
                  {cat.Name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>

        {/* Subcategory Dropdown */}
        <Grid size={{ xs: 12, md: 4 }}>
          <FormControl fullWidth size="small">
            <InputLabel>Subcategory</InputLabel>
            <Select
              label="Subcategory"
              value={watch("subcategoryID") || ""}
              {...register("subcategoryID")}
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
        </Grid>

        {/* Unit and Product Mode */}
        <Grid size={{ xs: 12, md: 4 }}>
          <FormControl fullWidth size="small">
            <InputLabel>Unit</InputLabel>
            <Select
              label="Unit"
              value={watch("unitID") || ""}
              {...register("unitID")}
            >
              {units.map((unit) => (
                <MenuItem key={unit.ID} value={unit.ID}>
                  {unit.Name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
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
          <FormControl fullWidth size="small">
            <InputLabel>Store</InputLabel>
            <Select
              label="Store"
              value={watch("storeID") || ""}
              {...register("storeID")}
            >
              {stores.map((store) => (
                <MenuItem key={store.ID} value={store.ID}>
                  {store.Name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>

        {/* Tax Dropdown */}
        <Grid size={{ xs: 12, md: 4 }}>
          <FormControl fullWidth size="small">
            <InputLabel>Tax</InputLabel>
            <Select
              label="Tax"
              value={watch("taxID") || ""}
              {...register("taxID")}
            >
              {taxes.map((tax) => (
                <MenuItem key={tax.ID} value={tax.ID}>
                  {`${tax.Name} (${tax.Percentage}%)`}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
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
