import {
  Button,
  Box,
  Typography,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  IconButton
} from "@mui/material";
import { Edit } from "@mui/icons-material";
import { useState, useEffect } from "react";
import VariantFormDialog from "./VariantFormDialog";
export default function VariantStepForm({ variants, setVariants, onBack, onNext, editIndex, setEditIndex, sizes = [] }) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [initialData, setInitialData] = useState(null);

  // Open dialog in edit mode if index is passed
  useEffect(() => {
    if (editIndex !== null && variants[editIndex]) {
      setInitialData(variants[editIndex]);
      setDialogOpen(true);
    }
  }, [editIndex, variants]);

  const handleSave = (variant) => {
    if (editIndex !== null) {
      // Editing existing
      const updated = [...variants];
      updated[editIndex] = variant;
      setVariants(updated);
      setEditIndex(null);
    } else {
      // Adding new
      setVariants([...variants, variant]);
    }

    setInitialData(null);
    setDialogOpen(false);
  };

  const handleEdit = (index) => {
    setEditIndex(index);
  };

  return (
    <Box>
      <Typography variant="subtitle1">Product Variants</Typography>

      <Button
        onClick={() => {
          setInitialData(null);
          setDialogOpen(true);
        }}
        variant="outlined"
        sx={{ mb: 2 }}
      >
        + Add Variant
      </Button>

      <Table size="small">
        <TableHead>
          <TableRow>
            <TableCell>Color</TableCell>
            <TableCell>Size</TableCell>
            <TableCell>SKU</TableCell>
            <TableCell>Stock</TableCell>
            <TableCell>Action</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {variants.map((v, idx) => (
            <TableRow key={idx}>
              <TableCell>
                <Box
                  sx={{
                    width: 16,
                    height: 16,
                    display: "inline-block",
                    backgroundColor: v.color,
                    border: "1px solid #ccc",
                    borderRadius: "50%",
                    marginRight: 1,
                    verticalAlign: "middle"
                  }}
                />
                {v.color}
              </TableCell>
              <TableCell>{v.size}</TableCell>
              <TableCell>{v.sku}</TableCell>
              <TableCell>{v.stock}</TableCell>
              <TableCell>
                <IconButton size="small" onClick={() => handleEdit(idx)}>
                  <Edit fontSize="small" />
                </IconButton>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <Box mt={2} display="flex" justifyContent="space-between">
        <Button onClick={onBack}>Back</Button>
        <Button variant="contained" onClick={onNext}>Next</Button>
      </Box>

      <VariantFormDialog
        open={dialogOpen}
        onClose={() => {
          setDialogOpen(false);
          setEditIndex(null);
          setInitialData(null);
        }}
        onSave={handleSave}
        initialData={initialData}
        sizes={sizes}
      />
    </Box>
  );
}
