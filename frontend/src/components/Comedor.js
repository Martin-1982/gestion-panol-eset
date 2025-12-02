import React, { useState } from "react";

function Comedor() {
  const [menu, setMenu] = useState("");
  const [postre, setPostre] = useState("");
  const [turno, setTurno] = useState("Almuerzo");
  const [comensales, setComensales] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    // eslint-disable-next-line no-alert
    alert(`📋 Registro cargado:
      Menú: ${menu}
      Postre: ${postre}
      Turno: ${turno}
      Comensales: ${comensales}`);
    setMenu("");
    setPostre("");
    setTurno("Almuerzo");
    setComensales("");
  };

  return (
    <div className="main-content">
      <h2 className="dashboard-title">🍲 Módulo Comedor</h2>
      
      <div className="card card-responsive card-shadow" style={{ maxWidth: 600, margin: '0 auto', marginTop: 24 }}>
        <form onSubmit={handleSubmit}>
          <div className="form-grid">
            <div className="form-group">
              <label className="field-label">Menú del día</label>
              <input
                type="text"
                value={menu}
                onChange={(e) => setMenu(e.target.value)}
                required
                className="input input-full"
                placeholder="Ej: Milanesas con ensalada"
              />
            </div>

            <div className="form-group">
              <label className="field-label">Postre / Merienda</label>
              <input
                type="text"
                value={postre}
                onChange={(e) => setPostre(e.target.value)}
                required
                className="input input-full"
                placeholder="Ej: Gelatina"
              />
            </div>

            <div className="form-group">
              <label className="field-label">Turno</label>
              <select value={turno} onChange={(e) => setTurno(e.target.value)} className="input input-full">
                <option value="Desayuno">Desayuno</option>
                <option value="Almuerzo">Almuerzo</option>
                <option value="Merienda">Merienda</option>
              </select>
            </div>

            <div className="form-group">
              <label className="field-label">Cantidad de comensales</label>
              <input
                type="number"
                value={comensales}
                onChange={(e) => setComensales(e.target.value)}
                required
                min="0"
                className="input input-full"
                placeholder="0"
              />
            </div>

            <div className="form-actions">
              <button type="submit" className="btn-primary">Registrar</button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

export default Comedor;

