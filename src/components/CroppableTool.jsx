import { useEffect, useRef, useState } from 'react';
import { Check, Upload } from 'lucide-react';
import CropDialog from './CropDialog';
import FilePreview from './FilePreview';
import { compressImage } from '../lib/compress';
import { track } from '../lib/analytics';

export default function CroppableTool({ t, spec }) {
  const [file, setFile] = useState(null), [crop, setCrop] = useState(false), [result, setResult] = useState(null), [error, setError] = useState(''), [busy, setBusy] = useState(false);
  const [w,setW]=useState(spec?.width||600),[h,setH]=useState(spec?.height||600),[min,setMin]=useState(spec?.minKB||20),[max,setMax]=useState(spec?.maxKB||100);
  const picker = useRef(null);
  useEffect(()=>{if(spec){setW(spec.width);setH(spec.height);setMin(spec.minKB);setMax(spec.maxKB)}},[spec]);
  async function process() {
    setBusy(true); setError(''); setResult(null);
    try { const value = await compressImage(file, {width:+w,height:+h,minKB:+min,maxKB:+max}); value.url=URL.createObjectURL(value.blob); setResult(value); await track('tool_used', { kind: 'image' }); }
    catch (e) { setError(e.message || t.processError); }
    finally { setBusy(false); }
  }
  function select(next) { if (next) { setFile(next); setResult(null); setError(''); } }
  return <div className="workbench">
    <section className="card shadow-sm"><h2>{t.chooseFile}</h2><div className="drop selected-file-box" onClick={() => !file && picker.current?.click()}>
      {file ? <FilePreview file={file} large t={t}/> : <><Upload/><strong>{t.drop}</strong><span>{t.supportedImageTypes}</span></>}
      <input ref={picker} className="file-input" aria-label={t.chooseFile} type="file" accept="image/*,.heic,.heif" onChange={e => select(e.target.files?.[0])}/>
    </div>
    {file && <div className="file-actions">
      <button type="button" className="secondary btn btn-outline-secondary" onClick={() => setCrop(true)}>{t.cropRotate}</button>
      <button type="button" className="secondary btn btn-outline-secondary" onClick={() => picker.current?.click()}>{t.fileReplace}</button>
      <button type="button" className="secondary btn btn-outline-secondary" onClick={() => { setFile(null); setResult(null); setError(''); if (picker.current) picker.current.value = ''; }}>{t.fileRemove}</button>
    </div>}
    </section><section className="card shadow-sm settings"><h2>{t.outputRequirements}</h2>{!spec&&<div className="form-grid">{[[t.width,w,setW],[t.height,h,setH],[t.minKB,min,setMin],[t.maxKB,max,setMax]].map(([label,value,set])=><label key={label}>{label}<input className="form-control" aria-label={label} type="number" min="1" value={value} onChange={e=>set(e.target.value)}/></label>)}</div>}<p>{w} × {h} px · {min}–{max} KB</p><button className="primary btn btn-warning" disabled={!file||busy||+w<=0||+h<=0||+min<=0||+max<+min} onClick={process}>{busy?t.processing:t.make}</button>{error&&<p className="error" role="alert">{error}</p>}</section>
    {result&&<section className="card shadow-sm result"><h2>{t.yourFile}</h2><div className="preview"><img src={result.url} alt={t.yourFile}/><div><span className={result.pass?'pass':'error'}><Check/>{result.pass?t.pass:t.failed}</span><p>{result.width} × {result.height} px</p><p>{result.kb.toFixed(1)} KB</p></div></div><a className="primary btn btn-warning" href={result.url} download="photo.jpg">{t.downloadJpg}</a></section>}
    {crop&&file&&<CropDialog file={file} aspect={+w/+h} t={t} onCancel={()=>setCrop(false)} onApply={b=>{setFile(new File([b],file.name.replace(/\.[^.]+$/,'')+'-cropped.jpg',{type:'image/jpeg'}));setCrop(false);setResult(null)}}/>}
  </div>;
}
