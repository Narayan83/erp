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
import { BASE_URL } from "../../../Config"; // adjust if needed

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

  const handleFinalSubmit = async () => {
    try {
      const formData = new FormData();

      const productData = { ...product };
      delete productData.variants;
      delete productData.tagIDs;

      formData.append("product", JSON.stringify(productData));
      formData.append(
        "variants",
        JSON.stringify(variants.map(({ images, ...v }) => v))
      );
      formData.append("tagIDs", JSON.stringify(product.tagIDs || []));

      variants.forEach((variant) => {
        if (Array.isArray(variant.images)) {
          variant.images.forEach((file) => {
            if (file instanceof File) {
              formData.append(`images_${variant.sku}`, file);
            }
          });
        }
      });

      const res = await axios.post(`${BASE_URL}/api/products`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      console.log("Submitted successfully:", res.data);
      setDialogOpen(true); //  show success dialog
    } catch (error) {
      console.error(
        "Submission failed:",
        error.response?.data || error.message
      );
      alert("Product submission failed.");
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
                    {v.images.map((img, j) => (
                      <Avatar
                        key={j}
                        variant="rounded"
                        src={
                          typeof img === "string"
                            ? `/uploads/${img}`
                            : undefined
                        }
                        alt={`variant-${i}-img-${j}`}
                        sx={{ width: 32, height: 32 }}
                      />
                    ))}
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
              navigate("/ProductMaster"); // or your product list route
            },
            variant: "contained",
          },
        ]}
      />
    </Box>
  );
}
