import React, { useState, useEffect, use } from "react";
import {
  Autocomplete,
  Grid,
  TextField,
  IconButton,
  CircularProgress,
} from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";
import axios from "axios";
import { BASE_URL } from "../../../Config";

const QuotationItemRow = ({ index, item, onChange, onRemove }) => {
  const [productOptions, setProductOptions] = useState([]);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [loadingVariants, setLoadingVariants] = useState(false);
 // console.log("product_variants", item.product_variants); 
  // useEffect(() => {
  //   console.log("Item row mounted with index:", index);
  //   console.log("Initial item data:", item);
  // });




useEffect(() => {
  console.log("product_variants changed:", item.product_variants);
}, [item.product_variants]);

  const handleChange = async (field, value) => {
    const updatedItem = { ...item, [field]: value };

    if (field === "product") {
      updatedItem.product_id = value?.ID || null;
      updatedItem.product = value || null;
      updatedItem.selected_variant = null;
      updatedItem.product_variant_id = null;
      updatedItem.product_variants = [];
      updatedItem.tax_percent = value?.Tax?.Percentage || 0;

      console.log("At level Selected product:", updatedItem);

      if (value?.ID) {
        setLoadingVariants(true);
        try {
          const res = await axios.get(`${BASE_URL}/api/product_variants/${value.ID}`);
          console.log("Fetched variants", res.data);
          //updatedItem.product_variants = res.data || [];
          updatedItem.product_variants = Array.isArray(res.data) ? res.data : [res.data];
          
        } catch (err) {
          console.error("Error fetching variants", err);
        } finally {
          setLoadingVariants(false);
          onChange(index, updatedItem);
          console.log("Updated variants", item.product_variants);
          return; 
        }
      }
    } else if (field === "selected_variant") {
      updatedItem.product_variant_id = value?.ID || null;
      updatedItem.rate = value?.StdSalesPrice || 0;
     
     
    } else if (field === "quantity") {
      updatedItem.quantity = value || 0;
    }

    const qty = parseFloat(updatedItem.quantity) || 0;
    const rate = parseFloat(updatedItem.rate) || 0;
    const taxPercent = parseFloat(updatedItem.tax_percent) || 0;
    console.log("Calculating totals for item:", updatedItem);

    updatedItem.tax_amount = (rate * qty * taxPercent) / 100;
    updatedItem.line_total = (rate * qty) + updatedItem.tax_amount;

    onChange(index, updatedItem);
  };

  const handleProductSearch = async (text) => {
    if (!text) return;
    setLoadingProducts(true);
    try {
      const res = await axios.get(`${BASE_URL}/api/products?search=${text}`);
      setProductOptions(res.data.data || []);
    } catch (err) {
      console.error("Product search failed", err);
    } finally {
      setLoadingProducts(false);
    }
  };

  return (
    <>
    <Grid container spacing={2} alignItems="center" sx={{ mb: 1 }}>
      {/* Product */}
      <Grid item size={{ xs: 2, md: 2 }}>
        <Autocomplete
          options={productOptions}
          getOptionLabel={(opt) => opt?.Name || ""}
          value={item.product || null}
          onChange={(e, value) => handleChange("product", value)}
          onInputChange={(e, val) => handleProductSearch(val)}
          loading={loadingProducts}
          renderInput={(params) => (
            <TextField
              {...params}
              label="Product"
              fullWidth
              size="small"
              InputProps={{
                ...params.InputProps,
                endAdornment: (
                  <>
                    {loadingProducts ? <CircularProgress size={20} /> : null}
                    {params.InputProps.endAdornment}
                  </>
                ),
              }}
            />
          )}
        />
      </Grid>

      {/* Variant */}
      <Grid item size={{ xs: 6, md: 2 }}>
        <Autocomplete
        options={Array.isArray(item.product_variants) ? item.product_variants : []}
        getOptionLabel={(opt) =>{
          // console.log("Variant option:", opt);
           return opt?.SKU 
    ? `${opt.SKU} - ${opt.Color || ""} - ${opt.Size || ""} - ₹${opt.StdSalesPrice || 0}`
    : ""
        }
           
        }
            value={item.selected_variant || null}
            onChange={(e, value) => handleChange("selected_variant", value)}
            loading={loadingVariants}
            renderInput={(params) => (
                <TextField
                {...params}
                label="Variant"
                fullWidth
                size="small"
                InputProps={{
                    ...params.InputProps,
                    endAdornment: (
                    <>
                        {loadingVariants ? <CircularProgress size={20} /> : null}
                        {params.InputProps.endAdornment}
                    </>
                    ),
                }}
                />
  )}
/>
       
      </Grid>

      {/* Quantity */}
      <Grid item size={{ xs: 6, md: 2 }}>
        <TextField
          label="Quantity"
          type="number"
          size="small"
          value={item.quantity}
          onChange={(e) =>
            handleChange("quantity", parseFloat(e.target.value))
          }
          fullWidth
        />
      </Grid>

      {/* Rate */}
      <Grid item size={{ xs: 6, md: 2 }}>
        <TextField label="Rate" size="small" value={item.rate || 0} disabled fullWidth />
      </Grid>

      {/* Line Total */}
      <Grid item size={{ xs: 6, md: 2 }}>
        <TextField
          label="Line Total"
          size="small"
          value={(item.line_total || 0).toFixed(2)}
          disabled
          fullWidth
        />
      </Grid>

      {/* Delete */}
      <Grid item size={{ xs: 6, md: 2 }}>
        <IconButton onClick={() => onRemove(index)}>
          <DeleteIcon />
        </IconButton>
      </Grid>
      </Grid>
    </>
  );
};

export default QuotationItemRow;