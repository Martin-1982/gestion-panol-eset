import React, { useEffect, useState, useRef } from "react";
import axios from "axios";
import API_BASE_URL from '../config';
import { DELETE_CONFIRM_TEXT } from '../constants/messages';
import { useToast, ToastMessage } from './useToast';
import ModalNuevoProducto from './ModalNuevoProducto';

const CATEGORIAS = [
  "Alimento", "Limpieza", "Bazar", "Ferretería",
  "Librería", "Tecnología", "Seguridad", "Laboratorio",
];

function Productos({ onBack }) {
  const [productos, setProductos] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [showNuevoProducto, setShowNuevoProducto] = useState(false);
  const [editProducto, setEditProducto] = useState(null);
  const [saving, setSaving] = useState(false);
  const [subcategorias, setSubcategorias] = useState([]);
  const [loadingSubcats, setLoadingSubcats] = useState(false);
  const [showNuevaSubcat, setShowNuevaSubcat] = useState(false);
  const [nuevaSubcat, setNuevaSubcat] = useState("");
  const [savingSubcat, setSavingSubcat] = useState(false);

  const [form, setForm] = useState({
    nombre: "", categoria: "", subcategoria: "",
    tipo: "", presentacion: "", unidad: "", minimo: 0,
  });

  const [search, setSearch] = useState("");
  const [filterCategoria, setFilterCategoria] = useState("");
  const [filterTipo, setFilterTipo] = useState("");

  const { toast, showToast } = useToast();
  const nombreRef = useRef(null);
  const newButtonRef = useRef(null);

  useEffect(() => {
    fetchProductos();
    return () => {};
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (form.categoria) {
      fetchSubcategorias(form.categoria);
    } else {
      setSubcategorias([]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form.categoria]);



  const fetchProductos = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await axios.get(`${API_BASE_URL}/api/productos`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setProductos(res.data);
    } catch (err) {
      showToast("Error al cargar productos", "error");
    }
  };

  const fetchSubcategorias = async (categoria) => {
    setLoadingSubcats(true);
    try {
      const res = await axios.get(`${API_BASE_URL}/api/subcategorias?categoria=${encodeURIComponent(categoria)}`);
      setSubcategorias(res.data);
    } catch (err) {
      setSubcategorias([]);
    } finally {
      setLoadingSubcats(false);
    }
  };

  const handleOpenModal = (producto = null) => {
    setEditProducto(producto);
    setForm(producto
      ? { nombre: producto.nombre || "", categoria: producto.categoria || "", subcategoria: producto.subcategoria || "", tipo: producto.tipo || "", presentacion: producto.presentacion || "", unidad: producto.unidad || "", minimo: producto.minimo || 0 }
      : { nombre: "", categoria: "", subcategoria: "", tipo: "", presentacion: "", unidad: "", minimo: 0 }
    );
    setShowNuevaSubcat(false);
    setNuevaSubcat("");
    setShowModal(true);
    setTimeout(() => nombreRef.current && nombreRef.current.focus(), 60);
  };

  const handleCategoriaChange = (e) => {
    setForm({ ...form, categoria: e.target.value, subcategoria: "", tipo: "" });
    setShowNuevaSubcat(false);
    setNuevaSubcat("");
  };

  const handleGuardarNuevaSubcat = async () => {
    if (!nuevaSubcat.trim()) return;
    setSavingSubcat(true);
    try {
      const token = localStorage.getItem("token");
      const res = await axios.post(
        `${API_BASE_URL}/api/subcategorias`,
        { nombre: nuevaSubcat.trim(), categoria: form.categoria },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setSubcategorias(prev => [...prev, res.data].sort((a, b) => a.nombre.localeCompare(b.nombre)));
      setForm(prev => ({ ...prev, subcategoria: nuevaSubcat.trim() }));
      setNuevaSubcat("");
      setShowNuevaSubcat(false);
      showToast("Subcategoría agregada", "success");
    } catch (err) {
      showToast(err.response?.data?.error || "Error al guardar subcategoría", "error");
    } finally {
      setSavingSubcat(false);
    }
  };

  const handleSave = async () => {
    if (!form.nombre.trim()) { showToast("Nombre es obligatorio", "error"); return; }
    if (!form.categoria) { showToast("Categoría es obligatoria", "error"); return; }
    if (!form.tipo) { showToast("Tipo es obligatorio", "error"); return; }
    if (!form.presentacion.trim()) { showToast("Presentación es obligatoria", "error"); return; }
    if (!form.unidad.trim()) { showToast("Unidad es obligatoria", "error"); return; }
    if (saving) return;
    setSaving(true);
    try {
      const token = localStorage.getItem("token");
      const payload = { ...form, minimo: Number(form.minimo) || 0 };
      if (editProducto) {
        await axios.put(`${API_BASE_URL}/api/productos/${editProducto.id}`, payload, { headers: { Authorization: `Bearer ${token}` } });
        showToast("Producto actualizado", "success");
      } else {
        await axios.post(`${API_BASE_URL}/api/productos`, payload, { headers: { Authorization: `Bearer ${token}` } });
        showToast("Producto agregado", "success");
      }
      setShowModal(false);
      fetchProductos();
      setTimeout(() => { if (newButtonRef.current) newButtonRef.current.focus(); }, 60);
    } catch (err) {
      showToast("Error al guardar producto", "error");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm(DELETE_CONFIRM_TEXT)) return;
    try {
      const token = localStorage.getItem("token");
      await axios.delete(`${API_BASE_URL}/api/productos/${id}`, { headers: { Authorization: `Bearer ${token}` } });
      showToast("Producto eliminado", "success");
      fetchProductos();
    } catch (err) {
      const msg = (err.response?.data?.error || err.message || "").toLowerCase();
      if (msg.includes("foreign") || msg.includes("violates")) {
        showToast("No se puede eliminar: tiene movimientos registrados", "error");
      } else {
        showToast("Error al eliminar producto", "error");
      }
    }
  };

  const filtered = productos.filter(p => {
    const q = search.trim().toLowerCase();
    if (q) {
      const matches = (p.nombre || "").toLowerCase().includes(q) || (p.categoria || "").toLowerCase().includes(q) || (p.subcategoria || "").toLowerCase().includes(q);
      if (!matches) return false;
    }
    if (filterCategoria && p.categoria !== filterCategoria) return false;
    if (filterTipo && p.tipo !== filterTipo) return false;
    return true;
  });

  useEffect(() => {
    const handleKey = (e) => { if (e.key === "Escape" && showModal) setShowModal(false); };
    if (showModal) window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [showModal]);

  return (
    <div className="main-content">
      <div className="card card-responsive">

        {toast.visible && (
          <div className="toast" style={{ background: toast.type === "error" ? 'var(--error)' : 'var(--success)', color: 'var(--white)', left: '50%', transform: 'translateX(-50%)', minWidth: 220, fontWeight: 500, fontSize: '1.05rem', zIndex: 2000 }}>
            {toast.message}
          </div>
        )}

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' }}>
          <h2 style={{ margin: 0, fontSize: '24px', color: 'var(--primary)', fontWeight: 700 }}>Gestión de Productos</h2>
          <div style={{ display: 'flex', gap: '12px' }}>
            <button ref={newButtonRef} className="btn-primary" onClick={() => setShowNuevoProducto(true)}>+ Nuevo producto</button>
            <button className="btn-outline" onClick={onBack}>← Volver</button>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px', marginBottom: '24px' }}>
          <input className="input" placeholder="Buscar por nombre, categoría..." value={search} onChange={(e) => setSearch(e.target.value)} />
          <select className="input" value={filterCategoria} onChange={(e) => setFilterCategoria(e.target.value)}>
            <option value="">— Todas las categorías —</option>
            {CATEGORIAS.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
          <select className="input" value={filterTipo} onChange={(e) => setFilterTipo(e.target.value)}>
            <option value="">— Todos los tipos —</option>
            <option value="Perecedero">Perecedero</option>
            <option value="No perecedero">No perecedero</option>
            <option value="Uso">Uso</option>
            <option value="Consumo">Consumo</option>
          </select>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table className="data-table" style={{ width: "100%", background: 'var(--white)' }}>
            <thead>
              <tr>
                <th>Nombre</th>
                <th>Categoría</th>
                <th>Subcategoría</th>
                <th>Tipo</th>
                <th>Presentación</th>
                <th>Unidad</th>
                <th>Mínimo</th>
                <th>Stock</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan={9} style={{ textAlign: 'center', color: 'var(--gray-500)', padding: '24px' }}>No hay productos cargados</td></tr>
              ) : (
                filtered.map(p => (
                  <tr key={p.id}>
                    <td>{p.nombre}</td>
                    <td>{p.categoria}</td>
                    <td>{p.subcategoria || "—"}</td>
                    <td>{p.tipo || "—"}</td>
                    <td>{p.presentacion}</td>
                    <td>{p.unidad}</td>
                    <td>{p.minimo}</td>
                    <td style={{ fontWeight: 600, color: p.stock <= p.minimo ? 'var(--error)' : 'var(--success)' }}>{p.stock}</td>
                    <td>
                      <button className="btn btn-ghost compact-btn" onClick={() => handleOpenModal(p)}>✏️</button>
                      <button className="btn btn-ghost compact-btn" onClick={() => handleDelete(p.id)}>🗑️</button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Modal editar producto */}
        {showModal && (
          <div className="app-modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) setShowModal(false); }}>
            <div className="modal-content" role="dialog" aria-modal="true">
              <h3>Editar producto</h3>

              <label>Nombre *</label>
              <input ref={nombreRef} placeholder="Nombre del producto" value={form.nombre} onChange={(e) => setForm({ ...form, nombre: e.target.value })} />

              <label>Categoría *</label>
              <select value={form.categoria} onChange={handleCategoriaChange}>
                <option value="">— Seleccionar categoría —</option>
                {CATEGORIAS.map(c => <option key={c} value={c}>{c}</option>)}
              </select>

              {form.categoria && (
                <>
                  <label>Tipo *</label>
                  <select value={form.tipo} onChange={(e) => setForm({ ...form, tipo: e.target.value })}>
                    <option value="">— Seleccionar tipo —</option>
                    {(form.categoria === "Alimento" ? ["Perecedero", "No perecedero"] : ["Uso", "Consumo"]).map(t => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </>
              )}

              {form.categoria && (
                <>
                  <label>Subcategoría</label>
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    <select style={{ flex: 1 }} value={form.subcategoria} onChange={(e) => setForm({ ...form, subcategoria: e.target.value })} disabled={loadingSubcats}>
                      <option value="">— Seleccionar subcategoría —</option>
                      {subcategorias.map(s => <option key={s.id} value={s.nombre}>{s.nombre}</option>)}
                    </select>
                    <button className="btn-accent" style={{ padding: '8px 14px', fontSize: '18px', lineHeight: 1 }} onClick={() => { setShowNuevaSubcat(!showNuevaSubcat); setNuevaSubcat(""); }}>+</button>
                  </div>
                  {showNuevaSubcat && (
                    <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
                      <input style={{ flex: 1 }} placeholder={`Nueva subcategoría para ${form.categoria}`} value={nuevaSubcat} onChange={(e) => setNuevaSubcat(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleGuardarNuevaSubcat(); } }} autoFocus />
                      <button className="btn-primary" onClick={handleGuardarNuevaSubcat} disabled={savingSubcat || !nuevaSubcat.trim()}>{savingSubcat ? "..." : "Guardar"}</button>
                      <button className="btn-outline" onClick={() => { setShowNuevaSubcat(false); setNuevaSubcat(""); }}>Cancelar</button>
                    </div>
                  )}
                </>
              )}

              <label>Presentación *</label>
              <input placeholder="Ej: Caja, Bolsa, Litro" value={form.presentacion} onChange={(e) => setForm({ ...form, presentacion: e.target.value })} />

              <label>Unidad *</label>
              <input placeholder="Ej: kg, litros, unidades" value={form.unidad} onChange={(e) => setForm({ ...form, unidad: e.target.value })} />

              <label>Stock mínimo</label>
              <input type="number" placeholder="0" min={0} step={1} value={form.minimo} onChange={(e) => setForm({ ...form, minimo: e.target.value })} />

              <div className="form-actions">
                <button className="btn-outline" onClick={() => setShowModal(false)}>Cancelar</button>
                <button className="btn-primary" onClick={handleSave} disabled={saving}>{saving ? "Guardando..." : "💾 Guardar"}</button>
              </div>
            </div>
          </div>
        )}

        {/* Modal nuevo producto — componente reutilizable */}
        {showNuevoProducto && (
          <ModalNuevoProducto
            onClose={() => setShowNuevoProducto(false)}
            onProductoCreado={(nuevo) => {
              setProductos(prev => [...prev, nuevo]);
              showToast("Producto agregado", "success");
            }}
          />
        )}

      </div>
    </div>
  );
}

export default Productos;
