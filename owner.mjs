import { createHash, randomBytes, timingSafeEqual } from 'node:crypto';
import { billers, sampleChecks, settleDemoItem, signedAmount } from './src/ledger.js';
import { adjustmentModes, parseAdminAmount, payoutLimit } from './src/model.js';

const codeDigest = code => createHash('sha256').update(code).digest();
const codeLifetime = 20 * 60 * 1000;

export function installOwnerRoutes(app, {
  db, atomic, problem, requireProfile, userById, profile, accountState, entriesFor, writeLedger,
  prepareProfile, insertProfile, sendSession, renewSession, requireRequestId,
}) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS owner_access (
      singleton INTEGER PRIMARY KEY CHECK (singleton = 1),
      user_id INTEGER REFERENCES users(id),
      code_hash BLOB,
      expires_at INTEGER
    ) STRICT;
    INSERT OR IGNORE INTO owner_access (singleton) VALUES (1);
    CREATE TABLE IF NOT EXISTS admin_events (
      id INTEGER PRIMARY KEY,
      actor_id INTEGER NOT NULL REFERENCES users(id),
      action TEXT NOT NULL,
      date TEXT NOT NULL,
      request_id TEXT UNIQUE,
      request_body TEXT,
      result TEXT NOT NULL CHECK (json_valid(result))
    ) STRICT;
  `);

  const access = db.prepare('SELECT user_id, code_hash, expires_at FROM owner_access WHERE singleton = 1');
  const saveCode = db.prepare('UPDATE owner_access SET code_hash = ?, expires_at = ? WHERE singleton = 1');
  const assign = db.prepare('UPDATE owner_access SET user_id = ?, code_hash = NULL, expires_at = NULL WHERE singleton = 1');
  const users = db.prepare('SELECT id, username, last_four, balance_cents, revision FROM users ORDER BY username COLLATE NOCASE');
  const pending = db.prepare(`
    SELECT u.id, u.username, u.last_four, t.details FROM transactions t
    JOIN users u ON u.id = t.user_id
    WHERE (json_extract(t.details, '$.kind') = 'deposit' AND json_extract(t.details, '$.status') = 'pending')
       OR (json_extract(t.details, '$.kind') = 'bill' AND json_extract(t.details, '$.status') = 'scheduled')
    ORDER BY t.id DESC
  `);
  const log = db.prepare('INSERT INTO admin_events (actor_id, action, date, request_id, request_body, result) VALUES (?, ?, ?, ?, ?, ?)');
  const previous = db.prepare('SELECT action, request_body, result FROM admin_events WHERE request_id = ? AND actor_id = ?');
  const events = db.prepare(`
    SELECT e.id, e.action, e.date, e.result, u.username AS actor FROM admin_events e
    JOIN users u ON u.id = e.actor_id ORDER BY e.id DESC LIMIT 100
  `);

  function isOwner(id) {
    return access.get().user_id === id;
  }

  function issueCode() {
    return atomic(() => {
      if (access.get().user_id !== null) throw problem(409, 'Owner access is already assigned. Sign in with the existing owner profile.');
      const code = randomBytes(16).toString('base64url');
      saveCode.run(codeDigest(code), Date.now() + codeLifetime);
      return code;
    });
  }

  function summary(user) {
    return { ...profile(user), balance: user.balance_cents, revision: user.revision };
  }

  function targetAccount(raw) {
    const id = Number(raw);
    const user = Number.isSafeInteger(id) && id > 0 ? userById.get(id) : null;
    if (!user) throw problem(404, 'That practice account could not be found.');
    return user;
  }

  function memoFrom(value) {
    const memo = typeof value === 'string' ? value.trim() : '';
    if (memo.length < 3 || memo.length > 160) throw problem(400, 'Enter a reason between 3 and 160 characters.');
    return memo;
  }

  function postOperation(req, action, details, apply) {
    const requestId = requireRequestId(req.body?.requestId);
    const fingerprint = JSON.stringify(details);
    return atomic(() => {
      const earlier = previous.get(requestId, req.accountId);
      if (earlier) {
        if (earlier.action !== action || earlier.request_body !== fingerprint) throw problem(409, 'This request already used different details. Start a new operation.');
        return JSON.parse(earlier.result);
      }
      const date = new Date().toISOString();
      const result = { date, ...apply(date, requestId) };
      log.run(req.accountId, action, date, requestId, fingerprint, JSON.stringify(result));
      return result;
    });
  }

  app.use('/api/admin', requireProfile);

  app.get('/api/admin/setup', (req, res) => {
    const user = userById.get(req.accountId);
    res.json({ available: access.get().user_id === null && user.username !== 'demo' });
  });

  app.post('/api/admin/setup', (req, res) => {
    const { code } = req.body ?? {};
    const user = userById.get(req.accountId);
    if (user.username === 'demo') throw problem(403, 'Create your own practice profile to set up owner access.');
    const session = atomic(() => {
      const current = access.get();
      if (current.user_id !== null) throw problem(409, 'Owner access is already assigned.');
      if (typeof code !== 'string' || !/^[A-Za-z0-9_-]{22}$/.test(code) || !current.code_hash
        || current.expires_at <= Date.now() || !timingSafeEqual(codeDigest(code), current.code_hash)) {
        throw problem(403, 'That setup code is invalid or expired. Open the setup launcher to generate a new one.');
      }
      assign.run(user.id);
      const date = new Date().toISOString();
      log.run(user.id, 'owner-setup', date, null, null, JSON.stringify({ username: user.username }));
      return { user, token: renewSession(req, user.id) };
    });
    sendSession(res, session);
  });

  app.use('/api/admin', (req, res, next) => {
    if (!isOwner(req.accountId)) return next(problem(403, 'Only the owner can open this workspace.'));
    next();
  });

  app.get('/api/admin/workspace', (req, res) => res.json(atomic(() => {
    const accounts = users.all().map(summary);
    const queue = pending.all().map(row => {
      const item = JSON.parse(row.details);
      const label = item.kind === 'deposit' ? sampleChecks[item.check].label : billers[item.biller];
      return { ...item, label, account: profile(row) };
    });
    const audit = events.all().map(({ result, ...event }) => ({ ...event, ...JSON.parse(result) }));
    const totalBalance = accounts.reduce((sum, account) => sum + BigInt(account.balance), 0n).toString();
    return { accounts, queue, audit, totalBalance };
  }, 'DEFERRED')));

  app.get('/api/admin/accounts/:id', (req, res) => res.json(atomic(() => {
    const user = targetAccount(req.params.id);
    const { transactions, ...account } = accountState(user.id);
    return { ...summary(user), cardLocked: account.cardLocked, transactions };
  }, 'DEFERRED')));

  app.post('/api/admin/accounts', async (req, res) => {
    const { username, password } = req.body ?? {};
    const prepared = await prepareProfile(username, password);
    const customer = atomic(() => {
      const user = insertProfile(prepared);
      const date = new Date().toISOString();
      log.run(req.accountId, 'account-created', date, null, null, JSON.stringify({ username: user.username }));
      return summary(user);
    });
    res.status(201).json(customer);
  });

  app.post('/api/admin/accounts/:id/adjustments', (req, res) => {
    const { mode, amount, revision, memo: reason } = req.body ?? {};
    const cents = parseAdminAmount(amount);
    if (typeof mode !== 'string' || !Object.hasOwn(adjustmentModes, mode) || cents === null || (mode !== 'set' && cents === 0)) {
      throw problem(400, 'Choose an adjustment and enter a valid simulated amount.');
    }
    if (!Number.isSafeInteger(revision) || revision < 0) throw problem(400, 'Refresh the account before making an adjustment.');
    const memo = memoFrom(reason);
    const id = targetAccount(req.params.id).id;
    const result = postOperation(req, 'balance-adjustment', { id, mode, cents, revision, memo }, (date, requestId) => {
      const user = userById.get(id);
      if (user.revision !== revision) throw problem(409, 'This account changed. Refresh the account and review its new balance.');
      const before = user.balance_cents;
      const delta = mode === 'set' ? cents - before : mode === 'debit' ? -cents : cents;
      if (!delta) throw problem(400, 'Enter an amount that changes the balance.');
      const reference = 'HL-ADJ-' + requestId;
      const entry = { kind: 'adjustment', amount: delta, date, status: 'posted', reference };
      const after = writeLedger(id, before, { entry, delta });
      return { username: profile(user).username, accountId: id, before, after, delta, mode, memo, reference };
    });
    res.json(result);
  });

  app.post('/api/admin/payouts', (req, res) => {
    const { rows, memo: reason } = req.body ?? {};
    if (!Array.isArray(rows) || !rows.length || rows.length > payoutLimit) throw problem(400, 'Choose between 1 and ' + payoutLimit + ' practice accounts.');
    const items = rows.map(row => ({ id: row?.id, cents: parseAdminAmount(row?.amount) }));
    if (items.some(item => !Number.isSafeInteger(item.id) || item.id <= 0 || !item.cents) || new Set(items.map(item => item.id)).size !== items.length) {
      throw problem(400, 'Choose unique practice accounts and enter a positive amount for each.');
    }
    items.sort((a, b) => a.id - b.id);
    const memo = memoFrom(reason);
    const result = postOperation(req, 'batch-payout', { items, memo }, (date, requestId) => {
      const reference = 'HL-BATCH-' + requestId;
      const recipients = items.map(({ id, cents }) => {
        const user = targetAccount(id);
        const entry = { kind: 'payout', cents, date, status: 'posted', reference };
        const balance = writeLedger(id, user.balance_cents, { entry, delta: cents });
        return { id, username: profile(user).username, cents, balance };
      });
      return { recipients, total: recipients.reduce((sum, recipient) => sum + recipient.cents, 0), memo, reference };
    });
    res.json(result);
  });

  app.post('/api/admin/payments', (req, res) => {
    const { accountId, reference, action } = req.body ?? {};
    if (!Number.isSafeInteger(accountId) || typeof reference !== 'string' || !['post', 'cancel', 'decline'].includes(action)) {
      throw problem(400, 'Choose an open payment item and an available action.');
    }
    const result = postOperation(req, 'payment-review', { accountId, reference, action }, () => {
      const user = targetAccount(accountId);
      const balance = user.balance_cents;
      const entry = settleDemoItem(entriesFor(user.id), reference, action, balance);
      if (!entry) throw problem(409, 'This item could not be processed. Check its status and the available balance.');
      const delta = action === 'post' ? signedAmount(entry) : 0;
      writeLedger(user.id, balance, { entry, replace: true, delta });
      return { username: profile(user).username, accountId, reference, status: entry.status, delta, kind: entry.kind };
    });
    res.json(result);
  });

  return { isOwner, issueCode };
}
