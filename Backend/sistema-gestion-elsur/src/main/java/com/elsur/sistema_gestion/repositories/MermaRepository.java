package com.elsur.sistema_gestion.repositories;

import com.elsur.sistema_gestion.models.Merma;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface MermaRepository extends JpaRepository<Merma, Long> {

    @Query("SELECT m FROM Merma m WHERE m.pedido.id_pedido = :idPedido ORDER BY m.idMerma DESC")
    List<Merma> findByPedidoId(@Param("idPedido") Long idPedido);
}