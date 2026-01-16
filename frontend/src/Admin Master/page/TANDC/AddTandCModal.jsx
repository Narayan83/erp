import React, { useState } from "react";
import axios from "axios";
import { BASE_URL } from "../../../config/Config";

export default function AddTandCModal({ isOpen = false, onClose = () => {}, onSaved = () => {}, item = null }) {
  const defaultChoices = { invoices: false, quotations: false, salesOrders: false, purchaseOrders: false, supplierInvoices: false, proformaInvoice: false, transferOrder: false };
  const [text, setText] = useState("");
  const [isDefault, setIsDefault] = useState(false);
  const [choices, setChoices] = useState(defaultChoices);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  React.useEffect(() => {
    // Prefill when editing an item, or reset when opening for add
    if (item) {
      setText(item.TandcName || "");
      const types = (item.TandcType || "").split(",").map((s) => s.trim());
      setIsDefault(types.includes("default"));
      setChoices({
        invoices: types.includes("invoices"),
        quotations: types.includes("quotations"),
        salesOrders: types.includes("sales_orders"),
        purchaseOrders: types.includes("purchase_orders"),
        supplierInvoices: types.includes("supplier_invoices"),
        proformaInvoice: types.includes("proforma_invoice"),
        transferOrder: types.includes("transfer_order"),
      });
    } else if (isOpen) {
      setText("");
      setIsDefault(false);
      setChoices(defaultChoices);
      setError("");
    }
  }, [item, isOpen]);

  const handleSave = async () => {
    setError("");
    if (!text || !text.trim()) {
      setError("Please enter the Term & Condition");
      return;
    }
    setLoading(true);
    try {
      const types = [];
      if (isDefault) {
        types.push("default");
        if (choices.invoices) types.push("invoices");
        if (choices.quotations) types.push("quotations");
        if (choices.salesOrders) types.push("sales_orders");
        if (choices.purchaseOrders) types.push("purchase_orders");
        if (choices.supplierInvoices) types.push("supplier_invoices");
        if (choices.proformaInvoice) types.push("proforma_invoice");
        if (choices.transferOrder) types.push("transfer_order");
      }

      const finalType = (item && item.ID && !isDefault) ? (item.TandcType || '') : (types.join(',') || '');

      if (item && item.ID) {
        // Update existing
        await axios.put(`${BASE_URL}/api/tandc/${item.ID}`, {
          TandcName: text.trim(),
          TandcType: finalType,
        });
      } else {
        // Create new
        await axios.post(`${BASE_URL}/api/tandc`, {
          TandcName: text.trim(),
          TandcType: finalType,
        });
      }

      onSaved();
      // reset
      setText("");
      setIsDefault(false);
      setChoices(defaultChoices);
      onClose();
    } catch (err) {
      console.error(err);
      setError("Error saving T&C");
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    // reset state when closing without saving
    setText("");
    setIsDefault(false);
    setChoices(defaultChoices);
    setError("");
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="tandc-overlay">
      <div className="tandc-dialog large">
        <div className="tandc-dialog-header">
          <div className="title">{item ? 'Edit Term & Condition' : 'Add a Term & Condition'}</div>
          <div className="actions">
            <button className="close" onClick={handleClose}>✕</button>
          </div>
        </div>

        <div className="tandc-dialog-body">
          <div className="form-row">
            <label>Enter Term &amp; Condition</label>
            <textarea
              rows={5}
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Term & Condition"
              style={{ width: "100%", padding: "8px 10px", borderRadius: 6, border: "1px solid #e6e9ee" }}
            />
          </div>

          <div className="checkbox-row">
            <label className="checkbox-field">
              <input type="checkbox" checked={isDefault} onChange={(e) => setIsDefault(e.target.checked)} />
              <span>Show as Default</span>
            </label>
          </div>

          {isDefault && (
            <>
              <div className="form-row options-row" style={{ marginTop: 6 }}>
                <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
                  <label className="checkbox-field" style={{ display: "inline-flex", alignItems: "center" }}>
                    <input type="checkbox" checked={choices.invoices} onChange={(e) => setChoices(prev => ({ ...prev, invoices: e.target.checked }))} />
                    <span>Invoices</span>
                  </label>

                  <label className="checkbox-field" style={{ display: "inline-flex", alignItems: "center" }}>
                    <input type="checkbox" checked={choices.quotations} onChange={(e) => setChoices(prev => ({ ...prev, quotations: e.target.checked }))} />
                    <span>Quotations</span>
                  </label>

                  <label className="checkbox-field" style={{ display: "inline-flex", alignItems: "center" }}>
                    <input type="checkbox" checked={choices.salesOrders} onChange={(e) => setChoices(prev => ({ ...prev, salesOrders: e.target.checked }))} />
                    <span>Sales Orders</span>
                  </label>

                  <label className="checkbox-field" style={{ display: "inline-flex", alignItems: "center" }}>
                    <input type="checkbox" checked={choices.purchaseOrders} onChange={(e) => setChoices(prev => ({ ...prev, purchaseOrders: e.target.checked }))} />
                    <span>Purchase Orders</span>
                  </label>

                  <label className="checkbox-field" style={{ display: "inline-flex", alignItems: "center" }}>
                    <input type="checkbox" checked={choices.supplierInvoices} onChange={(e) => setChoices(prev => ({ ...prev, supplierInvoices: e.target.checked }))} />
                    <span>Supplier Invoices</span>
                  </label>

                  <label className="checkbox-field" style={{ display: "inline-flex", alignItems: "center" }}>
                    <input type="checkbox" checked={choices.proformaInvoice} onChange={(e) => setChoices(prev => ({ ...prev, proformaInvoice: e.target.checked }))} />
                    <span>Proforma Invoice</span>
                  </label>

                  <label className="checkbox-field" style={{ display: "inline-flex", alignItems: "center" }}>
                    <input type="checkbox" checked={choices.transferOrder} onChange={(e) => setChoices(prev => ({ ...prev, transferOrder: e.target.checked }))} />
                    <span>Transfer Order</span>
                  </label>
                </div>
              </div>
            </>
          )}

          {error && <div style={{ color: "#c62828", marginTop: 8 }}>{error}</div>}
        </div>

        <div className="tandc-dialog-footer">
          <button className="btn-secondary" onClick={handleClose} disabled={loading}>Cancel</button>
          <button className="btn-primary save" onClick={handleSave} disabled={loading} style={{ marginLeft: 8 }}>
            {loading ? (item ? "Updating..." : "Saving...") : (item ? "Update" : "Save")}
          </button>
        </div>
      </div>
    </div>
  );
}
