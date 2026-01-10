import React, { useEffect, useState } from 'react';
import { BASE_URL } from '../../../config/Config';
import './dashboard.scss';

const colors = [
  '#f68b1e', '#4caf50', '#3f51b5', '#ff9800', '#00bcd4', '#8bc34a', '#9c27b0', '#e91e63', '#607d8b', '#795548'
];

const SmallCard = ({ title, value }) => (
  <div className="small-card">
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
                  setHover({ index: i, x: e.clientX - rect.left, y: e.clientY - rect.top, d, percent: Math.round(percent * 1000) / 10 });
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
              strokeWidth={hover && hover.index === i ? 2 : 1}
              onMouseEnter={(e) => {
                const rect = containerRef.current.getBoundingClientRect();
                setHover({ index: i, x: e.clientX - rect.left, y: e.clientY - rect.top, d, percent: Math.round(percent * 1000) / 10 });
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
          <div className="tooltip-title">{hover.d.label}</div>
          <div className="tooltip-count">{hover.d.value} ({hover.percent}%)</div>
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
  const noInteractions = filteredLeads.filter(l => !(l.lastTalk || l.last_talk || l.last_contacted)).length;
  const activeLeads = totalLeads - rejectedCount;

  // source aggregation
  const sourceMap = {};
  filteredLeads.forEach(l => {
    const s = (l.source || l.Source || 'Unknown') + '';
    sourceMap[s] = (sourceMap[s] || 0) + 1;
  });
  const sourceData = Object.keys(sourceMap).map((k, i) => ({ label: k, value: sourceMap[k], color: colors[i % colors.length] }));

  // product aggregation (use a robust extractor to avoid [object Object])
  const getProductLabel = (prod) => {
    if (prod === undefined || prod === null || prod === '') return 'Unknown';
    if (typeof prod === 'string') return prod;
    if (typeof prod === 'number') return String(prod);
    if (typeof prod === 'object') {
      const keys = ['name','Name','title','Title','productName','product_name','ProductName','Code','code','label','Label','value','ID','id'];
      for (const k of keys) {
        const val = prod[k];
        if (val !== undefined && val !== null && val !== '') {
          if (typeof val === 'string' || typeof val === 'number') return String(val);
          // if nested object, try common nested fields
          if (typeof val === 'object') {
            const nestedKeys = ['value','name','Name','label','Label','title','Title','id','ID','code','Code'];
            for (const nk of nestedKeys) {
              if (val[nk] !== undefined && val[nk] !== null && val[nk] !== '') return String(val[nk]);
            }
            try {
              const s = JSON.stringify(val);
              if (s && s !== '{}' && s.length < 200) return s;
            } catch (e) {}
            // fallthrough to toString
            return String(val);
          }
        }
      }
      // try nested common spots
      if (prod.product && typeof prod.product === 'string') return prod.product;
      if (prod.Name && typeof prod.Name === 'object') {
        const inner = prod.Name.value || prod.Name.name || prod.Name.label;
        if (inner) return String(inner);
      }
      try {
        const s = JSON.stringify(prod);
        if (s && s !== '{}' && s.length < 300) return s;
      } catch (e) {}
      return 'Unknown';
    }
    return String(prod);
  };

  const productMap = {};
  filteredLeads.forEach(l => {
    const raw = l.product || l.Product || l.productName || l.ProductName;
    const p = getProductLabel(raw);
    productMap[p] = (productMap[p] || 0) + 1;
  });
  const productData = Object.keys(productMap).map((k, i) => ({ label: k, value: productMap[k], color: colors[i % colors.length] }));

  // key data placeholder
  const keyData = {
    maxConverted: '-',
    maxCount: '-',
    mostMissedAppointments: '-',
    mostUncontacted: leads.length > 0 ? (leads.find(l => !(l.lastTalk || l.last_talk || l.last_contacted))?.firstName || leads.find(l => !(l.lastTalk || l.last_talk || l.last_contacted))?.name || '-') : '-'
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
        <SmallCard title="Appointments" value={0} />
        <SmallCard title="Missed Appointments" value={0} />
        <SmallCard title="No Interactions" value={noInteractions} />
        <SmallCard title="Unassigned Leads" value={leads.filter(l => !l.assignedTo).length} />
        <SmallCard title="Travel History" value="-" />
        <SmallCard title="Sales Credit Report" value="-" />
        <SmallCard title="Source Analysis" value="-" />
        <SmallCard title="Product Analysis" value="-" />
      </div>

      <div className="charts-row">
        <div className="charts-left">
          <div className="chart-card">
            <div className="chart-title">Source-wise Leads</div>
            <div className="chart-body">
              {sourceData.length === 0 ? (
                <div className="empty-pie">No data</div>
              ) : (
                <PieChart data={sourceData} size={300} inner={70} />
              )}
            </div>
          </div>
        </div>

        <div className="charts-center">
          <div className="chart-card">
            <div className="chart-title">Product-wise Leads</div>
            <div className="chart-body product-pie">
              {productData.length === 0 ? (
                <div className="empty-pie">No data</div>
              ) : (
                <div className="product-pie-wrap">
                  <PieChart data={productData} size={320} inner={40} />
                  <div className="legend">
                    {productData.slice(0, 20).map((p, i) => (
                      <div className="legend-item" key={p.label}>
                        <span className="legend-color" style={{ background: p.color }} />
                        <span className="legend-label">{p.label}</span>
                        <span className="legend-value">{Math.round((p.value / (productData.reduce((s, it) => s + it.value, 0) || 1)) * 100)}%</span>
                      </div>
                    ))}
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
            <div className="key-row"><div className="key-label">Best Source</div><div className="key-value">{sourceData.length > 0 ? sourceData.sort((a,b)=>b.value-a.value)[0].label : '-'}</div></div>
            <div className="key-row"><div className="key-label">Best Product</div><div className="key-value">{productData.length > 0 ? productData.sort((a,b)=>b.value-a.value)[0].label : '-'}</div></div>
            <div className="key-row"><div className="key-label">Max Inquiries from</div><div className="key-value">-</div></div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
