import React, { useState, useRef } from "react";
import InformeStock from "./InformeStock";
import InformeEntradas from "./InformeEntradas";
import InformeSalidas from "./InformeSalidas";
import MailLogs from "./MailLogs";
import { createRemitoPdf, generateQrDataUrl } from '../utils/pdf';

export default function Informes({ onBack }) {
  const [pantalla, setPantalla] = useState("menu");
  const [showPreview, setShowPreview] = useState(false);
  const [previewUrl, setPreviewUrl] = useState(null);
  const iframeRef = useRef(null);

  if (pantalla === "stock") return <InformeStock onBack={() => setPantalla("menu")} />;
  if (pantalla === "entradas") return <InformeEntradas onBack={() => setPantalla("menu")} />;
  if (pantalla === "salidas") return <InformeSalidas onBack={() => setPantalla("menu")} />;
  if (pantalla === "mail_logs") return <MailLogs onBack={() => setPantalla("menu")} />;

  return (
    <div style={{ padding: "20px", fontFamily: "Arial" }}>
      <div className="dashboard-header" style={{ padding: 0 }}>
        <h2 className="dashboard-title">📊 Informes</h2>
        <div className="top-actions">
          <button className="btn btn-ghost" onClick={onBack}>🔙 Volver</button>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 14, alignItems: 'center', marginTop: 8 }}>
        <button className="btn btn-primary" onClick={() => setPantalla("stock")} style={{ width: 220 }}>📦 Informe de Stock</button>
        <button className="btn btn-primary" onClick={() => setPantalla("entradas")} style={{ width: 220 }}>➕ Informe de Entradas</button>
        <button className="btn btn-primary" onClick={() => setPantalla("salidas")} style={{ width: 220 }}>➖ Informe de Salidas</button>
  <button className="btn btn-ghost btn-ghost-accent" onClick={() => setPantalla("mail_logs")} style={{ width: 220 }}>📧 Historial de Correos</button>
        {/* remito button removed as requested */}
        {/* Botón para generar remitos vacíos para completar manualmente */}
        <button
          className="btn btn-outline"
          style={{ width: 220 }}
          onClick={async () => {
            // remitos vacíos: izquierda = archivo, derecha = entrega
            // Los campos contienen líneas/espacios para poder imprimir y completar a mano.
            const left = {
              tipo: 'archivo',
              title: 'REMITO',
              numero: '',
              fecha: '',
              destino: '______________________________',
              responsables: ['______________________________'],
              items: [
                { nombre: '______________________________', cantidad: '' }
              ],
              qrUrl: ''
            };
            const right = {
              tipo: 'entrega',
              title: 'REMITO DE ENTREGA',
              numero: '',
              fecha: '',
              destino: '______________________________',
              responsables: ['______________________________'],
              items: [
                { nombre: '______________________________', cantidad: '' }
              ],
              qrUrl: ''
            };

            // try to fetch a logo placed in public folder — keep the candidate list minimal to avoid noisy 404/index.html responses
            const logoCandidates = [
              '/logoRemito.png',
              '/logo-principal.png'
            ];
            outer: for (const candidate of logoCandidates) {
              // try both the candidate as-is and the absolute URL with origin
              const toTry = [candidate];
              try {
                if (typeof window !== 'undefined' && window.location && !candidate.startsWith('http')) {
                  toTry.push(window.location.origin + candidate);
                }
              } catch (e) {
                // ignore
              }
              for (const path of toTry) {
                try {
                  const resp = await fetch(path);
                  if (!resp.ok) continue;
                  const ct = (resp.headers.get('content-type') || '').toLowerCase();
                  // only accept image/* responses; the dev server may return index.html (text/html)
                  if (!ct.startsWith('image/')) {
                    // ignore non-image responses quietly to avoid console spam
                    continue;
                  }
                  const blob = await resp.blob();
                  const reader = new FileReader();
                  const dataUrl = await new Promise((resolve, reject) => {
                    reader.onloadend = () => resolve(reader.result);
                    reader.onerror = reject;
                    reader.readAsDataURL(blob);
                  });
                  left.logoDataUrl = dataUrl;
                  right.logoDataUrl = dataUrl;
                  try { console.info('Informe: logo cargado desde', path, ct); } catch (e) {}
                  break outer;
                } catch (e) {
                  // try next
                }
              }
            }

            try {
              if (left.qrUrl) left.qrDataUrl = await generateQrDataUrl(left.qrUrl, { width: 200 });
              if (right.qrUrl) right.qrDataUrl = await generateQrDataUrl(right.qrUrl, { width: 200 });
            } catch (e) {
              // ignore
            }

            const doc = await createRemitoPdf([left, right], { perforationMarginMm: 30 });
            try {
              const blob = doc.output('blob');
              const url = URL.createObjectURL(blob);
              setPreviewUrl(url);
              setShowPreview(true);
            } catch (e) {
              console.warn(e);
            }
          }}
        >
          � Generar remito vacío
        </button>
        {/* Modal de previsualización */}
        {showPreview && (
          <div className="app-modal-overlay" style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999 }} onClick={(e) => { if (e.target === e.currentTarget) { setShowPreview(false); URL.revokeObjectURL(previewUrl); setPreviewUrl(null); } }}>
            <div style={{ width: '90%', height: '90%', background: '#fff', borderRadius: 6, boxShadow: '0 8px 36px rgba(0,0,0,0.3)', position: 'relative', display: 'flex', flexDirection: 'column' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: 8, borderBottom: '1px solid #eee' }}>
                <div style={{ fontWeight: 700 }}>Previsualización de remito</div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button className="btn btn-outline" onClick={() => { if (previewUrl) { const a = document.createElement('a'); a.href = previewUrl; a.download = `remito_preview_${new Date().toISOString().slice(0,10)}.pdf`; a.click(); } }}>Descargar</button>
                  <button className="btn btn-primary" onClick={() => { try { if (iframeRef.current && iframeRef.current.contentWindow) iframeRef.current.contentWindow.print(); } catch (e) { console.warn(e); } }}>Imprimir</button>
                  <button className="btn btn-ghost" onClick={() => { setShowPreview(false); if (previewUrl) { URL.revokeObjectURL(previewUrl); setPreviewUrl(null); } }}>Cerrar</button>
                </div>
              </div>
              <div style={{ flex: 1 }}>
                {previewUrl ? (
                  <iframe ref={iframeRef} src={previewUrl} title="Remito Preview" style={{ width: '100%', height: '100%', border: 'none' }} />
                ) : (
                  <div style={{ padding: 20 }}>Generando preview...</div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
