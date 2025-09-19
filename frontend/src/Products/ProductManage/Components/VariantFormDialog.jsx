import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  Button, Grid, TextField, MenuItem, Checkbox, FormControlLabel, Select, FormControl, InputLabel, Autocomplete
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
  const [selectedColor, setSelectedColor] = useState(null);

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
      const colorMatch = materialColors.find(c => c.value === initialData.color);
      setSelectedColor(colorMatch || null);
    } else {
      reset();
      setImagesPreview([]);
      setSelectedColor(null);
    }
  }, [initialData, open, reset]);

  const onSubmit = (data) => {
    const formData = {
      ...data,
      color: selectedColor?.value || '',
      images: imageFiles,
      isActive: data.isActive || false,
    };
    onSave(formData);
    reset();
    setImageFiles([]);
    setImagesPreview([]);
    setSelectedColor(null);
  };

  const handleImageUpload = (e) => {
    const files = Array.from(e.target.files);
    setImageFiles(prev => [...prev, ...files]);
    setImagesPreview(prev => [...prev, ...files.map((file) => file.name)]);
  };

  // Define expanded Material Design colors with shades
  const materialColors = [
    // Red shades
    { name: 'Red 100', value: '#ffcdd2' },
    { name: 'Red 200', value: '#ef9a9a' },
    { name: 'Red 300', value: '#e57373' },
    { name: 'Red 400', value: '#ef5350' },
    { name: 'Red 500', value: '#f44336' },
    { name: 'Red 600', value: '#e53935' },
    { name: 'Red 700', value: '#d32f2f' },
    { name: 'Red 800', value: '#c62828' },
    { name: 'Red 900', value: '#b71c1c' },
    // Pink shades
    { name: 'Pink 100', value: '#fce4ec' },
    { name: 'Pink 200', value: '#f8bbd9' },
    { name: 'Pink 300', value: '#f48fb1' },
    { name: 'Pink 400', value: '#f06292' },
    { name: 'Pink 500', value: '#e91e63' },
    { name: 'Pink 600', value: '#d81b60' },
    { name: 'Pink 700', value: '#c2185b' },
    { name: 'Pink 800', value: '#ad1457' },
    { name: 'Pink 900', value: '#880e4f' },
    // Purple shades
    { name: 'Purple 100', value: '#e1bee7' },
    { name: 'Purple 200', value: '#ce93d8' },
    { name: 'Purple 300', value: '#ba68c8' },
    { name: 'Purple 400', value: '#ab47bc' },
    { name: 'Purple 500', value: '#9c27b0' },
    { name: 'Purple 600', value: '#8e24aa' },
    { name: 'Purple 700', value: '#7b1fa2' },
    { name: 'Purple 800', value: '#6a1b9a' },
    { name: 'Purple 900', value: '#4a148c' },
    // Indigo shades
    { name: 'Indigo 100', value: '#c5cae9' },
    { name: 'Indigo 200', value: '#9fa8da' },
    { name: 'Indigo 300', value: '#7986cb' },
    { name: 'Indigo 400', value: '#5c6bc0' },
    { name: 'Indigo 500', value: '#3f51b5' },
    { name: 'Indigo 600', value: '#3949ab' },
    { name: 'Indigo 700', value: '#303f9f' },
    { name: 'Indigo 800', value: '#283593' },
    { name: 'Indigo 900', value: '#1a237e' },
    // Blue shades
    { name: 'Blue 100', value: '#bbdefb' },
    { name: 'Blue 200', value: '#90caf9' },
    { name: 'Blue 300', value: '#64b5f6' },
    { name: 'Blue 400', value: '#42a5f5' },
    { name: 'Blue 500', value: '#2196f3' },
    { name: 'Blue 600', value: '#1e88e5' },
    { name: 'Blue 700', value: '#1976d2' },
    { name: 'Blue 800', value: '#1565c0' },
    { name: 'Blue 900', value: '#0d47a1' },
    // Light Blue shades
    { name: 'Light Blue 100', value: '#b3e5fc' },
    { name: 'Light Blue 200', value: '#81d4fa' },
    { name: 'Light Blue 300', value: '#4fc3f7' },
    { name: 'Light Blue 400', value: '#29b6f6' },
    { name: 'Light Blue 500', value: '#03a9f4' },
    { name: 'Light Blue 600', value: '#039be5' },
    { name: 'Light Blue 700', value: '#0288d1' },
    { name: 'Light Blue 800', value: '#0277bd' },
    { name: 'Light Blue 900', value: '#01579b' },
    // Cyan shades
    { name: 'Cyan 100', value: '#b2ebf2' },
    { name: 'Cyan 200', value: '#80deea' },
    { name: 'Cyan 300', value: '#4dd0e1' },
    { name: 'Cyan 400', value: '#26c6da' },
    { name: 'Cyan 500', value: '#00bcd4' },
    { name: 'Cyan 600', value: '#00acc1' },
    { name: 'Cyan 700', value: '#0097a7' },
    { name: 'Cyan 800', value: '#00838f' },
    { name: 'Cyan 900', value: '#006064' },
    // Teal shades
    { name: 'Teal 100', value: '#b2dfdb' },
    { name: 'Teal 200', value: '#80cbc4' },
    { name: 'Teal 300', value: '#4db6ac' },
    { name: 'Teal 400', value: '#26a69a' },
    { name: 'Teal 500', value: '#009688' },
    { name: 'Teal 600', value: '#00897b' },
    { name: 'Teal 700', value: '#00796b' },
    { name: 'Teal 800', value: '#00695c' },
    { name: 'Teal 900', value: '#004d40' },
    // Green shades
    { name: 'Green 100', value: '#c8e6c9' },
    { name: 'Green 200', value: '#a5d6a7' },
    { name: 'Green 300', value: '#81c784' },
    { name: 'Green 400', value: '#66bb6a' },
    { name: 'Green 500', value: '#4caf50' },
    { name: 'Green 600', value: '#43a047' },
    { name: 'Green 700', value: '#388e3c' },
    { name: 'Green 800', value: '#2e7d32' },
    { name: 'Green 900', value: '#1b5e20' },
    // Light Green shades
    { name: 'Light Green 100', value: '#dcedc8' },
    { name: 'Light Green 200', value: '#c5e1a5' },
    { name: 'Light Green 300', value: '#aed581' },
    { name: 'Light Green 400', value: '#9ccc65' },
    { name: 'Light Green 500', value: '#8bc34a' },
    { name: 'Light Green 600', value: '#7cb342' },
    { name: 'Light Green 700', value: '#689f38' },
    { name: 'Light Green 800', value: '#558b2f' },
    { name: 'Light Green 900', value: '#33691e' },
    // Lime shades
    { name: 'Lime 100', value: '#f0f4c3' },
    { name: 'Lime 200', value: '#e6ee9c' },
    { name: 'Lime 300', value: '#dce775' },
    { name: 'Lime 400', value: '#d4e157' },
    { name: 'Lime 500', value: '#cddc39' },
    { name: 'Lime 600', value: '#c0ca33' },
    { name: 'Lime 700', value: '#afb42b' },
    { name: 'Lime 800', value: '#9e9d24' },
    { name: 'Lime 900', value: '#827717' },
    // Yellow shades
    { name: 'Yellow 100', value: '#fff9c4' },
    { name: 'Yellow 200', value: '#fff59d' },
    { name: 'Yellow 300', value: '#fff176' },
    { name: 'Yellow 400', value: '#ffee58' },
    { name: 'Yellow 500', value: '#ffeb3b' },
    { name: 'Yellow 600', value: '#fdd835' },
    { name: 'Yellow 700', value: '#f9a825' },
    { name: 'Yellow 800', value: '#f57f17' },
    { name: 'Yellow 900', value: '#ff6f00' },
    // Amber shades
    { name: 'Amber 100', value: '#ffecb3' },
    { name: 'Amber 200', value: '#ffe082' },
    { name: 'Amber 300', value: '#ffd54f' },
    { name: 'Amber 400', value: '#ffca28' },
    { name: 'Amber 500', value: '#ffc107' },
    { name: 'Amber 600', value: '#ffb300' },
    { name: 'Amber 700', value: '#ffa000' },
    { name: 'Amber 800', value: '#ff8f00' },
    { name: 'Amber 900', value: '#ff6f00' },
    // Orange shades
    { name: 'Orange 100', value: '#ffe0b2' },
    { name: 'Orange 200', value: '#ffcc80' },
    { name: 'Orange 300', value: '#ffb74d' },
    { name: 'Orange 400', value: '#ffa726' },
    { name: 'Orange 500', value: '#ff9800' },
    { name: 'Orange 600', value: '#fb8c00' },
    { name: 'Orange 700', value: '#f57c00' },
    { name: 'Orange 800', value: '#ef6c00' },
    { name: 'Orange 900', value: '#e65100' },
    // Deep Orange shades
    { name: 'Deep Orange 100', value: '#ffccbc' },
    { name: 'Deep Orange 200', value: '#ffab91' },
    { name: 'Deep Orange 300', value: '#ff8a65' },
    { name: 'Deep Orange 400', value: '#ff7043' },
    { name: 'Deep Orange 500', value: '#ff5722' },
    { name: 'Deep Orange 600', value: '#f4511e' },
    { name: 'Deep Orange 700', value: '#e64a19' },
    { name: 'Deep Orange 800', value: '#d84315' },
    { name: 'Deep Orange 900', value: '#bf360c' },
    // Brown shades
    { name: 'Brown 100', value: '#d7ccc8' },
    { name: 'Brown 200', value: '#bcaaa4' },
    { name: 'Brown 300', value: '#a1887f' },
    { name: 'Brown 400', value: '#8d6e63' },
    { name: 'Brown 500', value: '#795548' },
    { name: 'Brown 600', value: '#6d4c41' },
    { name: 'Brown 700', value: '#5d4037' },
    { name: 'Brown 800', value: '#4e342e' },
    { name: 'Brown 900', value: '#3e2723' },
    // Grey shades
    { name: 'Grey 100', value: '#f5f5f5' },
    { name: 'Grey 200', value: '#eeeeee' },
    { name: 'Grey 300', value: '#e0e0e0' },
    { name: 'Grey 400', value: '#bdbdbd' },
    { name: 'Grey 500', value: '#9e9e9e' },
    { name: 'Grey 600', value: '#757575' },
    { name: 'Grey 700', value: '#616161' },
    { name: 'Grey 800', value: '#424242' },
    { name: 'Grey 900', value: '#212121' },
    // Blue Grey shades
    { name: 'Blue Grey 100', value: '#cfd8dc' },
    { name: 'Blue Grey 200', value: '#b0bec5' },
    { name: 'Blue Grey 300', value: '#90a4ae' },
    { name: 'Blue Grey 400', value: '#78909c' },
    { name: 'Blue Grey 500', value: '#607d8b' },
    { name: 'Blue Grey 600', value: '#546e7a' },
    { name: 'Blue Grey 700', value: '#455a64' },
    { name: 'Blue Grey 800', value: '#37474f' },
    { name: 'Blue Grey 900', value: '#263238' },
  ];

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="md">
      <DialogTitle>{initialData ? "Edit Variant" : "Add Variant"}</DialogTitle>
      <form onSubmit={handleSubmit(onSubmit)}>
        <DialogContent>
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <Autocomplete
                options={materialColors}
                getOptionLabel={(option) => option.name}
                value={selectedColor}
                onChange={(event, newValue) => setSelectedColor(newValue)}
                renderInput={(params) => <TextField {...params} label="Color" size="small" />}
                renderOption={(props, option) => (
                  <li {...props}>
                    <div style={{ display: 'flex', alignItems: 'center' }}>
                      <div
                        style={{
                          width: 20,
                          height: 20,
                          backgroundColor: option.value,
                          border: '1px solid #ccc',
                          marginRight: 8,
                        }}
                      />
                      {option.name}
                    </div>
                  </li>
                )}
                sx={{ width: 200 }}
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

