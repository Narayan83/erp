import { useEffect, useState } from "react";
import { Snackbar, Alert } from "@mui/material";
import CategoryTable from "../components/CategoryTable";
import CategoryDialog from "../components/CategoryDialog";
import ConfirmDialog from "../components/ConfirmDialog";
import Pagination from "../../../CommonComponents/Pagination";
import axios from "axios";
import { BASE_URL }  from "../../../config/Config";
import "./category.scss";

export default function CategoryPage() {
  const [categories, setCategories] = useState([]);


  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [categoryToDelete, setCategoryToDelete] = useState(null);
  const [snackbar, setSnackbar] = useState({ open: false, message: "", severity: "success" });


  // pagination state
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0); // 0-based for MUI
  const [rowsPerPage, setRowsPerPage] = useState(10);


    const [filter, setFilter] = useState("");
    const [filterOptions, setFilterOptions] = useState([]);


  const loadCategories = async () => {
    try {
      const res = await axios.get(`${BASE_URL}/api/categories`,{
        params: { page: page + 1, limit: rowsPerPage,filter: filter },
      });
      setCategories(res.data.data);
      setTotal(res.data.total);
    } catch {
      showSnackbar("Failed to load categories", "error");
    }
  };




  const loadFilterOptions = async () => {
    try {
      const res = await axios.get(`${BASE_URL}/api/categories`);
      const names = [...new Set(res.data.data.map(cat => cat.Name))];
      setFilterOptions(names.sort());
    } catch {
      setSnackbar({ open: true, message: "Failed to load filter options", severity: "error" });
    }
  };

  useEffect(() => {
    loadFilterOptions();
  }, []);

    useEffect(() => {
    loadCategories();
  }, [page, rowsPerPage,filter]);

  const showSnackbar = (message, severity = "success") => {
    setSnackbar({ open: true, message, severity });
  };

  const handleDelete = async () => {
    try {
      await axios.delete(`${BASE_URL}/api/categories/${categoryToDelete.ID}`);
      showSnackbar("Deleted");
      loadCategories();
    } 
    catch (error) {
      console.error("Failed to delete category:", error);
      // Prefer backend-provided error message if available
      const backendMsg = error?.response?.data?.error || error?.response?.data?.message;
      const message = backendMsg || error?.message || "Failed to delete";
      setSnackbar({ open: true, message, severity: "error" });
    }  
    
    finally {
      setConfirmOpen(false);
      setCategoryToDelete(null);
    }
  };

  return (
    <section className="right-content">
      <div className="category-page-header">
        <h6>Category Management</h6>
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
            Add Category
          </button>
        </div>
      </div>

      <div className="table-wrapper">
        <CategoryTable
                categories={categories}
                page={page}
                rowsPerPage={rowsPerPage}
                onEdit={(cat) => {
                setEditingCategory(cat);
                setDialogOpen(true);
                }}
                onDelete={(cat) => {
                setCategoryToDelete(cat);
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

      <CategoryDialog
        open={dialogOpen}
        onClose={() => {
          setDialogOpen(false);
          setEditingCategory(null);
        }}
        category={editingCategory}
        onSuccess={() => {
          loadCategories();
          setDialogOpen(false);
          setEditingCategory(null);
          showSnackbar("Category saved");
        }}
      />

      <ConfirmDialog
        open={confirmOpen}
        title="Delete Category"
        message={`Are you sure you want to delete "${categoryToDelete?.Name}"?`}
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
