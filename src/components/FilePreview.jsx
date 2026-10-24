import { useEffect, useState } from 'react';
import { FileText, Image as ImageIcon } from 'lucide-react';

export default function FilePreview({ file, isPdf = false, large = false, t }) {
  const [src, setSrc] = useState('');
  const [failed, setFailed] = useState(false);
  useEffect(() => {
    let alive = true, url = '';
    setSrc(''); setFailed(false);
    async function makePreview() {
      try {
        let blob = file;
        if (/\.hei[cf]$/i.test(file.name)) {
          const convert = (await import('heic2any')).default;
          blob = await convert({ blob: file, toType: 'image/jpeg', quality: 0.8 });
          if (Array.isArray(blob)) blob = blob[0];
        }
        if (!alive) return;
        url = URL.createObjectURL(blob); setSrc(url);
      } catch { if (alive) setFailed(true); }
    }
    if (!isPdf) makePreview();
    return () => { alive = false; if (url) URL.revokeObjectURL(url); };
  }, [file, isPdf]);
  const size = file.size >= 1024 * 1024 ? `${(file.size / (1024 * 1024)).toFixed(1)} MB` : `${(file.size / 1024).toFixed(1)} KB`;
  return <div className={`selected-file-preview${large ? ' is-large' : ''}`}>
    <div className={`selected-file-thumb${isPdf ? ' is-pdf' : ''}`}>
      {isPdf ? <><FileText size={28}/><span>PDF</span></> : src ? <img src={src} alt={t.selectedPreviewAlt} /> : failed ? <ImageIcon size={28} aria-label={t.previewUnavailable}/> : <span className="preview-loading">{t.loadingPreview}</span>}
    </div>
    <div className="selected-file-meta"><strong title={file.name}>{file.name}</strong><small>{size}</small></div>
  </div>;
}
