import React, { useEffect, useState, useCallback, useRef } from 'react';
import { FaFileExport } from 'react-icons/fa';
import * as XLSX from 'xlsx';
import { BASE_URL, getAuthHeaders } from '../../../config/Config';
import './_sales_interactions.scss';
import './inactiveleads.scss';

const FILTERS = ['All', 'This Month', 'Last Month', 'This Year', 'Custom'];

const formatDateShort = (iso) => {
  if (!iso) return '';
  const d = new Date(iso);
  if (isNaN(d)) return '';
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
};

const InactiveLeads = () => {
  const [leads, setLeads] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState(false);

  // Filters (all sent to backend)
  const [filter, setFilter] = useState('All');
  const [execFilter, setExecFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [selectedOtherMonth, setSelectedOtherMonth] = useState('');
  const [selectedOtherYear, setSelectedOtherYear] = useState(new Date().getFullYear());

  // Pagination (server-driven)
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  const searchTimerRef = useRef(null);

  // ─── Build query string from current filter state ───────────────────────
  const buildQuery = useCallback(() => {
    const params = new URLSearchParams({
      stage: 'inactive',
      page: String(page),
      limit: String(pageSize),
    });

    if (search) params.append('search', search);
    if (execFilter !== 'all') params.append('assigned_to_id', execFilter);

    const now = new Date();

    if (filter === 'This Month') {
      const from = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
      const to = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59).toISOString();
      params.append('from', from);
      params.append('to', to);
    } else if (filter === 'Last Month') {
      const from = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString();
      const to = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59).toISOString();
      params.append('from', from);
      params.append('to', to);
    } else if (filter === 'This Year') {
      const from = new Date(now.getFullYear(), 0, 1).toISOString();
      const to = new Date(now.getFullYear(), 11, 31, 23, 59, 59).toISOString();
      params.append('from', from);
      params.append('to', to);
    } else if (filter === 'Custom' && selectedOtherMonth) {
      const [year, month] = selectedOtherMonth.split('-').map(Number);
      const from = new Date(year, month - 1, 1).toISOString();
      const to = new Date(year, month, 0, 23, 59, 59).toISOString();
      params.append('from', from);
      params.append('to', to);
    }

    return params.toString();
  }, [filter, execFilter, search, selectedOtherMonth, selectedOtherYear, page, pageSize]);

  // ─── Load leads from backend ─────────────────────────────────────────────
  const loadLeads = useCallback(async () => {
    setLoading(true);
    try {
      const resp = await fetch(
        `${BASE_URL}/api/leads?${buildQuery()}`,
        { headers: getAuthHeaders() }
      ).then(r => r.json());

      const data = Array.isArray(resp) ? resp : (resp.data ?? []);
      const serverTotal = resp.total ?? data.length;
      const serverPages = resp.totalPages ?? Math.max(1, Math.ceil(serverTotal / pageSize));

      setLeads(data);
      setTotal(serverTotal);
      setTotalPages(serverPages);
    } catch (err) {
      console.error('Error loading inactive leads:', err);
    } finally {
      setLoading(false);
    }
  }, [buildQuery]);

  useEffect(() => {
    console.log(employees);
  }, [employees]);

  // ─── Load employees once ─────────────────────────────────────────────────
  const loadEmployees = useCallback(async () => {
    try {
      const emps = await fetch(`${BASE_URL}/api/employees`, { headers: getAuthHeaders() }).then(r => r.json());
      const arr = Array.isArray(emps.data) ? emps.data : [];
      setEmployees(arr.map(e => ({
        ...e,
        id: e.id || e.ID || e.employee_id || e.empid,
        displayName: formatEmployeeName(e),
      })));
    } catch (err) {
      console.error('Error loading employees:', err);
    }
  }, []);

  // ─── Initial load ────────────────────────────────────────────────────────
  useEffect(() => { loadEmployees(); }, []);
  useEffect(() => { loadLeads(); }, [loadLeads]);

  // ─── Reset to page 1 when any filter changes ─────────────────────────────
  useEffect(() => { setPage(1); }, [filter, execFilter, search, selectedOtherMonth, selectedOtherYear, pageSize]);

  // ─── Debounce search input ────────────────────────────────────────────────
  const handleSearchInput = (val) => {
    setSearchInput(val);
    clearTimeout(searchTimerRef.current);
    searchTimerRef.current = setTimeout(() => setSearch(val), 400);
  };

  // ─── Listen for lead import/update events ────────────────────────────────
  useEffect(() => {
    const refresh = () => loadLeads();
    window.addEventListener('leads:imported', refresh);
    window.addEventListener('leads:updated', refresh);
    const onStorage = (e) => { if (e.key === 'importedLeads') refresh(); };
    window.addEventListener('storage', onStorage);
    return () => {
      window.removeEventListener('leads:imported', refresh);
      window.removeEventListener('leads:updated', refresh);
      window.removeEventListener('storage', onStorage);
    };
  }, [loadLeads]);

  // ─── Helpers ─────────────────────────────────────────────────────────────
  const formatEmployeeName = (emp) => {
    if (!emp) return '';
    if (typeof emp === 'string') return emp;
    const sal = (emp.salutation || emp.prefix || '').toString().trim();
    const first = (emp.firstname || emp.firstName || emp.first || emp.name || '').toString().trim();
    const last = (emp.lastname || emp.lastName || emp.last || '').toString().trim();
    const name = `${sal ? sal + ' ' : ''}${first}${(first && last) ? ' ' : ''}${last}`.trim();
    return name || emp.displayName || emp.name || emp.email || `User ${emp.id || ''}`;
  };

  const getEmployee = (lead) => {
    const id = lead.assigned_to_id || lead.assignedToId || lead.AssignedToID;
    if (!id) return null;
    return employees.find(e => String(e.id) === String(id)) || null;
  };

  const escapeReg = (s) => String(s).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const highlight = (text, term) => {
    if (!term || !text) return text || '';
    const t = String(text);
    const re = new RegExp(`(${escapeReg(term)})`, 'ig');
    return t.split(re).map((part, i) =>
      part.match(re) ? <mark key={i} className="si-highlight">{part}</mark> : <span key={i}>{part}</span>
    );
  };

  // ─── Export (fetches ALL pages with same filters, no page/limit) ──────────
  const exportToExcel = async () => {
    if (total === 0) { alert('No data to export'); return; }
    setExporting(true);
    try {
      const allParams = new URLSearchParams(buildQuery());
      allParams.set('page', '1');
      allParams.set('limit', '10000');

      const resp = await fetch(
        `${BASE_URL}/api/leads?${allParams.toString()}`,
        { headers: getAuthHeaders() }
      ).then(r => r.json());

      const allLeads = Array.isArray(resp) ? resp : (resp.data ?? []);

      const data = allLeads.map(lead => {
        const emp = getEmployee(lead);
        const empName = emp ? formatEmployeeName(emp) : lead.assignedToName || '';
        return {
          'Business': lead.business || '',
          'Contact Name': lead.name || lead.contact || '',
          'Mobile': lead.mobile || '',
          'Email': lead.email || '',
          'City': lead.city || '',
          'State': lead.state || '',
          'Assigned To': empName,
          'Stage': lead.stage || '',
          'Since': formatDateShort(lead.since || lead.Since),
          'Updated': formatDateShort(lead.updated_at || lead.updatedAt),
        };
      });

      const ws = XLSX.utils.json_to_sheet(data);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Inactive Leads');
      XLSX.writeFile(wb, `inactive_leads_${new Date().toISOString().slice(0, 10)}.xlsx`);
    } catch (err) {
      console.error('Export error:', err);
      alert('Failed to export data');
    } finally {
      setExporting(false);
    }
  };

  const startItem = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const endItem = Math.min(page * pageSize, total);

  // ─── Render ───────────────────────────────────────────────────────────────
  return (
    <div className="sales-interactions-container">
      {/* ── Header ── */}
      <div className="si-header">
        <div className="left">
          <h2>Inactive Leads Report</h2>
          <div className="filters">
            {/* Date filter */}
            <div className="filter-item">
              <select value={filter} onChange={e => setFilter(e.target.value)}>
                {FILTERS.map(f => <option key={f} value={f}>{f}</option>)}
              </select>
            </div>

            {/* Custom month/year */}
            {filter === 'Custom' && (
              <div className="filter-item selectors">
                <select
                  className="month"
                  value={selectedOtherMonth}
                  onChange={e => setSelectedOtherMonth(e.target.value)}
                >
                  <option value="">Select Month</option>
                  {Array.from({ length: 12 }, (_, i) => {
                    const val = `${selectedOtherYear}-${String(i + 1).padStart(2, '0')}`;
                    const label = new Date(selectedOtherYear, i, 1)
                      .toLocaleString('en-IN', { month: 'long', year: 'numeric' });
                    return <option key={i} value={val}>{label}</option>;
                  })}
                </select>
                <select
                  className="year"
                  value={selectedOtherYear}
                  onChange={e => { setSelectedOtherYear(Number(e.target.value)); setSelectedOtherMonth(''); }}
                >
                  {Array.from({ length: 10 }, (_, i) => new Date().getFullYear() - i).map(y => (
                    <option key={y} value={y}>{y}</option>
                  ))}
                </select>
              </div>
            )}

            {/* Employee filter */}
            {/* <div className="filter-item">
              <select className="exec-select" value={execFilter} onChange={e => setExecFilter(e.target.value)}>
                <option value="all">All Employees</option>
                {employees.map(emp => (
                  <option key={emp.id} value={emp.id}>{formatEmployeeName(emp)}</option>
                ))}
              </select>
            </div> */}
          </div>
        </div>

        <div className="right">
          <input
            type="text"
            placeholder="Search business, name, mobile, email..."
            value={searchInput}
            onChange={e => handleSearchInput(e.target.value)}
            className="search"
          />
          <button
            className="icon-btn square"
            onClick={exportToExcel}
            disabled={exporting || total === 0}
            title={exporting ? 'Exporting...' : 'Export to Excel'}
          >
            <FaFileExport />
          </button>
        </div>
      </div>

      {/* ── Content ── */}
      {loading ? (
        <div style={{ padding: '40px', textAlign: 'center', fontSize: '16px', color: '#666' }}>
          Loading inactive leads...
        </div>
      ) : (
        <>
          {/* Count */}
          <div style={{ padding: '12px 0', fontSize: '14px', color: '#666' }}>
            {total === 0
              ? 'No inactive leads found'
              : `Showing ${startItem}–${endItem} of ${total} inactive leads`}
          </div>

          {/* Table */}
          <div className="si-table-wrap">
            <table className="si-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Business</th>
                  <th>Contact Name</th>
                  <th>Mobile</th>
                  <th>Email</th>
                  <th>City</th>
                  <th>State</th>
                  <th>Assigned To</th>
                  <th>Since</th>
                  <th>Updated</th>
                </tr>
              </thead>
              <tbody>
                {leads.map((lead, idx) => {
                  const emp = getEmployee(lead);
                  const empName = emp ? formatEmployeeName(emp) : lead.assignedToName || '';
                  const rowNum = startItem + idx;
                  return (
                    <tr key={lead.id || lead.ID || idx}>
                      <td style={{ color: '#999', width: '40px' }}>{rowNum}</td>
                      <td>{highlight(lead.business, search)}</td>
                      <td>{highlight(lead.name || lead.contact, search)}</td>
                      <td>{highlight(lead.mobile, search)}</td>
                      <td>{highlight(lead.email, search)}</td>
                      <td>{lead.city || ''}</td>
                      <td>{lead.state || ''}</td>
                      <td>{highlight(empName, search)}</td>
                      <td>{formatDateShort(lead.since || lead.Since)}</td>
                      <td>{formatDateShort(lead.updated_at || lead.updatedAt)}</td>
                    </tr>
                  );
                })}
                {leads.length === 0 && (
                  <tr>
                    <td colSpan="10" style={{ textAlign: 'center', padding: '30px', color: '#999' }}>
                      No inactive leads found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* ── Pagination ── */}
          {total > 0 && (
            <div className="si-pagination">
              {/* Page size buttons */}
              <div className="page-size">
                {[10, 25, 50, 100].map(size => (
                  <button
                    key={size}
                    className={`ps-btn ${pageSize === size ? 'active' : ''}`}
                    onClick={() => { setPageSize(size); setPage(1); }}
                  >
                    {size}
                  </button>
                ))}
              </div>

              {/* Page navigation */}
              <div className="pager">
                {/* First */}
                <button
                  className="pager-nav"
                  onClick={() => setPage(1)}
                  disabled={page === 1}
                  title="First page"
                >
                  «
                </button>

                {/* Previous */}
                <button
                  className="pager-nav"
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                >
                  Previous
                </button>

                {/* Page number pills */}
                <div className="page-pills">
                  {(() => {
                    const pages = [];
                    const delta = 2;
                    const left = Math.max(2, page - delta);
                    const right = Math.min(totalPages - 1, page + delta);

                    pages.push(1);
                    if (left > 2) pages.push('...');
                    for (let i = left; i <= right; i++) pages.push(i);
                    if (right < totalPages - 1) pages.push('...');
                    if (totalPages > 1) pages.push(totalPages);

                    return pages.map((p, i) =>
                      p === '...'
                        ? <span key={`ellipsis-${i}`} className="pager-ellipsis">…</span>
                        : (
                          <button
                            key={p}
                            className={`pager-pill ${page === p ? 'active' : ''}`}
                            onClick={() => setPage(p)}
                          >
                            {p}
                          </button>
                        )
                    );
                  })()}
                </div>

                {/* Next */}
                <button
                  className="pager-nav"
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                >
                  Next
                </button>

                {/* Last */}
                <button
                  className="pager-nav"
                  onClick={() => setPage(totalPages)}
                  disabled={page === totalPages}
                  title="Last page"
                >
                  »
                </button>
              </div>

              <div style={{ fontSize: '13px', color: '#888' }}>
                Page {page} of {totalPages}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default InactiveLeads;
