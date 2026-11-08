import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import { Icon } from './Art.jsx';
import { Brand } from './Shared.jsx';
import { hrefFor, pages } from './catalog.js';

const RouterContext = createContext(null);
const current = () => window.location.pathname + window.location.search + window.location.hash;

export function Router({ children }) {
  const [location, setLocation] = useState(current);
  useEffect(() => {
    const sync = () => setLocation(current());
    window.addEventListener('popstate', sync);
    return () => window.removeEventListener('popstate', sync);
  }, []);

  useEffect(() => {
    if (location.endsWith('#demo-sign-in')) {
      const field = document.getElementById('sign-in-identity');
      field?.focus({ preventScroll: true });
      document.getElementById('demo-sign-in')?.scrollIntoView({ block: 'center' });
    } else if (!window.location.hash) {
      window.scrollTo(0, 0);
    }
  }, [location]);

  function go(to, replace = false) {
    if (to === current()) {
      if (to.endsWith('#demo-sign-in')) document.getElementById('sign-in-identity')?.focus();
      return;
    }
    if (replace) window.history.replaceState(null, '', to);
    else window.history.pushState(null, '', to);
    setLocation(current());
  }

  return <RouterContext.Provider value={{ location, go }}>{children}</RouterContext.Provider>;
}

export const useRouter = () => useContext(RouterContext);

export function Link({ to, page, children, onClick, ...props }) {
  const { go } = useRouter();
  const href = to || hrefFor(page);
  function follow(event) {
    onClick?.(event);
    if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.altKey || event.shiftKey || props.target) return;
    event.preventDefault();
    go(href);
  }
  return <a href={href} onClick={follow} {...props}>{children}</a>;
}

const audiences = [
  { id: 'personal', label: 'Personal', groups: [
    ['Banking and credit', ['checking', 'savings', 'cards', 'home', 'auto']],
    ['Plan ahead', ['investing', 'education', 'travel', 'compare-checking']],
    ['Everyday services', ['digital', 'direct-deposit', 'locations', 'help']],
  ] },
  { id: 'business', label: 'Business', page: 'business', groups: [
    ['Accounts and financing', ['business-checking', 'business-savings', 'business-cards', 'business-lending']],
    ['Get paid', ['merchant', 'payment-finder']],
    ['Tools and guidance', ['knowledge', 'cash-planner', 'help']],
  ] },
  { id: 'commercial', label: 'Commercial', page: 'commercial', groups: [
    ['Solutions', ['treasury', 'commercial-payments', 'commercial-lending']],
    ['Clients and industries', ['industries', 'industry-retail', 'industry-property', 'industry-services']],
    ['Insights and tools', ['commercial-insights', 'cash-planner', 'knowledge']],
  ] },
  { id: 'digital', label: 'Digital banking', page: 'digital', groups: [
    ['Move money', ['transfers', 'deposit-guide', 'bill-pay-guide', 'direct-deposit']],
    ['Manage your account', ['card-controls', 'statements-guide', 'details-guide', 'alerts-guide', 'activity-help']],
  ] },
  { id: 'resources', label: 'Resources', page: 'resources', groups: [
    ['Calculators', ['savings-calculator', 'mortgage-calculator', 'auto-calculator', 'cash-planner']],
    ['Support and information', ['help', 'fraud-support', 'accessibility', 'community', 'site-map']],
  ] },
];

export function SiteHeader({ section = 'personal', signedIn, showAccountLink }) {
  const [open, setOpen] = useState(false);
  const [expanded, setExpanded] = useState(null);
  const menu = useRef(null);
  const header = useRef(null);
  const buttons = useRef({});
  const dismiss = () => { setOpen(false); setExpanded(null); };
  useEffect(() => {
    function outside(event) {
      if (!header.current?.contains(event.target)) dismiss();
    }
    document.addEventListener('pointerdown', outside);
    return () => document.removeEventListener('pointerdown', outside);
  }, []);
  const accountHref = signedIn ? '/' : '/#demo-sign-in';
  return <header className="site-header editorial-header" ref={header} onBlur={event => {
    if (event.relatedTarget && !event.currentTarget.contains(event.relatedTarget)) dismiss();
  }} onKeyDown={event => {
    if (event.key !== 'Escape') return;
    if (expanded) { buttons.current[expanded]?.focus(); setExpanded(null); }
    else if (open) { dismiss(); menu.current?.focus(); }
  }}>
    <a className="skip-link" href="#public-content">Skip to content</a>
    <div className="shell editorial-header-inner">
      <Link to="/" className="brand-link" aria-label="Harborline Bank home" onClick={dismiss}><Brand /></Link>
      <nav className="bank-header-utilities" aria-label="Help and search">
        <Link page="locations" onClick={dismiss}>Locations</Link><Link page="help" onClick={dismiss}>Help</Link>
        <Link page="search" className="editorial-search" onClick={dismiss}><Icon name="search" />Search</Link>
      </nav>
      {showAccountLink && <Link to={accountHref} className="button editorial-signin bank-header-account" onClick={dismiss}>{signedIn ? 'Accounts' : 'Sign in'}</Link>}
      <button type="button" ref={menu} className="editorial-menu-button" aria-controls="public-navigation" aria-expanded={open} aria-label={open ? 'Close menu' : 'Open menu'} onClick={() => open ? dismiss() : setOpen(true)}><Icon name="menu" /></button>
    </div>
    <nav id="public-navigation" className={'bank-audience-nav' + (open ? ' is-open' : '')} aria-label="Main navigation">
      <ul className="shell bank-audience-list">{audiences.map(({ id, label, page, groups }) => <li key={id}>
        <div className={'bank-audience-tab' + (section === id ? ' is-current' : '')}>
          <Link to={page ? hrefFor(page) : signedIn ? '/checking' : '/'} onClick={dismiss}>{label}</Link>
          <button type="button" aria-label={`${label} menu`} aria-expanded={expanded === id} aria-controls={`bank-menu-${id}`} ref={element => { buttons.current[id] = element; }} onClick={() => setExpanded(expanded === id ? null : id)}><Icon name="chevron" /></button>
        </div>
        <div className="bank-menu-panel" id={`bank-menu-${id}`} hidden={expanded !== id}>
          {groups.map(([title, keys]) => <section key={title}><h2>{title}</h2><ul>{keys.map(key => <li key={key}><Link page={key} onClick={dismiss}>{pages[key].label}</Link></li>)}</ul></section>)}
        </div>
      </li>)}</ul>
      <div className="shell bank-mobile-utilities"><Link page="locations" onClick={dismiss}>Locations</Link><Link page="help" onClick={dismiss}>Help</Link><Link page="search" onClick={dismiss}>Search</Link></div>
    </nav>
  </header>;
}

const footerGroups = [
  ['Personal banking', ['checking','savings','cards','home','auto','investing','education','travel']],
  ['For businesses', ['business','merchant','payment-finder','commercial','treasury','cash-planner','commercial-insights']],
  ['Help and tools', ['help','digital','resources','fraud-support','locations','community','site-map','accessibility']],
];

export function SiteFooter() {
  return <footer className="site-footer rich-footer">
    <div className="shell footer-links">
      <div><Link to="/" className="brand-link"><Brand /></Link></div>
      {footerGroups.map(([title, keys]) => <nav aria-label={title} key={title}><h2>{title}</h2>{keys.map(key => <Link page={key} key={key}>{pages[key].label}</Link>)}</nav>)}
    </div>
    <div className="shell footer-note"><Link page="about">About Harborline</Link><Link page="security">Privacy & security</Link><Link page="search">Search the site</Link><Link to="/admin">Owner access</Link></div>
  </footer>;
}
