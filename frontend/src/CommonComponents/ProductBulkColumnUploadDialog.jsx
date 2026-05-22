import React, { useEffect, useState, useCallback } from 'react';
import PropTypes from 'prop-types';
import axios from 'axios';
import * as XLSX from 'xlsx';
import { BASE_URL } from '../config/Config';
import BulkColumnUpdateReportDialog from './BulkColumnUpdateReportDialog';
import './product_bulk_column_upload_dialog.scss';

export default function ProductBulkColumnUploadDialog({ open, onClose, onComplete }) {
  const [columnsMeta, setColumnsMeta] = useState(null);
  const [loadingMeta, setLoadingMeta] = useState(false);
  const [uploadFile, setUploadFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [report, setReport] = useState(null);
  const [reportOpen, setReportOpen] = useState(false);

  const reset = useCallback(() => {
    setUploadFile(null);
    setUploading(false);
    setError('');
    setReport(null);
    setReportOpen(false);
  }, []);

  useEffect(() => {
    if (!open) {
      reset();
      return;
    }
    const load = async () => {
      setLoadingMeta(true);
      setError('');
      try {
        const res = await axios.get(`${BASE_URL}/api/products/bulk-update/columns`);
        setColumnsMeta(res.data);
      } catch (err) {
        setError(err?.response?.data?.error || err.message || 'Failed to load columns');
      } finally {
        setLoadingMeta(false);
      }
    };
    load();
  }, [open, reset]);

  const downloadTemplate = () => {
    const col = columnsMeta?.default_column || 'std_sales_price';
    const ws = XLSX.utils.aoa_to_sheet([
      ['code', col],
      ['EL242000', ''],
      ['ET242000', ''],
    ]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'BulkUpdate');
    XLSX.writeFile(wb, 'product_bulk_column_template.xlsx');
  };

  const parseExcel = async (file) => {
    const buf = await file.arrayBuffer();
    const wb = XLSX.read(buf, { type: 'array' });
    const sheet = wb.Sheets[wb.SheetNames[0]];
    const rows = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' });
    if (!rows.length) throw new Error('Excel file is empty');

    const header = (rows[0] || []).map((h) => String(h).trim());
    const codeIdx = header.findIndex((h) => h.toLowerCase() === 'code');
    if (codeIdx < 0) throw new Error('First row must include a "code" column header');

    let valueIdx = -1;
    for (let i = 0; i < header.length; i += 1) {
      if (i !== codeIdx && String(header[i]).trim() !== '') {
        valueIdx = i;
        break;
      }
    }
    if (valueIdx < 0) throw new Error('Second column header must be the database column name (e.g. std_sales_price)');

    const column = String(header[valueIdx]).trim();
    const dataRows = [];
    for (let r = 1; r < rows.length; r += 1) {
      const row = rows[r] || [];
      const code = String(row[codeIdx] ?? '').trim();
      const value = row[valueIdx] != null ? String(row[valueIdx]).trim() : '';
      if (!code && !value) continue;
      dataRows.push({ code, value });
    }
    if (dataRows.length === 0) throw new Error('No data rows found below the header');
    return { column, rows: dataRows };
  };

  const handleUpload = async () => {
    if (!uploadFile || uploading) return;
    setUploading(true);
    setError('');
    try {
      const { column, rows } = await parseExcel(uploadFile);
      const res = await axios.post(`${BASE_URL}/api/products/bulk-update-column`, { column, rows }, {
        headers: { 'X-Audit-Menu': 'Product Master - Bulk Column Update' },
      });
      setReport(res.data);
      setReportOpen(true);
      if (onComplete && (res.data?.successCount || 0) > 0) onComplete();
    } catch (err) {
      setError(err?.response?.data?.error || err.message || 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const handleReportClose = () => {
    setReportOpen(false);
    setReport(null);
    onClose?.();
  };

  if (!open) return null;

  return (
    <>
      {!reportOpen && (
      <div className="bulk-col-dialog-overlay" onClick={() => !uploading && onClose?.()}>
      <div className="bulk-col-dialog import-dialog" role="dialog" aria-modal="true" onClick={(e) => e.stopPropagation()}>
        <div className="import-dialog-body">
          <div className="dialog-body-title"><h3 className="import-dialog-title">Bulk Update Column (Excel)</h3></div>
          <div className="import-instructions">
            <strong>Excel format:</strong>
            <ul className="instruction-list">
              <li>Column A header: <code>code</code> (mandatory) — product code from Product Master</li>
              <li>Column B header: database column name (default: <code>std_sales_price</code>)</li>
              <li>One value per row; updates all variants when the column is on <code>product_variants</code></li>
            </ul>
          </div>

          {loadingMeta ? (
            <p className="bulk-col-loading">Loading column reference…</p>
          ) : columnsMeta && (
            <div className="bulk-col-reference">
              <details>
                <summary>View all updatable columns (products &amp; product_variants)</summary>
                <div className="bulk-col-tables">
                  <div>
                    <strong>products</strong>
                    <table><thead><tr><th>Column</th><th>Type</th></tr></thead><tbody>
                      {(columnsMeta.products || []).map((c) => (
                        <tr key={c.name}><td><code>{c.name}</code></td><td>{c.type}</td></tr>
                      ))}
                    </tbody></table>
                  </div>
                  <div>
                    <strong>product_variants</strong>
                    <table><thead><tr><th>Column</th><th>Type</th></tr></thead><tbody>
                      {(columnsMeta.product_variants || []).map((c) => (
                        <tr key={c.name}><td><code>{c.name}</code></td><td>{c.type}</td></tr>
                      ))}
                    </tbody></table>
                  </div>
                </div>
              </details>
            </div>
          )}

          <div className="import-controls">
            <button type="button" className="download-template" onClick={downloadTemplate}>↓ Download template Excel</button>
            <label className="file-chooser">
              <input type="file" accept=".xlsx,.xls,.csv" onChange={(e) => setUploadFile(e.target.files?.[0] || null)} disabled={uploading} />
              <span className="file-chooser-btn">Choose Excel file</span>
            </label>
            {uploadFile && <div className="selected-file"><span className="file-name">{uploadFile.name}</span></div>}
          </div>

          {error && <p className="bulk-col-error">{error}</p>}
        </div>
        <footer className="import-dialog-actions">
          <button type="button" className="btn btn-secondary" onClick={() => onClose?.()} disabled={uploading}>Close</button>
          <button type="button" className="btn btn-primary" onClick={handleUpload} disabled={!uploadFile || uploading}>
            {uploading ? 'Uploading…' : 'Upload & Update'}
          </button>
        </footer>
      </div>

      </div>
      )}

      <BulkColumnUpdateReportDialog
        open={reportOpen}
        onClose={handleReportClose}
        report={report}
      />
    </>
  );
}

ProductBulkColumnUploadDialog.propTypes = {
  open: PropTypes.bool,
  onClose: PropTypes.func,
  onComplete: PropTypes.func,
};
