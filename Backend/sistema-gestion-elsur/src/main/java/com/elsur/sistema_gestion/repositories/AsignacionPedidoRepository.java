package com.elsur.sistema_gestion.repositories;

import com.elsur.sistema_gestion.models.AsignacionPedido;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface AsignacionPedidoRepository extends JpaRepository<AsignacionPedido, Integer> {
    // Para saber qué pedidos tiene un empleado puntual
    List<AsignacionPedido> findByEmpleadoIdEmpleado(Integer idEmpleado);
}