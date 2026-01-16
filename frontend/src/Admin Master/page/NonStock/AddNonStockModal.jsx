import React, { useState, useEffect } from "react";

export default function AddNonStockModal({ isOpen = false, onClose = () => {}, onSaved = () => {}, item = null }) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [rate, setRate] = useState("");
  const [unit, setUnit] = useState("");
  const [hsn, setHsn] = useState("");
  const [gst, setGst] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (item) {
      setName(item.name || "");
      setDescription(item.description || "");
      setRate(item.rate || "");
      setUnit(item.unit || "");
      setHsn(item.hsn || "");
      setGst(item.gst || "");
      setError("");
    } else if (isOpen) {
      setName("");
      setDescription("");
      setRate("");
      setUnit("");
      setHsn("");
      setGst("");
      setError("");
      setLoading(false);
    }
  }, [item, isOpen]);

  const handleSave = () => {
    setError("");
    if (!name || !name.trim()) {
      setError("Please enter an item name");
      return;
    }
    if (!rate || !String(rate).trim()) {
      setError("Please enter a rate");
      return;
    }

    setLoading(true);
    try {
      const newItem = {
        id: item && item.id ? item.id : Date.now(),
        name: name.trim(),
        description: description.trim(),
        rate: String(rate).trim(),
        unit: unit,
        hsn: hsn.trim(),
        gst: gst.trim(),
        // convenience display field
        price: `₹ ${String(rate).trim()} / ${unit}`,
      };

      onSaved(newItem);
      // reset and close
      setLoading(false);
      onClose();
    } catch (err) {
      console.error(err);
      setError("Error saving item");
      setLoading(false);
    }
  };

  const handleClose = () => {
    setError("");
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="tandc-overlay">
      <div className="tandc-dialog large">
        <div className="tandc-dialog-header">
          <div className="title">{item ? 'Edit Service / Non-Stock Item' : 'Add Service / Non-Stock Item'}</div>
          <div className="actions">
            <button className="close" onClick={handleClose}>✕</button>
          </div>
        </div>

        <div className="tandc-dialog-body">
          <div className="form-row">
            <label>Item Name<span style={{ color: '#c62828' }}>*</span></label>
            <input type="text" value={name} onChange={(e) => setName(e.target.value)} />
          </div>

          <div className="form-row">
            <label>Description</label>
            <textarea rows={4} value={description} onChange={(e) => setDescription(e.target.value)} style={{ width: '100%', padding: 8, borderRadius: 6 }} />
          </div>

          <div className="form-row">
            <div className="equal-row">
              <div className="field-wrapper">
                <label>Rate<span style={{ color: '#c62828' }}>*</span></label>
                <div style={{ position: 'relative' }}>
                  <span style={{ position: 'absolute', left: '8px', top: '50%', transform: 'translateY(-50%)', color: '#333', fontSize: '14px' }}>₹</span>
                  <input type="number" value={rate} onChange={(e) => setRate(e.target.value)} className="equal-field" style={{ paddingLeft: '24px' }} />
                </div>
              </div>
              <div className="field-wrapper">
                <label>Unit</label>
                <input type="text" value={unit} onChange={(e) => setUnit(e.target.value)} className="equal-field" />
              </div>
            </div>
          </div>

          <div className="form-row">
            <div className="equal-row">
              <div className="field-wrapper">
                <label>HSN/SAC</label>
                <input type="text" value={hsn} onChange={(e) => setHsn(e.target.value)} className="equal-field" />
              </div>
              <div className="field-wrapper">
                <label>GST</label>
                <div style={{ position: 'relative' }}>
                  <input type="number" value={gst} onChange={(e) => setGst(e.target.value)} className="equal-field" style={{ paddingRight: '24px' }} />
                  <span style={{ position: 'absolute', right: '8px', top: '50%', transform: 'translateY(-50%)', color: '#333', fontSize: '14px' }}>%</span>
                </div>
              </div>
            </div>
          </div>

          {error && <div style={{ color: '#c62828', marginTop: 8 }}>{error}</div>}
        </div>

        <div className="tandc-dialog-footer">
          <button className="btn-secondary" onClick={handleClose} disabled={loading}>Cancel</button>
          <button className="btn-primary save" onClick={handleSave} disabled={loading} style={{ marginLeft: 8 }}>{loading ? 'Saving...' : (item ? 'Update' : 'Save')}</button>
        </div>
      </div>
    </div>
  );
}
