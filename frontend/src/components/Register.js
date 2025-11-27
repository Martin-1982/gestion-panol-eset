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
    // Modal backdrop
    <div style={{ fontFamily: "Arial" }}>
      <div onClick={(e)=>{ if(e.target===e.currentTarget) onClose && onClose(); }} style={{position: 'fixed', left:0, top:0, right:0, bottom:0, background:'transparent', display:'flex', alignItems:'center', justifyContent:'center', zIndex:1000}}>
        <div role="dialog" aria-modal="true" style={{background:'#fff', borderRadius:8, padding:16, width: '360px', maxWidth:'92%', boxShadow:'0 10px 30px rgba(0,0,0,0.22)', transform: 'scale(0.95)'}}>
            <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:10}}>
            <h2 style={{margin:0,fontSize:18}}>Registro de Usuario</h2>
            <button aria-label="Cerrar" onClick={() => onClose && onClose()} style={{border:0, background:'transparent', fontSize:18, cursor:'pointer'}}>✕</button>
          </div>

          {mensaje && (
            <div style={{
              color: mensaje.type === "error" ? "crimson" : mensaje.type === 'warning' ? '#996600' : 'green',
              marginBottom: 8,
            }}>
              {mensaje.text}
            </div>
          )}

          <form onSubmit={handleRegister}>
            <div style={{display:'flex', flexDirection:'column', gap:10}}>
              <label style={{display:'flex', flexDirection:'column'}}>
                Correo
                <input autoFocus type="email" value={email} onChange={(e)=>setEmail(e.target.value)} required />
              </label>

              <label style={{display:'flex', flexDirection:'column'}}>
                Nombre
                <input type="text" value={nombre} onChange={(e)=>setNombre(e.target.value)} required />
              </label>

              <label style={{display:'flex', flexDirection:'column'}}>
                Apellido
                <input type="text" value={apellido} onChange={(e)=>setApellido(e.target.value)} required />
              </label>

              <label style={{display:'flex', flexDirection:'column'}}>
                Teléfono
                <input type="text" value={telefono} onChange={(e)=>setTelefono(e.target.value)} />
              </label>

              <label style={{display:'flex', flexDirection:'column'}}>
                Rol
                <select value={rolId} onChange={(e) => setRolId(Number(e.target.value))}>
                  {roles.map(r => <option key={r.id} value={r.id}>{r.nombre}</option>)}
                </select>
              </label>

              <label style={{display:'flex', flexDirection:'column'}}>
                Función
                <select value={funcionId} onChange={(e) => setFuncionId(Number(e.target.value))}>
                  {funciones.map(f => <option key={f.id} value={f.id}>{f.nombre}</option>)}
                </select>
              </label>

              <label style={{display:'flex', flexDirection:'column'}}>
                Contraseña
                <input type="password" value={password} onChange={(e)=>setPassword(e.target.value)} required />
              </label>

                <div style={{display:'flex', gap:8, justifyContent:'flex-end', marginTop:6}}>
                <button type="button" onClick={() => onClose && onClose()} className="btn btn-ghost">Cancelar</button>
                <button type="submit" className="btn btn-primary" disabled={loading}>{loading ? 'Registrando...' : 'Registrar'}</button>
              </div>
            </div>
          </form>

          <p style={{ marginTop: 12, color: "#666", fontSize: 13 }}>
            El registro requiere un correo institucional real (@uner.edu.ar). Se enviará un correo de verificación con un enlace para activar la cuenta.
          </p>
        </div>
      </div>
    </div>
  );
}

