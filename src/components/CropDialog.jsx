import { useEffect, useState } from 'react';
import Cropper from 'react-easy-crop';

export default function CropDialog({ file, aspect, onCancel, onApply, t }) {
  const [url, setUrl] = useState('');
  const [source, setSource] = useState(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [area, setArea] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    let objectUrl;
    async function load() {
      try {
        let decoded = file;
        if (/\.hei[cf]$/i.test(file.name)) {
          const convert = (await import('heic2any')).default;
          decoded = await convert({ blob: file, toType: 'image/jpeg', quality: 0.95 });
          if (Array.isArray(decoded)) decoded = decoded[0];
        }
        if (!active) return;
        setSource(decoded);
        objectUrl = URL.createObjectURL(decoded);
        setUrl(objectUrl);
      } catch {
        setError(t.cropOpenError);
      }
    }
    load();
    return () => { active = false; if (objectUrl) URL.revokeObjectURL(objectUrl); };
  }, [file, t.cropOpenError]);

  async function apply() {
    if (!area || !source) return;
    const image = await createImageBitmap(source);
    const radians = rotation * Math.PI / 180;
    const width = Math.ceil(Math.abs(Math.cos(radians) * image.width) + Math.abs(Math.sin(radians) * image.height));
    const height = Math.ceil(Math.abs(Math.sin(radians) * image.width) + Math.abs(Math.cos(radians) * image.height));
    const rotated = document.createElement('canvas');
    rotated.width = width; rotated.height = height;
    const context = rotated.getContext('2d');
    context.translate(width / 2, height / 2);
    context.rotate(radians);
    context.drawImage(image, -image.width / 2, -image.height / 2);

    const output = document.createElement('canvas');
    output.width = Math.round(area.width); output.height = Math.round(area.height);
    output.getContext('2d').drawImage(rotated, area.x, area.y, area.width, area.height, 0, 0, output.width, output.height);
    output.toBlob(blob => blob && onApply(blob), 'image/jpeg', 0.96);
  }

  return <div className="crop-overlay" role="presentation">
    <section className="crop-dialog card shadow-lg" role="dialog" aria-modal="true" aria-labelledby="crop-title">
      <h2 id="crop-title">{t.adjustCrop}</h2>
      {error ? <p className="error" role="alert">{error}</p> : <>
        <div className="crop-viewport">{url && <Cropper image={url} crop={crop} zoom={zoom} rotation={rotation} aspect={aspect} onCropChange={setCrop} onZoomChange={setZoom} onRotationChange={setRotation} onCropComplete={(_, pixels) => setArea(pixels)} />}</div>
        <label>{t.zoom}<input id="crop-zoom" name="zoom" className="form-range" aria-label={t.zoom} type="range" min="1" max="4" step="0.01" value={zoom} onChange={e => setZoom(+e.target.value)} /></label>
        <label>{t.rotate}<input id="crop-rotation" name="rotation" className="form-range" aria-label={t.rotate} type="range" min="-180" max="180" step="1" value={rotation} onChange={e => setRotation(+e.target.value)} /> <output>{rotation}°</output></label>
      </>}
      <div className="crop-actions"><button className="secondary btn btn-outline-secondary" onClick={onCancel}>{t.cancel}</button><button className="primary btn btn-warning" disabled={!area || !!error} onClick={apply}>{t.useCrop}</button></div>
    </section>
  </div>;
}
