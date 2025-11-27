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
    <div style={{ padding: 20 }}>
      {/* Toast abajo-centro */}
      {toast.visible && (
        <div style={{ position: 'fixed', bottom: '18px', left: '50%', transform: 'translateX(-50%)', background: toast.type === 'error' ? '#c94b4b' : '#2b8a3e', color: '#fff', padding: '10px 14px', borderRadius: '8px', boxShadow: '0 6px 18px rgba(0,0,0,0.12)', zIndex: 3000 }}>
          {toast.message}
        </div>
      )}
      <h2>Registrar Salida</h2>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <div>
          <label style={{ fontSize: 13 }}>Destino / Área</label>
          <div style={{ position: 'relative' }}>
            <input value={areaQuery} onChange={e => onAreaChange(e.target.value)} onKeyDown={onAreaKeyDown} placeholder="Buscar destino/área..." className="compact-field input-full" style={{ padding: '6px 8px', fontSize: 13 }} />
            {areaSugerencias && areaSugerencias.length > 0 && areaQuery && (
              <div className="autocomplete-list" style={{ position: 'absolute', zIndex: 2000, background: '#fff', border: '1px solid #ddd', width: '100%' }}>
                {areaSugerencias.map((a, idx) => (
                  <div key={idx} onClick={() => seleccionarArea(a)} style={{ padding: '6px 8px', cursor: 'pointer', fontSize: 13, background: idx === areaFocusIndex ? '#f0f0f0' : '#fff' }}>{a}</div>
                ))}
              </div>
            )}
          </div>
        </div>
        <div>
          <label style={{ fontSize: 13 }}>Responsable</label>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <input value={responsable} onChange={e => setResponsable(e.target.value)} className="compact-field input-full" style={{ padding: '6px 8px', fontSize: 13 }} />
            <button type="button" className="compact-btn" style={{ padding: '6px 8px' }} onClick={() => { if (responsable && responsable.trim()) { setResponsables(prev => [...prev, responsable.trim()]); setResponsable(''); } }}>Agregar</button>
          </div>
          {responsables.length > 0 && (
            <div style={{ marginTop: 8 }}>
              {responsables.map((r, idx) => (
                <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                  <div style={{ flex: 1, fontSize: 13 }}>{r}</div>
                  <button className="compact-btn" style={{ padding: '4px 8px' }} onClick={() => setResponsables(prev => prev.filter((_, i) => i !== idx))}>Eliminar</button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <input ref={cantidadRef} value={cantidad} onChange={e => setCantidad(e.target.value)} placeholder="Cantidad" className="compact-field" style={{ width: 90, padding: '6px 8px', fontSize: 13 }} />
          <div style={{ position: 'relative', flex: 1 }}>
            <input ref={productoInputRef} value={productoQuery} onChange={e => onProductoChange(e.target.value)} onKeyDown={onProductoKeyDown} placeholder="Buscar producto..." className="compact-field input-full" style={{ padding: '6px 8px', fontSize: 13 }} />
            {sugerencias.length > 0 && (
              <div className="autocomplete-list" style={{ position: 'absolute', zIndex: 2000, background: '#fff', border: '1px solid #ddd', width: '100%' }}>
                {sugerencias.map((s, idx) => (
                  <div key={s.id} onClick={() => seleccionarProducto(s)} style={{ padding: '6px 8px', cursor: 'pointer', fontSize: 13, background: idx === productoFocusIndex ? '#f0f0f0' : '#fff' }}>{s.nombre}</div>
                ))}
              </div>
            )}
          </div>
          <button type="button" onClick={agregarItem} className="compact-btn">✔️</button>
        </div>

        <div style={{ gridColumn: '1 / -1' }}>
          <label style={{ fontSize: 13 }}>Lista de items</label>
          <div style={{ border: '1px solid #eee', padding: 6, minHeight: 70, fontSize: 13 }}>
            {lista.length === 0 && <div style={{ color: '#666' }}>No hay items agregados</div>}

            {/* Encabezado: Cant. | Producto/Descripción */}
            <div style={{ display: 'flex', alignItems: 'center', padding: '6px 4px', borderBottom: '1px solid #f9f9f9', fontSize: 13, fontWeight: 600 }}>
              <div style={{ width: 80, textAlign: 'left' }}>Cant.</div>
              <div style={{ width: 24, textAlign: 'center', color: '#666' }}>|</div>
              <div style={{ flex: 1, paddingLeft: 8, textAlign: 'left' }}>Producto / Descripción</div>
            </div>

            {lista.map((it, i) => (
              <div key={it.id} style={{ display: 'flex', alignItems: 'center', padding: '6px 4px', borderBottom: '1px solid #f1f1f1', fontSize: 13 }}>
                <div style={{ width: 80, fontWeight: 600, textAlign: 'left' }}>{it.cantidad}</div>
                <div style={{ width: 24, textAlign: 'center', color: '#333', padding: '0 6px' }}>|</div>
                <div style={{ overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis', flex: 1, textAlign: 'left' }}>{it.nombre}</div>
                <div style={{ display: 'flex', gap: 6, marginLeft: 8 }}>
                  <button onClick={() => editarItem(i)} className="compact-btn" style={{ padding: '2px 6px', fontSize: 12, lineHeight: '16px' }}>✏️</button>
                  <button onClick={() => eliminarItem(i)} className="compact-btn" style={{ padding: '2px 6px', fontSize: 12, lineHeight: '16px' }}>❌</button>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div style={{ gridColumn: '1 / -1', display: 'flex', justifyContent: 'center', gap: 8, marginTop: 24 }}>
          <button onClick={guardarSalida} className="btn-primary">Guardar salida</button>
          <button onClick={onBack} className="btn-outline">Volver</button>
        </div>
      </div>

      {/* remito modal removed */}
      {/* Modal unificado para confirmaciones (eliminar / bajo stock / insuficiente / sin stock) */}
      {confirmAction !== null && (
        <div className="app-modal-overlay" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={(e) => { if (e.target === e.currentTarget) setConfirmAction(null); }}>
          <div style={{ background: '#fff', padding: 12, borderRadius: 8, width: 360, maxWidth: '90%', boxShadow: '0 6px 18px rgba(0,0,0,0.12)' }}>
            <div style={{ fontSize: 14, marginBottom: 8, color: '#111' }}>
              {confirmAction.kind === 'delete' && 'Eliminar item'}
              {confirmAction.kind === 'lowStock' && 'Stock bajo'}
              {confirmAction.kind === 'noStock' && 'Sin stock'}
              {confirmAction.kind === 'insufficient' && 'Stock insuficiente'}
            </div>

            <div style={{ fontSize: 13, color: '#333', marginBottom: 8 }}>
              {confirmAction.kind === 'delete' && DELETE_CONFIRM_TEXT}
              {confirmAction.kind === 'lowStock' && '¿Seguro que querés agregar este item a la salida a pesar del stock bajo?'}
              {confirmAction.kind === 'noStock' && 'No es posible agregar: este producto no tiene stock disponible.'}
              {confirmAction.kind === 'insufficient' && `No hay stock suficiente (disponible: ${confirmAction.available}).`}
            </div>

            {confirmAction.kind === 'lowStock' && (
              <div style={{ fontSize: 12, color: '#666', marginBottom: 12 }}>Quedan {confirmAction.quedan} unidades.</div>
            )}

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
              {/* boton secundario */}
              <button onClick={() => setConfirmAction(null)} className="compact-btn" style={{ padding: '6px 10px', background: '#f5f5f5' }}>{confirmAction.kind === 'delete' ? 'Cancelar' : 'Cerrar'}</button>

              {/* botones primarios por tipo */}
              {confirmAction.kind === 'delete' && (
                <button onClick={() => confirmarAction()} className="compact-btn" style={{ padding: '6px 10px', background: '#d9534f', color: '#fff' }}>Eliminar</button>
              )}

              {confirmAction.kind === 'lowStock' && (
                <button onClick={() => confirmarAction()} className="compact-btn" style={{ padding: '6px 10px', background: '#2b8a3e', color: '#fff' }}>Continuar</button>
              )}

              {confirmAction.kind === 'noStock' && (
                <button onClick={() => setConfirmAction(null)} className="compact-btn" style={{ padding: '6px 10px', background: '#2b8a3e', color: '#fff' }}>Aceptar</button>
              )}

              {confirmAction.kind === 'insufficient' && (
                <button onClick={() => setConfirmAction(null)} className="compact-btn" style={{ padding: '6px 10px', background: '#2b8a3e', color: '#fff' }}>Aceptar</button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
