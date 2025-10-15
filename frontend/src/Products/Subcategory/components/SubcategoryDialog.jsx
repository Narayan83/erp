import React,{useState,useEffect} from "react";
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  TextField, Button, FormControl,Select,InputLabel,Snackbar,MenuItem,Autocomplete, IconButton, InputAdornment
} from "@mui/material";
import Tooltip from '@mui/material/Tooltip';
import CloseRoundedIcon from '@mui/icons-material/CloseRounded';
import ArrowDropDownIcon from '@mui/icons-material/ArrowDropDown';
import ArrowDropUpIcon from '@mui/icons-material/ArrowDropUp';
import { BASE_URL }  from "../../../Config";
import axios from "axios";

const SubcategoryDialog = ({ open, onClose, onSubmit, formData, setFormData }) => {
  const [categories, setCategories] = useState([]);
  const [snackbar, setSnackbar] = useState({ open: false, message: "", severity: "success" });
  const [loading, setLoading] = useState(false);
  const [categoryOpen, setCategoryOpen] = useState(false);
  const [subcategoryOpen, setSubcategoryOpen] = useState(false);
  const [subcategories, setSubcategories] = useState([]);
  const [loadingSubcategories, setLoadingSubcategories] = useState(false);

  const loadCategories = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${BASE_URL}/api/categories`);
      let categoriesData = [];
      if (Array.isArray(res.data)) {
        categoriesData = res.data;
      } else if (res.data && typeof res.data === 'object') {
        if (Array.isArray(res.data.data)) categoriesData = res.data.data;
        else if (Array.isArray(res.data.categories)) categoriesData = res.data.categories;
        else {
          Object.values(res.data).forEach(value => {
            if (Array.isArray(value)) categoriesData = value;
          });
        }
      }
      setCategories(categoriesData);
    } catch (err) {
      showSnackbar("Failed to load categories", "error");
      console.error("Axios error:", err);
      setCategories([]);
    } finally {
      setLoading(false);
    }
  };

  const showSnackbar = (message, severity = "success") => {
    setSnackbar({ open: true, message, severity });
  };

  // Fetch categories when dialog opens
  useEffect(() => {
    if (open) {
      loadCategories();
      loadSubcategories();
    }
  }, [open]);

  // Fetch subcategories (optionally filtered by category)
  const loadSubcategories = async (categoryId) => {
    setLoadingSubcategories(true);
    try {
      const res = await axios.get(`${BASE_URL}/api/subcategories`, {
        params: categoryId ? { category_id: categoryId } : {}
      });

      let subs = [];
      if (Array.isArray(res.data)) subs = res.data;
      else if (res.data && typeof res.data === 'object') {
        if (Array.isArray(res.data.data)) subs = res.data.data;
        else if (Array.isArray(res.data.subcategories)) subs = res.data.subcategories;
        else {
          Object.values(res.data).forEach(value => {
            if (Array.isArray(value)) subs = value;
          });
        }
      }

      setSubcategories(subs);
    } catch (err) {
      showSnackbar("Failed to load subcategories", "error");
      console.error("Axios error (subcategories):", err);
      setSubcategories([]);
    } finally {
      setLoadingSubcategories(false);
    }
  };

  // Reload subcategories when selected category changes
  useEffect(() => {
    const categoryId = formData?.category?.ID || formData?.category_id || null;
    if (open) loadSubcategories(categoryId);
  }, [formData?.category, formData?.category_id, open]);
  
  // Validate and submit the form, preventing duplicate subcategory names for the same category
  const handleSubmit = () => {
    const name = (formData.name || "").toString().trim();
    const categoryId = formData?.category?.ID || formData?.category_id || null;

    if (!name) {
      showSnackbar("Please enter a subcategory name", "error");
      return;
    }

    if (!categoryId) {
      showSnackbar("Please select a category", "error");
      return;
    }

    // Check for duplicate: same name (case-insensitive) under the same category
    const duplicate = Array.isArray(subcategories) && subcategories.find((s) => {
      const sName = (s?.Name || s?.name || "").toString().trim();
      if (!sName) return false;
      if (sName.toLowerCase() !== name.toLowerCase()) return false;

      // If editing, allow the same record
      const sId = s?.ID || s?.id || null;
      if (formData.id && sId && Number(sId) === Number(formData.id)) return false;

      // Try to resolve category id of the existing subcategory
      const sCatId = s?.Category?.ID || s?.category_id || s?.CategoryID || s?.category?.ID || null;
      if (sCatId) {
        return Number(sCatId) === Number(categoryId);
      }

      // If no category info present on the item, but subcategories were loaded filtered by category,
      // assume it belongs to the selected category (conservative duplicate detection).
      return true;
    });

    if (duplicate) {
      showSnackbar("A subcategory with this name already exists for the selected category.", "error");
      return;
    }

    // Passed validation — call parent submit
    onSubmit();
  };
  

  
  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="xs">
      <DialogTitle>{formData.id ? "Edit" : "Add"} Subcategory</DialogTitle>
      <DialogContent>
        {/* <FormControl fullWidth margin="normal">
          <InputLabel>Category</InputLabel>
          <Select
            value={formData.category_id || ""}
            label="Category"
            onChange={(e) =>
              setFormData({ ...formData, category_id: Number(e.target.value) })
            }
          >
            {categories.map((cat) => (
              <MenuItem key={cat.ID} value={cat.ID}>
                {cat.Name}
              </MenuItem>
            ))}
          </Select>
        </FormControl> */}

       <Autocomplete
          options={Array.isArray(categories) ? categories.map(cat => cat) : []}
          getOptionLabel={(option) => option?.Name || option?.name || ""}
          loading={loading}
          open={categoryOpen}
          onOpen={() => setCategoryOpen(true)}
          onClose={() => setCategoryOpen(false)}
          value={formData.category || null}
          onChange={(_, val) => {
            setFormData({ ...formData, category: val, category_id: val?.ID || null });
            setCategoryOpen(false);
          }}
          renderInput={(params) => (
            <TextField
              {...params}
              label="Category"
              margin="normal"
              fullWidth
              onClick={() => setCategoryOpen(true)}
              InputProps={{
                ...params.InputProps,
                endAdornment: (
                  <>
                    {params.InputProps.endAdornment}
                  </>
                ),
              }}
            />
          )}
        />

        <Autocomplete
          freeSolo
          autoSelect
          options={Array.isArray(subcategories) ? subcategories.map(s => s.Name || s.name || "") : []}
          loading={loadingSubcategories}
          open={subcategoryOpen}
          onOpen={() => setSubcategoryOpen(true)}
          onClose={() => setSubcategoryOpen(false)}
          value={formData.name || ""}
          onChange={(_, newValue) => {
            setFormData({ ...formData, name: newValue });
            setSubcategoryOpen(false);
          }}
          renderInput={(params) => (
            <TextField
              {...params}
              fullWidth
              label="Subcategory Name"
              margin="normal"
              onClick={() => setSubcategoryOpen(true)}
              InputProps={{
                ...params.InputProps,
                endAdornment: (
                  <>
                    {params.InputProps.endAdornment}
                    <InputAdornment position="end">
                      <Tooltip title={subcategoryOpen ? 'Close suggestions' : 'Open suggestions'}>
                        <IconButton size="small" onClick={(e) => { e.stopPropagation(); setSubcategoryOpen(o => !o); }} sx={{ color: 'primary.main' }}>
                          {subcategoryOpen ? <ArrowDropUpIcon fontSize="small" /> : <ArrowDropDownIcon fontSize="small" />}
                        </IconButton>
                      </Tooltip>
                    </InputAdornment>
                  </>
                ),
              }}
            />
          )}
        />
      </DialogContent>
      <DialogActions>
  <Button onClick={onClose}>Cancel</Button>
  <Button onClick={handleSubmit} variant="contained">Save</Button>
      </DialogActions>
    </Dialog>
  );
};

export default SubcategoryDialog;
