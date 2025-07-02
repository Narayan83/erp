import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import AddOrEditUserForm from "../components/AddOrEditUserForm"; // Adjust path as needed
import { CircularProgress, Container, Typography,Paper } from "@mui/material";
import { BASE_URL } from "../../Config"
const UserFormPage = () => {
  const { id } = useParams(); // If `id` exists, it's edit mode
  const navigate = useNavigate();
  const [userToEdit, setUserToEdit] = useState(null);
  const [loading, setLoading] = useState(!!id); // only load if editing

  useEffect(() => {
    if (id) {
      axios
        .get(`${BASE_URL}/api/users/${id}`)
        .then((res) => {
          setUserToEdit(res.data);
          console.log(res.data);
        })
        .catch((err) => {
          console.error("Error fetching user:", err);
        })
        .finally(() => {
          setLoading(false);
        });
    }
  }, [id]);

  const handleSubmit = async (data) => {
    
    navigate("/users");
   
  };

  if (loading) {
    return (
        <section  className="right-content">
        <Container sx={{ mt: 5 }}>
            <Typography variant="h6">Loading user...</Typography>
            <CircularProgress />
        </Container>
      </section>
    );
  }

  return (
     <section  className="right-content">
        <Paper sx={{ p: 2, mb: 2 }}>
        <Container maxWidth="xl" sx={{ mt: 5 }}>
        <AddOrEditUserForm defaultValues={userToEdit} onSubmitUser={handleSubmit} />
        </Container>
        </Paper>
    </section>
  );
};

export default UserFormPage;
