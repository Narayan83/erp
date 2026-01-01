import React from "react";
import { TableContainer, Table, TableHead, TableRow, TableCell, TableBody, Paper, IconButton } from "@mui/material";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";

export default function SizeTable({ data, onEdit, onDelete, page = 0, rowsPerPage = 5 }) {
  return (
    <TableContainer component={Paper}>
      <Table size="small">
        <TableHead>
          <TableRow>
            <TableCell>S.No.</TableCell>
            <TableCell>Size Code</TableCell>
            <TableCell>Description</TableCell>
            <TableCell align="right">Actions</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {data.map((size, index) => (
            <TableRow key={size.id} sx={{ height: 36 }}>
              <TableCell sx={{ py: 0.5 }}>
                {(page * rowsPerPage) + index + 1}
              </TableCell>
              <TableCell sx={{ py: 0.5 }}>{size.code}</TableCell>
              <TableCell sx={{ py: 0.5 }}>{size.description}</TableCell>
              <TableCell align="right" sx={{ py: 0.5 }}>
                <IconButton size="small" onClick={() => onEdit(size)}><EditIcon fontSize="small" /></IconButton>
                <IconButton size="small" onClick={() => onDelete(size)}><DeleteIcon fontSize="small" /></IconButton>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
}
