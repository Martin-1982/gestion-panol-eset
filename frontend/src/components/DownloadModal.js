import React, { useState } from 'react';

export default function DownloadModal({ open, onClose, onSelect, initialFormat = 'pdf' }) {
  const [format, setFormat] = useState(initialFormat);

  if (!open) return null;

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000 }}>
      <div style={{ background: 'white', padding: 20, borderRadius: 8, width: 320 }}>
        <h3>Descargar informe</h3>
        <div style={{ marginBottom: 12 }}>
          <label>
            <input type="radio" name="format" value="pdf" checked={format === 'pdf'} onChange={() => setFormat('pdf')} /> PDF
          </label>
          <label style={{ marginLeft: 12 }}>
            <input type="radio" name="format" value="xlsx" checked={format === 'xlsx'} onChange={() => setFormat('xlsx')} /> Excel
          </label>
        </div>
        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <button onClick={onClose}>Cancelar</button>
          <button style={{ marginLeft: 8 }} onClick={() => onSelect(format)}>Descargar</button>
        </div>
      </div>
    </div>
  );
}
