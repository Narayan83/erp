import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  Button, TextField, Autocomplete
} from "@mui/material";
import { useEffect, useState } from "react";
import { useForm, Controller } from "react-hook-form";
import axios from "axios";
import { BASE_URL }  from "../../../Config";

export default function UnitDialog({ open, onClose, unit, onSuccess }) {
  const { control, handleSubmit, setValue } = useForm({
    defaultValues: { name: "", description: "" }
  });
  const [units, setUnits] = useState([]);
  const [loading, setLoading] = useState(false);

  // Fetch units when dialog opens
  useEffect(() => {
    const fetchUnits = async () => {
      setLoading(true);
      try {
        const response = await axios.get(`${BASE_URL}/api/units`);
        console.log('API Units Response:', response);
        
        // Process the API response
        let unitsData = [];
        if (Array.isArray(response.data)) {
          unitsData = response.data;
        } else if (response.data && typeof response.data === 'object') {
          if (Array.isArray(response.data.data)) {
            unitsData = response.data.data;
          } else {
            // Try to extract array data from any property
            Object.values(response.data).forEach(value => {
              if (Array.isArray(value)) {
                unitsData = value;
              }
            });
          }
        }
        
        console.log('Processed units:', unitsData);
        setUnits(unitsData);
      } catch (error) {
        console.error("Error fetching units:", error);
        setUnits([]);
      } finally {
        setLoading(false);
      }
    };

    if (open) fetchUnits();
  }, [open]);

  useEffect(() => {
    if (open) {
      if (unit) {
        setValue("name", unit.name ?? unit.Name ?? "");
        setValue("description", unit.description ?? unit.Description ?? "");
      } else {
        setValue("name", "");
        setValue("description", "");
      }
    }
  }, [unit, open, setValue]);

  const onSubmit = async (data) => {
    try {
      const id = unit?.ID ?? unit?.id;
      if (id) {
        await axios.put(`${BASE_URL}/api/units/${id}`, data);
      } else {
        await axios.post(`${BASE_URL}/api/units`, data);
      }
      onSuccess();
    } catch {
      alert("Error saving unit.");
    }
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>{unit ? "Edit Unit" : "Add Unit"}</DialogTitle>
      <form onSubmit={handleSubmit(onSubmit)}>
        <DialogContent>
          <Controller
            name="name"
            control={control}
            rules={{ required: true }}
            render={({ field: { onChange, value, ref } }) => {
              // Extract unit names from the units array
              const unitOptions = Array.isArray(units) ? 
                units.map(unit => {
                  return unit?.name || unit?.Name || "";
                }).filter(name => name !== "") : [];
              
              return (
                <Autocomplete
                  options={unitOptions}
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
                      label="Unit"
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
          <Controller
            name="description"
            control={control}
            render={({ field }) => (
              <TextField
                {...field}
                label="Description"
                fullWidth
                margin="dense"
                size="small"
                multiline
                minRows={2}
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
