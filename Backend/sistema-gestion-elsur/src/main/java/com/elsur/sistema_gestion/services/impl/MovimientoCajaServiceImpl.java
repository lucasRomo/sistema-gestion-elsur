package com.elsur.sistema_gestion.services.impl;

import com.elsur.sistema_gestion.models.EstadoTurno;
import com.elsur.sistema_gestion.models.MovimientoCaja;
import com.elsur.sistema_gestion.models.Pedido;
import com.elsur.sistema_gestion.models.Turno;
import com.elsur.sistema_gestion.repositories.MovimientoCajaRepository;
import com.elsur.sistema_gestion.repositories.PedidoRepository;
import com.elsur.sistema_gestion.repositories.TurnoRepository;
import com.elsur.sistema_gestion.services.MovimientoCajaService;
import com.elsur.sistema_gestion.exceptions.SolicitudInvalidaException;
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

        if (movimientoCaja.getTurno() == null) {
            Turno turnoAbierto = turnoRepository.findFirstByEstado(EstadoTurno.ABIERTO)
                    .orElseThrow(() -> new SolicitudInvalidaException(
                            "La Caja no está abierta. Por favor, inicie turno antes de continuar."));
            movimientoCaja.setTurno(turnoAbierto);
        }

        if (movimientoCaja.getPedido() != null) {
            Integer idPedido = movimientoCaja.getPedido().getId_pedido(); 
            if (idPedido != null) {
                Pedido pedidoPersistido = pedidoRepository.findById(idPedido)
                    .orElseThrow(() -> new RuntimeException("El pedido indicado no existe: " + idPedido));
                movimientoCaja.setPedido(pedidoPersistido);
            } else {
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
            boolean esDigital = !"EFECTIVO".equals(metodo);

            if ("INGRESO".equalsIgnoreCase(m.getTipoMovimiento())) {
                if (esDigital) {
                    transferenciaIngresos = transferenciaIngresos.add(m.getMonto());
                } else {
                    efectivoIngresos = efectivoIngresos.add(m.getMonto());
                }
            } else if ("EGRESO".equalsIgnoreCase(m.getTipoMovimiento())) {
                if (esDigital) {
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