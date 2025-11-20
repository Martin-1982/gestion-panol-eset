import React, { useState } from 'react';

export default function EmailModal({ open, onClose, onSubmit, initialTo = '', initialSubject = '', initialBody = '', defaultFormat = 'pdf' }) {
  const [to, setTo] = useState(initialTo);
  const [subject, setSubject] = useState(initialSubject);
  const [body, setBody] = useState(initialBody);
  const [format, setFormat] = useState(defaultFormat);
  const [loading, setLoading] = useState(false);

  // Reset internal state when modal opens or initial props change
  React.useEffect(() => {
    if (open) {
      setTo(initialTo || '');
      setSubject(initialSubject || '');
      setBody(initialBody || '');
      setFormat(defaultFormat || 'pdf');
    }
  }, [open, initialTo, initialSubject, initialBody, defaultFormat]);

  if (!open) return null;

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await onSubmit({ to, subject, body, format });
      setLoading(false);
    } catch (err) {
      setLoading(false);
      throw err;
    }
  };

  return (
    <div style={{ position: 'fixed', left: 0, top: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.45)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1200 }}>
      <form onSubmit={submit} style={{ background: 'white', padding: 20, borderRadius: 8, width: 520, maxWidth: '95%' }}>
        <h3>Enviar informe por correo</h3>

        <label style={{ display: 'block', marginTop: 8 }}>Destinatario</label>
        <input required value={to} onChange={e => setTo(e.target.value)} style={{ width: '100%', padding: 8 }} placeholder="destinatario@ejemplo.com" />

        <label style={{ display: 'block', marginTop: 8 }}>Asunto</label>
        <input required value={subject} onChange={e => setSubject(e.target.value)} style={{ width: '100%', padding: 8 }} />

        <label style={{ display: 'block', marginTop: 8 }}>Cuerpo</label>
        <textarea value={body} onChange={e => setBody(e.target.value)} style={{ width: '100%', padding: 8, minHeight: 100 }} />

        <label style={{ display: 'block', marginTop: 8 }}>Adjunto</label>
        <select value={format} onChange={e => setFormat(e.target.value)} style={{ padding: 8 }}>
          <option value="pdf">PDF</option>
          <option value="xlsx">Excel (.xlsx)</option>
        </select>

        <div style={{ marginTop: 14, display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
          <button type="button" onClick={onClose} disabled={loading} style={{ padding: '8px 12px' }}>Cancelar</button>
          <button type="submit" disabled={loading} style={{ padding: '8px 12px' }}>{loading ? 'Enviando...' : 'Enviar'}</button>
        </div>
      </form>
    </div>
  );
}
