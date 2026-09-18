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

/**
 * Tests UNITARIOS (caja blanca, Mockito) de PedidoServiceImpl.cambiarEstadoPedido() --
 * el método que usa el módulo "Historial de Pedidos" del sidebar cuando se
 * procesa una devolución desde ModalDevolucionPedido.tsx ("Volver a Hacer" ->
 * nuevoEstado=PENDIENTE, "Marcar como Devuelto" -> nuevoEstado=DEVUELTO).
 *
 * GAP DE COBERTURA detectado al armar la planilla HistorialPedidos_TestCase.xlsx:
 * ninguna suite existente probaba este método -- toda la cobertura previa de
 * cambios de estado pasaba indirectamente por guardar()/procesarDescuentoStock()
 * (alta de pedidos), nunca por el camino real de "Historial > Devolución".
 *
 * COMPORTAMIENTO VERIFICADO de este trabajo (correcto, por diseño -- NO es un bug):
 * devolver un pedido que ya estaba ENTREGADO (con su stock ya descontado) a
 * PENDIENTE o a DEVUELTO NO restaura ni el stock de insumos ni el de productos
 * directos -- cambiarEstadoPedido() solo dispara procesarDescuentoStock() cuando
 * el NUEVO estado es FINALIZADO/ENTREGADO y el pedido no estaba ya finalizado;
 * no existe ningún camino simétrico que reintegre stock cuando el pedido sale
 * de un estado final. Esto es intencional: el material ya consumido/entregado
 * se considera pérdida (error de fabricación, producto dañado, etc.) y no es
 * reutilizable, por lo que NO debe reingresar al inventario. Estos tests
 * verifican y fijan (pinning) ese comportamiento esperado.
 */
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

    // ==================== Comportamiento correcto: "Volver a Hacer" NO restaura stock (material perdido) ====================

    @Test
    @DisplayName("TC_HP - Comportamiento correcto: devolver un pedido ENTREGADO a PENDIENTE ('Volver a Hacer') " +
                 "NO restaura el stock ya descontado, porque el material se considera perdido (no reutilizable)")
    void cambiarEstadoPedido_reiniciarAPendiente_noRestauraStock() {
        Pedido pedido = pedidoEntregadoConStockDescontado(700);
        when(pedidoRepository.findById(700)).thenReturn(Optional.of(pedido));
        when(usuarioRepository.findById(1)).thenReturn(Optional.of(usuario(1)));

        Pedido resultado = pedidoService.cambiarEstadoPedido(700, "PENDIENTE", "Reclamo del cliente", 1, false);

        assertEquals("PENDIENTE", resultado.getEstado());
        // Comportamiento esperado (no es un gap): sigue marcado como ya descontado,
        // y ningún repositorio de stock fue tocado, porque el material consumido en la
        // fabricación original se perdió (error/falla) y no puede reingresar al inventario.
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
        // El material ya se dio de baja al entregar el pedido original; al ser pérdida
        // por error y no reutilizable, es correcto que no se reintegre al reingresar
        // el pedido como DEVUELTO.
        assertTrue(resultado.isStockDescontado());
        verifyNoInteractions(insumoRepository, productoRepository, productoInsumoRepository);
    }

    // ==================== Camino ya cubierto indirectamente, ahora testeado directo ====================

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
        Pedido pedido = pedidoEntregadoConStockDescontado(703); // ya ENTREGADO, stockDescontado=true

        when(pedidoRepository.findById(703)).thenReturn(Optional.of(pedido));
        when(usuarioRepository.findById(1)).thenReturn(Optional.of(usuario(1)));

        Pedido resultado = pedidoService.cambiarEstadoPedido(703, "FINALIZADO", "Cierre administrativo", 1, false);

        assertEquals("FINALIZADO", resultado.getEstado());
        verifyNoInteractions(insumoRepository, productoRepository, productoInsumoRepository);
    }

    // ==================== Inconsistencia con agregarPago(): usuario inexistente NO tira excepción ====================

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
        // A diferencia de PedidoServiceImplAgregarPagoUnitTest.agregarPago_usuarioInexistente_lanzaExcepcion,
        // acá NO se rechaza: el historial queda atribuido a un usuario distinto del que efectivamente
        // hizo la devolución, sin ningún aviso.
    }
}
