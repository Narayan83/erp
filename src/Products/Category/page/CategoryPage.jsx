import { useEffect, useState } from "react";
import {
  Box, Button, Typography, Snackbar, Alert,TablePagination,FormControl, InputLabel,
  Select, MenuItem,TextField
} from "@mui/material";
import CategoryTable from "../components/CategoryTable";
import CategoryDialog from "../components/CategoryDialog";
import ConfirmDialog from "../components/ConfirmDialog";
import axios from "axios";
import { BASE_URL }  from "../../../Config";

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
  const [rowsPerPage, setRowsPerPage] = useState(5);


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
      showSnackbar("Category deleted");
      loadCategories();
    } 
    catch (error) {
    if (error.response) {
      // Server responded with a status code outside 2xx
      console.error("Response error:", error.response.data);
      
      alert(error.response.data.error || "Server error");
    } else if (error.request) {
      // Request was made but no response
      console.error("No response:", error.request);
      alert("No response from server.");
    } else {
      // Something else went wrong
      console.error("Error:", error.message);
      alert(error.message);
    }
  }  
    
    finally {
      setConfirmOpen(false);
      setCategoryToDelete(null);
    }
  };

  return (

     <section className="right-content">
            <Box p={4}>
            <Box display="flex" justifyContent="space-between" mb={2}>
                <h6>Category Management</h6>
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
                    Add Category
                </Button>
            </Box>

            

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
            </Box>

    </section>
  );
}
