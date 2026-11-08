import React, { useEffect, useRef } from 'react';
import { Icon } from './Art.jsx';

export function Brand() {
  return <span className="brand"><span className="brand-mark"><Icon name="logo" /></span>Harborline <span>Bank</span></span>;
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
