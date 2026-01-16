import React, { useRef, useState } from 'react';
import { FaTimes } from 'react-icons/fa';
import { MdCrop, MdDelete } from 'react-icons/md';
import './CreateHeader.scss';
import ImageEditor from '../../../Products/ProductManage/Components/ImageEditor';

export default function CreateHeader({ show = false, onClose = () => {}, onCreate = () => {} }) {
  const fileRef = useRef(null);
  const [company, setCompany] = useState('');
  const [address, setAddress] = useState('');
  const [pin, setPin] = useState('');
  const [cin, setCin] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [website, setWebsite] = useState('');
  const [includeLogo, setIncludeLogo] = useState(true);
  const [logoFile, setLogoFile] = useState(null);
  const [logoPreview, setLogoPreview] = useState(null);
  const [textSide, setTextSide] = useState('left');
  const [showLogoEditor, setShowLogoEditor] = useState(false);

  if (!show) return null;

  function openLogoDialog() {
    fileRef.current && fileRef.current.click();
  }

  function handleLogoChange(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setLogoFile(file);
    const reader = new FileReader();
    reader.onload = () => setLogoPreview(reader.result);
    reader.readAsDataURL(file);
  }

  async function handleSave() {
    // Compose canvas at 2480 x 552 and draw text + logo according to side
    const W = 2480;
    const H = 552;
    const canvas = document.createElement('canvas');
    canvas.width = W;
    canvas.height = H;
    const ctx = canvas.getContext('2d');

    // background
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, W, H);

    // logo area
    const padding = 40;
    const logoMaxW = 500;
    const logoMaxH = H - padding * 2;

    const textX = textSide === 'left' ? logoMaxW + padding * 2 : padding;
    const textWidth = W - logoMaxW - padding * 3;

    // draw logo if present and included
    if (includeLogo && logoPreview) {
      const img = await new Promise((resolve, reject) => {
        const i = new Image();
        i.crossOrigin = 'anonymous';
        i.onload = () => resolve(i);
        i.onerror = reject;
        i.src = logoPreview;
      }).catch(() => null);

      if (img) {
        // scale to fit logoMaxW x logoMaxH
        let lw = img.width;
        let lh = img.height;
        const scale = Math.min(logoMaxW / lw, logoMaxH / lh, 1);
        lw = Math.round(lw * scale);
        lh = Math.round(lh * scale);
        const lx = textSide === 'left' ? padding : W - padding - lw;
        const ly = Math.round((H - lh) / 2);
        ctx.drawImage(img, lx, ly, lw, lh);
      }
    }

    // draw text block
    ctx.fillStyle = '#222';
    ctx.textBaseline = 'top';

    // company name - larger
    ctx.font = 'bold 48px Arial';
    // wrap company name and address to multiple lines within textWidth
    const lines = [];
    if (company) lines.push(company);
    if (address) lines.push(...address.split('\n'));
    // other small lines
    if (pin) lines.push(pin);
    if (cin) lines.push(cin);
    if (phone) lines.push(phone);
    if (email) lines.push(email);
    if (website) lines.push(website);

    const lineGap = 10;
    let y = 60;

    // If text side is left, start after logo; otherwise offset to right area
    let startX = textSide === 'left' ? textX : textX;

    // Company name specially styled
    if (company) {
      ctx.font = 'bold 48px Arial';
      ctx.fillText(company, startX, y);
      y += 48 + lineGap + 6;
    }

    ctx.font = '16px Arial';
    lines.slice(company ? 1 : 0).forEach((ln) => {
      // basic wrap
      const words = ln.split(' ');
      let cur = '';
      words.forEach((w) => {
        const test = cur ? cur + ' ' + w : w;
        const width = ctx.measureText(test).width;
        if (width > textWidth) {
          ctx.fillText(cur, startX, y);
          y += 20 + lineGap;
          cur = w;
        } else cur = test;
      });
      if (cur) {
        ctx.fillText(cur, startX, y);
        y += 20 + lineGap;
      }
    });

    const dataUrl = canvas.toDataURL('image/png');
    onCreate({ fileName: 'created-header.png', dataUrl });
    onClose();
  }

  return (
    <div className="create-header-overlay" role="dialog" aria-modal="true">
      <div className="create-header-modal">
        <div className="ch-header">
          <h4>Create Print Header</h4>
          <div className="ch-actions">
            <button className="ph-close" onClick={onClose} aria-label="Close"><FaTimes /></button>
          </div>
        </div>

        <div className="ch-body">
          <div className="ch-left">
            <input className="input" placeholder="Company name" value={company} onChange={(e) => setCompany(e.target.value)} />
            <textarea className="input textarea" placeholder="Address" value={address} onChange={(e) => setAddress(e.target.value)} />
            <input className="input" placeholder="PIN Code" value={pin} onChange={(e) => setPin(e.target.value)} />
            <input className="input" placeholder="CIN" value={cin} onChange={(e) => setCin(e.target.value)} />
            <input className="input" placeholder="Phone" value={phone} onChange={(e) => setPhone(e.target.value)} />
            <input className="input" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} />
            <input className="input" placeholder="Website" value={website} onChange={(e) => setWebsite(e.target.value)} />
          </div>

          <div className="ch-right">
            <label className="checkbox-inline"><input type="checkbox" checked={includeLogo} onChange={(e) => setIncludeLogo(e.target.checked)} /> Include Logo</label>
            <div className="logo-wrap">
              <div className="logo-box" onClick={openLogoDialog}>
                {logoPreview ? (
                  <img src={logoPreview} alt="logo" />
                ) : (
                  <div className="placeholder">+ Add Logo</div>
                )}
              </div>

              {logoPreview && (
                <div className="logo-controls">
                  <button
                    className="logo-crop"
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowLogoEditor(true);
                    }}
                    aria-label="Crop logo"
                    data-tooltip="Crop logo"
                  ><MdCrop /></button>

                  <button
                    className="logo-remove"
                    onClick={(e) => {
                      e.stopPropagation();
                      setLogoPreview(null);
                      setLogoFile(null);
                    }}
                    aria-label="Remove logo"
                    data-tooltip="Remove logo"
                  ><MdDelete /></button>
                </div>
              )}
            </div>
            <input type="file" accept="image/*" ref={fileRef} className="hidden-file" onChange={handleLogoChange} />

            <div className="text-side">
              <div>Text Side</div>
              <div className="side-controls">
                <button className={`side-btn ${textSide === 'left' ? 'active' : ''}`} onClick={() => setTextSide('left')}>&lt; Left</button>
                <button className={`side-btn ${textSide === 'right' ? 'active' : ''}`} onClick={() => setTextSide('right')}>Right &gt;</button>
              </div>
            </div>

            <div className="ch-footer-left">
              <button className="btn-save-bottom" onClick={handleSave}>Save</button>
            </div>
          </div>
        </div>
      </div>

      {/* Logo image crop editor */}
      <ImageEditor
        open={showLogoEditor}
        initialSrc={logoPreview}
        onClose={() => setShowLogoEditor(false)}
        aspect={1}
        onSave={(result) => {
          if (!result) return;
          if (typeof result === 'string') setLogoPreview(result);
          else if (result.css) setLogoPreview(result.css);
          else if (result.dataUrl) setLogoPreview(result.dataUrl);
          if (result.blob) setLogoFile(result.blob);
          setShowLogoEditor(false);
        }}
      />
    </div>
  );
}
