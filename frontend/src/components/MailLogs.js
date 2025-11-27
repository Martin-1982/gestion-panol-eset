import React, { useEffect, useState } from 'react';
import axios from 'axios';
import API_BASE_URL from '../config';

export default function MailLogs({ onBack }) {
  const [logs, setLogs] = useState([]);

  const fetchLogs = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get(`${API_BASE_URL}/api/informes/mail_logs`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setLogs(res.data);
    } catch (err) {
      console.error('Error obteniendo mail logs', err);
    }
  };

  useEffect(() => {
    fetchLogs();
    const handler = () => fetchLogs();
    window.addEventListener('mail:sent', handler);
    return () => window.removeEventListener('mail:sent', handler);
  }, []);

  return (
    <div style={{ padding: 20, fontFamily: 'Arial' }}>
      <h2>📧 Historial de envíos</h2>
      <button onClick={onBack}>🔙 Volver</button>
      <table border="1" cellPadding="6" style={{ width: '100%', marginTop: 10 }}>
        <thead style={{ background: '#eee' }}>
          <tr>
            <th>ID</th>
            <th>Usuario</th>
            <th>Destinatario</th>
            <th>Asunto</th>
            <th>Estado</th>
            <th>Fecha</th>
          </tr>
        </thead>
        <tbody>
          {logs.map((l) => (
            <tr key={l.id}>
              <td>{l.id}</td>
              <td>{l.usuario_id}</td>
              <td>{l.destinatario}</td>
              <td>{l.asunto}</td>
              <td>{l.status}</td>
              <td>{new Date(l.created_at).toLocaleString()}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
