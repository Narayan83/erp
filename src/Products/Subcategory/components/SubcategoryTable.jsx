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
        <TableHead>
          <TableRow>
            <TableCell>#</TableCell>
            <TableCell>Cat. Name</TableCell>
            <TableCell>Sub. Name</TableCell>
            <TableCell align="right">Actions</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {data.map((sub, i) => (
            <TableRow key={sub.ID}>
              <TableCell>{page * limit + i + 1}</TableCell>
             
              <TableCell>{sub.Category.Name}</TableCell>
               <TableCell>{sub.Name}</TableCell>
              <TableCell align="right">
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
        page={page}
        onPageChange={(_, newPage) => onPageChange(newPage)}
        rowsPerPage={limit}
        onRowsPerPageChange={(e) => onRowsPerPageChange(parseInt(e.target.value, 10))}
        rowsPerPageOptions={[5, 10, 20]}
      />
    </>
  );
};

export default SubcategoryTable;
