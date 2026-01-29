import React, { useEffect, useState } from 'react';
import { BASE_URL } from '../../../config/Config';
import './dashboard.scss';

const colors = [
  '#f68b1e', '#4caf50', '#3f51b5', '#ff9800', '#00bcd4', '#8bc34a', '#9c27b0', '#e91e63', '#607d8b', '#795548'
];

const SmallCard = ({ title, value, onClick }) => (
  <div
    className="small-card"
    role={onClick ? 'button' : undefined}
    tabIndex={onClick ? 0 : undefined}
    onClick={onClick}
    onKeyDown={(e) => { if (onClick && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); onClick(); } }}
    style={{ cursor: onClick ? 'pointer' : undefined }}
  >
    <div className="small-card-title">{title}</div>
    <div className="small-card-value">{value}</div>
  </div>
);

const PieChart = ({ data, size = 260, inner = 0 }) => {
  const total = data.reduce((s, d) => s + d.value, 0) || 1;
  const center = size / 2;
  const containerRef = React.useRef(null);
  const [hover, setHover] = React.useState(null); // { index, x, y, d, percent }

  let angle = -90; // start at top

  return (
    <div className="pie-chart-wrap" style={{ width: size, height: size, position: 'relative' }} ref={containerRef}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="pie-chart">
        {data.map((d, i) => {
          const percent = d.value / total;
          const sweep = percent * 360;
          const largeArc = sweep > 180 ? 1 : 0;
          const r = center;
          const startAngle = angle;
          const endAngle = angle + sweep;
          const startRad = (startAngle * Math.PI) / 180;
          const endRad = (endAngle * Math.PI) / 180;
          const x1 = center + r * Math.cos(startRad);
          const y1 = center + r * Math.sin(startRad);
          const x2 = center + r * Math.cos(endRad);
          const y2 = center + r * Math.sin(endRad);

          const midAngle = startAngle + sweep / 2;
          const midRad = (midAngle * Math.PI) / 180;
          const dx = Math.cos(midRad) * (hover && hover.index === i ? 8 : 0);
          const dy = Math.sin(midRad) * (hover && hover.index === i ? 8 : 0);

          angle += sweep;

          // If this slice is effectively the whole circle, render a full circle instead of an arc (SVG arc with identical start/end may not render as expected)
          if (percent >= 0.9999) {
            return (
              <circle
                key={i}
                cx={center}
                cy={center}
                r={r}
                fill={d.color || colors[i % colors.length]}
                stroke="#fff"
                strokeWidth={hover && hover.index === i ? 2 : 1}
                onMouseEnter={(e) => {
                  const rect = containerRef.current.getBoundingClientRect();
                  setHover({
                    index: i,
                    x: e.clientX - rect.left,
                    y: e.clientY - rect.top,
                    d: { label: String(d.label || 'Unknown'), value: Number(d.value) || 0, color: d.color },
                    percent: Math.round(percent * 1000) / 10
                  });
                }}
                onMouseMove={(e) => {
                  if (!containerRef.current) return;
                  const rect = containerRef.current.getBoundingClientRect();
                  setHover(h => h ? { ...h, x: e.clientX - rect.left, y: e.clientY - rect.top } : h);
                }}
                onMouseLeave={() => setHover(null)}
                cursor="pointer"
              />
            );
          }

          const dPath = `M ${center} ${center} L ${x1} ${y1} A ${r} ${r} 0 ${largeArc} 1 ${x2} ${y2} Z`;

          return (
            <path
              key={i}
              d={dPath}
              fill={d.color || colors[i % colors.length]}
              stroke="#fff"
              strokeWidth={hover && hover.index === i ?  2 : 1}
              onMouseEnter={(e) => {
                const rect = containerRef.current.getBoundingClientRect();
                setHover({
                  index: i,
                  x: e.clientX - rect.left,
                  y: e.clientY - rect.top,
                  d: { label: String(d.label || 'Unknown'), value: Number(d.value) || 0, color: d.color },
                  percent: Math.round(percent * 1000) / 10
                });
              }}
              onMouseMove={(e) => {
                if (!containerRef.current) return;
                const rect = containerRef.current.getBoundingClientRect();
                setHover(h => h ? { ...h, x: e.clientX - rect.left, y: e.clientY - rect.top } : h);
              }}
              onMouseLeave={() => setHover(null)}
              cursor="pointer"
            />
          );
        })}
        {inner > 0 && <circle cx={center} cy={center} r={inner} fill="#fff" />}
        <text x={center} y={center} textAnchor="middle" dominantBaseline="middle" className="pie-center-text">{total}</text>
      </svg>

      {hover && (
        <div
          className="pie-tooltip"
          style={{ left: Math.min(hover.x + 12, size - 120), top: Math.min(hover.y + 12, size - 60) }}
        >
          <div className="tooltip-title">{hover.d && (hover.d.label || 'Unknown')}</div>
          <div className="tooltip-count">Count: {hover.d && (hover.d.value || 0)} ({hover.percent !== undefined ? hover.percent : Math.round(((hover.d && hover.d.value) || 0) / total * 1000) / 10}%)</div>
        </div>
      )}
    </div>
  );
};

import { useNavigate } from 'react-router-dom';

const Dashboard = () => {
  const navigate = useNavigate();
  const [leads, setLeads] = useState([]);
  const [period, setPeriod] = useState('This Month');
  const [selectedOtherMonth, setSelectedOtherMonth] = useState(''); // format YYYY-MM
  const [selectedOtherYear, setSelectedOtherYear] = useState(new Date().getFullYear());

  // followups/interactions for appointments / travel history / no-interactions
  const [followups, setFollowups] = useState([]);
  const [interactions, setInteractions] = useState([]);

  const handleCardClick = (filter) => {
    navigate('/crm-master', { state: { statusFilter: filter } });
  };

  const handlePeriodChange = (v) => {
    setPeriod(v);
    // reset custom month when switching away
    if (v !== 'Custom') setSelectedOtherMonth('');
  };

  useEffect(() => {
    const fetchLeads = async () => {
      try {
        const res = await fetch(`${BASE_URL}/api/leads?page=1&limit=1000`);
        const data = await res.json();
        setLeads(Array.isArray(data) ? data : (data.data || []));
      } catch (e) {
        console.error('Failed to fetch leads', e);
      }
    };
    fetchLeads();
  }, []);

  // load followups and interactions used by appointments/no-interactions/travel history
  useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
        const [fResp, iResp] = await Promise.all([
          fetch(`${BASE_URL}/api/lead-followups`).then(r => r.json()),
          fetch(`${BASE_URL}/api/lead-interactions`).then(r => r.json())
        ]);
        const fArr = Array.isArray(fResp) ? fResp : (fResp && fResp.data ? fResp.data : []);
        const iArr = Array.isArray(iResp) ? iResp : (iResp && iResp.data ? iResp.data : []);
        if (!mounted) return;
        setFollowups(fArr);
        setInteractions(iArr);
      } catch (err) {
        console.error('Failed to load followups/interactions', err);
      }
    };
    load();
    return () => { mounted = false; };
  }, []);

  // Helper to build date range for current period selection (matches logic from other pages)
  const getDateRange = () => {
    const now = new Date();
    if (period === 'This Month') {
      const start = new Date(now.getFullYear(), now.getMonth(), 1);
      const end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
      return { start, end };
    }
    if (period === 'Last Month') {
      const start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const end = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);
      return { start, end };
    }
    if (period === 'This Year') {
      const start = new Date(now.getFullYear(), 0, 1);
      const end = new Date(now.getFullYear(), 11, 31, 23, 59, 59);
      return { start, end };
    }
    if (period === 'Custom') {
      if (!selectedOtherMonth) return null;
      const [y, m] = selectedOtherMonth.split('-').map(Number);
      const start = new Date(y, m - 1, 1);
      const end = new Date(y, m, 0, 23, 59, 59);
      return { start, end };
    }
    return null;
  };

  // Filter leads based on selected period / custom month
  const filteredLeads = leads.filter(l => {
    const dateStr = l.createdAt || l.created_at || l.since || l.Since || l.CreatedAt || l.createdAt;
    if (!dateStr) return false;
    const d = new Date(dateStr);
    if (isNaN(d)) return false;

    const now = new Date();
    if (period === 'This Month') {
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    }
    if (period === 'Last Month') {
      const last = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      return d.getMonth() === last.getMonth() && d.getFullYear() === last.getFullYear();
    }
    if (period === 'This Year') {
      return d.getFullYear() === now.getFullYear();
    }
    if (period === 'Custom') {
      if (!selectedOtherMonth) return false; // require selection
      const [y, m] = selectedOtherMonth.split('-').map(Number);
      return d.getFullYear() === y && (d.getMonth() + 1) === m;
    }
    return true;
  });

  const totalLeads = filteredLeads.length;
  const rejectedCount = filteredLeads.filter(l => ['rejected', 'inactive', 'lost', 'disqualified'].includes(((l.stage||l.Stage||'') + '').toLowerCase())).length;
  const convertedCount = filteredLeads.filter(l => ['decided', 'converted', 'won'].includes(((l.stage||l.Stage||'') + '').toLowerCase())).length;
  const activeLeads = totalLeads - rejectedCount;

  // Derived counts from followups/interactions (align with NoReports / TravelReport logic)
  const dateRange = getDateRange();
  const now = new Date();

  // build interaction set by lead id
  const interactionsSet = new Set();
  interactions.forEach(inter => {
    const lid = inter.lead_id ?? inter.LeadID ?? (inter.lead && (inter.lead.id || inter.lead.ID)) ?? inter.lead;
    if (lid !== undefined && lid !== null && String(lid) !== '') interactionsSet.add(String(lid));
  });

  const filteredLeadIds = new Set(filteredLeads.map(l => String(l.id ?? l.ID ?? l.lead_id ?? '')));

  // No-interactions: lead has no interactions and no scheduled followup (not cancelled/done)
  let noInteractionsCount = 0;
  filteredLeads.forEach(lead => {
    const leadId = lead.id ?? lead.ID ?? lead.lead_id ?? '';
    const lIdStr = String(leadId);
    const lFollowups = followups.filter(f => {
      const lid = f.lead_id ?? f.LeadID ?? (f.lead && (f.lead.id || f.lead.ID)) ?? f.lead;
      return String(lid) === lIdStr;
    });

    const hasFollowupScheduled = lFollowups.some(f => {
      const status = (f.status || f.Status || '')?.toString().toLowerCase();
      return (f.followup_on || f.FollowUpOn || f.followupOn) && status !== 'cancelled' && status !== 'done';
    });

    const hasInteraction = interactionsSet.has(lIdStr);
    if (!hasInteraction && !hasFollowupScheduled) noInteractionsCount += 1;
  });

  // Active appointments: followups (not done/cancelled) belonging to filtered leads and within date range (if any)
  const activeAppointmentsCount = followups.filter(f => {
    const lid = f.lead_id ?? f.LeadID ?? (f.lead && (f.lead.id || f.lead.ID)) ?? f.lead;
    if (!filteredLeadIds.has(String(lid))) return false;
    const status = (f.status || f.Status || '')?.toString().toLowerCase();
    if (status === 'done' || status === 'cancelled') return false;
    const dstr = f.followup_on || f.FollowUpOn || f.followupOn;
    const d = dstr ? new Date(dstr) : null;
    if (!d || isNaN(d)) return false;
    if (!dateRange) return true;
    return d >= dateRange.start && d <= dateRange.end;
  }).length;

  // Missed appointments: scheduled (not done/cancelled), scheduled date in range (if any) and < now
  const missedAppointmentsCount = followups.filter(f => {
    const lid = f.lead_id ?? f.LeadID ?? (f.lead && (f.lead.id || f.lead.ID)) ?? f.lead;
    if (!filteredLeadIds.has(String(lid))) return false;
    const status = (f.status || f.Status || '')?.toString().toLowerCase();
    if (status === 'done' || status === 'cancelled') return false;
    const dstr = f.followup_on || f.FollowUpOn || f.followupOn;
    const d = dstr ? new Date(dstr) : null;
    if (!d || isNaN(d)) return false;
    if (dateRange && !(d >= dateRange.start && d <= dateRange.end)) return false;
    return d < now;
  }).length;

  // Travel history: interactions for filtered leads, within date range (if any) and matching travel-like types/notes
  const travelRegex = /travel|visit|onsite|site|field/i;
  const travelCount = interactions.filter(inter => {
    const lid = inter.lead_id ?? inter.LeadID ?? (inter.lead && (inter.lead.id || inter.lead.ID)) ?? inter.lead;
    if (!filteredLeadIds.has(String(lid))) return false;
    const tsRaw = inter.timestamp || inter.Timestamp || inter.created_at || inter.createdAt || inter.date || '';
    const ts = tsRaw ? new Date(tsRaw) : null;
    if (!ts || isNaN(ts)) return false;
    if (dateRange && !(ts >= dateRange.start && ts <= dateRange.end)) return false;
    const t = (inter.type || inter.Type || inter.interaction_type || inter.kind || '') + '';
    const note = (inter.note || inter.Note || inter.notes || inter.remarks || '') + '';
    return travelRegex.test(t) || travelRegex.test(note);
  }).length;

  // source aggregation
  const sourceMap = {};
  filteredLeads.forEach(l => {
    const s = (l.source || l.Source || 'Unknown') + '';
    sourceMap[s] = (sourceMap[s] || 0) + 1;
  });
  const sourceData = Object.keys(sourceMap).map((k, i) => ({ label: k, value: sourceMap[k], color: colors[i % colors.length] }));
  const sourceTotal = sourceData.reduce((s, it) => s + it.value, 0) || 0;

  // product aggregation: count lead mentions per product
  const getProductLabel = (prod) => {
    if (prod === undefined || prod === null || prod === '') return 'Unknown';
    if (typeof prod === 'string') return prod.trim();
    if (typeof prod === 'number') return String(prod);
    if (typeof prod === 'object') {
      const keys = ['name','Name','title','Title','productName','product_name','ProductName','Code','code','label','Label','value','ID','id'];
      for (const k of keys) {
        const val = prod[k];
        if (val !== undefined && val !== null && val !== '') {
          if (typeof val === 'string' || typeof val === 'number') return String(val).trim();
        }
      }
      if (prod.product && typeof prod.product === 'string') return prod.product.trim();
      return 'Unknown';
    }
    return String(prod);
  };

  const extractProducts = (raw) => {
    const out = [];
    if (raw === undefined || raw === null || raw === '') return out;

    if (Array.isArray(raw)) {
      for (const item of raw) {
        const label = getProductLabel(item);
        out.push({ label });
      }
      return out;
    }

    if (typeof raw === 'object') {
      out.push({ label: getProductLabel(raw) });
      return out;
    }

    if (typeof raw === 'string') {
      const parts = raw.split(/[;,|\n]/).map(s => s.trim()).filter(Boolean);
      parts.forEach(p => {
        const m = p.match(/^(.*?)(?:\s*(?:x|×|:)?\s*(\d+))?\s*$/i);
        const label = m ? (m[1].trim() || 'Unknown') : p;
        out.push({ label });
      });
      return out;
    }

    out.push({ label: String(raw) });
    return out;
  };

      const findProductNameInObject = (obj) => {
        if (!obj || typeof obj !== 'object') return null;
        const keys = ['name','Name','productName','ProductName','title','Title','label','Label','value','Value','product','Product'];
        for (const key of keys) {
          const val = obj[key];
          if (typeof val === 'string' && val.trim()) return val.trim();
        }
        for (const key in obj) {
          if (!Object.prototype.hasOwnProperty.call(obj, key)) continue;
          const val = obj[key];
          if (typeof val === 'object') {
            const nested = findProductNameInObject(val);
            if (nested) return nested;
          }
        }
        return null;
      };

      const getProductRawValue = (lead) => {
        const stringCandidates = [];
        const addStringCandidate = (value) => {
          if (typeof value === 'string') {
            const trimmed = value.trim();
            if (trimmed) stringCandidates.push(trimmed);
          }
        };

        addStringCandidate(lead.productName);
        addStringCandidate(lead.ProductName);
        addStringCandidate(lead.product_name);
        addStringCandidate(lead.Product_name);
        addStringCandidate(lead.productTitle);
        addStringCandidate(lead.ProductTitle);
        addStringCandidate(lead.product_title);
        addStringCandidate(lead.Product_title);
        addStringCandidate(lead.product && lead.product.name);
        addStringCandidate(lead.product && lead.product.Name);
        addStringCandidate(lead.product && lead.product.productName);
        addStringCandidate(lead.product && lead.product.ProductName);
        addStringCandidate(lead.product && lead.product.label);
        addStringCandidate(lead.product && lead.product.Label);
        addStringCandidate(lead.Product && lead.Product.name);
        addStringCandidate(lead.Product && lead.Product.Name);
        addStringCandidate(lead.Product && lead.Product.productName);
        addStringCandidate(lead.Product && lead.Product.ProductName);
        addStringCandidate(lead.Product && lead.Product.label);
        addStringCandidate(lead.Product && lead.Product.Label);
        if (lead.product && typeof lead.product === 'object') {
          const nested = findProductNameInObject(lead.product);
          if (nested) stringCandidates.push(nested);
        }
        if (lead.Product && typeof lead.Product === 'object') {
          const nested = findProductNameInObject(lead.Product);
          if (nested) stringCandidates.push(nested);
        }

        if (stringCandidates.length > 0) {
          const nonZero = stringCandidates.find(s => s !== '0');
          return nonZero || stringCandidates[0];
        }

        const objectCandidates = [lead.product, lead.Product, lead.products, lead.Products, lead.productList, lead.productsList];
        for (const candidate of objectCandidates) {
          if (candidate && typeof candidate === 'object') return candidate;
        }

        return null;
      };

  const productMap = {};
  filteredLeads.forEach(l => {
        const raw = getProductRawValue(l);
    const items = extractProducts(raw);
    if (items.length === 0 && raw) {
      productMap['Unknown'] = (productMap['Unknown'] || 0) + 1;
    }
    for (const it of items) {
      const key = String(it.label || 'Unknown').trim().replace(/\s+/g, ' ');
      productMap[key] = (productMap[key] || 0) + 1; // count lead mentions per product
    }
  });
  const productData = Object.keys(productMap).map((k, i) => ({ label: k, value: productMap[k], color: colors[i % colors.length] })).sort((a,b)=>b.value-a.value);
  const productTotal = productData.reduce((s, it) => s + it.value, 0) || 0;

  // legend pagination
  const legendPerPage = 10;
  const [legendPage, setLegendPage] = useState(0);
  const legendTotalPages = Math.max(1, Math.ceil(productData.length / legendPerPage));
  const visibleLegend = productData.slice(legendPage * legendPerPage, (legendPage + 1) * legendPerPage);

  const [sourceLegendPage, setSourceLegendPage] = useState(0);
  const sourceLegendTotalPages = Math.max(1, Math.ceil(sourceData.length / legendPerPage));
  const visibleSourceLegend = sourceData.slice(sourceLegendPage * legendPerPage, (sourceLegendPage + 1) * legendPerPage);

  // reset page if data size shrinks
  useEffect(() => {
    if (legendPage >= legendTotalPages) setLegendPage(0);
  }, [legendTotalPages]);

  useEffect(() => {
    if (sourceLegendPage >= sourceLegendTotalPages) setSourceLegendPage(0);
  }, [sourceLegendTotalPages]);

  // key data placeholder
  const bestProductObj = productData.length > 0 ? productData[0] : null;
  const bestProduct = bestProductObj ? `${bestProductObj.label} (${bestProductObj.value})` : '-';
  const bestSource = sourceData.length > 0 ? sourceData.reduce((a,b)=> a.value >= b.value ? a : b).label : '-';

  const keyData = {
    maxConverted: '-',
    maxCount: '-',
    mostMissedAppointments: '-',
    mostUncontacted: leads.length > 0 ? (leads.find(l => !(l.lastTalk || l.last_talk || l.last_contacted))?.firstName || leads.find(l => !(l.lastTalk || l.last_talk || l.last_contacted))?.name || '-') : '-',
    bestProduct,
    bestSource
  };

  return (
    <div className="raw-dashboard">
      <div className="dashboard-header">
        <h2>Raw Leads Dashboard</h2>
        <div className="period-select">
          {period === 'Custom' && (
            <div className="selectors">
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

          <select value={period} onChange={e => handlePeriodChange(e.target.value)}>
            <option>This Month</option>
            <option>Last Month</option>
            <option>This Year</option>
            <option>Custom</option>
          </select>
        </div>
      </div>

      <div className="top-stats">
        <div
          className="stat-card orange"
          role="button"
          tabIndex={0}
          onClick={() => handleCardClick('All Active Leads')}
          onKeyDown={(e) => { if (e.key === 'Enter') handleCardClick('All Active Leads'); }}
        >
          <div className="stat-title">Leads Received</div>
          <div className="stat-value">{totalLeads}</div>
        </div>
        <div
          className="stat-card orange light"
          role="button"
          tabIndex={0}
          onClick={() => handleCardClick('Decided')}
          onKeyDown={(e) => { if (e.key === 'Enter') handleCardClick('Decided'); }}
        >
          <div className="stat-title">Qualified Leads</div>
          <div className="stat-value">{convertedCount}</div>
        </div>
        <div
          className="stat-card orange light"
          role="button"
          tabIndex={0}
          onClick={() => handleCardClick('Inactive')}
          onKeyDown={(e) => { if (e.key === 'Enter') handleCardClick('Inactive'); }}
        >
          <div className="stat-title">Rejected Leads</div>
          <div className="stat-value">{rejectedCount}</div>
        </div>
        <div
          className="stat-card orange"
          role="button"
          tabIndex={0}
          onClick={() => handleCardClick('All Active Leads')}
          onKeyDown={(e) => { if (e.key === 'Enter') handleCardClick('All Active Leads'); }}
        >
          <div className="stat-title">Active Leads</div>
          <div className="stat-value">{activeLeads}</div>
        </div>
      </div>

      <div className="mini-grid">
    <SmallCard title="Appointments" value={activeAppointmentsCount} onClick={() => window.open('/reports/followups', '_blank')} />
    <SmallCard title="Missed Appointments" value={missedAppointmentsCount} onClick={() => window.open('/reports/no-reports?initFilter=Missed%20Appointments', '_blank')} />
    <SmallCard title="No Interactions" value={noInteractionsCount} onClick={() => window.open('/reports/no-reports?initFilter=No%20Interactions', '_blank')} />
    <SmallCard title="Travel History" value={travelCount || '-'} onClick={() => window.open('/reports/travel-report', '_blank')} />
  </div>

      <div className="charts-row">
        <div className="charts-left">
          <div className="chart-card">
            <div className="chart-title">Product-wise Leads</div>
            <div className="chart-body product-pie">
              {productData.length === 0 ? (
                <div className="empty-pie">No data</div>
              ) : (
                <div className="product-pie-wrap">
                  <PieChart data={productData} size={300} inner={40} />
                  <div className="legend">
                    {visibleLegend.map((p, i) => {
                      const percent = productTotal ? Math.round((p.value / productTotal) * 1000) / 10 : 0;
                      const labelText = `${p.label} — ${p.value} (${percent}%)`;
                      return (
                        <div className="legend-item" key={`${p.label}-${i}`} title={labelText}>
                          <span className="legend-color" style={{ background: p.color }} />
                          <span className="legend-label-text">{labelText}</span>
                        </div>
                      );
                    })}

                    {productData.length > legendPerPage && (
                      <div className="legend-controls" role="navigation" aria-label="Legend pagination">
                        <button
                          type="button"
                          className="legend-btn"
                          onClick={() => setLegendPage(Math.max(0, legendPage - 1))}
                          disabled={legendPage === 0}
                          aria-label="Previous page"
                        >
                          ▲
                        </button>
                        <span className="legend-page">{legendPage + 1} / {legendTotalPages}</span>
                        <button
                          type="button"
                          className="legend-btn"
                          onClick={() => setLegendPage(Math.min(legendTotalPages - 1, legendPage + 1))}
                          disabled={legendPage === legendTotalPages - 1}
                          aria-label="Next page"
                        >
                          ▼
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="chart-card" style={{ marginTop: 14 }}>
            <div className="chart-title">Source-wise Leads</div>
            <div className="chart-body">
              {sourceData.length === 0 ? (
                <div className="empty-pie">No data</div>
              ) : (
                <div className="product-pie-wrap">
                  <PieChart data={sourceData} size={300} inner={40} />
                  <div className="legend">
                    {visibleSourceLegend.map((p, i) => {
                      const percent = sourceTotal ? Math.round((p.value / sourceTotal) * 1000) / 10 : 0;
                      const labelText = `${p.label} — ${p.value} (${percent}%)`;
                      return (
                        <div className="legend-item" key={`${p.label}-${i}`} title={labelText}>
                          <span className="legend-color" style={{ background: p.color }} />
                          <span className="legend-label-text">{labelText}</span>
                        </div>
                      );
                    })}

                    {sourceData.length > legendPerPage && (
                      <div className="legend-controls" role="navigation" aria-label="Legend pagination">
                        <button
                          type="button"
                          className="legend-btn"
                          onClick={() => setSourceLegendPage(Math.max(0, sourceLegendPage - 1))}
                          disabled={sourceLegendPage === 0}
                          aria-label="Previous page"
                        >
                          ▲
                        </button>
                        <span className="legend-page">{sourceLegendPage + 1} / {sourceLegendTotalPages}</span>
                        <button
                          type="button"
                          className="legend-btn"
                          onClick={() => setSourceLegendPage(Math.min(sourceLegendTotalPages - 1, sourceLegendPage + 1))}
                          disabled={sourceLegendPage === sourceLegendTotalPages - 1}
                          aria-label="Next page"
                        >
                          ▼
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="charts-right">
          <div className="key-data">
            <h3>Key Data</h3>
            <div className="key-row"><div className="key-label">Max Converted</div><div className="key-value">{keyData.maxConverted}</div></div>
            <div className="key-row"><div className="key-label">Max Count</div><div className="key-value">{keyData.maxCount}</div></div>
            <div className="key-row"><div className="key-label">Most Missed Appointments</div><div className="key-value">{keyData.mostMissedAppointments}</div></div>
            <div className="key-row"><div className="key-label">Most Uncontacted</div><div className="key-value">{keyData.mostUncontacted}</div></div>
            <div className="key-row"><div className="key-label">Most Rejected</div><div className="key-value">-</div></div>
            <div className="key-row"><div className="key-label">Best Product</div><div className="key-value">{keyData.bestProduct}</div></div>
            <div className="key-row"><div className="key-label">Best Source</div><div className="key-value">{keyData.bestSource}</div></div>
            <div className="key-row"><div className="key-label">Max Inquiries from</div><div className="key-value">-</div></div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;