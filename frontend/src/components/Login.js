import React, { useState } from "react";
import axios from "axios";
import API_BASE_URL from '../config';
import { FaSpinner } from 'react-icons/fa';

export default function Login({ setPantalla, openRegister, registrationMessage, clearRegistrationMessage }) {
  const updateLastActivity = () => {
    localStorage.setItem('lastActivity', Date.now().toString());
  };

  const [showResetModal, setShowResetModal] = useState(false);
  const [resetEmail, setResetEmail] = useState("");
  const [resetLoading, setResetLoading] = useState(false);
  const [resetMessage, setResetMessage] = useState(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    updateLastActivity();
    if (!email.endsWith("@uner.edu.ar")) {
      setError("Solo se permite correo institucional (@uner.edu.ar)");
      return;
    }
    setLoading(true);
    try {
      const res = await axios.post(`${API_BASE_URL}/api/auth/login`, { email, password });
      localStorage.setItem("token", res.data.token);
      if (res.data.user) {
        localStorage.setItem('user', JSON.stringify(res.data.user));
        localStorage.setItem('role', res.data.user.rol_nombre || 'Sin rol');
      }
      setPantalla("menu");
    } catch (err) {
      setError(err?.response?.data?.error || 'Usuario o contraseña incorrectos');
    } finally {
      setLoading(false);
    }
  };

  const sendReset = async () => {
    if (!resetEmail) return setResetMessage({ type: 'error', text: 'Ingresá un correo válido' });
    updateLastActivity();
    setResetLoading(true);
    setResetMessage(null);
    try {
      const res = await axios.post(`${API_BASE_URL}/api/auth/password-reset-request`, { email: resetEmail });
      setResetMessage({ type: 'success', text: res.data.message || 'Solicitud enviada. Revisá tu correo.' });
      setTimeout(() => { setShowResetModal(false); setResetEmail(''); setResetMessage(null); }, 1400);
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
                onChange={(e) => { setEmail(e.target.value); setError(""); }}
                placeholder="correo@uner.edu.ar"
                required
                disabled={loading}
              />
            </div>

            <div className="field">
              <label>Contraseña</label>
              <input
                type="password"
                value={password}
                onChange={(e) => { setPassword(e.target.value); setError(""); }}
                placeholder="••••••••"
                required
                disabled={loading}
              />
            </div>

            {/* Mensaje de error inline */}
            {error && (
              <div style={{
                background: '#fee2e2',
                color: '#991b1b',
                border: '1px solid #fca5a5',
                borderRadius: '8px',
                padding: '10px 14px',
                fontSize: '14px',
                fontWeight: 500,
                marginBottom: '12px',
              }}>
                {error}
              </div>
            )}

            <button type="submit" className="btn-primary btn-full" disabled={loading}>
              {loading ? <><FaSpinner className="spinner" /> Cargando...</> : 'Iniciar sesión'}
            </button>
          </form>

          <div className="login-links">
            <button onClick={() => setShowResetModal(true)} className="link-btn">¿Olvidaste tu contraseña?</button>
            <button onClick={openRegister} className="link-btn">Registrarse</button>
          </div>

          {registrationMessage && (
            <div className="alert alert-success">
              {registrationMessage}
              <button onClick={clearRegistrationMessage} className="close-btn">×</button>
            </div>
          )}
        </div>
      </main>

      {showResetModal && (
        <div className="app-modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) { setShowResetModal(false); setResetEmail(''); setResetMessage(null); } }}>
          <div className="modal-content" role="dialog" aria-modal="true">
            <h3>Restablecer contraseña</h3>
            <p className="muted">Ingresá tu correo institucional y te enviaremos un enlace para restablecer tu contraseña.</p>

            <label>Correo institucional</label>
            <input
              type="email"
              value={resetEmail}
              onChange={(e) => setResetEmail(e.target.value)}
              placeholder="correo@uner.edu.ar"
              disabled={resetLoading}
            />

            {resetMessage && (
              <div className={`alert ${resetMessage.type === 'error' ? 'alert-error' : 'alert-success'}`}>
                {resetMessage.text}
              </div>
            )}

            <div className="form-actions">
              <button onClick={() => { setShowResetModal(false); setResetEmail(''); setResetMessage(null); }} className="btn-outline" disabled={resetLoading}>Cancelar</button>
              <button onClick={sendReset} className="btn-primary" disabled={resetLoading}>
                {resetLoading ? <><FaSpinner className="spinner" /> Enviando...</> : 'Enviar enlace'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
