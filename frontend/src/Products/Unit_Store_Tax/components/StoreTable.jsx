import {
  Table, TableBody, TableCell, TableContainer, TableHead,
  TableRow, IconButton, Paper
} from "@mui/material";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";

export default function StoreTable({ stores, onEdit, onDelete, page, rowsPerPage }) {
  return (
    <TableContainer component={Paper}>
      <Table size="small" sx={{ tableLayout: 'fixed', '& .MuiTableCell-head': { textAlign: 'center' } }}>
        <TableHead>
          <TableRow>
            <TableCell style={{ textAlign: 'left', width: 60 }}>S.No.</TableCell>
            <TableCell align="center" sx={{ width: '70%' }}>Store Name</TableCell>
            <TableCell style={{ textAlign: 'right', width: 120 }}>Actions</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {stores.map((store, index) => (
            <TableRow key={store.ID} sx={{ height: 36 }}>
              <TableCell align="left" sx={{ py: 0.5, width: 60 }}>{(page * rowsPerPage) + index + 1}</TableCell>
              <TableCell align="center" sx={{ py: 0.5, width: '70%' }}>{store.Name}</TableCell>
              <TableCell align="right" sx={{ py: 0.5, width: 120, textAlign: 'right' }}>
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
