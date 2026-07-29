package com.elsur.sistema_gestion.services.impl;

import com.elsur.sistema_gestion.models.MovimientoCaja;
import com.elsur.sistema_gestion.repositories.MovimientoCajaRepository;
import com.elsur.sistema_gestion.services.MovimientoCajaService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.Map;
import java.util.HashMap;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.List;

@Service
public class MovimientoCajaServiceImpl implements MovimientoCajaService {

    @Autowired
    private MovimientoCajaRepository movimientoCajaRepository;

    @Override
    public MovimientoCaja buscarPorId(Integer id) {
        return movimientoCajaRepository.findById(id).orElse(null);
    }

    @Override
    public MovimientoCaja guardar(MovimientoCaja movimientoCaja) {
        return movimientoCajaRepository.save(movimientoCaja);
    }

    @Override
    public List<MovimientoCaja> listarMovimientosDelDia() {
        LocalDateTime inicioDia = LocalDateTime.of(LocalDate.now(), LocalTime.MIN);
        LocalDateTime finDia = LocalDateTime.of(LocalDate.now(), LocalTime.MAX);
        return movimientoCajaRepository.findByFechaBetween(inicioDia, finDia);
    }

   @Override
    public List<MovimientoCaja> listarMovimientosPorPedido(Integer idPedido) {
    return movimientoCajaRepository.buscarPorPedido(idPedido);
    }

    @Override
    public Map<String, Double> calcularTotalesDelDia() {
    List<MovimientoCaja> movimientos = listarMovimientosDelDia();
    
    // Usamos BigDecimal para los acumuladores para que coincidan con el tipo de dato del monto
    java.math.BigDecimal totalIngresos = java.math.BigDecimal.ZERO;
    java.math.BigDecimal totalEgresos = java.math.BigDecimal.ZERO;

    for (MovimientoCaja m : movimientos) {
        // Asegúrate de que m.getMonto() devuelva BigDecimal
        if ("INGRESO".equals(m.getTipoMovimiento())) {
            totalIngresos = totalIngresos.add(m.getMonto());
        } else if ("EGRESO". equals(m.getTipoMovimiento())) {
            totalEgresos = totalEgresos.add(m.getMonto());
        }
    }

    Map<String, Double> totales = new HashMap<>();
    
    // Convertimos a double solo al final para enviarlo al frontend como número
    totales.put("totalIngresos", totalIngresos.doubleValue());
    totales.put("totalEgresos", totalEgresos.doubleValue());
    totales.put("saldoActual", totalIngresos.subtract(totalEgresos).doubleValue());
    
    return totales;
}
    @Override
    public List<MovimientoCaja> obtenerTodos() {
        return movimientoCajaRepository.findAll();
    }
}