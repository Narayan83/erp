import {
  Box,
  Grid,
  Typography,
  Button,
  Divider,
  Table,
  TableHead,
  TableBody,
  TableCell,
  TableRow,
  IconButton,
  Avatar,
  Stack,
} from "@mui/material";
import { Edit, Delete } from "@mui/icons-material";
import { DynamicDialog } from "../../../CommonComponents/DynamicDialog";

import axios from "axios";
import { useState } from "react";
import { BASE_URL } from "../../../Config"; // Import BASE_URL
import { useNavigate } from "react-router-dom"; // Add this import for navigation

export default function ReviewStep({
  product,
  variants,
  onBack,
  onSubmit,
  onEditVariant,
  onRemoveVariant,
  onReset,
}) {
  //   const handleFinalSubmit = async () => {
  //   try {
  //     const payload = {
  //       ...product,
  //       variants, // already structured as expected by backend
  //       tagIDs: product.tagIDs || [], // if you support tags
  //     };

  //     const res = await axios.post(`${BASE_URL}/api/products`, payload);
  //     console.log("Submitted successfully:", res.data);

  //     onSubmit(); // proceed to success screen or reset
  //   } catch (error) {
  //     console.error("Submission failed:", error.response?.data || error.message);
  //     alert("Product submission failed. Please try again.");
  //   }
  // };

  const [dialogOpen, setDialogOpen] = useState(false);
  const navigate = useNavigate(); // Add this to enable navigation

  const handleFinalSubmit = async () => {
    try {
      const formData = new FormData();

      // Transform productData to match backend's capitalized field names
      const productData = { ...product };
      delete productData.variants;
      delete productData.tagIDs;
      const transformedProduct = {
        Name: productData.name || '',
        Code: productData.code || '',
        HsnID: productData.hsnID ? Number(productData.hsnID) : null,
        HsnSacCode: productData.hsnSacCode || '',
        Importance: productData.importance || '',
        ProductType: productData.productType || '',
        MinimumStock: productData.minimumStock ? Number(productData.minimumStock) : 0,
        CategoryID: productData.categoryID ? Number(productData.categoryID) : null,
        SubcategoryID: productData.subcategoryID ? Number(productData.subcategoryID) : null,
        UnitID: productData.unitID ? Number(productData.unitID) : null,
        ProductMode: productData.product_mode || '',
        StoreID: productData.storeID ? Number(productData.storeID) : null,
        TaxID: productData.taxID ? Number(productData.taxID) : null,
        GstPercent: productData.gstPercent ? Number(productData.gstPercent) : 0,
        Description: productData.description || '',
        InternalNotes: productData.internalNotes || '',
        IsActive: productData.isActive !== undefined ? Boolean(productData.isActive) : true,
      };

      console.log("Transformed product JSON:", JSON.stringify(transformedProduct));
      formData.append("product", JSON.stringify(transformedProduct));

      // Transform variants to match backend's capitalized field names
      const transformedVariants = variants.map(({ images, ...v }) => ({
        Color: v.color,
        Size: v.size,
        SKU: v.sku,
        Barcode: v.barcode,
        PurchaseCost: v.purchaseCost,
        StdSalesPrice: v.stdSalesPrice,
        Stock: v.stock,
        LeadTime: v.leadTime,
        IsActive: v.isActive,
        // Don't include Images here - they'll be handled separately
      }));

      formData.append("variants", JSON.stringify(transformedVariants));
      formData.append("tagIDs", JSON.stringify(product.tagIDs || []));

      // Improved image handling - log each image for debugging
      console.log("Appending images to FormData:");
      variants.forEach((variant, variantIndex) => {
        if (Array.isArray(variant.images)) {
          console.log(`Variant ${variant.sku} has ${variant.images.length} images`);
          
          variant.images.forEach((file, fileIndex) => {
            if (file instanceof File) {
              const fieldName = `images_${variant.sku}`;
              console.log(`Adding File: ${fieldName}, name: ${file.name}, size: ${file.size}, type: ${file.type}`);
              formData.append(fieldName, file);
            } else if (typeof file === 'string') {
              console.log(`String image for ${variant.sku}: ${file}`);
              // Keep the existing image reference in a separate field
              formData.append(`variant_images`, JSON.stringify({
                sku: variant.sku,
                image: file
              }));
            } else {
              console.log(`Unknown image type for ${variant.sku}:`, typeof file, file);
            }
          });
        }
      });

      // Debug the form submission process more thoroughly
      console.log("Debug product submission:");
      console.log("- Product data:", transformedProduct);
      console.log("- Variants:", transformedVariants);
      
      // Add special debug field to help track submission on backend
      formData.append("_debug", "true");

      console.log("Submitting product with FormData");
      const res = await axios.post(`${BASE_URL}/api/products`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      console.log("Submitted successfully:", res.data);
      setDialogOpen(true); // Show success dialog
    } catch (error) {
      console.error("Submission failed:", error);
      console.error("Error details:", error.response?.data);
      alert(`Product submission failed: ${error.message}`);
    }
  };

  // const resetForm = () => {
  //   setProductData(null);
  //   setVariants([]);
  //   setActiveStep(0); // Reset to step 1
  // };

  return (
    <Box>
      <h5 style={{ marginBottom: "20px" }}>
        Review Product
      </h5>
      <Box mb={2}>
  <Grid container spacing={0}>
    {[
      { label: "Name", value: product.name },
      { label: "Code", value: product.code },
      { label: "HSN/SAC", value: product.hsnSacCode },
      { label: "GST %", value: `${product.gstPercent}%` },
      { label: "Importance", value: product.importance },
      { label: "Product Type", value: product.productType },
      { label: "Minimum Stock", value: product.minimumStock },
      { label: "Store Id", value: product.storeID },
      { label: "Unit Id", value: product.unitID },
      { label: "Description", value: product.description },
      { label: "Internal Notes", value: product.internalNotes },
    ].map((item, idx) => (
      <Grid key={idx} item xs={12} sm={6}>
        <Box border={1} borderColor="grey.300" borderRadius={1} p={1.5}>
          <Typography><strong>{item.label}:</strong> {item.value}</Typography>
        </Box>
      </Grid>
    ))}
  </Grid>
</Box>
      <Divider sx={{ my: 2 }} />

     <h5 style={{ marginBottom: "20px" }}>
        Product Variants
      </h5>

      <Table size="small">
        <TableHead>
          <TableRow>
            <TableCell>SKU</TableCell>
            <TableCell>Color</TableCell>
            <TableCell>Size</TableCell>
            <TableCell>Barcode</TableCell>
            <TableCell>Purchase Cost</TableCell>
            <TableCell>Sales Price</TableCell>
            <TableCell>Stock</TableCell>
            <TableCell>Lead Time</TableCell>
            <TableCell>Images</TableCell>
            <TableCell>Status</TableCell>
            <TableCell align="center">Actions</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {variants.map((v, i) => (
            <TableRow key={i} sx={{ opacity: v.isActive === false ? 0.5 : 1 }}>
              <TableCell>{v.sku}</TableCell>
              <TableCell>
                <Box
                  sx={{
                    width: 20,
                    height: 20,
                    borderRadius: "50%",
                    backgroundColor: v.color,
                    display: "inline-block",
                    marginRight: 1,
                    border: "1px solid #ccc",
                  }}
                />{" "}
                {v.color}
              </TableCell>
              <TableCell>{v.size}</TableCell>
              <TableCell>{v.barcode}</TableCell>
              <TableCell>₹{v.purchaseCost}</TableCell>
              <TableCell>₹{v.stdSalesPrice}</TableCell>
              <TableCell>{v.stock}</TableCell>
              <TableCell>{v.leadTime} days</TableCell>
              <TableCell>
                {Array.isArray(v.images) && v.images.length > 0 ? (
                  <Stack direction="row" spacing={1}>
                    {v.images.map((img, j) => {
                      // Enhanced debugging to show complete image path
                      const imgPath = typeof img === "string" 
                        ? `${BASE_URL}/uploads/${img}` 
                        : URL.createObjectURL(img);
                      
                      console.log(`Image ${j} for variant ${v.sku}:`, {
                        original: img,
                        type: typeof img,
                        fullPath: imgPath,
                        isFile: img instanceof File
                      });
                      
                      // Try direct URL if it's a string that looks like a URL
                      const isDirectUrl = typeof img === "string" && (
                        img.startsWith("http://") || 
                        img.startsWith("https://") || 
                        img.startsWith("data:")
                      );
                      
                      return (
                        <Box key={j} position="relative">
                          <img
                            src={isDirectUrl ? img : imgPath}
                            alt={`variant-${i}-img-${j}`}
                            style={{
                              width: 40,
                              height: 40,
                              objectFit: 'cover',
                              borderRadius: 4,
                              border: '1px solid #ccc',
                            }}
                            onError={(e) => {
                              console.error(`Failed to load image:`, {
                                src: e.target.src,
                                originalImg: img
                              });
                              e.target.src = 'https://via.placeholder.com/40?text=Error';
                            }}
                          />
                        </Box>
                      );
                    })}
                  </Stack>
                ) : (
                  "—"
                )}
              </TableCell>
              <TableCell>{v.isActive ? "Active" : "Inactive"}</TableCell>
              <TableCell align="center">
                <IconButton
                  size="small"
                  color="primary"
                  onClick={() => onEditVariant(i)}
                >
                  <Edit fontSize="small" />
                </IconButton>
                <IconButton
                  size="small"
                  color="error"
                  onClick={() => onRemoveVariant(i)}
                >
                  <Delete fontSize="small" />
                </IconButton>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <Box mt={4} display="flex" justifyContent="space-between">
        <Button onClick={onBack}>Back</Button>
        <Button variant="contained" onClick={handleFinalSubmit}>
          Submit
        </Button>
      </Box>

      <DynamicDialog
        open={dialogOpen}
        type="success"
        title="Product Added"
        message="The product and its variants were successfully saved."
        onClose={() => setDialogOpen(false)}
        actions={[
          {
            label: "➕ Add Another",
            onClick: () => {
              setDialogOpen(false);
              onReset(); // Reset form for new entry
            },
            variant: "outlined",
          },
          {
            label: "View Products",
            onClick: () => {
              setDialogOpen(false);
              navigate("/ProductMaster"); // Now works with the added import
            },
            variant: "contained",
          },
        ]}
      />
    </Box>
  );
}
