import React, { useEffect, useState, useRef } from "react";
import axios from "axios";
import { DELETE_CONFIRM_TEXT } from '../constants/messages';

function Productos({ onBack }) {
  const [productos, setProductos] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editProducto, setEditProducto] = useState(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    nombre: "",
    tipo: "",
    categoria: "",
    subcategoria: "",
    presentacion: "",
    unidad: "",
    minimo: 0,
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
      const res = await axios.get("http://localhost:4000/api/productos", {
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
        tipo: "",
        categoria: "",
        subcategoria: "",
        presentacion: "",
        unidad: "",
        minimo: 0,
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
          `http://localhost:4000/api/productos/${editProducto.id}`,
          payload,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        showToast("Producto actualizado", "success");
      } else {
        await axios.post("http://localhost:4000/api/productos", payload, {
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
      await axios.delete(`http://localhost:4000/api/productos/${id}`, {
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
    <div style={{ padding: "20px", position: "relative" }}>
      <h2>🧾 Gestión de Productos</h2>

      {/* Toast abajo-centro */}
      {toast.visible && (
        <div style={{ ...toastStyle, ...(toast.type === "error" ? toastErrorStyle : {}) }}>
          {toast.message}
        </div>
      )}

      <div style={{ display: "flex", gap: "8px", marginBottom: "12px" }}>
        <button ref={newButtonRef} onClick={() => handleOpenModal()}>➕ Nuevo producto</button>
        <button onClick={onBack}>⬅ Volver</button>

        <input
          placeholder="🔎 Buscar (nombre, categoría, subcat...)"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ marginLeft: "8px", flex: 1, padding: "6px" }}
        />

        <select value={filterTipo} onChange={(e) => setFilterTipo(e.target.value)}>
          <option value="">— Tipo —</option>
          <option value="uso">Uso</option>
          <option value="consumo">Consumo</option>
        </select>

        <select value={filterCategoria} onChange={(e) => setFilterCategoria(e.target.value)}>
          <option value="">— Categoría —</option>
          {categorias.map((c,i)=> <option key={i} value={c}>{c}</option>)}
        </select>

        <select value={filterSubcategoria} onChange={(e) => setFilterSubcategoria(e.target.value)}>
          <option value="">— Subcategoría —</option>
          {subcategorias.map((s,i)=> <option key={i} value={s}>{s}</option>)}
        </select>
      </div>

      <table border="1" cellPadding="6" style={{ width: "100%", borderCollapse: "collapse" }}>
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
                <button onClick={() => handleOpenModal(p)}>✏️</button>
                <button onClick={() => handleDelete(p.id)}>🗑️</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {showModal && (
        <div className="app-modal-overlay" onClick={(e)=>{ if(e.target===e.currentTarget){ setShowModal(false); setCategoriaSuggestions([]); setSubcategoriaSuggestions([]); } }}>
          <div style={modalStyle} role="dialog" aria-modal="true" aria-labelledby="modal-title">
            <h3 id="modal-title">{editProducto ? "Editar producto" : "Nuevo producto"}</h3>
            <input ref={nombreRef} placeholder="Nombre" value={form.nombre} onChange={(e)=> setForm({...form, nombre: e.target.value})} />
          <select value={form.tipo} onChange={(e)=> setForm({...form, tipo: e.target.value})}>
            <option value="">-- Tipo --</option>
            <option value="uso">Uso</option>
            <option value="consumo">Consumo</option>
          </select>

          <div style={{ position: "relative" }}>
            <input ref={categoriaRef} placeholder="Categoría" value={form.categoria||""} onChange={(e)=> handleCategoriaChange(e.target.value)} />
            {categoriaSuggestions.length > 0 && (
              <ul style={listStyle}>
                {categoriaSuggestions.map((c,i)=> <li key={i} onClick={() => { setForm({...form, categoria:c}); setCategoriaSuggestions([]); }} style={itemStyle}>{c}</li>)}
              </ul>
            )}
          </div>

          <div style={{ position: "relative" }}>
            <input ref={subcategoriaRef} placeholder="Subcategoría" value={form.subcategoria||""} onChange={(e)=> handleSubcategoriaChange(e.target.value)} />
            {subcategoriaSuggestions.length > 0 && (
              <ul style={listStyle}>
                {subcategoriaSuggestions.map((s,i)=> <li key={i} onClick={() => { setForm({...form, subcategoria:s}); setSubcategoriaSuggestions([]); }} style={itemStyle}>{s}</li>)}
              </ul>
            )}
          </div>

          <input placeholder="Presentación" value={form.presentacion||""} onChange={(e)=> setForm({...form, presentacion: e.target.value})} />
          <input placeholder="Unidad" value={form.unidad||""} onChange={(e)=> setForm({...form, unidad: e.target.value})} />
          <input type="number" placeholder="Mínimo" value={form.minimo||0} min={0} step={1} onChange={(e)=> setForm({...form, minimo: e.target.value})} />

          <div style={{ marginTop: "10px" }}>
            <button onClick={handleSave} disabled={saving}>{saving ? 'Guardando...' : '💾 Guardar'}</button>
            <button onClick={() => setShowModal(false)} style={{ marginLeft: "8px" }}>Cancelar</button>
          </div>
          <small style={{ display: "block", marginTop: "6px", color: "#666" }}>Enter = Guardar · Esc = Cancelar</small>
          </div>
        </div>
        )}
    </div>
  );
}

// styles
const modalStyle = {
  position: "fixed",
  top: "50%",
  left: "50%",
  transform: "translate(-50%, -50%)",
  background: "#fff",
  padding: "18px",
  border: "1px solid #ccc",
  borderRadius: "8px",
  zIndex: 1000,
  width: "420px",
  boxShadow: "0 10px 30px rgba(0,0,0,0.12)"
};

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

const toastStyle = {
  position: "fixed",
  bottom: "18px",
  left: "50%",
  transform: "translateX(-50%)",
  background: "#2b8a3e",
  color: "#fff",
  padding: "10px 14px",
  borderRadius: "8px",
  boxShadow: "0 6px 18px rgba(0,0,0,0.12)",
  zIndex: 3000,
};

const toastErrorStyle = {
  background: "#c94b4b",
};

export default Productos;
