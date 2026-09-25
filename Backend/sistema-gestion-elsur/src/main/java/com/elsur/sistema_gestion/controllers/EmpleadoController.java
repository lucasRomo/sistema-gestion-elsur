package com.elsur.sistema_gestion.controllers;

import com.elsur.sistema_gestion.exceptions.SolicitudInvalidaException;
import com.elsur.sistema_gestion.models.Empleado;
import com.elsur.sistema_gestion.services.EmpleadoService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.List;

@RestController
@RequestMapping("/api/empleados")
public class EmpleadoController {
    @Autowired
    private EmpleadoService empleadoService;

    @GetMapping
    public List<Empleado> listar() { return empleadoService.listarTodos(); }

    @PostMapping
    public Empleado crear(@RequestBody Empleado empleado) {
        if (empleado.getCargo() == null || empleado.getCargo().trim().isEmpty()) {
            throw new SolicitudInvalidaException("El cargo del empleado no puede estar vacío.");
        }
        if (empleado.getSalario() == null || empleado.getSalario().compareTo(BigDecimal.ZERO) < 0) {
            throw new SolicitudInvalidaException("El salario del empleado no puede ser negativo.");
        }
        return empleadoService.guardar(empleado);
    }


}