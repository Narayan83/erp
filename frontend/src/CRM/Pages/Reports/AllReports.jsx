import React, { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import SalesInteractions from './SalesInteractions';
import Followup from './Followup';
import TravelReport from './TravelReport';
import RejectedLeads from './RejectedLeads';
import InactiveLeads from './InactiveLeads';
import './allreports.scss';

const REPORT_TYPES = [
  { key: 'sales-interactions', label: 'Sales Interactions', component: SalesInteractions },
  { key: 'followups', label: 'Follow-ups', component: Followup },
  { key: 'travel-history', label: 'Travel History', component: TravelReport },
  { key: 'rejected-leads', label: 'Rejected Leads', component: RejectedLeads },
  { key: 'inactive-leads', label: 'Inactive Leads', component: InactiveLeads },
];

const DEFAULT_TYPE = 'sales-interactions';

const AllReports = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const validTypes = useMemo(() => new Set(REPORT_TYPES.map((item) => item.key)), []);

  const getTypeFromSearch = () => {
    const params = new URLSearchParams(location.search || '');
    const value = params.get('reportType');
    if (value && validTypes.has(value)) return value;
    return DEFAULT_TYPE;
  };

  const [reportType, setReportType] = useState(getTypeFromSearch);

  useEffect(() => {
    const currentType = getTypeFromSearch();
    setReportType(currentType);

    const params = new URLSearchParams(location.search || '');
    if (!params.get('reportType') || !validTypes.has(params.get('reportType'))) {
      params.set('reportType', currentType);
      navigate({ pathname: location.pathname, search: params.toString() }, { replace: true });
    }
  }, [location.search, location.pathname, navigate, validTypes]);

  const handleTypeChange = (nextType) => {
    const selectedType = validTypes.has(nextType) ? nextType : DEFAULT_TYPE;
    setReportType(selectedType);
    const params = new URLSearchParams(location.search || '');
    params.set('reportType', selectedType);
    navigate({ pathname: location.pathname, search: params.toString() });
  };

  const ActiveReport = useMemo(() => {
    const found = REPORT_TYPES.find((item) => item.key === reportType);
    return (found || REPORT_TYPES[0]).component;
  }, [reportType]);

  return (
    <div className="all-reports-page">
      <div className="all-reports-header">
        <h2>All Reports</h2>
        <div className="report-type-filter">
          <label htmlFor="reportType">Report Type</label>
          <select
            id="reportType"
            value={reportType}
            onChange={(e) => handleTypeChange(e.target.value)}
          >
            {REPORT_TYPES.map((item) => (
              <option key={item.key} value={item.key}>
                {item.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="all-reports-content">
        <ActiveReport key={reportType} />
      </div>
    </div>
  );
};

export default AllReports;
