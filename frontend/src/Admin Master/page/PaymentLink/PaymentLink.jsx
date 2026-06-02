import React, { useState, useEffect } from "react";
import axios from "axios";
import { BASE_URL } from "../../../config/Config";

export default function PaymentLink({ isOpen = false, onClose = () => {}, onSave = () => {} }) {
  const [link, setLink] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (isOpen) {
      setLink("");
      setError("");
      setLoading(false);

      const fetchData = async () => {
        try {
          const res = await axios.get(`${BASE_URL}/api/integrations`, {
            params: { type: 'payment', provider: 'custom' }
          });
          if (res.data && res.data.length > 0) {
            setLink(res.data[0].config.link || "");
          }
        } catch (err) {
          console.error("Error fetching payment link:", err);
        }
      };
      fetchData();
    }
  }, [isOpen]);

  const handleSave = () => {
    setError("");
    if (!link || !link.trim()) {
      setError("Please enter a link");
      return;
    }
    setLoading(true);
    try {
      onSave(link.trim());
      setLoading(false);
      onClose();
    } catch (err) {
      console.error(err);
      setError("Error saving payment link");
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="tandc-overlay">
      <div className="tandc-dialog small">
        <div className="tandc-dialog-header">
          <div className="title">Payment Link</div>
          <div className="actions">
            <button className="close" onClick={onClose}>✕</button>
          </div>
        </div>

        <div className="tandc-dialog-body">
          <div className="form-row">
            <label>Link</label>
            <input type="text" value={link} onChange={(e) => setLink(e.target.value)} />
          </div>

          {error && <div style={{ color: '#c62828', marginTop: 8 }}>{error}</div>}
        </div>

        <div className="tandc-dialog-footer">
          <button className="btn-primary save" onClick={handleSave} disabled={loading} style={{ marginLeft: 8, background: '#157515', borderColor: '#157515' }}>{loading ? 'Saving...' : (<>Save</>)}</button>
        </div>
      </div>
    </div>
  );
}
