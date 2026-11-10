import { billers, kindOf, postedDate, sampleChecks, signedAmount, statusOf } from './ledger.js';

export const demoEmail = 'student@northpoint.example';
export const demoPassword = 'Northpoint2026!';
export const startingBalance = 51278900;
export const practiceOpeningBalance = 25600000;
export const storageKeys = { remember: 'harborline.rememberDemoEmail' };
export const recipients = Object.freeze({
  oak: 'Oak Street Savings',
  jordan: 'Jordan Lee',
  morgan: 'Morgan Ellis',
});

const usd = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' });
const dates = new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
export const money = cents => usd.format(cents / 100);
export const dateLabel = value => dates.format(new Date(value));

export function totalMoney(integerCents) {
  const cents = BigInt(integerCents);
  return usd.format(cents / 100n).slice(0, -2) + (cents % 100n).toString().padStart(2, '0');
}

export function readSession(key) {
  try { return sessionStorage.getItem(key); }
  catch { return null; }
}

export function writeSession(key, value) {
  try {
    if (value === null) sessionStorage.removeItem(key);
    else sessionStorage.setItem(key, value);
  } catch {
    // Remembering a demo email and alert preferences is optional.
  }
}

export function accountSessionKey(key, id) {
  return key + ':' + id;
}

export function parseAmount(value) {
  return centsFrom(value, /^([0-9]{1,6})(?:\.([0-9]{1,2}))?$/) ?? 0;
}

export function parseAdminAmount(value) {
  return centsFrom(value, /^([0-9]{1,9})(?:\.([0-9]{1,2}))?$/);
}

function centsFrom(value, pattern) {
  const match = typeof value === 'string' ? pattern.exec(value.trim()) : null;
  if (!match) return null;
  return Number(match[1]) * 100 + Number((match[2] || '').padEnd(2, '0'));
}

export const payoutLimit = 25;
export const adjustmentModes = Object.freeze({ set: 'Set balance', credit: 'Add funds', debit: 'Remove funds' });
export const purchaseMerchants = Object.freeze({ market: 'Maple Market', books: 'Harbor Books', transit: 'Metro Transit' });
export const transactionTypes = ['Deposit', 'Card purchase', 'Bill payment', 'Transfer', 'Balance adjustment', 'Batch payout'];

export function transactionsFor(ledger) {
  return ledger.map(entry => {
    const kind = kindOf(entry);
    const status = statusOf(entry);
    const types = {
      deposit: ['Deposit', sampleChecks[entry.check]?.label],
      bill: ['Bill payment', billers[entry.biller]],
      transfer: ['Transfer', 'Transfer to ' + recipients[entry.recipient]],
      funds: ['Deposit', 'Test funds added'],
      adjustment: ['Balance adjustment', 'Owner balance adjustment'],
      payout: ['Batch payout', 'Practice batch payout'],
      purchase: ['Card purchase', purchaseMerchants[entry.merchant]],
      sample: [entry.type, entry.description],
    };
    const [type, description] = types[kind];
    return {
      description, amount: kind === 'sample' ? entry.amount : signedAmount(entry), status, id: entry.reference,
      date: status === 'posted' ? postedDate(entry) : entry.date, type,
    };
  }).sort((a, b) => new Date(b.date) - new Date(a.date));
}
