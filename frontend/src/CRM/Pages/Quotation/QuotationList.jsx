import React, { useEffect, useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  TextField,
  IconButton,
  Button,
  Box,
  Grid,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormGroup,
  FormControlLabel,
  Checkbox,
  Typography,
} from "@mui/material";
import { Edit, Delete, ViewList, Download, Print, Mail, WhatsApp } from "@mui/icons-material";
import axios from "axios";
import QuotationForm from "./QuotationForm";
import { BASE_URL } from "../../../Config";

import { debounce } from "lodash";

const QuotationList = () => {
  const [quotations, setQuotations] = useState([]);

  const [editData, setEditData] = useState(null);
  const [page, setPage] = useState(1);
  const [limit] = useState(10);

  const [filters, setFilters] = useState({
    quotation_number: "",
    customer: "",
    quotation_date: "",
    status: "",
  });

  const [displayPrefOpen, setDisplayPrefOpen] = useState(false);
  const [displayCols, setDisplayCols] = useState({
    quotation_number: true,
    customer: true,
    quotation_date: true,
    status: true,
  });

  const [expiryFilter, setExpiryFilter] = useState("");
  const [quoteStateFilter, setQuoteStateFilter] = useState("");
  const [executive, setExecutive] = useState("");

  useEffect(() => {
    fetchQuotations();
  }, [page, filters]);

  useEffect(() => {
    console.log("Updated quotations state:", quotations);
  }, [quotations]);

  const fetchQuotations = async () => {
    try {
      const res = await axios.get(`${BASE_URL}/api/quotations`, {
        params: {
          page,
          limit,
          quotation_number: filters.quotation_number,
          customer: filters.customer,
          quotation_date: filters.quotation_date,
          status: filters.status,
          expiry: expiryFilter,
          quotation_state: quoteStateFilter,
          executive,
        },
      });
      console.log("Fetched quotations:", res.data.data);
      setQuotations(res.data.data || []);
    } catch (error) {
      console.error("Failed to fetch quotations", error);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure to delete this quotation?")) {
      await axios.delete(`${BASE_URL}/api/quotations/${id}`);
      fetchQuotations();
    }
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters((prev) => ({ ...prev, [name]: value }));
    setPage(1); // Reset to first page when filter changes
  };

  const debouncedFilterChange = debounce(handleFilterChange, 500);
  // const filteredQuotations = quotations.filter((q) => {
  //   return (
  //     q.quotation_number.toLowerCase().includes(filters.quotation_number.toLowerCase()) &&
  //     q.Customer?.name.toLowerCase().includes(filters.customer.toLowerCase())
  //   );
  // });

  const allSelected = Object.values(displayCols).every(Boolean);

  const openDisplayPref = () => setDisplayPrefOpen(true);
  const closeDisplayPref = () => setDisplayPrefOpen(false);

  const handleSelectAllChange = (e) => {
    const checked = e.target.checked;
    setDisplayCols({
      quotation_number: checked,
      customer: checked,
      quotation_date: checked,
      status: checked,
    });
  };

  const handleColChange = (e) => {
    const { name, checked } = e.target;
    setDisplayCols((prev) => ({ ...prev, [name]: checked }));
  };

  // Build exportable rows respecting visible columns
  const buildExportData = () => {
    const cols = [];
    if (displayCols.quotation_number) cols.push({ key: "quotation_number", label: "Quotation Number" });
    if (displayCols.customer) cols.push({ key: "customer", label: "Customer" });
    cols.push({ key: "grand_total", label: "Grand Total" });
    if (displayCols.quotation_date) cols.push({ key: "quotation_date", label: "Quotation Date" });
    if (displayCols.status) cols.push({ key: "status", label: "Status" });

    const data = quotations.map((q) => {
      const customerName = q.customer
        ? [q.customer.salutation, q.customer.firstname, q.customer.lastname].filter(Boolean).join(" ")
        : "";
      const row = {};
      cols.forEach((c) => {
        if (c.key === "customer") row[c.label] = customerName;
        else if (c.key === "quotation_date")
          row[c.label] = q.quotation_date ? new Date(q.quotation_date).toLocaleDateString() : "";
        else if (c.key === "grand_total") row[c.label] = (q.grand_total ?? 0).toFixed(2);
        else row[c.label] = q[c.key] ?? "";
      });
      return row;
    });
    return { cols, data };
  };

  // Fallback CSV download
  const downloadCSV = (cols, data, filename = "quotations.csv") => {
    const headers = cols.map((c) => `"${c.label}"`).join(",");
    const rows = data.map((r) =>
      cols.map((c) => {
        const cell = (r[c.label] ?? "").toString().replace(/"/g, '""');
        return `"${cell}"`;
      }).join(",")
    );
    const csv = [headers, ...rows].join("\r\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.href = url;
    link.setAttribute("download", filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Export handler: tries xlsx, falls back to CSV
  const handleExport = async () => {
    const { cols, data } = buildExportData();
    try {
      const XLSX = await import("xlsx");
      const ws = XLSX.utils.json_to_sheet(data);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Quotations");
      XLSX.writeFile(wb, "quotations.xlsx");
    } catch (err) {
      // xlsx not available -> fallback to CSV
      downloadCSV(cols, data, "quotations.csv");
    }
  };

  // Print handler: opens a new window with a print-friendly table and triggers the print dialog
  const handlePrint = () => {
    const { cols, data } = buildExportData();
    const style = `
      <style>
        table { width: 100%; border-collapse: collapse; font-family: Arial, sans-serif; }
        th, td { border: 1px solid #ccc; padding: 8px; text-align: left; }
        th { background: #f5f5f5; }
      </style>
    `;
    const header = `<h2>Quotation List</h2>`;
    const tableHeader = `<tr>${cols.map(c => `<th>${c.label}</th>`).join('')}</tr>`;
    const tableRows = data
      .map(row => `<tr>${cols.map(c => `<td>${(row[c.label] ?? "").toString()}</td>`).join('')}</tr>`)
      .join('');
    const html = `<!doctype html><html><head><meta charset="utf-8">${style}</head><body>${header}<table>${tableHeader}${tableRows}</table></body></html>`;

    const printWindow = window.open("", "_blank", "width=900,height=700");
    if (!printWindow) {
      // Fallback to native print if popup blocked
      window.print();
      return;
    }
    printWindow.document.open();
    printWindow.document.write(html);
    printWindow.document.close();
    // Wait for content to render, then print
    printWindow.focus();
    printWindow.onload = () => {
      printWindow.print();
      // optionally close window after printing:
      // printWindow.close();
    };
  };

  return (
    <section className="right-content">
      <h2>Quotation List</h2>

      {/* Added icon buttons: display preference, import, export */}
      <Box sx={{ display: "flex", gap: 2, alignItems: "center", mb: 2 }}>
        <Button variant="text" size="small" startIcon={<ViewList />} onClick={openDisplayPref}>
          Display
        </Button>

        {/* Extra filters: Expiry / Quotation State / Executive */}
        <TextField
          select
          label="Expiry"
          size="small"
          value={expiryFilter}
          onChange={(e) => { setExpiryFilter(e.target.value); setPage(1); }}
          sx={{ minWidth: 160 }}
        >
          <MenuItem value="">All</MenuItem>
          <MenuItem value="NOT_EXPIRED">NOT EXPIRED</MenuItem>
          <MenuItem value="EXPIRED">EXPIRED</MenuItem>
          <MenuItem value="YEAR">YEAR</MenuItem>
          <MenuItem value="MONTH">MONTH</MenuItem>
          <MenuItem value="WEEK">WEEK</MenuItem>
        </TextField>

        <TextField
          select
          label="Quotation State"
          size="small"
          value={quoteStateFilter}
          onChange={(e) => { setQuoteStateFilter(e.target.value); setPage(1); }}
          sx={{ minWidth: 180 }}
        >
          <MenuItem value="">All</MenuItem>
          <MenuItem value="OPEN">OPEN</MenuItem>
          <MenuItem value="REVISED">REVISED</MenuItem>
          <MenuItem value="CONVERT">CONVERT</MenuItem>
          <MenuItem value="CANCELLED">CANCELLED</MenuItem>
        </TextField>

        <TextField
          label="Executive"
          size="small"
          value={executive}
          onChange={(e) => { setExecutive(e.target.value); setPage(1); }}
          placeholder="Enter executive"
          sx={{ minWidth: 200 }}
        />
      </Box>

      {/* Display Preferences Dialog */}
      <Dialog open={displayPrefOpen} onClose={closeDisplayPref}>
        <DialogTitle>Display Preferences</DialogTitle>
        <DialogContent>
          <FormGroup>
            <FormControlLabel
              control={<Checkbox checked={allSelected} onChange={handleSelectAllChange} />}
              label="Select All"
            />
            <FormControlLabel
              control={
                <Checkbox
                  name="quotation_number"
                  checked={displayCols.quotation_number}
                  onChange={handleColChange}
                />
              }
              label="Quotation Number"
            />
            <FormControlLabel
              control={
                <Checkbox name="customer" checked={displayCols.customer} onChange={handleColChange} />
              }
              label="Customer"
            />
            <FormControlLabel
              control={
                <Checkbox
                  name="quotation_date"
                  checked={displayCols.quotation_date}
                  onChange={handleColChange}
                />
              }
              label="Date"
            />
            <FormControlLabel
              control={<Checkbox name="status" checked={displayCols.status} onChange={handleColChange} />}
              label="Status"
            />
          </FormGroup>
        </DialogContent>
        <DialogActions>
          <Button onClick={closeDisplayPref}>Close</Button>
        </DialogActions>
      </Dialog>

      <Box>
        {editData && (
          <QuotationForm
            initialData={editData}
            onClose={() => {
              setEditData(null);
              fetchQuotations(); // refresh after edit
            }}
          />
        )}
        <TableContainer component={Paper} sx={{ mt: 2 }}>
          <Table>
            <TableHead>
              <TableRow>
                {displayCols.quotation_number && (
                  <TableCell>
                    <TextField
                      label="Quotation No"
                      name="quotation_number"
                      size="small"
                      onChange={debouncedFilterChange}
                    />
                  </TableCell>
                )}
                {displayCols.customer && (
                  <TableCell>
                    <TextField
                      label="Customer"
                      name="customer"
                      size="small"
                      onChange={debouncedFilterChange}
                    />
                  </TableCell>
                )}
                <TableCell>Grand Total</TableCell>
                {displayCols.quotation_date && (
                  <TableCell>
                    <TextField
                      label="Quotation Date"
                      name="quotation_date"
                      size="small"
                      onChange={debouncedFilterChange}
                    />
                  </TableCell>
                )}
                {displayCols.status && (
                  <TableCell>
                    <TextField
                      label="Status"
                      name="status"
                      size="small"
                      select
                      value={filters.status}
                      onChange={debouncedFilterChange}
                    >
                      <MenuItem value="">All</MenuItem>
                      <MenuItem value="Draft">Draft</MenuItem>
                      <MenuItem value="Sent">Sent</MenuItem>
                      <MenuItem value="Accepted">Accepted</MenuItem>
                      <MenuItem value="Rejected">Rejected</MenuItem>
                    </TextField>
                  </TableCell>
                )}
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {quotations.map((quotation) => (
                <TableRow key={quotation.quotation_id}>
                  {displayCols.quotation_number && <TableCell>{quotation.quotation_number}</TableCell>}
                  {displayCols.customer && (
                    <TableCell>
                      {quotation.customer?.salutation}{" "}
                      {quotation.customer?.firstname}{" "}
                      {quotation.customer?.lastname}
                    </TableCell>
                  )}
                  <TableCell>{quotation.grand_total.toFixed(2)}</TableCell>
                  {displayCols.quotation_date && (
                    <TableCell>
                      {new Date(quotation.quotation_date).toLocaleDateString()}
                    </TableCell>
                  )}
                  {displayCols.status && <TableCell>{quotation.status}</TableCell>}
                  <TableCell>
                    <Box sx={{ display: "flex", gap: 1 }}>
                      <IconButton size="small" aria-label="edit" onClick={() => setEditData(quotation)}>
                        <Edit />
                      </IconButton>
                      <IconButton size="small" aria-label="delete" onClick={() => handleDelete(quotation.id)}>
                        <Delete />
                      </IconButton>
                    </Box>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>

        <Grid
          container
          justifyContent="space-between"
          alignItems="center"
          sx={{ mt: 2 }}
        >
          <Button disabled={page === 1} onClick={() => setPage(page - 1)}>
            Previous
          </Button>
          <Box>Page {page}</Box>
          <Button onClick={() => setPage(page + 1)}>Next</Button>
        </Grid>

        {/* Moved actions: Import / Export / Print / Email / WhatsApp */}
        <Box sx={{ display: "flex", gap: 2, alignItems: "center", mt: 2 }}>
          <Button variant="text" size="small" startIcon={<Download />}>
            Import
          </Button>

          <Button
            variant="text"
            size="small"
            startIcon={<Download sx={{ transform: "rotate(180deg)" }} />}
            onClick={handleExport}
          >
            Export
          </Button>

          <Button variant="text" size="small" startIcon={<Print />} onClick={handlePrint}>
            Print
          </Button>

          <Button variant="text" size="small" startIcon={<Mail />}>
            Email
          </Button>

          <Button variant="text" size="small" startIcon={<WhatsApp />}>
            WhatsApp
          </Button>
        </Box>
      </Box>
    </section>
  );
};

export default QuotationList;
