package com.elsur.sistema_gestion.services.impl;

import com.elsur.sistema_gestion.exceptions.ConflictoDeIntegridadException;
import com.elsur.sistema_gestion.exceptions.RecursoDuplicadoException;
import com.elsur.sistema_gestion.exceptions.RecursoNoEncontradoException;
import com.elsur.sistema_gestion.exceptions.SolicitudInvalidaException;
import com.elsur.sistema_gestion.models.Rol;
import com.elsur.sistema_gestion.repositories.RolRepository;
import com.elsur.sistema_gestion.services.RolService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class RolServiceImpl implements RolService {

    @Autowired
    private RolRepository rolRepository;

    @Override
    public List<Rol> listarTodos() {
        return rolRepository.findAll();
    }

    @Override
    public Rol buscarPorId(Integer id) {
        return rolRepository.findById(id)
                .orElseThrow(() -> new RecursoNoEncontradoException("Rol no encontrado con ID: " + id));
    }

    // Antes no se validaba nada acá: se podían crear dos perfiles con el mismo
    // nombre (por ejemplo "CAJERO" dos veces), ambos con ID distinto pero
    // indistinguibles en el <select> de perfiles -- ver hallazgo documentado en
    // Matriz de Permisos. La comparación es case-insensitive porque
    // matrizPermisosService.crearRol ya normaliza a mayúsculas antes de mandar
    // el nombre, pero conviene no confiar solo en eso (alguien podría llamar a
    // este mismo service desde otro lado sin pasar por esa normalización).
    @Override
    @Transactional
    public Rol guardar(Rol rol) {
        if (rol.getNombreRol() != null && !rol.getNombreRol().trim().isEmpty()) {
            rolRepository.findByNombreRolIgnoreCase(rol.getNombreRol().trim())
                    .filter(existente -> !existente.getIdRol().equals(rol.getIdRol()))
                    .ifPresent(existente -> {
                        throw new RecursoDuplicadoException("Ya existe un perfil con ese nombre.");
                    });
        }
        return rolRepository.save(rol);
    }

    @Override
    public List<Rol> listarPerfilesPersonalizadosHuerfanos() {
        return rolRepository.findPerfilesPersonalizadosHuerfanos();
    }

    @Override
    @Transactional
    public void eliminar(Integer id) {
        // Antes esta regla vivía en el controller (PermisoController), como un
        // if suelto antes de llamar acá. La movemos al service para que valga
        // para cualquier lugar que borre un rol, no solo para ese endpoint.
        if (id == 1 || id == 2) {
            throw new SolicitudInvalidaException("No se pueden eliminar los roles del sistema por defecto.");
        }

        try {
            rolRepository.deleteById(id);
            // flush() fuerza el DELETE ahora mismo: si no, Hibernate puede
            // postergarlo hasta el commit de la transacción, y el catch de acá
            // nunca vería la violación de integridad.
            rolRepository.flush();
        } catch (DataIntegrityViolationException e) {
            throw new ConflictoDeIntegridadException(
                    "No se puede eliminar el perfil porque está asignado a uno o más usuarios activos.");
        }
    }
}
