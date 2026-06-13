package com.elsur.sistema_gestion.repositories;

import com.elsur.sistema_gestion.models.ComprobantePago;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface ComprobantePagoRepository extends JpaRepository<ComprobantePago, Integer> {
     List<ComprobantePago> findByPedidoId(Integer idPedido);
}