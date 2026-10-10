package com.elsur.sistema_gestion.services;

import com.elsur.sistema_gestion.models.EstadoTurno;
import com.elsur.sistema_gestion.models.Turno;
import com.elsur.sistema_gestion.repositories.TurnoRepository;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;

import static org.junit.jupiter.api.Assertions.*;

// Cierre automático de caja: una caja abierta un día anterior se cierra a la medianoche
// siguiente a su apertura; la del día de hoy sigue abierta.
@SpringBootTest
@Transactional
class CierreAutomaticoCajaIntegrationTest {

    @Autowired private TurnoService turnoService;
    @Autowired private TurnoRepository turnoRepository;

    private Turno turnoAbierto(LocalDateTime apertura, double montoInicial) {
        Turno t = new Turno();
        t.setFechaApertura(apertura);
        t.setMontoInicial(montoInicial);
        t.setEstado(EstadoTurno.ABIERTO);
        return turnoRepository.save(t);
    }

    @Test
    @DisplayName("La caja de ayer se cierra sola a medianoche y queda marcada como cierre automático")
    void cajaDeAyerSeCierra() {
        turnoRepository.findAll().stream().filter(t -> t.getEstado() == EstadoTurno.ABIERTO)
                .forEach(t -> { t.setEstado(EstadoTurno.CERRADO); turnoRepository.save(t); });
        LocalDateTime ayer = LocalDate.now().minusDays(1).atTime(9, 30);
        Turno viejo = turnoAbierto(ayer, 5000.0);

        int cerradas = turnoService.cerrarTurnosVencidos();

        Turno cerrado = turnoRepository.findById(viejo.getIdTurno()).orElseThrow();
        assertEquals(1, cerradas);
        assertEquals(EstadoTurno.CERRADO, cerrado.getEstado());
        assertEquals(LocalDate.now().atStartOfDay(), cerrado.getFechaCierre());
        assertEquals(Boolean.TRUE, cerrado.getCierreAutomatico());
        assertEquals(5000.0, cerrado.getMontoEsperadoSistema());
        assertEquals(0.0, cerrado.getDiferenciaArqueo());
        assertTrue(turnoService.obtenerTurnoAbiertoHoy().isEmpty());
    }

    @Test
    @DisplayName("La caja abierta hoy no se toca")
    void cajaDeHoySigueAbierta() {
        turnoRepository.findAll().stream().filter(t -> t.getEstado() == EstadoTurno.ABIERTO)
                .forEach(t -> { t.setEstado(EstadoTurno.CERRADO); turnoRepository.save(t); });
        Turno hoy = turnoAbierto(LocalDateTime.now(), 1000.0);

        assertEquals(0, turnoService.cerrarTurnosVencidos());
        assertEquals(EstadoTurno.ABIERTO, turnoRepository.findById(hoy.getIdTurno()).orElseThrow().getEstado());
    }
}
