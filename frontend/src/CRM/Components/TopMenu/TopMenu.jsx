// Import dependencies
import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
// Import icons
import { 
  FaSearch, FaPen, FaCog, FaTh, FaChartBar, 
  FaFilter, FaWrench, FaDownload, FaBars, FaFileExport,
  FaTrash, FaEdit, FaStar 
} from 'react-icons/fa';
import * as XLSX from 'xlsx';
// Import styles
import './_top_menu.scss';
import DisplayPref from '../../Pages/DisplayPref/DisplayPref';
import AddLead from '../../Pages/AddLead/AddLead';


import {BASE_URL} from '../../../Config'

const assignedToOptions = [
  { id: 1, name: 'ABC' },
  { id: 2, name: 'XYZ' },
  { id: 3, name: '123' }
];

const TopMenu = () => {
  const navigate = useNavigate();
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(false);

  // Fetch leads from backend
  const fetchLeads = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${BASE_URL}/api/leads?page=1&limit=100`);
      const data = await res.json();
      // Merge starred info from localStorage
      const starredMap = JSON.parse(localStorage.getItem('starredLeads') || '{}');
      // Map assigned_to_id to assignedTo name for display
      const leadsWithStar = (data.data || []).map(lead => ({
        ...lead,
        starred: !!starredMap[lead.id],
        assignedTo: assignedToOptions.find(opt => opt.id === lead.assigned_to_id)?.name || ''
      }));
      setLeads(leadsWithStar);
    } catch (err) {
      console.error('Failed to fetch leads:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeads();
  }, []);
  const [activeStatusFilter, setActiveStatusFilter] = useState('All Active Leads');
  const [activeViewFilter, setActiveViewFilter] = useState('Newest First');
  const [activeLeadsFilter, setActiveLeadsFilter] = useState(false);
  const [activeFiltersBtn, setActiveFiltersBtn] = useState(false);
  const [showDisplayPref, setShowDisplayPref] = useState(false);
  const [showAddLead, setShowAddLead] = useState(false);
  const [editLead, setEditLead] = useState(null);
  const fileInputRef = useRef(null);

  // Event handlers
  const handleStatusFilterClick = (filter) => {
    setActiveStatusFilter(filter);
  };

  const handleViewFilterClick = (filter) => {
    setActiveViewFilter(filter);
  };

  const handleLeadsFilterClick = () => {
    setActiveLeadsFilter(!activeLeadsFilter);
  };

  const handleFiltersBtnClick = () => {
    setActiveFiltersBtn(!activeFiltersBtn);
  };

  const handleReportsClick = () => {
    navigate('/reports');
  };

  const handleCustomizeClick = () => {
    navigate('/customize');
  };

  // Add new lead via backend
  const handleAddLeadSubmit = async (newLeadData) => {
    try {
      // Compose contact field
      const contact = [newLeadData.prefix || '', newLeadData.firstName || '', newLeadData.lastName || ''].filter(Boolean).join(' ').trim();
      // Map assignedTo name to ID
      const assignedToObj = assignedToOptions.find(opt => opt.name === newLeadData.assignedTo);
      const assigned_to_id = assignedToObj ? assignedToObj.id : 1;
      // Prepare payload matching backend Lead model
      const payload = {
        business: newLeadData.business,
        contact,
        designation: newLeadData.designation,
        mobile: newLeadData.mobile,
        email: newLeadData.email,
        city: newLeadData.city,
        state: newLeadData.state,
        country: newLeadData.country,
        source: newLeadData.source,
        stage: newLeadData.stage,
        potential: parseFloat(newLeadData.potential) || 0,
        since: newLeadData.since || new Date().toISOString(),
        gstin: newLeadData.gstin,
        website: newLeadData.website,
        requirements: newLeadData.requirement,
        notes: newLeadData.notes,
        assigned_to_id,
        product_id: 1, // TODO: Map from product name to ID
      };
      if (editLead && editLead.id) {
        // Edit mode: send PUT request
        await fetch(`${BASE_URL}/api/leads/${editLead.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
      } else {
        // Add mode: send POST request
        await fetch(`${BASE_URL}/api/leads`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
      }
      await fetchLeads(); // Refresh list
      setShowAddLead(false);
      setEditLead(null);
    } catch (err) {
      console.error('Failed to add/update lead:', err);
    }
  };

  const handleSelectAll = () => {
    const allSelected = leads.length > 0 && leads.every(lead => lead.selected);
    setLeads(prevLeads =>
      prevLeads.map(lead => ({
        ...lead,
        selected: !allSelected
      }))
    );
  };

  const handleSelectRow = (leadId) => {
    setLeads(prevLeads =>
      prevLeads.map(lead =>
        lead.id === leadId
          ? { ...lead, selected: !lead.selected }
          : lead
      )
    );
  };

  const handleImportClick = () => {
    fileInputRef.current.click();
  };

  // Helper to format date as DD-MM-YYYY
  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    if (isNaN(date)) return dateStr; // fallback for invalid date
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}-${month}-${year}`;
  };

  // Helper to parse Excel date or DD-MM-YYYY to ISO (for storage)
  const parseExcelDate = (value) => {
    if (!value) return '';
    // If already in DD-MM-YYYY, convert to ISO
    if (/^\d{2}-\d{2}-\d{4}$/.test(value)) {
      const [day, month, year] = value.split('-');
      return `${year}-${month}-${day}`;
    }
    // Try parsing as Date
    const date = new Date(value);
    if (!isNaN(date)) {
      return date.toISOString().split('T')[0];
    }
    return value;
  };

  // Modified handleFileUpload to save to localStorage
  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = new Uint8Array(e.target.result);
          const workbook = XLSX.read(data, { type: 'array' });
          const sheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[sheetName];
          const jsonData = XLSX.utils.sheet_to_json(worksheet, { 
            raw: false,
            defval: ''
          });

          console.log('Raw Excel Data:', jsonData[0]); // Debug first row

          // Get column headers from Excel
          const headers = Object.keys(jsonData[0]);
          console.log('Excel Headers:', headers); // Debug headers

          const newLeads = jsonData.map((row, index) => {
            // Debug log each row's assigned to and transferred on values
            console.log('Row data:', {
              assignedTo: row['Assigned to'] || row['AssignedTo'] || row['Assigned To'],
              transferredOn: row['Transferred on'] || row['TransferredOn'] || row['Transfer Date']
            });

            return {
              id: leads.length + index + 1,
              business: row.Business || row.business || '',
              contact: row.Contact || row.contact || '',
              designation: row.Designation || row.designation || '',
              mobile: row.Mobile || row.mobile || '',
              email: row.Email || row.email || '',
              city: row.City || row.city || '',
              state: row.State || row.state || '',
              country: row.Country || row.country || '',
              source: row.Source || row.source || '',
              stage: row.Stage || row.stage || '',
              potential: (row.Potential || row['Potential (₹)'] || row.potential || '0').toString().replace(/[^\d]/g, ''),
              since: formatDate(parseExcelDate(row.Since || row.since || new Date().toISOString().split('T')[0])),
              assignedTo: row['Assigned to'] || row['AssignedTo'] || row['Assigned To'] || '',
              product: row.Product || row.product || '',
              gstin: row.GSTIN || row.gstin || '',
              website: row.Website || row.website || '',
              lastTalk: formatDate(parseExcelDate(row['Last Talk'] || row.LastTalk || new Date().toISOString().split('T')[0])),
              nextTalk: formatDate(parseExcelDate(row['Next Talk'] || row.NextTalk || row.Next || '')),
              transferredOn: formatDate(parseExcelDate(row['Transferred on'] || row['TransferredOn'] || row['Transfer Date'] || new Date().toISOString().split('T')[0])),
              requirements: row.Requirements || row.requirements || '',
              notes: row.Notes || row.notes || '',
              selected: false
            };
          });

          // Debug final processed data
          console.log('Processed Lead:', newLeads[0]);

          if (newLeads.length === 0) {
            throw new Error('No valid data found in Excel file');
          }

          setLeads(prevLeads => {
            const updatedLeads = [...prevLeads, ...newLeads];
            localStorage.setItem('leads', JSON.stringify(updatedLeads));
            return updatedLeads;
          });

          // Clear the file input
          if (fileInputRef.current) {
            fileInputRef.current.value = '';
          }

          alert(`Successfully imported ${newLeads.length} leads`);
        } catch (error) {
          console.error('Excel import error:', error);
          alert('Error importing file. Please ensure the column names match exactly: "Assigned to" and "Transferred on"');
        }
      };
      reader.readAsArrayBuffer(file);
    }
  };

  // Add useEffect to update localStorage when leads change
  useEffect(() => {
    localStorage.setItem('leads', JSON.stringify(leads));
  }, [leads]);

  const handleDeleteRow = async (leadId) => {
    if (window.confirm('Are you sure you want to delete this lead?')) {
      try {
        await fetch(`${BASE_URL}/api/leads/${leadId}`, { method: 'DELETE' });
        await fetchLeads(); // Refresh list from backend
      } catch (err) {
        console.error('Failed to delete lead:', err);
      }
    }
  };

  const selectedLeadsCount = leads.filter(lead => lead.selected).length;

  // Add this helper function at the beginning of the component
  const formatIndianRupees = (value) => {
    const number = parseInt(value || "0");
    return new Intl.NumberFormat('en-IN', {
      maximumSignificantDigits: 3,
      style: 'currency',
      currency: 'INR'
    }).format(number);
  };

  const handleExportToExcel = () => {
    // Create a new workbook
    const wb = XLSX.utils.book_new();
    
    // Convert leads data to worksheet format while preserving case and formatting dates
    const exportData = leads.map(({ selected, ...lead }) => {
      return {
        'Business': lead.business,
        'Contact': lead.contact,
        'Designation': lead.designation,
        'Mobile': lead.mobile,
        'Email': lead.email,
        'City': lead.city,
        'State': lead.state,
        'Country': lead.country,
        'Source': lead.source,
        'Stage': lead.stage,
        'Potential (₹)': lead.potential,
        'Since': formatDate(lead.since),
        'Assigned to': lead.assignedTo,
        'Product': lead.product,
        'GSTIN': lead.gstin,
        'Website': lead.website,
        'Last Talk': formatDate(lead.lastTalk),
        'Next': formatDate(lead.nextTalk),
        'Transferred on': formatDate(lead.transferredOn),
        'Requirements': lead.requirements,
        'Notes': lead.notes
      };
    });
    
    const ws = XLSX.utils.json_to_sheet(exportData);
    XLSX.utils.book_append_sheet(wb, ws, "Leads");
    XLSX.writeFile(wb, "Leads_List_Exported.xlsx");
  };

  const handleEditRow = (lead) => {
    // Ensure assignedTo is always a string name for the AddLead form
    let assignedToName = lead.assignedTo;
    if (typeof assignedToName === 'object' && assignedToName !== null) {
      assignedToName = assignedToName.Name || assignedToName.name || assignedToName.email || '';
    } else if (typeof assignedToName === 'number') {
      const found = assignedToOptions.find(opt => opt.id === assignedToName);
      assignedToName = found ? found.name : '';
    }
    // Map all possible fields for AddLead form
    setEditLead({
      ...lead,
      assignedTo: assignedToName,
      id: lead.id,
      addressLine1: lead.addressLine1 || '',
      addressLine2: lead.addressLine2 || '',
      category: lead.category || '',
      product: lead.product || '',
      tags: lead.tags || '',
      code: lead.code || '',
      requirement: lead.requirements || lead.requirement || '',
      // fallback for fields that may be missing
      prefix: lead.prefix || '',
      firstName: lead.firstName || '',
      lastName: lead.lastName || ''
    });
    setShowAddLead(true);
  };

  const handleToggleStar = (leadId) => {
    setLeads(prevLeads => {
      const updatedLeads = prevLeads.map(lead =>
        lead.id === leadId ? { ...lead, starred: !lead.starred } : lead
      );
      // Update localStorage
      const starredMap = JSON.parse(localStorage.getItem('starredLeads') || '{}');
      const toggledLead = updatedLeads.find(lead => lead.id === leadId);
      if (toggledLead) {
        if (toggledLead.starred) {
          starredMap[leadId] = true;
        } else {
          delete starredMap[leadId];
        }
        localStorage.setItem('starredLeads', JSON.stringify(starredMap));
      }
      return updatedLeads;
    });
  };

  // Filter leads by status
  const filterLeadsByStatus = (leads, status) => {
    if (status === 'All Active Leads') return leads;
    if (status === 'Discussion') return leads.filter(lead => lead.stage && lead.stage.toLowerCase() === 'discussion');
    if (status === 'Demo') return leads.filter(lead => lead.stage && lead.stage.toLowerCase() === 'demo');
    if (status === 'Proposal') return leads.filter(lead => lead.stage && lead.stage.toLowerCase() === 'proposal');
    if (status === 'Decided') return leads.filter(lead => lead.stage && lead.stage.toLowerCase() === 'decided');
    if (status === 'Inactive') return leads.filter(lead => lead.stage && lead.stage.toLowerCase() === 'inactive');
    return leads;
  };

  // Filter leads by view
  const filterLeadsByView = (leads, view) => {
    if (view === 'Newest First') {
      // Sort by 'since' descending (newest first)
      return [...leads].sort((a, b) => new Date(b.since) - new Date(a.since));
    }
    if (view === 'Oldest First') {
      // Sort by 'since' ascending (oldest first)
      return [...leads].sort((a, b) => new Date(a.since) - new Date(b.since));
    }
    if (view === 'Star Leads') {
      // Show only starred leads
      return leads.filter(lead => lead.starred);
    }
    return leads;
  };

  // Store filtered and sorted leads in a variable
  const displayedLeads = filterLeadsByView(
    filterLeadsByStatus(leads, activeStatusFilter),
    activeViewFilter
  );

  return (
    <div className="top-menu">
      {/* Header Section - Contains title, search, and action buttons */}
      <div className="header-section">
        <h1 className="header-title">Leads & Prospects</h1>
        <div className="header-actions">
          <button 
            className={`all-leads-btn ${activeLeadsFilter ? 'active' : ''}`}
            onClick={handleLeadsFilterClick}
          >
            All Leads <FaPen className="pen-icon" />
          </button>
          <button 
            className={`filters-btn ${activeFiltersBtn ? 'active' : ''}`}
            onClick={handleFiltersBtnClick}
          >
            <FaFilter /> Filters (0)
          </button>
          <div className="search-bar">
            <FaSearch className="search-icon" />
            <input type="text" placeholder="Search" />
          </div>
          <div className="action-buttons">
            <button className="add-lead-btn" onClick={() => setShowAddLead(true)}>
              + Add Lead
            </button>
            <button className="import-btn" onClick={handleImportClick}>
              <FaDownload /> Import
            </button>
            <button className="customize-btn" onClick={handleCustomizeClick}>
              <FaWrench /> Customize
            </button>
          </div>
          <div className="utility-buttons">
            <button className="icon-btn" title="Sales Configuration"><FaCog /></button>
            <button className="icon-btn" title="Display Preferences" onClick={() => setShowDisplayPref(true)}><FaBars /></button>
            <button className="icon-btn" title="Export to Excel" onClick={handleExportToExcel}><FaFileExport /></button>
            <button className="icon-btn" title="Show Leads Dashboard"><FaTh /></button>
            <button className="icon-btn" title="Reports" onClick={handleReportsClick}><FaChartBar /></button>
          </div>
        </div>
      </div>

      {/* Filter Section - Contains status and view filters */}
      <div className="filter-section">
        {/* Status Filters */}
        <div className="status-filters">
          {['All Active Leads', 'Discussion', 'Demo', 'Proposal', 'Decided', 'Inactive'].map((filter) => (
            <button
              key={filter}
              className={activeStatusFilter === filter ? 'active' : ''}
              onClick={() => handleStatusFilterClick(filter)}
            >
              {filter}
            </button>
          ))}
        </div>
        
        {/* View Filters and Stats */}
        <div className="view-filters-container">
          <div className="view-filters">
            {['Newest First', 'Oldest First', 'Star Leads'].map((filter) => (
              <button
                key={filter}
                className={activeViewFilter === filter ? 'active' : ''}
                onClick={() => handleViewFilterClick(filter)}
              >
                {filter}
              </button>
            ))}
          </div>
          <div className="stats-section">
            <div className="count">Count: {leads.length}</div>
            <div className="selected-count">Selected: {selectedLeadsCount}</div>
            <div className="potential">Potential: {formatIndianRupees(leads.reduce((sum, lead) => sum + parseInt(lead.potential || "0"), 0))}</div>
          </div>
        </div>
      </div>

      {/* Selected Count Display */}
      <div className={`selected-count-overlay ${selectedLeadsCount > 0 ? 'visible' : ''}`}>
        Selected: {selectedLeadsCount}
      </div>
      
      {/* Table - Contains the leads data */}
      <div className="table-container">
        <table>
          <thead>
            <tr>
              <th className="checkbox-cell">
                <input
                  type="checkbox"
                  onChange={handleSelectAll}
                  checked={leads.length > 0 && leads.every(lead => lead.selected)}
                  disabled={leads.length === 0}
                />
              </th>
              <th className="serial-number">S.No</th>
              <th>Business</th>
              <th>Contact</th>
              <th>Designation</th>
              <th>Mobile</th>
              <th>Email</th>
              <th>City</th>
              <th>State</th>
              <th>Country</th>
              <th>Source</th>
              <th>Stage</th>
              <th>Potential (₹)</th>
              <th>Since</th>
              <th>Assigned to</th>
              <th>Product</th>
              <th>GSTIN</th>
              <th>Website</th>
              <th>Last Talk</th>
              <th>Next</th>
              <th>Transferred on</th>
              <th>Requirements</th>
              <th>Notes</th>
              <th className="action-column">Actions</th>
            </tr>
          </thead>
          <tbody>
            {Array.isArray(displayedLeads) && displayedLeads.map((lead, index) => {
              if (!lead || typeof lead !== 'object') return null;
              return (
                <tr key={lead.id || index}>
                  <td className="checkbox-cell">
                    <input
                      type="checkbox"
                      checked={!!lead.selected}
                      onChange={() => handleSelectRow(lead.id)}
                    />
                  </td>
                  <td className="serial-number">
                    <span
                      className={`star-icon ${lead.starred ? 'starred' : ''}`}
                      title={lead.starred ? 'Unmark as Star' : 'Mark as Star'}
                      onClick={() => handleToggleStar(lead.id)}
                    >
                      <FaStar />
                    </span>
                    {index + 1}
                  </td>
                  <td>{lead.business || ''}</td>
                  <td>{lead.contact || ''}</td>
                  <td>{lead.designation || ''}</td>
                  <td>{lead.mobile || ''}</td>
                  <td>{lead.email || ''}</td>
                  <td>{lead.city || ''}</td>
                  <td>{lead.state || ''}</td>
                  <td>{lead.country || ''}</td>
                  <td>{lead.source || ''}</td>
                  <td>{lead.stage || ''}</td>
                  <td>₹{lead.potential || ''}</td>
                  <td>{formatDate(lead.since)}</td>
                  <td>{
                    typeof lead.assignedTo === 'object' && lead.assignedTo !== null
                      ? (lead.assignedTo.Name || lead.assignedTo.name || lead.assignedTo.email || JSON.stringify(lead.assignedTo))
                      : (lead.assignedTo || '')
                  }</td>
                  <td>{
                    typeof lead.product === 'object' && lead.product !== null
                      ? (lead.product.Name || lead.product.name || lead.product.Code || JSON.stringify(lead.product))
                      : (lead.product || '')
                  }</td>
                  <td>{lead.gstin || ''}</td>
                  <td>{lead.website || ''}</td>
                  <td>{formatDate(lead.lastTalk)}</td>
                  <td>{formatDate(lead.nextTalk)}</td>
                  <td>{formatDate(lead.transferredOn)}</td>
                  <td>{lead.requirements || ''}</td>
                  <td>{lead.notes || ''}</td>
                  <td className="action-cell">
                    <button 
                      className="edit-btn"
                      title="Edit Lead"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleEditRow(lead);
                      }}
                    >
                      <FaEdit />
                    </button>
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteRow(lead.id);
                      }}
                      className="delete-btn"
                      title="Delete Lead"
                    >
                      <FaTrash />
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      
      {/* Bottom Action Bar - Fixed at the bottom of the scroll */}
      <div className="bottom-action-bar">
        <div className='bottom-action-button'>
            <button className="add-lead-btn" onClick={() => setShowAddLead(true)}>
              + Add Lead
            </button>
            <button className="import-btn" onClick={handleImportClick}>
              <FaDownload /> Import
            </button>
            <button className="customize-btn" onClick={handleCustomizeClick}>
              <FaWrench /> Customize
            </button>
        <button className="report-btn" onClick={handleReportsClick}>
          <FaChartBar /> Reports
        </button>
        <button
          className={`filters-btn ${activeFiltersBtn ? 'active' : ''}`}
          onClick={handleFiltersBtnClick}
        >
          <FaFilter /> Filters (0)
        </button>
        </div>
      </div>
      {/* Display Preferences Modal */}
    {showDisplayPref && (
      <DisplayPref onClose={() => setShowDisplayPref(false)} />
    )}
    
    {/* Add Lead Modal */}
    <AddLead isOpen={showAddLead} onClose={() => { setShowAddLead(false); setEditLead(null); }} onAddLeadSubmit={fetchLeads} leadData={editLead} />
    <input
        type="file"
        ref={fileInputRef}
        style={{ display: 'none' }}
        accept=".xlsx,.xls"
        onChange={handleFileUpload}
      />
    </div>
  );
};

export default TopMenu;