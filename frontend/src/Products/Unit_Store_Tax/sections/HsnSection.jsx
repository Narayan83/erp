import React, { useState, useEffect } from "react";
import { Snackbar, Alert } from "@mui/material";
import axios from "axios";
import { BASE_URL } from "../../../config/Config";
import HsnTable from "../components/HsnTable";
import HsnDialog from "../components/HsnDialog";
import ConfirmDialog from "../../../CommonComponents/ConfirmDialog";
import "./allinone.scss";

export default function HsnSection() {
  const [hsns, setHsns] = useState([]);
  const [debouncedFilter, setDebouncedFilter] = useState("");
  const [filter, setFilter] = useState("");
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
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
      // Prefer backend-provided error message if available
      const backendMsg = error?.response?.data?.error || error?.response?.data?.message;
      const message = backendMsg || error?.message || "Failed to delete";
      setSnackbar({ open: true, message, severity: "error" });
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
    <div className="section-container">
      <div className="section-header">
        <h6>HSN Master</h6>
        <div className="search-field-wrapper">
          <input
            type="text"
            className="search-input"
            placeholder="Search HSN"
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
            Add HSN
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
            <HsnTable
            data={hsnsWithTax}
            onEdit={handleEdit}
            onDelete={handleDelete}
            page={page}
            rowsPerPage={rowsPerPage}
          />
          </div>

          <div className="pagination-wrapper">
            <div className="pagination-info">
              <span>Rows per page:</span>
              <select 
                value={rowsPerPage}
                onChange={(e) => {
                  setRowsPerPage(parseInt(e.target.value));
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
    </div>
  );
}
