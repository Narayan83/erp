import React, { useState, useEffect } from 'react';
import { FaTimes, FaPhone, FaEnvelope, FaRegCalendarAlt, FaClipboardList, FaWhatsapp, FaCopy, FaEdit, FaTrash } from 'react-icons/fa';
import { BASE_URL } from '../../../config/Config';
import UpdateStatusModal from './UpdateStatusModal/UpdateStatusModal';
import InteractionModal from './InteractionModal/InteractionModal';
import './leadDetails.scss';

const LeadDetails = ({ isOpen, lead, onClose, onEdit, onStatusUpdate }) => {
  const [showUpdateStatus, setShowUpdateStatus] = useState(false);
  const [showInteraction, setShowInteraction] = useState(false);
  const [interactionMode, setInteractionMode] = useState('both'); // 'interaction', 'appointment', or 'both'
  // Local optimistic stage so UI updates instantly when user changes stage
  const [localStage, setLocalStage] = useState(lead?.stage || 'Unqualified');

  // Keep localStage in sync when the lead prop changes
  useEffect(() => {
    setLocalStage(lead?.stage || 'Unqualified');
  }, [lead]);

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

      // Optimistically update the UI immediately
      const prevStage = localStage;
      setLocalStage(payload.stage);

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
        // rollback on failure
        setLocalStage(prevStage);
        const errorData = await res.json().catch(() => ({ error: 'Failed to update status' }));
        alert(`Failed to update status: ${errorData.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error updating status:', error);
      alert('Error updating status. Please try again.');
      // rollback
      try { setLocalStage(lead?.stage || 'Unqualified'); } catch (e) {}
    }
  };

  const [deleting, setDeleting] = useState(false);

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this lead?')) return;
    try {
      setDeleting(true);
      // If this is an imported lead (no numeric backend id), remove from localStorage
      if (!lead || !lead.id || typeof lead.id !== 'number') {
        try {
          const imported = JSON.parse(localStorage.getItem('importedLeads') || '[]') || [];
          const updated = imported.filter(l => l.id !== lead.id);
          localStorage.setItem('importedLeads', JSON.stringify(updated));
        } catch (e) {}
        if (onStatusUpdate) onStatusUpdate();
        onClose();
        return;
      }

      const res = await fetch(`${BASE_URL}/api/leads/${lead.id}`, { method: 'DELETE' });
      if (res.ok) {
        if (onStatusUpdate) onStatusUpdate();
        onClose();
      } else {
        const err = await res.json().catch(() => ({ error: 'Failed to delete lead' }));
        alert(err.error || 'Failed to delete lead');
      }
    } catch (err) {
      console.error('Failed to delete lead', err);
      alert('Error deleting lead. Please try again.');
    } finally {
      setDeleting(false);
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

  // Local strict date formatter to hide placeholder or invalid dates
  const formatDateStrictLocal = (dateStr, { hideIfNow = false } = {}) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    if (isNaN(date)) return '';
    const year = date.getFullYear();
    const currentYear = new Date().getFullYear();
    if (year < 1900 || year > currentYear + 5) return '';
    if (hideIfNow && Math.abs(Date.now() - date.getTime()) < 2 * 60 * 1000) return '';
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    return `${day}-${month}-${year}`;
  };

  // Simple 12-hour time formatter for appointment times
  const formatTime12 = (iso) => {
    if (!iso) return '';
    const d = new Date(iso);
    if (isNaN(d)) return '';
    let h = d.getHours();
    const m = String(d.getMinutes()).padStart(2, '0');
    const ampm = h >= 12 ? 'PM' : 'AM';
    h = h % 12 || 12;
    return `${h}:${m} ${ampm}`;
  };

  // Show date as 'Today', 'Yesterday', 'Tomorrow' or fallback to DD-MM-YYYY
  const formatRelativeDate = (iso) => {
    if (!iso) return '';
    const d = new Date(iso);
    if (isNaN(d)) return '';
    const day = new Date(d.getFullYear(), d.getMonth(), d.getDate());
    const today = new Date();
    const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const diffDays = Math.round((day - todayStart) / (24*60*60*1000));
    if (diffDays === 0) return 'Today';
    if (diffDays === -1) return 'Yesterday';
    if (diffDays === 1) return 'Tomorrow';
    return formatDateStrictLocal(iso);
  };

  // Next appointment details (date/time/note) for this lead
  const [nextAppointment, setNextAppointment] = useState(null);

  useEffect(() => {
    let mounted = true;
    const loadNextAppointment = async () => {
      if (!isOpen || !lead || (!lead.id && lead.id !== 0)) {
        if (mounted) setNextAppointment(null);
        return;
      }

      try {
        const res = await fetch(`${BASE_URL}/api/lead-followups`);
        const data = await res.json();
        const arr = Array.isArray(data) ? data : (data && data.data ? data.data : []);
        const leadIdStr = String(lead.id);

        // Filter pending followups for this lead
        const pending = arr.filter(f => {
          const lid = String(f.lead_id || f.LeadID || (f.lead && f.lead.id) || f.lead || '');
          const status = (f.status || f.Status || '').toString().toLowerCase();
          return lid === leadIdStr && (status === 'pending' || status === '' || status === undefined);
        });

        if (!pending || pending.length === 0) {
          if (mounted) setNextAppointment(null);
          return;
        }

        const mapped = pending.map(f => {
          const dt = f.followup_on || f.FollowUpOn || f.followupOn || '';
          const d = dt ? new Date(dt) : null;
          return { raw: f, dt: d, notes: f.notes || f.Notes || '', type: f.title || f.Title || '' };
        }).filter(x => x.dt && !isNaN(x.dt));

        if (mapped.length === 0) {
          if (mounted) setNextAppointment(null);
          return;
        }

        // Prefer the nearest future appointment; otherwise the earliest overall
        const now = new Date();
        let candidates = mapped.filter(x => x.dt >= now);
        if (candidates.length === 0) candidates = mapped;
        candidates.sort((a, b) => a.dt - b.dt);
        const pick = candidates[0];
        if (mounted) setNextAppointment({ followupOn: pick.dt.toISOString(), notes: pick.notes, type: pick.type, raw: pick.raw });
      } catch (err) {
        console.error('Failed to load next appointment', err);
      }
    };

    loadNextAppointment();
    const handler = () => { loadNextAppointment(); };
    window.addEventListener('lead:interaction.saved', handler);
    return () => { mounted = false; window.removeEventListener('lead:interaction.saved', handler); };
  }, [isOpen, lead]);

  // Open the Add Quotation page in a new tab and prefill using lead data passed as query params
  const openQuoteFromLead = () => {
    try {
      const params = new URLSearchParams();
      if (lead?.id) params.set('lead_id', String(lead.id));
      const company = lead?.business || lead?.businessName || lead?.company || '';
      if (company) params.set('lead_company', company);
      const contact = lead?.name || lead?.contact || [lead?.prefix, lead?.firstName, lead?.lastName].filter(Boolean).join(' ').trim();
      if (contact) params.set('lead_contact', contact);
      if (lead?.mobile) params.set('lead_mobile', lead.mobile);
      if (lead?.email) params.set('lead_email', lead.email);
      const product = lead?.productName || lead?.product || lead?.requirements || '';
      if (product) params.set('lead_product', product);
      const url = `/quotation?${params.toString()}`;
      window.open(url, '_blank');
    } catch (err) {
      console.error('Failed to open quotation page from lead', err);
      window.open('/quotation', '_blank');
    }
  };

  return (
    <div className="lead-details-overlay">
      <div className="lead-details-modal" onClick={e => e.stopPropagation()}>
        <div className="lead-details-header">
          <div className="lead-title-group">
            <h3 className="business-name">{lead.business || lead.businessName || lead.company || 'Lead Details'}</h3>
          </div>

          <div className="header-actions">
            <button className="icon-btn edit-btn" title="Edit Lead" onClick={() => { if (onEdit) onEdit(lead); }}><FaEdit /></button>
            <button className="icon-btn delete-btn" title="Delete Lead" onClick={handleDelete} disabled={deleting}><FaTrash /></button>
            <button className="close-btn" onClick={onClose}><FaTimes /></button>
          </div>
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
                <button className="btn small" onClick={() => openQuoteFromLead()}>+ Quote</button>
                <button className="btn small">History</button>
              </div>
            </div>

            <div className="card">
              <div className="card-title">Business Follow-Ups</div>
              <div className="interactions">
                <div className="next-appointment">
                  {nextAppointment ? (
                    <>
                      <div className="appointment-datetime">
                        <span className="appointment-date">{formatRelativeDate(nextAppointment.followupOn)}</span>
                        <span className="appointment-time">{formatTime12(nextAppointment.followupOn)}</span>
                      </div>
                      {nextAppointment.notes ? <div className="appointment-note">{nextAppointment.notes}</div> : null}
                    </>
                  ) : (
                    'No appointment scheduled'
                  )}
                </div>
                <div className="button-group" style={{ display: 'flex', gap: '10px' }}>
                  <button className="btn small green" onClick={() => { setInteractionMode('interaction'); setShowInteraction(true); }}>+ Interaction</button>
                  <button className="btn small green" onClick={() => { setInteractionMode('appointment'); setShowInteraction(true); }}>+ Appointment</button>
                </div>
              </div>
            </div> 
          </div>
        </div>

      </div>

      {/* Interaction Modal */}
      <InteractionModal
        isOpen={showInteraction}
        onClose={() => setShowInteraction(false)}
        lead={lead}
        mode={interactionMode}
        onSaved={(result) => {
          if (onStatusUpdate) onStatusUpdate(result);
          setShowInteraction(false);
        }}
      />

      <UpdateStatusModal
        isOpen={showUpdateStatus}
        onClose={() => setShowUpdateStatus(false)}
        currentStage={localStage}
        onStatusChange={handleStatusChange}
      />
    </div>
  );
};

export default LeadDetails;
