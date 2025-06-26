// ProductListPage.jsx
import React, { useEffect, useState } from "react";
import {
  Box,
  Button,
  Grid,
  TextField,
  MenuItem,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  CircularProgress,
  TablePagination,
} from "@mui/material";
import { Edit, Delete, Visibility } from "@mui/icons-material";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { BASE_URL } from "../../../Config";

export default function ProductListPage() {
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [stores, setStores] = useState([]);
  const [filters, setFilters] = useState({ name: "", categoryID: "", storeID: "" });
  const [page, setPage] = useState(0);
  const [limit, setRowsPerPage] = useState(10);
  const [totalItems, setTotalItems] = useState(0);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchMeta();
  }, []);

  useEffect(() => {
    fetchProducts();
  }, [page, limit]);

  const fetchMeta = async () => {
    try {
      const [catRes, storeRes] = await Promise.all([
        axios.get(`${BASE_URL}/api/categories`),
        axios.get(`${BASE_URL}/api/stores`),
      ]);
      setCategories(catRes.data.data);
      setStores(storeRes.data.data);
    } catch (err) {
      console.error("Error fetching meta:", err);
    }
  };

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${BASE_URL}/api/products`, {
        params: {
          page: page + 1,
          limit,
          name: filters.name,
          category_id: filters.categoryID,
          store_id: filters.storeID,
        },
      });
      setProducts(res.data.data);
      setTotalItems(res.data.total);
    } catch (err) {
      console.error("Error fetching products:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    setPage(0);
    fetchProducts();
  };

  return (
    <Box p={3}>
      <Typography variant="h5" mb={2}>📦 Product Master</Typography>

      <Paper sx={{ p: 2, mb: 2 }}>
        <Grid container spacing={2}>
          <Grid item xs={12} md={4}>
            <TextField
              label="Search by Name"
              fullWidth
              size="small"
              value={filters.name}
              onChange={(e) => setFilters({ ...filters, name: e.target.value })}
            />
          </Grid>
          <Grid item xs={6} md={4}>
            <TextField
              label="Category"
              select
              fullWidth
              size="small"
              value={filters.categoryID}
              sx={{ minWidth: 120 }}
              onChange={(e) => setFilters({ ...filters, categoryID: e.target.value })}
            >
              <MenuItem value="">All</MenuItem>
              {categories.map((cat) => (
                <MenuItem key={cat.ID} value={cat.ID}>{cat.Name}</MenuItem>
              ))}
            </TextField>
          </Grid>
          <Grid item xs={6} md={4}>
            <TextField
              label="Store"
              select
              fullWidth
              size="small"
              value={filters.storeID}
              sx={{ minWidth: 120 }}
              onChange={(e) => setFilters({ ...filters, storeID: e.target.value })}
            >
              <MenuItem value="">All</MenuItem>
              {stores.map((store) => (
                <MenuItem key={store.ID} value={store.ID}>{store.Name}</MenuItem>
              ))}
            </TextField>
          </Grid>
          <Grid item xs={12}>
            <Button variant="contained" onClick={handleSearch}>Search</Button>
          </Grid>
        </Grid>
      </Paper>

      <Paper>
        {loading ? (
          <Box p={3} textAlign="center">
            <CircularProgress />
          </Box>
        ) : products.length === 0 ? (
          <Box p={3} textAlign="center">No products found.</Box>
        ) : (
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell sx={{fontWeight : "bold"}} >Name</TableCell>
                  <TableCell sx={{fontWeight : "bold"}}>Code</TableCell>
                  <TableCell sx={{fontWeight : "bold"}}>Category</TableCell>
                  <TableCell sx={{fontWeight : "bold"}}>Store</TableCell>
                  <TableCell sx={{fontWeight : "bold"}} align="center">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {products.map((p) => (
                  <TableRow key={p.ID}>
                    <TableCell sx={{ py: 0.5 }}>{p.Name}</TableCell>
                    <TableCell sx={{ py: 0.5 }}>{p.Code}</TableCell>
                    <TableCell sx={{ py: 0.5 }}>{p.Category?.Name}</TableCell>
                    <TableCell sx={{ py: 0.5 }}>{p.Store?.Name}</TableCell>
                    <TableCell align="center">
                      <IconButton onClick={() => navigate(`/products/${p.ID}`)}><Visibility /></IconButton>
                      <IconButton onClick={() => navigate(`/products/${p.ID}/edit`)}><Edit /></IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}

        <Box p={2} display="flex" justifyContent="space-between" alignItems="center">
          <Button variant="contained" color="warning" onClick={() => navigate("/ManageProduct")}>+ Add Product</Button>
          <TablePagination
            component="div"
            count={totalItems}
            page={page}
            onPageChange={(e, newPage) => setPage(newPage)}
            rowsPerPage={limit}
            onRowsPerPageChange={(e) => {
              setRowsPerPage(parseInt(e.target.value, 10));
              setPage(0);
            }}
            rowsPerPageOptions={[5, 10, 25]}
          />
        </Box>
      </Paper>
    </Box>
  );
}