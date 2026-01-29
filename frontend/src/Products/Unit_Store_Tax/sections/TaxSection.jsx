import { useEffect, useState } from "react";
import { Snackbar, Alert } from "@mui/material";
import TaxDialog from "../components/TaxDialog";
import TaxTable from "../components/TaxTable";
import ConfirmDialog from "../../../CommonComponents/ConfirmDialog";
import Pagination from "../../../CommonComponents/Pagination";
import axios from "axios";
import { BASE_URL } from "../../../config/Config";
import "./allinone.scss";

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

      const data = Array.isArray(res.data?.data) ? res.data.data : (Array.isArray(res.data) ? res.data : []);
      const totalRes = Number(res.data?.total ?? data.length ?? 0);

      // If the current page is now beyond the last page (e.g., after deletions), reset to the last available page
      if (page > 0 && page * rowsPerPage >= totalRes) {
        const newPage = Math.max(0, Math.ceil(totalRes / rowsPerPage) - 1);
        setPage(newPage);
        return; // page state change will trigger a re-fetch
      }

      setTaxes(data);
      setTotal(totalRes);
    } catch (err) {
      console.error("Failed to load taxes:", err);
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
      showSnackbar("Deleted");
      loadTaxes();
    } catch (error) {
      console.error("Failed to delete tax:", error);
      // Prefer backend-provided error message if available
      const backendMsg = error?.response?.data?.error || error?.response?.data?.message;
      const message = backendMsg || error?.message || "Failed to delete";
      setSnackbar({ open: true, message, severity: "error" });
    } finally {
      setConfirmOpen(false);
      setTaxToDelete(null);
    }
  };

  return (
    <div className="section-container">
      <div className="section-header">
        <h6>Tax Management</h6>
        <div className="search-field-wrapper">
          <input
            type="text"
            className="search-input"
            placeholder="Filter by Name"
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
            Add Tax
          </button>
        </div>
      </div>

      <div className="table-wrapper">
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
    </div>
  );
}

