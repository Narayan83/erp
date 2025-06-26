import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaSearch, FaStar, FaChartLine, FaShoppingCart, FaFileInvoiceDollar, FaFileAlt, FaBalanceScale, FaChartBar, FaClipboardList, FaBoxes, FaHandshake, FaFileInvoice, FaReceipt } from 'react-icons/fa';
import './_account.scss';

const AccountsDashboard = () => {
  const navigate = useNavigate();
  const [hideZeroes, setHideZeroes] = useState(false);
  
  const ledgerGroups = [
    { name: 'Current Assets', value: '1,22,500.00 Cr' },
    { name: 'Fixed Assets', value: '0.00 Db' },
    { name: 'Equity', value: '0.00 Db' },
    { name: 'Long Term Liabilities', value: '0.00 Db' },
    { name: 'Short Term Liabilities', value: '0.00 Db' },
    { name: 'Direct Income', value: '0.00 Db' },
    { name: 'Indirect Income', value: '0.00 Db' },
    { name: 'Sales', value: '0.00 Db' },
    { name: 'Direct Expense', value: '0.00 Db' },
    { name: 'Indirect Expense', value: '0.00 Db' },
    { name: 'Purchase', value: '1,22,500.00 Db' },
  ];

  const handleReportsClick = () => {
    navigate('/reports');
  };

  return (
    <div className="accounts-dashboard">
      <div className="top-bar">
          <h1>Accounts</h1>
        <select className="year-select">
          <option>FY 2025-2026</option>
          <option>FY 2024-2025</option>
          <option>FY 2023-2024</option>
          <option>All Year</option>
        </select>
        <div className="action-buttons">
          <button className="entry-btn">+ Enter Voucher</button>
          <button className="purchase-btn"><FaShoppingCart /> Purchases</button>
          <button className="sales-btn"><FaFileInvoiceDollar /> Sales</button>
          <button className="report-btn" title="Reports" onClick={handleReportsClick}><FaChartLine /></button>
        </div>
      </div>

      <div className="dashboard-content">
        <div className="left-column">
          <div className="header">
            <h2>Groups & Ledgers</h2>
            <div className="controls">
              <label>
                <input
                  type="checkbox"
                  checked={hideZeroes}
                  onChange={(e) => setHideZeroes(e.target.checked)}
                />
                Hide zeroes
              </label>
              <button className="btn-add" title='Create Sub Group'>+</button>
            </div>
          </div>

          <div className="ledger-list">
            {ledgerGroups.map((group) => (
              <div key={group.name} className="ledger-item">
                <span className="name">{group.name}</span>
                <span className="value">{group.value}</span>
              </div>
            ))}
          </div>

          <button className="create-ledger">Create Sub-Group</button>
        </div>

        <div className="right-column">
          <div className="favourite-ledgers">
            <h2>Favourite Ledgers</h2>
            <div className="instructions">
              <p>Click<FaStar/>next to the name of a ledger to mark it as favourite.</p>
            </div>
              <button className="find-btn"><FaSearch/> Find Ledger</button>
          </div>

          <div className="quick-access">
            <h2>Quick Access</h2>
            <div className="button-grid">
              <button className="btn-blue"><FaBalanceScale /> Balance Sheet</button>
              <button className="btn-blue"><FaChartBar /> Profit & Loss</button>
              <button className="btn-blue"><FaClipboardList /> Trial Balance</button>
              <button className="btn-green"><FaFileAlt /> GST Ledgers</button>
              <button className="btn-green"><FaHandshake /> Reconciliation</button>
              <button className="btn-green"><FaBoxes /> Stock Value</button>
              <button className="btn-green"><FaShoppingCart /> Purchase Orders</button>
              <button className="btn-green"><FaFileInvoice /> Credit Notes</button>
              <button className="btn-green"><FaReceipt /> Debit Notes</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AccountsDashboard;
