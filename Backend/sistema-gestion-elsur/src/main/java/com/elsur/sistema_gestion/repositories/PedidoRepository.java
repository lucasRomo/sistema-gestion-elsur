package com.elsur.sistema_gestion.repositories;

import com.elsur.sistema_gestion.models.Pedido;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.Collection;
import java.util.List;

@Repository
public interface PedidoRepository extends JpaRepository<Pedido, Integer> {

    List<Pedido> findByEstadoIn(Collection<String> estados);

    List<Pedido> findByEstadoNotIn(Collection<String> estados);

    // Historial paginado: busca por cliente (razón social o nombre completo), por número de
    // pedido o por el empleado asignado. Los más recientes primero.
    @Query(value = "SELECT p FROM Pedido p LEFT JOIN p.cliente c LEFT JOIN c.persona pe " +
            "WHERE p.estado IN :estados AND (" +
            " :texto = '' " +
            " OR LOWER(COALESCE(c.razonSocial, '')) LIKE :patron " +
            " OR LOWER(CONCAT(COALESCE(pe.nombre, ''), ' ', COALESCE(pe.apellido, ''))) LIKE :patron " +
            " OR CAST(p.id_pedido AS string) = :texto " +
            " OR EXISTS (SELECT a FROM AsignacionPedido a JOIN a.empleado e JOIN e.persona ep " +
            "            WHERE a.pedido = p AND LOWER(CONCAT(COALESCE(ep.nombre, ''), ' ', COALESCE(ep.apellido, ''))) LIKE :patron)" +
            ") ORDER BY p.id_pedido DESC",
           countQuery = "SELECT COUNT(p) FROM Pedido p LEFT JOIN p.cliente c LEFT JOIN c.persona pe " +
            "WHERE p.estado IN :estados AND (" +
            " :texto = '' " +
            " OR LOWER(COALESCE(c.razonSocial, '')) LIKE :patron " +
            " OR LOWER(CONCAT(COALESCE(pe.nombre, ''), ' ', COALESCE(pe.apellido, ''))) LIKE :patron " +
            " OR CAST(p.id_pedido AS string) = :texto " +
            " OR EXISTS (SELECT a FROM AsignacionPedido a JOIN a.empleado e JOIN e.persona ep " +
            "            WHERE a.pedido = p AND LOWER(CONCAT(COALESCE(ep.nombre, ''), ' ', COALESCE(ep.apellido, ''))) LIKE :patron)" +
            ")")
    Page<Pedido> buscarHistorial(@Param("estados") Collection<String> estados,
                                 @Param("texto") String texto,
                                 @Param("patron") String patron,
                                 Pageable pageable);

    // Historial paginado filtrando por fecha de cierre (o de creación si no tiene cierre).
    @Query(value = "SELECT p FROM Pedido p WHERE p.estado IN :estados AND " +
            "COALESCE(p.fecha_finalizacion, p.fecha_creacion) >= :desde AND " +
            "COALESCE(p.fecha_finalizacion, p.fecha_creacion) < :hasta ORDER BY p.id_pedido DESC",
           countQuery = "SELECT COUNT(p) FROM Pedido p WHERE p.estado IN :estados AND " +
            "COALESCE(p.fecha_finalizacion, p.fecha_creacion) >= :desde AND " +
            "COALESCE(p.fecha_finalizacion, p.fecha_creacion) < :hasta")
    Page<Pedido> buscarHistorialPorFecha(@Param("estados") Collection<String> estados,
                                         @Param("desde") LocalDateTime desde,
                                         @Param("hasta") LocalDateTime hasta,
                                         Pageable pageable);
}
