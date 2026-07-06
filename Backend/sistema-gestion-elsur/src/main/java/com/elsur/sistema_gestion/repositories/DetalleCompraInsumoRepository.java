package com.elsur.sistema_gestion.repositories;

import com.elsur.sistema_gestion.models.DetalleCompraInsumo;
import org.springframework.data.jpa.repository.JpaRepository;

public interface DetalleCompraInsumoRepository extends JpaRepository<DetalleCompraInsumo, Long> {
}