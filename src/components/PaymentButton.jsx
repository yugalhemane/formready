import { useState } from 'react';
import { track } from '../lib/analytics';
import { config } from '../config';
import UpiPayment from './UpiPayment';

const checkoutUrl = 'https://checkout.razorpay.com/v1/checkout.js';
function loadCheckout() {
  if (window.Razorpay) return Promise.resolve();
  if (window.__formReadyCheckout) return window.__formReadyCheckout;
  window.__formReadyCheckout = new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = checkoutUrl;
    script.async = true;
    script.onload = resolve;
    script.onerror = () => { window.__formReadyCheckout = null; reject(new Error('checkout_load_failed')); };
    document.head.appendChild(script);
  });
  return window.__formReadyCheckout;
}

export default function PaymentButton({ plan, t, setUnlock, onSuccess, className = 'primary' }) {
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const enabled = Boolean(import.meta.env.VITE_RAZORPAY_KEY_ID);
  async function purchase() {
    if (!enabled || busy) return;
    setBusy(true); setMessage('');
    try {
      const orderResponse = await fetch('/api/payments/order', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ plan }),
      });
      const order = await orderResponse.json();
      if (!orderResponse.ok) throw new Error(order.error || 'order_creation_failed');
      await loadCheckout();
      const checkout = new window.Razorpay({
        key: order.keyId, order_id: order.orderId, amount: order.amount, currency: order.currency,
        name: order.name, description: order.description, theme: { color: '#f59e0b' },
        modal: { ondismiss: () => setBusy(false) },
        handler: async response => {
          try {
            let verified;
            for (let attempt = 0; attempt < 4; attempt++) {
              const result = await fetch('/api/payments/verify', {
                method: 'POST', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ plan, orderId: response.razorpay_order_id, paymentId: response.razorpay_payment_id, signature: response.razorpay_signature }),
              });
              const data = await result.json();
              if (result.ok) { verified = data; break; }
              if (result.status !== 202) throw new Error(data.error || 'payment_verification_failed');
              await new Promise(resolve => setTimeout(resolve, 1200));
            }
            if (!verified) throw new Error('payment_not_captured');
            localStorage.setItem('fr-unlock', JSON.stringify(verified));
            setUnlock(verified);
            await track('pack_unlocked', { plan });
            onSuccess?.(verified);
            setMessage(t.paymentSuccess);
          } catch {
            setMessage(t.paymentVerifyError);
          } finally { setBusy(false); }
        },
      });
      checkout.on('payment.failed', () => { setMessage(t.paymentFailed); setBusy(false); });
      checkout.open();
    } catch {
      setMessage(t.paymentUnavailable);
      setBusy(false);
    }
  }
  return <div className="payment-action">
    <button className={className} type="button" disabled={!enabled || busy} onClick={purchase}>
      {busy ? t.paymentWorking : enabled ? t.payNow : t.paymentNotConfigured}
    </button>
    {message && <p role="status" className="payment-message">{message}</p>}
    <UpiPayment price={config.prices[plan]} plan={plan} t={t} />
  </div>;
}
