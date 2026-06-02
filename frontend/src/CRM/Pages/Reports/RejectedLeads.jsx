import React, { useEffect, useState } from 'react';
import { FaFileExport, FaSearch } from 'react-icons/fa';
import * as XLSX from 'xlsx';
import { BASE_URL, getAuthHeaders } from '../../../config/Config';
import './_sales_interactions.scss';
import './rejectedleads.scss';

const FILTERS = ['All', 'This Month', 'Last Month', 'This Year', 'Custom'];

const formatDateShort = (iso) => {
  if (!iso) return '';
  const d = new Date(iso);
  if (isNaN(d)) return '';
  const now = new Date();
  const opts = { day: 'numeric', month: 'short', year: 'numeric' };
  return d.toLocaleDateString('en-IN', opts);
};

const RejectedLeads = () => {
  const [leads, setLeads] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [filter, setFilter] = useState('All');
  const [execFilter, setExecFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [selectedOtherMonth, setSelectedOtherMonth] = useState('');
  const [selectedOtherYear, setSelectedOtherYear] = useState(new Date().getFullYear());

  const formatEmployeeName = (emp) => {
    if (!emp) return '';
    if (typeof emp === 'string') return emp;
    const sal = (emp.salutation || emp.prefix || '').toString().trim();
    const first = (emp.firstname || emp.firstName || emp.first || emp.name || '').toString().trim();
    const last = (emp.lastname || emp.lastName || emp.last || '').toString().trim();
    const name = `${sal ? sal + ' ' : ''}${first}${(first && last) ? ' ' : ''}${last}`.trim();
    return name || emp.displayName || emp.name || emp.email || `User ${emp.id || ''}`;
  };

  // Helper to normalize stage from various possible backend/import shapes
  const getStage = (lead) => {
    if (!lead) return '';
    const candidates = [
      lead.stage, lead.Stage, lead.status, lead.Status,
      lead.stageName, lead.StageName, lead.stage_name, lead.StatusName,
      lead.status_name, lead.current_stage, lead.currentStage
    ];
    for (const c of candidates) {
      if (c === null || c === undefined) continue;
      if (typeof c === 'string' && c.trim()) return c.trim().toLowerCase();
      if (typeof c === 'number') return String(c).toLowerCase();
      if (typeof c === 'object' && c !== null) {
        const s = c.name || c.label || c.displayName || c.title || c.stage;
        if (s) return String(s).trim().toLowerCase();
      }
    }
    return '';
  };

  // Load data
  const loadData = async () => {
    let mounted = true;
    try {
      setLoading(true);
      const [leadsResp, emps] = await Promise.all([
        fetch(`${BASE_URL}/api/leads`, { headers: getAuthHeaders() }).then(r => r.json()),
        fetch(`${BASE_URL}/api/employees`, { headers: getAuthHeaders() }).then(r => r.json())
      ]);

      if (!mounted) return;
      
      const backendLeads = Array.isArray(leadsResp) ? leadsResp : (leadsResp && leadsResp.data ? leadsResp.data : []);
      
      // Include locally imported leads so report shows the same items as TopMenu
      const importedLeadsRaw = (JSON.parse(localStorage.getItem('importedLeads') || '[]') || []);
      const importedLeads = importedLeadsRaw.map(l => ({
        ...l,
        createdAt: l.createdAt || l.CreatedAt || l.created_at || new Date().toISOString(),
        updatedAt: l.updatedAt || l.UpdatedAt || l.updated_at || l.createdAt || new Date().toISOString()
      }));
      const mergedLeads = [...backendLeads, ...importedLeads];
      
      // Filter only rejected leads (also include 'lost' and 'disqualified' to match TopMenu)
      const rejectedLeads = mergedLeads.filter(lead => {
        const stage = getStage(lead);
        return ['rejected', 'lost', 'disqualified'].includes(stage);
      });

      setLeads(rejectedLeads);
      
      const normEmps = Array.isArray(emps) ? emps.map(e => ({
        ...e,
        id: e.id || e.ID || e.employee_id || e.empid,
        displayName: formatEmployeeName(e)
      })) : [];
      setEmployees(normEmps);
    } catch (err) {
      console.error('Error loading rejected leads:', err);
      alert('Failed to load rejected leads. Please try again.');
    } finally {
      if (mounted) setLoading(false);
    }

    return () => { mounted = false; };
  };

  useEffect(() => {
    loadData();
  }, []);

  // Listen for leads import/update events (same-tab via CustomEvent and cross-tab via storage events)
  useEffect(() => {
    const handleLeadsUpdate = () => {
      loadData();
    };

    window.addEventListener('leads:imported', handleLeadsUpdate);
    window.addEventListener('leads:updated', handleLeadsUpdate);
    window.addEventListener('storage', (e) => {
      if (e.key === 'importedLeads') {
        handleLeadsUpdate();
      }
    });

    return () => {
      window.removeEventListener('leads:imported', handleLeadsUpdate);
      window.removeEventListener('leads:updated', handleLeadsUpdate);
    };
  }, []);

  const getEmployee = (lead) => {
    const assignedId = lead.assigned_to_id || lead.assignedToId || lead.AssignedToID;
    if (!assignedId) return null;
    return employees.find(e => String(e.id) === String(assignedId));
  };

  const inThisMonth = (d) => {
    const dt = new Date(d);
    if (isNaN(dt)) return false;
    const now = new Date();
    return dt.getFullYear() === now.getFullYear() && dt.getMonth() === now.getMonth();
  };

  const inLastMonth = (d) => {
    const dt = new Date(d);
    if (isNaN(dt)) return false;
    const now = new Date();
    const last = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    return dt.getFullYear() === last.getFullYear() && dt.getMonth() === last.getMonth();
  };

  const inThisYear = (d) => {
    const dt = new Date(d);
    if (isNaN(dt)) return false;
    const now = new Date();
    return dt.getFullYear() === now.getFullYear();
  };

  const inCustomMonth = (d) => {
    if (!selectedOtherMonth) return false;
    const dt = new Date(d);
    if (isNaN(dt)) return false;
    const [year, month] = selectedOtherMonth.split('-').map(Number);
    return dt.getFullYear() === year && (dt.getMonth() + 1) === month;
  };

  const filterMatches = (lead) => {
    const updatedDate = lead.updated_at || lead.updatedAt || lead.UpdatedAt;
    if (!updatedDate) return filter === 'All';
    
    if (filter === 'All') return true;
    if (filter === 'This Month') return inThisMonth(updatedDate);
    if (filter === 'Last Month') return inLastMonth(updatedDate);
    if (filter === 'This Year') return inThisYear(updatedDate);
    if (filter === 'Custom') return inCustomMonth(updatedDate);
    return false;
  };

  const matchesExec = (lead) => {
    if (execFilter === 'all') return true;
    const emp = getEmployee(lead);
    if (!emp) return false;
    return String(emp.id) === String(execFilter);
  };

  const matchesSearch = (lead) => {
    if (!search) return true;
    const term = search.toLowerCase();
    const business = (lead.business || '').toLowerCase();
    const name = (lead.name || lead.contact || '').toLowerCase();
    const mobile = (lead.mobile || '').toLowerCase();
    const email = (lead.email || '').toLowerCase();
    const reason = (lead.rejectionReason || lead.rejection_reason || '').toLowerCase();
    const emp = getEmployee(lead);
    const empName = emp ? formatEmployeeName(emp).toLowerCase() : '';
    
    return business.includes(term) || name.includes(term) || mobile.includes(term) || 
           email.includes(term) || empName.includes(term) || reason.includes(term);
  };

  const escapeRegExp = (s) => String(s).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

  const highlightMatch = (text, term) => {
    if (!term || !text) return text || '';
    const t = String(text);
    const re = new RegExp(`(${escapeRegExp(term)})`, 'ig');
    const parts = t.split(re);
    return parts.map((part, idx) => {
      if (part && part.match(re)) return <mark key={idx} className="si-highlight">{part}</mark>;
      return <span key={idx}>{part}</span>;
    });
  };

  const visible = leads.filter(lead => filterMatches(lead) && matchesSearch(lead) && matchesExec(lead));

  // Pagination
  const [pageSize, setPageSize] = useState(10);
  const [page, setPage] = useState(1);

  useEffect(() => { setPage(1); }, [filter, execFilter, search, selectedOtherMonth, selectedOtherYear, leads]);

  const totalPages = Math.max(1, Math.ceil(visible.length / pageSize));
  
  useEffect(() => { if (page > totalPages) setPage(totalPages); }, [totalPages]);

  const paged = visible.slice((page - 1) * pageSize, page * pageSize);

  const exportToExcel = () => {
    if (visible.length === 0) {
      alert('No data to export');
      return;
    }
    
    setExporting(true);
    try {
      const data = visible.map(lead => {
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
          'Rejection Reason': lead.rejectionReason || lead.rejection_reason || '',
          'Since': formatDateShort(lead.since || lead.Since),
          'Updated': formatDateShort(lead.updated_at || lead.updatedAt),
        };
      });

      const ws = XLSX.utils.json_to_sheet(data);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Rejected Leads');
      
      const fileName = `rejected_leads_${new Date().toISOString().slice(0, 10)}.xlsx`;
      XLSX.writeFile(wb, fileName);
    } catch (err) {
      console.error('Export error:', err);
      alert('Failed to export data');
    } finally {
      setExporting(false);
    }
  };

  const uniqueExecs = [...new Set(leads.map(lead => {
    const emp = getEmployee(lead);
    return emp ? emp.id : null;
  }).filter(Boolean))];

  return (
    <div className="sales-interactions-container">
      <div className="si-header">
        <div className="left">
          <h2>Rejected Leads Report</h2>
          <div className="filters">
            <div className="filter-item">
              <select value={filter} onChange={e => setFilter(e.target.value)}>
                {FILTERS.map(f => <option key={f} value={f}>{f}</option>)}
              </select>
            </div>
            {filter === 'Custom' && (
              <div className="filter-item selectors">
                <select
                  className="month"
                  value={selectedOtherMonth}
                  onChange={(e) => setSelectedOtherMonth(e.target.value)}
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
                  className="year"
                  value={selectedOtherYear}
                  onChange={(e) => { setSelectedOtherYear(Number(e.target.value)); setSelectedOtherMonth(''); }}
                >
                  {Array.from({ length: 10 }, (_, i) => new Date().getFullYear() - i).map((y) => (
                    <option key={y} value={y}>{y}</option>
                  ))}
                </select>
              </div>
            )}
            <div className="filter-item">
              <select className="exec-select" value={execFilter} onChange={e => setExecFilter(e.target.value)}>
                <option value="all">All Employees</option>
                {uniqueExecs.map(id => {
                  const emp = employees.find(e => String(e.id) === String(id));
                  return emp ? <option key={id} value={id}>{formatEmployeeName(emp)}</option> : null;
                })}
              </select>
            </div>
          </div>
        </div>
        <div className="right">
          <input
            type="text"
            placeholder="Search business, name, mobile, email, reason..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="search"
          />
          <button className="icon-btn square" onClick={exportToExcel} disabled={exporting || visible.length === 0} title={exporting ? 'Exporting...' : 'Export to Excel'}>
            <FaFileExport />
          </button>
        </div>
      </div>

      {loading ? (
        <div style={{ padding: '40px', textAlign: 'center', fontSize: '16px', color: '#666' }}>Loading rejected leads...</div>
      ) : (
        <>
          <div style={{ padding: '12px 0', fontSize: '14px', color: '#666' }}>
            Showing {paged.length} of {visible.length} rejected leads
          </div>

          <div className="si-table-wrap">
            <table className="si-table">
              <thead>
                <tr>
                  <th>Business</th>
                  <th>Contact Name</th>
                  <th>Mobile</th>
                  <th>Email</th>
                  <th>City</th>
                  <th>State</th>
                  <th>Assigned To</th>
                  <th>Rejection Reason</th>
                  <th>Since</th>
                  <th>Updated</th>
                </tr>
              </thead>
              <tbody>
                {paged.map((lead) => {
                  const emp = getEmployee(lead);
                  const empName = emp ? formatEmployeeName(emp) : lead.assignedToName || '';
                  
                  return (
                    <tr key={lead.id || lead.ID}>
                      <td>{highlightMatch(lead.business, search)}</td>
                      <td>{highlightMatch(lead.name || lead.contact, search)}</td>
                      <td>{highlightMatch(lead.mobile, search)}</td>
                      <td>{highlightMatch(lead.email, search)}</td>
                      <td>{lead.city || ''}</td>
                      <td>{lead.state || ''}</td>
                      <td>{highlightMatch(empName, search)}</td>
                      <td>{highlightMatch(lead.rejectionReason || lead.rejection_reason || '', search)}</td>
                      <td>{formatDateShort(lead.since || lead.Since)}</td>
                      <td>{formatDateShort(lead.updated_at || lead.updatedAt)}</td>
                    </tr>
                  );
                })}
                {paged.length === 0 && (
                  <tr>
                    <td colSpan="10" style={{ textAlign: 'center', padding: '20px' }}>
                      No rejected leads found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {totalPages > 1 && (
            <div className="si-pagination">
              <div className="page-size">
                <button className={`ps-btn ${pageSize === 10 ? 'active' : ''}`} onClick={() => { setPageSize(10); setPage(1); }}>10</button>
                <button className={`ps-btn ${pageSize === 25 ? 'active' : ''}`} onClick={() => { setPageSize(25); setPage(1); }}>25</button>
                <button className={`ps-btn ${pageSize === 50 ? 'active' : ''}`} onClick={() => { setPageSize(50); setPage(1); }}>50</button>
                <button className={`ps-btn ${pageSize === 100 ? 'active' : ''}`} onClick={() => { setPageSize(100); setPage(1); }}>100</button>
              </div>
              <div className="pager">
                <button className="pager-nav" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}>
                  Previous
                </button>
                <span style={{ padding: '0 12px' }}>Page {page} of {totalPages}</span>
                <button className="pager-nav" onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}>
                  Next
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default RejectedLeads;
