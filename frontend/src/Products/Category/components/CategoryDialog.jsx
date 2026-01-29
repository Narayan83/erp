import {
  Dialog, DialogTitle, DialogContent,
  TextField, Autocomplete, IconButton, InputAdornment
} from "@mui/material";
import Tooltip from '@mui/material/Tooltip';
import CloseRoundedIcon from '@mui/icons-material/CloseRounded';
import ArrowDropDownIcon from '@mui/icons-material/ArrowDropDown';
import ArrowDropUpIcon from '@mui/icons-material/ArrowDropUp';
import { useEffect, useState } from "react";
import { useForm, Controller } from "react-hook-form";
import axios from "axios";
import { BASE_URL }  from "../../../config/Config";

export default function CategoryDialog({ open, onClose, category, onSuccess }) {
  const { control, handleSubmit, reset, setValue } = useForm();
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [autocompleteOpen, setAutocompleteOpen] = useState(false);

  // Fetch categories when dialog opens
  useEffect(() => {
    const fetchCategories = async () => {
      setLoading(true);
      try {
        const response = await axios.get(`${BASE_URL}/api/categories`);
        // Log the raw response to understand its structure
        console.log('API Raw Response:', response);
        
        // Process the API response
        let categoriesData = [];
        if (Array.isArray(response.data)) {
          categoriesData = response.data;
        } else if (response.data && typeof response.data === 'object') {
          if (Array.isArray(response.data.data)) {
            categoriesData = response.data.data;
          } else if (Array.isArray(response.data.categories)) {
            categoriesData = response.data.categories;
          } else {
            // Last resort: try to extract categories from response.data itself
            // by collecting all array-like properties
            Object.values(response.data).forEach(value => {
              if (Array.isArray(value)) {
                categoriesData = value;
              }
            });
          }
        }
        
        console.log('Processed categories:', categoriesData);
        setCategories(categoriesData);
      } catch (error) {
        console.error("Error fetching categories:", error);
        setCategories([]);
      } finally {
        setLoading(false);
      }
    };

    if (open) fetchCategories();
  }, [open]);

  useEffect(() => {
    if (category) {
      setValue("name", category.Name);
    } else {
      setValue("name", "");
    }
  }, [category, setValue]);

  const onSubmit = async (data) => {
    try {
      if (category?.ID) {
        await axios.put(`${BASE_URL}/api/categories/${category.ID}`, data);
      } else {
        await axios.post(`${BASE_URL}/api/categories`, data);
      }
      onSuccess();
    } catch {
      alert("Error saving category.");
    }
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="xs">
      <DialogTitle>{category ? "Edit Category" : "Add Category"}</DialogTitle>
      <form onSubmit={handleSubmit(onSubmit)}>
        <DialogContent>
          <Controller
            name="name"
            control={control}
            rules={{ required: true }}
            render={({ field: { onChange, value, ref } }) => {
              // Extract category names from the categories array
              // Handle different possible field names (Name, name, title, etc.)
              const categoryOptions = Array.isArray(categories) ? 
                categories.map(cat => {
                  // Try different possible property names for category name
                  return cat?.Name || cat?.name || cat?.Title || cat?.title || "";
                }).filter(name => name !== "") : [];
              
              console.log('Category options for dropdown:', categoryOptions);
              
              return (
                <Autocomplete
                  options={categoryOptions}
                  freeSolo
                  loading={loading}
                  open={autocompleteOpen}
                  onOpen={() => setAutocompleteOpen(true)}
                  onClose={() => setAutocompleteOpen(false)}
                  autoSelect
                  value={value || ""}
                  onChange={(_, newValue) => onChange(newValue)}
                  filterOptions={(options, params) => {
                    const filtered = options.filter(option => 
                      option.toLowerCase().includes(params.inputValue.toLowerCase())
                    );
                    if (params.inputValue !== '') {
                      if (!filtered.some(option => option.toLowerCase() === params.inputValue.toLowerCase())) {
                        filtered.push(params.inputValue);
                      }
                    }
                    return filtered;
                  }}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      autoFocus
                      inputRef={ref}
                      label="Category Name"
                      fullWidth
                      margin="dense"
                      size="small"
                      required
                      onClick={() => setAutocompleteOpen(true)}
                      InputProps={{
                        ...params.InputProps,
                        endAdornment: (
                          <>
                            {params.InputProps.endAdornment}
                            <InputAdornment position="end">
                              <Tooltip title={autocompleteOpen ? 'Close suggestions' : 'Open suggestions'}>
                                <IconButton size="small" onClick={(e) => { e.stopPropagation(); setAutocompleteOpen(o => !o); }} sx={{ color: 'primary.main' }}>
                                  {autocompleteOpen ? <ArrowDropUpIcon fontSize="small" /> : <ArrowDropDownIcon fontSize="small" />}
                                </IconButton>
                              </Tooltip>
                            </InputAdornment>
                          </>
                        ),
                      }}
                    />
                  )}
                />
              );
            }}
          />
        </DialogContent>
        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 24px', alignItems: 'center' }}>
          <button
            type="button"
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              color: '#1976d2',
              padding: '6px 16px',
              fontSize: '0.875rem',
              cursor: 'pointer',
            }}
          >
            Cancel
          </button>
          <button
            type="submit"
            style={{
              background: '#1976d2',
              color: '#fff',
              border: 'none',
              padding: '6px 16px',
              borderRadius: 4,
              fontSize: '0.875rem',
              cursor: 'pointer',
            }}
          >
            Save
          </button>
        </div>
      </form>
    </Dialog>
  );
}
