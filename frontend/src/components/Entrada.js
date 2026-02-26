import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import API_BASE_URL from '../config';

export default function Entrada({ onBack }) {
  const [formData, setFormData] = useState({ producto_id: "", cantidad: "", costo: "", donacion: false, proveedor_id: "", fechaVencimiento: "", procedenciaDonacion: "" });
  const [productos, setProductos] = useState([]);
  const [productQuery, setProductQuery] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const productInputRef = useRef(null);

  const [proveedores, setProveedores] = useState([]);
  const [providerQuery, setProviderQuery] = useState("");
  const [showProvSuggestions, setShowProvSuggestions] = useState(false);
  const [provHighlightedIndex, setProvHighlightedIndex] = useState(-1);
  const providerInputRef = useRef(null);

  const [showAddProducto, setShowAddProducto] = useState(false);
  const [showAddProveedor, setShowAddProveedor] = useState(false);

  const [newProducto, setNewProducto] = useState({ nombre: "", tipo: "", presentacion: "", unidad: "", minimo: "", unidadCustom: "", categoria: "", subcategoria: "" });
  const [categorias, setCategorias] = useState([]);
  const [subcategorias, setSubcategorias] = useState([]);
  const [categoriaSuggestions, setCategoriaSuggestions] = useState([]);
  const [subcategoriaSuggestions, setSubcategoriaSuggestions] = useState([]);
  const newProdNombreRef = useRef(null);
  const newProdCategoriaRef = useRef(null);
  const newProdSubcategoriaRef = useRef(null);
  const [categoriaHighlightedIndex, setCategoriaHighlightedIndex] = useState(-1);
  const [subcategoriaHighlightedIndex, setSubcategoriaHighlightedIndex] = useState(-1);

  const [newProveedor, setNewProveedor] = useState({ nombre: "", direccion: "", telefono: "", email: "", contacto: "" });
  const proveedorNombreRef = useRef(null);

  const [toast, setToast] = useState({ visible: false, message: "", type: "success" });
  const toastTimer = useRef(null);

  useEffect(() => {
    fetchProductos();
    fetchProveedores();
    return () => { if (toastTimer.current) clearTimeout(toastTimer.current); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const cats = [...new Set(productos.map(p => p.categoria).filter(Boolean))];
    const subs = [...new Set(productos.map(p => p.subcategoria).filter(Boolean))];
    setCategorias(cats);
    setSubcategorias(subs);
  }, [productos]);

  const showToast = (message, type = "success", ms = 1600) => {
    setToast({ visible: true, message, type });
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast({ visible: false, message: "", type: "success" }), ms);
  };

  async function fetchProductos() {
    try {
      const token = localStorage.getItem("token");
      const res = await axios.get(`${API_BASE_URL}/api/productos`, { headers: { Authorization: `Bearer ${token}` } });
      setProductos(res.data || []);
    } catch (err) { console.error(err); showToast('Error cargando productos','error'); }
  }

  async function fetchProveedores() {
    try {
      const token = localStorage.getItem("token");
      const res = await axios.get(`${API_BASE_URL}/api/proveedores`, { headers: { Authorization: `Bearer ${token}` } });
      setProveedores(res.data || []);
    } catch (err) { console.error(err); showToast('Error cargando proveedores','error'); }
  }

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    // comportamiento especial para el checkbox de donación
    if (name === 'donacion') {
      if (checked) {
        // al tildar: activar donación, limpiar y deshabilitar proveedor y costo
        setFormData(prev => ({ ...prev, donacion: true, proveedor_id: '', costo: '', procedenciaDonacion: '' }));
        setProviderQuery('');
        setShowProvSuggestions(false);
      } else {
        // al destildar: desactivar donación, limpiar procedencia y permitir proveedor/costo
        setFormData(prev => ({ ...prev, donacion: false, procedenciaDonacion: '' }));
      }
      return;
    }
    setFormData(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.producto_id) return showToast('Seleccione producto','error');
    if (!formData.cantidad || Number(formData.cantidad) <= 0) return showToast('Cantidad inválida','error');
    if (!formData.donacion && !formData.proveedor_id) return showToast('Seleccione proveedor o marque donación','error');
    if (formData.donacion && !formData.procedenciaDonacion) return showToast('Indique procedencia','error');
    try {
      const token = localStorage.getItem('token');
      const payload = { producto_id: formData.producto_id, usuario_id: 1, proveedor_id: formData.proveedor_id || null, cantidad: Number(formData.cantidad), costo: formData.costo ? Number(formData.costo) : null, donacion: formData.donacion, procedencia: formData.procedenciaDonacion || null, vencimiento: formData.fechaVencimiento || null };
      await axios.post(`${API_BASE_URL}/api/entradas`, payload, { headers: { Authorization: `Bearer ${token}` } });
      showToast('Entrada registrada','success');
      // limpiar formulario
      setFormData({ producto_id: '', cantidad: '', costo: '', donacion: false, proveedor_id: '', fechaVencimiento: '', procedenciaDonacion: '' });
      setProductQuery(''); setProviderQuery(''); setShowSuggestions(false); setShowProvSuggestions(false);
    } catch (err) {
      console.error(err);
      const msg = (err.response && err.response.data && (err.response.data.error || err.response.data.message)) || err.message || 'Error guardando entrada';
      showToast(msg,'error');
    }
  };

  const handleAddProducto = async () => {
    if (!newProducto.nombre) return showToast('Nombre requerido','error');
    try {
      const token = localStorage.getItem('token');
      const payloadProducto = { ...newProducto, unidad: newProducto.unidad === 'otro' ? (newProducto.unidadCustom || '') : newProducto.unidad };
      const res = await axios.post(`${API_BASE_URL}/api/productos`, payloadProducto, { headers: { Authorization: `Bearer ${token}` } });
      setProductos(p => [...p, res.data]);
      setShowAddProducto(false);
      setNewProducto({ nombre: '', tipo: '', presentacion: '', unidad: '', minimo: '', unidadCustom: '', categoria: '', subcategoria: '' });
      setCategoriaSuggestions([]); setSubcategoriaSuggestions([]); setCategoriaHighlightedIndex(-1); setSubcategoriaHighlightedIndex(-1);
      setTimeout(()=>newProdNombreRef.current && newProdNombreRef.current.focus(), 50);
      showToast('Producto agregado','success');
    } catch (err) { console.error(err); const msg = (err.response && err.response.data && (err.response.data.error || err.response.data.message)) || err.message || 'Error al agregar producto'; showToast(msg,'error'); }
  };

  const handleAddProveedor = async () => {
    if (!newProveedor.nombre) return showToast('Nombre requerido','error');
    try {
      const token = localStorage.getItem('token');
      const res = await axios.post(`${API_BASE_URL}/api/proveedores`, newProveedor, { headers: { Authorization: `Bearer ${token}` } });
      setProveedores(p => [...p, res.data]);
      setShowAddProveedor(false);
      setNewProveedor({ nombre: '', direccion: '', telefono: '', email: '', contacto: '' });
      setTimeout(()=>proveedorNombreRef.current && proveedorNombreRef.current.focus(), 50);
      showToast('Proveedor agregado','success');
    } catch (err) { console.error(err); const msg = (err.response && err.response.data && (err.response.data.error || err.response.data.message)) || err.message || 'Error al agregar proveedor'; showToast(msg,'error'); }
  };

  // Esc para limpiar formulario y cerrar modales
  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === 'Escape') {
        // limpiar formulario principal
        setFormData({ producto_id: '', cantidad: '', costo: '', donacion: false, proveedor_id: '', fechaVencimiento: '', procedenciaDonacion: '' });
        setProductQuery(''); setProviderQuery(''); setShowSuggestions(false); setShowProvSuggestions(false);
        // cerrar modales y limpiar
        if (showAddProducto) { setShowAddProducto(false); setNewProducto({ nombre: '', tipo: '', presentacion: '', unidad: '', minimo: '', unidadCustom: '', categoria: '', subcategoria: '' }); setCategoriaSuggestions([]); setSubcategoriaSuggestions([]); }
        if (showAddProveedor) { setShowAddProveedor(false); setNewProveedor({ nombre: '', direccion: '', telefono: '', email: '', contacto: '' }); }
      }
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [showAddProducto, showAddProveedor]);

  // filtered helpers
  const filteredProducts = productos.filter(p => p.nombre.toLowerCase().includes(productQuery.toLowerCase()));
  const filteredProvs = proveedores.filter(p => p.nombre.toLowerCase().includes(providerQuery.toLowerCase()));

  return (
    <div className="main-content">
      <div className="card card-responsive">
        {/* Toast */}
        {toast.visible && (
          <div className="toast" style={{ background: toast.type === 'error' ? 'var(--danger)' : 'var(--success)', color: 'white', position: 'fixed', bottom: 20, left: '50%', transform: 'translateX(-50%)', zIndex: 3000 }}>{toast.message}</div>
        )}

        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h2 style={{ margin: 0, fontSize: '22px', color: 'var(--primary)', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span>📥</span>
            <span>Registrar Entrada</span>
          </h2>
          <button type="button" onClick={onBack} className="btn-outline">⬅ Volver</button>
        </div>

        <form onSubmit={handleSubmit} autoComplete="off">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px', marginBottom: '20px' }}>
            
            {/* Producto */}
            <div>
              <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: 600, color: 'var(--gray-700)' }}>Producto *</label>
              <div style={{ display: 'flex', gap: '8px' }}>
                <div style={{ flex: 1, position: 'relative' }}>
                  <input
                    ref={productInputRef}
                    type="text"
                    placeholder="Buscar..."
                    value={productQuery}
                    onChange={(e) => { setProductQuery(e.target.value); setShowSuggestions(true); setHighlightedIndex(-1); setFormData(prev => ({ ...prev, producto_id: '' })); }}
                    onFocus={() => setShowSuggestions(true)}
                    onKeyDown={(e) => {
                      if (e.key === 'ArrowDown') { e.preventDefault(); setHighlightedIndex(i => Math.min(i + 1, filteredProducts.length - 1)); }
                      else if (e.key === 'ArrowUp') { e.preventDefault(); setHighlightedIndex(i => Math.max(i - 1, 0)); }
                      else if (e.key === 'Enter') { e.preventDefault(); if (highlightedIndex >= 0 && filteredProducts[highlightedIndex]) { const sel = filteredProducts[highlightedIndex]; setFormData(prev => ({ ...prev, producto_id: sel.id })); setProductQuery(sel.nombre); setShowSuggestions(false); } }
                      else if (e.key === 'Escape') { setShowSuggestions(false); }
                    }}
                    style={{ width: '100%', padding: '8px 10px', fontSize: '14px' }}
                  />
                  {showSuggestions && productQuery !== '' && (
                    <div className="autocomplete-list">
                      {filteredProducts.slice(0, 20).map((p, idx) => (
                        <div key={p.id} className={`autocomplete-item${idx === highlightedIndex ? ' active' : ''}`} onMouseDown={(ev) => ev.preventDefault()} onClick={() => { setFormData(prev => ({ ...prev, producto_id: p.id })); setProductQuery(p.nombre); setShowSuggestions(false); }}>{p.nombre}</div>
                      ))}
                      {filteredProducts.length === 0 && <div className="autocomplete-item muted">No se encontraron productos</div>}
                    </div>
                  )}
                </div>
                <button type="button" onClick={() => { setShowAddProducto(true); setTimeout(() => newProdNombreRef.current && newProdNombreRef.current.focus(), 60); }} className="btn-icon" style={{ width: '36px', height: '36px', fontSize: '16px' }} aria-label="Agregar producto">+</button>
              </div>
            </div>

            {/* Cantidad */}
            <div>
              <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: 600, color: 'var(--gray-700)' }}>Cantidad *</label>
              <input name="cantidad" value={formData.cantidad} onChange={handleChange} type="number" min="0" style={{ width: '100%', padding: '8px 10px', fontSize: '14px' }} />
            </div>

            {/* Proveedor */}
            <div>
              <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: 600, color: 'var(--gray-700)' }}>Proveedor</label>
              <div style={{ display: 'flex', gap: '8px' }}>
                <div style={{ flex: 1, position: 'relative' }}>
                  <input
                    ref={providerInputRef}
                    type="text"
                    placeholder="Buscar..."
                    value={providerQuery}
                    onChange={(e) => { setProviderQuery(e.target.value); setShowProvSuggestions(true); setProvHighlightedIndex(-1); setFormData(prev => ({ ...prev, proveedor_id: '' })); }}
                    onFocus={() => setShowProvSuggestions(true)}
                    onKeyDown={(e) => {
                      if (e.key === 'ArrowDown') { e.preventDefault(); setProvHighlightedIndex(i => Math.min(i + 1, filteredProvs.length - 1)); }
                      else if (e.key === 'ArrowUp') { e.preventDefault(); setProvHighlightedIndex(i => Math.max(i - 1, 0)); }
                      else if (e.key === 'Enter') { e.preventDefault(); if (provHighlightedIndex >= 0 && filteredProvs[provHighlightedIndex]) { const sel = filteredProvs[provHighlightedIndex]; setFormData(prev => ({ ...prev, proveedor_id: sel.id })); setProviderQuery(sel.nombre); setShowProvSuggestions(false); } }
                      else if (e.key === 'Escape') { setShowProvSuggestions(false); }
                    }}
                    disabled={formData.donacion}
                    style={{ width: '100%', padding: '8px 10px', fontSize: '14px' }}
                  />
                  {showProvSuggestions && providerQuery !== '' && !formData.donacion && (
                    <div className="autocomplete-list">
                      {filteredProvs.slice(0, 20).map((p, idx) => (
                        <div key={p.id} className={`autocomplete-item${idx === provHighlightedIndex ? ' active' : ''}`} onMouseDown={(ev) => ev.preventDefault()} onClick={() => { setFormData(prev => ({ ...prev, proveedor_id: p.id })); setProviderQuery(p.nombre); setShowProvSuggestions(false); }}>{p.nombre}</div>
                      ))}
                      {filteredProvs.length === 0 && <div className="autocomplete-item muted">No se encontraron proveedores</div>}
                    </div>
                  )}
                </div>
                <button type="button" onClick={() => { setShowAddProveedor(true); setTimeout(() => proveedorNombreRef.current && proveedorNombreRef.current.focus(), 60); }} className="btn-icon" style={{ width: '36px', height: '36px', fontSize: '16px' }} aria-label="Agregar proveedor" disabled={formData.donacion}>+</button>
              </div>
            </div>

            {/* Costo */}
            <div>
              <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: 600, color: 'var(--gray-700)' }}>Costo</label>
              <input name="costo" value={formData.costo} onChange={handleChange} type="number" step="0.01" min="0" disabled={formData.donacion} style={{ width: '100%', padding: '8px 10px', fontSize: '14px' }} />
            </div>

            {/* Fecha de vencimiento */}
            <div>
              <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: 600, color: 'var(--gray-700)' }}>Vencimiento</label>
              <input name="fechaVencimiento" value={formData.fechaVencimiento} onChange={handleChange} type="date" style={{ width: '100%', padding: '8px 10px', fontSize: '14px' }} />
            </div>

            {/* Donación */}
            <div>
              <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: 600, color: 'var(--gray-700)' }}>Donación</label>
              <label style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 12px', cursor: 'pointer', background: '#fafbfc', border: '1.5px solid var(--gray-400)', borderRadius: 'var(--radius-md)', fontSize: '14px' }}>
                <input type="checkbox" name="donacion" checked={formData.donacion} onChange={handleChange} style={{ width: '18px', height: '18px', cursor: 'pointer' }} />
                <span>Es donación</span>
              </label>
            </div>

            {/* Procedencia (solo si es donación) */}
            {formData.donacion && (
              <div style={{ gridColumn: 'span 2' }}>
                <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: 600, color: 'var(--gray-700)' }}>Procedencia</label>
                <input name="procedenciaDonacion" value={formData.procedenciaDonacion} onChange={handleChange} type="text" placeholder="Procedencia de la donación" style={{ width: '100%', padding: '8px 10px', fontSize: '14px' }} />
              </div>
            )}
          </div>

          <div style={{ borderTop: '1px solid var(--gray-200)', paddingTop: '16px', display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
            <button type="button" onClick={onBack} className="btn-outline">Cancelar</button>
            <button type="submit" className="btn-primary">💾 Guardar Entrada</button>
          </div>
        </form>
      </div>

  {toast.visible && <div className={`toast${toast.type === 'error' ? ' toast-error' : ''}`}>{toast.message}</div>}

      {showAddProducto && (
        <div className="modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) { setShowAddProducto(false); setNewProducto({ nombre: '', tipo: '', presentacion: '', unidad: '', minimo: '', unidadCustom: '', categoria: '', subcategoria: '' }); setCategoriaSuggestions([]); setSubcategoriaSuggestions([]); } }}>
          <div className="modal-content" role="dialog" aria-modal="true">
            <h3>Nuevo producto</h3>
            
            <label>Nombre</label>
            <input ref={newProdNombreRef} placeholder="Nombre del producto" value={newProducto.nombre} onChange={(e) => setNewProducto({ ...newProducto, nombre: e.target.value })} />
            
            <label>Tipo</label>
            <select value={newProducto.tipo} onChange={(e) => setNewProducto({ ...newProducto, tipo: e.target.value })}>
              <option value="">-- Tipo --</option>
              <option value="uso">Uso</option>
              <option value="consumo">Consumo</option>
            </select>
            
            <label>Categoría</label>
            <div style={{ position: 'relative' }}>
              <input ref={newProdCategoriaRef} placeholder="Categoría" value={newProducto.categoria || ''} onChange={(e) => { const v = e.target.value; setNewProducto({ ...newProducto, categoria: v }); const s = categorias.filter(c => c.toLowerCase().includes((v || "").toLowerCase())); setCategoriaSuggestions(s); setCategoriaHighlightedIndex(-1); }} onKeyDown={(e) => {
                const list = categoriaSuggestions;
                if (e.key === 'ArrowDown') { e.preventDefault(); setCategoriaHighlightedIndex(i => Math.min(i + 1, list.length - 1)); }
                else if (e.key === 'ArrowUp') { e.preventDefault(); setCategoriaHighlightedIndex(i => Math.max(i - 1, 0)); }
                else if (e.key === 'Enter') { e.preventDefault(); if (categoriaHighlightedIndex >= 0 && list[categoriaHighlightedIndex]) { const sel = list[categoriaHighlightedIndex]; setNewProducto(prev => ({ ...prev, categoria: sel })); setCategoriaSuggestions([]); setCategoriaHighlightedIndex(-1); } }
                else if (e.key === 'Escape') { setCategoriaSuggestions([]); setCategoriaHighlightedIndex(-1); }
              }} />
              {categoriaSuggestions.length > 0 && (
                <ul style={{ position: 'absolute', top: '100%', left: 0, right: 0, background: '#fff', border: '1px solid #ccc', listStyle: 'none', padding: 0, margin: 0, maxHeight: '140px', overflowY: 'auto', zIndex: 2000 }}>
                  {categoriaSuggestions.map((c, i) => (<li key={i} style={{ padding: '8px', cursor: 'pointer', borderBottom: '1px solid #eee', background: i === categoriaHighlightedIndex ? '#f0f0f0' : 'white' }} onMouseDown={(ev) => ev.preventDefault()} onClick={() => { setNewProducto({ ...newProducto, categoria: c }); setCategoriaSuggestions([]); setCategoriaHighlightedIndex(-1); }}>{c}</li>))}
                </ul>
              )}
            </div>
            
            <label>Subcategoría</label>
            <div style={{ position: 'relative' }}>
              <input ref={newProdSubcategoriaRef} placeholder="Subcategoría" value={newProducto.subcategoria || ''} onChange={(e) => { const v = e.target.value; setNewProducto({ ...newProducto, subcategoria: v }); const s = subcategorias.filter(su => su.toLowerCase().includes((v || "").toLowerCase())); setSubcategoriaSuggestions(s); setSubcategoriaHighlightedIndex(-1); }} onKeyDown={(e) => {
                const list = subcategoriaSuggestions;
                if (e.key === 'ArrowDown') { e.preventDefault(); setSubcategoriaHighlightedIndex(i => Math.min(i + 1, list.length - 1)); }
                else if (e.key === 'ArrowUp') { e.preventDefault(); setSubcategoriaHighlightedIndex(i => Math.max(i - 1, 0)); }
                else if (e.key === 'Enter') { e.preventDefault(); if (subcategoriaHighlightedIndex >= 0 && list[subcategoriaHighlightedIndex]) { const sel = list[subcategoriaHighlightedIndex]; setNewProducto(prev => ({ ...prev, subcategoria: sel })); setSubcategoriaSuggestions([]); setSubcategoriaHighlightedIndex(-1); } }
                else if (e.key === 'Escape') { setSubcategoriaSuggestions([]); setSubcategoriaHighlightedIndex(-1); }
              }} />
              {subcategoriaSuggestions.length > 0 && (
                <ul style={{ position: 'absolute', top: '100%', left: 0, right: 0, background: '#fff', border: '1px solid #ccc', listStyle: 'none', padding: 0, margin: 0, maxHeight: '140px', overflowY: 'auto', zIndex: 2000 }}>
                  {subcategoriaSuggestions.map((s, i) => (<li key={i} style={{ padding: '8px', cursor: 'pointer', borderBottom: '1px solid #eee', background: i === subcategoriaHighlightedIndex ? '#f0f0f0' : 'white' }} onMouseDown={(ev) => ev.preventDefault()} onClick={() => { setNewProducto({ ...newProducto, subcategoria: s }); setSubcategoriaSuggestions([]); setSubcategoriaHighlightedIndex(-1); }}>{s}</li>))}
                </ul>
              )}
            </div>
            
            <label>Presentación</label>
            <input placeholder="Ej: Caja, Bolsa, Litro" value={newProducto.presentacion} onChange={(e) => setNewProducto({ ...newProducto, presentacion: e.target.value })} />
            
            <label>Unidad</label>
            <input placeholder="Ej: kg, litros, unidades" value={newProducto.unidad || ''} onChange={(e) => setNewProducto({ ...newProducto, unidad: e.target.value })} />
            
            <label>Stock Mínimo</label>
            <input type="number" placeholder="0" min="0" value={newProducto.minimo} onChange={(e) => setNewProducto({ ...newProducto, minimo: e.target.value })} />
            
            <div className="form-actions">
              <button type="button" onClick={() => { setShowAddProducto(false); setNewProducto({ nombre: '', tipo: '', presentacion: '', unidad: '', minimo: '', unidadCustom: '', categoria: '', subcategoria: '' }); setCategoriaSuggestions([]); setSubcategoriaSuggestions([]); setCategoriaHighlightedIndex(-1); setSubcategoriaHighlightedIndex(-1); }} className="btn-outline">Cancelar</button>
              <button type="button" onClick={handleAddProducto} className="btn-primary">💾 Guardar</button>
            </div>
          </div>
        </div>
      )}

      {showAddProveedor && (
        <div className="modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) { setShowAddProveedor(false); setNewProveedor({ nombre: '', direccion: '', telefono: '', email: '', contacto: '' }); } }}>
          <div className="modal-content" role="dialog" aria-modal="true">
            <h3>Nuevo proveedor</h3>
            
            <label>Nombre del proveedor</label>
            <input ref={proveedorNombreRef} placeholder="Nombre" value={newProveedor.nombre} onChange={(e) => setNewProveedor({ ...newProveedor, nombre: e.target.value })} />
            
            <label>Persona de contacto</label>
            <input placeholder="Nombre del contacto" value={newProveedor.contacto} onChange={(e) => setNewProveedor({ ...newProveedor, contacto: e.target.value })} />
            
            <label>Teléfono</label>
            <input placeholder="Número de teléfono" value={newProveedor.telefono} onChange={(e) => setNewProveedor({ ...newProveedor, telefono: e.target.value })} />
            
            <label>Dirección</label>
            <input placeholder="Dirección completa" value={newProveedor.direccion} onChange={(e) => setNewProveedor({ ...newProveedor, direccion: e.target.value })} />
            
            <label>Email</label>
            <input type="email" placeholder="correo@ejemplo.com" value={newProveedor.email} onChange={(e) => setNewProveedor({ ...newProveedor, email: e.target.value })} />
            
            <div className="form-actions">
              <button type="button" onClick={() => { setShowAddProveedor(false); setNewProveedor({ nombre: '', direccion: '', telefono: '', email: '', contacto: '' }); }} className="btn-outline">Cancelar</button>
              <button type="button" onClick={handleAddProveedor} className="btn-primary">💾 Guardar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
