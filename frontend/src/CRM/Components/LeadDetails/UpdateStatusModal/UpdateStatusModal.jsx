import React, { useState, useEffect } from 'react';
import { FaTimes, FaEdit, FaCheck } from 'react-icons/fa';
import './updateStatusModal.scss';

const UpdateStatusModal = ({ isOpen, onClose, currentStage, onStatusChange }) => {
  const [changeStageDropdown, setChangeStageDropdown] = useState('');
  const [rejectReason, setRejectReason] = useState('');
  const [rejectReasonId, setRejectReasonId] = useState('');
  const [rejectionReasonsList, setRejectionReasonsList] = useState([]);
  const [editingReasonId, setEditingReasonId] = useState(null);
  const [editingText, setEditingText] = useState('');
  const [isEditingReason, setIsEditingReason] = useState(false);
  const [isReasonSaving, setIsReasonSaving] = useState(false);
  
  // Local optimistic UI state to update Current Stage immediately and track request in-flight
  const [localCurrentStage, setLocalCurrentStage] = useState(currentStage || 'Unqualified');
  const [isUpdating, setIsUpdating] = useState(false);
  // Which action is selected by radio: 'change' or 'reject'
  const [selectedAction, setSelectedAction] = useState('change');

  const stages = ['Discussion', 'Appointment', 'Demo', 'Proposal', 'Decided', 'Inactive'];
  const apiBase = '/api';
  const genCode = (title) => title.toLowerCase().trim().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '').slice(0, 50);
  const normalizeReason = (reason) => {
    if (!reason) return reason;
    return {
      ...reason,
      id: reason.id ?? reason.ID
    };
  };

  // Load rejection reasons from API and sync local stage on modal open
  useEffect(() => {
    if (!isOpen) {
      setIsEditingReason(false);
      setEditingReasonId(null);
      setEditingText('');
      setIsReasonSaving(false);
      return;
    }

    // Sync displayed current stage with incoming prop and clear selections
    setLocalCurrentStage(currentStage || 'Unqualified');
    setRejectReason('');
    setRejectReasonId('');
    setIsEditingReason(false);
    setEditingReasonId(null);
    setEditingText('');
    setIsReasonSaving(false);

    const fetchReasons = async () => {
      try {
        const res = await fetch(`${apiBase}/rejection-reasons`);
        if (!res.ok) {
          throw new Error('Failed to fetch');
        }
        const data = await res.json();
        setRejectionReasonsList((data || []).map(normalizeReason));
      } catch (err) {
        console.error('Failed to fetch rejection reasons:', err);
      }
    };

    fetchReasons();
  }, [isOpen, currentStage]);

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
      setRejectReasonId('');
    } catch (err) {
      setLocalCurrentStage(prev);
      alert('Failed to reject lead. Please try again.');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleReasonSelection = (value) => {
    const selected = rejectionReasonsList.find(r => String(r.id) === value);
    setRejectReason(value ? selected?.title || '' : '');
    setRejectReasonId(value);
  };

  const handleStartEdit = () => {
    if (isUpdating || isReasonSaving) return;
    const selected = rejectionReasonsList.find(r => String(r.id) === rejectReasonId);
    if (selected) {
      setEditingReasonId(selected.id);
      setEditingText(selected.title || '');
    } else {
      setEditingReasonId(null);
      setEditingText('');
    }
    setIsEditingReason(true);
  };

  const handleSaveReason = async () => {
    const trimmed = (editingText || '').trim();
    if (!trimmed) {
      alert('Please enter a reason');
      return;
    }
    setIsReasonSaving(true);

    try {
      if (editingReasonId) {
        const existing = rejectionReasonsList.find(r => r.id === editingReasonId);
        const payload = { title: trimmed, code: existing?.code || genCode(trimmed) };
        const res = await fetch(`${apiBase}/rejection-reasons/${editingReasonId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          throw new Error(err.error || 'Update failed');
        }
        const updated = normalizeReason(await res.json());
        setRejectionReasonsList(prev => prev.map(r => (r.id === updated.id ? updated : r)));
        setRejectReason(updated.title);
        setRejectReasonId(String(updated.id));
      } else {
        const payload = { title: trimmed, code: genCode(trimmed) };
        const res = await fetch(`${apiBase}/rejection-reasons`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          throw new Error(err.error || 'Create failed');
        }
        const created = normalizeReason(await res.json());
        setRejectionReasonsList(prev => [...prev, created]);
        setRejectReason(created.title);
        setRejectReasonId(String(created.id));
      }
      setIsEditingReason(false);
      setEditingReasonId(null);
      setEditingText('');
    } catch (err) {
      console.error('Failed to save rejection reason:', err);
      alert('Failed to save reason. Please try again.');
    } finally {
      setIsReasonSaving(false);
    }
  };

  const handleCancelEdit = () => {
    if (isReasonSaving) return;
    setIsEditingReason(false);
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
                {isEditingReason ? (
                  <div className="inline-edit" style={{ display: 'flex', gap: 8, alignItems: 'center', flex: 1 }}>
                    <input
                      value={editingText}
                      onChange={e => setEditingText(e.target.value)}
                      onKeyDown={e => { if (e.key === 'Enter') handleSaveReason(); }}
                      placeholder="Enter reason"
                      disabled={selectedAction !== 'reject' || isUpdating || isReasonSaving}
                    />
                    <div className="inline-actions" style={{ display: 'flex', gap: 0 }}>
                      <button
                        type="button"
                        className="btn save-btn"
                        title="Save reason"
                        onClick={handleSaveReason}
                        disabled={selectedAction !== 'reject' || isUpdating || isReasonSaving}
                      ><FaCheck /></button>
                      <button
                        type="button"
                        className="btn cancel-btn"
                        title="Cancel"
                        onClick={handleCancelEdit}
                        disabled={selectedAction !== 'reject' || isUpdating || isReasonSaving}
                      ><FaTimes /></button>
                    </div>
                  </div>
                ) : (
                  <>
                    <select
                      value={rejectReasonId}
                      onChange={e => handleReasonSelection(e.target.value)}
                      disabled={selectedAction !== 'reject' || isUpdating}
                    >
                      <option value="">Select</option>
                      {(rejectionReasonsList || []).map(r => (
                        <option key={r.id} value={String(r.id)}>{r.title}</option>
                      ))}
                    </select>
                    <button
                      className="edit-btn"
                      title="Edit/Add Reason"
                      onClick={(e) => { e.stopPropagation(); handleStartEdit(); }}
                      disabled={selectedAction !== 'reject' || isUpdating || isReasonSaving}
                    ><FaEdit /></button>
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
