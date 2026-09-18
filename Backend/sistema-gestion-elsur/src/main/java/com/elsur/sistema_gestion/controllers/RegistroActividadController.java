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

    // Obtener historial completo o filtrado por usuario/tabla
    @GetMapping
    public List<RegistroActividad> getAll(
            @RequestParam(required = false) Integer idUsuario,
            @RequestParam(required = false) String tabla) {
        
        return registroActividadService.buscarConFiltros(idUsuario, tabla);
    }

    // Obtener un registro específico por ID
    @GetMapping("/{id}")
    public RegistroActividad getOne(@PathVariable Integer id) {
        return registroActividadService.buscarPorId(id);
    }

    // GAP DE INTEGRIDAD corregido: este endpoint dejaba crear un RegistroActividad
    // "a mano" con cualquier contenido -- accion, tablaAfectada, columnaAfectada,
    // idRegistroMod, datosAnteriores/datosNuevos y hasta el usuario atribuido,
    // todo arbitrario en el body del POST. MatrizSeguridadValidator solo exige
    // el permiso "Historial de Actividad" para /api/registro-actividad/** (no
    // distingue lectura de escritura), así que cualquiera con acceso de LECTURA
    // a este módulo podía fabricar entradas falsas en lo que se supone que es un
    // registro de auditoría confiable -- por ejemplo, atribuirle a otro usuario
    // un cambio que nunca hizo, o borrar la evidencia de uno real agregando
    // ruido. El propio comentario decía "si hiciera falta" y, confirmado con una
    // búsqueda en todo el frontend, nada lo usa: los únicos registros reales
    // siempre se crean server-side vía registrarCambio() desde cada
    // ...ServiceImpl.compararYRegistrar, nunca desde este POST. CORREGIDO
    // eliminando el endpoint (mismo criterio que TC_GU26 con el endpoint de
    // depuración /prueba-limpia): si en el futuro hace falta un alta manual real
    // de auditoría, debería ser un caso de uso explícito y acotado, no un
    // @RequestBody libre.
}