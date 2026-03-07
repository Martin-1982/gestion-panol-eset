import { useState, useRef, useEffect } from "react";

/**
 * useToast — hook reutilizable para notificaciones
 *
 * Uso:
 *   const { toast, showToast } = useToast();
 *
 *   // Mostrar notificación:
 *   showToast("Producto guardado", "success");
 *   showToast("Error al guardar", "error");
 *
 *   // Renderizar en el JSX:
 *   <ToastMessage toast={toast} />
 */

export function useToast(defaultMs = 1600) {
  const [toast, setToast] = useState({ visible: false, message: "", type: "success" });
  const toastTimer = useRef(null);

  useEffect(() => {
    return () => { if (toastTimer.current) clearTimeout(toastTimer.current); };
  }, []);

  const showToast = (message, type = "success", ms = defaultMs) => {
    setToast({ visible: true, message, type });
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(
      () => setToast({ visible: false, message: "", type: "success" }),
      ms
    );
  };

  return { toast, showToast };
}

/**
 * ToastMessage — componente para renderizar el toast
 *
 * Uso:
 *   <ToastMessage toast={toast} />
 */
export function ToastMessage({ toast }) {
  if (!toast.visible) return null;
  return (
    <div
      className="toast"
      style={{
        background: toast.type === "error" ? "var(--error)" : "var(--success)",
        color: "var(--white)",
        left: "50%",
        transform: "translateX(-50%)",
        minWidth: 220,
        fontWeight: 500,
        fontSize: "1.05rem",
        zIndex: 2000,
      }}
    >
      {toast.message}
    </div>
  );
}
