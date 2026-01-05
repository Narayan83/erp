import {
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow, IconButton, Paper
} from "@mui/material";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";

export default function UnitTable({ units, onEdit, onDelete, page, rowsPerPage }) {
  return (
    <TableContainer component={Paper}>
      <Table size="small" sx={{ tableLayout: 'fixed', '& .MuiTableCell-head': { textAlign: 'center' } }}>
        <TableHead>
          <TableRow>
            <TableCell align="center" sx={{ width: 60 }}>S.No.</TableCell>
            <TableCell align="center" sx={{ width: 200 }}>Unit</TableCell>
            <TableCell align="center" sx={{ width: 'auto' }}>Description</TableCell>
            <TableCell align="center" sx={{ width: 120, textAlign: 'center' }}>Actions</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {units.map((unit, index) => (
            <TableRow key={unit.ID || index} sx={{ height: 36 }}>
              <TableCell align="center" sx={{ py: 0.5, width: 60 }}>
                {(page * rowsPerPage) + index + 1}
              </TableCell>
              <TableCell align="center" sx={{ py: 0.5, width: 200 }}>{unit.name || unit.Name}</TableCell>
              <TableCell align="center" sx={{ py: 0.5, width: 'auto' }}>{unit.description || unit.Description}</TableCell>
              <TableCell align="center" sx={{ py: 0.5, width: 120, textAlign: 'center' }}>
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
