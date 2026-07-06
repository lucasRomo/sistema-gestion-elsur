package com.elsur.sistema_gestion.repositories;

import com.elsur.sistema_gestion.models.MovimientoCaja;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface MovimientoCajaRepository extends JpaRepository<MovimientoCaja, Integer> {

    // Usamos JPQL explícito mapeando la relación directa m.pedido.id_pedido
    @Query("SELECT m FROM MovimientoCaja m WHERE m.pedido.id_pedido = :idPedido")
    List<MovimientoCaja> buscarPorPedido(@Param("idPedido") Integer idPedido);
}