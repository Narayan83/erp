import {
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow, IconButton, Paper
} from "@mui/material";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";

export default function CategoryTable({ tags, onEdit, onDelete, page, rowsPerPage }) {
  return (
    <TableContainer component={Paper}>
      <Table size="small">
        <TableHead sx={{ '& .MuiTableCell-root': { textAlign: 'center' } }}>
          <TableRow>
            <TableCell>S.No.</TableCell>
            <TableCell>Tag Name</TableCell>
            <TableCell sx={{ width: 120 }}>Actions</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {tags.map((tag, index) => (
            <TableRow key={tag.ID} sx={{ height: 36 }}>
              <TableCell align="center" sx={{ py: 0.5 }}>
                {(page * rowsPerPage) + index + 1}
              </TableCell>
              <TableCell align="center" sx={{ py: 0.5 }}>{tag.Name}</TableCell>
              <TableCell align="center" sx={{ py: 0.5 }}>
                <IconButton size="small" onClick={() => onEdit(tag)}><EditIcon fontSize="small" /></IconButton>
                <IconButton size="small" onClick={() => onDelete(tag)}><DeleteIcon fontSize="small" /></IconButton>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
}
