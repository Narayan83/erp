import React, { useEffect, useState } from "react";


// Simple searchable select component (no external libs).
// props: options (array of strings), value, onChange, placeholder, allowCustom
const SearchableSelect = ({ options = [], value = '', onChange, placeholder = '', allowCustom = false }) => {
  const [open, setOpen] = useState(false);
  const [filter, setFilter] = useState('');
  const [display, setDisplay] = useState(value || '');

  useEffect(() => setDisplay(value || ''), [value]);

  const filtered = options.filter(o => o.toLowerCase().includes(filter.toLowerCase()));

  const handleSelect = (val) => {
    setDisplay(val);
    setFilter('');
    setOpen(false);
    if (onChange) onChange(val);
  };

  // When selectedSeries is set programmatically (e.g. edit mode prefill),
  // SearchableSelect is a self-contained component and should not reference
  // outer-scope variables like `selectedSeries` or `isEditMode`.

  const handleBlur = () => {
    // small timeout to allow click to register
    setTimeout(() => setOpen(false), 150);
    if (allowCustom && onChange) onChange(display);
  };

  return (
    <div className="searchable-select">
      <input
        className="form-control"
        placeholder={placeholder}
        value={open ? filter : display}
        onChange={(e) => { setFilter(e.target.value); setOpen(true); setDisplay(e.target.value); }}
        onFocus={() => setOpen(true)}
        onBlur={handleBlur}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            e.preventDefault();
            if (filtered.length > 0) handleSelect(filtered[0]);
            else if (allowCustom) { if (onChange) onChange(display); setOpen(false); }
          }
        }}
      />

      {open && filtered.length > 0 && (
        <div className="searchable-select-dropdown">
          {filtered.map((opt) => (
            <div key={opt} className="searchable-select-option" onMouseDown={() => handleSelect(opt)}>{opt}</div>
          ))}
        </div>
      )}
    </div>
  );
};

export default SearchableSelect;