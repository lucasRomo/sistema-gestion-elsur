package com.elsur.sistema_gestion.controllers;

import com.elsur.sistema_gestion.models.Cliente;
import com.elsur.sistema_gestion.services.ClienteService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/clientes")
@CrossOrigin(origins = "*")
public class ClienteController {

    @Autowired
    private ClienteService clienteService;

    @GetMapping
    public List<Cliente> listar() {
        return clienteService.listarTodos();
    }

    @PostMapping
    public Cliente crear(@RequestBody Cliente cliente) {
        return clienteService.guardar(cliente);
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