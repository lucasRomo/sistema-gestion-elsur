package com.elsur.sistema_gestion.controllers;

import com.elsur.sistema_gestion.models.Cliente;
import com.elsur.sistema_gestion.services.ClienteService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;
import java.util.List;

// CORREGIDO: @CrossOrigin(origins = "*") permitía que cualquier sitio del mundo
// llamara a este controller, pisando/duplicando la config de CORS restringida a
// orígenes explícitos que ya se armó en SecurityConfig (ver app.cors.allowed-origins).
// Una anotación @CrossOrigin a nivel de controller/método tiene prioridad sobre la
// configuración global de Spring MVC, así que dejarla acá neutralizaba ese arreglo
// para estas rutas puntuales.
@RestController
@RequestMapping("/api/clientes")
public class ClienteController {

    @Autowired
    private ClienteService clienteService;

    @GetMapping
    public List<Cliente> listar() {
        return clienteService.listarTodos();
    }

    @PostMapping
    public Cliente crear(
            @RequestBody Cliente cliente,
            @RequestParam(value = "idUsuario", required = false) Integer idUsuario) {
        return clienteService.guardar(cliente, idUsuario);
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