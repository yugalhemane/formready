import { useState } from 'react';
import { FileImage, FilePlus2, Minimize2 } from 'lucide-react';

const modes = ['compress', 'images', 'merge'];

export default function DocumentTools({ t, target = 200 }) {
  const [mode, setMode] = useState('compress');
  const [pdf, setPdf] = useState(null), [images, setImages] = useState([]), [pdfs, setPdfs] = useState([]);
  const [kb, setKb] = useState(target), [result, setResult] = useState(null), [error, setError] = useState(''), [busy, setBusy] = useState(false);
  function changeMode(next) { setMode(next); setResult(null); setError(''); }
  async function run() {
    setBusy(true); setResult(null); setError('');
    try {
      let blob;
      if (mode === 'compress') {
        const { compressPdf } = await import('../lib/pdfTools');
        const value = await compressPdf(pdf, +kb);
        blob = value.blob;
        setResult({ blob, kb: value.kb, pass: value.pass, originalKB: pdf.size / 1024 });
        return;
      }
      const { imagesToPdf } = await import('../lib/pdfTools');
      if (mode === 'images') blob = await imagesToPdf(images);
      else {
        const { PDFDocument } = await import('pdf-lib');
        const merged = await PDFDocument.create();
        for (const file of pdfs) {
          const source = await PDFDocument.load(await file.arrayBuffer());
          for (const page of await merged.copyPages(source, source.getPageIndices())) merged.addPage(page);
        }
        blob = new Blob([await merged.save()], { type: 'application/pdf' });
      }
      setResult({ blob, kb: blob.size / 1024, pass: true });
    } catch { setError(t.couldNotOpenPdf); }
    finally { setBusy(false); }
  }
  const accept = mode === 'compress' || mode === 'merge' ? 'application/pdf,.pdf' : 'image/*,.heic,.heif';
  const files = mode === 'compress' ? (pdf ? [pdf] : []) : mode === 'merge' ? pdfs : images;
  const required = mode === 'compress' ? !!pdf : mode === 'merge' ? pdfs.length > 1 : images.length > 0;
  return <section className="card document-tools">
    <header><span className="eyebrow">{t.pdfTools}</span><h1>{t.documentSuiteTitle}</h1><p>{t.documentSuiteIntro}</p></header>
    <div className="nav nav-pills document-tool-tabs" role="tablist" aria-label={t.documentToolTabs}>
      {modes.map((item, index) => <button key={item} type="button" role="tab" aria-selected={mode === item} className={`nav-link${mode === item ? ' active' : ''}`} onClick={() => changeMode(item)}>{index === 0 ? <Minimize2/> : index === 1 ? <FileImage/> : <FilePlus2/>}{t[`documentTool_${item}`]}</button>)}
    </div>
    <h2>{t[`documentTool_${mode}`]}</h2><p>{t[`documentToolHelp_${mode}`]}</p>
    <label className="document-file-picker">{t[mode === 'compress' ? 'chooseFile' : mode === 'merge' ? 'choosePdfs' : 'chooseImages']}
      <input id="document-files" name="files" className="form-control" type="file" multiple={mode !== 'compress'} accept={accept} onChange={e => { const selected = Array.from(e.target.files || []); setResult(null); setError(''); if (mode === 'compress') setPdf(selected[0] || null); else if (mode === 'merge') setPdfs(selected); else setImages(selected); }}/>
    </label>
    {files.length > 0 && <ul className="document-file-list">{files.map((file, index) => <li key={`${file.name}-${index}`}><span>{file.name}</span><small>{(file.size / 1024).toFixed(1)} KB</small></li>)}</ul>}
    {mode === 'compress' && <label>{t.targetSize}<input id="document-target-kb" name="targetKb" className="form-control" type="number" min="1" value={kb} onChange={e => setKb(e.target.value)}/></label>}
    <button className="primary btn btn-warning" disabled={!required || busy} onClick={run}>{busy ? t.processing : t[`documentToolRun_${mode}`]}</button>
    {error && <p className="error" role="alert">{error}</p>}
    {result && <div className="document-result"><p className={result.pass ? 'pass' : 'error'}>{mode === 'compress' && <>{t.before} {result.originalKB.toFixed(1)} KB → </>}{t.after} {result.kb.toFixed(1)} KB{mode === 'compress' && !result.pass ? ` · ${t.targetWas} ${kb} KB` : ''}</p><a className="primary btn btn-warning" href={URL.createObjectURL(result.blob)} download={mode === 'compress' ? 'compressed.pdf' : mode === 'merge' ? 'merged.pdf' : 'images.pdf'}>{t.download}</a></div>}
  </section>;
}
