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

        // CORREGIDO: antes un catch (Exception e) envolvía toda la lógica y, ante
        // CUALQUIER falla (fecha mal formada, error de conexión a la base, etc.),
        // devolvía 200 OK con métricas en cero -- indistinguible de "no hay datos
        // en el rango". Ahora se valida el formato de fecha explícitamente (400
        // con mensaje claro) y el resto de los errores se deja propagar al
        // GlobalExceptionHandler, que ya sabe traducirlos a la respuesta HTTP
        // correcta en vez de disfrazarlos de éxito.
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

        // Suma total de los Ingresos en MovimientoCaja
        String queryVentas = "SELECT COALESCE(SUM(monto), 0) FROM movimiento_caja WHERE tipo_movimiento = 'INGRESO' AND CAST(fecha AS DATE) BETWEEN ? AND ?";
        BigDecimal ventasTotales = jdbcTemplate.queryForObject(queryVentas, BigDecimal.class, desde, hasta);

        // Cantidad de movimientos (ejemplo simple)
        String queryMovimientos = "SELECT COUNT(*) FROM movimiento_caja WHERE CAST(fecha AS DATE) BETWEEN ? AND ?";
        Integer cantMovimientos = jdbcTemplate.queryForObject(queryMovimientos, Integer.class, desde, hasta);

        metricas.put("ventasTotales", ventasTotales);
        metricas.put("pedidosCompletados", cantMovimientos); // Simplificado: cada mov es un pedido

        BigDecimal ticketPromedio = cantMovimientos != null && cantMovimientos > 0
                ? ventasTotales.divide(new BigDecimal(cantMovimientos), 2, java.math.RoundingMode.HALF_UP)
                : BigDecimal.ZERO;

        metricas.put("ticketPromedio", ticketPromedio);
        metricas.put("cantidadMovimientos", cantMovimientos);

        return ResponseEntity.ok(metricas);
    }
}
