package com.elsur.sistema_gestion.controllers;

import com.elsur.sistema_gestion.models.RegistroActividad;
import com.elsur.sistema_gestion.services.RegistroActividadService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/registro-actividad")
public class RegistroActividadController {

    @Autowired
    private RegistroActividadService registroActividadService;

    @GetMapping
    public List<RegistroActividad> getAll(
            @RequestParam(required = false) Integer idUsuario,
            @RequestParam(required = false) String tabla) {
        
        return registroActividadService.buscarConFiltros(idUsuario, tabla);
    }

    @GetMapping("/paginado")
    public java.util.Map<String, Object> getPaginado(
            @RequestParam(required = false) Integer idUsuario,
            @RequestParam(required = false) String tabla,
            @RequestParam(defaultValue = "0") int pagina,
            @RequestParam(defaultValue = "50") int tamano) {
        return registroActividadService.buscarConFiltrosPaginado(idUsuario, tabla, pagina, tamano);
    }

    // Para el desplegable "Filtrar por usuario": antes salía de los registros ya cargados.
    @GetMapping("/usuarios")
    public List<java.util.Map<String, Object>> getUsuarios() {
        return registroActividadService.listarUsuariosConActividad().stream()
                .map(u -> {
                    String nombre = u.getPersona() != null
                            ? (u.getPersona().getNombre() + " " + u.getPersona().getApellido()).trim()
                            : u.getNombreUsuario();
                    java.util.Map<String, Object> item = new java.util.LinkedHashMap<>();
                    item.put("idUsuario", u.getIdUsuario());
                    item.put("nombre", nombre);
                    return item;
                })
                .sorted(java.util.Comparator.comparing(m -> String.valueOf(m.get("nombre")).toLowerCase()))
                .toList();
    }

    @GetMapping("/{id}")
    public RegistroActividad getOne(@PathVariable Integer id) {
        return registroActividadService.buscarPorId(id);
    }

}