// // Department.jsx
// import React, { useState, useEffect } from "react";
// import {
//   Table,
//   TableBody,
//   TableCell,
//   TableContainer,
//   TableHead,
//   TableRow,
//   Paper,
//   Button,
//   TextField,
//   Box,
//   Typography,
//   IconButton,
//   Dialog,
//   DialogTitle,
//   DialogContent,
//   DialogActions,
//   Snackbar,
//   Alert,
//   TablePagination,
//   InputAdornment,
//   Autocomplete,
// } from "@mui/material";
// import {
//   Edit as EditIcon,
//   Delete as DeleteIcon,
//   Search as SearchIcon,
//   Add as AddIcon,
// } from "@mui/icons-material";
// import { useNavigate } from "react-router-dom";
// import axios from "axios";
// import { BASE_URL } from "../../config/Config";

// export default function Department() {
//   const navigate = useNavigate();
//   const [departments, setDepartments] = useState([]);
//   const [filters, setFilters] = useState({ search: "", name: "", designation: "", employee_id: "" });
//   const [page, setPage] = useState(0);
//   const [limit, setLimit] = useState(10);
//   const [totalItems, setTotalItems] = useState(0);
//   const [loading, setLoading] = useState(false);
//   const [employeesList, setEmployeesList] = useState([]);
//   const [allDepartments, setAllDepartments] = useState([]);
//   const [editingDepartmentId, setEditingDepartmentId] = useState(null);

//   // Delete confirmation state
//   const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
//   const [departmentToDelete, setDepartmentToDelete] = useState(null);

//   // Snackbar state
//   const [snackbarOpen, setSnackbarOpen] = useState(false);
//   const [snackbarMessage, setSnackbarMessage] = useState("");
//   const [snackbarSeverity, setSnackbarSeverity] = useState("info");

//   useEffect(() => {
//     fetchDepartments();
//   }, [page, limit, filters.search, filters.name, filters.designation, filters.employee_id]);

//   // Listen for global updates from other components (e.g., Designation)
//   useEffect(() => {
//     const handler = (e) => {
//       // reset to first page and refresh immediately
//       setPage(0);
//       fetchDepartments(0);
//       // refresh the unpaginated departments so head-exclusion is up-to-date
//       try { fetchAllDepartments(); } catch (err) { /* ignore */ }
//       // refresh the employees list used by the employee dropdown
//       try { fetchEmployees(); } catch (err) { /* ignore */ }
//     };
//     window.addEventListener('erp:departments-updated', handler);
//     return () => window.removeEventListener('erp:departments-updated', handler);
//   }, []);

//   const fetchDepartments = async (pageOverride) => {
//     setLoading(true);
//     try {
//       const usePage = typeof pageOverride === 'number' ? pageOverride : page;
//       const params = {
//         page: usePage + 1,
//         limit,
//         search: filters.search,
//         name: filters.name,
//         designation: filters.designation,
//         employee_id: filters.employee_id,
//       };
//       const response = await axios.get(`${BASE_URL}/departments`, { params });
//       setDepartments(response.data.departments || response.data);
//       setTotalItems(response.data.total || response.data.length);
//     } catch (error) {
//       console.error("Error fetching departments:", error);
//       showSnackbar("Error fetching departments", "error");
//     } finally {
//       setLoading(false);
//     }
//   };

//   // Fetch employees for dropdown
//   const fetchEmployees = async () => {
//     const params = { page: 1, limit: 1000 };
//     // Try the most likely endpoints in order until one succeeds
//     const endpoints = [`${BASE_URL}/api/employees`, `${BASE_URL}/employees`];
//     for (const url of endpoints) {
//       try {
//         const response = await axios.get(url, { params });
//         const payload = response.data.employees || response.data || [];
//         const safe = Array.isArray(payload) ? payload : [];
//         setEmployeesList(safe);
//         return;
//       } catch (err) {
//         // try next endpoint
//       }
//     }
//     console.error("Error fetching employees for dropdown: no endpoints succeeded");
//   };

//   useEffect(() => {
//     fetchEmployees();
//   }, []);

//   // Fetch all departments (unpaginated) to determine which employees are current heads
//   const fetchAllDepartments = async () => {
//     try {
//       const params = { page: 1, limit: 1000 };
//       const resp = await axios.get(`${BASE_URL}/departments`, { params });
//       const payload = resp.data.departments || resp.data || [];
//       const safe = Array.isArray(payload) ? payload : [];
//       setAllDepartments(safe);
//     } catch (err) {
//       // non-fatal; we still have paged `departments` for the table
//       console.warn('Failed to fetch all departments for head-exclusion:', err);
//       setAllDepartments([]);
//     }
//   };

//   useEffect(() => {
//     fetchAllDepartments();
//   }, []);

//   const handleSearchChange = (event) => {
//     setFilters((prev) => ({ ...prev, search: event.target.value }));
//     setPage(0);
//   };

//   const handleFilterChange = (field) => (event) => {
//     const value = event?.target?.value;
//     setFilters((prev) => ({ ...prev, [field]: value }));
//     setPage(0);
//   };

//   const handlePageChange = (event, newPage) => {
//     setPage(newPage);
//   };

//   const handleSave = async () => {
//     // Create a new department using the entered fields
//     // basic validation
//     const nameTrim = filters.name ? filters.name.trim() : "";
//     if (!nameTrim) {
//       showSnackbar("Department name is required", "warning");
//       return;
//     }

//     // Allow same department name, but disallow duplicate (department name + designation) pairs.
//     const designationTrim = filters.designation ? filters.designation.trim() : "";
//     const normalize = (s) => (s || "").trim().toLowerCase();

//     // Use the full unpaginated list if available to reduce false negatives due to pagination.
//     const searchList = (allDepartments && allDepartments.length) ? allDepartments : departments;

//     const duplicateLocal = (searchList || []).find((d) =>
//       normalize(d.name) === nameTrim.toLowerCase() && normalize(d.designation) === designationTrim.toLowerCase() && d.id !== editingDepartmentId
//     );
//     if (duplicateLocal) {
//       showSnackbar("Department with same designation already exists", "warning");
//       return;
//     }

//     // Query backend for same (name + designation) to avoid race/pagination issues.
//     try {
//       const params = { page: 1, limit: 1, name: nameTrim, designation: designationTrim };
//       const resp = await axios.get(`${BASE_URL}/departments`, { params });
//       const found = resp.data && (resp.data.departments ? resp.data.departments[0] : Array.isArray(resp.data) ? resp.data[0] : null);
//       if (
//         found &&
//         found.id !== editingDepartmentId &&
//         normalize(found.name) === nameTrim.toLowerCase() &&
//         normalize(found.designation) === designationTrim.toLowerCase()
//       ) {
//         showSnackbar("Department with same designation already exists", "warning");
//         return;
//       }
//     } catch (errCheck) {
//       // If the check fails, don't block save — log and continue. Backend might not support these filters.
//       console.warn("Name+designation uniqueness check failed, proceeding to save:", errCheck);
//     }

//     const payload = {
//       name: nameTrim,
//       designation: filters.designation || null,
//       head_id: filters.employee_id || null,
//     };

//     setLoading(true);
//     try {
//       if (editingDepartmentId) {
//         await axios.put(`${BASE_URL}/departments/${editingDepartmentId}`, payload);
//         showSnackbar("Department updated successfully", "success");
//         setEditingDepartmentId(null);
//       } else {
//         await axios.post(`${BASE_URL}/departments`, payload);
//         showSnackbar("Department created successfully", "success");
//       }

//       // If head_id is provided, update the employee's designation to "Department Head"
//       if (payload.head_id) {
//         try {
//           await axios.put(`${BASE_URL}/api/users/${payload.head_id}`, {
//             designation: "Department Head"
//           });
//         } catch (err) {
//           console.warn("Failed to update employee designation:", err);
//         }
//       }

//       // reset inputs
//       setFilters((prev) => ({ ...prev, name: "", designation: "", employee_id: "" }));
//       setPage(0);
//       await fetchDepartments(0);
//       // refresh the unpaginated list and employees dropdown so availableEmployees updates immediately
//       try { await fetchAllDepartments(); } catch (err) { /* ignore */ }
//       try { await fetchEmployees(); } catch (err) { /* ignore */ }
//       // notify other components that departments changed
//       try { window.dispatchEvent(new CustomEvent('erp:departments-updated', { detail: { source: 'department', id: editingDepartmentId || null } })); } catch (err) { /* ignore */ }
//     } catch (err) {
//       console.error("Error saving department:", err);
//       const msg = err?.response?.data?.error || "Error saving department";
//       showSnackbar(msg, "error");
//     } finally {
//       setLoading(false);
//     }
//   };

//   const handleCancelEdit = () => {
//     setEditingDepartmentId(null);
//     setFilters((prev) => ({ ...prev, name: "", designation: "", employee_id: "" }));
//   };

//   const handleLimitChange = (event) => {
//     setLimit(parseInt(event.target.value, 10));
//     setPage(0);
//   };

//   const handleAddDepartment = () => {
//     // For now, just show a message. You can implement add functionality later
//     showSnackbar("Add department functionality not implemented yet", "info");
//   };

//   const handleEditDepartment = (department) => {
//     // Enter edit mode and prefill the form with department values
//     setEditingDepartmentId(department.id);
//     setFilters((prev) => ({
//       ...prev,
//       name: department.name || "",
//       designation: department.designation || "",
//       employee_id: (department.head && department.head.id) || department.head_id || "",
//     }));
//   };

//   const handleDeleteDepartment = (department) => {
//     setDepartmentToDelete(department);
//     setConfirmDeleteOpen(true);
//   };

//   const confirmDelete = async () => {
//     if (!departmentToDelete) return;

//     try {
//       await axios.delete(`${BASE_URL}/departments/${departmentToDelete.id}`);
//       showSnackbar("Department deleted successfully", "success");
//       setPage(0);
//       await fetchDepartments(0);
//       // refresh the unpaginated list and employees dropdown so availableEmployees updates immediately
//       try { await fetchAllDepartments(); } catch (err) { /* ignore */ }
//       try { await fetchEmployees(); } catch (err) { /* ignore */ }
//       // notify other components that departments changed
//       try { window.dispatchEvent(new CustomEvent('erp:departments-updated', { detail: { source: 'department', id: departmentToDelete.id } })); } catch (err) { /* ignore */ }
//     } catch (error) {
//       console.error("Error deleting department:", error);
//       showSnackbar("Error deleting department", "error");
//     } finally {
//       setConfirmDeleteOpen(false);
//       setDepartmentToDelete(null);
//     }
//   };

//   const showSnackbar = (message, severity) => {
//     setSnackbarMessage(message);
//     setSnackbarSeverity(severity);
//     setSnackbarOpen(true);
//   };

//   const handleSnackbarClose = () => {
//     setSnackbarOpen(false);
//   };

//   // Compute employees that are not already assigned as department heads
//   // If editing a department, allow its current head to appear in the list
//   const availableEmployees = employeesList.filter((emp) => {
//     if (!emp) return false;
//     const empIdStr = emp.id != null ? String(emp.id) : "";

//     // Build a map of headId -> departmentId from the full department list (if available)
//     const headDeptMap = (allDepartments || []).reduce((acc, d) => {
//       const hid = d?.head?.id ?? d?.head_id;
//       if (hid != null) acc[String(hid)] = d.id;
//       return acc;
//     }, {});

//     const headDeptId = headDeptMap[empIdStr];

//     // If this employee is a head somewhere, exclude them unless they are the head of the department currently being edited
//     if (headDeptId != null) {
//       if (!editingDepartmentId) return false;
//       if (String(editingDepartmentId) !== String(headDeptId)) return false;
//     }

//     return true;
//   });

//   return (
//     <section className="right-content">
//       <Box sx={{ p: 1 }}>
//         <Typography variant="h5" gutterBottom>
//           Department Management
//         </Typography>

//         {/* Filters */}
//         <Box sx={{ mb: 3 }}>
//           <Box sx={{ mb: 2 }}>
//             <TextField
//               placeholder="Search"
//               variant="outlined"
//               size="small"
//               value={filters.search}
//               onChange={handleSearchChange}
//               InputProps={{
//                 endAdornment: (
//                   <InputAdornment position="end">
//                     <SearchIcon sx={{ color: '#1976d2' }} />
//                   </InputAdornment>
//                 ),
//               }}
//               sx={{
//                 minWidth: 300,
//                 '& .MuiOutlinedInput-root': {
//                   borderRadius: '4px',
//                   height: 40,
//                   backgroundColor: '#fff',
//                 },
//                 '& .MuiOutlinedInput-notchedOutline': {
//                   borderRadius: '4px',
//                 },
//               }}
//             />
//           </Box>
//           <Box sx={{ display: "flex", gap: 2, alignItems: "center", flexWrap: 'wrap' }}>
//             <TextField
//               label="Department"
//               variant="outlined"
//               size="small"
//               value={filters.name}
//               onChange={handleFilterChange('name')}
//               sx={{
//                 minWidth: 220,
//                 '& .MuiOutlinedInput-root': { height: 45, borderRadius: 1 },
//               }}
//             />

//             <TextField
//               label="Designation"
//               variant="outlined"
//               size="small"
//               value={filters.designation}
//               onChange={handleFilterChange('designation')}
//               sx={{
//                 minWidth: 300,
//                 '& .MuiOutlinedInput-root': { height: 45, borderRadius: 1 },
//               }}
//             />

//             <Autocomplete
//               options={availableEmployees}
//               size="small"
//               getOptionLabel={(option) => `${option.usercode ? `${option.usercode} - ` : ''}${`${option.salutation || ''} ${option.firstname || ''} ${option.lastname || ''}`.trim()}`}
//               value={employeesList.find(emp => String(emp.id) === String(filters.employee_id)) || null}
//               onChange={(event, newValue) => {
//                 handleFilterChange('employee_id')({ target: { value: newValue ? newValue.id : '' } });
//               }}
//               renderInput={(params) => (
//                 <TextField
//                   {...params}
//                   label="Employee"
//                   size="small"
//                   variant="outlined"
//                   sx={{ minWidth: 260, '& .MuiOutlinedInput-root': { height: 45, borderRadius: 1 } }}
//                 />
//               )}
//               isOptionEqualToValue={(option, value) => String(option?.id) === String(value?.id)}
//               clearOnEscape
//             />

//             <Button
//               variant="contained"
//               color="primary"
//               onClick={handleSave}
//               sx={{ height: 36, ml: 1 }}
//               disabled={loading}
//             >
//               {editingDepartmentId ? "Update" : "Save"}
//             </Button>
//             {editingDepartmentId && (
//               <Button variant="outlined" color="secondary" onClick={handleCancelEdit} sx={{ height: 36, ml: 1 }}>
//                 Cancel
//               </Button>
//             )}
//           </Box>
//         </Box>

//         {/* Table */}
//         <TableContainer component={Paper}>
//           <Table>
//             <TableHead>
//               <TableRow>
//                 <TableCell>Sl No.</TableCell>
//                 <TableCell>Emp. Code</TableCell>
//                 <TableCell>Dept. Head</TableCell>
//                 <TableCell>Department</TableCell>
//                 <TableCell>Designation</TableCell>
//                 <TableCell>Actions</TableCell>
//               </TableRow>
//             </TableHead>
//             <TableBody>
//               {loading ? (
//                 <TableRow>
//                   <TableCell colSpan={6} align="center">
//                     Loading...
//                   </TableCell>
//                 </TableRow>
//               ) : departments.length === 0 ? (
//                 <TableRow>
//                   <TableCell colSpan={6} align="center">
//                     No departments found
//                   </TableCell>
//                 </TableRow>
//               ) : (
//                 departments.map((department, index) => (
//                   <TableRow key={department.id}>
//                     <TableCell>{page * limit + index + 1}</TableCell>
//                     <TableCell>{department.head ? (department.head.usercode || department.head.user_code || '-') : '-'}</TableCell>
//                     <TableCell>
//                       {department.head
//                         ? `${department.head.salutation ? department.head.salutation + ' ' : ''}${department.head.firstname || ''} ${department.head.lastname || ''}`.trim()
//                         : "-"}
//                     </TableCell>
//                     <TableCell>{department.name}</TableCell>
//                     <TableCell>{department.designation || "-"}</TableCell>
//                     <TableCell>
//                       <IconButton
//                         onClick={() => handleEditDepartment(department)}
//                       >
//                         <EditIcon />
//                       </IconButton>
//                       <IconButton
//                         onClick={() => handleDeleteDepartment(department)}
//                       >
//                         <DeleteIcon />
//                       </IconButton>
//                     </TableCell>
//                   </TableRow>
//                 ))
//               )}
//             </TableBody>
//           </Table>
//         </TableContainer>

//         {/* Pagination */}
//         <TablePagination
//           component="div"
//           count={totalItems}
//           page={page}
//           onPageChange={handlePageChange}
//           rowsPerPage={limit}
//           onRowsPerPageChange={handleLimitChange}
//           rowsPerPageOptions={[5, 10, 25, 50]}
//         />

//         {/* Delete Confirmation Dialog */}
//         <Dialog open={confirmDeleteOpen} onClose={() => setConfirmDeleteOpen(false)}>
//           <DialogTitle>Confirm Delete</DialogTitle>
//           <DialogContent>
//             Are you sure you want to delete this department? This action cannot be undone.
//           </DialogContent>
//           <DialogActions>
//             <Button onClick={() => setConfirmDeleteOpen(false)}>Cancel</Button>
//             <Button onClick={confirmDelete} color="error">
//               Delete
//             </Button>
//           </DialogActions>
//         </Dialog>

//         {/* Snackbar */}
//         <Snackbar
//           open={snackbarOpen}
//           autoHideDuration={6000}
//           onClose={handleSnackbarClose}
//           anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
//         >
//           <Alert onClose={handleSnackbarClose} severity={snackbarSeverity}>
//             {snackbarMessage}
//           </Alert>
//         </Snackbar>
//       </Box>
//     </section>
//   );
// }



import { useEffect, useState } from "react";
import {
  getDepartments,
  createDepartment,
  updateDepartment,
  deleteDepartment,
} from "../component/departmentApi";

import DepartmentFormModal from "../component/DepartmentFormModal";
import DepartmentTable from "../component/DepartmentTable";
import Pagination from "../../CommonComponents/Pagination";
import './Department.scss';

export default function Departments() {
  const [departments, setDepartments] = useState([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [editData, setEditData] = useState(null);

  // pagination
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  const loadData = async () => {
    const res = await getDepartments();
    setDepartments(res.data.data || res.data);
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCreate = () => {
    setEditData(null);
    setModalOpen(true);
  };

  const handleEdit = (row) => {
    setEditData(row);
    setModalOpen(true);
  };

  const handleDelete = async (id) => {
    if (confirm("Delete this department?")) {
      await deleteDepartment(id);
      loadData();
    }
  };

  const handleSubmit = async (data) => {
    if (editData) {
      await updateDepartment(editData.id, data);
    } else {
      await createDepartment(data);
    }

    setModalOpen(false);
    loadData();
  };

  return (
    <div className="departments-page">
      <div className="page-header">
        <h2>Departments</h2>
        <button className="btn primary" onClick={handleCreate}>+ Add Department</button>
      </div>

      <div className="table-wrap">
        <DepartmentTable
          rows={departments}
          onEdit={handleEdit}
          onDelete={handleDelete}
          page={page}
          rowsPerPage={rowsPerPage}
        />
      </div>

      <div className="pagination" style={{ marginTop: 12 }}>
        <Pagination
          page={page}
          total={departments.length}
          rowsPerPage={rowsPerPage}
          onPageChange={(p) => setPage(p)}
          onRowsPerPageChange={(r) => { setRowsPerPage(r); setPage(0); }}
        />
      </div>

      <DepartmentFormModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSubmit={handleSubmit}
        initialData={editData}
      />
    </div>
  );
}
