import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  Button, TextField
} from "@mui/material";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import axios from "axios";
import { BASE_URL }  from "../../../Config";

export default function CategoryDialog({ open, onClose, category, onSuccess }) {
  const { register, handleSubmit, reset } = useForm();

  useEffect(() => {
    if (category) reset({"name": category.Name});
    else reset({ name: "" });
  }, [category]);

  const onSubmit = async (data) => {
    try {
      if (category?.ID) {
        await axios.put(`${BASE_URL}/api/categories/${category.ID}`, data);
      } else {
        await axios.post(`${BASE_URL}/api/categories`, data);
      }
      onSuccess();
    } catch {
      alert("Error saving category.");
    }
  };

  return (
    <Dialog open={open} onClose={onClose}>
      <DialogTitle>{category ? "Edit Category" : "Add Category"}</DialogTitle>
      <form onSubmit={handleSubmit(onSubmit)}>
        <DialogContent>
          <TextField
            autoFocus
            label="Category Name"
            fullWidth
            margin="dense"
            size="small"
            {...register("name", { required: true })}
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
