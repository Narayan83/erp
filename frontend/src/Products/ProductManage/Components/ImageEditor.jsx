import React from 'react';
import Cropper from 'react-easy-crop';
import './imageeditor.scss';

export default function ImageEditor({ open, initialSrc, onSave, onClose, aspect = 1 }) {
  const [crop, setCrop] = React.useState({ x: 0, y: 0 });
  const [zoom, setZoom] = React.useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = React.useState(null);
  const [isDragging, setIsDragging] = React.useState(false);
  // When true, export PNG with transparent background and show checkerboard in preview
  const [transparentBg, setTransparentBg] = React.useState(true);

  // refs and zoom limits
  const cropperRef = React.useRef(null);
  const MIN_ZOOM = 0.1;
  const MAX_ZOOM = 3;

  React.useEffect(() => {
    if (open) {
      setCrop({ x: 0, y: 0 });
      setZoom(1);
      setCroppedAreaPixels(null);
    }
  }, [open, initialSrc]);

  // Attach a non-passive capturing wheel handler on window and only act when pointer is over the cropper
  const hoveredRef = React.useRef(false);

  React.useEffect(() => {
    const onWheel = (e) => {
      // Only act when pointer is over cropper
      if (!hoveredRef.current) return;

      // Prevent default page scroll
      e.preventDefault();
      e.stopPropagation();

      // deltaY > 0 means wheel down (zoom out), < 0 wheel up (zoom in)
      const delta = e.deltaY;
      // scale step based on delta; make sensitivity slightly higher for touchpads
      const step = Math.max(0.02, Math.min(0.25, Math.abs(delta) / 500));
      setZoom((prev) => {
        let next = prev + (delta < 0 ? step : -step);
        if (next < MIN_ZOOM) next = MIN_ZOOM;
        if (next > MAX_ZOOM) next = MAX_ZOOM;
        return +next.toFixed(2);
      });
    };

    window.addEventListener('wheel', onWheel, { passive: false, capture: true });
    return () => window.removeEventListener('wheel', onWheel, { passive: false, capture: true });
  }, [setZoom]);

  const onCropComplete = React.useCallback((_, croppedPixels) => {
    setCroppedAreaPixels(croppedPixels);
  }, []);

  const createImage = (url) =>
    new Promise((resolve, reject) => {
      const image = new Image();
      // allow cross-origin images to be loaded without tainting the canvas when possible
      image.crossOrigin = 'anonymous';
      image.addEventListener('load', () => resolve(image));
      image.addEventListener('error', (error) => reject(error));
      image.src = url;
    });

  const getCroppedImg = async (imageSrc, pixelCrop, mime = 'image/png', quality = 0.92) => {
    if (!imageSrc || !pixelCrop) return null;
    const image = await createImage(imageSrc);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    canvas.width = Math.max(1, Math.round(pixelCrop.width));
    canvas.height = Math.max(1, Math.round(pixelCrop.height));

    // ensure transparent background if PNG requested
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    ctx.drawImage(
      image,
      Math.round(pixelCrop.x),
      Math.round(pixelCrop.y),
      Math.round(pixelCrop.width),
      Math.round(pixelCrop.height),
      0,
      0,
      canvas.width,
      canvas.height
    );

    return new Promise((resolve, reject) => {
      canvas.toBlob((blob) => {
        if (!blob) return reject(new Error('Failed to create blob from canvas'));
        const reader = new FileReader();
        reader.onloadend = () => resolve({ blob, dataUrl: reader.result });
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      }, mime, quality);
    });
  };

  const handleSave = async () => {
    try {
      const mime = transparentBg ? 'image/png' : 'image/jpeg';
      const quality = transparentBg ? undefined : 0.92;
      const result = await getCroppedImg(initialSrc, croppedAreaPixels, mime, quality);

      if (result && result.blob && result.dataUrl) {
        const blobUrl = URL.createObjectURL(result.blob);
        onSave && onSave({ css: result.dataUrl, hi: blobUrl, blob: result.blob, mime });
      } else if (result && result.dataUrl) {
        onSave && onSave(result.dataUrl);
      } else {
        onSave && onSave(initialSrc);
      }
    } catch (e) {
      console.error('Error while cropping image', e);
    } finally {
      onClose && onClose();
    }
  };

  if (!open) return null;

  return (
    <div className={"image-editor-overlay open"} role="dialog" aria-modal="true">
      <div className="image-editor-dialog">
        <div className="image-editor-header">
          <h3>Edit Image</h3>
          <button className="close-btn" onClick={onClose}>&times;</button>
        </div>
        <div className="image-editor-body">
          <div
            ref={cropperRef}
            className={`cropper-wrapper ${isDragging ? 'dragging' : ''} ${transparentBg ? 'transparent' : ''}`}
            onMouseEnter={() => (hoveredRef.current = true)}
            onMouseDown={() => setIsDragging(true)}
            onMouseUp={() => setIsDragging(false)}
            onMouseLeave={() => { hoveredRef.current = false; setIsDragging(false); }}
          >
            {initialSrc ? (
              <Cropper
                image={initialSrc}
                crop={crop}
                zoom={zoom}
                aspect={aspect}
                onCropChange={setCrop}
                onZoomChange={setZoom}
                onCropComplete={onCropComplete}
                restrictPosition={false}
                zoomWithScroll={false} /* we handle wheel ourselves with non-passive listener */
                minZoom={MIN_ZOOM}
                maxZoom={MAX_ZOOM}
                showGrid={false}
              />
            ) : (
              <div className="no-image">No image provided</div>
            )}
          </div>

          <div className="controls">
            <label className="control-row" style={{ alignItems: 'center' }}>
              <span style={{ minWidth: 60 }}>Zoom</span>
              <input
                type="range"
                min={0.1}
                max={3}
                step={0.01}
                value={zoom}
                onChange={(e) => setZoom(Number(e.target.value))}
              />
              <div className="zoom-value">{zoom.toFixed(2)}x</div>
            </label>

            <div className="checkbox-group">
              <label className="checkbox-inline">
                <input type="checkbox" checked={transparentBg} onChange={(e) => setTransparentBg(e.target.checked)} />
                <span>Transparent background (PNG)</span>
              </label>
            </div>
          </div>
        </div>

        <div className="image-editor-footer">
          <button className="btn btn-outline" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" onClick={handleSave}>Save</button>
        </div>
      </div>
    </div>
  );
}
