import React, { useEffect, useState } from 'react';
import { FaSearch, FaFileExport } from 'react-icons/fa';
import { BASE_URL } from '../../../config/Config';
import './travelreport.scss';

const formatTime12 = (iso) => {
  if (!iso) return '';
  const d = new Date(iso);
  if (isNaN(d)) return '';
  let h = d.getHours();
  const m = String(d.getMinutes()).padStart(2, '0');
  const ampm = h >= 12 ? 'PM' : 'AM';
  h = h % 12 || 12;
  return `${h}:${m} ${ampm}`;
};

const FILTERS = ['All', 'This Month', 'Last Month', 'Fin Year', 'Custom'];

const formatDateShort = (iso) => {
  if (!iso) return '';
  const d = new Date(iso);
  if (isNaN(d)) return '';
  const now = new Date();
  const opts = { day: 'numeric', month: 'short' };
  if (d.getFullYear() !== now.getFullYear()) opts.year = 'numeric';
  return d.toLocaleDateString('en-IN', opts);
};

const isSameDay = (a, b) => {
  if (!a || !b) return false;
  const da = new Date(a); const db = new Date(b);
  return da.getFullYear() === db.getFullYear() && da.getMonth() === db.getMonth() && da.getDate() === db.getDate();
};

const inThisWeek = (d) => {
  const dt = new Date(d);
  if (isNaN(dt)) return false;
  const today = new Date();
  const start = new Date(today);
  start.setDate(today.getDate() - today.getDay());
  const end = new Date(start);
  end.setDate(start.getDate() + 6);
  return dt >= start && dt <= end;
};

const inThisMonth = (d) => {
  const dt = new Date(d);
  if (isNaN(dt)) return false;
  const now = new Date();
  return dt.getFullYear() === now.getFullYear() && dt.getMonth() === now.getMonth();
};

const TravelReport = () => {
  const [loading, setLoading] = useState(false);
  const [interactions, setInteractions] = useState([]);
  const [leads, setLeads] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [debugOpen, setDebugOpen] = useState(false);
  const [rawSample, setRawSample] = useState([]);
  const [selectedRaw, setSelectedRaw] = useState(null);

  const [search, setSearch] = useState('');
  const [pageSize, setPageSize] = useState(10);
  const [page, setPage] = useState(1);

  // Followup-like filters
  const [filter, setFilter] = useState('All');
  const [execFilter, setExecFilter] = useState('all');
  const [selectedOtherMonth, setSelectedOtherMonth] = useState('');
  const [selectedOtherYear, setSelectedOtherYear] = useState(new Date().getFullYear());

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      setLoading(true);
      try {
        const [interResp, leadsResp, empsResp] = await Promise.all([
          fetch(`${BASE_URL}/api/lead-interactions`).then(r => r.json()),
          fetch(`${BASE_URL}/api/leads?page=1&limit=1000`).then(r => r.json()),
          fetch(`${BASE_URL}/api/employees?page=1&limit=1000`).then(r => r.json())
        ]);

        const interArr = Array.isArray(interResp) ? interResp : (interResp && interResp.data ? interResp.data : []);
        const leadsArr = Array.isArray(leadsResp) ? leadsResp : (leadsResp && leadsResp.data ? leadsResp.data : []);
        const empsArr = Array.isArray(empsResp) ? empsResp : (empsResp && empsResp.data ? empsResp.data : []);

        // Normalize employees
        const normEmps = empsArr.map(e => ({
          ...e,
          id: e.id || e.ID || e.employee_id || e.empid,
          displayName: (e.displayName || e.name) ? (e.displayName || e.name) : (e.firstname || e.firstName || e.firstname) ? `${e.salutation ? e.salutation + ' ' : ''}${e.firstname || e.firstName}${(e.firstname || e.firstName) && (e.lastname || e.lastName) ? ' ' : ''}${e.lastname || e.lastName}`.trim() : e.email || `User ${e.id || ''}`
        }));

        if (!mounted) return;
        // keep a small sample for debugging and log to console so we can inspect backend fields
        console.debug('lead interactions sample:', interArr.slice(0, 10));
        setRawSample(interArr.slice(0, 10));
        setInteractions(interArr.sort((a,b) => {
          const ta = new Date(a.timestamp || a.Timestamp || a.created_at || a.createdAt || a.date || "");
          const tb = new Date(b.timestamp || b.Timestamp || b.created_at || b.createdAt || b.date || "");
          return (tb || 0) - (ta || 0);
        }));
        setLeads(leadsArr);
        setEmployees(normEmps);
      } catch (err) {
        console.error('TravelReport load failed', err);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    load();
    return () => { mounted = false; };
  }, []);

  const getLead = (id) => leads.find(l => String(l.id) === String(id)) || {};
  const getEmpName = (empRef) => {
    if (!empRef) return '';
    if (typeof empRef === 'string') return empRef;
    if (typeof empRef === 'number') return String(empRef);
    if (empRef.displayName || empRef.name) return empRef.displayName || empRef.name;
    if (empRef.id) {
      const e = employees.find(x => String(x.id) === String(empRef.id));
      if (e) return e.displayName;
    }
    return empRef.email || `User ${empRef.id || ''}`;
  };

  const formatInteractionType = (i) => {
    if (!i) return '';
    return String(i || '').toUpperCase();
  };

  const rows = interactions.map((inter) => {
    const lid = inter.lead_id ?? inter.LeadID ?? (inter.lead && (inter.lead.id || inter.lead.ID)) ?? inter.lead;
    const lead = getLead(lid);

    // Executive: try multiple possible fields and map to known employees when possible
    let exec = '';
    let execId = '';

    // 1) if backend provided an employee object, use its name
    if (inter.employee && (inter.employee.displayName || inter.employee.name)) {
      exec = getEmpName(inter.employee);
      execId = inter.employee.id ?? inter.employee.ID ?? execId;
    } else {
      // collect possible id/value fields to inspect (broad list to cover different backends)
      const candidateIds = [
        inter.employee_id, inter.employeeID, inter.employeeId, inter.employee_name, inter.employeeName,
        inter.user_id, inter.userId, inter.user, inter.user_name, inter.userName,
        inter.created_by, inter.createdBy, inter.created_by_id, inter.created_by_name, inter.creator_id, inter.creator, inter.createdById,
        inter.executive_id, inter.executive, inter.executive_name, inter.executiveName, inter.assignee_id, inter.owner, inter.added_by, inter.addedBy
      ];
      // try numeric id matches first
      let found = null;
      for (const c of candidateIds) {
        if (c === undefined || c === null) continue;
        const cid = (typeof c === 'string' && /^\d+$/.test(c)) ? Number(c) : (typeof c === 'number' ? c : null);
        if (cid !== null) {
          const emp = employees.find(e => Number(e.id) === Number(cid));
          if (emp) { found = { id: cid, name: emp.displayName || emp.name }; break; }
          // keep numeric cid as fallback if no employee found
          if (!found) found = { id: cid, name: String(cid) };
        } else if (typeof c === 'string' && c.trim()) {
          // string names
          const empByName = employees.find(e => (e.displayName || e.name || '').toString().toLowerCase() === c.toString().toLowerCase());
          if (empByName) { found = { id: empByName.id, name: empByName.displayName || empByName.name }; break; }
          if (!found) found = { id: '', name: c };
        }
      }

      if (found) {
        exec = found.name || '';
        execId = found.id !== undefined && found.id !== null ? String(found.id) : '';
      } else if (lead.assignedTo) {
        exec = lead.assignedTo;
        execId = lead.assigned_to_id ?? lead.assignedToId ?? '';
      } else if (lead.assigned_to) {
        exec = lead.assigned_to;
        execId = lead.assigned_to_id ?? lead.assignedToId ?? '';
      } else if (lead.assignedToName) {
        exec = lead.assignedToName;
        execId = lead.assigned_to_id ?? lead.assignedToId ?? '';
      } else if (lead.assigned_to_name) {
        exec = lead.assigned_to_name;
        execId = lead.assigned_to_id ?? lead.assignedToId ?? '';
      }
    }

    // extract note/remarks from interaction if present (check nested places as well)
    const note = inter.note || inter.Note || inter.notes || inter.remarks || inter.remark || inter.description || inter.body ||
      (inter.interaction && (inter.interaction.note || inter.interaction.description)) ||
      (inter.followup && (inter.followup.note || inter.followup.description)) ||
      (inter.meta && (inter.meta.note || inter.meta.description)) || '';

    const company = lead.business || lead.company || lead.companyName || '';
    const contact = lead.name || lead.contact || lead.contactPerson || '';

    const tsRaw = inter.timestamp || inter.Timestamp || inter.created_at || inter.createdAt || inter.date || '';
    let ts = tsRaw ? new Date(tsRaw) : null;
    if ((!ts || isNaN(ts)) && inter.date) {
      const isoTry = `${inter.date}T${(inter.time || '00:00')}:00`;
      ts = new Date(isoTry);
    }
    const iso = ts && !isNaN(ts) ? ts.toISOString() : '';

    return {
      id: inter.id || `${lid}-${iso}`,
      executive: exec || 'Unassigned',
      executiveId: execId !== undefined && execId !== null ? String(execId) : '',
      company,
      contact,
      iso,
      date: iso ? formatDateShort(iso) : '',
      time: iso ? formatTime12(iso) : '',
      interaction: formatInteractionType(inter.type || inter.Type || inter.interaction_type || inter.kind || inter.status || ''),
      note: note,
      raw: inter
    }; 
  });

  const filterMatches = (r) => {
    if (filter === 'All') return true;
    if (!r.iso) return false;

    const d = new Date(r.iso);
    if (filter === 'Last Month') {
      const now = new Date();
      const start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const end = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);
      return d >= start && d <= end;
    }

    if (filter === 'Fin Year') {
      const now = new Date();
      let fyStart, fyEnd;
      if (now.getMonth() >= 3) {
        fyStart = new Date(now.getFullYear(), 3, 1);
        fyEnd = new Date(now.getFullYear() + 1, 2, 31, 23, 59, 59);
      } else {
        fyStart = new Date(now.getFullYear() - 1, 3, 1);
        fyEnd = new Date(now.getFullYear(), 2, 31, 23, 59, 59);
      }
      return d >= fyStart && d <= fyEnd;
    }

    if (filter === 'This Month') return inThisMonth(r.iso);

    if (filter === 'Custom') {
      if (!selectedOtherMonth) return false;
      const [y, m] = selectedOtherMonth.split('-').map(Number);
      return d.getFullYear() === y && (d.getMonth() + 1) === m;
    }
    return true;
  };

  const matchesExec = (r) => {
    if (execFilter === 'all') return true;
    if (r.executiveId && String(r.executiveId) === String(execFilter)) return true;
    // fallback: compare executive name to employee name
    const emp = employees.find(e => String(e.id) === String(execFilter));
    if (emp) return (r.executive || '').toString().toLowerCase() === (emp.displayName || emp.name || '').toString().toLowerCase();
    return false;
  };

  const filteredBySearch = rows.filter(r => {
    if (!search || !search.trim()) return true;
    const term = (search || '').toString().toLowerCase();
    return [r.executive, r.company, r.contact, r.date, r.time, r.interaction, r.note].join(' ').toLowerCase().includes(term);
  });

  const visibleRows = filteredBySearch.filter(r => filterMatches(r) && matchesExec(r));

  const totalPages = Math.max(1, Math.ceil(visibleRows.length / pageSize));
  useEffect(() => { setPage(1); }, [search, pageSize, filter, execFilter, selectedOtherMonth, selectedOtherYear, interactions]);
  useEffect(() => { if (page > totalPages) setPage(totalPages); }, [totalPages]);

  const paged = visibleRows.slice((page - 1) * pageSize, page * pageSize);

  const renderPages = () => {
    const pages = [];
    if (totalPages <= 9) for (let i = 1; i <= totalPages; i++) pages.push(i);
    else {
      const left = Math.max(3, page - 2);
      const right = Math.min(totalPages - 2, page + 2);
      pages.push(1, 2);
      if (left > 3) pages.push('...');
      for (let i = left; i <= right; i++) pages.push(i);
      if (right < totalPages - 2) pages.push('...');
      pages.push(totalPages - 1, totalPages);
    }
    return pages.map((p, idx) => p === '...' ? <span key={`e-${idx}`} className="pager-ellipsis">...</span> : <button key={p} className={`pager-page ${p === page ? 'active' : ''}`} onClick={() => setPage(p)}>{p}</button>);
  };

  const exportCsv = () => {
    if (!visibleRows || visibleRows.length === 0) { alert('No data to export'); return; }
    const headers = ['Executive','Company','Contact','Date','Time','Interaction','Note'];
    const fields = ['executive','company','contact','date','time','interaction','note'];
    const rowsCsv = visibleRows.map(r => fields.map(f => `"${String(r[f] || '').replace(/"/g,'""')}"`).join(','));
    const csvContent = [headers.map(h => `"${h}"`).join(','), ...rowsCsv].join('\r\n');
    const blob = new Blob(["\uFEFF", csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `travel_report_${new Date().toISOString().slice(0,10)}.csv`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }; 

  return (
    <div className="sales-interactions-container travel-report">
      <h2 style={{ textAlign: 'center' }}>Travel History</h2>
      <div className="si-header">
        <div className="left">
          <div className="filters">
            <div className="exec-block">
              <select className="exec-select" value={execFilter} onChange={(e) => setExecFilter(e.target.value)}>
                <option value="all">All Executives</option>
                {employees.map(emp => <option key={emp.id} value={String(emp.id)}>{emp.displayName || emp.name}</option>)}
              </select>

              <div className="date-controls">
                <div className="date-buttons">
                  {FILTERS.map(f => (
                    <button key={f} className={`fu-btn ${filter === f ? 'active' : ''}`} onClick={() => setFilter(f)}>{f}</button>
                  ))}
                </div>

                {filter === 'Custom' && (
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
            </div>
          </div>
        </div>
        <div className="right">
          <div className="si-search">
            <input placeholder="Search" className="search" value={search} onChange={(e) => setSearch(e.target.value)} />
            <button className="icon-btn square" title="Export" onClick={exportCsv} aria-label="Export" disabled={loading || visibleRows.length === 0}><FaFileExport/></button>
          </div>
        </div>
      </div>

      <div className="si-table-wrap">
        <table className="si-table">
          <thead>
            <tr>
              <th>Executive</th>
              <th>Company</th>
              <th>Contact</th>
              <th>Date</th>
              <th>Time</th>
              <th>Type</th>
              <th>Note</th>
            </tr>
          </thead> 
          <tbody>
            {loading ? (
              <tr><td colSpan={7} style={{textAlign:'center', padding:20}}>Loading...</td></tr>
            ) : visibleRows.length === 0 ? (
              <tr><td colSpan={7} style={{textAlign:'center', padding:20}}>No records</td></tr>
            ) : paged.map((r, i) => (
              <tr key={r.id || i} onClick={() => setSelectedRaw(r.raw)} style={{cursor: 'pointer'}}>
                <td>{r.executive}</td>
                <td>{r.company || '-'}</td>
                <td>{r.contact || '-'}</td>
                <td>{r.date || '-'}</td>
                <td>{r.time || '-'}</td>
                <td>{r.interaction || '-'}</td>
                <td style={{whiteSpace: 'nowrap', maxWidth: 300, overflow: 'hidden', textOverflow: 'ellipsis'}} title={r.note || ''}>{r.note || '-'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

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

      {debugOpen && (
        <div className="debug-panel" style={{border:'1px solid #ddd', padding:10, marginTop:16, background:'#fafafa'}}>
          <h4 style={{marginTop:0}}>Raw interactions (first {rawSample.length})</h4>
          <pre style={{maxHeight:240, overflow:'auto', background:'#fff', padding:8}}>{JSON.stringify(rawSample, null, 2)}</pre>
          {selectedRaw && (
            <div style={{marginTop:12}}>
              <h5>Selected interaction (click a row)</h5>
              <pre style={{maxHeight:300, overflow:'auto', background:'#fff', padding:8}}>{JSON.stringify(selectedRaw, null, 2)}</pre>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default TravelReport;
