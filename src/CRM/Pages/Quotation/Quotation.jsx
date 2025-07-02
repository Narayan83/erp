// QuotationForm.jsx
import React, { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import "./_quotation.scss";

/**
 * ⚙️  QuotationForm
 * --------------------------------------------------
 * A self‑contained React component (no external state libs)
 * for creating & editing Sales Quotations.
 *
 * The form is divided into
 *  1️⃣  Quotation Header  (meta data)
 *  2️⃣  Quotation Items   (line items – add/remove/edit)
 *  3️⃣  Summary & Actions  (totals + buttons)
 *
 * All numeric inputs auto‑recalculate totals.
 * Styling is handled by the companion SCSS file.
 */
const EMPTY_ITEM = {
  productId: "",
  description: "",
  quantity: 1,
  units: "pcs",
  rate: 0,
  discount: 0, // absolute value
  discountPercent: 0,
  taxPercent: 0,
  taxAmount: 0,
  lineTotal: 0,
  marketingPersonId: "",
  shippingCode: "",
  picture: null,
  gstApplicable: true,
  leadTime: "",
  salesCredit: "",
  hide: false,
  files: [],
  copyFrom: "",
  createdBy: "",
  createdAt: "",
  updatedAt: "",
  expireDate: "",
  billingAddress: "",
  shippingAddress: "",
  terms: "",
  reference: "",
  note: "",
  currency: "INR",
};

export default function QuotationForm() {
  /** *********************************
   *  Local State
   ********************************** */
  const [header, setHeader] = useState({
    quotationNumber: "",
    quotationDate: new Date().toISOString().slice(0, 10),
    customerId: "",
    validUntil: "",
    status: "Draft",
    currency: "INR",
    exchangeRate: 1, // 1 "currency" = x INR (base)
    billingAddress: "",
    shippingAddress: "",
    terms: "",
    reference: "",
    note: "",
    roundOff: 0,
    discountPercent: 0,
    revised: false,
    revisedNo: "",
    approval: "",
    canceled: "",
    converted: false,
    marketingPersonId: "",
    shippingCode: "",
    gstApplicable: true,
    leadTime: "",
    salesCredit: "",
    files: [],
    picture: null,
    hide: false,
    // Simulate admin for bank details
    isAdmin: true,
    createdBy: "Admin", // Simulated
    createdAt: new Date().toLocaleString(),
    updatedAt: new Date().toLocaleString(),
    copyFrom: "",
  });

  const [items, setItems] = useState([EMPTY_ITEM]);
  const [summary, setSummary] = useState({
    subTotal: 0,
    discountTotal: 0,
    taxTotal: 0,
    grandTotal: 0,
  });
  const [saved, setSaved] = useState(false);
  const fileInputRef = useRef();

  /** *********************************
   *  Derived Values
   ********************************** */
  // Calculate summary only, do not update items in useEffect
  useEffect(() => {
    // Calculate summary based on current items
    let sub = 0, disc = 0, tax = 0;
    items.forEach((item) => {
      const discountedRate = item.rate - item.discount;
      const lineTotalBeforeTax = discountedRate * item.quantity;
      const taxAmt = (lineTotalBeforeTax * item.taxPercent) / 100;
      sub += item.rate * item.quantity;
      disc += item.discount * item.quantity;
      tax += taxAmt;
    });
    let percentDisc = header.discountPercent
      ? (sub * header.discountPercent) / 100
      : 0;
    disc += percentDisc;
    const grand = sub - disc + tax + Number(header.roundOff || 0);
    setSummary({
      subTotal: sub,
      discountTotal: disc,
      taxTotal: tax,
      grandTotal: grand,
    });
  }, [items, header.roundOff, header.discountPercent]);

  // Add effect to update updatedAt on any change
  useEffect(() => {
    setHeader((prev) => ({ ...prev, updatedAt: new Date().toLocaleString() }));
  }, [items, summary, header.quotationNumber, header.customerId, header.status]);

  /** *********************************
   *  Helpers
   ********************************** */
  const handleHeaderChange = (e) => {
    const { name, value, type, checked, files } = e.target;
    if (type === "checkbox") {
      setHeader((prev) => ({ ...prev, [name]: checked }));
    } else if (type === "file") {
      setHeader((prev) => ({ ...prev, files: files ? Array.from(files) : [] }));
    } else {
      setHeader((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleItemChange = (index, e) => {
    const { name, value, type, checked, files } = e.target;
    setItems((prev) => {
      const copy = [...prev];
      if (type === "checkbox") {
        copy[index] = { ...copy[index], [name]: checked };
      } else if (type === "file") {
        copy[index] = { ...copy[index], files: files ? Array.from(files) : [] };
      } else if (name === "description" || name === "units" || name === "marketingPersonId" || name === "shippingCode" || name === "leadTime" || name === "salesCredit") {
        copy[index] = { ...copy[index], [name]: value };
      } else {
        copy[index] = { ...copy[index], [name]: Number(value) };
      }
      return copy;
    });
  };

  const handlePictureChange = (index, e) => {
    const file = e.target.files[0];
    setItems((prev) => {
      const copy = [...prev];
      copy[index] = { ...copy[index], picture: file };
      return copy;
    });
  };

  const addItem = () => setItems((prev) => [...prev, EMPTY_ITEM]);
  const removeItem = (idx) => setItems((prev) => prev.filter((_, i) => i !== idx));

  // Export to CSV (Excel)
  const handleExport = () => {
    let csv = "Description,Qty,Unit,Rate,Discount,Discount %,Tax %,Tax Amt,Line Total\n";
    items.forEach((item) => {
      csv += [
        item.description,
        item.quantity,
        item.units,
        item.rate,
        item.discount,
        item.discountPercent,
        item.taxPercent,
        item.taxAmount,
        item.lineTotal,
      ].join(",") + "\n";
    });
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "quotation_items.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  /** *********************************
   *  Submit
   ********************************** */
  const handleSave = () => {
    setSaved(true);
    // For demo purposes we'll log. Replace with API call.
    console.table(items);
    console.log({ header, summary });
    alert("Quotation saved successfully!");
  };

  const handleEdit = () => setSaved(false);
  const handleDelete = () => {
    setSaved(false);
    setHeader({
      quotationNumber: "",
      quotationDate: new Date().toISOString().slice(0, 10),
      customerId: "",
      validUntil: "",
      status: "Draft",
      currency: "INR",
      exchangeRate: 1,
      billingAddress: "",
      shippingAddress: "",
      terms: "",
      reference: "",
      note: "",
      roundOff: 0,
      discountPercent: 0,
      revised: false,
      revisedNo: "",
      approval: "",
      canceled: "",
      converted: false,
      marketingPersonId: "",
      shippingCode: "",
      gstApplicable: true,
      leadTime: "",
      salesCredit: "",
      files: [],
      picture: null,
      hide: false,
      isAdmin: true,
      createdBy: "Admin", // Simulated
      createdAt: new Date().toLocaleString(),
      updatedAt: new Date().toLocaleString(),
      copyFrom: "",
    });
    setItems([EMPTY_ITEM]);
    setSummary({
      subTotal: 0,
      discountTotal: 0,
      taxTotal: 0,
      grandTotal: 0,
    });
  };

  // Helper to get calculated values for display
  const getItemCalculated = (item) => {
    const discountedRate = item.rate - item.discount;
    const lineTotalBeforeTax = discountedRate * item.quantity;
    const taxAmt = (lineTotalBeforeTax * item.taxPercent) / 100;
    return {
      ...item,
      taxAmount: taxAmt,
      lineTotal: lineTotalBeforeTax + taxAmt,
    };
  };

  /** *********************************
   *  UI
   ********************************** */
  return (
    <div className="quotation-form">
      {/* Navigation */}
      <div style={{marginBottom: 16}}>
        <Link to="/quotation/test">Go to Quotation Test Page</Link>
      </div>
      {/* 1️⃣ Header */}
      <section className="q-header card">
        <div className="section-title">
          <h2>Quotation</h2>
          <span className="status-badge">{header.status}</span>
        </div>
        <div className="meta-row">
          <span>Created By: <b>{header.createdBy}</b></span>
          <span>Created At: <b>{header.createdAt}</b></span>
          <span>Updated At: <b>{header.updatedAt}</b></span>
        </div>
        <div className="grid">
          <label>
            No.
            <input name="quotationNumber" value={header.quotationNumber} onChange={handleHeaderChange} placeholder="Auto-generated or manual" />
          </label>
          <label>
            Date
            <input type="date" name="quotationDate" value={header.quotationDate} onChange={handleHeaderChange} />
          </label>
          <label>
            Customer ID
            <input name="customerId" value={header.customerId} onChange={handleHeaderChange} />
          </label>
          <label>
            Valid Until
            <input type="date" name="validUntil" value={header.validUntil} onChange={handleHeaderChange} />
          </label>
          <label>
            Copy From
            <input name="copyFrom" value={header.copyFrom} onChange={handleHeaderChange} placeholder="Earlier Quotation No." />
          </label>
          <label>
            Currency
            <select name="currency" value={header.currency} onChange={handleHeaderChange}>
              <option value="INR">INR</option>
              <option value="USD">USD</option>
              <option value="EUR">EUR</option>
            </select>
          </label>
          <label>
            Exchange Rate
            <input type="number" step="0.01" name="exchangeRate" value={header.exchangeRate} onChange={handleHeaderChange} placeholder="e.g. 1 USD = 85 INR" />
          </label>
          <label>
            Marketing Person ID
            <input name="marketingPersonId" value={header.marketingPersonId} onChange={handleHeaderChange} />
          </label>
          <label>
            Discount %
            <input type="number" step="0.01" name="discountPercent" value={header.discountPercent} onChange={handleHeaderChange} />
          </label>
          <label>
            Revised
            <input type="checkbox" name="revised" checked={header.revised} onChange={handleHeaderChange} />
          </label>
          {header.revised && (
            <label>
              Revised No
              <input name="revisedNo" value={header.revisedNo} onChange={handleHeaderChange} />
            </label>
          )}
          <label>
            Approval
            <input name="approval" value={header.approval} onChange={handleHeaderChange} />
          </label>
          <label>
            Canceled (Reason)
            <input name="canceled" value={header.canceled} onChange={handleHeaderChange} />
          </label>
          <label>
            Shipping Code
            <input name="shippingCode" value={header.shippingCode} onChange={handleHeaderChange} />
          </label>
          <label>
            GST Applicable
            <input type="checkbox" name="gstApplicable" checked={header.gstApplicable} onChange={handleHeaderChange} />
          </label>
          <label>
            Lead Time
            <input name="leadTime" value={header.leadTime} onChange={handleHeaderChange} />
          </label>
          <label>
            Sales Credit
            <input name="salesCredit" value={header.salesCredit} onChange={handleHeaderChange} />
          </label>
          <label>
            Upload Files
            <input type="file" multiple onChange={handleHeaderChange} />
          </label>
          <label>
            Picture
            <input type="file" accept="image/*" onChange={(e) => setHeader((prev) => ({ ...prev, picture: e.target.files[0] }))} />
          </label>
          <label>
            Hide
            <input type="checkbox" name="hide" checked={header.hide} onChange={handleHeaderChange} />
          </label>
          {header.isAdmin && (
            <label>
              Bank Details
              <input name="bankDetails" value={header.bankDetails} onChange={handleHeaderChange} />
            </label>
          )}
          <label>
            Billing Address
            <input name="billingAddress" value={header.billingAddress} onChange={handleHeaderChange} />
          </label>
          <label>
            Shipping Address
            <input name="shippingAddress" value={header.shippingAddress} onChange={handleHeaderChange} />
          </label>
          <label>
            Terms &amp; Conditions
            <input name="terms" value={header.terms} onChange={handleHeaderChange} />
          </label>
          <label>
            Reference
            <input name="reference" value={header.reference} onChange={handleHeaderChange} />
          </label>
          <label>
            Note
            <input name="note" value={header.note} onChange={handleHeaderChange} />
          </label>
        </div>
      </section>

      {/* 2️⃣ Items */}
      <section className="q-items card">
        <div className="items-header">
          <h3>Items</h3>
          <button type="button" onClick={addItem} className="btn add">
            + Add Item
          </button>
        </div>
        <table>
          <thead>
            <tr>
              <th>#</th>
              <th>Marketing Person</th>
              <th>Copy From</th>
              <th>Product ID</th>
              <th>Description</th>
              <th>Qty</th>
              <th>Unit</th>
              <th>Rate</th>
              <th>Discount</th>
              <th>Discount %</th>
              <th>Tax %</th>
              <th>Tax Amt</th>
              <th>Line Total</th>
              <th>Quotation Date</th>
              <th>Expire Date</th>
              <th>Billing Address</th>
              <th>Shipping Address</th>
              <th>Terms</th>
              <th>Reference</th>
              <th>Bank Details</th>
              <th>Note</th>
              <th>Currency</th>
              <th>Shipping Code</th>
              <th>Picture</th>
              <th>GST</th>
              <th>Exchange Rate</th>
              <th>Revised</th>
              <th>Revised No</th>
              <th>Hide</th>
              <th>Upload</th>
              <th>Lead Time</th>
              <th>Sales Credit</th>
              <th>Round Off</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {items.map((item, idx) => {
              const calc = getItemCalculated(item);
              return (
                <tr key={idx} className={item.hide ? "hide-row" : ""}>
                  <td>{idx + 1}</td>
                  <td>
                    <input name="marketingPersonId" value={item.marketingPersonId} onChange={(e) => handleItemChange(idx, e)} />
                  </td>
                  <td>
                    <input name="copyFrom" value={item.copyFrom} onChange={(e) => handleItemChange(idx, e)} />
                  </td>
                  <td>
                    <input name="productId" value={item.productId} onChange={(e) => handleItemChange(idx, e)} />
                  </td>
                  <td>
                    <input name="description" value={item.description} onChange={(e) => handleItemChange(idx, e)} />
                  </td>
                  <td>
                    <input
                      type="number"
                      min="1"
                      name="quantity"
                      value={item.quantity}
                      onChange={(e) => handleItemChange(idx, e)}
                    />
                  </td>
                  <td>
                    <input name="units" value={item.units} onChange={(e) => handleItemChange(idx, e)} />
                  </td>
                  <td>
                    <input type="number" step="0.01" name="rate" value={item.rate} onChange={(e) => handleItemChange(idx, e)} />
                  </td>
                  <td>
                    <input
                      type="number"
                      step="0.01"
                      name="discount"
                      value={item.discount}
                      onChange={(e) => handleItemChange(idx, e)}
                    />
                  </td>
                  <td>
                    <input
                      type="number"
                      step="0.01"
                      name="discountPercent"
                      value={item.discountPercent}
                      onChange={(e) => handleItemChange(idx, e)}
                    />
                  </td>
                  <td>
                    <input
                      type="number"
                      step="0.01"
                      name="taxPercent"
                      value={item.taxPercent}
                      onChange={(e) => handleItemChange(idx, e)}
                    />
                  </td>
                  <td>{calc.taxAmount?.toFixed(2)}</td>
                  <td>{calc.lineTotal?.toFixed(2)}</td>
                  <td>
                    <input type="date" name="quotationDate" value={item.quotationDate || header.quotationDate} onChange={(e) => handleItemChange(idx, e)} />
                  </td>
                  <td>
                    <input type="date" name="expireDate" value={item.expireDate || header.validUntil} onChange={(e) => handleItemChange(idx, e)} />
                  </td>
                  <td>
                    <input name="billingAddress" value={item.billingAddress || header.billingAddress} onChange={(e) => handleItemChange(idx, e)} />
                  </td>
                  <td>
                    <input name="shippingAddress" value={item.shippingAddress || header.shippingAddress} onChange={(e) => handleItemChange(idx, e)} />
                  </td>
                  <td>
                    <input name="terms" value={item.terms || header.terms} onChange={(e) => handleItemChange(idx, e)} />
                  </td>
                  <td>
                    <input name="reference" value={item.reference || header.reference} onChange={(e) => handleItemChange(idx, e)} />
                  </td>
                  <td>
                    <input name="bankDetails" value={item.bankDetails || header.bankDetails} onChange={(e) => handleItemChange(idx, e)} disabled={!header.isAdmin} />
                  </td>
                  <td>
                    <input name="note" value={item.note || header.note} onChange={(e) => handleItemChange(idx, e)} />
                  </td>
                  <td>
                    <select name="currency" value={item.currency || header.currency} onChange={(e) => handleItemChange(idx, e)}>
                      <option value="INR">INR</option>
                      <option value="USD">USD</option>
                      <option value="EUR">EUR</option>
                    </select>
                  </td>
                  <td>
                    <input name="shippingCode" value={item.shippingCode} onChange={(e) => handleItemChange(idx, e)} />
                  </td>
                  <td>
                    <input type="file" accept="image/*" onChange={(e) => handlePictureChange(idx, e)} />
                  </td>
                  <td>
                    <input type="checkbox" name="gstApplicable" checked={item.gstApplicable ?? header.gstApplicable} onChange={(e) => handleItemChange(idx, e)} />
                  </td>
                  <td>
                    <input type="number" step="0.01" name="exchangeRate" value={item.exchangeRate || header.exchangeRate} onChange={(e) => handleItemChange(idx, e)} />
                  </td>
                  <td>
                    <input type="checkbox" name="revised" checked={item.revised ?? header.revised} onChange={(e) => handleItemChange(idx, e)} />
                  </td>
                  <td>
                    <input name="revisedNo" value={item.revisedNo || header.revisedNo} onChange={(e) => handleItemChange(idx, e)} />
                  </td>
                  <td>
                    <input type="checkbox" name="hide" checked={item.hide} onChange={(e) => handleItemChange(idx, e)} />
                  </td>
                  <td>
                    <input type="file" multiple onChange={(e) => handleItemChange(idx, e)} />
                  </td>
                  <td>
                    <input name="leadTime" value={item.leadTime} onChange={(e) => handleItemChange(idx, e)} />
                  </td>
                  <td>
                    <input name="salesCredit" value={item.salesCredit} onChange={(e) => handleItemChange(idx, e)} />
                  </td>
                  <td>
                    <input type="number" step="0.01" name="roundOff" value={item.roundOff || header.roundOff} onChange={(e) => handleItemChange(idx, e)} />
                  </td>
                  <td>
                    <button type="button" className="btn danger" onClick={() => removeItem(idx)}>
                      ×
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </section>

      {/* 3️⃣ Summary */}
      <section className="q-summary card">
        <div className="totals">
          <div>
            <span>Sub‑Total:</span>
            <span>{summary.subTotal.toFixed(2)}</span>
          </div>
          <div>
            <span>Discount Total:</span>
            <span>{summary.discountTotal.toFixed(2)}</span>
          </div>
          <div>
            <span>Tax Total:</span>
            <span>{summary.taxTotal.toFixed(2)}</span>
          </div>
          <div>
            <span>Round Off:</span>
            <input
              type="number"
              step="0.01"
              name="roundOff"
              value={header.roundOff}
              onChange={handleHeaderChange}
            />
          </div>
          <div className="grand">
            <span>Grand Total:</span>
            <span>{summary.grandTotal.toFixed(2)}</span>
          </div>
        </div>
        <div className="actions">
          {!saved ? (
            <>
              <button className="btn primary" onClick={handleSave}>
                💾 Save
              </button>
              <button className="btn secondary" onClick={() => window.print()}>
                🖨️ Print
              </button>
              <button className="btn secondary" onClick={() => window.open(`mailto:?subject=Quotation&body=See attached quotation.`)}>
                📤 Share by Email
              </button>
              <button className="btn secondary" onClick={() => window.open(`https://wa.me/?text=See attached quotation.`)}>
                📲 Share by WhatsApp
              </button>
              <button className="btn secondary" onClick={handleExport}>
                ⬇️ Export Excel
              </button>
              <button className="btn success" disabled>
                ⇢ Convert to PO
              </button>
              <button className="btn secondary" onClick={() => window.history.back()}>
                ⬅️ Back
              </button>
            </>
          ) : (
            <>
              <button className="btn primary" onClick={handleEdit}>
                ✏️ Edit
              </button>
              <button className="btn danger" onClick={handleDelete}>
                🗑️ Delete
              </button>
              <button className="btn secondary" onClick={() => alert("Revised!")}>
                🔁 Revised
              </button>
              <button className="btn secondary" onClick={() => window.print()}>
                🖨️ Print
              </button>
              <button className="btn secondary" onClick={() => window.open(`mailto:?subject=Quotation&body=See attached quotation.`)}>
                📤 Share by Email
              </button>
              <button className="btn secondary" onClick={() => window.open(`https://wa.me/?text=See attached quotation.`)}>
                📲 Share by WhatsApp
              </button>
              <button className="btn secondary" onClick={handleExport}>
                ⬇️ Export Excel
              </button>
              <button className="btn success" disabled>
                ⇢ Convert to PO
              </button>
              <button className="btn secondary" onClick={() => window.history.back()}>
                ⬅️ Back
              </button>
            </>
          )}
        </div>
      </section>
    </div>
  );
}