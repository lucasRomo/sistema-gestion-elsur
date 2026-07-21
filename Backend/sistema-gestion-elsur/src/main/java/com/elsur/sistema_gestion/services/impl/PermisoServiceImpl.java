package com.elsur.sistema_gestion.services.impl;

import com.elsur.sistema_gestion.models.Permiso;
import com.elsur.sistema_gestion.models.Rol;
import com.elsur.sistema_gestion.repositories.PermisoRepository;
import com.elsur.sistema_gestion.repositories.RolRepository;
import com.elsur.sistema_gestion.services.PermisoService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class PermisoServiceImpl implements PermisoService {

    @Autowired
    private PermisoRepository permisoRepository;

    @Autowired
    private RolRepository rolRepository;

    @Override
    public List<Permiso> listarTodos() {
        return permisoRepository.findAll();
    }

    @Override
    public List<Rol> listarRoles() {
        return rolRepository.findAll();
    }

    @Override
    public List<Integer> obtenerPermisosPorRol(Integer idRol) {
        Rol rol = rolRepository.findById(idRol)
                .orElseThrow(() -> new RuntimeException("Rol no encontrado"));
        
        // Mapeamos los permisos del rol a una lista de IDs numéricos para el Frontend
        return rol.getPermisos().stream()
                .map(Permiso::getIdPermiso) // Cambia 'getIdPermiso' por como se llame el ID en tu modelo Permiso
                .collect(Collectors.toList());
    }

    @Override
    @Transactional
    public void actualizarPermisosRol(Integer idRol, List<Integer> permisosIds) {
        Rol rol = rolRepository.findById(idRol)
                .orElseThrow(() -> new RuntimeException("Rol no encontrado"));
        
        // Buscamos todos los objetos Permiso correspondientes a los IDs que mandó React
        List<Permiso> nuevosPermisos = permisoRepository.findAllById(permisosIds);
        
        // Reemplazamos la lista anterior por la nueva y guardamos
        rol.setPermisos(nuevosPermisos);
        rolRepository.save(rol);
    }
}