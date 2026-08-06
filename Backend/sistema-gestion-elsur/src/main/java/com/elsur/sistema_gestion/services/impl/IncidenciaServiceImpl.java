package com.elsur.sistema_gestion.services.impl;

import com.elsur.sistema_gestion.models.Empleado;
import com.elsur.sistema_gestion.models.Incidencia;
import com.elsur.sistema_gestion.models.Maquina;
import com.elsur.sistema_gestion.repositories.EmpleadoRepository;
import com.elsur.sistema_gestion.repositories.IncidenciaRepository;
import com.elsur.sistema_gestion.repositories.MaquinaRepository;
import com.elsur.sistema_gestion.services.IncidenciaService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
public class IncidenciaServiceImpl implements IncidenciaService {

    @Autowired
    private IncidenciaRepository incidenciaRepository;

    @Autowired
    private MaquinaRepository maquinaRepository;

    @Autowired
    private EmpleadoRepository empleadoRepository;

    @Override
    @Transactional
    public Incidencia registrarFalla(Integer idMaquina, String descripcion, String prioridad, Integer idEmpleadoReporta) {
        Maquina maquina = maquinaRepository.findById(idMaquina)
                .orElseThrow(() -> new RuntimeException("Máquina no encontrada"));

        // 1. Cambiar estado de la máquina a FUERA DE SERVICIO
        maquina.setEstado("FUERA DE SERVICIO");
        maquinaRepository.save(maquina);

        // 2. Crear y guardar el registro de la incidencia
        Incidencia incidencia = new Incidencia();
        incidencia.setMaquina(maquina);
        incidencia.setDescripcion(descripcion);
        incidencia.setPrioridad(prioridad != null ? prioridad : "MEDIA");
        incidencia.setEstadoIncidencia("PENDIENTE");
        incidencia.setFechaReporte(LocalDateTime.now());

        if (idEmpleadoReporta != null) {
            Empleado emp = empleadoRepository.findById(idEmpleadoReporta).orElse(null);
            incidencia.setEmpleadoReporta(emp);
        }

        return incidenciaRepository.save(incidencia);
    }

    @Override
    @Transactional
    public Incidencia resolverIncidencia(Integer idIncidencia, String resolucion, Integer idEmpleadoResuelve) {
        Incidencia incidencia = incidenciaRepository.findById(idIncidencia)
                .orElseThrow(() -> new RuntimeException("Incidencia no encontrada"));

        incidencia.setResolucion(resolucion);
        incidencia.setFechaResolucion(LocalDateTime.now());
        incidencia.setEstadoIncidencia("RESUELTA");

        if (idEmpleadoResuelve != null) {
            Empleado emp = empleadoRepository.findById(idEmpleadoResuelve).orElse(null);
            incidencia.setEmpleadoResuelve(emp);
        }

        // Si ya no quedan incidencias pendientes para la máquina, restablecer a OPERATIVA
        Maquina maquina = incidencia.getMaquina();
        List<Incidencia> pendientes = incidenciaRepository
                .findByMaquinaIdMaquinaAndEstadoIncidencia(maquina.getIdMaquina(), "PENDIENTE");
        
        if (pendientes.size() <= 1) { // La actual ya se resolvió
            maquina.setEstado("OPERATIVA");
            maquinaRepository.save(maquina);
        }

        return incidenciaRepository.save(incidencia);
    }

    @Override
    public List<Incidencia> obtenerPorMaquina(Integer idMaquina) {
        return incidenciaRepository.findByMaquinaIdMaquinaOrderByFechaReporteDesc(idMaquina);
    }

    @Override
    public List<Incidencia> listarTodas() {
        return incidenciaRepository.findAll();
    }
}