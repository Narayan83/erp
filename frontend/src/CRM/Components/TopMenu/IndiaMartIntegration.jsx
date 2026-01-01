import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { FaGlobe, FaSpinner } from 'react-icons/fa';
import './indiamart_integration.scss';
import fallbackLeads from '../IndiaMart/leads.json';

const IndiaMartIntegration = ({ onClose, onImport }) => {
  const [apiKey, setApiKey] = useState('');
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState({
    total: 0,
    today: 0,
    contacted: 0,
    pending: 0
  });
  const [selectedLeads, setSelectedLeads] = useState(new Set());
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage] = useState(10);
  const [error, setError] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [dateFilterError, setDateFilterError] = useState('');
  const [fromTime, setFromTime] = useState('');
  const [toTime, setToTime] = useState('');
  const [timeFilterError, setTimeFilterError] = useState('');
  const [pullMode, setPullMode] = useState('manual'); // 'manual' or 'auto'
  const [recentKeys, setRecentKeys] = useState([]);

  const BACKEND_URL = 'http://localhost:8000/api';

  // Prevent concurrent fetches
  const inflightRef = React.useRef(false);

  // Check for saved API key on mount
  useEffect(() => {
    const savedKey = localStorage.getItem('indiamart_api_key');
    const savedRecentKeys = localStorage.getItem('indiamart_recent_keys');
    
    if (savedRecentKeys) {
      setRecentKeys(JSON.parse(savedRecentKeys));
    }
    
    if (savedKey) {
      setApiKey(savedKey);
      setIsAuthenticated(true);
      fetchLeads(0, savedKey);
    }
  }, []);

  const handleConnect = async () => {
    if (!apiKey.trim()) {
      setError('Please enter an API key');
      return;
    }

    try {
      localStorage.setItem('indiamart_api_key', apiKey);
      
      // Add to recent keys (max 5)
      const updated = [apiKey, ...recentKeys.filter(k => k !== apiKey)].slice(0, 5);
      setRecentKeys(updated);
      localStorage.setItem('indiamart_recent_keys', JSON.stringify(updated));
      
      setIsAuthenticated(true);
      setError('');
      await fetchLeads(0, apiKey);
    } catch (err) {
      setError('Failed to connect to IndiaMART');
    }
  };

  const fetchLeads = async (start = 0, key = apiKey, retryCount = 0) => {
    const MAX_RETRIES = 3;
    const INITIAL_DELAY = 1000; // 1 second

    // Prevent overlapping requests
    if (inflightRef.current) {
      console.debug('IndiaMART fetch already in progress - skipping');
      return;
    }
    inflightRef.current = true;

    setLoading(true);
    setError('');

    try {
      console.debug(`Calling backend /indiamart/fetch-leads start=${start} retry=${retryCount}`);
      const response = await axios.post(`${BACKEND_URL}/indiamart/fetch-leads`, {
        apiKey: key,
        start: start,
        rows: rowsPerPage
      }, {
        timeout: 30000,
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        }
      });

      if (response.data.STATUS === 'SUCCESS' || response.data.STATUS === 'OK-FALLBACK') {
        const fetchedLeads = response.data.DATA || [];

        // If API returned no leads, immediately use local fallback data
        if (!Array.isArray(fetchedLeads) || fetchedLeads.length === 0) {
          setLeads(fallbackLeads || []);
          calculateStats(fallbackLeads || []);
          setSelectedLeads(new Set());
          setCurrentPage(1);
          setError('No leads returned from API — showing local sample leads');
        } else {
          setLeads(fetchedLeads);
          calculateStats(fetchedLeads);
          setSelectedLeads(new Set()); // Reset selections on new fetch
          setCurrentPage(1);
        }

        if (response.data.STATUS === 'OK-FALLBACK') {
          setError(prev => prev ? prev + ' | Note: Showing cached leads (IndiaMART API rate limit reached)' : 'Note: Showing cached leads (IndiaMART API rate limit reached)');
        }
      } else {
        setError(response.data.MESSAGE || 'Failed to fetch leads');
        // If API responded but indicated failure, show fallback immediately
        setLeads(fallbackLeads || []);
        calculateStats(fallbackLeads || []);
      }
      setLoading(false);
      inflightRef.current = false;
    } catch (error) {
      console.error('Error fetching leads:', error);
      let errorMessage = 'Failed to connect to IndiaMART API';

      if (error.response?.status === 429) {
        errorMessage = error.response.data.error || 'IndiaMART API rate limit exceeded. Please wait a few minutes and try again.';
      } else if (error.response?.data?.error) {
        errorMessage = error.response.data.error;
      } else if (error.response?.status === 401) {
        errorMessage = 'Invalid API key';
      } else if (error.code === 'ECONNABORTED') {
        errorMessage = 'Request timeout. Please try again.';
      } else if (error.message === 'Network Error') {
        errorMessage = 'Network connection error. Make sure backend is running.';
      }

      setError(errorMessage);
      // On network/error, immediately load local fallback leads
      setLeads(fallbackLeads || []);
      calculateStats(fallbackLeads || []);
      setLoading(false);
      inflightRef.current = false;
    }
  };

  const calculateStats = (leadsData) => {
    const today = new Date().toISOString().split('T')[0];
    const todayLeads = leadsData.filter(lead =>
      lead.QUERY_TIME && lead.QUERY_TIME.includes(today)
    ).length;

    setStats({
      total: leadsData.length,
      today: todayLeads,
      contacted: Math.floor(leadsData.length * 0.3),
      pending: Math.floor(leadsData.length * 0.7)
    });
  };

  const handleSelectLead = (leadId) => {
    const newSelected = new Set(selectedLeads);
    if (newSelected.has(leadId)) {
      newSelected.delete(leadId);
    } else {
      newSelected.add(leadId);
    }
    setSelectedLeads(newSelected);
  };

  const handleSelectAll = () => {
    if (selectedLeads.size === leads.length) {
      setSelectedLeads(new Set());
    } else {
      setSelectedLeads(new Set(leads.map(lead => lead.UNIQUE_QUERY_ID)));
    }
  };

  const handleImportSelected = () => {
    if (selectedLeads.size === 0) {
      setError('Please select at least one lead');
      return;
    }

    try {
      const selectedLeadData = leads.filter(lead =>
        selectedLeads.has(lead.UNIQUE_QUERY_ID)
      );

      console.log('Selected leads for import:', selectedLeadData);

      // Format leads for import - map all fields with proper field references
      const formattedLeads = selectedLeadData.map(lead => ({
        // Basic Info - Map to Lead model fields
        business: lead.SENDER_COMPANY || lead.buyer_company || '',
        name: lead.SENDER_NAME || lead.buyer_name || '',
        designation: lead.designation || '',
        mobile: lead.SENDER_MOBILE || lead.buyer_mobile || '',
        email: lead.SENDER_EMAIL || lead.buyer_email || '',
        
        // Address
        addressLine1: lead.buyer_address || lead.SENDER_CITY || '',
        addressLine2: lead.addressLine2 || '',
        city: lead.SENDER_CITY || lead.buyer_city || '',
        state: lead.SENDER_STATE || lead.buyer_state || '',
        country: lead.buyer_country || '',
        
        // Business Details
        gstin: lead.gstin || '',
        source: lead.enquiry_source || 'IndiaMART',
        stage: lead.lead_stage || lead.STATUS || 'New',
        potential: parseFloat(lead.estimated_value) || 0,
        category: lead.lead_category || lead.QUERY_CATEGORY_NAME || '',
        
        // Product & Requirements
        product: lead.QUERY_PRODUCT_NAME || lead.product_name || '',
        website: lead.website || '',
        requirements: lead.QUERY_MESSAGE || lead.buyer_requirement || '',
        notes: lead.remarks || '',
        
        // Tags & Dates
        tags: Array.isArray(lead.lead_tags) ? lead.lead_tags.join(',') : (lead.lead_tags || ''),
        since: lead.QUERY_TIME || lead.enquiry_date || new Date().toISOString(),
        lastTalk: lead.last_talk || '',
        nextTalk: lead.next_followup || '',
        transferredOn: lead.transferred_on || '',
        
        // Assignment
        assignedTo: lead.assigned_to || '',
        
        // External identifiers
        queryId: lead.UNIQUE_QUERY_ID || lead.lead_id || '',
        queryTime: lead.QUERY_TIME || lead.enquiry_date || ''
      }));

      console.log('Formatted leads for import:', formattedLeads);

      if (onImport) {
        console.log('Calling onImport callback');
        onImport(formattedLeads);
        console.log('onImport callback executed successfully');
      } else {
        console.warn('onImport callback is not defined');
        setError('Import callback is not configured');
        return;
      }

      onClose();
    } catch (err) {
      console.error('Error during import:', err);
      setError('An error occurred during import: ' + err.message);
    }
  };

  const handleDisconnect = () => {
    localStorage.removeItem('indiamart_api_key');
    setIsAuthenticated(false);
    setApiKey('');
    setLeads([]);
    setSelectedLeads(new Set());
    setError('');
  };

  // Pagination
  const indexOfLastLead = currentPage * rowsPerPage;
  const indexOfFirstLead = indexOfLastLead - rowsPerPage;

  // Filter leads by date range
  const filteredLeads = leads.filter(lead => {
    if (!fromDate && !toDate && !fromTime && !toTime) return true;
    
    const leadTime = new Date(lead.QUERY_TIME);
    if (isNaN(leadTime)) return true;

    // Date range filtering
    if (fromDate || toDate) {
      if (fromDate) {
        const from = new Date(fromDate);
        if (leadTime < from) return false;
      }

      if (toDate) {
        const to = new Date(toDate);
        to.setHours(23, 59, 59, 999);
        if (leadTime > to) return false;
      }
    }

    // Time range filtering (only applies if at least one date filter is set or no date filter)
    if (fromTime || toTime) {
      const leadHours = leadTime.getHours().toString().padStart(2, '0');
      const leadMinutes = leadTime.getMinutes().toString().padStart(2, '0');
      const leadTimeStr = `${leadHours}:${leadMinutes}`;

      if (fromTime && leadTimeStr < fromTime) return false;
      if (toTime && leadTimeStr > toTime) return false;
    }

    return true;
  });

  const currentLeads = filteredLeads.slice(indexOfFirstLead, indexOfLastLead);
  const totalPages = Math.ceil(filteredLeads.length / rowsPerPage);

  const getStatusBadge = (status) => {
    const statusMap = {
      'INTERESTED': 'status-interested',
      'NOT_INTERESTED': 'status-not-interested',
      'FOLLOW_UP': 'status-followup',
      'CONTACTED': 'status-contacted',
      'NEW': 'status-new'
    };

    return statusMap[status] || 'status-new';
  };

  const handleDateRangeChange = (from, to) => {
    setDateFilterError('');
    
    if (!from || !to) {
      setFromDate(from);
      setToDate(to);
      setCurrentPage(1);
      return;
    }

    const fromDateTime = new Date(from);
    const toDateTime = new Date(to);

    // Validate: from date must be before or equal to to date
    if (fromDateTime > toDateTime) {
      setDateFilterError('From date must be before or equal to To date');
      return;
    }

    // Validate: maximum 7 days duration
    const diffTime = toDateTime - fromDateTime;
    const diffDays = diffTime / (1000 * 60 * 60 * 24);
    if (diffDays > 7) {
      setDateFilterError('Date range cannot exceed 7 days');
      return;
    }

    setFromDate(from);
    setToDate(to);
    setCurrentPage(1);
  };

  const handleTimeRangeChange = (from, to) => {
    setTimeFilterError('');
    
    if (!from || !to) {
      setFromTime(from);
      setToTime(to);
      setCurrentPage(1);
      return;
    }

    // Validate: from time must be before or equal to to time
    if (from > to) {
      setTimeFilterError('From time must be before or equal to To time');
      return;
    }

    setFromTime(from);
    setToTime(to);
    setCurrentPage(1);
  };

  if (!isAuthenticated) {
    return (
      <div className="indiamart-container">
        <div className="indiamart-auth">
          <div className="auth-card">
            <h3>
              <FaGlobe className="auth-icon" />
              Connect to IndiaMART
            </h3>

            <div className="form-group">
              <label>API Key</label>
              <input
                type="password"
                value={apiKey}
                onChange={(e) => {
                  setApiKey(e.target.value);
                  setError('');
                }}
                placeholder="Enter your IndiaMART API key"
                className="form-input"
              />
              <small className="help-text">
                Get your API key from IndiaMART seller account
              </small>
            </div>

            {error && <div className="error-message">{error}</div>}

            <button
              onClick={handleConnect}
              disabled={!apiKey.trim() || loading}
              className="btn btn-primary full-width"
            >
              {loading ? (
                <>
                  <FaSpinner className="spinner" /> Connecting...
                </>
              ) : (
                'Connect to IndiaMART'
              )}
            </button>

            {recentKeys.length > 0 && (
              <div className="recent-keys">
                <small>Recent Keys:</small>
                <div className="keys-list">
                  {recentKeys.map((key, index) => (
                    <button
                      key={index}
                      className="btn btn-secondary btn-small key-button"
                      onClick={() => setApiKey(key)}
                      title={key}
                    >
                      {key.substring(0, 15)}...{key.substring(key.length - 10)}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="indiamart-container">
      <div className="indiamart-header">
        <div className="header-left">
          <h3>IndiaMART Leads</h3>
          <p className="authenticated-badge">✓ Connected</p>
        </div>
        <div className="pull-mode-toggle">
          <span className={`toggle-label ${pullMode === 'manual' ? 'active' : ''}`}>
            Manual Pull
          </span>
          <button
            className={`slide-toggle ${pullMode === 'auto' ? 'active' : ''}`}
            onClick={() => setPullMode(pullMode === 'manual' ? 'auto' : 'manual')}
            title={`Switch to ${pullMode === 'manual' ? 'auto' : 'manual'} pull mode`}
          >
            <span className="toggle-slider"></span>
          </button>
          <span className={`toggle-label ${pullMode === 'auto' ? 'active' : ''}`}>
            Auto Pull
          </span>
        </div>
        <div className="header-right">
          <button
            onClick={handleDisconnect}
            className="btn btn-secondary"
          >
            Disconnect
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-value">{stats.total}</div>
          <div className="stat-label">Total Leads</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{stats.today}</div>
          <div className="stat-label">Today's Leads</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{stats.contacted}</div>
          <div className="stat-label">Contacted</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{stats.pending}</div>
          <div className="stat-label">Pending</div>
        </div>
      </div>

      {error && <div className="error-message">{error}</div>}

      {loading ? (
        <div className="loading-state">
          <FaSpinner className="spinner" />
          <p>Fetching leads from IndiaMART...</p>
        </div>
      ) : leads.length === 0 ? (
          <div className="empty-state">
            <p>No leads found</p>
          </div>
      ) : (
        <>
          {/* Filters Container */}
          <div className="filters-container">
            {/* Date Range Filter */}
            <div className="date-filter-section">
              <div className="filter-header">
                <div className="filter-label">Filter by Date (Max 7 days)</div>
                {(fromDate || toDate) && (
                  <button
                    onClick={() => {
                      setFromDate('');
                      setToDate('');
                      setDateFilterError('');
                      setCurrentPage(1);
                    }}
                    className="btn btn-secondary btn-small clear-btn"
                  >
                    Clear
                  </button>
                )}
              </div>
              <div className="date-filter-inputs">
                <div className="date-input-group">
                  <label>From</label>
                  <input
                    type="date"
                    value={fromDate}
                    onChange={(e) => handleDateRangeChange(e.target.value, toDate)}
                    className="date-input"
                  />
                </div>
                <div className="date-input-group">
                  <label>To</label>
                  <input
                    type="date"
                    value={toDate}
                    onChange={(e) => handleDateRangeChange(fromDate, e.target.value)}
                    className="date-input"
                    min={fromDate}
                  />
                </div>
              </div>
              {dateFilterError && <div className="error-message" style={{ marginTop: '8px' }}>{dateFilterError}</div>}
            </div>

            {/* Time Range Filter */}
            <div className="time-filter-section">
              <div className="filter-header">
                <div className="filter-label">Filter by Time</div>
                {(fromTime || toTime) && (
                  <button
                    onClick={() => {
                      setFromTime('');
                      setToTime('');
                      setTimeFilterError('');
                      setCurrentPage(1);
                    }}
                    className="btn btn-secondary btn-small clear-btn"
                  >
                    Clear
                  </button>
                )}
              </div>
              <div className="time-filter-inputs">
                <div className="time-input-group">
                  <label>From Time</label>
                  <input
                    type="time"
                    value={fromTime}
                    onChange={(e) => handleTimeRangeChange(e.target.value, toTime)}
                    className="time-input"
                  />
                </div>
                <div className="time-input-group">
                  <label>To Time</label>
                  <input
                    type="time"
                    value={toTime}
                    onChange={(e) => handleTimeRangeChange(fromTime, e.target.value)}
                    className="time-input"
                  />
                </div>
              </div>
              {timeFilterError && <div className="error-message" style={{ marginTop: '8px' }}>{timeFilterError}</div>}
            </div>
          </div>
          {/* Leads Table */}
          <div className="leads-table-wrapper">
            <table className="leads-table">
              <thead>
                <tr>
                  <th>
                    <input
                      type="checkbox"
                      checked={selectedLeads.size === leads.length && leads.length > 0}
                      onChange={handleSelectAll}
                      className="checkbox"
                    />
                  </th>
                  <th>Name</th>
                  <th>Designation</th>
                  <th>Email</th>
                  <th>Phone</th>
                  <th>Company</th>
                  <th>Address</th>
                  <th>City</th>
                  <th>State</th>
                  <th>Country</th>
                  <th>GSTIN</th>
                  <th>Product</th>
                  <th>Requirement</th>
                  <th>Source</th>
                  <th>Stage</th>
                  <th>Category</th>
                  <th>Potential (₹)</th>
                  <th>Assigned To</th>
                  <th>Next Follow-up</th>
                  <th>Notes</th>
                  <th>Date</th>
                </tr>
              </thead>
              <tbody>
                {currentLeads.map(lead => (
                  <tr key={lead.UNIQUE_QUERY_ID || lead.lead_id} className={selectedLeads.has(lead.UNIQUE_QUERY_ID || lead.lead_id) ? 'selected' : ''}>
                    <td>
                      <input
                        type="checkbox"
                        checked={selectedLeads.has(lead.UNIQUE_QUERY_ID || lead.lead_id)}
                        onChange={() => handleSelectLead(lead.UNIQUE_QUERY_ID || lead.lead_id)}
                        className="checkbox"
                      />
                    </td>
                    <td><strong>{lead.SENDER_NAME || '-'}</strong></td>
                    <td>{lead.designation || '-'}</td>
                    <td>{lead.SENDER_EMAIL || '-'}</td>
                    <td>{lead.SENDER_MOBILE || '-'}</td>
                    <td className="truncate">{lead.SENDER_COMPANY || '-'}</td>
                    <td className="truncate">{lead.buyer_address || '-'}</td>
                    <td>{lead.SENDER_CITY || '-'}</td>
                    <td>{lead.SENDER_STATE || '-'}</td>
                    <td>{lead.buyer_country || '-'}</td>
                    <td><small>{lead.gstin || '-'}</small></td>
                    <td className="truncate">{lead.QUERY_PRODUCT_NAME || '-'}</td>
                    <td className="truncate">{lead.QUERY_MESSAGE || '-'}</td>
                    <td className="truncate">{lead.enquiry_source || '-'}</td>
                    <td>{lead.lead_stage || '-'}</td>
                    <td>{lead.lead_category || '-'}</td>
                    <td><small>{lead.estimated_value ? `₹${lead.estimated_value.toLocaleString()}` : '-'}</small></td>
                    <td className="truncate">{lead.assigned_to || '-'}</td>
                    <td><small>{lead.next_followup || '-'}</small></td>
                    <td className="truncate">{lead.remarks || '-'}</td>
                    <td>
                      <small>
                        {lead.QUERY_TIME
                          ? new Date(lead.QUERY_TIME).toLocaleDateString('en-IN', {
                            day: 'numeric',
                            month: 'short',
                            hour: '2-digit',
                            minute: '2-digit'
                          })
                          : '-'}
                      </small>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="pagination">
              <button
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="btn btn-small"
              >
                Previous
              </button>
              <span className="page-info">
                Page {currentPage} of {totalPages}
              </span>
              <button
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="btn btn-small"
              >
                Next
              </button>
            </div>
          )}

          {/* Actions */}
          <div className="actions">
            <p className="selection-info">
              {selectedLeads.size} lead{selectedLeads.size !== 1 ? 's' : ''} selected
            </p>
            <div className="action-buttons">
              <button
                onClick={() => fetchLeads(0)}
                disabled={loading}
                className="btn btn-secondary"
              >
                {loading ? 'Refreshing...' : 'Refresh'}
              </button>
              <button
                onClick={handleImportSelected}
                disabled={selectedLeads.size === 0 || loading}
                className="btn btn-primary"
              >
                Import Selected ({selectedLeads.size})
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default IndiaMartIntegration;
