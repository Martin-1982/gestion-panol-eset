import React, { useState, useEffect } from "react";
import axios from "axios";
import API_BASE_URL from '../config';
import { saveAs } from "file-saver";
import * as XLSX from "xlsx";
import { createPdfFromRows } from '../utils/pdf';
import EmailModal from './EmailModal';
import DownloadModal from './DownloadModal';
import { createWorkbookFromRows } from '../utils/excel';

export default function InformeEntradas({ onBack }) {
  const [entradas, setEntradas] = useState([]);
  const [busqueda, setBusqueda] = useState("");
  const [vistaPrevia, setVistaPrevia] = useState(false);
  const [emailOpen, setEmailOpen] = useState(false);
  const [downloadOpen, setDownloadOpen] = useState(false);

  const fetchEntradas = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await axios.get(`${API_BASE_URL}/api/informes/entradas`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setEntradas(res.data);
    } catch (err) {
      console.error("❌ Error cargando entradas:", err);
    }
  };

  useEffect(() => {
    fetchEntradas();
  }, []);

  const filtradas = entradas.filter((e) => {
    const t = busqueda.toLowerCase();
    return (
      e.producto?.toLowerCase().includes(t) ||
      e.categoria?.toLowerCase().includes(t) ||
      e.subcategoria?.toLowerCase().includes(t) ||
      e.proveedor_nombre?.toLowerCase().includes(t)
    );
  });

  const exportarExcel = () => {
    const columns = [
      { header: 'Fecha', key: 'fecha' },
      { header: 'Producto', key: 'producto' },
      { header: 'Categoría', key: 'categoria' },
      { header: 'Proveedor', key: 'proveedor_nombre' },
      { header: 'Cantidad', key: 'cantidad' },
    ];
    const buffer = createWorkbookFromRows('Informe de Entradas - Pañol', columns, filtradas);
    saveAs(new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }), 'informe_entradas.xlsx');
  };

  const exportarPDF = async () => {
    try {
      const columns = [
        { header: 'Fecha', key: 'fecha' },
        { header: 'Producto', key: 'producto' },
        { header: 'Categoría', key: 'categoria' },
        { header: 'Proveedor', key: 'proveedor_nombre' },
        { header: 'Cantidad', key: 'cantidad' },
      ];
      const doc = await createPdfFromRows('Informe de Entradas - Pañol', columns, filtradas);
      const arrayBuf = doc.output('arraybuffer');
      saveAs(new Blob([arrayBuf], { type: 'application/pdf' }), 'informe_entradas.pdf');
    } catch (err) {
      console.error('Error exportando PDF (entradas):', err);
      // eslint-disable-next-line no-alert
      alert('❌ Error generando PDF');
    }
  };

  const previewPDF = async () => {
    try {
      const columns = [
        { header: 'Fecha', key: 'fecha' },
        { header: 'Producto', key: 'producto' },
        { header: 'Categoría', key: 'categoria' },
        { header: 'Proveedor', key: 'proveedor_nombre' },
        { header: 'Cantidad', key: 'cantidad' },
      ];
      const doc = await createPdfFromRows('Informe de Entradas - Pañol', columns, filtradas);
      const blob = doc.output('blob');
      const url = URL.createObjectURL(blob);
      window.open(url, '_blank');
      setTimeout(() => URL.revokeObjectURL(url), 60 * 1000);
    } catch (err) {
      console.error('Error generando vista previa PDF (entradas):', err);
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
      let fileBlob = null;
      let filename = 'informe_entradas';
      if (format === 'xlsx') {
        const hoja = XLSX.utils.json_to_sheet(filtradas);
        const libro = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(libro, hoja, 'Entradas');
        const buffer = XLSX.write(libro, { bookType: 'xlsx', type: 'array' });
        fileBlob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
        filename += '.xlsx';
      } else {
        const columns = [
          { header: 'Fecha', key: 'fecha' },
          { header: 'Producto', key: 'producto' },
          { header: 'Proveedor', key: 'proveedor_nombre' },
          { header: 'Cantidad', key: 'cantidad' },
        ];
  const doc = await createPdfFromRows('Informe de Entradas - Pañol', columns, filtradas);
  const arrayBuf = doc.output('arraybuffer');
        fileBlob = new Blob([arrayBuf], { type: 'application/pdf' });
        filename += '.pdf';
      }

      const form = new FormData();
      form.append('to', to);
      form.append('subject', subject);
      form.append('text', body);
      form.append('html', `<pre>${body}</pre>`);
      form.append('file', new File([fileBlob], filename, { type: fileBlob.type }));

      const res = await fetch(`${API_BASE_URL}/api/informes/enviar`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: form
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        // eslint-disable-next-line no-alert
        alert('❌ Error enviando correo: ' + (err.error || res.statusText));
      } else {
        // eslint-disable-next-line no-alert
        alert('✅ Informe enviado a ' + to);
        window.dispatchEvent(new Event('mail:sent'));
      }
    } catch (err) {
      console.error('Error enviando desde modal (entradas):', err);
      // eslint-disable-next-line no-alert
      alert('❌ Error inesperado al enviar correo');
    } finally {
      setEmailOpen(false);
    }
  };

  const imprimir = () => {
    (async () => {
      const columns = [
        { header: 'Fecha', key: 'fecha' },
        { header: 'Producto', key: 'producto' },
        { header: 'Categoría', key: 'categoria' },
        { header: 'Proveedor', key: 'proveedor_nombre' },
        { header: 'Cantidad', key: 'cantidad' },
      ];
      const doc = await createPdfFromRows('Informe de Entradas - Pañol', columns, filtradas);
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
        <h2 className="dashboard-title">📥 Informe de Entradas</h2>
        <div className="top-actions">
          <button className="btn-outline" onClick={onBack}>Volver</button>
        </div>
      </div>

      <div className="card card-responsive card-shadow">
        <div className="form-group">
          <input
            type="text"
            placeholder="Buscar producto, categoría o proveedor..."
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
                <th>Producto</th>
                <th>Categoría</th>
                <th>Subcategoría</th>
                <th>Proveedor</th>
                <th>Cantidad</th>
                <th>Unidad</th>
                <th>Costo</th>
                <th>Donación</th>
              </tr>
            </thead>
            <tbody>
              {filtradas.length === 0 && (
                <tr>
                  <td colSpan="9" className="muted" style={{ textAlign: 'center', padding: 24 }}>
                    No hay entradas que mostrar
                  </td>
                </tr>
              )}
              {filtradas.map((e) => (
                <tr key={e.id}>
                  <td>{new Date(e.fecha).toLocaleDateString("es-AR")}</td>
                  <td>{e.producto}</td>
                  <td>{e.categoria}</td>
                  <td>{e.subcategoria}</td>
                  <td>{e.proveedor_nombre}</td>
                  <td>{e.cantidad}</td>
                  <td>{e.unidad}</td>
                  <td>{e.costo ? `$${e.costo}` : "-"}</td>
                  <td>{e.donacion ? "✅" : "-"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="form-actions">
          <button onClick={() => setVistaPrevia(true)} className="btn-outline">🖨️ Imprimir</button>
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
                      <th>Producto</th>
                      <th>Categoría</th>
                      <th>Proveedor</th>
                      <th>Cantidad</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtradas.map((e) => (
                      <tr key={e.id}>
                        <td>{new Date(e.fecha).toLocaleDateString("es-AR")}</td>
                        <td>{e.producto}</td>
                        <td>{e.categoria}</td>
                        <td>{e.proveedor_nombre}</td>
                        <td>{e.cantidad}</td>
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
      
      <EmailModal
        open={emailOpen}
        onClose={() => setEmailOpen(false)}
        onSubmit={handleSendFromModal}
        initialSubject={'Informe de Entradas - Pañol'}
        initialBody={filtradas.map(e => `${e.fecha} | ${e.producto} | ${e.proveedor_nombre}`).join('\n')}
      />
      <DownloadModal
        open={downloadOpen}
        onClose={() => setDownloadOpen(false)}
        onSelect={handleDownloadSelect}
        initialFormat={'pdf'}
      />
    </div>
  );
}
