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
    @Mock private ClienteRepository clienteRepository;
    @Mock private MovimientoCuentaCorrienteRepository movimientoCCRepository;

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
    @DisplayName("TC_HP - Entregar un pedido cuya máquina quedó FUERA DE SERVICIO no se bloquea: el trabajo ya está hecho")
    void cambiarEstadoPedido_aEntregadoConMaquinaFueraDeServicio_noBloquea() {
        Producto producto = productoDirecto(61, "Ploteo A1 color", 20);
        Maquina plotter = new Maquina();
        plotter.setNombre("Plotter HP T830");
        plotter.setEstado("FUERA DE SERVICIO");
        producto.setMaquinaNecesaria(plotter);
        Pedido pedido = new Pedido();
        pedido.setId_pedido(707);
        pedido.setEstado("EN PROCESO");
        pedido.setDetalles(List.of(detalle(producto, 3)));

        when(pedidoRepository.findById(707)).thenReturn(Optional.of(pedido));
        when(usuarioRepository.findById(1)).thenReturn(Optional.of(usuario(1)));
        when(pedidoRepository.save(any(Pedido.class))).thenAnswer(inv -> inv.getArgument(0));

        Pedido resultado = pedidoService.cambiarEstadoPedido(707, "ENTREGADO", "Retira el cliente", 1, false);

        assertEquals("ENTREGADO", resultado.getEstado());
        assertEquals(17, producto.getStock());
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

    @Test
    @DisplayName("TC_HP - Un pedido CANCELADO no puede devolverse ni volver a la cola: hay que crear uno nuevo")
    void cambiarEstadoPedido_pedidoCancelado_seRechaza() {
        Pedido pedido = new Pedido();
        pedido.setId_pedido(705);
        pedido.setEstado("CANCELADO");
        when(pedidoRepository.findById(705)).thenReturn(Optional.of(pedido));

        for (String destino : List.of("DEVUELTO", "PENDIENTE")) {
            com.elsur.sistema_gestion.exceptions.SolicitudInvalidaException ex = assertThrows(
                    com.elsur.sistema_gestion.exceptions.SolicitudInvalidaException.class,
                    () -> pedidoService.cambiarEstadoPedido(705, destino, "obs", 1, false));
            assertTrue(ex.getMessage().contains("Crear Pedido"));
        }
        assertEquals("CANCELADO", pedido.getEstado());
        verifyNoInteractions(historialRepository);
    }

    @Test
    @DisplayName("TC_HP - Un pedido ya DEVUELTO no puede volver a procesarse")
    void cambiarEstadoPedido_pedidoYaDevuelto_seRechaza() {
        Pedido pedido = new Pedido();
        pedido.setId_pedido(706);
        pedido.setEstado("DEVUELTO");
        when(pedidoRepository.findById(706)).thenReturn(Optional.of(pedido));

        assertThrows(com.elsur.sistema_gestion.exceptions.SolicitudInvalidaException.class,
                () -> pedidoService.cambiarEstadoPedido(706, "PENDIENTE", "obs", 1, false));
        verifyNoInteractions(historialRepository);
    }

    private Cliente cliente(int id, String saldoDeudor) {
        Cliente c = new Cliente();
        c.setIdCliente(id);
        c.setSaldoDeudor(new BigDecimal(saldoDeudor));
        return c;
    }

    /** Pedido de 2 unidades a $10 (total $20) sin nada pagado. */
    private Pedido pedidoConSaldo(int idPedido, String estado, Cliente cliente) {
        Pedido p = new Pedido();
        p.setId_pedido(idPedido);
        p.setEstado(estado);
        p.setCliente(cliente);
        p.setMonto_total(BigDecimal.valueOf(20));
        p.setMonto_pago_adelantado(BigDecimal.ZERO);
        p.setDetalles(List.of(detalle(productoDirecto(80 + idPedido % 10, "Anillado", 50), 2)));
        return p;
    }

    private void mockearGuardadoYUsuario(int idPedido, Pedido pedido) {
        when(pedidoRepository.findById(idPedido)).thenReturn(Optional.of(pedido));
        when(usuarioRepository.findById(1)).thenReturn(Optional.of(usuario(1)));
        when(pedidoRepository.save(any(Pedido.class))).thenAnswer(inv -> inv.getArgument(0));
    }

    @Test
    @DisplayName("TC_HP - FINALIZAR un pedido del Consumidor Final con saldo pendiente se permite: se cobra al entregar")
    void cambiarEstadoPedido_finalizarConsumidorFinalConSaldo_sePermite() {
        Pedido pedido = pedidoConSaldo(710, "EN PROCESO", cliente(1, "0"));
        mockearGuardadoYUsuario(710, pedido);

        Pedido resultado = pedidoService.cambiarEstadoPedido(710, "FINALIZADO", "Terminado en el taller", 1, false);

        assertEquals("FINALIZADO", resultado.getEstado());
        assertTrue(resultado.isStockDescontado());
    }

    @Test
    @DisplayName("TC_HP - ENTREGAR un pedido del Consumidor Final con saldo pendiente se rechaza, aunque ya esté FINALIZADO")
    void cambiarEstadoPedido_entregarConsumidorFinalConSaldo_seRechaza() {
        Pedido pedido = pedidoConSaldo(711, "FINALIZADO", cliente(1, "0"));
        when(pedidoRepository.findById(711)).thenReturn(Optional.of(pedido));

        assertThrows(com.elsur.sistema_gestion.exceptions.SolicitudInvalidaException.class,
                () -> pedidoService.cambiarEstadoPedido(711, "ENTREGADO", "obs", 1, false));
        verifyNoInteractions(historialRepository);
    }

    @Test
    @DisplayName("TC_HP - FINALIZAR con saldo pendiente no carga deuda en la cuenta corriente: eso pasa al entregar")
    void cambiarEstadoPedido_finalizarConSaldo_noCargaDeuda() {
        Cliente martina = cliente(2, "2520");
        Pedido pedido = pedidoConSaldo(712, "EN PROCESO", martina);
        mockearGuardadoYUsuario(712, pedido);

        pedidoService.cambiarEstadoPedido(712, "FINALIZADO", "Terminado", 1, false);

        assertEquals(new BigDecimal("2520"), martina.getSaldoDeudor());
        verifyNoInteractions(clienteRepository, movimientoCCRepository);
    }

    @Test
    @DisplayName("TC_HP - ENTREGAR un pedido FINALIZADO con saldo pendiente carga la deuda en la cuenta corriente")
    void cambiarEstadoPedido_entregarDesdeFinalizado_cargaDeuda() {
        Cliente martina = cliente(2, "2520");
        Pedido pedido = pedidoConSaldo(713, "FINALIZADO", martina);
        mockearGuardadoYUsuario(713, pedido);
        when(movimientoCCRepository.existsByCliente_IdClienteAndTipoAndDescripcionEndingWith(2, "COMPRA", "Pedido #713"))
                .thenReturn(false);

        Pedido resultado = pedidoService.cambiarEstadoPedido(713, "ENTREGADO", "Retira el cliente", 1, false);

        assertEquals("ENTREGADO", resultado.getEstado());
        assertEquals(new BigDecimal("2540"), martina.getSaldoDeudor());
        assertTrue(resultado.isEs_cuenta_corriente());
        verify(movimientoCCRepository).save(any(MovimientoCuentaCorriente.class));
    }

    @Test
    @DisplayName("TC_HP - Si la compra del pedido ya está en la cuenta corriente (tomado a Cuenta Corriente), " +
                 "ENTREGAR no vuelve a sumar la deuda")
    void cambiarEstadoPedido_entregarConDeudaYaRegistrada_noDuplica() {
        Cliente martina = cliente(2, "2540");
        Pedido pedido = pedidoConSaldo(714, "EN PROCESO", martina);
        pedido.setEs_cuenta_corriente(true);
        mockearGuardadoYUsuario(714, pedido);
        when(movimientoCCRepository.existsByCliente_IdClienteAndTipoAndDescripcionEndingWith(2, "COMPRA", "Pedido #714"))
                .thenReturn(true);

        pedidoService.cambiarEstadoPedido(714, "ENTREGADO", "Retira el cliente", 1, false);

        assertEquals(new BigDecimal("2540"), martina.getSaldoDeudor());
        verify(clienteRepository, never()).save(any());
        verify(movimientoCCRepository, never()).save(any());
    }
}
