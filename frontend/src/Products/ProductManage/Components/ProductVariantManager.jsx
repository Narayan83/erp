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

  // Add a utility function to inspect backend response
  const inspectProduct = (product) => {
    if (!product || !product.Variants) return;
    
    console.log(`Product ${product.ID} has ${product.Variants.length} variants`);
    product.Variants.forEach((v, idx) => {
      console.log(`Variant ${idx} (${v.SKU}):`, {
        hasImages: Array.isArray(v.Images) && v.Images.length > 0,
        imageCount: Array.isArray(v.Images) ? v.Images.length : 0,
        images: v.Images
      });
    });
  };

  // Add this to useEffect after loading the product
  useEffect(() => {
    loadProduct();
    axios.get(`${BASE_URL}/api/sizes`)
      .then(res => setSizes(res.data.data || []))
      .catch(() => alert("Failed to load sizes"));
  }, [id]);

  // Add a new function to be called after product loads
  const loadProduct = () => {
    axios
      .get(`${BASE_URL}/api/products/${id}`)
      .then((res) => {
        setProduct(res.data);
        inspectProduct(res.data); // Inspect the loaded product
      })
      .catch((err) => {
        console.error("Failed to load product:", err);
        alert("Failed to load product");
      });
  };

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

  const handleDelete = async (idx) => {
    const variant = product.Variants[idx];
    if (!variant || !variant.ID) {
      console.error("Cannot delete variant: missing ID");
      alert("Cannot delete variant: missing ID");
      return;
    }

    // Confirm deletion
    if (!window.confirm(`Are you sure you want to delete variant with SKU: ${variant.SKU}?`)) {
      return;
    }

    try {
      // Make API call to delete from backend
      await axios.delete(`${BASE_URL}/api/product_variants/${variant.ID}`);

      // Update local state only if API call succeeds
      const updatedVariants = [...product.Variants];
      updatedVariants.splice(idx, 1);
      setProduct({ ...product, Variants: updatedVariants });

      console.log(`Successfully deleted variant ${variant.SKU}`);
    } catch (err) {
      console.error("Failed to delete variant:", err.response?.data || err.message);
      alert(`Failed to delete variant: ${err.response?.data?.error || err.message}`);
    }
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
                  {Array.isArray(v.Images) && v.Images.length > 0 ? (
                    <Box display="flex" gap={1} alignItems="center">
                      {v.Images.slice(0, 3).map((img, i) => {
                        // Enhanced debugging for image paths
                        // If img is an absolute URL, use as is; else construct relative path
                        let imgSrc = '';
                        if (typeof img === 'string' && (img.startsWith('http://') || img.startsWith('https://') || img.startsWith('data:'))) {
                          imgSrc = img;
                        } else if (typeof img === 'string' && img.trim() !== '') {
                          // If already starts with uploads/, prepend BASE_URL/; else prepend BASE_URL/uploads/
                          // Also replace backslashes with forward slashes for URL safety
                          const normalizedImg = img.replace(/\\/g, '/');
                          if (normalizedImg.startsWith('uploads/')) {
                            imgSrc = `${BASE_URL}/${normalizedImg}`;
                          } else {
                            imgSrc = `${BASE_URL}/uploads/${normalizedImg}`;
                          }
                        } else {
                          imgSrc = 'https://via.placeholder.com/40?text=No+Image';
                        }
                        
                        console.log(`Rendering image ${i} for variant ${v.SKU}:`, {
                          original: img,
                          fullPath: imgSrc
                        });
                        
                        return (
                          <img
                            key={i}
                            src={imgSrc}
                            alt={`variant-${v.ID || i}-img-${i}`}
                            style={{
                              width: 40,
                              height: 40,
                              objectFit: 'cover',
                              borderRadius: 4,
                              border: '1px solid #ccc',
                            }}
                            onLoad={() => console.log(`Successfully loaded image ${i} for ${v.SKU}`)}
                            onError={(e) => {
                              console.error(`Failed to load image for ${v.SKU}:`, {
                                src: e.target.src,
                                originalImg: img,
                                variant: v.SKU
                              });
                              
                              // Try alternative paths if the first one fails
                              if (typeof img === 'string' && !imgSrc.startsWith('http') && !imgSrc.startsWith('data:')) {
                                // Try a few alternative paths
                                const altPaths = [
                                  `/uploads/${img.replace(/\\/g, '/')}`,
                                  `${window.location.origin}/uploads/${img.replace(/\\/g, '/')}`,
                                  `${BASE_URL}${img.startsWith('/') ? '' : '/'}${img.replace(/\\/g, '/')}`
                                ];
                                
                                const tryNextPath = (pathIndex) => {
                                  if (pathIndex >= altPaths.length) {
                                    // If all alternatives fail, use placeholder
                                    e.target.src = 'https://via.placeholder.com/40?text=Not+Found';
                                    return;
                                  }
                                  
                                  console.log(`Trying alternative path ${pathIndex+1}/${altPaths.length}: ${altPaths[pathIndex]}`);
                                  e.target.src = altPaths[pathIndex];
                                  e.target.onerror = () => tryNextPath(pathIndex + 1);
                                };
                                
                                tryNextPath(0);
                              } else {
                                e.target.src = 'https://via.placeholder.com/40?text=Error';
                              }
                            }}
                          />
                        );
                      })}
                      {v.Images.length > 3 && <Typography variant="caption">+{v.Images.length - 3} more</Typography>}
                    </Box>
                  ) : (
                    <Typography variant="caption" color="textSecondary">No images</Typography>
                  )}
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
