package com.elsur.sistema_gestion.services.impl;

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
class PedidoServiceImplRecalculoTotalUnitTest {

    @Mock private PedidoRepository pedidoRepository;
    @Mock private ProductoRepository productoRepository;
    @Mock private ClienteRepository clienteRepository;
    @Mock private TurnoRepository TurnoRepository;
    @Mock private categoriaClienteRepository categoriaClienteRepository;

    @InjectMocks
    private PedidoServiceImpl pedidoService;

    private Cliente consumidorFinal() {
        Cliente c = new Cliente();
        c.setIdCliente(1);
        c.setRazonSocial("Consumidor Final");
        c.setSaldoDeudor(BigDecimal.ZERO);
        return c;
    }

    private Producto producto(int id, String precio) {
        Producto p = new Producto();
        p.setIdProducto(id);
        p.setNombreProducto("Producto " + id);
        p.setPrecioBase(new BigDecimal(precio));
        p.setStockVinculado(false);
        p.setStock(100);
        return p;
    }

    private DetallePedido detalle(int idProducto, int cantidad, String precioQueMandaElNavegador) {
        DetallePedido d = new DetallePedido();
        Producto ref = new Producto();
        ref.setIdProducto(idProducto);
        d.setProducto(ref);
        d.setCantidad(cantidad);
        d.setPrecioUnitario(new BigDecimal(precioQueMandaElNavegador));
        d.setSubtotal(new BigDecimal(precioQueMandaElNavegador).multiply(BigDecimal.valueOf(cantidad)));
        return d;
    }

    private Pedido pedido(String total, String adelanto, DetallePedido... detalles) {
        Pedido p = new Pedido();
        p.setEstado("PENDIENTE");
        p.setDetalles(new java.util.ArrayList<>(List.of(detalles)));
        p.setMonto_total(new BigDecimal(total));
        p.setMonto_pago_adelantado(new BigDecimal(adelanto));
        return p;
    }

    private void prepararBase() {
        when(TurnoRepository.existsByEstado(EstadoTurno.ABIERTO)).thenReturn(true);
        when(clienteRepository.findById(1)).thenReturn(Optional.of(consumidorFinal()));
        when(productoRepository.findById(10)).thenReturn(Optional.of(producto(10, "100.00")));
    }

    @Test
    @DisplayName("Total correcto con descuento de categoría (10%): se acepta y se guarda el total del servidor")
    void totalCorrectoConDescuento_seAcepta() {
        prepararBase();
        categoriaCliente categoria = new categoriaCliente();
        categoria.setIdCategoria(3);
        categoria.setDescuentoAutomatico(BigDecimal.TEN);
        when(categoriaClienteRepository.findById(3)).thenReturn(Optional.of(categoria));
        when(pedidoRepository.save(any(Pedido.class))).thenAnswer(inv -> inv.getArgument(0));

        Pedido guardado = pedidoService.guardar(pedido("180", "0", detalle(10, 2, "100.00")),
                null, null, "Efectivo", null, false, 3);

        assertEquals(0, new BigDecimal("180.00").compareTo(guardado.getMonto_total()));
    }

    @Test
    @DisplayName("Total alterado en la petición (precio unitario y total manipulados) -> se rechaza")
    void totalManipulado_seRechaza() {
        prepararBase();

        SolicitudInvalidaException ex = assertThrows(SolicitudInvalidaException.class,
                () -> pedidoService.guardar(pedido("1", "0", detalle(10, 2, "0.50")),
                        null, null, "Efectivo", null, false, null));

        assertTrue(ex.getMessage().contains("no coincide"));
        verify(pedidoRepository, never()).save(any());
    }

    @Test
    @DisplayName("La seña no puede superar el total del pedido")
    void senaMayorAlTotal_seRechaza() {
        prepararBase();

        assertThrows(SolicitudInvalidaException.class,
                () -> pedidoService.guardar(pedido("200", "500", detalle(10, 2, "100.00")),
                        null, null, "Efectivo", null, false, null));
        verify(pedidoRepository, never()).save(any());
    }

    @Test
    @DisplayName("Diferencia de redondeo en la seña (333.333 vs 333.33) se ajusta al total en vez de rechazarse")
    void senaConDiferenciaDeRedondeo_seAjusta() {
        when(TurnoRepository.existsByEstado(EstadoTurno.ABIERTO)).thenReturn(true);
        when(clienteRepository.findById(1)).thenReturn(Optional.of(consumidorFinal()));
        when(productoRepository.findById(10)).thenReturn(Optional.of(producto(10, "333.33")));
        when(pedidoRepository.save(any(Pedido.class))).thenAnswer(inv -> inv.getArgument(0));

        Pedido guardado = pedidoService.guardar(pedido("333.333", "333.333", detalle(10, 1, "333.33")),
                null, null, "Efectivo", null, false, null);

        assertEquals(0, new BigDecimal("333.33").compareTo(guardado.getMonto_pago_adelantado()));
    }
}
