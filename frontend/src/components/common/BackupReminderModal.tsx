import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useBackupReminder } from '../../hook/useBackupReminder';

export const BackupReminderModal: React.FC = () => {
  const navigate = useNavigate();
  const { mostrar, marcarComoVisto } = useBackupReminder();

  if (!mostrar) return null;

  const handleIrAConfiguracion = () => {
    marcarComoVisto();
    navigate('/configuracion');
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 2100,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(0, 0, 0, 0.6)',
        backdropFilter: 'blur(4px)',
        WebkitBackdropFilter: 'blur(4px)',
      }}
    >
      <div
        className="font-monospace"
        style={{
          backgroundColor: '#18181b',
          border: '1px solid #3f3f46',
          borderRadius: '16px',
          maxWidth: '460px',
          width: '90%',
          padding: '2rem',
          color: '#fff',
          boxShadow: '0 20px 50px rgba(0,0,0,0.5)',
        }}
      >
        <div className="d-flex align-items-center gap-3 mb-3">
          <div
            style={{
              width: '48px',
              height: '48px',
              borderRadius: '12px',
              backgroundColor: 'rgba(142, 69, 224, 0.15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <i className="bi bi-cloud-arrow-up" style={{ fontSize: '1.5rem', color: '#8e45e0' }}></i>
          </div>
          <h5 className="fw-bold m-0">Recordatorio de respaldo</h5>
        </div>

        <p className="text-body-secondary mb-4" style={{ fontSize: '0.9rem', lineHeight: 1.5 }}>
          Es viernes: buen momento para generar un respaldo de la información del sistema
          y evitar la pérdida de datos importantes.
        </p>

        <div className="d-flex justify-content-end gap-2">
          <button
            type="button"
            className="btn btn-sm px-3 py-2 fw-semibold"
            style={{ backgroundColor: '#27272a', color: '#fff', border: '1px solid #3f3f46' }}
            onClick={marcarComoVisto}
          >
            Cancelar
          </button>
          <button
            type="button"
            className="btn btn-sm px-3 py-2 fw-semibold"
            style={{ backgroundColor: '#8e45e0', color: '#fff', border: 'none' }}
            onClick={handleIrAConfiguracion}
          >
            Ir a Configuración
          </button>
        </div>
      </div>
    </div>
  );
};