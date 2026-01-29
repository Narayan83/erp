import React, { useEffect, useState } from "react";
import { BASE_URL } from "../config/Config";
import "./AssignUserToEmployee.scss";

export default function AssignUserToEmployee() {
  const [employees, setEmployees] = useState([]);
  const [allEmployees, setAllEmployees] = useState([]);
  const [users, setUsers] = useState([]);
  const [mappings, setMappings] = useState([]);
  const [selectedEmployee, setSelectedEmployee] = useState("");
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [selectedMappingUsers, setSelectedMappingUsers] = useState([]);
  const [shiftToEmployee, setShiftToEmployee] = useState("");
  const [mappingSearch, setMappingSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [empSearchOpen, setEmpSearchOpen] = useState(false);
  const [shiftEmpSearchOpen, setShiftEmpSearchOpen] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    setPage(0);
  }, [mappingSearch]);

  async function fetchData() {
    setLoading(true);
    try {
      const [empRes, allEmpRes, userRes, mapRes] = await Promise.all([
        fetch(`${BASE_URL}/api/employees/non-heads`),
        fetch(`${BASE_URL}/api/employees`),
        fetch(`${BASE_URL}/api/users/unassigned`),
        fetch(`${BASE_URL}/api/employee-user-mappings`),
      ]);

      if (!empRes.ok) throw new Error("Failed to fetch employees");
      if (!allEmpRes.ok) throw new Error("Failed to fetch all employees");
      if (!userRes.ok) throw new Error("Failed to fetch users");
      if (!mapRes.ok) throw new Error("Failed to fetch mappings");

      const empJson = await empRes.json();
      const allEmpJson = await allEmpRes.json();
      const userJson = await userRes.json();
      const mapJson = await mapRes.json();

      setEmployees(empJson || []);
      setAllEmployees(allEmpJson || []);
      setUsers(userJson || []);
      setMappings(mapJson || []);
    } catch (err) {
      console.error(err);
      window.alert("Error loading data: " + err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleAssign(e) {
    e?.preventDefault?.();
    if (!selectedEmployee || selectedUsers.length === 0) {
      window.alert("Select employee and at least one user");
      return;
    }

    try {
      if (!employees || employees.length === 0) {
        window.alert("No employees available — create employees before assigning users");
        return;
      }

      setLoading(true);
      for (const userId of selectedUsers) {
        const res = await fetch(`${BASE_URL}/api/employees/assign-user`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ employee_id: Number(selectedEmployee), user_id: Number(userId) }),
        });
        const json = await res.json();
        if (!res.ok) throw new Error(json.error || json.message || "Assign failed");
      }

      window.alert("Users assigned successfully");
      setSelectedEmployee("");
      setSelectedUsers([]);
      await fetchData();
    } catch (err) {
      console.error(err);
      window.alert("Assign error: " + err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleRemove(relationId) {
    if (!window.confirm("Remove user mapping for this employee?")) return;
    try {
      setLoading(true);
      const res = await fetch(`${BASE_URL}/api/employees/remove-user?id=${relationId}`, { method: "DELETE" });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || json.message || "Remove failed");
      window.alert(json.message || "Removed successfully");
      await fetchData();
    } catch (err) {
      console.error(err);
      window.alert("Remove error: " + err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleShiftUsers(e) {
    e?.preventDefault?.();
    if (selectedMappingUsers.length === 0 || !shiftToEmployee) {
      window.alert("Select users to shift and target employee");
      return;
    }

    try {
      setLoading(true);
      const res = await fetch(`${BASE_URL}/api/employees/shift-users`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_ids: selectedMappingUsers.map(Number), to_employee_id: Number(shiftToEmployee) }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || json.message || "Shift failed");
      window.alert(json.message || "Users shifted successfully");
      setSelectedMappingUsers([]);
      setShiftToEmployee("");
      await fetchData();
    } catch (err) {
      console.error(err);
      window.alert("Shift error: " + err.message);
    } finally {
      setLoading(false);
    }
  }

  function handleUserCheckbox(userId) {
    setSelectedUsers((prev) => (prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId]));
  }

  function handleMappingCheckbox(userId) {
    setSelectedMappingUsers((prev) => (prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId]));
  }

  function getUserType(user) {
    const types = [];
    if (!user) return "-";
    if (user.is_customer) types.push("Customer");
    if (user.is_supplier) types.push("Supplier");
    if (user.is_dealer) types.push("Dealer");
    if (user.is_distributor) types.push("Distributor");
    return types.length > 0 ? types.join(", ") : "User";
  }

  function getEmployeeName(emp) {
    if (!emp) return "-";
    const sal = emp.salutation ? `${emp.salutation} ` : "";
    const first = emp.firstname || "";
    const last = emp.lastname || "";
    const name = `${sal}${first}${last ? ` ${last}` : ""}`.trim();
    return name || "-";
  }

  const normalizedMappingQuery = mappingSearch.trim().toLowerCase();
  const filteredMappings = mappings.filter((m) => {
    if (!normalizedMappingQuery) return true;
    const empCode = m.employee && m.employee.usercode ? String(m.employee.usercode) : (m.employee ? String(m.employee.id) : String(m.employee_id));
    const empName = m.employee ? getEmployeeName(m.employee) : String(m.employee_id);
    const userCode = m.user && m.user.usercode ? String(m.user.usercode) : (m.user ? String(m.user.id) : String(m.user_id));
    const company = m.user ? (m.user.company_name || m.user.company || m.user.companyName || '') : '';
    const userType = m.user ? getUserType(m.user) : '';
    const hay = `${empCode} ${empName} ${userCode} ${company} ${userType}`.toLowerCase();
    return hay.includes(normalizedMappingQuery);
  });

  return (
    <div className="assign-container">
      <h1 className="assign-title">Assign User to Employee</h1>

      <div className="assign-content">
        {/* Assign Users Section */}
        <div className="assign-paper">
          <h2 className="section-title">Assign Users</h2>

          <div className="form-group">
            <label className="form-label">Select Employee</label>
            <select
              className="form-select"
              value={selectedEmployee}
              onChange={(e) => setSelectedEmployee(e.target.value)}
            >
              <option value="">-- Select Employee --</option>
              {employees.map((emp) => (
                <option key={emp.id} value={emp.id}>
                  {getEmployeeName(emp)}{emp.usercode ? ` (${emp.usercode})` : ""}
                </option>
              ))}
            </select>
          </div>

          <div className="subsection">
            <h3 className="subsection-title">Unassigned Users</h3>
            <div className="users-grid">
              {loading && users.length === 0 ? (
                <div className="loading-container">
                  <div className="spinner">Loading...</div>
                </div>
              ) : users.length === 0 ? (
                <div className="empty-message">No unassigned users available</div>
              ) : (
                users.map((u) => {
                  const primaryName = u.usercode ? `${u.usercode} — ${u.company_name || u.company || u.companyName || ''}` : `${u.firstname || ''} ${u.lastname || ''}`;
                  const isSelected = selectedUsers.includes(u.id);
                  return (
                    <div
                      key={u.id}
                      className={`user-card ${isSelected ? 'selected' : ''}`}
                      onClick={() => handleUserCheckbox(u.id)}
                    >
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={(e) => { e.stopPropagation(); handleUserCheckbox(u.id); }}
                        onClick={(e) => e.stopPropagation()}
                      />
                      <div className="user-info">
                        <div className="user-primary">{primaryName}</div>
                        <div className="user-secondary">{getUserType(u)}</div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          <div className="action-footer">
            <span className="selection-count">{selectedUsers.length} user(s) selected</span>
            <div className="button-group">
              <button
                className="btn btn-secondary"
                onClick={() => { setSelectedEmployee(''); setSelectedUsers([]); }}
              >
                Clear
              </button>
              <button
                className="btn btn-primary"
                onClick={handleAssign}
                disabled={loading || !selectedEmployee || selectedUsers.length === 0}
              >
                {loading ? 'Working...' : 'Assign Selected Users'}
              </button>
            </div>
          </div>
        </div>

        {/* Shift Users Section */}
        <div className="assign-paper">
          <h2 className="section-title">Shift Users Between Employees</h2>

          <form className="shift-form" onSubmit={handleShiftUsers}>
            <div className="form-group">
              <label className="form-label">Target Employee</label>
              <select
                className="form-select"
                value={shiftToEmployee}
                onChange={(e) => setShiftToEmployee(e.target.value)}
              >
                <option value="">-- Select Employee --</option>
                {employees.map((emp) => (
                  <option key={emp.id} value={emp.id}>
                    {getEmployeeName(emp)}{emp.usercode ? ` (${emp.usercode})` : ""}
                  </option>
                ))}
              </select>
            </div>

            <button
              type="submit"
              className="btn btn-secondary"
              disabled={loading || selectedMappingUsers.length === 0}
            >
              Shift Selected Users ({selectedMappingUsers.length})
            </button>

            <div className="search-group">
              <input
                type="text"
                className="search-input"
                placeholder="Search mappings..."
                value={mappingSearch}
                onChange={(e) => setMappingSearch(e.target.value)}
              />
            </div>
          </form>

          <div className="subsection">
            <h3 className="subsection-title">Current Mappings</h3>
            <div className="table-wrapper">
              <table className="mappings-table">
                <thead>
                  <tr>
                    <th className="col-select">Select</th>
                    <th className="col-slno">Sl No.</th>
                    <th>Emp Code</th>
                    <th>Employee Name</th>
                    <th>User Code</th>
                    <th>Company Name</th>
                    <th>User Type</th>
                    <th className="col-action">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredMappings.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="no-data">No mappings</td>
                    </tr>
                  ) : (
                    filteredMappings.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage).map((m, idx) => (
                      <tr key={m.id}>
                        <td className="col-select">
                          <input
                            type="checkbox"
                            checked={selectedMappingUsers.includes(m.user_id)}
                            onChange={() => handleMappingCheckbox(m.user_id)}
                          />
                        </td>
                        <td className="col-slno">{page * rowsPerPage + idx + 1}</td>
                        <td>{m.employee && m.employee.usercode ? m.employee.usercode : (m.employee ? m.employee.id : m.employee_id)}</td>
                        <td>{m.employee ? getEmployeeName(m.employee) : m.employee_id}</td>
                        <td>{m.user && m.user.usercode ? m.user.usercode : (m.user ? m.user.id : m.user_id)}</td>
                        <td>{m.user ? (m.user.company_name || m.user.company || m.user.companyName || '-') : '-'}</td>
                        <td>{m.user ? getUserType(m.user) : "-"}</td>
                        <td className="col-action">
                          <button
                            className="action-btn delete-btn"
                            onClick={() => handleRemove(m.id)}
                            title="Delete"
                          >
                            🗑
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {filteredMappings.length > 0 && (
              <div className="pagination-wrapper">
                <div className="pagination">
                  <button
                    className="pagination-btn"
                    onClick={() => setPage(Math.max(0, page - 1))}
                    disabled={page === 0}
                  >
                    ← Prev
                  </button>
                  <span className="pagination-info">
                    Page {page + 1} of {Math.ceil(filteredMappings.length / rowsPerPage)}
                  </span>
                  <button
                    className="pagination-btn"
                    onClick={() => setPage(page + 1)}
                    disabled={(page + 1) * rowsPerPage >= filteredMappings.length}
                  >
                    Next →
                  </button>
                </div>
                <div className="rows-per-page">
                  <label>Rows per page:</label>
                  <select
                    value={rowsPerPage}
                    onChange={(e) => {
                      setRowsPerPage(parseInt(e.target.value, 10));
                      setPage(0);
                    }}
                  >
                    <option value={5}>5</option>
                    <option value={10}>10</option>
                    <option value={25}>25</option>
                  </select>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
