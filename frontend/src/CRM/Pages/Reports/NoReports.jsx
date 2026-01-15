import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { FaSearch, FaFileExport } from 'react-icons/fa';
import { BASE_URL } from '../../../config/Config';
import './noreports.scss';

const NoReports = () => {
  const [period, setPeriod] = useState('this');
  const [filter, setFilter] = useState('All');
  const [q, setQ] = useState('');
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [employees, setEmployees] = useState([]);
  const [interactions, setInteractions] = useState([]);
  const [followups, setFollowups] = useState([]);
  const [selectedOtherMonth, setSelectedOtherMonth] = useState('');
  const [selectedOtherYear, setSelectedOtherYear] = useState(new Date().getFullYear());
  const location = useLocation();

  useEffect(() => {
    const params = new URLSearchParams(location.search || window.location.search || '');
    const initFilter = params.get('initFilter');
    if (initFilter && ['All','No Interactions','No Appointments','Missed Appointments'].includes(initFilter)) {
      setFilter(initFilter);
    }
  }, [location.search]);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      setLoading(true);
      try {
        const [leadsResp, interResp, followResp, empsResp] = await Promise.all([
          fetch(`${BASE_URL}/api/leads?page=1&limit=1000`).then(r => r.json()),
          fetch(`${BASE_URL}/api/lead-interactions`).then(r => r.json()),
          fetch(`${BASE_URL}/api/lead-followups`).then(r => r.json()),
          fetch(`${BASE_URL}/api/employees?page=1&limit=1000`).then(r => r.json())
        ]);

        const leadsArr = Array.isArray(leadsResp) ? leadsResp : (leadsResp && leadsResp.data ? leadsResp.data : []);
        const interArr = Array.isArray(interResp) ? interResp : (interResp && interResp.data ? interResp.data : []);
        const followArr = Array.isArray(followResp) ? followResp : (followResp && followResp.data ? followResp.data : []);
        const empArr = Array.isArray(empsResp) ? empsResp : (empsResp && empsResp.data ? empsResp.data : []);

        // Helper to get date range based on period
        const getDateRange = () => {
          const now = new Date();
          if (period === 'this') {
            // Current month
            const start = new Date(now.getFullYear(), now.getMonth(), 1);
            const end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
            return { start, end };
          } else if (period === 'last') {
            // Last month
            const start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
            const end = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);
            return { start, end };
          } else if (period === 'fin') {
            // Financial year (April to March)
            let fyStart, fyEnd;
            if (now.getMonth() >= 3) {
              fyStart = new Date(now.getFullYear(), 3, 1);
              fyEnd = new Date(now.getFullYear() + 1, 2, 31, 23, 59, 59);
            } else {
              fyStart = new Date(now.getFullYear() - 1, 3, 1);
              fyEnd = new Date(now.getFullYear(), 2, 31, 23, 59, 59);
            }
            return { start: fyStart, end: fyEnd };
          } else if (period === 'custom' && selectedOtherMonth) {
            // Custom month/year
            const [year, month] = selectedOtherMonth.split('-').map(Number);
            const start = new Date(year, month - 1, 1);
            const end = new Date(year, month, 0, 23, 59, 59);
            return { start, end };
          }
          return null;
        };

        const dateRange = getDateRange();
        
        // Filter leads by date range if applicable
        const filteredLeads = dateRange
          ? leadsArr.filter(lead => {
              const leadDate = new Date(lead.created_at || lead.createdAt || lead.CreatedAt || lead.since || new Date());
              return leadDate >= dateRange.start && leadDate <= dateRange.end;
            })
          : leadsArr;

        // Normalize employee map id -> name
        const empMap = new Map();
        empArr.forEach(e => {
          const id = e.id || e.ID || e.employee_id || e.empid;
          const sal = (e.salutation || e.prefix || '')?.toString().trim();
          const first = (e.firstname || e.firstName || e.first || e.name || '')?.toString().trim();
          const last = (e.lastname || e.lastName || e.last || '')?.toString().trim();
          const name = (e.displayName || e.name) ? (e.displayName || e.name) : `${sal ? sal + ' ' : ''}${first}${(first && last) ? ' ' : ''}${last}`.trim() || e.email || `User ${id || ''}`;
          if (id !== undefined && id !== null) empMap.set(String(id), name);
        });

        // Build set of lead IDs that have interactions
        const interactionsSet = new Set();
        interArr.forEach(inter => {
          const lid = inter.lead_id ?? inter.LeadID ?? (inter.lead && (inter.lead.id || inter.lead.ID)) ?? inter.lead;
          if (lid !== undefined && lid !== null && String(lid) !== '') interactionsSet.add(String(lid));
        });

        // Group by assigned executive and compute counts
        const execMap = new Map();
        const now = new Date();
        filteredLeads.forEach(lead => {
          const leadId = lead.id ?? lead.ID ?? lead.lead_id ?? '';

          // Resolve assigned name (accept multiple field variants from different imports/backends)
          let assignedName = '';
          // Prefer explicit string labels when present
          if (lead.assignedTo && typeof lead.assignedTo === 'string' && !/^\d+$/.test((lead.assignedTo || '').toString())) {
            assignedName = lead.assignedTo;
          } else if (lead.assigned_to && typeof lead.assigned_to === 'string' && !/^\d+$/.test((lead.assigned_to || '').toString())) {
            assignedName = lead.assigned_to;
          } else if (lead.assignedToName && typeof lead.assignedToName === 'string' && lead.assignedToName.trim()) {
            assignedName = lead.assignedToName;
          } else if (lead.assigned_to_name && typeof lead.assigned_to_name === 'string' && lead.assigned_to_name.trim()) {
            assignedName = lead.assigned_to_name;
          } else {
            // Otherwise try to resolve numeric id references
            let idCandidate;
            if (lead.assigned_to_id !== undefined && lead.assigned_to_id !== null && lead.assigned_to_id !== '') idCandidate = Number(lead.assigned_to_id);
            else if (lead.assignedToId !== undefined && lead.assignedToId !== null && lead.assignedToId !== '') idCandidate = Number(lead.assignedToId);
            else if (lead.assignedTo && typeof lead.assignedTo === 'number') idCandidate = Number(lead.assignedTo);
            else if (lead.assigned_to && (typeof lead.assigned_to === 'number' || (/^\d+$/.test(String(lead.assigned_to))))) idCandidate = Number(lead.assigned_to);
            if (idCandidate !== undefined && !isNaN(idCandidate)) assignedName = empMap.get(String(idCandidate)) || String(idCandidate);
          }
          if (!assignedName) assignedName = 'Unassigned';

          // Followups for this lead
          const lFollowups = followArr.filter(f => {
            const lid = f.lead_id ?? f.LeadID ?? (f.lead && (f.lead.id || f.lead.ID)) ?? f.lead;
            return String(lid) === String(leadId);
          });

          const hasInteraction = interactionsSet.has(String(leadId));

          const hasFollowupScheduled = lFollowups.some(f => {
            const status = (f.status || f.Status || '')?.toString().toLowerCase();
            return (f.followup_on || f.FollowUpOn || f.followupOn) && status !== 'cancelled' && status !== 'done';
          });

          const missed = lFollowups.some(f => {
            const status = (f.status || f.Status || '')?.toString().toLowerCase();
            // If action already taken, not considered missed
            if (status === 'done' || status === 'cancelled') return false;
            
            const followupDateTime = f.followup_on || f.FollowUpOn || f.followupOn;
            if (!followupDateTime) return false;
            
            const followupDate = new Date(followupDateTime);
            // If followup date/time is valid and has passed without any action, it's missed
            if (!isNaN(followupDate) && followupDate < now) {
              return true;
            }
            return false;
          });

          const noInteraction = !hasInteraction && !hasFollowupScheduled;
          const noAppt = !hasFollowupScheduled;

          const cur = execMap.get(assignedName) || { name: assignedName, total: 0, noInt: 0, noAppt: 0, missed: 0 };
          cur.total += 1;
          if (noInteraction) cur.noInt += 1;
          if (noAppt) cur.noAppt += 1;
          if (missed) cur.missed += 1;
          execMap.set(assignedName, cur);
        });

        const result = Array.from(execMap.values()).sort((a, b) => b.total - a.total);
        if (mounted) {
          setData(result);
          setInteractions(interArr);
          setFollowups(followArr);
          setEmployees(empArr);
        }
      } catch (err) {
        console.error('NoReports load failed', err);
        if (mounted) setData([]);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    load();
    return () => { mounted = false; };
  }, [period, selectedOtherMonth, selectedOtherYear]);

  const formatPercent = (num, denom) => (denom ? ((num / denom) * 100).toFixed(2) + ' %' : '0.00 %');

  const escapeRegExp = (string) => String(string).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

  const highlightMatch = (text, query) => {
    if (!query) return text;
    const parts = String(text).split(new RegExp(`(${escapeRegExp(query)})`, 'ig'));
    return parts.map((part, i) => {
      if (part.toLowerCase() === query.toLowerCase()) {
        return <mark key={i} className="search-highlight">{part}</mark>;
      }
      return <span key={i}>{part}</span>;
    });
  };

  const filteredBySearch = data.filter((d) => (d.name || '').toString().toLowerCase().includes(q.toLowerCase()));

  const visibleRows = (() => {
    if (filter === 'No Interactions') return filteredBySearch.filter(r => Number(r.noInt) > 0);
    if (filter === 'No Appointments') return filteredBySearch.filter(r => Number(r.noAppt) > 0);
    if (filter === 'Missed Appointments') return filteredBySearch.filter(r => Number(r.missed) > 0);
    return filteredBySearch;
  })();

  // Pagination state
  const [pageSize, setPageSize] = useState(10);
  const [page, setPage] = useState(1);

  // Reset page when filters change
  useEffect(() => { setPage(1); }, [period, selectedOtherMonth, selectedOtherYear, filter, q, data]);

  const totalPages = Math.max(1, Math.ceil(visibleRows.length / pageSize));
  useEffect(() => { if (page > totalPages) setPage(totalPages); }, [totalPages]);

  const pagedRows = visibleRows.slice((page - 1) * pageSize, page * pageSize);

  const renderPages = () => {
    const pages = [];
    if (totalPages <= 9) {
      for (let p = 1; p <= totalPages; p++) pages.push(p);
    } else {
      pages.push(1);
      pages.push(2);
      const left = Math.max(3, page - 2);
      const right = Math.min(totalPages - 2, page + 2);
      if (left > 3) pages.push('left-ellipsis');
      for (let p = left; p <= right; p++) pages.push(p);
      if (right < totalPages - 2) pages.push('right-ellipsis');
      pages.push(totalPages - 1);
      pages.push(totalPages);
    }
    return pages.map((p, idx) => {
      if (p === 'left-ellipsis' || p === 'right-ellipsis') return <span key={`e-${idx}`} className="pager-ellipsis">...</span>;
      return <button key={`p-${idx}`} className={`pager-page ${p === page ? 'active' : ''}`} onClick={() => setPage(p)}>{p}</button>;
    });
  };

  const columns = (() => {
    switch (filter) {
      case 'No Interactions':
        return ['name','total','noInt','ratioNoInt'];
      case 'No Appointments':
        return ['name','total','noAppt','ratioNoAppt'];
      case 'Missed Appointments':
        return ['name','total','missed','ratioMissed'];
      default:
        return ['name','total','noInt','ratioNoInt','noAppt','ratioNoAppt','missed','ratioMissed'];
    }
  })();

  const colLabels = {
    name: 'Executive',
    total: 'Total',
    noInt: 'No Int',
    ratioNoInt: 'Ratio (%)',
    noAppt: 'No Apptts',
    ratioNoAppt: 'Ratio (%)',
    missed: 'Missed',
    ratioMissed: 'Ratio (%)'
  };

  const exportToCsv = () => {
    if (!visibleRows || visibleRows.length === 0) {
      alert('No data to export');
      return;
    }

    const headers = columns.map(c => colLabels[c] || c);

    const rows = visibleRows.map(r => columns.map(c => {
      if (c === 'name') return r.name ?? '';
      if (c === 'total') return r.total ?? '';
      if (c === 'noInt') return r.noInt ?? '';
      if (c === 'noAppt') return r.noAppt ?? '';
      if (c === 'missed') return r.missed ?? '';
      if (c === 'ratioNoInt') return formatPercent(r.noInt, r.total);
      if (c === 'ratioNoAppt') return formatPercent(r.noAppt, r.total);
      if (c === 'ratioMissed') return formatPercent(r.missed, r.total);
      return r[c] ?? '';
    }).map(v => `"${String(v).replace(/"/g, '""')}"`).join(','));

    const csvContent = [headers.map(h => `"${String(h).replace(/"/g, '""')}"`).join(','), ...rows].join('\r\n');

    const blob = new Blob(["\uFEFF", csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    const fileName = `sales_team_performance_${period}${period === 'custom' && selectedOtherMonth ? `_${selectedOtherMonth}` : ''}_${new Date().toISOString().slice(0,10)}.csv`;
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="no-reports-page">
      <div className="page-header">
        <h2>Sales Team Performance</h2>
        <div className="tools">
          <div className="search">
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search" />
            <FaSearch className="icon" />
          </div>
          <button
            className="export"
            title="Export"
            onClick={exportToCsv}
            disabled={loading || visibleRows.length === 0}
            aria-label="Export table to CSV"
          >
            <FaFileExport />
          </button>
        </div>
      </div>

      <div className="controls">
        <div className="periods">
          <button className={period === 'this' ? 'active' : ''} onClick={() => setPeriod('this')}>This Month</button>
          <button className={period === 'last' ? 'active' : ''} onClick={() => setPeriod('last')}>Last Month</button>
          <button className={period === 'fin' ? 'active' : ''} onClick={() => setPeriod('fin')}>Fin Year</button>
          <button className={period === 'custom' ? 'active' : ''} onClick={() => setPeriod('custom')}>Custom</button>

          {period === 'custom' && (
            <div className="inline-selectors selectors">
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
        </div>

        <div className="filters">
          {['All', 'No Interactions', 'No Appointments', 'Missed Appointments'].map((f) => (
            <button key={f} className={filter === f ? 'active' : ''} onClick={() => setFilter(f)}>
              {f}
            </button>
          ))}
        </div>
      </div>

      <div className="report-table">
        <table>
          <thead>
            <tr>
              {columns.map(c => (<th key={c} className={c === 'name' ? 'left' : 'right'}>{colLabels[c]}</th>))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={columns.length} className="no-data">Loading...</td></tr>
            ) : visibleRows.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="no-data">No records found</td>
              </tr>
            ) : (
              pagedRows.map((r, i) => (
                <tr key={i}>
                  {columns.map(col => {
                    if (col === 'name') return <td key={col} className="left">{highlightMatch(r.name || '-', q)}</td>;
                    if (col === 'total') return <td key={col} className="right">{r.total ?? '-'}</td>;
                    if (col === 'noInt') return <td key={col} className="right">{r.noInt ?? '-'}</td>;
                    if (col === 'ratioNoInt') return <td key={col} className="right">{formatPercent(r.noInt, r.total)}</td>;
                    if (col === 'noAppt') return <td key={col} className="right">{r.noAppt ?? '-'}</td>;
                    if (col === 'ratioNoAppt') return <td key={col} className="right">{formatPercent(r.noAppt, r.total)}</td>;
                    if (col === 'missed') return <td key={col} className="right">{r.missed ?? '-'}</td>;
                    if (col === 'ratioMissed') return <td key={col} className="right">{formatPercent(r.missed, r.total)}</td>;
                    return <td key={col} className="right">-</td>;
                  })} 
                </tr>
              ))
            )}
          </tbody>
        </table>

        {visibleRows.length > 0 && (
          <div className="si-pagination">
            <div className="page-size">
              {[10,25,50,100].map(n => (
                <button key={n} className={`ps-btn ${pageSize === n ? 'active' : ''}`} onClick={() => { setPageSize(n); setPage(1); }}>{n}</button>
              ))}
            </div>

            <div className="pager">
              <button className="pager-nav" onClick={() => setPage(1)} disabled={page === 1}>«</button>
              <button className="pager-nav" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}>‹</button>

              {renderPages()}

              <button className="pager-nav" onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}>›</button>
              <button className="pager-nav" onClick={() => setPage(totalPages)} disabled={page === totalPages}>»</button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default NoReports;
