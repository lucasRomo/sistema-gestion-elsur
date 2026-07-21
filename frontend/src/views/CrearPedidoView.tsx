import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { SidebarLayout } from '../components/layouts/SidebarLayout';
import { SelectorProductosForm } from '../features/pedidos/SelectorProductosForm';
import { DetallesPedidoForm } from '../features/pedidos/DetallesPedidoForm';
import { useRegistrarPedido } from '../hooks/useRegistrarPedido';
import type { CartItem } from '../types/Pedido';

export const CrearPedidoView: React.FC = () => {
  const navigate = useNavigate();
  
  const { productos, clientes, empleados, enviarPedido } = useRegistrarPedido();
  
  const [paso, setPaso] = useState<number>(1);
  const [carrito, setCarrito] = useState<CartItem[]>([]);

  const totalCarrito = carrito.reduce((sum, item) => sum + item.subtotal, 0);

  // Recibe la estructura combinada { pedido, idEmpleado } y la despacha al Hook
  const handleGuardarFinal = async (payloadEstructurado: { pedido: any; idEmpleado: number }) => {
    try {
      const exito = await enviarPedido(payloadEstructurado);
      if (exito) {
        alert("¡Pedido guardado con éxito!");
        navigate('/dashboard'); 
      }
    } catch (err) {
      alert("Hubo un error al procesar el guardado del pedido.");
    }
  };

  return (
    <>
      <div className="container-fluid min-vh-100 d-flex flex-column py-2">
        {paso === 1 ? (
          <SelectorProductosForm 
            productos={productos}
            carrito={carrito}
            setCarrito={setCarrito}
            onSiguiente={() => setPaso(2)}
            onCancelar={() => navigate('/dashboard')}
          />
        ) : (
          <DetallesPedidoForm 
            clientes={clientes}
            empleados={empleados}
            total={totalCarrito}
            carrito={carrito}
            onVolver={() => setPaso(1)}
            onGuardar={handleGuardarFinal}
          />
        )}
      </div>
    </>
  );
};