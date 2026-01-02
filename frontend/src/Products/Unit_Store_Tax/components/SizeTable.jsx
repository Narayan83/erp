import React from "react";
import { TableContainer, Table, TableHead, TableRow, TableCell, TableBody, Paper, IconButton } from "@mui/material";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";

export default function SizeTable({ data, onEdit, onDelete, page = 0, rowsPerPage = 5 }) {
  return (
    <TableContainer component={Paper}>
      <Table size="small" sx={{ tableLayout: 'fixed' }}>
        <TableHead>
          <TableRow>
            <TableCell sx={{ width: 60 }}>S.No.</TableCell>
            <TableCell sx={{ width: 200 }}>Size Code</TableCell>
            <TableCell sx={{ width: 'auto' }}>Description</TableCell>
            <TableCell sx={{ width: 120, textAlign: 'right' }}>Actions</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {data.map((size, index) => (
            <TableRow key={size.id} sx={{ height: 36 }}>
              <TableCell sx={{ py: 0.5, width: 60 }}>
                {(page * rowsPerPage) + index + 1}
              </TableCell>
              <TableCell sx={{ py: 0.5, width: 200 }}>{size.code}</TableCell>
              <TableCell sx={{ py: 0.5, width: 'auto' }}>{size.description}</TableCell>
              <TableCell sx={{ py: 0.5, width: 120 }}>
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
