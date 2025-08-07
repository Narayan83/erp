import { useEffect, useState } from "react";
import {
  Typography,
  Box,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Button,
  Divider,
  Paper,
} from "@mui/material";
import { useParams } from "react-router-dom";
import axios from "axios";
import { BASE_URL } from "../../../Config";
import VariantEditDialog from "./VariantEditDialog"; // reuse
import { Edit } from "@mui/icons-material";
import { Delete } from "@mui/icons-material";
import { useNavigate } from "react-router-dom";


export default function ProductVariantManager() {
  const { id } = useParams();
  const [product, setProduct] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editIndex, setEditIndex] = useState(null);
  const [sizes, setSizes] = useState([]);
  const [variantError, setVariantError] = useState(""); // For user-friendly error

  const navigate = useNavigate();

  const loadProduct =()=> {
    axios
      .get(`${BASE_URL}/api/products/${id}`)
        .then((res) => setProduct(res.data))
        .catch(() => alert("Failed to load product"));
  } 
  useEffect(() => {
    loadProduct();
    axios.get(`${BASE_URL}/api/sizes`)
      .then(res => setSizes(res.data.data || []))
      .catch(() => alert("Failed to load sizes"));
  }, [id]);

  const handleSave = async (variant) => {
    setVariantError("");
    // Check for duplicate SKU (ignore current variant if editing)
    const existingSKUs = product.Variants
      .filter((v, idx) => editIndex === null || idx !== editIndex)
      .map(v => v.SKU);
    if (existingSKUs.includes(variant.SKU)) {
      setVariantError("A variant with this SKU already exists. Please use a unique SKU.");
      return;
    }
    try {
      console.log("Saving variant:", variant);
      if (variant.ID) {
        // Existing variant – Update
        await axios.put(`${BASE_URL}/api/product_variants/${variant.ID}`, variant);
      } else {
        //New variant – Insert
        const res = await axios.post(`${BASE_URL}/api/product_variants`, {
          ...variant,
          ProductID: product.ID, // ensure ProductID is passed
        });
        variant = res.data; // update with ID and other backend-populated fields
      }

      // Update local state
      const updatedVariants = [...product.Variants];
      if (editIndex !== null) {
        updatedVariants[editIndex] = variant;
      } else {
        updatedVariants.push(variant);
      }

      setProduct({ ...product, Variants: updatedVariants });
      setDialogOpen(false);
      setEditIndex(null);
    } catch (err) {
      // Backend duplicate error handling
      if (err.response?.data?.error && err.response.data.error.includes('duplicate key value') && err.response.data.error.includes('uni_product_variants_sku')) {
        setVariantError("A variant with this SKU already exists (backend check). Please use a unique SKU.");
      } else {
        console.error("Variant save failed:", err.response?.data || err.message);
        setVariantError("Failed to save variant");
      }
    }
  };

  const handleDelete = (idx) => {
    const updatedVariants = [...product.Variants];
    updatedVariants.splice(idx, 1);
    setProduct({ ...product, Variants: updatedVariants });
  };


  const handleAddClick = () => {
        setEditIndex(null);  
        console.log(editIndex);     // Clear any previous edit index
        setDialogOpen(true);      // Open dialog for adding
    };

  if (!product) return null;

  return (
    <section className="right-content">
      <Paper sx={{ p: 3 }}>
        {variantError && (
          <div style={{ color: 'red', marginBottom: 10 }}>{variantError}</div>
        )}
        <Typography variant="h6">
          Product: {product.Name} ({product.Code})
        </Typography>
        <Typography variant="subtitle2">
          HSN: {product.HsnSacCode}, GST: {product.GstPercent}%
        </Typography>
        <Typography variant="body2">
          Importance: {product.Importance} | Store: {product.Store?.Name}
        </Typography>

        <Divider sx={{ my: 2 }} />

        <Box display="flex" justifyContent="space-between" mb={2}>
          <Typography variant="subtitle1">Product Variants</Typography>
          <Box display="flex" gap={1}>
            <Button variant="contained" onClick={handleAddClick}>
            + Add Variant
            </Button>
            <Button variant="contained" color="warning"  onClick={() => {
               navigate(`/ProductMaster`)
            }} >
                 View  Products
            </Button>
          </Box>
        </Box>

        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Color</TableCell>
              <TableCell>Size</TableCell>
              <TableCell>SKU</TableCell>
              <TableCell>Barcode</TableCell>
              <TableCell>Purchase Cost</TableCell>
              <TableCell>Sales Price</TableCell>
              <TableCell>Stock</TableCell>
              <TableCell>Lead Time</TableCell>
              <TableCell>Images</TableCell>
              <TableCell>Active</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {product.Variants.map((v, idx) => (
              <TableRow key={idx}>
                <TableCell>
                  <Box
                    sx={{
                      width: 20,
                      height: 20,
                      bgcolor: v.Color,
                      borderRadius: 1,
                    }}
                  />
                </TableCell>
                <TableCell>{v.Size}</TableCell>
                <TableCell>{v.SKU}</TableCell>
                <TableCell>{v.Barcode}</TableCell>
                <TableCell>{v.PurchaseCost}</TableCell>
                <TableCell>{v.StdSalesPrice}</TableCell>
                <TableCell>{v.Stock}</TableCell>
                <TableCell>{v.LeadTime}</TableCell>
                <TableCell>
                  {Array.isArray(v.Images) &&
                    v.Images.map((img, i) => <div key={i}>{img}</div>)}
                </TableCell>
                <TableCell>{v.IsActive ? "Yes" : "No"}</TableCell>
                <TableCell>
                  <Button
                    size="small"
                    onClick={() => {
                      setEditIndex(idx);
                      setDialogOpen(true);
                    }}
                  >
                    <Edit fontSize="small" />
                  </Button>
                  <Button
                    size="small"
                    color="error"
                    onClick={() => handleDelete(idx)}
                  >
                    <Delete fontSize="small" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>

        <VariantEditDialog
          open={dialogOpen}
          onClose={() => {
            setDialogOpen(false);
            setEditIndex(null); 
            loadProduct();
          }}
          onSave={handleSave}
          defaultValues={
            editIndex !== null ? product.Variants[editIndex] : null
          }
          sizes={sizes}
        />
      </Paper>
    </section>
  );
}
