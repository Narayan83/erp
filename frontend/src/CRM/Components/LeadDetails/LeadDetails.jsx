import React, { useState } from 'react';
import { FaTimes, FaPhone, FaEnvelope, FaRegCalendarAlt, FaClipboardList, FaWhatsapp, FaCopy } from 'react-icons/fa';
import { BASE_URL } from '../../../config/Config';
import UpdateStatusModal from './UpdateStatusModal/UpdateStatusModal';
import './leadDetails.scss';

const LeadDetails = ({ isOpen, lead, onClose, onEdit, onStatusUpdate }) => {
  const [showUpdateStatus, setShowUpdateStatus] = useState(false);

  if (!isOpen || !lead) return null;

  const contactName = lead.name || lead.contact || [lead.prefix, lead.firstName, lead.lastName].filter(Boolean).join(' ');

  const handleStatusChange = async (data) => {
    try {
      let payload = {};
      if (data.type === 'stage') {
        payload.stage = data.newStage;
      } else if (data.type === 'reject') {
        payload.stage = 'Inactive';
        payload.rejectionReason = data.reason;
      }

      const res = await fetch(`${BASE_URL}/api/leads/${lead.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        console.log('Status updated successfully:', data);
        // Refresh the leads data
        if (onStatusUpdate) {
          onStatusUpdate();
        }
        setShowUpdateStatus(false);
      } else {
        const errorData = await res.json().catch(() => ({ error: 'Failed to update status' }));
        alert(`Failed to update status: ${errorData.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error updating status:', error);
      alert('Error updating status. Please try again.');
    }
  };

  const sanitizeNumber = (num) => {
    if (!num) return '';
    return String(num).replace(/[^0-9+]/g, '');
  };

  const openWhatsApp = (num) => {
    const sanitized = sanitizeNumber(num);
    if (!sanitized) return;
    const url = `https://wa.me/${sanitized}`;
    window.open(url, '_blank');
  };

  const callNumber = (num) => {
    const sanitized = sanitizeNumber(num);
    if (!sanitized) return;
    window.location.href = `tel:${sanitized}`;
  };

  const copyToClipboard = async (text) => {
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(text);
      } else {
        const ta = document.createElement('textarea');
        ta.value = text;
        ta.style.position = 'fixed';
        ta.style.left = '-9999px';
        document.body.appendChild(ta);
        ta.focus();
        ta.select();
        document.execCommand('copy');
        document.body.removeChild(ta);
      }
      // optional: provide feedback
      // alert('Copied to clipboard');
    } catch (err) {
      console.error('Copy failed', err);
    }
  };

  return (
    <div className="lead-details-overlay" onClick={onClose}>
      <div className="lead-details-modal" onClick={e => e.stopPropagation()}>
        <div className="lead-details-header">
          <h3>Lead Details</h3>
          <button className="close-btn" onClick={onClose}><FaTimes /></button>
        </div>

        <div className="lead-details-body">
          <div className="left-col">
            <div className="card">
              <div className="card-title">Contact Information</div>
              <table className="detail-table">
                <tbody>
                  <tr>
                    <td>Name</td>
                    <td>{contactName || '-'}</td>
                  </tr>
                  <tr>
                    <td>Mobile</td>
                    <td>
                      <span className="contact-value">{lead.mobile || '-'}</span>
                      {lead.mobile && (
                        <span className="contact-actions">
                          <button className="icon-btn small" title="WhatsApp" onClick={() => openWhatsApp(lead.mobile)}><FaWhatsapp /></button>
                          <button className="icon-btn small" title="Call" onClick={() => callNumber(lead.mobile)}><FaPhone /></button>
                          <button className="icon-btn small" title="Copy" onClick={() => copyToClipboard(lead.mobile)}><FaCopy /></button>
                        </span>
                      )}
                    </td>
                  </tr>
                  <tr>
                    <td>Email</td>
                    <td>
                      <span className="contact-value">{lead.email || '-'}</span>
                      {lead.email && (
                        <span className="contact-actions">
                          <a className="icon-btn small" title="Send Email" href={`mailto:${lead.email}`}><FaEnvelope /></a>
                          <button className="icon-btn small" title="Copy" onClick={() => copyToClipboard(lead.email)}><FaCopy /></button>
                        </span>
                      )}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div className="card">
              <div className="card-title">Business Opportunity</div>
              <div className="opportunity-text">{lead.requirements || lead.notes || 'No details available.'}</div>
            </div>
          </div>

          <div className="right-col">
            <div className="card actions-card">
              <div className="card-title">Actions</div>
                <div className="actions-list">
                <button className="btn small" onClick={() => { if (onEdit) onEdit(lead); }}>Reassign</button>
                <button className="btn small" onClick={() => setShowUpdateStatus(true)}>Update Status</button>
                <button className="btn small green">+ Quote</button>
                <button className="btn small green">+ Order</button>
                <button className="btn small">Business History</button>
              </div>
            </div>

            <div className="card">
              <div className="card-title">Business Interactions</div>
              <div className="interactions">
                <div className="next-appointment">{lead.nextTalk || 'No appointment scheduled'}</div>
                <button className="btn small green">+ Enter Interaction</button>
              </div>
            </div>
          </div>
        </div>

      </div>

      {/* Update Status Modal */}
      <UpdateStatusModal
        isOpen={showUpdateStatus}
        onClose={() => setShowUpdateStatus(false)}
        currentStage={lead.stage || 'Unqualified'}
        onStatusChange={handleStatusChange}
      />
    </div>
  );
};

export default LeadDetails;
