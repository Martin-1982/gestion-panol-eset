import React, { useState } from 'react';

export default function DownloadModal({ open, onClose, onSelect, initialFormat = 'pdf' }) {
  const [format, setFormat] = useState(initialFormat);

  if (!open) return null;

  return (
    <div className="app-modal-overlay">
      <div className="modal-content" style={{ maxWidth: 380 }}>
        <h3>Descargar informe</h3>
        
        <label>Formato de descarga</label>
        <div style={{ display: 'flex', gap: '20px', marginTop: '8px', marginBottom: '8px' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
            <input type="radio" name="format" value="pdf" checked={format === 'pdf'} onChange={() => setFormat('pdf')} />
            <span>📄 PDF</span>
          </label>
          <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
            <input type="radio" name="format" value="xlsx" checked={format === 'xlsx'} onChange={() => setFormat('xlsx')} />
            <span>📊 Excel</span>
          </label>
        </div>
        
        <div className="form-actions">
          <button className="btn-outline" onClick={onClose}>Cancelar</button>
          <button className="btn-primary" onClick={() => onSelect(format)}>⬇ Descargar</button>
        </div>
      </div>
    </div>
  );
}
