import React, { useState, useEffect } from "react";
import axios from "axios";
import API_BASE_URL from '../config';

export default function Register({ setPantalla, onClose, onRegistered }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [nombre, setNombre] = useState("");
  const [apellido, setApellido] = useState("");
  const [telefono, setTelefono] = useState("");
  const [roles, setRoles] = useState([]);
  const [funciones, setFunciones] = useState([]);
  const [rolId, setRolId] = useState(2);
  const [funcionId, setFuncionId] = useState(1);
  const [mensaje, setMensaje] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleRegister = async (e) => {
    e.preventDefault();

    if (!email.endsWith("@uner.edu.ar")) {
      setMensaje({ type: "error", text: "Solo se permite correo institucional (@uner.edu.ar)" });
      return;
    }

    setLoading(true);
    setMensaje(null);
    try {
      const res = await axios.post(`${API_BASE_URL}/api/auth/register`, {
        nombre,
        apellido,
        email,
        telefono,
        rol_id: rolId,
        funcion_id: funcionId,
        password,
      });

  const msg = res.data.message || "Registro recibido. Revisá tu correo para activar la cuenta.";
  setMensaje({ type: "success", text: msg });
  if (onRegistered) onRegistered(msg); else { setTimeout(() => setPantalla("login"), 1800); }
    } catch (err) {
      console.error("Register error:", err?.response?.data || err);
      const status = err?.response?.status;
      const data = err?.response?.data;
      if (status === 409 && data && data.pending) {
        setMensaje({ type: "warning", text: data.message || 'Cuenta pendiente. Reenviar verificación?' });
        // ofrecer reenvío automático
        const ok = window.confirm('El correo ya está registrado pero no activado. ¿Querés que reenviemos el correo de activación?');
        if (ok) {
          try {
            const r2 = await axios.post(`${API_BASE_URL}/api/auth/resend`, { email });
            const msg2 = r2.data.message || 'Correo de verificación reenviado. Revisá tu correo o el log.';
            setMensaje({ type: 'success', text: msg2 });
            if (onRegistered) onRegistered(msg2); else { setTimeout(() => setPantalla('login'), 1800); }
          } catch (reErr) {
            setMensaje({ type: 'error', text: reErr?.response?.data?.error || 'Error reenviando verificación' });
          }
        }
      } else {
        const text = data?.error || 'Error en el registro';
        setMensaje({ type: 'error', text });
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // cargar roles y funciones para selects (funciones sin filtrar inicialmente)
    (async () => {
      try {
        const r = await axios.get(`${API_BASE_URL}/api/roles`);
        setRoles(r.data || []);
        // cargar funciones sin filtro inicialmente
        try {
          const f = await axios.get(`${API_BASE_URL}/api/funciones`);
          setFunciones(f.data || []);
        } catch (e) {
          console.warn('No se pudieron cargar funciones (sin filtro)', e);
        }
      } catch (e) {
        // no bloquear el registro si falla
        console.warn('No se pudieron cargar roles/funciones', e);
      }
    })();
  }, []);

  // cuando cambia el rol seleccionado, recargar funciones relacionadas
  useEffect(() => {
    (async () => {
      try {
        const f = await axios.get(`${API_BASE_URL}/api/funciones?rol_id=${rolId}`);
        setFunciones(f.data || []);
      } catch (e) {
        // si falla, dejamos las funciones actuales
        console.warn('No se pudieron cargar funciones filtradas por rol', e);
      }
    })();
  }, [rolId]);

  return (
    <div className="app-modal-overlay">
      <div className="modal-content" role="dialog" aria-modal="true" style={{ maxWidth: 480 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <h3 style={{ margin: 0 }}>Registro de Usuario</h3>
          <button aria-label="Cerrar" onClick={() => onClose && onClose()} style={{ background: 'none', border: 'none', fontSize: 24, cursor: 'pointer', color: 'var(--gray-600)', padding: 0, width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 'var(--radius-md)' }} onMouseOver={(e) => e.currentTarget.style.background = 'var(--gray-200)'} onMouseOut={(e) => e.currentTarget.style.background = 'none'}>✕</button>
        </div>
        
        {mensaje && (
          <div className={`alert ${mensaje.type === 'error' ? 'alert-error' : mensaje.type === 'warning' ? 'alert-warning' : 'alert-success'}`}>
            {mensaje.text}
          </div>
        )}
        
        <form onSubmit={handleRegister}>
          <label htmlFor="reg-email">Correo institucional</label>
          <input autoFocus type="email" id="reg-email" value={email} onChange={e => setEmail(e.target.value)} required placeholder="correo@uner.edu.ar" />
          
          <label htmlFor="reg-nombre">Nombre</label>
          <input type="text" id="reg-nombre" value={nombre} onChange={e => setNombre(e.target.value)} required />
          
          <label htmlFor="reg-apellido">Apellido</label>
          <input type="text" id="reg-apellido" value={apellido} onChange={e => setApellido(e.target.value)} required />
          
          <label htmlFor="reg-telefono">Teléfono</label>
          <input type="text" id="reg-telefono" value={telefono} onChange={e => setTelefono(e.target.value)} placeholder="Opcional" />
          
          <label htmlFor="reg-rol">Rol</label>
          <select id="reg-rol" value={rolId} onChange={e => setRolId(Number(e.target.value))}>
            {roles.map(r => <option key={r.id} value={r.id}>{r.nombre}</option>)}
          </select>
          
          <label htmlFor="reg-funcion">Función</label>
          <select id="reg-funcion" value={funcionId} onChange={e => setFuncionId(Number(e.target.value))}>
            {funciones.map(f => <option key={f.id} value={f.id}>{f.nombre}</option>)}
          </select>
          
          <label htmlFor="reg-password">Contraseña</label>
          <input type="password" id="reg-password" value={password} onChange={e => setPassword(e.target.value)} required />
          
          <div className="form-actions">
            <button type="button" onClick={() => onClose && onClose()} className="btn-outline">Cancelar</button>
            <button type="submit" className="btn-primary" disabled={loading}>{loading ? 'Registrando...' : '✅ Registrar'}</button>
          </div>
        </form>
        
        <p className="muted" style={{ marginTop: 16, fontSize: 13, textAlign: 'center' }}>
          Se enviará un correo de verificación a tu dirección institucional (@uner.edu.ar) con un enlace para activar la cuenta.
        </p>
      </div>
    </div>
  );
}

