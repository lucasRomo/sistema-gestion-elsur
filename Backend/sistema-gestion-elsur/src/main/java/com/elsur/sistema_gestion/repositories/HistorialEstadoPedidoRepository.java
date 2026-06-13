package com.elsur.sistema_gestion.repositories;

import com.elsur.sistema_gestion.models.HistorialEstadoPedido;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface HistorialEstadoPedidoRepository extends JpaRepository<HistorialEstadoPedido, Integer> {
    List<HistorialEstadoPedido> findByPedidoId(Integer id_pedido);
}