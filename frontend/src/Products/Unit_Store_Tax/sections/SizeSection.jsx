import React, { useState, useEffect } from "react";
import { Box, Button, TextField, Snackbar, Alert, TablePagination, CircularProgress } from "@mui/material";
import axios from "axios";
import { BASE_URL } from "../../../Config";
import SizeTable from "../components/SizeTable";
import SizeDialog from "../components/SizeDialog";
import ConfirmDialog from "../../../CommonComponents/ConfirmDialog";

export default function SizeSection() {
  const [sizes, setSizes] = useState([]);
  const [debouncedFilter, setDebouncedFilter] = useState("");
  const [filter, setFilter] = useState("");
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(5);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingSize, setEditingSize] = useState(null);
  const [snackbar, setSnackbar] = useState({ open: false, message: "", severity: "success" });
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null);

  // Debounce filter changes to reduce API calls while typing
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedFilter(filter);
    }, 500);
    return () => clearTimeout(handler);
  }, [filter]);

  const fetchSizes = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${BASE_URL}/api/sizes`, {
        params: {
          page: page + 1,
          limit: rowsPerPage,
          filter: debouncedFilter,
        },
      });
      setSizes(res.data.data || []);
      setTotal(res.data.total || 0);
    } catch (error) {
      console.error("Failed to fetch sizes:", error);
      setSnackbar({ open: true, message: "Failed to fetch sizes", severity: "error" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSizes();
  }, [page, rowsPerPage, debouncedFilter]);

  const handleEdit = (size) => {
    setEditingSize(size);
    setDialogOpen(true);
  };

  const handleDelete = (size) => {
    setItemToDelete(size);
    setConfirmOpen(true);
  };

  const executeDelete = async () => {
    if (!itemToDelete) return;
    try {
      await axios.delete(`${BASE_URL}/api/sizes/${itemToDelete.id}`);
      setSnackbar({ open: true, message: "Deleted", severity: "success" });
      fetchSizes();
    } catch (error) {
      console.error("Failed to delete size:", error);
      setSnackbar({ open: true, message: "Failed to delete", severity: "error" });
    } finally {
      setConfirmOpen(false);
      setItemToDelete(null);
    }
  };

  return (
    <Box mt={2}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
        <h6>Size Master</h6>
        <Button variant="contained" onClick={() => setDialogOpen(true)}>
          Add Size
        </Button>
      </Box>

      <TextField
        label="Search Size"
        size="small"
        fullWidth
        value={filter}
        onChange={(e) => {
          setFilter(e.target.value);
          setPage(0);
        }}
        sx={{ mb: 2, maxWidth: 300 }}
      />

      {loading ? (
        <Box display="flex" justifyContent="center" alignItems="center" my={5}>
          <CircularProgress />
        </Box>
      ) : (
        <>
          <SizeTable
            data={sizes}
            onEdit={handleEdit}
            onDelete={handleDelete}
            page={page}
            rowsPerPage={rowsPerPage}
          />

          <TablePagination
            component="div"
            count={total}
            page={page}
            onPageChange={(e, newPage) => setPage(newPage)}
            rowsPerPage={rowsPerPage}
            onRowsPerPageChange={(e) => {
              setRowsPerPage(parseInt(e.target.value));
              setPage(0);
            }}
          />
        </>
      )}

      <SizeDialog
        open={dialogOpen}
        size={editingSize}
        onClose={() => {
          setDialogOpen(false);
          setEditingSize(null);
        }}
        onSuccess={() => {
          setDialogOpen(false);
          setEditingSize(null);
          fetchSizes();
        }}
        onError={(message) => {
          setSnackbar({ open: true, message, severity: "error" });
        }}
      />

      <ConfirmDialog
        open={confirmOpen}
        title="Delete Size"
        message={`Are you sure you want to delete size "${itemToDelete?.name}"?`}
        onCancel={() => setConfirmOpen(false)}
        onConfirm={executeDelete}
      />

      <Snackbar
        open={snackbar.open}
        autoHideDuration={3000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
      >
        <Alert severity={snackbar.severity}>{snackbar.message}</Alert>
      </Snackbar>
    </Box>
  );
}
