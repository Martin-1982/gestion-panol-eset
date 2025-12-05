import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import API_BASE_URL from '../config';
import { createRemitoPdf, generateQrDataUrl } from '../utils/pdf';
import { DELETE_CONFIRM_TEXT } from '../constants/messages';

export default function Salida({ onBack }) {
  const [destino, setDestino] = useState('');
  const [areaQuery, setAreaQuery] = useState('');
  const [areaSugerencias, setAreaSugerencias] = useState([]);
  const [areasAll, setAreasAll] = useState([]);
  const [responsable, setResponsable] = useState('');
  const [responsables, setResponsables] = useState([]); // lista opcional de responsables adicionales
  const [cantidad, setCantidad] = useState('');
  const [productoQuery, setProductoQuery] = useState('');
  const [productos, setProductos] = useState([]);
  const [sugerencias, setSugerencias] = useState([]);
  const [productoFocusIndex, setProductoFocusIndex] = useState(-1);
  const [areaFocusIndex, setAreaFocusIndex] = useState(-1);
  const [lista, setLista] = useState([]); // { id: tempId, producto_id, nombre, cantidad }
  const [editIndex, setEditIndex] = useState(null);
  // remito UI removed; keep form simple
  // const [deleteIndexToConfirm, setDeleteIndexToConfirm] = useState(null);
  // const [lowStockConfirm, setLowStockConfirm] = useState(null); // replaced by confirmAction
  const productoInputRef = useRef(null);
  const cantidadRef = useRef(null);
    // unified confirm action: { kind: 'delete'|'lowStock'|'insufficient'|'noStock', index?, prod?, requested?, quedan? }
    const [confirmAction, setConfirmAction] = useState(null);
  // toast abajo-centro (usar mismo estilo que Productos/Proveedores)
  const [toast, setToast] = useState({ visible: false, message: '', type: 'success' });
  const toastTimer = useRef(null);

  const showToast = (message, type = 'success', ms = 1600) => {
    setToast({ visible: true, message, type });
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast({ visible: false, message: '', type: 'success' }), ms);
  };

  useEffect(() => { fetchProductos(); }, []);

  useEffect(() => { fetchAreas(); }, []);

  // Esc escucha global para limpiar formulario y cerrar modales
  useEffect(() => {
    const handler = (e) => {
      if (e.key === 'Escape') {
        clearForm();
      }
    };
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
      setAreaSugerencias(arr.slice(0, 50)); // inicial
    } catch (err) { console.error('Error cargando áreas', err); }
  }

  function onProductoChange(v) {
    setProductoQuery(v);
    setProductoFocusIndex(-1);
    if (!v) return setSugerencias([]);
    const filtro = productos.filter(p => p.nombre.toLowerCase().includes(v.toLowerCase()));
    setSugerencias(filtro.slice(0, 20));
  }

  function seleccionarProducto(p) {
    setProductoQuery(p.nombre);
    setSugerencias([]);
    setProductoFocusIndex(-1);
    // focus cantidad para velocidad
    cantidadRef.current && cantidadRef.current.focus();
  }

  function clearItemInputs() { setCantidad(''); setProductoQuery(''); setSugerencias([]); }

  function clearForm() {
    try {
      setDestino('');
      setAreaQuery('');
      setAreaSugerencias([]);
      setResponsable('');
      setResponsables([]);
      setCantidad('');
      setProductoQuery('');
      setSugerencias([]);
      setProductoFocusIndex(-1);
      setAreaFocusIndex(-1);
      setLista([]);
      setEditIndex(null);
  // remito removed
      setConfirmAction(null);
      // hide toast if visible
      if (toastTimer.current) clearTimeout(toastTimer.current);
      setToast({ visible: false, message: '', type: 'success' });
    } catch (e) {
      // ignore
    }
  }

  // --- Autocomplete para areas/destinos ---
  function onAreaChange(v) {
    setAreaQuery(v);
    setDestino(v);
    setAreaFocusIndex(-1);
    if (!v) { setAreaSugerencias([]); return; }
    // filtrar sugerencias locales (ya cargadas)
    const filtro = areasAll.filter(a => a.toLowerCase().includes(v.toLowerCase()));
    setAreaSugerencias(filtro.slice(0, 20));
  }

  function seleccionarArea(a) {
    setDestino(a);
    setAreaQuery(a);
    setAreaSugerencias([]);
    setAreaFocusIndex(-1);
  }

  // --- navegación por teclado para sugerencias ---
  function onProductoKeyDown(e) {
    if (!sugerencias || sugerencias.length === 0) {
      if (e.key === 'Escape') {
        setProductoQuery(''); setSugerencias([]); setProductoFocusIndex(-1);
      }
      return;
    }

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setProductoFocusIndex(prev => (prev < sugerencias.length - 1 ? prev + 1 : 0));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setProductoFocusIndex(prev => (prev > 0 ? prev - 1 : sugerencias.length - 1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      const idx = productoFocusIndex >= 0 ? productoFocusIndex : 0;
      const sel = sugerencias[idx];
      if (sel) seleccionarProducto(sel);
    } else if (e.key === 'Escape') {
      setProductoQuery(''); setSugerencias([]); setProductoFocusIndex(-1);
    }
  }

  function onAreaKeyDown(e) {
    if (!areaSugerencias || areaSugerencias.length === 0) {
      if (e.key === 'Escape') { setAreaQuery(''); setDestino(''); setAreaSugerencias([]); setAreaFocusIndex(-1); }
      return;
    }
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setAreaFocusIndex(prev => (prev < areaSugerencias.length - 1 ? prev + 1 : 0));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setAreaFocusIndex(prev => (prev > 0 ? prev - 1 : areaSugerencias.length - 1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      const idx = areaFocusIndex >= 0 ? areaFocusIndex : 0;
      const sel = areaSugerencias[idx];
      if (sel) seleccionarArea(sel);
    } else if (e.key === 'Escape') {
      setAreaQuery(''); setDestino(''); setAreaSugerencias([]); setAreaFocusIndex(-1);
    }
  }

  function agregarItem() {
  if (!cantidad || Number(cantidad) <= 0) {
    // eslint-disable-next-line no-alert
    alert('Ingrese cantidad válida');
    return;
  }
  if (!productoQuery) {
    // eslint-disable-next-line no-alert
    alert('Seleccione producto');
    return;
  }
    // buscar producto por nombre
    const prod = productos.find(p => p.nombre === productoQuery) || productos.find(p => String(p.id) === productoQuery);
  if (!prod) {
    // eslint-disable-next-line no-alert
    alert('Producto no válido. Seleccionelo de la lista.');
    return;
  }

    // Validaciones de stock (si el producto tiene campo stock)
    const requested = Number(cantidad);
    if (prod.stock !== undefined) {
      if (prod.stock <= 0) {
        // producto sin stock: mostrar modal visual unificado
        setConfirmAction({ kind: 'noStock', prod, requested });
        return;
      }
      if (requested > prod.stock) {
        // no hay stock suficiente para la cantidad solicitada
        setConfirmAction({ kind: 'insufficient', prod, requested, available: prod.stock });
        return;
      }
      if (prod.minimo !== undefined && (prod.stock - requested) <= prod.minimo) {
          const quedan = prod.stock - requested;
          // abrir modal unificado para confirmar bajo stock
          setConfirmAction({ kind: 'lowStock', prod, requested, quedan });
          return;
        }
    }

    // si no estamos en el flujo de confirmación por bajo stock, hacemos la adición normal
    doAdd(prod, requested);
  }

  function doAdd(prod, requested) {
    if (editIndex !== null) {
      const copy = [...lista];
      copy[editIndex] = { ...copy[editIndex], cantidad: String(requested), nombre: prod.nombre, producto_id: prod.id };
      setLista(copy);
      setEditIndex(null);
      clearItemInputs();
      return;
    }

    const tempId = Date.now();
    setLista(prev => [...prev, { id: tempId, producto_id: prod.id, nombre: prod.nombre, cantidad: String(requested) }]);
    clearItemInputs();
    cantidadRef.current && cantidadRef.current.focus();
  }

  function editarItem(i) {
    const it = lista[i];
    setCantidad(it.cantidad);
    setProductoQuery(it.nombre);
    setEditIndex(i);
  }

  function eliminarItem(i) {
      // Abrir modal de confirmación (unificado)
      setConfirmAction({ kind: 'delete', index: i });
  }

  // cancelarEliminar removed (use setConfirmAction(null) directly when needed)

    function confirmarAction() {
      if (!confirmAction) return;
      const a = confirmAction;
      if (a.kind === 'delete') {
        const i = a.index;
        if (i !== null && i !== undefined) {
          setLista(prev => prev.filter((_, idx) => idx !== i));
        }
      } else if (a.kind === 'lowStock') {
        // proceder con la adición/edición
        if (a.prod && typeof a.requested === 'number') {
          doAdd(a.prod, a.requested);
        }
      }
      // para 'insufficient' y 'noStock' no hacemos la adición (se cierra)
      setConfirmAction(null);
  }

  async function guardarSalida() {
  if (!destino) {
    // eslint-disable-next-line no-alert
    alert('Ingrese destino');
    return;
  }
  if (!responsable && responsables.length === 0) {
    // eslint-disable-next-line no-alert
    alert('Ingrese responsable');
    return;
  }
  if (lista.length === 0) {
    // eslint-disable-next-line no-alert
    alert('Agregue al menos un item');
    return;
  }

    // registrar y guardar la salida directamente
    await confirmarSalidaYGuardar();
  }

  async function confirmarSalidaYGuardar() {
    try {
      const token = localStorage.getItem('token');
      // Guardar la salida en el backend: enviar destino, responsable y items
      const payload = { destino, responsable, responsables, items: lista.map(it => ({ producto_id: it.producto_id, cantidad: Number(it.cantidad), nombre: it.nombre })) };
  const res = await axios.post(`${API_BASE_URL}/api/salidas/bulk`, payload, { headers: { Authorization: `Bearer ${token}` } });
  const salidaId = (res.data && res.data.id) ? res.data.id : Date.now();
  const serverFecha = res.data && res.data.fecha ? res.data.fecha : null;

      // Generar remitos (archivo y entrega) y subirlos al servidor
      try {
        // preparar datos comunes
        const base = {
          // preferir la fecha devuelta por el servidor (formato DD-MM-YYYY) para que los remitos
          // reflejen la fecha real de inserción en la DB; si no está disponible, usar la fecha cliente
          fecha: serverFecha || new Date().toLocaleDateString(),
          destino,
          responsables: responsables.length ? responsables : [responsable],
          items: lista.map(it => ({ nombre: it.nombre, cantidad: Number(it.cantidad) }))
        };

        const leftRemito = { ...base, tipo: 'archivo', numero: `S-${Date.now()}-A` };
        const rightRemito = { ...base, tipo: 'entrega', numero: `S-${Date.now()}-E` };

        // generar QR para ambos remitos (para que los PDFs subidos contengan el QR)
        try {
          leftRemito.qrDataUrl = await generateQrDataUrl(window.location.origin + `/remitos/archivo/${salidaId}`);
        } catch (e) { /* ignore */ }
        try {
          rightRemito.qrDataUrl = await generateQrDataUrl(window.location.origin + `/remitos/entrega/${salidaId}`);
        } catch (e) { /* ignore */ }

        // generar pdfs
        const leftDoc = await createRemitoPdf(leftRemito);
        const rightDoc = await createRemitoPdf(rightRemito);

        const leftBlob = leftDoc.output('blob');
        const rightBlob = rightDoc.output('blob');

        // subir via /api/files/upload
        const uploadFile = async (blob, filename) => {
          const form = new FormData();
          const file = new File([blob], filename, { type: 'application/pdf' });
          form.append('file', file);
          const upl = await fetch(`${API_BASE_URL}/api/files/upload`, {
            method: 'POST',
            headers: { Authorization: `Bearer ${token}` },
            body: form
          });
          if (!upl.ok) throw new Error('Error subiendo remito');
          return await upl.json();
        };

        const leftName = `remito_archivo_${Date.now()}.pdf`;
        const rightName = `remito_entrega_${Date.now()}.pdf`;

        const leftRes = await uploadFile(leftBlob, leftName).catch(e => null);
        const rightRes = await uploadFile(rightBlob, rightName).catch(e => null);

        // emitir evento para que otros componentes puedan refrescar lista de remitos
        try {
          window.dispatchEvent(new CustomEvent('remito:created', { detail: { left: leftRes, right: rightRes, salidaId } }));
        } catch (e) {}
      } catch (e) {
        console.error('Error generando/subiendo remitos:', e);
      }

      // mostrar toast de éxito
      showToast('Salida registrada', 'success');
  // refrescar productos para que el stock calculado se actualice en la UI
      await fetchProductos();
      // limpiar formulario
      clearForm();
    } catch (err) {
      console.error(err);
      const msg = err.response && err.response.data && (err.response.data.error || err.response.data.message) ? (err.response.data.error || err.response.data.message) : 'Error guardando salida';
      showToast(msg, 'error');
    }
  }

  return (
    <div className="main-content">
      <div className="card card-responsive">
        {toast.visible && <div className={`toast${toast.type === 'error' ? ' toast-error' : ''}`}>{toast.message}</div>}
        
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
          <h2 style={{ margin: 0, fontSize: '22px', color: 'var(--primary)', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span>📤</span>
            <span>Registrar Salida</span>
          </h2>
          <button type="button" onClick={onBack} className="btn-outline">⬅ Volver</button>
        </div>

        <div className="form-grid" style={{ marginBottom: '20px' }}>
          {/* Destino/Área */}
          <div className="form-group">
            <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: 600, color: 'var(--gray-700)' }}>Destino / Área *</label>
            <div style={{ position: 'relative' }}>
              <input value={areaQuery} onChange={e => onAreaChange(e.target.value)} onKeyDown={onAreaKeyDown} placeholder="Buscar..." type="text" style={{ width: '100%', padding: '8px 10px', fontSize: '16px' }} />
              {areaSugerencias && areaSugerencias.length > 0 && areaQuery && (
                <div className="autocomplete-list">
                  {areaSugerencias.map((a, idx) => (
                    <div key={idx} className={`autocomplete-item${idx === areaFocusIndex ? ' active' : ''}`} onClick={() => seleccionarArea(a)}>{a}</div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Responsable */}
          <div className="form-group">
            <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: 600, color: 'var(--gray-700)' }}>Responsable *</label>
            <div style={{ display: 'flex', gap: '8px' }}>
              <input value={responsable} onChange={e => setResponsable(e.target.value)} type="text" placeholder="Nombre..." style={{ flex: 1, padding: '8px 10px', fontSize: '16px', minHeight: '44px' }} />
              <button type="button" className="btn-icon" style={{ width: '44px', height: '44px', minHeight: '44px', fontSize: '18px' }} aria-label="Agregar responsable" onClick={() => { if (responsable && responsable.trim()) { setResponsables(prev => [...prev, responsable.trim()]); setResponsable(''); } }}>+</button>
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

          {/* Agregar producto - ocupa 2 columnas */}
          <div className="form-group" style={{ gridColumn: 'span 2' }}>
            <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: 600, color: 'var(--gray-700)' }}>Agregar Producto</label>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-start', flexWrap: 'wrap' }}>
              <input ref={cantidadRef} value={cantidad} onChange={e => setCantidad(e.target.value)} placeholder="Cant." type="number" min="0" style={{ width: '90px', padding: '8px 10px', fontSize: '16px', minHeight: '44px' }} />
              <div style={{ flex: '1 1 200px', position: 'relative' }}>
                <input ref={productoInputRef} value={productoQuery} onChange={e => onProductoChange(e.target.value)} onKeyDown={onProductoKeyDown} placeholder="Buscar producto..." type="text" style={{ width: '100%', padding: '8px 10px', fontSize: '16px', minHeight: '44px' }} />
                {sugerencias.length > 0 && (
                  <div className="autocomplete-list">
                    {sugerencias.map((s, idx) => (
                      <div key={s.id} className={`autocomplete-item${idx === productoFocusIndex ? ' active' : ''}`} onClick={() => seleccionarProducto(s)}>{s.nombre}</div>
                    ))}
                  </div>
                )}
              </div>
              <button type="button" onClick={agregarItem} className="btn-icon" style={{ width: '44px', height: '44px', minHeight: '44px', fontSize: '18px' }} aria-label="Agregar item">✓</button>
            </div>
          </div>

          {/* Lista de items - ocupa 2 columnas */}
          <div style={{ gridColumn: 'span 2' }}>
            <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: 600, color: 'var(--gray-700)' }}>Items Agregados</label>
            {lista.length === 0 && (
              <div style={{ padding: '24px', textAlign: 'center', color: 'var(--gray-500)', background: 'var(--gray-50)', borderRadius: '6px', border: '1px dashed var(--gray-300)', fontSize: '14px' }}>
                No hay items agregados
              </div>
            )}
            
            {lista.length > 0 && (
              <div className="table-container">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th style={{ width: '80px' }}>Cant.</th>
                      <th>Producto</th>
                      <th style={{ width: '100px', textAlign: 'center' }}>Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {lista.map((it, i) => (
                      <tr key={it.id}>
                        <td style={{ fontWeight: 600 }}>{it.cantidad}</td>
                        <td>{it.nombre}</td>
                        <td>
                          <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                            <button onClick={() => editarItem(i)} style={{ padding: '8px 12px', minHeight: '36px', fontSize: '14px', background: 'white', border: '1px solid var(--gray-300)', borderRadius: '4px', cursor: 'pointer' }} aria-label="Editar">✏️</button>
                            <button onClick={() => eliminarItem(i)} style={{ padding: '8px 12px', minHeight: '36px', fontSize: '16px', background: 'white', border: '1px solid var(--gray-300)', borderRadius: '4px', cursor: 'pointer' }} aria-label="Eliminar">×</button>
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

            {confirmAction.kind === 'delete' && (
              <p>{DELETE_CONFIRM_TEXT}</p>
            )}
            {confirmAction.kind === 'lowStock' && (
              <>
                <p>¿Seguro que querés agregar este item a la salida a pesar del stock bajo?</p>
                <p style={{ color: 'var(--gray-600)', fontSize: '14px' }}>Quedan {confirmAction.quedan} unidades después de esta salida.</p>
              </>
            )}
            {confirmAction.kind === 'noStock' && (
              <p>No es posible agregar: este producto no tiene stock disponible.</p>
            )}
            {confirmAction.kind === 'insufficient' && (
              <p>No hay stock suficiente. Disponible: {confirmAction.available} unidades.</p>
            )}

            <div className="form-actions">
              <button type="button" onClick={() => setConfirmAction(null)} className="btn-outline">{confirmAction.kind === 'delete' ? 'Cancelar' : 'Cerrar'}</button>
              {confirmAction.kind === 'delete' && (
                <button type="button" onClick={() => confirmarAction()} className="btn-primary" style={{ background: 'var(--danger)' }}>Eliminar</button>
              )}
              {confirmAction.kind === 'lowStock' && (
                <button type="button" onClick={() => confirmarAction()} className="btn-primary">Continuar</button>
              )}
              {(confirmAction.kind === 'noStock' || confirmAction.kind === 'insufficient') && (
                <button type="button" onClick={() => setConfirmAction(null)} className="btn-primary">Aceptar</button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
