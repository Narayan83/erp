import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  Button, TextField, Autocomplete
} from "@mui/material";
import { useEffect, useState } from "react";
import { useForm, Controller } from "react-hook-form";
import axios from "axios";
import { BASE_URL } from "../../../Config";

export default function StoreDialog({ open, onClose, store, onSuccess }) {
  const { control, handleSubmit, setValue } = useForm();
  const [stores, setStores] = useState([]);
  const [loading, setLoading] = useState(false);

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
    <Dialog open={open} onClose={onClose}>
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
                  openOnFocus
                  autoSelect
                  value={value || ""}
                  onChange={(_, newValue) => onChange(newValue)}
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
