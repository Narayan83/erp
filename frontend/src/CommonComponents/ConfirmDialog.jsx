import {
  Dialog, DialogTitle, DialogContent, DialogActions, Typography
} from "@mui/material";

export default function ConfirmDialog({ open, title, message, onCancel, onConfirm }) {
  return (
    <Dialog open={open} onClose={onCancel}>
      <DialogTitle>{title}</DialogTitle>
      <DialogContent>
        <Typography>{message}</Typography>
      </DialogContent>
      <DialogActions style={{ justifyContent: 'space-between', padding: '16px' }}>
        <div>
          <button
            type="button"
            onClick={onCancel}
            aria-label="Cancel"
            className="btn"
            style={{ background: 'transparent', color: '#1976d2', border: 'none', padding: 0, textTransform: 'none' }}
          >
            Cancel
          </button>
        </div>
        <div>
          <button
            type="button"
            className="btn btn-delete"
            onClick={onConfirm}
            aria-label="Delete"
            style={{ textTransform: 'uppercase' }}
          >
            Delete
          </button>
        </div>
      </DialogActions>
    </Dialog>
  );
}
