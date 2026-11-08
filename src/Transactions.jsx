import React from 'react';
import { Icon } from './Art.jsx';
import { dateLabel, money } from './model.js';

export function Transactions({ entries, label, empty = 'No transactions match your filters.' }) {
  return <div className="table-scroll"><table className="transaction-table" aria-label={label}>
    <thead><tr><th scope="col">Description</th><th scope="col">Date</th><th scope="col" className="transaction-type">Type</th><th scope="col">Amount</th></tr></thead>
    <tbody>{entries.length ? entries.map(({ id, description, date, type, amount, status }) =>
      <tr key={id}>
        <td><span className="transaction"><span className={'transaction-icon ' + (amount > 0 ? 'credit' : '')}><Icon name={amount > 0 ? 'down' : type === 'Card purchase' ? 'card' : 'send'} /></span><span><strong>{type === 'Batch payout' ? type : description}</strong>{status !== 'posted' && <small className={'status-pill status-' + status}>{status}</small>}</span></span></td>
        <td>{dateLabel(date)}</td><td className="transaction-type">{type}</td>
        <td className={amount > 0 ? 'credit' : ''}>{(amount > 0 ? '+' : '−') + money(Math.abs(amount))}</td>
      </tr>
    ) : <tr><td colSpan="4" className="empty">{empty}</td></tr>}</tbody>
  </table></div>;
}

export function downloadCsv(name, headers, rows) {
  const cell = value => {
    const text = String(value ?? '');
    const safe = /^[\s]*[=+@\-]/.test(text) && !/^-?\d+(\.\d+)?$/.test(text) ? "'" + text : text;
    return '"' + safe.replaceAll('"', '""') + '"';
  };
  const csv = [[...headers, 'Record type'], ...rows.map(row => [...row, 'Practice record'])]
    .map(row => row.map(cell).join(',')).join('\r\n');
  const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
  const link = document.createElement('a');
  link.href = url;
  link.download = name;
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
