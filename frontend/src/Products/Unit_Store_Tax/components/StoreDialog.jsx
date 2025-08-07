import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  Button, TextField
} from "@mui/material";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import axios from "axios";
import { BASE_URL } from "../../../Config";

export default function StoreDialog({ open, onClose, store, onSuccess }) {
  const { register, handleSubmit, reset } = useForm();

  useEffect(() => {
    if (store) reset({ name: store.Name });
    else reset({ name: "" });
  }, [store]);

  const onSubmit = async (data) => {
    try {
      if (store?.ID) {
        await axios.put(`${BASE_URL}/api/stores/${store.ID}`, data);
      } else {
        await axios.post(`${BASE_URL}/api/stores`, data);
      }
      onSuccess();
    } catch (error) {
      alert(error.response?.data?.error || "Error saving store.");
    }
  };

  return (
    <Dialog open={open} onClose={onClose}>
      <DialogTitle>{store ? "Edit Store" : "Add Store"}</DialogTitle>
      <form onSubmit={handleSubmit(onSubmit)}>
        <DialogContent>
          <TextField
            autoFocus
            label="Store Name"
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
