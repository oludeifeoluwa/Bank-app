import React, { useEffect, useRef, useState } from 'react';
import { Icon } from './Art.jsx';
import { Dialog } from './Shared.jsx';
import { BankTool } from './BankTools.jsx';
import { Dashboard } from './Dashboard.jsx';
import { accountTools } from './ledger.js';
import { apiRequest } from './auth.js';
import { AddFunds } from './AddFunds.jsx';
import { CardControls } from './CardControls.jsx';
import { Transactions, downloadCsv } from './Transactions.jsx';
import { WorkspaceShell } from './WorkspaceShell.jsx';
import { dateLabel, money, parseAmount, recipients, transactionTypes } from './model.js';

const recipientLabels = { oak: 'Oak Street Savings · •••• 0924', jordan: 'Jordan Lee · •••• 7156', morgan: 'Morgan Ellis · •••• 3412' };

function TransferDialog({ balance, onClose, onConfirm }) {
  const [recipient, setRecipient] = useState('');
  const [amount, setAmount] = useState('');
  const [step, setStep] = useState('details');
  const [receipt, setReceipt] = useState(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const committing = useRef(false);
  const request = useRef(null);
  const cents = parseAmount(amount);

  function review(event) {
    event.preventDefault();
    if (!Object.hasOwn(recipients, recipient)) return setError('Choose a recipient.');
    if (cents <= 0) return setError('Enter a positive amount in dollars and cents, such as 125.50.');
    if (cents > balance) return setError('This amount exceeds your available balance.');
    setError('');
    request.current ??= crypto.randomUUID();
    setStep('review');
  }

  async function confirm() {
    if (committing.current) return;
    committing.current = true;
    setBusy(true);
    setError('');
    try {
      const entry = await onConfirm(recipient, amount, request.current);
      setReceipt(entry);
      setStep('receipt');
    } catch (error) {
      setError(error.message);
    } finally {
      committing.current = false;
      setBusy(false);
    }
  }

  const labels = {
    details: ['Transfer money', 'Step 1 of 2 · Details'],
    review: ['Review your transfer', 'Step 2 of 2 · Review'],
    receipt: ['Transfer posted', 'Record'],
  };
  const [title, eyebrow] = labels[step];
  const errorMessage = error && <p className="error" role="alert">{error}</p>;

  return <Dialog title={title} eyebrow={eyebrow} onClose={() => { if (!committing.current) onClose(); }}>
    {step === 'details' && <form className="transfer-form" onSubmit={review}>
      <div className="source-account"><span className="transaction-icon"><Icon name="card" /></span><div><strong>Everyday Checking</strong><small>Available balance</small></div><strong>{money(balance)}</strong></div>
      <label className="field" htmlFor="recipient">Send to</label>
      <select className="control" id="recipient" value={recipient} onChange={event => { setRecipient(event.target.value); setError(''); request.current = null; }} required autoFocus>
        <option value="">Choose a recipient</option>
        {Object.entries(recipientLabels).map(([key, name]) => <option key={key} value={key}>{name}</option>)}
      </select>
      <label className="field" htmlFor="transfer-amount">Amount (USD)</label>
      <input className="control" id="transfer-amount" value={amount} onChange={event => { setAmount(event.target.value); setError(''); request.current = null; }} inputMode="decimal" maxLength={12} placeholder="0.00" required />
      {errorMessage}
      <div className="dialog-actions"><button className="button button-outline" type="button" onClick={onClose}>Cancel</button><button className="button button-primary">Review transfer</button></div>
    </form>}
    {step === 'review' && <>
      <p className="muted">Check the recipient and the amount before you confirm.</p>
      <dl className="summary"><div><dt>From</dt><dd>Everyday Checking</dd></div><div><dt>To</dt><dd>{recipients[recipient]}</dd></div><div><dt>Transfer amount</dt><dd>{money(cents)}</dd></div><div><dt>Balance after transfer</dt><dd>{money(balance - cents)}</dd></div></dl>
      {errorMessage}
      <div className="dialog-actions"><button className="button button-outline" disabled={busy} onClick={() => { setError(''); setStep('details'); }}>Edit details</button><button className="button button-primary" disabled={busy} onClick={confirm} ref={node => node?.focus()}>{busy ? 'Sending transfer…' : 'Confirm transfer'}</button></div>
    </>}
    {step === 'receipt' && <>
      <span className="receipt-check"><Icon name="check" /></span>
      <p role="status"><strong>{money(receipt.cents)}</strong> sent to {recipients[receipt.recipient]}.</p>
      <dl className="summary"><div><dt>Reference</dt><dd className="reference">{receipt.reference}</dd></div><div><dt>Available balance</dt><dd>{money(balance)}</dd></div></dl>
      <div className="dialog-actions"><button className="button button-primary" onClick={onClose} ref={node => node?.focus()}>Back to account</button></div>
    </>}
  </Dialog>;
}

export function Bank({ user, onSignOut, onExpired, page, navigate }) {
  const [account, setAccount] = useState(null);
  const [loadError, setLoadError] = useState('');
  const [attempt, setAttempt] = useState(0);
  const [showTransfer, setShowTransfer] = useState(false);
  const [showFunds, setShowFunds] = useState(false);
  const [announcement, setAnnouncement] = useState('');
  const [query, setQuery] = useState('');
  const [type, setType] = useState('');
  const [status, setStatus] = useState('');

  useEffect(() => {
    const controller = new AbortController();
    apiRequest('account', { userId: user.id, signal: controller.signal }).then(next => {
      if (!controller.signal.aborted) setAccount(current => current && current.revision > next.revision ? current : next);
    }).catch(error => {
      if (controller.signal.aborted) return;
      if (error.status === 401) onExpired();
      else setLoadError(error.message);
    });
    return () => controller.abort();
  }, [user.id, attempt, page]);

  useEffect(() => {
    const refresh = () => setAttempt(value => value + 1);
    window.addEventListener('focus', refresh);
    return () => window.removeEventListener('focus', refresh);
  }, []);

  async function updateAccount(route, body) {
    try {
      const { entry, account: next } = await apiRequest('account/' + route, { method: 'POST', userId: user.id, body });
      setAccount(current => current && current.revision > next.revision ? current : next);
      return entry;
    } catch (error) {
      if (error.status === 401) onExpired();
      throw error;
    }
  }

  async function addFunds(details) {
    const entry = await updateAccount('funds', details);
    setAnnouncement(money(entry.cents) + ' added to your balance.');
  }

  const { balance, ledger, transactions, cardLocked } = account ?? {};
  const filtered = transactions?.filter(entry => (!type || entry.type === type) && (!status || entry.status === status)
    && (entry.description + ' ' + entry.id).toLowerCase().includes(query.trim().toLowerCase()));
  const nav = [
    { label: 'Overview', icon: 'grid', active: page === 'overview', to: '/' },
    { label: 'Pay & transfer', icon: 'send', disabled: !account, onClick: () => setShowTransfer(true) },
    ...['activity', 'deposits', 'bill-pay', 'cards', 'statements', 'details', 'alerts'].map(key => ({
      label: key === 'activity' ? 'Activity' : accountTools[key].title, icon: accountTools[key].icon, active: page === key, to: '/?task=' + key,
    })),
  ];
  const secondary = [{ label: 'Digital banking guide', icon: 'book', to: '/digital-banking' }, { label: 'Help center', icon: 'info', to: '/support' }];
  if (user.role === 'owner') secondary.unshift({ label: 'Owner workspace', icon: 'briefcase', to: '/admin' });

  return <WorkspaceShell user={user} label="Customer workspace" nav={nav} secondary={secondary} onSignOut={onSignOut}>
      <div className="page-heading workspace-heading"><div><h1>{page === 'overview' ? `Hi, ${user.username}` : accountTools[page].title}</h1><p className="muted">{page === 'overview' ? 'Review your balance and recent activity.' : accountTools[page].description}</p></div>
      {page === 'overview' && <span className="date-chip">{dateLabel(Date.now())}</span>}</div>

      {announcement && <p className="tool-message" role="status">{announcement}</p>}
      {!account ? <section className="panel">
        {loadError ? <><p className="error" role="alert">{loadError}</p><button className="button button-outline" onClick={() => { setLoadError(''); setAttempt(value => value + 1); }}>Try again</button></> : <p role="status">Loading your account…</p>}
      </section> : page === 'overview' ? <Dashboard user={user} balance={balance} ledger={ledger} transactions={transactions} navigate={navigate} onTransfer={() => setShowTransfer(true)} onAddFunds={() => { setAnnouncement(''); setShowFunds(true); }} /> : page === 'activity' ? <section className="panel">
        <div className="workspace-filters"><label className="field">Search activity<input className="control" type="search" placeholder="Description or reference" value={query} onChange={event => setQuery(event.target.value)} /></label>
          <label className="field">Transaction type<select className="control" value={type} onChange={event => setType(event.target.value)}><option value="">All transactions</option>{transactionTypes.map(label => <option key={label}>{label}</option>)}</select></label>
          <label className="field">Status<select className="control" value={status} onChange={event => setStatus(event.target.value)}><option value="">All statuses</option>{['Posted', 'Pending', 'Scheduled', 'Canceled', 'Declined'].map(label => <option value={label.toLowerCase()} key={label}>{label}</option>)}</select></label>
          <button className="button button-outline" disabled={!filtered.length} onClick={() => downloadCsv('northpoint-activity.csv', ['Reference','Date','Description','Type','Status','Amount (USD)'], filtered.map(entry => [entry.id, entry.date, entry.description, entry.type, entry.status, (entry.amount / 100).toFixed(2)]))}><Icon name="download" /> Export CSV</button></div>
        <Transactions entries={filtered} label="Account activity" empty={transactions.length ? undefined : 'No activity yet.'} />
      </section> : page === 'cards' ? <CardControls user={user} locked={cardLocked} balance={balance} onLock={locked => updateAccount('card', { locked })} onPurchase={details => updateAccount('card/purchases', details)} /> :
        <BankTool user={user} page={page} ledger={ledger} transactions={transactions} balance={balance} onAdd={(kind, details) => updateAccount('items', { kind, ...details })} onChange={(reference, action) => updateAccount('items/' + encodeURIComponent(reference), { action })} Transactions={Transactions} />}
    {showFunds && <AddFunds onClose={() => setShowFunds(false)} onAdd={addFunds} />}
    {showTransfer && <TransferDialog balance={balance} onClose={() => setShowTransfer(false)} onConfirm={(recipient, amount, requestId) => updateAccount('transfers', { recipient, amount, requestId })} />}
  </WorkspaceShell>;
}
