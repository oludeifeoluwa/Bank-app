import React, { useState } from 'react';
import { Icon } from './Art.jsx';
import { Link } from './Navigation.jsx';
import { money } from './model.js';

const branches = [
  ['Bayview Center', 'Bayview', 'HB 10001', 'Branch and ATM'],
  ['Riverton Market', 'Riverton', 'HB 10002', 'Branch and ATM'],
  ['Lakehurst Station', 'Lakehurst', 'HB 10003', 'ATM'],
];
export function DemoBranchFinder() {
  const [query, setQuery] = useState('');
  const [applied, setApplied] = useState('');
  const results = branches.filter(branch => branch.join(' ').toLowerCase().includes(applied));
  return <section className="panel tool-panel" aria-labelledby="demo-branch-title">
    <h2 id="demo-branch-title">Find a location</h2>
    <p className="muted">Search example locations by city, name, or postal code.</p>
    <form className="tool-form" onSubmit={event => { event.preventDefault(); setApplied(query.trim().toLowerCase()); }}>
      <label className="field">City or postal code<input className="control" type="search" placeholder="Try Bayview or 10002" value={query} onChange={event => setQuery(event.target.value)} /></label>
      <button className="button button-primary">Search locations</button>
    </form>
    <p className="tool-message" role="status">{results.length} {results.length === 1 ? 'location' : 'locations'}</p>
    <ul className="demo-item-list">{results.map(([name,city,code,type]) => <li key={name}><div><strong>{name}</strong><small>{city} · {code} · {type}</small></div></li>)}</ul>
  </section>;
}

const issues = ['Sign-in issue', 'Unrecognized transaction', 'Transfer issue'];
export function DemoIssueReport() {
  const [topic, setTopic] = useState('');
  const [receipt, setReceipt] = useState(null);
  return <section className="panel tool-panel" aria-labelledby="demo-issue-title">
    <h2 id="demo-issue-title">Report an issue</h2>
    <p className="muted">Choose an issue type to preview the reporting flow.</p>
    <form className="tool-form" onSubmit={event => {
      event.preventDefault();
      if (issues.includes(topic)) setReceipt({ topic, reference: 'HL-HELP-' + Date.now().toString(36).toUpperCase() });
    }}>
      <label className="field">Issue category<select className="control" required value={topic} onChange={event => { setTopic(event.target.value); setReceipt(null); }}>
        <option value="">Choose a category</option>{issues.map(issue => <option key={issue}>{issue}</option>)}
      </select></label><button className="button button-primary">Submit report</button>
    </form>
    {receipt && <p className="tool-message" role="status">{receipt.topic} recorded. <span className="record-label">Practice record</span> · Reference {receipt.reference}.</p>}
  </section>;
}

export function MerchantSteps() {
  return <section aria-labelledby="merchant-example"><p className="eyebrow">Sample café sale</p><h2 id="merchant-example">Follow a payment from checkout to the books</h2>
    <ol className="merchant-steps">
      <li><strong>Authorize</strong><p>A customer taps a card for a sample $18.50 purchase. The terminal receives an approval.</p></li>
      <li><strong>Settle</strong><p>The café records the approved sale in its example settlement batch.</p></li>
      <li><strong>Reconcile</strong><p>The café matches the sale to its receipt and batch record.</p></li>
    </ol><Link page="knowledge" className="link">Browse business guides <Icon name="arrow" /></Link>
  </section>;
}

export function CommercialSnapshot() {
  const opening = 12400000;
  const incoming = 3800000;
  const outgoing = 2850000;
  const measures = [['Opening cash', opening], ['Incoming payments', incoming], ['Outgoing payments', outgoing], ['Projected cash', opening + incoming - outgoing]];
  return <section className="panel tool-panel" aria-labelledby="cash-snapshot-title"><p className="eyebrow">Illustrative figures</p><h2 id="cash-snapshot-title">Commercial cash flow snapshot</h2>
    <dl className="statement-totals">{measures.map(([label, cents]) => <div key={label}><dt>{label}</dt><dd>{money(cents)}</dd></div>)}</dl>
    <Link page="treasury" className="link">Explore treasury management <Icon name="arrow" /></Link>
  </section>;
}
