import { useEffect, useState } from "react";
import { Snackbar, Alert } from "@mui/material";
import axios from "axios";
import UnitTable from "../components/UnitTable";
import UnitDialog from "../components/UnitDialog";
import Pagination from "../../../CommonComponents/Pagination";
import { BASE_URL }  from "../../../config/Config";
import "./allinone.scss";
export default function UnitSection() {
  const [units, setUnits] = useState([]);
  const [filter, setFilter] = useState("");
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10); // Changed from 5 to 10
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
    console.log("Deleting unit:", unit); // Debug the unit object
    if (!window.confirm("Are you sure?")) return;
    try {
      const response = await axios.delete(`${BASE_URL}/api/units/${unit.id || unit.ID}`);
      console.log("Delete response:", response);
      setSnackbar({ open: true, message: "Deleted", severity: "success" });
      fetchUnits();
    } catch (error) {
      console.error("Delete error:", error.response || error);
      setSnackbar({ open: true, message: `Failed to delete: ${error.response?.data?.error || error.message}`, severity: "error" });
    }
  };

  return (
    <div className="section-container">
      <div className="section-header">
        <h6>Unit Master</h6>
        <div className="search-field-wrapper">
          <input
            type="text"
            className="search-input"
            placeholder="Search Unit"
            value={filter}
            onChange={(e) => {
              setFilter(e.target.value);
              setPage(0);
            }}
          />
        </div>
        <div className="add-button-wrapper">
          <button
            className="btn-add"
            onClick={() => setDialogOpen(true)}
            type="button"
          >
            Add Unit
          </button>
        </div>
      </div>

      <div className="table-wrapper">
        <UnitTable
        units={units}
        onEdit={handleEdit}
        onDelete={handleDelete}
        page={page}
        rowsPerPage={rowsPerPage}
      />
      </div>

      <Pagination
        page={page}
        total={total}
        rowsPerPage={rowsPerPage}
        onPageChange={(newPage) => setPage(newPage)}
        onRowsPerPageChange={(newRowsPerPage) => {
          setRowsPerPage(newRowsPerPage);
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
    </div>
  );
}
