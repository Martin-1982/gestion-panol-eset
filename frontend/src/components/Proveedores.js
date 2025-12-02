import React, { useEffect, useState, useRef } from "react";
import axios from "axios";
import API_BASE_URL from '../config';
import { DELETE_CONFIRM_TEXT } from '../constants/messages';

function Proveedores({ onBack }) {
  const [proveedores, setProveedores] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editProveedor, setEditProveedor] = useState(null);
  const [form, setForm] = useState({
    nombre: "",
    contacto: "",
    telefono: "",
    direccion: "",
    email: "",
  });

  // buscador general
  const [search, setSearch] = useState("");
  const [toast, setToast] = useState({ visible: false, message: "", type: "success" });
  const toastTimer = useRef(null);

  // suggestions (modal)
  const [nombreSuggestions, setNombreSuggestions] = useState([]);
  const nombreRef = useRef(null);

  useEffect(() => {
    fetchProveedores();
    return () => { if (toastTimer.current) clearTimeout(toastTimer.current); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const showToast = (message, type = "success", ms = 1600) => {
    setToast({ visible: true, message, type });
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast({ visible: false, message: "", type: "success" }), ms);
  };

  const fetchProveedores = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await axios.get(`${API_BASE_URL}/api/proveedores`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setProveedores(res.data);
    } catch (err) {
      console.error("❌ Error al cargar proveedores:", err);
      showToast("Error al cargar proveedores", "error");
    }
  };

  const handleOpenModal = (proveedor = null) => {
    setEditProveedor(proveedor);
    setForm(
      proveedor || {
        nombre: "",
        contacto: "",
        telefono: "",
        direccion: "",
        email: "",
      }
    );
    setNombreSuggestions([]);
    setShowModal(true);
    setTimeout(()=>nombreRef.current && nombreRef.current.focus(), 60);
  };

  // validación proveedor: nombre, contacto, y al menos una de direccion/telefono/email
  const validProveedor = (vals = form) => {
    if (!vals.nombre || !vals.nombre.trim()) { showToast("Nombre es obligatorio", "error"); return false; }
    if (!vals.contacto || !vals.contacto.trim()) { showToast("Contacto es obligatorio", "error"); return false; }
    if (!(vals.direccion && vals.direccion.trim()) && !(vals.telefono && vals.telefono.trim()) && !(vals.email && vals.email.trim())) {
      showToast("Indique al menos Dirección, Teléfono o Email", "error"); return false;
    }
    return true;
  };

  const handleSave = async () => {
    if (!validProveedor()) return;
    try {
      const token = localStorage.getItem("token");
      if (editProveedor) {
        await axios.put(`${API_BASE_URL}/api/proveedores/${editProveedor.id}`, form, {
          headers: { Authorization: `Bearer ${token}` },
        });
        showToast("Proveedor actualizado", "success");
      } else {
        await axios.post(`${API_BASE_URL}/api/proveedores`, form, {
          headers: { Authorization: `Bearer ${token}` },
        });
        showToast("Proveedor agregado", "success");
      }
      setShowModal(false);
      fetchProveedores();
    } catch (err) {
      console.error("❌ Error al guardar proveedor:", err);
      showToast("Error al guardar proveedor", "error");
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm(DELETE_CONFIRM_TEXT)) return;
    try {
      const token = localStorage.getItem("token");
      await axios.delete(`${API_BASE_URL}/api/proveedores/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      showToast("Proveedor eliminado", "success");
      fetchProveedores();
    } catch (err) {
      console.error("❌ Error al eliminar proveedor:", err);
      const msg = (err.response && err.response.data && (err.response.data.error || err.response.data.message)) || err.message || "";
      if (msg.toLowerCase().includes("foreign") || msg.toLowerCase().includes("violates") || msg.toLowerCase().includes("referential")) {
        showToast("No se puede eliminar: tiene movimientos registrados", "error");
      } else {
        showToast("Error al eliminar proveedor", "error");
      }
    }
  };

  // filtro cliente-side
  const filtered = proveedores.filter(p => {
    const q = search.trim().toLowerCase();
    if (!q) return true;
    return (
      (p.nombre || "").toLowerCase().includes(q) ||
      (p.contacto || "").toLowerCase().includes(q) ||
      (p.telefono || "").toLowerCase().includes(q) ||
      (p.email || "").toLowerCase().includes(q)
    );
  });

  // teclado modal: Esc y Enter
  useEffect(() => {
    const handleKey = (e) => {
      if (e.key === "Escape") {
        if (showModal) setShowModal(false);
        setNombreSuggestions([]);
      }
      if (e.key === "Enter") {
        if (showModal) {
          e.preventDefault();
          if (validProveedor()) handleSave();
        }
      }
    };
    if (showModal) window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showModal, form, editProveedor]);

  // nombre suggestions (modal)
  const handleNombreChange = (v) => {
    setForm({ ...form, nombre: v });
    const s = proveedores.map(p => p.nombre).filter(Boolean).filter(n => n.toLowerCase().includes((v||"").toLowerCase()));
    setNombreSuggestions(s);
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
            <span>🏢</span>
            <span>Gestión de Proveedores</span>
          </h2>
          <div style={{ display: 'flex', gap: '12px' }}>
            <button className="btn-primary" onClick={() => handleOpenModal()}>➕ Nuevo proveedor</button>
            <button className="btn-outline" onClick={onBack}>⬅ Volver</button>
          </div>
        </div>

        {/* Búsqueda */}
        <div style={{ marginBottom: '24px' }}>
          <input
            className="input"
            placeholder="🔎 Buscar proveedor..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ maxWidth: '400px' }}
          />
        </div>

      <div style={{ overflowX: 'auto' }}>
        <table className="data-table" style={{ width: "100%", background: 'var(--white)' }}>
          <thead>
            <tr>
              <th>Nombre</th>
              <th>Contacto</th>
              <th>Teléfono</th>
              <th>Dirección</th>
              <th>Email</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(p => (
              <tr key={p.id}>
                <td>{p.nombre}</td>
                <td>{p.contacto}</td>
                <td>{p.telefono}</td>
                <td>{p.direccion}</td>
                <td>{p.email}</td>
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
        <div className="app-modal-overlay" onClick={(e)=>{ if(e.target===e.currentTarget){ setShowModal(false); setNombreSuggestions([]); } }}>
          <div className="modal-content" role="dialog" aria-modal="true">
            <h3>{editProveedor ? "Editar proveedor" : "Nuevo proveedor"}</h3>
            
            <label>Nombre del proveedor</label>
            <div style={{ position: "relative" }}>
              <input
                ref={nombreRef}
                placeholder="Nombre"
                value={form.nombre}
                onChange={(e) => handleNombreChange(e.target.value)}
              />
              {nombreSuggestions.length > 0 && (
                <ul style={listStyle}>
                  {nombreSuggestions.map((n,i)=> <li key={i} onClick={() => { setForm({...form, nombre:n}); setNombreSuggestions([]); }} style={itemStyle}>{n}</li>)}
                </ul>
              )}
            </div>

            <label>Persona de contacto</label>
            <input placeholder="Nombre del contacto" value={form.contacto} onChange={(e)=> setForm({...form, contacto: e.target.value})} />
            
            <label>Teléfono</label>
            <input placeholder="Número de teléfono" value={form.telefono} onChange={(e)=> setForm({...form, telefono: e.target.value})} />
            
            <label>Dirección</label>
            <input placeholder="Dirección completa" value={form.direccion} onChange={(e)=> setForm({...form, direccion: e.target.value})} />
            
            <label>Email</label>
            <input type="email" placeholder="correo@ejemplo.com" value={form.email} onChange={(e)=> setForm({...form, email: e.target.value})} />

            <div className="form-actions">
              <button className="btn-outline" onClick={() => setShowModal(false)}>Cancelar</button>
              <button className="btn-primary" onClick={handleSave}>💾 Guardar</button>
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

export default Proveedores;
