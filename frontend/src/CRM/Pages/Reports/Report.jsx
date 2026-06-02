import React from 'react';
import { useNavigate } from 'react-router-dom';
import { FaChartLine, FaUsersCog } from 'react-icons/fa';
import './_report.scss';

const ReportCard = ({ title, description, icon, onClick }) => (
  <div
    className="report-card"
    role="button"
    tabIndex={0}
    onClick={onClick}
    onKeyPress={(e) => { if (e.key === 'Enter') onClick?.(); }}
  >
    <div className="card-header">
      <div className="icon">{icon}</div>
      <h3>{title}</h3>
    </div>
    <p>{description}</p>
  </div>
);

const Report = () => {
  const navigate = useNavigate();

  const handleBack = () => {
    navigate(-1);
  };

  const reports = [
    {
      title: "All Reports",
      description: "View Sales Interactions, Follow-ups, Travel History, Rejected Leads, and Inactive Leads with report type filtering.",
      icon: <FaChartLine />,
      path: '/reports/all-reports?reportType=sales-interactions'
    },
    {
      title: "Performance Report",
      description: "Identify team members who have no interactions , no appointments , or missed appointments.",
      icon: <FaUsersCog />,
      path: '/reports/no-reports'
    }
  ];

  return (
    <div className="reports-container">
      <div className="reports-header">
        <h2>Lead Reports</h2>
        {/* <button className="back-btn" onClick={handleBack}>
          <FaArrowLeft style={{ marginRight: '5px' }} />
          Back
        </button> */}
      </div>
      <div className="reports-grid">
        {reports.map((report, index) => (
          <ReportCard
            key={index}
            {...report}
            onClick={() => report.path ? navigate(report.path) : null}
          />
        ))}
      </div>
    </div>
  );
};

export default Report;
