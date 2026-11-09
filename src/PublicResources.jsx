import React, { useState } from 'react';
import { Icon } from './Art.jsx';
import { pages, personalNav } from './catalog.js';
import { Link } from './Navigation.jsx';
import { money, parseAdminAmount } from './model.js';

const groups = {
  Calculators: ['savings-calculator','mortgage-calculator','auto-calculator','cash-planner'],
  'Digital banking': ['deposit-guide','bill-pay-guide','statements-guide','card-controls','direct-deposit','alerts-guide'],
  'Business & treasury': ['payment-finder','business-lending','treasury','commercial-insights','industries'],
  'Help & security': ['signin-help','activity-help','fraud-support','locations','accessibility'],
};

function ResourceLink({ item }) {
  const page = pages[item];
  return <Link className="resource-link" page={item}><span className="transaction-icon"><Icon name={page.icon} /></span><span><strong>{page.label}</strong><small>{page.description}</small></span><Icon name="chevron" /></Link>;
}

export function ResourceDirectory() {
  const [query, setQuery] = useState('');
  const [group, setGroup] = useState('');
  const terms = query.trim().toLowerCase().split(/\s+/).filter(Boolean);
  const shown = Object.entries(groups).filter(([name]) => !group || group === name).map(([name, keys]) => [name, keys.filter(key => {
    const { label, description } = pages[key];
    return terms.every(term => (label + ' ' + description).toLowerCase().includes(term));
  })]).filter(([, keys]) => keys.length);

  return <section className="resource-directory" aria-labelledby="resource-title">
    <div className="resource-toolbar"><div><h2 id="resource-title">Explore tools and guides</h2><p className="muted">Search by topic or choose a category.</p></div><label className="field">Search resources<input className="control" type="search" placeholder="Try card lock or cash flow" value={query} onChange={event => setQuery(event.target.value)} /></label></div>
    <div className="resource-tabs" aria-label="Resource categories">{['', ...Object.keys(groups)].map(name => <button key={name} className="button button-outline" aria-pressed={group === name} onClick={() => setGroup(name)}>{name || 'All resources'}</button>)}</div>
    <p className="muted resource-count" aria-live="polite">{shown.reduce((count, [, keys]) => count + keys.length, 0)} tools and guides</p>
    <div className="resource-directory-groups">{shown.map(([name, keys]) => <section className="panel resource-group" key={name}><h3>{name}</h3>{keys.map(key => <ResourceLink key={key} item={key} />)}</section>)}</div>
    {!shown.length && <p className="muted">No guides match that search. Try a shorter phrase or another category.</p>}
  </section>;
}

const helpOptions = [['signin-help', 'Sign in or create a profile'], ['activity-help', 'Find an account transaction'], ['transfers', 'Make a transfer'], ['card-controls', 'Lock or unlock a card'], ['fraud-support', 'Check an unfamiliar transaction'], ['locations', 'Find a location'], ['accessibility', 'Use keyboard and mobile controls']];

export function SupportFinder() {
  const [topic, setTopic] = useState(helpOptions[0][0]);
  return <section className="panel resource-tool support-finder">
    <div><h2>Find help by task</h2><p className="muted">Choose what you are trying to do and open the guide for it.</p></div>
    <div className="resource-inline"><label className="field">I need help with<select className="control" value={topic} onChange={event => setTopic(event.target.value)}>{helpOptions.map(([key, title]) => <option key={key} value={key}>{title}</option>)}</select></label><Link className="button button-primary" page={topic}>Open guide <Icon name="arrow" /></Link></div>
  </section>;
}

const paymentOptions = {
  counter: { label: 'In person', title: 'Counter or mobile point of sale', steps: ['Collect payment and record each sale at checkout.', 'Review refunds and the expected settlement date.', 'Reconcile deposits by day or location.'], link: 'industry-retail' },
  online: { label: 'Online checkout', title: 'Checkout with order references', steps: ['Record an order reference with each payment.', 'Track failed, refunded, and settled payments separately.', 'Match the settlement total with fulfilled orders.'], link: 'merchant' },
  invoice: { label: 'By invoice', title: 'Invoice and track collections', steps: ['Issue an invoice with a reference and a due date.', 'Track the outstanding amount until the payment posts.', 'Match the payment with the invoice and update the cash forecast.'], link: 'industry-services' },
};

export function PaymentFinder() {
  const [choice, setChoice] = useState('counter');
  const [result, setResult] = useState('counter');
  const option = paymentOptions[result];
  return <section className="resource-tool-grid" aria-labelledby="payment-finder-title">
    <form className="panel resource-tool" onSubmit={event => { event.preventDefault(); setResult(choice); }}>
      <h2 id="payment-finder-title">How will your customers pay?</h2><p className="muted">Choose a channel to see an example collection workflow.</p>
      <fieldset className="payment-options"><legend className="sr-only">Payment channel</legend>{Object.entries(paymentOptions).map(([key, item]) => <label key={key}><input type="radio" name="channel" value={key} checked={choice === key} onChange={event => setChoice(event.target.value)} /> {item.label}</label>)}</fieldset>
      <button className="button button-primary">Show payment workflow</button>
    </form>
    <div className="panel resource-tool resource-result" aria-live="polite"><p className="resource-kicker">Example workflow</p><h2>{option.title}</h2><ol>{option.steps.map(step => <li key={step}>{step}</li>)}</ol><Link className="link" page={option.link}>Explore the guide <Icon name="arrow" /></Link></div>
  </section>;
}

const cashFields = [['opening', 'Opening cash'], ['incoming', 'Expected collections'], ['outgoing', 'Expected payments'], ['reserve', 'Reserve target']];
const cashScenarios = { retail: ['24000','14000','19500','12000'], services: ['12000','5500','11000','9000'] };
const scenarioValues = name => Object.fromEntries(cashFields.map(([key], index) => [key, cashScenarios[name][index]]));

function forecast(values) {
  const [opening, incoming, outgoing, reserve] = cashFields.map(([key]) => parseAdminAmount(values[key]));
  if ([opening, incoming, outgoing, reserve].includes(null)) return null;
  const closing = opening + incoming - outgoing;
  return { closing, gap: closing - reserve, net: incoming - outgoing };
}

export function CashPlanner() {
  const [values, setValues] = useState(() => scenarioValues('retail'));
  const [result, setResult] = useState(() => forecast(scenarioValues('retail')));
  const [error, setError] = useState('');

  function useScenario(name) {
    const next = scenarioValues(name);
    setValues(next);
    setResult(forecast(next));
    setError('');
  }

  return <section className="resource-tool-grid" aria-labelledby="planner-title">
    <form className="panel resource-tool" onSubmit={event => {
      event.preventDefault();
      const next = forecast(values);
      setError(next ? '' : 'Enter a valid USD amount for each field, using up to two decimal places.');
      setResult(next);
    }}>
      <h2 id="planner-title">Plan the next 30 days</h2><p className="muted">Start with a sample business or enter your own amounts in USD.</p>
      <div className="resource-tabs"><button type="button" className="button button-outline" onClick={() => useScenario('retail')}>Retail example</button><button type="button" className="button button-outline" onClick={() => useScenario('services')}>Services example</button></div>
      <div className="planner-fields">{cashFields.map(([key, label]) => <label className="field" key={key}>{label} (USD)<input className="control" inputMode="decimal" maxLength={12} required value={values[key]} onChange={event => { setValues({ ...values, [key]: event.target.value }); setResult(null); setError(''); }} /></label>)}</div>
      {error && <p className="error" role="alert">{error}</p>}
      <button className="button button-primary">Calculate cash position</button>
    </form>
    <div className="panel resource-tool resource-result" aria-live="polite"><p className="resource-kicker">Projected closing cash</p>{result ? <>
      <strong className="resource-estimate">{money(result.closing)}</strong><dl className="summary"><div><dt>Net cash movement</dt><dd>{money(result.net)}</dd></div><div><dt>{result.gap < 0 ? 'Short of reserve' : 'Above reserve target'}</dt><dd>{money(Math.abs(result.gap))}</dd></div></dl>
      <p>Opening cash plus collections less payments, compared with the reserve target.</p>
    </> : <p>Calculate the cash position to see the projected balance and reserve gap.</p>}</div>
  </section>;
}

export function PublicSiteMap() {
  const top = [...personalNav, 'business', 'commercial', 'digital', 'help', 'resources'];
  return <section className="site-map-grid" aria-label="Public pages by category">{top.map(key => <section key={key}><h2><Link page={key}>{pages[key].label}</Link></h2><ul>
    {Object.values(pages).filter(page => page.parent === key).map(page => <li key={page.key}><Link page={page.key}>{page.label}</Link></li>)}
  </ul></section>)}<section><h2>Quick links</h2><ul><li><Link to="/">Home</Link></li><li><Link page="search">Search Northpoint</Link></li><li><Link to="/admin">Owner access</Link></li></ul></section></section>;
}

const briefs = [
  ['Cash management', 'Make the next 30 days visible', 'Estimate what will come in, what needs to go out, and how much cash remains above a sample reserve.', 'cash-planner'],
  ['Collections', 'Follow a sale to settlement', 'Compare a checkout sale with an invoice and see which records help you reconcile each one.', 'payment-finder'],
  ['Controls', 'Try a review before posting', 'Use the owner payment queue to inspect a sample check or scheduled bill before it changes an account balance.', 'commercial-payments'],
];
const updates = [
  ['Owner tools', 'Review a payout run', 'Create accounts, set separate payout amounts, then review the batch in the owner workspace.', 'about'],
  ['Digital banking', 'Try the new card controls', 'Lock the debit card and see how a purchase behaves before and after you unlock it.', 'card-controls'],
  ['Learning resources', 'Plan a cash buffer', 'Compare the retail and services examples with your own numbers.', 'cash-planner'],
];

export function EditorialResources({ community = false }) {
  return <section className="resource-editorial" aria-label={community ? 'Recent Northpoint updates' : 'Commercial briefs'}>
    <h2>{community ? 'Latest from Northpoint' : 'Commercial briefs'}</h2>
    <div className="resource-editorial-grid">{(community ? updates : briefs).map(([category, title, description, key]) => <article className="panel resource-tool" key={key}>
      <p className="resource-kicker">{category}</p><h3>{title}</h3><p className="muted">{description}</p><Link className="link" page={key}>Open guide <Icon name="arrow" /></Link>
    </article>)}</div>
    {community && <p className="muted resource-community-note">Community updates and guides are published here in Northpoint. Keep passwords, account details, and screenshots with personal information out of public posts.</p>}
  </section>;
}

export function IndustryDirectory() {
  return <section className="panel resource-group" aria-label="Industries"><h2>Explore by industry</h2>{['industry-retail','industry-property','industry-services'].map(key => <ResourceLink key={key} item={key} />)}</section>;
}
