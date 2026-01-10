import React, { useState } from 'react';
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
  const [interactionDate, setInteractionDate] = useState(true);
  const [sinceDate, setSinceDate] = useState(false);
  const [transferDate, setTransferDate] = useState(false);
  const [interactionDateValue, setInteractionDateValue] = useState('');
  const [sinceDateValue, setSinceDateValue] = useState('');
  const [transferDateValue, setTransferDateValue] = useState('');
  const [rows, setRows] = useState([]); // replace with API data or props when available
  const [employees, setEmployees] = useState([]);
  const [loadingEmployees, setLoadingEmployees] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const handlePeriodChange = (v) => {
    setPeriod(v);
    if (v !== 'Custom') setSelectedOtherMonth('');
  };

  // Load executives from backend
  React.useEffect(() => {
    let mounted = true;
    setLoadingEmployees(true);
    fetch(`${BASE_URL}/api/employees`) 
      .then((res) => res.json())
      .then((data) => {
        if (!mounted) return;
        setEmployees(Array.isArray(data) ? data : []);
      })
      .catch(() => {
        if (!mounted) return;
        setEmployees([]);
      })
      .finally(() => { if (mounted) setLoadingEmployees(false); });

    return () => { mounted = false; };
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
    if (!iso) return '';
    const d = new Date(iso);
    if (isNaN(d)) return '';
    const dd = String(d.getDate()).padStart(2, '0');
    const m = d.toLocaleString('en-IN', { month: 'short' });
    const yy = String(d.getFullYear()).slice(2);
    return `${dd}-${m}-${yy}`;
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
    const name = `${emp.salutation ? emp.salutation + ' ' : ''}${emp.firstname || ''}${emp.firstname && emp.lastname ? ' ' : ''}${emp.lastname || ''}`.trim();
    return name || emp.username || emp.usercode || (`User ${emp.id}`);
  };

  // Resolve executive for a given row using common field names or employee id
  const getExecutiveForRow = (r) => {
    if (!r) return '';
    if (r.executive) return r.executive;
    if (r.salesperson) return r.salesperson;
    const id = r.executive_id ?? r.executiveId ?? r.salesperson_id ?? r.salespersonId ?? r.owner_id ?? r.ownerId;
    if (id) {
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

    if (!searchTerm || !searchTerm.trim()) return true;
    const term = searchTerm.toLowerCase();
    const executive = getExecutiveForRow(r) || '';
    const formattedDate = formatDateDisplay(dateStr);
    const hay = [String(r.date||''), String(r.time||''), String(r.business||''), String(r.contact||''), String(r.since||''), String(r.transferred||''), String(r.interaction||''), executive, formattedDate].join(' ').toLowerCase();
    return hay.includes(term);
  });

  const handleExport = () => {
    try {
      setExporting(true);
      const exportData = filteredRows.map(r => ({
        Date: r.date || '',
        Time: r.time || '',
        Business: r.business || '',
        Contact: r.contact || '',
        Since: r.since || '',
        'Transferred on': r.transferred || '',
        Interaction: r.interaction || '',
      }));
      const ws = XLSX.utils.json_to_sheet(exportData);
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
      <div className="si-header">
        <div className="left">
          <div className="filters">
            <label className="filter-item">
              <select value={salesperson} onChange={(e) => setSalesperson(e.target.value)}>
                <option value="" disabled>Select Executive</option>
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
              <th>Interaction</th>
              <th>Executive</th>
            </tr>
          </thead>
          <tbody>
            {filteredRows.length === 0 ? (
              <tr>
                <td colSpan={8} style={{ textAlign: 'center', padding: 20 }}>No records found for selected period</td>
              </tr>
            ) : (
              filteredRows.map((r, i) => {
                const term = searchTerm && searchTerm.trim() ? searchTerm.toLowerCase() : '';
                const executive = getExecutiveForRow(r) || '';
                const hay = [String(r.date||''), String(r.time||''), String(r.business||''), String(r.contact||''), String(r.since||''), String(r.transferred||''), String(r.interaction||''), executive, formatDateDisplay(r.date)].join(' ').toLowerCase();
                const isMatch = term ? hay.includes(term) : false;
                return (
                  <tr key={i} className={isMatch ? 'match-row' : ''}>
                    <td>{highlightMatch(r.date, searchTerm)}</td>
                    <td>{highlightMatch(r.time, searchTerm)}</td>
                    <td>{highlightMatch(r.business, searchTerm)}</td>
                    <td>{highlightMatch(r.contact, searchTerm)}</td>
                    <td>{highlightMatch(r.since, searchTerm)}</td>
                    <td>{highlightMatch(r.transferred, searchTerm)}</td>
                    <td>{highlightMatch(r.interaction, searchTerm)}</td>
                    <td title={executive}>{highlightMatch(executive, searchTerm)}</td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default SalesInteractions;
