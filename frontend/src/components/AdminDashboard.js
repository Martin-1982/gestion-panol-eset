import React, { useState } from "react";
import Entrada from "./Entrada";
import Salida from "./Salida";
import Informe from "./Informe";
import Productos from "./Productos";
import Proveedores from "./Proveedores";

export default function AdminDashboard() {
  const [activePage, setActivePage] = useState("menu");
  
  // Obtener el nombre del rol - puede venir como nombre o como ID
  const getRoleName = () => {
    const roleFromStorage = localStorage.getItem('role') || '1';
    
    // Si ya es un nombre (no es número), devolverlo
    if (isNaN(roleFromStorage)) {
      return roleFromStorage;
    }
    
    // Si es un número, mapear a nombre
    const roleMap = {
      '1': 'Administrador',
      '2': 'Usuario',
      '3': 'Invitado'
    };
    
    return roleMap[roleFromStorage] || 'Usuario';
  };
  
  const role = getRoleName();

  const handleLogout = () => {
    // clear local session info and go to root (login)
    try { localStorage.clear(); } catch (e) {}
    window.location.href = '/';
  };

  const renderPage = () => {
    switch (activePage) {
      case "entradas":
        return <Entrada onBack={() => setActivePage("menu")} />;
      case "salidas":
        return <Salida onBack={() => setActivePage("menu")} />;
      case "informes":
        return <Informe onBack={() => setActivePage("menu")} />;
      case "productos":
        return <Productos onBack={() => setActivePage("menu")} />;
      case "proveedores":
        return <Proveedores onBack={() => setActivePage("menu")} />;
      default:
          return (
            <div className="main-content">
              <div className="dashboard-header">
                <h2 className="dashboard-title">Menú Principal ({role})</h2>
                <div className="top-actions">
                  <button className="btn-outline" onClick={handleLogout}>Cerrar Sesión</button>
                </div>
              </div>
              <div className="menu-grid">
                <button className="menu-btn" onClick={() => setActivePage("productos")} aria-label="Productos">
                  <span className="icon">📦</span>
                  <span className="label">Productos</span>
                </button>
                <button className="menu-btn" onClick={() => setActivePage("proveedores")} aria-label="Proveedores">
                  <span className="icon">🏢</span>
                  <span className="label">Proveedores</span>
                </button>
                <button className="menu-btn" onClick={() => setActivePage("entradas")} aria-label="Entradas">
                  <span className="icon">📥</span>
                  <span className="label">Entradas</span>
                </button>
                <button className="menu-btn" onClick={() => setActivePage("salidas")} aria-label="Salidas">
                  <span className="icon">📤</span>
                  <span className="label">Salidas</span>
                </button>
                <button className="menu-btn" onClick={() => setActivePage("informes")} aria-label="Informes">
                  <span className="icon">📊</span>
                  <span className="label">Informes</span>
                </button>
              </div>
            </div>
        );
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

      <main>
        {renderPage()}
      </main>
    </div>
  );
}
