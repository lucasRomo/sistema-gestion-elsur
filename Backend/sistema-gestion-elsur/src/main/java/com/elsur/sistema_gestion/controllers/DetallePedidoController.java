package com.elsur.sistema_gestion.controllers;

import com.elsur.sistema_gestion.models.DetallePedido;
import com.elsur.sistema_gestion.services.DetallePedidoService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/detalles-pedidos")
@CrossOrigin(origins = "*")
public class DetallePedidoController {

    @Autowired
    private DetallePedidoService detalleService;

    @PostMapping
    public DetallePedido crear(@RequestBody DetallePedido detalle) {
        return detalleService.guardar(detalle);
    }
}
