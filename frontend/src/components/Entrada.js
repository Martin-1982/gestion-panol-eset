import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import API_BASE_URL from '../config';
import ModalNuevoProducto from './ModalNuevoProducto';
import ModalNuevoProveedor from './ModalNuevoProveedor';
import { useToast, ToastMessage } from './useToast';

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

  const { toast, showToast } = useToast();

  useEffect(() => {
    fetchProductos();
    fetchProveedores();
    return () => {};
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);



  async function fetchProductos() {
    try {
      const token = localStorage.getItem("token");
      const res = await axios.get(`${API_BASE_URL}/api/productos`, { headers: { Authorization: `Bearer ${token}` } });
      setProductos(res.data || []);
    } catch (err) { console.error(err); showToast('Error cargando productos', 'error'); }
  }

  async function fetchProveedores() {
    try {
      const token = localStorage.getItem("token");
      const res = await axios.get(`${API_BASE_URL}/api/proveedores`, { headers: { Authorization: `Bearer ${token}` } });
      setProveedores(res.data || []);
    } catch (err) { console.error(err); showToast('Error cargando proveedores', 'error'); }
  }

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    if (name === 'donacion') {
      if (checked) {
        setFormData(prev => ({ ...prev, donacion: true, proveedor_id: '', costo: '', procedenciaDonacion: '' }));
        setProviderQuery('');
        setShowProvSuggestions(false);
      } else {
        setFormData(prev => ({ ...prev, donacion: false, procedenciaDonacion: '' }));
      }
      return;
    }
    setFormData(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.producto_id) return showToast('Seleccione producto', 'error');
    if (!formData.cantidad || Number(formData.cantidad) <= 0) return showToast('Cantidad inválida', 'error');
    if (!formData.donacion && !formData.proveedor_id) return showToast('Seleccione proveedor o marque donación', 'error');
    if (formData.donacion && !formData.procedenciaDonacion) return showToast('Indique procedencia', 'error');
    try {
      const token = localStorage.getItem('token');
      const payload = {
        producto_id: formData.producto_id,
        usuario_id: 1,
        proveedor_id: formData.proveedor_id || null,
        cantidad: Number(formData.cantidad),
        costo: formData.costo ? Number(formData.costo) : null,
        donacion: formData.donacion,
        procedencia: formData.procedenciaDonacion || null,
        vencimiento: formData.fechaVencimiento || null
      };
      await axios.post(`${API_BASE_URL}/api/entradas`, payload, { headers: { Authorization: `Bearer ${token}` } });
      showToast('Entrada registrada', 'success');
      setFormData({ producto_id: '', cantidad: '', costo: '', donacion: false, proveedor_id: '', fechaVencimiento: '', procedenciaDonacion: '' });
      setProductQuery(''); setProviderQuery(''); setShowSuggestions(false); setShowProvSuggestions(false);
    } catch (err) {
      const msg = (err.response?.data?.error || err.response?.data?.message || err.message || 'Error guardando entrada');
      showToast(msg, 'error');
    }
  };

  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === 'Escape') {
        setFormData({ producto_id: '', cantidad: '', costo: '', donacion: false, proveedor_id: '', fechaVencimiento: '', procedenciaDonacion: '' });
        setProductQuery(''); setProviderQuery(''); setShowSuggestions(false); setShowProvSuggestions(false);
        if (showAddProducto) setShowAddProducto(false);
        if (showAddProveedor) setShowAddProveedor(false);
      }
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [showAddProducto, showAddProveedor]);

  const filteredProducts = productos.filter(p => p.nombre.toLowerCase().includes(productQuery.toLowerCase()));
  const filteredProvs = proveedores.filter(p => p.nombre.toLowerCase().includes(providerQuery.toLowerCase()));

  return (
    <div className="main-content">
      <div className="card card-responsive">
        <ToastMessage toast={toast} />

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
                <button type="button" onClick={() => setShowAddProducto(true)} className="btn-icon" style={{ width: '36px', height: '36px', fontSize: '16px' }} aria-label="Agregar producto">+</button>
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
                <button type="button" onClick={() => setShowAddProveedor(true)} className="btn-icon" style={{ width: '36px', height: '36px', fontSize: '16px' }} aria-label="Agregar proveedor" disabled={formData.donacion}>+</button>
              </div>
            </div>

            {/* Costo */}
            <div>
              <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: 600, color: 'var(--gray-700)' }}>Costo</label>
              <input name="costo" value={formData.costo} onChange={handleChange} type="number" step="0.01" min="0" disabled={formData.donacion} style={{ width: '100%', padding: '8px 10px', fontSize: '14px' }} />
            </div>

            {/* Fecha vencimiento */}
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

      {/* Modal nuevo producto — componente reutilizable */}
      {showAddProducto && (
        <ModalNuevoProducto
          onClose={() => setShowAddProducto(false)}
          onProductoCreado={(nuevo) => { setProductos(prev => [...prev, nuevo]); }}
          showToast={showToast}
        />
      )}

      {/* Modal nuevo proveedor — componente reutilizable */}
      {showAddProveedor && (
        <ModalNuevoProveedor
          onClose={() => setShowAddProveedor(false)}
          onProveedorCreado={(nuevo) => { setProveedores(prev => [...prev, nuevo]); }}
          showToast={showToast}
        />
      )}
    </div>
  );
}
