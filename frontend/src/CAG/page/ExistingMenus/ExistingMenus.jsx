import React, { useState } from "react";
import { Box, Typography, TextField, Button, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, IconButton } from "@mui/material";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";

const menuRows = [
  { name: "about", remarks: "Menu: About" },
  { name: "admin", remarks: "Menu: Admin" },
  { name: "assigned_documents", remarks: "Menu: Assigned Documents" },
  { name: "audit_logs", remarks: "Menu: Audit Logs" },
  { name: "bulk_upload", remarks: "Menu: Bulk Upload" },
  { name: "data_validation", remarks: "Menu: Data Validation" },
  { name: "existing_menus", remarks: "Menu: Existing Menus" },
  { name: "feedback", remarks: "Menu: Feedback" },
  { name: "home", remarks: "Menu: Home" }
];

export default function ExistingMenus() {
  const [search, setSearch] = useState("");
  const filteredRows = menuRows.filter(row => row.name.includes(search.toLowerCase()));

  return (
    <Box className="existing-menus-root">
      <Box className="existing-menus-content">
        <Typography variant="h5" fontWeight={700} color="#1a237e">Existing Menus</Typography>
        <Typography variant="subtitle2" color="text.secondary" mb={3}>
          Manage all your available menus
        </Typography>
        <Box className="existing-menus-search-row">
          <TextField
            placeholder="Search menu..."
            size="small"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="existing-menus-search-input"
          />
          <Button variant="outlined" className="existing-menus-refresh-btn">
            Refresh
          </Button>
        </Box>
        <TableContainer component={Paper} className="existing-menus-table-container">
          <Table>
            <TableHead>
              <TableRow className="existing-menus-table-head-row">
                <TableCell className="existing-menus-table-head-cell">Menu Name &#8593;</TableCell>
                <TableCell className="existing-menus-table-head-cell">Permissions</TableCell>
                <TableCell className="existing-menus-table-head-cell">Remarks</TableCell>
                <TableCell className="existing-menus-table-head-cell">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredRows.map((row, idx) => (
                <TableRow key={row.name}>
                  <TableCell>{row.name}</TableCell>
                  <TableCell></TableCell>
                  <TableCell>{row.remarks}</TableCell>
                  <TableCell>
                    <IconButton className="existing-menus-edit-btn">
                      <EditIcon />
                    </IconButton>
                    <IconButton className="existing-menus-delete-btn">
                      <DeleteIcon />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Box>
    </Box>
  );
}
