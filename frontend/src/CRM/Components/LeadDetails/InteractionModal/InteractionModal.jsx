
import React, { useState, useEffect } from 'react';
import { FaTrash, FaCheck } from 'react-icons/fa';
import { BASE_URL } from '../../../../config/Config';
import './InteractionModal.scss';

const InteractionModal = ({ isOpen, onClose, lead, onSaved }) => {
  const [interactionDate, setInteractionDate] = useState('');
  const [interactionTime, setInteractionTime] = useState('');
  const [tagLocation, setTagLocation] = useState(false);
  const [type, setType] = useState('Other');
  const [note, setNote] = useState('');

  const [nextDate, setNextDate] = useState('');
  const [nextTime, setNextTime] = useState('');
  const [nextAssignee, setNextAssignee] = useState('');
  const [nextType, setNextType] = useState('Other');
  const [nextNote, setNextNote] = useState('');
  const [sendWhatsApp, setSendWhatsApp] = useState(false);

  useEffect(() => {
    if (isOpen) {
      const now = new Date();
      setInteractionDate(now.toISOString().slice(0, 10));
      setInteractionTime(now.toTimeString().slice(0,5));
      setNextDate(new Date(now.getTime() + 24*60*60*1000).toISOString().slice(0,10));
      setNextTime('11:00');
      setType('Other');
      setNextType('Other');
      setNote('');
      setNextNote('');
      setTagLocation(false);
      setNextAssignee('');
      setSendWhatsApp(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const interactionTypes = ['Call', 'Meeting', 'Online', 'Email', 'Message', 'Other'];

  const handleSubmit = async (e) => {
    e.preventDefault();
    const payload = {
      interaction: {
        date: interactionDate,
        time: interactionTime,
        tagLocation,
        type,
        note,
      },
      nextAppointment: nextDate ? {
        date: nextDate,
        time: nextTime,
        assignee: nextAssignee,
        type: nextType,
        note: nextNote,
        sendWhatsApp,
      } : null,
    };

    if (!lead || !lead.id) {
      console.log('Interaction payload (no lead id):', payload);
      if (onSaved) onSaved();
      return;
    }

    try {
      const res = await fetch(`${BASE_URL}/api/leads/${lead.id}/interactions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        if (onSaved) onSaved();
      } else {
        const err = await res.json().catch(() => ({ error: 'Failed to save interaction' }));
        alert(`Failed to save interaction: ${err.error || 'Unknown error'}`);
      }
    } catch (err) {
      console.error('Failed to save interaction', err);
      alert('Error saving interaction. Please try again.');
    }
  };

  return (
    <div className="interaction-modal-overlay" onClick={onClose}>
      <div className="interaction-modal" onClick={e => e.stopPropagation()}>
        <form onSubmit={handleSubmit}>
          <div className="interaction-card">
            <div className="card-header">
              <h4>Interaction Entry</h4>
              <button type="button" className="icon-delete" title="Delete"><FaTrash /></button>
            </div>

            <div className="row inputs-row">
              <div className="time-group">
                <input type="date" value={interactionDate} onChange={e=>setInteractionDate(e.target.value)} />
                <input type="time" value={interactionTime} onChange={e=>setInteractionTime(e.target.value)} />
                <label className="tag-location"><input type="checkbox" checked={tagLocation} onChange={e=>setTagLocation(e.target.checked)} /> Tag Location</label>
              </div>
            </div>

            <div className="types-row">
              {interactionTypes.map(t => (
                <label key={t} className={`type-pill ${type===t ? 'active' : ''}`}>
                  <input type="radio" name="interaction-type" value={t} checked={type===t} onChange={()=>setType(t)} />
                  {t}
                </label>
              ))}
            </div>

            <textarea placeholder="Note" value={note} onChange={e=>setNote(e.target.value)} />
          </div>

          <div className="interaction-card">
            <div className="card-header">
              <h4>Next Appointment</h4>
            </div>

            <div className="row inputs-row">
              <div className="time-group">
                <input type="date" value={nextDate} onChange={e=>setNextDate(e.target.value)} />
                <input type="time" value={nextTime} onChange={e=>setNextTime(e.target.value)} />
                <select value={nextAssignee} onChange={e=>setNextAssignee(e.target.value)}>
                  <option value="">Select</option>
                  {/* Lightweight: try to use lead.assignees if provided or default */}
                  {/* For now leave single default value */}
                </select>
              </div>
            </div>

            <div className="types-row">
              {interactionTypes.map(t => (
                <label key={`next-${t}`} className={`type-pill ${nextType===t ? 'active' : ''}`}>
                  <input type="radio" name="next-type" value={t} checked={nextType===t} onChange={()=>setNextType(t)} />
                  {t}
                </label>
              ))}
            </div>

            <textarea placeholder="Note" value={nextNote} onChange={e=>setNextNote(e.target.value)} />

            <label className="send-whatsapp"><input type="checkbox" checked={sendWhatsApp} onChange={e=>setSendWhatsApp(e.target.checked)} /> Send WhatsApp</label>
          </div>

          <div className="modal-actions">
            <button type="submit" className="btn-save"><FaCheck /> Save</button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default InteractionModal;
