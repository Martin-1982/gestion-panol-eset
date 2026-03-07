import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import API_BASE_URL from '../config';
import { createRemitoPdf, generateQrDataUrl } from '../utils/pdf';
import { DELETE_CONFIRM_TEXT } from '../constants/messages';
import { useToast, ToastMessage } from './useToast';

export default function Salida({ onBack }) {
  const { toast, showToast } = useToast();

  const [destino, setDestino] = useState('');
  const [areaQuery, setAreaQuery] = useState('');
  const [areaSugerencias, setAreaSugerencias] = useState([]);
  const [areasAll, setAreasAll] = useState([]);
  const [responsable, setResponsable] = useState('');
  const [responsables, setResponsables] = useState([]);
  const [cantidad, setCantidad] = useState('');
  const [productoQuery, setProductoQuery] = useState('');
  const [productos, setProductos] = useState([]);
  const [sugerencias, setSugerencias] = useState([]);
  const [productoFocusIndex, setProductoFocusIndex] = useState(-1);
  const [areaFocusIndex, setAreaFocusIndex] = useState(-1);
  const [lista, setLista] = useState([]);
  const [editIndex, setEditIndex] = useState(null);
  const [confirmAction, setConfirmAction] = useState(null);
  const productoInputRef = useRef(null);
  const cantidadRef = useRef(null);

  useEffect(() => { fetchProductos(); }, []);
  useEffect(() => { fetchAreas(); }, []);

  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') clearForm(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  async function fetchProductos() {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get(`${API_BASE_URL}/api/productos`, { headers: { Authorization: `Bearer ${token}` } });
      setProductos(res.data || []);
    } catch (err) { console.error(err); }
  }

  async function fetchAreas() {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get(`${API_BASE_URL}/api/salidas/areas`, { headers: { Authorization: `Bearer ${token}` } });
      const arr = res.data || [];
      setAreasAll(arr);
      setAreaSugerencias(arr.slice(0, 50));
    } catch (err) { console.error('Error cargando áreas', err); }
  }

  function onProductoChange(v) {
    setProductoQuery(v);
    setProductoFocusIndex(-1);
    if (!v) return setSugerencias([]);
    setSugerencias(productos.filter(p => p.nombre.toLowerCase().includes(v.toLowerCase())).slice(0, 20));
  }

  function seleccionarProducto(p) {
    setProductoQuery(p.nombre);
    setSugerencias([]);
    setProductoFocusIndex(-1);
    cantidadRef.current && cantidadRef.current.focus();
  }

  function clearItemInputs() { setCantidad(''); setProductoQuery(''); setSugerencias([]); }

  function clearForm() {
    try {
      setDestino(''); setAreaQuery(''); setAreaSugerencias([]);
      setResponsable(''); setResponsables([]);
      setCantidad(''); setProductoQuery(''); setSugerencias([]);
      setProductoFocusIndex(-1); setAreaFocusIndex(-1);
      setLista([]); setEditIndex(null); setConfirmAction(null);
    } catch (e) {}
  }

  function onAreaChange(v) {
    setAreaQuery(v); setDestino(v); setAreaFocusIndex(-1);
    if (!v) { setAreaSugerencias([]); return; }
    setAreaSugerencias(areasAll.filter(a => a.toLowerCase().includes(v.toLowerCase())).slice(0, 20));
  }

  function seleccionarArea(a) {
    setDestino(a); setAreaQuery(a); setAreaSugerencias([]); setAreaFocusIndex(-1);
  }

  function onProductoKeyDown(e) {
    if (!sugerencias || sugerencias.length === 0) {
      if (e.key === 'Escape') { setProductoQuery(''); setSugerencias([]); setProductoFocusIndex(-1); }
      return;
    }
    if (e.key === 'ArrowDown') { e.preventDefault(); setProductoFocusIndex(prev => (prev < sugerencias.length - 1 ? prev + 1 : 0)); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setProductoFocusIndex(prev => (prev > 0 ? prev - 1 : sugerencias.length - 1)); }
    else if (e.key === 'Enter') { e.preventDefault(); const sel = sugerencias[productoFocusIndex >= 0 ? productoFocusIndex : 0]; if (sel) seleccionarProducto(sel); }
    else if (e.key === 'Escape') { setProductoQuery(''); setSugerencias([]); setProductoFocusIndex(-1); }
  }

  function onAreaKeyDown(e) {
    if (!areaSugerencias || areaSugerencias.length === 0) {
      if (e.key === 'Escape') { setAreaQuery(''); setDestino(''); setAreaSugerencias([]); setAreaFocusIndex(-1); }
      return;
    }
    if (e.key === 'ArrowDown') { e.preventDefault(); setAreaFocusIndex(prev => (prev < areaSugerencias.length - 1 ? prev + 1 : 0)); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setAreaFocusIndex(prev => (prev > 0 ? prev - 1 : areaSugerencias.length - 1)); }
    else if (e.key === 'Enter') { e.preventDefault(); const sel = areaSugerencias[areaFocusIndex >= 0 ? areaFocusIndex : 0]; if (sel) seleccionarArea(sel); }
    else if (e.key === 'Escape') { setAreaQuery(''); setDestino(''); setAreaSugerencias([]); setAreaFocusIndex(-1); }
  }

  function agregarItem() {
    if (!cantidad || Number(cantidad) <= 0) { alert('Ingrese cantidad válida'); return; }
    if (!productoQuery) { alert('Seleccione producto'); return; }
    const prod = productos.find(p => p.nombre === productoQuery) || productos.find(p => String(p.id) === productoQuery);
    if (!prod) { alert('Producto no válido. Seleccionelo de la lista.'); return; }
    const requested = Number(cantidad);
    if (prod.stock !== undefined) {
      if (prod.stock <= 0) { setConfirmAction({ kind: 'noStock', prod, requested }); return; }
      if (requested > prod.stock) { setConfirmAction({ kind: 'insufficient', prod, requested, available: prod.stock }); return; }
      if (prod.minimo !== undefined && (prod.stock - requested) <= prod.minimo) {
        setConfirmAction({ kind: 'lowStock', prod, requested, quedan: prod.stock - requested }); return;
      }
    }
    doAdd(prod, requested);
  }

  function doAdd(prod, requested) {
    if (editIndex !== null) {
      const copy = [...lista];
      copy[editIndex] = { ...copy[editIndex], cantidad: String(requested), nombre: prod.nombre, producto_id: prod.id };
      setLista(copy); setEditIndex(null); clearItemInputs(); return;
    }
    setLista(prev => [...prev, { id: Date.now(), producto_id: prod.id, nombre: prod.nombre, cantidad: String(requested) }]);
    clearItemInputs();
    cantidadRef.current && cantidadRef.current.focus();
  }

  function editarItem(i) { const it = lista[i]; setCantidad(it.cantidad); setProductoQuery(it.nombre); setEditIndex(i); }
  function eliminarItem(i) { setConfirmAction({ kind: 'delete', index: i }); }

  function confirmarAction() {
    if (!confirmAction) return;
    const a = confirmAction;
    if (a.kind === 'delete' && a.index !== null && a.index !== undefined) {
      setLista(prev => prev.filter((_, idx) => idx !== a.index));
    } else if (a.kind === 'lowStock' && a.prod && typeof a.requested === 'number') {
      doAdd(a.prod, a.requested);
    }
    setConfirmAction(null);
  }

  async function guardarSalida() {
    if (!destino) { alert('Ingrese destino'); return; }
    if (!responsable && responsables.length === 0) { alert('Ingrese responsable'); return; }
    if (lista.length === 0) { alert('Agregue al menos un item'); return; }
    await confirmarSalidaYGuardar();
  }

  async function confirmarSalidaYGuardar() {
    try {
      const token = localStorage.getItem('token');
      const payload = { destino, responsable, responsables, items: lista.map(it => ({ producto_id: it.producto_id, cantidad: Number(it.cantidad), nombre: it.nombre })) };
      const res = await axios.post(`${API_BASE_URL}/api/salidas/bulk`, payload, { headers: { Authorization: `Bearer ${token}` } });
      const salidaId = (res.data && res.data.id) ? res.data.id : Date.now();
      const serverFecha = res.data && res.data.fecha ? res.data.fecha : null;

      try {
        const base = {
          fecha: serverFecha || new Date().toLocaleDateString(),
          destino,
          responsables: responsables.length ? responsables : [responsable],
          items: lista.map(it => ({ nombre: it.nombre, cantidad: Number(it.cantidad) }))
        };
        const leftRemito = { ...base, tipo: 'archivo', numero: `S-${Date.now()}-A` };
        const rightRemito = { ...base, tipo: 'entrega', numero: `S-${Date.now()}-E` };
        try { leftRemito.qrDataUrl = await generateQrDataUrl(window.location.origin + `/remitos/archivo/${salidaId}`); } catch (e) {}
        try { rightRemito.qrDataUrl = await generateQrDataUrl(window.location.origin + `/remitos/entrega/${salidaId}`); } catch (e) {}
        const leftDoc = await createRemitoPdf(leftRemito);
        const rightDoc = await createRemitoPdf(rightRemito);
        const uploadFile = async (blob, filename) => {
          const form = new FormData();
          form.append('file', new File([blob], filename, { type: 'application/pdf' }));
          const upl = await fetch(`${API_BASE_URL}/api/files/upload`, { method: 'POST', headers: { Authorization: `Bearer ${token}` }, body: form });
          if (!upl.ok) throw new Error('Error subiendo remito');
          return await upl.json();
        };
        const leftRes = await uploadFile(leftDoc.output('blob'), `remito_archivo_${Date.now()}.pdf`).catch(() => null);
        const rightRes = await uploadFile(rightDoc.output('blob'), `remito_entrega_${Date.now()}.pdf`).catch(() => null);
        try { window.dispatchEvent(new CustomEvent('remito:created', { detail: { left: leftRes, right: rightRes, salidaId } })); } catch (e) {}
      } catch (e) { console.error('Error generando/subiendo remitos:', e); }

      showToast('Salida registrada', 'success');
      await fetchProductos();
      clearForm();
    } catch (err) {
      console.error(err);
      const msg = err.response?.data?.error || err.response?.data?.message || 'Error guardando salida';
      showToast(msg, 'error');
    }
  }

  return (
    <div className="main-content">
      <div className="card card-responsive">
        <ToastMessage toast={toast} />

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
          <h2 style={{ margin: 0, fontSize: '22px', color: 'var(--primary)', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span>📤</span><span>Registrar Salida</span>
          </h2>
          <button type="button" onClick={onBack} className="btn-outline">⬅ Volver</button>
        </div>

        <div className="form-grid" style={{ marginBottom: '20px' }}>
          <div className="form-group form-group-full">
            <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: 600, color: 'var(--gray-700)' }}>Destino / Área *</label>
            <div style={{ position: 'relative' }}>
              <input value={areaQuery} onChange={e => onAreaChange(e.target.value)} onKeyDown={onAreaKeyDown} placeholder="Buscar..." type="text" style={{ width: '100%', padding: '10px 12px', fontSize: '16px', minHeight: '44px' }} />
              {areaSugerencias && areaSugerencias.length > 0 && areaQuery && (
                <div className="autocomplete-list">
                  {areaSugerencias.map((a, idx) => (
                    <div key={idx} className={`autocomplete-item${idx === areaFocusIndex ? ' active' : ''}`} onClick={() => seleccionarArea(a)}>{a}</div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="form-group form-group-full">
            <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: 600, color: 'var(--gray-700)' }}>Responsable *</label>
            <div style={{ display: 'flex', gap: '8px' }}>
              <input value={responsable} onChange={e => setResponsable(e.target.value)} type="text" placeholder="Nombre..." style={{ flex: 1, padding: '10px 12px', fontSize: '16px', minHeight: '44px' }} />
              <button type="button" className="btn-icon" style={{ width: '44px', height: '44px', minHeight: '44px', fontSize: '20px', flexShrink: 0 }} aria-label="Agregar responsable" onClick={() => { if (responsable && responsable.trim()) { setResponsables(prev => [...prev, responsable.trim()]); setResponsable(''); } }}>+</button>
            </div>
            {responsables.length > 0 && (
              <div style={{ marginTop: '10px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {responsables.map((r, idx) => (
                  <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 12px', background: 'var(--gray-100)', borderRadius: '4px', fontSize: '14px', minHeight: '40px' }}>
                    <span>{r}</span>
                    <button type="button" style={{ padding: '4px 10px', fontSize: '12px', background: 'white', border: '1px solid var(--gray-300)', borderRadius: '3px', cursor: 'pointer', minHeight: '32px' }} onClick={() => setResponsables(prev => prev.filter((_, i) => i !== idx))}>×</button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="form-group" style={{ gridColumn: 'span 2' }}>
            <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: 600, color: 'var(--gray-700)' }}>Agregar Producto</label>
            <div className="producto-add-container">
              <input ref={cantidadRef} value={cantidad} onChange={e => setCantidad(e.target.value)} placeholder="Cant." type="number" min="0" style={{ width: '80px', padding: '10px 12px', fontSize: '16px', minHeight: '44px', flexShrink: 0 }} />
              <div style={{ flex: '1 1 auto', position: 'relative', minWidth: '150px' }}>
                <input ref={productoInputRef} value={productoQuery} onChange={e => onProductoChange(e.target.value)} onKeyDown={onProductoKeyDown} placeholder="Buscar producto..." type="text" style={{ width: '100%', padding: '10px 12px', fontSize: '16px', minHeight: '44px' }} />
                {sugerencias.length > 0 && (
                  <div className="autocomplete-list">
                    {sugerencias.map((s, idx) => (
                      <div key={s.id} className={`autocomplete-item${idx === productoFocusIndex ? ' active' : ''}`} onClick={() => seleccionarProducto(s)}>{s.nombre}</div>
                    ))}
                  </div>
                )}
              </div>
              <button type="button" onClick={agregarItem} className="btn-primary" style={{ width: '50px', height: '44px', minHeight: '44px', fontSize: '20px', padding: '0', flexShrink: 0 }} aria-label="Agregar item">✓</button>
            </div>
          </div>

          <div style={{ gridColumn: 'span 2' }}>
            <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: 600, color: 'var(--gray-700)' }}>Items Agregados</label>
            {lista.length === 0 ? (
              <div style={{ padding: '24px', textAlign: 'center', color: 'var(--gray-500)', background: 'var(--gray-50)', borderRadius: '6px', border: '1px dashed var(--gray-300)', fontSize: '14px' }}>No hay items agregados</div>
            ) : (
              <div className="table-container">
                <table className="data-table">
                  <thead><tr><th style={{ width: '80px' }}>Cant.</th><th>Producto</th><th style={{ width: '100px', textAlign: 'center' }}>Acciones</th></tr></thead>
                  <tbody>
                    {lista.map((it, i) => (
                      <tr key={it.id}>
                        <td style={{ fontWeight: 600 }}>{it.cantidad}</td>
                        <td>{it.nombre}</td>
                        <td>
                          <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                            <button onClick={() => editarItem(i)} style={{ padding: '8px 12px', minHeight: '36px', fontSize: '14px', background: 'white', border: '1px solid var(--gray-300)', borderRadius: '4px', cursor: 'pointer' }}>✏️</button>
                            <button onClick={() => eliminarItem(i)} style={{ padding: '8px 12px', minHeight: '36px', fontSize: '16px', background: 'white', border: '1px solid var(--gray-300)', borderRadius: '4px', cursor: 'pointer' }}>×</button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        <div style={{ borderTop: '1px solid var(--gray-200)', paddingTop: '16px', display: 'flex', justifyContent: 'flex-end', gap: '10px', flexWrap: 'wrap' }}>
          <button type="button" onClick={onBack} className="btn-outline">Cancelar</button>
          <button type="button" onClick={guardarSalida} className="btn-primary">💾 Guardar Salida</button>
        </div>
      </div>

      {confirmAction !== null && (
        <div className="modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) setConfirmAction(null); }}>
          <div className="modal-content" role="dialog" aria-modal="true">
            <h3>
              {confirmAction.kind === 'delete' && '❌ Eliminar Item'}
              {confirmAction.kind === 'lowStock' && '⚠️ Stock Bajo'}
              {confirmAction.kind === 'noStock' && '⛔ Sin Stock'}
              {confirmAction.kind === 'insufficient' && '⚠️ Stock Insuficiente'}
            </h3>
            {confirmAction.kind === 'delete' && <p>{DELETE_CONFIRM_TEXT}</p>}
            {confirmAction.kind === 'lowStock' && (<><p>¿Seguro que querés agregar este item a pesar del stock bajo?</p><p style={{ color: 'var(--gray-600)', fontSize: '14px' }}>Quedan {confirmAction.quedan} unidades después de esta salida.</p></>)}
            {confirmAction.kind === 'noStock' && <p>No es posible agregar: este producto no tiene stock disponible.</p>}
            {confirmAction.kind === 'insufficient' && <p>No hay stock suficiente. Disponible: {confirmAction.available} unidades.</p>}
            <div className="form-actions">
              <button type="button" onClick={() => setConfirmAction(null)} className="btn-outline">{confirmAction.kind === 'delete' ? 'Cancelar' : 'Cerrar'}</button>
              {confirmAction.kind === 'delete' && <button type="button" onClick={confirmarAction} className="btn-primary" style={{ background: 'var(--danger)' }}>Eliminar</button>}
              {confirmAction.kind === 'lowStock' && <button type="button" onClick={confirmarAction} className="btn-primary">Continuar</button>}
              {(confirmAction.kind === 'noStock' || confirmAction.kind === 'insufficient') && <button type="button" onClick={() => setConfirmAction(null)} className="btn-primary">Aceptar</button>}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
