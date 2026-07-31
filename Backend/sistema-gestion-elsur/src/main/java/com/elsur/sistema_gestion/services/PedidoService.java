package com.elsur.sistema_gestion.services;

import com.elsur.sistema_gestion.models.Pedido;
import java.util.List;

import org.springframework.web.multipart.MultipartFile;

public interface PedidoService {
    List<Pedido> listarTodos();
    Pedido guardar(Pedido pedido, Integer idEmpleado, Integer idUsuario, String tipoDePago, MultipartFile comprobante);
    Pedido buscarPorId(Integer id);
    void procesarDescuentoStock(Integer idPedido);
    void actualizarEstado(Integer idPedido, String nuevoEstado);
    Pedido cambiarEstadoPedido(Integer idPedido, String nuevoEstado, String observaciones, Integer idUsuario);
    Pedido agregarPago(Integer idPedido, Double monto, String tipoPago, String urlComprobante, Integer idUsuario);
    void asignarEmpleado(Integer idPedido, Integer idEmpleado);
    Pedido agregarPagoConArchivo(Integer idPedido, Double monto, String tipoPago, Integer idUsuario, MultipartFile comprobante);
    Pedido asociarArchivoAComprobanteExistente(Integer idComprobante, MultipartFile comprobante);
    Pedido eliminarArchivoDeComprobante(Integer idComprobante);
    void actualizarUbicacion(Integer idPedido, String nuevaUbicacion);
}