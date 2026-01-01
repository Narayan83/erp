import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import { CircularProgress, Box, Typography, Paper } from "@mui/material";
import ProductEditForm from "../Components/ProductEditForm";
import { BASE_URL } from "../../../config/Config";
import { DynamicDialog } from "../../../CommonComponents/DynamicDialog";

export default function ProductEditPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);

  const [dialogOpen, setDialogOpen] = useState(false);

  useEffect(() => {
    axios.get(`${BASE_URL}/api/products/${id}`)
      .then((res) => {
        setProduct(res.data);
        console.log("=== ProductEditPage - Product loaded ===");
        console.log("Product data:", res.data);
        console.log("CategoryID:", res.data.CategoryID);
        console.log("SubcategoryID:", res.data.SubcategoryID);
        console.log("Subcategory object:", res.data.Subcategory);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Error loading product", err);
        setLoading(false);
      });
  }, [id]);

  const handleUpdate = async (data) => {
    console.log("Sending update data:", data);
    console.log("IsActive in data:", data.IsActive);

    // Sanitize data to ensure correct types and prevent invalid input errors
    const sanitizedData = {
      ...data,
      // Ensure ID is a number if present
      ID: data.ID ? Number(data.ID) : data.ID,
      // Ensure IsActive is a boolean
      IsActive: Boolean(data.IsActive),
      // Ensure numeric fields are numbers or null
      Stock: data.Stock != null ? Number(data.Stock) : null,
      MOQ: data.MOQ != null ? Number(data.MOQ) : null,
      LeadTime: data.LeadTime != null ? Number(data.LeadTime) : null,
      // Trim string fields to remove extra whitespace
      Name: data.Name ? data.Name.trim() : data.Name,
      Code: data.Code ? data.Code.trim() : data.Code,
      Description: data.Description ? data.Description.trim() : data.Description,
      Note: data.Note ? data.Note.trim() : data.Note,
      // Ensure category/store IDs are numbers or null
      CategoryID: data.CategoryID != null ? Number(data.CategoryID) : null,
      StoreID: data.StoreID != null ? Number(data.StoreID) : null,
      SubcategoryID: data.SubcategoryID != null ? Number(data.SubcategoryID) : null,
      // Ensure tag IDs are sent using the lowercase key expected by backend
      tagIDs: Array.isArray(data.TagIDs)
        ? data.TagIDs.map(id => Number(id))
        : Array.isArray(data.tagIDs)
        ? data.tagIDs.map(id => Number(id))
        : [],
      // Add more sanitization as needed based on your product schema
    };

    console.log("Sanitized update data:", sanitizedData);

    try {
      const response = await axios.put(`${BASE_URL}/api/products/${id}`, sanitizedData);
      console.log("Update response:", response.data);
      console.log("IsActive in response:", response.data.IsActive);

      // Refetch the updated product data to refresh the form
      const refetchResponse = await axios.get(`${BASE_URL}/api/products/${id}`);
      const refetchedProduct = refetchResponse.data;
      // Ensure IsActive is a boolean for consistency
      if (typeof refetchedProduct.IsActive !== 'boolean') {
        refetchedProduct.IsActive = Boolean(refetchedProduct.IsActive);
      }
      setProduct(refetchedProduct);

      setDialogOpen(true);

    } catch (err) {
      console.error("Update failed", err);
      if (err.response && err.response.data) {
        console.error("Backend error details:", err.response.data);
        alert("Failed to update product: " + (err.response.data.error || err.response.data.message || JSON.stringify(err.response.data)));
      } else {
        alert("Failed to update product: Network or server error");
      }
    }
  };

  if (loading) return <Box p={4}><CircularProgress /></Box>;
  if (!product) return <Box p={4}><Typography>Product not found</Typography></Box>;

  return (
                <section className="right-content">
                    <Paper elevation={3} sx={{ p: 4, mb: 2 }}>

                          <ProductEditForm product={product} onSubmit={handleUpdate} navigate={navigate} />

                    </Paper>


                    <DynamicDialog
                            open={dialogOpen}
                            type="success"
                            title="Product Updated"
                            message="The product has been successfully updated."
                            onClose={() => setDialogOpen(false)}
                            actions={[
                              {
                                label: "Update Variant",
                                onClick: () => {
                                  setDialogOpen(false);
                                  navigate(`/products/${id}/variants`); // or your variant edit route
                                },
                                variant: "outlined",
                              },
                               {
                                label: "Stay",
                                onClick: () => {
                                  setDialogOpen(false);
                                  
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
              
                </section>
                
  
  );
}
