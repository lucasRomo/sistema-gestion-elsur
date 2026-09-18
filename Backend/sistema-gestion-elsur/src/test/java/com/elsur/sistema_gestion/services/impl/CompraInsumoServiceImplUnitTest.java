package com.elsur.sistema_gestion.services.impl;

import com.elsur.sistema_gestion.dto.CompraInsumoDTO;
import com.elsur.sistema_gestion.exceptions.RecursoDuplicadoException;
import com.elsur.sistema_gestion.exceptions.RecursoNoEncontradoException;
import com.elsur.sistema_gestion.exceptions.SolicitudInvalidaException;
import com.elsur.sistema_gestion.models.*;
import com.elsur.sistema_gestion.repositories.*;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
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
 * Tests UNITARIOS (caja blanca, Mockito) de CompraInsumoServiceImpl (módulo
 * "Compra de Insumos", pantalla de carga directa de compras a Insumos/Productos).
 *
 * HALLAZGOS PRINCIPALES (CORREGIDOS en este pase):
 * 1) El alta de un insumo nuevo (esNuevoInsumo=true) guardaba directo vía
 *    insumoRepository.save(), sin pasar por NINGUNA de las validaciones que sí
 *    tiene InsumoServiceImpl.guardar() -- en particular, sin chequear nombre
 *    duplicado. Esto permitía crear un insumo con el mismo nombre que uno ya
 *    existente directo desde "Compra de Insumos", sorteando la validación que
 *    el módulo Insumos sí exige (el mismo patrón de "nombre duplicado" ya
 *    encontrado y corregido en Insumos/Productos/Repositorio Digital).
 * 2) El usuario logueado que genera el movimiento de caja de la compra se
 *    resolvía con usuarioRepository.findById(...).orElse(null): un idUsuario
 *    inválido o ausente dejaba el movimiento sin autoría en silencio, en vez
 *    de rechazar la operación (mismo bug de trazabilidad ya corregido en
 *    Caja/Insumos/Productos).
 * 3) Un idProveedor inválido se ignoraba en silencio (.orElse(null)).
 * 4) No se validaba cantidad/precio de los ítems a nivel backend (dependía
 *    100% de las validaciones del formulario).
 */
@ExtendWith(MockitoExtension.class)
class CompraInsumoServiceImplUnitTest {

    @Mock private CompraProveedorRepository compraProveedorRepository;
    @Mock private DetalleCompraInsumoRepository detalleCompraInsumoRepository;
    @Mock private InsumoRepository insumoRepository;
    @Mock private ProductoRepository productoRepository;
    @Mock private MovimientoCajaRepository movimientoCajaRepository;
    @Mock private UsuarioRepository usuarioRepository;
    @Mock private ProveedorRepository proveedorRepository;
    @Mock private UnidadMedidaRepository unidadMedidaRepository;
    @Mock private TurnoRepository turnoRepository;

    @InjectMocks
    private CompraInsumoServiceImpl service;

    private Usuario usuario1;
    private Turno turnoAbierto;

    @BeforeEach
    void setUp() {
        usuario1 = new Usuario();
        usuario1.setIdUsuario(1);

        turnoAbierto = new Turno();
        turnoAbierto.setIdTurno(5);
        turnoAbierto.setEstado(EstadoTurno.ABIERTO);
    }

    private void stubTurnoYUsuarioOk() {
        lenient().when(usuarioRepository.findById(1)).thenReturn(Optional.of(usuario1));
        lenient().when(turnoRepository.findFirstByEstado(EstadoTurno.ABIERTO)).thenReturn(Optional.of(turnoAbierto));
        lenient().when(compraProveedorRepository.save(any(CompraProveedor.class)))
                .thenAnswer(inv -> {
                    CompraProveedor c = inv.getArgument(0);
                    c.setIdCompra(100L);
                    return c;
                });
    }

    private CompraInsumoDTO.DetalleItemCompraDTO itemInsumoExistente(Long idInsumo, BigDecimal cantidad, BigDecimal precio) {
        CompraInsumoDTO.DetalleItemCompraDTO item = new CompraInsumoDTO.DetalleItemCompraDTO();
        item.setTipoItem("INSUMO");
        item.setIdInsumo(idInsumo);
        item.setEsNuevoInsumo(false);
        item.setCantidadEmpaquetada(cantidad);
        item.setPrecioUnitario(precio);
        return item;
    }

    private CompraInsumoDTO.DetalleItemCompraDTO itemInsumoNuevo(String nombre, BigDecimal cantidad, BigDecimal precio, Long idUnidad, Long idUnidadCompra) {
        CompraInsumoDTO.DetalleItemCompraDTO item = new CompraInsumoDTO.DetalleItemCompraDTO();
        item.setTipoItem("INSUMO");
        item.setEsNuevoInsumo(true);
        item.setNombreInsumo(nombre);
        item.setCantidadEmpaquetada(cantidad);
        item.setPrecioUnitario(precio);
        item.setIdUnidad(idUnidad);
        item.setIdUnidadCompra(idUnidadCompra);
        item.setFactorConversion(new BigDecimal("500"));
        return item;
    }

    private CompraInsumoDTO.DetalleItemCompraDTO itemProducto(Long idProducto, BigDecimal cantidad, BigDecimal precio) {
        CompraInsumoDTO.DetalleItemCompraDTO item = new CompraInsumoDTO.DetalleItemCompraDTO();
        item.setTipoItem("PRODUCTO");
        item.setIdProducto(idProducto);
        item.setCantidadEmpaquetada(cantidad);
        item.setPrecioUnitario(precio);
        return item;
    }

    private CompraInsumoDTO dtoBase(List<CompraInsumoDTO.DetalleItemCompraDTO> items) {
        CompraInsumoDTO dto = new CompraInsumoDTO();
        dto.setMontoTotal(new BigDecimal("1000"));
        dto.setMetodoPago("EFECTIVO");
        dto.setConcepto("Compra de prueba");
        dto.setIdUsuario(1L);
        dto.setItems(items);
        return dto;
    }

    // --- Validaciones generales ---

    @Test
    @DisplayName("Ítems vacíos o nulos se rechazan")
    void registrarCompra_sinItems_lanzaExcepcion() {
        CompraInsumoDTO dto = dtoBase(new ArrayList<>());
        assertThrows(SolicitudInvalidaException.class, () -> service.registrarCompraInsumo(dto));
        verifyNoInteractions(compraProveedorRepository, detalleCompraInsumoRepository, movimientoCajaRepository);
    }

    @Test
    @DisplayName("Monto total nulo o <= 0 se rechaza")
    void registrarCompra_montoTotalInvalido_lanzaExcepcion() {
        CompraInsumoDTO dto = dtoBase(List.of(itemInsumoExistente(1L, BigDecimal.ONE, BigDecimal.TEN)));
        dto.setMontoTotal(BigDecimal.ZERO);
        assertThrows(SolicitudInvalidaException.class, () -> service.registrarCompraInsumo(dto));
    }

    @Test
    @DisplayName("CORREGIDO: idUsuario nulo se rechaza en vez de dejar el movimiento sin autoría")
    void registrarCompra_sinUsuarioLogueado_lanzaExcepcion() {
        CompraInsumoDTO dto = dtoBase(List.of(itemInsumoExistente(1L, BigDecimal.ONE, BigDecimal.TEN)));
        dto.setIdUsuario(null);

        assertThrows(SolicitudInvalidaException.class, () -> service.registrarCompraInsumo(dto));
        verifyNoInteractions(compraProveedorRepository, movimientoCajaRepository);
    }

    @Test
    @DisplayName("CORREGIDO: idUsuario que no existe se rechaza en vez de guardar el movimiento con usuario null")
    void registrarCompra_usuarioInexistente_lanzaExcepcion() {
        CompraInsumoDTO dto = dtoBase(List.of(itemInsumoExistente(1L, BigDecimal.ONE, BigDecimal.TEN)));
        when(usuarioRepository.findById(1)).thenReturn(Optional.empty());

        assertThrows(SolicitudInvalidaException.class, () -> service.registrarCompraInsumo(dto));
        verifyNoInteractions(compraProveedorRepository, movimientoCajaRepository);
    }

    @Test
    @DisplayName("CORREGIDO: un idProveedor inexistente lanza RecursoNoEncontradoException en vez de ignorarse en silencio")
    void registrarCompra_proveedorInexistente_lanzaExcepcion() {
        stubTurnoYUsuarioOk();
        CompraInsumoDTO dto = dtoBase(List.of(itemInsumoExistente(1L, BigDecimal.ONE, BigDecimal.TEN)));
        dto.setIdProveedor(99L);
        when(proveedorRepository.findById(99)).thenReturn(Optional.empty());

        assertThrows(RecursoNoEncontradoException.class, () -> service.registrarCompraInsumo(dto));
        verify(compraProveedorRepository, never()).save(any());
    }

    @Test
    @DisplayName("No hay caja/turno abierto: se rechaza la compra")
    void registrarCompra_sinTurnoAbierto_lanzaExcepcion() {
        when(usuarioRepository.findById(1)).thenReturn(Optional.of(usuario1));
        when(compraProveedorRepository.save(any(CompraProveedor.class)))
                .thenAnswer(inv -> { CompraProveedor c = inv.getArgument(0); c.setIdCompra(100L); return c; });
        when(insumoRepository.findById(1)).thenReturn(Optional.of(insumoExistente(1, "Resma A4")));
        when(turnoRepository.findFirstByEstado(EstadoTurno.ABIERTO)).thenReturn(Optional.empty());

        CompraInsumoDTO dto = dtoBase(List.of(itemInsumoExistente(1L, BigDecimal.ONE, BigDecimal.TEN)));

        assertThrows(SolicitudInvalidaException.class, () -> service.registrarCompraInsumo(dto));
        verify(movimientoCajaRepository, never()).save(any());
    }

    // --- Validación de ítems ---

    @Test
    @DisplayName("Cantidad comprada nula o <= 0 se rechaza")
    void registrarCompra_cantidadInvalida_lanzaExcepcion() {
        stubTurnoYUsuarioOk();
        CompraInsumoDTO dto = dtoBase(List.of(itemInsumoExistente(1L, BigDecimal.ZERO, BigDecimal.TEN)));

        assertThrows(SolicitudInvalidaException.class, () -> service.registrarCompraInsumo(dto));
    }

    @Test
    @DisplayName("Precio unitario negativo se rechaza")
    void registrarCompra_precioNegativo_lanzaExcepcion() {
        stubTurnoYUsuarioOk();
        CompraInsumoDTO dto = dtoBase(List.of(itemInsumoExistente(1L, BigDecimal.ONE, new BigDecimal("-5"))));

        assertThrows(SolicitudInvalidaException.class, () -> service.registrarCompraInsumo(dto));
    }

    // --- Rama Producto ---

    @Test
    @DisplayName("idProducto nulo con tipoItem PRODUCTO se rechaza")
    void registrarCompra_productoSinId_lanzaExcepcion() {
        stubTurnoYUsuarioOk();
        CompraInsumoDTO dto = dtoBase(List.of(itemProducto(null, BigDecimal.ONE, BigDecimal.TEN)));

        assertThrows(SolicitudInvalidaException.class, () -> service.registrarCompraInsumo(dto));
    }

    @Test
    @DisplayName("Producto inexistente lanza RecursoNoEncontradoException")
    void registrarCompra_productoInexistente_lanzaExcepcion() {
        stubTurnoYUsuarioOk();
        when(productoRepository.findById(50)).thenReturn(Optional.empty());
        CompraInsumoDTO dto = dtoBase(List.of(itemProducto(50L, BigDecimal.ONE, BigDecimal.TEN)));

        assertThrows(RecursoNoEncontradoException.class, () -> service.registrarCompraInsumo(dto));
    }

    @Test
    @DisplayName("Compra de producto existente: suma stock y actualiza precio base")
    void registrarCompra_productoExistente_actualizaStockYPrecio() {
        stubTurnoYUsuarioOk();
        Producto producto = new Producto();
        producto.setIdProducto(50);
        producto.setStock(10);
        producto.setPrecioBase(new BigDecimal("100"));
        when(productoRepository.findById(50)).thenReturn(Optional.of(producto));
        when(productoRepository.save(any(Producto.class))).thenAnswer(inv -> inv.getArgument(0));

        CompraInsumoDTO dto = dtoBase(List.of(itemProducto(50L, new BigDecimal("4"), new BigDecimal("150"))));
        service.registrarCompraInsumo(dto);

        ArgumentCaptor<Producto> captor = ArgumentCaptor.forClass(Producto.class);
        verify(productoRepository).save(captor.capture());
        assertEquals(14, captor.getValue().getStock());
        assertEquals(new BigDecimal("150"), captor.getValue().getPrecioBase());
        verify(movimientoCajaRepository).save(any(MovimientoCaja.class));
    }

    // --- Rama Insumo existente ---

    private Insumo insumoExistente(int id, String nombre) {
        Insumo i = new Insumo();
        i.setIdInsumo(id);
        i.setNombreInsumo(nombre);
        i.setStockEmpaquetado(new BigDecimal("2"));
        i.setPrecio(new BigDecimal("100"));
        return i;
    }

    @Test
    @DisplayName("idInsumo nulo con insumo existente se rechaza")
    void registrarCompra_insumoExistenteSinId_lanzaExcepcion() {
        stubTurnoYUsuarioOk();
        CompraInsumoDTO.DetalleItemCompraDTO item = itemInsumoExistente(null, BigDecimal.ONE, BigDecimal.TEN);
        CompraInsumoDTO dto = dtoBase(List.of(item));

        assertThrows(SolicitudInvalidaException.class, () -> service.registrarCompraInsumo(dto));
    }

    @Test
    @DisplayName("Insumo existente inexistente en BD lanza RecursoNoEncontradoException")
    void registrarCompra_insumoExistenteInexistente_lanzaExcepcion() {
        stubTurnoYUsuarioOk();
        when(insumoRepository.findById(1)).thenReturn(Optional.empty());
        CompraInsumoDTO dto = dtoBase(List.of(itemInsumoExistente(1L, BigDecimal.ONE, BigDecimal.TEN)));

        assertThrows(RecursoNoEncontradoException.class, () -> service.registrarCompraInsumo(dto));
    }

    @Test
    @DisplayName("Compra de insumo existente: acumula stock empaquetado y actualiza precio")
    void registrarCompra_insumoExistente_acumulaStock() {
        stubTurnoYUsuarioOk();
        Insumo insumo = insumoExistente(1, "Resma A4");
        when(insumoRepository.findById(1)).thenReturn(Optional.of(insumo));
        when(insumoRepository.save(any(Insumo.class))).thenAnswer(inv -> inv.getArgument(0));

        CompraInsumoDTO dto = dtoBase(List.of(itemInsumoExistente(1L, new BigDecimal("3"), new BigDecimal("120"))));
        service.registrarCompraInsumo(dto);

        ArgumentCaptor<Insumo> captor = ArgumentCaptor.forClass(Insumo.class);
        verify(insumoRepository).save(captor.capture());
        assertEquals(new BigDecimal("5"), captor.getValue().getStockEmpaquetado());
        assertEquals(new BigDecimal("120"), captor.getValue().getPrecio());
    }

    // --- Rama Insumo nuevo (foco: duplicado de nombre) ---

    @Test
    @DisplayName("Alta de insumo nuevo sin nombre se rechaza")
    void registrarCompra_insumoNuevoSinNombre_lanzaExcepcion() {
        stubTurnoYUsuarioOk();
        CompraInsumoDTO dto = dtoBase(List.of(itemInsumoNuevo("   ", BigDecimal.ONE, BigDecimal.TEN, 1L, 2L)));

        assertThrows(SolicitudInvalidaException.class, () -> service.registrarCompraInsumo(dto));
        verify(insumoRepository, never()).save(any());
    }

    @Test
    @DisplayName("CORREGIDO: alta de insumo nuevo con nombre duplicado (case-insensitive) lanza RecursoDuplicadoException -- antes se guardaba directo, sorteando la validación de Insumos")
    void registrarCompra_insumoNuevoNombreDuplicado_lanzaExcepcion() {
        stubTurnoYUsuarioOk();
        when(insumoRepository.existsByNombreInsumoIgnoreCaseAndIdInsumoNot("Resma A4", -1)).thenReturn(true);

        CompraInsumoDTO dto = dtoBase(List.of(itemInsumoNuevo("Resma A4", BigDecimal.ONE, BigDecimal.TEN, 1L, 2L)));

        assertThrows(RecursoDuplicadoException.class, () -> service.registrarCompraInsumo(dto));
        verify(insumoRepository, never()).save(any());
    }

    @Test
    @DisplayName("Alta de insumo nuevo sin unidad suelta o de empaque se rechaza")
    void registrarCompra_insumoNuevoSinUnidades_lanzaExcepcion() {
        stubTurnoYUsuarioOk();
        when(insumoRepository.existsByNombreInsumoIgnoreCaseAndIdInsumoNot(any(), any())).thenReturn(false);

        CompraInsumoDTO dto = dtoBase(List.of(itemInsumoNuevo("Resma A4", BigDecimal.ONE, BigDecimal.TEN, null, 2L)));

        assertThrows(SolicitudInvalidaException.class, () -> service.registrarCompraInsumo(dto));
        verify(insumoRepository, never()).save(any());
    }

    @Test
    @DisplayName("CORREGIDO: unidad de medida inexistente lanza RecursoNoEncontradoException en vez de guardarse con unidad null")
    void registrarCompra_insumoNuevoUnidadInexistente_lanzaExcepcion() {
        stubTurnoYUsuarioOk();
        when(insumoRepository.existsByNombreInsumoIgnoreCaseAndIdInsumoNot(any(), any())).thenReturn(false);
        when(unidadMedidaRepository.findById(1)).thenReturn(Optional.empty());

        CompraInsumoDTO dto = dtoBase(List.of(itemInsumoNuevo("Resma A4", BigDecimal.ONE, BigDecimal.TEN, 1L, 2L)));

        assertThrows(RecursoNoEncontradoException.class, () -> service.registrarCompraInsumo(dto));
        verify(insumoRepository, never()).save(any());
    }

    @Test
    @DisplayName("Alta de insumo nuevo con datos válidos: se crea con estado Activo y las unidades correctas")
    void registrarCompra_insumoNuevo_datosValidos_creaInsumo() {
        stubTurnoYUsuarioOk();
        when(insumoRepository.existsByNombreInsumoIgnoreCaseAndIdInsumoNot(any(), any())).thenReturn(false);

        UnidadMedida unidadSuelta = new UnidadMedida(1, "Hoja");
        UnidadMedida unidadEmpaque = new UnidadMedida(2, "Resma");
        when(unidadMedidaRepository.findById(1)).thenReturn(Optional.of(unidadSuelta));
        when(unidadMedidaRepository.findById(2)).thenReturn(Optional.of(unidadEmpaque));
        when(insumoRepository.save(any(Insumo.class))).thenAnswer(inv -> {
            Insumo i = inv.getArgument(0);
            i.setIdInsumo(77);
            return i;
        });

        CompraInsumoDTO dto = dtoBase(List.of(itemInsumoNuevo("Resma A4 75gr", new BigDecimal("10"), new BigDecimal("2500"), 1L, 2L)));
        service.registrarCompraInsumo(dto);

        ArgumentCaptor<Insumo> captor = ArgumentCaptor.forClass(Insumo.class);
        verify(insumoRepository).save(captor.capture());
        Insumo creado = captor.getValue();
        assertEquals("Resma A4 75gr", creado.getNombreInsumo());
        assertEquals("Activo", creado.getEstado());
        assertEquals(unidadSuelta, creado.getUnidadMedida());
        assertEquals(unidadEmpaque, creado.getUnidadCompra());
        assertEquals(new BigDecimal("10"), creado.getStockEmpaquetado());
        assertEquals(BigDecimal.ZERO, creado.getStockActual());
    }

    // --- Flujo feliz completo: autoría del movimiento de caja ---

    @Test
    @DisplayName("Compra exitosa: el movimiento de caja generado queda atribuido al usuario logueado real")
    void registrarCompra_exitosa_atribuyeMovimientoAlUsuarioCorrecto() {
        stubTurnoYUsuarioOk();
        Insumo insumo = insumoExistente(1, "Resma A4");
        when(insumoRepository.findById(1)).thenReturn(Optional.of(insumo));
        when(insumoRepository.save(any(Insumo.class))).thenAnswer(inv -> inv.getArgument(0));
        when(movimientoCajaRepository.save(any(MovimientoCaja.class))).thenAnswer(inv -> inv.getArgument(0));

        CompraInsumoDTO dto = dtoBase(List.of(itemInsumoExistente(1L, BigDecimal.ONE, BigDecimal.TEN)));
        service.registrarCompraInsumo(dto);

        ArgumentCaptor<MovimientoCaja> captor = ArgumentCaptor.forClass(MovimientoCaja.class);
        verify(movimientoCajaRepository).save(captor.capture());
        assertEquals(usuario1, captor.getValue().getUsuario());
        assertEquals("EGRESO", captor.getValue().getTipoMovimiento());
        assertEquals("INSUMOS", captor.getValue().getCategoria());
        assertEquals(turnoAbierto, captor.getValue().getTurno());

        verify(detalleCompraInsumoRepository).save(any());
    }
}
