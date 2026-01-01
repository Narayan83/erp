import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import AddOrEditEmployeeForm from "../components/AddOrEditEmployeeForm";
import { CircularProgress, Container, Typography, Paper } from "@mui/material";
import { BASE_URL } from "../../config/Config";

const EmployeeFormPage = () => {
  const { id } = useParams(); // If `id` exists, it's edit mode
  const navigate = useNavigate();
  const [employeeToEdit, setEmployeeToEdit] = useState(null);
  const [loading, setLoading] = useState(!!id); // only load if editing

  useEffect(() => {
    if (id) {
      axios
        .get(`${BASE_URL}/api/employees/${id}`)
        .then((res) => {
          setEmployeeToEdit(res.data);
          console.log(res.data);
        })
        .catch((err) => {
          console.error("Error fetching employee:", err);
        })
        .finally(() => {
          setLoading(false);
        });
    }
  }, [id]);

  const handleSubmit = async (data) => {
    // navigation is handled by the form component after user confirms the dialog
    console.log('Employee form submitted, received:', data);
  };

  if (loading) {
    return (
      <section className="right-content">
        <Container sx={{ mt: 5 }}>
          <Typography variant="h6">Loading employee...</Typography>
          <CircularProgress />
        </Container>
      </section>
    );
  }

  return (
    <section className="right-content">
      <Paper sx={{ p: 2, mb: 2 }}>
        <Container maxWidth="xl" sx={{ mt: 5 }}>
          <AddOrEditEmployeeForm
            defaultValues={employeeToEdit}
            onSubmitUser={handleSubmit}
          />
        </Container>
      </Paper>
    </section>
  );
};

export default EmployeeFormPage;
