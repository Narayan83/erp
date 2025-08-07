import React, { useState, useEffect } from 'react';
import './_display_pref.scss';
import { FaCheck } from 'react-icons/fa'; // Import the check icon

const FIELDS = [
  'Designation',
  'Mobile',
  'Email',
  'Website',
  'Country',
  'State',
  'City',
  'GSTIN',
  'Source',
  'Product',
  'Potential',
  'Assigned To',
  'Notes',
  'Requirements',
  'Since',
  'Last Talk',
  'Next Action',
  'Transferred on',
];

const LOCAL_STORAGE_KEY = 'displayPreferences';

const DisplayPref = ({ onClose }) => {
  const [checked, setChecked] = useState({});

  useEffect(() => {
    const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (saved) {
      setChecked(JSON.parse(saved));
    } else {
      // Default: all checked
      const allChecked = {};
      FIELDS.forEach(f => { allChecked[f] = true; });
      setChecked(allChecked);
    }
  }, []);

  const handleChange = (field) => {
    setChecked(prev => ({ ...prev, [field]: !prev[field] }));
  };

  const handleSave = () => {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(checked));
    if (onClose) onClose();
  };

  return (
    <div className="display-pref-overlay">
      <div className="display-pref-modal">
        <div className="display-pref-header">
          <span>Display Preferences</span>
          <button className="close-btn" onClick={onClose}>&times;</button>
        </div>
        <div className="display-pref-checkboxes">
          {FIELDS.map((field, idx) => (
            <label key={field} className="checkbox-label">
              <input
                type="checkbox"
                checked={!!checked[field]}
                onChange={() => handleChange(field)}
              />
              {field}
            </label>
          ))}
        </div>
        <button className="save-btn" onClick={handleSave}>
          <FaCheck className="save-icon" />
          Save
        </button>
      </div>
    </div>
  );
};

export default DisplayPref;
