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
      role="alert"
      aria-live="assertive"
      style={{
        position: 'fixed',
        bottom: '24px',
        left: '50%',
        transform: 'translateX(-50%)',
        padding: '12px 24px',
        borderRadius: '10px',
        background: toast.type === 'error' ? '#dc2626' : '#059669',
        color: '#ffffff',
        fontSize: '1rem',
        fontWeight: 600,
        minWidth: '220px',
        textAlign: 'center',
        zIndex: 99999,
        boxShadow: '0 4px 16px rgba(0,0,0,0.25)',
        fontFamily: 'Inter, sans-serif',
      }}
    >
      {toast.message}
    </div>
  );
}
