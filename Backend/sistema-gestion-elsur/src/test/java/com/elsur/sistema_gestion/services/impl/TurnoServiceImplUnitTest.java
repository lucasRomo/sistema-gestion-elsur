package com.elsur.sistema_gestion.services.impl;

import com.elsur.sistema_gestion.exceptions.RecursoDuplicadoException;
import com.elsur.sistema_gestion.exceptions.RecursoNoEncontradoException;
import com.elsur.sistema_gestion.exceptions.SolicitudInvalidaException;
import com.elsur.sistema_gestion.models.EstadoTurno;
import com.elsur.sistema_gestion.models.MovimientoCaja;
import com.elsur.sistema_gestion.models.Turno;
import com.elsur.sistema_gestion.models.Usuario;
import com.elsur.sistema_gestion.repositories.MovimientoCajaRepository;
import com.elsur.sistema_gestion.repositories.TurnoRepository;
import com.elsur.sistema_gestion.repositories.UsuarioRepository;
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
class TurnoServiceImplUnitTest {

    @Mock private TurnoRepository turnoRepository;
    @Mock private MovimientoCajaRepository movimientoCajaRepository;
    @Mock private UsuarioRepository usuarioRepository;

    @InjectMocks
    private TurnoServiceImpl turnoService;

    private MovimientoCaja movimiento(String tipo, double monto) {
        MovimientoCaja m = new MovimientoCaja();
        m.setTipoMovimiento(tipo);
        m.setMonto(BigDecimal.valueOf(monto));
        return m;
    }


    @Test
    @DisplayName("Abrir un turno sin ningún turno abierto lo crea en estado ABIERTO con montoEsperadoSistema = montoInicial")
    void abrirTurno_sinTurnoAbierto_creaConEstadoAbiertoYMontoEsperadoIgualAlInicial() {
        when(turnoRepository.findFirstByEstado(EstadoTurno.ABIERTO)).thenReturn(Optional.empty());
        when(turnoRepository.save(any(Turno.class))).thenAnswer(inv -> inv.getArgument(0));

        Turno turno = new Turno();
        turno.setMontoInicial(5000.0);

        Turno resultado = turnoService.abrirTurno(turno);

        assertEquals(EstadoTurno.ABIERTO, resultado.getEstado());
        assertEquals(5000.0, resultado.getMontoEsperadoSistema());
        assertEquals(0.0, resultado.getDiferenciaArqueo());
        assertNotNull(resultado.getFechaApertura());
    }

    @Test
    @DisplayName("Abrir un turno cuando ya existe uno ABIERTO lanza RecursoDuplicadoException")
    void abrirTurno_yaHayUnoAbierto_lanzaRecursoDuplicadoException() {
        Turno abierto = new Turno();
        abierto.setEstado(EstadoTurno.ABIERTO);
        when(turnoRepository.findFirstByEstado(EstadoTurno.ABIERTO)).thenReturn(Optional.of(abierto));

        Turno nuevo = new Turno();
        nuevo.setMontoInicial(1000.0);

        assertThrows(RecursoDuplicadoException.class, () -> turnoService.abrirTurno(nuevo));
        verify(turnoRepository, never()).save(any(Turno.class));
    }

    @Test
    @DisplayName("FIX: abrirTurno() ahora rechaza un monto inicial negativo con SolicitudInvalidaException")
    void abrirTurno_montoInicialNegativo_seRechaza() {
        when(turnoRepository.findFirstByEstado(EstadoTurno.ABIERTO)).thenReturn(Optional.empty());

        Turno turno = new Turno();
        turno.setMontoInicial(-500.0);

        assertThrows(SolicitudInvalidaException.class, () -> turnoService.abrirTurno(turno));
        verify(turnoRepository, never()).save(any(Turno.class));

    }

    @Test
    @DisplayName("FIX: abrirTurno() también rechaza un monto inicial nulo")
    void abrirTurno_montoInicialNulo_seRechaza() {
        when(turnoRepository.findFirstByEstado(EstadoTurno.ABIERTO)).thenReturn(Optional.empty());

        Turno turno = new Turno();
        turno.setMontoInicial(null);

        assertThrows(SolicitudInvalidaException.class, () -> turnoService.abrirTurno(turno));
    }


    @Test
    @DisplayName("Cerrar un turno inexistente lanza RecursoNoEncontradoException")
    void cerrarTurno_idInexistente_lanzaRecursoNoEncontradoException() {
        when(turnoRepository.findById(999)).thenReturn(Optional.empty());

        assertThrows(RecursoNoEncontradoException.class,
                () -> turnoService.cerrarTurno(999, 100.0, "obs", 1));
    }

    @Test
    @DisplayName("Cerrar un turno calcula el monto esperado y la diferencia de arqueo a partir de sus movimientos")
    void cerrarTurno_calculaEsperadoYDiferenciaCorrectamente() {
        Turno turno = new Turno();
        turno.setIdTurno(10);
        turno.setMontoInicial(1000.0);
        turno.setEstado(EstadoTurno.ABIERTO);

        when(turnoRepository.findById(10)).thenReturn(Optional.of(turno));
        when(movimientoCajaRepository.findByTurno_IdTurno(10)).thenReturn(List.of(
                movimiento("INGRESO", 500.0),
                movimiento("INGRESO", 300.0),
                movimiento("EGRESO", 200.0)
        ));
        when(turnoRepository.save(any(Turno.class))).thenAnswer(inv -> inv.getArgument(0));

        Turno resultado = turnoService.cerrarTurno(10, 1600.0, "Cierre normal", null);

        assertEquals(1600.0, resultado.getMontoEsperadoSistema());
        assertEquals(0.0, resultado.getDiferenciaArqueo());
        assertEquals(EstadoTurno.CERRADO, resultado.getEstado());
        assertNotNull(resultado.getFechaCierre());
    }

    @Test
    @DisplayName("FIX: cerrarTurno() ahora filtra tipoMovimiento sin distinguir mayúsculas/minúsculas, igual que MovimientoCajaServiceImpl.calcularTotales()")
    void cerrarTurno_movimientoConTipoMovimientoEnMinuscula_ahoraSiSeCuenta() {
        Turno turno = new Turno();
        turno.setIdTurno(11);
        turno.setMontoInicial(1000.0);
        turno.setEstado(EstadoTurno.ABIERTO);

        when(turnoRepository.findById(11)).thenReturn(Optional.of(turno));

        when(movimientoCajaRepository.findByTurno_IdTurno(11)).thenReturn(List.of(
                movimiento("ingreso", 500.0)
        ));
        when(turnoRepository.save(any(Turno.class))).thenAnswer(inv -> inv.getArgument(0));

        Turno resultado = turnoService.cerrarTurno(11, 1500.0, null, null);


        assertEquals(1500.0, resultado.getMontoEsperadoSistema(), "El ingreso en minúscula ahora sí se suma al cálculo de cierre");
        assertEquals(0.0, resultado.getDiferenciaArqueo());
    }

    @Test
    @DisplayName("FIX: cerrarTurno() ahora rechaza un montoReal null o NaN en vez de propagarlo a diferenciaArqueo")
    void cerrarTurno_montoRealNaNoNulo_seRechaza() {
        Turno turnoAbierto = new Turno();
        turnoAbierto.setIdTurno(12);
        turnoAbierto.setMontoInicial(1000.0);
        turnoAbierto.setEstado(EstadoTurno.ABIERTO);

        when(turnoRepository.findById(12)).thenReturn(Optional.of(turnoAbierto));


        assertThrows(SolicitudInvalidaException.class, () -> turnoService.cerrarTurno(12, Double.NaN, null, null));
        assertThrows(SolicitudInvalidaException.class, () -> turnoService.cerrarTurno(12, null, null, null));
        verify(turnoRepository, never()).save(any(Turno.class));
    }

    @Test
    @DisplayName("Un idUsuario inexistente no lanza excepción al cerrar el turno -- queda sin usuario asignado, en silencio")
    void cerrarTurno_usuarioInexistente_noLanzaExcepcion_quedaSinUsuarioAsignado() {
        Turno turno = new Turno();
        turno.setIdTurno(13);
        turno.setMontoInicial(1000.0);
        turno.setEstado(EstadoTurno.ABIERTO);

        when(turnoRepository.findById(13)).thenReturn(Optional.of(turno));
        when(movimientoCajaRepository.findByTurno_IdTurno(13)).thenReturn(List.of());
        when(usuarioRepository.findById(999)).thenReturn(Optional.empty());
        when(turnoRepository.save(any(Turno.class))).thenAnswer(inv -> inv.getArgument(0));

        Turno resultado = assertDoesNotThrow(() -> turnoService.cerrarTurno(13, 1000.0, null, 999));

        assertNull(resultado.getUsuario());
    }

    @Test
    @DisplayName("FIX: cerrarTurno() ahora rechaza un turno que ya estaba CERRADO, preservando su arqueo original")
    void cerrarTurno_turnoYaCerrado_seRechazaYPreservaElArqueoOriginal() {
        Turno turnoYaCerrado = new Turno();
        turnoYaCerrado.setIdTurno(14);
        turnoYaCerrado.setMontoInicial(1000.0);
        turnoYaCerrado.setEstado(EstadoTurno.CERRADO);
        turnoYaCerrado.setMontoRealContado(1200.0);
        turnoYaCerrado.setDiferenciaArqueo(200.0);

        when(turnoRepository.findById(14)).thenReturn(Optional.of(turnoYaCerrado));


        assertThrows(SolicitudInvalidaException.class,
                () -> turnoService.cerrarTurno(14, 5000.0, "segundo cierre", null));

        verify(turnoRepository, never()).save(any(Turno.class));
        assertEquals(200.0, turnoYaCerrado.getDiferenciaArqueo(), "El arqueo original no debe modificarse");
        assertEquals(1200.0, turnoYaCerrado.getMontoRealContado());
    }


    @Test
    @DisplayName("obtenerTurnoAbiertoHoy() en realidad no filtra por fecha -- devuelve el primer turno ABIERTO sin importar cuándo se abrió")
    void obtenerTurnoAbiertoHoy_delegaEnFindFirstByEstado_sinFiltrarPorFechaActual() {
        Turno turnoDeAyer = new Turno();
        turnoDeAyer.setIdTurno(20);
        turnoDeAyer.setEstado(EstadoTurno.ABIERTO);
        turnoDeAyer.setFechaApertura(java.time.LocalDateTime.now().minusDays(1));

        when(turnoRepository.findFirstByEstado(EstadoTurno.ABIERTO)).thenReturn(Optional.of(turnoDeAyer));

        Optional<Turno> resultado = turnoService.obtenerTurnoAbiertoHoy();

        assertTrue(resultado.isPresent());
        assertEquals(20, resultado.get().getIdTurno());

    }

    @Test
    @DisplayName("existeTurnoAbiertoHoy() es simplemente obtenerTurnoAbiertoHoy().isPresent()")
    void existeTurnoAbiertoHoy_reflejaSiHayAlgunTurnoAbierto() {
        when(turnoRepository.findFirstByEstado(EstadoTurno.ABIERTO)).thenReturn(Optional.empty());
        assertFalse(turnoService.existeTurnoAbiertoHoy());

        Turno t = new Turno();
        t.setEstado(EstadoTurno.ABIERTO);
        when(turnoRepository.findFirstByEstado(EstadoTurno.ABIERTO)).thenReturn(Optional.of(t));
        assertTrue(turnoService.existeTurnoAbiertoHoy());
    }
}
