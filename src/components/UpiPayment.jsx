import { config } from '../config';

export default function UpiPayment({ price, plan, t }) {
  if (!config.upiId) return null;
  const params = new URLSearchParams({
    pa: config.upiId,
    pn: config.upiPayeeName || 'FormReady',
    am: String(price),
    cu: 'INR',
    tn: `FormReady ${plan}`,
  });
  const message = `Hi, I paid ₹${price} for the FormReady ${plan}. Please verify my UPI payment and send my access code.`;
  const whatsapp = config.whatsappNumber && /^\d{10,15}$/.test(config.whatsappNumber)
    ? `https://wa.me/${config.whatsappNumber}?text=${encodeURIComponent(message)}`
    : null;

  return <details className="upi-payment">
    <summary>{t.upiPaymentTitle}</summary>
    <div className="upi-content">
      <p>{t.upiPaymentHelp.replace('{price}', String(price))}</p>
      <img className="upi-qr" src="/upi-qr.jpg" alt={t.upiQrAlt} width="400" height="500" />
      <p className="upi-id">{t.upiId} <strong>{config.upiId}</strong></p>
      <a className="secondary upi-app-link" href={`upi://pay?${params.toString()}`}>{t.payUpi}</a>
      {whatsapp && <a className="secondary upi-whatsapp" href={whatsapp} target="_blank" rel="noreferrer">{t.sendScreenshot}</a>}
      <small>{t.upiManualNotice}</small>
    </div>
  </details>;
}
