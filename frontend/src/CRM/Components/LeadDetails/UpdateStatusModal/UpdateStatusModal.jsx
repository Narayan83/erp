import React, { useState, useEffect } from 'react';
import { FaTimes } from 'react-icons/fa';
import './updateStatusModal.scss';

const UpdateStatusModal = ({ isOpen, onClose, currentStage, onStatusChange }) => {
  const [changeStageDropdown, setChangeStageDropdown] = useState('');
  const [rejectReason, setRejectReason] = useState('');
  const [rejectionReasons, setRejectionReasons] = useState([]);

  const stages = ['Discussion', 'Appointment', 'Demo', 'Proposal', 'Decided', 'Inactive'];

  // Load saved rejection reasons from localStorage
  useEffect(() => {
    if (isOpen) {
      try {
        const saved = JSON.parse(localStorage.getItem('leadRejectionReasons') || '[]');
        if (Array.isArray(saved) && saved.length > 0) {
          setRejectionReasons(saved.map(r => r.name));
        } else {
          // fallback to default if none saved
          setRejectionReasons(['Budget', 'Timeline', 'Competitor', 'No Interest', 'Other']);
        }
      } catch (e) {
        setRejectionReasons(['Budget', 'Timeline', 'Competitor', 'No Interest', 'Other']);
      }
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleChangeStage = async () => {
    if (!changeStageDropdown.trim()) {
      alert('Please select a stage');
      return;
    }
    await onStatusChange({
      type: 'stage',
      newStage: changeStageDropdown
    });
    setChangeStageDropdown('');
  };

  const handleReject = async () => {
    if (!rejectReason.trim()) {
      alert('Please select a rejection reason');
      return;
    }
    await onStatusChange({
      type: 'reject',
      reason: rejectReason
    });
    setRejectReason('');
  };

  return (
    <div className="update-status-overlay" onClick={onClose}>
      <div className="update-status-modal" onClick={e => e.stopPropagation()}>
        <div className="update-status-header">
          <h3>Update Status</h3>
          <button className="close-btn" onClick={onClose}><FaTimes /></button>
        </div>

        <div className="update-status-body">
          <div className="current-stage">
            <strong>Current Stage: </strong>
            <span>{currentStage || 'Unqualified'}</span>
          </div>

          {/* Change Stage Option */}
          <div className="status-option">
            <label>
              <input type="radio" name="action" value="change" onChange={() => {}} defaultChecked={true} />
              Change Stage to
            </label>
            <div className="option-content">
              <select value={changeStageDropdown} onChange={e => setChangeStageDropdown(e.target.value)}>
                <option value="">Select</option>
                {stages.map(stage => (
                  <option key={stage} value={stage}>{stage}</option>
                ))}
              </select>
              <button className="btn update-btn" onClick={handleChangeStage}>✓ Update</button>
            </div>
          </div>

          {/* Reject Option */}
          <div className="status-option">
            <label>
              <input type="radio" name="action" value="reject" onChange={() => {}} />
              Reject with Reason
            </label>
            <div className="option-content">
              <select value={rejectReason} onChange={e => setRejectReason(e.target.value)}>
                <option value="">Select</option>
                {rejectionReasons.map(reason => (
                  <option key={reason} value={reason}>{reason}</option>
                ))}
              </select>
              <button className="btn reject-btn" onClick={handleReject}>✕ Reject</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UpdateStatusModal;
