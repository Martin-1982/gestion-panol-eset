import React, { useEffect, useState, useRef } from "react";
import axios from "axios";
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
      const res = await axios.get("http://localhost:4000/api/proveedores", {
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
        await axios.put(`http://localhost:4000/api/proveedores/${editProveedor.id}`, form, {
          headers: { Authorization: `Bearer ${token}` },
        });
        showToast("Proveedor actualizado", "success");
      } else {
        await axios.post("http://localhost:4000/api/proveedores", form, {
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
      await axios.delete(`http://localhost:4000/api/proveedores/${id}`, {
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
    <div style={{ padding: "20px", position: "relative" }}>
      <h2>🏢 Gestión de Proveedores</h2>

      {/* Toast abajo-centro */}
      {toast.visible && (
        <div style={{ ...toastStyle, ...(toast.type === "error" ? toastErrorStyle : {}) }}>
          {toast.message}
        </div>
      )}

      <div style={{ display: "flex", gap: "8px", marginBottom: "12px" }}>
        <button onClick={() => handleOpenModal()}>➕ Nuevo proveedor</button>
        <button onClick={onBack}>⬅ Volver</button>

        <input
          placeholder="🔎 Buscar proveedor..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ marginLeft: "8px", flex: 1, padding: "6px" }}
        />
      </div>

      <table border="1" cellPadding="6" style={{ width: "100%", borderCollapse: "collapse" }}>
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
                <button onClick={() => handleOpenModal(p)}>✏️</button>
                <button onClick={() => handleDelete(p.id)}>🗑️</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {showModal && (
        <div className="app-modal-overlay" onClick={(e)=>{ if(e.target===e.currentTarget){ setShowModal(false); setNombreSuggestions([]); } }}>
          <div style={{...modalStyle, width: '360px'}} role="dialog" aria-modal="true">
          <h3>{editProveedor ? "Editar proveedor" : "Nuevo proveedor"}</h3>
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

          <input placeholder="Contacto" value={form.contacto} onChange={(e)=> setForm({...form, contacto: e.target.value})} />
          <input placeholder="Teléfono" value={form.telefono} onChange={(e)=> setForm({...form, telefono: e.target.value})} />
          <input placeholder="Dirección" value={form.direccion} onChange={(e)=> setForm({...form, direccion: e.target.value})} />
          <input placeholder="Email" value={form.email} onChange={(e)=> setForm({...form, email: e.target.value})} />

          <div style={{ marginTop: "10px" }}>
            <button onClick={handleSave}>💾 Guardar</button>
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

export default Proveedores;
