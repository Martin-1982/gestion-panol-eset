import React, { useState, useEffect, useRef } from "react";
import axios from "axios";

const modalStyle = { position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', background: '#fff', padding: 18, border: '1px solid #ccc', borderRadius: 8, zIndex: 1000, width: 460, boxShadow: '0 10px 30px rgba(0,0,0,0.12)' };
const toastStyle = { position: 'fixed', bottom: 18, left: '50%', transform: 'translateX(-50%)', background: '#2b8a3e', color: '#fff', padding: '10px 14px', borderRadius: 8, boxShadow: '0 6px 18px rgba(0,0,0,0.12)', zIndex: 3000 };
const toastErrorStyle = { background: '#c94b4b' };

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
      const res = await axios.get('http://localhost:4000/api/productos', { headers: { Authorization: `Bearer ${token}` } });
      setProductos(res.data || []);
    } catch (err) { console.error(err); showToast('Error cargando productos','error'); }
  }

  async function fetchProveedores() {
    try {
      const token = localStorage.getItem("token");
      const res = await axios.get('http://localhost:4000/api/proveedores', { headers: { Authorization: `Bearer ${token}` } });
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
      await axios.post('http://localhost:4000/api/entradas', payload, { headers: { Authorization: `Bearer ${token}` } });
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
      const res = await axios.post('http://localhost:4000/api/productos', payloadProducto, { headers: { Authorization: `Bearer ${token}` } });
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
      const res = await axios.post('http://localhost:4000/api/proveedores', newProveedor, { headers: { Authorization: `Bearer ${token}` } });
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
    <div style={{ padding: '22px' }}>
      <h2 className="dashboard-title">Registrar entrada</h2>
      <div className="card" style={{ maxWidth: 980, marginTop: 12 }}>
        <form onSubmit={handleSubmit}>
          <div className="form-grid">
            <div style={{ position: 'relative' }}>
              <label className="field-label">Producto</label>
              <div style={{ display: 'flex', gap: 8 }}>
                <div style={{ flex: 1, position: 'relative' }}>
                  <input
                    ref={productInputRef}
                    className="compact-field input-full"
                    placeholder="Buscar producto..."
                    value={productQuery}
                    onChange={(e) => { setProductQuery(e.target.value); setShowSuggestions(true); setHighlightedIndex(-1); setFormData(prev => ({ ...prev, producto_id: '' })); }}
                    onFocus={() => setShowSuggestions(true)}
                    onKeyDown={(e) => {
                      if (e.key === 'ArrowDown') { e.preventDefault(); setHighlightedIndex(i => Math.min(i + 1, filteredProducts.length - 1)); }
                      else if (e.key === 'ArrowUp') { e.preventDefault(); setHighlightedIndex(i => Math.max(i - 1, 0)); }
                      else if (e.key === 'Enter') { e.preventDefault(); if (highlightedIndex >= 0 && filteredProducts[highlightedIndex]) { const sel = filteredProducts[highlightedIndex]; setFormData(prev => ({ ...prev, producto_id: sel.id })); setProductQuery(sel.nombre); setShowSuggestions(false); } }
                      else if (e.key === 'Escape') { setShowSuggestions(false); }
                    }}
                  />
                  {showSuggestions && productQuery !== '' && (
                    <div className="autocomplete-list">
                      {filteredProducts.slice(0, 20).map((p, idx) => (
                        <div key={p.id} className={`autocomplete-item ${idx === highlightedIndex ? 'active' : ''}`} onMouseDown={(ev) => ev.preventDefault()} onClick={() => { setFormData(prev => ({ ...prev, producto_id: p.id })); setProductQuery(p.nombre); setShowSuggestions(false); }}>{p.nombre}</div>
                      ))}
                      {filteredProducts.length === 0 && <div className="autocomplete-item" style={{ color: '#666' }}>No se encontraron productos</div>}
                    </div>
                  )}
                </div>
                <button type="button" onClick={() => { setShowAddProducto(true); setTimeout(() => newProdNombreRef.current && newProdNombreRef.current.focus(), 60); }} className="compact-btn">➕</button>
              </div>
              <select name="producto_id" value={formData.producto_id} onChange={handleChange} style={{ display: 'none' }}>
                <option value="">-- Seleccionar --</option>
                {productos.map(p => <option key={p.id} value={p.id}>{p.nombre}</option>)}
              </select>
            </div>

            <div>
              <label className="field-label">Cantidad</label>
              <input name="cantidad" value={formData.cantidad} onChange={handleChange} className="compact-field input-full" type="number" />
            </div>

            <div style={{ position: 'relative' }}>
              <label className="field-label">Proveedor</label>
              <div style={{ display: 'flex', gap: 8 }}>
                <div style={{ flex: 1, position: 'relative' }}>
                  <input
                    ref={providerInputRef}
                    className="compact-field input-full"
                    placeholder="Buscar proveedor..."
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
                  />
                  {showProvSuggestions && providerQuery !== '' && !formData.donacion && (
                    <div className="autocomplete-list">
                      {filteredProvs.slice(0, 20).map((p, idx) => (
                        <div key={p.id} className={`autocomplete-item ${idx === provHighlightedIndex ? 'active' : ''}`} onMouseDown={(ev) => ev.preventDefault()} onClick={() => { setFormData(prev => ({ ...prev, proveedor_id: p.id })); setProviderQuery(p.nombre); setShowProvSuggestions(false); }}>{p.nombre}</div>
                      ))}
                      {filteredProvs.length === 0 && <div className="autocomplete-item" style={{ color: '#666' }}>No se encontraron proveedores</div>}
                    </div>
                  )}
                </div>
                <button type="button" onClick={() => { setShowAddProveedor(true); setTimeout(() => proveedorNombreRef.current && proveedorNombreRef.current.focus(), 60); }} className="compact-btn" disabled={formData.donacion}>➕</button>
              </div>
              <select name="proveedor_id" value={formData.proveedor_id} onChange={handleChange} style={{ display: 'none' }}>
                <option value="">-- Seleccionar --</option>
                {proveedores.map(p => <option key={p.id} value={p.id}>{p.nombre}</option>)}
              </select>
            </div>

            <div>
              <label className="field-label">Costo</label>
              <input name="costo" value={formData.costo} onChange={handleChange} className="compact-field input-full" type="number" step="0.01" disabled={formData.donacion} />
            </div>

            <div>
              <label className="field-label">Donación</label>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <input type="checkbox" name="donacion" checked={formData.donacion} onChange={handleChange} /> <span style={{ color: 'var(--muted)' }}>Es donación</span>
                <input name="procedenciaDonacion" value={formData.procedenciaDonacion} onChange={handleChange} className="compact-field" placeholder="Procedencia" style={{ marginLeft: 8, minWidth: 220 }} disabled={!formData.donacion} />
              </div>
            </div>

            <div>
              <label className="field-label">Fecha de vencimiento</label>
              <input name="fechaVencimiento" value={formData.fechaVencimiento} onChange={handleChange} className="compact-field input-full" type="date" />
            </div>

            <div style={{ display: 'flex', gap: 8, justifyContent: 'center', gridColumn: '1 / -1', width: '100%', position: 'relative', left: '50%', transform: 'translateX(-50%)', marginTop: 24 }}>
              <button type="button" onClick={() => { setFormData({ producto_id: '', cantidad: '', costo: '', donacion: false, proveedor_id: '', fechaVencimiento: '', procedenciaDonacion: '' }); setProductQuery(''); setProviderQuery(''); setShowSuggestions(false); setShowProvSuggestions(false); onBack(); }} className="btn-outline">Volver</button>
              <button type="submit" className="btn-primary">Guardar entrada</button>
            </div>
          </div>
        </form>
      </div>

      {toast.visible && <div style={{ ...toastStyle, ...(toast.type === 'error' ? toastErrorStyle : {}) }}>{toast.message}</div>}

      {showAddProducto && (
        <div className="app-modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) { setShowAddProducto(false); setNewProducto({ nombre: '', tipo: '', presentacion: '', unidad: '', minimo: '', unidadCustom: '', categoria: '', subcategoria: '' }); setCategoriaSuggestions([]); setSubcategoriaSuggestions([]); } }}>
          <div style={modalStyle} role="dialog" aria-modal="true">
            <h3>➕ Nuevo producto</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <input ref={newProdNombreRef} className="compact-field" placeholder="Nombre" value={newProducto.nombre} onChange={(e) => setNewProducto({ ...newProducto, nombre: e.target.value })} />
              <select className="compact-field" value={newProducto.tipo} onChange={(e) => setNewProducto({ ...newProducto, tipo: e.target.value })}>
                <option value="">-- Tipo --</option>
                <option value="uso">Uso</option>
                <option value="consumo">Consumo</option>
              </select>

              <div style={{ position: 'relative' }}>
                <input ref={newProdCategoriaRef} className="compact-field" placeholder="Categoría" value={newProducto.categoria || ''} onChange={(e) => { const v = e.target.value; setNewProducto({ ...newProducto, categoria: v }); const s = categorias.filter(c => c.toLowerCase().includes((v || "").toLowerCase())); setCategoriaSuggestions(s); setCategoriaHighlightedIndex(-1); }} onKeyDown={(e) => {
                  const list = categoriaSuggestions;
                  if (e.key === 'ArrowDown') { e.preventDefault(); setCategoriaHighlightedIndex(i => Math.min(i + 1, list.length - 1)); }
                  else if (e.key === 'ArrowUp') { e.preventDefault(); setCategoriaHighlightedIndex(i => Math.max(i - 1, 0)); }
                  else if (e.key === 'Enter') { e.preventDefault(); if (categoriaHighlightedIndex >= 0 && list[categoriaHighlightedIndex]) { const sel = list[categoriaHighlightedIndex]; setNewProducto(prev => ({ ...prev, categoria: sel })); setCategoriaSuggestions([]); setCategoriaHighlightedIndex(-1); } }
                  else if (e.key === 'Escape') { setCategoriaSuggestions([]); setCategoriaHighlightedIndex(-1); }
                }} />
                {categoriaSuggestions.length > 0 && (
                  <ul style={{ listStyle: 'none', padding: 0, margin: 0, position: 'absolute', top: '100%', left: 0, right: 0, background: '#fff', border: '1px solid #eee', zIndex: 2000 }}>
                    {categoriaSuggestions.map((c, i) => (<li key={i} onMouseDown={(ev) => ev.preventDefault()} onClick={() => { setNewProducto({ ...newProducto, categoria: c }); setCategoriaSuggestions([]); setCategoriaHighlightedIndex(-1); }} style={{ padding: '8px', cursor: 'pointer', borderBottom: '1px solid #f1f3f5', background: i === categoriaHighlightedIndex ? '#f4f8ff' : 'transparent' }}>{c}</li>))}
                  </ul>
                )}
              </div>

              <div style={{ position: 'relative' }}>
                <input ref={newProdSubcategoriaRef} className="compact-field" placeholder="Subcategoría (opcional)" value={newProducto.subcategoria || ''} onChange={(e) => { const v = e.target.value; setNewProducto({ ...newProducto, subcategoria: v }); const s = subcategorias.filter(su => su.toLowerCase().includes((v || "").toLowerCase())); setSubcategoriaSuggestions(s); setSubcategoriaHighlightedIndex(-1); }} onKeyDown={(e) => {
                  const list = subcategoriaSuggestions;
                  if (e.key === 'ArrowDown') { e.preventDefault(); setSubcategoriaHighlightedIndex(i => Math.min(i + 1, list.length - 1)); }
                  else if (e.key === 'ArrowUp') { e.preventDefault(); setSubcategoriaHighlightedIndex(i => Math.max(i - 1, 0)); }
                  else if (e.key === 'Enter') { e.preventDefault(); if (subcategoriaHighlightedIndex >= 0 && list[subcategoriaHighlightedIndex]) { const sel = list[subcategoriaHighlightedIndex]; setNewProducto(prev => ({ ...prev, subcategoria: sel })); setSubcategoriaSuggestions([]); setSubcategoriaHighlightedIndex(-1); } }
                  else if (e.key === 'Escape') { setSubcategoriaSuggestions([]); setSubcategoriaHighlightedIndex(-1); }
                }} />
                {subcategoriaSuggestions.length > 0 && (
                  <ul style={{ listStyle: 'none', padding: 0, margin: 0, position: 'absolute', top: '100%', left: 0, right: 0, background: '#fff', border: '1px solid #eee', zIndex: 2000 }}>
                    {subcategoriaSuggestions.map((s, i) => (<li key={i} onMouseDown={(ev) => ev.preventDefault()} onClick={() => { setNewProducto({ ...newProducto, subcategoria: s }); setSubcategoriaSuggestions([]); setSubcategoriaHighlightedIndex(-1); }} style={{ padding: '8px', cursor: 'pointer', borderBottom: '1px solid #f1f3f5', background: i === subcategoriaHighlightedIndex ? '#f4f8ff' : 'transparent' }}>{s}</li>))}
                  </ul>
                )}
              </div>

              <input className="compact-field" placeholder="Presentación" value={newProducto.presentacion} onChange={(e) => setNewProducto({ ...newProducto, presentacion: e.target.value })} />
              <select className="compact-field" value={newProducto.unidad || ""} onChange={(e) => setNewProducto({ ...newProducto, unidad: e.target.value })}>
                <option value="">-- Unidad --</option>
                <option value="unidad">Unidad</option>
                <option value="kg">Kg</option>
                <option value="g">Gr</option>
                <option value="lt">Litro</option>
                <option value="caja">Caja</option>
                <option value="cajon">Cajon</option>
                <option value="pack">Pack</option>
                <option value="paquete">Paquete</option>
                <option value="otro">Otro</option>
              </select>
              {newProducto.unidad === 'otro' && (
                <input className="compact-field" placeholder="Especificar unidad" value={newProducto.unidadCustom || ''} onChange={(e) => setNewProducto({ ...newProducto, unidadCustom: e.target.value })} />
              )}
              <input className="compact-field" placeholder="Mínimo" type="number" value={newProducto.minimo} onChange={(e) => setNewProducto({ ...newProducto, minimo: e.target.value })} />
              <div style={{ marginTop: 8, display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                <button onClick={handleAddProducto} className="compact-btn">Guardar</button>
                <button onClick={() => { setShowAddProducto(false); setNewProducto({ nombre: '', tipo: '', presentacion: '', unidad: '', minimo: '', unidadCustom: '', categoria: '', subcategoria: '' }); setCategoriaSuggestions([]); setSubcategoriaSuggestions([]); setCategoriaHighlightedIndex(-1); setSubcategoriaHighlightedIndex(-1); }} className="compact-btn">Cancelar</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showAddProveedor && (
        <div className="app-modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) { setShowAddProveedor(false); setNewProveedor({ nombre: '', direccion: '', telefono: '', email: '', contacto: '' }); } }}>
          <div style={modalStyle} role="dialog" aria-modal="true">
            <h3>➕ Nuevo proveedor</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <input ref={proveedorNombreRef} className="compact-field" placeholder="Nombre" value={newProveedor.nombre} onChange={(e) => setNewProveedor({ ...newProveedor, nombre: e.target.value })} />
              <input className="compact-field" placeholder="Dirección" value={newProveedor.direccion} onChange={(e) => setNewProveedor({ ...newProveedor, direccion: e.target.value })} />
              <input className="compact-field" placeholder="Teléfono" value={newProveedor.telefono} onChange={(e) => setNewProveedor({ ...newProveedor, telefono: e.target.value })} />
              <input className="compact-field" placeholder="E-mail" value={newProveedor.email} onChange={(e) => setNewProveedor({ ...newProveedor, email: e.target.value })} />
              <input className="compact-field" placeholder="Contacto" value={newProveedor.contacto} onChange={(e) => setNewProveedor({ ...newProveedor, contacto: e.target.value })} />
              <div style={{ marginTop: 8, display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                <button onClick={handleAddProveedor} className="compact-btn">Guardar</button>
                <button onClick={() => { setShowAddProveedor(false); setNewProveedor({ nombre: '', direccion: '', telefono: '', email: '', contacto: '' }); }} className="compact-btn">Cancelar</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
