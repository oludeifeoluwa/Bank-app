import React, { useRef, useState } from 'react';
import { Dialog } from './Shared.jsx';

export function AddFunds({ onClose, onAdd }) {
  const [amount, setAmount] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const pending = useRef(false);
  const request = useRef(null);

  async function submit(event) {
    event.preventDefault();
    if (pending.current) return;
    pending.current = true;
    setBusy(true);
    setError('');
    request.current ??= crypto.randomUUID();
    try {
      await onAdd({ amount, requestId: request.current });
      onClose();
    } catch (error) {
      setError(error.message);
    } finally {
      pending.current = false;
      setBusy(false);
    }
  }

  return <Dialog title="Add funds" eyebrow="Everyday Checking" onClose={() => { if (!pending.current) onClose(); }}>
    <p className="muted">Enter an amount to add to your balance.</p>
    <form className="transfer-form" onSubmit={submit}>
      <label className="field" htmlFor="test-funds-amount">Amount (USD)</label>
      <input className="control" id="test-funds-amount" inputMode="decimal" placeholder="0.00" maxLength={12} value={amount} autoFocus required disabled={busy} onChange={event => {
        setAmount(event.target.value);
        setError('');
        request.current = null;
      }} />
      {error && <p className="error" role="alert">{error}</p>}
      <div className="dialog-actions">
        <button className="button button-outline" type="button" disabled={busy} onClick={onClose}>Cancel</button>
        <button className="button button-primary" disabled={busy}>{busy ? 'Adding funds…' : 'Add funds'}</button>
      </div>
    </form>
  </Dialog>;
}
