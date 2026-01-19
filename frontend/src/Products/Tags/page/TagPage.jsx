import { useEffect, useState } from "react";
import { Snackbar, Alert } from "@mui/material";
import TagDialog from "../components/TagDialog";
import TagTable from "../components/TagTable";
import ConfirmDialog from "../../../CommonComponents/ConfirmDialog";
import Pagination from "../../../CommonComponents/Pagination";
import axios from "axios";
import { BASE_URL }  from "../../../config/Config";
import "./tagpage.scss";

export default function TagPage() {
  const [tags, setTags] = useState([]);


  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingTag, setEditingTag] = useState(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [tagToDelete, setTagToDelete] = useState(null);
  const [snackbar, setSnackbar] = useState({ open: false, message: "", severity: "success" });


  // pagination state
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0); // 0-based for MUI
  const [rowsPerPage, setRowsPerPage] = useState(10);


    const [filter, setFilter] = useState("");
    const [filterOptions, setFilterOptions] = useState([]);


  const loadTags = async () => {
    try {
      const res = await axios.get(`${BASE_URL}/api/tags`,{
        params: { page: page + 1, limit: rowsPerPage,filter: filter },
      });
      setTags(res.data.data);
      setTotal(res.data.total);
    } catch {
      showSnackbar("Failed to load categories", "error");
    }
  };




  const loadFilterOptions = async () => {
    try {
      const res = await axios.get(`${BASE_URL}/api/tags`);
      const names = [...new Set(res.data.data.map(tag => tag.Name))];
      setFilterOptions(names.sort());
    } catch {
      setSnackbar({ open: true, message: "Failed to load filter options", severity: "error" });
    }
  };

  useEffect(() => {
    loadFilterOptions();
  }, []);

    useEffect(() => {
    loadTags();
  }, [page, rowsPerPage,filter]);

  const showSnackbar = (message, severity = "success") => {
    setSnackbar({ open: true, message, severity });
  };

  const handleDelete = async () => {
    try {
      await axios.delete(`${BASE_URL}/api/tags/${tagToDelete.ID}`);
      showSnackbar("Deleted");
      loadTags();
    } 
    catch (error) {
      console.error("Failed to delete tag:", error);
      // Prefer backend-provided error message if available
      const backendMsg = error?.response?.data?.error || error?.response?.data?.message;
      const message = backendMsg || error?.message || "Failed to delete";
      setSnackbar({ open: true, message, severity: "error" });
    }  
    
    finally {
      setConfirmOpen(false);
      setTagToDelete(null);
    }
  };

  return (
    <section className="right-content">
      <div className="tag-page-header">
        <h6>Tags Management</h6>
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
            Add Tag
          </button>
        </div>
      </div>

      <div className="table-wrapper">
        <TagTable
                tags={tags}
                page={page}
                rowsPerPage={rowsPerPage}
                onEdit={(tag) => {
                setEditingTag(tag);
                setDialogOpen(true);
                }}
                onDelete={(tag) => {
                setTagToDelete(tag);
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

      <TagDialog
        open={dialogOpen}
        onClose={() => {
          setDialogOpen(false);
          setEditingTag(null);
        }}
        tag={editingTag}
        onSuccess={() => {
          loadTags();
          setDialogOpen(false);
          setEditingTag(null);
          showSnackbar("Tag saved");
        }}
      />

      <ConfirmDialog
        open={confirmOpen}
        title="Delete Category"
        message={`Are you sure you want to delete "${tagToDelete?.Name}"?`}
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
    </section>
  );
}
