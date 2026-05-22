import React, { useEffect, useRef, useState, useCallback } from 'react';
import PropTypes from 'prop-types';
import axios from 'axios';
import { BASE_URL } from '../config/Config';
import './bulk_image_upload_dialog.scss';

const IMAGE_EXT = /\.(jpe?g|png|webp|gif)$/i;
const CODE_STEM = /^[A-Za-z0-9_-]+$/;
const GALLERY_STEM = /^([A-Za-z0-9_-]+)_(\d+)$/;

/**
 * PP242500.jpg → main image (main_image)
 * PP242500_1.jpg, PP242500_2.jpg → gallery (images column)
 */
function parseProductImageFilename(name) {
  const base = String(name || '').split(/[/\\]/).pop() || '';
  if (!IMAGE_EXT.test(base)) return null;
  const stem = base.replace(/\.[^.]+$/i, '').trim();
  if (!stem) return null;

  const galleryMatch = stem.match(GALLERY_STEM);
  if (galleryMatch) {
    const productCode = galleryMatch[1];
    const sortKey = parseInt(galleryMatch[2], 10);
    if (!productCode || !Number.isFinite(sortKey) || sortKey < 1) return null;
    return {
      productCode,
      role: 'gallery',
      galleryIndex: sortKey,
      sortKey,
      file: null,
    };
  }

  if (!CODE_STEM.test(stem)) return null;
  return {
    productCode: stem,
    role: 'main',
    galleryIndex: null,
    sortKey: 0,
    file: null,
  };
}

function sortUploadQueue(a, b) {
  const codeCmp = a.productCode.localeCompare(b.productCode, undefined, { sensitivity: 'base' });
  if (codeCmp !== 0) return codeCmp;
  return a.sortKey - b.sortKey;
}

export default function BulkImageUploadDialog({ open, onClose, onComplete }) {
  const folderInputRef = useRef(null);
  const abortRef = useRef(false);

  const [files, setFiles] = useState([]);
  const [scanStats, setScanStats] = useState({ main: 0, gallery: 0 });
  const [notFoundCodes, setNotFoundCodes] = useState([]);
  const [invalidFiles, setInvalidFiles] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [currentFile, setCurrentFile] = useState(null);
  const [progress, setProgress] = useState({ done: 0, total: 0, success: 0, failed: 0 });
  const [log, setLog] = useState([]);
  const [phase, setPhase] = useState('idle');

  const resetState = useCallback(() => {
    abortRef.current = false;
    setFiles([]);
    setScanStats({ main: 0, gallery: 0 });
    setNotFoundCodes([]);
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

  const loadProductCodes = async () => {
    const res = await axios.get(`${BASE_URL}/api/products/codes`);
    const codes = res.data?.codes || [];
    const map = new Map();
    codes.forEach((code) => {
      const key = String(code).trim();
      if (key) map.set(key.toUpperCase(), key);
    });
    return map;
  };

  const handleFolderChange = async (e) => {
    const selected = Array.from(e.target.files || []);
    if (selected.length === 0) return;

    setPhase('scanning');
    setLog([{ type: 'info', text: `Scanning ${selected.length} file(s) in folder…` }]);

    const parsed = [];
    const invalid = [];
    selected.forEach((file) => {
      const meta = parseProductImageFilename(file.name);
      if (meta == null) {
        invalid.push(file.name);
        return;
      }
      parsed.push({ ...meta, file });
    });

    parsed.sort(sortUploadQueue);

    const seen = new Set();
    const deduped = [];
    parsed.forEach((entry) => {
      const key = `${entry.productCode.toUpperCase()}:${entry.role}:${entry.sortKey}`;
      if (seen.has(key)) return;
      seen.add(key);
      deduped.push(entry);
    });

    try {
      const codeMap = await loadProductCodes();
      const missingSet = new Set();
      const toUpload = [];
      let mainCount = 0;
      let galleryCount = 0;

      deduped.forEach((entry) => {
        const canonical = codeMap.get(entry.productCode.toUpperCase());
        if (canonical) {
          toUpload.push({
            productCode: canonical,
            role: entry.role,
            galleryIndex: entry.galleryIndex,
            sortKey: entry.sortKey,
            file: entry.file,
          });
          if (entry.role === 'main') mainCount += 1;
          else galleryCount += 1;
        } else {
          missingSet.add(entry.productCode);
        }
      });

      setFiles(toUpload);
      setScanStats({ main: mainCount, gallery: galleryCount });
      setNotFoundCodes([...missingSet].sort((a, b) => a.localeCompare(b, undefined, { sensitivity: 'base' })));
      setInvalidFiles(invalid);
      setPhase('ready');
      setLog([
        { type: 'info', text: `Found ${deduped.length} image(s): ${mainCount} main, ${galleryCount} gallery.` },
        { type: 'info', text: `${toUpload.length} will be uploaded; ${missingSet.size} product code(s) not in database.` },
        ...(invalid.length > 0
          ? [{
              type: 'warn',
              text: `${invalid.length} file(s) skipped. Use CODE.ext for main or CODE_1.ext, CODE_2.ext for gallery.`,
            }]
          : []),
      ]);
    } catch (err) {
      setPhase('idle');
      setLog([{ type: 'error', text: err?.response?.data?.error || err.message || 'Failed to load product codes' }]);
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

      const { productCode, role, galleryIndex, file } = files[i];
      setCurrentFile(file.name);
      const roleLabel = role === 'main' ? 'main image' : `gallery _${galleryIndex}`;
      appendLog({ type: 'info', text: `Uploading ${file.name} (${productCode}, ${roleLabel})…` });

      const formData = new FormData();
      formData.append('product_code', productCode);
      formData.append('image_role', role);
      if (role === 'gallery' && galleryIndex != null) {
        formData.append('gallery_index', String(galleryIndex));
      }
      formData.append('image', file, file.name);

      try {
        const res = await axios.post(`${BASE_URL}/api/products/bulk-image`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        success += 1;
        const savedAs = res.data?.image_role === 'gallery' ? 'images' : 'main_image';
        appendLog({
          type: 'success',
          text: `✓ ${file.name} → ${savedAs} (${res.data?.variants_updated || 0} variant(s))`,
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
              <li>
                <strong>Main image</strong> — file name equals product code: <code>PP242500.jpg</code> → saved to{' '}
                <code>main_image</code>.
              </li>
              <li>
                <strong>Extra images</strong> — underscore + number: <code>PP242500_1.jpg</code>, <code>PP242500_2.png</code>{' '}
                → saved to <code>images</code> for the same product.
              </li>
              <li>Upload order: main image first, then _1, _2, … per product code.</li>
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
              <span>Ready: {files.length}</span>
              <span>Main: {scanStats.main}</span>
              <span>Gallery: {scanStats.gallery}</span>
              <span>Not in DB: {notFoundCodes.length}</span>
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

          {notFoundCodes.length > 0 && (
            <div className="bulk-not-found">
              <strong>Product codes not found in database</strong> (images exist in folder):
              <br />
              {notFoundCodes.join(', ')}
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
