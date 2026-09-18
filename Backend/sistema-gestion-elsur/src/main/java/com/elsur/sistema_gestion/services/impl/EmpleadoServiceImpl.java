package com.elsur.sistema_gestion.services.impl;

import com.elsur.sistema_gestion.exceptions.RecursoNoEncontradoException;
import com.elsur.sistema_gestion.exceptions.SolicitudInvalidaException;
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
        // CORREGIDO ("chekeate que no falten exceptions"): esto tiraba un
        // RuntimeException a secas, que el GlobalExceptionHandler solo puede
        // atrapar con su @ExceptionHandler(RuntimeException.class) genérico
        // (devuelve 400 Bad Request). Un "no encontrado" es semánticamente un
        // 404, no un 400 -- mismo criterio que ya usa el resto del proyecto
        // (ver por ejemplo ClienteServiceImpl.buscarPorId).
        return empleadoRepository.findById(id)
                .orElseThrow(() -> new RecursoNoEncontradoException("Empleado no encontrado con id: " + id));
    }

   @Override
@Transactional
public Empleado guardar(Empleado empleado) {
    if (empleado.getPersona() != null && empleado.getPersona().getIdPersona() != null) {
        // Buscamos la persona real que ya existe en la base de datos
        // CORREGIDO: "no existe" también es un 404, no el 400 genérico que
        // devolvía RuntimeException.
        Persona personaExistente = personaRepository.findById(empleado.getPersona().getIdPersona())
                .orElseThrow(() -> new RecursoNoEncontradoException("La persona con ID " + empleado.getPersona().getIdPersona() + " no existe."));

        // Le asignamos esa persona recuperada al empleado para que no rompa las FK
        empleado.setPersona(personaExistente);
    } else {
        // CORREGIDO: esto sí es un 400 real (payload inválido), pero ahora usa
        // el tipo pensado para eso en vez de RuntimeException a secas -- mismo
        // status final, pero consistente con el resto del proyecto y explícito
        // en su intención.
        throw new SolicitudInvalidaException("No se puede crear un empleado sin asociarlo a una Persona válida.");
    }

    // Guardamos el legajo limpito
    return empleadoRepository.save(empleado);
}
    @Override
    @Transactional
    public void eliminar(Integer id) {
        // CORREGIDO: mismo caso "no encontrado" -> 404 en vez del 400 genérico.
        if (!empleadoRepository.existsById(id)) {
            throw new RecursoNoEncontradoException("No se puede eliminar: Empleado no existe.");
        }
        empleadoRepository.deleteById(id);
    }
}