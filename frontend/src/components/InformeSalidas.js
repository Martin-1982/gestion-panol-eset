import React, { useState, useEffect } from "react";
import axios from "axios";
import API_BASE_URL from '../config';
import { saveAs } from "file-saver";
import * as XLSX from "xlsx";
import { createPdfFromRows } from '../utils/pdf';
import EmailModal from './EmailModal';
import DownloadModal from './DownloadModal';
import { createRemitoPdf, generateQrDataUrl } from '../utils/pdf';
import { createWorkbookFromRows } from '../utils/excel';

export default function InformeSalidas({ onBack }) {
  const [salidas, setSalidas] = useState([]);
  // estados relacionados con carpeta/remitos si se implementa navegación por carpetas
  // (removidos temporalmente para evitar warnings de variables sin uso)
  const [busqueda, setBusqueda] = useState("");
  const [vistaPrevia, setVistaPrevia] = useState(false);
  const [emailOpen, setEmailOpen] = useState(false);
  const [downloadOpen, setDownloadOpen] = useState(false);
  const [remitosOpen, setRemitosOpen] = useState(false);
  const [remitoFiles, setRemitoFiles] = useState([]);
  const [remitoPreviewUrl, setRemitoPreviewUrl] = useState(null);
  const [selectedRemito, setSelectedRemito] = useState(null);
  const [remitoPreviewOpen, setRemitoPreviewOpen] = useState(false);
  const [logoDataUrl, setLogoDataUrl] = useState(null);
  const [emailAttachFile, setEmailAttachFile] = useState(null);
  const [emailInitialSubject, setEmailInitialSubject] = useState('Informe de Salidas - Pañol');
  const [sendRemitoOpen, setSendRemitoOpen] = useState(false);
  const [sendRemitoSalida, setSendRemitoSalida] = useState(null);
  const [sendRemitoType, setSendRemitoType] = useState('entrega');
  const [sendTo, setSendTo] = useState('');
  const [sendSubject, setSendSubject] = useState('Remito de salida - Pañol');
  const [sendBody, setSendBody] = useState('Adjunto remito de salida de elementos solicitados.');

  const fetchSalidas = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await axios.get(`${API_BASE_URL}/api/informes/salidas`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setSalidas(res.data);
    } catch (err) {
      console.error("❌ Error cargando salidas:", err);
    }
  };

  useEffect(() => {
    fetchSalidas();
  }, []);

  // intentar cargar logo público una vez para usar en remitos generados aquí
  useEffect(() => {
    let mounted = true;
    (async () => {
      const candidates = ['/logoRemito.png', '/logo-principal.png'];
      for (const c of candidates) {
        try {
          const resp = await fetch(c);
          if (!resp.ok) continue;
          const ct = (resp.headers.get('content-type') || '').toLowerCase();
          if (!ct.startsWith('image/')) continue;
          const blob = await resp.blob();
          const reader = new FileReader();
          const dataUrl = await new Promise((resolve, reject) => {
            reader.onloadend = () => resolve(reader.result);
            reader.onerror = reject;
            reader.readAsDataURL(blob);
          });
          if (mounted) setLogoDataUrl(dataUrl);
          break;
        } catch (e) {
          // seguir
        }
      }
    })();
    return () => { mounted = false; };
  }, []);

  const fetchRemitos = async (yearMonth) => {
    try {
      const token = localStorage.getItem('token');
      const d = new Date();
      const yyyy = d.getFullYear();
      const mm = String(d.getMonth() + 1).padStart(2, '0');
      // Los remitos se suben actualmente a uploads/YYYY/MM (no subcarpeta "remitos"),
      // por eso listamos ese directorio aquí. Si cambias la ruta de subida, actualizar.
      const dir = yearMonth || `${yyyy}/${mm}`;
      const res = await fetch(`${API_BASE_URL}/api/files/list?dir=${encodeURIComponent(dir)}`, { headers: { Authorization: `Bearer ${token}` } });
      if (!res.ok) throw new Error('No se pudo listar remitos');
      const json = await res.json();
      const files = json.files || [];
      const base = window.location.origin + '/uploads';
      const mapped = files.map(fn => ({ name: fn, url: `${base}/${dir}/${fn}` }));
      setRemitoFiles(mapped);
    } catch (err) {
      console.error('Error cargando remitos:', err);
      setRemitoFiles([]);
    }
  };

  const formatDateForRemito = (f) => {
    if (!f) return '';
    try {
      let s = String(f).trim();
      // soportar 'DD-MM-YYYY' y 'DD/MM/YYYY' y ISO
      s = s.replace(/-/g, '/');
      const parts = s.split('/').map(p => p.trim()).filter(Boolean);
      if (parts.length >= 3) {
        // si el primer grupo tiene 4 dígitos, es probable que venga como YYYY/MM/DD
        if (parts[0].length === 4) {
          const yyyy = parts[0];
          const mm = parts[1].padStart(2, '0');
          const dd = parts[2].padStart(2, '0');
          const yy = String(yyyy).slice(-2);
          return `${dd}/${mm}/${yy}`;
        }
        const dd = parts[0].padStart(2, '0');
        const mm = parts[1].padStart(2, '0');
        const yy = parts[2].slice(-2);
        return `${dd}/${mm}/${yy}`;
      }
      const dt = new Date(f);
      if (!isNaN(dt)) {
        const dd = String(dt.getDate()).padStart(2, '0');
        const mm = String(dt.getMonth() + 1).padStart(2, '0');
        const yy = String(dt.getFullYear()).slice(-2);
        return `${dd}/${mm}/${yy}`;
      }
      return s;
    } catch (e) { return String(f); }
  };

  const parseResponsables = (s) => {
    if (!s) return [];
    if (Array.isArray(s)) return s;
    if (typeof s !== 'string') return [String(s)];
    const trimmed = s.trim();
    // si viene como JSON array (p.ej. '["A","B"]') parsearlo
    if (trimmed.startsWith('[')) {
      try {
        const parsed = JSON.parse(trimmed);
        if (Array.isArray(parsed)) return parsed.map(x => String(x).trim()).filter(Boolean);
      } catch (e) { /* continuar con parsers simples */ }
    }
    if (s.includes(';')) return s.split(';').map(x => x.trim()).filter(Boolean);
    if (s.includes(',')) return s.split(',').map(x => x.trim()).filter(Boolean);
    return [s.trim()];
  };

  const filtradas = salidas.filter((s) => {
    const t = busqueda.toLowerCase();
    return (
      (s.producto || '').toLowerCase().includes(t) ||
      (s.destino || '').toLowerCase().includes(t) ||
      (s.responsable || '').toLowerCase().includes(t)
    );
  });
 

  const exportarExcel = () => {
    const columns = [
      { header: 'Fecha', key: 'fecha' },
      { header: 'Producto', key: 'producto' },
      { header: 'Destino', key: 'destino' },
      { header: 'Responsable', key: 'responsable' },
    ];
    const buffer = createWorkbookFromRows('Informe de Salidas - Pañol', columns, filtradas);
    saveAs(new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }), 'informe_salidas.xlsx');
  };

  const exportarPDF = async () => {
    try {
      const columns = [
        { header: 'Fecha', key: 'fecha' },
        { header: 'Producto', key: 'producto' },
        { header: 'Destino', key: 'destino' },
        { header: 'Responsable', key: 'responsable' },
      ];
      const doc = await createPdfFromRows('Informe de Salidas - Pañol', columns, filtradas);
      const arrayBuf = doc.output('arraybuffer');
      saveAs(new Blob([arrayBuf], { type: 'application/pdf' }), 'informe_salidas.pdf');
    } catch (err) {
      console.error('Error exportando PDF (salidas):', err);
      // eslint-disable-next-line no-alert
      alert('❌ Error generando PDF');
    }
  };

  const previewPDF = async () => {
    try {
      const columns = [
        { header: 'Fecha', key: 'fecha' },
        { header: 'Producto', key: 'producto' },
        { header: 'Destino', key: 'destino' },
        { header: 'Responsable', key: 'responsable' },
      ];
      const doc = await createPdfFromRows('Informe de Salidas - Pañol', columns, filtradas);
      const blob = doc.output('blob');
      const url = URL.createObjectURL(blob);
      window.open(url, '_blank');
      setTimeout(() => URL.revokeObjectURL(url), 60 * 1000);
    } catch (err) {
      console.error('Error generando vista previa PDF (salidas):', err);
      // eslint-disable-next-line no-alert
      alert('❌ Error generando vista previa');
    }
  };

  const handleDownloadSelect = async (format) => {
    setDownloadOpen(false);
    if (format === 'pdf') return await exportarPDF();
    if (format === 'xlsx') return await exportarExcel();
  };
  const enviarCorreo = () => setEmailOpen(true);

  const handleSendFromModal = async ({ to, subject, body, format }) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        // eslint-disable-next-line no-alert
        alert('Tu sesión expiró o no estás autenticado. Por favor volvé a iniciar sesión.');
        setEmailOpen(false);
        return;
      }
      // Si emailAttachFile está presente, adjuntar ese archivo en lugar de generar el informe
      let form = new FormData();
      form.append('to', to);
      form.append('subject', subject);
      form.append('text', body);
      form.append('html', `<pre>${body}</pre>`);

      if (emailAttachFile) {
        try {
          const resp = await fetch(emailAttachFile, { headers: { Authorization: `Bearer ${token}` } });
          if (resp.ok) {
            const blob = await resp.blob();
            const name = (selectedRemito && selectedRemito.name) ? selectedRemito.name : 'remito.pdf';
            form.append('file', new File([blob], name, { type: blob.type || 'application/pdf' }));
          }
        } catch (e) {
          console.error('Error fetching attachment for email:', e);
        }
      } else {
        let fileBlob = null;
        let filename = 'informe_salidas';
        if (format === 'xlsx') {
          const hoja = XLSX.utils.json_to_sheet(filtradas);
          const libro = XLSX.utils.book_new();
          XLSX.utils.book_append_sheet(libro, hoja, 'Salidas');
          const buffer = XLSX.write(libro, { bookType: 'xlsx', type: 'array' });
          fileBlob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
          filename += '.xlsx';
        } else {
          const columns = [
            { header: 'Fecha', key: 'fecha' },
            { header: 'Producto', key: 'producto' },
            { header: 'Destino', key: 'destino' },
            { header: 'Responsable', key: 'responsable' },
          ];
          const doc = await createPdfFromRows('Informe de Salidas - Pañol', columns, filtradas);
          const arrayBuf = doc.output('arraybuffer');
          fileBlob = new Blob([arrayBuf], { type: 'application/pdf' });
          filename += '.pdf';
        }
        form.append('file', new File([fileBlob], filename, { type: fileBlob.type }));
      }

      const res = await fetch(`${API_BASE_URL}/api/informes/enviar`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: form
      });

      if (res.status === 401) {
        // token inválido o expirado
        // eslint-disable-next-line no-alert
        alert('❌ Token inválido o expirado. Volvé a iniciar sesión.');
      } else if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        // eslint-disable-next-line no-alert
        alert('❌ Error enviando correo: ' + (err.error || res.statusText));
      } else {
        // eslint-disable-next-line no-alert
        alert('✅ Informe enviado a ' + to);
        window.dispatchEvent(new Event('mail:sent'));
      }
    } catch (err) {
      console.error('Error enviando desde modal (salidas):', err);
      // eslint-disable-next-line no-alert
      alert('❌ Error inesperado al enviar correo');
    } finally {
      setEmailOpen(false);
      setEmailAttachFile(null);
    }
  };

  const handleSendRemito = async ({ to, subject, body, format }) => {
    try {
      if (!sendRemitoSalida) {
        alert('Seleccione una salida para enviar');
        return;
      }
      setSendRemitoOpen(false);
      const token = localStorage.getItem('token');
      if (!token) {
        // eslint-disable-next-line no-alert
        alert('Tu sesión expiró o no estás autenticado. Por favor volvé a iniciar sesión.');
        return;
      }
  // preparar remito (entrega por defecto) — usar la fecha cruda del servidor
  const responsablesArr = parseResponsables(sendRemitoSalida.responsable);
  const base = { fecha: sendRemitoSalida.fecha, destino: sendRemitoSalida.destino, responsables: responsablesArr, items: [{ nombre: sendRemitoSalida.producto || '', cantidad: sendRemitoSalida.cantidad || 1 }], tipo: sendRemitoType, numero: `S-${sendRemitoSalida.id || Date.now()}-E` };
      if (logoDataUrl) base.logoDataUrl = logoDataUrl;
      try {
        base.qrDataUrl = await generateQrDataUrl(window.location.origin + `/remitos/entrega/${sendRemitoSalida.id || Date.now()}`, { width: 200 });
      } catch (e) { /* ignore QR errors */ }
      // generar doc (solo una copia del tipo pedido)
  const doc = await createRemitoPdf(base, { perforationMarginMm: 30, singlePage: true, emailQrOffsetMm: 6 });
      const arrayBuf = doc.output('arraybuffer');
      const fileBlob = new Blob([arrayBuf], { type: 'application/pdf' });

      const form = new FormData();
      form.append('to', to);
      form.append('subject', subject || 'Remito de salida');
      form.append('text', body || 'Adjunto remito de salida');
      form.append('file', new File([fileBlob], `remito_${sendRemitoSalida.id || Date.now()}.pdf`, { type: 'application/pdf' }));

      const res = await fetch(`${API_BASE_URL}/api/informes/enviar`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: form
      });
      if (res.status === 401) {
        // eslint-disable-next-line no-alert
        alert('❌ Token inválido o expirado. Volvé a iniciar sesión.');
      } else if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        // eslint-disable-next-line no-alert
        alert('❌ Error enviando remito: ' + (err.error || res.statusText));
      } else {
        // eslint-disable-next-line no-alert
        alert('✅ Remito enviado a ' + to);
        window.dispatchEvent(new Event('mail:sent'));
      }
    } catch (err) {
      console.error('Error enviando remito:', err);
      // eslint-disable-next-line no-alert
      alert('❌ Error inesperado al enviar remito');
    } finally {
      setSendRemitoSalida(null);
    }
  };
  const imprimir = () => {
    (async () => {
      const columns = [
        { header: 'Fecha', key: 'fecha' },
        { header: 'Producto', key: 'producto' },
        { header: 'Destino', key: 'destino' },
        { header: 'Responsable', key: 'responsable' },
      ];
      const doc = await createPdfFromRows('Informe de Salidas - Pañol', columns, filtradas);
      const blob = doc.output('blob');
      const url = URL.createObjectURL(blob);
      const win = window.open(url, '_blank');
      setTimeout(() => { try { win.print(); } catch(e){} }, 500);
      setTimeout(() => URL.revokeObjectURL(url), 60 * 1000);
    })();
  };

  return (
    <div className="main-content">
      <div className="dashboard-header">
        <h2 className="dashboard-title">📤 Informe de Salidas</h2>
        <button className="btn-outline" onClick={onBack}>Volver</button>
      </div>

      <div className="card card-responsive card-shadow">
        <div className="form-group">
          <input
            type="text"
            placeholder="Buscar producto, destino o responsable..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            className="input input-full"
          />
        </div>

        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Fecha</th>
                <th>Destino</th>
                <th>Responsable</th>
                <th style={{ width: 180 }}>Remito</th>
              </tr>
            </thead>
            <tbody>
              {filtradas.length === 0 && (
                <tr>
                  <td colSpan="4" className="muted" style={{ textAlign: 'center', padding: 24 }}>
                    No hay salidas que mostrar
                  </td>
                </tr>
              )}
              {filtradas.map((s, idx) => (
                <tr key={s.id || idx}>
                  <td>{formatDateForRemito(s.fecha)}</td>
                  <td>{s.destino}</td>
                  <td>{s.responsable}</td>
                  <td>
                    <div className="action-buttons">{/* Previsualizar remito (ambos en una hoja) */}
                      <button className="btn-sm btn-outline" title="Previsualizar remito" onClick={async () => {
                  try {
                    // Solo generar la copia de ENTREGA para la previsualización
                    const responsablesArr = parseResponsables(s.responsable);
                    const right = { fecha: s.fecha, destino: s.destino, responsables: responsablesArr, items: [{ nombre: s.producto || '', cantidad: s.cantidad || 1 }], tipo: 'entrega', numero: `S-${s.id || idx}-E` };
                    try {
                      right.qrDataUrl = await generateQrDataUrl(window.location.origin + `/remitos/entrega/${s.id || idx}`, { width: 200 });
                    } catch (e) { right.qrDataUrl = null; }
                    if (logoDataUrl) { right.logoDataUrl = logoDataUrl; }
                    const doc = await createRemitoPdf(right, { perforationMarginMm: 30, singlePage: true, emailQrOffsetMm: 6 });
                    const blob = doc.output('blob');
                    const url = URL.createObjectURL(blob);
                    setRemitoPreviewUrl(url);
                    setSelectedRemito({ name: `remito_entrega_${s.id || idx}.pdf` });
                    setRemitoPreviewOpen(true);
                  } catch (e) { console.error(e); alert('Error generando remito'); }
                }}>🔍</button>
                {/* Enviar por correo (elige archivo o entrega) */}
                <button className="btn-sm btn-outline" title="Enviar remito" onClick={() => { setSendRemitoSalida(s); setSendRemitoType('entrega'); setSendTo(''); setSendSubject(`Remito de entrega N° S-${s.id || idx}-E`); setSendBody('Adjunto remito de entrega.'); setSendRemitoOpen(true); }}>✉️</button>
                {/* Imprimir: genera ambos remitos en la misma hoja y manda a imprimir */}
                <button className="btn-sm btn-outline" title="Imprimir remitos" onClick={async () => {
                  try {
                    // usar la fecha cruda del servidor para el PDF
                    const responsablesArr = parseResponsables(s.responsable);
                    const base = { fecha: s.fecha, destino: s.destino, responsables: responsablesArr, items: [{ nombre: s.producto || '', cantidad: s.cantidad || 1 }] };
                    const left = { ...base, tipo: 'archivo', numero: `S-${s.id || idx}-A` };
                    const right = { ...base, tipo: 'entrega', numero: `S-${s.id || idx}-E` };
                    if (logoDataUrl) { left.logoDataUrl = logoDataUrl; right.logoDataUrl = logoDataUrl; }
                    try {
                      left.qrDataUrl = await generateQrDataUrl(window.location.origin + `/remitos/archivo/${s.id || idx}`, { width: 200 });
                    } catch (e) { left.qrDataUrl = null; }
                    try {
                      right.qrDataUrl = await generateQrDataUrl(window.location.origin + `/remitos/entrega/${s.id || idx}`, { width: 200 });
                    } catch (e) { right.qrDataUrl = null; }
                    const doc = await createRemitoPdf([left, right], { perforationMarginMm: 30 });
                    const blob = doc.output('blob');
                    const url = URL.createObjectURL(blob);
                    const win = window.open(url, '_blank');
                    setTimeout(() => { try { win.print(); } catch (e) { console.warn(e); } }, 600);
                    setTimeout(() => URL.revokeObjectURL(url), 60 * 1000);
                  } catch (e) { console.error(e); alert('Error imprimiendo remito'); }
                }}>🖨️</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="form-actions">
          <button onClick={() => setVistaPrevia(true)} className="btn-outline">🖨️ Imprimir</button>
          <button onClick={async () => { setRemitosOpen(true); await fetchRemitos(); }} className="btn-outline">📄 Remitos</button>
          <button onClick={previewPDF} className="btn-outline">🔍 Vista previa</button>
          <button onClick={() => setDownloadOpen(true)} className="btn-outline">⬇️ Descargar</button>
          <button onClick={enviarCorreo} className="btn-primary">📧 Enviar por correo</button>
        </div>
      </div>

      {vistaPrevia && (
        <div className="app-modal-overlay" onKeyDown={(e) => { if (e.key === "Escape") setVistaPrevia(false); if (e.key === "Enter") imprimir(); }} tabIndex={0}>
          <div className="app-modal" role="dialog" aria-modal="true">
            <h3 className="modal-title">Vista previa de impresión</h3>
            <div className="modal-body">
              <div className="table-container" style={{ maxHeight: '60vh', overflowY: 'auto' }}>
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Fecha</th>
                      <th>Destino</th>
                      <th>Responsable</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtradas.map((s, idx) => (
                      <tr key={s.id || idx}>
                        <td>{formatDateForRemito(s.fecha)}</td>
                        <td>{s.destino}</td>
                        <td>{s.responsable}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
            <div className="modal-actions">
              <button onClick={imprimir} className="btn-primary">🖨️ Imprimir</button>
              <button onClick={() => setVistaPrevia(false)} className="btn-outline">Cancelar</button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de remitos */}
      {remitosOpen && (
        <div className="app-modal-overlay" style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999 }} onClick={(e) => { if (e.target === e.currentTarget) { setRemitosOpen(false); setRemitoFiles([]); } }}>
          <div style={{ width: '80%', maxWidth: 900, height: '80%', background: '#fff', borderRadius: 6, boxShadow: '0 8px 36px rgba(0,0,0,0.3)', position: 'relative', display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: 8, borderBottom: '1px solid #eee' }}>
              <div style={{ fontWeight: 700 }}>Remitos subidos</div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button className="btn btn-primary" onClick={() => { fetchRemitos(); }}>Actualizar</button>
                <button className="btn btn-ghost" onClick={() => { setRemitosOpen(false); setRemitoFiles([]); }}>Cerrar</button>
              </div>
            </div>
            <div style={{ padding: 12, overflow: 'auto', flex: 1 }}>
              {remitoFiles.length === 0 && <div style={{ color: '#666' }}>No se encontraron remitos en el mes seleccionado.</div>}
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: '#f5f5f5' }}>
                    <th style={{ textAlign: 'left', padding: 8 }}>Archivo</th>
                    <th style={{ width: 220, textAlign: 'right', padding: 8 }}>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {remitoFiles.map((f, idx) => (
                    <tr key={idx}>
                      <td style={{ padding: 8, borderBottom: '1px solid #eee' }}>{f.name}</td>
                      <td style={{ padding: 8, borderBottom: '1px solid #eee', textAlign: 'right' }}>
                        <button className="compact-btn" onClick={async () => {
                          // preview
                          try {
                            const res = await fetch(f.url);
                            const blob = await res.blob();
                            const url = URL.createObjectURL(blob);
                            setRemitoPreviewUrl(url);
                            setSelectedRemito(f);
                            setRemitoPreviewOpen(true);
                          } catch (e) { console.error(e); alert('Error cargando archivo'); }
                        }}>🔍</button>
                        <a href={f.url} download={f.name} style={{ marginLeft: 8 }}><button className="compact-btn">⬇️</button></a>
                        <button className="compact-btn" style={{ marginLeft: 8 }} onClick={async () => { try { const w = window.open(f.url, '_blank'); setTimeout(() => { try { w.print(); } catch (e) {} }, 600); } catch (e) { console.error(e); } }}>🖨️</button>
                        <button className="compact-btn" style={{ marginLeft: 8 }} onClick={() => {
                          // preparar asunto por defecto según nombre del archivo (si contiene 'entrega')
                          try {
                            const fname = (f.name || '').toLowerCase();
                            if (fname.includes('entrega')) {
                              const m = fname.match(/(\d{1,})/);
                              const num = m ? m[1] : f.name;
                              setEmailInitialSubject(`Remito de entrega N° ${num}`);
                            } else {
                              setEmailInitialSubject('Remito');
                            }
                          } catch (e) { setEmailInitialSubject('Remito'); }
                          setSelectedRemito(f); setEmailAttachFile(f.url); setEmailOpen(true);
                        }}>✉️</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {/* preview iframe */}
            {remitoPreviewUrl && (
                    <div style={{ position: 'absolute', right: 8, top: 48, width: '40%', height: '70%', background: '#fff', border: '1px solid #ddd' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', padding: 6, borderBottom: '1px solid #eee' }}>
                        <div style={{ fontWeight: 600 }}>{selectedRemito && selectedRemito.name}</div>
                        <div>
                          <button className="btn btn-ghost" onClick={() => { try { if (remitoPreviewUrl && remitoPreviewUrl.startsWith('blob:')) { URL.revokeObjectURL(remitoPreviewUrl); } setRemitoPreviewUrl(null); setRemitoPreviewOpen(false); } catch (e) {} }}>Cerrar</button>
                        </div>
                      </div>
                      <iframe src={remitoPreviewUrl} style={{ width: '100%', height: 'calc(100% - 40px)', border: 'none' }} title="Remito Preview" />
                    </div>
            )}
          </div>
        </div>
      )}
      <EmailModal
        key={'informe_salidas'}
        open={emailOpen}
        onClose={() => { setEmailOpen(false); }}
        onSubmit={async ({ to, subject, body, format }) => {
          await handleSendFromModal({ to, subject, body, format });
        }}
        initialSubject={emailInitialSubject}
        initialBody={filtradas.map(s => `${s.fecha} | ${s.producto} | ${s.destino}`).join('\n')}
      />
      {/* Modal para enviar un remito concreto (desde la fila) */}
      <EmailModal
        key={'send_remito'}
        open={sendRemitoOpen}
        onClose={() => { setSendRemitoOpen(false); setSendRemitoSalida(null); }}
        onSubmit={async ({ to, subject, body, format }) => {
          await handleSendRemito({ to, subject, body, format });
        }}
        initialTo={sendTo}
        initialSubject={sendSubject}
        initialBody={sendBody}
        defaultFormat={'pdf'}
      />
      {/* Global preview modal: usado también cuando se genera el PDF desde la fila (no solo desde el modal Remitos) */}
      {remitoPreviewOpen && remitoPreviewUrl && (
        <div className="app-modal-overlay" style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 20000 }} onClick={(e) => { if (e.target === e.currentTarget) { try { if (remitoPreviewUrl && remitoPreviewUrl.startsWith('blob:')) URL.revokeObjectURL(remitoPreviewUrl); } catch (e) {} setRemitoPreviewUrl(null); setRemitoPreviewOpen(false); } }}>
          <div style={{ width: '80%', maxWidth: 1000, height: '80%', background: '#fff', borderRadius: 6, overflow: 'hidden' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: 8, borderBottom: '1px solid #eee' }}>
              <div style={{ fontWeight: 700 }}>{selectedRemito && selectedRemito.name}</div>
              <div>
                <button className="btn btn-ghost" onClick={() => { try { if (remitoPreviewUrl && remitoPreviewUrl.startsWith('blob:')) URL.revokeObjectURL(remitoPreviewUrl); } catch (e) {} setRemitoPreviewUrl(null); setRemitoPreviewOpen(false); }}>Cerrar</button>
              </div>
            </div>
            <iframe src={remitoPreviewUrl} style={{ width: '100%', height: 'calc(100% - 40px)', border: 'none' }} title="Remito Preview" />
          </div>
        </div>
      )}
      {/* folder modal removed (remito-specific) */}
      <DownloadModal
        open={downloadOpen}
        onClose={() => setDownloadOpen(false)}
        onSelect={handleDownloadSelect}
        initialFormat={'pdf'}
      />
    </div>
  );
}
