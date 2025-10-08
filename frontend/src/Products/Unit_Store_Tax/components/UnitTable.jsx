import {
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow, IconButton, Paper
} from "@mui/material";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";

export default function UnitTable({ units, onEdit, onDelete, page, rowsPerPage }) {
  return (
    <TableContainer component={Paper}>
      <Table size="small">
        <TableHead>
          <TableRow>
            <TableCell>S.No.</TableCell>
            <TableCell>Unit</TableCell>
            <TableCell>Description</TableCell>
            <TableCell align="right">Actions</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {units.map((unit, index) => (
            <TableRow key={unit.ID || index} sx={{ height: 36 }}>
              <TableCell sx={{ py: 0.5 }}>
                {(page * rowsPerPage) + index + 1}
              </TableCell>
              <TableCell sx={{ py: 0.5 }}>{unit.name || unit.Name}</TableCell>
              <TableCell sx={{ py: 0.5 }}>{unit.description || unit.Description}</TableCell>
              <TableCell align="right" sx={{ py: 0.5 }}>
                <IconButton size="small" onClick={() => onEdit(unit)}><EditIcon fontSize="small" /></IconButton>
                <IconButton size="small" onClick={() => onDelete(unit)}><DeleteIcon fontSize="small" /></IconButton>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
}
