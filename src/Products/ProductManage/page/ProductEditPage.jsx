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
    try {
      await axios.put(`${BASE_URL}/api/products/${id}`, data);
      setDialogOpen(true);
      
    } catch (err) {
      console.error("Update failed", err);
      alert("Failed to update product");
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
