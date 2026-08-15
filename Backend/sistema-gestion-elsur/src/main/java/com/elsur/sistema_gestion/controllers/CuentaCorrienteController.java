package com.elsur.sistema_gestion.controllers;

import com.elsur.sistema_gestion.models.Cliente;
import com.elsur.sistema_gestion.models.MovimientoCaja;
import com.elsur.sistema_gestion.models.MovimientoCuentaCorriente;
import com.elsur.sistema_gestion.models.Usuario;
import com.elsur.sistema_gestion.repositories.ClienteRepository;
import com.elsur.sistema_gestion.repositories.MovimientoCuentaCorrienteRepository;
import com.elsur.sistema_gestion.repositories.UsuarioRepository;
import com.elsur.sistema_gestion.services.MovimientoCajaService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/cuentas-corrientes")
@CrossOrigin(origins = "*")
public class CuentaCorrienteController {

    @Autowired
    private ClienteRepository clienteRepository;

    @Autowired
    private MovimientoCuentaCorrienteRepository movimientoCtaCteRepository;

    @Autowired
    private MovimientoCajaService movimientoCajaService;

    @Autowired
    private UsuarioRepository usuarioRepository;

    @GetMapping("/cliente/{idCliente}/movimientos")
    public ResponseEntity<List<MovimientoCuentaCorriente>> obtenerMovimientos(@PathVariable Integer idCliente) {
        return ResponseEntity.ok(movimientoCtaCteRepository.findByCliente_IdClienteOrderByFechaDesc(idCliente));
    }

    @PutMapping("/cliente/{idCliente}/limite")
    public ResponseEntity<?> actualizarLimite(@PathVariable Integer idCliente, @RequestBody Map<String, BigDecimal> payload) {
        Cliente cliente = clienteRepository.findById(idCliente)
                .orElseThrow(() -> new RuntimeException("Cliente no encontrado"));
        cliente.setLimiteCredito(payload.get("limiteCredito"));
        clienteRepository.save(cliente);
        return ResponseEntity.ok().build();
    }

    @PostMapping("/cliente/{idCliente}/registrar-pago")
    @Transactional
    public ResponseEntity<?> registrarPago(
            @PathVariable Integer idCliente,
            @RequestBody Map<String, Object> payload) {

        BigDecimal monto = new BigDecimal(payload.get("monto").toString());
        String descripcion = payload.get("descripcion") != null ? payload.get("descripcion").toString() : "Pago parcial / total";
        String metodoPago = payload.get("metodoPago") != null ? payload.get("metodoPago").toString() : "EFECTIVO";
        String comprobanteImagen = payload.get("comprobanteImagen") != null ? payload.get("comprobanteImagen").toString() : null;

        Integer idUsuario = payload.get("idUsuario") != null ? Integer.parseInt(payload.get("idUsuario").toString()) : null;

        Cliente cliente = clienteRepository.findById(idCliente)
                .orElseThrow(() -> new RuntimeException("Cliente no encontrado"));

        // 1. Actualizar Saldo Deudor del Cliente
        BigDecimal nuevoSaldo = cliente.getSaldoDeudor().subtract(monto);
        cliente.setSaldoDeudor(nuevoSaldo);
        clienteRepository.save(cliente);

        // 2. Registrar Movimiento en Cuenta Corriente
        MovimientoCuentaCorriente movCtaCte = new MovimientoCuentaCorriente();
        movCtaCte.setCliente(cliente);
        movCtaCte.setFecha(LocalDateTime.now());
        movCtaCte.setTipo("PAGO");
        movCtaCte.setMonto(monto);
        movCtaCte.setDescripcion(descripcion);
        movCtaCte.setMetodoPago(metodoPago);
        movCtaCte.setComprobanteImagen(comprobanteImagen);
        MovimientoCuentaCorriente guardado = movimientoCtaCteRepository.save(movCtaCte);

        // 3. REGISTRAR IMPACTO EN CAJA (MovimientoCaja tipo INGRESO)
        Usuario usuarioActual = null;
        if (idUsuario != null) {
            usuarioActual = usuarioRepository.findById(idUsuario).orElse(null);
        }
        if (usuarioActual == null) {
            usuarioActual = usuarioRepository.findAll().stream().findFirst().orElse(null);
        }

        MovimientoCaja movCaja = new MovimientoCaja();
        movCaja.setFecha(LocalDateTime.now());
        movCaja.setMonto(monto);
        movCaja.setTipoMovimiento("INGRESO");
        movCaja.setCategoria("COBRO_CTA_CTE");
        movCaja.setMetodoPago(metodoPago);
        movCaja.setDescripcion("Cobro Cta. Cte. - Cliente: " + cliente.getPersona().getNombre() + " " + cliente.getPersona().getApellido() + " (" + descripcion + ")");
        movCaja.setUsuario(usuarioActual);
        
        movCaja.setComprobanteImagen(comprobanteImagen);

        movimientoCajaService.guardar(movCaja);

        return ResponseEntity.ok(guardado);
    }
}