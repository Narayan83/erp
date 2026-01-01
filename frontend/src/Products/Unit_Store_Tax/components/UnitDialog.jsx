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
import { BASE_URL }  from "../../../config/Config";

export default function UnitDialog({ open, onClose, unit, onSuccess }) {
  const { control, handleSubmit, setValue } = useForm({
    defaultValues: { name: "", description: "" }
  });
  const [units, setUnits] = useState([]);
  const [loading, setLoading] = useState(false);
  const [autocompleteOpen, setAutocompleteOpen] = useState(false);

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
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="xs">
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
                      label="Unit"
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
                                <IconButton
                                  size="small"
                                  onClick={(e) => { e.stopPropagation(); setAutocompleteOpen(o => !o); }}
                                  sx={{ color: 'primary.main' }}
                                >
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
