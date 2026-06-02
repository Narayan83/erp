import { useEffect, useState } from "react";
import axios from "axios";
import {
  createHierarchy,
  updateHierarchy
} from "./employeeHierarchyService";

import { BASE_URL } from "../../config/Config";
import "../pages/EmployeeHierarchy.scss";

export default function EmployeeHierarchyModal({
  open,
  onClose,
  editData
}) {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState({
    manager_id: "",
    employee_id: ""
  });

  useEffect(() => {
    if (editData) {
        console.log(editData);
      setForm({
        manager_id: editData.manager_id ?? "",
        employee_id: editData.employee_id ?? ""
      });
    }
  }, [editData]);

  // load employees for dropdowns
  const loadEmployees = async () => {
    const res = await axios.get(`${BASE_URL}/api/employees`);
    setEmployees(res.data.empData ?? []);
  };

  useEffect(() => {
    loadEmployees();
  }, []);

  const handleChange = (e) => {
    console.log(e);
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async () => {
    if (form.manager_id === form.employee_id) {
      alert("Parent and Child cannot be the same employee.");
      return;
    }

    setLoading(true);

    try {
      let payload = {
        manager_id: Number(form.manager_id),
        employee_id: Number(form.employee_id)
      };

      if (editData) {
        await updateHierarchy(editData.id, payload);
      } else {
        await createHierarchy(payload);
      }

      alert("Employee Hierarchy saved successfully");
      onClose(true);
    } catch (err) {
      console.error(err);
      alert("Error saving hierarchy");
    }

    setLoading(false);
  };

  if (!open) return null;

  return (
    <div className="modal-overlay">
      <div className="modal app-modal">
        <div className="modal-header">
          <h3>{editData ? "Edit Employee Hierarchy" : "Create Employee Hierarchy"}</h3>
        </div>

        <div className="modal-body">
          <label className="form-label">Parent Employee</label>
          <select className="form-input" name="manager_id" value={form.manager_id} onChange={handleChange}>
            <option value="">Select Employee</option>
            {employees.map((emp) => (
              <option key={emp.id} value={emp.id}>{emp.User?.firstname} {emp.User?.lastname}</option>
            ))}
          </select>

          <label className="form-label">Child Employee</label>
          <select className="form-input" name="employee_id" value={form.employee_id} onChange={handleChange}>
            <option value="">Select Employee</option>
            {employees.map((emp) => (
              <option key={emp.id} value={emp.id}>{emp.User?.firstname} {emp.User?.lastname}</option>
            ))}
          </select>
        </div>

        <div className="modal-footer">
          <button className="btn" onClick={() => onClose(false)} disabled={loading}>Cancel</button>
          <button className="btn btn-primary" onClick={handleSubmit} disabled={loading}>{loading ? "Saving..." : "Save"}</button>
        </div>
      </div>
    </div>
  );
}
