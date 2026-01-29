import React, { useEffect, useRef } from 'react';
import PropTypes from 'prop-types';
import './import_dialog.scss';

export default function ImportDialog({
  open,
  onClose,
  title = 'Import Products',
  instructions = [],
  accept = '.csv',
  importFile,
  setImportFile,
  importLoading = false,
  onImport,
  downloadTemplate
}) {
  const overlayRef = useRef(null);

  useEffect(() => {
    if (!open) return;
    const onKey = (e) => {
      if (e.key === 'Escape') onClose && onClose();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  const handleFileChange = (e) => {
    const f = e.target.files && e.target.files[0];
    setImportFile && setImportFile(f);
  };

  const handleClear = () => {
    setImportFile && setImportFile(null);
  };

  if (!open) return null;

  return (
    <div className="import-dialog-overlay" ref={overlayRef} onClick={() => onClose && onClose()}>
      <div className="import-dialog" role="dialog" aria-modal="true" onClick={(e) => e.stopPropagation()}>

        <div className="import-dialog-body">
          <div className="dialog-body-title"><h3 className="import-dialog-title">{title}</h3></div>
          {instructions && instructions.length > 0 && (
            <div className="import-instructions">
              <strong>Instructions:</strong>
              <ul className="instruction-list">
                {instructions.map((ins, idx) => (
                  <li key={idx} className={/upload the completed/i.test(ins) ? 'text-danger' : ''}>{ins}</li>
                ))}
              </ul>
            </div>
          )}

          <p className="import-desc">Import products from a CSV file. Make sure you have downloaded the template and filled it correctly.</p>

          <div className="import-controls">
            <div className="template-download">
              <button type="button" className="download-template" onClick={() => downloadTemplate && downloadTemplate()}>
                ↓ Download template Excel file
              </button>
            </div>

            <label className="file-chooser">
              <input type="file" accept={accept} onChange={handleFileChange} />
              <span className="file-chooser-btn">Choose file</span>
            </label>

            {importFile && (
              <div className="selected-file">
                <span className="file-name">{importFile.name}</span>
                <button type="button" className="clear-btn" onClick={handleClear} aria-label="Clear selected file">×</button>
              </div>
            )}

          </div>
        </div>

        <footer className="import-dialog-actions">
          <button className="btn btn-secondary" onClick={() => onClose && onClose()}>Cancel</button>
          <button className="btn btn-primary" onClick={onImport} disabled={!importFile || importLoading}>
            {importLoading ? <span className="spinner" aria-hidden="true"></span> : 'Import'}
          </button>
        </footer>
      </div>
    </div>
  );
}

ImportDialog.propTypes = {
  open: PropTypes.bool,
  onClose: PropTypes.func,
  title: PropTypes.string,
  instructions: PropTypes.array,
  accept: PropTypes.string,
  importFile: PropTypes.any,
  setImportFile: PropTypes.func,
  importLoading: PropTypes.bool,
  onImport: PropTypes.func,
  downloadTemplate: PropTypes.func
};
