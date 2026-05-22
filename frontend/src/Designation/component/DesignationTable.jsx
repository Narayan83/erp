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
import { useAuth } from "../../context/AuthContext";
import { useLocation } from "react-router-dom";

export default function DesignationTable({ rows, onEdit, onDelete, page = 0, rowsPerPage = 10 }) {
  const { getPermissions } = useAuth();
  const location = useLocation();
  const perms = getPermissions(location.pathname);
  // Slice rows for pagination (controlled by parent)
  const paginatedRows = rows.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage
  );

  return (
    <Paper sx={{ width: "100%", overflow: "hidden" }}>
      <TableContainer>
        <Table sx={{ minWidth: 650 }}>
          <TableHead>
            <TableRow>
              <TableCell sx={{ width: 80 }}>S.No.</TableCell>
              <TableCell sx={{ width: '60%' }}>Designation Name</TableCell>
              <TableCell sx={{ width: 120 }}>Level</TableCell>
              <TableCell sx={{ width: 150, textAlign: 'center' }}>Actions</TableCell>
            </TableRow>
          </TableHead>

          <TableBody>
            {paginatedRows.map((row, index) => (
              <TableRow key={row.id}>
                <TableCell sx={{ width: 80 }}>{page * rowsPerPage + index + 1}</TableCell>
                <TableCell sx={{ width: '60%' }}>{row.name}</TableCell>
                <TableCell sx={{ width: 120 }}>{row.level}</TableCell>
                <TableCell sx={{ width: 150, textAlign: 'center' }}>
                  {perms?.can_update && (
                    <IconButton onClick={() => onEdit(row)}>
                      <EditIcon color="primary" />
                    </IconButton>
                  )}
                  {perms?.can_delete && (
                    <IconButton onClick={() => onDelete(row.id)}>
                      <DeleteIcon color="error" />
                    </IconButton>
                  )}
                </TableCell>
              </TableRow>
            ))}

            {paginatedRows.length === 0 && (
              <TableRow>
                <TableCell colSpan={4} align="center">
                  No data found
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

    </Paper>
  );
}
