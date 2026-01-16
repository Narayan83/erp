import React, { useState, useEffect } from "react";
import { FaTimes, FaCheck } from 'react-icons/fa';
import "../DigitalSign/DigitalSign.scss"; // reuse modal styles
import "./Email.scss";
import OtherMail from "./OtherMail";

export default function Email({ isOpen = false, onClose = () => {}, onSave = () => {} }) {
  const [provider, setProvider] = useState("gmail");
  const [email, setEmail] = useState("");
  const [appPassword, setAppPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showOtherModal, setShowOtherModal] = useState(false);

  useEffect(() => {
    if (isOpen) {
      // reset when opened
      setProvider("gmail");
      setEmail("");
      setAppPassword("");
      setError("");
      setLoading(false);
    }
  }, [isOpen]);

  const handleSave = async () => {
    setError("");
    if (!email || !email.trim()) {
      setError("Please enter an email address");
      return;
    }

    setLoading(true);
    try {
      await onSave({ provider, email: email.trim(), appPassword });
      setLoading(false);
      onClose();
    } catch (err) {
      console.error(err);
      setError("Failed to save email configuration");
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="digital-sign-overlay" role="dialog" aria-modal="true" onClick={onClose}>
      <div className="digital-sign-modal" onClick={(e) => e.stopPropagation()}>
        <div className="ds-header">
          <h4>Email Account</h4>
          <button className="ds-close" onClick={onClose} aria-label="Close"><FaTimes /></button>
        </div>

        <div className="ds-body">
          <div className="email-radio-row">
            <label className="email-radio"><input type="radio" name="provider" value="gmail" checked={provider === 'gmail'} onChange={() => setProvider('gmail')} /> <span>Gmail</span></label>
            <label className="email-radio"><input type="radio" name="provider" value="other" checked={provider === 'other'} onChange={() => { setProvider('other'); setShowOtherModal(true); }} /> <span>Other Mail Sender</span></label>
          </div>

          <div className="email-row">
            <label className="label-left">Email :</label>
            <input className="email-input" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>

          <div className="email-row">
            <label className="label-left">App Password:</label>
            <input className="email-input" type="password" value={appPassword} onChange={(e) => setAppPassword(e.target.value)} />
            <button className="info-square" title="For Gmail, generate an App Password from your Google Account security settings">i</button>
          </div>

          {error && <div className="error-text">{error}</div>}
        </div>

        <div className="ds-footer">
          <button
            className="btn-save"
            onClick={handleSave}
            disabled={loading || !email}
          ><FaCheck className="icon" /> Save</button>
        </div>
      </div>

      <OtherMail
        isOpen={showOtherModal}
        provider={provider}
        onSwitchProvider={(p) => { setProvider(p); if (p === 'gmail') setShowOtherModal(false); }}
        onClose={() => setShowOtherModal(false)}
        onSave={(data) => {
          // forward other-mail settings to parent onSave handler
          setShowOtherModal(false);
          onSave({ provider: 'other', ...data });
        }}
      />

    </div>
  );
}
