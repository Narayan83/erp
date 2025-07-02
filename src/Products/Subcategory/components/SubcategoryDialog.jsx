import React,{useState,useEffect} from "react";
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  TextField, Button, FormControl,Select,InputLabel,Snackbar,MenuItem,Autocomplete
} from "@mui/material";
import { BASE_URL }  from "../../../Config";
import axios from "axios";
import AsyncCategoryAutocomplete from "./AsyncCategoryAutocomplete";

const SubcategoryDialog = ({ open, onClose, onSubmit, formData, setFormData }) => {
  const [categories, setCategories] = useState([]);
  const [options, setOptions] = useState([]);
  const [snackbar, setSnackbar] = useState({ open: false, message: "", severity: "success" });

    const loadCategories = async () => {
    try {
        console.log('its load cat')
        const res = await axios.get(`${BASE_URL}/api/categories`);
        setCategories(res.data.data);
      
      
     
    }  catch (err) {
        showSnackbar("Failed to load categories", "error");
        console.error("Axios error:", err);
        }
  };

    const showSnackbar = (message, severity = "success") => {
    setSnackbar({ open: true, message, severity });
  };
  
  // Fetch categories when dialog opens
  useEffect(() => {
    if (open) {
        console.log('it is fine')
        loadCategories();
    }
    }, [open]);
  

  
  return (
    <Dialog open={open} onClose={onClose}>
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

       <AsyncCategoryAutocomplete
             
            value={formData.category || null}
            onChange={(val) =>
                setFormData({
                ...formData,
                category: val,
                category_id: val?.ID || null,
                })
            }
            />



       

        <TextField
          fullWidth
          label="Subcategory Name"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          margin="normal"
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button onClick={onSubmit} variant="contained">Save</Button>
      </DialogActions>
    </Dialog>
  );
};

export default SubcategoryDialog;
