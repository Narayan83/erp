import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  Button, TextField, Autocomplete, IconButton, InputAdornment
} from "@mui/material";
import Tooltip from '@mui/material/Tooltip';
import CloseRoundedIcon from '@mui/icons-material/CloseRounded';
import ArrowDropDownIcon from '@mui/icons-material/ArrowDropDown';
import ArrowDropUpIcon from '@mui/icons-material/ArrowDropUp';
import { useEffect, useState } from "react";
import { useForm, Controller } from "react-hook-form";
import axios from "axios";
import { BASE_URL } from "../../../Config";

export default function StoreDialog({ open, onClose, store, onSuccess }) {
  const { control, handleSubmit, setValue } = useForm();
  const [stores, setStores] = useState([]);
  const [loading, setLoading] = useState(false);
  const [autocompleteOpen, setAutocompleteOpen] = useState(false);

  // Fetch stores when dialog opens
  useEffect(() => {
    const fetchStores = async () => {
      setLoading(true);
      try {
        const response = await axios.get(`${BASE_URL}/api/stores`);
        
        // Process the API response
        let storesData = [];
        if (Array.isArray(response.data)) {
          storesData = response.data;
        } else if (response.data && typeof response.data === 'object') {
          if (Array.isArray(response.data.data)) {
            storesData = response.data.data;
          } else {
            // Try to extract array data from any property
            Object.values(response.data).forEach(value => {
              if (Array.isArray(value)) {
                storesData = value;
              }
            });
          }
        }
        
        setStores(storesData);
      } catch (error) {
        console.error("Error fetching stores:", error);
        setStores([]);
      } finally {
        setLoading(false);
      }
    };

    if (open) fetchStores();
  }, [open]);

  useEffect(() => {
    if (store) {
      setValue("name", store.Name || "");
    } else {
      setValue("name", "");
    }
  }, [store, setValue]);

  const onSubmit = async (data) => {
    try {
      if (store?.ID) {
        await axios.put(`${BASE_URL}/api/stores/${store.ID}`, data);
      } else {
        await axios.post(`${BASE_URL}/api/stores`, data);
      }
      onSuccess();
    } catch (error) {
      alert(error.response?.data?.error || "Error saving store.");
    }
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="xs">
      <DialogTitle>{store ? "Edit Store" : "Add Store"}</DialogTitle>
      <form onSubmit={handleSubmit(onSubmit)}>
        <DialogContent>
          <Controller
            name="name"
            control={control}
            rules={{ required: true }}
            render={({ field: { onChange, value, ref } }) => {
              // Extract store names from the stores array
              const storeOptions = Array.isArray(stores) ? 
                stores.map(store => {
                  return store?.Name || store?.name || "";
                }).filter(name => name !== "") : [];
              
              return (
                <Autocomplete
                  options={storeOptions}
                  freeSolo
                  loading={loading}
                  open={autocompleteOpen}
                  onOpen={() => setAutocompleteOpen(true)}
                  onClose={() => setAutocompleteOpen(false)}
                  autoSelect
                  value={value ?? ""}
                  onChange={(_, newValue) => onChange(newValue)}
                  onInputChange={(_, newInputValue) => {
                    // keep RHF in sync and open the dropdown so filtering is visible
                    onChange(newInputValue);
                    setAutocompleteOpen(true);
                  }}
                  filterOptions={(options, { inputValue }) => {
                    if (!inputValue) return options;
                    const lower = inputValue.toLowerCase();
                    return options.filter(opt => (opt || "").toLowerCase().includes(lower));
                  }}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      autoFocus
                      inputRef={ref}
                      label="Store Name"
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
        <DialogActions>
          <Button onClick={onClose}>Cancel</Button>
          <Button type="submit" variant="contained">Save</Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}
