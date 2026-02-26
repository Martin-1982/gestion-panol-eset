import React, { useState } from "react";
import Entrada from "./Entrada";
import Salida from "./Salida";
import Informe from "./Informe";
import Productos from "./Productos";
import Proveedores from "./Proveedores";

// Íconos SVG inline — sin dependencia externa
const Icons = {
  Recursos: () => (
    <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/>
      <polyline points="3.27 6.96 12 12.01 20.73 6.96"/>
      <line x1="12" y1="22.08" x2="12" y2="12"/>
    </svg>
  ),
  Informes: () => (
    <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="20" x2="18" y2="10"/>
      <line x1="12" y1="20" x2="12" y2="4"/>
      <line x1="6" y1="20" x2="6" y2="14"/>
      <line x1="2" y1="20" x2="22" y2="20"/>
    </svg>
  ),
  Solicitudes: () => (
    <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
      <polyline points="14 2 14 8 20 8"/>
      <line x1="16" y1="13" x2="8" y2="13"/>
      <line x1="16" y1="17" x2="8" y2="17"/>
    </svg>
  ),
  Reservas: () => (
    <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
      <line x1="16" y1="2" x2="16" y2="6"/>
      <line x1="8" y1="2" x2="8" y2="6"/>
      <line x1="3" y1="10" x2="21" y2="10"/>
    </svg>
  ),
  Mantenimiento: () => (
    <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/>
    </svg>
  ),
  Comedor: () => (
    <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 8h1a4 4 0 0 1 0 8h-1"/>
      <path d="M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z"/>
      <line x1="6" y1="1" x2="6" y2="4"/>
      <line x1="10" y1="1" x2="10" y2="4"/>
      <line x1="14" y1="1" x2="14" y2="4"/>
    </svg>
  ),
  Entradas: () => (
    <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
      <polyline points="17 8 12 3 7 8"/>
      <line x1="12" y1="3" x2="12" y2="15"/>
    </svg>
  ),
  Salidas: () => (
    <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
      <polyline points="7 10 12 15 17 10"/>
      <line x1="12" y1="15" x2="12" y2="3"/>
    </svg>
  ),
  Productos: () => (
    <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/>
    </svg>
  ),
  Proveedores: () => (
    <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
      <polyline points="9 22 9 12 15 12 15 22"/>
    </svg>
  ),
  Stock: () => (
    <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="1" y="3" width="15" height="13"/>
      <polygon points="16 8 20 8 23 11 23 16 16 16 16 8"/>
      <circle cx="5.5" cy="18.5" r="2.5"/>
      <circle cx="18.5" cy="18.5" r="2.5"/>
    </svg>
  ),
  Back: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="15 18 9 12 15 6"/>
    </svg>
  ),
  Logout: () => (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
      <polyline points="16 17 21 12 16 7"/>
      <line x1="21" y1="12" x2="9" y2="12"/>
    </svg>
  ),
};

const SiteHeader = () => (
  <header className="site-header">
    <div className="header-left">
      <img src="/logo-principal.png" alt="Logo UNER" />
    </div>
    <div className="header-right">
      <div className="header-bar" />
      <div className="header-panol">
        <div className="big">PAÑOL</div>
        <div className="small">Escuela Secundaria Técnica</div>
      </div>
    </div>
  </header>
);

const EnConstruccion = ({ titulo, onBack }) => (
  <div className="main-content" style={{ textAlign: 'center', paddingTop: '60px' }}>
    <div style={{ color: 'var(--navy)', opacity: .2, marginBottom: '20px' }}>
      <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/>
      </svg>
    </div>
    <h2 style={{ fontFamily: 'Outfit, sans-serif', fontSize: '22px', color: 'var(--navy)', marginBottom: '10px' }}>
      {titulo}
    </h2>
    <p style={{ color: 'var(--gray-500)', marginBottom: '32px', fontSize: '15px' }}>
      Este módulo está en desarrollo. Próximamente disponible.
    </p>
    <button className="btn-outline" onClick={onBack}>
      <Icons.Back /> Volver al menú
    </button>
  </div>
);

export default function AdminDashboard() {
  const [activePage, setActivePage] = useState("menu");
  const role = localStorage.getItem('role') || 'Sin rol';

  const handleLogout = () => {
    try { localStorage.clear(); } catch (e) {}
    window.location.href = '/';
  };

  function renderPage() {
    switch (activePage) {

      case "recursos":
        return (
          <div className="main-content">
            <div className="dashboard-header">
              <h2 className="dashboard-title">Recursos</h2>
              <button className="btn-outline" onClick={() => setActivePage("menu")}>
                <Icons.Back /> Volver al menú
              </button>
            </div>
            <div className="menu-grid">
              <button className="menu-card" onClick={() => setActivePage("entradas")}>
                <div className="menu-card-icon"><Icons.Entradas /></div>
                <span className="menu-card-label">Entradas</span>
              </button>
              <button className="menu-card" onClick={() => setActivePage("salidas")}>
                <div className="menu-card-icon"><Icons.Salidas /></div>
                <span className="menu-card-label">Salidas</span>
              </button>
              <button className="menu-card" onClick={() => setActivePage("productos")}>
                <div className="menu-card-icon"><Icons.Productos /></div>
                <span className="menu-card-label">Productos</span>
              </button>
              <button className="menu-card" onClick={() => setActivePage("proveedores")}>
                <div className="menu-card-icon"><Icons.Proveedores /></div>
                <span className="menu-card-label">Proveedores</span>
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
        return <EnConstruccion titulo="Módulo de Solicitudes" onBack={() => setActivePage("menu")} />;
      case "reservas":
        return <EnConstruccion titulo="Módulo de Reservas" onBack={() => setActivePage("menu")} />;
      case "mantenimiento":
        return <EnConstruccion titulo="Módulo de Mantenimiento" onBack={() => setActivePage("menu")} />;
      case "comedor":
        return <EnConstruccion titulo="Módulo Comedor" onBack={() => setActivePage("menu")} />;

      default:
        return (
          <div className="main-content">
            <div className="dashboard-header">
              <div>
                <h2 className="dashboard-title">Menú Principal</h2>
                <p style={{ fontSize: '13px', color: 'var(--gray-500)', marginTop: '3px' }}>{role}</p>
              </div>
              <div className="top-actions">
                <button className="btn-outline logout-btn" onClick={handleLogout}>
                  <Icons.Logout /> Cerrar sesión
                </button>
              </div>
            </div>

            <div className="menu-grid">
              <button className="menu-card" onClick={() => setActivePage("recursos")}>
                <div className="menu-card-icon"><Icons.Recursos /></div>
                <span className="menu-card-label">Recursos</span>
                <span className="menu-card-badge">Activo</span>
              </button>

              <button className="menu-card" onClick={() => setActivePage("informes")}>
                <div className="menu-card-icon"><Icons.Informes /></div>
                <span className="menu-card-label">Informes</span>
                <span className="menu-card-badge">Activo</span>
              </button>

              <button className="menu-card disabled" onClick={() => setActivePage("solicitudes")}>
                <div className="menu-card-icon"><Icons.Solicitudes /></div>
                <span className="menu-card-label">Solicitudes</span>
                <span className="menu-card-badge">Próximo</span>
              </button>

              <button className="menu-card disabled" onClick={() => setActivePage("reservas")}>
                <div className="menu-card-icon"><Icons.Reservas /></div>
                <span className="menu-card-label">Reservas</span>
                <span className="menu-card-badge">Próximo</span>
              </button>

              <button className="menu-card disabled" onClick={() => setActivePage("mantenimiento")}>
                <div className="menu-card-icon"><Icons.Mantenimiento /></div>
                <span className="menu-card-label">Mantenimiento</span>
                <span className="menu-card-badge">Próximo</span>
              </button>

              <button className="menu-card disabled" onClick={() => setActivePage("comedor")}>
                <div className="menu-card-icon"><Icons.Comedor /></div>
                <span className="menu-card-label">Comedor</span>
                <span className="menu-card-badge">Próximo</span>
              </button>
            </div>
          </div>
        );
    }
  }

  return (
    <div>
      <SiteHeader />
      <main>{renderPage()}</main>
    </div>
  );
}
