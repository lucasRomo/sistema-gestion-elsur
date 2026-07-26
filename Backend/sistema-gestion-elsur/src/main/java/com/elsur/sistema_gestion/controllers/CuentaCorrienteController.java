package com.elsur.sistema_gestion.controllers;

import com.elsur.sistema_gestion.models.Cliente;
import com.elsur.sistema_gestion.models.MovimientoCuentaCorriente;
import com.elsur.sistema_gestion.repositories.ClienteRepository;
import com.elsur.sistema_gestion.repositories.MovimientoCuentaCorrienteRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/cuentas-corrientes")
@CrossOrigin(origins = "*")
public class CuentaCorrienteController {

    @Autowired
    private ClienteRepository clienteRepository;

    @Autowired
    private MovimientoCuentaCorrienteRepository movimientoRepository;

    @GetMapping("/cliente/{idCliente}/movimientos")
    public List<MovimientoCuentaCorriente> obtenerHistorial(@PathVariable Integer idCliente) {
        return movimientoRepository.findByCliente_IdClienteOrderByFechaDesc(idCliente);
    }

    @PutMapping("/cliente/{idCliente}/limite")
    public ResponseEntity<?> actualizarLimiteCredito(@PathVariable Integer idCliente, @RequestBody Map<String, BigDecimal> payload) {
        Cliente cliente = clienteRepository.findById(idCliente)
                .orElseThrow(() -> new RuntimeException("Cliente no encontrado"));

        BigDecimal nuevoLimite = payload.get("limiteCredito");
        if (nuevoLimite == null || nuevoLimite.compareTo(BigDecimal.ZERO) < 0) {
            return ResponseEntity.badRequest().body("El límite debe ser mayor o igual a 0.");
        }

        cliente.setLimiteCredito(nuevoLimite);
        clienteRepository.save(cliente);
        return ResponseEntity.ok(cliente);
    }

    @PostMapping("/cliente/{idCliente}/registrar-pago")
    @Transactional
    public ResponseEntity<?> registrarPago(@PathVariable Integer idCliente, @RequestBody Map<String, Object> payload) {
        Cliente cliente = clienteRepository.findById(idCliente)
                .orElseThrow(() -> new RuntimeException("Cliente no encontrado"));

        BigDecimal montoPago = new BigDecimal(payload.get("monto").toString());
        String descripcion = payload.getOrDefault("descripcion", "Pago / Liquidación a Cuenta").toString();

        if (montoPago.compareTo(BigDecimal.ZERO) <= 0) {
            return ResponseEntity.badRequest().body("El monto del pago debe ser mayor a cero.");
        }

        // Restar del saldo deudor del cliente
        BigDecimal nuevoSaldo = cliente.getSaldoDeudor().subtract(montoPago);
        cliente.setSaldoDeudor(nuevoSaldo);
        clienteRepository.save(cliente);

        // Registrar movimiento
        MovimientoCuentaCorriente movimiento = new MovimientoCuentaCorriente();
        movimiento.setCliente(cliente);
        movimiento.setTipo("PAGO");
        movimiento.setMonto(montoPago);
        movimiento.setDescripcion(descripcion);
        movimientoRepository.save(movimiento);

        return ResponseEntity.ok(cliente);
    }
}