import React, { useEffect, useState } from "react";
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, TextField, Autocomplete, IconButton, InputAdornment } from "@mui/material";
import ClearIcon from '@mui/icons-material/Clear';
import CloseRoundedIcon from '@mui/icons-material/CloseRounded';
import ArrowDropDownIcon from '@mui/icons-material/ArrowDropDown';
import ArrowDropUpIcon from '@mui/icons-material/ArrowDropUp';
import Tooltip from '@mui/material/Tooltip';
import { useForm, Controller } from "react-hook-form";
import axios from "axios";
import { BASE_URL } from "../../../Config";

export default function SizeDialog({ open, onClose, size, onSuccess, onError }) {
  const { control, handleSubmit, setValue } = useForm();
  const [sizes, setSizes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [autocompleteOpen, setAutocompleteOpen] = useState(false);

  // Fetch sizes when dialog opens
  useEffect(() => {
    const fetchSizes = async () => {
      setLoading(true);
      try {
        const response = await axios.get(`${BASE_URL}/api/sizes`);
        
        // Process the API response
        let sizesData = [];
        if (Array.isArray(response.data)) {
          sizesData = response.data;
        } else if (response.data && typeof response.data === 'object') {
          if (Array.isArray(response.data.data)) {
            sizesData = response.data.data;
          } else {
            // Try to extract array data from any property
            Object.values(response.data).forEach(value => {
              if (Array.isArray(value)) {
                sizesData = value;
              }
            });
          }
        }
        
        setSizes(sizesData);
      } catch (error) {
        console.error("Error fetching sizes:", error);
        setSizes([]);
      } finally {
        setLoading(false);
      }
    };

    if (open) fetchSizes();
  }, [open]);

  useEffect(() => {
    if (size) {
      setValue("code", size.code || "");
      setValue("description", size.description || "");
    } else {
      setValue("code", "");
      setValue("description", "");
    }
  }, [size, setValue, open]);

  const onSubmit = async (data) => {
    try {
      if (size?.id) {
        await axios.put(`${BASE_URL}/api/sizes/${size.id}`, data);
      } else {
        await axios.post(`${BASE_URL}/api/sizes`, data);
      }
      onSuccess();
    } catch (error) {
      console.error("Error saving size:", error);
      onError("Error saving size.");
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle>{size ? "Edit Size" : "Add Size"}</DialogTitle>
      <form onSubmit={handleSubmit(onSubmit)}>
        <DialogContent>
          <Controller
            name="code"
            control={control}
            rules={{ required: true }}
            render={({ field: { onChange, value, ref } }) => {
              // Extract size codes from the sizes array
              const sizeOptions = Array.isArray(sizes) ? 
                sizes.map(size => {
                  return size?.code || "";
                }).filter(code => code !== "") : [];
              
              return (
                <Autocomplete
                  options={sizeOptions}
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
                      label="Size Code"
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
                              {/* Toggle dropdown icon (chevron) */}
                              <Tooltip title={autocompleteOpen ? 'Close suggestions' : 'Open suggestions'}>
                                <IconButton
                                  size="small"
                                  aria-label={autocompleteOpen ? 'close suggestions' : 'open suggestions'}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setAutocompleteOpen((o) => !o);
                                  }}
                                  sx={{ color: 'primary.main' }}
                                >
                                  {autocompleteOpen ? (
                                    <ArrowDropUpIcon fontSize="small" />
                                  ) : (
                                    <ArrowDropDownIcon fontSize="small" />
                                  )}
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
