import React, { useEffect, useId, useRef } from 'react';

export function Brand() {
  const grad = useId();
  return <span className="brand"><span className="brand-mark" aria-hidden="true">
    <svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id={grad} x1="5" y1="4" x2="35" y2="36" gradientUnits="userSpaceOnUse">
          <stop stopColor="#2c86e4" /><stop offset="1" stopColor="#0a4f9e" />
        </linearGradient>
      </defs>
      <rect x="2" y="2" width="36" height="36" rx="10.5" fill={`url(#${grad})`} />
      <path d="M8.5 28 L16 13.5 L20.5 21 L25.5 12 L31.5 28 Z" fill="#fff" />
      <circle cx="29" cy="11" r="2.2" fill="#aacdf4" />
    </svg>
  </span>Northpoint <span>Bank</span></span>;
}

export function Dialog({ title, eyebrow, children, onClose }) {
  const ref = useRef(null);
  useEffect(() => {
    const dialog = ref.current;
    dialog.showModal();
    return () => dialog.close();
  }, []);
  return <dialog className="dialog" ref={ref} aria-labelledby="dialog-title" onCancel={event => { event.preventDefault(); onClose(); }}>
    <header className="dialog-header"><div>{eyebrow && <p className="eyebrow">{eyebrow}</p>}<h2 id="dialog-title">{title}</h2></div><button className="icon-button close" aria-label="Close dialog" onClick={onClose}>×</button></header>
    <div className="dialog-body">{children}</div>
  </dialog>;
}
