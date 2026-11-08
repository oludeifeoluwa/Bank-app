import React, { useRef, useState } from 'react';
import { Icon } from './Art.jsx';
import { billers, isCalendarDate, localDate, sampleChecks, signedAmount, statementFor } from './ledger.js';
import { accountSessionKey, dateLabel, money, parseAmount, readSession, writeSession } from './model.js';

function ActionPanel({ title, children }) {
  return <section className="panel tool-panel"><h2>{title}</h2>{children}</section>;
}

function LedgerItems({ entries, kind, onChange }) {
  const deposit = kind === 'deposit';
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const [busy, setBusy] = useState(false);
  const pending = useRef(false);

  async function apply(reference, action) {
    if (pending.current) return;
    pending.current = true;
    setBusy(true);
    setMessage('');
    setError('');
    try {
      await onChange(reference, action);
      setMessage(action === 'cancel' ? 'Scheduled payment canceled.' : deposit ? 'Deposit posted to your available balance.' : 'Scheduled payment posted.');
    } catch (error) {
      setError(error.message);
    } finally {
      pending.current = false;
      setBusy(false);
    }
  }

  return <ActionPanel title={deposit ? 'Deposit history' : 'Scheduled and posted payments'}>
    {message && <p className="tool-message" role="status">{message}</p>}
    {error && <p className="error" role="alert">{error}</p>}
    {entries.length ? <ul className="demo-item-list">{entries.map(entry => <li key={entry.reference}>
      <div><strong>{deposit ? sampleChecks[entry.check].label : billers[entry.biller]}</strong><small>{entry.reference} · {deposit ? dateLabel(entry.date) : 'Scheduled for ' + dateLabel(entry.scheduledFor + 'T12:00:00')}</small></div>
      <div className="demo-item-amount"><strong>{money(entry.cents)}</strong><span className={'status-pill status-' + entry.status}>{entry.status}</span></div>
      {(entry.status === 'pending' || entry.status === 'scheduled') && <div className="demo-item-actions">
        <button className="button button-outline small-button" disabled={busy} onClick={() => apply(entry.reference, 'post')}>{deposit ? 'Clear check' : 'Post payment'}</button>
        {!deposit && <button className="link" disabled={busy} onClick={() => apply(entry.reference, 'cancel')}>Cancel payment</button>}
      </div>}
    </li>)}</ul> : <p className="muted">{deposit ? 'Sample checks you submit will appear here.' : 'Bills you schedule will appear here.'}</p>}
  </ActionPanel>;
}

function Deposits({ ledger, onAdd, onChange }) {
  const [check, setCheck] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const entries = ledger.filter(entry => entry.kind === 'deposit');
  const remaining = Object.entries(sampleChecks).filter(([key]) => !entries.some(entry => entry.check === key));

  const [busy, setBusy] = useState(false);
  const pending = useRef(false);

  async function submit(event) {
    event.preventDefault();
    if (pending.current) return;
    pending.current = true;
    setBusy(true);
    setError('');
    setMessage('');
    try {
      const entry = await onAdd('deposit', { check });
      setCheck('');
      setMessage('Check submitted as pending. Reference ' + entry.reference + '.');
    } catch (error) {
      setError(error.message);
    } finally {
      pending.current = false;
      setBusy(false);
    }
  }

  return <div className="bank-tools">
    <ActionPanel title="Submit a check">
      <p className="muted">Choose an available check. It stays pending until you clear it below.</p>
      {remaining.length ? <form className="tool-form" onSubmit={submit}>
        <label className="field">Sample check<select className="control" value={check} onChange={event => setCheck(event.target.value)} required>
          <option value="">Choose a sample check</option>{remaining.map(([key, item]) => <option key={key} value={key}>{item.label} · {money(item.cents)}</option>)}
        </select></label>{check && <p className="muted">Check amount <strong>{money(sampleChecks[check].cents)}</strong></p>}<button className="button button-primary" disabled={busy}>Submit check</button>
      </form> : <p className="muted">All sample checks have been submitted for this account.</p>}
      {message && <p className="tool-message" role="status"><span className="record-label">Practice record</span> · {message}</p>}{error && <p className="error" role="alert">{error}</p>}
    </ActionPanel>
    <LedgerItems entries={entries} kind="deposit" onChange={onChange} />
  </div>;
}

function BillPay({ ledger, onAdd, onChange }) {
  const [biller, setBiller] = useState('');
  const [amount, setAmount] = useState('');
  const [scheduledFor, setScheduledFor] = useState(localDate);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const entries = ledger.filter(entry => entry.kind === 'bill');

  const [busy, setBusy] = useState(false);
  const pending = useRef(false);

  async function submit(event) {
    event.preventDefault();
    if (pending.current) return;
    setMessage('');
    setError('');
    if (parseAmount(amount) <= 0) return setError('Enter a positive amount with up to two decimal places.');
    if (!isCalendarDate(scheduledFor) || scheduledFor < localDate()) return setError('Choose today or a future payment date.');
    pending.current = true;
    setBusy(true);
    try {
      const entry = await onAdd('bill', { biller, amount, scheduledFor });
      setBiller('');
      setAmount('');
      setMessage('Payment scheduled. Reference ' + entry.reference + '.');
    } catch (error) {
      setError(error.message);
    } finally {
      pending.current = false;
      setBusy(false);
    }
  }

  return <div className="bank-tools">
    <ActionPanel title="Schedule a bill">
      <p className="muted">Choose a biller and date. Select Post payment to try posting it before that date.</p>
      <form className="tool-form bill-form" onSubmit={submit}>
        <label className="field">Biller<select className="control" required value={biller} onChange={event => setBiller(event.target.value)}>
          <option value="">Choose a biller</option>{Object.entries(billers).map(([key, label]) => <option key={key} value={key}>{label}</option>)}
        </select></label>
        <label className="field">Amount (USD)<input className="control" inputMode="decimal" maxLength={12} placeholder="0.00" value={amount} onChange={event => setAmount(event.target.value)} required /></label>
        <label className="field">Payment date<input className="control" type="date" min={localDate()} value={scheduledFor} onChange={event => setScheduledFor(event.target.value)} required /></label>
        <button className="button button-primary" disabled={busy}>Schedule payment</button>
      </form>
      {message && <p className="tool-message" role="status"><span className="record-label">Practice record</span> · {message}</p>}{error && <p className="error" role="alert">{error}</p>}
    </ActionPanel>
    <LedgerItems entries={entries} kind="bill" onChange={onChange} />
  </div>;
}

function Statements({ user, transactions, balance, Transactions }) {
  const current = localDate().slice(0, 7);
  const [month, setMonth] = useState(current);
  const months = [...new Set([current, ...transactions.filter(entry => entry.status === 'posted').map(entry => localDate(entry.date).slice(0, 7))])].sort().reverse();
  const { entries, opening, credits, debits, closing } = statementFor(transactions, month, balance);
  const summary = [['Opening balance', opening], ['Credits', credits], ['Debits', debits], ['Closing balance', closing]];

  function download() {
    const rows = [['Harborline Bank statement — Practice record', month], ['Account', `Everyday Checking ending in ${user.lastFour}`],
      ...summary.map(([label, cents]) => [label, (cents / 100).toFixed(2)]), [],
      ['Date', 'Description', 'Type', 'Amount (USD)'],
      ...entries.map(entry => [localDate(entry.date), entry.description, entry.type, (entry.amount / 100).toFixed(2)])];
    const csv = rows.map(row => row.map(value => '"' + String(value).replaceAll('"', '""') + '"').join(',')).join('\r\n');
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
    const link = document.createElement('a');
    link.href = url;
    link.download = 'harborline-practice-statement-' + month + '.csv';
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  return <div className="bank-tools"><ActionPanel title="Monthly statement">
    <div className="tool-form"><label className="field">Statement month<select className="control" value={month} onChange={event => setMonth(event.target.value)}>
      {months.map(value => <option value={value} key={value}>{new Date(value + '-01T12:00:00').toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</option>)}
    </select></label><button className="button button-outline" onClick={download}>Download statement CSV</button></div>
    <dl className="statement-totals">{summary.map(([label, cents]) => <div key={label}><dt>{label}</dt><dd>{money(cents)}</dd></div>)}</dl>
    <p className="muted">Everyday Checking · •••• {user.lastFour} · Posted transactions only</p>
    </ActionPanel><section className="panel"><div className="panel-heading"><h2>Posted transactions</h2></div><Transactions entries={entries} label="Statement transactions" /></section></div>;
}

function AccountDetails({ user }) {
  return <div className="bank-tools"><ActionPanel title="Account information">
    <dl className="summary"><div><dt>Account holder</dt><dd>{user.name ?? user.username}</dd></div><div><dt>Account type</dt><dd>Everyday Checking</dd></div><div><dt>Account identifier</dt><dd>•••• {user.lastFour}</dd></div><div><dt>Currency</dt><dd>USD</dd></div></dl>
  </ActionPanel></div>;
}

const alertKey = 'harborline.alerts.v1';
const alertTypes = [['deposit','Deposit posted'],['bill','Bill payment posted'],['adjustment','Owner balance adjustment'],['payout','Batch payout posted']];
function Alerts({ user, ledger }) {
  const preferenceKey = accountSessionKey(alertKey, user.id);
  const [preferences, setPreferences] = useState(() => (readSession(preferenceKey) ?? 'deposit,bill').split(','));
  const [saved, setSaved] = useState(false);
  const [active, setActive] = useState(preferences);
  const enabledTypes = new Map(alertTypes.filter(([key]) => active.includes(key)));
  const feed = ledger.filter(entry => entry.status === 'posted' && enabledTypes.has(entry.kind));
  return <div className="bank-tools">
    <ActionPanel title="In-app alert preferences">
      <p className="muted">Choose which transactions appear in this browser tab’s alert feed.</p>
      <form className="tool-form" onSubmit={event => { event.preventDefault(); writeSession(preferenceKey, preferences.join(',')); setActive(preferences); setSaved(true); }}>
        {alertTypes.map(([key, title]) => <label key={key} className="field"><input type="checkbox" checked={preferences.includes(key)} onChange={event => {
          const checked = event.target.checked;
          setPreferences(current => checked ? [...current,key] : current.filter(item => item !== key));
          setSaved(false);
        }} /> {title}</label>)}
        <button className="button button-primary">Save alert preferences</button>
      </form>
      {saved && <p className="tool-message" role="status">Alert preferences saved.</p>}
    </ActionPanel>
    <ActionPanel title="Alert feed">{feed.length ? <ul className="demo-item-list">{feed.map(entry => <li key={entry.reference}><div><strong>{enabledTypes.get(entry.kind)}</strong><small className="reference">{entry.reference} · {dateLabel(entry.postedAt || entry.date)}</small></div><strong className="demo-item-amount">{money(signedAmount(entry))}</strong></li>)}</ul> : <p className="muted">Posted activity appears here for the alert types you enable.</p>}</ActionPanel>
  </div>;
}

export function BankTool({ user, page, ledger, transactions, balance, onAdd, onChange, Transactions }) {
  if (page === 'deposits') return <Deposits ledger={ledger} onAdd={onAdd} onChange={onChange} />;
  if (page === 'bill-pay') return <BillPay ledger={ledger} onAdd={onAdd} onChange={onChange} />;
  if (page === 'details') return <AccountDetails user={user} />;
  if (page === 'alerts') return <Alerts user={user} ledger={ledger} />;
  return <Statements user={user} transactions={transactions} balance={balance} Transactions={Transactions} />;
}

