import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  Button, Grid, TextField, MenuItem, Checkbox, FormControlLabel
} from "@mui/material";
import { useForm } from "react-hook-form";
import { useEffect, useState } from "react";

import axios from "axios";
import { BASE_URL } from "../../../Config"; // adjust if needed
export default function VariantFormDialog({ open, onClose, onSave, initialData = null, sizes = [] }) {
  // sizes should be passed from parent, fetched from the same source as SizeTable
  const { register, handleSubmit, reset, setValue } = useForm();
  const [imagesPreview, setImagesPreview] = useState([]);
  const [imageFiles, setImageFiles] = useState([]); // store actual File objects

  useEffect(() => {
    if (initialData) {
      reset(initialData);
      setImagesPreview(initialData.images || []);
    } else {
      reset(); // reset to blank when adding
      setImagesPreview([]);
    }
  }, [initialData, open, reset]);

  const onSubmit = (data) => {
  const formData = {
    ...data,
    images: imageFiles, // now sending actual Files, not just names
    isActive: data.isActive || false,
  };
  onSave(formData); // parent handler will collect these and add to FormData
  reset();
  setImageFiles([]);
  setImagesPreview([]);
};

  const handleImageUpload = (e) => {
  const files = Array.from(e.target.files);
  setImageFiles(files);
  setImagesPreview(files.map((file) => file.name)); // for display only
};

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="md">
      <DialogTitle>{initialData ? "Edit Variant" : "Add Variant"}</DialogTitle>
      <form onSubmit={handleSubmit(onSubmit)}>
        <DialogContent>
          <Grid container spacing={2}>
            <Grid item xs={6}>
              <TextField
                label="Color"
                type="color"
                fullWidth
                size="small"
                sx={{ minWidth: 150 }}
                {...register("color")}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={6}>
              <TextField
                label="Size"
                select
                fullWidth
                size="small"
                sx={{ minWidth: 150 }}
                {...register("size")}
                defaultValue=""
              >
                <MenuItem value="" disabled>
                  Select Size
                </MenuItem>
                {Array.isArray(sizes) && sizes.length > 0 && sizes.map((size) => (
                  <MenuItem
                    key={size.id}
                    value={size.code}
                  >
                    {size.name} {size.code ? `(${size.code})` : ''}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid item xs={6}>
              <TextField label="SKU" fullWidth size="small" {...register("sku")} />
            </Grid>
            <Grid item xs={6}>
              <TextField label="Barcode" fullWidth size="small" {...register("barcode")} />
            </Grid>
            <Grid item xs={6}>
              <TextField label="Purchase Cost" type="number" fullWidth size="small" {...register("purchaseCost",{valueAsNumber: true})} />
            </Grid>
            <Grid item xs={6}>
              <TextField label="Sales Price" type="number" fullWidth size="small" {...register("stdSalesPrice",{valueAsNumber: true})} />
            </Grid>
            <Grid item xs={6}>
              <TextField label="Stock" type="number" fullWidth size="small" {...register("stock",{valueAsNumber:true})} />
            </Grid>
            <Grid item xs={6}>
              <TextField label="Lead Time (days)" type="number" fullWidth size="small" {...register("leadTime",{valueAsNumber: true})} />
            </Grid>
            <Grid item xs={12}>
              <Button variant="outlined" component="label">
                Upload Images
                <input type="file" multiple hidden onChange={handleImageUpload} />
              </Button>
                <ul style={{ marginTop: 8 }}>
                  {imageFiles.map((file, i) => (
                    <li key={i}>
                      <img src={URL.createObjectURL(file)} alt={file.name} width="50px" />
                      <p>{file.name}</p>
                    </li>
                  ))}
                </ul>
            </Grid>
            <Grid item xs={12}>
              <FormControlLabel
                control={<Checkbox {...register("isActive")} defaultChecked />}
                label="Is Active"
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose}>Cancel</Button>
          <Button type="submit" variant="contained">
            {initialData ? "Update Variant" : "Add Variant"}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}

