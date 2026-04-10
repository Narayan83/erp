import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { FiEdit2, FiTrash2 } from "react-icons/fi";
import { BASE_URL } from "../../config/Config";
import "./ManageEmployees.scss";

function asArray(payload) {
  if (Array.isArray(payload)) return payload;
  return [];
}

function pickList(data) {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.data)) return data.data;
  if (Array.isArray(data?.users)) return data.users;
  if (Array.isArray(data?.items)) return data.items;
  return [];
}

function getUserName(user = {}) {
  const salutation = user.salutation || user.Salutation || "";
  const first = user.firstname || user.Firstname || "";
  const last = user.lastname || user.Lastname || "";
  const fullName = [salutation, first, last].filter(Boolean).join(" ").trim();
  return fullName || "Unnamed Employee";
}

function getEmpCode(user = {}, emp = {}) {
  return (
    user.usercode ||
    user.user_code ||
    emp.empcode ||
    emp.EmpCode ||
    `EMP-${emp.id || emp.ID || "NA"}`
  );
}

export default function ManageEmployees() {
  const [employees, setEmployees] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [designations, setDesignations] = useState([]);
  const [employeeUsers, setEmployeeUsers] = useState([]);

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const [filters, setFilters] = useState({
    departmentId: "",
    designationId: "",
    search: "",
  });

  const [modalOpen, setModalOpen] = useState(false);
  const [editingRow, setEditingRow] = useState(null);
  const [form, setForm] = useState({
    selectedEmployee: "",
    departmentId: "",
    designationId: "",
  });

  const [message, setMessage] = useState({ type: "", text: "" });

  const loadEmployees = async () => {
    const response = await axios.get(`${BASE_URL}/api/employees`, {
      params: { page: 1, limit: 2000 },
    });
    const payload = response.data?.empData ?? response.data?.data ?? response.data;
    setEmployees(asArray(payload));
  };

  const loadMasterData = async () => {
    setLoading(true);
    try {
      const [empRes, deptRes, desigRes, usersRes] = await Promise.all([
        axios.get(`${BASE_URL}/api/employees`, { params: { page: 1, limit: 2000 } }),
        axios.get(`${BASE_URL}/api/departments`, { params: { page: 1, limit: 2000 } }),
        axios.get(`${BASE_URL}/api/designations`, { params: { page: 1, limit: 2000 } }),
        axios.get(`${BASE_URL}/api/users`, { params: { page: 1, limit: 2000, user_type: "employee" } }),
      ]);
      const employeePayload = empRes.data?.empData ?? empRes.data?.data ?? empRes.data;
      const employeeUsersPayload = usersRes.data?.data ?? usersRes.data ?? [];

      // Build a set of user IDs that already have Employee rows
      const existingUserIds = new Set();
      (employeePayload || []).forEach((emp) => {
        const uid = emp.user_id ?? emp.UserID ?? emp.user?.id ?? emp.User?.id;
        if (uid) existingUserIds.add(Number(uid));
      });

      // For users that don't have an employee row, create a lightweight placeholder row
      const unmappedUserRows = (employeeUsersPayload || [])
        .filter((u) => !existingUserIds.has(Number(u.id)))
        .map((u) => ({ id: null, user_id: u.id, user: u }));

      // Merge existing employee rows first, then unmapped users so they all appear in the table
      setEmployees([...asArray(employeePayload), ...unmappedUserRows]);
      setDepartments(pickList(deptRes.data));
      setDesignations(pickList(desigRes.data));
      setEmployeeUsers(pickList(usersRes.data));
    } catch (error) {
      console.error("Failed to load manage employees data", error);
      setMessage({ type: "error", text: "Failed to load employee data" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMasterData();
  }, []);

  const rows = useMemo(() => {
    const searchText = filters.search.trim().toLowerCase();

    return employees.filter((emp) => {
      const departmentId = String(emp.department_id ?? emp.DepartmentID ?? "");
      const designationId = String(emp.designation_id ?? emp.DesignationID ?? "");
      const user = emp.user || emp.User || {};
      const department = emp.department || emp.Department || {};
      const designation = emp.designation || emp.Designation || {};

      if (filters.departmentId && departmentId !== String(filters.departmentId)) return false;
      if (filters.designationId && designationId !== String(filters.designationId)) return false;

      if (!searchText) return true;

      const haystack = [
        getEmpCode(user, emp),
        getUserName(user),
        user.email || user.Email || "",
        department.name || department.Name || "",
        designation.name || designation.Name || "",
      ]
        .join(" ")
        .toLowerCase();

      return haystack.includes(searchText);
    });
  }, [employees, filters]);

  const employeeSelectOptions = useMemo(() => {
    // Only treat rows that actually have an employee ID as "existing" to avoid
    // producing duplicate option keys like "emp:null" for unmapped users.
    const existingOptions = (employees || [])
      .filter((emp) => emp && emp.id)
      .map((emp) => {
        const user = emp.user || emp.User || {};
        const userId = String(emp.user_id ?? emp.UserID ?? user.id ?? "");
        return {
          value: `emp:${emp.id}`,
          type: "existing",
          employeeId: String(emp.id),
          userId,
          label: `${getUserName(user)} (${getEmpCode(user, emp)}) [Existing]`,
        };
      });

    const existingUserIds = new Set(existingOptions.map((opt) => opt.userId));
    const unmappedUserOptions = employeeUsers
      .filter((u) => !existingUserIds.has(String(u.id)))
      .map((u) => ({
        value: `user:${u.id}`,
        type: "new",
        employeeId: "",
        userId: String(u.id),
        label: `${getUserName(u)} (${u.usercode || `U-${u.id}`})`,
      }));

    return [...existingOptions, ...unmappedUserOptions];
  }, [employees, employeeUsers]);

  const openCreateModal = () => {
    setEditingRow(null);
    setForm({ selectedEmployee: "", departmentId: "", designationId: "" });
    setModalOpen(true);
  };

  const openEditModal = (row) => {
    const departmentId = String(row.department_id ?? row.DepartmentID ?? "");
    const designationId = String(row.designation_id ?? row.DesignationID ?? "");

    // If the row represents an existing employee record (has an id), open in edit mode
    // and preselect that employee. Otherwise it's an unmapped user row and we open
    // the modal in create mode with the user preselected so the user can create the mapping.
    if (row && row.id) {
      setEditingRow(row);
      setForm({ selectedEmployee: `emp:${row.id}`, departmentId, designationId });
    } else {
      // unmapped user row - preselect user:<id>
      const userId = row.user_id ?? row.UserID ?? row.user?.id ?? row.User?.id;
      setEditingRow(null);
      setForm({ selectedEmployee: `user:${userId}`, departmentId, designationId });
    }
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditingRow(null);
    setForm({ selectedEmployee: "", departmentId: "", designationId: "" });
  };

  const onSave = async () => {
    if (!form.selectedEmployee || !form.departmentId || !form.designationId) {
      setMessage({ type: "error", text: "Select employee, department, and designation" });
      return;
    }

    const selectedOption = employeeSelectOptions.find((opt) => opt.value === form.selectedEmployee);
    if (!selectedOption) {
      setMessage({ type: "error", text: "Please select a valid employee" });
      return;
    }

    setSaving(true);
    try {
      const payload = {
        user_id: Number(selectedOption.userId),
        department_id: Number(form.departmentId),
        designation_id: Number(form.designationId),
      };

      const updateId = editingRow?.id || (selectedOption.type === "existing" ? Number(selectedOption.employeeId) : null);

      if (updateId) {
        await axios.put(`${BASE_URL}/api/employees/${updateId}`, payload);
        setMessage({ type: "success", text: "Employee updated successfully" });
      } else {
        await axios.post(`${BASE_URL}/api/employees`, payload);
        setMessage({ type: "success", text: "Employee created successfully" });
      }

      await loadEmployees();
      closeModal();
    } catch (error) {
      console.error("Failed to save employee", error);
      const errorText = error?.response?.data?.error || "Failed to save employee";
      setMessage({ type: "error", text: errorText });
    } finally {
      setSaving(false);
    }
  };

  const onDelete = async (row) => {
    if (!window.confirm("Delete this employee record?")) {
      return;
    }

    try {
      await axios.delete(`${BASE_URL}/api/employees/${row.id}`);
      setMessage({ type: "success", text: "Employee deleted successfully" });
      await loadEmployees();
    } catch (error) {
      console.error("Failed to delete employee", error);
      const errorText = error?.response?.data?.error || "Failed to delete employee";
      setMessage({ type: "error", text: errorText });
    }
  };

  return (
    <section className="right-content manage-employees-page">
      <div className="manage-employees-header">
        <h2>Manage Employees</h2>
        {/* <button className="btn-primary" onClick={openCreateModal}>
          Manage Employee
        </button> */}
      </div>

      <div className="manage-employees-filters">
        <select
          value={filters.departmentId}
          onChange={(e) => setFilters((prev) => ({ ...prev, departmentId: e.target.value }))}
        >
          <option value="">All Departments</option>
          {departments.map((dept) => (
            <option key={dept.id} value={String(dept.id)}>
              {dept.name}
            </option>
          ))}
        </select>

        <select
          value={filters.designationId}
          onChange={(e) => setFilters((prev) => ({ ...prev, designationId: e.target.value }))}
        >
          <option value="">All Designations</option>
          {designations.map((desig) => (
            <option key={desig.id} value={String(desig.id)}>
              {desig.name}
            </option>
          ))}
        </select>

        <input
          type="text"
          placeholder="Search employee"
          value={filters.search}
          onChange={(e) => setFilters((prev) => ({ ...prev, search: e.target.value }))}
        />
      </div>

      <div className="manage-employees-table-wrap">
        <table className="manage-employees-table">
          <colgroup>
            <col style={{ width: "90px" }} />
            <col style={{ width: "360px" }} />
            <col style={{ width: "260px" }} />
            <col style={{ width: "260px" }} />
            <col style={{ width: "180px" }} />
          </colgroup>
          <thead>
            <tr>
              <th className="col-sno">Sl No.</th>
              <th className="col-employee">Employees</th>
              <th className="col-department">Department</th>
              <th className="col-designation">Designation</th>
              <th className="col-actions">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={5} className="table-empty">Loading...</td>
              </tr>
            ) : rows.length === 0 ? (
              <tr>
                <td colSpan={5} className="table-empty">No employees found</td>
              </tr>
            ) : (
              rows.map((row, index) => {
                const user = row.user || row.User || {};
                const department = row.department || row.Department || {};
                const designation = row.designation || row.Designation || {};

                return (
                  <tr key={row.id || `${row.user_id}-${index}`}>
                    <td className="col-sno">{index + 1}</td>
                    <td className="col-employee">
                      <div className="emp-name">{getUserName(user)}</div>
                      <div className="emp-sub">{getEmpCode(user, row)}</div>
                    </td>
                    <td className="col-department">{department.name || "-"}</td>
                    <td className="col-designation">{designation.name || "-"}</td>
                    <td className="col-actions">
                      <div className="table-actions">
                        <button className="action-btn edit" onClick={() => openEditModal(row)} aria-label="Edit employee">
                          <FiEdit2 />
                        </button>
                        <button className="action-btn delete" onClick={() => onDelete(row)} aria-label="Delete employee">
                          <FiTrash2 />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {modalOpen && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <h3>{editingRow ? "Update Employee" : "Manage Employee"}</h3>

            <div className="modal-grid">
              <label>
                Employee
                <select
                  value={form.selectedEmployee}
                  onChange={(e) => setForm((prev) => ({ ...prev, selectedEmployee: e.target.value }))}
                  disabled={Boolean(editingRow)}
                >
                  <option value="">Select Employee</option>
                  {employeeSelectOptions.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </label>

              <label>
                Department
                <select
                  value={form.departmentId}
                  onChange={(e) => setForm((prev) => ({ ...prev, departmentId: e.target.value }))}
                >
                  <option value="">Select Department</option>
                  {departments.map((dept) => (
                    <option key={dept.id} value={String(dept.id)}>
                      {dept.name}
                    </option>
                  ))}
                </select>
              </label>

              <label>
                Designation
                <select
                  value={form.designationId}
                  onChange={(e) => setForm((prev) => ({ ...prev, designationId: e.target.value }))}
                >
                  <option value="">Select Designation</option>
                  {designations.map((desig) => (
                    <option key={desig.id} value={String(desig.id)}>
                      {desig.name}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            <div className="modal-actions">
              <button className="btn-ghost" onClick={closeModal} disabled={saving}>
                Cancel
              </button>
              <button className="btn-primary" onClick={onSave} disabled={saving}>
                {saving ? "Saving..." : editingRow ? "Update" : "Create"}
              </button>
            </div>
          </div>
        </div>
      )}

      {message.text && (
        <div className={`manage-toast ${message.type}`}>
          <span>{message.text}</span>
          <button onClick={() => setMessage({ type: "", text: "" })}>x</button>
        </div>
      )}
    </section>
  );
}
