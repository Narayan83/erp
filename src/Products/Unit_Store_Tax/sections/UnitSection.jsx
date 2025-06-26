import { Box, Typography, TextField, Button, TablePagination, Snackbar, Alert } from "@mui/material";
import { useEffect, useState } from "react";
import axios from "axios";
import UnitTable from "../components/UnitTable";
import UnitDialog from "../components/UnitDialog";
import { BASE_URL }  from "../../../Config";
export default function UnitSection() {
  const [units, setUnits] = useState([]);
  const [filter, setFilter] = useState("");
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(5);
  const [total, setTotal] = useState(0);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingUnit, setEditingUnit] = useState(null);
  const [snackbar, setSnackbar] = useState({ open: false, message: "", severity: "success" });

  const fetchUnits = async () => {
    try {
      const res = await axios.get(`${BASE_URL}/api/units`, {
        params: {
          page: page + 1,
          limit: rowsPerPage,
          filter,
        },
      });
      setUnits(res.data.data);
      setTotal(res.data.total);
    } catch {
      setSnackbar({ open: true, message: "Failed to fetch units", severity: "error" });
    }
  };

  useEffect(() => {
    fetchUnits();
  }, [page, rowsPerPage, filter]);

  const handleEdit = (unit) => {
    setEditingUnit(unit);
    setDialogOpen(true);
  };

  const handleDelete = async (unit) => {
    if (!window.confirm("Are you sure?")) return;
    try {
      await axios.delete(`${BASE_URL}/api/units/${unit.ID}`);
      setSnackbar({ open: true, message: "Deleted", severity: "success" });
      fetchUnits();
    } catch {
      setSnackbar({ open: true, message: "Failed to delete", severity: "error" });
    }
  };

  return (
    <Box mt={2}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
        <h6>Unit Master</h6>
        <Button variant="contained" onClick={() => setDialogOpen(true)}>
           Add Unit
        </Button>
      </Box>

      <TextField
        label="Search Unit"
        size="small"
        fullWidth
        value={filter}
        onChange={(e) => {
          setFilter(e.target.value);
          setPage(0);
        }}
        sx={{ mb: 2, maxWidth: 300 }}
      />

      <UnitTable
        units={units}
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

      <UnitDialog
        open={dialogOpen}
        unit={editingUnit}
        onClose={() => {
          setDialogOpen(false);
          setEditingUnit(null);
        }}
        onSuccess={() => {
          setDialogOpen(false);
          fetchUnits();
        }}
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
