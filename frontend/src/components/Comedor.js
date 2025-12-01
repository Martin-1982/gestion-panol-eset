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
    <div style={{ padding: "20px" }}>
      <h2>🍲 Módulo Comedor</h2>
      <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "10px", maxWidth: "300px" }}>
        <label>
          Menú del día:
          <input
            type="text"
            value={menu}
            onChange={(e) => setMenu(e.target.value)}
            required
          />
        </label>
        <label>
          Postre / Merienda:
          <input
            type="text"
            value={postre}
            onChange={(e) => setPostre(e.target.value)}
            required
          />
        </label>
        <label>
          Turno:
          <select value={turno} onChange={(e) => setTurno(e.target.value)}>
            <option value="Desayuno">Desayuno</option>
            <option value="Almuerzo">Almuerzo</option>
            <option value="Merienda">Merienda</option>
          </select>
        </label>
        <label>
          Cantidad de comensales:
          <input
            type="number"
            value={comensales}
            onChange={(e) => setComensales(e.target.value)}
            required
          />
        </label>
        <button type="submit">Registrar</button>
      </form>
    </div>
  );
}

export default Comedor;

