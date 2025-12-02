import React, { useState } from "react";
import axios from "axios";
import { notify } from '../utils/notify';
import API_BASE_URL from '../config';
import { FaLock, FaEnvelope, FaSpinner } from 'react-icons/fa';

export default function Login({ setPantalla, openRegister, registrationMessage, clearRegistrationMessage }) {
  const [showResetModal, setShowResetModal] = useState(false);
  const [resetEmail, setResetEmail] = useState("");
  const [resetLoading, setResetLoading] = useState(false);
  const [resetMessage, setResetMessage] = useState(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!email.endsWith("@uner.edu.ar")) {
      notify("Solo se permite correo institucional (@uner.edu.ar)", 'error');
      return;
    }
    setLoading(true);
    try {
      const res = await axios.post(`${API_BASE_URL}/api/auth/login`, {
        email,
        password,
      });
      localStorage.setItem("token", res.data.token);
      if (res.data.user) {
        localStorage.setItem('user', JSON.stringify(res.data.user));
        localStorage.setItem('role', res.data.user.rol_id || 'Usuario');
      }
      setPantalla("menu");
    } catch (err) {
      console.error(err?.response?.data || err);
      const text = err?.response?.data?.error || 'Usuario o contraseña incorrectos';
      notify(text, 'error');
    } finally {
      setLoading(false);
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
                <div className="page-login">
                  <span className="main-title">Sistema de Gestión Pañol ESET</span>
                  <div className="login-card card">
                    import React, { useState } from "react";
                    import axios from "axios";
                    import { notify } from '../utils/notify';
                    import API_BASE_URL from '../config';
                    import { FaLock, FaEnvelope, FaSpinner } from 'react-icons/fa';

                    export default function Login({ setPantalla, openRegister, registrationMessage, clearRegistrationMessage }) {
                      const [showResetModal, setShowResetModal] = useState(false);
                      const [resetEmail, setResetEmail] = useState("");
                      const [resetLoading, setResetLoading] = useState(false);
                      const [resetMessage, setResetMessage] = useState(null);
                      const [email, setEmail] = useState("");
                      const [password, setPassword] = useState("");
                      const [loading, setLoading] = useState(false);

                      const handleLogin = async (e) => {
                        e.preventDefault();
                        if (!email.endsWith("@uner.edu.ar")) {
                          notify("Solo se permite correo institucional (@uner.edu.ar)", 'error');
                          return;
                        }
                        setLoading(true);
                        try {
                          const res = await axios.post(`${API_BASE_URL}/api/auth/login`, {
                            email,
                            password,
                          });
                          localStorage.setItem("token", res.data.token);
                          if (res.data.user) {
                            localStorage.setItem('user', JSON.stringify(res.data.user));
                            localStorage.setItem('role', res.data.user.rol_id || 'Usuario');
                          }
                          setPantalla("menu");
                        } catch (err) {
                          console.error(err?.response?.data || err);
                          const text = err?.response?.data?.error || 'Usuario o contraseña incorrectos';
                          notify(text, 'error');
                        } finally {
                          setLoading(false);
                        }
                      };

                      const sendReset = async () => {
                        if (!resetEmail) return setResetMessage({ type: 'error', text: 'Ingresá un correo válido' });
                        setResetLoading(true);
                        setResetMessage(null);
                        try {
                          const res = await axios.post(`${API_BASE_URL}/api/auth/password-reset-request`, { email: resetEmail });
                          setResetMessage({ type: 'success', text: res.data.message || 'Solicitud enviada. Revisá tu correo.' });
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
                        <>
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
                          <div className="page-login">
                            <span className="main-title">Sistema de Gestión Pañol ESET</span>
                            <div className="login-card card">
                              <h2 className="text-center" style={{ marginBottom: 18 }}>
                                <FaLock style={{ marginRight: 8, color: 'var(--primary)' }} /> Iniciar sesión
                              </h2>
                              <form onSubmit={handleLogin} className="flex flex-center gap-md" style={{ flexDirection: 'column' }}>
                                <div className="form-group w-100">
                                  <label htmlFor="email">
                                    <FaEnvelope style={{ marginRight: 4, verticalAlign: 'middle', color: 'var(--primary)' }} /> Correo institucional
                                  </label>
                                  <input
                                    type="email"
                                    id="email"
                                    value={email}
                                    onChange={e => setEmail(e.target.value)}
                                    autoFocus
                                    required
                                    autoComplete="username"
                                    className="compact-field"
                                    placeholder="usuario@uner.edu.ar"
                                  />
                                </div>
                                <div className="form-group w-100">
                                  <label htmlFor="password">
                                    <FaLock style={{ marginRight: 4, verticalAlign: 'middle', color: 'var(--primary)' }} /> Contraseña
                                  </label>
                                  <input
                                    type="password"
                                    id="password"
                                    value={password}
                                    onChange={e => setPassword(e.target.value)}
                                    required
                                    autoComplete="current-password"
                                    className="compact-field"
                                    placeholder="••••••••"
                                  />
                                </div>
                                <button type="submit" className="btn btn-primary w-100 mt-lg" disabled={loading}>
                                  {loading ? <FaSpinner className="spin" style={{ marginRight: 6 }} /> : null}
                                  Ingresar
                                </button>
                              </form>
                              <div className="actions gap-md mt-lg">
                                <button className="btn btn-ghost compact-btn" onClick={() => setShowResetModal(true)}>
                                  ¿Olvidaste tu contraseña?
                                </button>
                                <button className="btn btn-ghost-accent compact-btn" onClick={openRegister}>
                                  Registrarse
                                </button>
                              </div>
                              {registrationMessage && (
                                <div className="mt-lg" style={{ color: '#10b981', fontWeight: 500, fontSize: 15 }}>
                                  {registrationMessage}
                                  <button className="btn btn-ghost compact-btn" style={{ marginLeft: 8, fontSize: 13 }} onClick={clearRegistrationMessage}>Cerrar</button>
                                </div>
                              )}
                            </div>
                            {showResetModal && (
                              <div className="app-modal-overlay">
                                <div className="login-card card" style={{ maxWidth: 370 }}>
                                  <h2 className="text-center" style={{ marginBottom: 10 }}>
                                    <FaEnvelope style={{ marginRight: 8, color: 'var(--primary)' }} /> Restablecer contraseña
                                  </h2>
                                  <div className="form-group w-100">
                                    <label htmlFor="resetEmail">Correo institucional</label>
                                    <input
                                      type="email"
                                      id="resetEmail"
                                      value={resetEmail}
                                      onChange={e => setResetEmail(e.target.value)}
                                      autoFocus
                                      required
                                      className="compact-field"
                                      placeholder="usuario@uner.edu.ar"
                                    />
                                  </div>
                                  <button className="btn btn-primary w-100 mt-lg" onClick={sendReset} disabled={resetLoading}>
                                    {resetLoading ? <FaSpinner className="spin" style={{ marginRight: 6 }} /> : null}
                                    Solicitar restablecimiento
                                  </button>
                                  {resetMessage && (
                                    <div style={{ marginTop: 12, color: resetMessage.type === 'success' ? '#10b981' : '#ef4444', fontWeight: 500 }}>
                                      {resetMessage.text}
                                    </div>
                                  )}
                                  <button className="btn btn-ghost compact-btn mt-lg w-100" onClick={() => setShowResetModal(false)}>
                                    Cancelar
                                  </button>
                                </div>
                              </div>
                            )}
                          </div>
                        </>
                      );
                    }

