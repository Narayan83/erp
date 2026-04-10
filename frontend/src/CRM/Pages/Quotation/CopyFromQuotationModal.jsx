import React, { useState, useEffect, useMemo } from "react";
import axios from "axios";
import { BASE_URL } from "../../../config/Config";
import { FaTimes } from "react-icons/fa";
import "./copyFromQuotationModal.scss";

const CopyFromQuotationModal = ({ 
  open, 
  onClose, 
  customerId, 
  customerName, 
  docType = "Quotation",
  onSelectQuotation 
}) => {
  const [quotations, setQuotations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const limit = 5;

  const documentTypeOptions = useMemo(
    () => [
      { value: "All", label: "All Documents" },
      { value: "Quotation", label: "Quotation" },
      { value: "Proforma Invoice", label: "Proforma Invoice" },
      { value: "Transfer Order", label: "Transfer Order" },
      { value: "Sales Order", label: "Sales Order" },
      { value: "Purchase Order", label: "Purchase Order" },
    ],
    []
  );

  // Generate year range options (last 5 financial years)
  const yearRangeOptions = useMemo(() => {
    const options = [];
    const currentDate = new Date();
    const currentYear = currentDate.getFullYear();
    const currentMonth = currentDate.getMonth(); // 0-indexed

    // Financial year starts in April (month index 3)
    // If we're in Jan-March, current FY started last year
    const currentFYStart = currentMonth >= 3 ? currentYear : currentYear - 1;

    for (let i = 0; i < 5; i++) {
      const startYear = currentFYStart - i;
      const endYear = startYear + 1;
      options.push(`${startYear}-${endYear}`);
    }
    return options;
  }, []);

  const [selectedYearRange, setSelectedYearRange] = useState(yearRangeOptions[0] || "");
  const [selectedDocType, setSelectedDocType] = useState(docType || "All");

  // Get display label for document type
  const getDocTypeLabel = (value) => {
    switch (value) {
      case "All":
        return "Documents";
      case "Quotation":
        return "Quotation";
      case "Proforma Invoice":
        return "Proforma Invoice";
      case "Transfer Order":
        return "Transfer Order";
      case "Sales Order":
        return "Sales Order";
      case "Purchase Order":
        return "Purchase Order";
      default:
        return "quotation / PI";
    }
  };

  // Fetch quotations for the selected customer with doc_type filter
  const fetchQuotations = async () => {
    if (!customerId) return;
    
    setLoading(true);
    try {
      const params = new URLSearchParams({
        customer_id: customerId,
        page: page.toString(),
        limit: limit.toString(),
      });
      
      // Add doc_type filter
      if (selectedDocType && selectedDocType !== "All") {
        params.append("doc_type", selectedDocType);
      }
      
      if (selectedYearRange) {
        params.append("year_range", selectedYearRange);
      }

      const response = await axios.get(`${BASE_URL}/api/quotations?${params.toString()}`);
      const data = response.data;
      
      setQuotations(data.data || []);
      setTotal(data.total || 0);
      setTotalPages(Math.ceil((data.total || 0) / limit));
    } catch (error) {
      console.error("Failed to fetch quotations:", error);
      setQuotations([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (open) {
      setSelectedDocType(docType || "All");
    }
  }, [docType, open]);

  useEffect(() => {
    if (open && customerId) {
      setPage(1);
    }
  }, [open, customerId, selectedYearRange, selectedDocType]);

  useEffect(() => {
    if (open && customerId) {
      fetchQuotations();
    }
  }, [open, customerId, page, selectedYearRange, selectedDocType]);

  // Format date for display (DD-MMM-YY)
  const formatDate = (dateStr) => {
    if (!dateStr) return "-";
    try {
      const date = new Date(dateStr);
      const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
      const day = String(date.getDate()).padStart(2, "0");
      const month = months[date.getMonth()];
      const year = String(date.getFullYear()).slice(-2);
      return `${day}-${month}-${year}`;
    } catch {
      return dateStr;
    }
  };

  // Format currency for display
  const formatCurrency = (amount) => {
    if (amount === null || amount === undefined) return "0.00";
    return Number(amount).toLocaleString("en-IN", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  // Calculate taxable amount from quotation items if not directly available
  const getTaxableAmount = (q) => {
    // Calculate from total_amount - tax_amount as requested (total amount before tax)
    const totalAmt = q.total_amount || q.TotalAmount || 0;
    const taxAmt = q.tax_amount || q.TaxAmount || 0;
    
    if (totalAmt > 0) {
      return totalAmt - taxAmt;
    }

    // Fallback: check direct taxable fields
    if (q.total_taxable !== undefined && q.total_taxable !== null && q.total_taxable !== 0) {
      return q.total_taxable;
    }
    if (q.TotalTaxable !== undefined && q.TotalTaxable !== null && q.TotalTaxable !== 0) {
      return q.TotalTaxable;
    }

    // Calculate from items if available
    const items = q.quotation_items || q.QuotationTableItems || [];
    if (items.length > 0) {
      return items.reduce((sum, item) => {
        const taxable = item.taxable_amount || item.TaxableAmount || 
                       ((item.rate || item.Rate || 0) * (item.quantity || item.Quantity || 1)) - 
                       (item.discount_amount || item.DiscountAmount || 0);
        return sum + (taxable || 0);
      }, 0);
    }

    // Fallback: calculate from grand_total - tax_amount
    const grandTotal = q.grand_total || q.GrandTotal || 0;
    const taxAmount = q.tax_amount || q.TaxAmount || 0;
    if (grandTotal > 0) {
      return grandTotal - taxAmount;
    }

    return 0;
  };

  const handleRowClick = (quotation) => {
    if (onSelectQuotation) {
      onSelectQuotation(quotation);
    }
    onClose();
  };

  const activeDocTypeLabel = getDocTypeLabel(selectedDocType);
  const showDocumentTypeColumn = selectedDocType === "All";

  if (!open) return null;

  return (
    <div className="copy-quotation-modal-overlay" onClick={onClose}>
      <div className="copy-quotation-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h5>Copy From {activeDocTypeLabel}</h5>
          <button className="btn-close" onClick={onClose}>
            <FaTimes />
          </button>
        </div>

        <div className="modal-subheader">
          <span>
            <strong>{customerName || "Customer"}</strong>
          </span>
          <div className="modal-filters">
            <select
              className="doc-type-select"
              value={selectedDocType}
              onChange={(e) => {
                setSelectedDocType(e.target.value);
                setPage(1);
              }}
            >
              {documentTypeOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            <select
              className="year-select"
              value={selectedYearRange}
              onChange={(e) => {
                setSelectedYearRange(e.target.value);
                setPage(1);
              }}
            >
              {yearRangeOptions.map((yr) => (
                <option key={yr} value={yr}>
                  {yr}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="modal-body">
          {loading ? (
            <div className="loading-text">Loading...</div>
          ) : quotations.length === 0 ? (
            <div className="no-data-text">
              No {activeDocTypeLabel.toLowerCase()} found for this customer in {selectedYearRange}.
            </div>
          ) : (
            <table className="quotation-table">
              <thead>
                <tr>
                  <th>{showDocumentTypeColumn ? "Document No." : `${activeDocTypeLabel} No.`}</th>
                  {showDocumentTypeColumn && <th>Type</th>}
                  <th>Date</th>
                  <th className="text-right">Taxable (₹)</th>
                  <th className="text-right">Amount (₹)</th>
                </tr>
              </thead>
              <tbody>
                {quotations.map((q) => {
                  const quotationId = q.quotation_id || q.QuotationID || q.id;
                  const quotationNo = q.quotation_number || q.QuotationNumber || "-";
                  const quotationDate = q.quotation_date || q.QuotationDate;
                  const quotationDocType = q.document_type || q.DocumentType || q.type || q.Type || "Quotation";
                  const taxableAmt = getTaxableAmount(q);
                  const totalAmt = q.grand_total || q.GrandTotal || q.final_total || q.FinalTotal || 0;

                  return (
                    <tr 
                      key={quotationId} 
                      onClick={() => handleRowClick(q)}
                      className="clickable-row"
                      title="Click to copy this document"
                    >
                      <td className="quotation-number">{quotationNo}</td>
                      {showDocumentTypeColumn && <td>{quotationDocType}</td>}
                      <td>{formatDate(quotationDate)}</td>
                      <td className="text-right">{formatCurrency(taxableAmt)}</td>
                      <td className="text-right amount-cell">{formatCurrency(totalAmt)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        {totalPages > 1 && (
          <div className="modal-footer">
            <div className="pagination">
              <button
                className="page-btn"
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
              >
                «
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                <button
                  key={p}
                  className={`page-btn ${p === page ? "active" : ""}`}
                  onClick={() => setPage(p)}
                >
                  {p}
                </button>
              ))}
              <button
                className="page-btn"
                disabled={page >= totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              >
                »
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CopyFromQuotationModal;
