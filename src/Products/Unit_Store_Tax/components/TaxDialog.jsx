import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  Button, TextField
} from "@mui/material";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import axios from "axios";
import { BASE_URL } from "../../../Config";

export default function TaxDialog({ open, onClose, tax, onSuccess }) {
  const { register, handleSubmit, reset } = useForm();

  useEffect(() => {
    if (tax) reset({ name: tax.Name, percentage: parseFloat(tax.Percentage)});
    else reset({ name: "", percentage: "" });
  }, [tax]);

  const onSubmit = async (data) => {
    try {
      if (tax?.ID) {
        await axios.put(`${BASE_URL}/api/taxes/${tax.ID}`, data);
      } else {
        await axios.post(`${BASE_URL}/api/taxes`, data);
      }
      onSuccess();
    } catch (err) {
      alert("Error saving Tax.");
    }
  };

  return (
    <Dialog open={open} onClose={onClose}>
      <DialogTitle>{tax ? "Edit Tax" : "Add Tax"}</DialogTitle>
      <form onSubmit={handleSubmit(onSubmit)}>
        <DialogContent>
          <TextField
            autoFocus
            label="Tax Name"
            fullWidth
            margin="dense"
            size="small"
            {...register("name", { required: true })}
          />
          <TextField
            label="Percentage (%)"
            type="number"
            fullWidth
            margin="dense"
            size="small"
           
            {...register("percentage", { required: true,valueAsNumber: true,  })}
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
