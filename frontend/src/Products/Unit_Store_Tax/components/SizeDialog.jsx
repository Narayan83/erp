import React, { useEffect } from "react";
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, TextField } from "@mui/material";
import { useForm } from "react-hook-form";
import axios from "axios";
import { BASE_URL } from "../../../Config";

export default function SizeDialog({ open, onClose, size, onSuccess, onError }) {
  const { register, handleSubmit, reset } = useForm();

  useEffect(() => {
    if (size) reset({ name: size.name || "", code: size.code || "", description: size.description || "" });
    else reset({ name: "", code: "", description: "" });
  }, [size, open]);

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
          <TextField
            label="Size Code"
            fullWidth
            margin="dense"
            size="small"
            {...register("code", { required: true })}
          />
          <TextField
            label="Description"
            fullWidth
            margin="dense"
            size="small"
            {...register("description")}
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
