import React from 'react';
import { Icon } from './Art.jsx';
import { Link } from './Navigation.jsx';
import { pages } from './catalog.js';
import { DigitalBankingArtwork } from './BankingArtwork.jsx';

const tasks = [
  ['transfers', 'Transfer money', 'Review a transfer and follow its status.', 'send'],
  ['card-controls', 'Manage cards', 'Lock or unlock your debit card.', 'card'],
  ['statements-guide', 'View statements', 'Review balances and download records.', 'list'],
  ['alerts-guide', 'Update alerts', 'Choose what appears in your alerts.', 'bell'],
];

const guideGroups = [
  ['Move money', ['transfers', 'deposit-guide', 'bill-pay-guide', 'direct-deposit']],
  ['Manage your account', ['card-controls', 'statements-guide', 'activity-help', 'details-guide', 'alerts-guide']],
];

const shortcuts = [
  ['signin-help', 'Trouble signing in', 'lock'],
  ['activity-help', 'Find a transaction', 'list'],
  ['locations', 'Find a location', 'house'],
  ['report-issue', 'Report an issue', 'shield'],
];

export function WaveLines() {
  return <svg className="harbor-wave" viewBox="0 0 620 330" fill="none" aria-hidden="true" focusable="false">
    {Array.from({ length: 27 }, (_, line) => <path key={line}
      d={`M 5 ${319 + line * 1.9} C 157 ${203 + line * 6}, 204 ${164 + line * 5}, 343 ${216 + line * 1.8} S 478 ${-11 + line * 4.3}, 620 ${10 + line * 7.9}`}
      stroke="currentColor" strokeWidth=".9" opacity={0.23 + line * .012} />)}
  </svg>;
}

function TaskLinks() {
  return <ul className="harbor-tasks" aria-label="Digital banking shortcuts">{tasks.map(([page, label, detail, icon]) => <li key={page}>
    <Link page={page}><Icon name={icon} /><span><strong>{label}</strong><small>{detail}</small></span><Icon name="chevron" /></Link>
  </li>)}</ul>;
}

export function DigitalBanking({ signedIn }) {
  return <main id="public-content" className="digital-hub" tabIndex={-1}>
    <section className="shell harbor-lead digital-lead" aria-labelledby="digital-heading">
      <div className="harbor-lead-copy">
        <h1 id="digital-heading">Digital banking</h1>
        <p>Manage payments, cards, and statements in one place.</p>
        <Link className="button button-primary" to={signedIn ? '/' : '/#demo-sign-in'}>{signedIn ? 'Open accounts' : 'Sign in'} <Icon name="arrow" /></Link>
      </div>
      <DigitalBankingArtwork />
    </section>
    <div className="shell"><TaskLinks /></div>
    <div className="shell harbor-guide-groups">{guideGroups.map(([title, keys]) => <section key={title} aria-label={title}>
      <h2>{title}</h2>
      <ul>{keys.map(key => <li key={key}><Link page={key}><span><strong>{pages[key].label}</strong><small>{pages[key].description}</small></span><Icon name="chevron" /></Link></li>)}</ul>
    </section>)}</div>
  </main>;
}

export function DigitalShortcuts() {
  return <section className="shell harbor-home-digital" aria-labelledby="digital-shortcut-title">
    <div className="harbor-section-title"><h2 id="digital-shortcut-title">Digital banking</h2><Link page="digital" className="link">View all tools <Icon name="arrow" /></Link></div>
    <TaskLinks />
  </section>;
}

export function QuickHelp() {
  return <section className="shell quick-help harbor-quick-help" aria-labelledby="quick-help-title">
    <div className="harbor-section-title"><h2 id="quick-help-title">How can we help?</h2><Link page="help" className="link">Help center <Icon name="arrow" /></Link></div>
    <div className="quick-help-links">{shortcuts.map(([page, title, icon]) =>
      <Link key={page} page={page}><Icon name={icon} />{title}</Link>)}</div>
  </section>;
}
