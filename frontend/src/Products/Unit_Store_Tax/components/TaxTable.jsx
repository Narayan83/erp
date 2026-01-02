import {
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  IconButton, Paper
} from "@mui/material";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";

export default function TaxTable({ taxes, onEdit, onDelete, page, rowsPerPage }) {
  console.log("TAXES DATA:", taxes); // Add this line to inspect your data
  return (
    <TableContainer component={Paper}>
      <Table size="small" sx={{ tableLayout: 'fixed' }}>
        <TableHead>
          <TableRow>
            <TableCell sx={{ width: 60 }}>S.No.</TableCell>
            <TableCell sx={{ width: '35%' }}>Tax Name</TableCell>
            <TableCell sx={{ width: 100 }}>Percentage</TableCell>
            <TableCell sx={{ width: 80 }}>IGST</TableCell>
            <TableCell sx={{ width: 80 }}>CGST</TableCell>
            <TableCell sx={{ width: 80 }}>SGST</TableCell>
            <TableCell sx={{ width: 120, textAlign: 'right' }}>Actions</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {taxes.map((tax, index) => (
            <TableRow key={tax.ID} sx={{ height: 36 }}>
              <TableCell sx={{ py: 0.5, width: 60 }}>
                {(page * rowsPerPage) + index + 1}
              </TableCell>
              <TableCell sx={{ py: 0.5, width: '35%' }}>
                {tax.Name || tax.name || tax.tax_name || "-"}
              </TableCell>
              <TableCell sx={{ py: 0.5, width: 100 }}>
                {(tax.Percentage ?? tax.percentage ?? tax.tax_percentage ?? "-")}{(tax.Percentage || tax.percentage || tax.tax_percentage) ? "%" : ""}
              </TableCell>
              <TableCell sx={{ py: 0.5, width: 80 }}>
                {(tax.IGST ?? tax.igst ?? tax.igst_percentage ?? tax.IGSTPercentage ?? "-")}{(tax.IGST || tax.igst || tax.igst_percentage || tax.IGSTPercentage) ? "%" : ""}
              </TableCell>
              <TableCell sx={{ py: 0.5, width: 80 }}>
                {(tax.CGST ?? tax.cgst ?? tax.cgst_percentage ?? tax.CGSTPercentage ?? "-")}{(tax.CGST || tax.cgst || tax.cgst_percentage || tax.CGSTPercentage) ? "%" : ""}
              </TableCell>
              <TableCell sx={{ py: 0.5, width: 80 }}>
                {(tax.SGST ?? tax.sgst ?? tax.sgst_percentage ?? tax.SGSTPercentage ?? "-")}{(tax.SGST || tax.sgst || tax.sgst_percentage || tax.SGSTPercentage) ? "%" : ""}
              </TableCell>
              <TableCell sx={{ py: 0.5, width: 120 }}>
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
