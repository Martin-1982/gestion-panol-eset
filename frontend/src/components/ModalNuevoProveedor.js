import React, { useState, useRef, useEffect } from "react";
import axios from "axios";
import API_BASE_URL from '../config';

/**
 * ModalNuevoProveedor — componente reutilizable
 * Props:
 *   onClose()               — se llama al cerrar el modal
 *   onProveedorCreado(p)    — se llama con el proveedor nuevo cuando se guarda
 *   showToast(msg, type)    — función para mostrar notificaciones (opcional)
 */
function ModalNuevoProveedor({ onClose, onProveedorCreado, showToast }) {
  const [form, setForm] = useState({
    nombre: "", contacto: "", telefono: "", direccion: "", email: ""
  });
  const [saving, setSaving] = useState(false);
  const nombreRef = useRef(null);

  // Toast local si no se pasa showToast desde afuera
  const [localToast, setLocalToast] = useState({ visible: false, message: "", type: "success" });
  const toastTimer = useRef(null);

  useEffect(() => {
    setTimeout(() => nombreRef.current && nombreRef.current.focus(), 60);
    return () => { if (toastTimer.current) clearTimeout(toastTimer.current); };
  }, []);

  const notify = (message, type = "success") => {
    if (showToast) {
      showToast(message, type);
    } else {
      setLocalToast({ visible: true, message, type });
      if (toastTimer.current) clearTimeout(toastTimer.current);
      toastTimer.current = setTimeout(() => setLocalToast({ visible: false, message: "", type: "success" }), 2000);
    }
  };

  const handleGuardar = async () => {
    if (!form.nombre.trim()) return notify("Nombre es obligatorio", "error");
    if (saving) return;
    setSaving(true);
    try {
      const token = localStorage.getItem("token");
      const res = await axios.post(
        `${API_BASE_URL}/api/proveedores`,
        form,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      notify("Proveedor agregado", "success");
      onProveedorCreado(res.data);
      onClose();
    } catch (err) {
      notify(err.response?.data?.error || "Error al guardar proveedor", "error");
    } finally {
      setSaving(false);
    }
  };

  // Enter guarda, Esc cierra
  useEffect(() => {
    const handleKey = (e) => {
      if (e.key === "Escape") onClose();
      if (e.key === "Enter") { e.preventDefault(); handleGuardar(); }
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form]);

  return (
    <div
      className="app-modal-overlay"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="modal-content" role="dialog" aria-modal="true" aria-labelledby="modal-nuevo-proveedor-title">

        {/* Toast local */}
        {localToast.visible && (
          <div className="toast" style={{
            background: localToast.type === "error" ? 'var(--error)' : 'var(--success)',
            color: 'var(--white)', left: '50%', transform: 'translateX(-50%)',
            minWidth: 220, fontWeight: 500, zIndex: 2000
          }}>
            {localToast.message}
          </div>
        )}

        <h3 id="modal-nuevo-proveedor-title">Nuevo proveedor</h3>

        <label>Nombre *</label>
        <input
          className="input"
          ref={nombreRef}
          placeholder="Nombre del proveedor"
          value={form.nombre}
          onChange={(e) => setForm({ ...form, nombre: e.target.value })}
        />

        <label>Persona de contacto</label>
        <input
          className="input"
          placeholder="Nombre del contacto"
          value={form.contacto}
          onChange={(e) => setForm({ ...form, contacto: e.target.value })}
        />

        <label>Teléfono</label>
        <input
          className="input"
          placeholder="Número de teléfono"
          value={form.telefono}
          onChange={(e) => setForm({ ...form, telefono: e.target.value })}
        />

        <label>Dirección</label>
        <input
          className="input"
          placeholder="Dirección completa"
          value={form.direccion}
          onChange={(e) => setForm({ ...form, direccion: e.target.value })}
        />

        <label>Email</label>
        <input
          className="input"
          type="email"
          placeholder="correo@ejemplo.com"
          value={form.email}
          onChange={(e) => setForm({ ...form, email: e.target.value })}
        />

        <div className="form-actions">
          <button className="btn btn-outline compact-btn" onClick={onClose}>Cancelar</button>
          <button className="btn btn-primary compact-btn" onClick={handleGuardar} disabled={saving}>
            {saving ? "Guardando..." : "Guardar"}
          </button>
        </div>
        <small style={{ display: "block", marginTop: "8px", textAlign: "center", color: "var(--gray-600)" }}>
          Enter = Guardar · Esc = Cerrar
        </small>
      </div>
    </div>
  );
}

export default ModalNuevoProveedor;
