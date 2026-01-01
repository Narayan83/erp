import React, { useEffect, useState } from "react";
import { Dialog, DialogTitle, DialogContent, DialogActions, Button } from "@mui/material";
import "./SizeDialog.scss";
import { useForm, Controller } from "react-hook-form";
import axios from "axios";
import { BASE_URL } from "../../../config/Config";

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
                <div className="size-dialog__field">
                  <input
                    list="sizeCodes"
                    className="size-dialog__input"
                    placeholder="Size Code"
                    autoFocus
                    ref={ref}
                    value={value || ""}
                    onChange={(e) => onChange(e.target.value)}
                    required
                  />
                  <datalist id="sizeCodes">
                    {sizeOptions.map((c, i) => (
                      <option key={i} value={c} />
                    ))}
                  </datalist>
                </div>
              );
            }}
          />
          <Controller
            name="description"
            control={control}
            render={({ field }) => (
              <input
                {...field}
                className="size-dialog__input"
                placeholder="Description"
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
