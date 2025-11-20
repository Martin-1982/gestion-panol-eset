import React, { useState } from "react";
import Login from "./components/Login";
import Register from "./components/Register";
import AdminDashboard from "./components/AdminDashboard";
import GlobalToast from './components/GlobalToast';

export default function App() {
  const [pantalla, setPantalla] = useState("login");
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
