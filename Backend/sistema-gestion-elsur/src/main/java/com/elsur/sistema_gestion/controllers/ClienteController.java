package com.elsur.sistema_gestion.controllers;

import com.elsur.sistema_gestion.models.Cliente;
import com.elsur.sistema_gestion.services.ClienteService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;


@RestController
@RequestMapping("/api/clientes")
public class ClienteController {

    @Autowired
    private ClienteService clienteService;

    @GetMapping
    public List<Cliente> listar() {
        return clienteService.listarTodos();
    }

    /** Alta (sin id) responde 201 Created; modificación (con id) responde 200 OK. */
    @PostMapping
    public ResponseEntity<Cliente> crear(
            @Valid @RequestBody Cliente cliente,
            @RequestParam(value = "idUsuario", required = false) Integer idUsuario) {
        boolean esAlta = cliente.getIdCliente() == null;
        Cliente guardado = clienteService.guardar(cliente, idUsuario);
        return ResponseEntity.status(esAlta ? HttpStatus.CREATED : HttpStatus.OK).body(guardado);
    }

    @GetMapping("/{id}")
    public Cliente obtenerPorId(@PathVariable Integer id) {
        return clienteService.buscarPorId(id);
    }

    @DeleteMapping("/{id}")
    public void eliminar(@PathVariable Integer id) {
        clienteService.eliminar(id);
    }
}