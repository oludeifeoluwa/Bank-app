import React, { useRef, useState } from 'react';
import { Icon } from './Art.jsx';
import { Link } from './Navigation.jsx';
import { Brand } from './Shared.jsx';

function WorkspaceLink({ item, onPick }) {
  const contents = <><Icon name={item.icon} /><span>{item.label}</span></>;
  const current = item.active ? 'page' : undefined;
  if (item.to) return <Link className="workspace-link" to={item.to} aria-current={current} onClick={onPick}>{contents}</Link>;
  return <button className="workspace-link" aria-current={current} disabled={item.disabled} onClick={() => { onPick(); item.onClick(); }}>{contents}</button>;
}

export function WorkspaceShell({ label, user, nav, secondary, onSignOut, children }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const [error, setError] = useState('');
  const menu = useRef(null);

  async function leave() {
    setError('');
    setSigningOut(true);
    try { await onSignOut(); }
    catch (error) { setError(error.message); setSigningOut(false); }
  }

  return <div className="bank workspace">
    <a className="skip-link" href="#workspace-content">Skip to dashboard</a>
    <header className="workspace-top">
      <Link className="brand-link" to="/" aria-label="Northpoint Bank account overview"><Brand /></Link>
      <button ref={menu} className="button button-outline small-button workspace-menu" aria-expanded={menuOpen} aria-controls="workspace-side" onClick={() => setMenuOpen(!menuOpen)}><Icon name="menu" /> Menu</button>
      <div className="workspace-profile"><span className="avatar" aria-hidden="true">{user.username.slice(0, 2).toUpperCase()}</span><span className="workspace-profile-name">{user.username}</span><button className="button button-outline small-button" disabled={signingOut} onClick={leave}>{signingOut ? 'Signing out…' : 'Sign out'}</button></div>
    </header>
    <div className="workspace-frame">
      <aside id="workspace-side" className={'workspace-side' + (menuOpen ? ' workspace-side-open' : '')} onKeyDown={event => { if (event.key === 'Escape' && menuOpen) { setMenuOpen(false); menu.current?.focus(); } }}>
        <nav aria-label={label} className="workspace-nav">
          <p>{label}</p>
          {nav.map(item => <WorkspaceLink key={item.label} item={item} onPick={() => setMenuOpen(false)} />)}
        </nav>
        <nav aria-label="More Northpoint tools" className="workspace-nav workspace-secondary">
          {secondary.map(item => <WorkspaceLink key={item.label} item={item} onPick={() => setMenuOpen(false)} />)}
        </nav>
      </aside>
      <main id="workspace-content" className="workspace-main" tabIndex={-1}>
        {error && <p className="error" role="alert">{error}</p>}
        {children}
      </main>
    </div>
  </div>;
}
