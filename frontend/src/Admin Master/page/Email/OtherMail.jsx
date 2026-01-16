import React, { useState, useEffect } from 'react';
import { FaTimes, FaCheck } from 'react-icons/fa';
import '../DigitalSign/DigitalSign.scss';
import './Email.scss';

export default function OtherMail({ isOpen = false, onClose = () => {}, onSave = () => {}, provider = 'other', onSwitchProvider = () => {} }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [host, setHost] = useState('');
  const [port, setPort] = useState('');
  const [ssl, setSsl] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) {
      setEmail(''); setPassword(''); setHost(''); setPort(''); setSsl(true); setError(''); setLoading(false);
    }
  }, [isOpen]);

  const handleSave = async () => {
    setError('');
    if (!email || !host) {
      setError('Please provide Email and Host');
      return;
    }
    setLoading(true);
    try {
      await onSave({ email: email.trim(), password, host: host.trim(), port: port.trim(), ssl });
      setLoading(false);
      onClose();
    } catch (err) {
      console.error(err);
      setError('Failed to save');
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
            <label className="email-radio"><input type="radio" name="provider-other" value="gmail" checked={provider === 'gmail'} onChange={() => onSwitchProvider('gmail')} /> <span>Gmail</span></label>
            <label className="email-radio"><input type="radio" name="provider-other" value="other" checked={provider === 'other'} onChange={() => onSwitchProvider('other')} /> <span>Other Mail Sender</span></label>
          </div>

          <div className="email-row">
            <label className="label-left">Email :</label>
            <input className="email-input" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>

          <div className="email-row">
            <label className="label-left">Password :</label>
            <input className="email-input" type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
          </div>

          <div className="email-row">
            <label className="label-left">Host :</label>
            <input className="email-input" placeholder="e.g. smtp-mail.outlook.com" type="text" value={host} onChange={(e) => setHost(e.target.value)} />
          </div>

          <div className="email-row">
            <label className="label-left">Port :</label>
            <input className="email-input" placeholder="e.g. 587" type="text" value={port} onChange={(e) => setPort(e.target.value)} />
          </div>

          <div className="email-row">
            <label className="label-left">SSL :</label>
            <label style={{marginRight:12}}><input type="radio" name="ssl-other" checked={ssl===true} onChange={() => setSsl(true)} /> Yes</label>
            <label><input type="radio" name="ssl-other" checked={ssl===false} onChange={() => setSsl(false)} /> No</label>
          </div>

          {error && <div className="error-text">{error}</div>}
        </div>

        <div className="ds-footer">
          <button className="btn-save" onClick={handleSave} disabled={loading || !email || !host}><FaCheck className="icon" /> Save</button>
        </div>
      </div>
    </div>
  );
}
