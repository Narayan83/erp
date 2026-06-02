import { useEffect, useRef, useState } from "react";
import axios from "axios";
import {
  fetchDepartments,
  fetchDesignations,
  updateEmployee,
  fetchEmployee
} from "./employeeService";
import { BASE_URL } from "../../config/Config";
import "./EmployeeEditModal.scss";

/** HTML <select> values are strings; normalize API ids so controlled value matches an <option>. */
function idToSelectValue(v) {
  if (v === null || v === undefined || v === "") return "";
  return String(v);
}

function pickDepartmentId(data) {
  return (
    data.department_id ??
    data.department?.id ??
    data.Department?.id ??
    data.Department?.ID
  );
}

function pickDesignationId(data) {
  return (
    data.designation_id ??
    data.designation?.id ??
    data.Designation?.id ??
    data.Designation?.ID
  );
}

export default function EmployeeEditModal({ open, onClose, employee }) {
  // Determine employee table id (if exists) and user id separately.
  const employeeTableId = (() => {
    if (!employee && employee !== 0) return null;
    if (typeof employee === 'object') {
      // Prefer explicit employee table PK set by list pages (`empPmKeyid` or `id` when row is an employee record)
      if (employee.empPmKeyid != null) return employee.empPmKeyid;
      // If this row is known to be an employee row (no user mapping fields), allow id as employee id
      if (employee.id != null && employee.user_id == null && employee.UserID == null && !employee.user) return employee.id;
      return null;
    }
    return employee;
  })();

  const userId = (() => {
    if (!employee) return null;
    if (typeof employee === 'object') {
      return employee.user_id ?? employee.UserID ?? (employee.user && employee.user.id) ?? employee.id ?? null;
    }
    return null;
  })();
  const [resolvedEmployeeId, setResolvedEmployeeId] = useState(employeeTableId);
  const [departments, setDepartments] = useState([]);
  const [designations, setDesignations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [currentEmploye, setCurrentEmployee ] = useState();
  /** Bumps when modal closes or a new fetch starts — ignore stale fetchEmployee responses (Strict Mode / slow network). */
  const loadGenerationRef = useRef(0);

  const [form, setForm] = useState({
    department_id: "",
    designation_id: "",
    joining_date: "",
    exit_date: "",
    salary: "",
    work_email: "",
    remarks: ""
  });

  useEffect(() => {
    if (!open || !employee) {
      loadGenerationRef.current += 1;
      return;
    }

    const gen = ++loadGenerationRef.current;
    let cancelled = false;

    (async () => {
      try {
        setLoading(true);
        setResolvedEmployeeId(employeeTableId);
        if (employeeTableId) {
          try {
            const data = await fetchEmployee(employeeTableId);
            if (cancelled || gen !== loadGenerationRef.current) return;
            setCurrentEmployee(data);
            setForm({
              department_id: idToSelectValue(pickDepartmentId(data)),
              designation_id: idToSelectValue(pickDesignationId(data)),
              joining_date: data.joining_date ? data.joining_date.split("T")[0] : "",
              exit_date: data.exit_date ? data.exit_date.split("T")[0] : "",
              salary: data.salary !== null && data.salary !== undefined ? String(data.salary) : "",
              work_email: data.work_email ?? "",
              remarks: data.remarks ?? ""
            });
          } catch (err) {
            // If not found, attempt to locate an employee row by user_id
            if (err?.response?.status === 404 && userId) {
              try {
                const resp = await axios.get(`${BASE_URL}/api/employees`, { params: { page: 1, limit: 2000 } });
                const empItems = resp.data?.empData || [];
                const found = empItems.find(e => String(e.user_id) === String(userId));
                if (found) {
                  setResolvedEmployeeId(found.id);
                  const data2 = await fetchEmployee(found.id);
                  if (cancelled || gen !== loadGenerationRef.current) return;
                  setCurrentEmployee(data2);
                  setForm({
                    department_id: idToSelectValue(pickDepartmentId(data2)),
                    designation_id: idToSelectValue(pickDesignationId(data2)),
                    joining_date: data2.joining_date ? data2.joining_date.split("T")[0] : "",
                    exit_date: data2.exit_date ? data2.exit_date.split("T")[0] : "",
                    salary: data2.salary !== null && data2.salary !== undefined ? String(data2.salary) : "",
                    work_email: data2.work_email ?? "",
                    remarks: data2.remarks ?? ""
                  });
                } else {
                  // no employee row exists for this user
                  setResolvedEmployeeId(null);
                  setCurrentEmployee(null);
                  setForm({ department_id: "", designation_id: "", joining_date: "", exit_date: "", salary: "", work_email: "", remarks: "" });
                }
              } catch (err2) {
                console.error("Fallback lookup failed", err2);
                setCurrentEmployee(null);
              }
            } else {
              throw err;
            }
          }
        } else {
          // No existing employee row — initialize empty form for creating a mapping
          setCurrentEmployee(null);
          setForm({ department_id: "", designation_id: "", joining_date: "", exit_date: "", salary: "", work_email: "", remarks: "" });
        }
      } catch (error) {
        console.error("Failed to fetch employee details", error);
      } finally {
        if (!cancelled && gen === loadGenerationRef.current) {
          setLoading(false);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [open, employee]);

  useEffect(() => {
    fetchDepartments().then(setDepartments);
    fetchDesignations().then(setDesignations);
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  // Do not rely on select.name — global main.jsx may randomize name before data-no-readonly-trick applies
  const handleDepartmentChange = (e) => {
    setForm((prev) => ({ ...prev, department_id: e.target.value }));
  };
  const handleDesignationChange = (e) => {
    setForm((prev) => ({ ...prev, designation_id: e.target.value }));
  };

  const handleUpdate = async () => {
    setLoading(true);
    try {
      const payload = {
        department_id: form.department_id ? Number(form.department_id) : null,
        designation_id: form.designation_id ? Number(form.designation_id) : null,
        joining_date: form.joining_date || null,
        exit_date: form.exit_date || null,
        salary: form.salary === "" ? null : Number(form.salary),
        work_email: form.work_email || null,
        remarks: form.remarks || null
      };

      if (resolvedEmployeeId) {
        await updateEmployee(resolvedEmployeeId, payload);
      } else if (employeeTableId) {
        // employeeTableId was provided but resolved lookup failed earlier; try update and fall back to create on 404
        try {
          await updateEmployee(employeeTableId, payload);
        } catch (err) {
          if (err?.response?.status === 404 && userId) {
            const createPayload = { ...payload, user_id: Number(userId) };
            await axios.post(`${BASE_URL}/api/employees`, createPayload);
          } else {
            throw err;
          }
        }
      } else {
        // No employee id - create mapped employee
        const createPayload = { ...payload, user_id: Number(userId) };
        await axios.post(`${BASE_URL}/api/employees`, createPayload);
      }
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
          <form
            className="form-grid"
            data-allow-autocomplete="true"
            onSubmit={(e) => { e.preventDefault(); handleUpdate(); }}
          >
            <label>
              <span>Department</span>
              <select
                name="department_id"
                data-no-readonly-trick="true"
                value={form.department_id}
                onChange={handleDepartmentChange}
              >
                <option value="">Select Department</option>
                {departments.map((d) => (
                  <option key={d.id} value={String(d.id)}>{d.name}</option>
                ))}
              </select>
            </label>

            <label>
              <span>Designation</span>
              <select
                name="designation_id"
                data-no-readonly-trick="true"
                value={form.designation_id}
                onChange={handleDesignationChange}
              >
                <option value="">Select Designation</option>
                {designations.map((d) => (
                  <option key={d.id} value={String(d.id)}>{d.name}</option>
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
