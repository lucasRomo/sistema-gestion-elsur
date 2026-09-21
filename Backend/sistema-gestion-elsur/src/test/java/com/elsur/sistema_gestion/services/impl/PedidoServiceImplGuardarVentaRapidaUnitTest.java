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
class PedidoServiceImplGuardarVentaRapidaUnitTest {

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

    @Test
    @DisplayName("Caja cerrada -> no llega ni a mirar el pedido")
    void guardar_cajaNoAbierta_lanzaExcepcion() {
        when(TurnoRepository.existsByEstado(EstadoTurno.ABIERTO)).thenReturn(false);

        Pedido pedido = new Pedido();
        RuntimeException ex = assertThrows(RuntimeException.class,
                () -> pedidoService.guardar(pedido, null, null, "EFECTIVO", null, false));

        assertTrue(ex.getMessage().contains("Caja No está Abierta"));
        verifyNoInteractions(clienteRepository, pedidoRepository);
    }

    @Test
    @DisplayName("Detalle con producto sin idProducto -> SolicitudInvalidaException, nada se guarda")
    void guardar_detalleSinProductoValido_lanzaSolicitudInvalida() {
        when(TurnoRepository.existsByEstado(EstadoTurno.ABIERTO)).thenReturn(true);
        when(clienteRepository.findById(1)).thenReturn(Optional.of(consumidorFinal()));

        DetallePedido detalleConProductoVacio = new DetallePedido();
        detalleConProductoVacio.setProducto(new Producto()); // sin idProducto
        detalleConProductoVacio.setCantidad(2);
        detalleConProductoVacio.setPrecioUnitario(BigDecimal.TEN);
        detalleConProductoVacio.setSubtotal(BigDecimal.valueOf(20));

        Pedido pedido = new Pedido();
        pedido.setDetalles(List.of(detalleConProductoVacio));
        pedido.setMonto_total(BigDecimal.valueOf(20));

        assertThrows(SolicitudInvalidaException.class,
                () -> pedidoService.guardar(pedido, null, null, "EFECTIVO", null, false));

        verify(pedidoRepository, never()).save(any());
    }

    @Test
    @DisplayName("REGRESIÓN CLAVE: Venta Rápida con stock insuficiente ya NO devuelve 200 en silencio " +
                 "-- la excepción de procesarDescuentoStock ahora se propaga desde guardar()")
    void guardar_ventaRapidaConStockInsuficiente_yaNoTragaEnSilencio() {
        when(TurnoRepository.existsByEstado(EstadoTurno.ABIERTO)).thenReturn(true);
        when(clienteRepository.findById(1)).thenReturn(Optional.of(consumidorFinal()));

        Producto productoSinStock = productoDirecto(30, "Cuaderno Universitario", 2);
        when(productoRepository.findById(30)).thenReturn(Optional.of(productoSinStock));

        DetallePedido detalle = new DetallePedido();
        Producto refProducto = new Producto();
        refProducto.setIdProducto(30);
        detalle.setProducto(refProducto); // solo trae el id, como llega del frontend
        detalle.setCantidad(5); // pide 5, el producto real solo tiene 2
        detalle.setPrecioUnitario(BigDecimal.TEN);
        detalle.setSubtotal(BigDecimal.valueOf(50));

        Pedido pedido = new Pedido();
        pedido.setId_pedido(777);
        pedido.setDetalles(List.of(detalle));
        pedido.setMonto_total(BigDecimal.valueOf(50));
        pedido.setObservaciones("Venta Rápida");

        when(pedidoRepository.save(any(Pedido.class))).thenAnswer(inv -> inv.getArgument(0));
        when(pedidoRepository.findById(777)).thenReturn(Optional.of(pedido));

        RuntimeException ex = assertThrows(RuntimeException.class,
                () -> pedidoService.guardar(pedido, null, null, "EFECTIVO", null, false));

        assertTrue(ex.getMessage().contains("Cuaderno Universitario"),
                "Antes este caso no lanzaba nada: guardar() devolvía 200 con el pedido a medio procesar.");
        assertFalse(pedido.isStockDescontado());
    }

    @Test
    @DisplayName("REGRESIÓN (decisión de negocio): Venta Rápida con máquina caída pero " +
                 "confirmarMaquinaNoDisponible=true (el operario clickeó \"Continuar de todos modos\" " +
                 "en el aviso del frontend) -> guardar() completa la venta igual, sin propagar el conflicto")
    void guardar_ventaRapidaConMaquinaCaidaYConfirmacionExplicita_completaLaVenta() {
        when(TurnoRepository.existsByEstado(EstadoTurno.ABIERTO)).thenReturn(true);
        when(clienteRepository.findById(1)).thenReturn(Optional.of(consumidorFinal()));

        Producto productoConMaquinaCaida = productoDirecto(40, "Anillado A4", 100);
        Maquina anilladoraRota = new Maquina();
        anilladoraRota.setIdMaquina(9);
        anilladoraRota.setNombre("Anilladora 1");
        anilladoraRota.setEstado("FUERA_DE_SERVICIO");
        productoConMaquinaCaida.setMaquinaNecesaria(anilladoraRota);
        when(productoRepository.findById(40)).thenReturn(Optional.of(productoConMaquinaCaida));

        DetallePedido detalle = new DetallePedido();
        Producto refProducto = new Producto();
        refProducto.setIdProducto(40);
        detalle.setProducto(refProducto);
        detalle.setCantidad(1);
        detalle.setPrecioUnitario(BigDecimal.TEN);
        detalle.setSubtotal(BigDecimal.TEN);

        Pedido pedido = new Pedido();
        pedido.setId_pedido(778);
        pedido.setDetalles(List.of(detalle));
        pedido.setMonto_total(BigDecimal.TEN);
        pedido.setObservaciones("Venta Rápida");

        when(pedidoRepository.save(any(Pedido.class))).thenAnswer(inv -> inv.getArgument(0));
        when(pedidoRepository.findById(778)).thenReturn(Optional.of(pedido));

        assertDoesNotThrow(() -> pedidoService.guardar(pedido, null, null, "EFECTIVO", null, true));

        assertTrue(pedido.isStockDescontado());
        assertEquals(99, productoConMaquinaCaida.getStock());
    }
}
