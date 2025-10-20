import React, { useState } from "react";
import "../../styles/auditlogs.scss";

const logs = [
  {
    title: "final IR Signal.docx",
    changes: 1,
    user: "validator1 assignee",
    ip: "192.168.102.2",
    action: "data validation update",
    datetime: "27/08/2025 16:52",
    details: "View",
  },
  // ...add more logs as needed...
];

const columns = [
  { key: "title", label: "Title" },
  { key: "changes", label: "Changes" },
  { key: "user", label: "User" },
  { key: "ip", label: "IP" },
  { key: "action", label: "Action" },
  { key: "datetime", label: "Date/Time" },
  { key: "details", label: "Details" },
];

export default function AuditLogs() {
  const [sortBy, setSortBy] = useState("");
  const [sortDir, setSortDir] = useState("asc");
  const [filters, setFilters] = useState({});

  // Unique values for filters
  const getUnique = key =>
    [...new Set(logs.map(l => l[key]))].filter(v => v !== undefined);

  // Sorting
  const sortedLogs = [...logs].sort((a, b) => {
    if (!sortBy) return 0;
    if (a[sortBy] < b[sortBy]) return sortDir === "asc" ? -1 : 1;
    if (a[sortBy] > b[sortBy]) return sortDir === "asc" ? 1 : -1;
    return 0;
  });

  // Filtering
  const filteredLogs = sortedLogs.filter(log =>
    Object.entries(filters).every(
      ([key, value]) => !value || log[key] === value
    )
  );

  const handleSort = key => {
    if (sortBy === key) {
      setSortDir(sortDir === "asc" ? "desc" : "asc");
    } else {
      setSortBy(key);
      setSortDir("asc");
    }
  };

  const handleFilter = (key, value) => {
    setFilters({ ...filters, [key]: value });
  };

  return (
    <div className="auditlogs-container">
      <div className="auditlogs-header">
        <h2>Audit Logs</h2>
      </div>
      <div className="auditlogs-controls">
        <input
          type="text"
          className="auditlogs-search"
          placeholder="Search (title/user/action)"
        />
        <div className="auditlogs-total">
        <span className="auditlogs-total-badge">
          Total: {filteredLogs.length} log{filteredLogs.length !== 1 ? "s" : ""}
        </span>
        <button className="auditlogs-refresh">Refresh</button>
      </div>
      </div>
      <div className="auditlogs-table-wrapper">
        <table className="auditlogs-table">
          <thead>
            <tr>
              {columns.map(col => (
                <th key={col.key}>
                  <span
                    className={
                      col.key !== "details" ? "auditlogs-sortable" : ""
                    }
                    onClick={
                      col.key !== "details"
                        ? () => handleSort(col.key)
                        : undefined
                    }
                    style={{
                      cursor: col.key !== "details" ? "pointer" : "default",
                      userSelect: "none",
                    }}
                  >
                    {col.label}
                    {col.key !== "details" && (
                      <span className="auditlogs-sort-icon">
                        {sortBy === col.key
                          ? sortDir === "asc"
                            ? " ▲"
                            : " ▼"
                          : " ⇅"}
                      </span>
                    )}
                  </span>
                  {col.key !== "details" && (
                    <select
                      className="auditlogs-filter"
                      value={filters[col.key] || ""}
                      onChange={e => handleFilter(col.key, e.target.value)}
                    >
                      <option value="">All</option>
                      {getUnique(col.key).map(val => (
                        <option key={val} value={val}>
                          {val}
                        </option>
                      ))}
                    </select>
                  )}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filteredLogs.map((log, idx) => (
              <tr key={idx}>
                <td>{log.title}</td>
                <td>
                  <span className="auditlogs-changes">{log.changes}</span>
                </td>
                <td>
                  <span className="auditlogs-user">{log.user}</span>
                </td>
                <td>{log.ip}</td>
                <td>
                  <span className="auditlogs-action">{log.action}</span>
                </td>
                <td>{log.datetime}</td>
                <td>
                  <button className="auditlogs-view">{log.details}</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
