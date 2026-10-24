import { Link } from 'react-router-dom';
import { ArrowRight, Check, FileImage, FileText, Package, Scissors, ShieldCheck } from 'lucide-react';
import { presets } from '../data/presets';
import AdSlot from './AdSlot';
import '../home.css';

export default function HomePage({ t }) {
  return <main className="home-page">
    <AdSlot slot="home-top" label={t.ad} />

    <section className="hero home-hero">
      <div className="hero-copy">
        <span className="eyebrow"><ShieldCheck size={16} />{t.neverLeaves}</span>
        <h1>{t.homeHeroTitle}</h1>
        <p>{t.homeIntro}</p>
        <div className="hero-actions">
          <a className="primary btn btn-warning" href="#exam-list">{t.homeStart}</a>
          <Link className="secondary btn btn-outline-secondary" to="/exam-pack"><Package size={16} />{t.homePackCta}</Link>
        </div>
        <div className="hero-proof"><span><Check size={15} />{t.homeProofLocal}</span><span><Check size={15} />{t.homeProofPresets}</span></div>
      </div>
      <aside className="hero-example" aria-label={t.homeExampleTitle}>
        <span className="example-label">{t.homeExampleTitle}</span>
        <div className="example-photo"><FileImage size={30} /></div>
        <strong>{t.homeExampleName}</strong>
        <span className="example-spec">200 × 230 px <i /> 20–50 KB</span>
        <div className="example-pass"><Check size={15} />{t.homeExamplePass}</div>
      </aside>
    </section>

    <div className="home-columns">
      <div className="home-main">
        <div id="exam-list" className="section-head home-section-head">
          <div><span className="eyebrow">{t.homeToolsEyebrow}</span><h2>{t.chooseExam}</h2><p>{t.notice}</p></div>
          <Link className="text-link" to="/tool/custom">{t.custom}<ArrowRight size={15} /></Link>
        </div>
        <div className="grid row row-cols-1 row-cols-sm-2 row-cols-xl-4 g-3">
          {presets.map(p => <Link className="tool-card col" key={p.id} to={'/tool/' + p.id}>
            <span className="iconbox"><FileImage /></span><span className="card-arrow"><ArrowRight /></span>
            <h3>{t[`preset_${p.id}`] || p.name}</h3>
            <p>{p.slots.length} {p.slots.length === 1 ? t.documentTypeOne : t.documentTypes}</p>
          </Link>)}
          <Link className="tool-card col" to="/tool/pdf"><span className="iconbox"><FileText /></span><span className="card-arrow"><ArrowRight /></span><h3>{t.pdfTools}</h3><p>{t.pdfDesc}</p></Link>
        </div>

        <section className="value-section">
          <div className="value-heading"><span className="eyebrow">{t.homeValueEyebrow}</span><h2>{t.homeValueTitle}</h2><p>{t.homeValueIntro}</p></div>
          <div className="features">
            <div><ShieldCheck /><h3>{t.privateTitle}</h3><p>{t.privateBody}</p></div>
            <div><FileImage /><h3>{t.exactTitle}</h3><p>{t.exactBody}</p></div>
            <div><Package /><h3>{t.packTitle}</h3><p>{t.packBody}</p></div>
          </div>
        </section>
        <AdSlot slot="tool-below" label={t.ad} />
      </div>
      <aside className="home-sidebar"><AdSlot slot="sidebar-desktop" label={t.ad} /></aside>
    </div>
  </main>;
}
