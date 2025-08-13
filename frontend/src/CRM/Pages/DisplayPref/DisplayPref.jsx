import React, { useState } from 'react';
import './_display_pref.scss';
import { FaCheck } from 'react-icons/fa';

// -------------------- Field Options --------------------
const FIELD_OPTIONS = [
  { key: 'selectall', label: 'Select All' },
  { key: 'business', label: 'Business' },
  { key: 'name', label: 'Name' },
  { key: 'designation', label: 'Designation' },
  { key: 'mobile', label: 'Mobile' },
  { key: 'email', label: 'Email' },
  { key: 'addressLine1', label: 'Address Line 1' },
  { key: 'addressLine2', label: 'Address Line 2' },
  { key: 'city', label: 'City' },
  { key: 'state', label: 'State' },
  { key: 'country', label: 'Country' },
  { key: 'source', label: 'Source' },
  { key: 'stage', label: 'Stage' },
  { key: 'potential', label: 'Potential' },
  { key: 'since', label: 'Since' },
  { key: 'gstin', label: 'GSTIN' },
  { key: 'category', label: 'Category' },
  { key: 'product', label: 'Product' },
  { key: 'website', label: 'Website' },
  { key: 'requirements', label: 'Requirements' },
  { key: 'notes', label: 'Notes' },
  { key: 'tags', label: 'Tags' },
  // Add new fields
  { key: 'lastTalk', label: 'LastTalk' },
  { key: 'nextTalk', label: 'NextTalk' },
  { key: 'transferredOn', label: 'TransferredOn' },
  { key: 'assignedTo', label: 'AssignedTo' },
  { key: 'createdAt', label: 'CreatedAt' },
  { key: 'updatedAt', label: 'UpdatedAt' }
];

const LOCAL_STORAGE_KEY = 'displayPreferences';

const DisplayPref = ({ onClose }) => {
  // -------------------- State --------------------
  const [checkedFields, setCheckedFields] = useState(() => {
    const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (saved) return JSON.parse(saved);
    return FIELD_OPTIONS.reduce((acc, field) => ({ ...acc, [field.key]: true }), {});
  });

  // -------------------- Handlers --------------------
  const handleCheckboxChange = (key) => {
    setCheckedFields(prev => {
      if (key === 'selectall') {
        // Toggle all checkboxes based on selectall's current state
        const selectAllChecked = !prev['selectall'];
        const updated = {};
        FIELD_OPTIONS.forEach(field => {
          updated[field.key] = selectAllChecked;
        });
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updated));
        return updated;
      } else {
        // Toggle individual checkbox
        const updated = { ...prev, [key]: !prev[key] };
        // If any field is unchecked, uncheck selectall; if all checked, check selectall
        const allChecked = FIELD_OPTIONS
          .filter(f => f.key !== 'selectall')
          .every(f => updated[f.key]);
        updated['selectall'] = allChecked;
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updated));
        return updated;
      }
    });
  };

  const handleSave = () => {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(checkedFields));
    if (onClose) onClose();
  };

  // -------------------- Grid Layout --------------------
  // Split fields into 5 rows of 5 columns
  const gridRows = [];
  for (let i = 0; i < FIELD_OPTIONS.length; i += 5) {
    gridRows.push(FIELD_OPTIONS.slice(i, i + 5));
  }

  // -------------------- Render --------------------
  return (
    <div className="modal-overlay">
      <div className="display-pref-modal">
        {/* Modal Header */}
        <div className="modal-header">
          <h2>Display Preferences</h2>
          <button className="close-button" onClick={onClose}>&times;</button>
        </div>
        {/* Modal Body: 5x5 Grid of Checkboxes */}
        <div className="modal-body">
          <form>
            <div className="field-checkbox-grid">
              {gridRows.map((row, rowIdx) => (
                <div className="field-checkbox-row" key={rowIdx}>
                  {row.map(field => (
                    <label key={field.key} className="field-checkbox-cell">
                      <input
                        type="checkbox"
                        checked={!!checkedFields[field.key]}
                        onChange={() => handleCheckboxChange(field.key)}
                      />
                      {field.label}
                    </label>
                  ))}
                </div>
              ))}
            </div>
          </form>
        </div>
        {/* Save Button */}
        <button className="save-btn" onClick={handleSave}>
          <FaCheck className="save-icon" />
          Save
        </button>
      </div>
    </div>
  );
};

export default DisplayPref;
