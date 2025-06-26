// SuccessDialog.jsx
import React from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Typography,
  Button,
  Alert,
  Snackbar,
  IconButton
} from "@mui/material";
import CloseIcon from '@mui/icons-material/Close';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorIcon from '@mui/icons-material/Error';
import InfoIcon from '@mui/icons-material/Info';
import WarningIcon from '@mui/icons-material/Warning';

const iconMap = {
  success: <CheckCircleIcon fontSize="large" color="success" />,
  error: <ErrorIcon fontSize="large" color="error" />,
  info: <InfoIcon fontSize="large" color="info" />,
  warning: <WarningIcon fontSize="large" color="warning" />,
};

export function DynamicDialog({
  open,
  onClose,
  type = "success", // success | error | info | warning
  title = "",
  message = "",
  actions = [] // array of { label, onClick, variant }
}) {
  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        {iconMap[type]} {title}
        <IconButton
          aria-label="close"
          onClick={onClose}
          sx={{ marginLeft: "auto" }}
        >
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      <DialogContent>
        <Typography variant="body1">🎯 {message}</Typography>
      </DialogContent>
      <DialogActions>
        {actions.map((action, idx) => (
          <Button
            key={idx}
            onClick={action.onClick}
            variant={action.variant || "text"}
            color={action.color || (type === "error" ? "error" : "primary")}
          >
            {action.label}
          </Button>
        ))}
      </DialogActions>
    </Dialog>
  );
}

// Common snackbar/alert handler
export function AlertSnackbar({ open, onClose, severity = "success", message }) {
  return (
    <Snackbar open={open} autoHideDuration={4000} onClose={onClose}>
      <Alert severity={severity} onClose={onClose} sx={{ width: "100%" }}>
        {message}
      </Alert>
    </Snackbar>
  );
}
