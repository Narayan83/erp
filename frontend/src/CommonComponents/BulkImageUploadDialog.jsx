import React, { useEffect, useRef, useState, useCallback } from 'react';
import PropTypes from 'prop-types';
import axios from 'axios';
import { BASE_URL } from '../config/Config';
import './bulk_image_upload_dialog.scss';

const IMAGE_EXT = /\.(jpe?g|png|webp|gif)$/i;

function parseProductIdFromFilename(name) {
  const base = String(name || '').split(/[/\\]/).pop() || '';
  if (!IMAGE_EXT.test(base)) return null;
  const stem = base.replace(/\.[^.]+$/i, '');
  if (!/^\d+$/.test(stem)) return null;
  return parseInt(stem, 10);
}

function sortByProductId(a, b) {
  return a.productId - b.productId;
}

export default function BulkImageUploadDialog({ open, onClose, onComplete }) {
  const folderInputRef = useRef(null);
  const abortRef = useRef(false);

  const [files, setFiles] = useState([]);
  const [notFoundIds, setNotFoundIds] = useState([]);
  const [invalidFiles, setInvalidFiles] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [currentFile, setCurrentFile] = useState(null);
  const [progress, setProgress] = useState({ done: 0, total: 0, success: 0, failed: 0 });
  const [log, setLog] = useState([]);
  const [phase, setPhase] = useState('idle');

  const resetState = useCallback(() => {
    abortRef.current = false;
    setFiles([]);
    setNotFoundIds([]);
    setInvalidFiles([]);
    setUploading(false);
    setCurrentFile(null);
    setProgress({ done: 0, total: 0, success: 0, failed: 0 });
    setLog([]);
    setPhase('idle');
    if (folderInputRef.current) folderInputRef.current.value = '';
  }, []);

  useEffect(() => {
    if (!open) {
      resetState();
      return undefined;
    }
    const onKey = (e) => {
      if (e.key === 'Escape' && !uploading) onClose && onClose();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, onClose, uploading, resetState]);

  const loadProductIds = async () => {
    const res = await axios.get(`${BASE_URL}/api/products/ids`);
    const ids = res.data?.ids || [];
    return new Set(ids.map((id) => Number(id)));
  };

  const handleFolderChange = async (e) => {
    const selected = Array.from(e.target.files || []);
    if (selected.length === 0) return;

    setPhase('scanning');
    setLog([{ type: 'info', text: `Scanning ${selected.length} file(s) in folder…` }]);

    const valid = [];
    const invalid = [];
    selected.forEach((file) => {
      const productId = parseProductIdFromFilename(file.name);
      if (productId == null) {
        invalid.push(file.name);
        return;
      }
      valid.push({ productId, file });
    });

    valid.sort(sortByProductId);

    const seen = new Set();
    const deduped = [];
    valid.forEach((entry) => {
      if (seen.has(entry.productId)) return;
      seen.add(entry.productId);
      deduped.push(entry);
    });

    try {
      const idSet = await loadProductIds();
      const missing = deduped.filter((entry) => !idSet.has(entry.productId)).map((entry) => entry.productId);
      const toUpload = deduped.filter((entry) => idSet.has(entry.productId));

      setFiles(toUpload);
      setNotFoundIds(missing.sort((a, b) => a - b));
      setInvalidFiles(invalid);
      setPhase('ready');
      setLog([
        { type: 'info', text: `Found ${deduped.length} image(s) named by product ID.` },
        { type: 'info', text: `${toUpload.length} will be uploaded; ${missing.length} product ID(s) not in database.` },
        ...(invalid.length > 0
          ? [{ type: 'warn', text: `${invalid.length} file(s) skipped (name must be like 1.jpg, 2.png).` }]
          : []),
      ]);
    } catch (err) {
      setPhase('idle');
      setLog([{ type: 'error', text: err?.response?.data?.error || err.message || 'Failed to load product IDs' }]);
    }
  };

  const appendLog = (entry) => {
    setLog((prev) => [...prev, entry]);
  };

  const handleUpload = async () => {
    if (files.length === 0 || uploading) return;
    abortRef.current = false;
    setUploading(true);
    setPhase('uploading');
    setProgress({ done: 0, total: files.length, success: 0, failed: 0 });

    let success = 0;
    let failed = 0;

    for (let i = 0; i < files.length; i += 1) {
      if (abortRef.current) {
        appendLog({ type: 'warn', text: 'Upload cancelled by user.' });
        break;
      }

      const { productId, file } = files[i];
      setCurrentFile(file.name);
      appendLog({ type: 'info', text: `Uploading ${file.name} (product ID ${productId})…` });

      const formData = new FormData();
      formData.append('product_id', String(productId));
      formData.append('image', file, file.name);

      try {
        const res = await axios.post(`${BASE_URL}/api/products/bulk-image`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        success += 1;
        appendLog({
          type: 'success',
          text: `✓ ${file.name} → ${res.data?.image_path || 'saved'} (${res.data?.variants_updated || 0} variant(s))`,
        });
      } catch (err) {
        failed += 1;
        const msg = err?.response?.data?.error || err.message || 'Upload failed';
        appendLog({ type: 'error', text: `✗ ${file.name}: ${msg}` });
      }

      setProgress({ done: i + 1, total: files.length, success, failed });
    }

    setCurrentFile(null);
    setUploading(false);
    setPhase('done');
    appendLog({ type: 'info', text: `Finished. ${success} succeeded, ${failed} failed.` });
    if (onComplete && success > 0) onComplete();
  };

  const handleCancelUpload = () => {
    abortRef.current = true;
  };

  if (!open) return null;

  const pct = progress.total > 0 ? Math.round((progress.done / progress.total) * 100) : 0;

  return (
    <div className="bulk-image-dialog-overlay" onClick={() => !uploading && onClose && onClose()}>
      <div className="bulk-image-dialog import-dialog" role="dialog" aria-modal="true" onClick={(e) => e.stopPropagation()}>
        <div className="import-dialog-body">
          <div className="dialog-body-title"><h3 className="import-dialog-title">Bulk Product Images</h3></div>
          <div className="import-instructions">
            <strong>Instructions:</strong>
            <ul className="instruction-list">
              <li>Place images in a folder on your computer (e.g. Windows server share).</li>
              <li>Name each file by <strong>product ID</strong> from the products table: <code>1.jpg</code>, <code>2.png</code>, etc.</li>
              <li>Select the folder — images upload one by one to the server and update product variant image paths.</li>
            </ul>
          </div>

          <label className="file-chooser">
            <input
              ref={folderInputRef}
              type="file"
              className="bulk-folder-input"
              webkitdirectory=""
              multiple
              accept="image/*"
              onChange={handleFolderChange}
              disabled={uploading || phase === 'scanning'}
            />
            <span className="file-chooser-btn">Choose image folder</span>
          </label>

          {phase !== 'idle' && (
            <div className="bulk-summary-stats">
              <span>Ready to upload: {files.length}</span>
              <span>Not in DB: {notFoundIds.length}</span>
            </div>
          )}

          {uploading && (
            <>
              <div className="bulk-current-file">Uploading: {currentFile}</div>
              <div className="bulk-progress-bar">
                <div className="bulk-progress-fill" style={{ width: `${pct}%` }} />
              </div>
              <div className="bulk-summary-stats">
                <span>{progress.done} / {progress.total} ({pct}%)</span>
                <span>OK: {progress.success}</span>
                <span>Failed: {progress.failed}</span>
              </div>
            </>
          )}

          {notFoundIds.length > 0 && (
            <div className="bulk-not-found">
              <strong>Product IDs not found in database</strong> (images exist in folder):
              <br />
              {notFoundIds.join(', ')}
            </div>
          )}

          {invalidFiles.length > 0 && phase === 'ready' && (
            <div className="bulk-not-found" style={{ background: '#f1f5f9', borderColor: '#cbd5e1', color: '#475569' }}>
              <strong>Skipped files</strong> (invalid name): {invalidFiles.slice(0, 20).join(', ')}
              {invalidFiles.length > 20 ? ` … and ${invalidFiles.length - 20} more` : ''}
            </div>
          )}

          {log.length > 0 && (
            <div className="bulk-log">
              {log.map((entry, i) => (
                <div key={i} className={`bulk-log-line ${entry.type}`}>{entry.text}</div>
              ))}
            </div>
          )}
        </div>

        <footer className="import-dialog-actions">
          {uploading ? (
            <button type="button" className="btn btn-secondary" onClick={handleCancelUpload}>Cancel upload</button>
          ) : (
            <>
              <button type="button" className="btn btn-secondary" onClick={() => onClose && onClose()}>Close</button>
              <button
                type="button"
                className="btn btn-primary"
                disabled={files.length === 0 || phase === 'scanning'}
                onClick={handleUpload}
              >
                Start upload
              </button>
            </>
          )}
        </footer>
      </div>
    </div>
  );
}

BulkImageUploadDialog.propTypes = {
  open: PropTypes.bool,
  onClose: PropTypes.func,
  onComplete: PropTypes.func,
};
