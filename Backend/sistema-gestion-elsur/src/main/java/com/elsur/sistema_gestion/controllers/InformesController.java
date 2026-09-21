package com.elsur.sistema_gestion.controllers;

import com.elsur.sistema_gestion.exceptions.SolicitudInvalidaException;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.jdbc.core.JdbcTemplate;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.format.DateTimeParseException;
import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/informes")
public class InformesController {

    @Autowired
    private JdbcTemplate jdbcTemplate;

    @GetMapping("/dashboard")
    public ResponseEntity<Map<String, Object>> getDashboardInfo(
            @RequestParam("desde") String fechaDesde,
            @RequestParam("hasta") String fechaHasta) {

        LocalDate desde;
        LocalDate hasta;
        try {
            desde = LocalDate.parse(fechaDesde);
            hasta = LocalDate.parse(fechaHasta);
        } catch (DateTimeParseException e) {
            throw new SolicitudInvalidaException("Las fechas 'desde' y 'hasta' deben tener formato AAAA-MM-DD.");
        }

        if (desde.isAfter(hasta)) {
            throw new SolicitudInvalidaException("La fecha 'desde' no puede ser posterior a la fecha 'hasta'.");
        }

        Map<String, Object> metricas = new HashMap<>();

        String queryVentas = "SELECT COALESCE(SUM(monto), 0) FROM movimiento_caja WHERE tipo_movimiento = 'INGRESO' AND CAST(fecha AS DATE) BETWEEN ? AND ?";
        BigDecimal ventasTotales = jdbcTemplate.queryForObject(queryVentas, BigDecimal.class, desde, hasta);

        String queryMovimientos = "SELECT COUNT(*) FROM movimiento_caja WHERE CAST(fecha AS DATE) BETWEEN ? AND ?";
        Integer cantMovimientos = jdbcTemplate.queryForObject(queryMovimientos, Integer.class, desde, hasta);

        metricas.put("ventasTotales", ventasTotales);
        metricas.put("pedidosCompletados", cantMovimientos);

        BigDecimal ticketPromedio = cantMovimientos != null && cantMovimientos > 0
                ? ventasTotales.divide(new BigDecimal(cantMovimientos), 2, java.math.RoundingMode.HALF_UP)
                : BigDecimal.ZERO;

        metricas.put("ticketPromedio", ticketPromedio);
        metricas.put("cantidadMovimientos", cantMovimientos);

        return ResponseEntity.ok(metricas);
    }
}
