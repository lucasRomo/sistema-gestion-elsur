import React from 'react';

interface AccionesRapidasCajaProps {
  cajaAbierta: boolean;
  hayMovimientos: boolean;
  onNuevoMovimiento: () => void;
  onExportarExcel: () => void;
  onExportarPDF: () => void;
}

export const AccionesRapidasCaja: React.FC<AccionesRapidasCajaProps> = ({
  cajaAbierta,
  hayMovimientos,
  onNuevoMovimiento,
  onExportarExcel,
  onExportarPDF
}) => {
  return (
    <div className="col-lg-3 d-flex flex-column justify-content-start align-items-stretch gap-4 pt-0">
      <h5 className="mb-5 fw-semibold align-self-start" style={{ visibility: 'hidden' }}>Acciones</h5>

      <button
        className="btn btn-success py-2 d-flex justify-content-between align-items-center fw-semibold px-3 w-100"
        style={{ fontSize: '0.95rem', borderRadius: '8px' }}
        disabled={!cajaAbierta}
        onClick={onNuevoMovimiento}
      >
        <span>Crear Nuevo Movimiento</span>
        <i className="bi bi-plus-lg fs-5 ms-2"></i>
      </button>

      <button
        className="btn py-2 d-flex justify-content-between align-items-center fw-semibold px-3 w-100"
        style={{ backgroundColor: '#0c500c', color: '#ffffff', fontSize: '0.95rem', border: '#0c500c' }}
        disabled={!cajaAbierta || !hayMovimientos}
        onClick={onExportarExcel}
      >
        <span>Descargar Excel de Caja</span>
        <i className="bi bi-file-earmark-excel-fill fs-5 ms-2"></i>
      </button>

      <button
        className="btn py-2 d-flex justify-content-between align-items-center fw-semibold px-3 w-100"
        style={{ backgroundColor: '#c0392b', color: '#ffffff', fontSize: '0.95rem', border: '#c0392b' }}
        disabled={!cajaAbierta || !hayMovimientos}
        onClick={onExportarPDF}
      >
        <span>Descargar PDF Caja</span>
        <i className="bi bi-file-earmark-pdf-fill fs-5 ms-2"></i>
      </button>
    </div>
  );
};
