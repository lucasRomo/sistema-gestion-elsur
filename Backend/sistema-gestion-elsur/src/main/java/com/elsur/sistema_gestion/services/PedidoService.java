package com.elsur.sistema_gestion.services;

import com.elsur.sistema_gestion.models.Pedido;
import java.util.List;

import org.springframework.web.multipart.MultipartFile;

public interface PedidoService {
    List<Pedido> listarTodos();

    // confirmarMaquinaNoDisponible: true cuando el operario ya vio el aviso de
    // "máquina fuera de servicio/falla/mantenimiento" en el frontend y eligió
    // "Continuar de todos modos" -- las máquinas son una decisión de negocio
    // de baja prioridad, así que esto es un aviso rechazable, no un bloqueo
    // duro. Sin esta confirmación explícita, procesarDescuentoStock rechaza
    // la venta si el producto necesita una máquina caída.
    Pedido guardar(Pedido pedido, Integer idEmpleado, Integer idUsuario, String tipoDePago,
                   MultipartFile comprobante, boolean confirmarMaquinaNoDisponible);
    Pedido buscarPorId(Integer id);

    // Variante estricta (equivale a confirmarMaquinaNoDisponible=false): la usa
    // PATCH /{id}/finalizar, que hoy no tiene ningún flujo de aviso/confirmación
    // del lado del frontend.
    void procesarDescuentoStock(Integer idPedido);
    void procesarDescuentoStock(Integer idPedido, boolean confirmarMaquinaNoDisponible);
    void actualizarEstado(Integer idPedido, String nuevoEstado);
    Pedido cambiarEstadoPedido(Integer idPedido, String nuevoEstado, String observaciones, Integer idUsuario,
                              boolean confirmarMaquinaNoDisponible);
    Pedido agregarPago(Integer idPedido, Double monto, String tipoPago, String urlComprobante, Integer idUsuario);
    void asignarEmpleado(Integer idPedido, Integer idEmpleado);
    Pedido agregarPagoConArchivo(Integer idPedido, Double monto, String tipoPago, Integer idUsuario, MultipartFile comprobante);
    Pedido asociarArchivoAComprobanteExistente(Integer idComprobante, MultipartFile comprobante);
    Pedido eliminarArchivoDeComprobante(Integer idComprobante);
    void actualizarUbicacion(Integer idPedido, String nuevaUbicacion);
}