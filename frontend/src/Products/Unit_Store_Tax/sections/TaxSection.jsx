import { useEffect, useState } from "react";
import {
  Box, Button, Typography, Snackbar, Alert, TablePagination,
  TextField
} from "@mui/material";
import TaxDialog from "../components/TaxDialog";
import TaxTable from "../components/TaxTable";
import ConfirmDialog from "../../../CommonComponents/ConfirmDialog";
import axios from "axios";
import { BASE_URL } from "../../../Config";

export default function TaxSection() {
  const [taxes, setTaxes] = useState([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingTax, setEditingTax] = useState(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [taxToDelete, setTaxToDelete] = useState(null);
  const [snackbar, setSnackbar] = useState({ open: false, message: "", severity: "success" });

  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [total, setTotal] = useState(0);
  const [filter, setFilter] = useState("");

  const loadTaxes = async () => {
    try {
      const res = await axios.get(`${BASE_URL}/api/taxes`, {
        params: { page: page + 1, limit: rowsPerPage, filter }
      });
      console.log(res);
      setTaxes(res.data.data);
      setTotal(res.data.total);
      console.log(taxes)
    } catch {
      showSnackbar("Failed to load taxes", "error");
    }
  };

  useEffect(() => {
    loadTaxes();
  }, [page, rowsPerPage, filter]);

  const showSnackbar = (message, severity = "success") => {
    setSnackbar({ open: true, message, severity });
  };

  const handleDelete = async () => {
    try {
      await axios.delete(`${BASE_URL}/api/taxes/${taxToDelete.ID}`);
      showSnackbar("Tax deleted");
      loadTaxes();
    } catch (error) {
      if (error.response) {
        alert(error.response.data.error || "Server error");
      } else if (error.request) {
        alert("No response from server.");
      } else {
        alert(error.message);
      }
    } finally {
      setConfirmOpen(false);
      setTaxToDelete(null);
    }
  };

  return (
   
      <Box p={2}>
        <Box display="flex" justifyContent="space-between" mb={2}>
          <h6 >Tax Management</h6>
          <TextField
            label="Filter by Name"
            variant="outlined"
            size="small"
            fullWidth
            value={filter}
            onChange={(e) => {
              setFilter(e.target.value);
              setPage(0);
            }}
            sx={{ maxWidth: 300, mb: 2 }}
          />
          <Button variant="contained" onClick={() => setDialogOpen(true)}>
            Add Tax
          </Button>
        </Box>

        <TaxTable
          taxes={taxes}
          page={page}
          rowsPerPage={rowsPerPage}
          onEdit={(tax) => {
            setEditingTax(tax);
            setDialogOpen(true);
          }}
          onDelete={(tax) => {
            setTaxToDelete(tax);
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

        <TaxDialog
          open={dialogOpen}
          onClose={() => {
            setDialogOpen(false);
            setEditingTax(null);
          }}
          tax={editingTax}
          onSuccess={() => {
            loadTaxes();
            setDialogOpen(false);
            setEditingTax(null);
            showSnackbar("Tax saved");
          }}
        />

        <ConfirmDialog
          open={confirmOpen}
          title="Delete Tax"
          message={`Are you sure you want to delete "${taxToDelete?.Name}"?`}
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
   
  );
}
