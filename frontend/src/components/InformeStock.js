import React, { useState, useEffect } from "react";
import axios from "axios";
import { saveAs } from "file-saver";
import * as XLSX from "xlsx";
import EmailModal from './EmailModal';
import DownloadModal from './DownloadModal';
import { createPdfFromRows } from '../utils/pdf';
import { createWorkbookFromRows } from '../utils/excel';

export default function InformeStock({ onBack }) {
  const [items, setItems] = useState([]);
  const [busqueda, setBusqueda] = useState("");
  const [filtros, setFiltros] = useState({ bajo: false, sinStock: false });
  const [vistaPrevia, setVistaPrevia] = useState(false);
  const [emailOpen, setEmailOpen] = useState(false);
  const [downloadOpen, setDownloadOpen] = useState(false);

  const fetchStock = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await axios.get("http://localhost:4000/api/informes/stock", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setItems(res.data);
    } catch (err) {
      console.error("❌ Error al obtener stock:", err);
    }
  };

  useEffect(() => {
    fetchStock();
  }, []);

  const filtrados = items.filter((i) => {
    const t = busqueda.toLowerCase();
    const coincide =
      i.producto?.toLowerCase().includes(t) ||
      i.categoria?.toLowerCase().includes(t) ||
      i.subcategoria?.toLowerCase().includes(t);
    if (filtros.bajo && !(i.stock <= i.minimo && i.stock > 0)) return false;
    if (filtros.sinStock && i.stock > 0) return false;
    return coincide;
  });

  const exportarExcel = () => {
    const columns = [
      { header: 'Producto', key: 'producto' },
      { header: 'Categoría', key: 'categoria' },
      { header: 'Subcategoría', key: 'subcategoria' },
      { header: 'Stock', key: 'stock' },
    ];
    const buffer = createWorkbookFromRows('Informe de Stock - Pañol', columns, filtrados);
    saveAs(new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }), 'informe_stock.xlsx');
  };

  const exportarPDF = async () => {
    try {
      const columns = [
        { header: 'Producto', key: 'producto' },
        { header: 'Categoría', key: 'categoria' },
        { header: 'Subcategoría', key: 'subcategoria' },
        { header: 'Stock', key: 'stock' },
      ];
      const doc = await createPdfFromRows('Informe de Stock - Pañol', columns, filtrados);
      const arrayBuf = doc.output('arraybuffer');
      saveAs(new Blob([arrayBuf], { type: 'application/pdf' }), 'informe_stock.pdf');
    } catch (err) {
      console.error('Error exportando PDF:', err);
      // fallback a alert nativo
      // eslint-disable-next-line no-alert
      alert('❌ Error generando PDF');
    }
  };

  const previewPDF = async () => {
    try {
      const columns = [
        { header: 'Producto', key: 'producto' },
        { header: 'Categoría', key: 'categoria' },
        { header: 'Subcategoría', key: 'subcategoria' },
        { header: 'Stock', key: 'stock' },
      ];
      const doc = await createPdfFromRows('Informe de Stock - Pañol', columns, filtrados);
      const blob = doc.output('blob');
      const url = URL.createObjectURL(blob);
      window.open(url, '_blank');
  // revocar el object URL después de un tiempo para liberar memoria
      setTimeout(() => URL.revokeObjectURL(url), 60 * 1000);
    } catch (err) {
      console.error('Error generando vista previa PDF:', err);
      // eslint-disable-next-line no-alert
      alert('❌ Error generando vista previa');
    }
  };

  const handleDownloadSelect = async (format) => {
    setDownloadOpen(false);
    if (format === 'pdf') return await exportarPDF();
    if (format === 'xlsx') return await exportarExcel();
  };

  const enviarCorreo = (event) => {
    setEmailOpen(true);
  };

  const handleSendFromModal = async ({ to, subject, body, format }) => {
    try {
      const token = localStorage.getItem('token');

      let fileBlob = null;
      let filename = 'informe_stock';

      if (format === 'xlsx') {
        const hoja = XLSX.utils.json_to_sheet(filtrados);
        const libro = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(libro, hoja, 'Stock');
        const buffer = XLSX.write(libro, { bookType: 'xlsx', type: 'array' });
        fileBlob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
        filename += '.xlsx';
      } else {
  // generar un PDF real con encabezado/pie
        const columns = [
          { header: 'Producto', key: 'producto' },
          { header: 'Categoría', key: 'categoria' },
          { header: 'Subcategoría', key: 'subcategoria' },
          { header: 'Stock', key: 'stock' },
        ];
  const doc = await createPdfFromRows('Informe de Stock - Pañol', columns, filtrados);
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

      const res = await fetch('http://localhost:4000/api/informes/enviar', {
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
  // notificar a MailLogs para que se actualice
        window.dispatchEvent(new Event('mail:sent'));
      }
    } catch (err) {
  console.error('Error enviando desde modal:', err);
  // eslint-disable-next-line no-alert
  alert('❌ Error inesperado al enviar correo');
  throw err;
    } finally {
      setEmailOpen(false);
    }
  };

  const imprimir = () => {
    (async () => {
      const columns = [
        { header: 'Producto', key: 'producto' },
        { header: 'Categoría', key: 'categoria' },
        { header: 'Subcategoría', key: 'subcategoria' },
        { header: 'Stock', key: 'stock' },
      ];
      const doc = await createPdfFromRows('Informe de Stock - Pañol', columns, filtrados);
      const blob = doc.output('blob');
      const url = URL.createObjectURL(blob);
      const win = window.open(url, '_blank');
  // permitir que cargue y luego imprimir
      setTimeout(() => { try { win.print(); } catch(e){} }, 500);
      setTimeout(() => URL.revokeObjectURL(url), 60 * 1000);
    })();
  };

  return (
    <div style={{ padding: "20px", fontFamily: "Arial" }}>
      <div className="dashboard-header" style={{ padding: 0 }}>
        <h2 className="dashboard-title">📦 Informe de Stock</h2>
        <div className="top-actions">
          <button className="btn btn-ghost" onClick={onBack}>🔙 Volver</button>
        </div>
      </div>

      <input
        type="text"
        placeholder="Buscar producto, categoría o subcategoría..."
        value={busqueda}
        onChange={(e) => setBusqueda(e.target.value)}
        style={{ width: "40%", padding: "5px" }}
      />

      <label style={{ marginLeft: "15px" }}>
        <input
          type="checkbox"
          checked={filtros.bajo}
          onChange={(e) => setFiltros({ ...filtros, bajo: e.target.checked })}
        />
        Stock bajo
      </label>
      <label style={{ marginLeft: "15px" }}>
        <input
          type="checkbox"
          checked={filtros.sinStock}
          onChange={(e) => setFiltros({ ...filtros, sinStock: e.target.checked })}
        />
        Sin stock
      </label>

      <table
        id="tabla-stock"
        border="1"
        cellPadding="6"
        style={{ width: "100%", marginTop: 10, borderCollapse: "collapse" }}
      >
        <thead style={{ background: "#eee" }}>
          <tr>
            <th>Producto</th>
            <th>Categoría</th>
            <th>Subcategoría</th>
            <th>Presentación</th>
            <th>Unidad</th>
            <th>Mínimo</th>
            <th>Stock</th>
          </tr>
        </thead>
        <tbody>
          {filtrados.map((i, idx) => (
            <tr key={idx}>
              <td>{i.producto}</td>
              <td>{i.categoria}</td>
              <td>{i.subcategoria}</td>
              <td>{i.presentacion}</td>
              <td>{i.unidad}</td>
              <td>{i.minimo}</td>
              <td
                style={{
                  color:
                    i.stock === 0
                      ? "red"
                      : i.stock <= i.minimo
                      ? "orange"
                      : "green",
                }}
              >
                {i.stock}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <div style={{ marginTop: 20 }}>
        <button onClick={() => setVistaPrevia(true)}>🖨️ Imprimir</button>
        <button onClick={previewPDF} style={{ marginLeft: 10 }}>
          🔍 Vista previa
        </button>
        <button onClick={() => setDownloadOpen(true)} style={{ marginLeft: 10 }}>
          ⬇️ Descargar
        </button>
        <button onClick={enviarCorreo} style={{ marginLeft: 10 }}>
          📧 Correo
        </button>
        <button onClick={onBack} style={{ marginLeft: 10 }}>
          🔙 Volver
        </button>
      </div>

      {vistaPrevia && (
        <div
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === "Escape") setVistaPrevia(false);
            if (e.key === "Enter") imprimir();
          }}
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            background: "rgba(0,0,0,0.5)",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            zIndex: 999,
          }}
        >
          <div
            style={{
              background: "white",
              padding: 20,
              borderRadius: 10,
              textAlign: "center",
            }}
          >
            <h3>Vista previa de impresión</h3>
            <button onClick={imprimir}>🖨️ Imprimir</button>
            <button onClick={() => setVistaPrevia(false)} style={{ marginLeft: 10 }}>
              ❌ Cancelar
            </button>
            <div style={{ maxHeight: "60vh", overflowY: "auto", marginTop: 10 }}>
              <table border="1" cellPadding="6" style={{ width: "100%" }}>
                <thead style={{ background: "#eee" }}>
                  <tr>
                    <th>Producto</th>
                    <th>Categoría</th>
                    <th>Subcategoría</th>
                    <th>Unidad</th>
                    <th>Stock</th>
                  </tr>
                </thead>
                <tbody>
                  {filtrados.map((i, idx) => (
                    <tr key={idx}>
                      <td>{i.producto}</td>
                      <td>{i.categoria}</td>
                      <td>{i.subcategoria}</td>
                      <td>{i.unidad}</td>
                      <td>{i.stock}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
      <EmailModal
        open={emailOpen}
        onClose={() => setEmailOpen(false)}
        onSubmit={handleSendFromModal}
        initialSubject={'Informe de Stock - Pañol'}
        initialBody={filtrados.map(i => `${i.producto} | ${i.categoria} | Stock: ${i.stock}`).join('\n')}
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
