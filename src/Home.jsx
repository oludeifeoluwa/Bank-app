import React, { useEffect, useRef, useState } from 'react';
import { Icon } from './Art.jsx';
import { demoEmail, demoPassword, readSession, storageKeys, writeSession } from './model.js';
import { authenticate } from './auth.js';
import { Signup } from './Signup.jsx';
import { Link } from './Navigation.jsx';
import { pages, personalNav } from './catalog.js';
import { DigitalShortcuts, QuickHelp } from './DigitalShortcuts.jsx';
import personalPhoto from './assets/personal-finances.webp';
import homeFeaturePhoto from './assets/home-keys.jpg';

function Login({ onSignIn, openSignup, identityRef }) {
  const [remember, setRemember] = useState(() => readSession(storageKeys.remember) === 'yes');
  const [identifier, setIdentifier] = useState(remember ? demoEmail : '');
  const [password, setPassword] = useState('');
  const [visible, setVisible] = useState(false);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const inProgress = useRef(false);
  const passwordRef = useRef(null);

  async function submit(event) {
    event.preventDefault();
    if (inProgress.current) return;
    inProgress.current = true;
    setBusy(true);
    setError('');
    try {
      const { user } = await authenticate(identifier, password);
      if (user.isDemo) writeSession(storageKeys.remember, remember ? 'yes' : null);
      onSignIn(user);
    } catch (error) {
      setError(error.message);
      if (error.status === 401) {
        setPassword('');
        passwordRef.current?.focus();
      }
    } finally {
      inProgress.current = false;
      setBusy(false);
    }
  }

  return <section id="demo-sign-in" className="login" aria-labelledby="login-title">
    <h2 id="login-title">Sign in to Northpoint</h2>
    <p className="muted login-intro">Secure online banking, built around you.</p>
    <form onSubmit={submit}>
      <label className="field" htmlFor="sign-in-identity">Username or email</label>
      <input className="control" id="sign-in-identity" ref={identityRef} autoComplete="username" autoCapitalize="none" placeholder="Enter your username" value={identifier} onChange={event => setIdentifier(event.target.value)} spellCheck={false} required />
      <label className="field" htmlFor="password">Password</label>
      <div className="password-input"><input className="control" id="password" ref={passwordRef} type={visible ? 'text' : 'password'} autoComplete="current-password" placeholder="Enter your password" value={password} onChange={event => setPassword(event.target.value)} required />
        <button className="link" type="button" onClick={() => setVisible(!visible)} aria-label={visible ? 'Hide password' : 'Show password'}>{visible ? 'Hide' : 'Show'}</button>
      </div>
      <div className="login-options"><label><input type="checkbox" checked={remember} onChange={event => setRemember(event.target.checked)} /> Remember sample email</label><Link className="link" page="signin-help">Sign-in help</Link></div>
      {error && <p className="error" role="alert">{error}</p>}
      <button className="button button-primary" type="submit" disabled={busy}>{busy ? 'Signing in…' : 'Sign in'} <Icon name="arrow" /></button>
    </form>
    <div className="login-bottom"><button className="link" type="button" onClick={openSignup} disabled={busy}>Create an account <Icon name="chevron" /></button><Link className="link" page="signin-help">Forgot username or password?</Link></div>
  </section>;
}

const trustItems = [
  ['shield', 'Bank-grade 256-bit encryption', 'on every session'],
  ['lock', '24/7 fraud monitoring', 'with instant alerts'],
  ['check', 'Trusted by thousands', 'of members nationwide'],
];

function TrustBar() {
  return <section className="harbor-trust" aria-label="Security and assurances">
    <div className="shell harbor-trust-inner">
      {trustItems.map(([icon, title, note]) => <span className="harbor-trust-item" key={title}>
        <Icon name={icon} /><span>{title} <small>{note}</small></span>
      </span>)}
    </div>
  </section>;
}

const highlights = [
  ['savings', '3.75%', 'APY', 'Grow balances faster with Northpoint Savings.'],
  ['card', '$0', 'monthly fee', 'Everyday Checking with no minimum balance.'],
  ['grid', '55,000+', 'fee-free ATMs', 'Withdraw cash across the nationwide network.'],
  ['check', '4.8★', 'app rating', 'Rated by people managing money every day.'],
];

function Highlights() {
  return <section className="harbor-highlights" aria-labelledby="highlights-title">
    <div className="shell">
      <div className="harbor-section-title"><h2 id="highlights-title">Why people choose Northpoint</h2><Link className="link" page="checking">Compare accounts <Icon name="arrow" /></Link></div>
      <ul className="harbor-highlight-grid">{highlights.map(([icon, figure, unit, note]) => <li className="harbor-highlight" key={unit}>
        <span className="harbor-highlight-icon"><Icon name={icon} /></span>
        <strong>{figure} <span className="harbor-highlight-unit">{unit}</span></strong>
        <span className="harbor-highlight-note">{note}</span>
      </li>)}</ul>
    </div>
  </section>;
}

function LifestyleFeature() {
  return <section className="shell photo-features harbor-home-feature" aria-label="Home ownership">
    <article className="photo-feature">
      <div className="business-photo harbor-feature-photo"><img src={homeFeaturePhoto} alt="A happy couple holding the keys to their new home" width="1280" height="854" loading="lazy" decoding="async" /></div>
      <div className="photo-feature-copy">
        <p className="eyebrow">Home loans</p>
        <h2>From first tour to first key</h2>
        <p>Explore buying or refinancing, estimate a monthly payment, and see what fits your plans — all in one place.</p>
        <Link page="home" className="button button-primary">Explore home loans <Icon name="arrow" /></Link>
      </div>
    </article>
  </section>;
}

export function Home({ onSignIn }) {
  const [signup, setSignup] = useState(false);
  const identityRef = useRef(null);

  useEffect(() => {
    if (window.location.hash === '#demo-sign-in') {
      identityRef.current?.focus({ preventScroll: true });
      document.getElementById('demo-sign-in')?.scrollIntoView({ block: 'center' });
    }
  }, []);

  return <>
    <main id="public-content" className="harbor-home" tabIndex={-1}>
      <section className="shell harbor-lead home-lead" aria-labelledby="home-title">
        <div className="home-lead-story">
          <div className="harbor-lead-copy">
            <h1 id="home-title">Your money.<br />In view.</h1>
            <p>See what comes in, what goes out, and what’s ahead. All from one place.</p>
            <Link className="button button-primary" page="checking">Explore checking <Icon name="arrow" /></Link>
          </div>
          <div className="home-lead-photo">
            <img src={personalPhoto} alt="A woman reviewing paperwork at a café table" width="800" height="1200" fetchPriority="high" decoding="async" />
          </div>
        </div>
        <Login onSignIn={onSignIn} openSignup={() => setSignup(true)} identityRef={identityRef} />
      </section>

      <TrustBar />
      <Highlights />

      <DigitalShortcuts />

      <LifestyleFeature />

      <section className="harbor-products" aria-labelledby="products-title">
        <div className="shell">
          <div className="harbor-section-title"><h2 id="products-title">Explore banking products</h2><Link className="link" page="site-map">View site map <Icon name="arrow" /></Link></div>
          <ul className="harbor-product-list">{personalNav.map(key => <li key={key}>
            <Link page={key}><Icon name={pages[key].icon} /><span>{pages[key].label}</span><Icon name="chevron" /></Link>
          </li>)}</ul>
          <div className="harbor-business-links">
            <Link page="business"><strong>Business banking</strong><small>Accounts, payments, and guides for growing businesses.</small><Icon name="arrow" /></Link>
            <Link page="commercial"><strong>Commercial banking</strong><small>Treasury, financing, and industry resources.</small><Icon name="arrow" /></Link>
          </div>
        </div>
      </section>

      <QuickHelp />
    </main>
    {signup && <Signup onSignIn={onSignIn} onClose={() => setSignup(false)} />}
  </>;
}
