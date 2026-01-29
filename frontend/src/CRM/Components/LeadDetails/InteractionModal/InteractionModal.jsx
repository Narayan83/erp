
import React, { useState, useEffect } from 'react';
import { FaTrash, FaCheck, FaTimes } from 'react-icons/fa';
import { BASE_URL } from '../../../../config/Config';
import './InteractionModal.scss';

const InteractionModal = ({ isOpen, onClose, lead, mode = 'both', onSaved }) => {
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

  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [employees, setEmployees] = useState([]);
  const [assignedDisplayName, setAssignedDisplayName] = useState('');

  useEffect(() => {
    // Fetch employees for the assignee dropdown and normalize to include a displayName
    fetch(`${BASE_URL}/api/employees`)
      .then(res => res.json())
      .then(data => {
        const list = Array.isArray(data) ? data : [];
        const mapped = list.map(emp => {
          const id = emp.id || emp.ID || emp.employee_id || emp.empid || emp.EmployeeID || emp.EmployeeId || emp.user_id || emp.userId || '';
          const first = emp.name || emp.fullName || emp.full_name || emp.firstname || emp.firstName || emp.Firstname || emp.first_name || emp.first || '';
          const last = emp.lastname || emp.lastName || emp.Lastname || emp.last_name || emp.last || '';
          const email = emp.email || emp.emailAddress || emp.email_id || '';
          const displayName = first ? (first + (last ? ` ${last}` : '')) : (email ? email : (id ? `Employee ${id}` : 'Unnamed'));
          return { ...emp, id, displayName };
        });
        setEmployees(mapped);
      })
      .catch(err => console.error('Failed to fetch employees:', err));
  }, []);

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
      setAssignedDisplayName('');
      setSendWhatsApp(false);
      setErrorMsg('');
    }
  }, [isOpen]);

  // When modal opens or employees list changes, try to preselect the current assigned executive
  useEffect(() => {
    if (!isOpen || !lead) return;
    // Try to find numeric id first
    let idCandidate = undefined;
    if (lead.assigned_to_id !== undefined && lead.assigned_to_id !== null && lead.assigned_to_id !== '') idCandidate = Number(lead.assigned_to_id);
    else if (lead.assignedTo && (typeof lead.assignedTo === 'number' || (/^\d+$/.test(String(lead.assignedTo))))) idCandidate = Number(lead.assignedTo);

    if (idCandidate !== undefined && !isNaN(idCandidate)) {
      // If employees loaded, try to find a matching employee to preselect
      const found = employees.find(emp => Number(emp.id) === idCandidate);
      if (found) {
        setNextAssignee(String(found.id));
        setAssignedDisplayName('');
        return;
      }
      // If not found, show numeric id as fallback display name
      setAssignedDisplayName(String(idCandidate));
      setNextAssignee('');
      return;
    }

    // If lead has a name (non-numeric), try to match by name
    const leadName = lead.assignedTo || lead.assignedToName || lead.assigned_to_name || '';
    if (leadName && typeof leadName === 'string' && !/^\d+$/.test(leadName.trim())) {
      const foundByName = employees.find(emp => {
        const ename = (emp.name || emp.firstName || emp.first_name || '').toString().toLowerCase();
        return ename && ename === leadName.toString().toLowerCase();
      });
      if (foundByName) {
        setNextAssignee(String(foundByName.id));
        setAssignedDisplayName('');
      } else {
        setAssignedDisplayName(leadName);
        setNextAssignee('');
      }
    }
  }, [isOpen, lead, employees]);

  useEffect(() => {
    if (errorMsg && tagLocation) setErrorMsg('');
  }, [tagLocation, errorMsg]);

  if (!isOpen) return null;

  const interactionTypes = ['Call', 'Meeting', 'Online', 'Email', 'Message', 'Other'];

  const handleSubmit = async (e) => {
    e.preventDefault();
    // Tag location is optional: interactions are always saved. If tagLocation is true, backend can store it in travel history.
    setSaving(true);
    setSuccessMsg('');
    setErrorMsg('');

    // determine interaction executor: prefer explicit nextAssignee, fallback to lead assigned fields
    const interactionEmployeeId = nextAssignee ? Number(nextAssignee) : (lead && (Number(lead.assigned_to_id) || (typeof lead.assignedTo === 'number' ? lead.assignedTo : (/^\d+$/.test(String(lead.assignedTo)) ? Number(lead.assignedTo) : null)))) || null;
    const interactionEmployeeName = !interactionEmployeeId ? (assignedDisplayName || (lead && (lead.assignedTo || lead.assignedToName || lead.assigned_to_name))) : null;

    const payload = {
      interaction: mode !== 'appointment' ? {
        date: interactionDate,
        time: interactionTime,
        tagLocation,
        type,
        note,
        // include executor info so backend or consumers can pick it up
        employee_id: interactionEmployeeId,
        user_id: interactionEmployeeId,
        employee: interactionEmployeeName,
        user: interactionEmployeeName,
      } : null,
      nextAppointment: (mode !== 'interaction' && nextDate) ? {
        date: nextDate,
        time: nextTime,
        assignee: nextAssignee ? Number(nextAssignee) : (assignedDisplayName || null),
        type: nextType,
        note: nextNote,
        sendWhatsApp,
      } : null,
    };

    if (!lead || !lead.id) {
      console.log('Interaction payload (no lead id):', payload);
      setSaving(false);
      if (onSaved) onSaved(null);
      return;
    }

    try {
      const res = await fetch(`${BASE_URL}/api/leads/${lead.id}/interactions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        const result = await res.json();
        console.log('Interaction saved successfully:', result);
        // Show a sensible message depending on what was created
        if (result.followup && result.interaction) setSuccessMsg('Interaction and appointment saved successfully!');
        else if (result.followup) setSuccessMsg('Appointment saved successfully!');
        else setSuccessMsg('Interaction saved successfully!');
        
        // Clear form
        setInteractionDate(new Date().toISOString().slice(0, 10));
        setInteractionTime(new Date().toTimeString().slice(0,5));
        setNextDate(new Date(Date.now() + 24*60*60*1000).toISOString().slice(0,10));
        setNextTime('11:00');
        setType('Other');
        setNextType('Other');
        setNote('');
        setNextNote('');
        setTagLocation(false);
        setNextAssignee('');
        setSendWhatsApp(false);
        
        // If backend returned nothing, show a message and don't propagate
        if (!result || (!result.interaction && !result.followup)) {
          setSuccessMsg('Nothing to save');
          setSaving(false);
          return;
        }

        // Close after brief delay
        setTimeout(() => {
          // Dispatch a global event so other pages (Followup / SalesInteractions) can react if needed
          try {
            const evtDetail = { interaction: result.interaction || null, followup: result.followup || null, lead_id: lead ? lead.id : null };
            window.dispatchEvent(new CustomEvent('lead:interaction.saved', { detail: evtDetail }));
          } catch (e) { /* ignore */ }

          if (onSaved) onSaved(result);
          onClose();
        }, 1000);
      } else {
        const err = await res.json().catch(() => ({ error: 'Failed to save interaction' }));
        console.error('Backend error:', err);
        alert(`Failed to save interaction: ${err.error || 'Unknown error'}`);
      }
    } catch (err) {
      console.error('Failed to save interaction', err);
      alert('Error saving interaction. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="interaction-modal-overlay">
      <div className="interaction-modal" onClick={e => e.stopPropagation()}>
        <form onSubmit={handleSubmit}>
          {mode !== 'appointment' && (
          <div className="interaction-card">
            <div className="card-header">
              <h4>Interaction Entry</h4>
              <button type="button" className="icon-close" title="Close" onClick={onClose}><FaTimes /></button>
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
          )}

          {mode !== 'interaction' && (
          <div className="interaction-card">
            <div className="card-header">
              <h4>{mode === 'appointment' ? 'Appointment' : 'Next Appointment'}</h4>
              {mode !== 'appointment' && <button type="button" className="icon-delete" title="Delete"><FaTrash /></button>}
              {mode === 'appointment' && <button type="button" className="icon-close" title="Close" onClick={onClose}><FaTimes /></button>}
              {mode === 'both' && <button type="button" className="icon-close" title="Close" onClick={onClose}><FaTimes /></button>}
            </div>

            <div className="row inputs-row">
              <div className="time-group">
                <input type="date" value={nextDate} onChange={e=>setNextDate(e.target.value)} />
                <input type="time" value={nextTime} onChange={e=>setNextTime(e.target.value)} />
                <select value={nextAssignee} onChange={e=>setNextAssignee(e.target.value)}>
                  {employees.map(emp => (
                    <option key={emp.id} value={emp.id}>
                      {emp.displayName}
                    </option>
                  ))}
                </select>
                {assignedDisplayName && !nextAssignee && (
                  <div className="assigned-note" style={{ fontSize: '12px', color: '#555', marginLeft: '8px' }}>
                    Assigned: {assignedDisplayName}
                  </div>
                )}
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

            {mode === 'both' && <label className="send-whatsapp"><input type="checkbox" checked={sendWhatsApp} onChange={e=>setSendWhatsApp(e.target.checked)} /> Send WhatsApp</label>}
            {mode === 'appointment' && <label className="send-whatsapp"><input type="checkbox" checked={sendWhatsApp} onChange={e=>setSendWhatsApp(e.target.checked)} /> Send WhatsApp</label>}
          </div>
          )}

          <div className="modal-actions">
            {successMsg && <div style={{color: 'green', marginRight: '10px'}}>{successMsg}</div>}
            {errorMsg && <div style={{color: 'red', marginRight: '10px'}}>{errorMsg}</div>}
            <button type="submit" className="btn-save" disabled={saving}><FaCheck /> {saving ? 'Saving...' : 'Save'}</button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default InteractionModal;
