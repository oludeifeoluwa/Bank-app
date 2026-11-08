import React, { useMemo, useState } from 'react';
import { Icon } from './Art.jsx';
import { billers, localDate, sampleChecks } from './ledger.js';
import { money } from './model.js';
import { buildAccounts, depositTotal } from './accounts.js';
import { Transactions } from './Transactions.jsx';

const shortDate = new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric' });
const compactUsd = new Intl.NumberFormat('en-US', { notation: 'compact', style: 'currency', currency: 'USD', maximumFractionDigits: 1 });

function cashFlow(transactions, range) {
  const now = new Date();
  const buckets = new Map();
  const size = range === 7 ? 1 : range / 6;
  const groups = [];
  for (let offset = 0; offset < range; offset++) {
    const day = new Date(now.getFullYear(), now.getMonth(), now.getDate() - range + 1 + offset);
    if (offset % size === 0) groups.push({ label: shortDate.format(day), credits: 0, debits: 0 });
    buckets.set(localDate(day), groups.at(-1));
  }
  for (const { date, amount, status } of transactions) {
    const group = buckets.get(localDate(date));
    if (!group || status !== 'posted') continue;
    if (amount > 0) group.credits += amount;
    else group.debits -= amount;
  }
  return groups;
}

function CashFlow({ transactions, account }) {
  const [range, setRange] = useState(7);
  const groups = cashFlow(transactions, range);
  const ceiling = Math.max(100, ...groups.flatMap(group => [group.credits, group.debits]));
  const credits = groups.reduce((sum, group) => sum + group.credits, 0);
  const debits = groups.reduce((sum, group) => sum + group.debits, 0);
  const inLabel = account.kind === 'credit' ? 'Payments' : 'Money in';
  const outLabel = account.kind === 'credit' ? 'Purchases' : 'Money out';

  return <section className="panel cash-flow" aria-labelledby="cash-flow-heading">
    <div className="workspace-section-heading"><div><h2 id="cash-flow-heading">Cash flow</h2><p>{account.name} · USD</p></div>
      <select aria-label="Cash flow date range" className="control cash-range" value={range} onChange={event => setRange(Number(event.target.value))}>
        {[7, 30, 90].map(days => <option key={days} value={days}>Last {days} days</option>)}
      </select>
    </div>
    <div className="cash-legend"><span><i className="flow-in" /> {inLabel} <strong>{money(credits)}</strong></span><span><i className="flow-out" /> {outLabel} <strong>{money(debits)}</strong></span></div>
    <div className="cash-plot" aria-hidden="true">
      <div className="cash-scale"><span>{compactUsd.format(ceiling / 100)}</span><span>{compactUsd.format(ceiling / 200)}</span><span>$0</span></div>
      <div className="cash-bars">{groups.map(({ label, credits, debits }) => <div className="cash-group" key={label}>
        <div className="cash-pair"><i className="flow-in" style={{ height: `${credits / ceiling * 100}%` }} /><i className="flow-out" style={{ height: `${debits / ceiling * 100}%` }} /></div><small>{label}</small>
      </div>)}</div>
    </div>
    <ul className="sr-only">{groups.map(group => <li key={group.label}>From {group.label}, {inLabel.toLowerCase()} {money(group.credits)}, {outLabel.toLowerCase()} {money(group.debits)}</li>)}</ul>
  </section>;
}

function Upcoming({ ledger, navigate }) {
  const upcoming = ledger.filter(entry => entry.status === 'pending' || entry.status === 'scheduled');
  const ordered = [...upcoming].sort((a, b) => (a.scheduledFor ?? a.date).localeCompare(b.scheduledFor ?? b.date));

  return <section className="panel upcoming-panel">
    <div className="panel-heading"><div><h2>Upcoming</h2><p className="muted">Checks and scheduled bills</p></div><span className="dashboard-snapshot-icon"><Icon name="clock" /></span></div>
    {ordered.length ? <ul className="workspace-list">{ordered.slice(0, 4).map(entry => {
      const deposit = entry.kind === 'deposit';
      return <li key={entry.reference}><button className="workspace-row" onClick={() => navigate(deposit ? 'deposits' : 'bill-pay')}>
        <span><strong>{deposit ? sampleChecks[entry.check].label : billers[entry.biller]}</strong><small>{deposit ? 'Pending clearance' : shortDate.format(new Date(entry.scheduledFor + 'T12:00:00'))}</small></span><span>{money(entry.cents)}</span><Icon name="chevron" /></button></li>;
    })}</ul> : <div className="workspace-empty"><strong>You’re all caught up</strong><p>Pending checks and scheduled bills will appear here.</p><button className="link" onClick={() => navigate('bill-pay')}>Schedule a bill <Icon name="arrow" /></button></div>}
  </section>;
}

function AccountTile({ account, active, onSelect }) {
  const credit = account.kind === 'credit';
  return <button type="button" className={'account-tile account-kind-' + account.kind + (active ? ' account-tile-active' : '')} aria-pressed={active} onClick={onSelect}>
    <span className="account-tile-top">
      <span className="account-tile-icon"><Icon name={account.icon} /></span>
      <span className="account-tile-id"><strong>{account.name}</strong><small>{account.type} ·&nbsp;•••• {account.lastFour}</small></span>
      {account.sample && <span className="account-tile-tag">Sample</span>}
    </span>
    <span className="account-tile-figure">
      <small>{credit ? 'Current balance' : 'Available balance'}</small>
      <strong>{money(account.balanceCents)}</strong>
    </span>
    <span className="account-tile-foot">
      {credit
        ? <span>{money(account.availableCents)} available of {money(account.limitCents)}</span>
        : account.apy ? <span>{account.apy} APY</span> : <span>Primary spending account</span>}
      <Icon name="chevron" />
    </span>
  </button>;
}

function AccountsStrip({ accounts, selectedId, onSelect, total }) {
  return <section className="panel accounts-strip" aria-labelledby="accounts-strip-title">
    <div className="panel-heading"><div><h2 id="accounts-strip-title">Your accounts</h2><p className="muted">Select an account to see its details</p></div>
      <div className="accounts-total"><small>Total deposits</small><strong>{money(total)}</strong></div>
    </div>
    <div className="account-tiles" role="list">
      {accounts.map(account => <div role="listitem" key={account.id}>
        <AccountTile account={account} active={account.id === selectedId} onSelect={() => onSelect(account.id)} />
      </div>)}
    </div>
  </section>;
}

function BalanceCard({ account, navigate, onTransfer, onAddFunds }) {
  const credit = account.kind === 'credit';
  const usedPct = credit ? Math.min(100, Math.round(account.balanceCents / account.limitCents * 100)) : 0;

  return <article className={'dashboard-balance dashboard-balance-' + account.id}>
    <div className="dashboard-balance-top">
      <span className="dashboard-account-icon"><Icon name={account.icon} /></span>
      <div><h2>{account.name}</h2><p>{account.type} · ending in {account.lastFour}</p></div>
      {account.sample && <span className="dashboard-demo-badge">Sample account</span>}
    </div>
    <div className="dashboard-balance-main"><p>{account.tagline}</p><strong>{money(account.balanceCents)}</strong></div>

    {credit && <div className="dashboard-credit-meter">
      <div className="dashboard-credit-track"><span style={{ width: usedPct + '%' }} /></div>
      <p><span>{money(account.availableCents)} available</span><span>Limit {money(account.limitCents)}</span></p>
    </div>}
    {account.id === 'savings' && <p className="dashboard-balance-note">Earns {account.apy} APY in this practice environment.</p>}

    <div className="dashboard-balance-actions">
      {account.id === 'checking' && <button className="button button-mint" onClick={onAddFunds}>Add test funds</button>}
      {account.id === 'savings' && <button className="button button-mint" onClick={onTransfer}>Move money</button>}
      {credit && <button className="button button-mint" onClick={onTransfer}>Make a payment</button>}
      <button className="dashboard-account-link" onClick={() => navigate('details')}>Account details <Icon name="arrow" /></button>
    </div>
  </article>;
}

export function Dashboard({ user, balance, ledger, transactions, navigate, onTransfer, onAddFunds }) {
  const accounts = useMemo(() => buildAccounts(user, balance, ledger), [user, balance, ledger]);
  const [selectedId, setSelectedId] = useState('checking');
  const selected = accounts.find(account => account.id === selectedId) ?? accounts[0];
  const total = depositTotal(accounts);
  const view = selected.real ? transactions : selected.activity;

  const actions = [
    ['Transfer', 'send', 'Review and send funds', onTransfer],
    ['Deposit a check', 'down', 'Submit a check', () => navigate('deposits')],
    ['Pay a bill', 'card', 'Schedule a payment', () => navigate('bill-pay')],
    ['Statements', 'list', 'View monthly records', () => navigate('statements')],
  ];

  return <div className="dashboard">
    <AccountsStrip accounts={accounts} selectedId={selected.id} onSelect={setSelectedId} total={total} />

    <div className="dashboard-summary">
      <BalanceCard account={selected} navigate={navigate} onTransfer={onTransfer} onAddFunds={onAddFunds} />
      <CashFlow transactions={view} account={selected} />
    </div>

    <div className="workspace-columns workspace-overview-bottom">
      <section className="panel dashboard-activity">
        <div className="panel-heading"><div><h2>Recent activity</h2><p className="muted">{selected.name} · •••• {selected.lastFour}</p></div>
          {selected.real && <button className="link" onClick={() => navigate('activity')}>View activity <Icon name="arrow" /></button>}</div>
        <Transactions entries={view.slice(0, 5)} label={'Recent activity for ' + selected.name} empty={selected.real ? 'No activity yet. Add test funds to see your first transaction.' : 'No sample activity for this account.'} />
      </section>
      <Upcoming ledger={ledger} navigate={navigate} />
    </div>
    <section className="panel dashboard-actions" aria-labelledby="dashboard-actions-title">
      <h2 id="dashboard-actions-title">Quick actions</h2>
      <div className="dashboard-action-grid">{actions.map(([title, icon, note, run]) => <button key={title} onClick={run}><span className="transaction-icon"><Icon name={icon} /></span><span><strong>{title}</strong><small>{note}</small></span><Icon name="chevron" /></button>)}</div>
    </section>
  </div>;
}
