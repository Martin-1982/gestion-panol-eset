import React, { useState } from "react";
import Entrada from "./Entrada";
import Salida from "./Salida";
import Informe from "./Informe";
import Productos from "./Productos";
import Proveedores from "./Proveedores";

export default function AdminDashboard() {
  const [activePage, setActivePage] = useState("menu");
  
  const getRoleName = () => {
    const roleFromStorage = localStorage.getItem('role');
    if (!roleFromStorage) return 'Sin rol';
    return roleFromStorage;
  };
  const role = getRoleName();

  const handleLogout = () => {
    try { localStorage.clear(); } catch (e) {}
    window.location.href = '/';
  };

  function renderPage() {
    switch (activePage) {
      case "recursos":
        return (
          <div className="main-content page-recursos">
            <div className="dashboard-header">
              <h2 className="dashboard-title">Recursos</h2>
              <button className="btn-outline" onClick={() => setActivePage("menu")}>Volver al menú</button>
            </div>
            <div className="menu-grid">
              <button className="menu-btn" onClick={() => setActivePage("entradas")}>
                <span className="icon">📥</span>
                <span className="label">Entradas</span>
              </button>
              <button className="menu-btn" onClick={() => setActivePage("salidas")}>
                <span className="icon">📤</span>
                <span className="label">Salidas</span>
              </button>
              <button className="menu-btn" onClick={() => setActivePage("productos")}>
                <span className="icon">📦</span>
                <span className="label">Productos</span>
              </button>
              <button className="menu-btn" onClick={() => setActivePage("proveedores")}>
                <span className="icon">🏢</span>
                <span className="label">Proveedores</span>
              </button>
            </div>
          </div>
        );
      case "entradas":
        return <Entrada onBack={() => setActivePage("recursos")} />;
      case "salidas":
        return <Salida onBack={() => setActivePage("recursos")} />;
      case "productos":
        return <Productos onBack={() => setActivePage("recursos")} />;
      case "proveedores":
        return <Proveedores onBack={() => setActivePage("recursos")} />;
      case "informes":
        return <Informe onBack={() => setActivePage("menu")} />;
      case "solicitudes":
      case "reservas":
      case "mantenimiento":
      case "comedor":
        return (
          <div className="main-content" style={{textAlign:'center',marginTop:'80px'}}>
            <span style={{fontSize:'64px',color:'#ff6b35'}}>🚧</span>
            <h2>Componente en desarrollo</h2>
            <button className="btn-outline" style={{marginTop:'32px'}} onClick={()=>setActivePage("menu")}>Volver al menú</button>
          </div>
        );
      default:
        return (
          <div className="main-content page-menu">
            <div className="dashboard-header">
              <h2 className="dashboard-title">Menú Principal ({role})</h2>
              <div className="top-actions">
                <button className="btn-outline" onClick={handleLogout}>Cerrar Sesión</button>
              </div>
            </div>
            <div className="menu-grid">
              <button className="menu-btn" onClick={() => setActivePage("recursos")}> <span className="icon">🗄️</span> <span className="label">Recursos</span> </button>
              <button className="menu-btn" onClick={() => setActivePage("informes")}> <span className="icon">📊</span> <span className="label">Informes</span> </button>
              <button className="menu-btn" onClick={() => setActivePage("solicitudes")}> <span className="icon">📝</span> <span className="label">Solicitudes</span> </button>
              <button className="menu-btn" onClick={() => setActivePage("reservas")}> <span className="icon">📅</span> <span className="label">Reservas</span> </button>
              <button className="menu-btn" onClick={() => setActivePage("mantenimiento")}> <span className="icon">🛠️</span> <span className="label">Mantenimiento</span> </button>
              <button className="menu-btn" onClick={() => setActivePage("comedor")}> <span className="icon">🍽️</span> <span className="label">Comedor</span> </button>
            </div>
          </div>
        );
    }
  }

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
