import React, { useRef, useState } from 'react';
import { createProfile, passwordMinimum } from './auth.js';
import { Dialog } from './Shared.jsx';

export function Signup({ onSignIn, onClose }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const inProgress = useRef(false);

  async function submit(event) {
    event.preventDefault();
    if (inProgress.current) return;
    if (password !== confirm) return setError('The passwords need to match.');
    inProgress.current = true;
    setBusy(true);
    setError('');
    try {
      const { user } = await createProfile(username, password);
      onSignIn(user);
    } catch (error) {
      setError(error.message);
    } finally {
      inProgress.current = false;
      setBusy(false);
    }
  }

  return <Dialog title="Create your account" onClose={() => { if (!inProgress.current) onClose(); }}>
    <p className="muted">Choose a username and password.</p>
    <form className="signup-form" onSubmit={submit}>
      <label className="field" htmlFor="signup-username">Username</label>
      <input className="control" id="signup-username" autoComplete="username" autoCapitalize="none" spellCheck={false} maxLength={24} value={username} onChange={event => setUsername(event.target.value)} required autoFocus />
      <label className="field" htmlFor="signup-password">Password</label>
      <input className="control" id="signup-password" type="password" autoComplete="new-password" minLength={passwordMinimum} maxLength={128} value={password} onChange={event => setPassword(event.target.value)} aria-describedby="signup-password-hint" required />
      <small className="muted" id="signup-password-hint">Choose a unique password with at least 12 characters.</small>
      <label className="field" htmlFor="signup-confirm">Confirm password</label>
      <input className="control" id="signup-confirm" type="password" autoComplete="new-password" maxLength={128} value={confirm} onChange={event => setConfirm(event.target.value)} required />
      {error && <p className="error" role="alert">{error}</p>}
      <div className="dialog-actions"><button className="button button-outline" type="button" onClick={onClose} disabled={busy}>Cancel</button><button className="button button-primary" disabled={busy}>{busy ? 'Creating account…' : 'Create account'}</button></div>
    </form>
  </Dialog>;
}
