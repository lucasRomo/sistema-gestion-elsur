package com.elsur.sistema_gestion.controllers;

import com.elsur.sistema_gestion.exceptions.RecursoNoEncontradoException;
import com.elsur.sistema_gestion.exceptions.SolicitudInvalidaException;
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
                .orElseThrow(() -> new RecursoNoEncontradoException("No se encontró el cliente con id: " + idCliente));

        BigDecimal nuevoLimite = payload.get("limiteCredito");
        if (nuevoLimite == null) {
            throw new SolicitudInvalidaException("Debe indicar el límite de crédito.");
        }
        if (nuevoLimite.signum() < 0) {
            throw new SolicitudInvalidaException("El límite de crédito no puede ser negativo.");
        }

        cliente.setLimiteCredito(nuevoLimite);
        clienteRepository.save(cliente);
        return ResponseEntity.ok().build();
    }

    @PostMapping("/cliente/{idCliente}/registrar-pago")
    @Transactional
    public ResponseEntity<?> registrarPago(
            @PathVariable Integer idCliente,
            @RequestBody Map<String, Object> payload) {

        if (payload.get("monto") == null) {
            throw new SolicitudInvalidaException("Debe indicar el monto del pago.");
        }
        BigDecimal monto = new BigDecimal(payload.get("monto").toString());
        if (monto.compareTo(BigDecimal.ZERO) <= 0) {
            throw new SolicitudInvalidaException("El monto del pago debe ser mayor a 0.");
        }
        String descripcion = payload.get("descripcion") != null ? payload.get("descripcion").toString() : "Pago parcial / total";
        String metodoPago = payload.get("metodoPago") != null ? payload.get("metodoPago").toString() : "EFECTIVO";
        String comprobanteImagen = payload.get("comprobanteImagen") != null ? payload.get("comprobanteImagen").toString() : null;

        if (payload.get("idUsuario") == null) {
            throw new SolicitudInvalidaException("Debe indicar el usuario que registra el pago.");
        }
        Integer idUsuario = Integer.parseInt(payload.get("idUsuario").toString());

        Cliente cliente = clienteRepository.findById(idCliente)
                .orElseThrow(() -> new RecursoNoEncontradoException("No se encontró el cliente con id: " + idCliente));

        BigDecimal nuevoSaldo = cliente.getSaldoDeudor().subtract(monto);
        cliente.setSaldoDeudor(nuevoSaldo);
        clienteRepository.save(cliente);

        MovimientoCuentaCorriente movCtaCte = new MovimientoCuentaCorriente();
        movCtaCte.setCliente(cliente);
        movCtaCte.setFecha(LocalDateTime.now());
        movCtaCte.setTipo("PAGO");
        movCtaCte.setMonto(monto);
        movCtaCte.setDescripcion(descripcion);
        movCtaCte.setMetodoPago(metodoPago);
        movCtaCte.setComprobanteImagen(comprobanteImagen);
        MovimientoCuentaCorriente guardado = movimientoCtaCteRepository.save(movCtaCte);

        Usuario usuarioActual = usuarioRepository.findById(idUsuario)
                .orElseThrow(() -> new SolicitudInvalidaException("El usuario indicado no existe."));

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

    @GetMapping("/resumen-deudores")
    public ResponseEntity<List<Map<String, Object>>> obtenerResumenDeudores() {
 
        Map<Integer, BigDecimal> mapaPagos = new java.util.HashMap<>();
        for (Object[] fila : movimientoCtaCteRepository.sumarPagosPorCliente()) {
            Integer idCliente = (Integer) fila[0];
            BigDecimal totalPagado = (BigDecimal) fila[1];
            mapaPagos.put(idCliente, totalPagado);
        }
 
        List<Map<String, Object>> resumen = new java.util.ArrayList<>();
 
        for (Cliente cliente : clienteRepository.findAll()) {
            BigDecimal saldoDeudor = cliente.getSaldoDeudor() != null ? cliente.getSaldoDeudor() : BigDecimal.ZERO;
 
            if (saldoDeudor.compareTo(BigDecimal.ZERO) <= 0) {
                continue;
            }
 
            String nombreCliente = (cliente.getPersona() != null)
                    ? cliente.getPersona().getNombre() + " " + cliente.getPersona().getApellido()
                    : cliente.getRazonSocial();
 
            BigDecimal totalPagado = mapaPagos.getOrDefault(cliente.getIdCliente(), BigDecimal.ZERO);
 
            Map<String, Object> fila = new java.util.HashMap<>();
            fila.put("idCliente", cliente.getIdCliente());
            fila.put("nombre", nombreCliente);
            fila.put("limiteCredito", cliente.getLimiteCredito());
            fila.put("saldoDeudor", saldoDeudor);
            fila.put("totalPagado", totalPagado);
 
            resumen.add(fila);
        }
 
        resumen.sort((a, b) ->
            ((BigDecimal) b.get("saldoDeudor")).compareTo((BigDecimal) a.get("saldoDeudor"))
        );
 
        return ResponseEntity.ok(resumen);
    }
    
}