package com.elsur.sistema_gestion.repositories;

import com.elsur.sistema_gestion.models.RespaldoLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface RespaldoLogRepository extends JpaRepository<RespaldoLog, Integer> {
    List<RespaldoLog> findAllByOrderByFechaHoraDesc();
}