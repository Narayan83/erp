import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { FaSpinner, FaPlay, FaCloudUploadAlt } from 'react-icons/fa';
import { IoClose } from 'react-icons/io5';
import { BASE_URL } from '../../../config/Config';
import './indiamart_integration.scss';

const IndiaMartIntegration = ({ onClose, onImport }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [config, setConfig] = useState({ apiKey: '', mobileNumber: '' });
  
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');

  // Fetch integration settings on mount
  useEffect(() => {
    const fetchConfig = async () => {
      try {
        const res = await axios.get(`${BASE_URL}/api/integrations?provider=indiamart`);
        if (res.data && res.data.length > 0) {
          const item = res.data[0];
          console.log("IndiaMART Config fetched:", item.config);
          
          let configObj = item.config;
          if (typeof configObj === 'string') {
            try {
              configObj = JSON.parse(configObj);
            } catch (e) {
              console.error("Failed to parse config string", e);
            }
          }

          setConfig({
            apiKey: (configObj.apiKey || configObj.keySecret || '').trim(),
            mobileNumber: (configObj.mobileNumber || configObj.keyId || '').trim()
          });
        }
      } catch (err) {
        console.error("Error fetching IndiaMART config:", err);
        setError("Failed to load IndiaMART configuration. Please check your integration settings.");
      }
    };
    
    // Set default date range (last 7 days as in image)
    const today = new Date();
    const lastWeek = new Date();
    lastWeek.setDate(today.getDate() - 6);
    
    setFromDate(lastWeek.toISOString().split('T')[0]);
    setToDate(today.toISOString().split('T')[0]);
    
    fetchConfig();
  }, []);

  const handleImport = async () => {
    if (!config.apiKey) {
      setError('IndiaMART API Key is missing. Please configure it in Settings > Integrations.');
      return;
    }

    if (!fromDate || !toDate) {
      setError('Please select a date range.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // Format dates for IndiaMART API: DD-MON-YYYY format (e.g., 25-JAN-2022)
      const formatDate = (dateStr, isStart) => {
        const date = new Date(dateStr);
        const months = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
        const day = date.getDate().toString().padStart(2, '0');
        const month = months[date.getMonth()];
        const year = date.getFullYear();
        const time = isStart ? '00:00:00' : '23:59:59';
        return `${day}-${month}-${year} ${time}`;
      };

      const params = {
        api_key: config.apiKey.trim(),
        mobile_no: config.mobileNumber.trim(),
        start_time: formatDate(fromDate, true),
        end_time: formatDate(toDate, false)
      };

      console.log("IndiaMART Fetch Request Params:", params);

      const response = await axios.post(`${BASE_URL}/api/indiamart/fetch-leads`, params);

      if (response.data.success) {
        let apiResponse;
        try {
          apiResponse = typeof response.data.response === 'string' 
            ? JSON.parse(response.data.response) 
            : response.data.response;
        } catch (parseError) {
          console.error('Failed to parse IndiaMART response:', parseError, response.data.response);
          throw new Error('IndiaMART returned an invalid response format (HTML). Please verify your API key and mobile number.');
        }

        if (apiResponse && (apiResponse.CODE === 200 || apiResponse.STATUS === 'SUCCESS')) {
          const fetchedLeads = apiResponse.RESPONSE || [];
          
          if (fetchedLeads.length === 0) {
            setError('No leads found for the selected date range.');
          } else {
            // Format leads for import
            const formattedLeads = fetchedLeads.map(lead => ({
              business: lead.SENDER_COMPANY || lead.buyer_company || '',
              name: lead.SENDER_NAME || lead.buyer_name || '',
              mobile: lead.SENDER_MOBILE || lead.buyer_mobile || '',
              email: lead.SENDER_EMAIL || lead.buyer_email || '',
              addressLine1: lead.buyer_address || lead.SENDER_CITY || '',
              city: lead.SENDER_CITY || lead.buyer_city || '',
              state: lead.SENDER_STATE || lead.buyer_state || '',
              source: 'IndiaMART',
              product: lead.QUERY_PRODUCT_NAME || lead.product_name || '',
              requirements: lead.QUERY_MESSAGE || lead.buyer_requirement || '',
              queryId: lead.UNIQUE_QUERY_ID || lead.lead_id || '',
              queryTime: lead.QUERY_TIME || lead.enquiry_date || ''
            }));

            if (onImport) {
              onImport(formattedLeads);
            }
          }
        } else {
          setError(apiResponse.MESSAGE || apiResponse.Error || 'IndiaMART API error');
        }
      } else {
        setError(response.data.error || 'Failed to fetch leads');
      }
    } catch (err) {
      console.error('Error importing leads:', err);
      setError(err.response?.data?.error || err.message || 'Failed to connect to IndiaMART');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="indiamart-import-wrapper">
      <div className="indiamart-import-header">
        <h2>Import Leads from IndiaMART</h2>
        <div className="header-actions">
          {/* <button className="tutorial-btn">
            <FaPlay size={12} /> View Tutorial
          </button> */}
          <IoClose className="close-icon" onClick={onClose} />
        </div>
      </div>

      <div className="indiamart-import-body">
        <p className="description">Select a period of up to one week to import IndiaMART leads.</p>
        
        <div className="import-filters">
          <div className="date-input-wrapper">
            <input 
              type="date" 
              value={fromDate} 
              onChange={(e) => setFromDate(e.target.value)}
            />
          </div>
          <span>to</span>
          <div className="date-input-wrapper">
            <input 
              type="date" 
              value={toDate} 
              onChange={(e) => setToDate(e.target.value)}
            />
          </div>
        </div>

        {error && <div className="error-message" style={{marginBottom: 20}}>{error}</div>}

        <button 
          className="import-action-btn" 
          onClick={handleImport}
          disabled={loading}
        >
          {loading ? (
            <FaSpinner className="spinner" />
          ) : (
            <FaCloudUploadAlt />
          )}
          {loading ? ' Importing...' : ' Import'}
        </button>
      </div>
    </div>
  );
};

export default IndiaMartIntegration;
