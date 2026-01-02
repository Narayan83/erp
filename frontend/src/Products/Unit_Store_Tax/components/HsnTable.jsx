import React from "react";
import { TableContainer, Table, TableHead, TableRow, TableCell, TableBody, Paper, Button, IconButton } from "@mui/material";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";

export default function HsnTable({ data, onEdit, onDelete, page = 0, rowsPerPage = 5 }) {
  return (
    <TableContainer component={Paper}>
      <Table size="small" sx={{ tableLayout: 'fixed' }}>
        <TableHead>
          <TableRow>
            <TableCell sx={{ width: 60 }}>S.No.</TableCell>
            <TableCell sx={{ width: '40%' }}>HSN Code</TableCell>
            <TableCell sx={{ width: '40%' }}>Tax (%)</TableCell>
            <TableCell sx={{ width: 120, textAlign: 'right' }}>Actions</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {data.map((hsn, index) => (
            <TableRow key={hsn.id} sx={{ height: 36 }}>
              <TableCell sx={{ py: 0.5, width: 60 }}>
                {(page * rowsPerPage) + index + 1}
              </TableCell>
              <TableCell sx={{ py: 0.5, width: '40%' }}>{hsn.code}</TableCell>
              <TableCell sx={{ py: 0.5, width: '40%' }}>
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
              <TableCell sx={{ py: 0.5, width: 120 }}>
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
