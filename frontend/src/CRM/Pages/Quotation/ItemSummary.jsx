import React, { useMemo, useState, useEffect } from "react";
import axios from "axios";
import { FaSearch, FaFileExport } from "react-icons/fa";
import * as XLSX from 'xlsx';
import { BASE_URL } from "../../../config/Config";
import "./itemsummary.scss";

const ItemSummary = () => {
  // match QuotationList filter options: Month, Last Month, Other Month, Financial Year, Other Financial Year
  const [timeFilter, setTimeFilter] = useState("Month");
  const [selectedOtherMonth, setSelectedOtherMonth] = useState("");
  const [selectedOtherYear, setSelectedOtherYear] = useState(new Date().getFullYear());
  const [selectedFinancialYear, setSelectedFinancialYear] = useState(new Date().getFullYear());
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [exporting, setExporting] = useState(false);
  const limit = 10;

  const filterOptions = [
    { key: "Month", label: "Month" },
    { key: "Last Month", label: "Last Month" },
    { key: "Other Month", label: "Other Month" },
    { key: "Financial Year", label: "Financial Year" },
    { key: "Other Financial Year", label: "Other Financial Year" },
  ];

  // derive a user-facing document type from a quotation object (keeps behavior consistent with QuotationList)
  const getDocType = (q) => {
    if (!q) return 'Quotation';
    const pick = (v) => (v === undefined || v === null) ? null : String(v).trim();
    const candidates = [
      pick(q.document_type),
      pick(q.type),
      pick(q.doc_type),
      pick(q.docType),
      pick(q.DocumentType),
      pick(q.documentType),
      pick(q.quotation_type),
      pick(q.quotationType),
      pick(q.document),
    ].filter(Boolean);

    for (const c of candidates) {
      const lc = c.toLowerCase();
      if (lc.includes('proforma')) return 'Proforma Invoice';
      if (lc.includes('sales order')) return 'Sales Order';
      if (lc.includes('transfer order')) return 'Transfer Order';
      if (lc.includes('purchase order') || lc.includes('purchase')) return 'Purchase Order';
      return c;
    }

    if (q.series && (q.series.document_type || q.series.DocumentType)) {
      const sdt = pick(q.series.document_type) || pick(q.series.DocumentType);
      if (sdt) return sdt;
    }

    if (q.is_proforma) return 'Proforma Invoice';
    return 'Quotation';
  };

  useEffect(() => {
    const fetchItems = async () => {
      setLoading(true);
      setError(null);
      try {
        // fetch all quotations (large limit) and flatten their items
        const res = await axios.get(`${BASE_URL}/api/quotations`, { params: { page: 1, limit: 1000000 } });
        const all = res.data && res.data.data ? res.data.data : res.data || [];
        const rows = [];
        all.forEach((q) => {
          const cust = q.customer || {};
          const customerName = cust.company_name || `${(cust.salutation || "") + " " + (cust.firstname || "") + " " + (cust.lastname || "")}`.replace(/\s+/g, " ").trim() || "-";

          // derive contact (person) name robustly: prefer salutation + firstname + lastname, then contact_person object/string, then contact object/string; do NOT fallback to company name
          const personName = `${(cust.salutation || "") + " " + (cust.firstname || cust.first_name || "") + " " + (cust.lastname || cust.last_name || "")}`.replace(/\s+/g, " ").trim();
          let contactName = '';
          if (personName) {
            contactName = personName;
          } else if (cust.contact_person) {
            if (typeof cust.contact_person === 'string') contactName = cust.contact_person;
            else {
              const cp = cust.contact_person;
              const cpName = `${(cp.salutation || "") + " " + (cp.firstname || cp.first_name || "") + " " + (cp.lastname || cp.last_name || "")}`.replace(/\s+/g, " ").trim();
              contactName = cpName || cp.name || '';
            }
          } else if (cust.contact) {
            if (typeof cust.contact === 'string') contactName = cust.contact;
            else contactName = cust.contact.name || '';
          }

          contactName = contactName || '-';

          const quoteNo = q.quotation_number || q.quote_no || "-";
          const dateISO = q.quotation_date ? new Date(q.quotation_date).toISOString() : null;
          const quotationNote = q.note || q.notes || q.remarks || '';
          const itemsList = q.quotation_items || q.items || [];
          itemsList.forEach((it) => {
            rows.push({
              customer: customerName,
              contact: contactName,
              quoteNo,
              dateISO,
              date: dateISO ? new Date(dateISO).toLocaleDateString('en-IN') : '-',
              item: it.product_name || it.name || it.description || it.desc || '-',
              type: getDocType(q),
              qty: it.quantity || it.qty || 0,
              unit: it.unit || it.unit_name || it.uom || 'no.s',
              rate: Number(it.rate || it.price || 0),
              leadTime: it.lead_time || it.leadTime || it.lead || '-',
              notes: quotationNote
            });
          });
        });
        setItems(rows);
      } catch (err) {
        console.error('Failed to load item summary', err);
        setError('Failed to load item summary');
      } finally {
        setLoading(false);
      }
    };

    fetchItems();
  }, []);

  // filter items by search and time filter
  const filtered = useMemo(() => {
    const s = (search || '').trim().toLowerCase();
    const now = new Date();
    const month = now.getMonth();
    const year = now.getFullYear();

    return items.filter((r) => {
      if (s.length) {
        const rateRaw = (r.rate !== undefined && r.rate !== null) ? String(r.rate) : '';
        const rateFormatted = (r.rate !== undefined && r.rate !== null) ? Number(r.rate).toLocaleString('en-IN', { minimumFractionDigits: 2 }) : '';
        const fieldsToSearch = [
          r.customer,
          r.contact,
          r.quoteNo,
          r.item,
          r.notes,
          r.date,
          r.type,
          String(r.qty || ''),
          r.unit,
          rateRaw,
          rateFormatted,
          r.leadTime
        ].map(f => (f || '').toString().toLowerCase());
        const match = fieldsToSearch.some(f => f.includes(s));
        if (!match) return false;
      }

      if (!r.dateISO) return false;
      const d = new Date(r.dateISO);

      if (timeFilter === 'Month') {
        return d.getMonth() === month && d.getFullYear() === year;
      }
      if (timeFilter === 'Last Month') {
        const last = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        return d.getMonth() === last.getMonth() && d.getFullYear() === last.getFullYear();
      }

      if (timeFilter === 'Other Month') {
        // selectedOtherMonth is in format YYYY-MM
        if (!selectedOtherMonth) return false; // match QuotationList: must select a month
        const [y, m] = selectedOtherMonth.split('-').map(Number);
        if (!y || !m) return false;
        return d.getFullYear() === y && (d.getMonth() + 1) === m;
      }

      // Financial year (Apr-Mar) - use inclusive range
      if (timeFilter === 'Financial Year') {
        let fyStart, fyEnd;
        if (now.getMonth() >= 3) { // April is month 3
          fyStart = new Date(now.getFullYear(), 3, 1);
          fyEnd = new Date(now.getFullYear() + 1, 2, 31);
        } else {
          fyStart = new Date(now.getFullYear() - 1, 3, 1);
          fyEnd = new Date(now.getFullYear(), 2, 31);
        }
        return d >= fyStart && d <= fyEnd;
      }

      if (timeFilter === 'Other Financial Year') {
        if (!selectedFinancialYear) return false; // must select a financial year
        const fyStart = new Date(Number(selectedFinancialYear), 3, 1);
        const fyEnd = new Date(Number(selectedFinancialYear) + 1, 2, 31);
        return d >= fyStart && d <= fyEnd;
      }

      return true;
    });
  }, [items, search, timeFilter, selectedOtherMonth, selectedOtherYear, selectedFinancialYear]);

  const pages = Math.max(1, Math.ceil(filtered.length / limit));
  const visible = filtered.slice((page - 1) * limit, page * limit);

  const changePage = (p) => {
    if (p < 1 || p > pages) return;
    setPage(p);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleExport = async () => {
    setExporting(true);
    try {
      const data = filtered.map((r) => ({
        Customer: r.customer,
        Contact: r.contact,
        "Quote No": r.quoteNo,
        Date: r.date,
        Item: r.item,
        Type: r.type,
        Qty: r.qty,
        Unit: r.unit,
        "Rate (₹)": (r.rate || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 }),
        "Lead Time": r.leadTime,
        Notes: r.notes,
      }));

      const ws = XLSX.utils.json_to_sheet(data);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Item Summary');
      const filename = `item-summary_${new Date().toISOString().slice(0,10)}.xlsx`;
      XLSX.writeFile(wb, filename);

      try { window.toastr && window.toastr.success && window.toastr.success('Export started'); } catch (e) {}
    } catch (err) {
      console.error('Export failed', err);
      try { window.toastr && window.toastr.error && window.toastr.error('Export failed'); } catch (e) {}
    } finally {
      setExporting(false);
    }
  };

  // helper to escape regex metacharacters
  const escapeRegExp = (s) => (s || '').replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

  // render text with highlighted matches for current search
  const renderHighlighted = (text) => {
    if (text === null || text === undefined) return '-';
    const raw = String(text);
    const st = (search || '').trim();
    if (!st) return raw;
    try {
      const esc = escapeRegExp(st);
      const re = new RegExp(`(${esc})`, 'ig');
      const parts = raw.split(re);
      return parts.map((part, i) => (
        re.test(part) ? <mark key={i} className="search-highlight">{part}</mark> : <span key={i}>{part}</span>
      ));
    } catch (e) {
      return raw;
    }
  };

  return (
    <div className="item-summary-page">
      <div className="card">
        <div className="card-header">
          <div className="header-top">
            <h2>Quote Item Summary</h2>
            <div className="header-actions">
              <div className="search-box">
                <FaSearch className="search-icon" />
                <input
                  placeholder="Search"
                  value={search}
                  onChange={(e) => {
                    setSearch(e.target.value);
                    setPage(1);
                  }}
                />
              </div>

              <button
                className="icon-btn square"
                title={exporting ? 'Exporting...' : 'Export'}
                onClick={handleExport}
                disabled={exporting}
              >
                <FaFileExport />
              </button>
            </div>
          </div>

          <div className="header-bottom">
            <div className="time-filters">
              {filterOptions.map((t) => (
                <button
                  key={t.key}
                  className={`filter-btn ${timeFilter === t.key ? "active" : ""}`}
                  onClick={() => {
                    setTimeFilter(t.key);
                    setPage(1);
                    // reset dependent selectors when switching filters
                    if (t.key !== 'Other Month') setSelectedOtherMonth('');
                    if (t.key !== 'Other Month') setSelectedOtherYear(new Date().getFullYear());
                    if (t.key !== 'Other Financial Year') setSelectedFinancialYear(new Date().getFullYear());
                  }}
                >
                  {t.label}
                </button>
              ))}

              {/* show selectors when Other Month or Other Financial Year are chosen */}
              {timeFilter === 'Other Month' && (
                <div className="selectors">
                  <select
                    value={selectedOtherMonth}
                    onChange={(e) => { setSelectedOtherMonth(e.target.value); setPage(1); }}
                  >
                    <option value="">Select Month</option>
                    {Array.from({ length: 12 }, (_, i) => {
                      const monthDate = new Date(selectedOtherYear || new Date().getFullYear(), i, 1);
                      const monthName = monthDate.toLocaleString('en-IN', { month: 'long', year: 'numeric' });
                      const value = `${selectedOtherYear || new Date().getFullYear()}-${String(i + 1).padStart(2, '0')}`;
                      return <option key={i} value={value}>{monthName}</option>;
                    })}
                  </select>

                  <select
                    value={selectedOtherYear}
                    onChange={(e) => { setSelectedOtherYear(Number(e.target.value)); setPage(1); }}
                  >
                    {Array.from({ length: 10 }, (_, i) => new Date().getFullYear() - i).map((year) => (
                      <option key={year} value={year}>{year}</option>
                    ))}
                  </select>

                  {!selectedOtherMonth && (
                    <div className="select-hint">Please select month and year</div>
                  )}
                </div>
              )}

              {timeFilter === 'Other Financial Year' && (
                <div className="selectors">
                  <select
                    value={selectedFinancialYear}
                    onChange={(e) => { setSelectedFinancialYear(Number(e.target.value)); setPage(1); }}
                  >
                    {(() => {
                      const now = new Date();
                      const currentFYStart = (now.getMonth() >= 3) ? now.getFullYear() : now.getFullYear() - 1;
                      return Array.from({ length: 10 }, (_, i) => currentFYStart - i).map((year) => (
                        <option key={year} value={year}>{year}-{year + 1}</option>
                      ));
                    })()}
                  </select>
                  {!selectedFinancialYear && (
                    <div className="select-hint">Please select a financial year</div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="table-wrapper">
          {loading ? (
            <div style={{ padding: 24 }}>Loading...</div>
          ) : error ? (
            <div style={{ padding: 24, color: 'red' }}>{error}</div>
          ) : (
            <table className="summary-table">
              <thead>
                <tr>
                  <th>Customer</th>
                  <th>Contact</th>
                  <th>Quote No</th>
                  <th>Date</th>
                  <th>Item</th>
                  <th>Type</th>
                  <th className="center">Qty</th>
                  <th className="center">Unit</th>
                  <th className="center">Rate (₹)</th>
                  <th className="center">Lead Time</th>
                  <th>Notes</th>
                </tr>
              </thead>
              <tbody>
                {visible.length ? visible.map((r, idx) => (
                  <tr key={`${r.quoteNo}-${idx}`}>
                    <td>{renderHighlighted(r.customer)}</td>
                    <td>{renderHighlighted(r.contact)}</td>
                    <td>{renderHighlighted(r.quoteNo)}</td>
                    <td>{renderHighlighted(r.date)}</td>
                    <td className="item-cell">{renderHighlighted(r.item)}</td>
                    <td>{renderHighlighted(r.type)}</td>
                    <td className="center">{renderHighlighted(r.qty)}</td>
                    <td className="center">{renderHighlighted(r.unit)}</td>
                    <td className="center">{renderHighlighted((r.rate || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 }))}</td>
                    <td className="center">{renderHighlighted(r.leadTime)}</td>
                    <td>{renderHighlighted(r.notes)}</td>
                  </tr>
                )) : (
                  <tr><td colSpan={11} style={{ textAlign: 'center', padding: 24 }}>No items found</td></tr>
                )}
              </tbody>
            </table>
          )}
        </div>

        <div className="card-footer">
          <div className="pagination">
            <button disabled={page === 1} onClick={() => changePage(page - 1)}>{'«'}</button>
            {Array.from({ length: pages }).map((_, i) => (
              <button
                key={i}
                className={page === i + 1 ? "active" : ""}
                onClick={() => changePage(i + 1)}
              >
                {i + 1}
              </button>
            ))}
            <button disabled={page === pages} onClick={() => changePage(page + 1)}>{'»'}</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ItemSummary;
