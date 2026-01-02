import {
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow, IconButton, Paper
} from "@mui/material";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";

export default function UnitTable({ units, onEdit, onDelete, page, rowsPerPage }) {
  return (
    <TableContainer component={Paper}>
      <Table size="small" sx={{ tableLayout: 'fixed' }}>
        <TableHead>
          <TableRow>
            <TableCell sx={{ width: 60 }}>S.No.</TableCell>
            <TableCell sx={{ width: 200 }}>Unit</TableCell>
            <TableCell sx={{ width: 'auto' }}>Description</TableCell>
            <TableCell sx={{ width: 120, textAlign: 'right' }}>Actions</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {units.map((unit, index) => (
            <TableRow key={unit.ID || index} sx={{ height: 36 }}>
              <TableCell sx={{ py: 0.5, width: 60 }}>
                {(page * rowsPerPage) + index + 1}
              </TableCell>
              <TableCell sx={{ py: 0.5, width: 200 }}>{unit.name || unit.Name}</TableCell>
              <TableCell sx={{ py: 0.5, width: 'auto' }}>{unit.description || unit.Description}</TableCell>
              <TableCell sx={{ py: 0.5, width: 120 }}>
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
