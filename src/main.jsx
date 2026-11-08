import React, { useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { Home } from './Home.jsx';
import { Bank } from './Bank.jsx';
import { OwnerGateway, OwnerWorkspace } from './OwnerWorkspace.jsx';
import { Router, SiteHeader, SiteFooter, useRouter } from './Navigation.jsx';
import { ProductPage, SearchPage, MissingPage } from './Pages.jsx';
import { DigitalBanking } from './DigitalShortcuts.jsx';
import { pageByPath } from './catalog.js';
import { activeProfile, signOut } from './auth.js';
import './styles.css';
import './routes.css';
import './photos.css';
import './digital.css';
import './dashboard.css';
import './workspace.css';
import './resources.css';
import './harborline.css';
import { accountTools } from './ledger.js';

function App() {
  const [user, setUser] = useState(undefined);
  const [sessionError, setSessionError] = useState('');
  const [attempt, setAttempt] = useState(0);
  const { location, go } = useRouter();
  const address = new URL(location, window.location.origin);
  const pathname = address.pathname.replace(/\/+$/, '') || '/';
  const home = pathname === '/';
  const admin = pathname === '/admin';
  const nextAdmin = address.searchParams.get('next') === 'admin';
  const requested = address.searchParams.get('task');
  const task = Object.hasOwn(accountTools, requested) ? requested : 'overview';
  const page = pageByPath.get(pathname);

  useEffect(() => {
    document.title = (admin ? 'Owner workspace | ' : page ? page.label + ' | ' : '') + 'Harborline Bank';
  }, [page, admin]);

  useEffect(() => {
    const controller = new AbortController();
    activeProfile(controller.signal).then(({ user }) => {
      if (!controller.signal.aborted) setUser(user);
    }).catch(error => {
      if (!controller.signal.aborted) setSessionError(error.message);
    });
    return () => controller.abort();
  }, [attempt]);

  function updateSession(profile) {
    setUser(profile);
    const destination = profile ? (nextAdmin || profile.role === 'owner' ? '/admin' : task === 'overview' ? '/' : '/?task=' + task) : '/#demo-sign-in';
    go(destination, true);
  }

  async function endSession(destination = '/#demo-sign-in') {
    await signOut();
    setUser(null);
    go(destination, true);
  }

  return <>
    {(home || admin) && user === undefined ? <main className="shell bank-main">
      {sessionError ? <><p className="error" role="alert">{sessionError}</p><button className="button button-outline" onClick={() => { setSessionError(''); setAttempt(value => value + 1); }}>Try again</button></> : <p role="status">Opening Harborline…</p>}
    </main> : user && home ? <Bank key={user.id} user={user} page={task} navigate={next => go(next === 'overview' ? '/' : '/?task=' + next)} onSignOut={endSession} onExpired={() => updateSession(null)} /> :
    admin && user?.role === 'owner' ? <OwnerWorkspace key={user.id} user={user} view={address.searchParams.get('view')} accountId={address.searchParams.get('account')} onSignOut={endSession} onExpired={() => updateSession(null)} /> : <>
      <SiteHeader key={pathname} section={page?.section} signedIn={Boolean(user)} showAccountLink={page?.key !== 'digital'} />
      {home ? <Home onSignIn={updateSession} /> :
        admin ? <OwnerGateway key={user?.id ?? 'guest'} user={user} onSetup={updateSession} onSignOut={endSession} onExpired={() => updateSession(null)} /> :
        page?.key === 'digital' ? <DigitalBanking signedIn={Boolean(user)} /> :
        page?.key === 'search' ? <SearchPage key={address.search} query={address.searchParams.get('q') || ''} /> :
        page ? <ProductPage key={page.key} page={page} signedIn={Boolean(user)} /> : <MissingPage />}
      <SiteFooter />
    </>}
  </>;
}

createRoot(document.getElementById('root')).render(<Router><App /></Router>);
