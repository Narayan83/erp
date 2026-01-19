import React, { useState, useEffect } from "react";
import { Snackbar, Alert } from "@mui/material";
import axios from "axios";
import { BASE_URL } from "../../../config/Config";
import SizeTable from "../components/SizeTable";
import SizeDialog from "../components/SizeDialog";
import ConfirmDialog from "../../../CommonComponents/ConfirmDialog";
import Pagination from "../../../CommonComponents/Pagination";
import "./allinone.scss";

export default function SizeSection() {
  const [sizes, setSizes] = useState([]);
  const [debouncedFilter, setDebouncedFilter] = useState("");
  const [filter, setFilter] = useState("");
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
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
      // Prefer backend-provided error message if available
      const backendMsg = error?.response?.data?.error || error?.response?.data?.message;
      const message = backendMsg || error?.message || "Failed to delete";
      setSnackbar({ open: true, message, severity: "error" });
    } finally {
      setConfirmOpen(false);
      setItemToDelete(null);
    }
  };

  return (
    <div className="section-container">
      <div className="section-header">
        <h6>Size Master</h6>
        <div className="search-field-wrapper">
          <input
            type="text"
            className="search-input"
            placeholder="Search Size"
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
            Add Size
          </button>
        </div>
      </div>

      {loading ? (
        <div className="loading-container">
          <div className="spinner" />
        </div>
      ) : (
        <>
          <div className="table-wrapper">
            <SizeTable
            data={sizes}
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
    </div>
  );
}
