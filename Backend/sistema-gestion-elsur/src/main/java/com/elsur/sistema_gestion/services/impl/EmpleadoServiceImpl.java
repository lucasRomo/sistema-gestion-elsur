package com.elsur.sistema_gestion.services.impl;

import com.elsur.sistema_gestion.models.Empleado;
import com.elsur.sistema_gestion.models.Persona;
import com.elsur.sistema_gestion.repositories.EmpleadoRepository;
import com.elsur.sistema_gestion.repositories.PersonaRepository;
import com.elsur.sistema_gestion.repositories.DireccionRepository;
import com.elsur.sistema_gestion.services.EmpleadoService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class EmpleadoServiceImpl implements EmpleadoService {

    @Autowired
    private EmpleadoRepository empleadoRepository;

    @Autowired
    private PersonaRepository personaRepository;

    @Autowired
    private DireccionRepository direccionRepository;

    @Override
    public List<Empleado> listarTodos() {
        return empleadoRepository.findAll();
    }

    @Override
    public Empleado buscarPorId(Integer id) {
        return empleadoRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Empleado no encontrado con id: " + id));
    }

    @Override
    @Transactional
    public Empleado guardar(Empleado empleado) {
        if (empleado.getPersona() != null) {
            Persona persona = empleado.getPersona();
            
            // Guardamos la dirección si existe
            if (persona.getDireccion() != null) {
                direccionRepository.save(persona.getDireccion());
            }
            
            // Guardamos los datos de la persona física
            personaRepository.save(persona);
        }
        
        // Guardamos el legajo y datos laborales en la tabla Empleado
        return empleadoRepository.save(empleado);
    }

    @Override
    @Transactional
    public void eliminar(Integer id) {
        if (!empleadoRepository.existsById(id)) {
            throw new RuntimeException("No se puede eliminar: Empleado no existe.");
        }
        empleadoRepository.deleteById(id);
    }
}