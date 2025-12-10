import React, { useEffect, useState, useRef } from "react";
import axios from "axios";
import API_BASE_URL from '../config';
import { DELETE_CONFIRM_TEXT } from '../constants/messages';

function Productos({ onBack }) {
  const [productos, setProductos] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editProducto, setEditProducto] = useState(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    nombre: "",
    categoria: "",
    subcategoria: "",
    presentacion: "",
    unidad: "",
    minimo: 0,
    tipo: "", // uso o consumo
    perecedero: "", // para Alimentos
    clasificacion: "", // para Ferretería/Bazar/Limpieza/Librería (uso/consumo)
    tipoLimpieza: "", // para Limpieza (productos/elementos/descartables)
    tipoLibreria: "", // para Librería (elementos/insumos)
    fechaVencimiento: "",
  });

  // filtros y buscador
  const [search, setSearch] = useState("");
  const [filterTipo, setFilterTipo] = useState("");
  const [filterCategoria, setFilterCategoria] = useState("");
  const [filterSubcategoria, setFilterSubcategoria] = useState("");

  // suggestions para categoria/subcategoria dentro del modal
  const [categorias, setCategorias] = useState([]);
  const [subcategorias, setSubcategorias] = useState([]);
  const [categoriaSuggestions, setCategoriaSuggestions] = useState([]);
  const [subcategoriaSuggestions, setSubcategoriaSuggestions] = useState([]);

  // toast abajo-centro
  const [toast, setToast] = useState({ visible: false, message: "", type: "success" });
  const toastTimer = useRef(null);

  const categoriaRef = useRef(null);
  const subcategoriaRef = useRef(null);
  const nombreRef = useRef(null);
  const newButtonRef = useRef(null);

  useEffect(() => {
    fetchProductos();
    return () => { if (toastTimer.current) clearTimeout(toastTimer.current); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    // actualizar listas de categorias y subcategorias desde productos
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

  const handleOpenModal = (producto = null) => {
    setEditProducto(producto);
    setForm(
      producto || {
        nombre: "",
        categoria: "",
        subcategoria: "",
        presentacion: "",
        unidad: "",
        minimo: 0,
        tipo: "",
        perecedero: "",
        clasificacion: "",
        tipoLimpieza: "",
        tipoLibreria: "",
        fechaVencimiento: "",
      }
    );
    setCategoriaSuggestions([]);
    setSubcategoriaSuggestions([]);
    setShowModal(true);
    setTimeout(()=>nombreRef.current && nombreRef.current.focus(), 60);
  };

  // validación productos: nombre, categoria, presentacion, unidad
  const validProducto = () => {
    if (!form.nombre || !form.nombre.trim()) { showToast("Nombre es obligatorio", "error"); return false; }
    if (!form.categoria || !form.categoria.trim()) { showToast("Categoría es obligatoria", "error"); return false; }
    if (!form.presentacion || !form.presentacion.toString().trim()) { showToast("Presentación es obligatoria", "error"); return false; }
    if (!form.unidad || !form.unidad.trim()) { showToast("Unidad es obligatoria", "error"); return false; }
    const minVal = Number(form.minimo);
    if (!Number.isInteger(minVal) || minVal < 0) { showToast("Mínimo debe ser entero >= 0", "error"); return false; }
    return true;
  };

  const handleSave = async () => {
    if (!validProducto()) return;
    if (saving) return; // evitar doble envío
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
  // devolver foco al botón Nuevo producto para accesibilidad
  setTimeout(()=>{ if(newButtonRef.current) newButtonRef.current.focus(); }, 60);
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
      // detectar violación FK en mensaje del backend
      const msg = (err.response && err.response.data && (err.response.data.error || err.response.data.message)) || err.message || "";
      if (msg.toLowerCase().includes("foreign") || msg.toLowerCase().includes("violates") || msg.toLowerCase().includes("referential")) {
        showToast("No se puede eliminar: tiene movimientos registrados", "error");
      } else {
        showToast("Error al eliminar producto", "error");
      }
    }
  };

  // buscador general y filtros (cliente-side)
  const filtered = productos.filter(p => {
    const q = search.trim().toLowerCase();
    if (q) {
      const matchesSearch =
        (p.nombre || "").toLowerCase().includes(q) ||
        (p.categoria || "").toLowerCase().includes(q) ||
        (p.subcategoria || "").toLowerCase().includes(q) ||
        (p.presentacion || "").toLowerCase().includes(q) ||
        (p.unidad || "").toLowerCase().includes(q);
      if (!matchesSearch) return false;
    }
    if (filterTipo && p.tipo !== filterTipo) return false;
    if (filterCategoria && p.categoria !== filterCategoria) return false;
    if (filterSubcategoria && p.subcategoria !== filterSubcategoria) return false;
    return true;
  });

  // teclado modal: Esc y Enter
  useEffect(() => {
    const handleKey = (e) => {
      if (e.key === "Escape") {
        if (showModal) {
          setShowModal(false);
          setCategoriaSuggestions([]);
          setSubcategoriaSuggestions([]);
        }
      }
      if (e.key === "Enter") {
        if (showModal) {
          e.preventDefault();
          if (validProducto()) handleSave();
        }
      }
    };
    if (showModal) window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showModal, form, editProducto]);

  // categoria/subcategoria suggestions
  const handleCategoriaChange = (v) => {
    setForm({ ...form, categoria: v });
    const s = categorias.filter(c => c.toLowerCase().includes((v||"").toLowerCase()));
    setCategoriaSuggestions(s);
  };
  const handleSubcategoriaChange = (v) => {
    setForm({ ...form, subcategoria: v });
    const s = subcategorias.filter(su => su.toLowerCase().includes((v||"").toLowerCase()));
    setSubcategoriaSuggestions(s);
  };

  return (
    <div className="main-content">
      <div className="card card-responsive">
        {/* Toast abajo-centro */}
        {toast.visible && (
          <div className="toast" style={{ background: toast.type === "error" ? 'var(--error)' : 'var(--success)', color: 'var(--white)', left: '50%', transform: 'translateX(-50%)', minWidth: 220, fontWeight: 500, fontSize: '1.05rem', zIndex: 2000 }}>
            {toast.message}
          </div>
        )}

        {/* Header con título y botones */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' }}>
          <h2 style={{ margin: 0, fontSize: '24px', color: 'var(--primary)', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span>🧾</span>
            <span>Gestión de Productos</span>
          </h2>
          <div style={{ display: 'flex', gap: '12px' }}>
            <button ref={newButtonRef} className="btn-primary" onClick={() => handleOpenModal()}>➕ Nuevo producto</button>
            <button className="btn-outline" onClick={onBack}>⬅ Volver</button>
          </div>
        </div>

        {/* Filtros y búsqueda */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px', marginBottom: '24px' }}>
          <input
            className="input"
            placeholder="🔎 Buscar (nombre, categoría...)"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />

          <select className="input" value={filterTipo} onChange={(e) => setFilterTipo(e.target.value)}>
            <option value="">— Tipo —</option>
            <option value="uso">Uso</option>
            <option value="consumo">Consumo</option>
          </select>

          <select className="input" value={filterCategoria} onChange={(e) => setFilterCategoria(e.target.value)}>
            <option value="">— Categoría —</option>
            {categorias.map((c,i)=> <option key={i} value={c}>{c}</option>)}
          </select>

          <select className="input" value={filterSubcategoria} onChange={(e) => setFilterSubcategoria(e.target.value)}>
            <option value="">— Subcategoría —</option>
            {subcategorias.map((s,i)=> <option key={i} value={s}>{s}</option>)}
          </select>
        </div>

        <div style={{ overflowX: 'auto' }}>
        <table className="data-table" style={{ width: "100%", background: 'var(--white)' }}>
          <thead>
            <tr>
              <th>Nombre</th>
              <th>Tipo</th>
              <th>Categoría</th>
              <th>Subcategoría</th>
              <th>Presentación</th>
              <th>Unidad</th>
              <th>Mínimo</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(p => (
              <tr key={p.id}>
                <td>{p.nombre}</td>
                <td>{p.tipo}</td>
                <td>{p.categoria}</td>
                <td>{p.subcategoria}</td>
                <td>{p.presentacion}</td>
                <td>{p.unidad}</td>
                <td>{p.minimo}</td>
                <td>
                  <button className="btn btn-ghost compact-btn" onClick={() => handleOpenModal(p)}>✏️</button>
                  <button className="btn btn-ghost compact-btn" onClick={() => handleDelete(p.id)}>🗑️</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="app-modal-overlay" onClick={(e)=>{ if(e.target===e.currentTarget){ setShowModal(false); setCategoriaSuggestions([]); setSubcategoriaSuggestions([]); } }}>
          <div className="modal-content" role="dialog" aria-modal="true" aria-labelledby="modal-title">
            <h3 id="modal-title">{editProducto ? "Editar producto" : "Nuevo producto"}</h3>
            
            {/* Nombre - obligatorio */}
            <label>Nombre *</label>
            <input ref={nombreRef} placeholder="Nombre del producto" value={form.nombre} onChange={(e)=> setForm({...form, nombre: e.target.value})} />
            
            {/* Categoría - obligatorio */}
            <label>Categoría *</label>
            <select value={form.categoria} onChange={(e) => { setForm({...form, categoria: e.target.value, subcategoria: ""}); setSubcategoriaSuggestions([]); }}>
              <option value="">-- Seleccionar --</option>
              <option value="Alimentos">Alimentos</option>
              <option value="Ferretería">Ferretería</option>
              <option value="Bazar">Bazar</option>
              <option value="Limpieza">Limpieza</option>
              <option value="Librería">Librería</option>
              <option value="Equipamiento">Equipamiento</option>
            </select>

            {/* Subcategoría - dependiente de Categoría */}
            {form.categoria && (
              <>
                <label>Subcategoría *</label>
                <select value={form.subcategoria} onChange={(e) => setForm({...form, subcategoria: e.target.value})}>
                  <option value="">-- Seleccionar --</option>
                  
                  {form.categoria === "Alimentos" && (
                    <>
                      <option value="Cárnico">Cárnico</option>
                      <option value="Almacén">Almacén</option>
                      <option value="Verduras">Verduras</option>
                      <option value="Frutas">Frutas</option>
                    </>
                  )}
                  
                  {form.categoria === "Ferretería" && (
                    <>
                      <option value="Electricidad">Electricidad</option>
                      <option value="Sanitario">Sanitario</option>
                      <option value="Herrajes y Construcción">Herrajes y Construcción</option>
                      <option value="Herramientas">Herramientas</option>
                      <option value="Seguridad">Seguridad</option>
                    </>
                  )}
                  
                  {form.categoria === "Bazar" && (
                    <>
                      <option value="Electrónica">Electrónica</option>
                      <option value="Decoración">Decoración</option>
                      <option value="Textiles">Textiles</option>
                    </>
                  )}
                  
                  {form.categoria === "Limpieza" && (
                    <>
                      <option value="Productos Químicos">Productos Químicos</option>
                      <option value="Elementos">Elementos</option>
                      <option value="Descartables">Descartables</option>
                      <option value="Papelería">Papelería</option>
                    </>
                  )}
                  
                  {form.categoria === "Librería" && (
                    <>
                      <option value="Elementos">Elementos</option>
                      <option value="Insumos">Insumos</option>
                    </>
                  )}
                  
                  {form.categoria === "Equipamiento" && (
                    <>
                      <option value="Mobiliario">Mobiliario</option>
                      <option value="Insumos">Insumos</option>
                      <option value="Informática">Informática</option>
                      <option value="Microbiología">Microbiología</option>
                      <option value="Música">Música</option>
                      <option value="Deportivos">Deportivos</option>
                      <option value="Jardinería">Jardinería</option>
                    </>
                  )}
                </select>
              </>
            )}

            {/* Campos específicos según Categoría */}
            {form.categoria === "Alimentos" && (
              <>
                <label>Tipo *</label>
                <select value={form.perecedero} onChange={(e) => setForm({...form, perecedero: e.target.value})}>
                  <option value="">-- Seleccionar --</option>
                  <option value="perecedero">Perecedero</option>
                  <option value="no-perecedero">No Perecedero</option>
                </select>
              </>
            )}

            {(form.categoria === "Ferretería" || form.categoria === "Bazar" || form.categoria === "Librería") && (
              <>
                <label>Tipo *</label>
                <select value={form.clasificacion} onChange={(e) => setForm({...form, clasificacion: e.target.value})}>
                  <option value="">-- Seleccionar --</option>
                  <option value="uso">Uso</option>
                  <option value="consumo">Consumo</option>
                </select>
              </>
            )}

            {form.categoria === "Limpieza" && (
              <>
                <label>Tipo *</label>
                <select value={form.clasificacion} onChange={(e) => setForm({...form, clasificacion: e.target.value})}>
                  <option value="">-- Seleccionar --</option>
                  <option value="uso">Uso</option>
                  <option value="consumo">Consumo</option>
                </select>
              </>
            )}

            {form.categoria === "Equipamiento" && (
              <>
                <label>Tipo *</label>
                <select value={form.clasificacion} onChange={(e) => setForm({...form, clasificacion: e.target.value})}>
                  <option value="">-- Seleccionar --</option>
                  <option value="uso">Uso</option>
                  <option value="consumo">Consumo</option>
                </select>
              </>
            )}

            {/* Presentación y Unidad */}
            <label>Presentación *</label>
            <input placeholder="Ej: Caja, Bolsa, Litro" value={form.presentacion||""} onChange={(e)=> setForm({...form, presentacion: e.target.value})} />
            
            <label>Unidad *</label>
            <input placeholder="Ej: kg, litros, unidades" value={form.unidad||""} onChange={(e)=> setForm({...form, unidad: e.target.value})} />
            
            {/* Stock Mínimo */}
            <label>Stock Mínimo</label>
            <input type="number" placeholder="0" value={form.minimo||0} min={0} step={1} onChange={(e)=> setForm({...form, minimo: e.target.value})} />

            {/* Fecha de Vencimiento (opcional, para perecederos) */}
            {form.categoria === "Alimentos" && form.perecedero === "perecedero" && (
              <>
                <label>Fecha de Vencimiento</label>
                <input type="date" value={form.fechaVencimiento||""} onChange={(e)=> setForm({...form, fechaVencimiento: e.target.value})} />
              </>
            )}

            <div className="form-actions">
              <button className="btn btn-outline compact-btn" onClick={() => setShowModal(false)}>Cancelar</button>
              <button className="btn btn-primary compact-btn" onClick={handleSave} disabled={saving}>{saving ? 'Guardando...' : '💾 Guardar'}</button>
            </div>
            <small style={{ display: "block", marginTop: "8px", textAlign: "center", color: "var(--gray-600)" }}>Enter = Guardar · Esc = Cancelar</small>
          </div>
        </div>
      )}
      </div>
    </div>
  );
}

// styles
const listStyle = {
  position: "absolute",
  top: "100%",
  left: 0,
  right: 0,
  background: "#fff",
  border: "1px solid #ccc",
  listStyle: "none",
  padding: 0,
  margin: 0,
  maxHeight: "140px",
  overflowY: "auto",
  zIndex: 2000,
};

const itemStyle = {
  padding: "8px",
  cursor: "pointer",
  borderBottom: "1px solid #eee",
};

export default Productos;
