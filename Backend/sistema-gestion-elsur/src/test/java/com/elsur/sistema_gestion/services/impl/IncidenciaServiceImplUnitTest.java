package com.elsur.sistema_gestion.services.impl;

import com.elsur.sistema_gestion.exceptions.RecursoNoEncontradoException;
import com.elsur.sistema_gestion.exceptions.SolicitudInvalidaException;
import com.elsur.sistema_gestion.models.*;
import com.elsur.sistema_gestion.repositories.*;
import com.elsur.sistema_gestion.services.MovimientoCajaService;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class IncidenciaServiceImplUnitTest {

    @Mock private IncidenciaRepository incidenciaRepository;
    @Mock private MaquinaRepository maquinaRepository;
    @Mock private EmpleadoRepository empleadoRepository;
    @Mock private UsuarioRepository usuarioRepository;
    @Mock private TurnoRepository turnoRepository;
    @Mock private MovimientoCajaRepository movimientoCajaRepository;
    @Mock private MovimientoCajaService movimientoCajaService;

    @InjectMocks
    private IncidenciaServiceImpl service;

    private Maquina maquina(Integer id, String estado) {
        Maquina m = new Maquina();
        m.setIdMaquina(id);
        m.setNombre("Impresora Offset 1");
        m.setEstado(estado);
        return m;
    }

    private Incidencia incidencia(Integer id, Maquina maquina, String estadoIncidencia) {
        Incidencia i = new Incidencia();
        i.setIdIncidencia(id);
        i.setMaquina(maquina);
        i.setDescripcion("Se traba el rodillo");
        i.setEstadoIncidencia(estadoIncidencia);
        return i;
    }

    private Turno turnoAbierto() {
        Turno t = new Turno();
        t.setEstado(EstadoTurno.ABIERTO);
        return t;
    }


    @Test
    @DisplayName("CORREGIDO: registrarFalla sobre una máquina inexistente lanza RecursoNoEncontradoException (antes RuntimeException genérica)")
    void registrarFalla_maquinaInexistente_lanzaRecursoNoEncontrado() {
        when(maquinaRepository.findById(99)).thenReturn(Optional.empty());
        assertThrows(RecursoNoEncontradoException.class,
                () -> service.registrarFalla(99, "Se rompió", "ALTA", null));
        verify(incidenciaRepository, never()).save(any());
    }


    @Test
    @DisplayName("CORREGIDO: ponerEnMantenimiento sin nota se rechaza (antes se podía saltear vía llamada directa a la API)")
    void ponerEnMantenimiento_sinNota_seRechaza() {
        assertThrows(SolicitudInvalidaException.class,
                () -> service.ponerEnMantenimiento(1, "   ", 5));
        verify(incidenciaRepository, never()).findById(any());
    }

    @Test
    @DisplayName("CORREGIDO: ponerEnMantenimiento sobre una incidencia inexistente lanza RecursoNoEncontradoException")
    void ponerEnMantenimiento_incidenciaInexistente_lanzaRecursoNoEncontrado() {
        when(incidenciaRepository.findById(99)).thenReturn(Optional.empty());
        assertThrows(RecursoNoEncontradoException.class,
                () -> service.ponerEnMantenimiento(99, "Se envía a service técnico", 5));
    }

    @Test
    @DisplayName("ponerEnMantenimiento: caso válido actualiza la incidencia y pasa la máquina a MANTENIMIENTO")
    void ponerEnMantenimiento_valido_actualizaEstados() {
        Maquina m = maquina(1, "FUERA DE SERVICIO");
        Incidencia inc = incidencia(10, m, "PENDIENTE");
        when(incidenciaRepository.findById(10)).thenReturn(Optional.of(inc));
        when(incidenciaRepository.save(any(Incidencia.class))).thenAnswer(i -> i.getArgument(0));

        service.ponerEnMantenimiento(10, "Se envía a service técnico", null);

        assertEquals("MANTENIMIENTO", inc.getEstadoIncidencia());
        assertEquals("MANTENIMIENTO", m.getEstado());
        verify(maquinaRepository).save(m);
    }


    @Test
    @DisplayName("CORREGIDO: resolverIncidencia sin detalle de resolución se rechaza")
    void resolverIncidencia_sinResolucion_seRechaza() {
        assertThrows(SolicitudInvalidaException.class,
                () -> service.resolverIncidencia(1, "", 5));
        verify(incidenciaRepository, never()).findById(any());
    }

    @Test
    @DisplayName("CORREGIDO: resolverIncidencia sobre una incidencia inexistente lanza RecursoNoEncontradoException")
    void resolverIncidencia_incidenciaInexistente_lanzaRecursoNoEncontrado() {
        when(incidenciaRepository.findById(99)).thenReturn(Optional.empty());
        assertThrows(RecursoNoEncontradoException.class,
                () -> service.resolverIncidencia(99, "Reparación finalizada", 5));
    }

    @Test
    @DisplayName("resolverIncidencia: sin más incidencias pendientes, la máquina vuelve a OPERATIVA")
    void resolverIncidencia_sinPendientes_maquinaVuelveAOperativa() {
        Maquina m = maquina(1, "MANTENIMIENTO");
        Incidencia inc = incidencia(10, m, "MANTENIMIENTO");
        when(incidenciaRepository.findById(10)).thenReturn(Optional.of(inc));
        when(incidenciaRepository.findByMaquinaIdMaquinaAndEstadoIncidencia(1, "PENDIENTE"))
                .thenReturn(List.of(inc));
        when(incidenciaRepository.save(any(Incidencia.class))).thenAnswer(i -> i.getArgument(0));

        service.resolverIncidencia(10, "Reparación finalizada, equipo probado", null);

        assertEquals("RESUELTA", inc.getEstadoIncidencia());
        assertEquals("OPERATIVA", m.getEstado());
    }


    @Test
    @DisplayName("CORREGIDO: registrarPagoMantenimiento sobre una incidencia inexistente lanza RecursoNoEncontradoException (antes RuntimeException genérica)")
    void registrarPagoMantenimiento_incidenciaInexistente_lanzaRecursoNoEncontrado() {
        when(incidenciaRepository.findById(99)).thenReturn(Optional.empty());
        assertThrows(RecursoNoEncontradoException.class,
                () -> service.registrarPagoMantenimiento(99, new BigDecimal("100"), "EFECTIVO", "desc", 5, false, null));
    }

    @Test
    @DisplayName("CORREGIDO -- HALLAZGO: registrarPagoMantenimiento con monto nulo o <= 0 se rechaza (antes no validaba nada)")
    void registrarPagoMantenimiento_montoInvalido_seRechaza() {
        Incidencia inc = incidencia(10, maquina(1, "FUERA DE SERVICIO"), "PENDIENTE");
        when(incidenciaRepository.findById(10)).thenReturn(Optional.of(inc));

        assertThrows(SolicitudInvalidaException.class,
                () -> service.registrarPagoMantenimiento(10, BigDecimal.ZERO, "EFECTIVO", "desc", 5, false, null));
        assertThrows(SolicitudInvalidaException.class,
                () -> service.registrarPagoMantenimiento(10, null, "EFECTIVO", "desc", 5, false, null));
        verify(turnoRepository, never()).findTopByEstadoOrderByFechaAperturaDesc(any());
    }

    @Test
    @DisplayName("CORREGIDO -- HALLAZGO: registrarPagoMantenimiento sin idUsuario se rechaza en vez de reventar contra findById(null)")
    void registrarPagoMantenimiento_sinIdUsuario_seRechaza() {
        Incidencia inc = incidencia(10, maquina(1, "FUERA DE SERVICIO"), "PENDIENTE");
        when(incidenciaRepository.findById(10)).thenReturn(Optional.of(inc));

        assertThrows(SolicitudInvalidaException.class,
                () -> service.registrarPagoMantenimiento(10, new BigDecimal("100"), "EFECTIVO", "desc", null, false, null));
        verify(usuarioRepository, never()).findById(any());
    }

    @Test
    @DisplayName("registrarPagoMantenimiento: con la caja cerrada se lanza IllegalStateException prefijada CAJA_CERRADA (sin cambios de comportamiento)")
    void registrarPagoMantenimiento_cajaCerrada_lanzaIllegalState() {
        Incidencia inc = incidencia(10, maquina(1, "FUERA DE SERVICIO"), "PENDIENTE");
        when(incidenciaRepository.findById(10)).thenReturn(Optional.of(inc));
        when(turnoRepository.findTopByEstadoOrderByFechaAperturaDesc(EstadoTurno.ABIERTO))
                .thenReturn(Optional.empty());

        IllegalStateException ex = assertThrows(IllegalStateException.class,
                () -> service.registrarPagoMantenimiento(10, new BigDecimal("100"), "EFECTIVO", "desc", 5, false, null));
        assertTrue(ex.getMessage().startsWith("CAJA_CERRADA"));
    }

    @Test
    @DisplayName("registrarPagoMantenimiento: saldo insuficiente en efectivo sin forzar lanza IllegalArgumentException prefijada SALDO_INSUFFICIENT")
    void registrarPagoMantenimiento_saldoInsuficiente_lanzaIllegalArgument() {
        Incidencia inc = incidencia(10, maquina(1, "FUERA DE SERVICIO"), "PENDIENTE");
        when(incidenciaRepository.findById(10)).thenReturn(Optional.of(inc));
        when(turnoRepository.findTopByEstadoOrderByFechaAperturaDesc(EstadoTurno.ABIERTO))
                .thenReturn(Optional.of(turnoAbierto()));
        when(movimientoCajaService.calcularTotalesDelDia()).thenReturn(Map.of("saldoActual", 50.0));

        IllegalArgumentException ex = assertThrows(IllegalArgumentException.class,
                () -> service.registrarPagoMantenimiento(10, new BigDecimal("100"), "EFECTIVO", "desc", 5, false, null));
        assertTrue(ex.getMessage().startsWith("SALDO_INSUFFICIENT"));
    }

    @Test
    @DisplayName("CORREGIDO: registrarPagoMantenimiento con un idUsuario que no existe se rechaza con SolicitudInvalidaException (antes RuntimeException genérica)")
    void registrarPagoMantenimiento_usuarioInexistente_seRechaza() {
        Incidencia inc = incidencia(10, maquina(1, "FUERA DE SERVICIO"), "PENDIENTE");
        when(incidenciaRepository.findById(10)).thenReturn(Optional.of(inc));
        when(turnoRepository.findTopByEstadoOrderByFechaAperturaDesc(EstadoTurno.ABIERTO))
                .thenReturn(Optional.of(turnoAbierto()));
        when(movimientoCajaService.calcularTotalesDelDia()).thenReturn(Map.of("saldoActual", 5000.0));
        when(usuarioRepository.findById(999)).thenReturn(Optional.empty());

        assertThrows(SolicitudInvalidaException.class,
                () -> service.registrarPagoMantenimiento(10, new BigDecimal("100"), "EFECTIVO", "desc", 999, false, null));
    }

    @Test
    @DisplayName("registrarPagoMantenimiento: caso válido marca la incidencia como pagada y registra el movimiento de caja")
    void registrarPagoMantenimiento_valido_registraElPago() {
        Incidencia inc = incidencia(10, maquina(1, "FUERA DE SERVICIO"), "PENDIENTE");
        when(incidenciaRepository.findById(10)).thenReturn(Optional.of(inc));
        when(turnoRepository.findTopByEstadoOrderByFechaAperturaDesc(EstadoTurno.ABIERTO))
                .thenReturn(Optional.of(turnoAbierto()));
        when(movimientoCajaService.calcularTotalesDelDia()).thenReturn(Map.of("saldoActual", 5000.0));
        when(usuarioRepository.findById(5)).thenReturn(Optional.of(new Usuario()));
        when(incidenciaRepository.save(any(Incidencia.class))).thenAnswer(i -> i.getArgument(0));
        when(movimientoCajaRepository.save(any(MovimientoCaja.class))).thenAnswer(i -> i.getArgument(0));

        MovimientoCaja resultado = service.registrarPagoMantenimiento(
                10, new BigDecimal("300"), "EFECTIVO", "Pago reparación", 5, false, null);

        assertTrue(inc.getPagado());
        assertEquals(0, new BigDecimal("300").compareTo(inc.getMontoPagado()));
        assertEquals("EGRESO", resultado.getTipoMovimiento());
        assertEquals("EGRESO_MANTENIMIENTO", resultado.getCategoria());
        verify(movimientoCajaRepository).save(any(MovimientoCaja.class));
    }
}
