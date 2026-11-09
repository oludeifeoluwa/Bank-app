import React, { useState } from 'react';
import { Icon } from './Art.jsx';
import { Link, useRouter } from './Navigation.jsx';
import { pages, related } from './catalog.js';
import { money } from './model.js';
import { accountTools } from './ledger.js';
import { CommercialSnapshot, DemoBranchFinder, DemoIssueReport, MerchantSteps } from './SupportTools.jsx';
import { BusinessPhoto, PhotoFeatures } from './PhotoFeatures.jsx';
import { CashPlanner, EditorialResources, IndustryDirectory, PaymentFinder, PublicSiteMap, ResourceDirectory, SupportFinder } from './PublicResources.jsx';
import { WaveLines } from './DigitalShortcuts.jsx';
import checkingPhoto from './assets/checking-mobile.jpg';
import savingsPhoto from './assets/savings-planning.jpg';
import homePhoto from './assets/home-keys.jpg';
import autoPhoto from './assets/auto-keys.jpg';
import investingPhoto from './assets/investing-advisor.jpg';
import ownerPhoto from './assets/business-owner.jpg';

// Lifestyle photos shown in the hero of each personal product hub (and its
// child pages), so the public site reads like a real bank rather than icons.
const routePhotos = {
  checking: { src: checkingPhoto, alt: 'A person checking their account on a phone while out in the city' },
  savings: { src: savingsPhoto, alt: 'A couple reviewing their savings together at home' },
  home: { src: homePhoto, alt: 'A couple holding the keys to their new home' },
  auto: { src: autoPhoto, alt: 'A person holding the keys to their new car' },
  investing: { src: investingPhoto, alt: 'An advisor reviewing plans with two smiling clients' },
  business: { src: ownerPhoto, alt: 'Two small-business owners smiling behind their café counter' },
};

function PageCard({ item }) {
  return <Link page={item.key} className="route-card"><span className="route-card-icon"><Icon name={item.icon} /></span><h3>{item.label}</h3><p>{item.description}</p><Icon name="arrow" className="route-card-arrow" /></Link>;
}

function Breadcrumbs({ page }) {
  const parent = pages[page?.parent];
  return <nav className="shell breadcrumbs" aria-label="Breadcrumb">
    <Link to="/">Home</Link><Icon name="chevron" />
    {parent && <><Link page={parent.key}>{parent.label}</Link><Icon name="chevron" /></>}
    <span aria-current="page">{page?.label || 'Page not found'}</span>
  </nav>;
}

function PageArt({ section, name }) {
  if (name === 'checking' || name === 'digital') return <div className="route-illustration harbor-route-art"><WaveLines /></div>;
  return <div className={'route-illustration route-icon-art ' + section} aria-hidden="true"><span></span><Icon name={pages[name].icon} /></div>;
}

const calculatorConfig = {
  savings: { initial:['5000','500','12'], fields:[['Target amount ($)',1,100000000,1],['Already saved ($)',0,100000000,1],['Months',1,600,1]], result:'Monthly contribution', note:'Example only. Interest is excluded.' },
  auto: { initial:['28000','5000','6','60'], fields:[['Vehicle price ($)',1,100000000,1],['Down payment ($)',0,100000000,1],['Annual interest (%)',0,100,.01],['Term in months',1,600,1]], result:'Monthly payment', note:'Example only. Taxes, fees, trade-ins, and insurance are excluded.' },
  mortgage: { initial:['320000','64000','6','30'], fields:[['Home price ($)',1,100000000,1],['Down payment ($)',0,100000000,1],['Annual interest (%)',0,100,.01],['Term in years',1,50,1]], result:'Monthly principal and interest', note:'Example only. Taxes, fees, and insurance are excluded.' },
};

export function estimatePayment(kind, values) {
  const [price, paid, rateOrMonths, term] = values.map(Number);
  const principal = Math.max(0, price - paid);
  if (kind === 'savings') return principal / rateOrMonths;
  const months = kind === 'mortgage' ? term * 12 : term;
  const rate = rateOrMonths / 1200;
  return rate === 0 ? principal / months : principal * rate / (1 - (1 + rate) ** -months);
}

function Calculator({ kind }) {
  const config = calculatorConfig[kind];
  const [values, setValues] = useState(config.initial);
  const [result, setResult] = useState(() => estimatePayment(kind, config.initial));
  const [error, setError] = useState('');

  function submit(event) {
    event.preventDefault();
    if (kind !== 'savings' && Number(values[1]) > Number(values[0])) {
      setError('The down payment must be within the purchase price.');
      setResult(null);
      return;
    }
    setError('');
    setResult(estimatePayment(kind, values));
  }
  return <section className="calculator" aria-labelledby="calculator-title">
    <form onSubmit={submit}><h2 id="calculator-title">Try a sample estimate</h2><div className="calculator-fields">
      {config.fields.map(([label,min,max,step], index) => <label key={label} className="field">{label}
        <input className="control" type="number" min={min} max={max} step={step} required value={values[index]} onChange={event => {
          setValues(values.map((value, i) => i === index ? event.target.value : value));
          setError('');
          setResult(null);
        }} /></label>)}
      </div>
      {error && <p className="error" role="alert">{error}</p>}<button className="button button-primary">Calculate</button>
    </form>
    <div className="calculator-result"><p className="eyebrow">{config.result}</p><p className="estimate" aria-live="polite">{result === null ? '—' : money(Math.round(result * 100))}</p><p>{config.note}</p></div>
  </section>;
}

function CheckingComparison() {
  return <div className="table-scroll comparison"><table aria-label="Checking account comparison">
    <thead><tr><th scope="col">Feature</th><th scope="col"><Link page="everyday">Everyday Checking</Link></th><th scope="col"><Link page="student">Student checking</Link></th></tr></thead>
    <tbody><tr><th scope="row">Focus</th><td>Everyday transactions</td><td>Basic account habits</td></tr><tr><th scope="row">Explore</th><td>Balance, transfers, and activity</td><td>Tracking routine spending</td></tr><tr><th scope="row">Experience</th><td>Account tools</td><td>Educational guide</td></tr></tbody>
  </table></div>;
}

const FAQs = {
  checking:[['How do I open the sample account?', 'Select Use sample account on the sign-in form, then sign in.'],['Where can I see transfers?', 'Use the transaction type filter in Activity to find transfers.']],
  savings:[['How does the savings estimate work?', 'The example subtracts the money already saved and divides the remainder by the number of months.'],['Can I try a transfer to savings?', 'Choose Oak Street Savings as the sample recipient in Pay & transfer.']],
  home:[['What does the payment estimate include?', 'It estimates monthly principal and interest based on the price, down payment, sample rate, and term.']],
  auto:[['Can I compare terms?', 'Change the term in the calculator and recalculate to see how the monthly estimate changes.']],
  help:[['Do I need to create an account?', 'Select Use sample account on the sign-in form to explore an account with example activity.'],['Where is activity stored?', 'Harborline saves each account’s activity on this installation.']],
  business:[['What can I explore in Business banking?', 'Use the guides for business checking, card payments, credit cards, and recordkeeping.']],
  commercial:[['Where can I learn about cash management?', 'The Treasury management guide covers cash visibility, forecasting, and payment controls.']],
};

function SavingsComparison() {
  return <section aria-labelledby="savings-comparison-title"><h2 id="savings-comparison-title">Compare sample savings options</h2><div className="table-scroll comparison"><table aria-label="Savings and CDs comparison">
    <thead><tr><th scope="col">Compare</th><th scope="col"><Link page="flex-savings">Flexible savings</Link></th><th scope="col"><Link page="cds">Certificate of deposit</Link></th></tr></thead>
    <tbody><tr><th scope="row">Time horizon</th><td>Ongoing savings</td><td>Set term</td></tr><tr><th scope="row">Access</th><td>Flexible access</td><td>Plan around the maturity date</td></tr><tr><th scope="row">Explore next</th><td><Link page="savings-calculator">Try a savings goal</Link></td><td><Link page="cds">Learn how terms work</Link></td></tr></tbody>
  </table></div></section>;
}

export function ProductPage({ page, signedIn }) {
  const task = Object.keys(accountTools).find(key => accountTools[key].guide === page.key);
  const accountLink = (task ? '/?task=' + task : '/') + (signedIn ? '' : '#demo-sign-in');
  const merchant = page.key === 'merchant';
  const parent = pages[page.parent];
  const hub = parent || page;
  const next = (parent ? [...parent.children, ...(related[parent.key] || [])] : related[page.key] || [])
    .filter((key, index, all) => key !== page.key && all.indexOf(key) === index).slice(0, 3);
  return <main id="public-content" tabIndex={-1}>
    <Breadcrumbs page={page} />
    <section className="route-hero"><div className="shell route-hero-grid">
      <div><p className="eyebrow">{parent ? parent.label : page.section === 'personal' ? 'Personal banking' : 'Harborline Bank'}</p>
        <h1>{page.title}</h1><p>{page.description}</p>
        <div className="route-actions">
          {merchant ? <Link page="payment-finder" className="button button-primary">Find a payment workflow <Icon name="arrow" /></Link> :
            <Link to={accountLink} className="button button-primary">{signedIn ? (task ? `Open ${accountTools[task].title.toLowerCase()}` : 'Open accounts') : 'Sign in'} <Icon name="arrow" /></Link>}
          {parent && <Link page={parent.key} className="button button-outline">Back to {parent.label}</Link>}
          {page.key === 'commercial' && <Link page="cash-planner" className="button button-outline">Plan a cash position</Link>}
        </div>
      </div>
      {["merchant", "knowledge"].includes(page.key)
        ? <div className="route-photo"><BusinessPhoto page={page.key} eager /></div>
        : routePhotos[hub.key]
          ? <div className="route-photo route-photo--hub"><img src={routePhotos[hub.key].src} alt={routePhotos[hub.key].alt} width="1280" height="854" loading="eager" decoding="async" /></div>
          : <PageArt name={hub.key} section={page.section} />}
    </div></section>
    <div className="shell route-sections">
      {page.calculator && <Calculator key={page.key} kind={page.calculator} />}
      {page.key === 'resources' && <ResourceDirectory />}
      {['help', 'contact'].includes(page.key) && <SupportFinder />}
      {page.key === 'site-map' && <PublicSiteMap />}
      {page.key === 'payment-finder' && <PaymentFinder />}
      {page.key === 'cash-planner' && <CashPlanner />}
      {page.key === 'industries' && <IndustryDirectory />}
      {page.key === 'community' && <EditorialResources community />}
      {page.key === 'commercial-insights' && <EditorialResources />}
      {page.key === 'compare-checking' && <CheckingComparison />}
      {page.children && <section aria-labelledby="options"><p className="eyebrow">Explore your options</p><h2 id="options">{page.label} at Harborline</h2>
        <div className="route-card-grid">{page.children.map(key => <PageCard key={key} item={pages[key]} />)}</div>
      </section>}
      {page.key === 'business' && <PhotoFeatures />}
      {page.key === 'locations' && <DemoBranchFinder />}
      {page.key === 'report-issue' && <DemoIssueReport />}
      {merchant && <MerchantSteps />}
      {page.key === 'commercial' && <CommercialSnapshot />}
      {page.key === 'treasury' && <div className="route-actions"><Link page="cash-planner" className="button button-primary">Try the cash planner</Link><Link to="/admin" className="button button-outline">Open owner workspace</Link></div>}
      {page.key === 'fraud-support' && <div className="route-actions"><Link page="card-controls" className="button button-outline">Card controls guide</Link><Link page="report-issue" className="button button-outline">Report an issue</Link></div>}
      {page.key === 'savings' && <SavingsComparison />}
      {['buy-home','refinance-home'].includes(page.key) && <Link page="mortgage-calculator" className="link">Estimate a monthly payment <Icon name="arrow" /></Link>}
      {page.points && <section className="detail-section"><h2>{page.calculator ? 'About this estimate' : 'What to know'}</h2><ul>{page.points.map(point => <li key={point}><span><Icon name="check" /></span>{point}</li>)}</ul></section>}
      {FAQs[page.key] && <section className="faqs"><h2>Frequently asked questions</h2>{FAQs[page.key].map(([question, answer]) => <details key={question}><summary>{question}</summary><p>{answer}</p></details>)}</section>}
      {next.length > 0 && <section aria-labelledby="related"><p className="eyebrow">More from Harborline</p><h2 id="related">You might also be looking for</h2><div className="route-card-grid">{next.map(key => <PageCard key={key} item={pages[key]} />)}</div></section>}
    </div>
  </main>;
}

export function SearchPage({ query }) {
  const { go } = useRouter();
  const [input, setInput] = useState(query);
  const terms = query.toLowerCase().trim().split(/\s+/).filter(Boolean);
  const found = Object.values(pages).filter(page => page.key !== 'search' && terms.every(term =>
    (page.label + ' ' + page.description).toLowerCase().includes(term)));
  return <main id="public-content" tabIndex={-1}>
    <Breadcrumbs page={pages.search} />
    <section className="shell search-page"><p className="eyebrow">Products, tools & guides</p><h1>Search Harborline</h1>
      <form onSubmit={event => { event.preventDefault(); go('/search?q=' + encodeURIComponent(input.trim())); }}>
        <label className="field" htmlFor="site-search">Search the site</label>
        <div><input className="control" id="site-search" type="search" placeholder="Try checking, auto, or transfers" value={input} onChange={event => setInput(event.target.value)} /><button className="button button-primary"><Icon name="search" /> Search</button></div>
      </form>
      <p aria-live="polite">{terms.length ? found.length + ' result' + (found.length === 1 ? '' : 's') + ' for “' + query + '”' : 'Popular starting points'}</p>
      <div className="route-card-grid">{(terms.length ? found : ['checking','resources','mortgage-calculator','help'].map(key => pages[key])).map(item => <PageCard item={item} key={item.key} />)}</div>
      {terms.length > 0 && !found.length && <p>Try a different product name or browse <Link page="help">customer support</Link>.</p>}
    </section>
  </main>;
}

export function MissingPage() {
  return <main id="public-content" tabIndex={-1}><Breadcrumbs /><section className="shell search-page"><h1>Page not found</h1><p>Find a product or tool through the homepage or site search.</p><div className="route-actions"><Link to="/" className="button button-primary">Go to homepage</Link><Link page="search" className="button button-outline">Search Harborline</Link></div></section></main>;
}
