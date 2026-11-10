import React, { useState } from 'react';
import { Icon } from './Art.jsx';
import { Link } from './Navigation.jsx';
import { adjustmentModes, dateLabel, money } from './model.js';
import { downloadCsv } from './Transactions.jsx';

export const accountPath = id => '/admin?view=accounts&account=' + id;
const actions = {
  'owner-setup': 'Owner access set up', 'account-created': 'Account created',
  'balance-adjustment': 'Balance adjustment', 'batch-payout': 'Batch payout', 'payment-review': 'Payment review',
};

export function AccountsList({ accounts, compact = false, selected }) {
  const [query, setQuery] = useState('');
  const match = query.trim().toLowerCase();
  const shown = compact ? accounts.slice(0, 5) : accounts.filter(account => `${account.username} ${account.lastFour}`.toLowerCase().includes(match));
  return <section className="panel owner-list-panel">
    <div className="panel-heading"><div><h2>{compact ? 'Accounts' : 'Account directory'}</h2><p className="muted">{accounts.length} local {accounts.length === 1 ? 'profile' : 'profiles'}</p></div>
      {compact && <Link to="/admin?view=accounts" className="link">View all <Icon name="arrow" /></Link>}
    </div>
    {!compact && <div className="owner-list-search"><label className="field">Find an account<input type="search" className="control" placeholder="Username or last four" value={query} onChange={event => setQuery(event.target.value)} /></label></div>}
    {shown.length ? <ul className="workspace-list">{shown.map(account => <li key={account.id}>
      <Link className="workspace-row" to={accountPath(account.id)} aria-current={selected === account.id ? 'page' : undefined}>
        <span className="owner-row-person"><span className="avatar" aria-hidden="true">{account.username.slice(0, 2).toUpperCase()}</span><span><strong>{account.username}</strong><small>•••• {account.lastFour} · {account.role === 'owner' ? 'Owner' : account.isDemo ? 'Customer' : 'Customer'}</small></span></span>
        <span>{money(account.balance)}</span><Icon name="chevron" />
      </Link>
    </li>)}</ul> : <div className="workspace-empty"><strong>No matching accounts</strong><p>Search by username or the last four digits.</p></div>}
  </section>;
}

export function PaymentQueue({ queue, compact = false, onReview }) {
  const [kind, setKind] = useState('');
  const shown = compact ? queue.slice(0, 4) : queue.filter(item => !kind || item.kind === kind);
  return <section className="panel owner-list-panel">
    <div className="panel-heading"><div><h2>Payment queue</h2><p className="muted">Pending checks and scheduled bills</p></div>{compact ? <Link to="/admin?view=payments" className="link">Open queue <Icon name="arrow" /></Link> :
      <select className="control owner-queue-filter" aria-label="Payment item type" value={kind} onChange={event => setKind(event.target.value)}><option value="">All open items</option><option value="deposit">Checks</option><option value="bill">Scheduled bills</option></select>}</div>
    {shown.length ? <ul className="workspace-list owner-queue-list">{shown.map(item => {
      const deposit = item.kind === 'deposit';
      return <li className="owner-queue-row" key={item.account.id + ':' + item.reference}>
        <div className="owner-row-person"><span className="transaction-icon"><Icon name={deposit ? 'down' : 'send'} /></span><span><strong>{item.label}</strong><small>{item.account.username} · {dateLabel(deposit ? item.date : item.scheduledFor + 'T12:00:00')}</small></span></div>
        <div className="owner-queue-amount"><strong>{money(item.cents)}</strong><span className={'status-pill status-' + item.status}>{item.status}</span></div>
        {!compact && <div className="owner-queue-actions"><button className="button button-outline small-button" onClick={() => onReview(item, 'post')}>{deposit ? 'Review check' : 'Review posting'}</button><button className="link" onClick={() => onReview(item, deposit ? 'decline' : 'cancel')}>{deposit ? 'Decline' : 'Cancel bill'}</button></div>}
      </li>;
    })}</ul> : <div className="workspace-empty"><strong>{queue.length ? 'No items match this filter' : 'The queue is clear'}</strong><p>{queue.length ? 'Choose another payment item type.' : 'Checks and scheduled bills appear here when customers submit them.'}</p></div>}
  </section>;
}

function auditLabel(event) {
  if (event.action === 'balance-adjustment') return adjustmentModes[event.mode];
  if (event.action === 'payment-review') return (event.kind === 'deposit' ? 'Check ' : 'Bill ') + event.status;
  return actions[event.action];
}

const auditTarget = event => event.recipients ? `${event.recipients.length} ${event.recipients.length === 1 ? 'account' : 'accounts'}` : event.username;
const auditAmount = event => event.total ?? event.delta ?? null;

export function AuditLog({ events, compact = false }) {
  const [type, setType] = useState('');
  const [query, setQuery] = useState('');
  const shown = compact ? events.slice(0, 5) : events.filter(event => (!type || event.action === type)
    && [auditLabel(event), auditTarget(event), event.actor, event.memo, event.reference].join(' ').toLowerCase().includes(query.trim().toLowerCase()));

  function exportAudit() {
    downloadCsv('northpoint-audit.csv', ['Timestamp','Owner','Action','Target','Change (USD)','Reason','Reference'], shown.map(event => [
      event.date, event.actor, auditLabel(event), auditTarget(event), auditAmount(event) === null ? '' : (auditAmount(event) / 100).toFixed(2), event.memo, event.reference,
    ]));
  }

  return <section className="panel audit-panel">
    <div className="panel-heading"><div><h2>{compact ? 'Latest admin activity' : 'Owner activity'}</h2><p className="muted">{compact ? 'Recent account changes' : 'The most recent 100 owner events'}</p></div>
      {compact && <Link to="/admin?view=audit" className="link">View audit log <Icon name="arrow" /></Link>}
    </div>
    {!compact && <div className="workspace-filters"><label className="field">Search audit log<input className="control" type="search" placeholder="Name, reason, or reference" value={query} onChange={event => setQuery(event.target.value)} /></label>
      <label className="field">Action<select className="control" value={type} onChange={event => setType(event.target.value)}><option value="">All actions</option>{Object.entries(actions).map(([key, title]) => <option key={key} value={key}>{title}</option>)}</select></label>
      <button className="button button-outline" disabled={!shown.length} onClick={exportAudit}><Icon name="download" /> Export CSV</button></div>}
    <div className="table-scroll"><table aria-label="Owner audit log" className="owner-audit-table"><thead><tr><th scope="col">Action</th><th scope="col">Account</th><th scope="col">Date</th><th scope="col">Change</th></tr></thead>
      <tbody>{shown.map(event => {
        const amount = auditAmount(event);
        return <tr key={event.id}><td><strong>{auditLabel(event)}</strong><small>By {event.actor}</small>
          {!compact && (event.memo || event.reference) && <details><summary>Event details</summary>{event.memo && <p>{event.memo}</p>}{event.reference && <small className="reference">{event.reference}</small>}
            {event.recipients && <ul>{event.recipients.map(person => <li key={person.id}>{person.username} · {money(person.cents)}</li>)}</ul>}</details>}
        </td><td>{auditTarget(event)}</td><td>{dateLabel(event.date)}</td><td className={amount > 0 ? 'credit' : undefined}>{amount === null ? '—' : (amount > 0 ? '+' : '') + money(amount)}</td></tr>;
      })}{!shown.length && <tr><td className="empty" colSpan="4">No owner events match these filters.</td></tr>}</tbody>
    </table></div>
  </section>;
}
