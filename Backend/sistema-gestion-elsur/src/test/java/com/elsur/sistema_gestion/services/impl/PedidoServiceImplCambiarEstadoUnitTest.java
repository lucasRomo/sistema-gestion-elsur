package com.elsur.sistema_gestion.services.impl;

import com.elsur.sistema_gestion.models.*;
import com.elsur.sistema_gestion.repositories.*;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;


@ExtendWith(MockitoExtension.class)
class PedidoServiceImplCambiarEstadoUnitTest {

    @Mock private PedidoRepository pedidoRepository;
    @Mock private HistorialEstadoPedidoRepository historialRepository;
    @Mock private UsuarioRepository usuarioRepository;
    @Mock private InsumoRepository insumoRepository;
    @Mock private ProductoInsumoRepository productoInsumoRepository;
    @Mock private DetallePedidoRepository detallePedidoRepository;
    @Mock private ProductoRepository productoRepository;

    @InjectMocks
    private PedidoServiceImpl pedidoService;

    private Usuario usuario(int id) {
        Usuario u = new Usuario();
        u.setIdUsuario(id);
        return u;
    }

    private Producto productoDirecto(int id, String nombre, int stock) {
        Producto p = new Producto();
        p.setIdProducto(id);
        p.setNombreProducto(nombre);
        p.setStockVinculado(false);
        p.setStock(stock);
        return p;
    }

    private DetallePedido detalle(Producto producto, int cantidad) {
        DetallePedido d = new DetallePedido();
        d.setProducto(producto);
        d.setCantidad(cantidad);
        d.setPrecioUnitario(BigDecimal.TEN);
        d.setSubtotal(BigDecimal.TEN.multiply(BigDecimal.valueOf(cantidad)));
        return d;
    }

    private Pedido pedidoEntregadoConStockDescontado(int idPedido) {
        Pedido p = new Pedido();
        p.setId_pedido(idPedido);
        p.setEstado("ENTREGADO");
        p.setStockDescontado(true); // ya se descontó al entregarse
        p.setMonto_total(BigDecimal.valueOf(100));
        return p;
    }


    @Test
    @DisplayName("TC_HP - Comportamiento correcto: devolver un pedido ENTREGADO a PENDIENTE ('Volver a Hacer') " +
                 "NO restaura el stock ya descontado, porque el material se considera perdido (no reutilizable)")
    void cambiarEstadoPedido_reiniciarAPendiente_noRestauraStock() {
        Pedido pedido = pedidoEntregadoConStockDescontado(700);
        when(pedidoRepository.findById(700)).thenReturn(Optional.of(pedido));
        when(usuarioRepository.findById(1)).thenReturn(Optional.of(usuario(1)));

        Pedido resultado = pedidoService.cambiarEstadoPedido(700, "PENDIENTE", "Reclamo del cliente", 1, false);

        assertEquals("PENDIENTE", resultado.getEstado());

        assertTrue(resultado.isStockDescontado(), "stockDescontado se mantiene en true: no corresponde reversión");
        verifyNoInteractions(insumoRepository, productoRepository, productoInsumoRepository);
        verify(historialRepository).save(any(HistorialEstadoPedido.class));
    }

    @Test
    @DisplayName("TC_HP - Comportamiento correcto: marcar un pedido ENTREGADO como DEVUELTO tampoco restaura stock (material perdido)")
    void cambiarEstadoPedido_marcarDevuelto_noRestauraStock() {
        Pedido pedido = pedidoEntregadoConStockDescontado(701);
        when(pedidoRepository.findById(701)).thenReturn(Optional.of(pedido));
        when(usuarioRepository.findById(1)).thenReturn(Optional.of(usuario(1)));

        Pedido resultado = pedidoService.cambiarEstadoPedido(701, "DEVUELTO", "Producto con fallas", 1, false);

        assertEquals("DEVUELTO", resultado.getEstado());

        assertTrue(resultado.isStockDescontado());
        verifyNoInteractions(insumoRepository, productoRepository, productoInsumoRepository);
    }


    @Test
    @DisplayName("TC_HP - Cambiar a ENTREGADO desde un estado no final SÍ descuenta stock (camino normal)")
    void cambiarEstadoPedido_aEntregadoDesdeNoFinal_descuentaStock() {
        Producto producto = productoDirecto(60, "Volantes A5 x500", 20);
        Pedido pedido = new Pedido();
        pedido.setId_pedido(702);
        pedido.setEstado("EN PROCESO");
        pedido.setDetalles(List.of(detalle(producto, 5)));

        when(pedidoRepository.findById(702)).thenReturn(Optional.of(pedido));
        when(usuarioRepository.findById(1)).thenReturn(Optional.of(usuario(1)));
        when(pedidoRepository.save(any(Pedido.class))).thenAnswer(inv -> inv.getArgument(0));

        Pedido resultado = pedidoService.cambiarEstadoPedido(702, "ENTREGADO", "Listo, entregado en mostrador", 1, false);

        assertTrue(resultado.isStockDescontado());
        assertEquals(15, producto.getStock());
    }

    @Test
    @DisplayName("TC_HP - Cambiar a FINALIZADO cuando el pedido YA estaba en un estado final no vuelve a descontar stock")
    void cambiarEstadoPedido_yaFinalizado_noVuelveADescontar() {
        Pedido pedido = pedidoEntregadoConStockDescontado(703); 

        when(pedidoRepository.findById(703)).thenReturn(Optional.of(pedido));
        when(usuarioRepository.findById(1)).thenReturn(Optional.of(usuario(1)));

        Pedido resultado = pedidoService.cambiarEstadoPedido(703, "FINALIZADO", "Cierre administrativo", 1, false);

        assertEquals("FINALIZADO", resultado.getEstado());
        verifyNoInteractions(insumoRepository, productoRepository, productoInsumoRepository);
    }


    @Test
    @DisplayName("TC_HP - GAP/inconsistencia: idUsuario inexistente NO lanza excepción acá (a diferencia de agregarPago) " +
                 "-- cae de vuelta al primer usuario que encuentre en la base")
    void cambiarEstadoPedido_usuarioInexistente_caeAlPrimerUsuarioDisponible_inconsistenciaConAgregarPago() {
        Pedido pedido = pedidoEntregadoConStockDescontado(704);
        when(pedidoRepository.findById(704)).thenReturn(Optional.of(pedido));
        when(usuarioRepository.findById(999)).thenReturn(Optional.empty());
        Usuario cualquieraDeLaBase = usuario(5);
        when(usuarioRepository.findAll()).thenReturn(List.of(cualquieraDeLaBase));

        Pedido resultado = assertDoesNotThrow(() ->
                pedidoService.cambiarEstadoPedido(704, "DEVUELTO", "obs", 999, false));

        assertEquals("DEVUELTO", resultado.getEstado());
    }
}
