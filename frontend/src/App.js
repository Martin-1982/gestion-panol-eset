import React, { useState } from "react";
import Login from "./components/Login";
import Register from "./components/Register";
import AdminDashboard from "./components/AdminDashboard";
import GlobalToast from './components/GlobalToast';

export default function App() {
  // Detectar pantalla inicial: si hay token válido, ir directo al menú
  const getInitialScreen = () => {
    const token = localStorage.getItem('token');
    const lastActivity = parseInt(localStorage.getItem('lastActivity') || '0', 10);
    if (token && lastActivity) {
      const now = Date.now();
      const SESSION_TIMEOUT = 15 * 60 * 1000; // 15 minutos
      if (now - lastActivity < SESSION_TIMEOUT) {
        return "menu";
      } else {
        localStorage.clear(); // Sesión expirada
      }
    }
    return "login";
  };

  const [pantalla, setPantalla] = useState(getInitialScreen);
  const [showRegisterModal, setShowRegisterModal] = useState(false);
  const [registrationMessage, setRegistrationMessage] = useState(null);
  // Si el usuario ya está en el menú, mostramos el Dashboard
  // Siempre montamos GlobalToast para que notify() funcione en todas las pantallas
  return (
    <>
      <GlobalToast />
      {pantalla === "menu" ? (
        <AdminDashboard />
      ) : (
        <>
          <Login
            setPantalla={setPantalla}
            openRegister={() => setShowRegisterModal(true)}
            registrationMessage={registrationMessage}
            clearRegistrationMessage={() => setRegistrationMessage(null)}
          />
          {showRegisterModal && (
            <Register
              setPantalla={setPantalla}
              onClose={() => setShowRegisterModal(false)}
              onRegistered={(msg) => { setRegistrationMessage(msg); setShowRegisterModal(false); }}
            />
          )}
        </>
      )}
    </>
  );
}
