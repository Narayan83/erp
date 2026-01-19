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
          // Backend returns Employee model which embeds User and related arrays.
          const emp = res.data;
          // Merge User fields to top-level so AddOrEditEmployeeForm can consume them as 'defaultValues'
          const merged = {
            // user-level fields (if present)
            ...(emp.User || {}),
            // ensure the form 'id' is the employee table primary key (used for update)
            id: emp.id,
            empPmKeyid: emp.id,
            empcode: emp.empcode || emp.EmpCode || (emp.User && emp.User.usercode) || "",
            // employee-specific fields
            department_id: emp.department_id ?? emp.DepartmentID ?? null,
            designation_id: emp.designation_id ?? emp.DesignationID ?? null,
            joining_date: emp.joining_date ?? emp.JoiningDate ?? null,
            exit_date: emp.exit_date ?? emp.ExitDate ?? null,
            salary: emp.salary ?? emp.Salary ?? null,
            work_email: emp.work_email ?? emp.WorkEmail ?? "",
            remarks: emp.remarks ?? emp.Remarks ?? "",
            addresses: emp.Addresses || emp.addresses || [],
            bank_accounts: emp.BankAccounts || emp.bank_accounts || [],
            documents: emp.Documents || emp.documents || [],
          };

          setEmployeeToEdit(merged);
          console.log('Fetched employee (merged):', merged);
        })
        .catch((err) => {
          console.error("Error fetching employee:", err);
          if (err.response && err.response.status === 404) {
            // Not found: navigate back to list to avoid editing a missing record
            navigate('/employeemanagement');
          }
        })
        .finally(() => {
          setLoading(false);
        });
    }
  }, [id, navigate]);

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
