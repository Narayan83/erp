import React, { useState, useEffect } from 'react';
import { FaTimes, FaEdit, FaCheck } from 'react-icons/fa';
import './updateStatusModal.scss';

const UpdateStatusModal = ({ isOpen, onClose, currentStage, onStatusChange }) => {
  const [changeStageDropdown, setChangeStageDropdown] = useState('');
  const [rejectReason, setRejectReason] = useState('');
  // Store rejection reasons as objects {id, name} so they can be edited and saved to localStorage
  const [rejectionReasonsList, setRejectionReasonsList] = useState([]);
  const [editingReasonId, setEditingReasonId] = useState(null); // -1 indicates adding a new reason
  const [editingText, setEditingText] = useState('');
  // Local optimistic UI state to update Current Stage immediately and track request in-flight
  const [localCurrentStage, setLocalCurrentStage] = useState(currentStage || 'Unqualified');
  const [isUpdating, setIsUpdating] = useState(false);
  // Which action is selected by radio: 'change' or 'reject'
  const [selectedAction, setSelectedAction] = useState('change');

  const stages = ['Discussion', 'Appointment', 'Demo', 'Proposal', 'Decided', 'Inactive'];

  // Load saved rejection reasons and sync local stage on modal open
  useEffect(() => {
    if (isOpen) {
      // Sync displayed current stage with incoming prop (helps optimistic updates and external changes)
      setLocalCurrentStage(currentStage || 'Unqualified');

      try {
        const saved = JSON.parse(localStorage.getItem('leadRejectionReasons') || '[]');
        if (Array.isArray(saved) && saved.length > 0) {
          // support older format where saved could be an array of strings
          if (typeof saved[0] === 'string') {
            setRejectionReasonsList(saved.map((name, idx) => ({ id: idx + 1, name })));
          } else {
            setRejectionReasonsList(saved);
          }
        } else {
          // fallback to default if none saved
          const defaults = ['Budget', 'Timeline', 'Competitor', 'No Interest', 'Other'].map((name, idx) => ({ id: idx + 1, name }));
          setRejectionReasonsList(defaults);
        }
      } catch (e) {
        const defaults = ['Budget', 'Timeline', 'Competitor', 'No Interest', 'Other'].map((name, idx) => ({ id: idx + 1, name }));
        setRejectionReasonsList(defaults);
      }
    }
  }, [isOpen, currentStage]);

  // Reset editing state when modal closes
  useEffect(() => {
    if (!isOpen) {
      setEditingReasonId(null);
      setEditingText('');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleChangeStage = async () => {
    if (!changeStageDropdown.trim()) {
      alert('Please select a stage');
      return;
    }

    const prev = localCurrentStage;
    // Optimistic update
    setLocalCurrentStage(changeStageDropdown);
    setIsUpdating(true);

    try {
      await onStatusChange({
        type: 'stage',
        newStage: changeStageDropdown
      });
      setChangeStageDropdown('');
    } catch (err) {
      // rollback on error
      setLocalCurrentStage(prev);
      alert('Failed to update stage. Please try again.');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleReject = async () => {
    if (!rejectReason.trim()) {
      alert('Please select a rejection reason');
      return;
    }

    const prev = localCurrentStage;
    // Optimistically mark as Inactive (reject)
    setLocalCurrentStage('Inactive');
    setIsUpdating(true);

    try {
      await onStatusChange({
        type: 'reject',
        reason: rejectReason
      });
      setRejectReason('');
    } catch (err) {
      setLocalCurrentStage(prev);
      alert('Failed to reject lead. Please try again.');
    } finally {
      setIsUpdating(false);
    }
  };

  // Inline edit handlers for rejection reasons
  const handleStartEdit = () => {
    // If a reason is selected, start editing that reason; otherwise start a new entry
    const found = rejectionReasonsList.find(r => r.name === rejectReason);
    if (found) {
      setEditingReasonId(found.id);
      setEditingText(found.name);
    } else {
      setEditingReasonId(-1); // adding new
      setEditingText(rejectReason || '');
    }
  };

  const handleSaveEdit = () => {
    const trimmed = (editingText || '').trim();
    if (!trimmed) {
      alert('Please enter a reason');
      return;
    }

    const listCopy = Array.isArray(rejectionReasonsList) ? [...rejectionReasonsList] : [];

    if (editingReasonId === -1) {
      // add new reason
      const newItem = { id: Date.now(), name: trimmed };
      listCopy.push(newItem);
      setRejectionReasonsList(listCopy);
      try { localStorage.setItem('leadRejectionReasons', JSON.stringify(listCopy)); } catch (e) {}
      setRejectReason(newItem.name);
    } else {
      // update existing
      const idx = listCopy.findIndex(x => x.id === editingReasonId);
      if (idx !== -1) {
        listCopy[idx] = { ...listCopy[idx], name: trimmed };
      } else {
        // fallback: add new
        listCopy.push({ id: Date.now(), name: trimmed });
      }
      setRejectionReasonsList(listCopy);
      try { localStorage.setItem('leadRejectionReasons', JSON.stringify(listCopy)); } catch (e) {}
      setRejectReason(trimmed);
    }

    // exit edit mode
    setEditingReasonId(null);
    setEditingText('');
  };

  const handleCancelEdit = () => {
    setEditingReasonId(null);
    setEditingText('');
  };

  return (
    <div className="update-status-overlay">
      <div className="update-status-modal" onClick={e => e.stopPropagation()}>
        <div className="update-status-header">
          <h3>Update Status</h3>
          <button className="close-btn" onClick={onClose}><FaTimes /></button>
        </div>

        <div className="update-status-body">
          <div className="current-stage">
            <strong>Current Stage: </strong>
            <span>{localCurrentStage || 'Unqualified'}</span>
          </div>

          {/* Change Stage Option */}
          <div className="status-option">
            <label>
              <input type="radio" name="action" value="change" onChange={() => setSelectedAction('change')} checked={selectedAction === 'change'} />
              Change Stage to
            </label>
            <div className="option-content">
              <select value={changeStageDropdown} onChange={e => setChangeStageDropdown(e.target.value)} disabled={selectedAction !== 'change' || isUpdating}>
                <option value="">Select</option>
                {stages.map(stage => (
                  <option key={stage} value={stage}>{stage}</option>
                ))}
              </select>
              <button className="btn update-btn" onClick={handleChangeStage} disabled={isUpdating || selectedAction !== 'change'}>✓ Update</button>
            </div>
          </div>

          {/* Reject Option */}
          <div className="status-option">
            <label>
              <input type="radio" name="action" value="reject" onChange={() => setSelectedAction('reject')} checked={selectedAction === 'reject'} />
              Reject with Reason
            </label>
            <div className="option-content">
              <div className="reason-inline">
                {editingReasonId !== null ? (
                  <div className="inline-edit" style={{ display: 'flex', gap: 8, alignItems: 'center', flex: 1 }}>
                    <input value={editingText} onChange={e => setEditingText(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') handleSaveEdit(); }} placeholder="Enter reason" disabled={selectedAction !== 'reject' || isUpdating} />
                    <button type="button" className="btn save-btn" title="Save reason" onClick={handleSaveEdit} disabled={selectedAction !== 'reject' || isUpdating}><FaCheck /></button>
                    <button type="button" className="btn cancel-btn" title="Cancel" onClick={handleCancelEdit} disabled={selectedAction !== 'reject' || isUpdating}><FaTimes /></button>
                  </div>
                ) : (
                  <>
                    <select value={rejectReason} onChange={e => setRejectReason(e.target.value)} disabled={selectedAction !== 'reject' || isUpdating}>
                      <option value="">Select</option>
                      {(rejectionReasonsList || []).map(r => (
                        <option key={r.id} value={r.name}>{r.name}</option>
                      ))}
                    </select>
                    <button className="edit-btn" title="Edit/Add Reason" onClick={(e) => { e.stopPropagation(); handleStartEdit(); }} disabled={selectedAction !== 'reject'}><FaEdit /></button>
                  </>
                )}
              </div>
              <button className="btn reject-btn" onClick={handleReject} disabled={isUpdating || selectedAction !== 'reject'}>✕ Reject</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UpdateStatusModal;
