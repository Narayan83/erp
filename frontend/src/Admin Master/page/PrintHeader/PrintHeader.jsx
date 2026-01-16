import React, { useRef, useState } from 'react';
import { FaPlus, FaUpload, FaTimes, FaCheck } from 'react-icons/fa';
import { MdCrop, MdDelete } from 'react-icons/md';
import './PrintHeader.scss';
import ImageEditor from '../../../Products/ProductManage/Components/ImageEditor';
import CreateHeader from './CreateHeader';

export default function PrintHeader({ show = false, onClose = () => {}, onSave = () => {} }) {
  const fileInputRef = useRef(null);
  const [fileName, setFileName] = useState(null);
  const [preview, setPreview] = useState(null);
  const [isCreating, setIsCreating] = useState(false);
  const [showImageEditor, setShowImageEditor] = useState(false);
  const [showCreateHeader, setShowCreateHeader] = useState(false);

  if (!show) return null;

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
    // Open the Create Header modal where user can compose header details
    setShowCreateHeader(true);
  }

  function handleSave() {
    // pass preview data back to parent
    onSave({ fileName, dataUrl: preview });
    onClose();
  }

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

            <button type="button" className="btn-create" onClick={handleCreateHeader} disabled={isCreating}>
              <FaPlus className="icon" /> Create Header
            </button>

            {preview && (
              <div className="thumb-wrap">
                <img className="thumb" src={preview} alt="Header thumbnail" />
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

        <div className="ph-footer">
          <button
            className="btn-done"
            onClick={() => {
              if (preview) {
                onSave({ fileName, dataUrl: preview });
              }
              onClose();
            }}
            disabled={!preview}
          ><FaCheck className="icon" /> Done</button>
        </div>
      </div>

      {/* Create Header modal */}
      {showCreateHeader && (
        <CreateHeader
          show={showCreateHeader}
          onClose={() => setShowCreateHeader(false)}
          onCreate={({ fileName: fn, dataUrl }) => {
            setFileName(fn || 'created-header.png');
            setPreview(dataUrl);
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
