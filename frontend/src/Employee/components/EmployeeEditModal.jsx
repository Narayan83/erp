import { useEffect, useState } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  MenuItem,
  CircularProgress
} from "@mui/material";
import {
  fetchDepartments,
  fetchDesignations,
  updateEmployee,
  fetchEmployee
} from "./employeeService";

export default function EmployeeEditModal({ open, onClose, employee }) {
  const [departments, setDepartments] = useState([]);
  const [designations, setDesignations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [currentEmploye, setCurrentEmployee ] = useState();

  const [form, setForm] = useState({
    department_id: "",
    designation_id: "",
    joining_date: "",
    exit_date: "",
    salary: "",
    work_email: "",
    remarks: ""
  });

  // 1. Improved getEmp function
const getEmp = async (empId) => {
  try {
    setLoading(true);
    const data = await fetchEmployee(empId); // Wait for the data
    
    setCurrentEmployee(data); // Save to state if needed elsewhere
    
    // 2. Map the form values directly from the fresh 'data' variable
    setForm({
      department_id: data.department_id ?? "",
      designation_id: data.designation_id ?? "",
      joining_date: data.joining_date ? data.joining_date.split("T")[0] : "",
      exit_date: data.exit_date ? data.exit_date.split("T")[0] : "",
      salary: data.salary ?? "",
      work_email: data.work_email ?? "",
      remarks: data.remarks ?? ""
    });
  } catch (error) {
    console.error("Failed to fetch employee details", error);
  } finally {
    setLoading(false);
  }
};

  useEffect(()=>{
    console.log(currentEmploye);
  },[currentEmploye]);

  // Prefill data when modal opens
useEffect(() => {
  if (open && employee) {
    getEmp(employee);
  }
}, [open, employee]);

  // Load dropdown data
  useEffect(() => {
    fetchDepartments().then(setDepartments);
    fetchDesignations().then(setDesignations);
  }, []);

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleUpdate = async () => {
    setLoading(true);
    try {
      const payload = {
        department_id: form.department_id || null,
        designation_id: form.designation_id || null,
        joining_date: form.joining_date || null,
        exit_date: form.exit_date || null,
        salary: Number(form.salary),
        work_email: form.work_email,
        remarks: form.remarks
      };

      await updateEmployee(employee, payload);

      alert("Employee updated successfully");
      onClose(true); // refresh parent
    } catch (err) {
      console.error(err);
      alert("Error while updating employee");
    }
    setLoading(false);
  };

  return (
    <Dialog open={open} onClose={() => onClose(false)} maxWidth="sm" fullWidth>
      <DialogTitle>Edit Employee Job Info</DialogTitle>
      <DialogContent sx={{ mt: 1 }}>
        {/* Department */}
        <TextField
          select
          fullWidth
          label="Department"
          name="department_id"
          value={form.department_id}
          onChange={handleChange}
          margin="normal"
        >
          <MenuItem value="">Select Department</MenuItem>
          {departments.map((d) => (
            <MenuItem key={d.id} value={d.id}>
              {d.name}
            </MenuItem>
          ))}
        </TextField>

        {/* Designation */}
        <TextField
          select
          fullWidth
          label="Designation"
          name="designation_id"
          value={form.designation_id}
          onChange={handleChange}
          margin="normal"
        >
          <MenuItem value="">Select Designation</MenuItem>
          {designations.map((d) => (
            <MenuItem key={d.id} value={d.id}>
              {d.name}
            </MenuItem>
          ))}
        </TextField>

        {/* Joining Date */}
        <TextField
          type="date"
          fullWidth
          name="joining_date"
          label="Joining Date"
          value={form.joining_date}
          onChange={handleChange}
          margin="normal"
          InputLabelProps={{ shrink: true }}
        />

        {/* Exit Date */}
        <TextField
          type="date"
          fullWidth
          name="exit_date"
          label="Exit Date"
          value={form.exit_date}
          onChange={handleChange}
          margin="normal"
          InputLabelProps={{ shrink: true }}
        />

        {/* Salary */}
        <TextField
          fullWidth
          type="number"
          name="salary"
          label="Salary"
          value={form.salary}
          onChange={handleChange}
          margin="normal"
        />

        {/* Work Email */}
        <TextField
          fullWidth
          name="work_email"
          label="Work Email"
          value={form.work_email}
          onChange={handleChange}
          margin="normal"
        />

        {/* Remarks */}
        <TextField
          fullWidth
          multiline
          rows={3}
          name="remarks"
          label="Remarks"
          value={form.remarks}
          onChange={handleChange}
          margin="normal"
        />
      </DialogContent>

      <DialogActions>
        <Button onClick={() => onClose(false)} disabled={loading}>
          Cancel
        </Button>
        <Button
          variant="contained"
          onClick={handleUpdate}
          disabled={loading}
          color="primary"
        >
          {loading ? <CircularProgress size={20} /> : "Update"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
