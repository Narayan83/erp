import React from "react";
import { TableContainer, Table, TableHead, TableRow, TableCell, TableBody, Paper, IconButton } from "@mui/material";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";

export default function SizeTable({ data, onEdit, onDelete, page = 0, rowsPerPage = 5 }) {
  return (
    <TableContainer component={Paper}>
      <Table size="small" sx={{ tableLayout: 'fixed', '& .MuiTableCell-head': { textAlign: 'center' } }}>
        <TableHead>
          <TableRow>
            <TableCell style={{ textAlign: 'left', width: 60 }}>S.No.</TableCell>
            <TableCell align="center" sx={{ width: 200 }}>Size Code</TableCell>
            <TableCell align="center" sx={{ width: 'auto' }}>Description</TableCell>
            <TableCell style={{ textAlign: 'right', width: 120 }}>Actions</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {data.map((size, index) => (
            <TableRow key={size.id} sx={{ height: 36 }}>
              <TableCell align="left" sx={{ py: 0.5, width: 60 }}>
                {(page * rowsPerPage) + index + 1}
              </TableCell>
              <TableCell align="center" sx={{ py: 0.5, width: 200 }}>{size.code}</TableCell>
              <TableCell align="center" sx={{ py: 0.5, width: 'auto' }}>{size.description}</TableCell>
              <TableCell align="right" sx={{ py: 0.5, width: 120, textAlign: 'right' }}>
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
