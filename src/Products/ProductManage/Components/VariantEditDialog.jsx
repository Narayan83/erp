import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  Button, Grid, TextField, MenuItem, Checkbox, FormControlLabel
} from "@mui/material";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";

const STANDARD_SIZES = ["XS", "S", "M", "L", "XL", "XXL", "Free Size"];

export default function VariantEditDialog({ open, onClose, onSave, defaultValues }) {
  const { register, handleSubmit, reset, setValue } = useForm();
  const [imagesPreview, setImagesPreview] = useState([]);
  const [variantID, setVariantID] = useState(null);
  // Populate form on defaultValues change
  useEffect(() => {
    console.log("defaultValues changed:", defaultValues);
    if (defaultValues) {
       const mappedDefaults = {
        color: defaultValues.Color,
        size: defaultValues.Size,
        sku: defaultValues.SKU,
        barcode: defaultValues.Barcode,
        purchaseCost: defaultValues.PurchaseCost,
        stdSalesPrice: defaultValues.StdSalesPrice,
        stock: defaultValues.Stock,
        leadTime: defaultValues.LeadTime,
        isActive: defaultValues.IsActive ?? true,
        images: defaultValues.Images || [],
     };
     reset(mappedDefaults);
     setImagesPreview(mappedDefaults.images);
     setVariantID(defaultValues.ID || null);
    } else {
     reset({});
     setImagesPreview([]);
     setVariantID(null);
    }
  }, [defaultValues, reset]);

  const handleImageUpload = (e) => {
    const files = Array.from(e.target.files);
    setImagesPreview(files); // Save File objects
  };

  const onSubmit = (data) => {
   const finalData = {
        ID: variantID,
        ...data,
        isActive: data.isActive || false,
        images: imagesPreview.map(file =>
            typeof file === "string" ? file : file.name
        ),
        files: imagesPreview.filter(file => file instanceof File),
        };
    onSave(finalData);
    onClose(); // optionally close
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="md">
      <DialogTitle>Edit Variant</DialogTitle>
      <form onSubmit={handleSubmit(onSubmit)}>
        <DialogContent>
          <Grid container spacing={2}>
            <Grid size={{sm:2,md:2 }} >
              <TextField
                label="Color"
                type="color"
                fullWidth
                size="small"
                defaultValue={defaultValues?.color || "#000000"}
                {...register("color")}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>

            <Grid size={{sm:3,md:4 }}>
              <TextField
                label="Size"
                select
                fullWidth
                size="small"
                defaultValue={defaultValues?.Size || ""}
                {...register("size")}
              >
                {STANDARD_SIZES.map((size) => (
                  <MenuItem key={size} value={size}>{size}</MenuItem>
                ))}
              </TextField>
            </Grid>

            <Grid size={{sm:3,md:4 }}>
              <TextField
                label="SKU"
                fullWidth
                size="small"
                defaultValue={defaultValues?.sku || ""}
                {...register("sku")}
              />
            </Grid>

            <Grid size={{sm:3,md:4 }}>
              <TextField
                label="Barcode"
                fullWidth
                size="small"
                defaultValue={defaultValues?.barcode || ""}
                {...register("barcode")}
              />
            </Grid>

            <Grid size={{sm:3,md:4 }}>
              <TextField
                label="Purchase Cost"
                type="number"
                fullWidth
                size="small"
                defaultValue={defaultValues?.purchaseCost || ""}
                {...register("purchaseCost", { valueAsNumber: true })}
              />
            </Grid>

            <Grid size={{sm:3,md:4 }}>
              <TextField
                label="Sales Price"
                type="number"
                fullWidth
                size="small"
                defaultValue={defaultValues?.stdSalesPrice || ""}
                {...register("stdSalesPrice", { valueAsNumber: true })}
              />
            </Grid>

            <Grid size={{sm:3,md:4 }}>
              <TextField
                label="Stock"
                type="number"
                fullWidth
                size="small"
                defaultValue={defaultValues?.stock || ""}
                {...register("stock", { valueAsNumber: true })}
              />
            </Grid>

            <Grid size={{sm:3,md:4 }}>
              <TextField
                label="Lead Time (days)"
                type="number"
                fullWidth
                size="small"
                defaultValue={defaultValues?.leadTime || ""}
                {...register("leadTime", { valueAsNumber: true })}
              />
            </Grid>

            <Grid size={{sm:12,md:12 }}>
              <Button variant="outlined" component="label">
                Upload Images
                <input
                  type="file"
                  multiple
                  hidden
                  onChange={handleImageUpload}
                />
              </Button>
              {imagesPreview.length > 0 && (
                <ul style={{ marginTop: 8 }}>
                  {imagesPreview.map((file, i) => (
                    <li key={i}>{file.name || file}</li>
                  ))}
                </ul>
              )}
            </Grid>

            <Grid size={{sm:3,md:4 }}>
              <FormControlLabel
                control={<Checkbox defaultChecked={defaultValues?.isActive} {...register("isActive")} />}
                label="Is Active"
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose}>Cancel</Button>
          <Button type="submit" variant="contained">Save</Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}
