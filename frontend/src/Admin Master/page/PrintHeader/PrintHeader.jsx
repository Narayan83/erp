import React, { useRef, useState, useEffect } from 'react';
import { FaPlus, FaUpload, FaTimes, FaCheck } from 'react-icons/fa';
import './PrintHeader.scss';
import ImageEditor from '../../../Products/ProductManage/Components/ImageEditor';
import CreateHeader from './CreateHeader';
import axios from 'axios';
import { BASE_URL } from '../../../config/Config';

export default function PrintHeader({ show = false, onClose = () => {}, onSave = () => {} }) {
  const fileInputRef = useRef(null);
  const [fileName, setFileName] = useState(null);
  const [preview, setPreview] = useState(null);
  const [logoList, setLogoList] = useState([]);
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

  function normalizeLogoList(logos, fallback) {
    const items = [];
    if (Array.isArray(logos)) {
      logos.forEach((v) => {
        if (typeof v === 'string' && v.trim()) items.push({ name: '', data: v.trim() });
        else if (v && typeof v === 'object' && typeof v.data === 'string' && v.data.trim())
          items.push({ name: String(v.name || ''), data: v.data.trim() });
      });
    } else if (typeof logos === 'string') {
      try {
        const parsed = JSON.parse(logos);
        if (Array.isArray(parsed))
          parsed.forEach((v) => {
            if (typeof v === 'string' && v.trim()) items.push({ name: '', data: v.trim() });
            else if (v && typeof v === 'object' && typeof v.data === 'string' && v.data.trim())
              items.push({ name: String(v.name || ''), data: v.data.trim() });
          });
      } catch (err) {
        // ignore malformed legacy data
      }
    }
    if (fallback) {
      if (typeof fallback === 'string' && fallback.trim())
        items.unshift({ name: '', data: fallback.trim() });
      else if (fallback && typeof fallback === 'object' && fallback.data)
        items.unshift({ name: String(fallback.name || ''), data: fallback.data.trim() });
    }
    // Deduplicate by data but keep/upgrade to a non-empty name when available.
    const merged = [];
    const indexByData = new Map();
    items.forEach((item) => {
      if (!item?.data) return;
      const existingIdx = indexByData.get(item.data);
      if (existingIdx === undefined) {
        indexByData.set(item.data, merged.length);
        merged.push({ name: String(item.name || ''), data: item.data });
        return;
      }
      const existing = merged[existingIdx];
      if (!existing.name && item.name) {
        merged[existingIdx] = { ...existing, name: String(item.name) };
      }
    });
    return merged;
  }

  function fileToDataUrl(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

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
      const existingLogos = normalizeLogoList(draft?.logos_data, draft?.logo_data);
      setLogoList(existingLogos);
      setPreview(draft?.logo_data || existingLogos[0]?.data || null);
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
      logos_data: header.logos_data || header.LogosData || [],
      alignment: header.alignment || header.Alignment || 'center',
    };
  }

  function openFileDialog() {
    fileInputRef.current && fileInputRef.current.click();
  }

  async function handleFileChange(e) {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;

    try {
      const newItems = await Promise.all(
        files.map(async (file) => {
          const data = await fileToDataUrl(file);
          const name = file.name.replace(/\.[^/.]+$/, '');
          return { name, data };
        })
      );
      setLogoList((prev) => normalizeLogoList([...(prev || []), ...newItems], null));
      setPreview(newItems[0]?.data || null);
      setFileName(files.length === 1 ? files[0].name : `${files.length} files selected`);
    } catch (err) {
      console.error('Failed to read image file', err);
      setError('Failed to read one or more images');
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  }

  function removeLogo(item) {
    setLogoList((prev) => {
      const next = (prev || []).filter((l) => l.data !== item.data);
      if (preview === item.data) {
        setPreview(next[0]?.data || null);
      }
      return next;
    });
  }

  function updateLogoName(item, newName) {
    setLogoList((prev) =>
      (prev || []).map((l) => (l.data === item.data ? { ...l, name: newName } : l))
    );
  }

  function handleCreateHeader() {
    setShowCreateHeader(true);
  }

  async function doSave() {
    if (!preview && logoList.length === 0) return;
    setSaving(true);
    setError(null);

    const source = pendingHeader || savedHeader || {};
    let normalizedLogos = normalizeLogoList(logoList, null);
    // ensure each logo has a user-friendly name before saving
    normalizedLogos = normalizedLogos.map((l, i) => {
      const name = (l.name || '').trim();
      if (name) return l;
      // prefer header title (fileName) for first logo, otherwise fallback to Header N
      if (i === 0) {
        const base = (source.header_title || fileName || '').toString();
        const cleaned = base.replace(/\.[^/.]+$/, '').trim();
        return { ...l, name: cleaned || `Header ${i + 1}` };
      }
      return { ...l, name: `Header ${i + 1}` };
    });
    const selectedLogo = preview || normalizedLogos[0]?.data || '';
    const payload = {
      header_title: source.header_title || fileName || 'Print Header',
      header_subtitle: source.header_subtitle || '',
      address: source.address || '',
      pin: source.pin || '',
      gstin: source.gstin || '',
      mobile: source.mobile || '',
      email: source.email || '',
      website: source.website || '',
      logo_data: selectedLogo,
      logos_data: normalizedLogos,
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
      const nextLogos = normalizeLogoList(draft?.logos_data, draft?.logo_data);
      setLogoList(nextLogos);
      setPreview(draft?.logo_data || nextLogos[0]?.data || null);
      setFileName(draft?.header_title || fileName);
      // notify parent
      onSave(created);
      // broadcast so other open pages/components pick up the change immediately
      try { window.dispatchEvent(new CustomEvent('printerHeader:changed', { detail: created })); } catch (err) { /* ignore */ }
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
              multiple
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

            {!!logoList.length && (
              <div className="logo-grid" role="list">
                {logoList.map((logo, idx) => (
                  <div
                    key={`${idx}-${logo.data.slice(0, 24)}`}
                    className={`logo-thumb-card ${preview === logo.data ? 'selected' : ''}`}
                    onClick={() => setPreview(logo.data)}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(ev) => {
                      if (ev.key === 'Enter' || ev.key === ' ') {
                        ev.preventDefault();
                        setPreview(logo.data);
                      }
                    }}
                  >
                    <img src={logo.data} alt={logo.name || `Header ${idx + 1}`} className="logo-thumb" />
                    <button
                      type="button"
                      className="logo-thumb-remove"
                      onClick={(ev) => {
                        ev.stopPropagation();
                        removeLogo(logo);
                      }}
                      aria-label={`Remove header ${idx + 1}`}
                    >
                      <FaTimes />
                    </button>
                    <input
                      type="text"
                      className="logo-name-input"
                      value={logo.name || ''}
                      placeholder={`Header ${idx + 1}`}
                      onClick={(ev) => ev.stopPropagation()}
                      onChange={(ev) => updateLogoName(logo, ev.target.value)}
                    />
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="ph-footer">
          <button
            className="btn-done"
            onClick={doSave}
            disabled={(!preview && logoList.length === 0) || saving}
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
            const nextLogo = formValues?.logo_data || dataUrl;
            setFileName(formValues?.header_title || fn || 'created-header.png');
            setPreview(nextLogo || null);
            if (nextLogo) {
              setLogoList((prev) => normalizeLogoList([...(prev || []), { name: formValues?.header_title || fn || 'Header', data: nextLogo }], null));
            }
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
            setLogoList((prev) => normalizeLogoList([...(prev || []), { name: fileName || 'Cropped Header', data: result }], null));
          } else if (result.css) {
            setPreview(result.css);
            setLogoList((prev) => normalizeLogoList([...(prev || []), { name: fileName || 'Cropped Header', data: result.css }], null));
          } else if (result.dataUrl) {
            setPreview(result.dataUrl);
            setLogoList((prev) => normalizeLogoList([...(prev || []), { name: fileName || 'Cropped Header', data: result.dataUrl }], null));
          }
          setFileName((prev) => (prev ? `cropped-${prev}` : 'cropped-header.png'));
          setShowImageEditor(false);
        }}
      />
    </div>
  );
}
