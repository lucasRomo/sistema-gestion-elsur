package com.elsur.sistema_gestion.services.impl;

import com.elsur.sistema_gestion.exceptions.RecursoDuplicadoException;
import com.elsur.sistema_gestion.exceptions.SolicitudInvalidaException;
import com.elsur.sistema_gestion.models.Insumo;
import com.elsur.sistema_gestion.models.UnidadMedida;
import com.elsur.sistema_gestion.models.Usuario;
import com.elsur.sistema_gestion.repositories.InsumoRepository;
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
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;


@ExtendWith(MockitoExtension.class)
class InsumoServiceImplUnitTest {

    @Mock private InsumoRepository insumoRepository;
    @Mock private RegistroActividadService registroActividadService;
    @Mock private UsuarioRepository usuarioRepository;

    @InjectMocks
    private InsumoServiceImpl insumoService;

    private Insumo insumo(String nombre, BigDecimal precio, BigDecimal stockActual, BigDecimal stockMinimo) {
        Insumo i = new Insumo();
        i.setNombreInsumo(nombre);
        i.setPrecio(precio);
        i.setStockActual(stockActual);
        i.setStockMinimo(stockMinimo);
        i.setEstado("Activo");
        return i;
    }

    private Usuario usuario(int id) {
        Usuario u = new Usuario();
        u.setIdUsuario(id);
        return u;
    }


    @Test
    @DisplayName("CORREGIDO: nombre de insumo vacío se rechaza")
    void guardar_nombreVacio_seRechaza() {
        Insumo i = insumo("", BigDecimal.TEN, BigDecimal.ONE, BigDecimal.ZERO);

        SolicitudInvalidaException ex = assertThrows(SolicitudInvalidaException.class,
                () -> insumoService.guardar(i, 1));
        assertTrue(ex.getMessage().toLowerCase().contains("nombre"));
        verify(insumoRepository, never()).save(any());
    }

    @Test
    @DisplayName("CORREGIDO: nombre de insumo en blanco (solo espacios) se rechaza")
    void guardar_nombreEnBlanco_seRechaza() {
        Insumo i = insumo("   ", BigDecimal.TEN, BigDecimal.ONE, BigDecimal.ZERO);

        assertThrows(SolicitudInvalidaException.class, () -> insumoService.guardar(i, 1));
        verify(insumoRepository, never()).save(any());
    }

    @Test
    @DisplayName("CORREGIDO: nombre de insumo nulo se rechaza")
    void guardar_nombreNulo_seRechaza() {
        Insumo i = insumo(null, BigDecimal.TEN, BigDecimal.ONE, BigDecimal.ZERO);

        assertThrows(SolicitudInvalidaException.class, () -> insumoService.guardar(i, 1));
        verify(insumoRepository, never()).save(any());
    }

    @Test
    @DisplayName("CORREGIDO: nombre duplicado (case-insensitive) se rechaza con RecursoDuplicadoException, antes se guardaba sin ningún control")
    void guardar_nombreDuplicado_lanzaRecursoDuplicado() {
        Insumo i = insumo("Resma A4", BigDecimal.TEN, BigDecimal.ONE, BigDecimal.ZERO);
        when(insumoRepository.existsByNombreInsumoIgnoreCaseAndIdInsumoNot("Resma A4", -1)).thenReturn(true);

        RecursoDuplicadoException ex = assertThrows(RecursoDuplicadoException.class,
                () -> insumoService.guardar(i, 1));
        assertTrue(ex.getMessage().toLowerCase().contains("ya existe"));
        verify(insumoRepository, never()).save(any());
    }

    @Test
    @DisplayName("CORREGIDO: el nombre se recorta (trim) antes de chequear duplicados y de guardar")
    void guardar_nombreConEspacios_seRecortaAntesDeChequearYGuardar() {
        Insumo i = insumo("  Resma A4  ", BigDecimal.TEN, BigDecimal.ONE, BigDecimal.ZERO);
        when(insumoRepository.existsByNombreInsumoIgnoreCaseAndIdInsumoNot("Resma A4", -1)).thenReturn(false);
        when(insumoRepository.save(any(Insumo.class))).thenAnswer(inv -> inv.getArgument(0));

        Insumo resultado = insumoService.guardar(i, 1);

        verify(insumoRepository).existsByNombreInsumoIgnoreCaseAndIdInsumoNot("Resma A4", -1);
        assertEquals("Resma A4", resultado.getNombreInsumo());
    }

    @Test
    @DisplayName("CORREGIDO: al editar, el chequeo de duplicado excluye al propio insumo (no se rechaza a sí mismo)")
    void guardar_edicion_excluyeElPropioIdDelChequeoDeDuplicado() {
        Insumo i = insumo("Resma A4", BigDecimal.TEN, BigDecimal.ONE, BigDecimal.ZERO);
        i.setIdInsumo(7);
        when(insumoRepository.existsByNombreInsumoIgnoreCaseAndIdInsumoNot("Resma A4", 7)).thenReturn(false);
        when(insumoRepository.existsById(7)).thenReturn(true);
        when(insumoRepository.findById(7)).thenReturn(Optional.of(insumo("Resma A4", BigDecimal.ONE, BigDecimal.ZERO, BigDecimal.ZERO)));
        when(usuarioRepository.findById(1)).thenReturn(Optional.of(usuario(1)));
        when(insumoRepository.save(any(Insumo.class))).thenAnswer(inv -> inv.getArgument(0));

        assertDoesNotThrow(() -> insumoService.guardar(i, 1));
        verify(insumoRepository).existsByNombreInsumoIgnoreCaseAndIdInsumoNot("Resma A4", 7);
    }


    @Test
    @DisplayName("precio negativo se rechaza")
    void guardar_precioNegativo_seRechaza() {
        Insumo i = insumo("Insumo X", new BigDecimal("-1"), BigDecimal.ONE, BigDecimal.ZERO);
        when(insumoRepository.existsByNombreInsumoIgnoreCaseAndIdInsumoNot(any(), any())).thenReturn(false);

        assertThrows(SolicitudInvalidaException.class, () -> insumoService.guardar(i, 1));
        verify(insumoRepository, never()).save(any());
    }

    @Test
    @DisplayName("stock actual negativo se rechaza")
    void guardar_stockActualNegativo_seRechaza() {
        Insumo i = insumo("Insumo X", BigDecimal.TEN, new BigDecimal("-1"), BigDecimal.ZERO);
        when(insumoRepository.existsByNombreInsumoIgnoreCaseAndIdInsumoNot(any(), any())).thenReturn(false);

        assertThrows(SolicitudInvalidaException.class, () -> insumoService.guardar(i, 1));
        verify(insumoRepository, never()).save(any());
    }

    @Test
    @DisplayName("CORREGIDO: stock mínimo negativo ahora se rechaza (antes no se validaba en ningún lado)")
    void guardar_stockMinimoNegativo_seRechaza() {
        Insumo i = insumo("Insumo X", BigDecimal.TEN, BigDecimal.ONE, new BigDecimal("-5"));
        when(insumoRepository.existsByNombreInsumoIgnoreCaseAndIdInsumoNot(any(), any())).thenReturn(false);

        SolicitudInvalidaException ex = assertThrows(SolicitudInvalidaException.class,
                () -> insumoService.guardar(i, 1));
        assertTrue(ex.getMessage().toLowerCase().contains("stock mínimo") || ex.getMessage().toLowerCase().contains("stock minimo"));
        verify(insumoRepository, never()).save(any());
    }

    @Test
    @DisplayName("stock empaquetado negativo se rechaza")
    void guardar_stockEmpaquetadoNegativo_seRechaza() {
        Insumo i = insumo("Insumo X", BigDecimal.TEN, BigDecimal.ONE, BigDecimal.ZERO);
        i.setStockEmpaquetado(new BigDecimal("-2"));
        when(insumoRepository.existsByNombreInsumoIgnoreCaseAndIdInsumoNot(any(), any())).thenReturn(false);

        assertThrows(SolicitudInvalidaException.class, () -> insumoService.guardar(i, 1));
        verify(insumoRepository, never()).save(any());
    }

    @Test
    @DisplayName("factor de conversión igual a cero se rechaza")
    void guardar_factorConversionCero_seRechaza() {
        Insumo i = insumo("Insumo X", BigDecimal.TEN, BigDecimal.ONE, BigDecimal.ZERO);
        i.setFactorConversion(BigDecimal.ZERO);
        when(insumoRepository.existsByNombreInsumoIgnoreCaseAndIdInsumoNot(any(), any())).thenReturn(false);

        assertThrows(SolicitudInvalidaException.class, () -> insumoService.guardar(i, 1));
        verify(insumoRepository, never()).save(any());
    }

    @Test
    @DisplayName("unidad suelta igual a unidad de empaque se rechaza")
    void guardar_unidadSueltaIgualUnidadCompra_seRechaza() {
        Insumo i = insumo("Insumo X", BigDecimal.TEN, BigDecimal.ONE, BigDecimal.ZERO);
        i.setUnidadMedida(new UnidadMedida(1, "Hoja"));
        i.setUnidadCompra(new UnidadMedida(2, " hoja "));
        when(insumoRepository.existsByNombreInsumoIgnoreCaseAndIdInsumoNot(any(), any())).thenReturn(false);

        assertThrows(SolicitudInvalidaException.class, () -> insumoService.guardar(i, 1));
        verify(insumoRepository, never()).save(any());
    }

    @Test
    @DisplayName("guardar: datos válidos (alta) persiste el insumo sin exigir usuario logueado")
    void guardar_altaConDatosValidos_persisteElInsumo() {
        Insumo i = insumo("Insumo Nuevo", BigDecimal.TEN, BigDecimal.ONE, BigDecimal.ZERO);
        when(insumoRepository.existsByNombreInsumoIgnoreCaseAndIdInsumoNot("Insumo Nuevo", -1)).thenReturn(false);
        when(insumoRepository.save(any(Insumo.class))).thenAnswer(inv -> inv.getArgument(0));

        Insumo resultado = insumoService.guardar(i, null);

        assertEquals("Insumo Nuevo", resultado.getNombreInsumo());
        verifyNoInteractions(usuarioRepository);
    }


    @Test
    @DisplayName("CORREGIDO: al editar sin un idUsuario logueado ya no se atribuye la auditoría en silencio al primer usuario de la tabla, se rechaza")
    void guardar_edicionSinIdUsuario_yaNoCaeAlPrimerUsuarioDeLaTabla() {
        Insumo i = insumo("Insumo Editado", BigDecimal.TEN, BigDecimal.ONE, BigDecimal.ZERO);
        i.setIdInsumo(5);
        when(insumoRepository.existsByNombreInsumoIgnoreCaseAndIdInsumoNot("Insumo Editado", 5)).thenReturn(false);
        when(insumoRepository.existsById(5)).thenReturn(true);
        when(insumoRepository.findById(5)).thenReturn(Optional.of(insumo("Insumo Editado", BigDecimal.ONE, BigDecimal.ZERO, BigDecimal.ZERO)));

        SolicitudInvalidaException ex = assertThrows(SolicitudInvalidaException.class,
                () -> insumoService.guardar(i, null));
        assertTrue(ex.getMessage().toLowerCase().contains("usuario"));
        verify(usuarioRepository, never()).findAll();
        verify(insumoRepository, never()).save(any());
    }

    @Test
    @DisplayName("CORREGIDO: al editar con un idUsuario que no existe en la base, se rechaza en vez de caer al primer usuario de la tabla")
    void guardar_edicionConIdUsuarioInexistente_seRechaza() {
        Insumo i = insumo("Insumo Editado", BigDecimal.TEN, BigDecimal.ONE, BigDecimal.ZERO);
        i.setIdInsumo(5);
        when(insumoRepository.existsByNombreInsumoIgnoreCaseAndIdInsumoNot("Insumo Editado", 5)).thenReturn(false);
        when(insumoRepository.existsById(5)).thenReturn(true);
        when(insumoRepository.findById(5)).thenReturn(Optional.of(insumo("Insumo Editado", BigDecimal.ONE, BigDecimal.ZERO, BigDecimal.ZERO)));
        when(usuarioRepository.findById(99)).thenReturn(Optional.empty());

        assertThrows(SolicitudInvalidaException.class, () -> insumoService.guardar(i, 99));
        verify(usuarioRepository, never()).findAll();
        verify(insumoRepository, never()).save(any());
    }

    @Test
    @DisplayName("guardar: al editar con un idUsuario válido, la auditoría usa ESE usuario")
    void guardar_edicionConIdUsuarioValido_usaEseUsuarioParaLaAuditoria() {
        Insumo i = insumo("Insumo Editado", new BigDecimal("20"), BigDecimal.ONE, BigDecimal.ZERO);
        i.setIdInsumo(5);
        when(insumoRepository.existsByNombreInsumoIgnoreCaseAndIdInsumoNot("Insumo Editado", 5)).thenReturn(false);
        when(insumoRepository.existsById(5)).thenReturn(true);
        when(insumoRepository.findById(5)).thenReturn(Optional.of(insumo("Insumo Editado", new BigDecimal("10"), BigDecimal.ZERO, BigDecimal.ZERO)));
        when(usuarioRepository.findById(3)).thenReturn(Optional.of(usuario(3)));
        when(insumoRepository.save(any(Insumo.class))).thenAnswer(inv -> inv.getArgument(0));

        insumoService.guardar(i, 3);

        verify(usuarioRepository).findById(3);
        verify(usuarioRepository, never()).findAll();
        verify(registroActividadService, atLeastOnce()).registrarCambio(
                eq(usuario(3)), eq("UPDATE"), eq("Insumo"), eq("precio"), eq(5), any(), any());
    }


    @Test
    @DisplayName("convertirStock: cantidad de bultos <= 0 se rechaza")
    void convertirStock_cantidadInvalida_seRechaza() {
        assertThrows(SolicitudInvalidaException.class,
                () -> insumoService.convertirStock(1, BigDecimal.ZERO, 1));
        verifyNoInteractions(insumoRepository);
    }

    @Test
    @DisplayName("convertirStock: sin factor de conversión configurado se rechaza")
    void convertirStock_sinFactorConversion_seRechaza() {
        Insumo i = insumo("Insumo X", BigDecimal.TEN, BigDecimal.ONE, BigDecimal.ZERO);
        i.setIdInsumo(1);
        when(insumoRepository.findById(1)).thenReturn(Optional.of(i));

        assertThrows(SolicitudInvalidaException.class,
                () -> insumoService.convertirStock(1, BigDecimal.ONE, 1));
    }

    @Test
    @DisplayName("convertirStock: stock empaquetado insuficiente se rechaza")
    void convertirStock_stockInsuficiente_seRechaza() {
        Insumo i = insumo("Insumo X", BigDecimal.TEN, BigDecimal.ONE, BigDecimal.ZERO);
        i.setIdInsumo(1);
        i.setFactorConversion(new BigDecimal("500"));
        i.setStockEmpaquetado(new BigDecimal("2"));
        when(insumoRepository.findById(1)).thenReturn(Optional.of(i));

        assertThrows(SolicitudInvalidaException.class,
                () -> insumoService.convertirStock(1, new BigDecimal("3"), 1));
    }

    @Test
    @DisplayName("CORREGIDO: convertirStock sin un idUsuario logueado ya no atribuye la auditoría al primer usuario de la tabla, se rechaza")
    void convertirStock_sinIdUsuario_seRechaza() {
        Insumo i = insumo("Insumo X", BigDecimal.TEN, new BigDecimal("100"), BigDecimal.ZERO);
        i.setIdInsumo(1);
        i.setFactorConversion(new BigDecimal("500"));
        i.setStockEmpaquetado(new BigDecimal("5"));
        when(insumoRepository.findById(1)).thenReturn(Optional.of(i));

        assertThrows(SolicitudInvalidaException.class,
                () -> insumoService.convertirStock(1, new BigDecimal("2"), null));
        verify(usuarioRepository, never()).findAll();
        verify(insumoRepository, never()).save(any());
    }

    @Test
    @DisplayName("convertirStock: con datos válidos, mueve stock de empaquetado a suelto correctamente")
    void convertirStock_datosValidos_actualizaStocks() {
        Insumo i = insumo("Insumo X", BigDecimal.TEN, new BigDecimal("100"), BigDecimal.ZERO);
        i.setIdInsumo(1);
        i.setFactorConversion(new BigDecimal("500"));
        i.setStockEmpaquetado(new BigDecimal("5"));
        when(insumoRepository.findById(1)).thenReturn(Optional.of(i));
        when(usuarioRepository.findById(1)).thenReturn(Optional.of(usuario(1)));
        when(insumoRepository.save(any(Insumo.class))).thenAnswer(inv -> inv.getArgument(0));

        Insumo resultado = insumoService.convertirStock(1, new BigDecimal("2"), 1);

        assertEquals(new BigDecimal("3"), resultado.getStockEmpaquetado());
        assertEquals(0, new BigDecimal("1100").compareTo(resultado.getStockActual()));
    }


    @Test
    @DisplayName("CORREGIDO: actualizarMasivo sin un idUsuario logueado ya no atribuye la auditoría al primer usuario de la tabla, se rechaza")
    void actualizarMasivo_sinIdUsuario_seRechaza() {
        Insumo i = insumo("Insumo X", BigDecimal.TEN, BigDecimal.ONE, BigDecimal.ZERO);
        i.setIdInsumo(1);
        when(insumoRepository.findAll()).thenReturn(List.of(i));

        assertThrows(SolicitudInvalidaException.class,
                () -> insumoService.actualizarMasivo(10.0, null, null, "TODOS", null));
        verify(usuarioRepository, never()).findAll();
        verify(insumoRepository, never()).saveAll(any());
    }

    @Test
    @DisplayName("actualizarMasivo: selección manual vacía no modifica nada ni exige usuario")
    void actualizarMasivo_seleccionVacia_noHaceNada() {
        insumoService.actualizarMasivo(10.0, null, List.of(), "SELECCION", null);

        verifyNoInteractions(usuarioRepository, registroActividadService);
        verify(insumoRepository, never()).saveAll(any());
    }

    @Test
    @DisplayName("actualizarMasivo: un descuento no deja el precio en negativo, se clampea a cero")
    void actualizarMasivo_descuentoMayorAlPrecio_seClampeaACero() {
        Insumo i = insumo("Insumo X", new BigDecimal("10.00"), BigDecimal.ONE, BigDecimal.ZERO);
        i.setIdInsumo(1);
        when(insumoRepository.findAll()).thenReturn(List.of(i));
        when(usuarioRepository.findById(1)).thenReturn(Optional.of(usuario(1)));
        when(insumoRepository.saveAll(any())).thenAnswer(inv -> inv.getArgument(0));

        insumoService.actualizarMasivo(-150.0, null, null, "TODOS", 1);

        assertEquals(0, BigDecimal.ZERO.compareTo(i.getPrecio()));
    }
}
