import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  Button, Grid, TextField, MenuItem, Checkbox, FormControlLabel, Box, Typography, IconButton
} from "@mui/material";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { Delete } from "@mui/icons-material";
import { BASE_URL } from "../../../Config"; // Import BASE_URL from Config

export default function VariantEditDialog({ open, onClose, onSave, defaultValues, sizes = [] }) {
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
    setImagesPreview(prev => [...prev, ...files]); // Append new files to existing ones
  };

  // Add this function to remove an image from preview
  const removeImage = (index) => {
    setImagesPreview(prev => prev.filter((_, i) => i !== index));
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

  // Add debug utility function
  const debugImage = (file, index) => {
    if (typeof file === 'string') {
      console.log(`Image ${index} (string):`, file);
      console.log(`Full path: ${BASE_URL}/uploads/${file}`);
      
      // Try to fetch the image to verify it exists
      fetch(`${BASE_URL}/uploads/${file}`)
        .then(response => {
          console.log(`Image fetch status for ${file}:`, response.status);
        })
        .catch(err => {
          console.error(`Failed to fetch image ${file}:`, err);
        });
    } else if (file instanceof File) {
      console.log(`Image ${index} (File):`, file.name, file.size, file.type);
    } else {
      console.log(`Image ${index} (unknown type):`, typeof file, file);
    }
  };

  // When component mounts, debug images
  useEffect(() => {
    if (imagesPreview && imagesPreview.length > 0) {
      console.log(`VariantEditDialog has ${imagesPreview.length} images to display`);
      imagesPreview.forEach(debugImage);
    }
  }, [imagesPreview]);

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
                {Array.isArray(sizes) && sizes.length > 0 && sizes.map((size) => (
                  <MenuItem
                    key={size.id}
                    value={size.code}
                  >
                    {size.code}
                  </MenuItem>
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
                <Box display="flex" flexWrap="wrap" gap={1} alignItems="center" mt={1}>
                  {imagesPreview.map((file, i) => {
                    // Try direct URL if it's a string that looks like a URL
                    const isDirectUrl = typeof file === "string" && (
                      file.startsWith("http://") || 
                      file.startsWith("https://") || 
                      file.startsWith("data:")
                    );
                    
                    // Construct path with proper logic
                    let imgPath = '';
                    if (typeof file === 'string') {
                      if (isDirectUrl) {
                        imgPath = file;
                      } else {
                        // If already starts with uploads/, prepend BASE_URL/; else prepend BASE_URL/uploads/
                        // Also replace backslashes with forward slashes for URL safety
                        const normalizedFile = file.replace(/\\/g, '/');
                        if (normalizedFile.startsWith('uploads/')) {
                          imgPath = `${BASE_URL}/${normalizedFile}`;
                        } else {
                          imgPath = `${BASE_URL}/uploads/${normalizedFile}`;
                        }
                      }
                    } else if (file instanceof File) {
                      imgPath = URL.createObjectURL(file);
                    } else {
                      imgPath = 'https://via.placeholder.com/60?text=No+Image';
                    }
                    
                    console.log(`Rendering image ${i}:`, { 
                      file, 
                      type: typeof file,
                      imgPath,
                      isFile: file instanceof File
                    });
                    
                    return (
                      <Box key={i} position="relative">
                        <img
                          src={imgPath}
                          alt={`preview-${i}`}
                          style={{
                            width: 60,
                            height: 60,
                            objectFit: 'cover',
                            borderRadius: 4,
                            border: '1px solid #ccc',
                          }}
                          onError={(e) => {
                            console.error(`Failed to load image:`, {
                              src: e.target.src,
                              originalFile: file,
                              attempt: 'primary'
                            });
                            
                            // Try alternative paths if the main one fails
                            if (typeof file === 'string' && !isDirectUrl) {
                              const altPath = `/uploads/${file.replace(/\\/g, '/')}`; // Try relative path
                              console.log(`Trying alternative path: ${altPath}`);
                              e.target.src = altPath;
                              e.target.setAttribute('data-retry', 'true');
                            } else {
                              e.target.src = 'https://via.placeholder.com/60?text=Not+Found';
                            }
                          }}
                          // Add a second error handler for the alternative path
                          data-original={typeof file === 'string' ? file : 'file-object'}
                        />
                        <IconButton 
                          size="small" 
                          sx={{ 
                            position: 'absolute', 
                            top: -8, 
                            right: -8,
                            backgroundColor: 'rgba(255,255,255,0.8)',
                            '&:hover': { backgroundColor: 'rgba(255,0,0,0.1)' }
                          }}
                          onClick={() => removeImage(i)}
                        >
                          <Delete fontSize="small" />
                        </IconButton>
                      </Box>
                    );
                  })}
                </Box>
              )}
            </Grid>

            <Grid size={{sm:3,md:4 }}>
              <FormControlLabel
                control={<Checkbox defaultChecked={defaultValues?.isActive ?? true} {...register("isActive")} />}
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

