import React, { useState } from "react";
import axios from "axios";
import { notify } from '../utils/notify';
import API_BASE_URL from '../config';

export default function Login({ setPantalla, openRegister, registrationMessage, clearRegistrationMessage }) {
  const [showResetModal, setShowResetModal] = useState(false);
  const [resetEmail, setResetEmail] = useState("");
  const [resetLoading, setResetLoading] = useState(false);
  const [resetMessage, setResetMessage] = useState(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  // no necesitamos guardar el token en un state local; lo almacenamos en localStorage

  const handleLogin = async (e) => {
    e.preventDefault();

    if (!email.endsWith("@uner.edu.ar")) {
      notify("Solo se permite correo institucional (@uner.edu.ar)", 'error');
      return;
    }

    try {
      const res = await axios.post(`${API_BASE_URL}/api/auth/login`, {
        email,
        password,
      });

  localStorage.setItem("token", res.data.token);
      // guardar algunos datos del usuario localmente
      if (res.data.user) {
        localStorage.setItem('user', JSON.stringify(res.data.user));
        localStorage.setItem('role', res.data.user.rol_id || 'Usuario');
      }
      setPantalla("menu"); // redirigir al menú después de login
    } catch (err) {
      console.error(err?.response?.data || err);
  const text = err?.response?.data?.error || 'Usuario o contraseña incorrectos';
  notify(text, 'error');
    }
  };

  const sendReset = async () => {
    if (!resetEmail) return setResetMessage({ type: 'error', text: 'Ingresá un correo válido' });
    setResetLoading(true);
    setResetMessage(null);
    try {
      const res = await axios.post(`${API_BASE_URL}/api/auth/password-reset-request`, { email: resetEmail });
      // mostrar mensaje de éxito y cerrar modal automáticamente después de un momento
      setResetMessage({ type: 'success', text: res.data.message || 'Solicitud enviada. Revisá tu correo.' });
      // esperar 1.4s para que el usuario vea el mensaje, luego cerrar y limpiar
      setTimeout(() => {
        setShowResetModal(false);
        setResetEmail('');
        setResetMessage(null);
      }, 1400);
    } catch (err) {
      setResetMessage({ type: 'error', text: err?.response?.data?.error || 'Error al solicitar restablecimiento' });
    } finally {
      setResetLoading(false);
    }
  };

  return (
    <div>
      <header className="site-header">
        <div className="header-left">
          <img src="/logo-principal.png" alt="logo" />
        </div>
        <div className="header-right">
          <div className="header-bar" />
          <div className="header-panol">
            <div className="big">PAÑOL</div>
            <div className="small">Escuela Secundaria Técnica</div>
          </div>
        </div>
      </header>

      <main className="page-login">
        <div style={{ textAlign: 'center', marginBottom: 12 }}>
          <h1 className="main-title">Sistema de Gestión Pañol</h1>
        </div>
        <div className="login-card">
          <h2>Login</h2>

          <form onSubmit={handleLogin}>
            <div className="field">
              <label>Correo institucional</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div className="field">
              <label>Contraseña</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            <div className="actions">
              <button className="btn btn-primary" type="submit">Ingresar</button>
              <button className="btn btn-ghost" type="button" onClick={() => openRegister && openRegister()}>
                Registrarse
              </button>
            </div>
            <div style={{marginTop:8}}>
              <button type="button" className="btn btn-link" onClick={() => setShowResetModal(true)}>
                ¿Olvidaste tu contraseña?
              </button>
            </div>
            {/* Registro: mostrar modal de confirmación si registrationMessage existe */}
            {registrationMessage && (
              <div style={{position:'fixed', left:0, top:0, right:0, bottom:0, display:'flex', alignItems:'center', justifyContent:'center', zIndex:1200}}>
                <div style={{background:'#fff', padding:16, borderRadius:8, boxShadow:'0 10px 30px rgba(0,0,0,0.25)', maxWidth:420}}>
                  <div style={{display:'flex', justifyContent:'space-between', alignItems:'center'}}>
                    <strong>Registro</strong>
                    <button onClick={() => clearRegistrationMessage && clearRegistrationMessage()} style={{border:0, background:'transparent', cursor:'pointer'}}>✕</button>
                  </div>
                  <div style={{marginTop:8}}>{registrationMessage}</div>
                  <div style={{textAlign:'right', marginTop:12}}>
                    <button className="btn btn-primary" onClick={() => clearRegistrationMessage && clearRegistrationMessage()}>Cerrar</button>
                  </div>
                </div>
              </div>
            )}

            {/* Modal central para restablecimiento */}
            {showResetModal && (
              <div style={{position:'fixed', left:0, top:0, right:0, bottom:0, background:'rgba(0,0,0,0.35)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:1100}} onClick={(e)=>{ if(e.target===e.currentTarget) { setShowResetModal(false); setResetEmail(''); setResetMessage(null); } }}>
                <div role="dialog" aria-modal="true" style={{background:'#fff', padding:16, borderRadius:8, width:360, maxWidth:'94%', boxShadow:'0 10px 30px rgba(0,0,0,0.3)'}}>
                  <div style={{display:'flex', justifyContent:'space-between', alignItems:'center'}}>
                    <h3 style={{margin:0}}>Restablecer contraseña</h3>
                    <button aria-label="Cerrar" onClick={() => { setShowResetModal(false); setResetEmail(''); setResetMessage(null); }} style={{border:0, background:'transparent', fontSize:18, cursor:'pointer'}}>
✕</button>
                  </div>
                  <p style={{marginTop:8, marginBottom:8, color:'#444'}}>Ingresá tu correo institucional para recibir un enlace de restablecimiento.</p>
                  {resetMessage && <div style={{color: resetMessage.type === 'error' ? 'crimson' : 'green', marginBottom:8}}>{resetMessage.text}</div>}
                  <div style={{display:'flex', gap:8, flexDirection:'column'}}>
                    <input type="email" placeholder="tu@uner.edu.ar" value={resetEmail} onChange={(e)=>setResetEmail(e.target.value)} />
                    <div style={{display:'flex', justifyContent:'flex-end', gap:8}}>
                      <button className="btn btn-ghost" onClick={() => { setShowResetModal(false); setResetEmail(''); setResetMessage(null); }}>Cancelar</button>
                      {resetMessage && resetMessage.type === 'error' && (
                        <button className="btn btn-ghost" onClick={async ()=>{ await sendReset(); }} disabled={resetLoading}>{resetLoading ? 'Reintentando...' : 'Reintentar'}</button>
                      )}
                      <button className="btn btn-primary" onClick={async ()=>{ await sendReset(); }} disabled={resetLoading}>{resetLoading ? 'Enviando...' : 'Enviar'}</button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </form>
        </div>
      </main>
    </div>
  );
}

