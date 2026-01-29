import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { BASE_URL } from '../../config/Config';
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Button,
  IconButton,
  TextField,
  Box,
  Typography,
  Skeleton,
  Chip,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Pagination
} from "@mui/material";
import { Edit, Delete, Add, Check } from "@mui/icons-material";
import { MdOutlinePermIdentity } from "react-icons/md";

function Roles() {
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [page, setPage] = useState(1);
  const [rowsPerPage] = useState(10);
  const [sortField, setSortField] = useState("name");
  const [sortDirection, setSortDirection] = useState("asc");
  const navigate = useNavigate();

  useEffect(() => {
    fetchRoles();
  }, []);

  const fetchRoles = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token") || "";
      
      const headers = {
        "Content-Type": "application/json"
      };
      
      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
      }
      
      const response = await fetch(`${BASE_URL}/allroles`, {
        method: "GET",
        headers: headers,
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error("Failed to fetch roles");
      }

      const data = await response.json();
      setRoles(data);
    } catch (err) {
      setError(err.message);
      console.error("Error fetching roles:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (id) => {
    console.log("roles called.......");
    navigate(`/rolecreation/${id}`);
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this role? Users with this role will lose their permissions.")) return;
    
    try {
      const token = localStorage.getItem("token") || "";
      
      const headers = {
        "Content-Type": "application/json"
      };
      
      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
      }
      
      const response = await fetch(`${BASE_URL}/roles_delete/${id}`, {
        method: "DELETE",
        headers: headers,
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error("Failed to delete role");
      }

      fetchRoles();
    } catch (err) {
      console.error("Error deleting role:", err);
      alert(err.message);
    }
  };

  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  const filteredRoles = roles.filter(role =>
    role.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (role.description && role.description.toLowerCase().includes(searchTerm.toLowerCase())));

  const sortedRoles = [...filteredRoles].sort((a, b) => {
    const aValue = a[sortField] || "";
    const bValue = b[sortField] || "";
    
    if (aValue < bValue) {
      return sortDirection === "asc" ? -1 : 1;
    }
    if (aValue > bValue) {
      return sortDirection === "asc" ? 1 : -1;
    }
    return 0;
  });

  const paginatedRoles = sortedRoles.slice(
    (page - 1) * rowsPerPage,
    page * rowsPerPage
  );

  const renderSortIcon = (field) => {
    if (sortField !== field) return null;
    return sortDirection === "asc" ? "↑" : "↓";
  };

  return (
    <div className="page-container">
      <section className="page-content">
        <div className="page-header">
          <h2>
            <MdOutlinePermIdentity className="header-icon" />
            Roles Management
          </h2>
          <p>View and manage user roles and permissions</p>
        </div>
        
        <div className="container">
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              mb: 3,
              gap: 2
            }}
          >
            <TextField
              label="Search Roles"
              variant="outlined"
              size="small"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              sx={{ width: 300 }}
            />
            
            <Box sx={{ display: 'flex', gap: 2 }}>
              <FormControl size="small" sx={{ minWidth: 150 }}>
                <InputLabel>Sort By</InputLabel>
                <Select
                  value={sortField}
                  onChange={(e) => setSortField(e.target.value)}
                  label="Sort By"
                >
                  <MenuItem value="name">Name</MenuItem>
                  <MenuItem value="isDefault">Default Status</MenuItem>
                </Select>
              </FormControl>
              
              <Button
                variant="contained"
                color="primary"
                startIcon={<Add />}
                onClick={() => navigate("/roles_create/new")}
              >
                Add New Role
              </Button>
            </Box>
          </Box>
          
          {loading ? (
            <Box sx={{ width: '100%' }}>
              {[...Array(5)].map((_, index) => (
                <Skeleton key={index} variant="rectangular" height={53} sx={{ mb: 1 }} />
              ))}
            </Box>
          ) : error ? (
            <Typography color="error">{error}</Typography>
          ) : (
            <>
              <TableContainer component={Paper}>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell 
                        onClick={() => handleSort("name")}
                        sx={{ cursor: 'pointer', fontWeight: 'bold' }}
                      >
                        Role Name {renderSortIcon("name")}
                      </TableCell>
                      <TableCell>Description</TableCell>
                      <TableCell>Permissions</TableCell>
                      <TableCell 
                        onClick={() => handleSort("isDefault")}
                        sx={{ cursor: 'pointer', fontWeight: 'bold' }}
                      >
                        Default {renderSortIcon("isDefault")}
                      </TableCell>
                      <TableCell align="right">Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {paginatedRoles.length > 0 ? (
                      paginatedRoles.map((role) => (
                        <TableRow
                          key={role.id}
                          hover
                          sx={{ '&:last-child td, &:last-child th': { border: 0 } }}
                        >
                          <TableCell>{role.name}</TableCell>
                          <TableCell>
                            {role.description || <Typography color="textSecondary">-</Typography>}
                          </TableCell>
                          <TableCell>
                            {role.permissions && role.permissions.length > 0 ? (
                              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                                {role.permissions.map((perm) => (
                                  <Chip key={perm} label={perm} size="small" />
                                ))}
                              </Box>
                            ) : (
                              <Typography color="textSecondary">-</Typography>
                            )}
                          </TableCell>
                          <TableCell>
                            {role.isDefault ? <Check color="primary" /> : null}
                          </TableCell>
                          <TableCell align="right">
                            <IconButton
                              color="primary"
                              onClick={() => handleEdit(role.id)}
                              disabled={role.isDefault}
                            >
                              <Edit />
                            </IconButton>
                            <IconButton
                              color="error"
                              onClick={() => handleDelete(role.id)}
                              disabled={role.isDefault}
                            >
                              <Delete />
                            </IconButton>
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={5} align="center">
                          {searchTerm ? "No matching roles found" : "No roles available"}
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
              
              {filteredRoles.length > rowsPerPage && (
                <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
                  <Pagination
                    count={Math.ceil(filteredRoles.length / rowsPerPage)}
                    page={page}
                    onChange={(e, value) => setPage(value)}
                    color="primary"
                  />
                </Box>
              )}
            </>
          )}
        </div>
      </section>
    </div>
  );
}

export default Roles;