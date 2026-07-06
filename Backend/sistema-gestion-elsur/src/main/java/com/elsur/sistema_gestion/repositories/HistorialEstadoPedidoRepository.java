package com.elsur.sistema_gestion.repositories;

import com.elsur.sistema_gestion.models.HistorialEstadoPedido;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface HistorialEstadoPedidoRepository extends JpaRepository<HistorialEstadoPedido, Integer> {

    // Forzamos la consulta usando la propiedad exacta 'id_pedido' de tu entidad Pedido
    @Query("SELECT h FROM HistorialEstadoPedido h WHERE h.pedido.id_pedido = :idPedido")
    List<HistorialEstadoPedido> findByPedidoId(@Param("idPedido") Integer idPedido);
}