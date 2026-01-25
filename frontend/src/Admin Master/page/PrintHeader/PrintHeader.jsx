import React, { useRef, useState, useEffect } from 'react';
import { FaPlus, FaUpload, FaTimes, FaCheck } from 'react-icons/fa';
import { MdCrop, MdDelete } from 'react-icons/md';
import './PrintHeader.scss';
import ImageEditor from '../../../Products/ProductManage/Components/ImageEditor';
import CreateHeader from './CreateHeader';
import axios from 'axios';
import { BASE_URL } from '../../../config/Config';

export default function PrintHeader({ show = false, onClose = () => {}, onSave = () => {} }) {
  const fileInputRef = useRef(null);
  const [fileName, setFileName] = useState(null);
  const [preview, setPreview] = useState(null);
  const [showImageEditor, setShowImageEditor] = useState(false);
  const [showCreateHeader, setShowCreateHeader] = useState(false);

  const [savedHeader, setSavedHeader] = useState(null);
  const [pendingHeader, setPendingHeader] = useState(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (show) fetchHeaders();
  }, [show]);

  async function fetchHeaders() {
    setLoading(true);
    setError(null);
    try {
      const resp = await axios.get(`${BASE_URL}/api/printer-headers`);
      const result = resp.data;
      const header = Array.isArray(result) ? result[0] : result;
      const draft = mapSavedHeader(header);
      setSavedHeader(draft);
      setPendingHeader(null);
      if (draft?.logo_data) {
        setPreview(draft.logo_data);
      } else {
        setPreview(null);
      }
      setFileName(draft?.header_title || null);
    } catch (e) {
      console.error('Failed to load headers', e);
      setError('Failed to load existing headers');
    } finally {
      setLoading(false);
    }
  }

  function mapSavedHeader(header) {
    if (!header) return null;
    return {
      id: header.id || header.ID,
      header_title: header.header_title || header.HeaderTitle || '',
      header_subtitle: header.header_subtitle || header.HeaderSubtitle || '',
      address: header.address || '',
      pin: header.pin || '',
      gstin: header.gstin || header.GSTIN || '',
      mobile: header.mobile || header.Mobile || '',
      email: header.email || header.Email || '',
      website: header.website || header.Website || '',
      logo_data: header.logo_data || header.LogoData || null,
      alignment: header.alignment || header.Alignment || 'center',
    };
  }

  function openFileDialog() {
    fileInputRef.current && fileInputRef.current.click();
  }

  function handleFileChange(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = () => {
      setPreview(reader.result);
    };
    reader.readAsDataURL(file);
  }

  function handleCreateHeader() {
    setShowCreateHeader(true);
  }

  async function doSave() {
    if (!preview) return;
    setSaving(true);
    setError(null);

    const source = pendingHeader || savedHeader || {};
    const payload = {
      header_title: source.header_title || fileName || 'Print Header',
      header_subtitle: source.header_subtitle || '',
      address: source.address || '',
      pin: source.pin || '',
      gstin: source.gstin || '',
      mobile: source.mobile || '',
      email: source.email || '',
      website: source.website || '',
      logo_data: preview,
      alignment: source.alignment || 'center',
    };

    try {
      const url = savedHeader?.id
        ? `${BASE_URL}/api/printer-headers/${savedHeader.id}`
        : `${BASE_URL}/api/printer-headers`;
      const resp = savedHeader?.id
        ? await axios.put(url, payload)
        : await axios.post(url, payload);
      const created = resp.data;
      const draft = mapSavedHeader(created);
      setSavedHeader(draft);
      setPendingHeader(null);
      if (draft?.logo_data) {
        setPreview(draft.logo_data);
      }
      setFileName(draft?.header_title || fileName);
      // notify parent
      onSave(created);
      onClose();
    } catch (e) {
      console.error('Failed to save header', e);
      setError('Failed to save header');
    } finally {
      setSaving(false);
    }
  }

  if (!show) return null;

  return (
    <div className="print-header-overlay" role="dialog" aria-modal="true">
      <div className="print-header-modal">
        <div className="ph-header">
          <h4>Print Header</h4>
          <button className="ph-close" onClick={onClose} aria-label="Close"><FaTimes /></button>
        </div>

        <div className="ph-body centered">
          <div className="upload-area centered">
            <input
              type="file"
              accept="image/*"
              ref={fileInputRef}
              className="hidden-file"
              onChange={handleFileChange}
            />

            <button type="button" className="btn-upload" onClick={openFileDialog}>
              <FaUpload className="icon" /> Upload File
            </button>

            <p className="recommended">Recommended Size: <strong>2480px (width) × 552px (height)</strong></p>

            <div className="or-sep"><span>or</span></div>

            <button type="button" className="btn-create" onClick={handleCreateHeader}>
              <FaPlus className="icon" /> Create Header
            </button>
          </div>
        </div>

        <div className="ph-footer">
          <button
            className="btn-done"
            onClick={doSave}
            disabled={!preview || saving}
          ><FaCheck className="icon" /> {saving ? 'Saving...' : 'Done'}</button>
        </div>
      </div>

      {/* Create Header modal */}
      {showCreateHeader && (
        <CreateHeader
          show={showCreateHeader}
          initialData={pendingHeader || savedHeader}
          onClose={() => setShowCreateHeader(false)}
          onCreate={({ fileName: fn, dataUrl, formValues }) => {
            const pending = formValues ? { ...formValues } : null;
            setPendingHeader(pending);
            setFileName(formValues?.header_title || fn || 'created-header.png');
            setPreview(formValues?.logo_data || dataUrl);
            setShowCreateHeader(false);
          }}
        />
      )}

      {/* Image editor for cropping */}
      <ImageEditor
        open={showImageEditor}
        initialSrc={preview}
        onClose={() => setShowImageEditor(false)}
        aspect={2480 / 552}
        onSave={(result) => {
          if (!result) return;
          if (typeof result === 'string') {
            setPreview(result);
          } else if (result.css) {
            setPreview(result.css);
          } else if (result.dataUrl) {
            setPreview(result.dataUrl);
          }
          setFileName((prev) => (prev ? `cropped-${prev}` : 'cropped-header.png'));
          setShowImageEditor(false);
        }}
      />
    </div>
  );
}
