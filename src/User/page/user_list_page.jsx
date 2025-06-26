// UserListPage.jsx
import React, { useEffect, useState } from "react";
import {
  Box,
  Button,
  Grid,
  TextField,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  CircularProgress,
  TablePagination,
} from "@mui/material";
import { Edit, Visibility } from "@mui/icons-material";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { BASE_URL } from "../../Config";

export default function UserListPage() {
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [filters, setFilters] = useState({ name: "" });
  const [page, setPage] = useState(0);
  const [limit, setRowsPerPage] = useState(10);
  const [totalItems, setTotalItems] = useState(0);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchUsers();
  }, [page, limit]);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${BASE_URL}/api/users`, {
        params: {
          page: page + 1,
          limit,
          filter: filters.name,
        },
      });
      setUsers(res.data.data);
      setTotalItems(res.data.total);
    } catch (err) {
      console.error("Error fetching users:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    setPage(0);
    fetchUsers();
  };

  return (
    <Box p={3}>
      <Typography variant="h5" mb={2}>👤 User Master</Typography>

      <Paper sx={{ p: 2, mb: 2 }}>
        <Grid container spacing={2}>
          <Grid item xs={12} md={6}>
            <TextField
              label="Search by Name"
              fullWidth
              size="small"
              value={filters.name}
              onChange={(e) => setFilters({ ...filters, name: e.target.value })}
            />
          </Grid>
          <Grid item xs={12}>
            <Button variant="contained" onClick={handleSearch}>Search</Button>
          </Grid>
        </Grid>
      </Paper>

      <Paper>
        {loading ? (
          <Box p={3} textAlign="center">
            <CircularProgress />
          </Box>
        ) : users.length === 0 ? (
          <Box p={3} textAlign="center">No users found.</Box>
        ) : (
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell sx={{ fontWeight: "bold" }}>Name</TableCell>
                  <TableCell sx={{ fontWeight: "bold" }}>Email</TableCell>
                  <TableCell sx={{ fontWeight: "bold" }}>Mobile</TableCell>
                  <TableCell sx={{ fontWeight: "bold" }} align="center">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {users.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell>{`${user.salutation || ""} ${user.firstname} ${user.lastname}`}</TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>{user.mobile_number}</TableCell>
                    <TableCell align="center">
                      <IconButton onClick={() => navigate(`/users/${user.id}`)}><Visibility /></IconButton>
                      <IconButton onClick={() => navigate(`/users/${user.id}/edit`)}><Edit /></IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}

        <Box p={2} display="flex" justifyContent="space-between" alignItems="center">
          <Button variant="contained" color="primary" onClick={() => navigate("/users/add")}>+ Add User</Button>
          <TablePagination
            component="div"
            count={totalItems}
            page={page}
            onPageChange={(e, newPage) => setPage(newPage)}
            rowsPerPage={limit}
            onRowsPerPageChange={(e) => {
              setRowsPerPage(parseInt(e.target.value, 10));
              setPage(0);
            }}
            rowsPerPageOptions={[5, 10, 25]}
          />
        </Box>
      </Paper>
    </Box>
  );
}
