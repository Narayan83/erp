import {
  Table, TableBody, TableCell, TableContainer, TableHead,
  TableRow, IconButton, Paper
} from "@mui/material";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";

export default function StoreTable({ stores, onEdit, onDelete, page, rowsPerPage }) {
  return (
    <TableContainer component={Paper}>
      <Table size="small" sx={{ tableLayout: 'fixed' }}>
        <TableHead>
          <TableRow>
            <TableCell sx={{ width: 60 }}>S.No.</TableCell>
            <TableCell sx={{ width: '70%' }}>Store Name</TableCell>
            <TableCell sx={{ width: 120, textAlign: 'right' }}>Actions</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {stores.map((store, index) => (
            <TableRow key={store.ID} sx={{ height: 36 }}>
              <TableCell sx={{ py: 0.5, width: 60 }}>{(page * rowsPerPage) + index + 1}</TableCell>
              <TableCell sx={{ py: 0.5, width: '70%' }}>{store.Name}</TableCell>
              <TableCell sx={{ py: 0.5, width: 120 }}>
                <IconButton size="small" onClick={() => onEdit(store)}><EditIcon fontSize="small" /></IconButton>
                <IconButton size="small" onClick={() => onDelete(store)}><DeleteIcon fontSize="small" /></IconButton>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
}
