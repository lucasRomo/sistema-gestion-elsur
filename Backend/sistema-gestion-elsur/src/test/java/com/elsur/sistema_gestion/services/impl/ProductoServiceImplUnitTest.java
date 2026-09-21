package com.elsur.sistema_gestion.services.impl;

import com.elsur.sistema_gestion.exceptions.RecursoDuplicadoException;
import com.elsur.sistema_gestion.exceptions.RecursoNoEncontradoException;
import com.elsur.sistema_gestion.exceptions.SolicitudInvalidaException;
import com.elsur.sistema_gestion.models.Producto;
import com.elsur.sistema_gestion.models.Usuario;
import com.elsur.sistema_gestion.repositories.ProductoInsumoRepository;
import com.elsur.sistema_gestion.repositories.ProductoRepository;
import com.elsur.sistema_gestion.repositories.UsuarioRepository;
import com.elsur.sistema_gestion.services.RegistroActividadService;
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
class ProductoServiceImplUnitTest {

    @Mock private ProductoRepository productoRepository;
    @Mock private ProductoInsumoRepository productoInsumoRepository;
    @Mock private RegistroActividadService registroActividadService;
    @Mock private UsuarioRepository usuarioRepository;

    @InjectMocks
    private ProductoServiceImpl productoService;

    private Producto producto(String nombre, BigDecimal precioBase, Integer stock) {
        Producto p = new Producto();
        p.setNombreProducto(nombre);
        p.setPrecioBase(precioBase);
        p.setStock(stock);
        p.setEstado("Activo");
        return p;
    }

    private Usuario usuario(int id) {
        Usuario u = new Usuario();
        u.setIdUsuario(id);
        return u;
    }


    @Test
    @DisplayName("CORREGIDO: nombre de producto vacío se rechaza")
    void guardar_nombreVacio_seRechaza() {
        Producto p = producto("", BigDecimal.TEN, 0);

        SolicitudInvalidaException ex = assertThrows(SolicitudInvalidaException.class,
                () -> productoService.guardar(p, 1));
        assertTrue(ex.getMessage().toLowerCase().contains("nombre"));
        verify(productoRepository, never()).save(any());
    }

    @Test
    @DisplayName("CORREGIDO: nombre de producto nulo se rechaza")
    void guardar_nombreNulo_seRechaza() {
        Producto p = producto(null, BigDecimal.TEN, 0);

        assertThrows(SolicitudInvalidaException.class, () -> productoService.guardar(p, 1));
        verify(productoRepository, never()).save(any());
    }

    @Test
    @DisplayName("CORREGIDO: nombre duplicado (case-insensitive) se rechaza con RecursoDuplicadoException, antes se guardaba sin ningún control")
    void guardar_nombreDuplicado_lanzaRecursoDuplicado() {
        Producto p = producto("Apunte TP1", BigDecimal.TEN, 0);
        when(productoRepository.existsByNombreProductoIgnoreCaseAndIdProductoNot("Apunte TP1", -1)).thenReturn(true);

        RecursoDuplicadoException ex = assertThrows(RecursoDuplicadoException.class,
                () -> productoService.guardar(p, 1));
        assertTrue(ex.getMessage().toLowerCase().contains("ya existe"));
        verify(productoRepository, never()).save(any());
    }

    @Test
    @DisplayName("CORREGIDO: el nombre se recorta (trim) antes de chequear duplicados y de guardar")
    void guardar_nombreConEspacios_seRecortaAntesDeChequearYGuardar() {
        Producto p = producto("  Apunte TP1  ", BigDecimal.TEN, 0);
        when(productoRepository.existsByNombreProductoIgnoreCaseAndIdProductoNot("Apunte TP1", -1)).thenReturn(false);
        when(productoRepository.save(any(Producto.class))).thenAnswer(inv -> inv.getArgument(0));

        Producto resultado = productoService.guardar(p, 1);

        verify(productoRepository).existsByNombreProductoIgnoreCaseAndIdProductoNot("Apunte TP1", -1);
        assertEquals("Apunte TP1", resultado.getNombreProducto());
    }

    @Test
    @DisplayName("CORREGIDO: al editar, el chequeo de duplicado excluye al propio producto (no se rechaza a sí mismo)")
    void guardar_edicion_excluyeElPropioIdDelChequeoDeDuplicado() {
        Producto p = producto("Apunte TP1", BigDecimal.TEN, 0);
        p.setIdProducto(7);
        when(productoRepository.existsByNombreProductoIgnoreCaseAndIdProductoNot("Apunte TP1", 7)).thenReturn(false);
        when(productoRepository.existsById(7)).thenReturn(true);
        when(productoRepository.findById(7)).thenReturn(Optional.of(producto("Apunte TP1", BigDecimal.ONE, 0)));
        when(usuarioRepository.findById(1)).thenReturn(Optional.of(usuario(1)));
        when(productoRepository.save(any(Producto.class))).thenAnswer(inv -> inv.getArgument(0));

        assertDoesNotThrow(() -> productoService.guardar(p, 1));
        verify(productoRepository).existsByNombreProductoIgnoreCaseAndIdProductoNot("Apunte TP1", 7);
    }


    @Test
    @DisplayName("CORREGIDO: el precio base negativo ahora se rechaza (antes no se validaba en el backend)")
    void guardar_precioBaseNegativo_seRechaza() {
        Producto p = producto("Producto X", new BigDecimal("-1"), 0);
        when(productoRepository.existsByNombreProductoIgnoreCaseAndIdProductoNot(any(), any())).thenReturn(false);

        SolicitudInvalidaException ex = assertThrows(SolicitudInvalidaException.class,
                () -> productoService.guardar(p, 1));
        assertTrue(ex.getMessage().toLowerCase().contains("precio"));
        verify(productoRepository, never()).save(any());
    }

    @Test
    @DisplayName("CORREGIDO: el stock negativo ahora se rechaza (antes no se validaba en el backend)")
    void guardar_stockNegativo_seRechaza() {
        Producto p = producto("Producto X", BigDecimal.TEN, -5);
        when(productoRepository.existsByNombreProductoIgnoreCaseAndIdProductoNot(any(), any())).thenReturn(false);

        SolicitudInvalidaException ex = assertThrows(SolicitudInvalidaException.class,
                () -> productoService.guardar(p, 1));
        assertTrue(ex.getMessage().toLowerCase().contains("stock"));
        verify(productoRepository, never()).save(any());
    }

    @Test
    @DisplayName("guardar: datos válidos (alta) persiste el producto sin exigir usuario logueado")
    void guardar_altaConDatosValidos_persisteElProducto() {
        Producto p = producto("Producto Nuevo", BigDecimal.TEN, 5);
        when(productoRepository.existsByNombreProductoIgnoreCaseAndIdProductoNot("Producto Nuevo", -1)).thenReturn(false);
        when(productoRepository.save(any(Producto.class))).thenAnswer(inv -> inv.getArgument(0));

        Producto resultado = productoService.guardar(p, null);

        assertEquals("Producto Nuevo", resultado.getNombreProducto());
        verifyNoInteractions(usuarioRepository);
    }


    @Test
    @DisplayName("CORREGIDO: buscar un producto inexistente lanza RecursoNoEncontradoException (404), antes era un RuntimeException genérico (400)")
    void buscarPorId_inexistente_lanzaRecursoNoEncontrado() {
        when(productoRepository.findById(999)).thenReturn(Optional.empty());

        assertThrows(RecursoNoEncontradoException.class, () -> productoService.buscarPorId(999));
    }


    @Test
    @DisplayName("CORREGIDO: al editar sin un idUsuario logueado ya no se atribuye la auditoría en silencio al primer usuario de la tabla, se rechaza")
    void guardar_edicionSinIdUsuario_yaNoCaeAlPrimerUsuarioDeLaTabla() {
        Producto p = producto("Producto Editado", BigDecimal.TEN, 0);
        p.setIdProducto(5);
        when(productoRepository.existsByNombreProductoIgnoreCaseAndIdProductoNot("Producto Editado", 5)).thenReturn(false);
        when(productoRepository.existsById(5)).thenReturn(true);
        when(productoRepository.findById(5)).thenReturn(Optional.of(producto("Producto Editado", BigDecimal.ONE, 0)));

        SolicitudInvalidaException ex = assertThrows(SolicitudInvalidaException.class,
                () -> productoService.guardar(p, null));
        assertTrue(ex.getMessage().toLowerCase().contains("usuario"));
        verify(usuarioRepository, never()).findAll();
        verify(productoRepository, never()).save(any());
    }

    @Test
    @DisplayName("guardar: al editar con un idUsuario válido, la auditoría usa ESE usuario")
    void guardar_edicionConIdUsuarioValido_usaEseUsuarioParaLaAuditoria() {
        Producto p = producto("Producto Editado", new BigDecimal("20"), 0);
        p.setIdProducto(5);
        when(productoRepository.existsByNombreProductoIgnoreCaseAndIdProductoNot("Producto Editado", 5)).thenReturn(false);
        when(productoRepository.existsById(5)).thenReturn(true);
        when(productoRepository.findById(5)).thenReturn(Optional.of(producto("Producto Editado", new BigDecimal("10"), 0)));
        when(usuarioRepository.findById(3)).thenReturn(Optional.of(usuario(3)));
        when(productoRepository.save(any(Producto.class))).thenAnswer(inv -> inv.getArgument(0));

        productoService.guardar(p, 3);

        verify(usuarioRepository).findById(3);
        verify(usuarioRepository, never()).findAll();
    }


    @Test
    @DisplayName("CORREGIDO: la actualización masiva de precios sin un usuario logueado detectable ya no atribuye la auditoría a un usuario cualquiera")
    void actualizarPreciosMasivo_sinIdUsuario_seRechaza() {
        Producto p = producto("Producto X", BigDecimal.TEN, 0);
        p.setIdProducto(1);
        when(productoRepository.findAll()).thenReturn(List.of(p));

        assertThrows(SolicitudInvalidaException.class,
                () -> productoService.actualizarPreciosMasivo(10.0, null, null, null, "TODOS", null));
        verify(usuarioRepository, never()).findAll();
        verify(productoRepository, never()).saveAll(any());
    }

    @Test
    @DisplayName("actualizarPreciosMasivo: selección manual vacía no modifica nada ni exige usuario")
    void actualizarPreciosMasivo_seleccionVacia_noHaceNada() {
        productoService.actualizarPreciosMasivo(10.0, null, null, List.of(), "SELECCION", null);

        verifyNoInteractions(usuarioRepository, registroActividadService);
        verify(productoRepository, never()).saveAll(any());
    }

    @Test
    @DisplayName("actualizarPreciosMasivo: un descuento no deja el precio en negativo, se clampea a cero")
    void actualizarPreciosMasivo_descuentoMayorAlPrecio_seClampeaACero() {
        Producto p = producto("Producto X", new BigDecimal("10.00"), 0);
        p.setIdProducto(1);
        when(productoRepository.findAll()).thenReturn(List.of(p));
        when(usuarioRepository.findById(1)).thenReturn(Optional.of(usuario(1)));
        when(productoRepository.saveAll(any())).thenAnswer(inv -> inv.getArgument(0));

        productoService.actualizarPreciosMasivo(-150.0, null, null, null, "TODOS", 1);

        assertEquals(0, BigDecimal.ZERO.compareTo(p.getPrecioBase()));
    }
}
