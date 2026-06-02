import React, { useCallback, useEffect, useState } from "react";
import { BASE_URL, getAuthHeaders } from "../config/Config";
import "./AssignUserToEmployee.scss";

export default function AssignUserToEmployee() {
  const [employees, setEmployees] = useState([]);
  const [allEmployees, setAllEmployees] = useState([]);
  const [users, setUsers] = useState([]);
  const [unassignedTotal, setUnassignedTotal] = useState(0);
  const [unassignedPage, setUnassignedPage] = useState(1);
  const [unassignedLimit, setUnassignedLimit] = useState(25);
  const [unassignedSearch, setUnassignedSearch] = useState("");
  const [debouncedUnassignedSearch, setDebouncedUnassignedSearch] = useState("");
  const [unassignedUserType, setUnassignedUserType] = useState("");
  const [unassignedListLoading, setUnassignedListLoading] = useState(false);

  const [mappings, setMappings] = useState([]);
  const [selectedEmployee, setSelectedEmployee] = useState("");
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [selectedMappingUsers, setSelectedMappingUsers] = useState([]);
  const [shiftToEmployee, setShiftToEmployee] = useState("");
  const [mappingSearch, setMappingSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [mappingPage, setMappingPage] = useState(0);
  const [mappingRowsPerPage, setMappingRowsPerPage] = useState(10);
  const [empSearchOpen, setEmpSearchOpen] = useState(false);
  const [shiftEmpSearchOpen, setShiftEmpSearchOpen] = useState(false);

  const fetchUnassignedUsers = useCallback(async () => {
    setUnassignedListLoading(true);
    try {
      const params = new URLSearchParams();
      params.set("page", String(unassignedPage));
      params.set("limit", String(unassignedLimit));
      if (debouncedUnassignedSearch) params.set("filter", debouncedUnassignedSearch);
      if (unassignedUserType) params.set("user_type", unassignedUserType);

      const res = await fetch(`${BASE_URL}/api/users/unassigned?${params.toString()}`, {
        headers: getAuthHeaders(),
      });
      if (!res.ok) throw new Error("Failed to fetch unassigned users");
      const json = await res.json();
      const rows = Array.isArray(json.data) ? json.data : [];
      setUsers(rows);
      setUnassignedTotal(typeof json.total === "number" ? json.total : 0);
    } catch (err) {
      console.error(err);
      window.alert("Error loading unassigned users: " + err.message);
      setUsers([]);
      setUnassignedTotal(0);
    } finally {
      setUnassignedListLoading(false);
    }
  }, [unassignedPage, unassignedLimit, debouncedUnassignedSearch, unassignedUserType]);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedUnassignedSearch(unassignedSearch.trim()), 350);
    return () => clearTimeout(t);
  }, [unassignedSearch]);

  useEffect(() => {
    setUnassignedPage(1);
  }, [debouncedUnassignedSearch]);

  useEffect(() => {
    fetchUnassignedUsers();
  }, [fetchUnassignedUsers]);

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    setMappingPage(0);
  }, [mappingSearch]);

  async function fetchData() {
    setLoading(true);
    try {
      const [empRes, allEmpRes, mapRes] = await Promise.all([
        fetch(`${BASE_URL}/api/employees/non-heads`, { headers: getAuthHeaders() }),
        fetch(`${BASE_URL}/api/employees`, { headers: getAuthHeaders() }),
        fetch(`${BASE_URL}/api/employee-user-mappings`, { headers: getAuthHeaders() }),
      ]);

      if (!empRes.ok) throw new Error("Failed to fetch employees");
      if (!allEmpRes.ok) throw new Error("Failed to fetch all employees");
      if (!mapRes.ok) throw new Error("Failed to fetch mappings");

      const empJson = await empRes.json();
      const allEmpJson = await allEmpRes.json();
      const mapJson = await mapRes.json();

      setEmployees(empJson || []);
      setAllEmployees(allEmpJson || []);
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
          headers: getAuthHeaders(),
          body: JSON.stringify({ employee_id: Number(selectedEmployee), user_id: Number(userId) }),
        });
        const json = await res.json();
        if (!res.ok) throw new Error(json.error || json.message || "Assign failed");
      }

      window.alert("Users assigned successfully");
      setSelectedEmployee("");
      setSelectedUsers([]);
      await fetchData();
      await fetchUnassignedUsers();
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
      const res = await fetch(`${BASE_URL}/api/employees/remove-user?id=${relationId}`, { method: "DELETE", headers: getAuthHeaders() });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || json.message || "Remove failed");
      window.alert(json.message || "Removed successfully");
      await fetchData();
      await fetchUnassignedUsers();
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
        headers: getAuthHeaders(),
        body: JSON.stringify({ user_ids: selectedMappingUsers.map(Number), to_employee_id: Number(shiftToEmployee) }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || json.message || "Shift failed");
      window.alert(json.message || "Users shifted successfully");
      setSelectedMappingUsers([]);
      setShiftToEmployee("");
      await fetchData();
      await fetchUnassignedUsers();
    } catch (err) {
      console.error(err);
      window.alert("Shift error: " + err.message);
    } finally {
      setLoading(false);
    }
  }

  function handleUserCheckbox(userId) {
    const id = Number(userId);
    setSelectedUsers((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  }

  function handleMappingCheckbox(userId) {
    setSelectedMappingUsers((prev) => (prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId]));
  }

  function getUserType(user) {
    if (!user) return "-";
    const types = [];
    if (user.is_employee) types.push("Employee");
    if (user.is_customer) types.push("Customer");
    if (user.is_supplier) types.push("Supplier");
    if (user.is_dealer) types.push("Dealer");
    if (user.is_distributor) types.push("Distributor");
    if (user.is_user && types.length === 0) types.push("User");
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

  function isAdminLikeUser(user) {
    if (!user) return false;
    const code = String(user.usercode || "").trim().toLowerCase();
    const username = String(user.username || "").trim().toLowerCase();
    const email = String(user.email || "").trim().toLowerCase();
    const first = String(user.firstname || "").trim().toLowerCase();
    const last = String(user.lastname || "").trim().toLowerCase();
    const full = `${first} ${last}`.trim();

    return (
      code.startsWith("adm") ||
      code.startsWith("admin") ||
      username === "admin" ||
      username.startsWith("admin@") ||
      email.startsWith("admin@") ||
      full === "admin"
    );
  }

  const normalizedMappingQuery = mappingSearch.trim().toLowerCase();
  const filteredMappings = mappings.filter((m) => {
    if (!normalizedMappingQuery) return true;
    const empCode = m.employee && m.employee.usercode ? String(m.employee.usercode) : (m.employee ? String(m.employee.id) : String(m.employee_id));
    const empName = m.employee ? getEmployeeName(m.employee) : String(m.employee_id);
    const userCode = m.user && m.user.usercode ? String(m.user.usercode) : (m.user ? String(m.user.id) : String(m.user_id));
    const company = m.user ? (m.user.company_name || m.user.company || m.user.companyName || "") : "";
    const userType = m.user ? getUserType(m.user) : "";
    const hay = `${empCode} ${empName} ${userCode} ${company} ${userType}`.toLowerCase();
    return hay.includes(normalizedMappingQuery);
  });

  const visibleUnassignedUsers = users.filter((u) => !u.is_employee && !isAdminLikeUser(u));

  const unassignedTotalPages = Math.max(1, Math.ceil(unassignedTotal / unassignedLimit) || 1);

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
                  {getEmployeeName(emp)}
                  {emp.usercode ? ` (${emp.usercode})` : ""}
                </option>
              ))}
            </select>
          </div>

          <div className="subsection">
            <h3 className="subsection-title">Unassigned Users</h3>

            <div className="unassigned-toolbar">
              <div className="search-group unassigned-search">
                <input
                  type="text"
                  className="search-input"
                  placeholder="Search by name, code, email, company…"
                  value={unassignedSearch}
                  onChange={(e) => setUnassignedSearch(e.target.value)}
                />
              </div>
              <div className="unassigned-filter">
                <label className="form-label inline-label" htmlFor="unassigned-user-type">
                  User type
                </label>
                <select
                  id="unassigned-user-type"
                  className="form-select filter-select"
                  value={unassignedUserType}
                  onChange={(e) => {
                    setUnassignedUserType(e.target.value);
                    setUnassignedPage(1);
                  }}
                >
                  <option value="">All types</option>
                  <option value="user">User (is_user)</option>
                  <option value="customer">Customer</option>
                  <option value="supplier">Supplier</option>
                  <option value="dealer">Dealer</option>
                  <option value="distributor">Distributor</option>
                </select>
              </div>
            </div>

            <div className="table-wrapper unassigned-table-wrapper">
              <table className="mappings-table unassigned-users-table">
                <thead>
                  <tr>
                    <th className="col-select">Select</th>
                    <th className="col-slno">Sl No.</th>
                    <th className="col-user-code">User code</th>
                    <th className="col-name-company">Name / company</th>
                    <th className="col-user-type">User type</th>
                  </tr>
                </thead>
                <tbody>
                  {unassignedListLoading && visibleUnassignedUsers.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="no-data">
                        Loading unassigned users…
                      </td>
                    </tr>
                  ) : visibleUnassignedUsers.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="no-data">
                        No unassigned users for this filter
                      </td>
                    </tr>
                  ) : (
                    visibleUnassignedUsers.map((u, idx) => {
                      const uid = Number(u.id);
                      const isSelected = selectedUsers.includes(uid);
                      const code = u.usercode || `—`;
                      const displayLine = u.usercode
                        ? `${u.usercode} — ${u.company_name || u.company || u.companyName || ""}`.trim()
                        : `${(u.firstname || "").trim()} ${(u.lastname || "").trim()}`.trim() || "—";
                      return (
                        <tr
                          key={u.id}
                          className={isSelected ? "unassigned-row selected" : "unassigned-row"}
                          onClick={() => handleUserCheckbox(uid)}
                        >
                          <td className="col-select" onClick={(e) => e.stopPropagation()}>
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => handleUserCheckbox(uid)}
                              onClick={(e) => e.stopPropagation()}
                            />
                          </td>
                          <td className="col-slno">{(unassignedPage - 1) * unassignedLimit + idx + 1}</td>
                          <td className="col-user-code">{code}</td>
                          <td className="col-name-company">{displayLine}</td>
                          <td className="col-user-type">{getUserType(u)}</td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {unassignedTotal > 0 && (
              <div className="pagination-wrapper">
                <div className="pagination">
                  <button
                    type="button"
                    className="pagination-btn"
                    onClick={() => setUnassignedPage((p) => Math.max(1, p - 1))}
                    disabled={unassignedPage <= 1 || unassignedListLoading}
                  >
                    ← Prev
                  </button>
                  <span className="pagination-info">
                    Page {unassignedPage} of {unassignedTotalPages} ({unassignedTotal} total)
                  </span>
                  <button
                    type="button"
                    className="pagination-btn"
                    onClick={() => setUnassignedPage((p) => p + 1)}
                    disabled={unassignedPage >= unassignedTotalPages || unassignedListLoading}
                  >
                    Next →
                  </button>
                </div>
                <div className="rows-per-page">
                  <label htmlFor="unassigned-rows">Rows per page:</label>
                  <select
                    id="unassigned-rows"
                    value={unassignedLimit}
                    onChange={(e) => {
                      setUnassignedLimit(parseInt(e.target.value, 10));
                      setUnassignedPage(1);
                    }}
                  >
                    <option value={10}>10</option>
                    <option value={25}>25</option>
                    <option value={50}>50</option>
                    <option value={100}>100</option>
                  </select>
                </div>
              </div>
            )}
          </div>

          <div className="action-footer">
            <span className="selection-count">{selectedUsers.length} user(s) selected</span>
            <div className="button-group">
              <button
                className="btn btn-secondary"
                onClick={() => {
                  setSelectedEmployee("");
                  setSelectedUsers([]);
                }}
              >
                Clear
              </button>
              <button
                className="btn btn-primary"
                onClick={handleAssign}
                disabled={loading || !selectedEmployee || selectedUsers.length === 0}
              >
                {loading ? "Working…" : "Assign Selected Users"}
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
                    {getEmployeeName(emp)}
                    {emp.usercode ? ` (${emp.usercode})` : ""}
                  </option>
                ))}
              </select>
            </div>

            <button type="submit" className="btn btn-secondary" disabled={loading || selectedMappingUsers.length === 0}>
              Shift Selected Users ({selectedMappingUsers.length})
            </button>

            <div className="search-group">
              <input
                type="text"
                className="search-input"
                placeholder="Search mappings…"
                value={mappingSearch}
                onChange={(e) => setMappingSearch(e.target.value)}
              />
            </div>
          </form>

          <div className="subsection">
            <h3 className="subsection-title">Current Mappings</h3>
            <div className="table-wrapper">
              <table className="mappings-table current-mappings-table">
                <thead>
                  <tr>
                    <th className="col-select">Select</th>
                    <th className="col-slno">Sl No.</th>
                    <th className="col-emp-code">Emp Code</th>
                    <th className="col-emp-name">Employee Name</th>
                    <th className="col-map-user-code">User Code</th>
                    <th className="col-company-name">Company Name</th>
                    <th className="col-map-user-type">User Type</th>
                    <th className="col-action">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredMappings.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="no-data">
                        No mappings
                      </td>
                    </tr>
                  ) : (
                    filteredMappings
                      .slice(mappingPage * mappingRowsPerPage, mappingPage * mappingRowsPerPage + mappingRowsPerPage)
                      .map((m, idx) => (
                        <tr key={m.id}>
                          <td className="col-select">
                            <input
                              type="checkbox"
                              checked={selectedMappingUsers.includes(m.user_id)}
                              onChange={() => handleMappingCheckbox(m.user_id)}
                            />
                          </td>
                          <td className="col-slno">{mappingPage * mappingRowsPerPage + idx + 1}</td>
                          <td className="col-emp-code">{m.employee && m.employee.usercode ? m.employee.usercode : (m.employee ? m.employee.id : m.employee_id)}</td>
                          <td className="col-emp-name">{m.employee ? getEmployeeName(m.employee) : m.employee_id}</td>
                          <td className="col-map-user-code">{m.user && m.user.usercode ? m.user.usercode : (m.user ? m.user.id : m.user_id)}</td>
                          <td className="col-company-name">{m.user ? (m.user.company_name || m.user.company || m.user.companyName || "-") : "-"}</td>
                          <td className="col-map-user-type">{m.user ? getUserType(m.user) : "-"}</td>
                          <td className="col-action">
                            <button className="action-btn delete-btn" onClick={() => handleRemove(m.id)} title="Delete">
                              🗑
                            </button>
                          </td>
                        </tr>
                      ))
                  )}
                </tbody>
              </table>
            </div>

            {filteredMappings.length > 0 && (
              <div className="pagination-wrapper">
                <div className="pagination">
                  <button
                    type="button"
                    className="pagination-btn"
                    onClick={() => setMappingPage(Math.max(0, mappingPage - 1))}
                    disabled={mappingPage === 0}
                  >
                    ← Prev
                  </button>
                  <span className="pagination-info">
                    Page {mappingPage + 1} of {Math.ceil(filteredMappings.length / mappingRowsPerPage)}
                  </span>
                  <button
                    type="button"
                    className="pagination-btn"
                    onClick={() => setMappingPage(mappingPage + 1)}
                    disabled={(mappingPage + 1) * mappingRowsPerPage >= filteredMappings.length}
                  >
                    Next →
                  </button>
                </div>
                <div className="rows-per-page">
                  <label htmlFor="mapping-rows">Rows per page:</label>
                  <select
                    id="mapping-rows"
                    value={mappingRowsPerPage}
                    onChange={(e) => {
                      setMappingRowsPerPage(parseInt(e.target.value, 10));
                      setMappingPage(0);
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
