import {
  Dialog, DialogTitle, DialogContent, DialogActions, Button, Typography
} from "@mui/material";

export default function ConfirmDialog({ open, title, message, onCancel, onConfirm }) {
  return (
    <Dialog open={open} onClose={onCancel}>
      <DialogTitle>{title}</DialogTitle>
      <DialogContent>
        <Typography>{message}</Typography>
      </DialogContent>
      <DialogActions>
        <Button onClick={onCancel}>Cancel</Button>
        <Button onClick={onConfirm} variant="contained" color="error">Delete</Button>
      </DialogActions>
    </Dialog>
  );
}
