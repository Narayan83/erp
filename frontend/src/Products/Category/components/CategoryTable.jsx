import {
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow, IconButton, Paper
} from "@mui/material";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";

export default function CategoryTable({ categories, onEdit, onDelete, page, rowsPerPage }) {
  return (
    <TableContainer component={Paper}>
      <Table size="small">
        <TableHead sx={{ '& .MuiTableCell-root': { textAlign: 'center' } }}>
          <TableRow>
            <TableCell>S.No.</TableCell>
            <TableCell>Category Name</TableCell>
            <TableCell sx={{ width: 120 }}>Actions</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {categories.map((cat, index) => (
            <TableRow key={cat.ID} sx={{ height: 36 }}>
              <TableCell align="center" sx={{ py: 0.5 }}>
                {(page * rowsPerPage) + index + 1}
              </TableCell>
              <TableCell align="center" sx={{ py: 0.5 }}>{cat.Name}</TableCell>
              <TableCell align="center" sx={{ py: 0.5 }}>
                <IconButton size="small" onClick={() => onEdit(cat)}><EditIcon fontSize="small" /></IconButton>
                <IconButton size="small" onClick={() => onDelete(cat)}><DeleteIcon fontSize="small" /></IconButton>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
}
