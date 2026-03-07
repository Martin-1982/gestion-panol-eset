import React, { useEffect, useState, useRef } from "react";
import axios from "axios";
import API_BASE_URL from '../config';
import { DELETE_CONFIRM_TEXT } from '../constants/messages';

function Proveedores({ onBack }) {
  const [proveedores, setProveedores] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editProveedor, setEditProveedor] = useState(null);
  const [form, setForm] = useState({ nombre: "", contacto: "", telefono: "", direccion: "", email: "" });
  const [search, setSearch] = useState("");
  const [toast, setToast] = useState({ visible: false, message: "", type: "success" });
  const toastTimer = useRef(null);
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
      const res = await axios.get(`${API_BASE_URL}/api/proveedores`, { headers: { Authorization: `Bearer ${token}` } });
      setProveedores(res.data);
    } catch (err) {
      console.error("❌ Error al cargar proveedores:", err);
      showToast("Error al cargar proveedores", "error");
    }
  };

  const handleOpenModal = (proveedor = null) => {
    setEditProveedor(proveedor);
    setForm(proveedor || { nombre: "", contacto: "", telefono: "", direccion: "", email: "" });
    setShowModal(true);
    setTimeout(() => nombreRef.current && nombreRef.current.focus(), 60);
  };

  const validProveedor = () => {
    if (!form.nombre || !form.nombre.trim()) { showToast("Nombre es obligatorio", "error"); return false; }
    if (!form.contacto || !form.contacto.trim()) { showToast("Contacto es obligatorio", "error"); return false; }
    if (!(form.direccion && form.direccion.trim()) && !(form.telefono && form.telefono.trim()) && !(form.email && form.email.trim())) {
      showToast("Indique al menos Dirección, Teléfono o Email", "error"); return false;
    }
    return true;
  };

  const handleSave = async () => {
    if (!validProveedor()) return;
    try {
      const token = localStorage.getItem("token");
      if (editProveedor) {
        await axios.put(`${API_BASE_URL}/api/proveedores/${editProveedor.id}`, form, { headers: { Authorization: `Bearer ${token}` } });
        showToast("Proveedor actualizado", "success");
      } else {
        await axios.post(`${API_BASE_URL}/api/proveedores`, form, { headers: { Authorization: `Bearer ${token}` } });
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
      await axios.delete(`${API_BASE_URL}/api/proveedores/${id}`, { headers: { Authorization: `Bearer ${token}` } });
      showToast("Proveedor eliminado", "success");
      fetchProveedores();
    } catch (err) {
      console.error("❌ Error al eliminar proveedor:", err);
      const msg = (err.response?.data?.error || err.response?.data?.message || err.message || "").toLowerCase();
      if (msg.includes("foreign") || msg.includes("violates") || msg.includes("referential")) {
        showToast("No se puede eliminar: tiene movimientos registrados", "error");
      } else {
        showToast("Error al eliminar proveedor", "error");
      }
    }
  };

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

  useEffect(() => {
    const handleKey = (e) => {
      if (e.key === "Escape" && showModal) setShowModal(false);
      if (e.key === "Enter" && showModal) { e.preventDefault(); if (validProveedor()) handleSave(); }
    };
    if (showModal) window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showModal, form, editProveedor]);

  return (
    <div className="main-content">
      <div className="card card-responsive">

        {toast.visible && (
          <div className="toast" style={{ background: toast.type === "error" ? 'var(--error)' : 'var(--success)', color: 'var(--white)', left: '50%', transform: 'translateX(-50%)', minWidth: 220, fontWeight: 500, fontSize: '1.05rem', zIndex: 2000 }}>
            {toast.message}
          </div>
        )}

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
              {filtered.length === 0 ? (
                <tr><td colSpan={6} style={{ textAlign: 'center', color: 'var(--gray-500)', padding: '24px' }}>No hay proveedores cargados</td></tr>
              ) : (
                filtered.map(p => (
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
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Modal nuevo/editar proveedor — se mantiene inline porque maneja edición también */}
        {showModal && (
          <div className="app-modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) setShowModal(false); }}>
            <div className="modal-content" role="dialog" aria-modal="true">
              <h3>{editProveedor ? "Editar proveedor" : "Nuevo proveedor"}</h3>

              <label>Nombre *</label>
              <input className="input" ref={nombreRef} placeholder="Nombre del proveedor" value={form.nombre} onChange={(e) => setForm({ ...form, nombre: e.target.value })} />

              <label>Persona de contacto</label>
              <input className="input" placeholder="Nombre del contacto" value={form.contacto} onChange={(e) => setForm({ ...form, contacto: e.target.value })} />

              <label>Teléfono</label>
              <input className="input" placeholder="Número de teléfono" value={form.telefono} onChange={(e) => setForm({ ...form, telefono: e.target.value })} />

              <label>Dirección</label>
              <input className="input" placeholder="Dirección completa" value={form.direccion} onChange={(e) => setForm({ ...form, direccion: e.target.value })} />

              <label>Email</label>
              <input className="input" type="email" placeholder="correo@ejemplo.com" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />

              <div className="form-actions">
                <button className="btn btn-outline compact-btn" onClick={() => setShowModal(false)}>Cancelar</button>
                <button className="btn btn-primary compact-btn" onClick={handleSave}>💾 Guardar</button>
              </div>
              <small style={{ display: "block", marginTop: "8px", textAlign: "center", color: "var(--gray-600)" }}>Enter = Guardar · Esc = Cancelar</small>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}

export default Proveedores;
