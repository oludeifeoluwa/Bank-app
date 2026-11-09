// Companion display accounts for the Overview.
//
// Northpoint persists one real checking ledger per practice profile. To make the
// Overview feel like a full bank relationship, this module derives two additional
// sample accounts (a savings account and a credit card) from the signed-in user.
// Their balances and activity are generated deterministically so they stay stable
// between renders and reloads, and they are clearly tagged "Sample" in the UI.
// Nothing here touches the backend ledger — moving real money still flows through
// Everyday Checking.

function hashString(value) {
  let hash = 2166136261;
  const text = String(value);
  for (let i = 0; i < text.length; i++) {
    hash ^= text.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function mulberry32(seed) {
  let a = seed >>> 0;
  return function () {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function seeded(seed) {
  const rng = mulberry32(seed);
  const int = (min, max) => Math.floor(rng() * (max - min + 1)) + min;
  const pick = list => list[Math.floor(rng() * list.length)];
  return { rng, int, pick };
}

const DAY_MS = 86400000;
function isoDaysAgo(days) {
  const date = new Date();
  date.setHours(12, 0, 0, 0);
  date.setTime(date.getTime() - days * DAY_MS);
  return date.toISOString();
}

function seedFor(user, salt) {
  return hashString(String(user.id ?? user.username ?? 'harborline') + ':' + salt);
}

const savingsDeposits = ['Transfer from Everyday Checking', 'Automatic savings', 'Direct deposit split', 'Round-up savings'];
const creditMerchants = ['Maple Market', 'Pine & Press Coffee', 'Harbor Books', 'Metro Transit', 'Lakeside Electric', 'Cedar Pharmacy', 'Northpoint Fuel', 'Riverside Diner'];

function savingsActivity(seed, balanceCents) {
  const rng = seeded(seed);
  const entries = [];
  // One interest credit this cycle.
  entries.push({
    id: 'HL-SAV-INT', description: 'Interest paid', type: 'Deposit',
    amount: Math.max(400, Math.round(balanceCents * 0.0375 / 12)), status: 'posted', date: isoDaysAgo(rng.int(1, 4)),
  });
  let day = rng.int(2, 6);
  for (let i = 0; i < 5; i++) {
    const inbound = rng.rng() > 0.25;
    const label = inbound ? rng.pick(savingsDeposits) : 'Transfer to Everyday Checking';
    const cents = rng.int(5000, 90000);
    entries.push({
      id: 'HL-SAV-' + String(1000 + i), description: label, type: 'Transfer',
      amount: inbound ? cents : -cents, status: 'posted', date: isoDaysAgo(day),
    });
    day += rng.int(3, 7);
  }
  return entries.sort((a, b) => new Date(b.date) - new Date(a.date));
}

function creditActivity(seed) {
  const rng = seeded(seed);
  const entries = [];
  // A posted payment at the start of the cycle.
  entries.push({
    id: 'HL-CC-PMT', description: 'Payment received — thank you', type: 'Payment',
    amount: rng.int(15000, 60000), status: 'posted', date: isoDaysAgo(rng.int(1, 3)),
  });
  let day = rng.int(1, 4);
  for (let i = 0; i < 7; i++) {
    const cents = rng.int(680, 14200);
    entries.push({
      id: 'HL-CC-' + String(1000 + i), description: rng.pick(creditMerchants), type: 'Card purchase',
      amount: -cents, status: 'posted', date: isoDaysAgo(day),
    });
    day += rng.int(1, 5);
  }
  return entries.sort((a, b) => new Date(b.date) - new Date(a.date));
}

// Returns every account to show on the Overview. `checkingBalance` is the live,
// persisted balance in cents; the rest are deterministic samples.
export function buildAccounts(user, checkingBalance, ledger = []) {
  const savingsSeed = seedFor(user, 'savings');
  const creditSeed = seedFor(user, 'credit');
  const s = seeded(savingsSeed);
  const c = seeded(creditSeed);

  const savingsBalance = s.int(1_200_000, 4_800_000);
  const creditLimit = c.pick([1_000_000, 1_500_000, 2_500_000, 3_500_000]);
  const creditOwed = c.int(Math.round(creditLimit * 0.06), Math.round(creditLimit * 0.42));

  const checking = {
    id: 'checking', name: 'Everyday Checking', type: 'Checking', icon: 'card',
    lastFour: user.lastFour, balanceCents: checkingBalance, kind: 'deposit', real: true,
    tagline: 'Available balance',
  };

  const savings = {
    id: 'savings', name: 'Northpoint Savings', type: 'Savings', icon: 'savings',
    lastFour: String(s.int(1000, 9999)), balanceCents: savingsBalance, kind: 'deposit',
    apy: '3.75%', tagline: 'Available balance', sample: true,
    activity: savingsActivity(savingsSeed ^ 0x9e37, savingsBalance),
  };

  const credit = {
    id: 'credit', name: 'Northpoint Platinum Card', type: 'Credit card', icon: 'card',
    lastFour: String(c.int(1000, 9999)), balanceCents: creditOwed, limitCents: creditLimit,
    availableCents: creditLimit - creditOwed, kind: 'credit', tagline: 'Current balance', sample: true,
    activity: creditActivity(creditSeed ^ 0x2545),
  };

  return [checking, savings, credit];
}

export function depositTotal(accounts) {
  return accounts.filter(account => account.kind === 'deposit').reduce((sum, account) => sum + account.balanceCents, 0);
}
