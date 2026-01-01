import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { BASE_URL } from "../../../config/Config";
import PrintSettingsDialog from "../../../PrintSettings/Print.jsx";
import { debounce } from "lodash";
import * as XLSX from 'xlsx';
import "./quotationlist.scss";

import { FaSearch, FaCog, FaTh, FaChartBar, FaFilter, FaWrench, FaDownload, FaBars, FaFileExport, FaTrash, FaEdit, FaStar, FaChevronDown, FaCopy, FaCheckCircle, FaFileInvoiceDollar, FaShoppingCart } from 'react-icons/fa';

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
  const [showDisplayPrefs, setShowDisplayPrefs] = useState(false);
  const [tempVisibleColumns, setTempVisibleColumns] = useState([]);
  const [showPrintSettings, setShowPrintSettings] = useState(false);
  const [selectedQuotation, setSelectedQuotation] = useState(null);
  const [showQuotationDetail, setShowQuotationDetail] = useState(false);

  // initialize visible columns from localStorage or defaults
  const columnOptions = [
    { key: 'customer', label: 'Customer' },
    { key: 'amount', label: 'Amount (₹)' },
    { key: 'valid_till', label: 'Valid Till' },
    { key: 'issued_on', label: 'Issued On' },
    { key: 'issued_by', label: 'Issued by' },
    { key: 'type', label: 'Type' },
    { key: 'executive', label: 'Executive' },
    { key: 'response', label: 'Response' },
    { key: 'last_interaction', label: 'Last Interaction' },
    { key: 'next_action', label: 'Next Action' },
  ];

  const lockedKeys = ['quote_no', 'actions'];

  const defaults = Array.from(new Set([...(lockedKeys || []), ...columnOptions.map((c) => c.key)]));
  const [visibleColumns, setVisibleColumns] = useState(defaults);
  const [selectedOtherMonth, setSelectedOtherMonth] = useState("");
  const [selectedOtherYear, setSelectedOtherYear] = useState(new Date().getFullYear());
  const [showMonthSelector, setShowMonthSelector] = useState(false);
  const [showYearSelector, setShowYearSelector] = useState(false);

  useEffect(() => {
    fetchQuotations();
  }, [page]);

  useEffect(() => {
    try {
      const v = JSON.parse(localStorage.getItem('quotation_visible_columns'));
      if (Array.isArray(v) && v.length) {
        setVisibleColumns(v);
      }
    } catch (e) {
      // keep defaults
    }
  }, []);

  

  // ensure locked columns are always present in visibleColumns
  useEffect(() => {
    if (!visibleColumns) return;
    const missing = lockedKeys.filter((k) => !visibleColumns.includes(k));
    if (missing.length) {
      setVisibleColumns(Array.from(new Set([...(visibleColumns || []), ...missing])));
    }
  }, [visibleColumns]);

  const toggleSelectAll = () => {
    const keys = columnOptions.map((c) => c.key);
    const nonLocked = keys.filter((k) => !lockedKeys.includes(k));
    const allSelected = nonLocked.every((k) => tempVisibleColumns.includes(k));
    // if all non-locked selected -> unselect all non-locked (but keep locked)
    setTempVisibleColumns(allSelected ? [...lockedKeys] : [...lockedKeys, ...nonLocked]);
  };

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

  const handleOpenQuotationDetail = (quotation) => {
    setSelectedQuotation(quotation);
    setShowQuotationDetail(true);
  };

  const getCustomerPhone = (cust) => {
    if (!cust) return '';
    return (
      cust.mobile || cust.phone || cust.phone_number || cust.mobile_number || cust.contact_number || cust.telephone || cust.contact || ''
    );
  };

  const getCustomerEmail = (cust) => {
    if (!cust) return '';
    return cust.email || cust.email_address || cust.contact_email || '';
  };

  const copyToClipboard = async (text) => {
    if (!text) return;
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(text);
      } else {
        const ta = document.createElement('textarea');
        ta.value = text;
        document.body.appendChild(ta);
        ta.select();
        document.execCommand('copy');
        document.body.removeChild(ta);
      }
      // lightweight feedback
      try { window.toastr && window.toastr.success && window.toastr.success('Copied to clipboard'); } catch (e) {}
    } catch (e) {
      console.error('Copy failed', e);
    }
  };

  // Share handlers for the detail modal
  const shareAsPDF = (e) => {
    e.stopPropagation();
    if (!selectedQuotation) return;
    
    const q = selectedQuotation;
    const cust = q.customer || {};
    const branch = q.company_branch || {};
    const items = q.quotation_items || q.items || [];
    const company = q.company || {};
    
    const customerName = cust.title || cust.company_name || `${cust.salutation || ''} ${cust.firstname || ''} ${cust.lastname || ''}`.replace(/\s+/g, ' ').trim();
    
    // billing address (title, gstin, address1/2, city, state, country, pincode)
    const billingTitle = cust.billing_title || cust.title || customerName;
    const billingGSTIN = cust.billing_gstin || cust.gstin || cust.gst_number || '-';
    const billingAddress1 = cust.billing_address_line1 || cust.address_line1 || cust.address1 || cust.billing_address || cust.address || '';
    const billingAddress2 = cust.billing_address_line2 || cust.address_line2 || cust.address2 || '';
    const billingCity = cust.billing_city || cust.city || '';
    const billingState = cust.billing_state || cust.state || '';
    const billingCountry = cust.billing_country || cust.country || 'India';
    const billingPincode = cust.billing_pincode || cust.pincode || '';

    // shipping address (title, gstin, address1/2, city, state, country, pincode)
    const shippingTitle = cust.shipping_title || cust.title || customerName;
    const shippingGSTIN = cust.shipping_gstin || cust.gstin || cust.gst_number || '-';
    const shippingAddress1 = cust.shipping_address_line1 || cust.s_address_line1 || cust.shipping_address || cust.address || '';
    const shippingAddress2 = cust.shipping_address_line2 || cust.s_address_line2 || '';
    const shippingCity = cust.shipping_city || cust.city || '';
    const shippingState = cust.shipping_state || cust.state || '';
    const shippingCountry = cust.shipping_country || cust.country || 'India';
    const shippingPincode = cust.shipping_pincode || cust.pincode || '';
    const custPhone = getCustomerPhone(cust);
    const custEmail = getCustomerEmail(cust);
    
    const companyName = (branch.name || branch.company_name) || company.company_name || 'Canares Automation Pvt Ltd';
    const branchName = branch.name || branch.branch_name || branch.company_branch_name || '';
    const branchGSTIN = branch.gst_number || branch.gstin || company.gst_number || '';
    const branchAddress = branch.address || branch.branch_address || company.address || '';
    const branchCity = branch.city || '';
    const branchState = branch.state || '';
    const branchPincode = branch.pincode || branch.zip || '';
    const companyPhone = branch.phone || company.phone || '';
    const companyEmail = branch.email || company.email || '';
    const companyWebsite = company.website || '';
    
    const bankName = branch.bank_name || company.bank_name || '';
    const bankBranch = branch.bank_branch || company.bank_branch || '';
    const bankBranchAddress = branch.bank_branch_address || company.bank_branch_address || branchAddress || '';
    const accountNo = branch.account_number || company.account_number || '';
    const ifscCode = branch.ifsc_code || company.ifsc_code || '';
    const swiftCode = branch.swift_code || company.swift_code || '';
    
    const termsAndConditions = q.terms_and_conditions || q.terms || q.terms_conditions || q.tnc;
    
    const subtotal = items.reduce((sum, item) => sum + ((item.quantity || 0) * (item.rate || 0)), 0);
    const totalDiscount = items.reduce((sum, item) => {
      const amt = (item.quantity || 0) * (item.rate || 0);
      const disc = (item.discount_percentage || 0) / 100;
      return sum + (amt * disc);
    }, 0);
    const taxableAmount = subtotal - totalDiscount;
    const cgst = (q.cgst_amount || 0);
    const sgst = (q.sgst_amount || 0);
    const igst = (q.igst_amount || 0);
    const totalTax = cgst + sgst + igst;
    const grandTotal = q.grand_total || (taxableAmount + totalTax);
    
    const itemRows = items.map((item, idx) => {
      const itemTotal = (item.quantity || 0) * (item.rate || 0);
      const discountAmt = itemTotal * ((item.discount_percentage || 0) / 100);
      const taxable = itemTotal - discountAmt;
      const itemIGST = (item.igst_amount || 0);
      const finalAmount = taxable + itemIGST;
      
      return `
        <tr>
          <td style="text-align: center;">${idx + 1}</td>
          <td style="text-align: center;">-</td>
          <td>${item.product_name || item.name || item.description || '-'}</td>
          <td>${item.item_code || item.product_code || '-'}</td>
          <td>${item.hsn_code || item.hsn || '-'}</td>
          <td style="text-align: center;">${item.quantity || 0}</td>
          <td>${item.unit || 'Nos'}</td>
          <td style="text-align: right;">${(item.rate || 0).toLocaleString('en-IN', {minimumFractionDigits: 2})}</td>
          <td style="text-align: right;">${(item.discount_percentage || 0).toFixed(2)}%</td>
          <td style="text-align: right;">${discountAmt.toLocaleString('en-IN', {minimumFractionDigits: 2})}</td>
          <td style="text-align: right;">${taxable.toLocaleString('en-IN', {minimumFractionDigits: 2})}</td>
          <td style="text-align: right;">${(item.igst_percentage || 0)}%</td>
          <td style="text-align: right;"><strong>${finalAmount.toLocaleString('en-IN', {minimumFractionDigits: 2})}</strong></td>
        </tr>
      `;
    }).join('');
    
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>Quotation ${q.quotation_number}</title>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { font-family: Arial, sans-serif; font-size: 11px; padding: 20px; color: #000; }
          .doc-title { text-align: center; font-size: 20px; font-weight: bold; margin-bottom: 20px; text-transform: uppercase; border-bottom: 2px solid #000; padding-bottom: 10px; }
          .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 15px; gap: 20px; }
          .branch-details { flex: 1; }
          .branch-details h2 { font-size: 14px; color: #1976d2; margin-bottom: 6px; }
          .branch-details p { font-size: 10px; line-height: 1.5; margin: 2px 0; }
          .quotation-details { flex: 0 0 auto; min-width: 280px; }
          .quotation-details table { width: 100%; font-size: 10px; border-collapse: collapse; }
          .quotation-details td { padding: 4px 8px; border: 1px solid #ddd; }
          .quotation-details td:first-child { font-weight: 600; background: #f5f5f5; white-space: nowrap; width: 40%; }
          .addresses { display: flex; justify-content: space-between; margin-bottom: 15px; gap: 15px; }
          .address-box { flex: 1; border: 1px solid #000; padding: 10px; }
          .address-box h3 { font-size: 11px; font-weight: bold; margin-bottom: 6px; border-bottom: 1px solid #000; padding-bottom: 4px; text-transform: uppercase; }
          .address-box p { font-size: 10px; line-height: 1.6; margin: 3px 0; }
          table.items { width: 100%; border-collapse: collapse; margin-bottom: 15px; font-size: 10px; }
          table.items th, table.items td { border: 1px solid #000; padding: 6px 4px; }
          table.items th { background: #e3f2fd; font-weight: 600; text-align: center; font-size: 9px; }
          table.items td { vertical-align: top; }
          .summary { margin-left: auto; width: 380px; margin-bottom: 15px; }
          .summary table { width: 100%; font-size: 11px; border-collapse: collapse; }
          .summary td { padding: 5px 10px; border: 1px solid #ddd; }
          .summary td:first-child { text-align: left; font-weight: 500; background: #f9f9f9; }
          .summary td:last-child { text-align: right; font-weight: 600; }
          .summary .amount-words { border-top: 2px solid #000; background: #fff3e0; font-style: italic; }
          .summary .grand-total td { background: #e3f2fd; font-weight: bold; font-size: 12px; border-top: 2px solid #000; }
          .bottom-section { display: flex; gap: 15px; margin-bottom: 15px; }
          .terms { flex: 1; border: 1px solid #000; padding: 10px; }
          .terms h3 { font-size: 11px; font-weight: bold; margin-bottom: 6px; text-transform: uppercase; }
          .terms p { font-size: 10px; line-height: 1.6; white-space: pre-line; }
          .bank-details { flex: 1; border: 1px solid #000; padding: 10px; }
          .bank-details h3 { font-size: 11px; font-weight: bold; margin-bottom: 6px; text-transform: uppercase; }
          .bank-details table { width: 100%; font-size: 10px; }
          .bank-details td { padding: 3px 5px; }
          .bank-details td:first-child { font-weight: 600; width: 45%; }
          .footer { text-align: right; margin-top: 30px; padding-top: 10px; border-top: 1px solid #000; }
          .footer p { font-size: 10px; margin: 4px 0; }
          @media print {
            body { padding: 10px; }
            @page { margin: 10mm; }
          }
        </style>
      </head>
      <body>
        <div class="doc-title">QUOTATION</div>

        <div class="header">
          <div class="branch-details">
            <h2>${branchName || companyName}</h2>
            <p>${branchAddress}</p>
            <p>${[branchCity, branchState, branchPincode].filter(Boolean).join(', ')}</p>
            ${branchGSTIN ? `<p><strong>GSTIN:</strong> ${branchGSTIN}</p>` : ''}
            ${companyPhone ? `<p><strong>Phone:</strong> ${companyPhone}</p>` : ''}
            ${companyEmail ? `<p><strong>Email:</strong> ${companyEmail}</p>` : ''}
            ${companyWebsite ? `<p><strong>Website:</strong> ${companyWebsite}</p>` : ''}
          </div>
          <div class="quotation-details">
            <table>
              <tr><td>Quotation No.</td><td>${q.quotation_number || '-'}</td></tr>
              <tr><td>Date</td><td>${q.quotation_date ? new Date(q.quotation_date).toLocaleDateString('en-IN') : new Date().toLocaleDateString('en-IN')}</td></tr>
              <tr><td>Valid Till</td><td>${q.valid_until ? new Date(q.valid_until).toLocaleDateString('en-IN') : '-'}</td></tr>
              <tr><td>Ref.</td><td>${q.reference || q.quotation_number || '-'}</td></tr>
            </table>
          </div>
        </div>

        <div class="addresses">
          <div class="address-box">
            <h3>Billing Address</h3>
            <p><strong>${billingTitle}</strong></p>
            ${billingAddress1 ? `<p>${billingAddress1}</p>` : ''}
            ${billingAddress2 ? `<p>${billingAddress2}</p>` : ''}
            <p>${[billingCity, billingState, billingCountry, billingPincode].filter(Boolean).join(', ')}</p>
            ${billingGSTIN && billingGSTIN !== '-' ? `<p><strong>GSTIN:</strong> ${billingGSTIN}</p>` : ''}
            ${custPhone ? `<p><strong>Phone:</strong> ${custPhone}</p>` : ''}
            ${custEmail ? `<p><strong>Email:</strong> ${custEmail}</p>` : ''}
          </div>
          <div class="address-box">
            <h3>Shipping Address</h3>
            <p><strong>${shippingTitle}</strong></p>
            ${shippingAddress1 ? `<p>${shippingAddress1}</p>` : ''}
            ${shippingAddress2 ? `<p>${shippingAddress2}</p>` : ''}
            <p>${[shippingCity, shippingState, shippingCountry, shippingPincode].filter(Boolean).join(', ')}</p>
            ${shippingGSTIN && shippingGSTIN !== '-' ? `<p><strong>GSTIN:</strong> ${shippingGSTIN}</p>` : ''}
            ${custPhone ? `<p><strong>Phone:</strong> ${custPhone}</p>` : ''}
            ${custEmail ? `<p><strong>Email:</strong> ${custEmail}</p>` : ''}
          </div>
        </div>

        <table class="items">
          <thead>
            <tr>
              <th>No.</th>
              <th>Image</th>
              <th>Item & Description</th>
              <th>Item Code</th>
              <th>HSN / SAC</th>
              <th>Qty</th>
              <th>Unit</th>
              <th>Rate (₹)</th>
              <th>Discount %</th>
              <th>Discount (₹)</th>
              <th>Taxable (₹)</th>
              <th>IGST</th>
              <th>Amount (₹)</th>
            </tr>
          </thead>
          <tbody>
            ${itemRows || '<tr><td colspan="13" style="text-align: center;">No items</td></tr>'}
          </tbody>
        </table>

        <div class="summary">
          <table>
            <tr class="amount-words">
              <td colspan="2"><strong>Total Amount in Words:</strong> Rupees ${numberToWords(grandTotal)} only</td>
            </tr>
            <tr><td>Total Amount before Tax</td><td>₹ ${taxableAmount.toLocaleString('en-IN', {minimumFractionDigits: 2})}</td></tr>
            ${cgst > 0 ? `<tr><td>Add: CGST</td><td>₹ ${cgst.toLocaleString('en-IN', {minimumFractionDigits: 2})}</td></tr>` : ''}
            ${sgst > 0 ? `<tr><td>Add: SGST</td><td>₹ ${sgst.toLocaleString('en-IN', {minimumFractionDigits: 2})}</td></tr>` : ''}
            ${igst > 0 ? `<tr><td>Add: IGST</td><td>₹ ${igst.toLocaleString('en-IN', {minimumFractionDigits: 2})}</td></tr>` : ''}
            <tr class="grand-total"><td>Grand Total</td><td>₹ ${grandTotal.toLocaleString('en-IN', {minimumFractionDigits: 2})}</td></tr>
          </table>
        </div>

        <div class="bottom-section">
          <div class="terms">
            <h3>Terms & Conditions</h3>
            <p>${termsAndConditions}</p>
          </div>
          <div class="bank-details">
            <h3>Bank Details</h3>
            <table>
              <tr><td>Bank Name</td><td>${bankName}</td></tr>
              <tr><td>Account No.</td><td>${accountNo}</td></tr>
              <tr><td>Branch</td><td>${bankBranch}</td></tr>
              <tr><td>Branch Address</td><td>${bankBranchAddress}</td></tr>
              ${ifscCode ? `<tr><td>IFSC</td><td>${ifscCode}</td></tr>` : ''}
              ${swiftCode ? `<tr><td>SWIFT Code</td><td>${swiftCode}</td></tr>` : ''}
            </table>
          </div>
        </div>

        <div class="footer">
          <p style="margin-top: 20px; font-weight: bold;">For ${companyName}</p>
          <p style="margin-top: 30px; border-top: 1px solid #000; display: inline-block; padding-top: 5px; min-width: 150px;">Authorised Signatory</p>
          <p style="margin-top: 10px;"><em>This is a computer generated quotation. E. & O.E.</em></p>
        </div>
      </body>
      </html>
    `;
    
    const w = window.open('', '_blank');
    if (!w) return;
    w.document.open();
    w.document.write(html);
    w.document.close();
    w.focus();
    setTimeout(() => { try { w.print(); } catch (err) {} }, 800);
  };
  
  // Helper function to convert number to words (simplified Indian numbering)
  const numberToWords = (num) => {
    if (!num || num === 0) return 'Zero';
    const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine'];
    const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
    const teens = ['Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
    
    const convertLessThanThousand = (n) => {
      if (n === 0) return '';
      if (n < 10) return ones[n];
      if (n < 20) return teens[n - 10];
      if (n < 100) return tens[Math.floor(n / 10)] + (n % 10 ? ' ' + ones[n % 10] : '');
      return ones[Math.floor(n / 100)] + ' Hundred' + (n % 100 ? ' and ' + convertLessThanThousand(n % 100) : '');
    };
    
    const crore = Math.floor(num / 10000000);
    const lakh = Math.floor((num % 10000000) / 100000);
    const thousand = Math.floor((num % 100000) / 1000);
    const remainder = Math.floor(num % 1000);
    
    let result = '';
    if (crore > 0) result += convertLessThanThousand(crore) + ' Crore ';
    if (lakh > 0) result += convertLessThanThousand(lakh) + ' Lakh ';
    if (thousand > 0) result += convertLessThanThousand(thousand) + ' Thousand ';
    if (remainder > 0) result += convertLessThanThousand(remainder);
    
    return result.trim() || 'Zero';
  };

  // highlight matched search term in a text
  const escapeRegExp = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const renderHighlighted = (text) => {
    if (text === null || text === undefined) return '-';
    const raw = String(text);
    const st = (searchTerm || '').trim();
    if (!st) return raw;
    try {
      const esc = escapeRegExp(st);
      const re = new RegExp(`(${esc})`, 'ig');
      const parts = raw.split(re);
      return parts.map((part, i) => (
        re.test(part) ? <mark key={i} style={{ background: '#eedd45ff' }}>{part}</mark> : <span key={i}>{part}</span>
      ));
    } catch (e) {
      return raw;
    }
  };

  const shareViaWhatsApp = (e) => {
    e.stopPropagation();
    if (!selectedQuotation) return;
    const rawPhone = getCustomerPhone(selectedQuotation.customer) || '';
    const customerName = selectedQuotation.customer?.company_name || selectedQuotation.customer?.firstname || 'Customer';
    if (!rawPhone) {
      alert('Customer phone number not available for WhatsApp');
      return;
    }
    // keep digits only
    let digits = String(rawPhone).replace(/\D/g, '');
    // handle common local formats: 10-digit Indian -> prepend 91, leading 0 -> drop and prepend 91
    if (digits.length === 10) {
      digits = '91' + digits;
    } else if (digits.length === 11 && digits.startsWith('0')) {
      digits = '91' + digits.slice(1);
    }
    if (digits.length < 8) {
      alert('Customer phone number appears invalid for WhatsApp');
      return;
    }

    const msg = `Quotation ${selectedQuotation.quotation_number}\nCustomer: ${customerName}\nAmount: ₹ ${(selectedQuotation.grand_total || 0).toLocaleString('en-IN')}`;
    const url = `https://wa.me/${digits}?text=${encodeURIComponent(msg)}`;
    window.open(url, '_blank');
  };

  const shareViaEmail = (e) => {
    e.stopPropagation();
    if (!selectedQuotation) return;
    const to = selectedQuotation.customer?.email || '';
    const subject = `Quotation ${selectedQuotation.quotation_number}`;
    const body = `Quotation ${selectedQuotation.quotation_number}%0D%0ACustomer: ${selectedQuotation.customer?.company_name || ''}%0D%0AAmount: ₹ ${(selectedQuotation.grand_total || 0).toLocaleString('en-IN')}`;
    const mailto = `mailto:${to}?subject=${encodeURIComponent(subject)}&body=${body}`;
    window.location.href = mailto;
  };

  const printQuotation = (e) => {
    e.stopPropagation();
    shareAsPDF(e);
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
  }, [searchTerm, activeDocType, monthFilter, statusFilter, branchFilter, executiveFilter, selectedOtherMonth, selectedOtherYear]);

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
          } else if (monthFilter === 'Other Month') {
            if (!selectedOtherMonth) return false;
            const [year, month] = selectedOtherMonth.split('-').map(Number);
            return d.getMonth() === month - 1 && d.getFullYear() === year;
          } else if (monthFilter === 'Other Year') {
            if (!selectedOtherYear) return false;
            return d.getFullYear() === Number(selectedOtherYear);
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
  }, [quotations, searchTerm, activeDocType, monthFilter, statusFilter, branchFilter, executiveFilter, selectedOtherMonth, selectedOtherYear]);

  const calculateTotals = () => {
    const list = displayedQuotations.length ? displayedQuotations : quotations;
    const preTax = list.reduce((sum, q) => sum + (q.grand_total || 0), 0);
    const total = preTax; // Adjust if you have tax calculation
    return { preTax, total, count: list.length };
  };

  const handleExport = () => {
    const data = displayedQuotations.map((q) => {
      const row = {};
      if (visibleColumns.includes('quote_no')) row['Quote No.'] = q.quotation_number || '';
      if (visibleColumns.includes('customer')) row['Customer'] = q.customer?.company_name || `${q.customer?.salutation || ''} ${q.customer?.firstname || ''} ${q.customer?.lastname || ''}`.replace(/\s+/g, ' ').trim() || '';
      if (visibleColumns.includes('amount')) row['Amount (₹)'] = q.grand_total || 0;
      if (visibleColumns.includes('valid_till')) row['Valid Till'] = q.valid_until ? new Date(q.valid_until).toLocaleDateString('en-IN') : '';
      if (visibleColumns.includes('issued_on')) row['Issued On'] = q.quotation_date ? new Date(q.quotation_date).toLocaleDateString('en-IN') : '';
      if (visibleColumns.includes('issued_by')) row['Issued by'] = `${q.sales_credit_person?.firstname || ''} ${q.sales_credit_person?.lastname || ''}`.trim() || '';
      if (visibleColumns.includes('type')) row['Type'] = 'Quotation';
      if (visibleColumns.includes('executive')) row['Executive'] = `${q.sales_credit_person?.firstname || ''} ${q.sales_credit_person?.lastname || ''}`.trim() || '';
      if (visibleColumns.includes('response')) row['Response'] = '';
      if (visibleColumns.includes('last_interaction')) row['Last Interaction'] = q.last_interaction ? new Date(q.last_interaction).toLocaleDateString('en-IN') : '';
      if (visibleColumns.includes('next_action')) row['Next Action'] = q.next_action || '';
      return row;
    });

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Quotations');
    XLSX.writeFile(wb, 'quotations.xlsx');
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
            
            <button className="icon-btn" title="Print Settings" onClick={() => setShowPrintSettings(true)}>
              Print Settings
            </button>
            
            <button className="icon-btn square" title="Export to Excel" onClick={handleExport}><FaFileExport /></button>
            <button className="icon-btn square" title="Display Preferences" onClick={() => { setTempVisibleColumns(visibleColumns); setShowDisplayPrefs(true); }}><FaBars /></button>
            <button className="icon-btn square" title="Summary"><FaChartBar /></button>
            <button className="icon-btn square settings" title="Configuration" onClick={() => navigate('/sales-configuration')}><FaCog /></button>
            
            
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
          <option>Other Month</option>
          <option>Other Year</option>
        </select>

        {monthFilter === 'Other Month' && (
          <div style={{ display: 'flex', gap: '10px' }}>
            <select 
              value={selectedOtherMonth} 
              onChange={(e) => setSelectedOtherMonth(e.target.value)}
              style={{ minWidth: '150px' }}
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
              value={selectedOtherYear} 
              onChange={(e) => setSelectedOtherYear(Number(e.target.value))}
              style={{ minWidth: '100px' }}
            >
              {Array.from({ length: 10 }, (_, i) => new Date().getFullYear() - i).map((year) => (
                <option key={year} value={year}>{year}</option>
              ))}
            </select>
          </div>
        )}

        {monthFilter === 'Other Year' && (
          <select 
            value={selectedOtherYear} 
            onChange={(e) => setSelectedOtherYear(Number(e.target.value))}
            style={{ minWidth: '100px' }}
          >
            {Array.from({ length: 10 }, (_, i) => new Date().getFullYear() - i).map((year) => (
              <option key={year} value={year}>{year}</option>
            ))}
          </select>
        )}

        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
          <option>All</option>
          <option>Not Expired</option>
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
              {visibleColumns.includes('quote_no') && <th>Quote No.</th>}
              {visibleColumns.includes('customer') && <th>Customer</th>}
              {visibleColumns.includes('amount') && <th>Amount (₹)</th>}
              {visibleColumns.includes('valid_till') && <th>Valid Till</th>}
              {visibleColumns.includes('issued_on') && <th>Issued On</th>}
              {visibleColumns.includes('issued_by') && <th>Issued by</th>}
              {visibleColumns.includes('type') && <th>Type</th>}
              {visibleColumns.includes('executive') && <th>Executive</th>}
              {visibleColumns.includes('response') && <th>Response</th>}
              {visibleColumns.includes('last_interaction') && <th>Last Interaction</th>}
              {visibleColumns.includes('next_action') && <th>Next Action</th>}
              {visibleColumns.includes('actions') && <th>Actions</th>}
            </tr>
          </thead>
          <tbody>
            {displayedQuotations.map((quotation) => (
              <tr key={quotation.quotation_id} onClick={() => handleOpenQuotationDetail(quotation)} style={{ cursor: 'pointer' }}>
                {visibleColumns.includes('quote_no') && <td>{renderHighlighted(quotation.quotation_number || '')}</td>}
                {visibleColumns.includes('customer') && <td>{renderHighlighted(quotation.customer?.company_name || `${quotation.customer?.salutation || ''} ${quotation.customer?.firstname || ''} ${quotation.customer?.lastname || ''}`.replace(/\s+/g, ' ').trim() || '-')}</td>}
                {visibleColumns.includes('amount') && <td>₹ {(quotation.grand_total || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>}
                {visibleColumns.includes('valid_till') && <td>{quotation.valid_until ? new Date(quotation.valid_until).toLocaleDateString('en-IN') : '-'}</td>}
                {visibleColumns.includes('issued_on') && <td>{quotation.quotation_date ? new Date(quotation.quotation_date).toLocaleDateString('en-IN') : '-'}</td>}
                {visibleColumns.includes('issued_by') && <td>{renderHighlighted(((quotation.sales_credit_person?.firstname || '') + ' ' + (quotation.sales_credit_person?.lastname || '')).trim() || '-')}</td>}
                {visibleColumns.includes('type') && <td>Quotation</td>}
                {visibleColumns.includes('executive') && <td>{renderHighlighted(((quotation.sales_credit_person?.firstname || '') + ' ' + (quotation.sales_credit_person?.lastname || '')).trim() || '-')}</td>}
                {visibleColumns.includes('response') && <td>-</td>}
                {visibleColumns.includes('last_interaction') && <td>{quotation.last_interaction ? new Date(quotation.last_interaction).toLocaleDateString('en-IN') : '-'}</td>}
                {visibleColumns.includes('next_action') && <td>{quotation.next_action || '-'}</td>}
                {visibleColumns.includes('actions') && <td onClick={(e) => e.stopPropagation()}>
                  <FaEdit onClick={() => navigate(`/quotation/${quotation.quotation_id}`)} style={{ cursor: 'pointer', marginRight: '10px' }} />
                  <FaTrash onClick={() => handleDelete(quotation.quotation_id)} style={{ cursor: 'pointer' }} />
                </td>}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showDisplayPrefs && (
        <div className="display-prefs-overlay">
          <div className="display-prefs-modal">
            <h3>Display Preferences</h3>
            <div className="prefs-list">
              <label className="pref-item pref-select-all" style={{ gridColumn: '1 / -1' }}>
                <input
                  type="checkbox"
                  checked={columnOptions.filter(c => !lockedKeys.includes(c.key)).every((c) => tempVisibleColumns.includes(c.key))}
                  onChange={toggleSelectAll}
                />
                <span style={{ fontWeight: 600 }}>Select All</span>
              </label>

              {columnOptions.map((c) => (
                <label key={c.key} className="pref-item">
                  <input
                    type="checkbox"
                    checked={lockedKeys.includes(c.key) ? true : tempVisibleColumns.includes(c.key)}
                    disabled={lockedKeys.includes(c.key)}
                    onChange={() => {
                      if (lockedKeys.includes(c.key)) return;
                      if (tempVisibleColumns.includes(c.key)) {
                        setTempVisibleColumns(tempVisibleColumns.filter((x) => x !== c.key));
                      } else {
                        setTempVisibleColumns([...tempVisibleColumns, c.key]);
                      }
                    }}
                  />
                  <span>{c.label}</span>
                </label>
              ))}
            </div>
            <div className="prefs-actions">
              <button className="btn secondary" onClick={() => setShowDisplayPrefs(false)}>Cancel</button>
              <button className="btn primary" onClick={() => {
                const final = Array.from(new Set([...(tempVisibleColumns || []), ...lockedKeys]));
                setVisibleColumns(final);
                try { localStorage.setItem('quotation_visible_columns', JSON.stringify(final)); } catch (e) {}
                setShowDisplayPrefs(false);
              }}>Save</button>
            </div>
          </div>
        </div>
      )}

      {showPrintSettings && (
        <PrintSettingsDialog onClose={() => setShowPrintSettings(false)} />
      )}

      {showQuotationDetail && selectedQuotation && (
        <div className="quotation-detail-overlay">
          <div className="quotation-detail-modal">
            <button className="close-btn" onClick={() => setShowQuotationDetail(false)}>×</button>
            
            <div className="detail-header">
              <div className="header-title">
                <h2>{selectedQuotation.customer?.company_name || `${selectedQuotation.customer?.salutation || ''} ${selectedQuotation.customer?.firstname || ''} ${selectedQuotation.customer?.lastname || ''}`.replace(/\s+/g, ' ').trim()}</h2>
                <span className="quote-number">{selectedQuotation.quotation_number}</span>
              </div>
              <select
                className="status-badge-select"
                value={selectedQuotation.status || 'Not Expired'}
                onChange={(e) => setSelectedQuotation(prev => ({ ...(prev || {}), status: e.target.value }))}
                style={{ background: (selectedQuotation.status === 'Open') ? '#e8f5e9' : '#fff3e0', color: (selectedQuotation.status === 'Open') ? '#2e7d32' : '#e65100' }}
              >
                <option value="Not Expired">Not Expired</option>
                <option value="Rejected">Rejected</option>
                <option value="Converted">Converted</option>
                <option value="Cancelled">Cancelled</option>
                <option value="Replaced">Replaced</option>
              </select>
            </div>

            <div className="detail-meta">
              <span>{new Date().toLocaleDateString('en-IN')}</span>
              <span>•</span>
              <span>{selectedQuotation.sales_credit_person?.firstname} {selectedQuotation.sales_credit_person?.lastname || ''}</span>
            </div>

            <div className="detail-content">
              <div className="section contact-details">
                <h4>Contact Details</h4>
                <div className="detail-row">
                  <span className="label">Phone:</span>
                  {
                    (() => {
                      const phone = getCustomerPhone(selectedQuotation.customer);
                      return (
                        <span className="value">
                          {phone || '-'}
                          {phone ? (
                            <FaCopy onClick={(e) => { e.stopPropagation(); copyToClipboard(phone); }} style={{ cursor: 'pointer', marginLeft: 8 }} title="Copy phone" />
                          ) : null}
                        </span>
                      );
                    })()
                  }
                </div>
                <div className="detail-row">
                  <span className="label">Email:</span>
                  {
                    (() => {
                      const email = getCustomerEmail(selectedQuotation.customer);
                      return (
                        <span className="value">
                          {email || '-'}
                          {email ? (
                            <FaCopy onClick={(e) => { e.stopPropagation(); copyToClipboard(email); }} style={{ cursor: 'pointer', marginLeft: 8 }} title="Copy email" />
                          ) : null}
                        </span>
                      );
                    })()
                  }
                </div>
              </div>

              <div className="section financials">
                <h4>Financials</h4>
                <div className="detail-row">
                  <span className="label">Pre-Tax ₹:</span>
                  <span className="value">{((selectedQuotation.grand_total || 0) * (1 - (selectedQuotation.tax_percentage || 0) / 100)).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                </div>
                <div className="detail-row total">
                  <span className="label">Amount ₹:</span>
                  <span className="value">{(selectedQuotation.grand_total || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                </div>
              </div>
            </div>

            <div className="detail-actions">
              <button className="action-btn edit" onClick={() => { navigate(`/quotation/${selectedQuotation.quotation_id}`); setShowQuotationDetail(false); }} title="Edit">
                <FaEdit />
                <span>Edit</span>
              </button>

              <button className="action-btn delete" onClick={() => { handleDelete(selectedQuotation.quotation_id); setShowQuotationDetail(false); }} title="Delete">
                <FaTrash />
                <span>Delete</span>
              </button>

              <button className="action-btn review" title="Review">
                <FaCheckCircle />
                <span>Review</span>
              </button>

              <button className="action-btn invoice" title="Invoice">
                <FaFileInvoiceDollar />
                <span>Invoice</span>
              </button>

              <button className="action-btn order" title="Create Order">
                <FaShoppingCart />
                <span>Order</span>
              </button>
            </div>

            <div className="detail-share">
              <span className="share-label">Share</span>
              <div className="share-buttons">
                <button className="share-btn pdf" onClick={(e) => shareAsPDF(e)}>PDF</button>
                <button className="share-btn whatsapp" onClick={(e) => shareViaWhatsApp(e)}>WhatsApp</button>
                <button className="share-btn email" onClick={(e) => shareViaEmail(e)}>Email</button>
                <button className="share-btn print" onClick={(e) => printQuotation(e)}>Print</button>
              </div>
            </div>
          </div>
        </div>
      )}

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
