import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { BASE_URL } from "../../../config/Config";
import { debounce } from "lodash";
import "./quotationlist.scss";

import { 
  FaSearch, FaCog, FaTh, FaChartBar, 
  FaFilter, FaWrench, FaDownload, FaBars, FaFileExport,
  FaTrash, FaEdit, FaStar, FaChevronDown
} from 'react-icons/fa';

const QuotationList = () => {
  const navigate = useNavigate();
  const [quotations, setQuotations] = useState([]);
  const [displayedQuotations, setDisplayedQuotations] = useState([]);
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  
  const [searchTerm, setSearchTerm] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [typeFilter, setTypeFilter] = useState("All");
  const [activeDocType, setActiveDocType] = useState("All");
  const [monthFilter, setMonthFilter] = useState("This Month");
  const [statusFilter, setStatusFilter] = useState("All");
  const [branchFilter, setBranchFilter] = useState("All Branches");
  const [executiveFilter, setExecutiveFilter] = useState("All Executives");
  const [branches, setBranches] = useState([]);
  const [executives, setExecutives] = useState([]);

  useEffect(() => {
    fetchQuotations();
  }, [page]);

  // Refetch quotations when component mounts or when returning from edit/create
  useEffect(() => {
    setPage(1); // Reset to first page
    fetchQuotations();
  }, []);

  const fetchQuotations = async () => {
    try {
      const res = await axios.get(`${BASE_URL}/api/quotations`, {
        params: { page, limit },
      });
      setQuotations(res.data.data || []);
      // initialize displayed list when new page data arrives
      setDisplayedQuotations(res.data.data || []);
    } catch (error) {
      console.error("Failed to fetch quotations", error);
    }
  };

  // Fetch branches and non-head employees for the filters
  useEffect(() => {
    const fetchOptions = async () => {
      try {
        // branches
        try {
          const bRes = await axios.get(`${BASE_URL}/api/company-branches?limit=1000`);
          const bData = bRes.data && bRes.data.data ? bRes.data.data : bRes.data || [];
          const mapped = Array.isArray(bData)
            ? bData.map((b) => ({ id: b.id || b.ID || b.IDs, name: b.name || b.Name || b.company_branch_name || b.company_branch || '' }))
            : [];
          setBranches(mapped);
        } catch (e) {
          console.error('Failed to fetch branches', e);
          setBranches([]);
        }

        // executives (non-head employees)
        try {
          const eRes = await axios.get(`${BASE_URL}/api/employees/non-heads`);
          const eData = eRes.data && eRes.data.data ? eRes.data.data : eRes.data || [];
          setExecutives(Array.isArray(eData) ? eData : []);
        } catch (e) {
          // fallback to users endpoint filtered by employee
          try {
            const fu = await axios.get(`${BASE_URL}/api/users`, { params: { page: 1, limit: 1000, user_type: 'employee' } });
            const ud = fu.data && fu.data.data ? fu.data.data : fu.data || [];
            setExecutives(Array.isArray(ud) ? ud : []);
          } catch (err) {
            console.error('Failed to fetch executives', err);
            setExecutives([]);
          }
        }
      } catch (err) {
        console.error('Failed to fetch filter options', err);
      }
    };

    fetchOptions();
  }, []);

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure to delete this quotation?")) {
      await axios.delete(`${BASE_URL}/api/quotations/${id}`);
      fetchQuotations();
    }
  };

  // Debounce the search input so we don't re-filter on every keystroke
  useEffect(() => {
    const handler = debounce(() => {
      setSearchTerm(searchInput);
    }, 400);
    handler();
    return () => handler.cancel && handler.cancel();
  }, [searchInput]);

  // Reset to first page when filters/search change
  useEffect(() => {
    setPage(1);
  }, [searchTerm, activeDocType, monthFilter, statusFilter, branchFilter, executiveFilter]);

  // Apply client-side filters to the fetched quotations
  useEffect(() => {
    const applyFilters = () => {
      let filtered = (quotations || []).slice();
      const st = (searchTerm || '').trim().toLowerCase();

      if (st) {
        filtered = filtered.filter((q) => {
          const company = (q.customer?.company_name || '').toLowerCase();
          const person = (`${q.customer?.salutation || ''} ${q.customer?.firstname || ''} ${q.customer?.lastname || ''}`).toLowerCase();
          const number = (q.quotation_number || '').toLowerCase();
          const exec = (`${q.sales_credit_person?.firstname || ''} ${q.sales_credit_person?.lastname || ''}`).toLowerCase();
          return company.includes(st) || person.includes(st) || number.includes(st) || exec.includes(st);
        });
      }

      if (activeDocType && activeDocType !== 'All') {
        filtered = filtered.filter((q) => {
          if (activeDocType === 'Quotation') {
            return q.document_type === 'Quotation' || q.type === 'Quotation' || !q.is_proforma;
          }
          if (activeDocType === 'Proforma Invoices') {
            return q.document_type === 'Proforma Invoices' || q.type === 'Proforma Invoices' || q.is_proforma;
          }
          return true;
        });
      }

      if (statusFilter && statusFilter !== 'All') {
        filtered = filtered.filter((q) => (q.status || '').toLowerCase() === statusFilter.toLowerCase());
      }

      if (monthFilter) {
        const now = new Date();
        filtered = filtered.filter((q) => {
          const d = q.quotation_date ? new Date(q.quotation_date) : null;
          if (!d) return false;
          if (monthFilter === 'This Month') {
            return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
          } else if (monthFilter === 'Last Month') {
            const last = new Date(now.getFullYear(), now.getMonth() - 1, 1);
            return d.getMonth() === last.getMonth() && d.getFullYear() === last.getFullYear();
          } else if (monthFilter === 'This Year') {
            return d.getFullYear() === now.getFullYear();
          }
          return true;
        });
      }

      if (branchFilter && branchFilter !== 'All Branches') {
        filtered = filtered.filter((q) => {
          const qBranchId = q.branch_id || q.company_branch_id || (q.branch && (q.branch.id || q.branch.ID));
          return String(qBranchId) === String(branchFilter);
        });
      }

      if (executiveFilter && executiveFilter !== 'All Executives') {
        filtered = filtered.filter((q) => {
          const qExecId = q.sales_credit_person_id || (q.sales_credit_person && (q.sales_credit_person.id || q.sales_credit_person.ID));
          return String(qExecId) === String(executiveFilter);
        });
      }

      setDisplayedQuotations(filtered);
    };

    applyFilters();
  }, [quotations, searchTerm, activeDocType, monthFilter, statusFilter, branchFilter, executiveFilter]);

  const calculateTotals = () => {
    const list = displayedQuotations.length ? displayedQuotations : quotations;
    const preTax = list.reduce((sum, q) => sum + (q.grand_total || 0), 0);
    const total = preTax; // Adjust if you have tax calculation
    return { preTax, total, count: list.length };
  };

  const { preTax, total, count } = calculateTotals();

  return (
    <div className="quotation-list">
      <div className="quotation-header">
        <h2>Quotations</h2>
        
        <div className="header-right">
          <div className="stats">
            <span className="stat-badge count">Count: {count}</span>
            <span className="stat-badge pretax">Pre-Tax: ₹ {preTax.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
            <span className="stat-badge total">Total: ₹ {total.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
          </div>
          
          <div className="header-actions">
              <div className="search-box">
                <input
                  type="text"
                  placeholder="Search"
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                />
                <span className="search-icon"><FaSearch /></span>
              </div>
            
            <button className="icon-btn" title="Print Settings">
              Print Settings
            </button>
            
            <button className="icon-btn square" title="Export to Excel"><FaFileExport /></button>
            <button className="icon-btn square" title="Display Preferences"><FaBars /></button>
            <button className="icon-btn square" title="Summary"><FaChartBar /></button>
            <button className="icon-btn square settings" title="Configuration"><FaCog /></button>
            
            
          </div>
        </div>
      </div>

      <div className="filters-row">
        <div className="doc-type-buttons">
          <button className={activeDocType === "All" ? "active" : ""} onClick={() => setActiveDocType("All")}>All</button>
          <button className={activeDocType === "Quotation" ? "active" : ""} onClick={() => setActiveDocType("Quotation")}>Quotation</button>
          <button className={activeDocType === "Proforma Invoices" ? "active" : ""} onClick={() => setActiveDocType("Proforma Invoices")}>Proforma Invoices</button>
        </div>

        <select value={monthFilter} onChange={(e) => setMonthFilter(e.target.value)}>
          <option>This Month</option>
          <option>Last Month</option>
          <option>This Year</option>
        </select>

        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
          <option>All</option>
          <option>Open</option>
          <option>Expired</option>
          <option>Rejected</option>
          <option>Converted</option>
          <option>Cancelled</option>
          <option>Replaced</option>
        </select>

        <select value={branchFilter} onChange={(e) => setBranchFilter(e.target.value)}>
          <option>All Branches</option>
          {branches && branches.map((b) => (
            <option key={b.id || b.name} value={b.id}>{b.name}{b.city ? ` - ${b.city}` : ''}</option>
          ))}
        </select>

        <select value={executiveFilter} onChange={(e) => setExecutiveFilter(e.target.value)}>
          <option>All Executives</option>
          {executives && executives.map((emp) => {
            const name = `${emp.firstname || emp.first_name || emp.FirstName || ''} ${emp.lastname || emp.last_name || emp.LastName || ''}`.trim();
            return <option key={emp.id || name} value={emp.id}>{name || (emp.username || emp.email || 'Unknown')}</option>;
          })}
        </select>
        <div className="filters-right">
          <button className="btn-create" onClick={() => navigate('/quotation')}>+ Create Quotation</button>
        </div>
      </div>

      <div className="table-container">
        <table className="quotation-table">
          <thead>
            <tr>
              <th>Quote No.</th>
              <th>Customer</th>
              <th>Amount (₹)</th>
              <th>Valid Till</th>
              <th>Issued On</th>
              <th>Issued by</th>
              <th>Type</th>
              <th>Executive</th>
              <th>Response</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {displayedQuotations.map((quotation) => (
              <tr key={quotation.quotation_id}>
                <td>{quotation.quotation_number}</td>
                <td>
                  {quotation.customer?.company_name || `${quotation.customer?.salutation || ''} ${quotation.customer?.firstname || ''} ${quotation.customer?.lastname || ''}`.replace(/\s+/g, ' ').trim() || '-'}
                </td>
                <td>₹ {(quotation.grand_total || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                <td>{quotation.valid_until ? new Date(quotation.valid_until).toLocaleDateString('en-IN') : '-'}</td>
                <td>{quotation.quotation_date ? new Date(quotation.quotation_date).toLocaleDateString('en-IN') : '-'}</td>
                <td>{quotation.sales_credit_person?.firstname} {quotation.sales_credit_person?.lastname || '-'}</td>
                <td>Quotation</td>
                <td>{quotation.sales_credit_person?.firstname} {quotation.sales_credit_person?.lastname || '-'}</td>
                <td>-</td>
                <td>
                  <FaEdit onClick={() => navigate(`/quotation/${quotation.quotation_id}`)} style={{ cursor: 'pointer', marginRight: '10px' }} />
                  <FaTrash onClick={() => handleDelete(quotation.quotation_id)} style={{ cursor: 'pointer' }} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="pagination">
        <button disabled={page === 1} onClick={() => setPage(page - 1)}>
          Previous
        </button>
        <span>Page {page}</span>
        <button onClick={() => setPage(page + 1)}>Next</button>
      </div>
    </div>
  );
};

export default QuotationList;
