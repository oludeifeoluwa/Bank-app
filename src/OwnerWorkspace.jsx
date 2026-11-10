import React, { useEffect, useState } from 'react';
import { Icon } from './Art.jsx';
import { apiRequest } from './auth.js';
import { Link, useRouter } from './Navigation.jsx';
import { dateLabel, money, totalMoney } from './model.js';
import { WorkspaceShell } from './WorkspaceShell.jsx';
import { AccountsList, AuditLog, PaymentQueue, accountPath } from './OwnerTables.jsx';
import { AdjustmentDialog, CreateAccountDialog, PaymentDialog, Payouts } from './OwnerForms.jsx';
import { Transactions } from './Transactions.jsx';

const views = {
  overview: ['Overview', 'grid', 'Operations overview', 'Manage accounts, payments, and ledger activity.'],
  accounts: ['Accounts', 'users', 'Accounts', 'Find a profile, inspect its activity, or adjust its balance.'],
  payments: ['Payment queue', 'clock', 'Payment queue', 'Review pending checks and scheduled bills.'],
  payouts: ['Batch payouts', 'send', 'Batch payouts', 'Review and credit multiple accounts in a single batch.'],
  audit: ['Audit log', 'list', 'Audit log', 'See who changed a balance, created an account, or reviewed a payment.'],
};

function useOwnerData(path, userId, version, onExpired) {
  const [response, setResponse] = useState({ path: '', data: null, error: '' });
  useEffect(() => {
    if (!path) return;
    const controller = new AbortController();
    apiRequest(path, { userId, signal: controller.signal }).then(data => {
      if (!controller.signal.aborted) setResponse({ path, data, error: '' });
    }).catch(error => {
      if (controller.signal.aborted) return;
      if (error.status === 401) onExpired();
      else setResponse({ path, data: null, error: error.message });
    });
    return () => controller.abort();
  }, [path, userId, version]);
  return response.path === path ? response : { data: null, error: '' };
}

function RequestState({ error, onRetry, loading }) {
  return <div className="panel workspace-panel">{error ? <><p className="error" role="alert">{error}</p><button className="button button-outline" onClick={onRetry}>Try again</button></> : <p className="muted" role="status">{loading}</p>}</div>;
}

export function OwnerGateway({ user, onSetup, onSignOut, onExpired }) {
  const [version, setVersion] = useState(0);
  const [code, setCode] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const { data, error: loadError } = useOwnerData(user && !user.isDemo ? 'admin/setup' : '', user?.id, version, onExpired);

  async function claim(event) {
    event.preventDefault();
    if (busy) return;
    setBusy(true);
    setError('');
    try {
      const { user: owner } = await apiRequest('admin/setup', { method: 'POST', userId: user.id, body: { code: code.trim() } });
      onSetup(owner);
    } catch (error) {
      if (error.status === 401) onExpired();
      else setError(error.message);
    } finally { setBusy(false); }
  }

  async function usePrivateProfile() {
    try { await onSignOut('/?next=admin#demo-sign-in'); }
    catch (error) { setError(error.message); }
  }

  return <main id="public-content" className="owner-gateway" tabIndex={-1}>
    <section className="panel owner-gateway-panel">
      <span className="transaction-icon"><Icon name="lock" /></span><h1>Owner workspace</h1>
      {!user ? <><p className="muted">Sign in with your private profile to manage accounts and payments.</p><Link className="button button-primary" to="/?next=admin#demo-sign-in">Sign in or create a profile</Link></> :
        user.isDemo ? <><p className="muted">Alex is the shared walkthrough profile. Use a private profile for owner access.</p><button className="button button-primary" onClick={usePrivateProfile}>Use a private profile</button></> :
        !data ? <RequestState error={loadError} onRetry={() => setVersion(value => value + 1)} loading="Checking owner access…" /> :
        data.available ? <>
          <p className="muted">Set up <strong>{user.username}</strong> as the owner of this Northpoint installation.</p>
          <ol className="owner-setup-steps"><li>Open <strong>Setup-Northpoint-Admin.cmd</strong> in your Northpoint folder.</li><li>Copy the one-time code from that window. It expires after 20 minutes.</li><li>Paste it below to activate your owner workspace.</li></ol>
          <form className="workspace-form" onSubmit={claim}>
            <label className="field">Owner setup code<input className="control" type="password" autoComplete="off" spellCheck={false} required value={code} maxLength={28} onChange={event => setCode(event.target.value)} /></label>
            <button className="button button-primary" disabled={busy}>{busy ? 'Setting up…' : 'Activate owner access'}</button>
          </form>
        </> : <><p className="muted">Owner access is assigned to a different profile on this installation.</p><button className="button button-primary" onClick={usePrivateProfile}>Sign in as owner</button></>}
      {error && <p className="error" role="alert">{error}</p>}
      <Link to="/" className="link">Return to Northpoint <Icon name="arrow" /></Link>
    </section>
  </main>;
}

function AccountDetail({ user, id, version, onExpired, onRefresh, onAdjust }) {
  const { data, error } = useOwnerData('admin/accounts/' + id, user.id, version, onExpired);
  if (!data) return <RequestState error={error} onRetry={onRefresh} loading="Opening account…" />;
  return <div className="workspace-stack">
    <section className="panel workspace-panel owner-account-detail">
      <div className="workspace-section-heading"><div><h2>{data.username}</h2><p>Everyday Checking · •••• {data.lastFour}</p></div><span className="status-pill status-posted">{data.role === 'owner' ? 'Owner' : data.isDemo ? 'Customer' : 'Customer'}</span></div>
      <p className="owner-detail-balance"><span>Available balance</span><strong>{money(data.balance)}</strong></p>
      <div className="owner-detail-actions"><button className="button button-primary" onClick={onAdjust}><Icon name="plus" /> Adjust balance</button><span className="muted">Card {data.cardLocked ? 'locked' : 'unlocked'}</span></div>
    </section>
    <section className="panel"><div className="panel-heading"><div><h2>Recent account activity</h2><p className="muted">Latest 10 ledger entries</p></div></div><Transactions label={`${data.username} account activity`} entries={data.transactions.slice(0, 10)} empty="This account has no activity yet." /></section>
  </div>;
}

export function OwnerWorkspace({ user, view: requested, accountId, onSignOut, onExpired }) {
  const { go } = useRouter();
  const view = Object.hasOwn(views, requested) ? requested : 'overview';
  const [version, setVersion] = useState(0);
  const [dialog, setDialog] = useState(null);
  const [message, setMessage] = useState(null);
  const { data, error } = useOwnerData('admin/workspace', user.id, `${version}:${view}:${accountId ?? ''}`, onExpired);
  const accounts = data?.accounts ?? [];
  const selected = accounts.find(account => String(account.id) === accountId);
  const nav = Object.entries(views).map(([key, [label, icon]]) => ({ label, icon, active: key === view, to: key === 'overview' ? '/admin' : '/admin?view=' + key }));
  const secondary = [{ label: 'Customer view', icon: 'card', to: '/' }, { label: 'Help center', icon: 'info', to: '/support' }];
  const refresh = () => setVersion(value => value + 1);

  async function post(path, body) {
    try {
      const result = await apiRequest('admin/' + path, { method: 'POST', userId: user.id, body });
      refresh();
      return result;
    } catch (error) {
      if (error.status === 401) onExpired();
      if (error.status === 409) refresh();
      throw error;
    }
  }

  const [, , title, description] = views[view];
  return <WorkspaceShell user={user} label="Owner workspace" nav={nav} secondary={secondary} onSignOut={onSignOut}>
    <div className="page-heading workspace-heading"><div><h1>{title}</h1><p className="muted">{description}</p></div>
      {(view === 'overview' || view === 'accounts') && <div className="owner-heading-actions">
        {view === 'accounts' && <button className="button button-outline" disabled={!data} onClick={() => setDialog({ type: 'create' })}>New account</button>}
        <button className="button button-primary" disabled={!data} onClick={() => setDialog({ type: 'adjust', id: view === 'accounts' ? selected?.id : undefined })}><Icon name="plus" /> New adjustment</button>
      </div>}
      {view === 'payments' && <button className="button button-outline" onClick={refresh}>Refresh queue</button>}
    </div>
    {message?.view === view && <p className="tool-message" role="status">{message.text}</p>}
    {!data ? <RequestState error={error} onRetry={refresh} loading="Opening owner workspace…" /> : <div className="workspace-stack">
      {view === 'overview' && <>
        <dl className="panel owner-metrics" aria-label="Workspace totals">
          <div><dt>Total balances</dt><dd>{totalMoney(data.totalBalance)}</dd><small>Across all accounts</small></div>
          <div><dt>Accounts</dt><dd>{accounts.length}</dd><small>On this installation</small></div>
          <div><dt>Open payment items</dt><dd>{data.queue.length}</dd><small>Checks and scheduled bills</small></div>
        </dl>
        <div className="workspace-columns owner-overview-columns"><AuditLog compact events={data.audit} /><PaymentQueue compact queue={data.queue} /></div>
        <AccountsList compact accounts={accounts} />
      </>}
      {view === 'accounts' && <div className="workspace-columns owner-account-grid">
        <AccountsList accounts={accounts} selected={selected?.id} />
        {selected ? <AccountDetail user={user} id={selected.id} version={version} onExpired={onExpired} onRefresh={refresh} onAdjust={() => setDialog({ type: 'adjust', id: selected.id })} /> : <section className="panel workspace-panel owner-detail-empty"><span className="transaction-icon"><Icon name="users" /></span><h2>Open an account</h2><p className="muted">Choose an account to see its balance, card state, and latest transactions.</p></section>}
      </div>}
      {view === 'payments' && <PaymentQueue queue={data.queue} onReview={(item, action) => setDialog({ type: 'payment', item, action })} />}
      {view === 'payouts' && <Payouts accounts={accounts} onPost={body => post('payouts', body)} />}
      {view === 'audit' && <AuditLog events={data.audit} />}
    </div>}

    {dialog?.type === 'adjust' && <AdjustmentDialog accounts={accounts} initial={dialog.id} onClose={() => setDialog(null)} onPost={(id, body) => post('accounts/' + id + '/adjustments', body)} />}
    {dialog?.type === 'create' && <CreateAccountDialog onClose={() => setDialog(null)} onCreate={async body => {
      const account = await post('accounts', body);
      setDialog(null);
      setMessage({ view: 'accounts', text: `${account.username} was created with a $0.00 balance.` });
      go(accountPath(account.id));
    }} />}
    {dialog?.type === 'payment' && <PaymentDialog item={dialog.item} action={dialog.action} onClose={() => setDialog(null)} onPost={async body => {
      const result = await post('payments', body);
      setDialog(null);
      setMessage({ view: 'payments', text: `${dialog.item.label} was ${result.status} for ${result.username}. ${dateLabel(result.date)}.` });
    }} />}
  </WorkspaceShell>;
}
