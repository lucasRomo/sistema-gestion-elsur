package com.elsur.sistema_gestion.repositories;

import com.elsur.sistema_gestion.models.MovimientoCuentaCorriente;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface MovimientoCuentaCorrienteRepository extends JpaRepository<MovimientoCuentaCorriente, Integer> {
    List<MovimientoCuentaCorriente> findByCliente_IdClienteOrderByFechaDesc(Integer idCliente);
}