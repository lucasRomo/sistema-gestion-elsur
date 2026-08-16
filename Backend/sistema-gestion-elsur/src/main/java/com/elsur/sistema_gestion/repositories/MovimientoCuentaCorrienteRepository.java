package com.elsur.sistema_gestion.repositories;

import com.elsur.sistema_gestion.models.MovimientoCuentaCorriente;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.math.BigDecimal;

@Repository
public interface MovimientoCuentaCorrienteRepository extends JpaRepository<MovimientoCuentaCorriente, Integer> {
    List<MovimientoCuentaCorriente> findByCliente_IdClienteOrderByFechaDesc(Integer idCliente);
    @Query("SELECT m.cliente.idCliente, COALESCE(SUM(m.monto), 0) " +
           "FROM MovimientoCuentaCorriente m " +
           "WHERE m.tipo = 'PAGO' " +
           "GROUP BY m.cliente.idCliente")
    List<Object[]> sumarPagosPorCliente();
}