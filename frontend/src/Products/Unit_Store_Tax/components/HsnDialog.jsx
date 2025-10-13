import React, { useEffect, useState } from "react";
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, TextField, MenuItem, Select, InputLabel, FormControl, Autocomplete } from "@mui/material";
import { useForm, Controller } from "react-hook-form";
import axios from "axios";
import { BASE_URL } from "../../../Config";

export default function HsnDialog({ open, onClose, hsn, onSuccess, onError }) {
  const { register, handleSubmit, reset, control } = useForm();
  const [taxes, setTaxes] = useState([]);
  const [hsnOptions, setHsnOptions] = useState([]);
  const [inputValue, setInputValue] = useState("");
  const [autocompleteOpen, setAutocompleteOpen] = useState(false);

  useEffect(() => {
    // Fetch taxes when dialog opens
    if (open) {
      axios.get(`${BASE_URL}/api/taxes`, { params: { page: 1, limit: 100 } })
        .then(res => setTaxes(res.data.data || []))
        .catch(() => setTaxes([]));
    }
  }, [open]);
  
  // For HSN code autocomplete
  useEffect(() => {
    if (inputValue.length > 0) {
      const getData = setTimeout(() => {
        fetchHsnCodes(inputValue)
          .then(options => {
            console.log("Setting HSN options:", options);
            setHsnOptions(options);
          });
      }, 300);
      
      return () => clearTimeout(getData);
    } else {
      // Load some initial HSN codes when dialog opens and input is empty
      if (open) {
        fetchHsnCodes("")
          .then(options => {
            console.log("Setting initial HSN options:", options);
            setHsnOptions(options);
          });
      }
    }
  }, [inputValue, open]);
  
  const fetchHsnCodes = async (inputValue) => {
    try {
      console.log("Fetching HSN codes for:", inputValue);
      const response = await axios.get(`${BASE_URL}/api/hsncode`, {
        params: { search: inputValue, limit: 20 }
      });
      console.log("HSN API response:", response);
      
      let hsnData = [];
      if (Array.isArray(response.data)) {
        hsnData = response.data;
      } else if (response.data && typeof response.data === 'object') {
        if (Array.isArray(response.data.data)) {
          hsnData = response.data.data;
        } else {
          // Try to extract array data from any property
          Object.values(response.data).forEach(value => {
            if (Array.isArray(value)) {
              hsnData = value;
            }
          });
        }
      }
      
      const options = Array.isArray(hsnData) ? 
        hsnData.map(hsn => hsn.code || "").filter(Boolean) : [];
      
      console.log("Processed HSN options:", options);
      return options;
    } catch (error) {
      console.error("Error fetching HSN codes:", error);
      return [];
    }
  };

  useEffect(() => {
    if (hsn) reset({ code: hsn.code || "", tax_id: hsn.tax_id || "" });
    else reset({ code: "", tax_id: "" });
  }, [hsn, open]);

  const onSubmit = async (data) => {
    console.log("Saving HSN:", data);
    try {
      if (hsn?.id) {
        await axios.put(`${BASE_URL}/api/hsncode/${hsn.id}`, data);
      } else {
        await axios.post(`${BASE_URL}/api/hsncode`, data);
      }
      onSuccess();
    } catch (error) {
      console.error("Error saving HSN:", error);
      onError("Error saving HSN.");
    }
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="xs">
      <DialogTitle>{hsn ? "Edit HSN" : "Add HSN"}</DialogTitle>
      <form onSubmit={handleSubmit(onSubmit)}>
        <DialogContent>
          <FormControl fullWidth margin="dense" size="small">
            <InputLabel id="tax-select-label">Tax (%)</InputLabel>
            <Controller
              name="tax_id"
              control={control}
              rules={{ required: true }}
              render={({ field }) => (
                <Select
                  labelId="tax-select-label"
                  label="Tax (%)"
                  value={field.value || ""}
                  onChange={e => field.onChange(Number(e.target.value))}
                >
                  {taxes.map((tax) => (
                    <MenuItem key={tax.ID} value={tax.ID}>
                      {tax.Name} ({tax.Percentage}%)
                    </MenuItem>
                  ))}
                </Select>
              )}
            />
          </FormControl>
          <Controller
            name="code"
            control={control}
            rules={{ required: true }}
            render={({ field: { onChange, value, ref } }) => (
              <Autocomplete
                freeSolo
                autoSelect
                options={hsnOptions}
                loading={inputValue.length > 0}
                loadingText="Loading HSN codes..."
                noOptionsText="No HSN codes found"
                open={autocompleteOpen}
                onOpen={() => setAutocompleteOpen(true)}
                onClose={() => setAutocompleteOpen(false)}
                value={value || ""}
                onInputChange={(_, newValue) => {
                  console.log("Input changed to:", newValue);
                  setInputValue(newValue);
                }}
                onChange={(_, newValue) => {
                  console.log("Selection changed to:", newValue);
                  onChange(newValue);
                }}
                filterOptions={(options, params) => {
                  // Don't filter the options, as they're already filtered by the API
                  return options;
                }}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    autoFocus
                    inputRef={ref}
                    label="HSN Code"
                    fullWidth
                    margin="dense"
                    size="small"
                    required
                    onClick={() => setAutocompleteOpen(true)}
                  />
                )}
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
