package com.elsur.sistema_gestion.services;

import com.elsur.sistema_gestion.models.Pedido;
import java.util.List;

import org.springframework.web.multipart.MultipartFile;

public interface PedidoService {
    List<Pedido> listarTodos();
    List<Pedido> listarCreadosDesde(java.time.LocalDate desde);
    java.util.Map<String, Long> resumenCola();

    /** Pedidos que siguen en la cola del taller (incluye presupuestos). */
    List<Pedido> listarActivos();

    /** Pedidos cerrados que se muestran en el Historial de Pedidos. */
    List<Pedido> listarCerrados();

    /**
     * Historial paginado (más recientes primero). estado: TODOS, ENTREGADO o CANCELADO.
     * busqueda: cliente, empleado, número de pedido o una fecha dd/mm/aaaa.
     */
    java.util.Map<String, Object> listarHistorialPaginado(String estado, String busqueda, int pagina, int tamano);

    Pedido guardar(Pedido pedido, Integer idEmpleado, Integer idUsuario, String tipoDePago,
                   MultipartFile comprobante, boolean confirmarMaquinaNoDisponible);

    /**
     * Igual que {@link #guardar}, pero recalculando el total en el servidor con los precios
     * actuales y el descuento de la categoría de cliente indicada (null = sin descuento).
     */
    Pedido guardar(Pedido pedido, Integer idEmpleado, Integer idUsuario, String tipoDePago,
                   MultipartFile comprobante, boolean confirmarMaquinaNoDisponible, Integer idCategoriaCliente);
    Pedido buscarPorId(Integer id);

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