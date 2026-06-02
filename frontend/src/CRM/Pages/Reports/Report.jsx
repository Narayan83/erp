import React from 'react';
import { useNavigate } from 'react-router-dom';
import { FaChartLine, FaUsersCog, FaCalendarCheck, FaUserClock, FaRoute, FaArrowLeft, FaBan, FaUserSlash } from 'react-icons/fa';
import { MdMissedVideoCall } from 'react-icons/md';
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
      title: "Sales Interactions",
      description: "Monitor interaction efforts by your team with your leads.",
      icon: <FaChartLine />,
      path: '/reports/sales-interactions'
    },
    {
      title: "No Interactions",
      description: "Identify team members who have no interactions , no appointments , or missed appointments.",
      icon: <FaUsersCog />,
      path: '/reports/no-reports'
    },
    {
      title: "Follow-ups",
      description: "Track scheduled follow-ups to ensure timely engagement.",
      icon: <FaCalendarCheck />,
      path: '/reports/followups'
    },
    {
      title: "Travel History",
      description: "Track travel record of sales team.",
      icon: <FaRoute />,
      path: '/reports/travel-report'
    },
    {
      title: "Rejected Leads",
      description: "View all leads that have been rejected with their rejection reasons.",
      icon: <FaBan />,
      path: '/reports/rejected-leads'
    },
    {
      title: "Inactive Leads",
      description: "Track leads that have become inactive and need re-engagement.",
      icon: <FaUserSlash />,
      path: '/reports/inactive-leads'
    }
  ];

  return (
    <div className="reports-container">
      <div className="header">
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
