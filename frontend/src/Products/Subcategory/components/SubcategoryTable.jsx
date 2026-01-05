import React from "react";
import {
  TableContainer,Table, TableHead, TableRow, TableCell,
  TableBody, TablePagination, Button,IconButton, Paper
} from "@mui/material";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
const SubcategoryTable = ({
  data, page, limit, total,
  onPageChange, onRowsPerPageChange,
  onEdit, onDelete
}) => {
  return (
    <>
    <TableContainer component={Paper}>
      <Table>
        <TableHead sx={{ '& .MuiTableCell-root': { textAlign: 'center' } }}>
          <TableRow>
            <TableCell>No.</TableCell>
            <TableCell>Category Name</TableCell>
            <TableCell>Subcategory Name</TableCell>
            <TableCell sx={{ width: 140 }}>Actions</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {data.map((sub, i) => (
            <TableRow key={sub.ID}>
        {/* page is 1-based in the parent; convert to zero-based for calculation
          guard against undefined/zero values to avoid NaN */}
        <TableCell align="center">{((page || 1) - 1) * (limit || 1) + i + 1}</TableCell>
             
              <TableCell align="center">{sub.Category.Name}</TableCell>
               <TableCell align="center">{sub.Name}</TableCell>
              <TableCell align="center">
                <IconButton size="small" onClick={() => onEdit(sub)}><EditIcon fontSize="small" /></IconButton>
                <IconButton size="small" onClick={() => onDelete(sub.ID)}><DeleteIcon fontSize="small" /></IconButton>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>  

      <TablePagination
        component="div"
        count={total}
        // MUI TablePagination expects a zero-based page index.
        // Parent `page` is 1-based, so convert here.
        page={Math.max(0, page - 1)}
        // newPage from MUI is zero-based; convert back to 1-based for parent.
        onPageChange={(_, newPage) => onPageChange(newPage + 1)}
        rowsPerPage={limit}
        onRowsPerPageChange={(e) => onRowsPerPageChange(parseInt(e.target.value, 10))}
        rowsPerPageOptions={[5, 10, 20]}
      />
    </>
  );
};

export default SubcategoryTable;
