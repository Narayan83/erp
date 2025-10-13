import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  Button, TextField, Autocomplete
} from "@mui/material";
import { useEffect, useState } from "react";
import { useForm, Controller } from "react-hook-form";
import axios from "axios";
import { BASE_URL } from "../../../Config";

export default function TaxDialog({ open, onClose, tax, onSuccess }) {
  const { control, handleSubmit, setValue } = useForm();
  const [taxes, setTaxes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [autocompleteOpen, setAutocompleteOpen] = useState(false);

  // Fetch taxes when dialog opens
  useEffect(() => {
    const fetchTaxes = async () => {
      setLoading(true);
      try {
        const response = await axios.get(`${BASE_URL}/api/taxes`);
        
        // Process the API response
        let taxesData = [];
        if (Array.isArray(response.data)) {
          taxesData = response.data;
        } else if (response.data && typeof response.data === 'object') {
          if (Array.isArray(response.data.data)) {
            taxesData = response.data.data;
          } else {
            // Try to extract array data from any property
            Object.values(response.data).forEach(value => {
              if (Array.isArray(value)) {
                taxesData = value;
              }
            });
          }
        }
        
        setTaxes(taxesData);
      } catch (error) {
        console.error("Error fetching taxes:", error);
        setTaxes([]);
      } finally {
        setLoading(false);
      }
    };

    if (open) fetchTaxes();
  }, [open]);

  useEffect(() => {
    if (tax) {
      setValue("name", tax.Name || "");
      setValue("percentage", parseFloat(tax.Percentage) || "");
    } else {
      setValue("name", "");
      setValue("percentage", "");
    }
  }, [tax, setValue]);

  const onSubmit = async (data) => {
    try {
      // Ensure payload keys match backend model and types
      const payload = {
        name: data.name,
        percentage: Number(data.percentage),
      };

      if (tax?.ID) {
        await axios.put(`${BASE_URL}/api/taxes/${tax.ID}`, payload);
      } else {
        await axios.post(`${BASE_URL}/api/taxes`, payload);
      }
      onSuccess();
    } catch (err) {
      // Try to surface server error message
      console.error("Error saving Tax:", err);
      const msg = err?.response?.data?.error || err?.response?.data || err.message;
      alert("Error saving Tax: " + JSON.stringify(msg));
    }
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="xs">
      <DialogTitle>{tax ? "Edit Tax" : "Add Tax"}</DialogTitle>
      <form onSubmit={handleSubmit(onSubmit)}>
        <DialogContent>
          <Controller
            name="name"
            control={control}
            rules={{ required: true }}
            render={({ field: { onChange, value, ref } }) => {
              // Extract tax names from the taxes array
              const taxOptions = Array.isArray(taxes) ? 
                taxes.map(tax => {
                  return tax?.Name || tax?.name || "";
                }).filter(name => name !== "") : [];
              
              return (
                <Autocomplete
                  options={taxOptions}
                  freeSolo
                  loading={loading}
                  open={autocompleteOpen}
                  onOpen={() => setAutocompleteOpen(true)}
                  onClose={() => setAutocompleteOpen(false)}
                  autoSelect
                  value={value || ""}
                  onChange={(_, newValue) => onChange(newValue)}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      autoFocus
                      inputRef={ref}
                      label="Tax Name"
                      fullWidth
                      margin="dense"
                      size="small"
                      required
                      onClick={() => setAutocompleteOpen(true)}
                    />
                  )}
                />
              );
            }}
          />
          <Controller
            name="percentage"
            control={control}
            rules={{ required: true, valueAsNumber: true }}
            render={({ field }) => (
              <TextField
                {...field}
                label="Percentage (%)"
                type="number"
                fullWidth
                margin="dense"
                size="small"
                required
              />
            )}
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
