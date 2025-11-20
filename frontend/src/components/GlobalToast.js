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
    <div style={{ position: 'fixed', bottom: 18, left: '50%', transform: 'translateX(-50%)', background: toast.type === 'error' ? '#c94b4b' : '#2b8a3e', color: '#fff', padding: '10px 14px', borderRadius: 8, boxShadow: '0 6px 18px rgba(0,0,0,0.12)', zIndex: 9999 }}>
      {toast.message}
    </div>
  );
}
