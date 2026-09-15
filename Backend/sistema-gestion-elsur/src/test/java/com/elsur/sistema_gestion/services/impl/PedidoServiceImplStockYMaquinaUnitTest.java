package com.elsur.sistema_gestion.services.impl;

import com.elsur.sistema_gestion.exceptions.ConflictoDeIntegridadException;
import com.elsur.sistema_gestion.exceptions.SolicitudInvalidaException;
import com.elsur.sistema_gestion.models.*;
import com.elsur.sistema_gestion.repositories.*;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

/**
 * Tests UNITARIOS (caja blanca, Mockito, sin levantar Spring) de
 * PedidoServiceImpl.procesarDescuentoStock(): el único lugar del backend donde el
 * stock de una venta realmente se compromete/descuenta.
 *
 * Cubre los tres escenarios que se pidió probar a fondo para el módulo de Venta
 * Rápida del Dashboard:
 *   - "una máquina que no funciona"  -> sección MÁQUINA
 *   - "stock insuficiente"           -> sección STOCK INSUFICIENTE
 *   - idempotencia / doble descuento (encontrado al auditar el código; no estaba
 *     pedido explícitamente, pero es la otra cara de "stock insuficiente": un
 *     pedido con stock roto por descontarse dos veces) -> sección IDEMPOTENCIA
 *
 * No se testea acá "stock de respaldo" (el margen de 5 unidades / stockMinimo):
 * ese cálculo es enteramente del lado del frontend (useVentaRapida.ts,
 * MARGEN_MERMA_RESPALDO), es una advertencia descartable por el operario, y el
 * backend -- correctamente -- no la conoce ni la exige: solo le importa si el
 * stock físico alcanza o no (saldoFisico >= 0). Los tests de "ventaConRecetaOk_*"
 * de acá abajo confirman justamente eso: una venta con stock ajustado (pero
 * suficiente) se completa sin objeciones del backend, aunque el frontend la
 * hubiera marcado como "crítica".
 */
@ExtendWith(MockitoExtension.class)
class PedidoServiceImplStockYMaquinaUnitTest {

    @Mock private PedidoRepository pedidoRepository;
    @Mock private InsumoRepository insumoRepository;
    @Mock private ProductoInsumoRepository productoInsumoRepository;
    @Mock private DetallePedidoRepository detallePedidoRepository;
    @Mock private ProductoRepository productoRepository;

    @InjectMocks
    private PedidoServiceImpl pedidoService;

    private Pedido pedidoBase(List<DetallePedido> detalles) {
        Pedido pedido = new Pedido();
        pedido.setId_pedido(500);
        pedido.setDetalles(detalles);
        pedido.setObservaciones("Venta Rápida");
        return pedido;
    }

    private Producto productoConReceta(String nombre) {
        Producto p = new Producto();
        p.setIdProducto(10);
        p.setNombreProducto(nombre);
        p.setStockVinculado(true);
        return p;
    }

    private Producto productoDirecto(String nombre, int stockActual) {
        Producto p = new Producto();
        p.setIdProducto(20);
        p.setNombreProducto(nombre);
        p.setStockVinculado(false);
        p.setStock(stockActual);
        return p;
    }

    private Insumo insumo(int id, String nombre, String stockActual) {
        Insumo i = new Insumo();
        i.setIdInsumo(id);
        i.setNombreInsumo(nombre);
        i.setStockActual(new BigDecimal(stockActual));
        i.setStockMinimo(BigDecimal.ZERO);
        return i;
    }

    private ProductoInsumo receta(Producto producto, Insumo insumo, String cantidadConsumo) {
        ProductoInsumo pi = new ProductoInsumo();
        pi.setProducto(producto);
        pi.setInsumo(insumo);
        pi.setCantidadConsumo(new BigDecimal(cantidadConsumo));
        return pi;
    }

    private DetallePedido detalle(Producto producto, int cantidad) {
        DetallePedido d = new DetallePedido();
        d.setProducto(producto);
        d.setCantidad(cantidad);
        d.setPrecioUnitario(BigDecimal.TEN);
        d.setSubtotal(BigDecimal.TEN);
        return d;
    }

    private Maquina maquina(String nombre, String estado) {
        Maquina m = new Maquina();
        m.setIdMaquina(7);
        m.setNombre(nombre);
        m.setEstado(estado);
        return m;
    }

    // ==================== Casos base / guardas generales ====================

    @Test
    @DisplayName("Pedido inexistente -> RuntimeException, no toca ningún repositorio de stock")
    void pedidoNoEncontrado_lanzaExcepcion() {
        when(pedidoRepository.findById(999)).thenReturn(Optional.empty());

        RuntimeException ex = assertThrows(RuntimeException.class,
                () -> pedidoService.procesarDescuentoStock(999));

        assertEquals("Pedido no encontrado", ex.getMessage());
        verifyNoInteractions(insumoRepository, productoRepository, productoInsumoRepository);
    }

    @Test
    @DisplayName("Pedido sin detalles (ni en memoria ni en la base) -> RuntimeException")
    void pedidoSinDetalles_lanzaExcepcion() {
        Pedido pedido = pedidoBase(new ArrayList<>());
        when(pedidoRepository.findById(500)).thenReturn(Optional.of(pedido));
        when(detallePedidoRepository.findByPedidoIdPedido(500)).thenReturn(new ArrayList<>());

        RuntimeException ex = assertThrows(RuntimeException.class,
                () -> pedidoService.procesarDescuentoStock(500));

        assertEquals("El pedido no tiene detalles registrados", ex.getMessage());
    }

    @Test
    @DisplayName("Detalle con producto null -> SolicitudInvalidaException clara, no NullPointerException")
    void detalleSinProducto_lanzaSolicitudInvalida() {
        DetallePedido detalleRoto = detalle(null, 2);
        Pedido pedido = pedidoBase(List.of(detalleRoto));
        when(pedidoRepository.findById(500)).thenReturn(Optional.of(pedido));

        SolicitudInvalidaException ex = assertThrows(SolicitudInvalidaException.class,
                () -> pedidoService.procesarDescuentoStock(500));

        assertTrue(ex.getMessage().contains("producto válido"));
    }

    // ==================== IDEMPOTENCIA (doble descuento) ====================

    @Test
    @DisplayName("REGRESIÓN: pedido con stockDescontado=true no vuelve a tocar stock (no-op)")
    void yaTeniaStockDescontado_esNoOp() {
        Pedido pedido = pedidoBase(List.of(detalle(productoDirecto("Volante A5", 50), 3)));
        pedido.setStockDescontado(true);
        when(pedidoRepository.findById(500)).thenReturn(Optional.of(pedido));

        assertDoesNotThrow(() -> pedidoService.procesarDescuentoStock(500));

        verifyNoInteractions(insumoRepository, productoRepository, productoInsumoRepository, detallePedidoRepository);
        verify(pedidoRepository, never()).save(any());
    }

    // ==================== MÁQUINA ("una máquina que no funciona") ====================

    @Test
    @DisplayName("Máquina FUERA DE SERVICIO -> ConflictoDeIntegridadException, no descuenta nada")
    void maquinaFueraDeServicio_bloqueaVenta() {
        Producto producto = productoDirecto("Anillado A4", 100);
        producto.setMaquinaNecesaria(maquina("Anilladora 1", "FUERA_DE_SERVICIO"));
        Pedido pedido = pedidoBase(List.of(detalle(producto, 1)));
        when(pedidoRepository.findById(500)).thenReturn(Optional.of(pedido));

        ConflictoDeIntegridadException ex = assertThrows(ConflictoDeIntegridadException.class,
                () -> pedidoService.procesarDescuentoStock(500));

        assertTrue(ex.getMessage().contains("Anilladora 1"));
        verify(productoRepository, never()).save(any());
        assertFalse(pedido.isStockDescontado());
    }

    @Test
    @DisplayName("Máquina en FALLA -> bloquea igual que fuera de servicio")
    void maquinaEnFalla_bloqueaVenta() {
        Producto producto = productoDirecto("Impresión Láser", 100);
        producto.setMaquinaNecesaria(maquina("Impresora Láser 2", "FALLA"));
        Pedido pedido = pedidoBase(List.of(detalle(producto, 1)));
        when(pedidoRepository.findById(500)).thenReturn(Optional.of(pedido));

        assertThrows(ConflictoDeIntegridadException.class,
                () -> pedidoService.procesarDescuentoStock(500));
    }

    @Test
    @DisplayName("Máquina en MANTENIMIENTO -> bloquea igual que fuera de servicio")
    void maquinaEnMantenimiento_bloqueaVenta() {
        Producto producto = productoDirecto("Plastificado", 100);
        producto.setMaquinaNecesaria(maquina("Plastificadora", "MANTENIMIENTO"));
        Pedido pedido = pedidoBase(List.of(detalle(producto, 1)));
        when(pedidoRepository.findById(500)).thenReturn(Optional.of(pedido));

        assertThrows(ConflictoDeIntegridadException.class,
                () -> pedidoService.procesarDescuentoStock(500));
    }

    @Test
    @DisplayName("Máquina OPERATIVA -> no bloquea, la venta se completa")
    void maquinaOperativa_permiteVenta() {
        Producto producto = productoDirecto("Fotocopia B/N", 100);
        producto.setMaquinaNecesaria(maquina("Fotocopiadora 1", "OPERATIVA"));
        Pedido pedido = pedidoBase(List.of(detalle(producto, 5)));
        when(pedidoRepository.findById(500)).thenReturn(Optional.of(pedido));

        assertDoesNotThrow(() -> pedidoService.procesarDescuentoStock(500));

        assertEquals(95, producto.getStock());
        assertTrue(pedido.isStockDescontado());
    }

    @Test
    @DisplayName("REGRESIÓN (decisión de negocio): máquina FUERA DE SERVICIO + confirmarMaquinaNoDisponible=true " +
                 "-> la venta se completa igual (el operario ya vio el aviso y eligió \"Continuar de todos modos\")")
    void maquinaFueraDeServicio_conConfirmacionExplicita_permiteVenta() {
        Producto producto = productoDirecto("Anillado A4", 100);
        producto.setMaquinaNecesaria(maquina("Anilladora 1", "FUERA_DE_SERVICIO"));
        Pedido pedido = pedidoBase(List.of(detalle(producto, 1)));
        when(pedidoRepository.findById(500)).thenReturn(Optional.of(pedido));

        assertDoesNotThrow(() -> pedidoService.procesarDescuentoStock(500, true));

        assertEquals(99, producto.getStock());
        assertTrue(pedido.isStockDescontado());
        verify(productoRepository).save(producto);
    }

    @Test
    @DisplayName("Máquina FUERA DE SERVICIO + confirmarMaquinaNoDisponible=false (explícito) -> bloquea igual que el default")
    void maquinaFueraDeServicio_conConfirmacionExplicitaFalsa_bloqueaVenta() {
        Producto producto = productoDirecto("Anillado A4", 100);
        producto.setMaquinaNecesaria(maquina("Anilladora 1", "FUERA_DE_SERVICIO"));
        Pedido pedido = pedidoBase(List.of(detalle(producto, 1)));
        when(pedidoRepository.findById(500)).thenReturn(Optional.of(pedido));

        assertThrows(ConflictoDeIntegridadException.class,
                () -> pedidoService.procesarDescuentoStock(500, false));

        verify(productoRepository, never()).save(any());
    }

    @Test
    @DisplayName("Máquina 'No aplica' -> se ignora aunque su estado esté roto")
    void maquinaNoAplica_permiteVentaAunConEstadoRoto() {
        Producto producto = productoDirecto("Venta suelta de hojas", 100);
        producto.setMaquinaNecesaria(maquina("No aplica", "FUERA_DE_SERVICIO"));
        Pedido pedido = pedidoBase(List.of(detalle(producto, 2)));
        when(pedidoRepository.findById(500)).thenReturn(Optional.of(pedido));

        assertDoesNotThrow(() -> pedidoService.procesarDescuentoStock(500));
    }

    @Test
    @DisplayName("Producto sin máquina asociada (null) -> no se valida nada de máquinas")
    void sinMaquinaAsociada_noValidaNada() {
        Producto producto = productoDirecto("Producto genérico", 10);
        // maquinaNecesaria queda null a propósito
        Pedido pedido = pedidoBase(List.of(detalle(producto, 1)));
        when(pedidoRepository.findById(500)).thenReturn(Optional.of(pedido));

        assertDoesNotThrow(() -> pedidoService.procesarDescuentoStock(500));
    }

    // ==================== STOCK INSUFICIENTE ====================

    @Test
    @DisplayName("Insumo de receta con stock insuficiente -> RuntimeException con el nombre del insumo")
    void stockInsumoInsuficiente_lanzaExcepcion() {
        Producto producto = productoConReceta("Cuadernillo Anillado");
        Insumo papel = insumo(1, "Hoja A4", "10.00");
        Pedido pedido = pedidoBase(List.of(detalle(producto, 20))); // pide 20, hay 10
        when(pedidoRepository.findById(500)).thenReturn(Optional.of(pedido));
        when(productoInsumoRepository.findByIdIdProducto(10))
                .thenReturn(List.of(receta(producto, papel, "1")));

        RuntimeException ex = assertThrows(RuntimeException.class,
                () -> pedidoService.procesarDescuentoStock(500));

        assertTrue(ex.getMessage().contains("Hoja A4"));
        assertFalse(pedido.isStockDescontado());
    }

    @Test
    @DisplayName("HALLAZGO: si la receta tiene 2 insumos y el 2do no alcanza, el 1ro ya quedó descontado " +
                 "(el rollback completo depende de que quien llama a esto no trague la excepción -- ver guardar())")
    void stockInsumoInsuficiente_conVariosInsumos_dejaElPrimeroYaDescontado() {
        Producto producto = productoConReceta("Cuadernillo Anillado Color");
        Insumo papel = insumo(1, "Hoja A4", "50.00");   // alcanza de sobra
        Insumo tinta = insumo(2, "Tinta Color", "1.00"); // no alcanza
        Pedido pedido = pedidoBase(List.of(detalle(producto, 10)));
        when(pedidoRepository.findById(500)).thenReturn(Optional.of(pedido));
        when(productoInsumoRepository.findByIdIdProducto(10)).thenReturn(List.of(
                receta(producto, papel, "1"),   // se procesa primero: 50 - 10 = 40, se guarda
                receta(producto, tinta, "1")    // se procesa segundo: 1 - 10 < 0, explota acá
        ));

        assertThrows(RuntimeException.class, () -> pedidoService.procesarDescuentoStock(500));

        // Esto es exactamente el comportamiento que hace peligroso tragar la excepción
        // más arriba en la pila: el insumo "Hoja A4" YA se guardó descontado.
        assertEquals(new BigDecimal("40.00"), papel.getStockActual());
        verify(insumoRepository).save(papel);
        verify(insumoRepository, never()).save(tinta);
    }

    @Test
    @DisplayName("Producto de stock directo insuficiente -> RuntimeException, no queda en negativo")
    void stockProductoDirectoInsuficiente_lanzaExcepcion() {
        Producto producto = productoDirecto("Agenda 2026", 3);
        Pedido pedido = pedidoBase(List.of(detalle(producto, 5))); // pide 5, hay 3
        when(pedidoRepository.findById(500)).thenReturn(Optional.of(pedido));

        RuntimeException ex = assertThrows(RuntimeException.class,
                () -> pedidoService.procesarDescuentoStock(500));

        assertTrue(ex.getMessage().contains("Agenda 2026"));
        assertEquals(3, producto.getStock()); // no se tocó
        verify(productoRepository, never()).save(any());
    }

    // ==================== Camino feliz ====================

    @Test
    @DisplayName("Venta Rápida con receta: descuenta el insumo, marca VENTA_RAPIDA y stockDescontado=true")
    void ventaConRecetaOk_descuentaInsumosYMarcaVentaRapida() {
        Producto producto = productoConReceta("Fotocopia color A4");
        Insumo tonerColor = insumo(3, "Tóner Color", "8.00");
        Pedido pedido = pedidoBase(List.of(detalle(producto, 5))); // consume 5, quedan 3 (crítico para el frontend, pero válido)
        when(pedidoRepository.findById(500)).thenReturn(Optional.of(pedido));
        when(productoInsumoRepository.findByIdIdProducto(10))
                .thenReturn(List.of(receta(producto, tonerColor, "1")));

        assertDoesNotThrow(() -> pedidoService.procesarDescuentoStock(500));

        assertEquals(new BigDecimal("3.00"), tonerColor.getStockActual());
        assertEquals("VENTA_RAPIDA", pedido.getEstado());
        assertTrue(pedido.isStockDescontado());
        assertNotNull(pedido.getFecha_finalizacion());
        verify(insumoRepository).save(tonerColor);
        verify(pedidoRepository).save(pedido);
    }

    @Test
    @DisplayName("Pedido normal (sin 'Venta Rápida' en observaciones) con producto directo: descuenta stock y marca ENTREGADO")
    void ventaProductoDirectoOk_descuentaStockYMarcaEntregado() {
        Producto producto = productoDirecto("Resma de papel", 50);
        Pedido pedido = pedidoBase(List.of(detalle(producto, 10)));
        pedido.setObservaciones("Pedido de mostrador normal");
        when(pedidoRepository.findById(500)).thenReturn(Optional.of(pedido));

        assertDoesNotThrow(() -> pedidoService.procesarDescuentoStock(500));

        assertEquals(40, producto.getStock());
        assertEquals("ENTREGADO", pedido.getEstado());
        assertTrue(pedido.isStockDescontado());
        verify(productoRepository).save(producto);
    }
}
