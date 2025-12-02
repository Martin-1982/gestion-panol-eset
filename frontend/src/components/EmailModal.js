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
    <div className="app-modal-overlay">
      <form onSubmit={submit} className="modal-content" style={{ maxWidth: 520 }}>
        <h3>Enviar informe por correo</h3>

        <label htmlFor="email-to">Destinatario</label>
        <input
          id="email-to"
          required
          value={to}
          onChange={e => setTo(e.target.value)}
          placeholder="destinatario@ejemplo.com"
        />

        <label htmlFor="email-subject">Asunto</label>
        <input
          id="email-subject"
          required
          value={subject}
          onChange={e => setSubject(e.target.value)}
        />

        <label htmlFor="email-body">Cuerpo del mensaje</label>
        <textarea
          id="email-body"
          value={body}
          onChange={e => setBody(e.target.value)}
          style={{ minHeight: 100 }}
        />

        <label htmlFor="email-format">Formato del adjunto</label>
        <select
          id="email-format"
          value={format}
          onChange={e => setFormat(e.target.value)}
        >
          <option value="pdf">PDF</option>
          <option value="xlsx">Excel (.xlsx)</option>
        </select>

        <div className="form-actions">
          <button type="button" className="btn-outline" onClick={onClose} disabled={loading}>Cancelar</button>
          <button type="submit" className="btn-primary" disabled={loading}>{loading ? 'Enviando...' : '📧 Enviar'}</button>
        </div>
      </form>
    </div>
  );
}
