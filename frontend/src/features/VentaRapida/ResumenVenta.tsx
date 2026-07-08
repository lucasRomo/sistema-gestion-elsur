import React, { useState } from 'react';
interface Props {
  total: number;
  onCancelar: () => void;
  onCompletar: () => void;
}

export const ResumenVenta: React.FC<Props> = ({ total, onCancelar, onCompletar }) => {

  const handleCompletar = () => {
    onCompletar();  
  };

  return (
    <>
      <div className="mb-4">
        <label className="form-label small mb-1 text-light">Precio Total:</label> {/* Añadido text-light */}
        <div className="bg-white text-dark rounded px-3 py-2 fw-bold d-flex align-items-center" style={{ fontSize: '1.2rem', minHeight: '45px' }}>
          ${total}
        </div>
      </div>

      <div className="d-flex justify-content-between mt-3">
        <button 
          className="btn btn-danger px-4" 
          style={{ backgroundColor: '#a63333', border: 'none' }}
          onClick={onCancelar}
        >
          Cancelar
        </button>
        <button 
          className="btn btn-success px-4" 
          style={{ backgroundColor: '#3d824b', border: 'none' }}
          onClick={handleCompletar}
        >
          Completar Venta Rápida
        </button>
      </div>
    </>
  );
};