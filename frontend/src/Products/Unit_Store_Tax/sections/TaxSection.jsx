import { useEffect, useState } from "react";
import { Snackbar, Alert } from "@mui/material";
import TaxDialog from "../components/TaxDialog";
import TaxTable from "../components/TaxTable";
import ConfirmDialog from "../../../CommonComponents/ConfirmDialog";
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

        <div className="pagination-wrapper">
          <div className="pagination-info">
            <span>Rows per page:</span>
            <select 
              value={rowsPerPage}
              onChange={(e) => {
                setRowsPerPage(parseInt(e.target.value, 10));
                setPage(0);
              }}
            >
              <option value={5}>5</option>
              <option value={10}>10</option>
              <option value={25}>25</option>
            </select>
            <span>{total > 0 ? page * rowsPerPage + 1 : 0}â€“{Math.min((page + 1) * rowsPerPage, total)} of {total}</span>
          </div>
          <div className="pagination-buttons">
            <button
              onClick={() => setPage(page - 1)}
              disabled={page === 0}
              type="button"
            >
              Previous
            </button>
            <button
              onClick={() => setPage(page + 1)}
              disabled={(page + 1) * rowsPerPage >= total}
              type="button"
            >
              Next
            </button>
          </div>
        </div>

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

