package com.elsur.sistema_gestion.repositories;

import com.elsur.sistema_gestion.models.RolPermiso;
import com.elsur.sistema_gestion.models.RolPermiso.RolPermisoId;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface RolPermisoRepository extends JpaRepository<RolPermiso, RolPermisoId> {
}