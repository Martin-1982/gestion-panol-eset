import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import API_BASE_URL from "../config";
import { useToast, ToastMessage } from "./useToast";

const TIPOS = [
  { key: "recursos",      label: "Recursos",          icon: "📦", desc: "Solicitá productos o elementos del pañol" },
  { key: "espacio",       label: "Reserva de Espacio", icon: "🏫", desc: "Reservá un aula, laboratorio o sala" },
  { key: "vehiculo",      label: "Reserva de Vehículo",icon: "🚐", desc: "Reservá un vehículo institucional" },
  { key: "mantenimiento", label: "Mantenimiento",      icon: "🔧", desc: "Reportá una falla, avería o rotura" },
];

const ESTADOS = {
  pendiente:  { label: "Pendiente",  color: "#d97706", bg: "#fef3c7" },
  aprobada:   { label: "Aprobada",   color: "#059669", bg: "#d1fae5" },
  rechazada:  { label: "Rechazada",  color: "#dc2626", bg: "#fee2e2" },
  entregada:  { label: "Entregada",  color: "#2563eb", bg: "#dbeafe" },
};

const PROBLEMAS = ["Eléctrico", "Plomería", "Gas", "Edilicio / Construcción", "Otro"];

export default function Solicitudes({ onBack }) {
  const { toast, showToast } = useToast();
  const [solicitudes, setSolicitudes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [vista, setVista] = useState("lista"); // lista | nueva | detalle
  const [selected, setSelected] = useState(null);
  const [filterTipo, setFilterTipo] = useState("");
  const [filterEstado, setFilterEstado] = useState("");
  const [saving, setSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(null);

  // form nueva solicitud
  const [tipo, setTipo] = useState("");
  const [form, setForm] = useState({});
  const [items, setItems] = useState([]);
  const [itemNombre, setItemNombre] = useState("");
  const [itemCantidad, setItemCantidad] = useState("");
  const [productos, setProductos] = useState([]);
  const [sugerencias, setSugerencias] = useState([]);
  const [prodFocus, setProdFocus] = useState(-1);
  const itemNombreRef = useRef(null);

  // modal cambio estado (admin)
  const [modalEstado, setModalEstado] = useState(null); // { solicitud, nuevoEstado }
  const [motivoRechazo, setMotivoRechazo] = useState("");
  const [remitoUrl, setRemitoUrl] = useState("");

  const token = localStorage.getItem("token");
  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const role = (localStorage.getItem("role") || "").toLowerCase();
  const isAdmin = role === "administrador";
  const isDirectivo = role === "directivo" || role === "coordinador";
  const canApprove = isAdmin;
  const canSeeAll = isAdmin || isDirectivo;

  useEffect(() => { fetchSolicitudes(); }, [filterTipo, filterEstado]);

  useEffect(() => {
    if (vista === "nueva" && tipo === "recursos") fetchProductos();
  }, [vista, tipo]);

  async function fetchSolicitudes() {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filterTipo) params.append("tipo", filterTipo);
      if (filterEstado) params.append("estado", filterEstado);
      const res = await axios.get(`${API_BASE_URL}/api/solicitudes?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setSolicitudes(res.data || []);
    } catch (err) {
      showToast("Error al cargar solicitudes", "error");
    } finally {
      setLoading(false);
    }
  }

  async function fetchProductos() {
    try {
      const res = await axios.get(`${API_BASE_URL}/api/productos`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setProductos(res.data || []);
    } catch (err) {}
  }

  function resetForm() {
    setTipo(""); setForm({}); setItems([]);
    setItemNombre(""); setItemCantidad(""); setSugerencias([]);
  }

  function handleFormChange(key, val) {
    setForm(prev => ({ ...prev, [key]: val }));
  }

  // ── Autocomplete productos ────────────────────────────────
  function onItemNombreChange(v) {
    setItemNombre(v); setProdFocus(-1);
    if (!v) return setSugerencias([]);
    setSugerencias(productos.filter(p => p.nombre.toLowerCase().includes(v.toLowerCase())).slice(0, 15));
  }

  function seleccionarProducto(p) {
    setItemNombre(p.nombre); setSugerencias([]); setProdFocus(-1);
  }

  function onItemKeyDown(e) {
    if (!sugerencias.length) return;
    if (e.key === "ArrowDown") { e.preventDefault(); setProdFocus(i => Math.min(i + 1, sugerencias.length - 1)); }
    else if (e.key === "ArrowUp") { e.preventDefault(); setProdFocus(i => Math.max(i - 1, 0)); }
    else if (e.key === "Enter") { e.preventDefault(); const s = sugerencias[prodFocus >= 0 ? prodFocus : 0]; if (s) seleccionarProducto(s); }
    else if (e.key === "Escape") { setSugerencias([]); setProdFocus(-1); }
  }

  function agregarItem() {
    if (!itemNombre.trim()) return showToast("Ingresá el nombre del item", "error");
    if (!itemCantidad || Number(itemCantidad) <= 0) return showToast("Ingresá una cantidad válida", "error");
    setItems(prev => [...prev, { nombre: itemNombre.trim(), cantidad: Number(itemCantidad) }]);
    setItemNombre(""); setItemCantidad(""); setSugerencias([]);
    itemNombreRef.current && itemNombreRef.current.focus();
  }

  function eliminarItem(i) {
    setItems(prev => prev.filter((_, idx) => idx !== i));
  }

  // ── Guardar solicitud ────────────────────────────────────
  async function guardarSolicitud() {
    if (!tipo) return showToast("Seleccioná un tipo de solicitud", "error");

    const payload = { tipo, area: form.area || "", observaciones: form.observaciones || "", ...form };

    if (tipo === "recursos") {
      if (items.length === 0) return showToast("Agregá al menos un item", "error");
      payload.items = items;
    }
    if (tipo === "espacio") {
      if (!form.espacio) return showToast("Indicá el espacio", "error");
      if (!form.fecha_desde) return showToast("Indicá la fecha", "error");
    }
    if (tipo === "vehiculo") {
      if (!form.vehiculo) return showToast("Indicá el vehículo", "error");
      if (!form.fecha_desde) return showToast("Indicá la fecha", "error");
    }
    if (tipo === "mantenimiento") {
      if (!form.ubicacion) return showToast("Indicá la ubicación", "error");
    }

    setSaving(true);
    try {
      await axios.post(`${API_BASE_URL}/api/solicitudes`, payload, {
        headers: { Authorization: `Bearer ${token}` },
      });
      showToast("Solicitud enviada correctamente", "success");
      resetForm();
      setVista("lista");
      fetchSolicitudes();
    } catch (err) {
      showToast(err.response?.data?.error || "Error al enviar solicitud", "error");
    } finally {
      setSaving(false);
    }
  }

  // ── Cambiar estado ───────────────────────────────────────
  async function cambiarEstado() {
    if (!modalEstado) return;
    const { solicitud, nuevoEstado } = modalEstado;
    if (nuevoEstado === "rechazada" && !motivoRechazo.trim()) {
      return showToast("Ingresá el motivo del rechazo", "error");
    }
    setSaving(true);
    try {
      await axios.patch(
        `${API_BASE_URL}/api/solicitudes/${solicitud.id}/estado`,
        { estado: nuevoEstado, motivo_rechazo: motivoRechazo || null, remito_url: remitoUrl || null },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      showToast("Estado actualizado", "success");
      setModalEstado(null); setMotivoRechazo(""); setRemitoUrl("");
      // refrescar detalle y lista
      if (selected) {
        const res = await axios.get(`${API_BASE_URL}/api/solicitudes/${selected.id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setSelected(res.data);
      }
      fetchSolicitudes();
    } catch (err) {
      showToast(err.response?.data?.error || "Error al actualizar estado", "error");
    } finally {
      setSaving(false);
    }
  }

  async function eliminarSolicitud(id) {
    try {
      await axios.delete(`${API_BASE_URL}/api/solicitudes/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      showToast("Solicitud eliminada", "success");
      setConfirmDelete(null);
      if (vista === "detalle") { setVista("lista"); setSelected(null); }
      fetchSolicitudes();
    } catch (err) {
      showToast(err.response?.data?.error || "Error al eliminar", "error");
    }
  }

  // ── Helpers UI ───────────────────────────────────────────
  function badgeEstado(estado) {
    const e = ESTADOS[estado] || { label: estado, color: "#64748b", bg: "#f1f5f9" };
    return (
      <span style={{ background: e.bg, color: e.color, padding: "3px 10px", borderRadius: 99, fontSize: 12, fontWeight: 700 }}>
        {e.label}
      </span>
    );
  }

  function tipoLabel(t) {
    return TIPOS.find(x => x.key === t)?.label || t;
  }

  function formatFecha(d) {
    if (!d) return "-";
    return new Date(d).toLocaleDateString("es-AR");
  }

  // ══════════════════════════════════════════════════════════
  // RENDER LISTA
  // ══════════════════════════════════════════════════════════
  if (vista === "lista") {
    const filtered = solicitudes.filter(s => {
      if (filterTipo && s.tipo !== filterTipo) return false;
      if (filterEstado && s.estado !== filterEstado) return false;
      return true;
    });

    return (
      <div className="main-content">
        <ToastMessage toast={toast} />
        <div className="card">
          {/* Header */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20, flexWrap: "wrap", gap: 12 }}>
            <h2 style={{ margin: 0, fontSize: 22, color: "var(--primary)", fontWeight: 700, display: "flex", alignItems: "center", gap: 8 }}>
              <span>📋</span><span>Solicitudes</span>
            </h2>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              <button onClick={onBack} className="btn-outline">⬅ Volver</button>
              <button onClick={() => { resetForm(); setVista("nueva"); }} className="btn-primary">+ Nueva Solicitud</button>
            </div>
          </div>

          {/* Filtros */}
          <div style={{ display: "flex", gap: 10, marginBottom: 20, flexWrap: "wrap" }}>
            <select value={filterTipo} onChange={e => setFilterTipo(e.target.value)} style={{ padding: "8px 12px", borderRadius: 8, border: "1.5px solid var(--gray-300)", fontSize: 14 }}>
              <option value="">Todos los tipos</option>
              {TIPOS.map(t => <option key={t.key} value={t.key}>{t.label}</option>)}
            </select>
            <select value={filterEstado} onChange={e => setFilterEstado(e.target.value)} style={{ padding: "8px 12px", borderRadius: 8, border: "1.5px solid var(--gray-300)", fontSize: 14 }}>
              <option value="">Todos los estados</option>
              {Object.entries(ESTADOS).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
            </select>
            {(filterTipo || filterEstado) && (
              <button onClick={() => { setFilterTipo(""); setFilterEstado(""); }} className="btn-outline" style={{ fontSize: 13 }}>✕ Limpiar</button>
            )}
          </div>

          {/* Lista */}
          {loading ? (
            <div style={{ textAlign: "center", padding: 40, color: "var(--gray-500)" }}>Cargando...</div>
          ) : filtered.length === 0 ? (
            <div style={{ padding: 32, textAlign: "center", color: "var(--gray-500)", background: "var(--gray-50)", borderRadius: 8, border: "1px dashed var(--gray-300)" }}>
              No hay solicitudes
            </div>
          ) : (
            <div className="table-container">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Tipo</th>
                    <th>Solicitante</th>
                    <th>Área</th>
                    <th>Fecha</th>
                    <th>Estado</th>
                    <th style={{ textAlign: "center" }}>Ver</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(s => (
                    <tr key={s.id}>
                      <td style={{ color: "var(--gray-400)", fontSize: 13 }}>{s.id}</td>
                      <td>
                        <span>{TIPOS.find(t => t.key === s.tipo)?.icon} </span>
                        <span style={{ fontWeight: 600 }}>{tipoLabel(s.tipo)}</span>
                      </td>
                      <td>{s.usuario_nombre || "-"}</td>
                      <td>{s.area || "-"}</td>
                      <td style={{ fontSize: 13 }}>{formatFecha(s.created_at)}</td>
                      <td>{badgeEstado(s.estado)}</td>
                      <td style={{ textAlign: "center" }}>
                        <button
                          onClick={() => { setSelected(s); setVista("detalle"); }}
                          style={{ padding: "6px 14px", borderRadius: 6, border: "1.5px solid var(--gray-300)", background: "white", cursor: "pointer", fontSize: 13, fontWeight: 600 }}
                        >
                          Ver
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    );
  }

  // ══════════════════════════════════════════════════════════
  // RENDER NUEVA SOLICITUD
  // ══════════════════════════════════════════════════════════
  if (vista === "nueva") {
    return (
      <div className="main-content">
        <ToastMessage toast={toast} />
        <div className="card">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
            <h2 style={{ margin: 0, fontSize: 22, color: "var(--primary)", fontWeight: 700 }}>📋 Nueva Solicitud</h2>
            <button onClick={() => { resetForm(); setVista("lista"); }} className="btn-outline">⬅ Volver</button>
          </div>

          {/* Selección de tipo — botones visuales */}
          <div style={{ marginBottom: 28 }}>
            <label style={{ fontSize: 13, fontWeight: 700, color: "var(--gray-600)", display: "block", marginBottom: 12 }}>Tipo de solicitud *</label>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 12 }}>
              {TIPOS.map(t => (
                <button
                  key={t.key}
                  type="button"
                  title={t.desc}
                  onClick={() => { setTipo(t.key); setForm({}); setItems([]); }}
                  style={{
                    padding: "18px 12px",
                    borderRadius: 12,
                    border: tipo === t.key ? "2.5px solid var(--primary)" : "1.5px solid var(--gray-200)",
                    background: tipo === t.key ? "var(--primary)" : "white",
                    color: tipo === t.key ? "white" : "var(--gray-700)",
                    cursor: "pointer",
                    display: "flex", flexDirection: "column", alignItems: "center", gap: 8,
                    fontFamily: "inherit", transition: "all .15s",
                    boxShadow: tipo === t.key ? "0 4px 12px rgba(15,45,92,.2)" : "none",
                  }}
                >
                  <span style={{ fontSize: 28 }}>{t.icon}</span>
                  <span style={{ fontSize: 13, fontWeight: 700, lineHeight: 1.3, textAlign: "center" }}>{t.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Campos comunes */}
          {tipo && (
            <>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16 }}>
                <div>
                  <label style={{ fontSize: 13, fontWeight: 600, color: "var(--gray-600)", display: "block", marginBottom: 5 }}>Área / Sector</label>
                  <input value={form.area || ""} onChange={e => handleFormChange("area", e.target.value)} placeholder="Ej: Laboratorio de Química" />
                </div>
              </div>

              {/* Campos según tipo */}
              {tipo === "recursos" && (
                <div style={{ marginBottom: 16 }}>
                  <label style={{ fontSize: 13, fontWeight: 600, color: "var(--gray-600)", display: "block", marginBottom: 8 }}>Items solicitados *</label>
                  <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
                    <input
                      value={itemCantidad}
                      onChange={e => setItemCantidad(e.target.value)}
                      placeholder="Cant."
                      type="number" min="1"
                      style={{ width: 80, flexShrink: 0 }}
                    />
                    <div style={{ flex: 1, position: "relative" }}>
                      <input
                        ref={itemNombreRef}
                        value={itemNombre}
                        onChange={e => onItemNombreChange(e.target.value)}
                        onKeyDown={onItemKeyDown}
                        placeholder="Nombre del producto o elemento..."
                      />
                      {sugerencias.length > 0 && (
                        <div className="autocomplete-list">
                          {sugerencias.map((s, idx) => (
                            <div key={s.id} className={`autocomplete-item${idx === prodFocus ? " active" : ""}`} onClick={() => seleccionarProducto(s)}>
                              {s.nombre}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                    <button type="button" onClick={agregarItem} className="btn-primary" style={{ width: 44, height: 44, padding: 0, fontSize: 20, flexShrink: 0 }}>✓</button>
                  </div>
                  {items.length === 0 ? (
                    <div style={{ padding: 16, textAlign: "center", color: "var(--gray-400)", background: "var(--gray-50)", borderRadius: 8, border: "1px dashed var(--gray-300)", fontSize: 13 }}>
                      No hay items agregados
                    </div>
                  ) : (
                    <table className="data-table" style={{ marginTop: 4 }}>
                      <thead><tr><th>Cantidad</th><th>Item</th><th style={{ width: 50 }}></th></tr></thead>
                      <tbody>
                        {items.map((it, i) => (
                          <tr key={i}>
                            <td style={{ fontWeight: 700, width: 80 }}>{it.cantidad}</td>
                            <td>{it.nombre}</td>
                            <td><button onClick={() => eliminarItem(i)} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 16, color: "var(--danger)" }}>×</button></td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              )}

              {tipo === "espacio" && (
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16 }}>
                  <div>
                    <label style={{ fontSize: 13, fontWeight: 600, color: "var(--gray-600)", display: "block", marginBottom: 5 }}>Espacio *</label>
                    <input value={form.espacio || ""} onChange={e => handleFormChange("espacio", e.target.value)} placeholder="Ej: Aula 3, Lab. Química..." />
                  </div>
                  <div>
                    <label style={{ fontSize: 13, fontWeight: 600, color: "var(--gray-600)", display: "block", marginBottom: 5 }}>Fecha desde *</label>
                    <input type="date" value={form.fecha_desde || ""} onChange={e => handleFormChange("fecha_desde", e.target.value)} />
                  </div>
                  <div>
                    <label style={{ fontSize: 13, fontWeight: 600, color: "var(--gray-600)", display: "block", marginBottom: 5 }}>Fecha hasta</label>
                    <input type="date" value={form.fecha_hasta || ""} onChange={e => handleFormChange("fecha_hasta", e.target.value)} />
                  </div>
                  <div>
                    <label style={{ fontSize: 13, fontWeight: 600, color: "var(--gray-600)", display: "block", marginBottom: 5 }}>Horario</label>
                    <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                      <input type="time" value={form.hora_desde || ""} onChange={e => handleFormChange("hora_desde", e.target.value)} />
                      <span style={{ color: "var(--gray-500)" }}>→</span>
                      <input type="time" value={form.hora_hasta || ""} onChange={e => handleFormChange("hora_hasta", e.target.value)} />
                    </div>
                  </div>
                  <div style={{ gridColumn: "span 2" }}>
                    <label style={{ fontSize: 13, fontWeight: 600, color: "var(--gray-600)", display: "block", marginBottom: 5 }}>Motivo de la reserva</label>
                    <input value={form.motivo_reserva || ""} onChange={e => handleFormChange("motivo_reserva", e.target.value)} placeholder="Descripción breve..." />
                  </div>
                </div>
              )}

              {tipo === "vehiculo" && (
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16 }}>
                  <div>
                    <label style={{ fontSize: 13, fontWeight: 600, color: "var(--gray-600)", display: "block", marginBottom: 5 }}>Vehículo *</label>
                    <input value={form.vehiculo || ""} onChange={e => handleFormChange("vehiculo", e.target.value)} placeholder="Ej: Combi blanca, Renault..." />
                  </div>
                  <div>
                    <label style={{ fontSize: 13, fontWeight: 600, color: "var(--gray-600)", display: "block", marginBottom: 5 }}>Fecha de salida *</label>
                    <input type="date" value={form.fecha_desde || ""} onChange={e => handleFormChange("fecha_desde", e.target.value)} />
                  </div>
                  <div>
                    <label style={{ fontSize: 13, fontWeight: 600, color: "var(--gray-600)", display: "block", marginBottom: 5 }}>Fecha de regreso</label>
                    <input type="date" value={form.fecha_hasta || ""} onChange={e => handleFormChange("fecha_hasta", e.target.value)} />
                  </div>
                  <div>
                    <label style={{ fontSize: 13, fontWeight: 600, color: "var(--gray-600)", display: "block", marginBottom: 5 }}>Cantidad de personas</label>
                    <input type="number" min="1" value={form.cantidad_personas || ""} onChange={e => handleFormChange("cantidad_personas", e.target.value)} placeholder="Ej: 12" />
                  </div>
                  <div style={{ gridColumn: "span 2" }}>
                    <label style={{ fontSize: 13, fontWeight: 600, color: "var(--gray-600)", display: "block", marginBottom: 5 }}>Destino / Motivo del viaje</label>
                    <input value={form.destino_viaje || ""} onChange={e => handleFormChange("destino_viaje", e.target.value)} placeholder="Ej: Salida educativa a Paraná..." />
                  </div>
                </div>
              )}

              {tipo === "mantenimiento" && (
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16 }}>
                  <div>
                    <label style={{ fontSize: 13, fontWeight: 600, color: "var(--gray-600)", display: "block", marginBottom: 5 }}>Ubicación / Sector *</label>
                    <input value={form.ubicacion || ""} onChange={e => handleFormChange("ubicacion", e.target.value)} placeholder="Ej: Baño planta baja, Aula 5..." />
                  </div>
                  <div>
                    <label style={{ fontSize: 13, fontWeight: 600, color: "var(--gray-600)", display: "block", marginBottom: 5 }}>Tipo de problema</label>
                    <select value={form.tipo_problema || ""} onChange={e => handleFormChange("tipo_problema", e.target.value)}>
                      <option value="">Seleccionar...</option>
                      {PROBLEMAS.map(p => <option key={p} value={p}>{p}</option>)}
                    </select>
                  </div>
                  <div>
                    <label style={{ fontSize: 13, fontWeight: 600, color: "var(--gray-600)", display: "block", marginBottom: 5 }}>Urgencia</label>
                    <select value={form.urgencia || "normal"} onChange={e => handleFormChange("urgencia", e.target.value)}>
                      <option value="normal">Normal</option>
                      <option value="urgente">Urgente</option>
                    </select>
                  </div>
                </div>
              )}

              {/* Observaciones */}
              <div style={{ marginBottom: 20 }}>
                <label style={{ fontSize: 13, fontWeight: 600, color: "var(--gray-600)", display: "block", marginBottom: 5 }}>Observaciones adicionales</label>
                <textarea value={form.observaciones || ""} onChange={e => handleFormChange("observaciones", e.target.value)} placeholder="Cualquier detalle adicional..." rows={3} />
              </div>

              <div style={{ borderTop: "1px solid var(--gray-200)", paddingTop: 16, display: "flex", justifyContent: "flex-end", gap: 10 }}>
                <button onClick={() => { resetForm(); setVista("lista"); }} className="btn-outline">Cancelar</button>
                <button onClick={guardarSolicitud} className="btn-primary" disabled={saving}>
                  {saving ? "Enviando..." : "📤 Enviar Solicitud"}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    );
  }

  // ══════════════════════════════════════════════════════════
  // RENDER DETALLE
  // ══════════════════════════════════════════════════════════
  if (vista === "detalle" && selected) {
    const s = selected;
    const tipoInfo = TIPOS.find(t => t.key === s.tipo) || {};
    const puedeEliminar = isAdmin || (s.usuario_id === user.id && s.estado === "pendiente");

    return (
      <div className="main-content">
        <ToastMessage toast={toast} />
        <div className="card">
          {/* Header */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 24, flexWrap: "wrap", gap: 12 }}>
            <div>
              <div style={{ fontSize: 13, color: "var(--gray-500)", marginBottom: 4 }}>Solicitud #{s.id}</div>
              <h2 style={{ margin: 0, fontSize: 22, color: "var(--primary)", fontWeight: 700, display: "flex", alignItems: "center", gap: 8 }}>
                <span>{tipoInfo.icon}</span><span>{tipoInfo.label}</span>
              </h2>
            </div>
            <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
              {badgeEstado(s.estado)}
              <button onClick={() => { setSelected(null); setVista("lista"); }} className="btn-outline">⬅ Volver</button>
            </div>
          </div>

          {/* Info general */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 16, marginBottom: 24, background: "var(--gray-50)", borderRadius: 10, padding: 16 }}>
            <div><div style={{ fontSize: 11, fontWeight: 700, color: "var(--gray-500)", textTransform: "uppercase", marginBottom: 3 }}>Solicitante</div><div style={{ fontWeight: 600 }}>{s.usuario_nombre || "-"}</div></div>
            <div><div style={{ fontSize: 11, fontWeight: 700, color: "var(--gray-500)", textTransform: "uppercase", marginBottom: 3 }}>Área</div><div>{s.area || "-"}</div></div>
            <div><div style={{ fontSize: 11, fontWeight: 700, color: "var(--gray-500)", textTransform: "uppercase", marginBottom: 3 }}>Fecha</div><div>{formatFecha(s.created_at)}</div></div>
            {s.tipo === "mantenimiento" && s.urgencia === "urgente" && (
              <div><div style={{ fontSize: 11, fontWeight: 700, color: "var(--danger)", textTransform: "uppercase", marginBottom: 3 }}>⚠ Urgencia</div><div style={{ color: "var(--danger)", fontWeight: 700 }}>URGENTE</div></div>
            )}
          </div>

          {/* Detalle por tipo */}
          {s.tipo === "recursos" && s.items && (
            <div style={{ marginBottom: 20 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: "var(--gray-600)", marginBottom: 8 }}>Items solicitados</div>
              <table className="data-table">
                <thead><tr><th>Cantidad</th><th>Item</th></tr></thead>
                <tbody>
                  {(typeof s.items === "string" ? JSON.parse(s.items) : s.items).map((it, i) => (
                    <tr key={i}><td style={{ fontWeight: 700, width: 80 }}>{it.cantidad}</td><td>{it.nombre}</td></tr>
                  ))}
                </tbody>
              </table>
              {s.remito_url && (
                <div style={{ marginTop: 12 }}>
                  <a href={s.remito_url} target="_blank" rel="noreferrer" style={{ color: "var(--primary)", fontWeight: 600, fontSize: 14 }}>📄 Ver remito de entrega</a>
                </div>
              )}
            </div>
          )}

          {s.tipo === "espacio" && (
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 20 }}>
              <div><div style={{ fontSize: 12, color: "var(--gray-500)", fontWeight: 700, marginBottom: 2 }}>ESPACIO</div><div style={{ fontWeight: 600 }}>{s.espacio || "-"}</div></div>
              <div><div style={{ fontSize: 12, color: "var(--gray-500)", fontWeight: 700, marginBottom: 2 }}>FECHA</div><div>{formatFecha(s.fecha_desde)}{s.fecha_hasta && s.fecha_hasta !== s.fecha_desde ? ` → ${formatFecha(s.fecha_hasta)}` : ""}</div></div>
              {(s.hora_desde || s.hora_hasta) && <div><div style={{ fontSize: 12, color: "var(--gray-500)", fontWeight: 700, marginBottom: 2 }}>HORARIO</div><div>{s.hora_desde || ""} → {s.hora_hasta || ""}</div></div>}
              {s.motivo_reserva && <div style={{ gridColumn: "span 2" }}><div style={{ fontSize: 12, color: "var(--gray-500)", fontWeight: 700, marginBottom: 2 }}>MOTIVO</div><div>{s.motivo_reserva}</div></div>}
            </div>
          )}

          {s.tipo === "vehiculo" && (
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 20 }}>
              <div><div style={{ fontSize: 12, color: "var(--gray-500)", fontWeight: 700, marginBottom: 2 }}>VEHÍCULO</div><div style={{ fontWeight: 600 }}>{s.vehiculo || "-"}</div></div>
              <div><div style={{ fontSize: 12, color: "var(--gray-500)", fontWeight: 700, marginBottom: 2 }}>FECHA SALIDA</div><div>{formatFecha(s.fecha_desde)}</div></div>
              {s.fecha_hasta && <div><div style={{ fontSize: 12, color: "var(--gray-500)", fontWeight: 700, marginBottom: 2 }}>FECHA REGRESO</div><div>{formatFecha(s.fecha_hasta)}</div></div>}
              {s.cantidad_personas && <div><div style={{ fontSize: 12, color: "var(--gray-500)", fontWeight: 700, marginBottom: 2 }}>PERSONAS</div><div>{s.cantidad_personas}</div></div>}
              {s.destino_viaje && <div style={{ gridColumn: "span 2" }}><div style={{ fontSize: 12, color: "var(--gray-500)", fontWeight: 700, marginBottom: 2 }}>DESTINO</div><div>{s.destino_viaje}</div></div>}
            </div>
          )}

          {s.tipo === "mantenimiento" && (
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 20 }}>
              <div><div style={{ fontSize: 12, color: "var(--gray-500)", fontWeight: 700, marginBottom: 2 }}>UBICACIÓN</div><div style={{ fontWeight: 600 }}>{s.ubicacion || "-"}</div></div>
              {s.tipo_problema && <div><div style={{ fontSize: 12, color: "var(--gray-500)", fontWeight: 700, marginBottom: 2 }}>TIPO DE PROBLEMA</div><div>{s.tipo_problema}</div></div>}
            </div>
          )}

          {s.observaciones && (
            <div style={{ marginBottom: 20, padding: 14, background: "var(--gray-50)", borderRadius: 8, border: "1px solid var(--gray-200)" }}>
              <div style={{ fontSize: 12, color: "var(--gray-500)", fontWeight: 700, marginBottom: 4 }}>OBSERVACIONES</div>
              <div style={{ fontSize: 14 }}>{s.observaciones}</div>
            </div>
          )}

          {/* Respuesta del admin */}
          {(s.estado === "rechazada" || s.respondido_nombre) && (
            <div style={{ marginBottom: 20, padding: 14, background: s.estado === "rechazada" ? "#fee2e2" : "#d1fae5", borderRadius: 8, border: `1px solid ${s.estado === "rechazada" ? "#fca5a5" : "#6ee7b7"}` }}>
              <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 4, color: s.estado === "rechazada" ? "#991b1b" : "#065f46" }}>
                {s.estado === "rechazada" ? "MOTIVO DE RECHAZO" : "RESPUESTA"}
              </div>
              {s.motivo_rechazo && <div style={{ fontSize: 14 }}>{s.motivo_rechazo}</div>}
              {s.respondido_nombre && <div style={{ fontSize: 12, marginTop: 6, opacity: 0.7 }}>Por: {s.respondido_nombre} — {formatFecha(s.fecha_respuesta)}</div>}
            </div>
          )}

          {/* Acciones admin */}
          {canApprove && s.estado === "pendiente" && (
            <div style={{ borderTop: "1px solid var(--gray-200)", paddingTop: 16, display: "flex", gap: 10, flexWrap: "wrap" }}>
              <button onClick={() => { setModalEstado({ solicitud: s, nuevoEstado: "aprobada" }); setMotivoRechazo(""); setRemitoUrl(""); }} className="btn-primary">✅ Aprobar</button>
              <button onClick={() => { setModalEstado({ solicitud: s, nuevoEstado: "rechazada" }); setMotivoRechazo(""); setRemitoUrl(""); }} className="btn-outline" style={{ color: "var(--danger)", borderColor: "var(--danger)" }}>❌ Rechazar</button>
            </div>
          )}
          {canApprove && s.estado === "aprobada" && s.tipo === "recursos" && (
            <div style={{ borderTop: "1px solid var(--gray-200)", paddingTop: 16, display: "flex", gap: 10, flexWrap: "wrap" }}>
              <button onClick={() => { setModalEstado({ solicitud: s, nuevoEstado: "entregada" }); setMotivoRechazo(""); setRemitoUrl(""); }} className="btn-primary">📦 Marcar como entregada</button>
            </div>
          )}

          {/* Eliminar */}
          {puedeEliminar && (
            <div style={{ marginTop: 16, paddingTop: 16, borderTop: "1px solid var(--gray-100)" }}>
              <button onClick={() => setConfirmDelete(s.id)} style={{ background: "none", border: "none", color: "var(--danger)", cursor: "pointer", fontSize: 13, fontWeight: 600 }}>
                🗑 Eliminar solicitud
              </button>
            </div>
          )}
        </div>

        {/* Modal cambio estado */}
        {modalEstado && (
          <div className="modal-overlay" onClick={e => { if (e.target === e.currentTarget) setModalEstado(null); }}>
            <div className="modal-content">
              <h3>
                {modalEstado.nuevoEstado === "aprobada" && "✅ Aprobar solicitud"}
                {modalEstado.nuevoEstado === "rechazada" && "❌ Rechazar solicitud"}
                {modalEstado.nuevoEstado === "entregada" && "📦 Marcar como entregada"}
              </h3>

              {modalEstado.nuevoEstado === "rechazada" && (
                <div style={{ marginBottom: 16 }}>
                  <label style={{ fontSize: 13, fontWeight: 600, color: "var(--gray-600)", display: "block", marginBottom: 5 }}>Motivo del rechazo *</label>
                  <textarea value={motivoRechazo} onChange={e => setMotivoRechazo(e.target.value)} placeholder="Explicá el motivo..." rows={3} />
                </div>
              )}

              {modalEstado.nuevoEstado === "entregada" && (
                <div style={{ marginBottom: 16 }}>
                  <label style={{ fontSize: 13, fontWeight: 600, color: "var(--gray-600)", display: "block", marginBottom: 5 }}>Link al remito (opcional)</label>
                  <input value={remitoUrl} onChange={e => setRemitoUrl(e.target.value)} placeholder="https://..." />
                </div>
              )}

              {modalEstado.nuevoEstado === "aprobada" && (
                <p style={{ color: "var(--gray-600)", fontSize: 14 }}>¿Confirmás la aprobación de esta solicitud?</p>
              )}

              <div className="form-actions">
                <button onClick={() => setModalEstado(null)} className="btn-outline">Cancelar</button>
                <button onClick={cambiarEstado} className="btn-primary" disabled={saving}>
                  {saving ? "Guardando..." : "Confirmar"}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Modal confirmar eliminar */}
        {confirmDelete && (
          <div className="modal-overlay" onClick={e => { if (e.target === e.currentTarget) setConfirmDelete(null); }}>
            <div className="modal-content">
              <h3>❌ Eliminar solicitud</h3>
              <p style={{ color: "var(--gray-600)", fontSize: 14 }}>¿Estás seguro que querés eliminar esta solicitud? Esta acción no se puede deshacer.</p>
              <div className="form-actions">
                <button onClick={() => setConfirmDelete(null)} className="btn-outline">Cancelar</button>
                <button onClick={() => eliminarSolicitud(confirmDelete)} className="btn-primary" style={{ background: "var(--danger)" }}>Eliminar</button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  return null;
}
