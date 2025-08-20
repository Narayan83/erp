// ProductListPage.jsx
import React, { useEffect, useState, useCallback, memo } from "react";
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
  Popover,
  FormGroup,
  FormControlLabel,
  Checkbox,
  Tooltip,
} from "@mui/material";
import { Edit, Delete, Visibility, ArrowUpward, ArrowDownward, ViewColumn } from "@mui/icons-material";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { BASE_URL } from "../../../Config";

// Improve the normalizeID helper to handle more edge cases
const normalizeID = (val) => {
  if (val === "" || val === null || val === undefined) return null;
  // Try to convert to number, fallback to original value if it fails
  const n = Number(val);
  return Number.isNaN(n) ? val : n; // Return original value if can't convert to number
};

const DisplayPreferences = memo(function DisplayPreferences({ columns, setColumns, anchorEl, open, onClose }) {
  const handleSelectAll = (event) => {
    if (event.target.checked) {
      // If checked, select all columns
      const allSelected = Object.keys(columns).reduce((acc, key) => {
        acc[key] = true;
        return acc;
      }, {});
      setColumns(allSelected);
    } else {
      // If unchecked, deselect all but keep at least one column visible
      const allDeselected = Object.keys(columns).reduce((acc, key) => {
        acc[key] = false;
        return acc;
      }, {});
      // Ensure at least "name" is visible
      allDeselected.name = true;
      setColumns(allDeselected);
    }
  };

  const handleColumnToggle = (columnKey) => (event) => {
    // Count how many columns are currently visible
    const visibleCount = Object.values(columns).filter(Boolean).length;
    
    // If trying to uncheck the last visible column, prevent it
    if (!event.target.checked && visibleCount <= 1 && columns[columnKey]) {
      return;
    }
    
    setColumns({
      ...columns,
      [columnKey]: event.target.checked,
    });
  };

  // Check if all columns are selected
  const allSelected = Object.values(columns).every(Boolean);
  // Check if some but not all columns are selected
  const someSelected = Object.values(columns).some(Boolean) && !allSelected;

  return (
    <Popover
      open={open}
      anchorEl={anchorEl}
      onClose={onClose}
      anchorOrigin={{
        vertical: 'bottom',
        horizontal: 'right',
      }}
      transformOrigin={{
        vertical: 'top',
        horizontal: 'right',
      }}
    >
      <Box sx={{ p: 2, width: 200 }}>
        <Typography variant="subtitle1" gutterBottom>Display Columns</Typography>
        <FormGroup>
          <FormControlLabel
            control={
              <Checkbox 
                checked={allSelected}
                indeterminate={someSelected}
                onChange={handleSelectAll}
                color="primary"
              />
            }
            label="Select All"
          />
          <FormControlLabel
            control={<Checkbox checked={columns.name} onChange={handleColumnToggle('name')} />}
            label="Name"
          />
          <FormControlLabel
            control={<Checkbox checked={columns.code} onChange={handleColumnToggle('code')} />}
            label="Code"
          />
          <FormControlLabel
            control={<Checkbox checked={columns.category} onChange={handleColumnToggle('category')} />}
            label="Category"
          />
          <FormControlLabel
            control={<Checkbox checked={columns.store} onChange={handleColumnToggle('store')} />}
            label="Store"
          />
          <FormControlLabel
            control={<Checkbox checked={columns.subcategory} onChange={handleColumnToggle('subcategory')} />}
            label="Subcategory"
          />
          <FormControlLabel
            control={<Checkbox checked={columns.stock} onChange={handleColumnToggle('stock')} />}
            label="Stock"
          />
        </FormGroup>
      </Box>
    </Popover>
  );
});

const ProductTableBody = memo(function ProductTableBody({ products, navigate, loading, visibleColumns }) {
  // Add extra safety check for null/undefined products
  if (!products) {
    return (
      <TableBody>
        <TableRow>
          <TableCell colSpan={Object.values(visibleColumns).filter(Boolean).length + 1} align="center" sx={{ py: 3 }}>
            <Typography color="error">Error loading products</Typography>
          </TableCell>
        </TableRow>
      </TableBody>
    );
  }
  
  // When loading & no products yet, show placeholder rows
  if (loading && products.length === 0) {
    return (
      <TableBody>
        <TableRow>
          <TableCell colSpan={Object.values(visibleColumns).filter(Boolean).length + 1} align="center" sx={{ py: 4 }}>
            <CircularProgress size={28} />
          </TableCell>
        </TableRow>
      </TableBody>
    );
  }
  return (
    <TableBody>
      {products.map((p) => (
        <TableRow key={p.ID}>
          {visibleColumns.name && <TableCell sx={{ py: 0.5 }}>{p.Name}</TableCell>}
          {visibleColumns.code && <TableCell sx={{ py: 0.5 }}>{p.Code}</TableCell>}
          {visibleColumns.category && <TableCell sx={{ py: 0.5 }}>{p.Category?.Name}</TableCell>}
          {visibleColumns.store && <TableCell sx={{ py: 0.5 }}>{p.Store?.Name}</TableCell>}
          {visibleColumns.subcategory && <TableCell sx={{ py: 0.5 }}>{p.Subcategory?.Name || ''}</TableCell>}
          {visibleColumns.stock && <TableCell sx={{ py: 0.5 }}>{p.Stock ?? ''}</TableCell>}
          <TableCell align="center">
            <Box display="flex" justifyContent="center" alignItems="center" gap={1}>
              <IconButton onClick={() => navigate(`/products/${p.ID}`)}><Visibility /></IconButton>
              <IconButton onClick={() => navigate(`/products/${p.ID}/edit`)}><Edit /></IconButton>
            </Box>
          </TableCell>
        </TableRow>
      ))}
      {loading && products.length > 0 && (
        <TableRow>
          <TableCell colSpan={Object.values(visibleColumns).filter(Boolean).length + 1} align="center" sx={{ py: 1 }}>
            <CircularProgress size={20} />
          </TableCell>
        </TableRow>
      )}
      {(!loading && products.length === 0) && (
        <TableRow>
          <TableCell colSpan={Object.values(visibleColumns).filter(Boolean).length + 1} align="center" sx={{ py: 3 }}>No products found.</TableCell>
        </TableRow>
      )}
    </TableBody>
  );
});

// Memoized filters row so product list updates do not re-render inputs
const FiltersRow = memo(function FiltersRow({
  inputFilters,
  setInputFilters,
  filters,
  setFilters,
  categories,
  stores,
  allSubcategories,
  setPage,
  visibleColumns
}) {
  // Log for debugging
  console.log('Categories:', categories.map(c => ({ id: c.ID, name: c.Name })));
  
  return (
    <TableRow>
      {visibleColumns.name && (
        <TableCell>
          <TextField
            placeholder="Search Name"
            fullWidth
            size="small"
            value={inputFilters.name}
            onChange={(e) => setInputFilters(f => ({ ...f, name: e.target.value }))}
          />
        </TableCell>
      )}
      {visibleColumns.code && (
        <TableCell>
          <TextField
            placeholder="Code"
            fullWidth
            size="small"
            value={inputFilters.code}
            onChange={(e) => setInputFilters(f => ({ ...f, code: e.target.value }))}
          />
        </TableCell>
      )}
      {visibleColumns.category && (
        <TableCell>
          <TextField
            select
            fullWidth
            size="small"
            value={filters.categoryID != null ? filters.categoryID : ""}
            onChange={(e) => {
              const val = e.target.value === "" ? null : e.target.value;
              console.log(`Selected category: ${val}`);
              setFilters({ ...filters, categoryID: val, subcategoryID: null });
              setPage(0);
            }}
          >
            <MenuItem value="">All</MenuItem>
            {categories.map(c => (
              <MenuItem key={c.ID} value={c.ID}>{c.Name}</MenuItem>
            ))}
          </TextField>
        </TableCell>
      )}
      {visibleColumns.store && (
        <TableCell>
          <TextField
            select
            fullWidth
            size="small"
            value={filters.storeID != null ? filters.storeID : ""}
            onChange={(e) => {
              const val = e.target.value === "" ? null : Number(e.target.value);
              setFilters({ ...filters, storeID: val });
              setPage(0);
            }}
          >
            <MenuItem value="">All</MenuItem>
            {stores.map(s => <MenuItem key={s.ID} value={s.ID}>{s.Name}</MenuItem>)}
          </TextField>
        </TableCell>
      )}
      {visibleColumns.subcategory && (
        <TableCell>
          <TextField
            select
            fullWidth
            size="small"
            value={filters.subcategoryID != null ? filters.subcategoryID : ""}
            onChange={(e) => {
              const val = e.target.value === "" ? null : e.target.value;
              console.log(`Selected subcategory: ${val}`);
              setFilters({ ...filters, subcategoryID: val });
              setPage(0);
            }}
            disabled={filters.categoryID == null}
          >
            <MenuItem value="">All</MenuItem>
            {/* Safely filter subcategories */}
            {allSubcategories
              .filter(sub => {
                // More lenient comparison that handles both string and number IDs
                if (!filters.categoryID) return false;
                const catID = filters.categoryID.toString();
                const subCatID = sub.CategoryID?.toString();
                return catID === subCatID;
              })
              .map(sub => (
                <MenuItem key={sub.ID} value={sub.ID}>{sub.Name}</MenuItem>
              ))
            }
          </TextField>
        </TableCell>
      )}
      {visibleColumns.stock && (
        <TableCell sx={{ width: 120 }}>
          <TextField
            placeholder="Stock"
            fullWidth
            size="small"
            value={inputFilters.stock}
            onChange={(e) => setInputFilters(f => ({ ...f, stock: e.target.value }))}
          />
        </TableCell>
      )}
      <TableCell align="center">
        {/* no button (auto) */}
      </TableCell>
    </TableRow>
  );
});

export default function ProductListPage() {
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [stores, setStores] = useState([]);
  const [allSubcategories, setAllSubcategories] = useState([]);
  // Replace initial filters (use null for IDs)
  const [filters, setFilters] = useState({ name: "", code: "", categoryID: null, storeID: null, subcategoryID: null, stock: "" });
  // NEW: local input state to avoid re-fetch on every keystroke
  const [inputFilters, setInputFilters] = useState({ name: "", code: "", stock: "" });
  const [page, setPage] = useState(0);
  const [limit, setRowsPerPage] = useState(10);
  const [totalItems, setTotalItems] = useState(0);
  const [loading, setLoading] = useState(false);
  // Sorting state for Name and Stock columns
  const [nameSort, setNameSort] = useState(null); // null | 'asc' | 'desc'
  const [stockSort, setStockSort] = useState(null); // null | 'asc' | 'desc'
  
  // FIXED: Initialize debouncedFilters with same values as filters
  const [debouncedFilters, setDebouncedFilters] = useState(filters);

  // New state for display preferences
  const [visibleColumns, setVisibleColumns] = useState(() => {
    // Try to load saved preferences from localStorage
    const savedPreferences = localStorage.getItem('productListColumns');
    if (savedPreferences) {
      try {
        return JSON.parse(savedPreferences);
      } catch (e) {
        console.error('Error parsing saved column preferences', e);
      }
    }
    // Default to all columns visible
    return {
      name: true,
      code: true,
      category: true,
      store: true,
      subcategory: true,
      stock: true
    };
  });
  
  // State for display preferences popover
  const [displayPrefsAnchor, setDisplayPrefsAnchor] = useState(null);

  // Save column preferences to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem('productListColumns', JSON.stringify(visibleColumns));
  }, [visibleColumns]);

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

  // Sync initial values (runs once)
  useEffect(() => {
    setInputFilters({ name: filters.name, code: filters.code, stock: filters.stock });
  }, []); 

  // Debounce typing (name, code, stock) before updating main filters
  useEffect(() => {
    const t = setTimeout(() => {
      setFilters(prev => {
        if (
          prev.name === inputFilters.name &&
          prev.code === inputFilters.code &&
          prev.stock === inputFilters.stock
        ) return prev;
        return { ...prev, name: inputFilters.name, code: inputFilters.code, stock: inputFilters.stock };
      });
      setPage(0);
    }, 400); // typing debounce
    return () => clearTimeout(t);
  }, [inputFilters.name, inputFilters.code, inputFilters.stock]);

  // FIXED: Use the correct debounce implementation
  useEffect(() => {
    // Update debouncedFilters with current filters
    const handler = setTimeout(() => {
      console.log('Updating debounced filters:', filters);
      setDebouncedFilters(filters);
    }, 200);
    return () => clearTimeout(handler);
  }, [filters]);

  // FIXED: Add proper dependency array with debouncedFilters (make sure it's defined)
  useEffect(() => {
    console.log('Fetching products with filters:', debouncedFilters);
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
      // FIXED: Added check to ensure debouncedFilters is defined before using it
      if (!debouncedFilters) {
        console.error('debouncedFilters is undefined');
        return;
      }
      
      // Log categories and selected category for debugging
      console.log(`Current category: ${debouncedFilters.categoryID}, type: ${typeof debouncedFilters.categoryID}`);
      
      // Always send category_id/subcategory_id/store_id as they are (don't force conversion)
      const filterParams = Object.entries({
        name: debouncedFilters.name,
        code: debouncedFilters.code,
        category_id: debouncedFilters.categoryID != null ? debouncedFilters.categoryID : undefined,
        store_id: debouncedFilters.storeID != null ? debouncedFilters.storeID : undefined,
        subcategory_id: debouncedFilters.subcategoryID != null ? debouncedFilters.subcategoryID : undefined,
        stock:
          debouncedFilters.stock !== "" && !isNaN(Number(debouncedFilters.stock))
            ? Number(debouncedFilters.stock)
            : undefined,
      }).reduce((acc, [key, value]) => {
        if (value !== "" && value !== undefined && value !== null) {
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
      
      // Ensure products is always an array
      setProducts(res.data.data || []);
      setTotalItems(res.data.total || 0);
    } catch (err) {
      console.error("Error fetching products:", err);
      // Initialize with empty array instead of null
      setProducts([]);
      setTotalItems(0);
    } finally {
      setLoading(false);
    }
  };

  // handleSearch removed: search is now automatic on filter change

  const handleNameSort = useCallback((direction) => {
    setNameSort(currentSort => currentSort === direction ? null : direction);
    setStockSort(null);
  }, []);

  const handleStockSort = useCallback((direction) => {
    setStockSort(currentSort => currentSort === direction ? null : direction);
    setNameSort(null);
  }, []);

  // Display preferences handlers
  const handleOpenDisplayPrefs = (event) => {
    console.log('Opening display preferences');
    setDisplayPrefsAnchor(event.currentTarget);
  };

  const handleCloseDisplayPrefs = () => {
    console.log('Closing display preferences');
    setDisplayPrefsAnchor(null);
  };

  return (
    <Box p={3}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
        <Typography variant="h5">📦 Product Master</Typography>
        {/* Removed display preferences button from here */}
      </Box>

      {/* Debug message stays */}
      {console.log('Display prefs anchor:', displayPrefsAnchor, 'Open:', Boolean(displayPrefsAnchor))}
      
      <DisplayPreferences 
        columns={visibleColumns}
        setColumns={setVisibleColumns}
        anchorEl={displayPrefsAnchor}
        open={Boolean(displayPrefsAnchor)}
        onClose={handleCloseDisplayPrefs}
      />

      <Paper>
        <TableContainer sx={{ position: 'relative' }}>
          {/* Optional small corner spinner overlay (does not remount inputs) */}
          {loading && (
            <Box position="absolute" top={4} right={8} zIndex={2}>
              <CircularProgress size={18} />
            </Box>
          )}
          <Table size="small">
            <TableHead>
              <TableRow>
                {visibleColumns.name && (
                  <TableCell sx={{fontWeight : "bold"}}>
                    <Box display="flex" alignItems="center" gap={0.5}>
                      Name
                      <IconButton
                        size="small"
                        onClick={() => handleNameSort('asc')}
                        color={nameSort === 'asc' ? 'primary' : 'default'}
                        sx={{ p: 0.25 }}
                      >
                        <ArrowUpward
                          fontSize="inherit"
                          sx={{ color: nameSort === 'asc' ? 'primary.main' : 'inherit', opacity: nameSort === 'asc' ? 1 : 0.5 }}
                        />
                      </IconButton>
                      <IconButton
                        size="small"
                        onClick={() => handleNameSort('desc')}
                        color={nameSort === 'desc' ? 'primary' : 'default'}
                        sx={{ p: 0.25 }}
                      >
                        <ArrowDownward
                          fontSize="inherit"
                          sx={{ color: nameSort === 'desc' ? 'primary.main' : 'inherit', opacity: nameSort === 'desc' ? 1 : 0.5 }}
                        />
                      </IconButton>
                    </Box>
                  </TableCell>
                )}
                {visibleColumns.code && <TableCell sx={{fontWeight : "bold"}}>Code</TableCell>}
                {visibleColumns.category && <TableCell sx={{fontWeight : "bold"}}>Category</TableCell>}
                {visibleColumns.store && <TableCell sx={{fontWeight : "bold"}}>Store</TableCell>}
                {visibleColumns.subcategory && <TableCell sx={{fontWeight : "bold"}}>Subcategory</TableCell>}
                {visibleColumns.stock && (
                  <TableCell sx={{fontWeight : "bold"}}>
                    <Box display="flex" alignItems="center" gap={0.5}>
                      Stock
                      <IconButton
                        size="small"
                        onClick={() => handleStockSort('asc')}
                        color={stockSort === 'asc' ? 'primary' : 'default'}
                        sx={{ p: 0.25 }}
                        aria-label="Sort stock ascending"
                      >
                        <ArrowUpward
                          fontSize="inherit"
                          sx={{ color: stockSort === 'asc' ? 'primary.main' : 'inherit', opacity: stockSort === 'asc' ? 1 : 0.5 }}
                        />
                      </IconButton>
                      <IconButton
                        size="small"
                        onClick={() => handleStockSort('desc')}
                        color={stockSort === 'desc' ? 'primary' : 'default'}
                        sx={{ p: 0.25 }}
                        aria-label="Sort stock descending"
                      >
                        <ArrowDownward
                          fontSize="inherit"
                          sx={{ color: stockSort === 'desc' ? 'primary.main' : 'inherit', opacity: stockSort === 'desc' ? 1 : 0.5 }}
                        />
                      </IconButton>
                    </Box>
                  </TableCell>
                )}
                <TableCell sx={{fontWeight : "bold"}} align="center">Actions</TableCell>
              </TableRow>
              {/* NEW: memoized filters row with visibleColumns prop */}
              <FiltersRow
                inputFilters={inputFilters}
                setInputFilters={setInputFilters}
                filters={filters}
                setFilters={setFilters}
                categories={categories}
                stores={stores}
                allSubcategories={allSubcategories}
                setPage={setPage}
                visibleColumns={visibleColumns}
              />
            </TableHead>
            {/* UPDATED: pass visibleColumns into body */}
            <ProductTableBody 
              products={products} 
              navigate={navigate} 
              loading={loading} 
              visibleColumns={visibleColumns} 
            />
          </Table>
        </TableContainer>
        {/* Modified pagination box to include the display preferences button */}
        <Box p={2} display="flex" justifyContent="space-between" alignItems="center">
          <Box display="flex" gap={2}>
            <Button variant="contained" color="warning" onClick={() => navigate("/ManageProduct")}>+ Add Product</Button>
            <Button 
              variant="outlined" 
              color="primary" 
              startIcon={<ViewColumn />} 
              onClick={handleOpenDisplayPrefs}
              aria-label="Display Preferences"
              size="small"
            >
              Display Preferences
            </Button>
          </Box>
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