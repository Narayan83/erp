import React from "react";
import { TableContainer, Table, TableHead, TableRow, TableCell, TableBody, Paper, Button, IconButton } from "@mui/material";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";

export default function HsnTable({ data, onEdit, onDelete, page = 0, rowsPerPage = 5 }) {
  return (
    <TableContainer component={Paper}>
      <Table size="small">
        <TableHead>
          <TableRow>
            <TableCell>S.No.</TableCell>
            <TableCell>HSN Code</TableCell>
            <TableCell>Tax (%)</TableCell>
            <TableCell align="right">Actions</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {data.map((hsn, index) => (
            <TableRow key={hsn.id} sx={{ height: 36 }}>
              <TableCell sx={{ py: 0.5 }}>
                {(page * rowsPerPage) + index + 1}
              </TableCell>
              <TableCell sx={{ py: 0.5 }}>{hsn.code}</TableCell>
              <TableCell sx={{ py: 0.5 }}>
                {(() => {
                  const tax = hsn.tax;
                  if (tax && typeof tax === 'object') {
                    // Use tax.Name and tax.Percentage as per backend
                    const name = tax.Name || tax.name || "-";
                    const percentage = tax.Percentage ?? tax.percentage;
                    return percentage !== undefined && percentage !== null && percentage !== ""
                      ? `${name} (${percentage}%)`
                      : name;
                  } else if (tax) {
                    return tax;
                  } else {
                    return "-";
                  }
                })()}
              </TableCell>
              <TableCell align="right" sx={{ py: 0.5 }}>
                <IconButton size="small" onClick={() => onEdit(hsn)}><EditIcon fontSize="small" /></IconButton>
                <IconButton size="small" onClick={() => onDelete(hsn)}><DeleteIcon fontSize="small" /></IconButton>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
}
