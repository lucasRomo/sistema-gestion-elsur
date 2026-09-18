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
 * Tests UNITARIOS (caja blanca, Mockito) de PedidoServiceImpl.guardar() para las
 * validaciones de REFERENCIA que faltaban cubrir: ¿qué pasa si el pedido llega
 * apuntando a un Cliente, un Empleado o un Producto cuyo id ya no existe en la
 * base (por ejemplo, alguien lo borró entre que el frontend cargó el formulario
 * y que el operario confirmó "Guardar")?
 *
 * GAP DE COBERTURA detectado al armar la planilla CrearPedido_TestCase.xlsx
 * (ver TC_CP35/36/37): las tres suites existentes de PedidoServiceImpl
 * (PedidoServiceImplGuardarPedidoFormalUnitTest, PedidoServiceImplGuardarVentaRapidaUnitTest,
 * PedidoServiceImplStockYMaquinaUnitTest) siempre mockean clienteRepository con éxito
 * usando el Consumidor Final (id=1), y ninguna cubre un Empleado o un Producto con
 * un id que directamente no existe -- distinto del caso ya cubierto en
 * PedidoServiceImplStockYMaquinaUnitTest.detalleSinProducto_lanzaSolicitudInvalida,
 * que es un producto NULO/sin id (SolicitudInvalidaException), no un id inexistente
 * (acá el código tira un RuntimeException distinto, "Producto no encontrado").
 */
@ExtendWith(MockitoExtension.class)
class PedidoServiceImplGuardarValidacionesReferenciaUnitTest {

    @Mock private PedidoRepository pedidoRepository;
    @Mock private ProductoRepository productoRepository;
    @Mock private ClienteRepository clienteRepository;
    @Mock private EmpleadoRepository empleadoRepository;
    @Mock private TurnoRepository TurnoRepository; // mismo nombre de campo que en PedidoServiceImpl

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

    private Cliente clienteConId(int id) {
        Cliente c = new Cliente();
        c.setIdCliente(id);
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

    private DetallePedido detalle(int idProductoRef, int cantidad) {
        DetallePedido d = new DetallePedido();
        Producto ref = new Producto();
        ref.setIdProducto(idProductoRef); // solo el id, como llega armado desde el frontend
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

    // ==================== TC_CP35: Cliente inexistente ====================

    @Test
    @DisplayName("TC_CP35 - Cliente indicado con id que no existe en la base -> RuntimeException('Cliente no encontrado')")
    void guardar_clienteInexistente_lanzaExcepcion() {
        when(TurnoRepository.existsByEstado(EstadoTurno.ABIERTO)).thenReturn(true);
        when(clienteRepository.findById(999)).thenReturn(Optional.empty());

        Pedido pedido = pedidoFormalBase(910, "PENDIENTE", null);
        pedido.setCliente(clienteConId(999));

        RuntimeException ex = assertThrows(RuntimeException.class,
                () -> pedidoService.guardar(pedido, null, null, "Efectivo", null, false));

        assertTrue(ex.getMessage().contains("Cliente no encontrado"));
        verify(pedidoRepository, never()).save(any());
    }

    // ==================== TC_CP37: Producto de un detalle inexistente ====================

    @Test
    @DisplayName("TC_CP37 - Detalle con un idProducto que no existe en la base -> RuntimeException('Producto no encontrado') " +
                 "(distinto de detalleSinProducto_lanzaSolicitudInvalida, que es producto NULO)")
    void guardar_detalleConProductoIdInexistente_lanzaExcepcion() {
        when(TurnoRepository.existsByEstado(EstadoTurno.ABIERTO)).thenReturn(true);
        when(clienteRepository.findById(1)).thenReturn(Optional.of(consumidorFinal()));
        when(productoRepository.findById(777)).thenReturn(Optional.empty());

        Pedido pedido = pedidoFormalBase(911, "PENDIENTE", List.of(detalle(777, 2)));

        RuntimeException ex = assertThrows(RuntimeException.class,
                () -> pedidoService.guardar(pedido, null, null, "Efectivo", null, false));

        assertTrue(ex.getMessage().contains("Producto no encontrado"));
        verify(pedidoRepository, never()).save(any());
    }

    // ==================== TC_CP36: Empleado inexistente ====================

    @Test
    @DisplayName("TC_CP36 - idEmpleado indicado que no existe en la base -> RuntimeException('Empleado no encontrado'), " +
                 "el pedido ya se había guardado (flush) antes de este chequeo")
    void guardar_empleadoInexistente_lanzaExcepcion() {
        when(TurnoRepository.existsByEstado(EstadoTurno.ABIERTO)).thenReturn(true);
        when(clienteRepository.findById(1)).thenReturn(Optional.of(consumidorFinal()));
        when(pedidoRepository.save(any(Pedido.class))).thenAnswer(inv -> inv.getArgument(0));
        when(empleadoRepository.findById(888)).thenReturn(Optional.empty());

        Pedido pedido = pedidoFormalBase(912, "PENDIENTE", null);

        RuntimeException ex = assertThrows(RuntimeException.class,
                () -> pedidoService.guardar(pedido, 888, null, "Efectivo", null, false));

        assertTrue(ex.getMessage().contains("Empleado no encontrado"));
    }
}
