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
    <div className="main-content">
      <div className="dashboard-header">
        <h2 className="dashboard-title">📧 Historial de envíos</h2>
        <button onClick={onBack} className="btn-outline">Volver</button>
      </div>
      
      <div className="card card-responsive card-shadow">
        <div className="table-container">
          <table className="data-table">
            <thead>
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
              {logs.length === 0 && (
                <tr>
                  <td colSpan="6" className="muted" style={{ textAlign: 'center', padding: 24 }}>
                    No hay registros de envíos
                  </td>
                </tr>
              )}
              {logs.map((l) => (
                <tr key={l.id}>
                  <td>{l.id}</td>
                  <td>{l.usuario_id}</td>
                  <td>{l.destinatario}</td>
                  <td>{l.asunto}</td>
                  <td>
                    <span className={`badge ${l.status === 'sent' ? 'badge-success' : 'badge-error'}`}>
                      {l.status}
                    </span>
                  </td>
                  <td>{new Date(l.created_at).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
