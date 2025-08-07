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
  const { register, handleSubmit, watch, setValue, reset, control, getValues } = useForm({});

  // State for dropdown options and loading
  const [categories, setCategories] = useState([]);
  const [subcategories, setSubcategories] = useState([]);
  const [units, setUnits] = useState([]);
  const [stores, setStores] = useState([]);
  const [taxes, setTaxes] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [productCodes, setProductCodes] = useState([]); // For code uniqueness check
  const [formError, setFormError] = useState(""); // For user-friendly error

  // Always reset form when defaultValues change (for stepper back/forward)
  useEffect(() => {
    if (defaultValues) {
      reset({
        name: defaultValues.name || defaultValues.Name || '',
        code: defaultValues.code || defaultValues.Code || '',
        hsnSacCode: defaultValues.hsnSacCode || defaultValues.HsnSacCode || '',
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
        name: '', code: '', hsnSacCode: '', importance: 'Normal', productType: 'All', minimumStock: '',
        categoryID: '', subcategoryID: '', unitID: '', product_mode: 'Purchase',
        storeID: '', taxID: '', gstPercent: '', description: '', internalNotes: '',
        isActive: true
      });
    }
  }, [defaultValues, reset]);

  const selectedCategoryID = watch("categoryID");
  const selectedTaxID = watch("taxID");

//   useEffect(() => {
//   return () => {
//     // When component unmounts, save the current form state
//     const formData = getValues();
//     if (resetForm) {
//       resetForm(formData);
//     }
//   };
//  }, [resetForm, getValues]);

  // Fetch all dropdown data on mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [catRes, unitRes, storeRes, taxRes, prodRes] = await Promise.all([
          axios.get(`${BASE_URL}/api/categories`),
          axios.get(`${BASE_URL}/api/units`),
          axios.get(`${BASE_URL}/api/stores`),
          axios.get(`${BASE_URL}/api/taxes`),
          axios.get(`${BASE_URL}/api/products?limit=10000`), // Get all products for code check
        ]);

        setCategories(catRes.data.data);
        setUnits(unitRes.data.data);
        setStores(storeRes.data.data);
        setTaxes(taxRes.data.data);
        setProductCodes((prodRes.data.data || []).map(p => p.code || p.Code));
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
        .get(`${BASE_URL}/api/subcategories`, {
          params: { category_id: selectedCategoryID },
        })
        .then((res) => setSubcategories(res.data.data))
        .catch(() => setSubcategories([]));
    } else {
      setSubcategories([]);
    }
  }, [selectedCategoryID]);

  // Update GST percentage when tax is selected
  useEffect(() => {
    if (selectedTaxID) {
      const selectedTax = taxes.find((t) => t.ID === selectedTaxID);
      if (selectedTax) {
        setValue("gstPercent", selectedTax.Percentage);
      }
    } else {
      setValue("gstPercent", "");
    }
  }, [selectedTaxID, taxes, setValue]);



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
    // Call parent onNext, which should also handle backend errors
    onNext(data);
  };

  // If backend returns duplicate error, parent should set a prop error and display it here as well (not implemented here)

  return (
    <>
      {formError && (
        <div style={{ color: 'red', marginBottom: 10 }}>{formError}</div>
      )}
      <form onSubmit={handleSubmit(handleFormSubmit)}>
        <Grid container spacing={2}>
        <Grid  size={{ xs: 12, md: 4 }}>
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

        {/* Product Type Dropdown */}
        <Grid size={{ xs: 12, md: 4 }}>
          <FormControl fullWidth size="small">
            <InputLabel>Product Type</InputLabel>
            <Select
              label="Product Type"
              defaultValue="All"
              {...register("productType", { required: true })}
            >
              {[
                "All",
                "Finished Goods",
                "Semi-Finished Goods",
                "Raw Materials"
              ].map((type) => (
                <MenuItem key={type} value={type}>
                  {type}
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
            {...register("minimumStock", {valueAsNumber: true})}
          />
        </Grid>

        {/* Dynamic Dropdowns */}
         {/* Category Dropdown */}
        <Grid size={{ xs: 12, md: 4 }}>
          <FormControl fullWidth size="small">
            <InputLabel>Category *</InputLabel>
            <Select
              label="Category *"
              value={watch("categoryID") || ''}
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
              value={watch("subcategoryID") || ''}
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
              value={watch("unitID") || ''}
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
              value={watch("storeID") || ''}
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
              value={watch("taxID") || ''}
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

      <Button type="submit" variant="contained" sx={{ mt: 2 }}>
        Next
      </Button>
    </form>
    </>
  );
}