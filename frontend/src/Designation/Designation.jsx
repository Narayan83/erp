 
import React, { useEffect, useState } from "react";
import { BASE_URL } from "../config/Config";
import "./designation.scss";


const Designation = ({ departments: departmentsProp }) => {
	const [departments, setDepartments] = useState([]);
	const [selectedDept, setSelectedDept] = useState(null);
	const [selectedEmployee, setSelectedEmployee] = useState(null);
	const [employees, setEmployees] = useState([]); // employees under selected dept
	const [allEmployees, setAllEmployees] = useState([]); // all available employees for dropdown
	const [loadingDepts, setLoadingDepts] = useState(false);
	const [loadingEmps, setLoadingEmps] = useState(false);
	const [loadingAllEmps, setLoadingAllEmps] = useState(false);
	const [saving, setSaving] = useState(false);
	const [snackbar, setSnackbar] = useState({ open: false, message: "", severity: "info" });
	const [editingRelationId, setEditingRelationId] = useState(null);
	const [searchQuery, setSearchQuery] = useState("");
	const [page, setPage] = useState(0);
	const [rowsPerPage, setRowsPerPage] = useState(10);
	const [deptSearchOpen, setDeptSearchOpen] = useState(false);
	const [empSearchOpen, setEmpSearchOpen] = useState(false);

	useEffect(() => {
		if (Array.isArray(departmentsProp) && departmentsProp.length) {
			setDepartments(departmentsProp);
			return;
		}

		const fetchDepartments = async () => {
			setLoadingDepts(true);
			try {
				const res = await fetch(`${BASE_URL}/departments?limit=1000`);
				if (!res.ok) throw new Error(`Failed to fetch departments: ${res.status}`);
				const data = await res.json();
				setDepartments(Array.isArray(data.departments) ? data.departments : data);
			} catch (err) {
				console.error(err);
			} finally {
				setLoadingDepts(false);
			}
		};

		fetchDepartments();
	}, [departmentsProp]);

	// Fetch all available employees for the dropdown
	useEffect(() => {
		const fetchAllEmployees = async () => {
			setLoadingAllEmps(true);
			try {
				// Prefer endpoint that returns non-head employees directly
				const endpoints = [
					`${BASE_URL}/api/employees/non-heads`,
					`${BASE_URL}/api/employees/non-heads`,
					// fallbacks
					`${BASE_URL}/api/employees`,
					`${BASE_URL}/api/employees`,
					`${BASE_URL}/users`,
				];
				for (const url of endpoints) {
					try {
						const res = await fetch(`${url}?limit=1000`);
						if (!res.ok) continue;
						const data = await res.json();
						// data may be an array or an object with list in different keys
						let payload = [];
						if (Array.isArray(data)) payload = data;
						else if (Array.isArray(data.data)) payload = data.data;
						else if (Array.isArray(data.users)) payload = data.users;
						else if (Array.isArray(data.employees)) payload = data.employees;
						else payload = [];
						if (payload.length) {
							setAllEmployees(payload);
							return;
						}
					} catch (err) {
						// try next endpoint
						continue;
					}
				}
				// nothing returned
				setAllEmployees([]);
			} catch (err) {
				console.error(err);
				setAllEmployees([]);
			} finally {
				setLoadingAllEmps(false);
			}
		};

		fetchAllEmployees();
	}, []);


	// Reusable fetcher for employees of a department by id
	const fetchDeptEmployeesById = async (deptId) => {
		if (!deptId) {
			setEmployees([]);
			return;
		}
		setLoadingEmps(true);
		try {
			const res = await fetch(`${BASE_URL}/departments/${deptId}/employees`);
			if (!res.ok) throw new Error(`Failed to fetch employees: ${res.status}`);
			const data = await res.json();

			const dept = departments.find((d) => String(d.id) === String(deptId)) || selectedDept;

			const emps = Array.isArray(data)
				? data
						.map((rel) => {
							const emp = rel.employee || rel.Employee;
							if (!emp) return null;
							return { ...emp, relationId: rel.ID || rel.id || rel.RelationID || rel.ID };
						})
						.filter(Boolean)
				: [];

			const headId = dept && dept.head ? String(dept.head.id) : null;
			const filtered = emps.filter((emp) => String(emp.id) !== String(headId));

			setEmployees(filtered);
		} catch (err) {
			console.error(err);
			setEmployees([]);
		} finally {
			setLoadingEmps(false);
		}
	};

	useEffect(() => {
		// initial fetch for selectedDept
		if (!selectedDept?.id) {
			setEmployees([]);
			setSelectedEmployee(null);
			return;
		}
		fetchDeptEmployeesById(selectedDept.id);
	}, [selectedDept, departments]);

	// Listen for global updates coming from other parts of the app and refresh instantly
	useEffect(() => {
		const onGlobalUpdate = (e) => {
			const deptId = e?.detail?.deptId || null;
			// If a specific dept changed and it's the current one, refresh employees
			if (deptId) {
				if (selectedDept && String(selectedDept.id) === String(deptId)) {
					fetchDeptEmployeesById(deptId);
				}
				// always refresh departments list so list views reflect changes
				(async () => {
					setLoadingDepts(true);
					try {
						const res = await fetch(`${BASE_URL}/departments?limit=1000`);
						if (res.ok) {
							const data = await res.json();
							setDepartments(Array.isArray(data.departments) ? data.departments : data);
						}
					} catch (err) {
						console.error(err);
					} finally {
						setLoadingDepts(false);
					}
				})();
			} else {
				// no dept provided — refresh everything
				fetchDeptEmployeesById(selectedDept?.id);
				(async () => {
					setLoadingDepts(true);
					try {
						const res = await fetch(`${BASE_URL}/departments?limit=1000`);
						if (res.ok) {
							const data = await res.json();
							setDepartments(Array.isArray(data.departments) ? data.departments : data);
						}
					} catch (err) {
						console.error(err);
					} finally {
						setLoadingDepts(false);
					}
				})();
			}
		};

		window.addEventListener('erp:departments-updated', onGlobalUpdate);
		return () => window.removeEventListener('erp:departments-updated', onGlobalUpdate);
	}, [selectedDept, departments]);

	const handleDeptChange = (event, newDept) => {
		setSelectedDept(newDept);
		setEmployees([]);
		setSelectedEmployee(null);
	};

	const handleEmployeeChange = (event, newEmp) => {
		setSelectedEmployee(newEmp);
	};

	const handleSearchChange = (e) => {
		setSearchQuery(e.target.value || "");
	};

	const handleChangePage = (event, newPage) => {
		setPage(newPage);
	};

	const handleChangeRowsPerPage = (event) => {
		setRowsPerPage(parseInt(event.target.value, 10));
		setPage(0);
	};

	const handleSaveAssignment = async () => {
		if (!selectedDept || !selectedEmployee) {
			setSnackbar({ open: true, message: "Please select both department and employee", severity: "warning" });
			return;
		}

		// Check if already assigned
		const alreadyAssigned = employees.some(emp => String(emp.id) === String(selectedEmployee.id));
		if (alreadyAssigned) {
			setSnackbar({ open: true, message: "Employee is already assigned to this department", severity: "warning" });
			return;
		}

		setSaving(true);
		try {
			// If we're editing an existing relation, remove it first
			if (editingRelationId) {
				try {
					await fetch(`${BASE_URL}/departments/employee/${editingRelationId}`, { method: "DELETE" });
				} catch (delErr) {
					console.warn("Failed to delete old relation before update:", delErr);
				}
			}
			const payload = {
				department_id: selectedDept.id,
				employee_id: selectedEmployee.id,
				assigned_by_id: selectedDept.head?.id || null,
			};

			const res = await fetch(`${BASE_URL}/departments/assign`, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify(payload),
			});

			if (!res.ok) {
				const errorData = await res.json().catch(() => ({}));
				throw new Error(errorData.error || "Failed to assign employee");
			}

			setSnackbar({ open: true, message: editingRelationId ? "Assignment updated successfully" : "Employee assigned successfully", severity: "success" });
			setSelectedEmployee(null);
			setEditingRelationId(null);
			
			// Refresh the employees list
			const refreshRes = await fetch(`${BASE_URL}/departments/${selectedDept.id}/employees`);
			if (refreshRes.ok) {
				const data = await refreshRes.json();
				const dept = departments.find((d) => String(d.id) === String(selectedDept.id)) || selectedDept;
				const emps = Array.isArray(data)
					? data
							.map((rel) => {
								const emp = rel.employee || rel.Employee;
								if (!emp) return null;
								return { ...emp, relationId: rel.ID || rel.id };
							})
							.filter(Boolean)
					: [];
				const headId = dept && dept.head ? String(dept.head.id) : null;
				const filtered = emps.filter((emp) => String(emp.id) !== String(headId));
				setEmployees(filtered);
				// Notify other parts of the app that departments/employees changed
				try { window.dispatchEvent(new CustomEvent('erp:departments-updated', { detail: { source: 'designation', deptId: selectedDept?.id || null } })); } catch (err) { /* ignore */ }
			}
		} catch (err) {
			console.error(err);
			setSnackbar({ open: true, message: err.message || "Error assigning employee", severity: "error" });
		} finally {
			setSaving(false);
		}
	};

	const currentDept = selectedDept || departments.find((d) => String(d.id) === String(selectedDept?.id)) || null;

	// Build rows to show only assigned employees
	const rows = (() => {
		if (selectedDept?.id) {
			if (!currentDept) return [];
			return employees.map((emp) => ({ type: "emp", emp, dept: currentDept }));
		}

		// No department selected -> build a flat list of all assigned employees across departments
		const allRelations = [];
		departments.forEach((dept) => {
			if (!dept) return;
			const rels = dept.Employees || dept.employees || [];
			if (!Array.isArray(rels) || rels.length === 0) return;
			rels.forEach((rel) => {
				const emp = rel.employee || rel.Employee || rel.EmployeeID || null;
				// Try multiple field shapes; if rel contains only employee_id, skip (no details)
				let employeeObj = null;
				if (emp && typeof emp === 'object') {
					employeeObj = { ...emp, relationId: rel.ID || rel.id || rel.RelationID || rel.relation_id };
				} else if (rel.Employee && typeof rel.Employee === 'object') {
					employeeObj = { ...rel.Employee, relationId: rel.ID || rel.id || rel.RelationID || rel.relation_id };
				}
				if (employeeObj) {
					allRelations.push({ type: 'emp', emp: employeeObj, dept });
				}
			});
		});
		return allRelations;
	})();

	// Filter rows by search query (department name, employee code, or employee name)
	const filteredRows = (() => {
		const q = (searchQuery || "").trim().toLowerCase();
		if (!q) return rows;
		return rows.filter(({ emp, dept }) => {
			const deptName = ((dept && ((dept.department && dept.department.name) || dept.departmentName || dept.name)) || "").toString().toLowerCase();
			const empCode = (displayCode(emp) || "").toString().toLowerCase();
			const empName = (displayName(emp) || "").toString().toLowerCase();
			return deptName.includes(q) || empCode.includes(q) || empName.includes(q);
		});
	})();

	// Paginate filtered results
	const pagedRows = (() => {
		const start = page * rowsPerPage;
		return filteredRows.slice(start, start + rowsPerPage);
	})();

	// Reset page if current page becomes out of range after filtering
	useEffect(() => {
		if (page > 0 && page * rowsPerPage >= filteredRows.length) {
			setPage(0);
		}
	}, [filteredRows, page, rowsPerPage]);

	const displayName = (user) => {
		if (!user) return "-";
		const sal = user.salutation || user.Salutation || user.sal || "";
		const first = user.firstname || user.Firstname || "";
		const last = user.lastname || user.Lastname || "";
		const name = `${first} ${last}`.trim() || user.usercode || "-";
		return `${sal ? sal + ' ' : ''}${name}`.trim();
	};

	const displayHeadName = (user) => {
		if (!user) return "-";
		const sal = user.salutation || user.Salutation || user.sal || "";
		const first = user.firstname || user.Firstname || user.firstname || "";
		const last = user.lastname || user.Lastname || user.lastname || "";
		const name = `${first} ${last}`.trim() || user.usercode || "-";
		return `${sal ? sal + " " : ""}${name}`.trim();
	};
	const displayCode = (user) => {
		return user?.usercode || user?.code || user?.user_code || "-";
	};

	const handleDelete = async (emp) => {
		if (!emp?.relationId) {
			setSnackbar({ open: true, message: "Cannot delete: missing relation id", severity: "error" });
			return;
		}
		if (!confirm(`Remove ${displayName(emp)} from this department?`)) return;
		try {
			const res = await fetch(`${BASE_URL}/departments/employee/${emp.relationId}`, { method: "DELETE" });
			if (!res.ok) throw new Error(await res.text());
			// remove locally
			setEmployees((prev) => prev.filter((e) => String(e.relationId) !== String(emp.relationId)));
			setSnackbar({ open: true, message: "Employee removed successfully", severity: "success" });
			// Notify other parts of the app that departments/employees changed
			try { window.dispatchEvent(new CustomEvent('erp:departments-updated', { detail: { source: 'designation', deptId: selectedDept?.id || null } })); } catch (err) { /* ignore */ }
		} catch (err) {
			console.error(err);
			setSnackbar({ open: true, message: "Failed to remove employee from department", severity: "error" });
		}
	};

	const handleEditRow = (emp, dept) => {
		// Populate the form to allow updating the relation
		setSelectedDept(dept);
		setSelectedEmployee(emp);
		setEditingRelationId(emp.relationId || emp.id || null);
	};

	return (
		<div className="designation-container">
			<div className="designation-paper">
				<h2 className="designation-title">Assign Employee to Head</h2>

				<div className="designation-controls">
					{/* Department Dropdown */}
					<div className="control-group">
						<label className="control-label">Select Department / Head</label>
						<select
							className="control-select"
							value={selectedDept ? selectedDept.id : ""}
							onChange={(e) => {
								const selected = departments.find(d => String(d.id) === e.target.value);
								handleDeptChange(null, selected || null);
							}}
						>
							<option value="">-- Select Department --</option>
							{departments.map((d) => (
								<option key={d.id} value={d.id}>
									{(d.department?.name || d.name || d.departmentName || "")} 
									{(displayCode(d?.head) ? `(${displayCode(d?.head)})` : "")} - {displayHeadName(d?.head)}
								</option>
							))}
						</select>
					</div>

					{/* Employee Dropdown */}
					<div className="control-group">
						<label className="control-label">Select Employee</label>
						<select
							className="control-select"
							value={selectedEmployee ? selectedEmployee.id : ""}
							onChange={(e) => {
								const selected = allEmployees.find(emp => String(emp.id) === e.target.value);
								handleEmployeeChange(null, selected || null);
							}}
							disabled={!selectedDept}
						>
							<option value="">-- Select Employee --</option>
							{allEmployees
								.filter(emp => {
									if (!emp) return false;
									const isHeadAnywhere = departments.some(d => {
										const headId = d?.head?.id ?? d?.head_id;
										return headId != null && String(headId) === String(emp.id);
									});
									const isCurrentHead = selectedDept?.head && String(selectedDept.head.id) === String(emp.id);
									const isAssignedToAnyDept = departments.some(d => {
										const rels = d.Employees || d.employees || [];
										if (!Array.isArray(rels)) return false;
										return rels.some(rel => {
											const assignedEmp = rel.employee || rel.Employee;
											const assignedEmpId = assignedEmp?.id || rel.employee_id || rel.EmployeeID;
											return assignedEmpId != null && String(assignedEmpId) === String(emp.id);
										});
									});
									const isCurrentlyEditing = editingRelationId && selectedEmployee && String(emp.id) === String(selectedEmployee.id);
									return !isHeadAnywhere && !isCurrentHead && (!isAssignedToAnyDept || isCurrentlyEditing);
								})
								.map((emp) => (
									<option key={emp.id} value={emp.id}>
										{displayName(emp)} ({displayCode(emp)})
									</option>
								))}
						</select>
					</div>

					{/* Cancel Button */}
					{editingRelationId && (
						<button
							className="btn btn-secondary"
							onClick={() => { setEditingRelationId(null); setSelectedEmployee(null); setSelectedDept(null); }}
						>
							Cancel
						</button>
					)}

					{/* Assign/Update Button */}
					<button
						className="btn btn-primary"
						onClick={handleSaveAssignment}
						disabled={!selectedDept || !selectedEmployee || saving}
					>
						{saving ? (editingRelationId ? "Updating..." : "Saving...") : (editingRelationId ? "Update" : "Assign")}
					</button>

					{/* Search Bar */}
					<div className="search-group">
						<input
							type="text"
							className="search-input"
							placeholder="Search by anything..."
							value={searchQuery}
							onChange={handleSearchChange}
						/>
						{searchQuery && (
							<button
								className="search-clear"
								type="button"
								onClick={() => setSearchQuery("")}
								title="Clear search"
							>
								✕
							</button>
						)}
					</div>
				</div>

				{/* Results Table */}
				<div className="designation-table-wrapper">
					<table className="designation-table">
						<thead>
							<tr>
								<th>Sl No.</th>
								<th>Department</th>
								<th>Head Emp Code</th>
								<th>Head</th>
								<th>Emp Code</th>
								<th>Employee Name</th>
								<th>Action</th>
							</tr>
						</thead>
						<tbody>
							{rows.length ? (
								filteredRows.length ? (
									pagedRows.map((r, idx) => {
										const emp = r.emp;
										const dept = r.dept;
										const globalIndex = page * rowsPerPage + idx;
										return (
											<tr key={emp.relationId || emp.id}>
												<td>{globalIndex + 1}</td>
												<td>{(dept && ((dept.department && dept.department.name) || dept.departmentName || dept.name)) || "-"}</td>
												<td>{displayCode(dept?.head)}</td>
												<td>{displayHeadName(dept?.head)}</td>
												<td>{displayCode(emp)}</td>
												<td>{displayName(emp)}</td>
												<td className="action-cell">
													<button
														className="action-btn edit-btn"
														onClick={() => handleEditRow(emp, dept)}
														title="Edit"
													>
														✎
													</button>
													<button
														className="action-btn delete-btn"
														onClick={() => handleDelete(emp)}
														title="Delete"
													>
														🗑
													</button>
												</td>
											</tr>
										);
									})
								) : (
									<tr>
										<td colSpan={7} className="no-data">No matching results.</td>
									</tr>
								)
							) : (
								<tr>
									<td colSpan={7} className="no-data">
										{loadingDepts || (selectedDept?.id && loadingEmps) ? (
											<div className="spinner">Loading...</div>
										) : selectedDept ? (
											"No employees assigned to this department."
										) : (
											"Please select a department to view assigned employees."
										)}
									</td>
								</tr>
							)}
						</tbody>
					</table>
				</div>

				{/* Pagination */}
				{filteredRows.length > 0 && (
					<div className="pagination-wrapper">
						<div className="pagination">
							<button
								className="pagination-btn"
								onClick={() => handleChangePage(null, Math.max(0, page - 1))}
								disabled={page === 0}
							>
								← Prev
							</button>
							<span className="pagination-info">
								Page {page + 1} of {Math.ceil(filteredRows.length / rowsPerPage)}
							</span>
							<button
								className="pagination-btn"
								onClick={() => handleChangePage(null, page + 1)}
								disabled={(page + 1) * rowsPerPage >= filteredRows.length}
							>
								Next →
							</button>
						</div>
						<div className="rows-per-page">
							<label>Rows per page:</label>
							<select
								value={rowsPerPage}
								onChange={(e) => handleChangeRowsPerPage({ target: { value: e.target.value } })}
							>
								<option value={5}>5</option>
								<option value={10}>10</option>
								<option value={25}>25</option>
								<option value={50}>50</option>
							</select>
						</div>
					</div>
				)}

				{/* Snackbar Notification */}
				{snackbar.open && (
					<div className={`snackbar snackbar-${snackbar.severity}`}>
						<span>{snackbar.message}</span>
						<button
							className="snackbar-close"
							onClick={() => setSnackbar({ ...snackbar, open: false })}
						>
							✕
						</button>
					</div>
				)}
			</div>
		</div>
	);
};

export default Designation;

