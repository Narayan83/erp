import React, { useRef, useState, useEffect } from 'react';
import axios from 'axios';
import { BASE_URL } from "../../../config/Config";
import { FaUpload, FaTimes, FaCheck } from 'react-icons/fa';
import { MdCrop, MdDelete } from 'react-icons/md';
import ImageEditor from '../../../Products/ProductManage/Components/ImageEditor';
import './DigitalSign.scss';

export default function DigitalSign({ show = false, onClose = () => {}, onSave = () => {} }) {
  const fileInputRef = useRef(null);
  const [fileName, setFileName] = useState(null);
  const [preview, setPreview] = useState(null);
  const [showImageEditor, setShowImageEditor] = useState(false);

  useEffect(() => {
    if (show) {
      const fetchData = async () => {
        try {
          const res = await axios.get(`${BASE_URL}/api/integrations`, {
            params: { type: 'digital_signature', provider: 'custom' }
          });
          if (res.data && res.data.length > 0) {
            const config = res.data[0].config;
            setPreview(config.dataUrl || config.image);
            setFileName(config.fileName || 'signature.png');
          }
        } catch (err) {
          console.error("Error fetching digital signature:", err);
        }
      };
      fetchData();
    }
  }, [show]);

  if (!show) return null;

  function openFileDialog() {
    fileInputRef.current && fileInputRef.current.click();
  }

  function handleFileChange(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = () => setPreview(reader.result);
    reader.readAsDataURL(file);
  }

  function handleSave() {
    if (preview) {
      onSave({ fileName, dataUrl: preview });
    }
    onClose();
  }

  return (
    <div className="digital-sign-overlay" role="dialog" aria-modal="true">
      <div className="digital-sign-modal">
        <div className="ds-header">
          <h4>Digital Signature</h4>
          <button className="ds-close" onClick={onClose} aria-label="Close"><FaTimes /></button>
        </div>

        <div className="ds-body centered">
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

            <p className="recommended">Recommended Size : <strong>150px (width) × 150px (height)</strong></p>

            {preview && (
              <div className="thumb-wrap">
                <img className="thumb" src={preview} alt="Signature preview" />
                <div className="file-name">{fileName}</div>
                <div className="thumb-actions">
                  <button className="btn-crop" onClick={() => setShowImageEditor(true)} title="Crop image">
                    <MdCrop /> Crop
                  </button>
                  <button className="btn-remove" onClick={() => { setPreview(null); setFileName(null); }} title="Remove image">
                    <MdDelete /> Remove
                  </button>
                </div>
              </div>
            )}

          </div>
        </div>

        <div className="ds-footer">
          <button
            className="btn-save"
            onClick={handleSave}
            disabled={!preview}
          ><FaCheck className="icon" /> Save</button>
        </div>
      </div>

      {/* Image editor for cropping */}
      <ImageEditor
        open={showImageEditor}
        initialSrc={preview}
        aspect={1}
        onClose={() => setShowImageEditor(false)}
        onSave={(result) => {
          if (!result) return;
          if (typeof result === 'string') {
            setPreview(result);
          } else if (result.css) {
            setPreview(result.css);
          } else if (result.dataUrl) {
            setPreview(result.dataUrl);
          }
          setFileName((prev) => (prev ? `cropped-${prev}` : 'cropped-signature.png'));
          setShowImageEditor(false);
        }}
      />
    </div>
  );
}
