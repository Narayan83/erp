import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import {
  createHierarchy,
  updateHierarchy
} from "./employeeHierarchyService";

import { BASE_URL } from "../../config/Config";
import "../pages/EmployeeHierarchy.scss";

/** Designation.level from API; supports nested Designation or designation. */
function getDesignationLevel(emp) {
  const des = emp?.Designation || emp?.designation;
  if (!des) return null;
  const { level } = des;
  if (level === null || level === undefined) return null;
  const n = Number(level);
  return Number.isNaN(n) ? null : n;
}

/**
 * Null designation level = top (most senior).
 * Backend model: higher numeric level = higher position (more senior).
 * Child must be strictly more junior: numeric seniority(child) < numeric seniority(parent).
 * If parent has no numeric level (null / missing), allow any employee except parent.
 */
function seniorityRank(emp) {
  const v = getDesignationLevel(emp);
  if (v === null) return Number.POSITIVE_INFINITY;
  return v;
}

function parentHasNumericDesignationLevel(emp) {
  return getDesignationLevel(emp) !== null;
}

function qualifiesAsChild(parentEmp, childEmp) {
  if (!childEmp || !parentEmp || parentEmp.id === childEmp.id) return false;
  if (!parentHasNumericDesignationLevel(parentEmp)) {
    return true;
  }
  const pr = seniorityRank(parentEmp);
  const cr = seniorityRank(childEmp);
  if (cr === Number.POSITIVE_INFINITY) return false;
  return cr < pr;
}

function employeeLabel(emp) {
  const u = emp?.User || emp?.user;
  const name = [u?.firstname, u?.lastname].filter(Boolean).join(" ").trim() || `Employee #${emp.id}`;
  const lvl = getDesignationLevel(emp);
  const desName = emp?.Designation?.name || emp?.designation?.name;
  const levelHint =
    lvl === null
      ? desName
        ? `${desName} (level: top)`
        : "level: top"
      : desName
        ? `${desName} (level ${lvl})`
        : `level ${lvl}`;
  return { name, levelHint };
}

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
    if (!open) return;
    if (editData) {
      setForm({
        manager_id: idStr(editData.manager_id),
        employee_id: idStr(editData.employee_id)
      });
    } else {
      setForm({ manager_id: "", employee_id: "" });
    }
  }, [open, editData]);

  const loadEmployees = async () => {
    const res = await axios.get(`${BASE_URL}/api/employees`, {
      params: { page: 1, limit: 2000 }
    });
    setEmployees(res.data?.empData ?? []);
  };

  useEffect(() => {
    if (open) loadEmployees();
  }, [open]);

  const parentEmployee = useMemo(
    () => employees.find((e) => String(e.id) === String(form.manager_id)),
    [employees, form.manager_id]
  );

  const eligibleChildren = useMemo(() => {
    if (!form.manager_id || !parentEmployee) return [];
    return employees.filter((emp) => qualifiesAsChild(parentEmployee, emp));
  }, [employees, form.manager_id, parentEmployee]);

  const handleManagerChange = (e) => {
    const v = e.target.value;
    setForm((f) => {
      const parent = employees.find((x) => String(x.id) === String(v));
      let nextChild = f.employee_id;
      if (nextChild && (nextChild === v || (parent && !qualifiesAsChild(parent, employees.find((x) => String(x.id) === String(nextChild)))))) {
        nextChild = "";
      }
      return { ...f, manager_id: v, employee_id: nextChild };
    });
  };

  const handleChildChange = (e) => {
    setForm((f) => ({ ...f, employee_id: e.target.value }));
  };

  const handleSubmit = async () => {
    if (!form.manager_id || !form.employee_id) {
      alert("Select both parent and child employee.");
      return;
    }
    if (form.manager_id === form.employee_id) {
      alert("Parent and Child cannot be the same employee.");
      return;
    }
    const parent = employees.find((e) => String(e.id) === String(form.manager_id));
    const child = employees.find((e) => String(e.id) === String(form.employee_id));
    if (parent && child && !qualifiesAsChild(parent, child)) {
      alert("Child must have a more junior designation than the parent (see level rules).");
      return;
    }

    setLoading(true);

    try {
      const payload = {
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
    } finally {
      setLoading(false);
    }
  };

  if (!open) return null;

  return (
    <div className="modal-overlay">
      <div className="modal app-modal employee-hierarchy-modal">
        <div className="modal-header">
          <h3>{editData ? "Edit Employee Hierarchy" : "Create Employee Hierarchy"}</h3>
        </div>

        <div className="modal-body">
          <label className="form-label">Parent Employee</label>
          <select
            className="form-input"
            name="manager_id"
            data-no-readonly-trick="true"
            value={form.manager_id}
            onChange={handleManagerChange}
          >
            <option value="">Select Employee</option>
            {employees.map((emp) => {
              const { name } = employeeLabel(emp);
              return (
                <option key={emp.id} value={String(emp.id)}>
                  {name}
                </option>
              );
            })}
          </select>

          <label className="form-label">Child Employee</label>
          {!form.manager_id ? (
            <p className="eh-modal-hint">Select a parent employee first.</p>
          ) : null}
          <select
            className="form-input"
            name="employee_id"
            data-no-readonly-trick="true"
            value={form.employee_id}
            onChange={handleChildChange}
            disabled={!form.manager_id}
          >
            <option value="">Select Employee</option>
            {eligibleChildren.map((emp) => {
              const { name, levelHint } = employeeLabel(emp);
              return (
                <option key={emp.id} value={String(emp.id)}>
                  {name} — {levelHint}
                </option>
              );
            })}
          </select>
          {form.manager_id && parentEmployee ? (
            <p className="eh-modal-hint">
              {parentHasNumericDesignationLevel(parentEmployee)
                ? `Showing employees more junior than parent (designation level < ${getDesignationLevel(parentEmployee)}). Parent is not listed.`
                : "Parent has top-level designation (level unset). All other employees are listed. Parent is not listed."}
            </p>
          ) : null}
        </div>

        <div className="modal-footer">
          <button type="button" className="btn" onClick={() => onClose(false)} disabled={loading}>
            Cancel
          </button>
          <button type="button" className="btn btn-primary" onClick={handleSubmit} disabled={loading}>
            {loading ? "Saving..." : "Save"}
          </button>
        </div>
      </div>
    </div>
  );
}

function idStr(v) {
  if (v === null || v === undefined || v === "") return "";
  return String(v);
}
