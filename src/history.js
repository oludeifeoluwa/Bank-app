// Fictional, repeatable history for the school-project simulator.
// Each month nets to zero so adding history never changes an account balance.
export function accountHistory(identity, account = 'checking', now = new Date()) {
  let seed = 2166136261;
  for (const char of `${identity}:${account}`) seed = Math.imul(seed ^ char.charCodeAt(0), 16777619) >>> 0;
  const integer = (min, max) => {
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
    return min + seed % (max - min + 1);
  };
  const today = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
  const entries = [];
  const spending = [
    [3, 'Maple Market', 'Card purchase', 4500, 18000],
    [6, 'Lakeside Electric', 'Bill payment', 7500, 19000],
    [10, 'Pine & Press Coffee', 'Card purchase', 500, 2200],
    [14, 'Metro Transit', 'Card purchase', 2500, 8000],
    [18, 'Elm Street Internet', 'Bill payment', 5999, 8999],
    [22, 'Harbor Books', 'Card purchase', 1800, 14000],
    [25, 'Cedar Pharmacy', 'Card purchase', 1200, 6500],
    [28, 'Riverside Diner', 'Card purchase', 2500, 11000],
  ];
  for (let offset = 36; offset >= 0; offset--) {
    const month = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - offset, 1));
    const stamp = (day, hour = 12) => new Date(Date.UTC(month.getUTCFullYear(), month.getUTCMonth(), day, hour)).toISOString();
    const prefix = `HL-HISTORY-${account.toUpperCase()}-${month.toISOString().slice(0, 7)}`;
    const rows = account === 'savings'
      ? [[10, 'Transfer to Everyday Checking', 'Transfer', 15000, 60000], [25, 'Transfer to Everyday Checking', 'Transfer', 5000, 30000]]
      : spending;
    const debits = rows.map(([day, description, type, min, max], index) => ({
      id: `${prefix}-${index + 1}`, description, type: account === 'credit' ? 'Card purchase' : type,
      amount: -integer(min, max), status: 'posted', date: stamp(day),
    })).filter(entry => Date.parse(entry.date) < today);
    if (!debits.length) continue;
    const total = -debits.reduce((sum, entry) => sum + entry.amount, 0);
    const credits = account === 'savings'
      ? [{ description: 'Automatic savings', amount: total - 400 }, { description: 'Interest paid', amount: 400 }]
      : [{ description: account === 'credit' ? 'Payment received - thank you' : 'Northpoint Payroll', amount: total }];
    entries.push(...credits.map((credit, index) => ({
      ...credit, id: `${prefix}-C${index}`, type: account === 'credit' ? 'Payment' : 'Deposit',
      status: 'posted', date: stamp(1, 8 + index),
    })), ...debits);
  }
  return entries.sort((a, b) => Date.parse(b.date) - Date.parse(a.date));
}
