package com.elsur.sistema_gestion.repositories;

import com.elsur.sistema_gestion.models.RegistroActividad;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface RegistroActividadRepository extends JpaRepository<RegistroActividad, Integer> {

    List<RegistroActividad> findAllByOrderByIdRegActDesc();

    @Query("SELECT r FROM RegistroActividad r WHERE " +
           "(:idUsuario IS NULL OR r.usuario.idUsuario = :idUsuario) AND " +
           "(:tabla IS NULL OR LOWER(r.tablaAfectada) LIKE :tabla) " +
           "ORDER BY r.idRegAct DESC")
    List<RegistroActividad> buscarConFiltros(@Param("idUsuario") Integer idUsuario, 
                                             @Param("tabla") String tabla);

    @Query(value = "SELECT r FROM RegistroActividad r WHERE " +
           "(:idUsuario IS NULL OR r.usuario.idUsuario = :idUsuario) AND " +
           "(:tabla IS NULL OR LOWER(r.tablaAfectada) LIKE :tabla) " +
           "ORDER BY r.idRegAct DESC",
           countQuery = "SELECT COUNT(r) FROM RegistroActividad r WHERE " +
           "(:idUsuario IS NULL OR r.usuario.idUsuario = :idUsuario) AND " +
           "(:tabla IS NULL OR LOWER(r.tablaAfectada) LIKE :tabla)")
    org.springframework.data.domain.Page<RegistroActividad> buscarConFiltrosPaginado(
            @Param("idUsuario") Integer idUsuario, @Param("tabla") String tabla,
            org.springframework.data.domain.Pageable pageable);

    @Query("SELECT DISTINCT r.usuario FROM RegistroActividad r WHERE r.usuario IS NOT NULL")
    List<com.elsur.sistema_gestion.models.Usuario> buscarUsuariosConActividad();
}