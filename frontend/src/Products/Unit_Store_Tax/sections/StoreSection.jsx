import { useEffect, useState } from "react";
import { Snackbar, Alert } from "@mui/material";
import StoreTable from "../components/StoreTable";
import StoreDialog from "../components/StoreDialog";
import ConfirmDialog from "../../../CommonComponents/ConfirmDialog";
import axios from "axios";
import { BASE_URL } from "../../../config/Config";
import "./allinone.scss";

export default function StoreSection() {
  const [stores, setStores] = useState([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingStore, setEditingStore] = useState(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [storeToDelete, setStoreToDelete] = useState(null);
  const [snackbar, setSnackbar] = useState({ open: false, message: "", severity: "success" });

  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
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
      <div className="section-container">
        <div className="section-header">
          <h6>Store Management</h6>
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
              Add Store
            </button>
          </div>
        </div>

        <div className="table-wrapper">
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
            <span>{total > 0 ? page * rowsPerPage + 1 : 0}–{Math.min((page + 1) * rowsPerPage, total)} of {total}</span>
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
      </div>
    </section>
  );
}
// This code defines a StorePage component that manages store data, allowing users to view, add, edit, and delete stores.