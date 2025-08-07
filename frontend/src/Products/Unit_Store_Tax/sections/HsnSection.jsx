import React, { useState, useEffect } from "react";
import { Box, Button, TextField, Snackbar, Alert, TablePagination, CircularProgress } from "@mui/material";
import axios from "axios";
import { BASE_URL } from "../../../Config";
import HsnTable from "../components/HsnTable";
import HsnDialog from "../components/HsnDialog";
import ConfirmDialog from "../../../CommonComponents/ConfirmDialog";

export default function HsnSection() {
  const [hsns, setHsns] = useState([]);
  const [debouncedFilter, setDebouncedFilter] = useState("");
  const [filter, setFilter] = useState("");
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(5);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingHsn, setEditingHsn] = useState(null);
  const [snackbar, setSnackbar] = useState({ open: false, message: "", severity: "success" });
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null);
  const [taxes, setTaxes] = useState([]);

  // Debounce filter changes to reduce API calls while typing
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedFilter(filter);
    }, 500); // 500ms delay

    return () => clearTimeout(handler);
  }, [filter]);

  // Fetch taxes on mount
  useEffect(() => {
    axios.get(`${BASE_URL}/api/taxes`, { params: { page: 1, limit: 100 } })
      .then(res => setTaxes(res.data.data || []))
      .catch(() => setTaxes([]));
  }, []);

  const fetchHsns = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${BASE_URL}/api/hsncode`, {
        params: {
          page: page + 1,
          limit: rowsPerPage,
          filter: debouncedFilter,
        },
      });
      setHsns(res.data.data || []);
      setTotal(res.data.total || 0);
    } catch (error) {
      console.error("Failed to fetch HSNs:", error);
      setSnackbar({ open: true, message: "Failed to fetch HSNs", severity: "error" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHsns();
  }, [page, rowsPerPage, debouncedFilter]);

  const handleEdit = (hsn) => {
    setEditingHsn(hsn);
    setDialogOpen(true);
  };

  const handleDelete = (hsn) => {
    setItemToDelete(hsn);
    setConfirmOpen(true);
  };

  const executeDelete = async () => {
    if (!itemToDelete) return;
    try {
      await axios.delete(`${BASE_URL}/api/hsncode/${itemToDelete.id}`);
      setSnackbar({ open: true, message: "Deleted", severity: "success" });
      fetchHsns();
    } catch (error) {
      console.error("Failed to delete HSN:", error);
      setSnackbar({ open: true, message: "Failed to delete", severity: "error" });
    } finally {
      setConfirmOpen(false);
      setItemToDelete(null);
    }
  };

  // Map tax_id to tax object for each HSN
  const hsnsWithTax = hsns.map(hsn => ({
    ...hsn,
    tax: taxes.find(tax => tax.ID === hsn.tax_id) || null,
  }));

  return (
    <Box mt={2}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
        <h6>HSN Master</h6>
        <Button variant="contained" onClick={() => setDialogOpen(true)}>
          Add HSN
        </Button>
      </Box>

      <TextField
        label="Search HSN"
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
          <HsnTable
            data={hsnsWithTax}
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

      <HsnDialog
        open={dialogOpen}
        hsn={editingHsn}
        onClose={() => {
          setDialogOpen(false);
          setEditingHsn(null);
        }}
        onSuccess={() => {
          setDialogOpen(false);
          setEditingHsn(null);
          fetchHsns();
        }}
        onError={(message) => {
          setSnackbar({ open: true, message, severity: "error" });
        }}
      />

      <ConfirmDialog
        open={confirmOpen}
        title="Delete HSN"
        message={`Are you sure you want to delete HSN code "${itemToDelete?.code}"?`}
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
