import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  Button, TextField
} from "@mui/material";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import axios from "axios";
import { BASE_URL }  from "../../../Config";

export default function TagDialog({ open, onClose, tag, onSuccess }) {
  const { register, handleSubmit, reset } = useForm();

  useEffect(() => {
    if (tag) reset({"name": tag.Name});
    else reset({ name: "" });
  }, [tag]);

  const onSubmit = async (data) => {
    try {
      if (tag?.ID) {
        await axios.put(`${BASE_URL}/api/tags/${tag.ID}`, data);
      } else {
        await axios.post(`${BASE_URL}/api/tags`, data);
      }
      onSuccess();
    } catch {
      alert("Error saving Tag.");
    }
  };

  return (
    <Dialog open={open} onClose={onClose}>
      <DialogTitle>{tag ? "Edit Tag" : "Add Tag"}</DialogTitle>
      <form onSubmit={handleSubmit(onSubmit)}>
        <DialogContent>
          <TextField
            autoFocus
            label="Tag Name"
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
