import { useEffect, useState } from "react";
import {
  fetchDepartments,
  fetchDesignations,
  updateEmployee,
  fetchEmployee
} from "./employeeService";
import "./EmployeeEditModal.scss";

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

  const getEmp = async (empId) => {
    try {
      setLoading(true);
      const data = await fetchEmployee(empId);
      setCurrentEmployee(data);
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

  useEffect(() => {
    if (open && employee) getEmp(employee);
  }, [open, employee]);

  useEffect(() => {
    fetchDepartments().then(setDepartments);
    fetchDesignations().then(setDesignations);
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleUpdate = async () => {
    setLoading(true);
    try {
      const payload = {
        department_id: form.department_id || null,
        designation_id: form.designation_id || null,
        joining_date: form.joining_date || null,
        exit_date: form.exit_date || null,
        salary: form.salary === "" ? null : Number(form.salary),
        work_email: form.work_email || null,
        remarks: form.remarks || null
      };

      await updateEmployee(employee, payload);
      alert("Employee updated successfully");
      onClose(true);
    } catch (err) {
      console.error(err);
      alert("Error while updating employee");
    } finally {
      setLoading(false);
    }
  };

  if (!open) return null;

  return (
    <div className="employee-edit-modal-overlay" onClick={() => onClose(false)}>
      <div className="employee-edit-modal" role="dialog" aria-modal="true" onClick={(e) => e.stopPropagation()}>
        <div className="eem-header">
          <h3>Edit Employee Job Info</h3>
          <button className="eem-close" onClick={() => onClose(false)} aria-label="Close">×</button>
        </div>

        <div className="eem-body">
          <form className="form-grid" onSubmit={(e) => { e.preventDefault(); handleUpdate(); }}>
            <label>
              <span>Department</span>
              <select name="department_id" value={form.department_id} onChange={handleChange}>
                <option value="">Select Department</option>
                {departments.map((d) => (
                  <option key={d.id} value={d.id}>{d.name}</option>
                ))}
              </select>
            </label>

            <label>
              <span>Designation</span>
              <select name="designation_id" value={form.designation_id} onChange={handleChange}>
                <option value="">Select Designation</option>
                {designations.map((d) => (
                  <option key={d.id} value={d.id}>{d.name}</option>
                ))}
              </select>
            </label>

            <label>
              <span>Joining Date</span>
              <input type="date" name="joining_date" value={form.joining_date} onChange={handleChange} />
            </label>

            <label>
              <span>Exit Date</span>
              <input type="date" name="exit_date" value={form.exit_date} onChange={handleChange} />
            </label>

            <label>
              <span>Salary</span>
              <input type="number" name="salary" value={form.salary} onChange={handleChange} />
            </label>

            <label>
              <span>Work Email</span>
              <input type="email" name="work_email" value={form.work_email} onChange={handleChange} />
            </label>

            <label className="full-width">
              <span>Remarks</span>
              <textarea name="remarks" rows={4} value={form.remarks} onChange={handleChange} />
            </label>
          </form>
        </div>

        <div className="eem-actions">
          <button className="btn btn-secondary" onClick={() => onClose(false)} disabled={loading}>Cancel</button>
          <button className="btn btn-primary" onClick={handleUpdate} disabled={loading}>{loading ? 'Saving...' : 'Update'}</button>
        </div>

        {loading && (
          <div className="eem-loading">
            <div className="spinner" />
          </div>
        )}
      </div>
    </div>
  );
}
