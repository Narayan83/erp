import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  Button, Grid, TextField, MenuItem, Checkbox, FormControlLabel
} from "@mui/material";
import { useForm } from "react-hook-form";
import { useEffect, useState } from "react";
import axios from "axios";
import { BASE_URL } from "../../../Config"; // adjust if needed

export default function VariantFormDialog({ open, onClose, onSave, initialData = null, sizes = [] }) {
  const { register, handleSubmit, reset } = useForm();
  const [imagesPreview, setImagesPreview] = useState([]);
  const [imageFiles, setImageFiles] = useState([]);
  const [sizeOptions, setSizeOptions] = useState([]);
  const [sizesLoading, setSizesLoading] = useState(false);
  const [sizesError, setSizesError] = useState(null);

  useEffect(() => {
    if (!open) return;
    const fetchAllSizes = async () => {
      setSizesLoading(true);
      setSizesError(null);
      try {
        if (Array.isArray(sizes) && sizes.length > 0) {
          setSizeOptions(sizes);
        } else {
          const res = await axios.get(`${BASE_URL}/api/sizes`, { params: { page: 1, limit: 500, filter: "" } });
          setSizeOptions(res.data?.data || []);
        }
      } catch (e) {
        setSizesError("Failed to load sizes");
        setSizeOptions([]);
      } finally {
        setSizesLoading(false);
      }
    };
    fetchAllSizes();
  }, [open, sizes]);

  useEffect(() => {
    if (initialData) {
      reset(initialData);
      setImagesPreview(initialData.images || []);
    } else {
      reset();
      setImagesPreview([]);
    }
  }, [initialData, open, reset]);

  const onSubmit = (data) => {
    const formData = {
      ...data,
      images: imageFiles,
      isActive: data.isActive || false,
    };
    onSave(formData);
    reset();
    setImageFiles([]);
    setImagesPreview([]);
  };

  const handleImageUpload = (e) => {
    const files = Array.from(e.target.files);
    setImageFiles(files);
    setImagesPreview(files.map((file) => file.name));
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
                helperText={sizesError || ""}
                error={Boolean(sizesError)}
              >
                <MenuItem value="" disabled>
                  {sizesLoading ? "Loading sizes..." : "Select Size"}
                </MenuItem>
                {!sizesLoading && sizeOptions.map((size) => (
                  <MenuItem key={size.id} value={size.code}>
                    {size.name} {size.code ? `(${size.code})` : ""}
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
              <TextField label="Purchase Cost" type="number" fullWidth size="small" {...register("purchaseCost", { valueAsNumber: true })} />
            </Grid>
            <Grid item xs={6}>
              <TextField label="Sales Price" type="number" fullWidth size="small" {...register("stdSalesPrice", { valueAsNumber: true })} />
            </Grid>
            <Grid item xs={6}>
              <TextField label="Stock" type="number" fullWidth size="small" {...register("stock", { valueAsNumber: true })} />
            </Grid>
            <Grid item xs={6}>
              <TextField label="Lead Time (days)" type="number" fullWidth size="small" {...register("leadTime", { valueAsNumber: true })} />
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

