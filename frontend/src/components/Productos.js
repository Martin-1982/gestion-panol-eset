import React, { useEffect, useState, useRef } from "react";
import axios from "axios";
import API_BASE_URL from '../config';
import { DELETE_CONFIRM_TEXT } from '../constants/messages';

// Categorías fijas del sistema
const CATEGORIAS = [
  "Alimento",
  "Limpieza",
  "Bazar",
  "Ferretería",
  "Librería",
  "Tecnología",
  "Seguridad",
  "Laboratorio",
];

// El tipo que se muestra depende de la categoría elegida
const getTipoOpciones = (categoria) => {
  if (categoria === "Alimento") {
    return ["Perecedero", "No perecedero"];
  }
  return ["Uso", "Consumo"];
};

function Productos({ onBack }) {
  const [productos, setProductos] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editProducto, setEditProducto] = useState(null);
  const [saving, setSaving] = useState(false);

  // Subcategorías cargadas desde el backend según la categoría elegida
  const [subcategorias, setSubcategorias] = useState([]);
  const [loadingSubcats, setLoadingSubcats] = useState(false);

  // Estado para agregar subcategoría nueva con el botón "+"
  const [showNuevaSubcat, setShowNuevaSubcat] = useState(false);
  const [nuevaSubcat, setNuevaSubcat] = useState("");
  const [savingSubcat, setSavingSubcat] = useState(false);

  const [form, setForm] = useState({
    nombre: "",
    categoria: "",
    subcategoria: "",
    tipo: "",
    presentacion: "",
    unidad: "",
    minimo: 0,
  });

  // Filtros y buscador
  const [search, setSearch] = useState("");
  const [filterCategoria, setFilterCategoria] = useState("");
  const [filterTipo, setFilterTipo] = useState("");

  // Toast de notificación
  const [toast, setToast] = useState({ visible: false, message: "", type: "success" });
  const toastTimer = useRef(null);
  const nombreRef = useRef(null);
  const newButtonRef = useRef(null);

  useEffect(() => {
    fetchProductos();
    return () => { if (toastTimer.current) clearTimeout(toastTimer.current); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Cada vez que cambia la categoría en el formulario, cargamos las subcategorías
  useEffect(() => {
    if (form.categoria) {
      fetchSubcategorias(form.categoria);
    } else {
      setSubcategorias([]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form.categoria]);

  const showToast = (message, type = "success", ms = 2000) => {
    setToast({ visible: true, message, type });
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast({ visible: false, message: "", type: "success" }), ms);
  };

  const fetchProductos = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await axios.get(`${API_BASE_URL}/api/productos`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setProductos(res.data);
    } catch (err) {
      console.error("❌ Error al cargar productos:", err);
      showToast("Error al cargar productos", "error");
    }
  };

  // Carga las subcategorías desde el backend filtrando por categoría
  const fetchSubcategorias = async (categoria) => {
    setLoadingSubcats(true);
    try {
      const res = await axios.get(`${API_BASE_URL}/api/subcategorias?categoria=${encodeURIComponent(categoria)}`);
      setSubcategorias(res.data);
    } catch (err) {
      console.error("❌ Error al cargar subcategorías:", err);
      setSubcategorias([]);
    } finally {
      setLoadingSubcats(false);
    }
  };

  const handleOpenModal = (producto = null) => {
    setEditProducto(producto);
    setForm(
      producto
        ? {
            nombre: producto.nombre || "",
            categoria: producto.categoria || "",
            subcategoria: producto.subcategoria || "",
            tipo: producto.tipo || "",
            presentacion: producto.presentacion || "",
            unidad: producto.unidad || "",
            minimo: producto.minimo || 0,
          }
        : {
            nombre: "",
            categoria: "",
            subcategoria: "",
            tipo: "",
            presentacion: "",
            unidad: "",
            minimo: 0,
          }
    );
    setShowNuevaSubcat(false);
    setNuevaSubcat("");
    setShowModal(true);
    setTimeout(() => nombreRef.current && nombreRef.current.focus(), 60);
  };

  // Cuando cambia la categoría, limpiamos subcategoría y tipo
  const handleCategoriaChange = (e) => {
    setForm({ ...form, categoria: e.target.value, subcategoria: "", tipo: "" });
    setShowNuevaSubcat(false);
    setNuevaSubcat("");
  };

  // Guarda una nueva subcategoría en la base de datos
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
      // Agregar la nueva subcategoría a la lista y seleccionarla
      setSubcategorias([...subcategorias, res.data].sort((a, b) => a.nombre.localeCompare(b.nombre)));
      setForm({ ...form, subcategoria: nuevaSubcat.trim() });
      setNuevaSubcat("");
      setShowNuevaSubcat(false);
      showToast("Subcategoría agregada", "success");
    } catch (err) {
      const msg = err.response?.data?.error || "Error al guardar subcategoría";
      showToast(msg, "error");
    } finally {
      setSavingSubcat(false);
    }
  };

  const validProducto = () => {
    if (!form.nombre || !form.nombre.trim()) { showToast("Nombre es obligatorio", "error"); return false; }
    if (!form.categoria) { showToast("Categoría es obligatoria", "error"); return false; }
    if (!form.tipo) { showToast("Tipo es obligatorio", "error"); return false; }
    if (!form.presentacion || !form.presentacion.toString().trim()) { showToast("Presentación es obligatoria", "error"); return false; }
    if (!form.unidad || !form.unidad.trim()) { showToast("Unidad es obligatoria", "error"); return false; }
    const minVal = Number(form.minimo);
    if (!Number.isInteger(minVal) || minVal < 0) { showToast("Mínimo debe ser un número entero mayor o igual a 0", "error"); return false; }
    return true;
  };

  const handleSave = async () => {
    if (!validProducto()) return;
    if (saving) return;
    setSaving(true);
    try {
      const token = localStorage.getItem("token");
      const payload = { ...form, minimo: Number(form.minimo) || 0 };
      if (editProducto) {
        await axios.put(
          `${API_BASE_URL}/api/productos/${editProducto.id}`,
          payload,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        showToast("Producto actualizado", "success");
      } else {
        await axios.post(`${API_BASE_URL}/api/productos`, payload, {
          headers: { Authorization: `Bearer ${token}` },
        });
        showToast("Producto agregado", "success");
      }
      setShowModal(false);
      fetchProductos();
      setTimeout(() => { if (newButtonRef.current) newButtonRef.current.focus(); }, 60);
    } catch (err) {
      console.error("❌ Error al guardar producto:", err);
      showToast("Error al guardar producto", "error");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm(DELETE_CONFIRM_TEXT)) return;
    try {
      const token = localStorage.getItem("token");
      await axios.delete(`${API_BASE_URL}/api/productos/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      showToast("Producto eliminado", "success");
      fetchProductos();
    } catch (err) {
      console.error("❌ Error al eliminar producto:", err);
      const msg = (err.response?.data?.error || err.response?.data?.message || err.message || "").toLowerCase();
      if (msg.includes("foreign") || msg.includes("violates") || msg.includes("referential")) {
        showToast("No se puede eliminar: tiene movimientos registrados", "error");
      } else {
        showToast("Error al eliminar producto", "error");
      }
    }
  };

  // Filtrado de la tabla
  const filtered = productos.filter(p => {
    const q = search.trim().toLowerCase();
    if (q) {
      const matches =
        (p.nombre || "").toLowerCase().includes(q) ||
        (p.categoria || "").toLowerCase().includes(q) ||
        (p.subcategoria || "").toLowerCase().includes(q) ||
        (p.presentacion || "").toLowerCase().includes(q) ||
        (p.unidad || "").toLowerCase().includes(q);
      if (!matches) return false;
    }
    if (filterCategoria && p.categoria !== filterCategoria) return false;
    if (filterTipo && p.tipo !== filterTipo) return false;
    return true;
  });

  // Teclado: Esc cierra el modal
  useEffect(() => {
    const handleKey = (e) => {
      if (e.key === "Escape" && showModal) {
        setShowModal(false);
      }
    };
    if (showModal) window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [showModal]);

  return (
    <div className="main-content">
      <div className="card card-responsive">

        {/* Toast */}
        {toast.visible && (
          <div className="toast" style={{
            background: toast.type === "error" ? 'var(--error)' : 'var(--success)',
            color: 'var(--white)', left: '50%', transform: 'translateX(-50%)',
            minWidth: 220, fontWeight: 500, fontSize: '1.05rem', zIndex: 2000
          }}>
            {toast.message}
          </div>
        )}

        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' }}>
          <h2 style={{ margin: 0, fontSize: '24px', color: 'var(--primary)', fontWeight: 700 }}>
            Gestión de Productos
          </h2>
          <div style={{ display: 'flex', gap: '12px' }}>
            <button ref={newButtonRef} className="btn-primary" onClick={() => handleOpenModal()}>
              + Nuevo producto
            </button>
            <button className="btn-outline" onClick={onBack}>← Volver</button>
          </div>
        </div>

        {/* Filtros */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px', marginBottom: '24px' }}>
          <input
            className="input"
            placeholder="Buscar por nombre, categoría..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
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

        {/* Tabla */}
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
                <th>Stock mínimo</th>
                <th>Stock actual</th>
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
                    <td style={{ fontWeight: 600, color: p.stock <= p.minimo ? 'var(--error)' : 'var(--success)' }}>
                      {p.stock}
                    </td>
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

        {/* Modal nuevo/editar producto */}
        {showModal && (
          <div className="app-modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) setShowModal(false); }}>
            <div className="modal-content" role="dialog" aria-modal="true" aria-labelledby="modal-title">
              <h3 id="modal-title">{editProducto ? "Editar producto" : "Nuevo producto"}</h3>

              {/* Nombre */}
              <label>Nombre *</label>
              <input
                ref={nombreRef}
                placeholder="Nombre del producto"
                value={form.nombre}
                onChange={(e) => setForm({ ...form, nombre: e.target.value })}
              />

              {/* Categoría */}
              <label>Categoría *</label>
              <select value={form.categoria} onChange={handleCategoriaChange}>
                <option value="">— Seleccionar categoría —</option>
                {CATEGORIAS.map(c => <option key={c} value={c}>{c}</option>)}
              </select>

              {/* Tipo — aparece automáticamente según la categoría */}
              {form.categoria && (
                <>
                  <label>Tipo *</label>
                  <select value={form.tipo} onChange={(e) => setForm({ ...form, tipo: e.target.value })}>
                    <option value="">— Seleccionar tipo —</option>
                    {getTipoOpciones(form.categoria).map(t => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </>
              )}

              {/* Subcategoría — se carga desde el backend + botón "+" */}
              {form.categoria && (
                <>
                  <label>Subcategoría</label>
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    <select
                      style={{ flex: 1 }}
                      value={form.subcategoria}
                      onChange={(e) => setForm({ ...form, subcategoria: e.target.value })}
                      disabled={loadingSubcats}
                    >
                      <option value="">— Seleccionar subcategoría —</option>
                      {subcategorias.map(s => (
                        <option key={s.id} value={s.nombre}>{s.nombre}</option>
                      ))}
                    </select>
                    {/* Botón "+" para agregar subcategoría nueva */}
                    <button
                      className="btn-accent"
                      style={{ padding: '8px 14px', fontSize: '18px', lineHeight: 1 }}
                      title="Agregar subcategoría nueva"
                      onClick={() => { setShowNuevaSubcat(!showNuevaSubcat); setNuevaSubcat(""); }}
                    >
                      +
                    </button>
                  </div>

                  {/* Campo para escribir la subcategoría nueva */}
                  {showNuevaSubcat && (
                    <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
                      <input
                        style={{ flex: 1 }}
                        placeholder={`Nueva subcategoría para ${form.categoria}`}
                        value={nuevaSubcat}
                        onChange={(e) => setNuevaSubcat(e.target.value)}
                        onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleGuardarNuevaSubcat(); } }}
                        autoFocus
                      />
                      <button
                        className="btn-primary"
                        onClick={handleGuardarNuevaSubcat}
                        disabled={savingSubcat || !nuevaSubcat.trim()}
                      >
                        {savingSubcat ? "..." : "Guardar"}
                      </button>
                      <button
                        className="btn-outline"
                        onClick={() => { setShowNuevaSubcat(false); setNuevaSubcat(""); }}
                      >
                        Cancelar
                      </button>
                    </div>
                  )}
                </>
              )}

              {/* Presentación */}
              <label>Presentación *</label>
              <input
                placeholder="Ej: Caja, Bolsa, Litro"
                value={form.presentacion || ""}
                onChange={(e) => setForm({ ...form, presentacion: e.target.value })}
              />

              {/* Unidad */}
              <label>Unidad *</label>
              <input
                placeholder="Ej: kg, litros, unidades"
                value={form.unidad || ""}
                onChange={(e) => setForm({ ...form, unidad: e.target.value })}
              />

              {/* Stock mínimo */}
              <label>Stock mínimo</label>
              <input
                type="number"
                placeholder="0"
                value={form.minimo || 0}
                min={0}
                step={1}
                onChange={(e) => setForm({ ...form, minimo: e.target.value })}
              />

              <div className="form-actions">
                <button className="btn btn-outline compact-btn" onClick={() => setShowModal(false)}>
                  Cancelar
                </button>
                <button className="btn btn-primary compact-btn" onClick={handleSave} disabled={saving}>
                  {saving ? "Guardando..." : "Guardar"}
                </button>
              </div>
              <small style={{ display: "block", marginTop: "8px", textAlign: "center", color: "var(--gray-600)" }}>
                Esc = Cerrar
              </small>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}

export default Productos;
