import React, { useRef, useState } from 'react';
import { Dialog } from './Shared.jsx';
import { dateLabel, adjustmentModes, money, parseAdminAmount, payoutLimit } from './model.js';
import { Icon } from './Art.jsx';

function useOperation() {
  const pending = useRef(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  async function run(action) {
    if (pending.current) return;
    pending.current = true;
    setBusy(true);
    setError('');
    try { await action(); }
    catch (error) { setError(error.message); }
    finally { pending.current = false; setBusy(false); }
  }
  return { busy, error, setError, run };
}

function ReviewSummary({ rows }) {
  return <dl className="summary owner-review-summary">{rows.map(([label, value]) => <div key={label}><dt>{label}</dt><dd>{value}</dd></div>)}</dl>;
}

export function AdjustmentDialog({ accounts, initial, onPost, onClose }) {
  const [selected, setSelected] = useState(initial ? String(initial) : '');
  const [mode, setMode] = useState('set');
  const [amount, setAmount] = useState('');
  const [memo, setMemo] = useState('');
  const [review, setReview] = useState(null);
  const [receipt, setReceipt] = useState(null);
  const { busy, error, setError, run } = useOperation();
  const account = accounts.find(item => String(item.id) === selected);

  function prepare(event) {
    event.preventDefault();
    const cents = parseAdminAmount(amount);
    if (!account) return setError('Choose an account.');
    if (cents === null || (mode !== 'set' && cents === 0)) return setError('Enter a valid amount up to $999,999,999.99.');
    const after = mode === 'set' ? cents : account.balance + (mode === 'debit' ? -cents : cents);
    if (after < 0 || !Number.isSafeInteger(after)) return setError('The resulting balance must be within the supported limits.');
    if (after === account.balance) return setError('Enter an amount that changes the balance.');
    if (memo.trim().length < 3) return setError('Enter a short reason for the audit log.');
    setError('');
    setReview({ account, after, requestId: crypto.randomUUID() });
  }

  const close = () => { if (!busy) onClose(); };
  const title = receipt ? 'Adjustment posted' : review ? 'Review balance adjustment' : 'New balance adjustment';
  return <Dialog title={title} eyebrow={receipt ? 'Practice record' : undefined} onClose={close}>
    {receipt ? <>
      <span className="receipt-check"><Icon name="check" /></span>
      <p role="status">{receipt.username} now has <strong>{money(receipt.after)}</strong> available. The adjustment is in the audit log.</p>
      <ReviewSummary rows={[["Reference", receipt.reference], ['Previous balance', money(receipt.before)], ['New balance', money(receipt.after)]]} />
      <div className="dialog-actions"><button className="button button-primary" onClick={close}>Done</button></div>
    </> : review ? <>
      <ReviewSummary rows={[
        ['Account', `${review.account.username} · •••• ${review.account.lastFour}`], ['Action', adjustmentModes[mode]],
        ['Before', money(review.account.balance)], ['After', money(review.after)], ['Reason', memo.trim()],
      ]} />
      {error && <p className="error" role="alert">{error}</p>}
      <div className="dialog-actions"><button className="button button-outline" disabled={busy} onClick={() => { setReview(null); setError(''); }}>Back</button><button className="button button-primary" disabled={busy} onClick={() => run(async () => {
        setReceipt(await onPost(review.account.id, { mode, amount, memo, revision: review.account.revision, requestId: review.requestId }));
      })}>{busy ? 'Posting…' : 'Post adjustment'}</button></div>
    </> : <form className="workspace-form" onSubmit={prepare}>
      <label className="field">Account<select className="control" required value={selected} onChange={event => setSelected(event.target.value)} autoFocus><option value="">Choose an account</option>{accounts.map(item => <option key={item.id} value={item.id}>{item.username} · •••• {item.lastFour}</option>)}</select></label>
      {account && <p className="muted">Current balance <strong>{money(account.balance)}</strong></p>}
      <label className="field">Adjustment<select className="control" value={mode} onChange={event => setMode(event.target.value)}>{Object.entries(adjustmentModes).map(([key, label]) => <option key={key} value={key}>{label}</option>)}</select></label>
      <label className="field">{mode === 'set' ? 'New balance (USD)' : 'Amount (USD)'}<input className="control" inputMode="decimal" maxLength={12} placeholder="0.00" value={amount} onChange={event => setAmount(event.target.value)} required /></label>
      <label className="field">Reason for the audit log<textarea className="control" rows="2" maxLength={160} value={memo} onChange={event => setMemo(event.target.value)} required placeholder="Classroom walkthrough" /></label>
      {error && <p className="error" role="alert">{error}</p>}
      <div className="dialog-actions"><button className="button button-outline" type="button" onClick={close}>Cancel</button><button className="button button-primary">Review adjustment</button></div>
    </form>}
  </Dialog>;
}

export function CreateAccountDialog({ onCreate, onClose }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const { busy, error, run } = useOperation();
  const close = () => { if (!busy) onClose(); };

  return <Dialog title="Create account" eyebrow="Owner workspace" onClose={close}>
    <p className="muted">The profile starts at $0.00 and can sign in to its own customer dashboard.</p>
    <form className="workspace-form" onSubmit={event => {
      event.preventDefault();
      run(async () => { await onCreate({ username, password }); setPassword(''); });
    }}>
      <label className="field">Username<input className="control" autoComplete="off" autoFocus minLength={3} maxLength={24} required value={username} onChange={event => setUsername(event.target.value)} /></label>
      <label className="field">Password<input className="control" type="password" autoComplete="new-password" minLength={12} maxLength={128} required value={password} onChange={event => setPassword(event.target.value)} /></label>
      <p className="muted">Choose a unique password with at least 12 characters.</p>
      {error && <p className="error" role="alert">{error}</p>}
      <div className="dialog-actions"><button className="button button-outline" type="button" disabled={busy} onClick={close}>Cancel</button><button className="button button-primary" disabled={busy}>{busy ? 'Creating…' : 'Create account'}</button></div>
    </form>
  </Dialog>;
}

export function PaymentDialog({ item, action, onPost, onClose }) {
  const requestId = useRef(null);
  const { busy, error, run } = useOperation();
  const deposit = item.kind === 'deposit';
  const title = action === 'post' ? (deposit ? 'Clear check' : 'Post bill') : (deposit ? 'Decline check' : 'Cancel scheduled bill');
  const close = () => { if (!busy) onClose(); };

  return <Dialog title={title} onClose={close}>
    <ReviewSummary rows={[
      ['Account', item.account.username], ['Item', item.label], ['Amount (USD)', money(item.cents)],
      ['Date', dateLabel(deposit ? item.date : item.scheduledFor + 'T12:00:00')],
      ['Balance impact', action === 'post' ? (deposit ? '+' : '−') + money(item.cents) : 'None'],
    ]} />
    {error && <p className="error" role="alert">{error}</p>}
    <div className="dialog-actions"><button className="button button-outline" disabled={busy} onClick={close}>Back</button><button className="button button-primary" disabled={busy} onClick={() => run(async () => {
      requestId.current ??= crypto.randomUUID();
      await onPost({ accountId: item.account.id, reference: item.reference, action, requestId: requestId.current });
    })}>{busy ? 'Saving…' : title}</button></div>
  </Dialog>;
}

export function Payouts({ accounts, onPost }) {
  const [query, setQuery] = useState('');
  const [amounts, setAmounts] = useState({});
  const [memo, setMemo] = useState('');
  const [review, setReview] = useState(null);
  const [receipt, setReceipt] = useState(null);
  const { busy, error, setError, run } = useOperation();
  const selected = accounts.filter(account => Object.hasOwn(amounts, account.id));
  const total = selected.reduce((sum, account) => sum + (parseAdminAmount(amounts[account.id]) ?? 0), 0);
  const shown = accounts.filter(account => `${account.username} ${account.lastFour}`.toLowerCase().includes(query.trim().toLowerCase()));

  function toggle(id, checked) {
    setAmounts(current => {
      if (checked) return { ...current, [id]: '' };
      const next = { ...current };
      delete next[id];
      return next;
    });
  }

  function prepare(event) {
    event.preventDefault();
    if (!selected.length || selected.length > payoutLimit) return setError(`Choose 1 to ${payoutLimit} accounts.`);
    const rows = selected.map(account => ({ id: account.id, amount: amounts[account.id] }));
    if (rows.some(row => !parseAdminAmount(row.amount))) return setError('Enter a positive payout amount for each selected account.');
    if (memo.trim().length < 3) return setError('Enter a reason for the audit log.');
    setError('');
    setReceipt(null);
    setReview({ rows, memo: memo.trim(), requestId: crypto.randomUUID() });
  }

  return <div className="workspace-stack">
    {receipt && <div className="tool-message" role="status"><strong>Batch payout posted.</strong> {money(receipt.total)} credited across {receipt.recipients.length} {receipt.recipients.length === 1 ? 'account' : 'accounts'}. <span className="record-label">Practice record</span> <span className="reference">{receipt.reference}</span></div>}
    <form className="workspace-columns owner-payout-grid" onSubmit={prepare}>
      <section className="panel workspace-panel">
        <div className="workspace-section-heading"><div><h2>Choose accounts</h2><p>Set a separate amount for each recipient.</p></div></div>
        <label className="field">Find accounts<input className="control" type="search" value={query} onChange={event => setQuery(event.target.value)} placeholder="Name or last four" /></label>
        <ul className="payout-list">{shown.map(account => {
          const checked = Object.hasOwn(amounts, account.id);
          return <li key={account.id}>
            <label><input type="checkbox" checked={checked} disabled={!checked && selected.length >= payoutLimit} onChange={event => toggle(account.id, event.target.checked)} /><span><strong>{account.username}</strong><small>•••• {account.lastFour} · {money(account.balance)}</small></span></label>
            {checked && <input className="control" aria-label={`Payout amount for ${account.username}`} inputMode="decimal" maxLength={12} value={amounts[account.id]} placeholder="0.00" onChange={event => setAmounts({ ...amounts, [account.id]: event.target.value })} />}
          </li>;
        })}</ul>
        {!shown.length && <p className="muted">No accounts match this search.</p>}
      </section>
      <section className="panel workspace-panel payout-summary">
        <div className="workspace-section-heading"><h2>Batch summary</h2><Icon name="send" /></div>
        <ReviewSummary rows={[["Selected accounts", `${selected.length} / ${payoutLimit}`], ['Total (USD)', money(total)]]} />
        <label className="field">Reason for the audit log<textarea className="control" rows="3" maxLength={160} required value={memo} onChange={event => setMemo(event.target.value)} placeholder="Payroll for this period" /></label>
        {!review && error && <p className="error" role="alert">{error}</p>}
        <button className="button button-primary">Review batch payout</button>
      </section>
    </form>
    {review && <Dialog title="Review batch payout" onClose={() => { if (!busy) { setReview(null); setError(''); } }}>
      <ReviewSummary rows={selected.map(account => [`${account.username} · •••• ${account.lastFour}`, money(parseAdminAmount(amounts[account.id]))])} />
      <ReviewSummary rows={[["Total (USD)", money(total)], ['Reason', review.memo]]} />
      {error && <p className="error" role="alert">{error}</p>}
      <div className="dialog-actions"><button className="button button-outline" disabled={busy} onClick={() => { setReview(null); setError(''); }}>Back</button><button className="button button-primary" disabled={busy} onClick={() => run(async () => {
        setReceipt(await onPost(review));
        setAmounts({}); setMemo(''); setReview(null);
      })}>{busy ? 'Posting…' : 'Post batch payout'}</button></div>
    </Dialog>}
  </div>;
}
