package com.elsur.sistema_gestion.controllers;

import com.elsur.sistema_gestion.models.ComprobantePago;
import com.elsur.sistema_gestion.services.ComprobantePagoService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/comprobantes-pago")
@CrossOrigin(origins = "*")
public class ComprobantePagoController {

    @Autowired
    private ComprobantePagoService comprobantePagoService;

    @GetMapping("/{id}")
    public ComprobantePago buscarPorId(@PathVariable Integer id) {
        return comprobantePagoService.buscarPorId(id);
    }

    @PostMapping
    public ComprobantePago crear(@RequestBody ComprobantePago comprobantePago) {
        return comprobantePagoService.guardar(comprobantePago);
    }

    @GetMapping("/{id}/comprobantes-pago")
    public List<ComprobantePago> listarComprobantesPorPedido(@PathVariable Integer id) {
        return comprobantePagoService.listarComprobantesPorPedido(id);
    }
}