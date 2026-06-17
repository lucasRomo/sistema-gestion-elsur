package com.elsur.sistema_gestion.repositories;

import com.elsur.sistema_gestion.models.DetallePedido;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

@Repository
public interface DetallePedidoRepository extends JpaRepository<DetallePedido, Integer> {
    // Spring Data JPA entiende que 'pedido.id_pedido' hace referencia al campo dentro del objeto pedido
    @Query("SELECT d FROM DetallePedido d WHERE d.pedido.id = :idPedido")
    List<DetallePedido> findByPedidoIdPedido(@Param("idPedido") Integer idPedido);
}