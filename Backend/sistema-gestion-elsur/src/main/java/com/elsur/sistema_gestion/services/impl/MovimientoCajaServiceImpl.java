package com.elsur.sistema_gestion.services.impl;

import com.elsur.sistema_gestion.models.EstadoTurno;
import com.elsur.sistema_gestion.models.MovimientoCaja;
import com.elsur.sistema_gestion.models.Pedido;
import com.elsur.sistema_gestion.models.Turno;
import com.elsur.sistema_gestion.repositories.MovimientoCajaRepository;
import com.elsur.sistema_gestion.repositories.PedidoRepository;
import com.elsur.sistema_gestion.repositories.TurnoRepository; 
import com.elsur.sistema_gestion.services.MovimientoCajaService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
public class MovimientoCajaServiceImpl implements MovimientoCajaService {

    @Autowired
    private MovimientoCajaRepository movimientoCajaRepository;

    @Autowired
    private TurnoRepository turnoRepository;

    @Autowired
    private PedidoRepository pedidoRepository;


    @Override
    public MovimientoCaja buscarPorId(Integer id) {
        return movimientoCajaRepository.findById(id).orElse(null);
    }


    @Override
    @Transactional
    public MovimientoCaja guardar(MovimientoCaja movimientoCaja) {
        // 1. Asignación de Turno
        if (movimientoCaja.getTurno() == null) {
            turnoRepository.findFirstByEstado(EstadoTurno.ABIERTO)
                .ifPresent(movimientoCaja::setTurno);
        }

        // 2. Solución al error de Pedido Transient
        if (movimientoCaja.getPedido() != null) {
            Integer idPedido = movimientoCaja.getPedido().getId_pedido(); // Ajustá al nombre exacto del getter del ID
            if (idPedido != null) {
                Pedido pedidoPersistido = pedidoRepository.findById(idPedido)
                    .orElseThrow(() -> new RuntimeException("El pedido indicado no existe: " + idPedido));
                movimientoCaja.setPedido(pedidoPersistido);
            } else {
                // Si vino un objeto pedido vacío desde el frontend, lo seteamos en null
                movimientoCaja.setPedido(null);
            }
        }

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
    public List<MovimientoCaja> listarMovimientosPorTurno(Integer idTurno) {
        return movimientoCajaRepository.findByTurno_IdTurno(idTurno);
    }

    @Override
    public List<MovimientoCaja> obtenerTodos() {
        return movimientoCajaRepository.findAll();
    }

    // ==========================================================
    // TOTALES (Ingresos / Egresos / Saldo)
    // ==========================================================

    @Override
    public Map<String, Double> calcularTotalesDelDia() {
        return calcularTotales(listarMovimientosDelDia());
    }

    @Override
    public Map<String, Double> calcularTotalesPorTurno(Integer idTurno) {
        return calcularTotales(listarMovimientosPorTurno(idTurno));
    }

    private Map<String, Double> calcularTotales(List<MovimientoCaja> movimientos) {
        BigDecimal totalIngresos = BigDecimal.ZERO;
        BigDecimal totalEgresos = BigDecimal.ZERO;

        for (MovimientoCaja m : movimientos) {
            if ("INGRESO".equalsIgnoreCase(m.getTipoMovimiento())) {
                totalIngresos = totalIngresos.add(m.getMonto());
            } else if ("EGRESO".equalsIgnoreCase(m.getTipoMovimiento())) {
                totalEgresos = totalEgresos.add(m.getMonto());
            }
        }

        Map<String, Double> totales = new HashMap<>();
        totales.put("totalIngresos", totalIngresos.doubleValue());
        totales.put("totalEgresos", totalEgresos.doubleValue());
        totales.put("saldoActual", totalIngresos.subtract(totalEgresos).doubleValue());

        return totales;
    }

    // ==========================================================
    // DESGLOSE DE ARQUEO (Efectivo / Transferencias)
    // ==========================================================

    @Override
    public Map<String, Double> obtenerDesgloseArqueo() {
        return calcularDesglose(listarMovimientosDelDia());
    }

    @Override
    public Map<String, Double> obtenerDesgloseArqueoPorTurno(Integer idTurno) {
        return calcularDesglose(listarMovimientosPorTurno(idTurno));
    }

    private Map<String, Double> calcularDesglose(List<MovimientoCaja> movimientos) {
        BigDecimal efectivoIngresos = BigDecimal.ZERO;
        BigDecimal efectivoEgresos = BigDecimal.ZERO;
        BigDecimal transferenciaIngresos = BigDecimal.ZERO;
        BigDecimal transferenciaEgresos = BigDecimal.ZERO;

        for (MovimientoCaja m : movimientos) {
            String metodo = (m.getMetodoPago() != null) ? m.getMetodoPago().toUpperCase() : "EFECTIVO";

            if ("INGRESO".equalsIgnoreCase(m.getTipoMovimiento())) {
                if ("TRANSFERENCIA".equals(metodo)) {
                    transferenciaIngresos = transferenciaIngresos.add(m.getMonto());
                } else {
                    efectivoIngresos = efectivoIngresos.add(m.getMonto());
                }
            } else if ("EGRESO".equalsIgnoreCase(m.getTipoMovimiento())) {
                if ("TRANSFERENCIA".equals(metodo)) {
                    transferenciaEgresos = transferenciaEgresos.add(m.getMonto());
                } else {
                    efectivoEgresos = efectivoEgresos.add(m.getMonto());
                }
            }
        }

        Map<String, Double> desglose = new HashMap<>();

        double totalEfectivo = efectivoIngresos.subtract(efectivoEgresos).doubleValue();
        double totalTransferencias = transferenciaIngresos.subtract(transferenciaEgresos).doubleValue();

        desglose.put("efectivoIngresos", efectivoIngresos.doubleValue());
        desglose.put("efectivoEgresos", efectivoEgresos.doubleValue());
        desglose.put("totalEfectivo", totalEfectivo);

        desglose.put("transferenciaIngresos", transferenciaIngresos.doubleValue());
        desglose.put("transferenciaEgresos", transferenciaEgresos.doubleValue());
        desglose.put("totalTransferencias", totalTransferencias);

        desglose.put("saldoTotal", totalEfectivo + totalTransferencias);

        return desglose;
    }
}