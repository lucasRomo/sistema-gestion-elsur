package com.elsur.sistema_gestion.repositories;

import com.elsur.sistema_gestion.models.DetalleCompraInsumo;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface DetalleCompraInsumoRepository extends JpaRepository<DetalleCompraInsumo, Long> {
    List<DetalleCompraInsumo> findByCompra_IdCompra(Long idCompra);
}