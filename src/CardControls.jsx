import React, { useRef, useState } from 'react';
import { Icon } from './Art.jsx';
import { money, purchaseMerchants } from './model.js';

export function CardControls({ user, locked, balance, onLock, onPurchase }) {
  const [merchant, setMerchant] = useState('');
  const [amount, setAmount] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const pending = useRef(false);
  const request = useRef(null);

  async function run(action) {
    if (pending.current) return;
    pending.current = true;
    setBusy(true);
    setMessage('');
    setError('');
    try { setMessage(await action()); }
    catch (error) { setError(error.message); }
    finally { pending.current = false; setBusy(false); }
  }

  function purchase(event) {
    event.preventDefault();
    run(async () => {
      request.current ??= crypto.randomUUID();
      const entry = await onPurchase({ merchant, amount, requestId: request.current });
      request.current = null;
      setAmount('');
      return `${money(entry.cents)} purchase posted to Activity.`;
    });
  }

  return <div className="workspace-stack">
    {message && <p className="tool-message" role="status">{message}</p>}
    {error && <p className="error" role="alert">{error}</p>}
    <div className="workspace-columns">
      <section className="panel workspace-panel">
        <div className="workspace-section-heading"><h2>Debit card</h2><span className={'status-pill ' + (locked ? 'status-scheduled' : 'status-posted')}>{locked ? 'Locked' : 'Unlocked'}</span></div>
        <div className="practice-card"><Icon name="logo" /><strong>Northpoint</strong><span>Debit</span><small>Linked to Everyday Checking · •••• {user.lastFour}</small></div>
        <p className="muted">A locked card declines new purchases. Existing transactions stay in Activity.</p>
        <button className="button button-outline" disabled={busy} onClick={() => run(async () => {
          await onLock(!locked);
          return locked ? 'Card unlocked.' : 'Card locked.';
        })}><Icon name="lock" /> {locked ? 'Unlock card' : 'Lock card'}</button>
      </section>
      <section className="panel workspace-panel">
        <div className="workspace-section-heading"><h2>Make a purchase</h2></div>
        <p className="muted">Available balance <strong>{money(balance)}</strong></p>
        <form className="workspace-form" onSubmit={purchase}>
          <label className="field">Merchant<select className="control" required value={merchant} disabled={busy} onChange={event => { setMerchant(event.target.value); request.current = null; }}><option value="">Choose a merchant</option>{Object.entries(purchaseMerchants).map(([key, label]) => <option key={key} value={key}>{label}</option>)}</select></label>
          <label className="field">Amount (USD)<input className="control" inputMode="decimal" placeholder="0.00" required maxLength={12} value={amount} disabled={busy} onChange={event => { setAmount(event.target.value); request.current = null; }} /></label>
          <button className="button button-primary" disabled={busy || locked}>Post test purchase</button>
        </form>
        {locked && <p className="muted">Unlock your card to run a test purchase.</p>}
      </section>
    </div>
  </div>;
}
