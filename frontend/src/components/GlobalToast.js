import React, { useEffect, useState } from 'react';

export default function GlobalToast() {
  const [toast, setToast] = useState({ visible: false, message: '', type: 'success' });
  useEffect(() => {
    let timer = null;
    const handler = (e) => {
      const { message, type } = e.detail || {};
      setToast({ visible: true, message: message || '', type: type || 'success' });
      if (timer) clearTimeout(timer);
      timer = setTimeout(() => setToast({ visible: false, message: '', type: 'success' }), 2200);
    };
    window.addEventListener('app-notify', handler);
    return () => { window.removeEventListener('app-notify', handler); if (timer) clearTimeout(timer); };
  }, []);

  if (!toast.visible) return null;

  return (
    <div
      className="toast"
      role="alert"
      aria-live="assertive"
      style={{
        background: toast.type === 'error' ? 'var(--error)' : 'var(--success)',
        color: 'var(--white)',
        boxShadow: 'var(--shadow-md)',
        left: '50%',
        transform: 'translateX(-50%)',
        minWidth: 220,
        fontWeight: 500,
        fontSize: '1.05rem',
        zIndex: 2000
      }}
    >
      {toast.message}
    </div>
  );
}
