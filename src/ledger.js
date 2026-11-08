export const billers = Object.freeze({
  electric: 'Lakeside Electric',
  internet: 'Elm Street Internet',
  water: 'Harbor Water',
});

export const sampleChecks = Object.freeze({
  stipend: { label: 'Campus stipend', cents: 12500 },
  refund: { label: 'Harbor Books refund', cents: 4850 },
  project: { label: 'Northpoint project payment', cents: 30000 },
});

export const accountTools = Object.freeze({
  deposits: { title: 'Check deposits', description: 'Submit and clear a sample check.', icon: 'down', guide: 'deposit-guide' },
  'bill-pay': { title: 'Bill pay', description: 'Schedule a payment and track its status.', icon: 'send', guide: 'bill-pay-guide' },
  statements: { title: 'Statements', description: 'Review a month of posted activity.', icon: 'list', guide: 'statements-guide' },
  details: { title: 'Account details', description: 'View your masked account details.', icon: 'card', guide: 'details-guide' },
  alerts: { title: 'Alerts', description: 'Choose which activity appears in your alerts.', icon: 'shield', guide: 'alerts-guide' },
  cards: { title: 'Card controls', description: 'Manage your debit card and test a purchase.', icon: 'lock', guide: 'card-controls' },
  activity: { title: 'Account activity', description: 'Search and filter your transactions.', icon: 'list', guide: 'activity-help' },
});

const prefixes = { transfer: 'HL-DEMO-', deposit: 'HL-DEP-', bill: 'HL-BILL-' };
export const kindOf = entry => entry.kind || 'transfer';
export const statusOf = entry => entry.status || 'posted';
export function signedAmount(entry) {
  const kind = kindOf(entry);
  if (kind === 'adjustment') return entry.amount;
  return ['deposit', 'funds', 'payout'].includes(kind) ? entry.cents : -entry.cents;
}
export const postedDate = entry => entry.postedAt || entry.date;

export function localDate(value = Date.now()) {
  const date = new Date(value);
  return [date.getFullYear(), date.getMonth() + 1, date.getDate()]
    .map((part, index) => String(part).padStart(index === 0 ? 4 : 2, '0')).join('-');
}

export function isCalendarDate(value) {
  return typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value)
    && Number.isFinite(Date.parse(value)) && new Date(value).toISOString().slice(0, 10) === value;
}

export function nextReference(ledger, kind) {
  const prefix = prefixes[kind];
  const last = ledger.reduce((max, item) => {
    if (!item.reference.startsWith(prefix)) return max;
    const serial = Number(item.reference.slice(prefix.length));
    return Number.isSafeInteger(serial) && serial >= 0 ? Math.max(max, serial) : max;
  }, 0);
  return prefix + String(last + 1).padStart(4, '0');
}

export function addDemoItem(ledger, kind, details, date = new Date()) {
  if (kind !== 'bill' && kind !== 'deposit') return null;
  const time = date.toISOString();
  const reference = nextReference(ledger, kind);
  if (kind === 'deposit') {
    if (typeof details.check !== 'string' || !Object.hasOwn(sampleChecks, details.check) || ledger.some(entry => entry.check === details.check)) return null;
    const check = sampleChecks[details.check];
    return { kind, check: details.check, cents: check.cents, status: 'pending', reference, date: time };
  }
  const { biller, cents, scheduledFor } = details;
  if (typeof biller !== 'string' || !Object.hasOwn(billers, biller) || !Number.isSafeInteger(cents) || cents <= 0
    || !isCalendarDate(scheduledFor) || scheduledFor < localDate(date)) return null;
  return { kind, biller, cents, scheduledFor, status: 'scheduled', reference, date: time };
}

export function settleDemoItem(ledger, reference, action, balance, now = new Date()) {
  const entry = ledger.find(item => item.reference === reference);
  if (!entry) return null;
  if (action === 'cancel' && entry.kind === 'bill' && entry.status === 'scheduled') return { ...entry, status: 'canceled' };
  if (action === 'decline' && entry.kind === 'deposit' && entry.status === 'pending') return { ...entry, status: 'declined' };
  if (action !== 'post') return null;
  const isDeposit = entry.kind === 'deposit' && entry.status === 'pending';
  const isBill = entry.kind === 'bill' && entry.status === 'scheduled' && entry.cents <= balance;
  return isDeposit || isBill ? { ...entry, status: 'posted', postedAt: now.toISOString() } : null;
}

export function statementFor(transactions, month, balance) {
  const posted = transactions.filter(entry => entry.status === 'posted');
  const inMonth = posted.filter(entry => localDate(entry.date).slice(0, 7) === month);
  const afterStart = posted.filter(entry => localDate(entry.date).slice(0, 7) >= month);
  const opening = balance - afterStart.reduce((sum, entry) => sum + entry.amount, 0);
  const credits = inMonth.reduce((sum, entry) => sum + Math.max(entry.amount, 0), 0);
  const debits = inMonth.reduce((sum, entry) => sum + Math.max(-entry.amount, 0), 0);
  return { entries: inMonth, opening, credits, debits, closing: opening + credits - debits };
}
