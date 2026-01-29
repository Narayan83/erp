import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
} from "@mui/material";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";

export default function DepartmentTable({ rows, onEdit, onDelete, page = 0, rowsPerPage = 10 }) {
  // Slice rows for pagination (controlled by parent)
  const paginatedRows = rows.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage
  );

  return (
    <Paper elevation={2}>
      <TableContainer>
<Table stickyHeader sx={{ minWidth: 650 }}>
            <TableHead>
              <TableRow>
                <TableCell sx={{ width: 80 }}>S.No.</TableCell>
                <TableCell sx={{ width: '40%' }}>Department Name</TableCell>
                <TableCell sx={{ width: '40%' }}>Description</TableCell>
                <TableCell align="center" sx={{ width: 160 }}>Actions</TableCell>
            </TableRow>
          </TableHead>

          <TableBody>
            {paginatedRows.map((row, index) => (
              <TableRow key={row.id} hover>
                <TableCell sx={{ width: 80 }}>{page * rowsPerPage + index + 1}</TableCell>
                <TableCell sx={{ width: '40%' }}>{row.name}</TableCell>
                <TableCell sx={{ width: '40%' }}>{row.description}</TableCell>

                <TableCell align="center" sx={{ width: 160 }}>
                  <IconButton onClick={() => onEdit(row)}>
                    <EditIcon color="primary" />
                  </IconButton>

                  <IconButton onClick={() => onDelete(row.id)}>
                    <DeleteIcon color="error" />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}

            {paginatedRows.length === 0 && (
              <TableRow>
                <TableCell colSpan={4} align="center">
                  No records found
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>

      </TableContainer>

    </Paper>
  );
}
