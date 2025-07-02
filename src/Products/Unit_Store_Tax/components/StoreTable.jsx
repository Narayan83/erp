import {
  Table, TableBody, TableCell, TableContainer, TableHead,
  TableRow, IconButton, Paper
} from "@mui/material";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";

export default function StoreTable({ stores, onEdit, onDelete, page, rowsPerPage }) {
  return (
    <TableContainer component={Paper}>
      <Table size="small">
        <TableHead>
          <TableRow>
            <TableCell>S.No.</TableCell>
            <TableCell>Store Name</TableCell>
            <TableCell align="right">Actions</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {stores.map((store, index) => (
            <TableRow key={store.ID} sx={{ height: 36 }}>
              <TableCell sx={{ py: 0.5 }}>{(page * rowsPerPage) + index + 1}</TableCell>
              <TableCell sx={{ py: 0.5 }}>{store.Name}</TableCell>
              <TableCell align="right" sx={{ py: 0.5 }}>
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
