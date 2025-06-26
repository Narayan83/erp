import {
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  IconButton, Paper
} from "@mui/material";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";

export default function TaxTable({ taxes, onEdit, onDelete, page, rowsPerPage }) {
  return (
    <TableContainer component={Paper}>
      <Table size="small">
        <TableHead>
          <TableRow>
            <TableCell>S.No.</TableCell>
            <TableCell>Tax Name</TableCell>
            <TableCell>Percentage</TableCell>
            <TableCell align="right">Actions</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {taxes.map((tax, index) => (
            <TableRow key={tax.ID} sx={{ height: 36 }}>
              <TableCell sx={{ py: 0.5 }}>
                {(page * rowsPerPage) + index + 1}
              </TableCell>
              <TableCell sx={{ py: 0.5 }}>{tax.Name}</TableCell>
              <TableCell sx={{ py: 0.5 }}>{tax.Percentage}%</TableCell>
              <TableCell align="right" sx={{ py: 0.5 }}>
                <IconButton size="small" onClick={() => onEdit(tax)}><EditIcon fontSize="small" /></IconButton>
                <IconButton size="small" onClick={() => onDelete(tax)}><DeleteIcon fontSize="small" /></IconButton>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
}
