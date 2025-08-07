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
import { Edit, Delete, Visibility, ArrowUpward, ArrowDownward } from "@mui/icons-material";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { BASE_URL } from "../../../Config";

export default function ProductListPage() {
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [stores, setStores] = useState([]);
  const [allSubcategories, setAllSubcategories] = useState([]);
  const [filters, setFilters] = useState({ name: "", code: "", categoryID: "", storeID: "", subcategoryID: "", stock: "" });
  const [page, setPage] = useState(0);
  const [limit, setRowsPerPage] = useState(10);
  const [totalItems, setTotalItems] = useState(0);
  const [loading, setLoading] = useState(false);
  // Sorting state for Name and Stock columns
  const [nameSort, setNameSort] = useState(null); // null | 'asc' | 'desc'
  const [stockSort, setStockSort] = useState(null); // null | 'asc' | 'desc'

  // Debounced filters for smooth search
  const [debouncedFilters, setDebouncedFilters] = useState(filters);

  const handleNameSort = (direction) => {
    setNameSort((currentSort) => currentSort === direction ? null : direction);
    setStockSort(null); // Only one sort at a time
  };

  const handleStockSort = (direction) => {
    setStockSort((currentSort) => currentSort === direction ? null : direction);
    setNameSort(null); // Only one sort at a time
  };

  useEffect(() => {
    fetchMeta();
  }, []);

  // Fetch subcategories on mount
  useEffect(() => {
    const fetchSubcategories = async () => {
      try {
        const res = await axios.get(`${BASE_URL}/api/subcategories`);
        setAllSubcategories(res.data.data);
      } catch (err) {
        setAllSubcategories([]);
      }
    };
    fetchSubcategories();
  }, []);

  // Debounce filter changes for smoother search
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedFilters(filters);
    }, 250); // 250ms debounce for smoother typing
    return () => clearTimeout(handler);
  }, [filters]);

  useEffect(() => {
    fetchProducts();
  }, [page, limit, debouncedFilters, nameSort, stockSort]);

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
      // Only include non-empty filter params
      const filterParams = Object.entries({
        name: debouncedFilters.name,
        code: debouncedFilters.code,
        category_id: debouncedFilters.categoryID !== "" ? Number(debouncedFilters.categoryID) : undefined,
        store_id: debouncedFilters.storeID !== "" ? Number(debouncedFilters.storeID) : undefined,
        subcategory_id: debouncedFilters.subcategoryID !== "" ? Number(debouncedFilters.subcategoryID) : undefined,
        stock:
          debouncedFilters.stock !== "" && !isNaN(Number(debouncedFilters.stock))
            ? Number(debouncedFilters.stock)
            : undefined,
      }).reduce((acc, [key, value]) => {
        if (value !== "" && value !== undefined && value !== null && !Number.isNaN(value)) {
          acc[key] = value;
        }
        return acc;
      }, {});
      // Add sorting params if set
      let sortParams = {};
      if (nameSort) {
        sortParams = { sort_by: 'name', sort_order: nameSort };
      } else if (stockSort) {
        sortParams = { sort_by: 'stock', sort_order: stockSort };
      }
      console.log('Product filter params:', { page: page + 1, limit, ...filterParams, ...sortParams });
      const res = await axios.get(`${BASE_URL}/api/products`, {
        params: {
          page: page + 1,
          limit,
          ...filterParams,
          ...sortParams,
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

  // handleSearch removed: search is now automatic on filter change

  return (
    <Box p={3}>
      <Typography variant="h5" mb={2}>📦 Product Master</Typography>

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
                  <TableCell sx={{fontWeight : "bold"}}>
                    <Box display="flex" alignItems="center" gap={0.5}>
                      Name
                      <IconButton
                        size="small"
                        onClick={() => handleNameSort('asc')}
                        color={nameSort === 'asc' ? 'primary' : 'default'}
                        aria-label="Sort name ascending"
                        sx={{ p: 0.25 }}
                      >
                        <ArrowUpward
                          fontSize="inherit"
                          sx={{
                            color: nameSort === 'asc' ? 'primary.main' : 'inherit',
                            opacity: nameSort === 'asc' ? 1 : 0.5,
                          }}
                        />
                      </IconButton>
                      <IconButton
                        size="small"
                        onClick={() => handleNameSort('desc')}
                        color={nameSort === 'desc' ? 'primary' : 'default'}
                        aria-label="Sort name descending"
                        sx={{ p: 0.25 }}
                      >
                        <ArrowDownward
                          fontSize="inherit"
                          sx={{
                            color: nameSort === 'desc' ? 'primary.main' : 'inherit',
                            opacity: nameSort === 'desc' ? 1 : 0.5,
                          }}
                        />
                      </IconButton>
                    </Box>
                  </TableCell>
                  <TableCell sx={{fontWeight : "bold"}}>Code</TableCell>
                  <TableCell sx={{fontWeight : "bold"}}>Category</TableCell>
                  <TableCell sx={{fontWeight : "bold"}}>Store</TableCell>
                  <TableCell sx={{fontWeight : "bold"}}>Subcategory</TableCell>
                  <TableCell sx={{fontWeight : "bold"}}>
                    <Box display="flex" alignItems="center" gap={0.5}>
                      Stock
                      <IconButton
                        size="small"
                        onClick={() => handleStockSort('asc')}
                        color={stockSort === 'asc' ? 'primary' : 'default'}
                        aria-label="Sort stock ascending"
                        sx={{ p: 0.25 }}
                      >
                        <ArrowUpward
                          fontSize="inherit"
                          sx={{
                            color: stockSort === 'asc' ? 'primary.main' : 'inherit',
                            opacity: stockSort === 'asc' ? 1 : 0.5,
                          }}
                        />
                      </IconButton>
                      <IconButton
                        size="small"
                        onClick={() => handleStockSort('desc')}
                        color={stockSort === 'desc' ? 'primary' : 'default'}
                        aria-label="Sort stock descending"
                        sx={{ p: 0.25 }}
                      >
                        <ArrowDownward
                          fontSize="inherit"
                          sx={{
                            color: stockSort === 'desc' ? 'primary.main' : 'inherit',
                            opacity: stockSort === 'desc' ? 1 : 0.5,
                          }}
                        />
                      </IconButton>
                    </Box>
                  </TableCell>
                  <TableCell sx={{fontWeight : "bold"}} align="center">Actions</TableCell>
                </TableRow>
                 
                <TableRow>
                  <TableCell>
                        <TextField
                          placeholder="Search Name"
                          fullWidth
                          size="small"
                          value={filters.name}
                          onChange={(e) => {
                            setFilters({ ...filters, name: e.target.value });
                            setPage(0);
                          }}
                        />
                      </TableCell>
                      <TableCell>
                        <TextField
                          placeholder="Code"
                          fullWidth
                          size="small"
                          value={filters.code}
                          onChange={(e) => {
                            setFilters({ ...filters, code: e.target.value });
                            setPage(0);
                          }}
                        />
                      </TableCell>
                      <TableCell>
                        <TextField
                          select
                          fullWidth
                          size="small"
                          value={filters.categoryID}
                          onChange={(e) => {
                            setFilters({ ...filters, categoryID: e.target.value, subcategoryID: "" });
                            setPage(0);
                          }}
                        >
                          <MenuItem value="">All</MenuItem>
                          {categories.map((cat) => (
                            <MenuItem key={cat.ID} value={cat.ID}>{cat.Name}</MenuItem>
                          ))}
                        </TextField>
                      </TableCell>
                      <TableCell>
                        <TextField
                          select
                          fullWidth
                          size="small"
                          value={filters.storeID}
                          onChange={(e) => {
                            setFilters({ ...filters, storeID: e.target.value });
                            setPage(0);
                          }}
                        >
                          <MenuItem value="">All</MenuItem>
                          {stores.map((store) => (
                            <MenuItem key={store.ID} value={store.ID}>{store.Name}</MenuItem>
                          ))}
                        </TextField>
                      </TableCell>
                      <TableCell>
                        <TextField
                          select
                          fullWidth
                          size="small"
                          value={filters.subcategoryID}
                          onChange={(e) => {
                            setFilters({ ...filters, subcategoryID: e.target.value });
                            setPage(0);
                          }}
                          // Only enable if a category is selected
                          disabled={!filters.categoryID}
                        >
                          <MenuItem value="">All</MenuItem>
                          {/* Only show subcategories for the selected category */}
                          {allSubcategories
                            .filter((sub) =>
                              filters.categoryID
                                ? String(sub.CategoryID) === String(filters.categoryID)
                                : false
                            )
                            .map((sub) => (
                              <MenuItem key={sub.ID} value={sub.ID}>{sub.Name}</MenuItem>
                            ))}
                        </TextField>
                      </TableCell>
                      <TableCell sx={{ width: 120 }}>
                        <TextField
                          placeholder="Stock"
                          fullWidth
                          size="small"
                          value={filters.stock}
                          onChange={(e) => {
                            setFilters({ ...filters, stock: e.target.value });
                            setPage(0);
                          }}
                        />
                      </TableCell>
                      <TableCell align="center">
                        {/* Search button removed */}
                      </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {products.map((p) => (
                  <TableRow key={p.ID}>
                    <TableCell sx={{ py: 0.5 }}>{p.Name}</TableCell>
                    <TableCell sx={{ py: 0.5 }}>{p.Code}</TableCell>
                    <TableCell sx={{ py: 0.5 }}>{p.Category?.Name}</TableCell>
                    <TableCell sx={{ py: 0.5 }}>{p.Store?.Name}</TableCell>
                    <TableCell sx={{ py: 0.5 }}>{p.Subcategory?.Name || ''}</TableCell>
                    <TableCell sx={{ py: 0.5 }}>{p.Stock ?? ''}</TableCell>
                    <TableCell align="center">
                      <Box display="flex" flexDirection="row" justifyContent="center" alignItems="center" gap={1}>
                        <IconButton onClick={() => navigate(`/products/${p.ID}`)}><Visibility /></IconButton>
                        <IconButton onClick={() => navigate(`/products/${p.ID}/edit`)}><Edit /></IconButton>
                      </Box>
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