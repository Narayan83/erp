// Lightweight local replacement for MUI TextField used in this file.
// Keeps markup working without importing MUI. Basic props supported: label, value, onChange, type, multiline, rows, sx, onClick.
import React from "react";
const TextField = ({ label, value, onChange, type = 'text', multiline, rows, sx, onClick }) => {
  if (multiline) {
    return (
      <div className="form-group">
        {label && <label>{label}</label>}
        <textarea className="form-control" rows={rows || 3} style={sx} value={value} onChange={onChange} />
      </div>
    );
  }
  return (
    <div className="form-group">
      {label && <label>{label}</label>}
      <input
        className="form-control"
        type={type}
        style={sx}
        value={value}
        onChange={onChange}
        onClick={onClick}
      />
    </div>
  );
};

export default TextField;