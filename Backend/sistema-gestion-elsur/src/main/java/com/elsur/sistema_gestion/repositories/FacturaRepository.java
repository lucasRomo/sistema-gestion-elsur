package com.elsur.sistema_gestion.repositories;

import com.elsur.sistema_gestion.models.Factura;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface FacturaRepository extends JpaRepository<Factura, Integer> {

    @Query("SELECT f FROM Factura f WHERE f.pedido.id_pedido = :idPedido")
    List<Factura> findByPedidoId(@Param("idPedido") Integer idPedido);
}