import {
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  IconButton, Paper
} from "@mui/material";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";

export default function TaxTable({ taxes, onEdit, onDelete, page, rowsPerPage }) {
  return (
    <TableContainer component={Paper}>
      <Table size="small" sx={{ tableLayout: 'fixed', '& .MuiTableCell-head': { textAlign: 'center' } }}>
        <TableHead>
          <TableRow>
            <TableCell style={{ textAlign: 'left', width: 60 }}>S.No.</TableCell>
            <TableCell align="center" sx={{ width: '35%' }}>Tax Name</TableCell>
            <TableCell align="center" sx={{ width: 100 }}>Percentage</TableCell>
            <TableCell align="center" sx={{ width: 80 }}>IGST</TableCell>
            <TableCell align="center" sx={{ width: 80 }}>CGST</TableCell>
            <TableCell align="center" sx={{ width: 80 }}>SGST</TableCell>
            <TableCell style={{ textAlign: 'right', width: 120 }}>Actions</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {taxes.map((tax, index) => {
            const percRaw = tax.Percentage ?? tax.percentage ?? tax.tax_percentage;
            const perc = Number(percRaw);
            const percValid = Number.isFinite(perc);
            const igstVal = tax.IGST ?? tax.igst ?? tax.igst_percentage ?? tax.IGSTPercentage ?? (percValid ? perc : undefined);
            const cgstVal = tax.CGST ?? tax.cgst ?? tax.cgst_percentage ?? tax.CGSTPercentage ?? (percValid ? perc / 2 : undefined);
            const sgstVal = tax.SGST ?? tax.sgst ?? tax.sgst_percentage ?? tax.SGSTPercentage ?? (percValid ? perc / 2 : undefined);
            const fmt = (v) => {
              const n = Number(v);
              return Number.isFinite(n) ? `${n}%` : "-";
            };

            return (
              <TableRow key={tax.ID} sx={{ height: 36 }}>
                <TableCell align="left" sx={{ py: 0.5, width: 60 }}>
                  {(page * rowsPerPage) + index + 1}
                </TableCell>
                <TableCell align="center" sx={{ py: 0.5, width: '35%' }}>
                  {tax.Name || tax.name || tax.tax_name || "-"}
                </TableCell>
                <TableCell align="center" sx={{ py: 0.5, width: 100 }}>
                  {fmt(percRaw)}
                </TableCell>
                <TableCell align="center" sx={{ py: 0.5, width: 80 }}>
                  {fmt(igstVal)}
                </TableCell>
                <TableCell align="center" sx={{ py: 0.5, width: 80 }}>
                  {fmt(cgstVal)}
                </TableCell>
                <TableCell align="center" sx={{ py: 0.5, width: 80 }}>
                  {fmt(sgstVal)}
                </TableCell>
                <TableCell align="right" sx={{ py: 0.5, width: 120, textAlign: 'right' }}>
                  <IconButton size="small" onClick={() => onEdit(tax)}><EditIcon fontSize="small" /></IconButton>
                  <IconButton size="small" onClick={() => onDelete(tax)}><DeleteIcon fontSize="small" /></IconButton>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </TableContainer>
  );
}
