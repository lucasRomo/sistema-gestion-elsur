package com.elsur.sistema_gestion.controllers;

import com.elsur.sistema_gestion.exceptions.SolicitudInvalidaException;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.jdbc.core.JdbcTemplate;

import java.math.BigDecimal;
import java.time.LocalDate;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

/**
 * Tests UNITARIOS (caja blanca, Mockito) de InformesController.
 *
 * HALLAZGO PRINCIPAL (CORREGIDO en este pase): el único endpoint de este
 * controller (GET /api/informes/dashboard) envolvía TODA su lógica en un
 * catch (Exception e) que, ante cualquier falla -- fecha mal formada, error
 * de conexión a la base, etc. -- devolvía 200 OK con métricas en cero,
 * indistinguible de "no hay datos en el rango". Se detectó además que este
 * endpoint no es consumido por ningún lugar del frontend (el dashboard de
 * Informes calcula todo client-side vía informesUtils.procesarMetricas), por
 * lo que hasta ahora este bug pasaba inadvertido en la práctica. Se corrige
 * igual porque forma parte del API público del backend.
 */
@ExtendWith(MockitoExtension.class)
class InformesControllerUnitTest {

    @Mock
    private JdbcTemplate jdbcTemplate;

    @InjectMocks
    private InformesController controller;

    @Test
    @DisplayName("CORREGIDO: fecha 'desde' con formato inválido lanza SolicitudInvalidaException en vez de devolver 200 con métricas en cero")
    void getDashboardInfo_fechaDesdeInvalida_lanzaSolicitudInvalida() {
        assertThrows(SolicitudInvalidaException.class,
                () -> controller.getDashboardInfo("no-es-una-fecha", "2026-01-31"));
        verifyNoInteractions(jdbcTemplate);
    }

    @Test
    @DisplayName("CORREGIDO: fecha 'hasta' con formato inválido lanza SolicitudInvalidaException")
    void getDashboardInfo_fechaHastaInvalida_lanzaSolicitudInvalida() {
        assertThrows(SolicitudInvalidaException.class,
                () -> controller.getDashboardInfo("2026-01-01", "31/01/2026"));
        verifyNoInteractions(jdbcTemplate);
    }

    @Test
    @DisplayName("CORREGIDO: 'desde' posterior a 'hasta' lanza SolicitudInvalidaException en vez de una consulta SQL sin sentido")
    void getDashboardInfo_desdePosteriorAHasta_lanzaSolicitudInvalida() {
        assertThrows(SolicitudInvalidaException.class,
                () -> controller.getDashboardInfo("2026-02-01", "2026-01-01"));
        verifyNoInteractions(jdbcTemplate);
    }

    @Test
    @DisplayName("rango válido con movimientos: calcula ventasTotales y ticketPromedio correctamente")
    void getDashboardInfo_rangoValidoConMovimientos_calculaMetricas() {
        when(jdbcTemplate.queryForObject(anyString(), eq(BigDecimal.class), any(LocalDate.class), any(LocalDate.class)))
                .thenReturn(new BigDecimal("1000.00"));
        when(jdbcTemplate.queryForObject(anyString(), eq(Integer.class), any(LocalDate.class), any(LocalDate.class)))
                .thenReturn(4);

        var respuesta = controller.getDashboardInfo("2026-01-01", "2026-01-31");

        assertEquals(200, respuesta.getStatusCode().value());
        var body = respuesta.getBody();
        assertNotNull(body);
        assertEquals(new BigDecimal("1000.00"), body.get("ventasTotales"));
        assertEquals(4, body.get("cantidadMovimientos"));
        assertEquals(0, new BigDecimal("250.00").compareTo((BigDecimal) body.get("ticketPromedio")));
    }

    @Test
    @DisplayName("CORREGIDO: rango sin movimientos (cantMovimientos = 0) no divide por cero; ticketPromedio queda en 0.00")
    void getDashboardInfo_sinMovimientos_ticketPromedioEnCero() {
        when(jdbcTemplate.queryForObject(anyString(), eq(BigDecimal.class), any(LocalDate.class), any(LocalDate.class)))
                .thenReturn(BigDecimal.ZERO);
        when(jdbcTemplate.queryForObject(anyString(), eq(Integer.class), any(LocalDate.class), any(LocalDate.class)))
                .thenReturn(0);

        var respuesta = controller.getDashboardInfo("2026-01-01", "2026-01-31");

        var body = respuesta.getBody();
        assertNotNull(body);
        assertEquals(0, BigDecimal.ZERO.compareTo((BigDecimal) body.get("ticketPromedio")));
    }
}
