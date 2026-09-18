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
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

/**
 * Tests UNITARIOS (caja blanca, Mockito) de MermaServiceImpl.registrarMermas() --
 * el método invocado desde ModalGestionMermas.tsx (Pedidos Pendientes) y que
 * alimenta a ModalHistorialMermas.tsx (Historial de Pedidos). Hasta este trabajo
 * no existía NINGUNA suite de tests para este servicio.
 *
 * HALLAZGO PRINCIPAL (bug real, CORREGIDO en este pase):
 * registrarMermas() no validaba que 'cantidad' fuera positiva. El descuento de
 * stock de Producto se calculaba como "stock - cantidad" (Math.max(0, ...)) y el
 * de Insumo como "stockActual.subtract(cantidad)" (clamp a BigDecimal.ZERO) --
 * si 'cantidad' llegaba en negativo (por ejemplo, porque ModalGestionMermas.tsx
 * tampoco lo validaba: `Number(selections[k].cantidad) || 1` solo cubría el caso
 * vacío/0, no el negativo), restar un número negativo SUMABA stock en vez de
 * restarlo. Se corrigió en ambas capas: MermaServiceImpl.registrarMermas() ahora
 * rechaza con SolicitudInvalidaException cualquier cantidad nula, cero o negativa
 * (ANTES de tocar ningún repositorio de stock), y ModalGestionMermas.tsx valida lo
 * mismo del lado del frontend antes de armar el payload.
 */
@ExtendWith(MockitoExtension.class)
class MermaServiceImplUnitTest {

    @Mock private MermaRepository mermaRepository;
    @Mock private ProductoRepository productoRepository;
    @Mock private InsumoRepository insumoRepository;
    @Mock private PedidoRepository pedidoRepository;
    @Mock private UsuarioRepository usuarioRepository;

    @InjectMocks
    private MermaServiceImpl mermaService;

    private Producto producto(int id, int stock) {
        Producto p = new Producto();
        p.setIdProducto(id);
        p.setNombreProducto("Volantes A5 x500");
        p.setStock(stock);
        return p;
    }

    private Insumo insumo(int id, BigDecimal stockActual) {
        Insumo i = new Insumo();
        i.setIdInsumo(id);
        i.setStockActual(stockActual);
        return i;
    }

    private Merma mermaDeProducto(Integer idProducto, Double cantidad) {
        Merma m = new Merma();
        Producto refProducto = new Producto();
        refProducto.setIdProducto(idProducto);
        m.setProducto(refProducto);
        m.setCantidad(cantidad);
        m.setDescripcion("Producto dañado en el proceso de laminado");
        return m;
    }

    private Merma mermaDeInsumo(Integer idInsumo, Double cantidad) {
        Merma m = new Merma();
        Insumo refInsumo = new Insumo();
        refInsumo.setIdInsumo(idInsumo);
        m.setInsumo(refInsumo);
        m.setCantidad(cantidad);
        m.setDescripcion("Insumo derramado");
        return m;
    }

    // ==================== FIX: cantidad negativa/cero/nula ahora se rechaza ====================

    @Test
    @DisplayName("FIX: registrar una merma de Producto con cantidad NEGATIVA ahora se rechaza con SolicitudInvalidaException")
    void registrarMermas_productoConCantidadNegativa_seRechaza() {
        Merma entrada = mermaDeProducto(80, -5.0);

        assertThrows(SolicitudInvalidaException.class, () -> mermaService.registrarMermas(List.of(entrada)));

        // La validación corta ANTES de tocar cualquier repositorio de stock.
        verifyNoInteractions(productoRepository, insumoRepository, mermaRepository);
    }

    @Test
    @DisplayName("FIX: registrar una merma de Insumo con cantidad NEGATIVA ahora se rechaza con SolicitudInvalidaException")
    void registrarMermas_insumoConCantidadNegativa_seRechaza() {
        Merma entrada = mermaDeInsumo(30, -3.0);

        assertThrows(SolicitudInvalidaException.class, () -> mermaService.registrarMermas(List.of(entrada)));

        verifyNoInteractions(productoRepository, insumoRepository, mermaRepository);
    }

    @Test
    @DisplayName("FIX: una cantidad en 0 también se rechaza (una merma siempre debe ser > 0)")
    void registrarMermas_cantidadCero_seRechaza() {
        Merma entrada = mermaDeProducto(80, 0.0);

        assertThrows(SolicitudInvalidaException.class, () -> mermaService.registrarMermas(List.of(entrada)));
    }

    @Test
    @DisplayName("FIX: una cantidad nula también se rechaza")
    void registrarMermas_cantidadNula_seRechaza() {
        Merma entrada = mermaDeProducto(80, null);

        assertThrows(SolicitudInvalidaException.class, () -> mermaService.registrarMermas(List.of(entrada)));
    }

    // ==================== Camino feliz: cantidad positiva descuenta correctamente ====================

    @Test
    @DisplayName("Registrar una merma válida de Producto descuenta el stock correctamente")
    void registrarMermas_productoConCantidadValida_descuentaStock() {
        Producto prod = producto(81, 20);
        when(productoRepository.findById(81)).thenReturn(Optional.of(prod));
        when(mermaRepository.save(any(Merma.class))).thenAnswer(inv -> inv.getArgument(0));

        mermaService.registrarMermas(List.of(mermaDeProducto(81, 4.0)));

        assertEquals(16, prod.getStock());
    }

    @Test
    @DisplayName("Registrar una merma de Producto que supera el stock disponible lo clampea a 0 (no queda negativo)")
    void registrarMermas_productoConCantidadMayorAlStock_clampeaACero() {
        Producto prod = producto(82, 5);
        when(productoRepository.findById(82)).thenReturn(Optional.of(prod));
        when(mermaRepository.save(any(Merma.class))).thenAnswer(inv -> inv.getArgument(0));

        mermaService.registrarMermas(List.of(mermaDeProducto(82, 50.0)));

        assertEquals(0, prod.getStock());
    }

    @Test
    @DisplayName("Registrar una merma de Insumo que supera el stock disponible lo clampea a BigDecimal.ZERO")
    void registrarMermas_insumoConCantidadMayorAlStock_clampeaACero() {
        Insumo ins = insumo(31, BigDecimal.valueOf(2));
        when(insumoRepository.findById(31)).thenReturn(Optional.of(ins));
        when(mermaRepository.save(any(Merma.class))).thenAnswer(inv -> inv.getArgument(0));

        mermaService.registrarMermas(List.of(mermaDeInsumo(31, 50.0)));

        assertEquals(0, BigDecimal.ZERO.compareTo(ins.getStockActual()));
    }

    // ==================== Gaps de integridad de datos ====================

    @Test
    @DisplayName("GAP: una merma sin producto NI insumo asociado se guarda igual (merma huérfana, sin ningún stock afectado)")
    void registrarMermas_sinProductoNiInsumo_seGuardaComoMermaHuerfana() {
        Merma huerfana = new Merma();
        huerfana.setCantidad(3.0);
        huerfana.setDescripcion("Merma sin ítem asociado");
        when(mermaRepository.save(any(Merma.class))).thenAnswer(inv -> inv.getArgument(0));

        List<Merma> guardadas = mermaService.registrarMermas(List.of(huerfana));

        assertEquals(1, guardadas.size());
        verifyNoInteractions(productoRepository, insumoRepository);
        // No hay ninguna validación que exija que la merma tenga producto o insumo:
        // queda un registro histórico "fantasma" que no bajó stock de nada.
    }

    @Test
    @DisplayName("GAP: un idProducto inexistente no lanza excepción -- la merma se guarda igual sin descontar ningún stock, en silencio")
    void registrarMermas_productoInexistente_noLanzaExcepcionYNoDescuenta() {
        when(productoRepository.findById(999)).thenReturn(Optional.empty());
        when(mermaRepository.save(any(Merma.class))).thenAnswer(inv -> inv.getArgument(0));

        List<Merma> guardadas = assertDoesNotThrow(() ->
                mermaService.registrarMermas(List.of(mermaDeProducto(999, 5.0))));

        assertEquals(1, guardadas.size());
        verify(productoRepository, never()).save(any(Producto.class));
    }

    @Test
    @DisplayName("GAP: un idUsuario inexistente no lanza excepción -- la merma queda guardada con usuario=null, sin atribución")
    void registrarMermas_usuarioInexistente_seGuardaConUsuarioNull() {
        Producto prod = producto(83, 10);
        when(productoRepository.findById(83)).thenReturn(Optional.of(prod));
        when(usuarioRepository.findById(999)).thenReturn(Optional.empty());
        when(mermaRepository.save(any(Merma.class))).thenAnswer(inv -> inv.getArgument(0));

        Merma entrada = mermaDeProducto(83, 2.0);
        Usuario refUsuario = new Usuario();
        refUsuario.setIdUsuario(999);
        entrada.setUsuario(refUsuario);

        Merma guardada = mermaService.registrarMermas(List.of(entrada)).get(0);

        assertNull(guardada.getUsuario(), "El usuario inexistente se resuelve a null en silencio, sin rechazar la operación");
    }

    @Test
    @DisplayName("Si fechaMerma llega null, el servicio la completa automáticamente con la fecha/hora actual")
    void registrarMermas_fechaMermaNull_seCompletaAutomaticamente() {
        Producto prod = producto(84, 10);
        when(productoRepository.findById(84)).thenReturn(Optional.of(prod));
        when(mermaRepository.save(any(Merma.class))).thenAnswer(inv -> inv.getArgument(0));

        Merma entrada = mermaDeProducto(84, 1.0);
        entrada.setFechaMerma(null);

        Merma guardada = mermaService.registrarMermas(List.of(entrada)).get(0);

        assertNotNull(guardada.getFechaMerma());
        assertTrue(guardada.getFechaMerma().isBefore(LocalDateTime.now().plusSeconds(1)));
    }

    @Test
    @DisplayName("Una merma puede afectar Producto e Insumo al mismo tiempo si ambos vienen cargados en el mismo registro")
    void registrarMermas_conProductoEInsumoSimultaneos_descuentaAmbosStocks() {
        Producto prod = producto(85, 20);
        Insumo ins = insumo(32, BigDecimal.valueOf(10));
        when(productoRepository.findById(85)).thenReturn(Optional.of(prod));
        when(insumoRepository.findById(32)).thenReturn(Optional.of(ins));
        when(mermaRepository.save(any(Merma.class))).thenAnswer(inv -> inv.getArgument(0));

        Merma entrada = mermaDeProducto(85, 3.0);
        Insumo refInsumo = new Insumo();
        refInsumo.setIdInsumo(32);
        entrada.setInsumo(refInsumo);

        mermaService.registrarMermas(List.of(entrada));

        assertEquals(17, prod.getStock());
        assertEquals(0, BigDecimal.valueOf(7).compareTo(ins.getStockActual()));
    }
}
