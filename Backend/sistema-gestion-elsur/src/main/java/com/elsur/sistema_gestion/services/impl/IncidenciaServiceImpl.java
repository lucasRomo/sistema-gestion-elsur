package com.elsur.sistema_gestion.services.impl;

import com.elsur.sistema_gestion.models.Incidencia;
import com.elsur.sistema_gestion.models.Maquina;
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

    @Override
    public List<Incidencia> listarTodas() {
        return incidenciaRepository.findAll();
    }

    @Override
    public List<Incidencia> listarPorMaquina(Integer idMaquina) {
        return incidenciaRepository.findByMaquinaIdMaquinaOrderByFechaReporteDesc(idMaquina);
    }

    @Override
    @Transactional
    public Incidencia registrar(Incidencia incidencia) {
        // Seteamos la fecha actual al reporte
        incidencia.setFechaReporte(LocalDateTime.now());
        
        // Al reportar una falla, actualizamos el estado de la máquina automáticamente
        if (incidencia.getMaquina() != null) {
            Maquina m = incidencia.getMaquina();
            m.setEstado("FUERA_DE_SERVICIO");
            maquinaRepository.save(m);
        }
        
        return incidenciaRepository.save(incidencia);
    }

    @Override
    @Transactional
    public void resolverIncidencia(Integer idIncidencia, String resolucion) {
        Incidencia inc = incidenciaRepository.findById(idIncidencia)
                .orElseThrow(() -> new RuntimeException("Incidencia no encontrada"));
        
        inc.setResolucion(resolucion);
        inc.setFechaResolucion(LocalDateTime.now());
        
        // Si ya se arregló, volvemos la máquina a operativa
        if (inc.getMaquina() != null) {
            Maquina m = inc.getMaquina();
            m.setEstado("OPERATIVA");
            maquinaRepository.save(m);
        }
        
        incidenciaRepository.save(inc);
    }
}