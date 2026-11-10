
import express from 'express';
import { mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { DatabaseSync } from 'node:sqlite';
import { pbkdf2, randomBytes, randomInt, createHash, timingSafeEqual } from 'node:crypto';
import { promisify } from 'node:util';
import { addDemoItem, nextReference, settleDemoItem, signedAmount } from './src/ledger.js';
import { demoEmail, demoPassword, parseAmount, practiceOpeningBalance, purchaseMerchants, recipients, startingBalance, transactionsFor } from './src/model.js';
import { installOwnerRoutes } from './owner.mjs';
import { accountHistory } from './src/history.js';

const hashPassword = promisify(pbkdf2);
const cookieName = 'harborline_session';
const sessionLifetime = 7 * 24 * 60 * 60 * 1000;
const cookieOptions = { httpOnly: true, sameSite: 'strict', path: '/' };
const usernamePattern = /^[A-Za-z0-9][A-Za-z0-9_.-]{2,23}$/;
const reservedNames = new Set(['demo', 'harborline', 'support', 'admin']);
const idempotencyPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;
const digest = token => createHash('sha256').update(token).digest('hex');

function problem(status, message) {
  return Object.assign(new Error(message), { status });
}

function validPassword(password) {
  return typeof password === 'string' && password.length >= 12 && password.length <= 128;
}

function derivePassword(password, salt) {
  return hashPassword(password, salt, 600000, 32, 'sha256');
}

export async function createApp({
  databasePath = process.env.HARBORLINE_DB || fileURLToPath(new URL('./data/harborline.sqlite', import.meta.url)),
  staticFiles = true,
} = {}) {
  if (databasePath !== ':memory:') mkdirSync(dirname(resolve(databasePath)), { recursive: true });
  const db = new DatabaseSync(databasePath);
  db.exec(`
    PRAGMA journal_mode = WAL;
    PRAGMA busy_timeout = 5000;
    PRAGMA foreign_keys = ON;
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY,
      username TEXT NOT NULL COLLATE NOCASE UNIQUE,
      salt BLOB NOT NULL,
      password_hash BLOB NOT NULL,
      last_four TEXT NOT NULL,
      balance_cents INTEGER NOT NULL DEFAULT 0 CHECK (balance_cents BETWEEN 0 AND 9007199254740991),
      revision INTEGER NOT NULL DEFAULT 0
    ) STRICT;
    CREATE TABLE IF NOT EXISTS sessions (
      token_hash TEXT PRIMARY KEY,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      expires_at INTEGER NOT NULL
    ) STRICT;
    CREATE TABLE IF NOT EXISTS transactions (
      id INTEGER PRIMARY KEY,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      reference TEXT NOT NULL,
      details TEXT NOT NULL CHECK (json_valid(details)),
      UNIQUE(user_id, reference)
    ) STRICT;
    CREATE TABLE IF NOT EXISTS card_settings (
      user_id INTEGER PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
      locked INTEGER NOT NULL CHECK (locked IN (0, 1))
    ) STRICT;
  `);

  const findUser = db.prepare('SELECT * FROM users WHERE username = ?');
  const userById = db.prepare('SELECT * FROM users WHERE id = ?');
  const addUser = db.prepare('INSERT INTO users (username, salt, password_hash, last_four, balance_cents) VALUES (?, ?, ?, ?, ?)');
  const updatePassword = db.prepare('UPDATE users SET salt = ?, password_hash = ? WHERE id = ?');
  const addSession = db.prepare('INSERT INTO sessions (token_hash, user_id, expires_at) VALUES (?, ?, ?)');
  const getSession = db.prepare('SELECT user_id FROM sessions WHERE token_hash = ? AND expires_at > ?');
  const deleteSession = db.prepare('DELETE FROM sessions WHERE token_hash = ?');
  const expireSessions = db.prepare('DELETE FROM sessions WHERE expires_at <= ?');
  const deleteUserSessions = db.prepare('DELETE FROM sessions WHERE user_id = ?');
  const getEntries = db.prepare('SELECT details FROM transactions WHERE user_id = ? ORDER BY id DESC');
  const addEntry = db.prepare('INSERT INTO transactions (user_id, reference, details) VALUES (?, ?, ?)');
  const updateEntry = db.prepare('UPDATE transactions SET details = ? WHERE user_id = ? AND reference = ?');
  const setBalance = db.prepare('UPDATE users SET balance_cents = ?, revision = revision + 1 WHERE id = ?');
  const readCard = db.prepare('SELECT locked FROM card_settings WHERE user_id = ?');
  const saveCard = db.prepare('INSERT INTO card_settings (user_id, locked) VALUES (?, ?) ON CONFLICT(user_id) DO UPDATE SET locked = excluded.locked');

  function atomic(work, mode = 'IMMEDIATE') {
    db.exec('BEGIN ' + mode);
    try {
      const result = work();
      db.exec('COMMIT');
      return result;
    } catch (error) {
      db.exec('ROLLBACK');
      throw error;
    }
  }

  function profile(user) {
    const isDemo = user.username === 'demo';
    return { id: user.id, username: isDemo ? 'Alex' : user.username, name: isDemo ? 'Alex Morgan' : user.username, lastFour: user.last_four,
      isDemo, role: owner.isOwner(user.id) ? 'owner' : 'customer' };
  }

  function entriesFor(userId) {
    return getEntries.all(userId).map(row => JSON.parse(row.details));
  }

  function seedHistory(user) {
    if (entriesFor(user.id).some(entry => entry.reference.startsWith('HL-HISTORY-CHECKING-'))) return;
    for (const { id: reference, ...details } of accountHistory(`${user.id}:${user.username}`)) {
      const entry = { ...details, kind: 'sample', reference };
      addEntry.run(user.id, reference, JSON.stringify(entry));
    }
  }

  function recordOpeningBalance(userId) {
    const reference = 'HL-OPENING-BALANCE';
    const entry = {
      kind: 'sample', reference, description: 'Practice opening balance', type: 'Deposit',
      amount: practiceOpeningBalance, date: new Date().toISOString(), status: 'posted',
    };
    addEntry.run(userId, reference, JSON.stringify(entry));
  }

  function accountState(userId, ledger = entriesFor(userId)) {
    const user = userById.get(userId);
    return { balance: user.balance_cents, revision: user.revision, ledger,
      cardLocked: Boolean(readCard.get(userId)?.locked), transactions: transactionsFor(ledger) };
  }

  function tokenFrom(req) {
    return req.get('cookie')?.match(/(?:^|; *)harborline_session=([0-9a-f]{64})(?:;|$)/)?.[1];
  }

  function userIdFrom(req) {
    const token = tokenFrom(req);
    return token ? getSession.get(digest(token), Date.now())?.user_id : undefined;
  }

  function newSession(req, userId) {
    const oldToken = tokenFrom(req);
    if (oldToken) deleteSession.run(digest(oldToken));
    const token = randomBytes(32).toString('hex');
    const now = Date.now();
    expireSessions.run(now);
    addSession.run(digest(token), userId, now + sessionLifetime);
    return token;
  }

  function sendSession(res, session, status = 200) {
    res.cookie(cookieName, session.token, { ...cookieOptions, maxAge: sessionLifetime });
    res.status(status).json({ user: profile(session.user) });
  }

  function renewSession(req, userId) {
    deleteUserSessions.run(userId);
    return newSession(req, userId);
  }

  function requireRequestId(requestId) {
    if (typeof requestId !== 'string' || !idempotencyPattern.test(requestId)) throw problem(400, 'Start a new simulation request.');
    return requestId;
  }

  // Keep the advertised walkthrough credentials usable across database upgrades.
  const demoSalt = randomBytes(16);
  const demoHash = await derivePassword(demoPassword, demoSalt);
  atomic(() => {
    let demo = findUser.get('demo');
    if (!demo) {
      const { lastInsertRowid: id } = addUser.run('demo', demoSalt, demoHash, '4821', startingBalance);
      const date = new Date();
      const samples = [
        ['Northpoint Payroll', 'Deposit', 325000], ['Maple Market', 'Card purchase', -8682],
        ['Lakeside Electric', 'Bill payment', -12438], ['Pine & Press Coffee', 'Card purchase', -1475],
        ['Mobile check deposit', 'Deposit', 57500], ['Metro Transit', 'Card purchase', -4500],
        ['Elm Street Internet', 'Bill payment', -6999],
      ];
      for (const [index, [description, type, amount]] of samples.entries()) {
        const posted = new Date(date);
        posted.setDate(posted.getDate() - index - 1);
        const entry = { kind: 'sample', reference: 'HL-SAMPLE-' + (index + 1), description, type, amount, date: posted.toISOString(), status: 'posted' };
        addEntry.run(id, entry.reference, JSON.stringify(entry));
      }
      demo = findUser.get('demo');
    }
    updatePassword.run(demoSalt, demoHash, demo.id);
  });

  // Give existing empty profiles the practice opening balance without changing funded accounts.
  atomic(() => {
    for (const user of db.prepare('SELECT id, username, balance_cents FROM users').all()) {
      seedHistory(user);
      if (user.balance_cents === 0 && !entriesFor(user.id).some(entry => entry.reference === 'HL-OPENING-BALANCE')) {
        recordOpeningBalance(user.id);
        setBalance.run(practiceOpeningBalance, user.id);
      }
    }
  });

  const app = express();
  app.disable('x-powered-by');
  app.set('trust proxy', 1);
  // Restrict which Host headers are served. Localhost for local dev, plus the
  // deployment host (Render sets RENDER_EXTERNAL_HOSTNAME) and any custom domain
  // supplied via ALLOWED_HOST. This keeps the DNS-rebind guard while allowing the
  // app to be hosted.
  const allowedHosts = new Set(['127.0.0.1', 'localhost']);
  for (const name of ['RENDER_EXTERNAL_HOSTNAME', 'ALLOWED_HOST']) {
    if (process.env[name]) allowedHosts.add(process.env[name].toLowerCase());
  }
  app.use((req, res, next) => {
    const host = (req.get('host') || '').toLowerCase().replace(/:\d+$/, '');
    if (!allowedHosts.has(host) && !host.endsWith('.onrender.com')) return res.sendStatus(403);
    res.set('X-Content-Type-Options', 'nosniff');
    next();
  });
  app.use('/api', (req, res, next) => {
    res.set('Cache-Control', 'no-store');
    if (req.method === 'POST') {
      const host = req.get('host');
      const origin = req.get('origin');
      const originHost = origin ? origin.replace(/^https?:\/\//, '').replace(/\/.*$/, '') : '';
      if ((origin && originHost !== host) || req.get('sec-fetch-site') === 'cross-site') {
        return next(problem(403, 'Open Northpoint directly to use your demo account.'));
      }
      if (!req.is('application/json')) return next(problem(415, 'Send a JSON request.'));
    }
    next();
  }, express.json({ limit: '8kb' }));

  app.get('/api/session', (req, res) => {
    const id = userIdFrom(req);
    const user = id === undefined ? null : userById.get(id);
    res.json({ user: user ? profile(user) : null });
  });

  async function prepareProfile(username, password) {
    const name = typeof username === 'string' ? username.trim() : '';
    if (!usernamePattern.test(name)) throw problem(400, 'Use 3–24 letters, numbers, periods, underscores, or hyphens. Start with a letter or number.');
    if (reservedNames.has(name.toLowerCase())) throw problem(400, 'That username is reserved. Choose another.');
    if (!validPassword(password)) throw problem(400, 'Choose a demo password between 12 and 128 characters.');
    if (findUser.get(name)) throw problem(409, 'That username is already taken. Choose another.');
    const salt = randomBytes(16);
    const hash = await derivePassword(password, salt);
    return { name, salt, hash };
  }

  function insertProfile({ name, salt, hash }) {
    if (findUser.get(name)) throw problem(409, 'That username is already taken. Choose another.');
    const { lastInsertRowid: id } = addUser.run(name, salt, hash, String(randomInt(10000)).padStart(4, '0'), practiceOpeningBalance);
    seedHistory({ id, username: name });
    recordOpeningBalance(id);
    return userById.get(id);
  }

  app.post('/api/signup', async (req, res) => {
    const { username, password } = req.body ?? {};
    const prepared = await prepareProfile(username, password);
    const session = atomic(() => {
      const user = insertProfile(prepared);
      return { user, token: newSession(req, user.id) };
    });
    sendSession(res, session, 201);
  });

  const fallbackSalt = randomBytes(16);
  const fallbackHash = randomBytes(32);
  app.post('/api/signin', async (req, res) => {
    const { username, password } = req.body ?? {};
    const name = typeof username === 'string' ? username.trim() : '';
    const login = name.toLowerCase() === demoEmail ? 'demo' : name;
    if (!usernamePattern.test(login) || !validPassword(password)) throw problem(401, 'That username or password did not match.');
    const user = findUser.get(login);
    const actual = await derivePassword(password, user?.salt ?? fallbackSalt);
    if (!timingSafeEqual(actual, user?.password_hash ?? fallbackHash) || !user) throw problem(401, 'That username or password did not match.');
    const token = atomic(() => newSession(req, user.id));
    sendSession(res, { user, token });
  });

  app.post('/api/signout', (req, res) => {
    const token = tokenFrom(req);
    if (token) deleteSession.run(digest(token));
    res.clearCookie(cookieName, cookieOptions).sendStatus(204);
  });

  function requireProfile(req, res, next) {
    const id = userIdFrom(req);
    const expectedProfile = req.get('x-harborline-profile');
    if (id === undefined || (expectedProfile && expectedProfile !== String(id))) {
      return next(problem(401, 'Sign in again to open your account.'));
    }
    req.accountId = id;
    next();
  }

  app.use('/api/account', requireProfile);

  app.get('/api/account', (req, res) => {
    res.json(atomic(() => accountState(req.accountId), 'DEFERRED'));
  });

  function changeAccount(req, res, update) {
    const id = req.accountId;
    const result = atomic(() => {
      const ledger = entriesFor(id);
      const balance = userById.get(id).balance_cents;
      const change = update(ledger, balance, req.body ?? {});
      if (change.existing) return { entry: change.entry, account: accountState(id, ledger) };
      writeLedger(id, balance, change);
      return { entry: change.entry, account: accountState(id) };
    });
    res.json(result);
  }

  function writeLedger(id, balance, { entry, delta = 0, replace = false }) {
    const nextBalance = balance + delta;
    if (!Number.isSafeInteger(nextBalance) || nextBalance < 0) throw problem(400, 'This amount is outside the available balance limits.');
    if (replace) updateEntry.run(JSON.stringify(entry), id, entry.reference);
    else addEntry.run(id, entry.reference, JSON.stringify(entry));
    setBalance.run(nextBalance, id);
    return nextBalance;
  }

  app.post('/api/account/funds', (req, res) => changeAccount(req, res, (ledger, balance, { amount, requestId }) => {
    const cents = parseAmount(amount);
    if (!cents) throw problem(400, 'Enter an amount from $0.01 to $999,999.99 with up to two decimal places.');
    const reference = 'HL-FUND-' + requireRequestId(requestId);
    const prior = ledger.find(entry => entry.reference === reference);
    if (prior) {
      if (prior.cents !== cents) throw problem(409, 'This request already used a different amount.');
      return { entry: prior, existing: true };
    }
    return { entry: { kind: 'funds', cents, date: new Date().toISOString(), status: 'posted', reference }, delta: cents };
  }));

  app.post('/api/account/transfers', (req, res) => changeAccount(req, res, (ledger, balance, { recipient, amount, requestId }) => {
    const cents = parseAmount(amount);
    if (typeof recipient !== 'string' || !Object.hasOwn(recipients, recipient)) throw problem(400, 'Choose a demo recipient.');
    const reference = requestId === undefined ? nextReference(ledger, 'transfer') : 'HL-XFER-' + requireRequestId(requestId);
    const prior = ledger.find(entry => entry.reference === reference);
    if (prior) {
      if (prior.cents !== cents || prior.recipient !== recipient) throw problem(409, 'This transfer request already used different details.');
      return { entry: prior, existing: true };
    }
    if (!cents || cents > balance) throw problem(400, 'Enter an amount within your available balance.');
    return {
      entry: { kind: 'transfer', recipient, cents, reference, date: new Date().toISOString(), status: 'posted' },
      delta: -cents,
    };
  }));

  app.post('/api/account/items', (req, res) => changeAccount(req, res, (ledger, balance, { kind, check, biller, amount, scheduledFor }) => {
    const entry = addDemoItem(ledger, kind, { check, biller, cents: parseAmount(amount), scheduledFor });
    if (!entry) throw problem(400, kind === 'deposit' ? 'Choose an available sample check.' : 'Choose a fictional biller, a valid amount, and a payment date.');
    return { entry };
  }));

  app.post('/api/account/items/:reference', (req, res) => changeAccount(req, res, (ledger, balance, { action }) => {
    if (action !== 'post' && action !== 'cancel') throw problem(400, 'Choose an available payment action.');
    const entry = settleDemoItem(ledger, req.params.reference, action, balance);
    if (!entry) throw problem(409, 'This item could not be processed. Check its status and your available balance.');
    return { entry, replace: true, delta: action === 'post' ? signedAmount(entry) : 0 };
  }));

  app.post('/api/account/card', (req, res) => {
    const { locked } = req.body ?? {};
    if (typeof locked !== 'boolean') throw problem(400, 'Choose whether to lock or unlock the practice card.');
    res.json(atomic(() => {
      saveCard.run(req.accountId, Number(locked));
      setBalance.run(userById.get(req.accountId).balance_cents, req.accountId);
      return { account: accountState(req.accountId) };
    }));
  });

  app.post('/api/account/card/purchases', (req, res) => changeAccount(req, res, (ledger, balance, { merchant, amount, requestId }) => {
    const cents = parseAmount(amount);
    if (typeof merchant !== 'string' || !Object.hasOwn(purchaseMerchants, merchant) || !cents) throw problem(400, 'Choose a practice merchant and enter a positive amount.');
    const reference = 'HL-CARD-' + requireRequestId(requestId);
    const prior = ledger.find(entry => entry.reference === reference);
    if (prior) {
      if (prior.cents !== cents || prior.merchant !== merchant) throw problem(409, 'This purchase request already used different details.');
      return { entry: prior, existing: true };
    }
    if (readCard.get(req.accountId)?.locked) throw problem(409, 'Unlock your practice card before trying a purchase.');
    if (cents > balance) throw problem(400, 'This purchase exceeds your available balance.');
    return { entry: { kind: 'purchase', merchant, cents, date: new Date().toISOString(), status: 'posted', reference }, delta: -cents };
  }));

  const owner = installOwnerRoutes(app, {
    db, atomic, problem, requireProfile, userById, profile, accountState, entriesFor, writeLedger,
    prepareProfile, insertProfile, sendSession, renewSession, requireRequestId,
  });
  app.locals.issueOwnerCode = owner.issueCode;

  app.use('/api', (req, res) => res.status(404).json({ error: 'That API route does not exist.' }));
  if (staticFiles) {
    const dist = fileURLToPath(new URL('./dist/', import.meta.url));
    app.use(express.static(dist, {
      index: false,
      setHeaders(res) { res.set('Cache-Control', 'public, max-age=3600'); },
    }));
    app.get(/^\/(?:[a-z0-9-]+\/?)*$/, (req, res) => {
      res.set('Cache-Control', 'no-store').sendFile('index.html', { root: dist });
    });
  }

  app.use((error, req, res, next) => {
    if (res.headersSent) return next(error);
    const status = error.status ?? 500;
    if (status >= 500) console.error(error);
    const message = status >= 500 ? 'Northpoint could not complete the request. Try again.'
      : error.type === 'entity.parse.failed' ? 'Send valid JSON.'
        : error.type === 'entity.too.large' ? 'The request is too large.' : error.message;
    res.status(status).json({ error: message });
  });
  return app;
}
