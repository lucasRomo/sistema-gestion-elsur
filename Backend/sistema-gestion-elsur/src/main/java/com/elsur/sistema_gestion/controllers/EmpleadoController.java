package com.elsur.sistema_gestion.controllers;

import com.elsur.sistema_gestion.models.Empleado;
import com.elsur.sistema_gestion.services.EmpleadoService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/empleados")
public class EmpleadoController {
    @Autowired
    private EmpleadoService empleadoService;

    @GetMapping
    public List<Empleado> listar() { return empleadoService.listarTodos(); }

    @PostMapping
    public Empleado crear(@RequestBody Empleado empleado) { return empleadoService.guardar(empleado); }

    
}