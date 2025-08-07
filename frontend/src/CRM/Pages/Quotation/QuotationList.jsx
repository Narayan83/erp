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
  MenuItem
} from "@mui/material";
import { Edit, Delete } from "@mui/icons-material";
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

  return (
    <section className="right-content">
      <h2>Quotation List</h2>

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
                <TableCell>
                  <TextField
                    label="Quotation No"
                    name="quotation_number"
                    size="small"
                    onChange={debouncedFilterChange}
                  />
                </TableCell>
                <TableCell>
                  <TextField
                    label="Customer"
                    name="customer"
                    size="small"
                    onChange={debouncedFilterChange}
                  />
                </TableCell>
                <TableCell>Grand Total</TableCell>
                <TableCell>
                  <TextField
                    label="Quotation Date"
                    name="quotation_date"
                    size="small"
                    onChange={debouncedFilterChange}
                  />
                </TableCell>
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
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {quotations.map((quotation) => (
                <TableRow key={quotation.quotation_id}>
                  <TableCell>{quotation.quotation_number}</TableCell>
                  <TableCell>
                    {quotation.customer?.salutation}{" "}
                    {quotation.customer?.firstname}{" "}
                    {quotation.customer?.lastname}
                  </TableCell>
                  <TableCell>{quotation.grand_total.toFixed(2)}</TableCell>
                  <TableCell>
                    {new Date(quotation.quotation_date).toLocaleDateString()}
                  </TableCell>
                  <TableCell>{quotation.status}</TableCell>
                  <TableCell>
                    <IconButton onClick={() => setEditData(quotation)}>
                      <Edit />
                    </IconButton>
                    <IconButton onClick={() => handleDelete(quotation.id)}>
                      <Delete />
                    </IconButton>
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
      </Box>
    </section>
  );
};

export default QuotationList;
