import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import { CircularProgress, Box, Typography, Paper } from "@mui/material";
import ProductEditForm from "../Components/ProductEditForm";
import { BASE_URL } from "../../../Config";
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
        console.log("Product loaded:", res.data);
        // Pre-fill form data if needed
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

    try {
      const response = await axios.put(`${BASE_URL}/api/products/${id}`, data);
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
      if (err.response && err.response.data) {
        console.error("Update failed", err.response.data);
        alert("Failed to update product: " + (err.response.data.error || JSON.stringify(err.response.data)));
      } else {
        console.error("Update failed", err);
        alert("Failed to update product");
      }
    }
  };

  if (loading) return <Box p={4}><CircularProgress /></Box>;
  if (!product) return <Box p={4}><Typography>Product not found</Typography></Box>;

  return (
                <section className="right-content">
                    <Paper elevation={3} sx={{ p: 4, mb: 2 }}>

                          <ProductEditForm product={product} onSubmit={handleUpdate} />

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
