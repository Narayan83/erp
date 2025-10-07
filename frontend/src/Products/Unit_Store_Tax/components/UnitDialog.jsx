import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  Button, TextField 
} from "@mui/material";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import axios from "axios";
import { BASE_URL }  from "../../../Config";

export default function UnitDialog({ open, onClose, unit, onSuccess }) {
  const { register, handleSubmit, reset } = useForm({
    defaultValues: { name: "", description: "" }
  });

  useEffect(() => {
    if (open) {
      if (unit) {
        reset({
          name: unit.name ?? unit.Name ?? "",
          description: unit.description ?? unit.Description ?? ""
        });
      } else {
        reset({ name: "", description: "" });
      }
    }
  }, [unit, open, reset]);

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
          <TextField
            autoFocus
            label="Unit"
            fullWidth
            margin="dense"
            size="small"
            {...register("name", { required: true })}
          />
          <TextField
            label="Description"
            fullWidth
            margin="dense"
            size="small"
            multiline
            minRows={2}
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
