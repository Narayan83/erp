import React, { useState, useEffect } from "react";
import axios from "axios";
import { BASE_URL } from "../../../config/Config";
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

  // Separate states for storing loaded data
  const [gmailConfig, setGmailConfig] = useState({ email: "", appPassword: "" });
  const [otherConfig, setOtherConfig] = useState({ email: "", password: "", host: "", port: "", ssl: true });

  useEffect(() => {
    if (isOpen) {
      setError("");
      setLoading(false);

      const fetchData = async () => {
        try {
          const res = await axios.get(`${BASE_URL}/api/integrations`, {
            params: { type: 'email' }
          });
          if (res.data && res.data.length > 0) {
            const gmail = res.data.find(it => it.provider === 'gmail');
            const other = res.data.find(it => it.provider === 'other');

            if (gmail) {
              setGmailConfig(gmail.config);
              // Default to gmail if it exists
              setProvider("gmail");
              setEmail(gmail.config.email || "");
              setAppPassword(gmail.config.appPassword || "");
            }
            if (other) {
              setOtherConfig(other.config);
              if (!gmail) {
                setProvider("other");
              }
            }
          } else {
            // Reset to default empty if no data
            setProvider("gmail");
            setEmail("");
            setAppPassword("");
          }
        } catch (err) {
          console.error("Error fetching email config:", err);
        }
      };
      fetchData();
    }
  }, [isOpen]);

  const handleProviderChange = (p) => {
    setProvider(p);
    if (p === 'gmail') {
      setEmail(gmailConfig.email || "");
      setAppPassword(gmailConfig.appPassword || "");
    } else {
      setShowOtherModal(true);
    }
  };

  const handleSave = async () => {
    setError("");
    if (!email || !email.trim()) {
      setError("Please enter an email address");
      return;
    }

    setLoading(true);
    try {
      const data = { provider, email: email.trim(), appPassword };
      await onSave(data);
      setGmailConfig({ email: data.email, appPassword: data.appPassword });
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
            <label className="email-radio"><input type="radio" name="provider" value="gmail" checked={provider === 'gmail'} onChange={() => handleProviderChange('gmail')} /> <span>Gmail</span></label>
            <label className="email-radio"><input type="radio" name="provider" value="other" checked={provider === 'other'} onChange={() => handleProviderChange('other')} /> <span>Other Mail Sender</span></label>
          </div>

          <div className="email-row">
            <label className="label-left">Email :</label>
            <input className="email-input" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>

          <div className="email-row">
            <label className="label-left">App Password:</label>
            <div style={{display:'flex', alignItems:'center', flex: 1}}>
              <input className="email-input" type="password" value={appPassword} onChange={(e) => setAppPassword(e.target.value)} />
              <button className="info-square" style={{marginLeft: 8}} title="For Gmail, generate an App Password from your Google Account security settings">i</button>
            </div>
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
        initialData={otherConfig}
        onSwitchProvider={(p) => { 
          if (p === 'gmail') {
            setProvider('gmail');
            setShowOtherModal(false);
            setEmail(gmailConfig.email || "");
            setAppPassword(gmailConfig.appPassword || "");
          }
        }}
        onClose={() => {
          setShowOtherModal(false);
          // If we cancel from other mail, go back to gmail in the main view if that's what was active
          // or just stay on whatever was selected.
        }}
        onSave={(data) => {
          // forward other-mail settings to parent onSave handler
          setShowOtherModal(false);
          setOtherConfig(data);
          onSave({ provider: 'other', ...data });
        }}
      />

    </div>
  );
}
