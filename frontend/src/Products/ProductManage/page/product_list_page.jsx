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
  Dialog,           // added
  DialogTitle,      // added
  DialogContent,    // added
  DialogActions,    // added
  Divider,          // added
  List,             // added
  ListItem,         // added
  ListItemText      // added
} from "@mui/material";
import { Edit, Delete, Visibility, ArrowUpward, ArrowDownward, ViewColumn, GetApp, Publish } from "@mui/icons-material";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { BASE_URL } from "../../../Config";
import * as XLSX from 'xlsx'; // added for Excel export

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

const ProductTableBody = memo(function ProductTableBody({ products, navigate, loading, visibleColumns, onView }) {
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
          {visibleColumns.stock && (
            // show common fallback fields for stock if p.Stock is not present
            <TableCell sx={{ py: 0.5 }}>
              {p.Stock ?? p.StockQuantity ?? p.stock ?? p.quantity ?? p.qty ?? ''}
            </TableCell>
          )}
          <TableCell align="center">
            <Box display="flex" justifyContent="center" alignItems="center" gap={1}>
              {/* View now uses onView callback to open read-only dialog */}
              <IconButton onClick={() => onView && onView(p.ID)}><Visibility /></IconButton>
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
  visibleColumns,
  handleExport // added prop for export handler
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
        <Box display="flex" justifyContent="center" alignItems="center" gap={1}>
          <Tooltip title="Import">
            <IconButton onClick={() => console.log('Import')}><GetApp /></IconButton>
          </Tooltip>
          <Tooltip title="Export">
            <IconButton onClick={handleExport}><Publish /></IconButton> 
          </Tooltip>
        </Box>
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

  const [selectedProduct, setSelectedProduct] = useState(null); // product details for view
  const [viewOpen, setViewOpen] = useState(false);
  const [viewLoading, setViewLoading] = useState(false);

  const handleOpenView = async (id) => {
    try {
      setViewLoading(true);
      // fetch full product details
      const res = await axios.get(`${BASE_URL}/api/products/${id}`);
      let product = res?.data?.data ?? res?.data ?? null;

      // Helper to extract numeric stock from an object/field
      const extractStock = (obj) => {
        if (obj == null) return null;
        const candidates = [
          obj.Stock,
          obj.StockQuantity,
          obj.stock,
          obj.quantity,
          obj.qty,
          obj.total_stock,
          obj.TotalStock,
        ];
        for (const c of candidates) {
          if (c === 0) return 0;
          if (c == null) continue;
          const n = Number(c);
          if (!Number.isNaN(n)) return n;
        }
        return null;
      };

      // Helper to pick the first available image URL from variant image structures
      const extractImages = (v) => {
        const imgs = v.Images ?? v.images ?? v.ImagesList ?? v.images_list ?? v.pictures ?? v.pictures_list ?? v.photos;
        if (!imgs) {
          // sometimes a single image field exists
          const single = v.Image ?? v.image ?? v.thumbnail ?? v.thumb;
          return single ? [single] : [];
        }
        // normalize array items to strings when possible
        if (Array.isArray(imgs)) {
          return imgs.map(i => {
            if (!i) return null;
            if (typeof i === 'string') return i;
            // common shapes: { url } or { path } or { src }
            return i.url ?? i.src ?? i.path ?? i.file ?? null;
          }).filter(Boolean);
        }
        // if it's an object with url
        if (typeof imgs === 'object' && imgs !== null) {
          return [imgs.url ?? imgs.src ?? imgs.path ?? null].filter(Boolean);
        }
        return [];
      };

      // Normalize variants if present on product or fetch separately
      let variants = product?.Variants ?? product?.variants ?? product?.product_variants ?? null;
      if (!Array.isArray(variants)) {
        try {
          const vr = await axios.get(`${BASE_URL}/api/products/${id}/variants`);
          variants = vr?.data?.data ?? vr?.data ?? [];
        } catch (e) {
          variants = [];
        }
      }

      // map/normalize each variant to required fields
      variants = Array.isArray(variants) ? variants.map((v, idx) => {
        const sku = v.SKU ?? v.Code ?? v.code ?? v.sku ?? v.id ?? v.ID ?? `#${idx + 1}`;
        const barcode = v.Barcode ?? v.barcode ?? v.EAN ?? v.ean ?? v.UPC ?? v.upc ?? '';
        const purchaseCost = v.PurchaseCost ?? v.purchase_cost ?? v.Cost ?? v.cost_price ?? v.CostPrice ?? v.cost ?? null;
        const salesPrice = v.Price ?? v.UnitPrice ?? v.price ?? v.unit_price ?? v.SalesPrice ?? v.sales_price ?? null;
        const stockVal = extractStock(v);
        const leadTime = v.LeadTime ?? v.lead_time ?? v.leadtime ?? v.delivery_days ?? v.lead ?? null;

        // Color / Size may be present as top-level fields or inside Attributes/options
        const attrsSource = v.Attributes ?? v.attributes ?? v.options ?? v.Options ?? v.variables ?? {};
        const color = v.Color ?? v.color ?? attrsSource.Color ?? attrsSource.color ?? attrsSource.color_name ?? '';
        const size = v.Size ?? v.size ?? attrsSource.Size ?? attrsSource.size ?? attrsSource.size_name ?? '';

        const images = extractImages(v);

        return {
          ...v,
          SKU: sku,
          Barcode: barcode,
          PurchaseCost: purchaseCost,
          SalesPrice: salesPrice,
          stock: stockVal,
          LeadTime: leadTime,
          Color: color,
          Size: size,
          Images: images,
        };
      }) : [];

      // Determine product-level stock: prefer explicit fields, else sum variant stocks
      let productStock = extractStock(product);
      if (productStock == null) {
        if (Array.isArray(variants) && variants.length > 0) {
          const s = variants.reduce((acc, v) => {
            const n = extractStock(v);
            return acc + (n != null ? n : 0);
          }, 0);
          productStock = s;
        }
      }

      // Attach normalized fields to product
      const normalizedProduct = {
        ...product,
        Variants: Array.isArray(variants) ? variants : [],
        Stock: productStock,
      };

      setSelectedProduct(normalizedProduct);
      setViewOpen(true);
    } catch (err) {
      console.error("Error fetching product details:", err);
      setSelectedProduct(null);
      setViewOpen(true); // open so user sees message
    } finally {
      setViewLoading(false);
    }
  };

  const handleCloseView = () => {
    setViewOpen(false);
    setSelectedProduct(null);
  };

  const handleExport = async () => {
    try {
      // Fetch all products with current filters and sorting (remove pagination for export)
      const filterParams = Object.entries({
        name: debouncedFilters.name,
        code: debouncedFilters.code,
        category_id: debouncedFilters.categoryID != null ? debouncedFilters.categoryID : undefined,
        store_id: debouncedFilters.storeID != null ? debouncedFilters.storeID : undefined,
        subcategory_id: debouncedFilters.subcategoryID != null ? debouncedFilters.subcategoryID : undefined,
        stock: debouncedFilters.stock !== "" && !isNaN(Number(debouncedFilters.stock)) ? Number(debouncedFilters.stock) : undefined,
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
      
      const res = await axios.get(`${BASE_URL}/api/products`, {
        params: {
          ...filterParams,
          ...sortParams,
          limit: 10000, // large limit to get all
        },
      });
      
      const products = res.data.data || [];
      
      // Flatten data for Excel based on visible columns
      const exportData = products.map(p => {
        const row = {};
        if (visibleColumns.name) row.Name = p.Name;
        if (visibleColumns.code) row.Code = p.Code;
        if (visibleColumns.category) row.Category = p.Category?.Name;
        if (visibleColumns.store) row.Store = p.Store?.Name;
        if (visibleColumns.subcategory) row.Subcategory = p.Subcategory?.Name;
        if (visibleColumns.stock) row.Stock = p.Stock ?? p.StockQuantity ?? p.stock ?? p.quantity ?? p.qty ?? '';
        return row;
      });
      
      // Create worksheet
      const ws = XLSX.utils.json_to_sheet(exportData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Products');
      
      // Download file
      XLSX.writeFile(wb, 'products_export.xlsx');
    } catch (err) {
      console.error('Error exporting products:', err);
      alert('Failed to export products. Please try again.');
    }
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

      {/* Product view dialog (read-only) */}
      <Dialog open={viewOpen} onClose={handleCloseView} maxWidth="lg" fullWidth>
        <DialogTitle>Product Details (Read-only)</DialogTitle>
        <DialogContent dividers>
          {viewLoading ? (
            <Box display="flex" justifyContent="center" p={2}><CircularProgress /></Box>
          ) : selectedProduct ? (
            <Box>
              <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                  <TextField label="Product Name" value={selectedProduct.Name ?? ''} fullWidth size="small" disabled />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField label="Code" value={selectedProduct.Code ?? ''} fullWidth size="small" disabled />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField label="HSN/SAC Code" value={selectedProduct.HsnSacCode ?? selectedProduct.HSN ?? selectedProduct.hsn ?? ''} fullWidth size="small" disabled />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField label="Importance" value={selectedProduct.Importance ?? selectedProduct.importance ?? ''} fullWidth size="small" disabled />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField label="Minimum Stock" value={selectedProduct.MinimumStock ?? selectedProduct.minimumStock ?? ''} fullWidth size="small" disabled />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField label="Category" value={selectedProduct.Category?.Name ?? ''} fullWidth size="small" disabled />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField label="Subcategory" value={selectedProduct.Subcategory?.Name ?? ''} fullWidth size="small" disabled />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField label="Unit" value={selectedProduct.Unit?.Name ?? ''} fullWidth size="small" disabled />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField label="Product Mode" value={selectedProduct.ProductMode ?? selectedProduct.product_mode ?? ''} fullWidth size="small" disabled />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField label="Store" value={selectedProduct.Store?.Name ?? ''} fullWidth size="small" disabled />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField label="Tax" value={selectedProduct.Tax?.Name ? `${selectedProduct.Tax.Name} (${selectedProduct.Tax.Percentage}%)` : ''} fullWidth size="small" disabled />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField label="GST %" value={selectedProduct.GstPercent ?? selectedProduct.gstPercent ?? ''} fullWidth size="small" disabled />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField label="Description" value={selectedProduct.Description ?? selectedProduct.description ?? ''} fullWidth size="small" disabled multiline rows={2} />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField label="Internal Notes" value={selectedProduct.InternalNotes ?? selectedProduct.internalNotes ?? ''} fullWidth size="small" disabled multiline rows={2} />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField label="Is Active" value={typeof selectedProduct.isActive !== 'undefined' ? (selectedProduct.isActive ? 'Yes' : 'No') : ''} fullWidth size="small" disabled />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField label="Stock" value={selectedProduct.Stock ?? ''} fullWidth size="small" disabled />
                </Grid>
              </Grid>
              <Divider sx={{ my: 2 }} />
              <Typography variant="subtitle2">Variants</Typography>
              {Array.isArray(selectedProduct.Variants) && selectedProduct.Variants.length > 0 ? (
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell sx={{fontWeight: 'bold'}}>Color</TableCell>
                      <TableCell sx={{fontWeight: 'bold'}}>Size</TableCell>
                      <TableCell sx={{fontWeight: 'bold'}}>SKU</TableCell>
                      <TableCell sx={{fontWeight: 'bold'}}>Barcode</TableCell>
                      <TableCell sx={{fontWeight: 'bold'}}>Purchase Cost</TableCell>
                      <TableCell sx={{fontWeight: 'bold'}}>Sales Price</TableCell>
                      <TableCell sx={{fontWeight: 'bold'}}>Stock</TableCell>
                      <TableCell sx={{fontWeight: 'bold'}}>Lead Time</TableCell>
                      <TableCell sx={{fontWeight: 'bold'}}>Images</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {selectedProduct.Variants.map((v, i) => (
                      <TableRow key={v.ID ?? v.SKU ?? i}>
                        <TableCell>{v.Color ?? v.ColorCaption ?? ''}</TableCell>
                        <TableCell>{v.Size ?? ''}</TableCell>
                        <TableCell>{v.SKU ?? ''}</TableCell>
                        <TableCell>{v.Barcode ?? ''}</TableCell>
                        <TableCell>{v.PurchaseCost != null ? String(v.PurchaseCost) : ''}</TableCell>
                        <TableCell>{v.SalesPrice != null ? String(v.SalesPrice) : ''}</TableCell>
                        <TableCell>{v.stock != null ? String(v.stock) : ''}</TableCell>
                        <TableCell>{v.LeadTime ?? ''}</TableCell>
                        <TableCell>
                          <Box display="flex" gap={1} alignItems="center">
                            {(Array.isArray(v.Images) && v.Images.length > 0) ? v.Images.slice(0,3).map((img, idx) => (
                              <img key={idx} src={img} alt={`img-${idx}`} style={{ width: 48, height: 48, objectFit: 'cover', borderRadius: 4 }} />
                            )) : <Typography variant="caption" color="textSecondary">No images</Typography>}
                          </Box>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <Typography color="textSecondary">No variants available for this product.</Typography>
              )}

              <Divider />
            </Box>
          ) : (
            <Typography color="textSecondary">No product data available.</Typography>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseView}>Close</Button>
        </DialogActions>
      </Dialog>

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
                handleExport={handleExport} // added prop
              />
            </TableHead>
            {/* UPDATED: pass visibleColumns into body and onView handler */}
            <ProductTableBody 
              products={products} 
              navigate={navigate} 
              loading={loading} 
              visibleColumns={visibleColumns}
              onView={handleOpenView}
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