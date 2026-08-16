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

    @GetMapping("/resumen-deudores")
    public ResponseEntity<List<Map<String, Object>>> obtenerResumenDeudores() {
 
        // 1. Traemos la suma de pagos por cliente y la convertimos en un mapa
        //    { idCliente -> totalPagado } para buscarla en O(1) más abajo.
        Map<Integer, BigDecimal> mapaPagos = new java.util.HashMap<>();
        for (Object[] fila : movimientoCtaCteRepository.sumarPagosPorCliente()) {
            Integer idCliente = (Integer) fila[0];
            BigDecimal totalPagado = (BigDecimal) fila[1];
            mapaPagos.put(idCliente, totalPagado);
        }
 
        // 2. Recorremos todos los clientes con saldo deudor > 0 y armamos
        //    el resumen final que necesita el gráfico de Informes.
        List<Map<String, Object>> resumen = new java.util.ArrayList<>();
 
        for (Cliente cliente : clienteRepository.findAll()) {
            BigDecimal saldoDeudor = cliente.getSaldoDeudor() != null ? cliente.getSaldoDeudor() : BigDecimal.ZERO;
 
            if (saldoDeudor.compareTo(BigDecimal.ZERO) <= 0) {
                continue; // Solo nos interesan los que efectivamente deben algo
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
 
        // 3. Ordenamos de mayor a menor deuda (el que más debe, primero)
        resumen.sort((a, b) ->
            ((BigDecimal) b.get("saldoDeudor")).compareTo((BigDecimal) a.get("saldoDeudor"))
        );
 
        return ResponseEntity.ok(resumen);
    }
    
}