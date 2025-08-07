import { useEffect, useState } from "react";
import {
  Box, Button, Typography, Snackbar, Alert, TablePagination, TextField
} from "@mui/material";
import StoreTable from "../components/StoreTable";
import StoreDialog from "../components/StoreDialog";
import ConfirmDialog from "../../../CommonComponents/ConfirmDialog";
import axios from "axios";
import { BASE_URL } from "../../../Config";

export default function StoreSection() {
  const [stores, setStores] = useState([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingStore, setEditingStore] = useState(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [storeToDelete, setStoreToDelete] = useState(null);
  const [snackbar, setSnackbar] = useState({ open: false, message: "", severity: "success" });

  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(5);
  const [filter, setFilter] = useState("");

  const loadStores = async () => {
    try {
      const res = await axios.get(`${BASE_URL}/api/stores`, {
        params: { page: page + 1, limit: rowsPerPage, filter }
      });
      setStores(res.data.data);
      setTotal(res.data.total);
    } catch {
      showSnackbar("Failed to load stores", "error");
    }
  };

  useEffect(() => {
    loadStores();
  }, [page, rowsPerPage, filter]);

  const showSnackbar = (message, severity = "success") => {
    setSnackbar({ open: true, message, severity });
  };

  const handleDelete = async () => {
    try {
      await axios.delete(`${BASE_URL}/api/stores/${storeToDelete.ID}`);
      showSnackbar("Store deleted");
      loadStores();
    } catch (error) {
      showSnackbar(error.response?.data?.error || "Delete failed", "error");
    } finally {
      setConfirmOpen(false);
      setStoreToDelete(null);
    }
  };

  return (
    <section className="right-content">
      <Box p={4}>
        <Box display="flex" justifyContent="space-between" mb={2}>
          <Typography variant="h6">Store Management</Typography>
          <Button variant="contained" onClick={() => setDialogOpen(true)}>Add Store</Button>
        </Box>

        <TextField
          label="Filter by Name"
          variant="outlined"
          size="small"
          value={filter}
          onChange={(e) => {
            setFilter(e.target.value);
            setPage(0);
          }}
          sx={{ maxWidth: 300, mb: 2 }}
        />

        <StoreTable
          stores={stores}
          page={page}
          rowsPerPage={rowsPerPage}
          onEdit={(store) => {
            setEditingStore(store);
            setDialogOpen(true);
          }}
          onDelete={(store) => {
            setStoreToDelete(store);
            setConfirmOpen(true);
          }}
        />

        <TablePagination
          component="div"
          count={total}
          page={page}
          onPageChange={(e, newPage) => setPage(newPage)}
          rowsPerPage={rowsPerPage}
          onRowsPerPageChange={(e) => {
            setRowsPerPage(parseInt(e.target.value, 10));
            setPage(0);
          }}
          rowsPerPageOptions={[5, 10, 25]}
        />

        <StoreDialog
          open={dialogOpen}
          onClose={() => {
            setDialogOpen(false);
            setEditingStore(null);
          }}
          store={editingStore}
          onSuccess={() => {
            loadStores();
            setDialogOpen(false);
            setEditingStore(null);
            showSnackbar("Store saved");
          }}
        />

        <ConfirmDialog
          open={confirmOpen}
          title="Delete Store"
          message={`Are you sure you want to delete "${storeToDelete?.Name}"?`}
          onCancel={() => setConfirmOpen(false)}
          onConfirm={handleDelete}
        />

        <Snackbar
          open={snackbar.open}
          autoHideDuration={3000}
          onClose={() => setSnackbar({ ...snackbar, open: false })}
        >
          <Alert severity={snackbar.severity}>{snackbar.message}</Alert>
        </Snackbar>
      </Box>
    </section>
  );
}
// This code defines a StorePage component that manages store data, allowing users to view, add, edit, and delete stores.