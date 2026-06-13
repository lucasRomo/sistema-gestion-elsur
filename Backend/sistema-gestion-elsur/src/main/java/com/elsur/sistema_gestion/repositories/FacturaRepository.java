package com.elsur.sistema_gestion.repositories;

import com.elsur.sistema_gestion.models.Factura;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface FacturaRepository extends JpaRepository<Factura, Integer> {
    List<Factura> findByPedidoId(Integer idPedido);
}