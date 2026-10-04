package com.elsur.sistema_gestion.repositories;

import com.elsur.sistema_gestion.models.Pedido;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Collection;
import java.util.List;

@Repository
public interface PedidoRepository extends JpaRepository<Pedido, Integer> {

    List<Pedido> findByEstadoIn(Collection<String> estados);

    List<Pedido> findByEstadoNotIn(Collection<String> estados);
}
