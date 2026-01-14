import React, { useEffect, useState } from 'react';
import { FaCheck, FaTimes, FaFileExport, FaSearch } from 'react-icons/fa';
import * as XLSX from 'xlsx';
import { BASE_URL } from '../../../config/Config';
import './_sales_interactions.scss';
import './followup.scss';

const FILTERS = ['All', 'Today', 'Tomorrow', 'This Week', 'This Month', 'Custom'];

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

const Followup = () => {
  const [followups, setFollowups] = useState([]);
  const [leads, setLeads] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [latestInteractions, setLatestInteractions] = useState({});

  const formatEmployeeName = (emp) => {
    if (!emp) return '';
    if (typeof emp === 'string') return emp;
    const sal = (emp.salutation || emp.prefix || '').toString().trim();
    const first = (emp.firstname || emp.firstName || emp.first || emp.name || '').toString().trim();
    const last = (emp.lastname || emp.lastName || emp.last || '').toString().trim();
    const name = `${sal ? sal + ' ' : ''}${first}${(first && last) ? ' ' : ''}${last}`.trim();
    return name || emp.displayName || emp.name || emp.email || `User ${emp.id || ''}`;
  };
  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [filter, setFilter] = useState('All');
  const [execFilter, setExecFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [selectedOtherMonth, setSelectedOtherMonth] = useState('');
  const [selectedOtherYear, setSelectedOtherYear] = useState(new Date().getFullYear());

  // load data helper so we can refresh on events
  const loadData = async () => {
    let mounted = true;
    try {
      setLoading(true);
      const [fups, leadsResp, emps, interResp] = await Promise.all([
        fetch(`${BASE_URL}/api/lead-followups`).then(r => r.json()),
        fetch(`${BASE_URL}/api/leads`).then(r => r.json()),
        fetch(`${BASE_URL}/api/employees`).then(r => r.json()),
        fetch(`${BASE_URL}/api/lead-interactions`).then(r => r.json())
      ]);

      console.log('loadData: raw followups response:', fups);

      if (!mounted) return;
      const fu = Array.isArray(fups) ? fups : (fups && fups.data ? fups.data : []);
      console.log('loadData: normalized followups count:', fu.length);
      setFollowups(fu);
      setLeads(Array.isArray(leadsResp) ? leadsResp : (leadsResp && leadsResp.data ? leadsResp.data : []));
      const normEmps = Array.isArray(emps) ? emps.map(e => ({
        ...e,
        id: e.id || e.ID || e.employee_id || e.empid,
        displayName: (e.displayName || e.name) ? (e.displayName || e.name) : (e.firstname || e.firstName || e.firstname) ? `${e.salutation ? e.salutation + ' ' : ''}${e.firstname || e.firstName}${(e.firstname || e.firstName) && (e.lastname || e.lastName) ? ' ' : ''}${e.lastname || e.lastName}`.trim() : e.email || `User ${e.id || ''}`
      })) : [];
      setEmployees(normEmps);

      // Build a map of the most recent interaction for each lead
      const interactions = Array.isArray(interResp) ? interResp : (interResp && interResp.data ? interResp.data : []);
      const latest = {};
      interactions.forEach(inter => {
        const leadRef = inter.lead || inter.Lead || {};
        const leadIdRaw = inter.lead_id || inter.leadId || leadRef.id || leadRef.ID;
        if (leadIdRaw === undefined || leadIdRaw === null) return;
        const id = String(leadIdRaw);
        const tsRaw = inter.timestamp || inter.Timestamp || inter.created_at || inter.createdAt || inter.date;
        let ts = tsRaw ? new Date(tsRaw) : null;
        if (!ts || isNaN(ts)) {
          if (inter.date) {
            const isoTry = `${inter.date}T${(inter.time || '00:00')}:00`;
            ts = new Date(isoTry);
          }
        }
        if (!ts || isNaN(ts)) return;
        const existing = latest[id];
        if (!existing || ts > new Date(existing.ts)) {
          latest[id] = { ts: ts.toISOString(), type: (inter.type || inter.Type || inter.interaction_type || inter.kind || '').toString().trim() };
        }
      });
      setLatestInteractions(latest);
    } catch (err) {
      console.error('load followups failed', err);
    } finally {
      if (mounted) setLoading(false);
    }
  };

  useEffect(() => {
    loadData();

    const handler = (e) => {
      try {
        console.log('Followup page received lead:interaction.saved event', e.detail);
        // reload followups when an interaction or followup is saved
        loadData();
      } catch (err) { console.error('Followup event handler error', err); }
    };
    window.addEventListener('lead:interaction.saved', handler);

    return () => { window.removeEventListener('lead:interaction.saved', handler); };
  }, []);

  const getLead = (id) => leads.find(l => String(l.id) === String(id)) || {};

  const filterMatches = (fup) => {
    const dtStr = fup.followup_on || fup.FollowUpOn || fup.followupOn || '';
    if (!dtStr) return false;
    const dt = new Date(dtStr);
    if (isNaN(dt)) return false;
    if (filter === 'All') return true;
    if (filter === 'Today') return isSameDay(dt.toISOString(), new Date().toISOString());
    if (filter === 'Tomorrow') { const t = new Date(); t.setDate(t.getDate() + 1); return isSameDay(dt.toISOString(), t.toISOString()); }
    if (filter === 'This Week') return inThisWeek(dt.toISOString());
    if (filter === 'This Month') return inThisMonth(dt.toISOString());
    if (filter === 'Custom') {
      if (!selectedOtherMonth) return false;
      const [y, m] = selectedOtherMonth.split('-').map(Number);
      return dt.getFullYear() === y && (dt.getMonth() + 1) === m;
    }
    return true;
  };

  const matchesExec = (fup) => {
    if (execFilter === 'all') return true;
    const a = fup.assigned_to_id ?? fup.assignedTo ?? fup.assigned_to;
    if (a !== undefined && a !== null && String(a) === String(execFilter)) return true;
    if (fup.assigned_to) {
      const name = formatEmployeeName(fup.assigned_to).toString().toLowerCase();
      const emp = employees.find(e => String(e.id) === String(execFilter));
      if (emp) return name === formatEmployeeName(emp).toString().toLowerCase();
    }
    return false;
  };

  const matchesSearch = (fup) => {
    if (!search || !search.trim()) return true;
    const term = search.toLowerCase();
    const lead = getLead(fup.lead_id || fup.LeadID || fup.lead);
    const business = (lead.business || lead.company || lead.companyName || '').toString().toLowerCase();
    const contact = (lead.name || lead.contact || lead.contactPerson || '').toString().toLowerCase();
    const mobile = (lead.mobile || lead.phone || lead.contact_number || '').toString().toLowerCase();
    const email = (lead.email || lead.emailAddress || lead.contact_email || lead.email_id || '').toString().toLowerCase();
    const note = (fup.notes || fup.Notes || '').toString().toLowerCase();
    const title = (fup.title || fup.Title || '').toString().toLowerCase();
    const typeField = (fup.type || fup.Type || fup.followup_type || fup.FollowupType || '').toString().toLowerCase();
    return [business, contact, mobile, email, note, title, typeField].join(' ').includes(term);
  };

  const escapeRegExp = (s) => String(s).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

  const highlightMatch = (text, term) => {
    if (!term) return text;
    const t = String(text || '');
    const re = new RegExp(`(${escapeRegExp(term)})`, 'ig');
    const parts = t.split(re);
    return parts.map((part, idx) => {
      if (part && part.match(re)) return <mark key={idx} className="si-highlight">{part}</mark>;
      return <span key={idx}>{part}</span>;
    });
  };

  const visible = followups.filter(f => filterMatches(f) && matchesSearch(f) && matchesExec(f));

  // Pagination state
  const [pageSize, setPageSize] = useState(10);
  const [page, setPage] = useState(1);

  // Reset page when filters change
  useEffect(() => { setPage(1); }, [filter, execFilter, search, selectedOtherMonth, selectedOtherYear, followups]);

  const totalPages = Math.max(1, Math.ceil(visible.length / pageSize));
  // Ensure current page is within bounds
  useEffect(() => { if (page > totalPages) setPage(totalPages); }, [totalPages]);

  const paged = visible.slice((page - 1) * pageSize, page * pageSize);

  const markDone = async (fup) => {
    // Save an interaction for the associated lead, then delete the followup
    const leadObj = getLead(fup.lead_id || fup.LeadID || fup.lead || (fup.Lead && fup.Lead.id));
    const leadId = leadObj && (leadObj.id || leadObj.ID) ? (leadObj.id || leadObj.ID) : (fup.lead_id || fup.LeadID || (fup.lead && fup.lead.id) || (fup.Lead && fup.Lead.id));
    if (!leadId) {
      alert('Cannot find lead for this follow-up.');
      return;
    }

    // Set saving flag on this followup
    setFollowups(prev => prev.map(p => p.id === fup.id ? {...p, _saving: true} : p));

    try {
      const now = new Date();
      const fupType = fup.type || fup.Type || fup.followup_type || fup.FollowupType || fup.title || fup.Title || 'Other';
      const payload = {
        interaction: {
          date: now.toISOString().slice(0,10),
          time: now.toTimeString().slice(0,5),
          type: fupType,
          note: fup.notes || fup.Notes || '',
        }
      };

      const res = await fetch(`${BASE_URL}/api/leads/${leadId}/interactions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const err = await res.json().catch(()=>({ error: 'Failed to save interaction' }));
        console.error('Failed to save interaction', err);
        alert(`Failed to save interaction: ${err.error || 'Unknown error'}`);
        setFollowups(prev => prev.map(p => p.id === fup.id ? {...p, _saving: false} : p));
        return;
      }

      const result = await res.json().catch(()=>({}));

      // Update latestInteractions for this lead immediately
      const inter = result.interaction;
      const tsRaw = inter && (inter.timestamp || inter.Timestamp || inter.created_at || inter.createdAt) ? (inter.timestamp || inter.Timestamp || inter.created_at || inter.createdAt) : null;
      const ts = tsRaw ? new Date(tsRaw) : now;
      setLatestInteractions(prev => ({ ...prev, [String(leadId)]: { ts: ts.toISOString(), type: (inter && (inter.type || inter.Type || inter.interaction_type || inter.kind)) ? (inter.type || inter.Type || inter.interaction_type || inter.kind).toString().trim() : 'Other' } }));

      // Now delete the followup from the backend
      const delRes = await fetch(`${BASE_URL}/api/lead-followups/${fup.id}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
      });

      if (!delRes.ok) {
        const err = await delRes.json().catch(()=>({ error: 'Failed to delete followup' }));
        console.error('Failed to delete followup', err);
        alert(`Failed to delete followup: ${err.error || 'Unknown error'}`);
        setFollowups(prev => prev.map(p => p.id === fup.id ? {...p, _saving: false} : p));
        return;
      }

      // Remove followup from UI
      setFollowups(prev => prev.filter(p => p.id !== fup.id));

      // Notify other parts of the app
      try { window.dispatchEvent(new CustomEvent('lead:interaction.saved', { detail: { interaction: result.interaction || null, followup: result.followup || null, lead_id: leadId } })); } catch (e) {}

      console.log('mark done: saved interaction and deleted followup for lead', leadId);
    } catch (err) {
      console.error('Error in markDone', err);
      alert('Error processing followup. Please try again.');
      setFollowups(prev => prev.map(p => p.id === fup.id ? {...p, _saving: false} : p));
    }
  };

  const cancelFollowup = async (fup) => {
    // Set saving flag
    setFollowups(prev => prev.map(p => p.id === fup.id ? {...p, _saving: true} : p));

    try {
      // Delete the followup from the backend
      const delRes = await fetch(`${BASE_URL}/api/lead-followups/${fup.id}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
      });

      if (!delRes.ok) {
        const err = await delRes.json().catch(()=>({ error: 'Failed to delete followup' }));
        console.error('Failed to delete followup', err);
        alert(`Failed to cancel followup: ${err.error || 'Unknown error'}`);
        setFollowups(prev => prev.map(p => p.id === fup.id ? {...p, _saving: false} : p));
        return;
      }

      // Remove followup from UI
      setFollowups(prev => prev.filter(p => p.id !== fup.id));
      console.log('cancel followup: deleted followup', fup.id);
    } catch (err) {
      console.error('Error cancelling followup', err);
      alert('Error cancelling followup. Please try again.');
      setFollowups(prev => prev.map(p => p.id === fup.id ? {...p, _saving: false} : p));
    }
  };

  // Helper to render page numbers with ellipses
  const renderPages = () => {
    const pages = [];
    if (totalPages <= 9) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      const left = Math.max(3, page - 2);
      const right = Math.min(totalPages - 2, page + 2);
      pages.push(1, 2);
      if (left > 3) pages.push('...');
      for (let i = left; i <= right; i++) pages.push(i);
      if (right < totalPages - 2) pages.push('...');
      pages.push(totalPages - 1, totalPages);
    }
    return pages.map((p, idx) => {
      if (p === '...') return <span key={`e-${idx}`} className="pager-ellipsis">...</span>;
      return (
        <button key={p} className={`pager-page ${p === page ? 'active' : ''}`} onClick={() => setPage(p)}>{p}</button>
      );
    });
  };

  const handleExport = () => {
    try {
      setExporting(true);
      if (!visible || visible.length === 0) {
        alert('No follow-ups to export');
        return;
      }

      const exportData = visible.map(f => {
        const lead = getLead(f.lead_id || f.LeadID || f.lead || (f.Lead && f.Lead.id));
        const business = lead.business || lead.company || lead.companyName || '';
        const contact = lead.name || lead.contact || lead.contactPerson || '';
        const mobile = lead.mobile || lead.phone || lead.contact_number || '';
        const email = lead.email || lead.emailAddress || lead.contact_email || lead.email_id || '';
        const type = f.type || f.Type || f.followup_type || f.FollowupType || f.title || f.Title || '';
        const leadIdKey = String(lead.id || lead.ID || lead.lead_id || lead.leadId || '');
        const li = latestInteractions[leadIdKey];
        const lastTalk = li ? `${formatDateShort(li.ts)}${li.type ? ` — ${li.type}` : ''}` : '';
        const assigned = (f.assigned_to ? formatEmployeeName(f.assigned_to) : '') || (employees.find(e => String(e.id) === String(f.assigned_to_id || f.AssignedToID || f.assignedTo)) ? formatEmployeeName(employees.find(e => String(e.id) === String(f.assigned_to_id || f.AssignedToID || f.assignedTo))) : '') || '';

        return {
          'Date': formatDateShort(f.followup_on || f.FollowUpOn || f.followupOn) || '',
          'Time': formatTime12(f.followup_on || f.FollowUpOn || f.followupOn) || '',
          'Business': business,
          'Contact Person': contact,
          'Mobile': mobile,
          'Email': email,
          'Follow-up Note': f.notes || f.Notes || '',
          'Type': type,
          'Last Talk': lastTalk,
          'Executive': assigned,
        };
      });

      const headers = ['Date','Time','Business','Contact Person','Mobile','Email','Follow-up Note','Type','Last Talk','Executive'];
      const ws = XLSX.utils.json_to_sheet(exportData, { header: headers });
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Followups');
      const filename = `followups_${new Date().toISOString().slice(0,10)}.xlsx`;
      XLSX.writeFile(wb, filename);
    } catch (err) {
      console.error('Followups export failed', err);
      alert('Export failed');
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="sales-interactions-container">
        <h2 style={{textAlign: 'center'}}>Follow-ups</h2>
      <div className="si-header">
        <div className="left">
          <div className="filters">
            <div className="exec-block">
              <select className="exec-select" value={execFilter} onChange={(e) => setExecFilter(e.target.value)}>
                <option value="all">All Executives</option>
                {employees.map(emp => <option key={emp.id} value={emp.id}>{formatEmployeeName(emp)}</option>)}
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
            <button
              className="icon-btn square"
              title={exporting ? 'Exporting...' : 'Export'}
              onClick={handleExport}
              disabled={exporting || visible.length === 0}
              aria-label="Export follow-ups"
            ><FaFileExport/></button>
          </div>
        </div>
      </div>

      <div className="si-table-wrap">
        <table className="si-table">
          <thead>
            <tr>
              <th>Time</th>
              <th>Business</th>
              <th>Contact Person</th>
              <th>Mobile</th>
              <th>Email</th>
              <th>Follow-up Note</th>
              <th>Type</th>
              <th>Last Talk</th>
              <th>Executive</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={10} style={{textAlign:'center', padding:20}}>Loading...</td></tr>
            ) : visible.length === 0 ? (
              <tr><td colSpan={10} style={{textAlign:'center', padding:20}}>No follow-ups</td></tr>
            ) : paged.map((f, i) => {
              const lead = getLead(f.lead_id || f.LeadID || f.lead || (f.Lead && f.Lead.id));
              const business = lead.business || lead.company || lead.companyName || '-';
              const contact = lead.name || lead.contact || '-';
              const mobile = lead.mobile || lead.phone || '-';
              const email = lead.email || lead.emailAddress || lead.contact_email || lead.email_id || '-';
              const type = f.type || f.Type || f.followup_type || f.FollowupType || f.title || f.Title || '-';
              const leadIdKey = String(lead.id || lead.ID || lead.lead_id || lead.leadId || '');
              const li = latestInteractions[leadIdKey];
              const lastTalk = li ? `${formatDateShort(li.ts)}${li.type ? ` - ${li.type}` : ''}` : '-';
              const assigned = (f.assigned_to ? formatEmployeeName(f.assigned_to) : '') || (employees.find(e => String(e.id) === String(f.assigned_to_id || f.AssignedToID || f.assignedTo)) ? formatEmployeeName(employees.find(e => String(e.id) === String(f.assigned_to_id || f.AssignedToID || f.assignedTo))) : '') || '-';

              const term = search && search.trim() ? search.toLowerCase() : '';
              const hay = [String(business||''), String(contact||''), String(mobile||''), String(email||''), String(f.notes||''), String(type||''), String(lastTalk||''), String(assigned||'')].join(' ').toLowerCase();
              const isMatch = term ? hay.includes(term) : false;

              return (
                <tr key={f.id || i} className={`${f.status === 'done' ? 'done' : f.status === 'cancelled' ? 'cancelled' : ''} ${isMatch ? 'match-row' : ''}`}>
                  <td>{highlightMatch(formatTime12(f.followup_on || f.FollowUpOn || f.followupOn), search)}</td>
                  <td>{highlightMatch(business, search)}</td>
                  <td>{highlightMatch(contact, search)}</td>
                  <td>{highlightMatch(mobile, search)}</td>
                  <td>{highlightMatch(email, search)}</td>
                  <td>{highlightMatch(f.notes || f.Notes || '-', search)}</td>
                  <td>{highlightMatch(type, search)}</td>
                  <td>{highlightMatch(lastTalk, search)}</td>
                  <td>{highlightMatch(assigned, search)}</td>
                  <td className="actions-cell">
                    <button className="icon-btn success" title={f._saving ? 'Saving...' : 'Mark done'} onClick={() => markDone(f)} disabled={!!f._saving} aria-busy={!!f._saving}><FaCheck/></button>
                    <button className="icon-btn danger" title="Cancel" onClick={() => cancelFollowup(f)} disabled={!!f._saving}><FaTimes/></button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {visible.length > 0 && (
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
  );
};

export default Followup;
