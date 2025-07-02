import { useState } from "react";
import {
  Stepper, Step, StepLabel,
  Button, Box, Typography, Paper
} from "@mui/material";
import ProductStepForm from "./ProductStepForm";
import VariantStepForm from "./VariantStepForm";
import ReviewStep from "./ReviewStep";
import { useNavigate } from "react-router-dom";

const steps = ["Product Info", "Variants", "Review"];

export default function ProductMultiStepForm({ onSuccess }) {
  const navigate = useNavigate(); 
  const [activeStep, setActiveStep] = useState(0);
  const [productData, setProductData] = useState(null);
  const [variants, setVariants] = useState([]);
  const [editVariantIndex, setEditVariantIndex] = useState(null); // For editing from review

  const handleNext = () => setActiveStep((prev) => prev + 1);
  const handleBack = () => setActiveStep((prev) => prev - 1);

  //  Called from ReviewStep to edit a variant
  const handleEditVariant = (index) => {
    setEditVariantIndex(index);
    setActiveStep(1); // Go back to Variant form step
  };

  //  Called from ReviewStep to delete a variant
  const handleRemoveVariant = (index) => {
    const updated = [...variants];
    updated.splice(index, 1);
    setVariants(updated);
  };

  const resetForm = () => {
  setProductData(null);
  setVariants([]);
  setActiveStep(0);
};

  return (
    <section className="right-content">
       <Paper sx={{ p: 3 }}>
        <Box display="flex" justifyContent="end" gap={2} alignItems="center">
          {/* <Button
            variant="outlined"
            onClick={resetForm}
            sx={{ mr: 2 }}  >
              Reset Form
           </Button> */}
          <Button
            variant="contained"
            color="warning"
            onClick={() => navigate("/ProductMaster")}
            sx={{ mr: 2 }} >
              View Products
            </Button>
        </Box>
       </Paper>
      <Paper sx={{ p: 3 }}>
        <Typography variant="h6">Add New Product</Typography>
        <Stepper activeStep={activeStep} sx={{ my: 2 }}>
          {steps.map((label) => (
            <Step key={label}><StepLabel>{label}</StepLabel></Step>
          ))}
        </Stepper>

        {activeStep === 0 && (
          <ProductStepForm
            defaultValues={productData}
            onNext={(data) => {
              setProductData(data);
              handleNext();
            }}
           
          />
        )}

        {activeStep === 1 && (
          <VariantStepForm
            variants={variants}
            setVariants={setVariants}
            onBack={() => {
              setEditVariantIndex(null); // Reset on back
              handleBack();
            }}
            onNext={() => {
              setEditVariantIndex(null); // Reset after save
              handleNext();
            }}
            editIndex={editVariantIndex}
            setEditIndex={setEditVariantIndex}
          />
        )}

        {activeStep === 2 && (
          <ReviewStep
            product={productData}
            variants={variants}
            onBack={handleBack}
            onSubmit={onSuccess}
            onEditVariant={handleEditVariant}
            onRemoveVariant={handleRemoveVariant}
            onReset={resetForm}
          />
        )}
      </Paper>
    </section>
  );
}
