package com.elsur.sistema_gestion.services.impl;

import com.elsur.sistema_gestion.models.Permiso;
import com.elsur.sistema_gestion.models.Rol;
import com.elsur.sistema_gestion.repositories.PermisoRepository;
import com.elsur.sistema_gestion.repositories.RolRepository;
import com.elsur.sistema_gestion.services.PermisoService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class PermisoServiceImpl implements PermisoService {

    @Autowired
    private PermisoRepository permisoRepository;

    @Autowired
    private RolRepository rolRepository;

    // Nombres de los permisos vitales protegidos para el perfil ADMIN
    private static final List<String> PERMISOS_PROTEGIDOS_ADMIN = Arrays.asList(
            "Matriz de Permisos",
            "Gestión de Usuarios",
            "Configuración"
    );

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
        
        return rol.getPermisos().stream()
                .map(Permiso::getIdPermiso)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional
    public void actualizarPermisosRol(Integer idRol, List<Integer> permisosIds) {
        Rol rol = rolRepository.findById(idRol)
                .orElseThrow(() -> new RuntimeException("Rol no encontrado"));

        List<Integer> idsFinales = new ArrayList<>(permisosIds);

        // PROTECCIÓN EN BACKEND: Si es el rol ADMIN (idRol = 1), asegurar que no pierda módulos críticos
        if (idRol == 1) {
            List<Permiso> todosLosPermisos = permisoRepository.findAll();
            List<Integer> idsProtegidos = todosLosPermisos.stream()
                    .filter(p -> PERMISOS_PROTEGIDOS_ADMIN.contains(p.getNombrePermiso()))
                    .map(Permiso::getIdPermiso)
                    .collect(Collectors.toList());

            for (Integer idProtegido : idsProtegidos) {
                if (!idsFinales.contains(idProtegido)) {
                    idsFinales.add(idProtegido);
                }
            }
        }
        
        List<Permiso> nuevosPermisos = permisoRepository.findAllById(idsFinales);
        rol.setPermisos(nuevosPermisos);
        rolRepository.save(rol);
    }
}