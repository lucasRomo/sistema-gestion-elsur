package com.elsur.sistema_gestion.controllers;

import com.elsur.sistema_gestion.models.MovimientoCaja;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.jdbc.core.JdbcTemplate;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/informes")
@CrossOrigin(origins = "*")
public class InformesController {

    @Autowired
    private JdbcTemplate jdbcTemplate;

    @GetMapping("/dashboard")
    public ResponseEntity<Map<String, Object>> getDashboardInfo(
            @RequestParam("desde") String fechaDesde,
            @RequestParam("hasta") String fechaHasta) {

        Map<String, Object> metricas = new HashMap<>();

        try {
            // Suma total de los Ingresos en MovimientoCaja
            String queryVentas = "SELECT COALESCE(SUM(monto), 0) FROM movimiento_caja WHERE tipo_movimiento = 'INGRESO' AND CAST(fecha AS DATE) BETWEEN ? AND ?";
            BigDecimal ventasTotales = jdbcTemplate.queryForObject(queryVentas, BigDecimal.class, LocalDate.parse(fechaDesde), LocalDate.parse(fechaHasta));
            
            // Cantidad de movimientos (ejemplo simple)
            String queryMovimientos = "SELECT COUNT(*) FROM movimiento_caja WHERE CAST(fecha AS DATE) BETWEEN ? AND ?";
            Integer cantMovimientos = jdbcTemplate.queryForObject(queryMovimientos, Integer.class, LocalDate.parse(fechaDesde), LocalDate.parse(fechaHasta));

            metricas.put("ventasTotales", ventasTotales);
            metricas.put("pedidosCompletados", cantMovimientos); // Simplificado: cada mov es un pedido
            
            BigDecimal ticketPromedio = cantMovimientos > 0 
                ? ventasTotales.divide(new BigDecimal(cantMovimientos), 2, java.math.RoundingMode.HALF_UP) 
                : BigDecimal.ZERO;
            
            metricas.put("ticketPromedio", ticketPromedio);
            metricas.put("cantidadMovimientos", cantMovimientos);

            return ResponseEntity.ok(metricas);

        } catch (Exception e) {
            // Valores fallback si no hay datos en la DB o falla la query
            metricas.put("ventasTotales", 0);
            metricas.put("pedidosCompletados", 0);
            metricas.put("ticketPromedio", 0);
            metricas.put("cantidadMovimientos", 0);
            return ResponseEntity.ok(metricas);
        }
    }
}