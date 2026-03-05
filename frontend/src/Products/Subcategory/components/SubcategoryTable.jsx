import React from "react";
import {
  TableContainer,Table, TableHead, TableRow, TableCell,
  TableBody, Button,IconButton, Paper
} from "@mui/material";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import Pagination from "../../../CommonComponents/Pagination";
import {useAuth} from "../../../context/AuthContext";

const SubcategoryTable = ({
  data, page, limit, total,
  onPageChange, onRowsPerPageChange,
  onEdit, onDelete
}) => {
  const { perms } = useAuth();
  return (
    <>
    <TableContainer component={Paper}>
      <Table>
        <TableHead sx={{ '& .MuiTableCell-root': { textAlign: 'center' } }}>
          <TableRow>
            <TableCell style={{ textAlign: 'left' }}>No.</TableCell>
            <TableCell>Category Name</TableCell>
            <TableCell>Subcategory Name</TableCell>
            <TableCell style={{ textAlign: 'right', width: 140 }}>Actions</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {data.map((sub, i) => (
            <TableRow key={sub.ID}>
        {/* page is 1-based in the parent; convert to zero-based for calculation
          guard against undefined/zero values to avoid NaN */}
        <TableCell align="left">{((page || 1) - 1) * (limit || 1) + i + 1}</TableCell> 
             
              <TableCell align="center">{sub.Category.Name}</TableCell>
               <TableCell align="center">{sub.Name}</TableCell>
              <TableCell align="right" sx={{ textAlign: 'right' }}>
                {perms?.can_update && (
                  <IconButton size="small" onClick={() => onEdit(sub)}><EditIcon fontSize="small" /></IconButton>
                )}
                {perms?.can_delete && (
                  <IconButton size="small" onClick={() => onDelete(sub.ID)}><DeleteIcon fontSize="small" /></IconButton>
                )}
              </TableCell> 
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>  

    <Pagination
      page={page}
      total={total}
      rowsPerPage={limit}
      onPageChange={onPageChange}
      onRowsPerPageChange={onRowsPerPageChange}
      isZeroBased={false}
    />
    </>
  );
};

export default SubcategoryTable;
