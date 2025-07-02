import React, { useState, useEffect } from "react";
import {
  Box, Button, TextField, Typography
} from "@mui/material";
import axios from "axios";

import SubcategoryDialog from "../components/SubcategoryDialog";
import SubcategoryTable from "../components/SubcategoryTable";
import ConfirmDialog from "../components/ConfirmDialog";
import { BASE_URL }  from "../../../Config";

const SubcategoryPage = () => {
  const [subcategories, setSubcategories] = useState([]);
  const [filter, setFilter] = useState("");
  const [formData, setFormData] = useState({ id: null, name: "" });
  const [page, setPage] = useState(1); // Page starts from 1 for backend
  const [limit, setLimit] = useState(10);
  const [total, setTotal] = useState(0);

  const [openDialog, setOpenDialog] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState({ open: false, id: null });

  useEffect(() => {
    loadSubcategories();
  }, [page, limit, filter]);

  const loadSubcategories = async () => {
    try {
      const res = await axios.get(`${BASE_URL}/api/subcategories`, {
        params: {
          page,
          limit,
          filter: filter
        }
      });
      setSubcategories(res.data.data);
      setTotal(res.data.total);
    } catch (err) {
      console.error("Failed to fetch subcategories:", err);
    }
  };

//   const handleOpenDialog = (item = { id: null, name: "" }) => {
//     setFormData(item);
//     setOpenDialog(true);
//   };



const handleOpenDialog = async (item = { id: null, name: "" }) => {
    console.log(item);
  if (item.ID) {
    // Edit mode – fetch full subcategory with category

    try {
    //   const res = await axios.get(`${BASE_URL}/api/subcategories/${item.ID}`);
    //   const data = res.data;

      setFormData({
        id: item.ID,
        name: item.Name,
        category: item.Category || null,
        category_id: item.Category?.ID || null,
      });
      console.log(formData);
    } catch (err) {
      console.error("Failed to load subcategory details", err);
      showSnackbar("Failed to load subcategory", "error");
      return;
    }
  } else {
    // Add mode – reset form
    setFormData({
      id: null,
      name: "",
      category: null,
      category_id: null,
    });
  }

  setOpenDialog(true);
};




  const handleCloseDialog = () => {
    setOpenDialog(false);
    setFormData({ id: null, name: "" });
  };

  const handleSave = async () => {
    try {
      if (formData.id) {
        await axios.put(`${BASE_URL}/api/subcategories/${formData.id}`, formData);
      } else {
        await axios.post(`${BASE_URL}/api/subcategories`, formData);
      }
      handleCloseDialog();
      loadSubcategories();
    } catch (err) {
      console.error("Failed to save subcategory:", err);
    }
  };

  const handleDelete = async () => {
    try {
      await axios.delete(`${BASE_URL}/api/subcategories/${confirmDelete.id}`);
      setConfirmDelete({ open: false, id: null });
      loadSubcategories();
    } catch (err) {
      console.error("Failed to delete subcategory:", err);
    }
  };

  return (
     <section className="right-content">
    <Box p={3}>
      

      <Box display="flex" justifyContent="space-between" mb={2}>
        <h6>Manage Subcategories</h6>
        <TextField
          label="Filter by Name"
          value={filter}
          onChange={(e) => {
            setFilter(e.target.value);
            setPage(1);
          }}
          size="small"
        />
        <Button variant="contained" onClick={() => handleOpenDialog()}>
          Add Subcategory
        </Button>
      </Box>

      <SubcategoryTable
        data={subcategories}
        page={page}
        limit={limit}
        total={total}
        onPageChange={(newPage) => setPage(newPage)}
        onRowsPerPageChange={(val) => {
          setLimit(val);
          setPage(1);
        }}
        onEdit={(item) => handleOpenDialog(item)}
        onDelete={(id) => setConfirmDelete({ open: true, id })}
      />

      <SubcategoryDialog
        open={openDialog}
        onClose={handleCloseDialog}
        onSubmit={handleSave}
        formData={formData}
        setFormData={setFormData}
      />

      <ConfirmDialog
        open={confirmDelete.open}
        title="Delete Subcategory"
        content="Are you sure you want to delete this subcategory?"
        onCancel={() => setConfirmDelete({ open: false, id: null })}
        onConfirm={handleDelete}
      />
    </Box>
    </section>
  );
};

export default SubcategoryPage;
