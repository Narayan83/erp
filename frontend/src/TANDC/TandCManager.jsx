import React, { useEffect, useState } from "react";
import axios from "axios";
import { 
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  TextField,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  IconButton,
  Pagination,
  Stack,
  Typography,
} from "@mui/material";
import { Edit, Delete } from "@mui/icons-material";
import { BASE_URL } from "../Config";

export default function TandCManager() {
  const [tandcs, setTandcs] = useState([]);
  const [open, setOpen] = useState(false);
  const [editId, setEditId] = useState(null);
  const [formData, setFormData] = useState({ tandc_name: "", tandc_type: "" });
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const limit = 10;

  // Fetch all T&Cs
  const fetchTandcs = async () => {
    try {
      const res = await axios.get(`${BASE_URL}/api/tandc/`, {
        params: { page, limit, filter: search },
      });
      setTandcs(res.data.data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchTandcs();
  }, [page, search]);

  const handleOpen = (tandc = null) => {
    if (tandc) {
      setEditId(tandc.ID);
      setFormData({ tandc_name: tandc.TandcName, tandc_type: tandc.TandcType });
    } else {
      setEditId(null);
      setFormData({ tandc_name: "", tandc_type: "" });
    }
    setOpen(true);
  };

  const handleClose = () => setOpen(false);

  const handleChange = (e) =>
    setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleSubmit = async () => {
    try {
      if (editId) {
        await axios.put(`${BASE_URL}/api/tandc/${editId}`, {
          TandcName: formData.tandc_name,
          TandcType: formData.tandc_type,
        });
      } else {
        await axios.post(`${BASE_URL}/api/tandc`, {
          TandcName: formData.tandc_name,
          TandcType: formData.tandc_type,
        });
      }
      handleClose();
      fetchTandcs();
    } catch (err) {
      console.error(err);
      alert("Error saving T&C");
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this T&C?")) {
      try {
        await axios.delete(`${BASE_URL}/api/tandc/${id}`);
        fetchTandcs();
      } catch (err) {
        console.error(err);
      }
    }
  };

  return (
    <section className="right-content">

    
    <Box sx={{ p: 4 }}>
      <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2}>
        <Typography variant="h5">Terms & Conditions</Typography>
        <Button variant="contained" onClick={() => handleOpen()}>
          + Add T&C
        </Button>
      </Stack>

      <TextField
        label="Search"
        size="small"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        sx={{ mb: 2 }}
      />

      <Table>
        <TableHead>
          <TableRow>
            <TableCell>ID</TableCell>
            <TableCell>T&C Name</TableCell>
            <TableCell>T&C Type</TableCell>
            <TableCell align="right">Actions</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {tandcs.map((tandc) => (
            <TableRow key={tandc.ID}>
              <TableCell>{tandc.ID}</TableCell>
              <TableCell>{tandc.TandcName}</TableCell>
              <TableCell>{tandc.TandcType}</TableCell>
              <TableCell align="right">
                <IconButton onClick={() => handleOpen(tandc)}>
                  <Edit />
                </IconButton>
                <IconButton onClick={() => handleDelete(tandc.ID)}>
                  <Delete color="error" />
                </IconButton>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <Stack direction="row" justifyContent="center" mt={3}>
        <Pagination count={10} page={page} onChange={(e, v) => setPage(v)} />
      </Stack>

      <Dialog open={open} onClose={handleClose}>
        <DialogTitle>{editId ? "Edit T&C" : "Add New T&C"}</DialogTitle>
        <DialogContent sx={{ display: "flex", flexDirection: "column", gap: 2, mt: 1 }}>
          <TextField
            name="tandc_name"
            label="T&C Name"
            value={formData.tandc_name}
            onChange={handleChange}
            fullWidth
          />
          <TextField
            name="tandc_type"
            label="T&C Type"
            value={formData.tandc_type}
            onChange={handleChange}
            fullWidth
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose}>Cancel</Button>
          <Button variant="contained" onClick={handleSubmit}>
            {editId ? "Update" : "Add"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
    </section>
  );
}
