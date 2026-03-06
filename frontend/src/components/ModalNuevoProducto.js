import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import API_BASE_URL from '../config';

const CATEGORIAS = [
  "Alimento", "Limpieza", "Bazar", "Ferretería",
  "Librería", "Tecnología", "Seguridad", "Laboratorio",
];

const getTipoOpciones = (categoria) => {
  if (categoria === "Alimento") return ["Perecedero", "No perecedero"];
  return ["Uso", "Consumo"];
};

// Props:
// - onClose: función que se llama al cerrar el modal
// - onProductoCreado: función que recibe el producto nuevo creado
function ModalNuevoProducto({ onClose, onProductoCreado }) {
  const [form, setForm] = useState({
    nombre: "", categoria: "", subcategoria: "",
    tipo: "", presentacion: "", unidad: "", minimo: 0,
  });

  const [subcategorias, setSubcategorias] = useState([]);
  const [loadingSubcats, setLoadingSubcats] = useState(false);
  const [showNuevaSubcat, setShowNuevaSubcat] = useState(false);
  const [nuevaSubcat, setNuevaSubcat] = useState("");
  const [savingSubcat, setSavingSubcat] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const nombreRef = useRef(null);

  useEffect(() => {
    setTimeout(() => nombreRef.current && nombreRef.current.focus(), 60);
  }, []);

  useEffect(() => {
    if (form.categoria) {
      fetchSubcategorias(form.categoria);
    } else {
      setSubcategorias([]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form.categoria]);

  const fetchSubcategorias = async (categoria) => {
    setLoadingSubcats(true);
    try {
      const res = await axios.get(`${API_BASE_URL}/api/subcategorias?categoria=${encodeURIComponent(categoria)}`);
      setSubcategorias(res.data);
    } catch (err) {
      setSubcategorias([]);
    } finally {
      setLoadingSubcats(false);
    }
  };

  const handleCategoriaChange = (e) => {
    setForm({ ...form, categoria: e.target.value, subcategoria: "", tipo: "" });
    setShowNuevaSubcat(false);
    setNuevaSubcat("");
  };

  const handleGuardarNuevaSubcat = async () => {
    if (!nuevaSubcat.trim()) return;
    setSavingSubcat(true);
    try {
      const token = localStorage.getItem("token");
      const res = await axios.post(
        `${API_BASE_URL}/api/subcategorias`,
        { nombre: nuevaSubcat.trim(), categoria: form.categoria },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setSubcategorias(prev => [...prev, res.data].sort((a, b) => a.nombre.localeCompare(b.nombre)));
      setForm(prev => ({ ...prev, subcategoria: nuevaSubcat.trim() }));
      setNuevaSubcat("");
      setShowNuevaSubcat(false);
    } catch (err) {
      setError(err.response?.data?.error || "Error al guardar subcategoría");
    } finally {
      setSavingSubcat(false);
    }
  };

  const handleGuardar = async () => {
    setError("");
    if (!form.nombre.trim()) { setError("Nombre es obligatorio"); return; }
    if (!form.categoria) { setError("Categoría es obligatoria"); return; }
    if (!form.tipo) { setError("Tipo es obligatorio"); return; }
    if (!form.presentacion.trim()) { setError("Presentación es obligatoria"); return; }
    if (!form.unidad.trim()) { setError("Unidad es obligatoria"); return; }

    setSaving(true);
    try {
      const token = localStorage.getItem("token");
      const res = await axios.post(
        `${API_BASE_URL}/api/productos`,
        { ...form, minimo: Number(form.minimo) || 0 },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      onProductoCreado(res.data);
      onClose();
    } catch (err) {
      setError(err.response?.data?.error || "Error al guardar producto");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="modal-content" role="dialog" aria-modal="true">
        <h3>Nuevo producto</h3>

        {error && (
          <div style={{ color: 'var(--error)', background: '#fff0f0', padding: '8px 12px', borderRadius: '6px', marginBottom: '12px', fontSize: '14px' }}>
            {error}
          </div>
        )}

        <label>Nombre *</label>
        <input
          ref={nombreRef}
          placeholder="Nombre del producto"
          value={form.nombre}
          onChange={(e) => setForm({ ...form, nombre: e.target.value })}
        />

        <label>Categoría *</label>
        <select value={form.categoria} onChange={handleCategoriaChange}>
          <option value="">— Seleccionar categoría —</option>
          {CATEGORIAS.map(c => <option key={c} value={c}>{c}</option>)}
        </select>

        {form.categoria && (
          <>
            <label>Tipo *</label>
            <select value={form.tipo} onChange={(e) => setForm({ ...form, tipo: e.target.value })}>
              <option value="">— Seleccionar tipo —</option>
              {getTipoOpciones(form.categoria).map(t => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </>
        )}

        {form.categoria && (
          <>
            <label>Subcategoría</label>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              <select
                style={{ flex: 1 }}
                value={form.subcategoria}
                onChange={(e) => setForm({ ...form, subcategoria: e.target.value })}
                disabled={loadingSubcats}
              >
                <option value="">— Seleccionar subcategoría —</option>
                {subcategorias.map(s => <option key={s.id} value={s.nombre}>{s.nombre}</option>)}
              </select>
              <button
                className="btn-accent"
                style={{ padding: '8px 14px', fontSize: '18px', lineHeight: 1 }}
                title="Agregar subcategoría nueva"
                onClick={() => { setShowNuevaSubcat(!showNuevaSubcat); setNuevaSubcat(""); }}
              >+</button>
            </div>

            {showNuevaSubcat && (
              <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
                <input
                  style={{ flex: 1 }}
                  placeholder={`Nueva subcategoría para ${form.categoria}`}
                  value={nuevaSubcat}
                  onChange={(e) => setNuevaSubcat(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleGuardarNuevaSubcat(); } }}
                  autoFocus
                />
                <button className="btn-primary" onClick={handleGuardarNuevaSubcat} disabled={savingSubcat || !nuevaSubcat.trim()}>
                  {savingSubcat ? "..." : "Guardar"}
                </button>
                <button className="btn-outline" onClick={() => { setShowNuevaSubcat(false); setNuevaSubcat(""); }}>
                  Cancelar
                </button>
              </div>
            )}
          </>
        )}

        <label>Presentación *</label>
        <input
          placeholder="Ej: Caja, Bolsa, Litro"
          value={form.presentacion}
          onChange={(e) => setForm({ ...form, presentacion: e.target.value })}
        />

        <label>Unidad *</label>
        <input
          placeholder="Ej: kg, litros, unidades"
          value={form.unidad}
          onChange={(e) => setForm({ ...form, unidad: e.target.value })}
        />

        <label>Stock mínimo</label>
        <input
          type="number"
          placeholder="0"
          min={0}
          step={1}
          value={form.minimo}
          onChange={(e) => setForm({ ...form, minimo: e.target.value })}
        />

        <div className="form-actions">
          <button className="btn-outline" onClick={onClose}>Cancelar</button>
          <button className="btn-primary" onClick={handleGuardar} disabled={saving}>
            {saving ? "Guardando..." : "💾 Guardar"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default ModalNuevoProducto;
