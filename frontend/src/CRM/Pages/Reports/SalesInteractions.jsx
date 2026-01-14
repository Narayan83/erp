import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaArrowLeft, FaFileExport } from 'react-icons/fa';
import * as XLSX from 'xlsx';
import { BASE_URL } from '../../../config/Config';
import './_sales_interactions.scss';


const SalesInteractions = () => {
  const navigate = useNavigate();
  const [salesperson, setSalesperson] = useState('');
  const [period, setPeriod] = useState('This Month');
  const [selectedOtherMonth, setSelectedOtherMonth] = useState(''); // format YYYY-MM
  const [selectedOtherYear, setSelectedOtherYear] = useState(new Date().getFullYear());
  const [interactionDate, setInteractionDate] = useState(false);
  const [sinceDate, setSinceDate] = useState(false);
  const [transferDate, setTransferDate] = useState(false);
  const [interactionDateValue, setInteractionDateValue] = useState('');
  const [sinceDateValue, setSinceDateValue] = useState('');
  const [transferDateValue, setTransferDateValue] = useState('');
  const [rows, setRows] = useState([]);
  const [loadingInteractions, setLoadingInteractions] = useState(false);
  const [employees, setEmployees] = useState([]);
  const [loadingEmployees, setLoadingEmployees] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const handlePeriodChange = (v) => {
    setPeriod(v);
    if (v !== 'Custom') setSelectedOtherMonth('');
  };

  // Load executives and interactions from backend
  React.useEffect(() => {
    let mounted = true;

    // Fetch employees and normalize display name
    setLoadingEmployees(true);
    fetch(`${BASE_URL}/api/employees`)
      .then((res) => res.json())
      .then((data) => {
        if (!mounted) return;
        const list = Array.isArray(data) ? data : (data && data.data ? data.data : []);
        const normalized = list.map(emp => ({
          ...emp,
          id: emp.id || emp.ID || emp.userId || emp.user_id || emp.employee_id || emp.EmployeeID || emp.empid || emp.EmployeeId || emp.usercode || emp.code || emp.username || emp.email,
          displayName: emp.displayName || emp.name || emp.fullName || `${emp.firstname || emp.firstName || ''}${emp.firstname && emp.lastname ? ' ' : ''}${emp.lastname || emp.lastName || ''}`.trim() || emp.username || emp.email || `User ${emp.id}`
        }));
        setEmployees(normalized);
      })
      .catch(() => {
        if (!mounted) return;
        setEmployees([]);
      })
      .finally(() => { if (mounted) setLoadingEmployees(false); });

    // Fetch interactions and leads (handle paginated responses)
    setLoadingInteractions(true);
    Promise.all([
      fetch(`${BASE_URL}/api/lead-interactions`).then(res => res.json()),
      fetch(`${BASE_URL}/api/leads`).then(res => res.json())
    ])
      .then(([interResp, leadsResp]) => {
        if (!mounted) return;

        const interactions = Array.isArray(interResp) ? interResp : (interResp && interResp.data ? interResp.data : []);
        const leadsList = Array.isArray(leadsResp) ? leadsResp : (leadsResp && leadsResp.data ? leadsResp.data : []);

        // Build a map of leads for quick lookup (support multiple id keys)
        const leadsMap = {};
        leadsList.forEach(lead => {
          const id = lead.id || lead.ID || lead.lead_id || lead.leadId;
          if (id !== undefined && id !== null) leadsMap[id] = lead;
        });

        const tableRows = interactions.map(inter => {
          // Lead may be nested on interaction or referenced by id
          const leadRef = inter.lead || inter.Lead || {};
          const leadId = inter.lead_id || inter.leadId || leadRef.id || leadRef.ID;
          const lead = leadsMap[leadId] || leadRef || {};

          const tsRaw = inter.timestamp || inter.Timestamp || inter.created_at || inter.createdAt;
          const timestamp = tsRaw ? new Date(tsRaw) : new Date();
          const dateStr = isNaN(timestamp) ? '' : timestamp.toISOString().slice(0, 10);
          
          // Use separately stored time if available (to avoid timezone conversion)
          let timeStr = '';
          if (inter.time && typeof inter.time === 'string' && inter.time.includes(':')) {
            // If time is stored separately (e.g., "03:00" or "3:00 AM"), use it directly
            timeStr = inter.time;
          } else if (!isNaN(timestamp)) {
            // Fall back to formatting from timestamp
            timeStr = formatTime12(timestamp);
          }

          // Normalize lead fields
          const business = lead.business || lead.Business || lead.company || lead.companyName || lead.organisation || lead.organization || '';
          const contact = lead.name || lead.contact || lead.contactPerson || lead.contact_name || lead.Name || '';
          const sinceRaw = lead.since || lead.Since || lead.createdAt || lead.created_at || lead.since_date || '';
          const since = isValidDisplayDate(sinceRaw) ? new Date(sinceRaw).toISOString().slice(0, 10) : '';
          const transferredRaw = lead.transferredOn || lead.TransferredOn || lead.transferred_on || lead.transferredon || '';
          const transferred = isValidDisplayDate(transferredRaw) ? new Date(transferredRaw).toISOString().slice(0, 10) : '';

          const interactionText = inter.summary || inter.details || inter.type || inter.note || inter.notes || '';

          // Resolve executive id from multiple possible fields
          const execId = inter.assigned_to_id || inter.assignedToId || inter.assignedTo || inter.assignee || inter.assignee_id || inter.owner_id || inter.ownerId || lead.assigned_to_id || lead.assignedTo || lead.assignedToId || null;

          // Don't set a fallback executive name here. Resolve dynamically during render using employees list so names appear once employees load.
          const interactionType = (inter.type || inter.Type || inter.interaction_type || inter.kind || '').toString().trim();
          return {
            date: dateStr,
            time: timeStr,
            business,
            contact,
            since,
            transferred,
            type: interactionType,
            interaction: interactionText,
            executive_id: execId,
            executive: '',
            lead_id: leadId,
          };
        });

        setRows(tableRows);
      })
      .catch((err) => {
        console.error('Failed to fetch interactions/leads:', err);
        if (!mounted) return;
        setRows([]);
      })
      .finally(() => { if (mounted) setLoadingInteractions(false); });

    const handler = (e) => {
      try {
        const d = e.detail || {};
        if (d.interaction) {
          // reload interactions
          setLoadingInteractions(true);
          Promise.all([
            fetch(`${BASE_URL}/api/lead-interactions`).then(res => res.json()),
            fetch(`${BASE_URL}/api/leads`).then(res => res.json())
          ])
            .then(([interResp, leadsResp]) => {
              if (!mounted) return;

              const interactions = Array.isArray(interResp) ? interResp : (interResp && interResp.data ? interResp.data : []);
              const leadsList = Array.isArray(leadsResp) ? leadsResp : (leadsResp && leadsResp.data ? leadsResp.data : []);

              const leadsMap = {};
              leadsList.forEach(lead => {
                const id = lead.id || lead.ID || lead.lead_id || lead.leadId;
                if (id !== undefined && id !== null) leadsMap[id] = lead;
              });

              const tableRows = interactions.map(inter => {
                const leadRef = inter.lead || inter.Lead || {};
                const leadId = inter.lead_id || inter.leadId || leadRef.id || leadRef.ID;
                const lead = leadsMap[leadId] || leadRef || {};

                const tsRaw = inter.timestamp || inter.Timestamp || inter.created_at || inter.createdAt;
                const timestamp = tsRaw ? new Date(tsRaw) : new Date();
                const dateStr = isNaN(timestamp) ? '' : timestamp.toISOString().slice(0, 10);
                
                let timeStr = '';
                if (inter.time && typeof inter.time === 'string' && inter.time.includes(':')) {
                  timeStr = inter.time;
                } else if (!isNaN(timestamp)) {
                  timeStr = formatTime12(timestamp);
                }

                const business = lead.business || lead.Business || lead.company || lead.companyName || lead.organisation || lead.organization || '';
                const contact = lead.name || lead.contact || lead.contactPerson || lead.contact_name || lead.Name || '';
                const sinceRaw = lead.since || lead.Since || lead.createdAt || lead.created_at || lead.since_date || '';
                const since = isValidDisplayDate(sinceRaw) ? new Date(sinceRaw).toISOString().slice(0, 10) : '';
                const transferredRaw = lead.transferredOn || lead.TransferredOn || lead.transferred_on || lead.transferredon || '';
                const transferred = isValidDisplayDate(transferredRaw) ? new Date(transferredRaw).toISOString().slice(0, 10) : '';

                const interactionText = inter.summary || inter.details || inter.type || inter.note || inter.notes || '';

                const execId = inter.assigned_to_id || inter.assignedToId || inter.assignedTo || inter.assignee || inter.assignee_id || inter.owner_id || inter.ownerId || lead.assigned_to_id || lead.assignedTo || lead.assignedToId || null;
                const interactionType = (inter.type || inter.Type || inter.interaction_type || inter.kind || '').toString().trim();
                return {
                  date: dateStr,
                  time: timeStr,
                  business,
                  contact,
                  since,
                  transferred,
                  type: interactionType,
                  interaction: interactionText,
                  executive_id: execId,
                  executive: '',
                  lead_id: leadId,
                };
              });

              setRows(tableRows);
            })
            .catch(() => {})
            .finally(() => { if (mounted) setLoadingInteractions(false); });
        }
      } catch (err) {}
    };

    window.addEventListener('lead:interaction.saved', handler);

    return () => { window.removeEventListener('lead:interaction.saved', handler); mounted = false; };
  }, []);

  const handleDateTypeChange = (type) => {
    const todayIso = new Date().toISOString().slice(0, 10);
    // toggle semantics: clicking active checkbox turns it off; selection is exclusive otherwise
    if (type === 'interaction') {
      const willActivate = !interactionDate;
      setInteractionDate(willActivate);
      setSinceDate(false);
      setTransferDate(false);
      if (willActivate && !interactionDateValue) setInteractionDateValue(todayIso);
      return;
    }

    if (type === 'since') {
      const willActivate = !sinceDate;
      setSinceDate(willActivate);
      setInteractionDate(false);
      setTransferDate(false);
      if (willActivate && !sinceDateValue) setSinceDateValue(todayIso);
      return;
    }

    if (type === 'transfer') {
      const willActivate = !transferDate;
      setTransferDate(willActivate);
      setInteractionDate(false);
      setSinceDate(false);
      if (willActivate && !transferDateValue) setTransferDateValue(todayIso);
      return;
    }
  };

  const formatDateDisplay = (iso) => {
    // Keep for older compact format if needed, but prefer using formatISOtoDDMMYYYY for table
    if (!iso) return '';
    const d = new Date(iso);
    if (isNaN(d)) return '';
    const dd = String(d.getDate()).padStart(2, '0');
    const m = d.toLocaleString('en-IN', { month: 'short' });
    const yy = String(d.getFullYear()).slice(2);
    return `${dd}-${m}-${yy}`;
  };

  // New: format ISO (YYYY-MM-DD or full ISO) to dd-mm-yyyy numeric, but show 'Today'/'Yesterday' when applicable
  const formatISOtoDDMMYYYY = (iso) => {
    if (!iso) return '';
    const d = new Date(iso);
    if (isNaN(d)) return '';

    // Compare dates as local date-only values
    const toDateOnly = (dateObj) => new Date(dateObj.getFullYear(), dateObj.getMonth(), dateObj.getDate());
    const today = toDateOnly(new Date());
    const dateOnly = toDateOnly(d);
    const msPerDay = 24 * 60 * 60 * 1000;
    const diffDays = Math.round((dateOnly - today) / msPerDay);

    if (diffDays === 0) return 'Today';
    if (diffDays === -1) return 'Yesterday';

    const dd = String(d.getDate()).padStart(2, '0');
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const yyyy = d.getFullYear();
    return `${dd}-${mm}-${yyyy}`;
  };

  // Format time to 12-hour clock with AM/PM
  const formatTime12 = (dateInput) => {
    if (!dateInput) return '';
    const d = dateInput instanceof Date ? dateInput : new Date(dateInput);
    if (isNaN(d)) return '';
    let hours = d.getHours();
    const minutes = String(d.getMinutes()).padStart(2, '0');
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12;
    if (hours === 0) hours = 12;
    return `${hours}:${minutes} ${ampm}`;
  };

  // Validate that a date is plausible for display (filters out placeholder years like 0001-01-01)
  const isValidDisplayDate = (input) => {
    if (!input) return false;
    const d = input instanceof Date ? input : new Date(input);
    if (!d || isNaN(d)) return false;
    const year = d.getFullYear();
    const currentYear = new Date().getFullYear();
    return year >= 1900 && year <= (currentYear + 5);
  };


  const parseRowDate = (dateStr) => {
    if (!dateStr) return null;
    // try formats like '13-Dec-25' and expand 2-digit years
    const parts = dateStr.split('-');
    if (parts.length === 3) {
      let [d, m, y] = parts;
      if (y && y.length === 2) y = '20' + y;
      const norm = `${d}-${m}-${y}`;
      const dt = new Date(norm);
      if (!isNaN(dt)) return dt;
    }
    const dt = new Date(dateStr);
    if (!isNaN(dt)) return dt;
    return null;
  };

  // Format an employee object into a readable name
  const formatEmployeeDisplay = (emp) => {
    if (!emp) return '';
    const name = `${emp.salutation ? emp.salutation + ' ' : ''}${emp.firstname || emp.firstName || ''}${(emp.firstname || emp.firstName) && (emp.lastname || emp.lastName) ? ' ' : ''}${emp.lastname || emp.lastName || ''}`.trim();
    return name || emp.displayName || emp.username || emp.usercode || emp.email || (`User ${emp.id}`);
  };

  // Resolve executive for a given row using common field names or employee id
  const getExecutiveForRow = (r) => {
    if (!r) return '';
    // If executive is a non-numeric label, show it
    if (r.executive && typeof r.executive === 'string' && !/^\d+$/.test(r.executive.trim())) return r.executive;
    // If salesperson/executive string present and non-numeric, show it
    if (r.salesperson && typeof r.salesperson === 'string' && !/^\d+$/.test(r.salesperson.trim())) return r.salesperson;

    // Otherwise resolve by id fields (supports numeric-string too)
    const id = r.executive_id ?? r.executiveId ?? r.executive ?? r.salesperson_id ?? r.salespersonId ?? r.owner_id ?? r.ownerId;
    if (id !== undefined && id !== null && id !== '') {
      const emp = employees.find(e => String(e.id) === String(id));
      if (emp) return formatEmployeeDisplay(emp);
      return String(id);
    }
    return '';
  };

  // Utility: escape regex safely
  const escapeRegExp = (s) => String(s).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

  // Highlight matching parts of text with <mark>
  const highlightMatch = (text, term) => {
    if (!term) return text;
    const t = String(text || '');
    const re = new RegExp(`(${escapeRegExp(term)})`, 'ig');
    const parts = t.split(re);
    return parts.map((part, idx) => {
      if (part.match(re)) return <mark key={idx} className="si-highlight">{part}</mark>;
      return part;
    });
  };

  const filteredRows = rows.filter(r => {
    const dateStr = interactionDate ? r.date : sinceDate ? r.since : transferDate ? r.transferred : r.date;
    const d = parseRowDate(dateStr);
    if (!d) return false;
    const now = new Date();

    // If a specific date filter (interaction / since / transferred) is active, compare dates exactly
    const compareDatesEqual = (a, b) => {
      if (!a || !b) return false;
      const da = parseRowDate(a);
      const db = parseRowDate(b);
      if (!da || !db) return false;
      return da.getFullYear() === db.getFullYear() && da.getMonth() === db.getMonth() && da.getDate() === db.getDate();
    };

    if (interactionDate) {
      if (!interactionDateValue) return false;
      if (!compareDatesEqual(r.date, interactionDateValue)) return false;
    } else if (sinceDate) {
      if (!sinceDateValue) return false;
      if (!compareDatesEqual(r.since, sinceDateValue)) return false;
    } else if (transferDate) {
      if (!transferDateValue) return false;
      if (!compareDatesEqual(r.transferred, transferDateValue)) return false;
    } else {
      // default period filtering
      let passesPeriod = true;
      if (period === 'This Month') {
        passesPeriod = d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
      } else if (period === 'Last Month') {
        const last = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        passesPeriod = d.getMonth() === last.getMonth() && d.getFullYear() === last.getFullYear();
      } else if (period === 'This Year') {
        passesPeriod = d.getFullYear() === now.getFullYear();
      } else if (period === 'Custom') {
        if (!selectedOtherMonth) passesPeriod = false;
        else {
          const [y, m] = selectedOtherMonth.split('-').map(Number);
          passesPeriod = d.getFullYear() === y && (d.getMonth() + 1) === m;
        }
      }

      if (!passesPeriod) return false;
    }

    // Filter by selected executive if chosen
    if (salesperson && salesperson !== 'all') {
      const sel = String(salesperson);
      const execId = r.executive_id ?? r.executive ?? r.salesperson_id ?? r.salesperson;
      // direct id match
      if (execId !== undefined && execId !== null && String(execId) === sel) {
        // row matches selected executive
      } else {
        // try to match by employee display name
        const selEmp = employees.find(e => String(e.id) === sel);
        if (selEmp) {
          const execName = getExecutiveForRow(r);
          if (execName !== formatEmployeeDisplay(selEmp) && String(execId) !== sel) return false;
        } else {
          return false;
        }
      }
    }

    if (!searchTerm || !searchTerm.trim()) return true;
    const term = searchTerm.toLowerCase();
    const executive = getExecutiveForRow(r) || '';
    const formattedDate = formatDateDisplay(dateStr);
    const humanDateLabel = formatISOtoDDMMYYYY(dateStr);
    const hay = [String(r.date||''), String(humanDateLabel||''), String(r.time||''), String(r.type||''), String(r.business||''), String(r.contact||''), String(r.since||''), String(r.transferred||''), String(r.interaction||''), executive, formattedDate].join(' ').toLowerCase();
    return hay.includes(term);
  });

  // Pagination state
  const [pageSize, setPageSize] = useState(10);
  const [page, setPage] = useState(1);

  // Reset page when filters change
  useEffect(() => { setPage(1); }, [period, selectedOtherMonth, selectedOtherYear, salesperson, searchTerm, rows, interactionDate, sinceDate, transferDate, interactionDateValue, sinceDateValue, transferDateValue]);

  const totalPages = Math.max(1, Math.ceil(filteredRows.length / pageSize));
  // Ensure current page is within bounds
  useEffect(() => { if (page > totalPages) setPage(totalPages); }, [totalPages]);

  const pagedRows = filteredRows.slice((page - 1) * pageSize, page * pageSize);

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

  const handleExport = () => {
    try {
      setExporting(true);
      const exportData = filteredRows.map(r => ({
        Date: formatISOtoDDMMYYYY(r.date) || '',
        Time: r.time || '',
        Type: r.type || '',
        Business: r.business || '',
        Contact: r.contact || '',
        Since: formatISOtoDDMMYYYY(r.since) || '',
        'Transferred on': formatISOtoDDMMYYYY(r.transferred) || '',
        Interaction: r.interaction || '',
        Executive: getExecutiveForRow(r) || '',
      }));
      const headers = ["Date","Time","Business","Contact","Since","Transferred on","Type","Interaction","Executive"];
      const ws = XLSX.utils.json_to_sheet(exportData, { header: headers });
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'SalesInteractions');
      const filename = `sales_interactions_${new Date().toISOString().slice(0,10)}.xlsx`;
      XLSX.writeFile(wb, filename);
    } catch (err) {
      console.error('Export failed', err);
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="sales-interactions-container">
      <h2 style={{textAlign: 'center'}}>Sales Interactions</h2>
      <div className="si-header">
        <div className="left">
          <div className="filters">
            <label className="filter-item">
              <select value={salesperson} onChange={(e) => setSalesperson(e.target.value)}>
                <option value="all">All</option>
                {loadingEmployees ? (
                  <option>Loading...</option>
                ) : (
                  employees.map((emp) => {
                    const display = `${emp.salutation ? emp.salutation + ' ' : ''}${emp.firstname || ''}${emp.firstname && emp.lastname ? ' ' : ''}${emp.lastname || ''}`.trim() || emp.username || emp.usercode || (`User ${emp.id}`);
                    return <option key={emp.id} value={emp.id}>{display}</option>;
                  })
                )}
              </select>
            </label>

            <label className="filter-item">
              <select value={period} onChange={(e) => handlePeriodChange(e.target.value)}>
                <option>This Month</option>
                <option>Last Month</option>
                <option>This Year</option>
                <option>Custom</option>
              </select>
            </label>

            {period === 'Custom' && (
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
          </div>
        </div>

        <div className="right">
          <input placeholder="Search" className="search" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
          <button className="icon-btn square" title={exporting ? 'Exporting...' : 'Export to Excel'} onClick={handleExport} disabled={exporting}>
            <FaFileExport />
          </button>
        </div>
      </div>

      <div className="si-date-filters">
        <label className={`dt-item ${interactionDate ? 'active' : ''}`}>
          <input type="checkbox" checked={interactionDate} onChange={() => handleDateTypeChange('interaction')} />
          Interaction Date
          {interactionDate && (
            <>
              <input
                type="date"
                className="date-picker"
                value={interactionDateValue}
                onChange={(e) => setInteractionDateValue(e.target.value)}
              />
            </>
          )}
        </label>

        <label className={`dt-item ${sinceDate ? 'active' : ''}`}>
          <input type="checkbox" checked={sinceDate} onChange={() => handleDateTypeChange('since')} />
          Since Date
          {sinceDate && (
            <>
              <input
                type="date"
                className="date-picker"
                value={sinceDateValue}
                onChange={(e) => setSinceDateValue(e.target.value)}
              />
            </>
          )}
        </label>

       <label className={`dt-item ${transferDate ? 'active' : ''}`}>
          <input type="checkbox" checked={transferDate} onChange={() => handleDateTypeChange('transfer')} />
          Transferred Date
          {transferDate && (
            <>
              <input
                type="date"
                className="date-picker"
                value={transferDateValue}
                onChange={(e) => setTransferDateValue(e.target.value)}
              />
            </>
          )}
        </label>
      </div>

      <div className="si-table-wrap">
        <table className="si-table">
          <thead>
            <tr>
              <th>Date</th>
              <th>Time</th>
              <th>Business</th>
              <th>Contact Person</th>
              <th>Since</th>
              <th>Transferred on</th>
              <th>Type</th>
              <th>Interaction</th>
              <th>Executive</th>
            </tr>
          </thead>
          <tbody>
            {loadingInteractions ? (
              <tr>
                <td colSpan={9} style={{ textAlign: 'center', padding: 20 }}>Loading interactions...</td>
              </tr>
            ) : filteredRows.length === 0 ? (
              <tr>
                <td colSpan={9} style={{ textAlign: 'center', padding: 20 }}>No records found for selected period</td>
              </tr>
            ) : (
              pagedRows.map((r, i) => {
                const term = searchTerm && searchTerm.trim() ? searchTerm.toLowerCase() : '';
                const executive = getExecutiveForRow(r) || '';
                const humanDateLabel = formatISOtoDDMMYYYY(r.date);
                const hay = [String(r.date||''), String(humanDateLabel||''), String(r.time||''), String(r.type||''), String(r.business||''), String(r.contact||''), String(r.since||''), String(r.transferred||''), String(r.interaction||''), executive, formatDateDisplay(r.date)].join(' ').toLowerCase();
                const isMatch = term ? hay.includes(term) : false;
                return (
                  <tr key={i} className={isMatch ? 'match-row' : ''}>
                    <td>{highlightMatch(formatISOtoDDMMYYYY(r.date), searchTerm)}</td>
                    <td>{highlightMatch(r.time, searchTerm)}</td>
                    <td>{highlightMatch(r.business, searchTerm)}</td>
                    <td>{highlightMatch(r.contact, searchTerm)}</td>
                    <td>{highlightMatch(formatISOtoDDMMYYYY(r.since) || '-', searchTerm)}</td>
                    <td>{highlightMatch(formatISOtoDDMMYYYY(r.transferred) || '-', searchTerm)}</td>
                    <td>{highlightMatch(r.type || '-', searchTerm)}</td>
                    <td>{highlightMatch(r.interaction, searchTerm)}</td>
                    <td title={executive}>{highlightMatch(executive, searchTerm)}</td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {filteredRows.length > 0 && (
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

export default SalesInteractions;
