package com.elsur.sistema_gestion.repositories;

import com.elsur.sistema_gestion.models.ComprobantePago;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ComprobantePagoRepository extends JpaRepository<ComprobantePago, Integer> {

    // Ajustado con c.pedido.id_pedido para que machee perfecto con tu entidad
    @Query("SELECT c FROM ComprobantePago c WHERE c.pedido.id_pedido = :idPedido")
    List<ComprobantePago> findByPedidoId(@Param("idPedido") Integer idPedido);
}