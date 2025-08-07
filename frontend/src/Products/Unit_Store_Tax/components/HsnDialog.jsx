import React, { useEffect, useState } from "react";
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, TextField, MenuItem, Select, InputLabel, FormControl } from "@mui/material";
import { useForm, Controller } from "react-hook-form";
import axios from "axios";
import { BASE_URL } from "../../../Config";

export default function HsnDialog({ open, onClose, hsn, onSuccess, onError }) {
  const { register, handleSubmit, reset, control } = useForm();
  const [taxes, setTaxes] = useState([]);

  useEffect(() => {
    // Fetch taxes when dialog opens
    if (open) {
      axios.get(`${BASE_URL}/api/taxes`, { params: { page: 1, limit: 100 } })
        .then(res => setTaxes(res.data.data || []))
        .catch(() => setTaxes([]));
    }
  }, [open]);

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
    <Dialog open={open} onClose={onClose}>
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
          <TextField
            autoFocus
            label="HSN Code"
            fullWidth
            margin="dense"
            size="small"
            {...register("code", { required: true })}
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
