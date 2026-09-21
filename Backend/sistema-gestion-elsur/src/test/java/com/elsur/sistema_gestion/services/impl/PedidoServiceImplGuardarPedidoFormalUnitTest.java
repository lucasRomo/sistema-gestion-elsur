package com.elsur.sistema_gestion.services.impl;

import com.elsur.sistema_gestion.exceptions.ConflictoDeIntegridadException;
import com.elsur.sistema_gestion.exceptions.SolicitudInvalidaException;
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
class PedidoServiceImplGuardarPedidoFormalUnitTest {

    @Mock private PedidoRepository pedidoRepository;
    @Mock private InsumoRepository insumoRepository;
    @Mock private ProductoInsumoRepository productoInsumoRepository;
    @Mock private DetallePedidoRepository detallePedidoRepository;
    @Mock private ProductoRepository productoRepository;
    @Mock private ClienteRepository clienteRepository;
    @Mock private TurnoRepository TurnoRepository;

    @InjectMocks
    private PedidoServiceImpl pedidoService;

    private Cliente consumidorFinal() {
        Cliente c = new Cliente();
        c.setIdCliente(1);
        c.setRazonSocial("Consumidor Final");
        c.setSaldoDeudor(BigDecimal.ZERO);
        c.setLimiteCredito(BigDecimal.ZERO);
        return c;
    }

    private Producto productoDirecto(int id, String nombre, int stock) {
        Producto p = new Producto();
        p.setIdProducto(id);
        p.setNombreProducto(nombre);
        p.setStockVinculado(false);
        p.setStock(stock);
        return p;
    }

    private Maquina maquina(String nombre, String estado) {
        Maquina m = new Maquina();
        m.setIdMaquina(9);
        m.setNombre(nombre);
        m.setEstado(estado);
        return m;
    }

    private DetallePedido detalle(int idProductoRef, int cantidad) {
        DetallePedido d = new DetallePedido();
        Producto ref = new Producto();
        ref.setIdProducto(idProductoRef); 
        d.setProducto(ref);
        d.setCantidad(cantidad);
        d.setPrecioUnitario(BigDecimal.TEN);
        d.setSubtotal(BigDecimal.TEN.multiply(BigDecimal.valueOf(cantidad)));
        return d;
    }

    private Pedido pedidoFormalBase(int idPedido, String estado, List<DetallePedido> detalles) {
        Pedido pedido = new Pedido();
        pedido.setId_pedido(idPedido);
        pedido.setEstado(estado);
        pedido.setDetalles(detalles);
        pedido.setMonto_total(BigDecimal.valueOf(100));
        pedido.setMonto_pago_adelantado(BigDecimal.ZERO); 
        pedido.setObservaciones("Pedido de mostrador");
        return pedido;
    }


    @Test
    @DisplayName("Crear Pedido con estado PENDIENTE -> se guarda, pero NO descuenta stock todavía")
    void guardar_pedidoFormalEstadoPendiente_noDescuentaStockAlCrearlo() {
        when(TurnoRepository.existsByEstado(EstadoTurno.ABIERTO)).thenReturn(true);
        when(clienteRepository.findById(1)).thenReturn(Optional.of(consumidorFinal()));

        Producto producto = productoDirecto(50, "Tarjetas Personales x100", 20);
        when(productoRepository.findById(50)).thenReturn(Optional.of(producto));

        Pedido pedido = pedidoFormalBase(900, "PENDIENTE", List.of(detalle(50, 5)));
        when(pedidoRepository.save(any(Pedido.class))).thenAnswer(inv -> inv.getArgument(0));

        Pedido guardado = pedidoService.guardar(pedido, null, null, "Efectivo", null, false);

        assertEquals("PENDIENTE", guardado.getEstado());
        assertFalse(guardado.isStockDescontado());
        assertEquals(20, producto.getStock(), "El stock no debe tocarse hasta que el pedido pase a un estado final");
        verify(productoRepository, never()).save(any());
    }


    @Test
    @DisplayName("REGRESIÓN (hallazgo de este trabajo): Crear Pedido con estado ENTREGADO directo " +
                 "-> ahora SÍ descuenta stock al guardar (antes: se guardaba ENTREGADO sin tocar nada)")
    void guardar_pedidoFormalEstadoEntregadoDirecto_descuentaStockAlCrearlo() {
        when(TurnoRepository.existsByEstado(EstadoTurno.ABIERTO)).thenReturn(true);
        when(clienteRepository.findById(1)).thenReturn(Optional.of(consumidorFinal()));

        Producto producto = productoDirecto(51, "Banner 2x1m", 10);
        when(productoRepository.findById(51)).thenReturn(Optional.of(producto));

        Pedido pedido = pedidoFormalBase(901, "ENTREGADO", List.of(detalle(51, 2)));
        when(pedidoRepository.save(any(Pedido.class))).thenAnswer(inv -> inv.getArgument(0));
        when(pedidoRepository.findById(901)).thenReturn(Optional.of(pedido));

        Pedido guardado = pedidoService.guardar(pedido, null, null, "Efectivo", null, false);

        assertTrue(guardado.isStockDescontado(), "Un pedido que nace ENTREGADO debe descontar stock en el mismo alta");
        assertEquals(8, producto.getStock());
        verify(productoRepository).save(producto);
    }

    @Test
    @DisplayName("Crear Pedido con estado ENTREGADO directo y stock insuficiente -> RuntimeException, nada queda a medias")
    void guardar_pedidoFormalEstadoEntregadoConStockInsuficiente_lanzaExcepcion() {
        when(TurnoRepository.existsByEstado(EstadoTurno.ABIERTO)).thenReturn(true);
        when(clienteRepository.findById(1)).thenReturn(Optional.of(consumidorFinal()));

        Producto producto = productoDirecto(52, "Lona Frontlight", 3);
        when(productoRepository.findById(52)).thenReturn(Optional.of(producto));

        Pedido pedido = pedidoFormalBase(902, "ENTREGADO", List.of(detalle(52, 10))); 
        when(pedidoRepository.save(any(Pedido.class))).thenAnswer(inv -> inv.getArgument(0));
        when(pedidoRepository.findById(902)).thenReturn(Optional.of(pedido));

        RuntimeException ex = assertThrows(RuntimeException.class,
                () -> pedidoService.guardar(pedido, null, null, "Efectivo", null, false));

        assertTrue(ex.getMessage().contains("Lona Frontlight"));
        assertFalse(pedido.isStockDescontado());
        assertEquals(3, producto.getStock());
    }

    @Test
    @DisplayName("Crear Pedido con estado ENTREGADO directo y máquina caída, SIN confirmar -> bloquea la venta")
    void guardar_pedidoFormalEstadoEntregadoConMaquinaCaida_sinConfirmar_bloqueaVenta() {
        when(TurnoRepository.existsByEstado(EstadoTurno.ABIERTO)).thenReturn(true);
        when(clienteRepository.findById(1)).thenReturn(Optional.of(consumidorFinal()));

        Producto producto = productoDirecto(53, "Cuadernillo Anillado A4", 50);
        producto.setMaquinaNecesaria(maquina("Anilladora 1", "FUERA_DE_SERVICIO"));
        when(productoRepository.findById(53)).thenReturn(Optional.of(producto));

        Pedido pedido = pedidoFormalBase(903, "ENTREGADO", List.of(detalle(53, 1)));
        when(pedidoRepository.save(any(Pedido.class))).thenAnswer(inv -> inv.getArgument(0));
        when(pedidoRepository.findById(903)).thenReturn(Optional.of(pedido));

        ConflictoDeIntegridadException ex = assertThrows(ConflictoDeIntegridadException.class,
                () -> pedidoService.guardar(pedido, null, null, "Efectivo", null, false));

        assertTrue(ex.getMessage().contains("Anilladora 1"));
        assertFalse(pedido.isStockDescontado());
        verify(productoRepository, never()).save(any());
    }

    @Test
    @DisplayName("Crear Pedido con estado ENTREGADO directo, máquina caída pero confirmarMaquinaNoDisponible=true " +
                 "-> se completa igual (mismo criterio de negocio que Venta Rápida)")
    void guardar_pedidoFormalEstadoEntregadoConMaquinaCaidaYConfirmacion_completaVenta() {
        when(TurnoRepository.existsByEstado(EstadoTurno.ABIERTO)).thenReturn(true);
        when(clienteRepository.findById(1)).thenReturn(Optional.of(consumidorFinal()));

        Producto producto = productoDirecto(54, "Cuadernillo Anillado A4", 50);
        producto.setMaquinaNecesaria(maquina("Anilladora 1", "FUERA_DE_SERVICIO"));
        when(productoRepository.findById(54)).thenReturn(Optional.of(producto));

        Pedido pedido = pedidoFormalBase(904, "ENTREGADO", List.of(detalle(54, 1)));
        when(pedidoRepository.save(any(Pedido.class))).thenAnswer(inv -> inv.getArgument(0));
        when(pedidoRepository.findById(904)).thenReturn(Optional.of(pedido));

        Pedido guardado = pedidoService.guardar(pedido, null, null, "Efectivo", null, true);

        assertTrue(guardado.isStockDescontado());
        assertEquals(49, producto.getStock());
    }

    @Test
    @DisplayName("HALLAZGO: seña/adelanto negativo -> SolicitudInvalidaException (antes se guardaba tal cual)")
    void guardar_montoAdelantadoNegativo_lanzaSolicitudInvalida() {
        when(TurnoRepository.existsByEstado(EstadoTurno.ABIERTO)).thenReturn(true);
        when(clienteRepository.findById(1)).thenReturn(Optional.of(consumidorFinal()));

        Pedido pedido = pedidoFormalBase(905, "PENDIENTE", null);
        pedido.setMonto_pago_adelantado(BigDecimal.valueOf(-500));
        when(pedidoRepository.save(any(Pedido.class))).thenAnswer(inv -> inv.getArgument(0));

        SolicitudInvalidaException ex = assertThrows(SolicitudInvalidaException.class,
                () -> pedidoService.guardar(pedido, null, null, "Efectivo", null, false));

        assertTrue(ex.getMessage().toLowerCase().contains("negativo"));
    }

    @Test
    @DisplayName("Consumidor Final no puede pagar a Cuenta Corriente -- alcanzable de verdad desde Crear Pedido " +
                 "(el modal de pago de Venta Rápida ni ofrece esta opción, ver TC_D24 de la planilla del Dashboard)")
    void guardar_consumidorFinalConCuentaCorriente_lanzaExcepcion() {
        when(TurnoRepository.existsByEstado(EstadoTurno.ABIERTO)).thenReturn(true);
        when(clienteRepository.findById(1)).thenReturn(Optional.of(consumidorFinal()));

        Pedido pedido = pedidoFormalBase(906, "PENDIENTE", null);

        RuntimeException ex = assertThrows(RuntimeException.class,
                () -> pedidoService.guardar(pedido, null, null, "Cuenta Corriente", null, false));

        assertTrue(ex.getMessage().contains("Consumidor Final"));
        verify(pedidoRepository, never()).save(any());
    }
}
